import React, { useState } from 'react';
import { Coupon } from '../types';
import { useApp } from '../contexts/AppContext';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Zap,
  ShieldCheck,
} from 'lucide-react';

interface CupomCarouselProps {
  featuredCoupons: Coupon[];
}

export const CupomCarousel: React.FC<CupomCarouselProps> = ({ featuredCoupons }) => {
  const { setSelectedCoupon, showToast } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (featuredCoupons.length === 0) return null;

  const currentCoupon = featuredCoupons[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredCoupons.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredCoupons.length) % featuredCoupons.length);
  };

  const handleCopyCode = (e: React.MouseEvent, coupon: Coupon) => {
    e.stopPropagation();
    if (coupon.code && coupon.code !== 'OFERTA_DIRETA') {
      navigator.clipboard.writeText(coupon.code);
      setCopiedId(coupon.id);
      showToast(`Cupom ${coupon.code} copiado! 📋`);
      setTimeout(() => setCopiedId(null), 2500);
    } else {
      window.open(coupon.affiliateUrl || coupon.storeUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-black font-heading text-slate-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400/20" />
          Destaques & Cupons Exclusivos
        </h2>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-slate-400 px-1">
            {currentIndex + 1}/{featuredCoupons.length}
          </span>
          <button
            onClick={handleNext}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Banner Container */}
      <div
        onClick={() => setSelectedCoupon(currentCoupon)}
        className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/40 p-5 sm:p-6 shadow-2xl overflow-hidden cursor-pointer group transition-all duration-300"
      >
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/20 transition-all" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          {/* Left Content */}
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-lg">
                {currentCoupon.discount || `${currentCoupon.discountPercent || 10}% OFF`}
              </span>

              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-800 text-cyan-300 border border-slate-700 flex items-center gap-1.5">
                <img
                  src={currentCoupon.storeLogoUrl}
                  alt={currentCoupon.storeName}
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 rounded-md object-cover"
                />
                {currentCoupon.storeName}
              </span>

              {currentCoupon.isExclusive && (
                <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> Exclusivo Alerta Game
                </span>
              )}
            </div>

            <h3 className="text-lg sm:text-xl font-black font-heading text-slate-100 group-hover:text-cyan-300 transition-colors leading-snug">
              {currentCoupon.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 line-clamp-2">
              {currentCoupon.description}
            </p>
          </div>

          {/* Right Action Box */}
          <div className="w-full md:w-auto shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/90">
            {currentCoupon.code && currentCoupon.code !== 'OFERTA_DIRETA' ? (
              <button
                onClick={(e) => handleCopyCode(e, currentCoupon)}
                className="py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                {copiedId === currentCoupon.id ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Código Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar {currentCoupon.code}</span>
                  </>
                )}
              </button>
            ) : (
              <div className="px-3 py-2 text-center text-xs text-amber-400 font-bold bg-amber-500/10 rounded-xl border border-amber-500/20">
                Desconto direto no site
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(currentCoupon.affiliateUrl || currentCoupon.storeUrl, '_blank', 'noopener,noreferrer');
              }}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-700"
            >
              <span>Ir para a Loja</span>
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          </div>
        </div>

        {/* Dots Navigation */}
        <div className="flex items-center justify-center gap-1.5 mt-4 pt-2 border-t border-slate-800/50">
          {featuredCoupons.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentIndex ? 'w-6 bg-cyan-400' : 'w-1.5 bg-slate-700 hover:bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
