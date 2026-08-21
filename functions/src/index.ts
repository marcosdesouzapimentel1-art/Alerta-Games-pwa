import { runRakutenCouponsSync } from './services/rakutenCouponsSync';
import { runRakutenSync } from './services/rakutenSync';
import { db } from './lib/firebase';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import cors from 'cors';
import { runNewsSync } from './services/newsSync';
import { runFreeGamesSync } from './services/freeGamesSync';
import { getMessaging } from 'firebase-admin/messaging';
import rakutenService from './rakutenService';

const corsHandler = cors({ origin: true });
const REGION = 'southamerica-east1';

/**
 * Cloud Function Agendada v2 (A cada 2 horas)
 */
export const scheduledNewsSync = onSchedule(
  {
    region: REGION,
    schedule: 'every 2 hours', 
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
 * Função HTTP Manual para Notícias
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

/**
 * Função HTTP Manual para Sincronizar Jogos Grátis da Epic
 */
export const syncFreeGamesManual = onRequest(
  {
    region: REGION,
    timeoutSeconds: 60,
    memory: '256MiB',
    cors: true,
  },
  (req, res) => {
    return corsHandler(req, res, async () => {
      if (req.method !== 'POST' && req.method !== 'GET') {
        res.status(405).json({ success: false, message: 'Método não permitido.' });
        return;
      }

      try {
        console.log('[HTTP Manual] Sincronização de jogos grátis acionada...');
        const result = await runFreeGamesSync();
        res.status(200).json({
          success: true,
          message: `${result.count} jogos grátis sincronizados com sucesso!`,
          durationMs: result.durationMs
        });
      } catch (error: any) {
        console.error("Erro na sincronização de jogos grátis:", error);
        res.status(500).json({
          success: false,
          message: 'Erro ao executar sincronização de jogos grátis',
          error: error.message
        });
      }
    });
  }
);

/**
 * Nova Função HTTP para Disparo de Notificações Push (FCM)
 */
export const dispararPushFCM = onRequest(
  {
    region: REGION,
    timeoutSeconds: 60,
    memory: '256MiB',
    cors: true,
  },
  (req, res) => {
    return corsHandler(req, res, async () => {
      if (req.method !== 'POST') {
        res.status(405).json({ success: false, message: 'Método não permitido. Use POST.' });
        return;
      }

      const { tokens, notification, data } = req.body;

      if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
        res.status(400).json({ success: false, error: 'Nenhum token FCM fornecido.' });
        return;
      }

      const message = {
        tokens: tokens,
        notification: {
          title: notification?.title || 'Alerta Game',
          body: notification?.body || 'Nova notificação para você!',
          ...(notification?.image && { imageUrl: notification.image })
        },
        data: data || {},
      };

      try {
        const response = await getMessaging().sendEachForMulticast(message);
        console.log(`${response.successCount} notificações FCM enviadas com sucesso!`);
        
        res.status(200).json({ 
          success: true, 
          sucessos: response.successCount,
          falhas: response.failureCount 
        });
      } catch (error: any) {
        console.error('Erro ao disparar push via FCM:', error);
        res.status(500).json({ success: false, error: 'Erro interno no servidor Firebase ao enviar push.' });
      }
    });
  }
);

/**
 * Função HTTP Manual para Sincronizar Links da Rakuten (Hype Games)
 */
export const syncRakutenLinksManual = onRequest(
  {
    region: REGION,
    timeoutSeconds: 60,
    memory: '256MiB',
    cors: true,
    secrets: ['RAKUTEN_TOKEN']
  },
  (req, res) => {
    return corsHandler(req, res, async () => {
      if (req.method !== 'POST' && req.method !== 'GET') {
        res.status(405).json({ success: false, message: 'Método não permitido.' });
        return;
      }

      try {
        console.log('[HTTP Manual] Sincronização e salvamento de links da Rakuten acionada...');

        // Executa o serviço que busca da API e já salva no Firestore
        const result = await runRakutenSync();

        res.status(200).json({
          success: true,
          message: 'Links da Rakuten sincronizados e salvos no Firestore com sucesso!',
          data: result
        });
      } catch (error: any) {
        console.error("Erro na sincronização da Rakuten:", error);
        res.status(500).json({
          success: false,
          message: 'Erro ao executar sincronização da Rakuten',
          error: error.message
        });
      }
    });
  }
);
/**
 * Função HTTP Manual para Sincronizar Cupons da Rakuten
 */
export const syncRakutenCouponsManual = onRequest(
  {
    region: REGION,
    timeoutSeconds: 60,
    memory: '256MiB',
    cors: true,
    secrets: ['RAKUTEN_TOKEN']
  },
  (req, res) => {
    return corsHandler(req, res, async () => {
      if (req.method !== 'POST' && req.method !== 'GET') {
        res.status(405).json({ success: false, message: 'Método não permitido.' });
        return;
      }

      try {
        console.log('[HTTP Manual] Sincronização de cupons da Rakuten acionada...');
        const result = await runRakutenCouponsSync();

        res.status(200).json({
          success: true,
          message: 'Cupons da Rakuten sincronizados com sucesso!',
          data: result
        });
      } catch (error: any) {
        console.error("Erro na sincronização de cupons:", error);
        res.status(500).json({
          success: false,
          message: 'Erro ao executar sincronização de cupons',
          error: error.message
        });
      }
    });
  }
);
