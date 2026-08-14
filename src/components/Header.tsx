import React, { useState } from 'react';
import { Bell, Sun, Moon, Download, Search, WifiOff, ShieldCheck, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { usePWA } from '../contexts/PWAContext';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { InstallModal } from './InstallModal';

// Import da nova imagem da logo
import logoImg from '../assets/logo.png';

export const Header: React.FC = React.memo(() => {
  console.count('[Render] Header');
  const { isDark, toggleTheme } = useTheme();
  const { isInstalled, isOnline } = usePWA();
  const { isAdmin } = useAuth();
  const {
    unreadNotificationCount,
    setIsNotificationDrawerOpen,
    activeTab,
    setActiveTab,
  } = useApp();

  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/85 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 transition-colors duration-200 text-slate-800 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        
        {/* Brand Logo - Imagem Customizada Emblemática */}
        <div
          onClick={() => setActiveTab('inicio')}
          className="flex items-center gap-2 cursor-pointer group select-none py-1"
        >
          <img
            src={logoImg}
            alt="Alerta Game"
            className="h-12 w-auto object-contain drop-shadow-[0_0_8px_rgba(6,182,212,0.4)] group-hover:scale-105 transition-transform duration-200"
          />
          <span className="text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 hidden sm:inline-block ml-1">
            PWA
          </span>
        </div>

        {/* Offline Badge */}
        {!isOnline && (
          <div className="flex items-center gap-1.5 text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full animate-pulse">
            <WifiOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-medium">Modo Offline</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* User Profile Button */}
          <button
            onClick={() => setActiveTab('perfil')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'perfil'
                ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Meu Perfil Gamer"
          >
            <User className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="hidden sm:inline font-bold">Perfil</span>
          </button>

          {/* Admin Panel Button */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-900 text-rose-600 dark:text-rose-400 border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
              title="Painel Administrativo"
            >
              <ShieldCheck className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              <span className="hidden md:inline font-bold">Admin</span>
            </button>
          )}

          {/* Quick Search Button */}
          <button
            onClick={() => setActiveTab('pesquisa')}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Pesquisar Notícias e Ofertas"
            aria-label="Pesquisar"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Install PWA Button */}
          {!isInstalled && (
            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white dark:text-slate-950 shadow-md shadow-cyan-500/20 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              title="Instalar App no celular"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Instalar App</span>
            </button>
          )}

          {/* Install Modal */}
          <InstallModal
            isOpen={isInstallModalOpen}
            onClose={() => setIsInstallModalOpen(false)}
          />

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            title={isDark ? 'Ativar Tema Claro' : 'Ativar Tema Escuro'}
            aria-label="Alternar tema"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-700" />
            )}
          </button>

          {/* Notification Bell */}
          <button
            onClick={() => setIsNotificationDrawerOpen(true)}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Notificações"
            aria-label="Abrir notificações"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {unreadNotificationCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
});
