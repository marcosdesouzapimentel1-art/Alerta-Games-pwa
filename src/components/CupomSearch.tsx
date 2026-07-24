import React from 'react';
import { Search, X, Sparkles, Tag } from 'lucide-react';

interface CupomSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  quickTags?: string[];
}

export const CupomSearch: React.FC<CupomSearchProps> = ({
  searchQuery,
  setSearchQuery,
  quickTags = ['Kabum!', 'Steam', 'GPU15', 'RTX', 'PC Gamer', 'PS5', 'Exclusivos'],
}) => {
  return (
    <div className="space-y-2.5">
      
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-4 h-4 text-cyan-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Pesquisar por cupom, loja (Steam, Kabum...), produto ou código..."
          className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs sm:text-sm font-medium focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Quick Search Tag Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 shrink-0 mr-1">
          <Tag className="w-3 h-3 text-cyan-400" />
          Populares:
        </span>
        {quickTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSearchQuery(tag === searchQuery ? '' : tag)}
            className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
              searchQuery === tag
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            #{tag}
          </button>
        ))}
      </div>

    </div>
  );
};
