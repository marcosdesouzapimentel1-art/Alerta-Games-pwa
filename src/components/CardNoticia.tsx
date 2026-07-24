import React from 'react';
import { NewsItem } from '../types';
import { Clock, Bookmark, MessageSquare, Heart, Share2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface CardNoticiaProps {
  news: NewsItem;
}

export const CardNoticia: React.FC<CardNoticiaProps> = ({ news }) => {
  const { setSelectedNews, favoriteNewsIds, toggleFavoriteNews, showToast } = useApp();
  const isFavorited = favoriteNewsIds.includes(news.id);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: news.title,
        text: news.summary,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link da notícia copiado!');
    }
  };

  const imageSrc = news.image || news.imageUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80';
  const authorName = typeof news.author === 'string' ? news.author : news.author?.name || 'Alerta Game';
  const authorAvatar = typeof news.author === 'object' && news.author?.avatarUrl
    ? news.author.avatarUrl
    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';

  return (
    <article
      onClick={() => setSelectedNews(news)}
      className="group relative bg-slate-900/60 dark:bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/5 flex flex-col justify-between cursor-pointer"
    >
      <div>
        {/* Card Header Image */}
        <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-950">
          <img
            src={imageSrc}
            alt={news.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

          {/* Category Tag */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wider bg-slate-950/80 backdrop-blur-md text-cyan-400 border border-cyan-500/30">
              {news.category}
            </span>
            {news.source && (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-900/90 text-slate-300 border border-slate-800">
                {news.source}
              </span>
            )}
          </div>

          {/* Favorite Action Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavoriteNews(news.id);
            }}
            className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
              isFavorited
                ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
            title="Salvar Notícia"
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {news.readTimeMinutes || 3} min
            </span>
            <span>•</span>
            <span>{new Date(news.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
          </div>

          <h3 className="text-base sm:text-lg font-bold font-heading text-slate-100 group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug mb-2">
            {news.title}
          </h3>

          <p className="text-slate-400 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-4">
            {news.summary}
          </p>

          {/* Tags */}
          {news.tags && news.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {news.tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="text-[10px] text-cyan-400/80 bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-800/30">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-4 sm:px-5 pb-4 pt-0 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 mt-auto">
        <div className="flex items-center gap-2">
          <img
            src={authorAvatar}
            alt={authorName}
            referrerPolicy="no-referrer"
            className="w-5 h-5 rounded-full object-cover"
          />
          <span className="truncate max-w-[100px] sm:max-w-[130px] font-medium text-slate-300">
            {authorName}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 hover:text-rose-400 transition-colors">
            <Heart className="w-3.5 h-3.5" />
            {news.likesCount || 0}
          </span>
          <span className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
            <MessageSquare className="w-3.5 h-3.5" />
            {news.commentsCount || 0}
          </span>
          <button
            onClick={handleShare}
            className="hover:text-cyan-400 transition-colors p-1"
            title="Compartilhar"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};
