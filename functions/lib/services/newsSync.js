"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runNewsSync = runNewsSync;
const admin = __importStar(require("firebase-admin"));
const rawg_1 = require("./rawg");
const rss_1 = require("./rss");
const deduplicate_1 = require("../utils/deduplicate");
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
async function runNewsSync() {
    const startedAt = new Date().toISOString();
    const startTimeMs = Date.now();
    const fetchedArticles = [];
    const errors = [];
    const sourcesQueried = [];
    // 1. RAWG API
    try {
        const rawgArticles = await (0, rawg_1.fetchRawgNews)();
        fetchedArticles.push(...rawgArticles);
        sourcesQueried.push({
            sourceName: 'RAWG API',
            foundCount: rawgArticles.length,
            status: 'success'
        });
    }
    catch (err) {
        const errMsg = err.message || 'Erro RAWG API';
        errors.push({ source: 'RAWG API', message: errMsg });
        sourcesQueried.push({
            sourceName: 'RAWG API',
            foundCount: 0,
            status: 'error',
            error: errMsg
        });
    }
    // 2. RSS Feeds
    for (const feed of rss_1.RSS_FEEDS) {
        try {
            const articles = await (0, rss_1.fetchRssFeed)(feed);
            fetchedArticles.push(...articles);
            sourcesQueried.push({
                sourceName: feed.sourceName,
                foundCount: articles.length,
                status: 'success'
            });
        }
        catch (err) {
            const errMsg = err.message || 'Erro RSS Feed';
            errors.push({ source: feed.sourceName, message: errMsg });
            sourcesQueried.push({
                sourceName: feed.sourceName,
                foundCount: 0,
                status: 'error',
                error: errMsg
            });
        }
    }
    const totalFound = fetchedArticles.length;
    // 3. Obter artigos existentes no Firestore "news" para deduplicação
    const existingSnapshot = await db
        .collection('news')
        .orderBy('publishedAt', 'desc')
        .limit(300)
        .get();
    const existingItems = existingSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            url: data.url || '',
            title: data.title || ''
        };
    });
    // 4. Filtrar inéditas com deduplicação (URL, Título e ID)
    const { uniqueArticles, duplicatesCount } = (0, deduplicate_1.deduplicateArticles)(fetchedArticles, existingItems);
    // 5. Salvar notícias inéditas na coleção "news"
    let totalAdded = 0;
    if (uniqueArticles.length > 0) {
        const chunks = [];
        for (let i = 0; i < uniqueArticles.length; i += 400) {
            chunks.push(uniqueArticles.slice(i, i + 400));
        }
        for (const chunk of chunks) {
            const batch = db.batch();
            for (const article of chunk) {
                const docRef = db.collection('news').doc(article.id);
                batch.set(docRef, {
                    id: article.id,
                    title: article.title,
                    summary: article.summary,
                    content: article.content || article.summary,
                    url: article.url,
                    imageUrl: article.imageUrl || article.image || '',
                    image: article.imageUrl || article.image || '',
                    source: article.source,
                    category: article.category,
                    publishedAt: article.publishedAt,
                    readTimeMinutes: article.readTimeMinutes || 3,
                    views: 0,
                    likes: 0,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }
            await batch.commit();
            totalAdded += chunk.length;
        }
    }
    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startTimeMs;
    const status = errors.length === 0
        ? 'success'
        : errors.length < sourcesQueried.length
            ? 'partial'
            : 'error';
    const result = {
        startedAt,
        completedAt,
        durationMs,
        totalFound,
        totalAdded,
        duplicatesCount,
        errors,
        sourcesQueried,
        status
    };
    // 6. Registrar estatísticas na coleção "news_sync_logs"
    try {
        await db.collection('news_sync_logs').add({
            startedAt,
            completedAt,
            durationMs,
            totalFound,
            totalAdded,
            duplicatesCount,
            errors,
            sourcesQueried,
            status,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    catch (logErr) {
        console.error('Erro ao salvar em news_sync_logs:', logErr.message);
    }
    return result;
}
//# sourceMappingURL=newsSync.js.map