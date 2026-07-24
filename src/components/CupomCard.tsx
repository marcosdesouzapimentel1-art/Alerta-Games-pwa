import React, { useState } from 'react';
import { Coupon } from '../types';
import { useApp } from '../contexts/AppContext';
import {
  Copy,
  Check,
  ExternalLink,
  Ticket,
  Clock,
  Heart,
  ShieldCheck,
  Zap,
  Info,
  Share2,
} from 'lucide-react';

interface CupomCardProps {
  coupon: Coupon;
  compact?: boolean;
}

export const CupomCard: React.FC<CupomCardProps> = ({ coupon, compact = false }) => {
  const { favoriteCouponIds, toggleFavoriteCoupon, setSelectedCoupon, showToast } = useApp();
  const [copied, setCopied] = useState(false);

  const isFavorite = favoriteCouponIds.includes(coupon.id);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (coupon.code && coupon.code !== 'OFERTA_DIRETA') {
      navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      showToast(`Código ${coupon.code} copiado com sucesso! 📋`);
      setTimeout(() => setCopied(false), 2500);
    } else {
      handleGoToStore(e);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const storeName = coupon.store || coupon.storeName || 'Loja';
    const link = coupon.affiliateUrl || coupon.storeUrl || 'https://alertagame.app';
    const codeText = coupon.code ? ` Use o cupom ${coupon.code}.` : '';
    const shareData = {
      title: `Cupom: ${coupon.title}`,
      text: `Economize na ${storeName}! ${coupon.title}.${codeText}`,
      url: link,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(link);
      showToast('Link do cupom copiado!');
    }
  };

  const handleGoToStore = (e: React.MouseEvent) => {
    e.stopPropagation();
    const storeName = coupon.store || coupon.storeName || 'Loja';
    const targetUrl = coupon.affiliateUrl || coupon.storeUrl || 'https://alertagame.app';
    showToast(`Redirecionando para a loja ${storeName}... 🛒`);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleToggleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavoriteCoupon(coupon.id);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      onClick={() => setSelectedCoupon(coupon)}
      className="group relative rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 p-4 transition-all duration-300 shadow-lg hover:shadow-cyan-500/10 flex flex-col justify-between cursor-pointer overflow-hidden"
    >
      {/* Decorative Gradient Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-60 group-hover:opacity-100 transition-opacity" />

      {/* Top Bar: Store Logo + Name + Favorite Button */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <img
              src={coupon.storeLogoUrl}
              alt={coupon.storeName}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700 bg-slate-950 p-0.5 shrink-0"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-slate-200 group-hover:text-cyan-300 transition-colors">
                  {coupon.storeName}
                </span>
                {coupon.verifiedToday && (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" title="Verificado Hoje" />
                )}
              </div>
              <span className="text-[10px] text-slate-400 block font-medium">
                {coupon.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Discount Badge */}
            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md">
              {coupon.discountValueText || `${coupon.discountPercent}% OFF`}
            </span>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="p-1.5 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              title="Compartilhar cupom"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            {/* Heart Favorite Toggle */}
            <button
              onClick={handleToggleFav}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                isFavorite
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title={isFavorite ? 'Remover dos salvos' : 'Salvar cupom'}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Exclusive or Expiring Today Tags */}
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          {coupon.isExpiringToday ? (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 animate-pulse">
              <Clock className="w-3 h-3" /> Expirando Hoje!
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Até {formatDate(coupon.validUntil)}
            </span>
          )}

          {coupon.isExclusive && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Exclusivo
            </span>
          )}
        </div>

        {/* Offer Title */}
        <h3 className="font-bold text-sm text-slate-100 group-hover:text-white line-clamp-2 leading-snug mb-2">
          {coupon.title}
        </h3>

        {/* Description */}
        {!compact && (
          <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
            {coupon.description}
          </p>
        )}
      </div>

      {/* Coupon Code Container & Action Buttons */}
      <div className="pt-3 border-t border-slate-800/80 space-y-2 mt-2">
        {/* Code Display Area */}
        {coupon.code && coupon.code !== 'OFERTA_DIRETA' ? (
          <div
            onClick={handleCopyCode}
            className="group/code relative flex items-center justify-between p-2 rounded-xl bg-slate-950/90 border border-dashed border-cyan-500/40 hover:border-cyan-400 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Ticket className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-mono font-extrabold text-xs text-cyan-300 tracking-wider truncate">
                {coupon.code}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-bold flex items-center gap-1 shrink-0 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Desconto aplicado no carrinho
            </span>
          </div>
        )}

        {/* Action Buttons: Copiar Cupom & Ir para Loja */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleCopyCode}
            className="w-full py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span>Copiar Cupom</span>
              </>
            )}
          </button>

          <button
            onClick={handleGoToStore}
            className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-opacity cursor-pointer shadow-md shadow-cyan-500/20"
          >
            <span>Ir para Loja</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Click for details label */}
        <div className="text-center pt-1">
          <span className="text-[10px] text-slate-500 hover:text-slate-400 flex items-center justify-center gap-1 transition-colors">
            <Info className="w-3 h-3" /> Clique no card para regras e detalhes
          </span>
        </div>
      </div>
    </div>
  );
};
