"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeNewsSync = executeNewsSync;
const rawg_1 = require("../adapters/rawg");
const ign_1 = require("../adapters/ign");
const gamespot_1 = require("../adapters/gamespot");
const vgc_1 = require("../adapters/vgc");
const playstation_1 = require("../adapters/playstation");
const xbox_1 = require("../adapters/xbox");
const nintendo_1 = require("../adapters/nintendo");
const steam_1 = require("../adapters/steam");
const epic_1 = require("../adapters/epic");
const franchises_1 = require("../adapters/franchises");
const firestoreService_1 = require("./firestoreService");
const notificationService_1 = require("./notificationService");
const logger_1 = require("../utils/logger");
async function executeNewsSync() {
    const startTime = Date.now();
    logger_1.Logger.info('Starting automatic news sync process...');
    const tasks = [
        { name: 'RAWG API', fetcher: rawg_1.fetchRawgNews },
        { name: 'IGN Brasil', fetcher: ign_1.fetchIgnNews },
        { name: 'GameSpot', fetcher: gamespot_1.fetchGameSpotNews },
        { name: 'VGC', fetcher: vgc_1.fetchVgcNews },
        { name: 'PlayStation Blog', fetcher: playstation_1.fetchPlaystationNews },
        { name: 'Xbox Wire', fetcher: xbox_1.fetchXboxNews },
        { name: 'Nintendo News', fetcher: nintendo_1.fetchNintendoNews },
        { name: 'Steam News', fetcher: steam_1.fetchSteamNews },
        { name: 'Epic Games News', fetcher: epic_1.fetchEpicNews },
        { name: 'Franchises (EA/COD/Fortnite/LoL/Valorant/Minecraft)', fetcher: franchises_1.fetchFranchisesNews }
    ];
    let totalSynced = 0;
    let errorsCount = 0;
    // Execute tasks in parallel with Promise.allSettled
    const results = await Promise.allSettled(tasks.map(async (task) => {
        const taskStart = Date.now();
        let docs = [];
        let errorMessage = null;
        try {
            docs = await task.fetcher();
        }
        catch (err) {
            errorMessage = err.message || 'Unknown source fetch error';
            errorsCount++;
            logger_1.Logger.error(`Error fetching source [${task.name}]: ${errorMessage}`);
        }
        const taskDuration = Date.now() - taskStart;
        let newlySavedCount = 0;
        for (const doc of docs) {
            const saved = await (0, firestoreService_1.saveNewsDocument)(doc);
            if (saved) {
                newlySavedCount++;
                // Trigger Push notification for newly saved news
                (0, notificationService_1.sendNewsNotification)({
                    newsId: doc.id,
                    title: doc.title,
                    summary: doc.summary,
                    category: doc.category,
                    url: doc.url,
                    image: doc.image
                }).catch((e) => logger_1.Logger.error(`Notification background trigger error: ${e.message}`));
            }
        }
        // Record log in sync_logs collection
        await (0, firestoreService_1.recordSyncLog)({
            fonte: task.name,
            quantidadeNoticias: newlySavedCount,
            tempoExecucaoMs: taskDuration,
            erros: errorMessage,
            data: new Date().toISOString()
        });
        return newlySavedCount;
    }));
    for (const res of results) {
        if (res.status === 'fulfilled') {
            totalSynced += res.value;
        }
    }
    const totalDuration = Date.now() - startTime;
    const status = errorsCount === 0 ? 'success' : errorsCount < tasks.length ? 'partial' : 'error';
    await (0, firestoreService_1.updateSystemSyncStatus)({
        ultimaSincronizacao: new Date().toISOString(),
        tempo: totalDuration,
        status,
        quantidadeSincronizada: totalSynced
    });
    logger_1.Logger.info(`News sync completed in ${totalDuration}ms. Total new articles saved: ${totalSynced}. Status: ${status}`);
    return {
        totalSynced,
        durationMs: totalDuration,
        sourcesProcessed: tasks.length,
        errorsCount
    };
}
//# sourceMappingURL=newsService.js.map