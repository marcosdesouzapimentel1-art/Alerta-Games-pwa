import React, { useState, useEffect } from 'react';
import { NewsItem } from '../types';
import { ChevronLeft, ChevronRight, Clock, Bookmark, Eye, ArrowRight, Sparkles } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface BannerPrincipalProps {
  banners: NewsItem[];
}

export const BannerPrincipal: React.FC<BannerPrincipalProps> = ({ banners }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { setSelectedNews, favoriteNewsIds, toggleFavoriteNews } = useApp();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners || banners.length === 0) return null;

  const current = banners[currentIndex];
  const isFavorited = favoriteNewsIds.includes(current.id);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-800/80 shadow-2xl group my-4">
      {/* Background Image with Gradient Overlay */}
      <div className="relative h-72 sm:h-96 md:h-[420px] w-full overflow-hidden">
        <img
          src={current.imageUrl}
          alt={current.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        
        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent hidden sm:block" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500 text-slate-950 flex items-center gap-1 shadow-md shadow-cyan-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              {current.category}
            </span>
            {current.featured && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/80 backdrop-blur-md text-white border border-purple-400/30 hidden xs:inline-block">
                Destaque
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavoriteNews(current.id);
            }}
            className={`p-2.5 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
              isFavorited
                ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30'
                : 'bg-slate-900/60 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
            }`}
            title="Salvar nos Favoritos"
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Bottom Banner Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 z-10 flex flex-col justify-end">
          <div className="flex items-center gap-4 text-xs text-slate-300 mb-2 font-medium">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {current.readTimeMinutes} min de leitura
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              {current.viewsCount.toLocaleString()} leituras
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold font-heading text-white line-clamp-2 leading-tight mb-2 drop-shadow-md">
            {current.title}
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm line-clamp-2 max-w-2xl mb-4 hidden xs:block leading-relaxed">
            {current.summary}
          </p>

          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              onClick={() => setSelectedNews(current)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-cyan-500/30 transition-all active:scale-95 cursor-pointer"
            >
              <span>Ler Notícia Completa</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Slider Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={prevSlide}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-md transition-colors cursor-pointer"
                title="Banner Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1 px-1">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === currentIndex ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-md transition-colors cursor-pointer"
                title="Próximo Banner"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
