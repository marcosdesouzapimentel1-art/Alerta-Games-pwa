import Parser from 'rss-parser';
import { NewsArticleInput } from '../utils/deduplicate';

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['enclosure', 'enclosure'],
      ['content:encoded', 'contentEncoded']
    ]
  },
  requestOptions: {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AlertaGameAggregator/1.0'
    },
    timeout: 10000
  }
});

export interface RssFeedConfig {
  sourceName: string;
  url: string;
  category: string;
  language: 'pt-BR' | 'en';
}

// ============================================================
// FONTES INTERNACIONAIS - INGLÊS
// ============================================================

export const RSS_FEEDS: RssFeedConfig[] = [
  // ============================================================
  // FONTES BRASILEIRAS (PORTUGUÊS PT-BR) - CUSTO R$ 0,00 EM IA
  // ============================================================

  {
    sourceName: 'Adrenaline',
    url: 'https://www.adrenaline.com.br/feed/',
    category: 'Geral',
    language: 'pt-BR'
  },

  {
    sourceName: 'Voxel',
    url: 'https://rss.tecmundo.com.br/feed',
    category: 'Geral',
    language: 'pt-BR'
  },

  {
    sourceName: 'MeuPlayStation',
    url: 'https://meups.com.br/feed/',
    category: 'PlayStation',
    language: 'pt-BR'
  },

  {
    sourceName: 'PSX Brasil',
    url: 'https://psxbrasil.com.br/feed/',
    category: 'PlayStation',
    language: 'pt-BR'
  },

  {
    sourceName: 'Xbox Power',
    url: 'https://www.xboxpower.com.br/feed/',
    category: 'Xbox',
    language: 'pt-BR'
  },

  {
    sourceName: 'Nintendo Blast',
    url: 'https://www.nintendoblast.com.br/feeds/posts/default?alt=rss',
    category: 'Nintendo',
    language: 'pt-BR'
  },

  {
    sourceName: 'Flow Games',
    url: 'https://flowgames.gg/feed/',
    category: 'Geral',
    language: 'pt-BR'
  },

  {
    sourceName: 'IGN Brasil',
    url: 'https://br.ign.com/feed.xml',
    category: 'Geral',
    language: 'pt-BR'
  }
];

// ============================================================
// EXTRAÇÃO DE IMAGEM
// ============================================================

function extractImageFromContent(
  content?: string
): string | undefined {
  if (!content) {
    return undefined;
  }

  const imgMatch = content.match(
    /<img[^>]+src=["']([^"']+)["']/i
  );

  return imgMatch ? imgMatch[1] : undefined;
}

// ============================================================
// LIMPEZA DE HTML
// ============================================================

function cleanHtml(html?: string): string {
  if (!html) {
    return '';
  }

  return html
    // Remove scripts
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')

    // Remove styles
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')

    // Remove todas as tags HTML
    .replace(/<[^>]*>/g, ' ')

    // Entidades HTML comuns
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')

    // Entidades numéricas
    .replace(/&#(\d+);/g, (_, code) => {
      try {
        return String.fromCharCode(Number(code));
      } catch {
        return '';
      }
    })

    // Remove espaços duplicados
    .replace(/\s+/g, ' ')

    .trim();
}

// ============================================================
// DETECÇÃO DE CATEGORIA
// ============================================================

function detectCategory(
  title: string,
  content: string,
  defaultCategory: string
): string {
  const text = `${title} ${content}`.toLowerCase();

  // PlayStation
  if (
    text.includes('playstation') ||
    text.includes('ps5') ||
    text.includes('ps4') ||
    text.includes('ps3') ||
    text.includes('ps vr')
  ) {
    return 'PlayStation';
  }

  // Xbox
  if (
    text.includes('xbox') ||
    text.includes('game pass') ||
    text.includes('series x') ||
    text.includes('series s')
  ) {
    return 'Xbox';
  }

  // Nintendo
  if (
    text.includes('nintendo') ||
    text.includes('switch') ||
    text.includes('switch 2')
  ) {
    return 'Nintendo';
  }

  // Steam
  if (text.includes('steam')) {
    return 'Steam';
  }

  // Epic Games
  if (
    text.includes('epic games') ||
    text.includes('epic games store')
  ) {
    return 'Epic Games';
  }

  // GTA 6
  if (
    text.includes('gta 6') ||
    text.includes('gta vi') ||
    text.includes('grand theft auto vi')
  ) {
    return 'GTA 6';
  }

  // Rockstar
  if (
    text.includes('rockstar games') ||
    text.includes('rockstar')
  ) {
    return 'Rockstar';
  }

  // Fortnite
  if (text.includes('fortnite')) {
    return 'Fortnite';
  }

  // Minecraft
  if (text.includes('minecraft')) {
    return 'Minecraft';
  }

  // Valorant
  if (text.includes('valorant')) {
    return 'Valorant';
  }

  // League of Legends
  if (
    text.includes('league of legends') ||
    text.includes('lol')
  ) {
    return 'League of Legends';
  }

  // Call of Duty
  if (
    text.includes('call of duty') ||
    text.includes('cod ')
  ) {
    return 'Call of Duty';
  }

  // EA Sports FC
  if (
    text.includes('ea sports fc') ||
    text.includes('fc 25') ||
    text.includes('fc 26')
  ) {
    return 'EA Sports FC';
  }

  // Hardware
  if (
    text.includes('rtx') ||
    text.includes('radeon') ||
    text.includes('gpu') ||
    text.includes('cpu') ||
    text.includes('placa de vídeo') ||
    text.includes('placa de video') ||
    text.includes('processador') ||
    text.includes('ssd') ||
    text.includes('memória ram') ||
    text.includes('memoria ram')
  ) {
    return 'Hardware';
  }

  // Tecnologia
  if (
    text.includes('tecnologia') ||
    text.includes('artificial intelligence') ||
    text.includes('inteligência artificial') ||
    text.includes('inteligencia artificial') ||
    text.includes('ai ')
  ) {
    return 'Tecnologia';
  }

  // Promoções
  if (
    text.includes('promoção') ||
    text.includes('promocao') ||
    text.includes('oferta') ||
    text.includes('desconto') ||
    text.includes('sale') ||
    text.includes('grátis') ||
    text.includes('gratis')
  ) {
    return 'Promoções';
  }

  // PC
  if (
    text.includes(' pc ') ||
    text.startsWith('pc ') ||
    text.includes('pc gaming') ||
    text.includes('windows')
  ) {
    return 'PC';
  }

  return defaultCategory;
}

