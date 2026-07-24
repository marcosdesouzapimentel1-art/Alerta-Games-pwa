import React from 'react';
import { X, Clock, Bookmark, Share2, Heart, Eye, ArrowLeft } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const NewsDetailModal: React.FC = () => {
  const { selectedNews, setSelectedNews, favoriteNewsIds, toggleFavoriteNews, showToast } = useApp();

  if (!selectedNews) return null;

  const isFavorited = favoriteNewsIds.includes(selectedNews.id);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: selectedNews.title,
        text: selectedNews.summary,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link da notícia copiado para a área de transferência!');
    }
  };

  const imageSrc = selectedNews.image || selectedNews.imageUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80';
  const authorName = typeof selectedNews.author === 'string' ? selectedNews.author : selectedNews.author?.name || 'Alerta Game';
  const authorAvatar = typeof selectedNews.author === 'object' && selectedNews.author?.avatarUrl
    ? selectedNews.author.avatarUrl
    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl min-h-screen sm:min-h-0 sm:max-h-[90vh] bg-slate-950 sm:bg-slate-900 border-0 sm:border border-slate-800 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scaleUp">
        
        {/* Sticky Modal Top Bar */}
        <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setSelectedNews(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl bg-slate-800/80 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavoriteNews(selectedNews.id)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isFavorited
                  ? 'bg-rose-500 text-white border-rose-400'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Salvar Favorito"
            >
              <Bookmark className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
              title="Compartilhar"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSelectedNews(null)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          
          {/* Header Cover */}
          <div className="relative h-60 sm:h-80 w-full rounded-2xl overflow-hidden bg-slate-950">
            <img
              src={imageSrc}
              alt={selectedNews.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
            
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-slate-300">
              <span className="px-3 py-1 rounded-full font-bold uppercase bg-cyan-500 text-slate-950">
                {selectedNews.category}
              </span>
              <span className="flex items-center gap-1 font-semibold bg-slate-950/80 px-2.5 py-1 rounded-full border border-slate-800">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                {selectedNews.readTimeMinutes || 3} min de leitura
              </span>
            </div>
          </div>

          {/* Title & Metadata */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-100 leading-tight mb-4">
              {selectedNews.title}
            </h1>

            <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-2.5">
                <img
                  src={authorAvatar}
                  alt={authorName}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-cyan-500/30"
                />
                <div>
                  <span className="font-bold text-slate-200 block">{authorName}</span>
                  <span className="text-[10px] text-slate-500">
                    Fonte: {selectedNews.source || 'Alerta Game'} • {new Date(selectedNews.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  {selectedNews.viewsCount || 100}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-rose-400" />
                  {selectedNews.likesCount || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Formatted Content */}
          <div className="text-slate-300 text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-line font-normal">
            <p className="text-slate-200 font-medium text-base sm:text-lg border-l-4 border-cyan-400 pl-4 italic">
              {selectedNews.summary}
            </p>
            <div>{selectedNews.content}</div>
          </div>

          {/* Tags */}
          {selectedNews.tags && selectedNews.tags.length > 0 && (
            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tags</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedNews.tags.map((tag, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-cyan-300 border border-slate-700">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Source Link */}
          {selectedNews.url && (
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Ver matéria original na íntegra:</span>
              <a
                href={selectedNews.url}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
              >
                Acessar Fonte Original
              </a>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
