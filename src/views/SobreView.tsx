import React from 'react';
import { Gamepad2, ArrowLeft, Zap, Bell, Flame, Shield, Heart } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const SobreView: React.FC = () => {
  const { setActiveTab } = useApp();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      <button
        onClick={() => setActiveTab('inicio')}
        className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 text-sm font-medium transition-colors cursor-pointer mb-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar ao Início</span>
      </button>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm space-y-8">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left border-b border-slate-800 pb-6">
          <div className="p-4 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400 rounded-2xl border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
            <Gamepad2 className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-wide font-display">Alerta Game</h1>
            <p className="text-sm text-cyan-400 font-medium">Sua Central PWA Gamer de Notícias e Promoções</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <p>
            O <strong>Alerta Game</strong> é um aplicativo web progressivo (PWA) de alta performance criado para conectar jogadores brasileiros às melhores novidades, ofertas imperdíveis e jogos gratuitos disponíveis nas maiores plataformas do mercado mundial.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Flame className="w-5 h-5" />
                <span>Ofertas em Tempo Real</span>
              </div>
              <p className="text-xs text-slate-400">
                Monitore descontos históricos e bug de preços da Steam, Epic Games, PlayStation, Xbox e Nintendo.
              </p>
            </div>

            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Zap className="w-5 h-5" />
                <span>Jogos Grátis</span>
              </div>
              <p className="text-xs text-slate-400">
                Receba alertas instantâneos sempre que um jogo pago for disponibilizado 100% grátis para resgate.
              </p>
            </div>

            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <Bell className="w-5 h-5" />
                <span>Alertas Personalizados</span>
              </div>
              <p className="text-xs text-slate-400">
                Configure palavras-chave e receba notificações Push direcionadas diretamente no seu dispositivo.
              </p>
            </div>

            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <Shield className="w-5 h-5" />
                <span>Modo Offline PWA</span>
              </div>
              <p className="text-xs text-slate-400">
                Acesse suas notícias e ofertas salvas mesmo sem conexão com a internet através da tecnologia de Service Worker.
              </p>
            </div>
          </div>

          <p className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-4 border-t border-slate-800">
            <span>Desenvolvido com</span>
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>para a comunidade Gamer do Brasil.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
