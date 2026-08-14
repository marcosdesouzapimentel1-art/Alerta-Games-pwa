import React, { useState, useEffect } from 'react';
import { BannerPrincipal } from '../components/BannerPrincipal';
import { CardNoticia } from '../components/CardNoticia';
import { CardPromocao } from '../components/CardPromocao';
import { CardLancamento } from '../components/CardLancamento';
import { mockHeroBanners, mockReleases } from '../data/mockData';
import { Flame, Newspaper, Rocket, ArrowRight, Sparkles, SlidersHorizontal } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { NEWS_CATEGORIES, getNewsFromFirestore } from '../services/newsService';
import { NewsArticle, Promotion } from '../types';
import { getCollection } from '../services/firestore';

export const InicioView: React.FC = () => {
  const { setActiveTab, setSelectedCategory } = useApp();
  const { userProfile } = useAuth();

  const [selectedNewsCategory, setSelectedNewsCategory] = useState<string>('Todas');
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState<boolean>(true);
  
  // Estado para guardar as promoções reais
  const [flashDeals, setFlashDeals] = useState<Promotion[]>([]);
  const [isDealsLoading, setIsDealsLoading] = useState<boolean>(true);

  const userInterests = userProfile?.gamePreferences || [];

  // Busca Notícias e Promoções reais ao carregar a tela
  useEffect(() => {
    let isMounted = true;
    setIsNewsLoading(true);
    
    // Busca as Notícias
    getNewsFromFirestore({
      category: selectedNewsCategory,
      pageSize: 6,
    }).then((res) => {
      if (isMounted) {
        setNewsArticles(res.articles);
        setIsNewsLoading(false);
      }
    }).catch(() => {
      if (isMounted) setIsNewsLoading(false);
    });

    // Busca as Ofertas reais do Firestore
    getCollection<Promotion>('deals').then((deals) => {
      if (isMounted) {
        // Ordena para pegar os maiores descontos primeiro
        const sortedDeals = deals.sort((a, b) => b.discountPercent - a.discountPercent);
        setFlashDeals(sortedDeals);
        setIsDealsLoading(false);
      }
    }).catch(() => {
      if (isMounted) setIsDealsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedNewsCategory]);

  const handleSeeAllNews = () => {
    setActiveTab('noticias');
  };

  const handleSeeAllDeals = () => {
    setSelectedCategory('Ofertas');
    setActiveTab('promocoes'); // Corrigido para levar para a aba certa
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* Personalized Feed Banner if User Profile has Interests */}
      {userInterests.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-cyan-400 font-mono uppercase block">Feed Personalizado</span>
              <p className="text-xs text-slate-200 font-medium truncate">
                Mostrando ofertas e notícias para:{' '}
                <span className="font-bold text-cyan-300">{userInterests.join(', ')}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('perfil')}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Ajustar</span>
          </button>
        </div>
      )}

      {/* Hero Banner Section */}
      <section>
        <BannerPrincipal banners={mockHeroBanners} />
      </section>

      {/* Flash Deals Section (Agora com dados 100% Reais) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Flame className="w-5 h-5 fill-current animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black font-heading text-slate-100 flex items-center gap-2">
                Promoções Relâmpago
              </h2>
              <p className="text-xs text-slate-400">Menores preços do dia na Steam, PS Store e parceiros</p>
            </div>
          </div>

          <button
            onClick={handleSeeAllDeals}
            className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
          >
            <span>Ver Todas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Deals Grid - Renderiza só 4 itens */}
        {isDealsLoading ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : flashDeals.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-xs text-slate-400">
            Nenhuma promoção relâmpago ativa no momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {flashDeals.slice(0, 4).map((deal) => (
              <CardPromocao key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </section>

      {/* Latest News Section */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black font-heading text-slate-100">
                Últimas Notícias Gamer
              </h2>
              <p className="text-xs text-slate-400">Sincronizadas automaticamente do Firestore</p>
            </div>
          </div>

          <button
            onClick={handleSeeAllNews}
            className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer shrink-0"
          >
            <span>Ver Central de Notícias</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* News Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {NEWS_CATEGORIES.slice(0, 8).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedNewsCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedNewsCategory === cat
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
          <button
            onClick={handleSeeAllNews}
            className="px-3 py-1 rounded-xl text-xs font-bold text-cyan-400 bg-slate-900/60 hover:bg-slate-800 border border-cyan-500/30 whitespace-nowrap cursor-pointer"
          >
            + Ver Todas
          </button>
        </div>

        {/* News Grid */}
        {isNewsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 space-y-3 animate-pulse">
                <div className="h-40 w-full bg-slate-800 rounded-xl" />
                <div className="h-4 w-3/4 bg-slate-800 rounded" />
                <div className="h-3 w-full bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        ) : newsArticles.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-xs text-slate-400">
            Nenhuma notícia cadastrada nesta categoria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {newsArticles.map((news) => (
              <CardNoticia key={news.id} news={news} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Releases Section */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black font-heading text-slate-100">
                Lançamentos Mais Aguardados
              </h2>
              <p className="text-xs text-slate-400">Ative o lembrete para não perder o dia do lançamento</p>
            </div>
          </div>
        </div>

        {/* Releases Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockReleases.map((release) => (
            <CardLancamento key={release.id} release={release} />
          ))}
        </div>
      </section>

    </div>
  );
};
