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

export const RSS_FEEDS: RssFeedConfig[] = [
  // ============================================================
  // FONTES INTERNACIONAIS - INGLÊS
  // ============================================================
  {
    sourceName: 'IGN',
    url: 'https://feeds.feedburner.com/ign/news',
    category: 'Geral',
    language: 'en'
  },
  {
    sourceName: 'GameSpot',
    url: 'https://www.gamespot.com/feeds/news/',
    category: 'Geral',
    language: 'en'
  },
  {
    sourceName: 'VGC',
    url: 'https://www.videogameschronicle.com/feed/',
    category: 'Geral',
    language: 'en'
  },
  {
    sourceName: 'PlayStation Blog',
    url: 'https://blog.playstation.com/feed/',
    category: 'PlayStation',
    language: 'en'
  },
  {
    sourceName: 'Xbox Wire',
    url: 'https://news.xbox.com/en-us/feed/',
    category: 'Xbox',
    language: 'en'
  },
  {
    sourceName: 'Nintendo Life',
    url: 'https://www.nintendolife.com/feeds/latest',
    category: 'Nintendo',
    language: 'en'
  },

  // ============================================================
  // FONTES BRASILEIRAS - PORTUGUÊS
  // ============================================================
  {
    sourceName: 'Adrenaline',
    url: 'https://www.adrenaline.com.br/feed/',
    category: 'Geral',
    language: 'pt-BR'
  },
  {
    sourceName: 'Nintendo Blast',
    url: 'https://www.nintendoblast.com.br/feeds/posts/default?alt=rss',
    category: 'Nintendo',
    language: 'pt-BR'
  },
  {
    sourceName: 'PSX Brasil',
    url: 'https://psxbrasil.com.br/feed/',
    category: 'PlayStation',
    language: 'pt-BR'
  },
  {
    sourceName: 'MeuPlayStation',
    url: 'https://meups.com.br/feed/',
    category: 'PlayStation',
    language: 'pt-BR'
  },
  {
    sourceName: 'Xbox Power',
    url: 'https://www.xboxpower.com.br/feed/',
    category: 'Xbox',
    language: 'pt-BR'
  }
];

/**
 * Extrai a primeira imagem encontrada dentro do conteúdo HTML.
 */
function extractImageFromContent(content?: string): string | undefined {
  if (!content) return undefined;

  const imgMatch = content.match(
    /<img[^>]+src=["']([^"']+)["']/i
  );

  return imgMatch ? imgMatch[1] : undefined;
}

/**
 * Remove HTML e normaliza entidades comuns.
 */
