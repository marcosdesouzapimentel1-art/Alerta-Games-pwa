"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDuplicateNews = isDuplicateNews;
exports.saveNewsDocument = saveNewsDocument;
exports.recordSyncLog = recordSyncLog;
exports.updateSystemSyncStatus = updateSystemSyncStatus;
exports.getSyncStatsOverview = getSyncStatsOverview;
const firebase_1 = require("../firebase");
const parser_1 = require("../utils/parser");
const logger_1 = require("../utils/logger");
async function isDuplicateNews(id, url, rawTitle) {
    try {
        // 1. Check by ID
        const docById = await firebase_1.db.collection('news').doc(id).get();
        if (docById.exists)
            return true;
        // 2. Check by URL
        const urlQuery = await firebase_1.db.collection('news').where('url', '==', url).limit(1).get();
        if (!urlQuery.empty)
            return true;
        // 3. Check by normalized title
        const norm = (0, parser_1.normalizeTitle)(rawTitle);
        if (norm) {
            const titleQuery = await firebase_1.db.collection('news').where('normalizedTitle', '==', norm).limit(1).get();
            if (!titleQuery.empty)
                return true;
        }
        return false;
    }
    catch (error) {
        logger_1.Logger.error(`Error checking deduplication for ${url}: ${error.message}`);
        return false;
    }
}
async function saveNewsDocument(news) {
    try {
        const isDup = await isDuplicateNews(news.id, news.url, news.title);
        if (isDup) {
            logger_1.Logger.debug(`Skipping duplicate news: ${news.title}`);
            return false;
        }
        const payload = {
            ...news,
            normalizedTitle: (0, parser_1.normalizeTitle)(news.title)
        };
        await firebase_1.db.collection('news').doc(news.id).set(payload);
        return true;
    }
    catch (error) {
        logger_1.Logger.error(`Failed to save news document ${news.id}: ${error.message}`);
        return false;
    }
}
async function recordSyncLog(log) {
    try {
        await firebase_1.db.collection('sync_logs').add(log);
    }
    catch (error) {
        logger_1.Logger.error(`Failed to record sync log: ${error.message}`);
    }
}
async function updateSystemSyncStatus(statusDoc) {
    try {
        await firebase_1.db.collection('system').doc('news_sync').set(statusDoc, { merge: true });
    }
    catch (error) {
        logger_1.Logger.error(`Failed to update system/news_sync document: ${error.message}`);
    }
}
async function getSyncStatsOverview() {
    try {
        const newsSnap = await firebase_1.db.collection('news').select().get();
        const totalNews = newsSnap.size;
        const systemDoc = await firebase_1.db.collection('system').doc('news_sync').get();
        const systemData = systemDoc.data() || {};
        const recentLogsSnap = await firebase_1.db.collection('sync_logs')
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
    }
    catch (error) {
        logger_1.Logger.error(`Error fetching sync stats overview: ${error.message}`);
        return {
            totalNews: 0,
            lastSync: null,
            error: error.message
        };
    }
}
//# sourceMappingURL=firestoreService.js.map