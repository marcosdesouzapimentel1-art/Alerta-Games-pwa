import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

interface ErrorScreenProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({
  title = 'Ops! Game Over temporário',
  message = 'Ocorreu uma falha ao carregar as informações do servidor. Verifique sua conexão com a internet.',
  onRetry,
  onGoHome,
}) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-6 shadow-xl shadow-rose-500/10">
        <AlertTriangle className="w-10 h-10 animate-bounce" />
      </div>
      <h2 className="text-2xl font-bold font-heading text-slate-100 mb-2">{title}</h2>
      <p className="text-slate-400 text-sm max-w-sm mb-8 leading-relaxed">{message}</p>
      
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button variant="primary" icon={<RefreshCw className="w-4 h-4" />} onClick={onRetry}>
            Tentar Novamente
          </Button>
        )}
        {onGoHome && (
          <Button variant="secondary" icon={<Home className="w-4 h-4" />} onClick={onGoHome}>
            Ir para Início
          </Button>
        )}
      </div>
    </div>
  );
};