function cleanHtml(html?: string): string {
  if (!html) return '';

  return html
    .replace(/<[^>]*>/gm, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detecta a categoria com base no conteúdo da notícia.
 */
function detectCategory(
  title: string,
  content: string,
  defaultCategory: string
): string {
  const text = `${title} ${content}`.toLowerCase();

  if (
    text.includes('playstation') ||
    text.includes('ps5') ||
    text.includes('ps4') ||
    text.includes('ps3') ||
    text.includes('ps plus')
  ) {
    return 'PlayStation';
  }

  if (
    text.includes('xbox') ||
    text.includes('game pass') ||
    text.includes('series x') ||
    text.includes('series s')
  ) {
    return 'Xbox';
  }

  if (
    text.includes('nintendo') ||
    text.includes('switch') ||
    text.includes('switch 2')
  ) {
    return 'Nintendo';
  }

  if (
    text.includes('steam') ||
    text.includes('epic games') ||
    text.includes('pc gamer') ||
    text.includes('pc gaming')
  ) {
    return 'PC';
  }

  if (
    text.includes('fortnite')
  ) {
    return 'Fortnite';
  }

  if (
    text.includes('minecraft')
  ) {
    return 'Minecraft';
  }

  if (
    text.includes('valorant')
  ) {
    return 'Valorant';
  }

  if (
    text.includes('league of legends') ||
    text.includes('lol')
  ) {
    return 'League of Legends';
  }

  if (
    text.includes('call of duty')
  ) {
    return 'Call of Duty';
  }

  if (
    text.includes('ea sports fc') ||
    text.includes('fifa')
  ) {
    return 'EA Sports FC';
  }

  if (
    text.includes('gta 6') ||
    text.includes('grand theft auto vi')
  ) {
    return 'GTA 6';
  }

  if (
    text.includes('rockstar games') ||
    text.includes('rockstar')
  ) {
    return 'Rockstar';
  }

  if (
    text.includes('promoção') ||
    text.includes('promoções') ||
    text.includes('oferta') ||
    text.includes('ofertas') ||
    text.includes('desconto') ||
    text.includes('sale')
  ) {
    return 'Promoções';
  }

  if (
    text.includes('rtx') ||
    text.includes('gpu') ||
    text.includes('cpu') ||
    text.includes('placa de vídeo') ||
    text.includes('processador') ||
    text.includes('hardware')
  ) {
    return 'Hardware';
  }

  if (
    text.includes('tecnologia') ||
    text.includes('ia ') ||
    text.includes('inteligência artificial') ||
    text.includes('artificial intelligence')
  ) {
    return 'Tecnologia';
  }

  return defaultCategory;
}

/**
 * Converte a data do RSS para ISO.
 */
function parsePublishedDate(item: any): string {
  try {
    if (item.isoDate) {
      return new Date(item.isoDate).toISOString();
    }

    if (item.pubDate) {
      return new Date(item.pubDate).toISOString();
    }
  } catch {
    // Ignora data inválida e usa a data atual.
  }

  return new Date().toISOString();
}

/**
 * Busca e transforma um feed RSS em NewsArticleInput.
 */
export async function fetchRssFeed(
  feedConfig: RssFeedConfig
): Promise<NewsArticleInput[]> {
  try {
    console.log(
      `Consultando RSS: ${feedConfig.sourceName} [${feedConfig.language}]`
    );

    const feed = await parser.parseURL(feedConfig.url);

    const articles: NewsArticleInput[] = [];

    for (const item of feed.items || []) {
      if (!item.title || !item.link) {
        continue;
      }

      const title = cleanHtml(item.title);

      const rawContent =
        (item as any).contentEncoded ||
        (item as any).content ||
        (item as any).summary ||
        (item as any).snippet ||
        '';

      const cleanedContent = cleanHtml(rawContent);

      const rawSummary =
        item.summary ||
        item.contentSnippet ||
        cleanedContent ||
        title;

      const summary = cleanHtml(rawSummary).slice(0, 500);

      // ----------------------------------------------------------
      // Imagem
      // ----------------------------------------------------------

      let imageUrl: string | undefined;

      const mediaContent = (item as any).mediaContent;
      const mediaThumbnail = (item as any).mediaThumbnail;
      const enclosure = (item as any).enclosure;

      if (
        mediaContent &&
        mediaContent.$ &&
        mediaContent.$.url
      ) {
        imageUrl = mediaContent.$.url;
      } else if (
        mediaContent &&
        mediaContent.url
      ) {
        imageUrl = mediaContent.url;
      } else if (
        mediaThumbnail &&
        mediaThumbnail.$ &&
        mediaThumbnail.$.url
      ) {
        imageUrl = mediaThumbnail.$.url;
      } else if (
        mediaThumbnail &&
        mediaThumbnail.url
      ) {
        imageUrl = mediaThumbnail.url;
      } else if (
        enclosure &&
        enclosure.url
      ) {
        imageUrl = enclosure.url;
      } else {
        imageUrl =
          extractImageFromContent(rawContent) ||
          'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800';
      }

      // ----------------------------------------------------------
      // Categoria
      // ----------------------------------------------------------

      const category = detectCategory(
        title,
        cleanedContent || summary,
        feedConfig.category
      );

      // ----------------------------------------------------------
      // Data
      // ----------------------------------------------------------

      const publishedAt = parsePublishedDate(item);

      // ----------------------------------------------------------
      // Tempo estimado de leitura
      // ----------------------------------------------------------

      const wordCount = Math.max(
        1,
        cleanedContent.split(/\s+/).length
      );

      const readTimeMinutes = Math.max(
        2,
        Math.ceil(wordCount / 220)
      );

      // ----------------------------------------------------------
      // ID
      // ----------------------------------------------------------

      const articleId =
        (item.guid && String(item.guid).trim()) ||
        `${feedConfig.sourceName}-${item.link}`;

      articles.push({
        id: articleId,
        title,
        summary: summary || title,
        content: cleanedContent || summary || title,
        url: item.link.trim(),
        imageUrl,
        image: imageUrl,
        source: feedConfig.sourceName,
        category,
        publishedAt,
        readTimeMinutes,

        // IMPORTANTE:
        // O NewsArticleInput precisará aceitar essa propriedade.
        language: feedConfig.language
      } as NewsArticleInput);
    }

    console.log(
      `Fonte RSS carregada: ${feedConfig.sourceName} ` +
      `(${articles.length} notícias | ${feedConfig.language})`
    );

    return articles;
  } catch (error: any) {
    console.error(
      `Erro ao buscar RSS de ${feedConfig.sourceName} ` +
      `(${feedConfig.url}):`,
      error?.message || error
    );

    throw error;
  }
}
