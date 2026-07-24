import React from 'react';
import { Shield, ArrowLeft, Lock, Eye, FileText, Bell } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const PoliticaPrivacidadeView: React.FC = () => {
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
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-wide font-display">Política de Privacidade</h1>
            <p className="text-xs text-slate-400">Última atualização: 23 de Julho de 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" /> 1. Informações que Coletamos
            </h2>
            <p>
              O <strong>Alerta Game</strong> respeita sua privacidade. Coletamos apenas as informações necessárias para fornecer e melhorar nossos serviços, tais como:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
              <li>Dados de conta (E-mail, Nome de Exibição, Avatar/Nickname Gamer) fornecidos voluntariamente.</li>
              <li>Preferências de jogos, notificações e categorias favoritadas.</li>
              <li>Tokens de Notificação Push (FCM) para envio de alertas configurados por você.</li>
              <li>Dados anônimos de uso para análise de desempenho e usabilidade via Google Analytics.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" /> 2. Uso das Informações
            </h2>
            <p>
              Seus dados são utilizados exclusivamente para personalização da experiência gamer no aplicativo, envio de notificações sobre jogos grátis, lançamentos e cupons de desconto, além do aprimoramento contínuo das funcionalidades do PWA.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" /> 3. Notificações Push & PWA
            </h2>
            <p>
              As notificações Push são estritamente opcionais e podem ser ativadas ou desativadas a qualquer momento nas configurações do seu navegador ou no próprio aplicativo.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" /> 4. Seus Direitos & Exclusão de Dados
            </h2>
            <p>
              Você pode solicitar a alteração ou exclusão definitiva da sua conta e dados armazenados no Firebase a qualquer momento através da página de Perfil ou entrando em contato pelo nosso e-mail de suporte.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
