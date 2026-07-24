import { db } from '../firebase';
import { normalizeTitle } from '../utils/parser';
import { Logger } from '../utils/logger';

export interface NewsDocument {
  id: string;
  title: string;
  summary: string;
  content: string;
  image: string;
  url: string;
  source: string;
  author: string;
  publishedAt: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  featured: boolean;
  readingTime: number;
  views: number;
  likes: number;
  language: string;
  status: 'published' | 'draft' | 'archived';
  normalizedTitle?: string;
}

export interface SyncLogDocument {
  fonte: string;
  quantidadeNoticias: number;
  tempoExecucaoMs: number;
  erros: string | null;
  data: string;
}

export interface NewsSyncSystemDocument {
  ultimaSincronizacao: string;
  tempo: number;
  status: 'success' | 'error' | 'partial';
  quantidadeSincronizada: number;
}

export async function isDuplicateNews(id: string, url: string, rawTitle: string): Promise<boolean> {
  try {
    // 1. Check by ID
    const docById = await db.collection('news').doc(id).get();
    if (docById.exists) return true;

    // 2. Check by URL
    const urlQuery = await db.collection('news').where('url', '==', url).limit(1).get();
    if (!urlQuery.empty) return true;

    // 3. Check by normalized title
    const norm = normalizeTitle(rawTitle);
    if (norm) {
      const titleQuery = await db.collection('news').where('normalizedTitle', '==', norm).limit(1).get();
      if (!titleQuery.empty) return true;
    }

    return false;
  } catch (error: any) {
    Logger.error(`Error checking deduplication for ${url}: ${error.message}`);
    return false;
  }
}

export async function saveNewsDocument(news: NewsDocument): Promise<boolean> {
  try {
    const isDup = await isDuplicateNews(news.id, news.url, news.title);
    if (isDup) {
      Logger.debug(`Skipping duplicate news: ${news.title}`);
      return false;
    }

    const payload = {
      ...news,
      normalizedTitle: normalizeTitle(news.title)
    };

    await db.collection('news').doc(news.id).set(payload);
    return true;
  } catch (error: any) {
    Logger.error(`Failed to save news document ${news.id}: ${error.message}`);
    return false;
  }
}

export async function recordSyncLog(log: SyncLogDocument): Promise<void> {
  try {
    await db.collection('sync_logs').add(log);
  } catch (error: any) {
    Logger.error(`Failed to record sync log: ${error.message}`);
  }
}

export async function updateSystemSyncStatus(statusDoc: NewsSyncSystemDocument): Promise<void> {
  try {
    await db.collection('system').doc('news_sync').set(statusDoc, { merge: true });
  } catch (error: any) {
    Logger.error(`Failed to update system/news_sync document: ${error.message}`);
  }
}

export async function getSyncStatsOverview(): Promise<any> {
  try {
    const newsSnap = await db.collection('news').select().get();
    const totalNews = newsSnap.size;

    const systemDoc = await db.collection('system').doc('news_sync').get();
    const systemData = systemDoc.data() || {};

    const recentLogsSnap = await db.collection('sync_logs')
      .orderBy('data', 'desc')
      .limit(20)
      .get();

    const recentLogs = recentLogsSnap.docs.map((d) => d.data());
    const totalFailures = recentLogs.filter((l) => l.erros !== null).length;

    let avgTimeMs = 0;
    if (recentLogs.length > 0) {
      const sumTime = recentLogs.reduce((acc, curr) => acc + (curr.tempoExecucaoMs || 0), 0);
      avgTimeMs = Math.round(sumTime / recentLogs.length);
    }

    return {
      totalNews,
      lastSync: systemData.ultimaSincronizacao || null,
      lastSyncDurationMs: systemData.tempo || 0,
      status: systemData.status || 'unknown',
      lastSyncedCount: systemData.quantidadeSincronizada || 0,
      averageSyncTimeMs: avgTimeMs,
      totalRecentFailures: totalFailures,
      recentLogs
    };
  } catch (error: any) {
    Logger.error(`Error fetching sync stats overview: ${error.message}`);
    return {
      totalNews: 0,
      lastSync: null,
      error: error.message
    };
  }
}
