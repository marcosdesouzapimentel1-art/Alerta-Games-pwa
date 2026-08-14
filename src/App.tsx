import React, { Suspense, lazy, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { PWAProvider } from './contexts/PWAContext';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider, useApp } from './contexts/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Footer } from './components/Footer';
import { NotificationDrawer } from './components/NotificationDrawer';
import { NewsDetailModal } from './components/NewsDetailModal';
import { DealDetailModal } from './components/DealDetailModal';
import { CupomDetails } from './components/CupomDetails';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { InicioView } from './views/InicioView';
import { NoticiasView } from './views/NoticiasView';
import { CategoriasView } from './views/CategoriasView';
import { CuponsView } from './views/CuponsView';
import { PromocoesView } from './views/PromocoesView';
import { JogosGratisView } from './views/JogosGratisView';
import { PesquisaView } from './views/PesquisaView';
import { FavoritosView } from './views/FavoritosView';
import { Loading } from './components/Loading';
import { Sparkles } from 'lucide-react';
import { trackPageView } from './services/analytics';

// Lazy loaded views for code splitting & better bundle performance
const PerfilView = lazy(() => import('./views/PerfilView').then(m => ({ default: m.PerfilView })));
const ConfiguracoesView = lazy(() => import('./views/ConfiguracoesView').then(m => ({ default: m.ConfiguracoesView })));
const AdminView = lazy(() => import('./views/AdminView').then(m => ({ default: m.AdminView })));
const PoliticaPrivacidadeView = lazy(() => import('./views/PoliticaPrivacidadeView').then(m => ({ default: m.PoliticaPrivacidadeView })));
const TermosUsoView = lazy(() => import('./views/TermosUsoView').then(m => ({ default: m.TermosUsoView })));
const SobreView = lazy(() => import('./views/SobreView').then(m => ({ default: m.SobreView })));
const ContatoView = lazy(() => import('./views/ContatoView').then(m => ({ default: m.ContatoView })));

const AppContent: React.FC = () => {
  const { activeTab, toastMessage } = useApp();

  useEffect(() => {
    trackPageView(activeTab);
  }, [activeTab]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'inicio':
        return <InicioView />;
      case 'noticias':
        return <NoticiasView />;
      case 'categorias':
        return <CategoriasView />;
      case 'cupons':
        return <CuponsView />;
      case 'promocoes':
        return <PromocoesView />;
      case 'jogos-gratis':
        return <JogosGratisView />;
      case 'pesquisa':
        return <PesquisaView />;
      case 'favoritos':
        return <FavoritosView />;
      case 'perfil':
        return (
          <Suspense fallback={<Loading />}>
            <PerfilView />
          </Suspense>
        );
      case 'configuracoes':
        return (
          <Suspense fallback={<Loading />}>
            <ConfiguracoesView />
          </Suspense>
        );
      case 'admin':
        return (
          <Suspense fallback={<Loading />}>
            <AdminView />
          </Suspense>
        );
      case 'politica-privacidade':
        return (
          <Suspense fallback={<Loading />}>
            <PoliticaPrivacidadeView />
          </Suspense>
        );
      case 'termos-uso':
        return (
          <Suspense fallback={<Loading />}>
            <TermosUsoView />
          </Suspense>
        );
      case 'sobre':
        return (
          <Suspense fallback={<Loading />}>
            <SobreView />
          </Suspense>
        );
      case 'contato':
        return (
          <Suspense fallback={<Loading />}>
            <ContatoView />
          </Suspense>
        );
      default:
        return <InicioView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      {/* Header */}
      <Header />

      {/* Main View Area - Expandido para Widescreen no PC mantendo fluidez no Celular */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-8 lg:px-12 pt-4 pb-24">
        {renderActiveView()}
      </main>

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 border border-cyan-500/50 text-cyan-300 text-xs font-bold shadow-2xl backdrop-blur-xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals & Overlays */}
      <NotificationDrawer />
      <NewsDetailModal />
      <DealDetailModal />
      <CupomDetails />
      <PWAInstallPrompt />

      {/* Footer */}
      <Footer />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <PWAProvider>
        <AuthProvider>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </AuthProvider>
      </PWAProvider>
    </ThemeProvider>
  );
}

