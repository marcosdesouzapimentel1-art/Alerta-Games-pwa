import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../lib/firebase';

// Desativado: import { fetchRawgNews } from './rawg';
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

function sanitizeDocId(rawId: string | undefined, fallbackUrl: string): string {
  const target = rawId || fallbackUrl || String(Date.now());
  return target
    .replace(/https?:\/\//gi, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(-100);
}

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

export async function runNewsSync(maxArticlesPerSync: number = 20): Promise<NewsSyncResult> {
  const startedAt = new Date().toISOString();
  const startTimeMs = Date.now();

  const fetchedArticles: NewsArticleInput[] = [];
  const errors: Array<{ source: string; message: string }> = [];
  const sourcesQueried: SourceQueryResult[] = [];

  // 1. RAWG API (Desativado para manter foco 100% em fontes brasileiras PT-BR)
  /*
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
  */

  // 2. Consultar RSS Feeds exclusivamente nacionais
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

  // 3. Obter notícias existentes para deduplicação
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
  const articlesToProcess = uniqueArticles.slice(0, maxArticlesPerSync);

  // 5. Processamento (Notícias pt-BR pulam o Gemini e gastam 0 tokens)
  let geminiProcessed = 0;
  let geminiErrors = 0;
  let tokensUsed = 0;
  const translationStartMs = Date.now();

  console.log(`Iniciando processamento para lote de ${articlesToProcess.length} notícias (total pendentes: ${uniqueArticles.length})...`);

  const geminiResults = await processBatchInParallel(
    articlesToProcess,
    1,
    async (article) => {
      // Se a fonte for pt-BR, ignora chamada ao Gemini (Custo R$ 0,00)
      if (article.language === 'pt-BR') {
        return { article, analysis: null, isNativePt: true };
      }

      try {
        await new Promise((res) => setTimeout(res, 300));

        const MAX_INPUT_CHARS = 1200;
        const rawContent = article.content || article.summary || '';
        const truncatedContent = rawContent.length > MAX_INPUT_CHARS
          ? rawContent.substring(0, MAX_INPUT_CHARS) + '...'
          : rawContent;

        const truncatedArticle: NewsArticleInput = {
          ...article,
          content: truncatedContent
        };

        const analysis = await processArticleWithGemini(truncatedArticle);

        if (analysis) {
          geminiProcessed++;
          tokensUsed += analysis.tokensUsed || 0;
          return { article, analysis, isNativePt: false };
        } else {
          console.warn(`[Gemini Warn] Análise retornou nulo para a matéria ${article.id}. Utilizando fallback local.`);
          geminiErrors++;
          return { article, analysis: null, isNativePt: false };
        }
      } catch (gemErr: any) {
        console.error(`[Gemini Error] Falha de execução na matéria ${article.id}:`, gemErr?.message || gemErr);
        geminiErrors++;
        return { article, analysis: null, isNativePt: false };
      }
    }
  );

  const translationTime = Date.now() - translationStartMs;

  // 6. Gravar matérias no Firestore "news"
  let totalAdded = 0;

  if (geminiResults.length > 0) {
    const batch = db.batch();

    for (const { article, analysis, isNativePt } of geminiResults) {
      let translationData;

      if (isNativePt) {
        // Matéria nativa BR: Formatação direta sem gasto de cota/tokens
        translationData = {
          titlePt: article.title,
          summaryPt: article.summary || article.content || '',
          contentPt: article.content || article.summary || '',
          titleOriginal: article.title,
          descriptionOriginal: article.summary || '',
          contentOriginal: article.content || '',
          translatedAt: new Date().toISOString(),
          geminiVersion: 'native-pt-br'
        };
      } else if (analysis) {
        translationData = formatArticleTranslation(article, analysis);
      } else {
        translationData = {
          titlePt: article.title,
          summaryPt: article.summary || article.content || '',
          contentPt: article.content || article.summary || '',
          titleOriginal: article.title,
          descriptionOriginal: article.summary || '',
          contentOriginal: article.content || '',
          translatedAt: new Date().toISOString(),
          geminiVersion: 'fallback-offline'
        };
      }

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
          content: translationData.contentPt,
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
          contentPt: translationData.contentPt,
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
