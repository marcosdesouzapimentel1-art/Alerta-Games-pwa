import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import cors from 'cors';
import { executeNewsSync } from './services/newsService';
import { getSyncStatsOverview } from './services/firestoreService';
import { Logger } from './utils/logger';

const corsHandler = cors({ origin: true });

/**
 * Scheduled Cloud Function (v2): Runs automatically every 10 minutes
 */
export const scheduledNewsSync = onSchedule(
  {
    schedule: 'every 10 minutes',
    timeZone: 'America/Sao_Paulo',
    retryCount: 1,
    timeoutSeconds: 300,
    memory: '512MiB'
  },
  async (event) => {
    Logger.info(`[Cloud Scheduler Triggered] Job ID: ${event.jobName || 'scheduledNewsSync'}`);
    try {
      const stats = await executeNewsSync();
      Logger.info(`[Cloud Scheduler Finished] Synced ${stats.totalSynced} items in ${stats.durationMs}ms`);
    } catch (error: any) {
      Logger.error(`[Cloud Scheduler Error] Failed news sync: ${error.message}`);
    }
  }
);

/**
 * HTTP Endpoint: Allows manual sync trigger from Admin Panel
 */
export const syncNews = onRequest(
  {
    timeoutSeconds: 300,
    memory: '512MiB',
    cors: true
  },
  (req, res) => {
    return corsHandler(req, res, async () => {
      if (req.method !== 'POST' && req.method !== 'GET') {
        res.status(405).json({ success: false, message: 'Method Not Allowed' });
        return;
      }

      try {
        Logger.info('[HTTP Trigger] Manual news sync initiated...');
        const result = await executeNewsSync();
        res.status(200).json({
          success: true,
          message: 'Notícias sincronizadas com sucesso!',
          data: result
        });
      } catch (error: any) {
        Logger.error(`[HTTP Trigger Error] ${error.message}`);
        res.status(500).json({
          success: false,
          message: 'Erro ao sincronizar notícias',
          error: error.message
        });
      }
    });
  }
);

/**
 * HTTP Endpoint: Get Sync Stats & Recent Logs for Admin Panel
 */
export const getSyncStats = onRequest(
  {
    timeoutSeconds: 30,
    cors: true
  },
  (req, res) => {
    return corsHandler(req, res, async () => {
      try {
        const stats = await getSyncStatsOverview();
        res.status(200).json({
          success: true,
          data: stats
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
  }
);
