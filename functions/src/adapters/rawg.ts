import axios from 'axios';
import { CONFIG } from '../config';
import { NewsDocument } from '../services/firestoreService';
import { generateAISummary } from '../utils/summary';
import { fetchOpenGraphImage } from '../utils/parser';
import { Logger } from '../utils/logger';

export async function fetchRawgNews(): Promise<NewsDocument[]> {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    Logger.debug('RAWG_API_KEY not configured, skipping RAWG adapter.');
    return [];
  }

  const results: NewsDocument[] = [];
  try {
    const url = `https://api.rawg.io/api/news?key=${apiKey}&page_size=10`;
    const response = await axios.get(url, { timeout: CONFIG.TIMEOUT_MS });
    const items = response.data?.results || [];

    for (const item of items) {
      const rawTitle = item.title || 'RAWG Gaming News';
      const rawUrl = item.url || item.link || `https://rawg.io/news/${item.id}`;
      const rawContent = item.description || item.body || item.title;
      const pubDate = item.created ? new Date(item.created).toISOString() : new Date().toISOString();

      let image = item.image || item.background_image;
      if (!image) {
        image = await fetchOpenGraphImage(rawUrl);
      }

      const ai = await generateAISummary(rawTitle, rawContent, rawUrl);
      const docId = `rawg_${item.id || Math.abs(rawUrl.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0))}`;

      results.push({
        id: docId,
        title: ai.title,
        summary: ai.summary,
        content: ai.content,
        image,
        url: rawUrl,
        source: 'RAWG Video Games Database',
        author: item.author || 'RAWG News',
        publishedAt: pubDate,
        category: ai.category,
        tags: ai.tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        featured: false,
        readingTime: ai.readingTime,
        views: Math.floor(Math.random() * 200) + 50,
        likes: Math.floor(Math.random() * 30) + 5,
        language: 'pt-BR',
        status: 'published'
      });
    }
  } catch (error: any) {
    Logger.warn(`RAWG fetch error: ${error.message}`);
  }

  return results;
}
