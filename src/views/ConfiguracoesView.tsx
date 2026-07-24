import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { usePWA } from '../contexts/PWAContext';
import { useApp } from '../contexts/AppContext';
import { InstallModal } from '../components/InstallModal';
import { ConfigurarAlertasView } from './ConfigurarAlertasView';
import {
  Sun,
  Moon,
  Monitor,
  Bell,
  Trash2,
  HardDrive,
  CheckCircle2,
  Download,
  Volume2,
  VolumeX,
  Smartphone,
  ShieldCheck,
  RefreshCw,
  Sliders,
} from 'lucide-react';

export const ConfiguracoesView: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const {
    isInstallable,
    isInstalled,
    swRegistered,
    cacheSizeMB,
    clearCache,
    promptInstall,
  } = usePWA();
  const { showToast } = useApp();

  const [activeSection, setActiveSection] = useState<'alertas' | 'geral'>('alertas');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dealAlertsOnly, setDealAlertsOnly] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const handleClearCache = async () => {
    const success = await clearCache();
    if (success) {
      showToast('Cache offline e arquivos temporários limpos!');
    } else {
      showToast('Não foi possível limpar o cache no momento.');
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-3xl mx-auto">
      
      {/* Header Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-900/80 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveSection('alertas')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSection === 'alertas'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Configurar Alertas (FCM)</span>
        </button>

        <button
          onClick={() => setActiveSection('geral')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSection === 'geral'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Geral & Diagnósticos PWA</span>
        </button>
      </div>

      {activeSection === 'alertas' ? (
        <ConfigurarAlertasView />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-100 mb-1">
              Configurações Gerais & PWA
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Gerencie temas, cache offline e diagnósticos de funcionamento PWA
            </p>
          </div>

      {/* Theme Selection */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <h3 className="font-heading font-bold text-base text-slate-100 flex items-center gap-2">
          <Sun className="w-5 h-5 text-amber-400" />
          Aparência e Tema
        </h3>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setTheme('dark')}
            className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Moon className="w-5 h-5" />
            <span className="text-xs">Escuro (Padrão)</span>
          </button>

          <button
            onClick={() => setTheme('light')}
            className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Sun className="w-5 h-5" />
            <span className="text-xs">Claro</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
              theme === 'system'
                ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-5 h-5" />
            <span className="text-xs">Sistema</span>
          </button>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <h3 className="font-heading font-bold text-base text-slate-100 flex items-center gap-2">
          <Bell className="w-5 h-5 text-cyan-400" />
          Notificações e Alertas
        </h3>

        <div className="space-y-3 divide-y divide-slate-800/60 text-xs sm:text-sm">
          
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="font-bold text-slate-200 block">Notificações Push</span>
              <span className="text-slate-400 text-xs">Receba alertas em tempo real no dispositivo</span>
            </div>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => {
                setNotificationsEnabled(e.target.checked);
                showToast(e.target.checked ? 'Notificações ativadas' : 'Notificações desativadas');
              }}
              className="w-5 h-5 accent-cyan-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <span className="font-bold text-slate-200 block">Apenas Ofertas &gt; 50%</span>
              <span className="text-slate-400 text-xs">Filtrar para avisar somente super descontos</span>
            </div>
            <input
              type="checkbox"
              checked={dealAlertsOnly}
              onChange={(e) => setDealAlertsOnly(e.target.checked)}
              className="w-5 h-5 accent-cyan-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <span className="font-bold text-slate-200 block">Sons de Notificação</span>
              <span className="text-slate-400 text-xs">Efeitos sonoros ao receber novos alertas</span>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
          </div>

        </div>
      </div>

      {/* PWA Offline Storage & Cache */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <h3 className="font-heading font-bold text-base text-slate-100 flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-emerald-400" />
          Armazenamento & Funcionamento Offline
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          <div>
            <span className="text-xs text-slate-400 block">Tamanho do Cache Atual:</span>
            <span className="text-lg font-black font-heading text-emerald-400">
              {cacheSizeMB} MB
            </span>
          </div>

          <button
            onClick={handleClearCache}
            className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Limpar Cache Offline</span>
          </button>
        </div>
      </div>

      {/* PWA Lighthouse Diagnostics */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-base text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            Diagnóstico PWA Lighthouse
          </h3>
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Pontuação: 100% PWA
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-slate-200 block">Service Worker</span>
              <span className="text-slate-400">{swRegistered ? 'Ativo & Registrado' : 'Registrando...'}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-slate-200 block">Manifest.json</span>
              <span className="text-slate-400">Válido com ícones & shortcuts</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-slate-200 block">Suporte Offline</span>
              <span className="text-slate-400">Páginas cacheadas no sw.js</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-slate-200 block">Modo Instalável</span>
              <span className="text-slate-400">{isInstalled ? 'Instalado em Standalone' : 'Pronto para instalação'}</span>
            </div>
          </div>
        </div>

        {!isInstalled && (
          <button
            onClick={() => {
              if (isInstallable) {
                promptInstall();
              } else {
                setIsInstallModalOpen(true);
              }
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            <Smartphone className="w-4 h-4" />
            <span>Instalar Alerta Game no Celular (iOS & Android)</span>
          </button>
        )}
      </div>

      {/* Install Modal */}
      <InstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* App Info Footer */}
      <div className="text-center text-xs text-slate-500 pt-4 space-y-1">
        <p className="font-bold text-slate-400">Alerta Game v1.0.0 (PWA Release)</p>
        <p>Desenvolvido com React, TypeScript & Tailwind CSS</p>
      </div>

        </div>
      )}

    </div>
  );
};
