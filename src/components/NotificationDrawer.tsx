import React from 'react';
import { X, Bell, CheckCheck, Tag, Newspaper, Rocket, ShieldCheck, Trash2, Settings, ExternalLink } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const NotificationDrawer: React.FC = () => {
  const {
    isNotificationDrawerOpen,
    setIsNotificationDrawerOpen,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    setActiveTab,
  } = useApp();

  if (!isNotificationDrawerOpen) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deal':
        return <Tag className="w-4 h-4 text-emerald-400" />;
      case 'news':
        return <Newspaper className="w-4 h-4 text-cyan-400" />;
      case 'release':
        return <Rocket className="w-4 h-4 text-purple-400" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-blue-400" />;
    }
  };

  const handleNotificationClick = (item: any) => {
    markNotificationAsRead(item.id);
    if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      {/* Drawer Overlay backdrop click */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={() => setIsNotificationDrawerOpen(false)}
      />

      {/* Drawer Content */}
      <div className="relative w-full max-w-md h-full bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col z-10 animate-slideLeft">
        
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-slate-100">Central de Notificações</h2>
              <p className="text-xs text-slate-400">Alertas de ofertas, notícias e lançamentos</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setIsNotificationDrawerOpen(false);
                setActiveTab('configuracoes');
              }}
              title="Configurar Alertas"
              className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsNotificationDrawerOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="px-5 py-3 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            {notifications.filter((n) => !n.read).length} não lidas
          </span>
          <button
            onClick={markAllNotificationsAsRead}
            className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            Marcar todas como lidas
          </button>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Nenhuma notificação no momento.
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all relative group ${
                  item.read
                    ? 'bg-slate-900/30 border-slate-800/60 text-slate-400'
                    : 'bg-slate-900/90 border-cyan-500/40 text-slate-100 shadow-md shadow-cyan-500/5'
                }`}
              >
                {!item.read && (
                  <span className="absolute top-4 right-10 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                )}

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(item.id);
                  }}
                  title="Excluir notificação"
                  className="absolute top-3 right-3 p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div
                  onClick={() => handleNotificationClick(item)}
                  className="flex items-start gap-3 cursor-pointer"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-800"
                    />
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-800/80 shrink-0 mt-0.5">
                      {getNotificationIcon(item.type)}
                    </div>
                  )}

                  <div className="space-y-1 pr-6 flex-1">
                    {item.category && (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-400 border border-slate-700/80 mb-0.5">
                        {item.category}
                      </span>
                    )}
                    <h4 className="font-bold text-sm leading-snug hover:text-cyan-400 transition-colors flex items-center gap-1">
                      {item.title}
                      {item.url && <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{item.message}</p>
                    <span className="text-[10px] text-slate-500 block pt-1">{item.timestamp}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Button to Configure Alerts */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <button
            onClick={() => {
              setIsNotificationDrawerOpen(false);
              setActiveTab('configuracoes');
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Gerenciar Preferências de Alertas FCM</span>
          </button>
        </div>

      </div>
    </div>
  );
};

