import React, { useState, useEffect, useMemo } from 'react';
import { FreeGame, FreeGameStatus } from '../types';
import { freeGamesService } from '../services/freeGamesService';
import { useApp } from '../contexts/AppContext';
import {
  Gift,
  Search,
  Filter,
  ExternalLink,
  Calendar,
  Share2,
  Bookmark,
  Sparkles,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Tag,
} from 'lucide-react';

export const JogosGratisView: React.FC = () => {
  const { showToast, favoriteDealIds, toggleFavoriteDeal } = useApp();
  const [games, setGames] = useState<FreeGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Filters
  const [selectedStore, setSelectedStore] = useState<string>('Todas');
  const [statusFilter, setStatusFilter] = useState<'Todos' | FreeGameStatus>('Disponível');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    // Initial fetch & realtime subscription
    const unsub = freeGamesService.subscribeFreeGames((list) => {
      setGames(list);
      setLoading(false);
    });

    // Run Epic Games Store sync in background
    freeGamesService.syncEpicGamesStore().catch(() => {});

    return () => unsub();
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    showToast('Buscando jogos gratuitos na Epic Games Store...');
    await freeGamesService.syncEpicGamesStore();
    setSyncing(false);
    showToast('Catálogo de jogos gratuitos atualizado!');
  };

  // Available stores for dropdown
  const availableStores = useMemo(() => {
    const storesSet = new Set(games.map((g) => g.store));
    return ['Todas', ...Array.from(storesSet).sort()];
  }, [games]);

  // Filtered & Sorted Games
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      // Store filter
      if (selectedStore !== 'Todas' && game.store !== selectedStore) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'Todos' && game.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = game.title.toLowerCase().includes(query);
        const matchesDesc = game.description.toLowerCase().includes(query);
        const matchesStore = game.store.toLowerCase().includes(query);
        const matchesPlatform = String(game.platform).toLowerCase().includes(query);

        if (!matchesTitle && !matchesDesc && !matchesStore && !matchesPlatform) {
          return false;
        }
      }

      return true;
    });
  }, [games, selectedStore, statusFilter, searchQuery]);

  const activeFreeCount = useMemo(() => {
    return games.filter((g) => g.status === 'Disponível').length;
  }, [games]);

  const handleShare = async (game: FreeGame) => {
    const shareData = {
      title: `Jogo Grátis: ${game.title}`,
      text: `Resgate ${game.title} gratuitamente na ${game.store}!`,
      url: game.affiliateUrl || game.url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (e) {}
    }

    // Fallback: Copy link
    navigator.clipboard.writeText(game.affiliateUrl || game.url);
    showToast('Link do jogo grátis copiado!');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-100 flex items-center gap-2.5">
            <Gift className="w-8 h-8 text-emerald-400" />
            Jogos Gratuitos & Giveaways
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Acompanhe jogos grátis na Epic Games Store, Steam, GOG e consoles sem pagar nada
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer hover:bg-slate-800"
            title="Atualizar jogos gratuitos da Epic Games e lojas"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Buscando...' : 'Atualizar Lojas'}</span>
          </button>

          <div className="px-3.5 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>{activeFreeCount} {activeFreeCount === 1 ? 'Disponível' : 'Disponíveis'}</span>
          </div>
        </div>
      </div>

      {/* Store quick tabs banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">Monitoramento Automático de Free Games</h3>
            <p className="text-xs text-slate-400">
              Novos jogos adicionados toda semana. Ative os alertas para nunca perder um resgate!
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por nome do jogo, loja ou plataforma..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        {/* Store Selector */}
        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500/50 cursor-pointer"
        >
          {availableStores.map((store) => (
            <option key={store} value={store}>
              Loja: {store}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setStatusFilter('Disponível')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'Disponível'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Disponíveis
          </button>
          <button
            onClick={() => setStatusFilter('Encerrado')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'Encerrado'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Encerrados
          </button>
          <button
            onClick={() => setStatusFilter('Todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'Todos'
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos
          </button>
        </div>
      </div>

      {/* Free Games Grid */}
      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
          {filteredGames.map((game) => {
            const isFav = favoriteDealIds.includes(game.id);
            const isAvailable = game.status === 'Disponível';

            return (
              <div
                key={game.id}
                className={`p-4 rounded-2xl bg-slate-900/80 border transition-all duration-300 flex flex-col justify-between group relative ${
                  isAvailable
                    ? 'border-emerald-500/30 hover:border-emerald-500/60 shadow-lg shadow-emerald-500/5'
                    : 'border-slate-800/80 opacity-75'
                }`}
              >
                {/* Image & Badges */}
                <div className="relative h-48 w-full rounded-xl overflow-hidden mb-3 bg-slate-950">
                  <img
                    src={game.image}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    {isAvailable ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-md shadow-emerald-500/30 animate-pulse">
                        <CheckCircle2 className="w-3 h-3" />
                        Grátis Disponível
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 text-rose-400 border border-rose-500/30 font-extrabold text-[10px] uppercase flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        Encerrado
                      </span>
                    )}
                  </div>

                  {/* Store Badge */}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-950/90 text-slate-200 border border-slate-700/80 font-bold text-[10px]">
                    {game.store}
                  </div>

                  {/* Price Tag Overlay */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black">
                      100% OFF (R$ 0,00)
                    </span>
                    {game.originalPrice && (
                      <span className="text-xs text-slate-400 line-through">
                        R$ {game.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 flex-1 mb-4">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Tag className="w-3 h-3 text-emerald-400" />
                    <span>Plataforma: <strong className="text-slate-200">{game.platform}</strong></span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black font-heading text-slate-100 group-hover:text-emerald-400 transition-colors leading-snug">
                    {game.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {game.description}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Validade: <strong>{game.startDate}</strong> até <strong>{game.endDate}</strong></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleFavoriteDeal(game.id)}
                      className={`p-2 rounded-xl transition-colors cursor-pointer ${
                        isFav
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                      title={isFav ? 'Remover dos favoritos' : 'Favoritar jogo grátis'}
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleShare(game)}
                      className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Compartilhar jogo grátis"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  <a
                    href={game.affiliateUrl || game.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isAvailable
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20 hover:opacity-90 active:scale-95'
                        : 'bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span>{isAvailable ? 'Resgatar Grátis' : 'Ver Oferta'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
          <Gift className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">Nenhum jogo gratuito encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tente buscar com outros filtros ou clique em "Atualizar Lojas" para sincronizar ofertas.
          </p>
        </div>
      )}
    </div>
  );
};
