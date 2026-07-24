import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { mockNews, mockDeals, mockReleases } from '../data/mockData';
import { mockCoupons } from '../data/mockCoupons';
import { CardNoticia } from '../components/CardNoticia';
import { CardPromocao } from '../components/CardPromocao';
import { CardLancamento } from '../components/CardLancamento';
import { CupomCard } from '../components/CupomCard';
import { EmptyState } from '../components/EmptyState';
import { Bookmark, Bell, Rocket, Ticket, Trash2 } from 'lucide-react';

export const FavoritosView: React.FC = () => {
  const {
    favoriteNewsIds,
    favoriteDealIds,
    trackedReleaseIds,
    favoriteCouponIds,
    clearAllFavorites,
    setActiveTab,
  } = useApp();

  const [activeFavTab, setActiveFavTab] = useState<'coupons' | 'news' | 'deals' | 'releases'>('coupons');

  const savedNews = mockNews.filter((n) => favoriteNewsIds.includes(n.id));
  const savedDeals = mockDeals.filter((d) => favoriteDealIds.includes(d.id));
  const savedReleases = mockReleases.filter((r) => trackedReleaseIds.includes(r.id));
  const savedCoupons = mockCoupons.filter((c) => favoriteCouponIds.includes(c.id));

  const totalSavedCount = savedNews.length + savedDeals.length + savedReleases.length + savedCoupons.length;

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-100 flex items-center gap-2">
            Meus Favoritos & Alertas
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Cupons salvos, notícias marcadas, alertas de preços e lançamentos acompanhados
          </p>
        </div>

        {totalSavedCount > 0 && (
          <button
            onClick={clearAllFavorites}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar Todos ({totalSavedCount})</span>
          </button>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveFavTab('coupons')}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeFavTab === 'coupons'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Ticket className="w-3.5 h-3.5" />
          <span>Cupons Salvos ({savedCoupons.length})</span>
        </button>

        <button
          onClick={() => setActiveFavTab('news')}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeFavTab === 'news'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Notícias Salvas ({savedNews.length})</span>
        </button>

        <button
          onClick={() => setActiveFavTab('deals')}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeFavTab === 'deals'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Alertas de Ofertas ({savedDeals.length})</span>
        </button>

        <button
          onClick={() => setActiveFavTab('releases')}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeFavTab === 'releases'
              ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Rocket className="w-3.5 h-3.5" />
          <span>Lembretes ({savedReleases.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeFavTab === 'coupons' && (
        <div>
          {savedCoupons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {savedCoupons.map((coupon) => (
                <CupomCard key={coupon.id} coupon={coupon} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhum cupom salvo ainda"
              description="Clique no ícone de coração nos cupons para salvá-los nesta aba para resgate posterior!"
              actionText="Explorar Cupons"
              onAction={() => setActiveTab('cupons')}
            />
          )}
        </div>
      )}

      {activeFavTab === 'news' && (
        <div>
          {savedNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {savedNews.map((news) => (
                <CardNoticia key={news.id} news={news} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhuma notícia salva ainda"
              description="Você pode clicar no ícone de marcador nas notícias para ler mais tarde!"
              actionText="Explorar Notícias"
              onAction={() => setActiveTab('inicio')}
            />
          )}
        </div>
      )}

      {activeFavTab === 'deals' && (
        <div>
          {savedDeals.length > 0 ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {savedDeals.map((deal) => (
                <CardPromocao key={deal.id} deal={deal} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhum alerta de preço ativo"
              description="Ative o sininho nas ofertas para receber notificações de queda de preço!"
              actionText="Explorar Ofertas Relâmpago"
              onAction={() => setActiveTab('inicio')}
            />
          )}
        </div>
      )}

      {activeFavTab === 'releases' && (
        <div>
          {savedReleases.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {savedReleases.map((release) => (
                <CardLancamento key={release.id} release={release} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhum lembrete de lançamento"
              description="Ative lembretes nos lançamentos para ser notificado no dia do lançamento do jogo."
              actionText="Ver Lançamentos"
              onAction={() => setActiveTab('inicio')}
            />
          )}
        </div>
      )}

    </div>
  );
};
