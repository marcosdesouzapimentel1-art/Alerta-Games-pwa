import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit as limitConstraint,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { NewsArticle } from '../types';
import { NewsSourceAdapter, SyncLog } from './adapters/base';
import { RawgAdapter } from './adapters/rawgAdapter';
import { IgnAdapter } from './adapters/ignAdapter';
import { GameSpotAdapter } from './adapters/gamespotAdapter';
import { VgcAdapter } from './adapters/vgcAdapter';
import { PlayStationAdapter } from './adapters/playstationAdapter';
import { XboxAdapter } from './adapters/xboxAdapter';
import { NintendoAdapter } from './adapters/nintendoAdapter';
import { notificationService } from './notificationService';

class NewsAggregatorService {
  private adapters: NewsSourceAdapter[] = [
    new RawgAdapter(),
    new IgnAdapter(),
    new GameSpotAdapter(),
    new VgcAdapter(),
    new PlayStationAdapter(),
    new XboxAdapter(),
    new NintendoAdapter(),
  ];

  private autoSyncIntervalId: ReturnType<typeof setInterval> | null = null;
  private lastSyncTimestamp: number = Date.now();
  private listeners: Array<() => void> = [];
  private currentLogs: SyncLog[] = [];

  constructor() {
    this.loadLastSyncTime();
  }

  private loadLastSyncTime() {
    const stored = localStorage.getItem('alerta_game_last_news_sync');
    if (stored) {
      this.lastSyncTimestamp = parseInt(stored, 10) || Date.now();
    }
  }

  private setLastSyncTime(timestamp: number) {
    this.lastSyncTimestamp = timestamp;
    localStorage.setItem('alerta_game_last_news_sync', timestamp.toString());
    this.notifyListeners();
  }

  public getLastSyncTime(): number {
    return this.lastSyncTimestamp;
  }

  public getMinutesSinceLastSync(): number {
    const diffMs = Date.now() - this.lastSyncTimestamp;
    return Math.max(0, Math.floor(diffMs / (1000 * 60)));
  }

