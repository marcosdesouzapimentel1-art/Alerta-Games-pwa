import React, { useState } from 'react';
import { BarraPesquisa } from '../components/BarraPesquisa';
import { mockNews, mockDeals, mockReleases } from '../data/mockData';
import { CardNoticia } from '../components/CardNoticia';
import { CardPromocao } from '../components/CardPromocao';
import { CardLancamento } from '../components/CardLancamento';
import { EmptyState } from '../components/EmptyState';
import { useApp } from '../contexts/AppContext';
import { Newspaper, Tag, Rocket } from 'lucide-react';

export const PesquisaView: React.FC = () => {
  const { searchQuery, setSearchQuery } = useApp();
  const [activeSearchTab, setActiveSearchTab] = useState<'all' | 'news' | 'deals' | 'releases'>('all');

  const query = searchQuery.toLowerCase().trim();

  const matchedNews = query
    ? mockNews.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.summary.toLowerCase().includes(query) ||
          n.category.toLowerCase().includes(query)
      )
    : mockNews;

  const matchedDeals = query
    ? mockDeals.filter(
        (d) =>
          d.gameTitle.toLowerCase().includes(query) ||
          d.store.toLowerCase().includes(query)
      )
    : mockDeals;

  const matchedReleases = query
    ? mockReleases.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.developer.toLowerCase().includes(query)
      )
    : mockReleases;

  const totalResults = matchedNews.length + matchedDeals.length + matchedReleases.length;

  return (
    <div className="space-y-6 pb-20">
      
      {/* Search Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-100 mb-1">
          Pesquisa Global
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Encontre notícias, promoções relâmpago, cupons e lançamentos
        </p>
      </div>

      {/* Search Bar Input */}
      <BarraPesquisa autoFocus />

      {/* Result Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSearchTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSearchTab === 'all'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Tudo ({totalResults})
        </button>

        <button
          onClick={() => setActiveSearchTab('news')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSearchTab === 'news'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Newspaper className="w-3.5 h-3.5" />
          Notícias ({matchedNews.length})
        </button>

        <button
          onClick={() => setActiveSearchTab('deals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSearchTab === 'deals'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          Promoções ({matchedDeals.length})
        </button>

        <button
          onClick={() => setActiveSearchTab('releases')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSearchTab === 'releases'
              ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Rocket className="w-3.5 h-3.5" />
          Lançamentos ({matchedReleases.length})
        </button>
      </div>

      {/* Results Content */}
      {totalResults === 0 ? (
        <EmptyState
          title="Nenhum resultado encontrado"
          description={`Não encontramos nenhum conteúdo correspondente a "${searchQuery}". Tente usar palavras-chave mais genéricas como "GTA", "Steam" ou "PS5".`}
          actionText="Limpar Pesquisa"
          onAction={() => setSearchQuery('')}
        />
      ) : (
        <div className="space-y-8">
          
          {/* News Section */}
          {(activeSearchTab === 'all' || activeSearchTab === 'news') && matchedNews.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-extrabold font-heading text-cyan-400 flex items-center gap-2">
                <Newspaper className="w-4 h-4" />
                Notícias ({matchedNews.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {matchedNews.map((news) => (
                  <CardNoticia key={news.id} news={news} />
                ))}
              </div>
            </div>
          )}

          {/* Deals Section */}
          {(activeSearchTab === 'all' || activeSearchTab === 'deals') && matchedDeals.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-extrabold font-heading text-emerald-400 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Promoções Relâmpago ({matchedDeals.length})
              </h3>
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {matchedDeals.map((deal) => (
                  <CardPromocao key={deal.id} deal={deal} />
                ))}
              </div>
            </div>
          )}

          {/* Releases Section */}
          {(activeSearchTab === 'all' || activeSearchTab === 'releases') && matchedReleases.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-extrabold font-heading text-purple-400 flex items-center gap-2">
                <Rocket className="w-4 h-4" />
                Próximos Lançamentos ({matchedReleases.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {matchedReleases.map((release) => (
                  <CardLancamento key={release.id} release={release} />
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
