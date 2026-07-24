import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Clock,
  Ticket,
  Heart,
  Share2,
  AlertCircle,
  Zap,
  ShoppingBag,
} from 'lucide-react';

export const CupomDetails: React.FC = () => {
  const {
    selectedCoupon,
    setSelectedCoupon,
    favoriteCouponIds,
    toggleFavoriteCoupon,
    showToast,
  } = useApp();

  const [copied, setCopied] = useState(false);

  if (!selectedCoupon) return null;

  const isFavorite = favoriteCouponIds.includes(selectedCoupon.id);

  const handleCopyCode = () => {
    if (selectedCoupon.code && selectedCoupon.code !== 'OFERTA_DIRETA') {
      navigator.clipboard.writeText(selectedCoupon.code);
      setCopied(true);
      showToast(`Código ${selectedCoupon.code} copiado! 📋`);
      setTimeout(() => setCopied(false), 2500);
    } else {
      handleGoToStore();
    }
  };

  const handleGoToStore = () => {
    const url = selectedCoupon.affiliateUrl || selectedCoupon.storeUrl;
    showToast(`Redirecionando para a loja ${selectedCoupon.storeName}... 🛒`);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: selectedCoupon.title,
          text: `Confira este cupom na ${selectedCoupon.storeName}: ${selectedCoupon.title}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `Cupom ${selectedCoupon.storeName}: ${selectedCoupon.title} (Código: ${selectedCoupon.code || 'Ativação Direta'})`
      );
      showToast('Link do cupom copiado para a área de transferência! 🔗');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      onClick={() => setSelectedCoupon(null)}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-7 space-y-6 overflow-hidden my-8"
      >
        {/* Top Decorative bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600" />

        {/* Close Button & Actions Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {selectedCoupon.category}
            </span>
            {selectedCoupon.isExclusive && (
              <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> Exclusivo
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavoriteCoupon(selectedCoupon.id)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isFavorite
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Salvar cupom"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Compartilhar"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSelectedCoupon(null)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Store Header Info */}
        <div className="flex items-center gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
          <img
            src={selectedCoupon.storeLogoUrl}
            alt={selectedCoupon.storeName}
            referrerPolicy="no-referrer"
            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-cyan-500/30 bg-slate-950 p-1 shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black font-heading text-slate-100">
                {selectedCoupon.storeName}
              </h2>
              {selectedCoupon.verifiedToday && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" /> Testado Hoje
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Usado {selectedCoupon.usesCount.toLocaleString('pt-BR')} vezes este mês
            </p>
          </div>
        </div>

        {/* Main Discount & Title */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-2xl text-base font-black bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/20">
              {selectedCoupon.discount || `${selectedCoupon.discountPercent || 10}% OFF`}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              {selectedCoupon.isExpiringToday ? (
                <span className="text-rose-400 font-bold">Expirando Hoje!</span>
              ) : (
                `Válido até ${formatDate(selectedCoupon.validUntil)}`
              )}
            </span>
          </div>

          <h3 className="text-xl font-black font-heading text-slate-100 leading-snug">
            {selectedCoupon.title}
          </h3>

          <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/50">
            {selectedCoupon.description}
          </p>
        </div>

        {/* Coupon Code Container */}
        {selectedCoupon.code && selectedCoupon.code !== 'OFERTA_DIRETA' ? (
          <div className="p-4 rounded-2xl bg-slate-950 border border-dashed border-cyan-500/60 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2.5">
              <Ticket className="w-6 h-6 text-cyan-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Código do Cupom:</span>
                <span className="font-mono font-black text-lg text-cyan-300 tracking-wider">
                  {selectedCoupon.code}
                </span>
              </div>
            </div>

            <button
              onClick={handleCopyCode}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>Código Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Código</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-slate-200 block">Sem necessidade de código</span>
              <span className="text-slate-400">O desconto é aplicado automaticamente ao clicar no botão ir para a loja.</span>
            </div>
          </div>
        )}

        {/* Rules & Requirements */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-cyan-400" /> Regras e Condições
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-400 list-disc list-inside bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
            {selectedCoupon.minimumPurchase && (
              <li>Compra mínima necessária: R$ {selectedCoupon.minimumPurchase.toFixed(2)}</li>
            )}
            {selectedCoupon.rules?.map((rule, idx) => (
              <li key={idx}>{rule}</li>
            )) || <li>Sujeito a alterações sem aviso prévio pela loja parceira.</li>}
          </ul>
        </div>

        {/* Affiliate Disclosure Notice */}
        <div className="text-[11px] text-slate-500 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 flex items-start gap-2">
          <ShoppingBag className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p>
            O Alerta Game pode receber uma pequena comissão através do link de afiliado caso você conclua uma compra na loja. Você não paga nada a mais por isso!
          </p>
        </div>

        {/* Final CTA Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleCopyCode}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-700"
          >
            <Copy className="w-4 h-4 text-cyan-400" />
            <span>{copied ? 'Copiado!' : 'Copiar Cupom'}</span>
          </button>

          <button
            onClick={handleGoToStore}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-opacity cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            <span>Ir para a Loja Oficial</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
