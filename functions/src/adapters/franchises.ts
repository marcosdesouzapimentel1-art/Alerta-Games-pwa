import { fetchRSSFeed } from '../utils/rss';
import { CONFIG } from '../config';
import { NewsDocument } from '../services/firestoreService';
import { generateAISummary } from '../utils/summary';
import { fetchOpenGraphImage } from '../utils/parser';

interface FranchiseFeedConfig {
  sourceName: string;
  feedUrl: string;
  defaultCategory: string;
}

const FRANCHISE_FEEDS: FranchiseFeedConfig[] = [
  { sourceName: 'Electronic Arts (EA)', feedUrl: CONFIG.FEEDS.EA, defaultCategory: 'EA Sports FC' },
  { sourceName: 'Call of Duty Official', feedUrl: CONFIG.FEEDS.CALL_OF_DUTY, defaultCategory: 'Call of Duty' },
  { sourceName: 'Fortnite News', feedUrl: CONFIG.FEEDS.FORTNITE, defaultCategory: 'Fortnite' },
  { sourceName: 'League of Legends', feedUrl: CONFIG.FEEDS.LEAGUE_OF_LEGENDS, defaultCategory: 'League of Legends' },
  { sourceName: 'Valorant News', feedUrl: CONFIG.FEEDS.VALORANT, defaultCategory: 'Valorant' },
  { sourceName: 'Minecraft Official', feedUrl: CONFIG.FEEDS.MINECRAFT, defaultCategory: 'Minecraft' }
];

export async function fetchFranchisesNews(): Promise<NewsDocument[]> {
  const allDocs: NewsDocument[] = [];

  for (const feedConfig of FRANCHISE_FEEDS) {
    try {
      const items = await fetchRSSFeed(feedConfig.feedUrl, feedConfig.sourceName);
      for (const item of items.slice(0, 5)) {
        const rawTitle = item.title || `${feedConfig.sourceName} Update`;
        const rawUrl = item.link || '';
        if (!rawUrl) continue;

        const rawContent = item.contentSnippet || item.content || item['contentEncoded'] || rawTitle;
        const pubDate = item.isoDate || item.pubDate ? new Date(item.isoDate || item.pubDate!).toISOString() : new Date().toISOString();

        let image = item.enclosure?.url || item['mediaContent']?.$?.url;
        if (!image) {
          image = await fetchOpenGraphImage(rawUrl);
        }

        const ai = await generateAISummary(rawTitle, rawContent, rawUrl);
        const hash = Math.abs(rawUrl.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0));
        const prefix = feedConfig.sourceName.toLowerCase().replace(/[^a-z]/g, '').slice(0, 8);
        const docId = `${prefix}_${hash}`;

        allDocs.push({
          id: docId,
          title: ai.title,
          summary: ai.summary,
          content: ai.content,
          image,
          url: rawUrl,
          source: feedConfig.sourceName,
          author: item.creator || item.author || feedConfig.sourceName,
          publishedAt: pubDate,
          category: ai.category || feedConfig.defaultCategory,
          tags: ai.tags,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          featured: false,
          readingTime: ai.readingTime,
          views: Math.floor(Math.random() * 300) + 100,
          likes: Math.floor(Math.random() * 50) + 10,
          language: 'pt-BR',
          status: 'published'
        });
      }
    } catch (error) {
      // Continue next franchise feed even if one fails
    }
  }

  return allDocs;
}