// ============================================================
// EXTRAÇÃO DE DATA
// ============================================================

function extractPublishedAt(item: any): string {
  try {
    if (item.isoDate) {
      const date = new Date(item.isoDate);

      if (!Number.isNaN(date.getTime())) {
        return date.toISOString();
      }
    }

    if (item.pubDate) {
      const date = new Date(item.pubDate);

      if (!Number.isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
  } catch (error) {
    console.warn(
      '[RSS] Não foi possível interpretar a data:',
      error
    );
  }

  return new Date().toISOString();
}

// ============================================================
// EXTRAÇÃO DE IMAGEM
// ============================================================

function extractImage(item: any, rawContent: string): string {
  const mediaContent = item.mediaContent;
  const mediaThumbnail = item.mediaThumbnail;
  const enclosure = item.enclosure;

  // media:content
  if (
    mediaContent &&
    mediaContent.$ &&
    typeof mediaContent.$.url === 'string'
  ) {
    return mediaContent.$.url;
  }

  // media:thumbnail
  if (
    mediaThumbnail &&
    mediaThumbnail.$ &&
    typeof mediaThumbnail.$.url === 'string'
  ) {
    return mediaThumbnail.$.url;
  }

  // enclosure
  if (
    enclosure &&
    typeof enclosure.url === 'string' &&
    enclosure.url.trim()
  ) {
    return enclosure.url;
  }

  // Imagem dentro do HTML
  const contentImage = extractImageFromContent(rawContent);

  if (contentImage) {
    return contentImage;
  }

  // Imagem padrão do Alerta Game
  return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800';
}

// ============================================================
// BUSCAR RSS
// ============================================================

export async function fetchRssFeed(
  feedConfig: RssFeedConfig
): Promise<NewsArticleInput[]> {
  try {
    console.log(
      `[RSS] Buscando ${feedConfig.sourceName} (${feedConfig.language})...`
    );

    const feed = await parser.parseURL(feedConfig.url);

    const articles: NewsArticleInput[] = [];

    for (const item of feed.items || []) {
      try {
        if (!item.title || !item.link) {
          continue;
        }

        // ------------------------------------------------------
        // TÍTULO
        // ------------------------------------------------------

        const title = cleanHtml(item.title);

        if (!title) {
          continue;
        }

        // ------------------------------------------------------
        // CONTEÚDO ORIGINAL
        // ------------------------------------------------------

        const rawContent =
          (item as any).contentEncoded ||
          (item as any).content ||
          (item as any).summary ||
          (item as any).snippet ||
          '';

        const cleanedContent = cleanHtml(rawContent);

        // ------------------------------------------------------
        // RESUMO
        // ------------------------------------------------------

        let summary = cleanHtml(
          item.summary ||
          item.contentSnippet ||
          cleanedContent ||
          title
        );

        // Limita apenas o resumo de entrada.
        // O conteúdo completo continua disponível para Gemini.
        if (summary.length > 500) {
          summary = `${summary.substring(0, 497)}...`;
        }

        // ------------------------------------------------------
        // CONTEÚDO FINAL
        // ------------------------------------------------------

        const content =
          cleanedContent ||
          summary ||
          title;

        // ------------------------------------------------------
        // IMAGEM
        // ------------------------------------------------------

        const imageUrl = extractImage(
          item,
          rawContent
        );

        // ------------------------------------------------------
        // DATA
        // ------------------------------------------------------

        const publishedAt = extractPublishedAt(item);

        // ------------------------------------------------------
        // CATEGORIA
        // ------------------------------------------------------

        const category = detectCategory(
          title,
          summary,
          feedConfig.category
        );

        // ------------------------------------------------------
        // TEMPO DE LEITURA
        // ------------------------------------------------------

        const wordCount = content
          .split(/\s+/)
          .filter(Boolean)
          .length;

        const readTimeMinutes = Math.max(
          2,
          Math.ceil(wordCount / 200)
        );

        // ------------------------------------------------------
        // ARTIGO
        // ------------------------------------------------------

        articles.push({
          id: item.guid || item.link,

          title,

          summary: summary || title,

          content: content || summary || title,

          url: item.link.trim(),

          imageUrl,

          image: imageUrl,

          source: feedConfig.sourceName,

          category,

          publishedAt,

          readTimeMinutes,

          // IMPORTANTE:
          // Essa informação será usada pelo newsSync.ts
          // para NÃO chamar Gemini nas fontes brasileiras.
          language: feedConfig.language
        });
      } catch (itemError: any) {
        console.error(
          `[RSS] Erro ao processar item de ${feedConfig.sourceName}:`,
          itemError?.message || itemError
        );
      }
    }

    console.log(
      `[RSS] Fonte carregada: ${feedConfig.sourceName} | idioma=${feedConfig.language} | notícias=${articles.length}`
    );

    return articles;
  } catch (error: any) {
    console.error(
      `[RSS] Erro ao buscar ${feedConfig.sourceName}:`,
      error?.message || error
    );

    throw error;
  }
}
