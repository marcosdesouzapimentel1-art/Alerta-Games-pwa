import React from 'react';
import { UpcomingRelease } from '../types';
import { Calendar, Bell, Rocket, ExternalLink } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface CardLancamentoProps {
  release: UpcomingRelease;
}

export const CardLancamento: React.FC<CardLancamentoProps> = ({ release }) => {
  const { trackedReleaseIds, toggleTrackRelease, showToast } = useApp();
  const isTracked = trackedReleaseIds.includes(release.id);

  // Calculate days remaining
  const releaseDateObj = new Date(release.releaseDate);
  const today = new Date();
  const diffTime = releaseDateObj.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return (
    <div className="group bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 flex flex-col justify-between">
      <div>
        <div className="relative h-40 w-full overflow-hidden bg-slate-950">
          <img
            src={release.imageUrl}
            alt={release.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

          {/* Days Left Badge */}
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-purple-600 text-white shadow-lg shadow-purple-600/30 flex items-center gap-1">
              <Rocket className="w-3.5 h-3.5" />
              {daysLeft > 0 ? `Faltam ${daysLeft} dias` : 'Lançado HOJE!'}
            </span>
          </div>

          {/* Reminder Bell Button */}
          <button
            onClick={() => toggleTrackRelease(release.id)}
            className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
              isTracked
                ? 'bg-purple-500 text-white border-purple-400 shadow-md shadow-purple-500/30'
                : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
            title={isTracked ? 'Lembrete Ativo' : 'Ativar Lembrete de Lançamento'}
          >
            <Bell className={`w-4 h-4 ${isTracked ? 'fill-current animate-bounce' : ''}`} />
          </button>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            <span>
              {releaseDateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>

          <h3 className="text-lg font-bold font-heading text-slate-100 group-hover:text-purple-400 transition-colors line-clamp-1 mb-2">
            {release.title}
          </h3>

          <p className="text-slate-400 text-xs line-clamp-2 mb-3 leading-relaxed">
            {release.description}
          </p>

          {/* Platform tags */}
          <div className="flex flex-wrap gap-1.5">
            {release.platforms.map((p) => (
              <span key={p} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/60">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-5 pb-4 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
        <span className="text-slate-400 text-[11px] truncate max-w-[140px]">
          Dev: {release.developer}
        </span>

        {release.preOrderUrl ? (
          <a
            href={release.preOrderUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 font-bold text-purple-400 hover:text-purple-300"
          >
            <span>Garantir Pré-venda</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <button
            onClick={() => toggleTrackRelease(release.id)}
            className="font-bold text-purple-400 hover:text-purple-300"
          >
            {isTracked ? 'Lembrete Ativo ✓' : 'Acompanhar'}
          </button>
        )}
      </div>
    </div>
  );
};
