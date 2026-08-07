import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../lib/firebase';
import { fetchRawgNews } from './rawg';
import { fetchRssFeed, RSS_FEEDS } from './rss';
import { deduplicateArticles, NewsArticleInput } from '../utils/deduplicate';
import { processArticleWithGemini, GeminiNewsAnalysis } from './gemini';
import { formatArticleTranslation } from './translator';
import { normalizeCategory, processKeywords } from './classifier';
import { generateSeoData } from './seo';
import { createPushNotificationDoc } from './notifier';

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
 * Gerar IDs válidos no Firestore (sem barras ou caracteres especiais)
 */
function sanitizeDocId(rawId: string | undefined, fallbackUrl: string): string {
  const target = rawId || fallbackUrl || String(Date.now());
  return target
    .replace(/https?:\/\//gi, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(-100);
}

/**
 * Executa chamadas assíncronas em lotes
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

export async function runNewsSync(maxArticlesPerSync: number = 5): Promise<NewsSyncResult> {
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

  // 3. Obter notícias existentes na coleção "news" para deduplicação
  console.log("Lendo coleção news no Firestore...");
  let existingDocs: any[] = [];

  try {
    const existingSnapshot = await db.collection("news").limit(350).get();
    existingDocs = existingSnapshot.docs;
  } catch (err: any) {
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
  const { uniqueArticles, duplicatesCount } = deduplicateArticles(fetchedArticles, existingItems);

  // Limita o lote de envio ao Gemini por execução (padrão: 5 matérias)
  const articlesToProcess = uniqueArticles.slice(0, maxArticlesPerSync);

  // 5. Processamento via Google Gemini AI
  let geminiProcessed = 0;
  let geminiErrors = 0;
  let tokensUsed = 0;
  const translationStartMs = Date.now();

  console.log(`Iniciando Gemini para lote de ${articlesToProcess.length} notícias (total pendentes: ${uniqueArticles.length})...`);
  
  const geminiResults = await processBatchInParallel(
    articlesToProcess,
    1, // Processa de 1 em 1 para garantir estabilidade de cota
    async (article) => {
      try {
        await new Promise((res) => setTimeout(res, 300));
        const analysis = await processArticleWithGemini(article);
        if (analysis) {
          geminiProcessed++;
          tokensUsed += analysis.tokensUsed || 0;
          return { article, analysis };
        } else {
          geminiErrors++;
          return null;
        }
      } catch (gemErr) {
        geminiErrors++;
        return null;
      }
    }
  );

  // Filtra falhas do Gemini
  const validResults = geminiResults.filter(
    (item): item is { article: NewsArticleInput; analysis: GeminiNewsAnalysis } => item !== null
  );

  console.log(`Gemini finalizado. Processadas: ${geminiProcessed} | Erros: ${geminiErrors}`);
  const translationTime = Date.now() - translationStartMs;

  // 6. Gravar matérias traduzidas no Firestore "news"
  let totalAdded = 0;

  if (validResults.length > 0) {
    const batch = db.batch();

    for (const { article, analysis } of validResults) {
      const translationData = formatArticleTranslation(article, analysis);
      const finalCategory = normalizeCategory(analysis?.category, article.category);
      const keywords = processKeywords(analysis?.keywords, translationData.titlePt, article.source);
      const importance = typeof analysis?.importance === 'number' ? analysis.importance : 50;
      const shouldNotify = Boolean(analysis?.shouldNotify);
      const seoData = generateSeoData(translationData.titlePt, translationData.summaryPt, analysis);

      const docId = sanitizeDocId(article.id, article.url);
      const docRef = db.collection('news').doc(docId);

      batch.set(
        docRef,
        {
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

          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      totalAdded++;

      if (shouldNotify) {
        createPushNotificationDoc(db, {
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
    } catch (commitErr: any) {
      console.error("Erro ao efetuar batch.commit() no Firestore:", commitErr?.message || commitErr);
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

  // 7. Salvar log de execução no Firestore
  try {
    await db.collection("news_sync_logs").add({
      ...result,
      createdAt: FieldValue.serverTimestamp()
    });
  } catch (err: any) {
    console.error("Erro ao gravar log em news_sync_logs:", err?.message || err);
  }

  return result;
}
