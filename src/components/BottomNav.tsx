import React from 'react';
import { Home, Newspaper, Ticket, Flame, Gift, Bookmark, Settings, User, ShieldCheck } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ActiveTab } from '../types';

export const BottomNav: React.FC = React.memo(() => {
  console.count('[Render] BottomNav');
  const {
    activeTab,
    setActiveTab,
    favoriteNewsIds,
    favoriteDealIds,
    trackedReleaseIds,
    favoriteCouponIds,
  } = useApp();
  const { isAdmin } = useAuth();

  const favCount =
    favoriteNewsIds.length +
    favoriteDealIds.length +
    trackedReleaseIds.length +
    favoriteCouponIds.length;

  const navItems: Array<{ id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'inicio', label: 'Início', icon: <Home className="w-5 h-5" /> },
    { id: 'noticias', label: 'Notícias', icon: <Newspaper className="w-5 h-5" /> },
    { id: 'cupons', label: 'Cupons', icon: <Ticket className="w-5 h-5" /> },
    { id: 'promocoes', label: 'Ofertas', icon: <Flame className="w-5 h-5 text-amber-400" /> },
    { id: 'jogos-gratis', label: 'Grátis', icon: <Gift className="w-5 h-5 text-emerald-400" /> },
    { id: 'favoritos', label: 'Salvos', icon: <Bookmark className="w-5 h-5" />, badge: favCount },
    { id: 'perfil', label: 'Perfil', icon: <User className="w-5 h-5 text-cyan-400" /> },
    ...(isAdmin ? [{ id: 'admin' as ActiveTab, label: 'Admin', icon: <ShieldCheck className="w-5 h-5 text-rose-400" /> }] : []),
    { id: 'configuracoes', label: 'Ajustes', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-1 sm:px-2 py-1.5 transition-colors duration-200">
      <div className="max-w-md md:max-w-2xl mx-auto flex items-center justify-around overflow-x-auto scrollbar-none">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative shrink-0 flex flex-col items-center justify-center py-1 px-2 sm:px-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-cyan-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1 min-w-[16px] h-4 text-[9px] font-extrabold bg-cyan-500 text-slate-950 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1">{item.label}</span>
              
              {isActive && (
                <span className="absolute -bottom-1 w-5 h-1 bg-cyan-400 rounded-full shadow-sm shadow-cyan-400/80" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
});
