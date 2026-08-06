"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runNewsSync = runNewsSync;
const firestore_1 = require("firebase-admin/firestore");
const index_1 = require("../index"); // Instância configurada do Firestore no index.ts
const rawg_1 = require("./rawg");
const rss_1 = require("./rss");
const deduplicate_1 = require("../utils/deduplicate");
const gemini_1 = require("./gemini");
const translator_1 = require("./translator");
const classifier_1 = require("./classifier");
const seo_1 = require("./seo");
const notifier_1 = require("./notifier");
/**
 * Gerar IDs válidos no Firestore (sem barras ou caracteres especiais)
 */
function sanitizeDocId(rawId, fallbackUrl) {
    const target = rawId || fallbackUrl || String(Date.now());
    return target
        .replace(/https?:\/\//gi, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(-100);
}
/**
 * Executa chamadas assíncronas em lotes
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
async function runNewsSync(maxArticlesPerSync = 5) {
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
    // 3. Obter notícias existentes na coleção "news" para deduplicação
    console.log("Lendo coleção news no Firestore...");
    let existingDocs = [];
    try {
        const existingSnapshot = await index_1.db.collection("news").limit(350).get();
        existingDocs = existingSnapshot.docs;
    }
    catch (err) {
        console.warn("AVISO AO LER COLEÇÃO NEWS (Avançando sem deduplicação):", err?.message || err);
    }
    const existingItems = existingDocs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            url: data.url || "",
            title: data.titleOriginal || data.title || ""
        };
    });
    // 4. Filtrar matérias inéditas
    const { uniqueArticles, duplicatesCount } = (0, deduplicate_1.deduplicateArticles)(fetchedArticles, existingItems);
    // Limita o lote de envio ao Gemini por execução (padrão: 5 matérias)
    const articlesToProcess = uniqueArticles.slice(0, maxArticlesPerSync);
    // 5. Processamento via Google Gemini AI
    let geminiProcessed = 0;
    let geminiErrors = 0;
    let tokensUsed = 0;
    const translationStartMs = Date.now();
    console.log(`Iniciando Gemini para lote de ${articlesToProcess.length} notícias (total pendentes: ${uniqueArticles.length})...`);
    const geminiResults = await processBatchInParallel(articlesToProcess, 1, // Processa de 1 em 1 para garantir estabilidade de cota
    async (article) => {
        try {
            await new Promise((res) => setTimeout(res, 300));
            const analysis = await (0, gemini_1.processArticleWithGemini)(article);
            if (analysis) {
                geminiProcessed++;
                tokensUsed += analysis.tokensUsed || 0;
                return { article, analysis };
            }
            else {
                geminiErrors++;
                return null;
            }
        }
        catch (gemErr) {
            geminiErrors++;
            return null;
        }
    });
    // Filtra falhas do Gemini
    const validResults = geminiResults.filter((item) => item !== null);
    console.log(`Gemini finalizado. Processadas: ${geminiProcessed} | Erros: ${geminiErrors}`);
    const translationTime = Date.now() - translationStartMs;
    // 6. Gravar matérias traduzidas no Firestore "news"
    let totalAdded = 0;
    if (validResults.length > 0) {
        const batch = index_1.db.batch();
        for (const { article, analysis } of validResults) {
            const translationData = (0, translator_1.formatArticleTranslation)(article, analysis);
            const finalCategory = (0, classifier_1.normalizeCategory)(analysis?.category, article.category);
            const keywords = (0, classifier_1.processKeywords)(analysis?.keywords, translationData.titlePt, article.source);
            const importance = typeof analysis?.importance === 'number' ? analysis.importance : 50;
            const shouldNotify = Boolean(analysis?.shouldNotify);
            const seoData = (0, seo_1.generateSeoData)(translationData.titlePt, translationData.summaryPt, analysis);
            const docId = sanitizeDocId(article.id, article.url);
            const docRef = index_1.db.collection('news').doc(docId);
            batch.set(docRef, {
                id: docId,
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
                createdAt: firestore_1.FieldValue.serverTimestamp(),
                updatedAt: firestore_1.FieldValue.serverTimestamp()
            }, { merge: true });
            totalAdded++;
            if (shouldNotify) {
                (0, notifier_1.createPushNotificationDoc)(index_1.db, {
                    title: translationData.titlePt,
                    body: translationData.summaryPt,
                    image: article.imageUrl || article.image || '',
                    url: article.url,
                    category: finalCategory,
                    importance,
                    source: article.source
                }).catch((err) => console.error('Erro ao registrar notificação push:', err));
            }
        }
        try {
            await batch.commit();
            console.log(`Sucesso: ${totalAdded} matérias salvas no Firestore.`);
        }
        catch (commitErr) {
            console.error("Erro ao efetuar batch.commit() no Firestore:", commitErr?.message || commitErr);
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
    // 7. Salvar log de execução no Firestore
    try {
        await index_1.db.collection("news_sync_logs").add({
            ...result,
            createdAt: firestore_1.FieldValue.serverTimestamp()
        });
    }
    catch (err) {
        console.error("Erro ao gravar log em news_sync_logs:", err?.message || err);
    }
    return result;
}
//# sourceMappingURL=newsSync.js.map