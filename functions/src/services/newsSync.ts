import * as admin from 'firebase-admin';
import { fetchRawgNews } from './rawg';
import { fetchRssFeed, RSS_FEEDS } from './rss';
import { deduplicateArticles, NewsArticleInput } from '../utils/deduplicate';
import { processArticleWithGemini, GeminiNewsAnalysis } from './gemini';
import { formatArticleTranslation } from './translator';
import { normalizeCategory, processKeywords } from './classifier';
import { generateSeoData } from './seo';
import { createPushNotificationDoc } from './notifier';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export interface SourceQueryResult {
  sourceName: string;
  foundCount: number;
  status: 'success' | 'error';
  error?: string;
}

export interface NewsSyncResult {
  startedAt: string;
  completedAt: string;
  durationMs: number;
  executionTime: number;
  totalFound: number;
  totalAdded: number;
  duplicatesCount: number;
  geminiProcessed: number;
  geminiErrors: number;
  translationTime: number;
  tokensUsed: number;
  errors: Array<{ source: string; message: string }>;
  sourcesQueried: SourceQueryResult[];
  status: 'success' | 'partial' | 'error';
}

/**
 * Executa chamadas assíncronas em lotes paralelos controlados
 */
async function processBatchInParallel<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((item) => processor(item)));
    results.push(...batchResults);
  }
  return results;
}

export async function runNewsSync(): Promise<NewsSyncResult> {
  const startedAt = new Date().toISOString();
  const startTimeMs = Date.now();

  const fetchedArticles: NewsArticleInput[] = [];
  const errors: Array<{ source: string; message: string }> = [];
  const sourcesQueried: SourceQueryResult[] = [];

  // 1. RAWG API
  try {
    const rawgArticles = await fetchRawgNews();
    fetchedArticles.push(...rawgArticles);
    sourcesQueried.push({
      sourceName: 'RAWG API',
      foundCount: rawgArticles.length,
      status: 'success'
    });
  } catch (err: any) {
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
  for (const feed of RSS_FEEDS) {
    try {
      const articles = await fetchRssFeed(feed);
      fetchedArticles.push(...articles);
      sourcesQueried.push({
        sourceName: feed.sourceName,
        foundCount: articles.length,
        status: 'success'
      });
    } catch (err: any) {
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

  // 3. Obter notícias existentes na coleção "news" para deduplicação e verificação de cache
console.log("Lendo coleção news...");

let existingSnapshot;

try {
  existingSnapshot = await db
    .collection("news")
    .limit(350)
    .get();

  console.log(`Coleção news carregada. Documentos: ${existingSnapshot.size}`);
} catch (err: any) {
  console.error("ERRO AO LER A COLEÇÃO NEWS", err);
  throw err;
}
console.log("PASSOU DA LEITURA DO FIRESTORE");
  
const existingItems = existingSnapshot.docs.map((doc) => {
  const data = doc.data();

  return {
    id: doc.id,
    url: data.url || "",
    title: data.titleOriginal || data.title || ""
  };
});

console.log(`existingItems criado: ${existingItems.length}`);

  // 4. Filtrar matérias inéditas (deduplicação por URL, título e ID)
  const { uniqueArticles, duplicatesCount } = deduplicateArticles(fetchedArticles, existingItems);

  // 5. Processamento via Google Gemini AI
  let geminiProcessed = 0;
  let geminiErrors = 0;
  let tokensUsed = 0;
  const translationStartMs = Date.now();

  // Processar em lotes paralelos de 3 itens para não exceder limites de taxa
  console.log("Iniciando processamento Gemini...");
  const geminiResults = await processBatchInParallel(
    uniqueArticles,
    3,
    async (article) => {
      try {
        const analysis = await processArticleWithGemini(article);
        if (analysis) {
          geminiProcessed++;
          tokensUsed += analysis.tokensUsed || 0;
          return { article, analysis };
        } else {
          geminiErrors++;
          return { article, analysis: null };
        }
      } catch (gemErr) {
        geminiErrors++;
        return { article, analysis: null };
      }
    }
  );
console.log(
  `Gemini finalizado. Processadas: ${geminiProcessed} | Erros: ${geminiErrors}`
);
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
        const translationData = formatArticleTranslation(article, analysis);
        const finalCategory = normalizeCategory(analysis?.category, article.category);
        const keywords = processKeywords(analysis?.keywords, translationData.titlePt, article.source);
        const importance = typeof analysis?.importance === 'number' ? analysis.importance : 50;
        const shouldNotify = Boolean(analysis?.shouldNotify);
        const seoData = generateSeoData(translationData.titlePt, translationData.summaryPt, analysis);

        const docRef = db.collection('news').doc(article.id!);

        batch.set(
          docRef,
          {
            id: article.id,
            // Campos legados (retrocompatibilidade com frontend React)
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
          },
          { merge: true }
        );

        // Se for marcado para notificação (shouldNotify == true), registrar na coleção "notifications"
        if (shouldNotify) {
          createPushNotificationDoc(db, {
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

  const status: 'success' | 'partial' | 'error' =
    errors.length === 0
      ? 'success'
      : errors.length < sourcesQueried.length
      ? 'partial'
      : 'error';

  const result: NewsSyncResult = {
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

} catch (err: any) {
  console.error("Erro ao salvar news_sync_logs:");
  console.error(err);
}

  return result;
}
