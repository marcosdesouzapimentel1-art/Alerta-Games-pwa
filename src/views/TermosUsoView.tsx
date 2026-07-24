import React from 'react';
import { FileText, ArrowLeft, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const TermosUsoView: React.FC = () => {
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

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-wide font-display">Termos de Uso</h1>
            <p className="text-xs text-slate-400">Última atualização: 23 de Julho de 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" /> 1. Aceitação dos Termos
            </h2>
            <p>
              Ao acessar e utilizar a plataforma <strong>Alerta Game</strong>, você concorda expressamente com os presentes Termos de Uso. Caso não concorde com qualquer disposição, recomendamos interromper o uso do aplicativo.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-cyan-400" /> 2. Isenção sobre Promoções e Preços
            </h2>
            <p>
              O Alerta Game é uma plataforma agregadora de notícias, promoções e cupons gamer. Os preços e a disponibilidade das ofertas divulgadas estão sujeitos a alterações pelas respectivas lojas terceiras (como Steam, Epic Games, PlayStation Store, Xbox, Nuuvem, etc.) sem aviso prévio. Não nos responsabilizamos por divergências de preços nos sites finais.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" /> 3. Conduta do Usuário
            </h2>
            <p>
              É expressamente proibido o uso de automações maliciosas, ataques de negação de serviço (DDoS) ou tentativa de invasão dos sistemas e bancos de dados da plataforma. Usuários que violarem estas diretrizes terão suas contas permanentemente suspensas.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
