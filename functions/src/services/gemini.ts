import { GoogleGenAI, Type } from '@google/genai';
import { NewsArticleInput } from '../utils/deduplicate';

export interface GeminiNewsAnalysis {
  title_pt: string;
  summary_pt: string;
  content_pt: string;
  category: string;
  keywords: string[];
  importance: number;
  shouldNotify: boolean;
  seoTitle: string;
  seoDescription: string;
  tokensUsed?: number;
}

export const ALLOWED_CATEGORIES = [
  'PlayStation',
  'Xbox',
  'Nintendo',
  'Steam',
  'Epic Games',
  'PC',
  'Game Pass',
  'PS Plus',
  'Fortnite',
  'Minecraft',
  'Valorant',
  'League of Legends',
  'Call of Duty',
  'EA Sports FC',
  'GTA 6',
  'Rockstar',
  'Promoções',
  'Hardware',
  'Tecnologia',
  'Indie',
  'Mobile',
  'VR',
  'Outros'
] as const;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[Gemini API] ERRO: Nenhuma chave GEMINI_API_KEY encontrada em process.env');
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

const SYSTEM_INSTRUCTION = `Você é um editor sênior de jornalismo gamer especializado em localização e análise de notícias do Alerta Game.
Sua missão é traduzir, resumir, categorizar e gerar metadados SEO para notícias gamer.

Regras Estritas:
1. Tradução: Traduza o título e o conteúdo da notícia para Português do Brasil (pt-BR). title_pt = título traduzido. content_pt = texto legível traduzido. summary_pt = resumo traduzido com no máximo 350 caracteres.
2. NUNCA traduzir nomes próprios de pessoas, jogos (ex: The Last of Us, GTA), estúdios/empresas (ex: Rockstar, PlayStation, Xbox) ou termos técnicos consolidados (ex: Ray Tracing, Gameplay).
3. Resumo (summary_pt): Sucinto, profissional e direto, com no MÁXIMO 350 caracteres no total.
4. Categoria: Escolha EXATAMENTE uma categoria da lista permitida:
   [PlayStation, Xbox, Nintendo, Steam, Epic Games, PC, Game Pass, PS Plus, Fortnite, Minecraft, Valorant, League of Legends, Call of Duty, EA Sports FC, GTA 6, Rockstar, Promoções, Hardware, Tecnologia, Indie, Mobile, VR, Outros]
5. Keywords: Gere entre 5 e 10 palavras-chave relevantes.
6. Importância (importance): Um número de 0 a 100 baseado na relevância gamer.
7. Notificação Push (shouldNotify): TRUE apenas para promoções imperdíveis, grandes anúncios AAA, eventos principais ou novidades relevantes de Game Pass/PS Plus.
8. SEO (seoTitle, seoDescription): Título SEO gamer (até 60 caracteres) e meta descrição (até 150 caracteres).`;

async function callGeminiWithRetry(
  ai: GoogleGenAI,
  article: NewsArticleInput,
  retries = 3
): Promise<GeminiNewsAnalysis | null> {
  // OTMIZAÇÃO RIGOROSA DE INPUT TOKENS:
  // Limita o texto enviado a no máximo 1200 caracteres (~250-300 tokens de entrada)
  const MAX_INPUT_CHARS = 1200;
  const rawContent = article.content || article.summary || '';
  const truncatedContent = rawContent.length > MAX_INPUT_CHARS
    ? rawContent.substring(0, MAX_INPUT_CHARS) + '...'
    : rawContent;

  const prompt = `Analise a seguinte notícia gamer:
Fonte: ${article.source}
URL: ${article.url}
Categoria Original: ${article.category}
Título Original: ${article.title}
Descrição/Conteúdo: ${truncatedContent}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout na chamada do Gemini API (30s)')), 30000)
      );

      const apiPromise = ai.models.generateContent({
        model: 'gemini-3.6-flash', // Usando o modelo rápido, estável e ultra barato
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title_pt: { type: Type.STRING, description: 'Título traduzido e adaptado em pt-BR' },
              summary_pt: { type: Type.STRING, description: 'Resumo em pt-BR (máx 350 caracteres)' },
              content_pt: { type: Type.STRING, description: 'Conteúdo resumido/traduzido em pt-BR' },
              category: { type: Type.STRING, description: 'Uma categoria da lista permitida' },
              keywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'De 5 a 10 palavras-chave'
              },
              importance: { type: Type.INTEGER, description: 'Pontuação de 0 a 100' },
              shouldNotify: { type: Type.BOOLEAN, description: 'Se deve gerar notificação push' },
              seoTitle: { type: Type.STRING, description: 'Título SEO em pt-BR' },
              seoDescription: { type: Type.STRING, description: 'Descrição SEO em pt-BR' }
            },
            required: [
              'title_pt',
              'summary_pt',
              'content_pt',
              'category',
              'keywords',
              'importance',
              'shouldNotify',
              'seoTitle',
              'seoDescription'
            ]
          }
        }
      });

      const response: any = await Promise.race([apiPromise, timeoutPromise]);
      const jsonText = response?.text?.trim();

      if (!jsonText) {
        throw new Error('Resposta do Gemini veio vazia');
      }

      const parsed: GeminiNewsAnalysis = JSON.parse(jsonText);
      parsed.tokensUsed = response?.usageMetadata?.totalTokenCount || 150;

      if (parsed.summary_pt && parsed.summary_pt.length > 350) {
        parsed.summary_pt = parsed.summary_pt.slice(0, 347) + '...';
      }

      return parsed;
    } catch (err: any) {
      console.error(`[Gemini API Erro] Tentativa ${attempt}/${retries} falhou para "${article.title}":`, err?.message || err);
      if (attempt === retries) {
        return null;
      }
      // Backoff exponencial para evitar estouro de limite de requisições por minuto (RPM)
      await new Promise((res) => setTimeout(res, 2000 * attempt));
    }
  }

  return null;
}

export async function processArticleWithGemini(
  article: NewsArticleInput
): Promise<GeminiNewsAnalysis | null> {
  console.log(`Gemini processando notícia: ${article.title}`);
  const ai = getGeminiClient();
  if (!ai) {
    return null;
  }
  return await callGeminiWithRetry(ai, article);
}
