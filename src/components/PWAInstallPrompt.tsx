import React, { useState } from 'react';
import { Download, X, Sparkles, Wifi } from 'lucide-react';
import { usePWA } from '../contexts/PWAContext';

export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-30 bg-slate-900/95 border border-cyan-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-slideUp">
      <div className="flex items-start justify-between gap-3">
        
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shrink-0 shadow-md shadow-cyan-500/30">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>

          <div className="space-y-1">
            <h4 className="font-heading font-extrabold text-sm text-slate-100 flex items-center gap-1.5">
              Instalar Alerta Game
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Adicione o app à sua tela inicial para acesso instantâneo, navegação offline e alertas de ofertas!
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={promptInstall}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar Agora</span>
              </button>

              <button
                onClick={() => setDismissed(true)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-slate-500 hover:text-white transition-colors p-1 cursor-pointer"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};
