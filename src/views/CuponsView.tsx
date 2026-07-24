import React, { useState, useEffect, useMemo } from 'react';
import { Coupon, CouponCategory } from '../types';
import { couponsService } from '../services/couponsService';
import { CupomCard } from '../components/CupomCard';
import { CupomFilters, SortOption } from '../components/CupomFilters';
import { CupomSearch } from '../components/CupomSearch';
import { CupomCarousel } from '../components/CupomCarousel';
import { EmptyState } from '../components/EmptyState';
import { useApp } from '../contexts/AppContext';
import { Ticket, ShieldCheck, Flame, Gift, Sparkles } from 'lucide-react';

export const CuponsView: React.FC = () => {
  const { setActiveTab } = useApp();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<CouponCategory | 'Todas'>('Todas');
  const [selectedStore, setSelectedStore] = useState<string>('Todas');
  const [sortBy, setSortBy] = useState<SortOption>('desconto');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const unsub = couponsService.subscribeCoupons((list) => {
      setCoupons(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Extract unique available stores for filtering dropdown
  const availableStores = useMemo(() => {
    const storesSet = new Set(coupons.map((c) => c.store || c.storeName || 'Loja'));
    return Array.from(storesSet).sort();
  }, [coupons]);

  // Filter featured coupons for the carousel
  const featuredCoupons = useMemo(() => {
    return coupons.filter((c) => c.featured);
  }, [coupons]);

  // Filtered & Sorted Coupons list
  const filteredCoupons = useMemo(() => {
    return coupons
      .filter((coupon) => {
        const storeName = coupon.store || coupon.storeName || '';
        // Category filter
        if (selectedCategory !== 'Todas' && coupon.category !== selectedCategory) {
          return false;
        }

        // Store filter
        if (selectedStore !== 'Todas' && storeName !== selectedStore) {
          return false;
        }

        // Search query filter
        if (searchQuery.trim() !== '') {
          const query = searchQuery.toLowerCase().trim();
          const matchesTitle = coupon.title.toLowerCase().includes(query);
          const matchesStore = storeName.toLowerCase().includes(query);
          const matchesCategory = coupon.category.toLowerCase().includes(query);
          const matchesCode = coupon.code ? coupon.code.toLowerCase().includes(query) : false;
          const matchesDesc = coupon.description.toLowerCase().includes(query);

          if (!matchesTitle && !matchesStore && !matchesCategory && !matchesCode && !matchesDesc) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'desconto') {
          return b.discountPercent - a.discountPercent;
        } else if (sortBy === 'recentes') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else if (sortBy === 'expirando') {
          if (a.isExpiringToday && !b.isExpiringToday) return -1;
          if (!a.isExpiringToday && b.isExpiringToday) return 1;
          const dateA = a.expirationDate || a.validUntil || '2026-12-31';
          const dateB = b.expirationDate || b.validUntil || '2026-12-31';
          return new Date(dateA).getTime() - new Date(dateB).getTime();
        }
        return 0;
      });
  }, [coupons, selectedCategory, selectedStore, sortBy, searchQuery]);

  const handleResetFilters = () => {
    setSelectedCategory('Todas');
    setSelectedStore('Todas');
    setSortBy('desconto');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Economy Hub Quick Nav */}
      <div className="p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 grid grid-cols-3 gap-1">
        <button
          onClick={() => setActiveTab('cupons')}
          className="py-2 px-3 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Ticket className="w-4 h-4 text-cyan-400" />
          <span>Cupons</span>
        </button>

        <button
          onClick={() => setActiveTab('promocoes')}
          className="py-2 px-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Flame className="w-4 h-4 text-amber-400" />
          <span>Promoções</span>
        </button>

        <button
          onClick={() => setActiveTab('jogos-gratis')}
          className="py-2 px-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Gift className="w-4 h-4 text-emerald-400" />
          <span>Jogos Grátis</span>
        </button>
      </div>

      {/* Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-100 flex items-center gap-2.5">
            <Ticket className="w-7 h-7 text-cyan-400" />
            Central de Cupons & Descontos
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Códigos promocionais atualizados para Kabum, Terabyte, Amazon, Steam, Nuuvem e mais
          </p>
        </div>

        <div className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs text-slate-300 font-bold">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{coupons.length} Cupons Ativos</span>
        </div>
      </div>

      {/* Featured Carousel */}
      <CupomCarousel featuredCoupons={featuredCoupons.length > 0 ? featuredCoupons : coupons.slice(0, 3)} />

      {/* Search Input Bar */}
      <CupomSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Filter Options (Categories, Stores, Sorting) */}
      <CupomFilters
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedStore={selectedStore}
        setSelectedStore={setSelectedStore}
        sortBy={sortBy}
        setSortBy={setSortBy}
        availableStores={availableStores}
      />

      {/* Affiliate Transparency Disclaimer Banner */}
      <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 flex items-center gap-3 text-xs text-slate-300">
        <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
        <p>
          <strong className="text-cyan-300">Estrutura Pronta para Afiliados:</strong> Todos os cupons e links são validados diariamente. Ao comprar através dos nossos links, o Alerta Game pode receber uma pequena comissão sem nenhum custo para você!
        </p>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-sm font-bold font-heading text-slate-200">
          Exibindo {filteredCoupons.length} {filteredCoupons.length === 1 ? 'cupom' : 'cupons'}
        </h2>

        {(selectedCategory !== 'Todas' || selectedStore !== 'Todas' || searchQuery !== '') && (
          <button
            onClick={handleResetFilters}
            className="text-xs text-cyan-400 hover:underline font-bold cursor-pointer"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Coupons Grid */}
      {filteredCoupons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCoupons.map((coupon) => (
            <CupomCard key={coupon.id} coupon={coupon} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhum cupom encontrado"
          description="Tente buscar por outros termos, selecione outra categoria ou limpe seus filtros."
          actionText="Ver Todos os Cupons"
          onAction={handleResetFilters}
        />
      )}
    </div>
  );
};
