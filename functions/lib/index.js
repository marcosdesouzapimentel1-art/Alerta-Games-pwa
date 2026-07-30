"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncNewsManual = exports.scheduledNewsSync = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const cors_1 = __importDefault(require("cors"));
const newsSync_1 = require("./services/newsSync");
const corsHandler = (0, cors_1.default)({ origin: true });
/**
 * Cloud Function Agendada v2: Executa a cada 10 minutos
 */
exports.scheduledNewsSync = (0, scheduler_1.onSchedule)({
    schedule: 'every 10 minutes',
    timeZone: 'America/Sao_Paulo',
    retryCount: 1,
    timeoutSeconds: 300,
    memory: '512MiB'
}, async (event) => {
    console.log(`[Cloud Scheduler] Iniciando sincronização automática. Job: ${event.jobName || 'scheduledNewsSync'}`);
    try {
        const result = await (0, newsSync_1.runNewsSync)();
        console.log(`[Cloud Scheduler] Sincronização finalizada em ${result.durationMs}ms | Encontradas: ${result.totalFound} | Adicionadas: ${result.totalAdded} | Duplicadas: ${result.duplicatesCount}`);
    }
    catch (error) {
        console.error(`[Cloud Scheduler] Erro ao sincronizar notícias: ${error.message}`);
    }
});
/**
 * Função HTTP: Sincronização manual acionada pelo Painel Administrativo
 */
exports.syncNewsManual = (0, https_1.onRequest)({
    timeoutSeconds: 300,
    memory: '512MiB',
    cors: true
}, (req, res) => {
    return corsHandler(req, res, async () => {
        if (req.method !== 'POST' && req.method !== 'GET') {
            res.status(405).json({ success: false, message: 'Método não permitido. Utilize POST ou GET.' });
            return;
        }
        try {
            console.log('[HTTP Manual] Sincronização manual acionada via API...');
            const result = await (0, newsSync_1.runNewsSync)();
            res.status(200).json({
                success: true,
                message: 'Notícias sincronizadas com sucesso!',
                data: result
            });
        }
        catch (error) {
            console.error('[HTTP Manual] Erro na sincronização:', error.message);
            res.status(500).json({
                success: false,
                message: 'Erro ao executar sincronização manual de notícias',
                error: error.message
            });
        }
    });
});
//# sourceMappingURL=index.js.map