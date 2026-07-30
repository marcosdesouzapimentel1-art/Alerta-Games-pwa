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
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AlertaGameAggregator/1.0'
    },
    timeout: 10000
  }
});

export interface RssFeedConfig {
  sourceName: string;
  url: string;
  category: string;
}

export const RSS_FEEDS: RssFeedConfig[] = [
  {
    sourceName: 'IGN',
    url: 'https://feeds.feedburner.com/ign/news',
    category: 'Geral'
  },
  {
    sourceName: 'GameSpot',
    url: 'https://www.gamespot.com/feeds/news/',
    category: 'Geral'
  },
  {
    sourceName: 'VGC',
    url: 'https://www.videogameschronicle.com/feed/',
    category: 'Geral'
  },
  {
    sourceName: 'PlayStation Blog',
    url: 'https://blog.playstation.com/feed/',
    category: 'PlayStation'
  },
  {
    sourceName: 'Xbox Wire',
    url: 'https://news.xbox.com/en-us/feed/',
    category: 'Xbox'
  },
  {
    sourceName: 'Nintendo Life',
    url: 'https://www.nintendolife.com/feeds/latest',
    category: 'Nintendo'
  }
];

function extractImageFromContent(content?: string): string | undefined {
  if (!content) return undefined;
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  return imgMatch ? imgMatch[1] : undefined;
}

function cleanHtml(html?: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>?/gm, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function detectCategory(title: string, content: string, defaultCategory: string): string {
  const text = `${title} ${content}`.toLowerCase();
  if (text.includes('playstation') || text.includes('ps5') || text.includes('ps4')) return 'PlayStation';
  if (text.includes('xbox') || text.includes('game pass') || text.includes('series x')) return 'Xbox';
  if (text.includes('nintendo') || text.includes('switch')) return 'Nintendo';
  if (text.includes('pc') || text.includes('steam') || text.includes('epic games')) return 'PC';
  return defaultCategory;
}

export async function fetchRssFeed(feedConfig: RssFeedConfig): Promise<NewsArticleInput[]> {
  try {
    const feed = await parser.parseURL(feedConfig.url);
    const articles: NewsArticleInput[] = [];

    for (const item of feed.items || []) {
      if (!item.title || !item.link) continue;

      const title = cleanHtml(item.title);
      const rawContent = (item as any).contentEncoded || item.content || item.summary || item.snippet || '';
      const summary = cleanHtml(item.summary || item.contentSnippet || rawContent).slice(0, 300);

      let imageUrl: string | undefined;
      const mediaContent = (item as any).mediaContent;
      const mediaThumbnail = (item as any).mediaThumbnail;
      const enclosure = (item as any).enclosure;

      if (mediaContent && mediaContent.$ && mediaContent.$.url) {
        imageUrl = mediaContent.$.url;
      } else if (mediaThumbnail && mediaThumbnail.$ && mediaThumbnail.$.url) {
        imageUrl = mediaThumbnail.$.url;
      } else if (enclosure && enclosure.url) {
        imageUrl = enclosure.url;
      } else {
        imageUrl = extractImageFromContent(rawContent) || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800';
      }

      const publishedAt = item.isoDate || (item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString());
      const category = detectCategory(title, summary, feedConfig.category);
      const readTimeMinutes = Math.max(2, Math.ceil(summary.split(' ').length / 40));

      articles.push({
        title,
        summary: summary || title,
        content: cleanHtml(rawContent) || summary || title,
        url: item.link.trim(),
        imageUrl,
        image: imageUrl,
        source: feedConfig.sourceName,
        category,
        publishedAt,
        readTimeMinutes
      });
    }

    console.log(`Fonte RSS carregada: ${feedConfig.sourceName} (${articles.length} notícias)`);
    return articles;
  } catch (error: any) {
    console.error(`Erro ao buscar RSS de ${feedConfig.sourceName} (${feedConfig.url}):`, error.message);
    throw error;
  }
}
