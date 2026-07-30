import * as admin from 'firebase-admin';
import { fetchRawgNews } from './rawg';
import { fetchRssFeed, RSS_FEEDS } from './rss';
import { deduplicateArticles, NewsArticleInput } from '../utils/deduplicate';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export interface SourceQueryResult {
  sourceName: string;
  foundCount: number;
  status: 'success' | 'error';
  error?: string;
}

export interface NewsSyncResult {
  startedAt: string;
  completedAt: string;
  durationMs: number;
  totalFound: number;
  totalAdded: number;
  duplicatesCount: number;
  errors: Array<{ source: string; message: string }>;
  sourcesQueried: SourceQueryResult[];
  status: 'success' | 'partial' | 'error';
}

export async function runNewsSync(): Promise<NewsSyncResult> {
  const startedAt = new Date().toISOString();
  const startTimeMs = Date.now();

  const fetchedArticles: NewsArticleInput[] = [];
  const errors: Array<{ source: string; message: string }> = [];
  const sourcesQueried: SourceQueryResult[] = [];

  // 1. RAWG API
  try {
    const rawgArticles = await fetchRawgNews();
    fetchedArticles.push(...rawgArticles);
    sourcesQueried.push({
      sourceName: 'RAWG API',
      foundCount: rawgArticles.length,
      status: 'success'
    });
  } catch (err: any) {
    const errMsg = err.message || 'Erro RAWG API';
    errors.push({ source: 'RAWG API', message: errMsg });
    sourcesQueried.push({
      sourceName: 'RAWG API',
      foundCount: 0,
      status: 'error',
      error: errMsg
    });
  }

  // 2. RSS Feeds
  for (const feed of RSS_FEEDS) {
    try {
      const articles = await fetchRssFeed(feed);
      fetchedArticles.push(...articles);
      sourcesQueried.push({
        sourceName: feed.sourceName,
        foundCount: articles.length,
        status: 'success'
      });
    } catch (err: any) {
      const errMsg = err.message || 'Erro RSS Feed';
      errors.push({ source: feed.sourceName, message: errMsg });
      sourcesQueried.push({
        sourceName: feed.sourceName,
        foundCount: 0,
        status: 'error',
        error: errMsg
      });
    }
  }

  const totalFound = fetchedArticles.length;

  // 3. Obter artigos existentes no Firestore "news" para deduplicação
  const existingSnapshot = await db
    .collection('news')
    .orderBy('publishedAt', 'desc')
    .limit(300)
    .get();

  const existingItems = existingSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      url: data.url || '',
      title: data.title || ''
    };
  });

  // 4. Filtrar inéditas com deduplicação (URL, Título e ID)
  const { uniqueArticles, duplicatesCount } = deduplicateArticles(fetchedArticles, existingItems);

  // 5. Salvar notícias inéditas na coleção "news"
  let totalAdded = 0;

  if (uniqueArticles.length > 0) {
    const chunks: NewsArticleInput[][] = [];
    for (let i = 0; i < uniqueArticles.length; i += 400) {
      chunks.push(uniqueArticles.slice(i, i + 400));
    }

    for (const chunk of chunks) {
      const batch = db.batch();
      for (const article of chunk) {
        const docRef = db.collection('news').doc(article.id!);
        batch.set(
          docRef,
          {
            id: article.id,
            title: article.title,
            summary: article.summary,
            content: article.content || article.summary,
            url: article.url,
            imageUrl: article.imageUrl || article.image || '',
            image: article.imageUrl || article.image || '',
            source: article.source,
            category: article.category,
            publishedAt: article.publishedAt,
            readTimeMinutes: article.readTimeMinutes || 3,
            views: 0,
            likes: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          },
          { merge: true }
        );
      }
      await batch.commit();
      totalAdded += chunk.length;
    }
  }

  const completedAt = new Date().toISOString();
  const durationMs = Date.now() - startTimeMs;

  const status: 'success' | 'partial' | 'error' =
    errors.length === 0
      ? 'success'
      : errors.length < sourcesQueried.length
      ? 'partial'
      : 'error';

  const result: NewsSyncResult = {
    startedAt,
    completedAt,
    durationMs,
    totalFound,
    totalAdded,
    duplicatesCount,
    errors,
    sourcesQueried,
    status
  };

  // 6. Registrar estatísticas na coleção "news_sync_logs"
  try {
    await db.collection('news_sync_logs').add({
      startedAt,
      completedAt,
      durationMs,
      totalFound,
      totalAdded,
      duplicatesCount,
      errors,
      sourcesQueried,
      status,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (logErr: any) {
    console.error('Erro ao salvar em news_sync_logs:', logErr.message);
  }

  return result;
}
