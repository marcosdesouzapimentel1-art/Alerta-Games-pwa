import React, { useState } from 'react';
import { usePWA } from '../contexts/PWAContext';
import {
  Download,
  X,
  Smartphone,
  CheckCircle2,
  Share,
  PlusSquare,
  Sparkles,
  Zap,
  Globe,
  MoreVertical,
} from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios'>('android');

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5 overflow-hidden my-6"
      >
        {/* Top Decorative Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600" />

        {/* Header & Close */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-slate-100">
                Instalar no Celular
              </h3>
              <p className="text-xs text-slate-400">
                Alerta Game PWA (iOS & Android)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Already Installed Alert */}
        {isInstalled ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Aplicativo já instalado!</span>
            </div>
            <p className="text-slate-300">
              O Alerta Game já está rodando em modo nativo Standalone na sua tela de início.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick Install Banner (If Prompt Available) */}
            {isInstallable && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/40 space-y-3">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>Instalação Direta Pronta!</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Seu navegador suporta a instalação com apenas um clique na tela inicial.
                </p>
                <button
                  onClick={async () => {
                    await promptInstall();
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Instalar Agora no Meu Celular</span>
                </button>
              </div>
            )}

            {/* Platform Selector Tabs */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 block">
                Instruções passo a passo por sistema:
              </label>

              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setActivePlatform('android')}
                  className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activePlatform === 'android'
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Android (Chrome)</span>
                </button>

                <button
                  onClick={() => setActivePlatform('ios')}
                  className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activePlatform === 'ios'
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>iPhone (iOS Safari)</span>
                </button>
              </div>

              {/* Instructions Box */}
              {activePlatform === 'android' ? (
                <div className="space-y-2.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </span>
                    <p>
                      Abra o site no navegador <strong className="text-white">Google Chrome</strong> ou <strong className="text-white">Edge</strong> no seu Android.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </span>
                    <p className="flex items-center gap-1 flex-wrap">
                      Toque no menu de <strong className="text-white">três pontos <MoreVertical className="w-3.5 h-3.5 inline text-cyan-400" /></strong> no canto superior direito.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </span>
                    <p>
                      Selecione <strong className="text-cyan-300">"Instalar aplicativo"</strong> ou <strong className="text-cyan-300">"Adicionar à Tela Inicial"</strong>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </span>
                    <p>
                      Abra este site utilizando o <strong className="text-white">Safari</strong> no seu iPhone ou iPad.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </span>
                    <p className="flex items-center gap-1 flex-wrap">
                      Toque no ícone de <strong className="text-white">Compartilhar <Share className="w-3.5 h-3.5 inline text-cyan-400" /></strong> na barra inferior.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </span>
                    <p className="flex items-center gap-1 flex-wrap">
                      Role para baixo e selecione <strong className="text-cyan-300">"Adicionar à Tela de Início" <PlusSquare className="w-3.5 h-3.5 inline text-cyan-400" /></strong>.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      4
                    </span>
                    <p>
                      Toque em <strong className="text-white">"Adicionar"</strong> no canto superior direito para concluir.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Benefits List */}
        <div className="space-y-1.5 pt-1 text-[11px] text-slate-400 border-t border-slate-800">
          <span className="font-bold text-slate-300 block">Vantagens do PWA Instalado:</span>
          <div className="grid grid-cols-2 gap-2">
            <span className="flex items-center gap-1 text-slate-300">
              <Zap className="w-3 h-3 text-amber-400" /> Modo Tela Cheia
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Alertas de Descontos
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <CheckCircle2 className="w-3 h-3 text-cyan-400" /> Navegação Offline
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <CheckCircle2 className="w-3 h-3 text-purple-400" /> Carregamento Rápido
            </span>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
        >
          Entendi / Fechar
        </button>
      </div>
    </div>
  );
};
