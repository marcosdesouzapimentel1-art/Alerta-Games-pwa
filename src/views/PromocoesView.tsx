import React, { useState, useEffect, useMemo } from 'react';
import { Promotion, PromotionCategory } from '../types';
import { promotionsService } from '../services/promotionsService';
import { useApp } from '../contexts/AppContext';
import {
  Tag,
  Search,
  Filter,
  ExternalLink,
  Calendar,
  Share2,
  Bookmark,
  Sparkles,
  TrendingDown,
  Percent,
  Flame,
  ArrowUpDown,
  ShoppingBag,
} from 'lucide-react';

export const promotionCategoriesList: Array<{ id: PromotionCategory | 'Todas'; name: string }> = [
  { id: 'Todas', name: 'Todas' },
  { id: 'Jogos', name: 'Jogos' },
  { id: 'Consoles', name: 'Consoles' },
  { id: 'Controles', name: 'Controles' },
  { id: 'Headsets', name: 'Headsets' },
  { id: 'Placas de vídeo', name: 'Placas de Vídeo' },
  { id: 'Notebooks gamer', name: 'Notebooks Gamer' },
  { id: 'Gift Cards', name: 'Gift Cards' },
  { id: 'Assinaturas', name: 'Assinaturas' },
];

export type SortPromoOption = 'desconto' | 'menor_preco' | 'recentes';

export const PromocoesView: React.FC = () => {
  const { showToast, favoriteDealIds, toggleFavoriteDeal } = useApp();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<PromotionCategory | 'Todas'>('Todas');
  const [selectedStore, setSelectedStore] = useState<string>('Todas');
  const [sortBy, setSortBy] = useState<SortPromoOption>('desconto');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const unsub = promotionsService.subscribePromotions((list) => {
      setPromotions(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Available stores
  const availableStores = useMemo(() => {
    const storesSet = new Set(promotions.map((p) => p.store));
    return ['Todas', ...Array.from(storesSet).sort()];
  }, [promotions]);

  // Filtered & Sorted Promotions
  const filteredPromotions = useMemo(() => {
    return promotions
      .filter((promo) => {
        // Category
        if (selectedCategory !== 'Todas' && promo.category !== selectedCategory) {
          return false;
        }

        // Store
        if (selectedStore !== 'Todas' && promo.store !== selectedStore) {
          return false;
        }

        // Search Query
        if (searchQuery.trim() !== '') {
          const query = searchQuery.toLowerCase().trim();
          const matchesTitle = promo.productTitle.toLowerCase().includes(query);
          const matchesStore = promo.store.toLowerCase().includes(query);
          const matchesCategory = promo.category.toLowerCase().includes(query);

          if (!matchesTitle && !matchesStore && !matchesCategory) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'desconto') {
          return b.discountPercent - a.discountPercent;
        } else if (sortBy === 'menor_preco') {
          return a.currentPrice - b.currentPrice;
        } else if (sortBy === 'recentes') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
  }, [promotions, selectedCategory, selectedStore, sortBy, searchQuery]);

  const handleShare = async (promo: Promotion) => {
    const shareData = {
      title: `Promoção Gamer: ${promo.productTitle}`,
      text: `${promo.discountPercent}% OFF em ${promo.productTitle} na ${promo.store}! Por apenas R$ ${promo.currentPrice.toFixed(2)}`,
      url: promo.affiliateUrl || promo.link,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (e) {}
    }

    navigator.clipboard.writeText(promo.affiliateUrl || promo.link);
    showToast('Link da promoção copiado!');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-100 flex items-center gap-2.5">
            <Flame className="w-8 h-8 text-cyan-400" />
            Promoções & Ofertas Gamer
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Ofertas atualizadas em hardware, consoles, periféricos, jogos e assinaturas
          </p>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-xs font-bold flex items-center gap-2 self-start sm:self-auto">
          <Sparkles className="w-4 h-4" />
          <span>{filteredPromotions.length} Promoções Ativas</span>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {promotionCategoriesList.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search */}
        <div className="relative sm:col-span-6">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por produto, placa de vídeo, console ou loja..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>

        {/* Store Selector */}
        <div className="sm:col-span-3">
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500/50 cursor-pointer"
          >
            {availableStores.map((store) => (
              <option key={store} value={store}>
                Loja: {store}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Selector */}
        <div className="sm:col-span-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortPromoOption)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500/50 cursor-pointer font-bold text-cyan-400"
          >
            <option value="desconto">Ordenar: Maior Desconto</option>
            <option value="menor_preco">Ordenar: Menor Preço</option>
            <option value="recentes">Ordenar: Mais Recentes</option>
          </select>
        </div>
      </div>

      {/* Promotions Grid */}
      {filteredPromotions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPromotions.map((promo) => {
            const isFav = favoriteDealIds.includes(promo.id);

            return (
              <div
                key={promo.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all duration-300 flex flex-col justify-between group relative shadow-lg shadow-black/20"
              >
                {/* Image & Discount Badge */}
                <div className="relative h-44 w-full rounded-xl overflow-hidden mb-3 bg-slate-950">
                  <img
                    src={promo.image}
                    alt={promo.productTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Discount Badge */}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-black text-xs tracking-wider uppercase shadow-md shadow-rose-500/30 flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    -{promo.discountPercent}% OFF
                  </div>

                  {/* Store Badge */}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-950/90 text-slate-200 border border-slate-700/80 font-bold text-[10px]">
                    {promo.store}
                  </div>

                  {/* Category Tag Overlay */}
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700/80 text-cyan-400 text-[10px] font-bold">
                      {promo.category}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 flex-1 mb-4">
                  <h3 className="text-sm font-bold font-heading text-slate-100 group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug">
                    {promo.productTitle}
                  </h3>

                  {/* Prices */}
                  <div className="pt-2 flex items-baseline gap-2">
                    <span className="text-xs text-slate-400 line-through">
                      R$ {promo.oldPrice.toFixed(2)}
                    </span>
                    <span className="text-xl font-black font-heading text-cyan-400">
                      R$ {promo.currentPrice.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Validade: {promo.expirationDate}</span>
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleFavoriteDeal(promo.id)}
                      className={`p-2 rounded-xl transition-colors cursor-pointer ${
                        isFav
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                      title={isFav ? 'Remover dos favoritos' : 'Favoritar promoção'}
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleShare(promo)}
                      className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Compartilhar promoção"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  <a
                    href={promo.affiliateUrl || promo.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Ir para a Loja</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
          <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">Nenhuma promoção encontrada</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tente trocar de categoria, selecionar outra loja ou limpar seus termos de pesquisa.
          </p>
        </div>
      )}
    </div>
  );
};
