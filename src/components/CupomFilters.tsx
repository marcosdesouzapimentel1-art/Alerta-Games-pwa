import React from 'react';
import { CouponCategory } from '../types';
import { mockCouponCategories } from '../data/mockCoupons';
import {
  Sparkles,
  Gamepad2,
  Cpu,
  Mouse,
  CreditCard,
  Tv,
  Monitor,
  Smartphone,
  Zap,
  Headphones,
  ArrowUpDown,
  Store,
  Clock,
  Percent,
} from 'lucide-react';

export type SortOption = 'desconto' | 'recentes' | 'expirando';

interface CupomFiltersProps {
  selectedCategory: CouponCategory | 'Todas';
  setSelectedCategory: (cat: CouponCategory | 'Todas') => void;
  selectedStore: string;
  setSelectedStore: (store: string) => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  availableStores: string[];
}

export const CupomFilters: React.FC<CupomFiltersProps> = ({
  selectedCategory,
  setSelectedCategory,
  selectedStore,
  setSelectedStore,
  sortBy,
  setSortBy,
  availableStores,
}) => {
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Gamepad2': return <Gamepad2 className="w-3.5 h-3.5" />;
      case 'Cpu': return <Cpu className="w-3.5 h-3.5" />;
      case 'Mouse': return <Mouse className="w-3.5 h-3.5" />;
      case 'CreditCard': return <CreditCard className="w-3.5 h-3.5" />;
      case 'Tv': return <Tv className="w-3.5 h-3.5" />;
      case 'Monitor': return <Monitor className="w-3.5 h-3.5" />;
      case 'Smartphone': return <Smartphone className="w-3.5 h-3.5" />;
      case 'Zap': return <Zap className="w-3.5 h-3.5" />;
      case 'Headphones': return <Headphones className="w-3.5 h-3.5" />;
      default: return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Category Horizontal Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {mockCouponCategories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as CouponCategory | 'Todas')}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {getCategoryIcon(cat.icon)}
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Secondary Bar: Store Selector + Sorting Option Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        
        {/* Store Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-cyan-400 shrink-0" />
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="bg-slate-950 text-slate-200 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="Todas">Todas as Lojas</option>
            {availableStores.map((store) => (
              <option key={store} value={store}>
                {store}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Option Buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-end sm:self-auto w-full sm:w-auto">
          <button
            onClick={() => setSortBy('desconto')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              sortBy === 'desconto'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Maior Desconto</span>
          </button>

          <button
            onClick={() => setSortBy('recentes')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              sortBy === 'recentes'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Mais Recentes</span>
          </button>

          <button
            onClick={() => setSortBy('expirando')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              sortBy === 'expirando'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Expirando Hoje</span>
          </button>
        </div>

      </div>

    </div>
  );
};
