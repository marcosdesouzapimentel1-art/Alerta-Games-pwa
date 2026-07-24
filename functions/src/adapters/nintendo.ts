import { fetchRSSFeed } from '../utils/rss';
import { CONFIG } from '../config';
import { NewsDocument } from '../services/firestoreService';
import { generateAISummary } from '../utils/summary';
import { fetchOpenGraphImage } from '../utils/parser';

export async function fetchNintendoNews(): Promise<NewsDocument[]> {
  const items = await fetchRSSFeed(CONFIG.FEEDS.NINTENDO, 'Nintendo News');
  const results: NewsDocument[] = [];

  for (const item of items.slice(0, 10)) {
    const rawTitle = item.title || 'Nintendo News';
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
    const docId = `nintendo_${hash}`;

    results.push({
      id: docId,
      title: ai.title,
      summary: ai.summary,
      content: ai.content,
      image,
      url: rawUrl,
      source: 'Nintendo News',
      author: item.creator || item.author || 'Nintendo',
      publishedAt: pubDate,
      category: 'Nintendo',
      tags: ai.tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      featured: false,
      readingTime: ai.readingTime,
      views: Math.floor(Math.random() * 320) + 110,
      likes: Math.floor(Math.random() * 65) + 15,
      language: 'pt-BR',
      status: 'published'
    });
  }

  return results;
}
