import React from 'react';
import { Search, X, Sparkles, Clock, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface BarraPesquisaProps {
  placeholder?: string;
  autoFocus?: boolean;
}

export const BarraPesquisa: React.FC<BarraPesquisaProps> = ({
  placeholder = 'Buscar notícias, promoções, consoles ou jogos...',
  autoFocus = false,
}) => {
  const {
    searchQuery,
    setSearchQuery,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  } = useApp();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      addRecentSearch(searchQuery.trim());
    }
  };

  const handleChipClick = (term: string) => {
    setSearchQuery(term);
    addRecentSearch(term);
  };

  return (
    <div className="w-full space-y-3 my-2">
      <div className="relative flex items-center">
        <Search className="w-5 h-5 absolute left-4 text-cyan-400 pointer-events-none" />
        
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className="w-full pl-11 pr-10 py-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-lg shadow-black/20"
        />

        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Limpar busca"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Search Chips */}
      {recentSearches.length > 0 && !searchQuery && (
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Buscas Recentes
            </span>
            <button
              onClick={clearRecentSearches}
              className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              Limpar
            </button>
          </div>

          <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 no-scrollbar">
            {recentSearches.map((term, i) => (
              <button
                key={i}
                onClick={() => handleChipClick(term)}
                className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-cyan-400 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-cyan-500" />
                <span>{term}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
