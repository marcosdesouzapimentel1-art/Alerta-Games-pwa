/**
 * Triggers the Cloud Function v2 syncNewsManual via HTTP request
 */
export const triggerCloudFunctionNewsSync = async (): Promise<{
  syncedCount: number;
  totalArticles: number;
  log: SyncLog;
}> => {
  // URL oficial v2 no Cloud Run em southamerica-east1
  const OFFICIAL_CLOUD_RUN_URL = 'https://syncnewsmanual-j3zyulq6mq-rj.a.run.app';

  const functionUrl =
    import.meta.env.VITE_SYNC_NEWS_FUNCTION_URL || OFFICIAL_CLOUD_RUN_URL;

  const candidateUrls = [
    functionUrl,
    OFFICIAL_CLOUD_RUN_URL,
    'https://us-central1-alerta-game.cloudfunctions.net/syncNewsManual'
  ];

  let lastError: Error | null = null;

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          const data = json.data;
          const log: SyncLog = {
            id: `cf_sync_${Date.now()}`,
            timestamp: data.completedAt || new Date().toISOString(),
            sourcesAttempted: Array.isArray(data.sourcesQueried) ? data.sourcesQueried.length : 7,
            sourcesSuccessful: Array.isArray(data.sourcesQueried)
              ? data.sourcesQueried.filter((s: any) => s.status === 'success').map((s: any) => s.sourceName)
              : [],
            sourcesFailed: Array.isArray(data.sourcesQueried)
              ? data.sourcesQueried.filter((s: any) => s.status === 'error').map((s: any) => ({ source: s.sourceName, error: s.error || '' }))
              : [],
            articlesFound: data.totalFound ?? 0,
            newArticlesCount: data.totalAdded ?? 0,
            duplicatesCount: data.duplicatesCount ?? 0,
            errorsCount: Array.isArray(data.errors) ? data.errors.length : 0,
            totalArticlesCount: data.totalFound ?? 0,
            trigger: 'manual',
            adminEmail: 'Cloud Function v2'
          };

          return {
            syncedCount: data.totalAdded ?? 0,
            totalArticles: data.totalFound ?? 0,
            log,
          };
        }
      }
    } catch (err: any) {
      console.warn(`Tentativa de chamada para Cloud Function na URL ${url} falhou:`, err.message);
      lastError = err;
    }
  }

  // Fallback to client-side aggregator if Cloud Function endpoint is not reachable during local dev
  try {
    console.info('Executando sincronização de contingência...');
    const log = await newsAggregator.runSync('manual');
    return {
      syncedCount: log.newArticlesCount,
      totalArticles: log.totalArticlesCount,
      log,
    };
  } catch (fallbackErr) {
    throw lastError || fallbackErr;
  }
};
