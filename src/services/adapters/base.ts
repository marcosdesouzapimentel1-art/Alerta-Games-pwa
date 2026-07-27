import { NewsArticle, NewsCategory } from '../../types';

export interface SyncLog {
  id: string;
  timestamp: string;
  startTime?: string;
  endTime?: string;
  sourcesAttempted: number;
  sourcesSuccessful: string[];
  sourcesFailed: { source: string; error: string }[];
  articlesFound?: number;
  newArticlesCount: number;
  duplicatesCount?: number;
  errorsCount?: number;
  totalArticlesCount: number;
  trigger: 'automatic' | 'manual' | 'initial';
  adminUid?: string;
  adminEmail?: string;
}

export interface NewsSourceAdapter {
  name: string;
  sourceKey: string;
  fetchArticles(): Promise<NewsArticle[]>;
}

/**
 * Fetch with timeout using AbortController
 */
export const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 8000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Helper to generate normalized slug ID from title
 */
export const generateArticleId = (sourceKey: string, title: string): string => {
  const cleanTitle = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  return `${sourceKey}-${cleanTitle}`;
};

/**
 * Categorizes news based on keywords in title, summary, or content
 */
export const categorizeArticle = (
  title: string,
  summary: string = '',
  defaultCat: NewsCategory = 'Todas'
): NewsCategory => {
  const text = `${title} ${summary}`.toLowerCase();

  if (text.includes('gta 6') || text.includes('grand theft auto')) return 'GTA 6';
  if (text.includes('fortnite')) return 'Fortnite';
  if (text.includes('ea sports fc') || text.includes('fifa')) return 'EA Sports FC';
  if (text.includes('minecraft')) return 'Minecraft';
  if (text.includes('call of duty') || text.includes('black ops') || text.includes('warzone')) return 'Call of Duty';
  if (text.includes('valorant')) return 'Valorant';
  if (text.includes('league of legends') || text.includes('riot games')) return 'League of Legends';
  if (text.includes('ps plus') || text.includes('playstation plus')) return 'PS Plus';
  if (text.includes('game pass') || text.includes('xbox game pass')) return 'Game Pass';
  if (text.includes('steam')) return 'Steam';
  if (text.includes('epic games') || text.includes('unreal')) return 'Epic Games';
  if (text.includes('ps5') || text.includes('playstation') || text.includes('sony')) return 'PlayStation';
  if (text.includes('xbox') || text.includes('microsoft')) return 'Xbox';
  if (text.includes('switch') || text.includes('nintendo') || text.includes('mario') || text.includes('zelda')) return 'Nintendo';
  if (text.includes('pc') || text.includes('nvidia') || text.includes('amd')) return 'PC';

  return defaultCat;
};

/**
 * Parses RSS items into array of clean articles with RSS2JSON fallback
 */
export const fetchRssArticles = async (
  rssUrl: string,
  sourceName: string,
  sourceKey: string,
  defaultCategory: NewsCategory,
  fallbackArticles: NewsArticle[]
): Promise<NewsArticle[]> => {
  // Check browser offline status
  if (typeof window !== 'undefined' && !window.navigator.onLine) {
    console.warn(`[${sourceName}] Dispositivo offline. Usando fallback.`);
    return fallbackArticles;
  }

  try {
    // Strategy 1: Attempt via rss2json API
    const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    const response = await fetchWithTimeout(rss2jsonUrl, {}, 7000);

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'ok' && Array.isArray(data.items) && data.items.length > 0) {
        return data.items.map((item: any) => {
          const title = item.title?.replace(/<[^>]*>/g, '').trim() || 'Sem Título';
          const summary = (item.description || item.content || '')
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 220);
          
          let image = item.thumbnail || item.enclosure?.link || '';
          if (!image) {
            // Attempt extracting image from HTML content using regex
            const match = (item.description || item.content || '').match(/src=["'](.*?)["']/);
            if (match && match[1]) image = match[1];
          }

          if (!image) {
            image = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80';
          }

          return {
            id: generateArticleId(sourceKey, title),
            title,
            summary: summary || 'Acompanhe os detalhes completos sobre esta novidade do universo gamer.',
            content: (item.content || item.description || summary).replace(/<[^>]*>/g, ''),
            image,
            source: sourceName,
            author: item.author || sourceName,
            publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            category: categorizeArticle(title, summary, defaultCategory),
            tags: [sourceName, defaultCategory, 'Gamer'],
            url: item.link || item.guid || rssUrl,
            readTimeMinutes: Math.max(2, Math.ceil((summary.length || 200) / 70)),
          };
        });
      }
    }
  } catch (error) {
    console.warn(`[${sourceName}] Falha ou timeout na conexão com RSS (${error}). Ativando contingência.`);
  }

  // Fallback to offline / fresh simulated articles
  return fallbackArticles.map((art) => ({
    ...art,
    publishedAt: new Date().toISOString(), // refresh timestamp
  }));
};