  public subscribeSync(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((callback) => {
      try {
        callback();
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    });
  }

  /**
   * Main aggregation & sync function:
   * Fetches articles from all adapters, removes duplicates, and saves new ones to Firestore.
   */
  public async runSync(
    trigger: 'automatic' | 'manual' | 'initial' = 'manual',
    adminUser?: { uid?: string; email?: string }
  ): Promise<SyncLog> {
    const startTime = new Date().toISOString();
    console.log(`[NewsAggregator] Iniciando sincronização (${trigger})...`);

    const sourcesSuccessful: string[] = [];
    const sourcesFailed: { source: string; error: string }[] = [];
    const allFetchedArticles: NewsArticle[] = [];

    // Run all source adapters concurrently
    const adapterResults = await Promise.allSettled(
      this.adapters.map(async (adapter) => {
        try {
          const articles = await adapter.fetchArticles();
          return { sourceName: adapter.name, articles };
        } catch (error: any) {
          throw { sourceName: adapter.name, error: error?.message || 'Falha na requisição' };
        }
      })
    );

    adapterResults.forEach((result, idx) => {
      const adapterName = this.adapters[idx].name;
      if (result.status === 'fulfilled') {
        sourcesSuccessful.push(result.value.sourceName);
        allFetchedArticles.push(...result.value.articles);
      } else {
        const errorMsg = result.reason?.error || 'Timeout/Erro de rede';
        sourcesFailed.push({ source: adapterName, error: errorMsg });
      }
    });

    // Save news to Firestore and eliminate duplicates
    let newArticlesSaved = 0;
    let totalInDb = 0;

    try {
      const newsColRef = collection(db, 'news');
      const snapshot = await getDocs(newsColRef);

      const existingIds = new Set(snapshot.docs.map((d) => d.id));
      const existingTitles = new Set(snapshot.docs.map((d) => d.data().title?.toLowerCase().trim()));
      const existingUrls = new Set(snapshot.docs.map((d) => d.data().url?.toLowerCase().trim()).filter(Boolean));

      for (const article of allFetchedArticles) {
        const titleKey = article.title.toLowerCase().trim();
        const urlKey = article.url?.toLowerCase().trim();

        const isDuplicate =
          existingIds.has(article.id) ||
          existingTitles.has(titleKey) ||
          (urlKey && existingUrls.has(urlKey));

        if (!isDuplicate) {
          const docRef = doc(db, 'news', article.id);
          const articleToSave: NewsArticle = {
            ...article,
            imageUrl: article.image || article.imageUrl,
            publishedAt: article.publishedAt || new Date().toISOString(),
          };

          await setDoc(docRef, articleToSave, { merge: true });

          // Trigger automatic FCM notification if category matched user preferences
          notificationService.triggerAutomaticAlertsForNews({
            title: articleToSave.title,
            summary: articleToSave.summary,
            category: articleToSave.category,
            image: articleToSave.imageUrl || articleToSave.image,
            url: articleToSave.url,
          }).catch((err) => console.warn('Erro ao disparar alerta de notícia:', err));

          existingIds.add(article.id);
          existingTitles.add(titleKey);
          if (urlKey) existingUrls.add(urlKey);

          newArticlesSaved++;
        }
      }

      totalInDb = existingIds.size;
    } catch (firestoreErr) {
      console.warn('[NewsAggregator] Aviso ao salvar no Firestore (modo offline/fallback ativo):', firestoreErr);
    }

    const endTime = new Date().toISOString();
    const articlesFound = allFetchedArticles.length;
    const duplicatesCount = Math.max(0, articlesFound - newArticlesSaved);
    const errorsCount = sourcesFailed.length;

    const log: SyncLog = {
      id: `log-${Date.now()}`,
      timestamp: endTime,
      startTime,
      endTime,
      sourcesAttempted: this.adapters.length,
      sourcesSuccessful,
      sourcesFailed,
      articlesFound,
      newArticlesCount: newArticlesSaved,
      duplicatesCount,
      errorsCount,
      totalArticlesCount: totalInDb,
      trigger,
      adminUid: adminUser?.uid || '',
      adminEmail: adminUser?.email || '',
    };

    // Save log to Firestore news_sync_logs
    try {
      const logRef = doc(db, 'news_sync_logs', log.id);
      await setDoc(logRef, log, { merge: true });
    } catch (err) {
      console.warn('[NewsAggregator] Erro ao salvar log de sincronização no Firestore:', err);
    }

    this.currentLogs = [log, ...this.currentLogs].slice(0, 10);
    this.setLastSyncTime(Date.now());

    console.log(`[NewsAggregator] Sincronização concluída. ${newArticlesSaved} novas notícias salvas.`);
    return log;
  }

  /**
   * Starts automatic background sync every 10 minutes (600,000 ms)
   */
  public startAutoSync(intervalMinutes: number = 10) {
    if (this.autoSyncIntervalId) return;

    const intervalMs = intervalMinutes * 60 * 1000;

    console.log(`[NewsAggregator] Agendador automático ativado. Intervalo: ${intervalMinutes} min.`);

    // Run immediately if last sync was more than 10 mins ago
    if (this.getMinutesSinceLastSync() >= intervalMinutes) {
      this.runSync('automatic');
    }

    this.autoSyncIntervalId = setInterval(() => {
      this.runSync('automatic');
    }, intervalMs);
  }

  public stopAutoSync() {
    if (this.autoSyncIntervalId) {
      clearInterval(this.autoSyncIntervalId);
      this.autoSyncIntervalId = null;
    }
  }

  public getRecentLogs(): SyncLog[] {
    return this.currentLogs;
  }

  /**
   * Listens to Firestore real-time updates for news collection
   */
  public subscribeFirestoreNewsRealtime(callback: () => void): () => void {
    try {
      const newsColRef = collection(db, 'news');
      const q = query(newsColRef, orderBy('publishedAt', 'desc'), limitConstraint(20));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          callback();
        }
      }, (error) => {
        console.warn('[Firestore] Notícias realtime error:', error);
      });

      return unsubscribe;
    } catch (error) {
      return () => {};
    }
  }
}

export const newsAggregator = new NewsAggregatorService();
