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
const gemini_1 = require("./gemini");
const translator_1 = require("./translator");
const classifier_1 = require("./classifier");
const seo_1 = require("./seo");
const notifier_1 = require("./notifier");
// Inicialização explícita apontando para o projeto e banco correto
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'alerta-game'
    });
}
const db = admin.firestore();
try {
    db.settings({ databaseId: '(default)', ignoreUndefinedProperties: true });
}
catch (e) {
    // Ignora se as configurações já tiverem sido aplicadas
}
/**
 * Executa chamadas assíncronas em lotes paralelos controlados
 */
async function processBatchInParallel(items, batchSize, processor) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map((item) => processor(item)));
        results.push(...batchResults);
    }
    return results;
}
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
    // 3. Obter notícias existentes na coleção "news" com fallback de segurança
    console.log("Lendo coleção news...");
    let existingDocs = [];
    try {
        const existingSnapshot = await db
            .collection("news")
            .limit(350)
            .get();
        existingDocs = existingSnapshot.docs;
        console.log(`Coleção news carregada. Documentos: ${existingDocs.length}`);
    }
    catch (err) {
        console.error("AVISO AO LER COLEÇÃO NEWS (Bypassing deduplication):", err?.message || err);
    }
    const existingItems = existingDocs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            url: data.url || "",
            title: data.titleOriginal || data.title || ""
        };
    });
    console.log(`existingItems criado: ${existingItems.length}`);
    // 4. Filtrar matérias inéditas (deduplicação por URL, título e ID)
    const { uniqueArticles, duplicatesCount } = (0, deduplicate_1.deduplicateArticles)(fetchedArticles, existingItems);
    // 5. Processamento via Google Gemini AI
    let geminiProcessed = 0;
    let geminiErrors = 0;
    let tokensUsed = 0;
    const translationStartMs = Date.now();
    console.log("Iniciando processamento Gemini...");
    const geminiResults = await processBatchInParallel(uniqueArticles, 3, async (article) => {
        try {
            const analysis = await (0, gemini_1.processArticleWithGemini)(article);
            if (analysis) {
                geminiProcessed++;
                tokensUsed += analysis.tokensUsed || 0;
                return { article, analysis };
            }
            else {
                geminiErrors++;
                return { article, analysis: null };
            }
        }
        catch (gemErr) {
            geminiErrors++;
            return { article, analysis: null };
        }
    });
    console.log(`Gemini finalizado. Processadas: ${geminiProcessed} | Erros: ${geminiErrors}`);
    const translationTime = Date.now() - translationStartMs;
    // 6. Preparar e gravar matérias traduzidas e enriquecidas no Firestore "news"
    let totalAdded = 0;
    if (geminiResults.length > 0) {
        const chunks = [];
        for (let i = 0; i < geminiResults.length; i += 300) {
            chunks.push(geminiResults.slice(i, i + 300));
        }
        for (const chunk of chunks) {
            const batch = db.batch();
            for (const { article, analysis } of chunk) {
                const translationData = (0, translator_1.formatArticleTranslation)(article, analysis);
                const finalCategory = (0, classifier_1.normalizeCategory)(analysis?.category, article.category);
                const keywords = (0, classifier_1.processKeywords)(analysis?.keywords, translationData.titlePt, article.source);
                const importance = typeof analysis?.importance === 'number' ? analysis.importance : 50;
                const shouldNotify = Boolean(analysis?.shouldNotify);
                const seoData = (0, seo_1.generateSeoData)(translationData.titlePt, translationData.summaryPt, analysis);
                const docRef = db.collection('news').doc(article.id);
                batch.set(docRef, {
                    id: article.id,
                    // Campos legados
                    title: translationData.titlePt,
                    summary: translationData.summaryPt,
                    content: translationData.summaryPt,
                    url: article.url,
                    imageUrl: article.imageUrl || article.image || '',
                    image: article.imageUrl || article.image || '',
                    source: article.source,
                    category: finalCategory,
                    publishedAt: article.publishedAt,
                    readTimeMinutes: article.readTimeMinutes || 3,
                    views: 0,
                    likes: 0,
                    // Novos campos Gemini AI
                    titleOriginal: translationData.titleOriginal,
                    descriptionOriginal: translationData.descriptionOriginal,
                    contentOriginal: translationData.contentOriginal,
                    titlePt: translationData.titlePt,
                    summaryPt: translationData.summaryPt,
                    keywords,
                    importance,
                    shouldNotify,
                    seoTitle: seoData.seoTitle,
                    seoDescription: seoData.seoDescription,
                    translatedAt: translationData.translatedAt,
                    geminiVersion: translationData.geminiVersion,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                if (shouldNotify) {
                    (0, notifier_1.createPushNotificationDoc)(db, {
                        title: translationData.titlePt,
                        body: translationData.summaryPt,
                        image: article.imageUrl || article.image || '',
                        url: article.url,
                        category: finalCategory,
                        importance,
                        source: article.source
                    }).catch((err) => console.error('Erro na gravação assíncrona de notificação:', err));
                }
            }
            await batch.commit();
            totalAdded += chunk.length;
        }
    }
    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startTimeMs;
    const executionTime = durationMs;
    const status = errors.length === 0
        ? 'success'
        : errors.length < sourcesQueried.length
            ? 'partial'
            : 'error';
    const result = {
        startedAt,
        completedAt,
        durationMs,
        executionTime,
        totalFound,
        totalAdded,
        duplicatesCount,
        geminiProcessed,
        geminiErrors,
        translationTime,
        tokensUsed,
        errors,
        sourcesQueried,
        status
    };
    // 7. Salvar estatísticas completas na coleção "news_sync_logs"
    try {
        const logRef = await db.collection("news_sync_logs").add({
            startedAt,
            completedAt,
            durationMs,
            executionTime,
            totalFound,
            totalAdded,
            duplicatesCount,
            geminiProcessed,
            geminiErrors,
            translationTime,
            tokensUsed,
            errors,
            sourcesQueried,
            status,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log("Log salvo com sucesso:", logRef.id);
    }
    catch (err) {
        console.error("Erro ao salvar news_sync_logs:");
        console.error(err);
    }
    return result;
}
//# sourceMappingURL=newsSync.js.map