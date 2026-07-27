import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CardNoticia } from '../components/CardNoticia';
import { NEWS_CATEGORIES, getNewsFromFirestore, syncNewsFromExternalSources, newsAggregator, SyncLog } from '../services/newsService';
import { NewsArticle } from '../types';
import { useApp } from '../contexts/AppContext';
import {
  Newspaper,
  Search,
  X,
  RefreshCw,
  Clock,
  Sparkles,
  ChevronDown,
  Flame,
  CheckCircle2,
  AlertCircle,
  FileText,
  Activity,
  Radio,
} from 'lucide-react';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

export const NoticiasView: React.FC = () => {
  const { setSelectedNews, showToast } = useApp();

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  
  const [lastVisibleDoc, setLastVisibleDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  // Sync status and logs states
  const [minutesAgo, setMinutesAgo] = useState<number>(newsAggregator.getMinutesSinceLastSync());
  const [showLogsModal, setShowLogsModal] = useState<boolean>(false);
  const [recentLogs, setRecentLogs] = useState<SyncLog[]>(newsAggregator.getRecentLogs());

  // Pull to refresh states
  const [pullY, setPullY] = useState<number>(0);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const touchStartY = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load news from Firestore (initial load or silent refresh)
  const fetchNews = useCallback(async (category: string = 'Todas', search: string = '', silent: boolean = false) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const res = await getNewsFromFirestore({
        category,
        searchQuery: search,
        pageSize: 9,
        lastDocSnap: null,
      });

      setArticles(res.articles);
      setLastVisibleDoc(res.lastVisibleDoc);
      setHasMore(res.hasMore);
    } catch (error) {
      console.error('Erro ao carregar notícias:', error);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  // Pagination function using lastVisibleDoc
  const loadMoreNews = useCallback(async () => {
    if (!lastVisibleDoc || isFetchingMore || !hasMore) return;

    setIsFetchingMore(true);

    try {
      const res = await getNewsFromFirestore({
        category: selectedCategory,
        searchQuery,
        pageSize: 9,
        lastDocSnap: lastVisibleDoc,
      });

      setArticles((prev) => {
        const existingIds = new Set(prev.map((a) => a.id));
        const newUnique = res.articles.filter((a) => !existingIds.has(a.id));
        return [...prev, ...newUnique];
      });

      setLastVisibleDoc(res.lastVisibleDoc);
      setHasMore(res.hasMore);
    } catch (error) {
      console.error('Erro ao carregar mais notícias:', error);
    } finally {
      setIsFetchingMore(false);
    }
  }, [lastVisibleDoc, isFetchingMore, hasMore, selectedCategory, searchQuery]);

  // Maintain stable refs for real-time listeners & timers
  const fetchNewsRef = useRef(fetchNews);
  useEffect(() => {
    fetchNewsRef.current = fetchNews;
  }, [fetchNews]);

  const selectedCategoryRef = useRef(selectedCategory);
  const searchQueryRef = useRef(searchQuery);
  useEffect(() => {
    selectedCategoryRef.current = selectedCategory;
    searchQueryRef.current = searchQuery;
  }, [selectedCategory, searchQuery]);

  // Category and search filter changes
  useEffect(() => {
    fetchNews(selectedCategory, searchQuery, false);
  }, [selectedCategory, searchQuery, fetchNews]);

  // Setup background auto-sync and real-time listeners once on mount
  useEffect(() => {
    newsAggregator.startAutoSync(10);

    const unsubSync = newsAggregator.subscribeSync(() => {
      setMinutesAgo(newsAggregator.getMinutesSinceLastSync());
      setRecentLogs(newsAggregator.getRecentLogs());
      fetchNewsRef.current(selectedCategoryRef.current, searchQueryRef.current, true);
    });

    const unsubRealtime = newsAggregator.subscribeFirestoreNewsRealtime(() => {
      fetchNewsRef.current(selectedCategoryRef.current, searchQueryRef.current, true);
    });

    const intervalTimer = setInterval(() => {
      setMinutesAgo(newsAggregator.getMinutesSinceLastSync());
    }, 30000);

    return () => {
      unsubSync();
      unsubRealtime();
      clearInterval(intervalTimer);
    };
  }, []);

  // Manual Sync trigger
  const handleSyncNews = async () => {
    setIsSyncing(true);
    try {
      const res = await syncNewsFromExternalSources();
      setRecentLogs(newsAggregator.getRecentLogs());
      setMinutesAgo(0);

      if (res.syncedCount > 0) {
        showToast(`${res.syncedCount} nova(s) notícia(s) sincronizada(s)! 🚀`);
      } else {
        showToast('Notícias atualizadas! Nenhuma novidade no momento.');
      }

      await fetchNews(selectedCategory, searchQuery, true);
    } catch (error) {
      console.error('Erro ao sincronizar notícias:', error);
      showToast('Erro ao atualizar notícias. Fontes de contingência ativas.');
    } finally {
      setIsSyncing(false);
      setPullY(0);
      setIsPulling(false);
    }
  };

  // Touch handlers for Pull to Refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || window.scrollY > 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      setPullY(Math.min(diff * 0.4, 90));
    }
  };

  const handleTouchEnd = () => {
    if (pullY > 60) {
      handleSyncNews();
    } else {
      setPullY(0);
      setIsPulling(false);
    }
  };

  const heroArticle = articles.length > 0 ? articles[0] : null;
  const gridArticles = articles.length > 0 ? articles.slice(1) : [];

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="space-y-6 pb-20 relative min-h-screen"
    >
      {/* Pull to Refresh Visual Indicator */}
      {(pullY > 0 || isSyncing) && (
        <div
          style={{ height: `${isSyncing ? 60 : pullY}px` }}
          className="w-full flex items-center justify-center transition-all duration-200 overflow-hidden bg-slate-900/60 rounded-2xl border border-cyan-500/30 text-cyan-400 text-xs font-bold gap-2 my-2 shadow-lg"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>
            {isSyncing
              ? 'Sincronizando novas notícias automáticas...'
              : pullY > 60
              ? 'Solte para atualizar as notícias!'
              : 'Puxe para atualizar...'}
          </span>
        </div>
      )}

      {/* Screen Title & Quick Sync Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-4 sm:p-5 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/10">
            <Newspaper className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-heading text-slate-100 flex items-center gap-2">
              Central de Notícias
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wider flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" />
                Em Tempo Real
              </span>
            </h1>
            
            {/* Visual Indicator: Última atualização há X minutos */}
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {minutesAgo === 0
                  ? 'Última atualização agora mesmo'
                  : `Última atualização há ${minutesAgo} ${minutesAgo === 1 ? 'minuto' : 'minutos'}`}
              </span>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => setShowLogsModal(true)}
                className="text-cyan-400 hover:underline text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Activity className="w-3 h-3" />
                Logs de Sincronização
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleSyncNews}
          disabled={isSyncing}
          className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Atualizando...' : 'Sincronizar Notícias'}</span>
        </button>
      </div>

      {/* Sources Chips Summary */}
      <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between overflow-x-auto no-scrollbar gap-2 text-[11px] text-slate-400">
        <span className="font-bold text-slate-300 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          7 Fontes Agregadas:
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300">RAWG API</span>
          <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">IGN</span>
          <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">GameSpot</span>
          <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">VGC</span>
          <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-blue-300">PlayStation</span>
          <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-300">Xbox</span>
          <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-rose-300">Nintendo</span>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Pesquisar notícias, títulos, tags (ex: GTA 6, PS5, Steam)..."
          className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500 text-slate-100 placeholder-slate-500 text-xs sm:text-sm transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Chips Horizontal Filter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
          <span>Filtrar por Categoria ({NEWS_CATEGORIES.length - 1} disponíveis):</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 pt-1 px-1">
          {NEWS_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`py-2 px-3.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20 scale-105'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hero Main Banner (Highlighted Article) */}
      {!isLoading && heroArticle && !searchQuery && selectedCategory === 'Todas' && (
        <section
          onClick={() => setSelectedNews(heroArticle)}
          className="group relative h-80 sm:h-96 w-full rounded-3xl overflow-hidden border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer shadow-2xl bg-slate-950"
        >
          <img
            src={heroArticle.image || heroArticle.imageUrl}
            alt={heroArticle.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

          {/* Top Badges */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <span className="px-3 py-1 rounded-xl text-xs font-black uppercase bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
              Destaque
            </span>
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-950/80 backdrop-blur-md text-slate-300 border border-slate-800 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {heroArticle.readTimeMinutes || 3} min
            </span>
          </div>

          {/* Bottom Info Content */}
          <div className="absolute bottom-6 left-6 right-6 space-y-2">
            <div className="flex items-center gap-2 text-xs text-cyan-300 font-bold">
              <span className="px-2 py-0.5 rounded-lg bg-slate-900/80 border border-cyan-500/30 text-cyan-400 uppercase">
                {heroArticle.category}
              </span>
              <span>•</span>
              <span>{heroArticle.source}</span>
              <span>•</span>
              <span>{new Date(heroArticle.publishedAt).toLocaleDateString('pt-BR')}</span>
            </div>

            <h2 className="text-xl sm:text-3xl font-black font-heading text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-tight">
              {heroArticle.title}
            </h2>

            <p className="text-slate-300 text-xs sm:text-sm line-clamp-2 leading-relaxed">
              {heroArticle.summary}
            </p>
          </div>
        </section>
      )}

      {/* Skeleton Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 space-y-4 animate-pulse"
            >
              <div className="h-44 w-full bg-slate-800 rounded-xl" />
              <div className="h-4 w-1/3 bg-slate-800 rounded" />
              <div className="h-6 w-5/6 bg-slate-800 rounded" />
              <div className="h-4 w-full bg-slate-800 rounded" />
              <div className="flex items-center justify-between pt-2">
                <div className="h-4 w-20 bg-slate-800 rounded" />
                <div className="h-4 w-12 bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        /* Empty Search/Filter State */
        <div className="text-center py-16 px-4 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-3">
          <Newspaper className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-200">
            Nenhuma notícia encontrada
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Não encontramos matérias para a categoria ou termo pesquisado no momento.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('Todas');
              setSearchQuery('');
            }}
            className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-400 border border-slate-700 transition-colors cursor-pointer"
          >
            Limpar Filtros
          </button>
        </div>
      ) : (
        /* News Cards Grid */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(searchQuery || selectedCategory !== 'Todas' ? articles : gridArticles).map((news) => (
              <CardNoticia key={news.id} news={news} />
            ))}
          </div>

          {/* Infinite Pagination Controls */}
          {hasMore && (
            <div className="text-center pt-6">
              <button
                onClick={loadMoreNews}
                disabled={isFetchingMore}
                className="py-3 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-2 mx-auto shadow-lg hover:border-cyan-500/50 cursor-pointer"
              >
                {isFetchingMore ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>Carregando mais notícias...</span>
                  </>
                ) : (
                  <>
                    <span>Carregar Mais Notícias</span>
                    <ChevronDown className="w-4 h-4 text-cyan-400" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sync Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Logs de Sincronização em Tempo Real</h3>
              </div>
              <button
                onClick={() => setShowLogsModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              O sistema sincroniza automaticamente a cada 10 minutos consultando as APIs e feeds do RAWG, IGN, GameSpot, VGC, PlayStation, Xbox e Nintendo.
            </p>

            {recentLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/50 rounded-2xl border border-slate-800">
                Nenhum log registrado na sessão atual. Clique em "Sincronizar Notícias" para executar manualmente.
              </div>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-cyan-400 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5" />
                        Sincronização {log.trigger === 'automatic' ? 'Automática (10 min)' : 'Manual'}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-300">
                      <div>
                        Fontes com Sucesso: <strong className="text-emerald-400">{log.sourcesSuccessful.length}/{log.sourcesAttempted}</strong>
                      </div>
                      <div>
                        Novas Salvas: <strong className="text-cyan-400">{log.newArticlesCount}</strong>
                      </div>
                    </div>

                    {/* Successful Sources */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {log.sourcesSuccessful.map((src) => (
                        <span key={src} className="px-2 py-0.5 rounded-md bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          {src}
                        </span>
                      ))}
                      {log.sourcesFailed.map((item) => (
                        <span key={item.source} className="px-2 py-0.5 rounded-md bg-amber-950/40 text-amber-300 border border-amber-800/40 text-[10px] flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-400" />
                          {item.source} (Fallback Ativo)
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowLogsModal(false)}
                className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
