import { db } from './lib/firebase';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import cors from 'cors';
import { runNewsSync } from './services/newsSync';

const corsHandler = cors({ origin: true });
const REGION = 'southamerica-east1';

/**
 * Cloud Function Agendada v2
 */
export const scheduledNewsSync = onSchedule(
  {
    region: REGION,
    schedule: 'every 10 minutes',
    timeZone: 'America/Sao_Paulo',
    retryCount: 1,
    timeoutSeconds: 300,
    memory: '512MiB',
    secrets: ['GEMINI_API_KEY']
  },
  async (event) => {
    console.log(`[Cloud Scheduler] Iniciando sincronização automática.`);
    try {
      const result = await runNewsSync();
      console.log(`[Cloud Scheduler] Sincronização concluída em ${result.durationMs}ms`);
    } catch (error: any) {
      console.error(`[Cloud Scheduler] Erro: ${error.message}`);
    }
  }
);

/**
 * Função HTTP Manual
 */
export const syncNewsManual = onRequest(
  {
    region: REGION,
    timeoutSeconds: 300,
    memory: '512MiB',
    cors: true,
    secrets: ['GEMINI_API_KEY']
  },
  (req, res) => {
    return corsHandler(req, res, async () => {
      if (req.method !== 'POST' && req.method !== 'GET') {
        res.status(405).json({ success: false, message: 'Método não permitido.' });
        return;
      }

      try {
        console.log('[HTTP Manual] Sincronização acionada...');
        const result = await runNewsSync();
        res.status(200).json({
          success: true,
          message: 'Notícias sincronizadas com sucesso!',
          data: result
        });
      } catch (error: any) {
        console.error("Erro na sincronização manual:", error);
        res.status(500).json({
          success: false,
          message: 'Erro ao executar sincronização manual',
          error: error.message
        });
      }
    });
  }
);
