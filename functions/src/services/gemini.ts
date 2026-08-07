import { GoogleGenAI, Type } from '@google/genai';
import { NewsArticleInput } from '../utils/deduplicate';

export interface GeminiNewsAnalysis {
  title_pt: string;
  summary_pt: string;
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
1. Tradução (title_pt, summary_pt): Traduza com tom jornalístico e envolvente para Português do Brasil (pt-BR).
2. NUNCA traduzir nomes próprios de pessoas (ex: Hideo Kojima, Neil Druckmann), nomes de jogos (ex: The Last of Us, Grand Theft Auto, God of War, Fortnite, Elden Ring), estúdios/empresas (ex: Naughty Dog, Rockstar Games, PlayStation, Xbox, Nintendo) ou termos técnicos consolidados em inglês (ex: Ray Tracing, Frame Rate, Gameplay, Showcase).
3. Resumo (summary_pt): Resumo sucinto, profissional e direto, com no MÁXIMO 3 parágrafos ou MÁXIMO 350 caracteres no total.
4. Categoria: Escolha EXATAMENTE uma categoria da lista permitida:
   [PlayStation, Xbox, Nintendo, Steam, Epic Games, PC, Game Pass, PS Plus, Fortnite, Minecraft, Valorant, League of Legends, Call of Duty, EA Sports FC, GTA 6, Rockstar, Promoções, Hardware, Tecnologia, Indie, Mobile, VR, Outros]
5. Keywords: Gere entre 5 e 10 palavras-chave relevantes separadas sobre a notícia.
6. Importância (importance): Um número de 0 a 100 baseado na relevância gamer (0=irrelevante, 100=anúncio histórico / lançamento AAA revolucionário).
7. Notificação Push (shouldNotify): Defina como TRUE APENAS quando for um evento de altíssima relevância:
   - Promoção imperdível / jogo grátis na Epic Games ou Steam Sale
   - Anúncio relevante do Game Pass ou PS Plus
   - Novo trailer/notícia do GTA 6 ou Rockstar
   - Evento principal (Nintendo Direct, PlayStation Showcase, Xbox Showcase)
   - Lançamento ou review de grande jogo AAA.
   Caso contrário, defina como FALSE.
8. SEO (seoTitle, seoDescription): Título chamativo para SEO gamer (até 60 caracteres) e meta descrição focada em cliques e engajamento (até 150 caracteres).`;

async function callGeminiWithRetry(
  ai: GoogleGenAI,
  article: NewsArticleInput,
  retries = 3
): Promise<GeminiNewsAnalysis | null> {
  const prompt = `Analise a seguinte notícia gamer:
Fonte: ${article.source}
URL: ${article.url}
Categoria Original: ${article.category}
Título Original: ${article.title}
Descrição Original: ${article.summary}
Conteúdo Original: ${article.content || article.summary}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout na chamada do Gemini API (30s)')), 30000)
      );

      const apiPromise = ai.models.generateContent({
        model: 'Gemini 3.1 Pro Preview',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title_pt: { type: Type.STRING, description: 'Título traduzido e adaptado em pt-BR' },
              summary_pt: { type: Type.STRING, description: 'Resumo em pt-BR (máx 350 caracteres)' },
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
      // Backoff exponencial para respeitar a cota de requisições por minuto (RPM)
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
