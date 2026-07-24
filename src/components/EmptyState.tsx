import React from 'react';
import { Ghost } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Nenhum resultado encontrado',
  description = 'Não encontramos nada com os critérios selecionados. Tente buscar por outros termos ou categorias.',
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 my-6 text-center bg-slate-900/50 dark:bg-slate-900/40 border border-slate-800/80 rounded-2xl max-w-md mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-500/5">
        {icon || <Ghost className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-bold text-slate-100 mb-1">{title}</h3>
      <p className="text-slate-400 text-sm mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
