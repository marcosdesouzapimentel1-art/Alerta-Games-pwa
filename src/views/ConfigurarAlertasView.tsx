import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Smartphone,
  Send,
  Trash2,
  Zap,
  Tag,
  Gamepad2,
  Gift,
  Flame,
  Radio,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import {
  ALERT_CATEGORIES,
  notificationService,
} from '../services/notificationService';
import { AlertCategory, NotificationPreferences } from '../types';

export const ConfigurarAlertasView: React.FC = () => {
  const { showToast, clearOldNotifications } = useApp();

  const [fcmStatus, setFcmStatus] = useState<{
    permission: NotificationPermission;
    token: string | null;
  }>({
    permission: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied',
    token: null,
  });

  const [loadingFcm, setLoadingFcm] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    userId: 'user-guest-default',
    fcmEnabled: false,
    categories: ALERT_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: true }), {} as Record<AlertCategory, boolean>),
    updatedAt: new Date().toISOString(),
  });

  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    notificationService.loadPreferences().then((prefs) => {
      setPreferences(prefs);
    });

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setFcmStatus((prev) => ({ ...prev, permission: Notification.permission }));
    }
  }, []);

  const handleRequestPermission = async () => {
    setLoadingFcm(true);
    try {
      const result = await notificationService.setupFcmNotifications();
      setFcmStatus(result);

      if (result.permission === 'granted') {
        showToast('Permissão concedida! Token FCM registrado no Firestore. 🔔');
        const updatedPrefs = { ...preferences, fcmEnabled: true };
        setPreferences(updatedPrefs);
        await notificationService.savePreferences(updatedPrefs);
      } else {
        showToast('Permissão de notificações não foi concedida pelo navegador.');
      }
    } catch (err) {
      showToast('Erro ao configurar notificações no navegador.');
    } finally {
      setLoadingFcm(false);
    }
  };

  const handleToggleCategory = async (category: AlertCategory) => {
    const updatedCategories = {
      ...preferences.categories,
      [category]: !preferences.categories[category],
    };

    const newPrefs: NotificationPreferences = {
      ...preferences,
      categories: updatedCategories,
    };

    setPreferences(newPrefs);
    await notificationService.savePreferences(newPrefs);
    showToast(
      updatedCategories[category]
        ? `Alertas ativados para: ${category}`
        : `Alertas desativados para: ${category}`
    );
  };

  const handleToggleAll = async (enable: boolean) => {
    const newCategories = ALERT_CATEGORIES.reduce(
      (acc, cat) => ({ ...acc, [cat]: enable }),
      {} as Record<AlertCategory, boolean>
    );

    const newPrefs: NotificationPreferences = {
      ...preferences,
      categories: newCategories,
    };

    setPreferences(newPrefs);
    await notificationService.savePreferences(newPrefs);
    showToast(enable ? 'Todas as categorias ativadas!' : 'Todas as categorias desativadas!');
  };

  const handleSendTestNotification = async () => {
    setIsTesting(true);
    try {
      await notificationService.createNotification({
        title: '🎮 Teste de Notificação Alerta Game!',
        message: 'Seu dispositivo está configurado e pronto para receber os alertas de notícias e ofertas.',
        category: 'Notícias importantes',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
      });
      showToast('Notificação de teste enviada! Confira no dispositivo/central.');
    } catch (e) {
      showToast('Erro ao gerar notificação de teste.');
    } finally {
      setIsTesting(false);
    }
  };

  const getCategoryIcon = (category: AlertCategory) => {
    switch (category) {
      case 'GTA 6':
      case 'Fortnite':
      case 'Call of Duty':
        return <Flame className="w-4 h-4 text-rose-400" />;
      case 'Lançamentos de jogos':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'Promoções Steam':
      case 'Cupons e ofertas':
        return <Tag className="w-4 h-4 text-emerald-400" />;
      case 'Jogos grátis Epic Games':
        return <Gift className="w-4 h-4 text-cyan-400" />;
      case 'Game Pass':
      case 'PS Plus':
        return <Gamepad2 className="w-4 h-4 text-blue-400" />;
      default:
        return <Radio className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-3xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              Firebase Cloud Messaging (FCM)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-100">
            Configurar Alertas
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Escolha exatamente sobre o que você deseja ser notificado no seu celular ou computador
          </p>
        </div>

        <button
          onClick={handleSendTestNotification}
          disabled={isTesting}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 active:scale-95 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4" />
          <span>{isTesting ? 'Enviando...' : 'Testar Alerta 🔔'}</span>
        </button>
      </div>

      {/* FCM Permission & Token Status Card */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-slate-100">
                Notificações Push no Navegador
              </h3>
              <p className="text-xs text-slate-400">
                Ative para receber alertas instantâneos mesmo quando a aba não estiver aberta
              </p>
            </div>
          </div>

          <div className="text-right">
            {fcmStatus.permission === 'granted' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ativado
              </span>
            ) : fcmStatus.permission === 'denied' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                <AlertCircle className="w-3.5 h-3.5" />
                Bloqueado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Pendente
              </span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <p className="text-slate-300 font-medium">
              {fcmStatus.permission === 'granted'
                ? 'Seu navegador e token FCM estão autorizados para receber notificações.'
                : 'Clique no botão ao lado para dar permissão de notificação no navegador.'}
            </p>
            {fcmStatus.token && (
              <p className="text-[10px] text-slate-500 font-mono truncate max-w-md">
                FCM Token ID: {fcmStatus.token}
              </p>
            )}
          </div>

          {fcmStatus.permission !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              disabled={loadingFcm}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-colors cursor-pointer shrink-0 self-stretch sm:self-auto text-center"
            >
              {loadingFcm ? 'Solicitando...' : 'Ativar Notificações Push'}
            </button>
          )}
        </div>
      </div>

      {/* Category Toggles Section */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-heading font-bold text-base text-slate-100 flex items-center gap-2">
              <Bell className="w-5 h-5 text-cyan-400" />
              Categorias de Alertas
            </h3>
            <p className="text-xs text-slate-400">
              Ligue ou desligue tópicos individuais
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => handleToggleAll(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold transition-colors cursor-pointer"
            >
              Ativar Todas
            </button>
            <button
              onClick={() => handleToggleAll(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-medium transition-colors cursor-pointer"
            >
              Desativar Todas
            </button>
          </div>
        </div>

        {/* Toggles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {ALERT_CATEGORIES.map((cat) => {
            const isEnabled = preferences.categories[cat] !== false;
            return (
              <div
                key={cat}
                onClick={() => handleToggleCategory(cat)}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  isEnabled
                    ? 'bg-slate-950/80 border-cyan-500/40 shadow-sm shadow-cyan-500/5'
                    : 'bg-slate-950/40 border-slate-800/80 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                    {getCategoryIcon(cat)}
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-slate-200">
                    {cat}
                  </span>
                </div>

                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => {}} // Handled by parent container click
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Housekeeping Section */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
        <h3 className="font-heading font-bold text-base text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Gerenciamento da Central de Notificações
        </h3>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
          <div>
            <span className="font-bold text-slate-200 block">Limpeza Automática de Notificações Antigas</span>
            <span className="text-slate-400">Remove notificações com mais de 14 dias do Firestore e do armazenamento local.</span>
          </div>

          <button
            onClick={clearOldNotifications}
            className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Limpar Antigas Now</span>
          </button>
        </div>
      </div>

    </div>
  );
};
