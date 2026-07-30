import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import cors from 'cors';
import { runNewsSync } from './services/newsSync';

const corsHandler = cors({ origin: true });

/**
 * Cloud Function Agendada v2: Executa a cada 10 minutos
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
    console.log(`[Cloud Scheduler] Iniciando sincronização automática. Job: ${event.jobName || 'scheduledNewsSync'}`);
    try {
      const result = await runNewsSync();
      console.log(
        `[Cloud Scheduler] Sincronização finalizada em ${result.durationMs}ms | Encontradas: ${result.totalFound} | Adicionadas: ${result.totalAdded} | Duplicadas: ${result.duplicatesCount}`
      );
    } catch (error: any) {
      console.error(`[Cloud Scheduler] Erro ao sincronizar notícias: ${error.message}`);
    }
  }
);

/**
 * Função HTTP: Sincronização manual acionada pelo Painel Administrativo
 */
export const syncNewsManual = onRequest(
  {
    timeoutSeconds: 300,
    memory: '512MiB',
    cors: true
  },
  (req, res) => {
    return corsHandler(req, res, async () => {
      if (req.method !== 'POST' && req.method !== 'GET') {
        res.status(405).json({ success: false, message: 'Método não permitido. Utilize POST ou GET.' });
        return;
      }

      try {
        console.log('[HTTP Manual] Sincronização manual acionada via API...');
        const result = await runNewsSync();
        res.status(200).json({
          success: true,
          message: 'Notícias sincronizadas com sucesso!',
          data: result
        });
      } catch (error: any) {
        console.error('[HTTP Manual] Erro na sincronização:', error.message);
        res.status(500).json({
          success: false,
          message: 'Erro ao executar sincronização manual de notícias',
          error: error.message
        });
      }
    });
  }
);
