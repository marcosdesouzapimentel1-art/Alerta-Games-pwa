import { fetchRawgNews } from '../adapters/rawg';
import { fetchIgnNews } from '../adapters/ign';
import { fetchGameSpotNews } from '../adapters/gamespot';
import { fetchVgcNews } from '../adapters/vgc';
import { fetchPlaystationNews } from '../adapters/playstation';
import { fetchXboxNews } from '../adapters/xbox';
import { fetchNintendoNews } from '../adapters/nintendo';
import { fetchSteamNews } from '../adapters/steam';
import { fetchEpicNews } from '../adapters/epic';
import { fetchFranchisesNews } from '../adapters/franchises';
import {
  NewsDocument,
  saveNewsDocument,
  recordSyncLog,
  updateSystemSyncStatus
} from './firestoreService';
import { sendNewsNotification } from './notificationService';
import { Logger } from '../utils/logger';

interface SourceTask {
  name: string;
  fetcher: () => Promise<NewsDocument[]>;
}

export async function executeNewsSync(): Promise<{
  totalSynced: number;
  durationMs: number;
  sourcesProcessed: number;
  errorsCount: number;
}> {
  const startTime = Date.now();
  Logger.info('Starting automatic news sync process...');

  const tasks: SourceTask[] = [
    { name: 'RAWG API', fetcher: fetchRawgNews },
    { name: 'IGN Brasil', fetcher: fetchIgnNews },
    { name: 'GameSpot', fetcher: fetchGameSpotNews },
    { name: 'VGC', fetcher: fetchVgcNews },
    { name: 'PlayStation Blog', fetcher: fetchPlaystationNews },
    { name: 'Xbox Wire', fetcher: fetchXboxNews },
    { name: 'Nintendo News', fetcher: fetchNintendoNews },
    { name: 'Steam News', fetcher: fetchSteamNews },
    { name: 'Epic Games News', fetcher: fetchEpicNews },
    { name: 'Franchises (EA/COD/Fortnite/LoL/Valorant/Minecraft)', fetcher: fetchFranchisesNews }
  ];

  let totalSynced = 0;
  let errorsCount = 0;

  // Execute tasks in parallel with Promise.allSettled
  const results = await Promise.allSettled(
    tasks.map(async (task) => {
      const taskStart = Date.now();
      let docs: NewsDocument[] = [];
      let errorMessage: string | null = null;

      try {
        docs = await task.fetcher();
      } catch (err: any) {
        errorMessage = err.message || 'Unknown source fetch error';
        errorsCount++;
        Logger.error(`Error fetching source [${task.name}]: ${errorMessage}`);
      }

      const taskDuration = Date.now() - taskStart;
      let newlySavedCount = 0;

      for (const doc of docs) {
        const saved = await saveNewsDocument(doc);
        if (saved) {
          newlySavedCount++;
          // Trigger Push notification for newly saved news
          sendNewsNotification({
            newsId: doc.id,
            title: doc.title,
            summary: doc.summary,
            category: doc.category,
            url: doc.url,
            image: doc.image
          }).catch((e) => Logger.error(`Notification background trigger error: ${e.message}`));
        }
      }

      // Record log in sync_logs collection
      await recordSyncLog({
        fonte: task.name,
        quantidadeNoticias: newlySavedCount,
        tempoExecucaoMs: taskDuration,
        erros: errorMessage,
        data: new Date().toISOString()
      });

      return newlySavedCount;
    })
  );

  for (const res of results) {
    if (res.status === 'fulfilled') {
      totalSynced += res.value;
    }
  }

  const totalDuration = Date.now() - startTime;
  const status: 'success' | 'error' | 'partial' =
    errorsCount === 0 ? 'success' : errorsCount < tasks.length ? 'partial' : 'error';

  await updateSystemSyncStatus({
    ultimaSincronizacao: new Date().toISOString(),
    tempo: totalDuration,
    status,
    quantidadeSincronizada: totalSynced
  });

  Logger.info(`News sync completed in ${totalDuration}ms. Total new articles saved: ${totalSynced}. Status: ${status}`);

  return {
    totalSynced,
    durationMs: totalDuration,
    sourcesProcessed: tasks.length,
    errorsCount
  };
}
