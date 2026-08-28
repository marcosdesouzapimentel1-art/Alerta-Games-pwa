import React from 'react';
import { X, Tag, Bell, ExternalLink, Copy, Check, Star, ArrowLeft, ShieldCheck, Flame } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const DealDetailModal: React.FC = () => {
  const { selectedDeal, setSelectedDeal, favoriteDealIds, toggleFavoriteDeal, showToast } = useApp();
  const [copied, setCopied] = React.useState(false);

  if (!selectedDeal) return null;

  const isTracked = favoriteDealIds.includes(selectedDeal.id);

  // Mapeamento seguro para suportar tanto os dados do Firestore quanto os mocks
  const title = (selectedDeal as any).productTitle || selectedDeal.gameTitle || 'Oferta Especial';
  const image = (selectedDeal as any).image || selectedDeal.imageUrl || '';
  const storeName = selectedDeal.store || 'Loja Parceira';
  const discountPct = selectedDeal.discountPercent ?? 0;
  const currentPrice = Number((selectedDeal as any).currentPrice ?? selectedDeal.discountPrice ?? 0);
  const oldPrice = Number((selectedDeal as any).oldPrice ?? selectedDeal.originalPrice ?? 0);
  const ratingVal = Number(selectedDeal.rating ?? 5.0);
  const coupon = selectedDeal.couponCode || '';
  const isLow = selectedDeal.isHistoricalLow || false;
  const targetUrl = (selectedDeal as any).affiliateUrl || (selectedDeal as any).dealUrl || selectedDeal.link || '#';

  const handleCopyCoupon = () => {
    if (coupon) {
      navigator.clipboard.writeText(coupon);
      setCopied(true);
      showToast(`Cupom ${coupon} copiado!`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl min-h-screen sm:min-h-0 bg-slate-950 sm:bg-slate-900 border-0 sm:border border-slate-800 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scaleUp">
        
        {/* Modal Header */}
        <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setSelectedDeal(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl bg-slate-800/80 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <button
            onClick={() => setSelectedDeal(null)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* Game Image Banner */}
          <div className="relative h-52 sm:h-60 w-full rounded-2xl overflow-hidden bg-slate-950">
            <img
              src={image}
              alt={title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl text-sm font-black bg-emerald-500 text-slate-950 flex items-center gap-1 shadow-lg shadow-emerald-500/30">
                <Tag className="w-4 h-4 fill-current" />
                -{discountPct}% OFF
              </span>
              {isLow && (
                <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-500 text-slate-950 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  MENOR PREÇO HISTÓRICO
                </span>
              )}
            </div>
          </div>

          {/* Game Info & Rating */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                {storeName}
              </span>
              <div className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                <Star className="w-4 h-4 fill-current" />
                <span>{ratingVal.toFixed(1)} / 5.0</span>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-100 mb-2">
              {title}
            </h2>
          </div>

          {/* Pricing Box */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block mb-0.5">Preço Promocional:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-heading text-emerald-400">
                  R$ {currentPrice.toFixed(2).replace('.', ',')}
                </span>
                {oldPrice > 0 && (
                  <span className="text-sm text-slate-500 line-through">
                    R$ {oldPrice.toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>
            </div>

            {oldPrice > currentPrice && (
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Economia de:</span>
                <span className="text-sm font-bold text-emerald-400">
                  R$ {(oldPrice - currentPrice).toFixed(2).replace('.', ',')}
                </span>
              </div>
            )}
          </div>

          {/* Coupon Option */}
          {coupon && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs text-slate-300 font-medium block">Cupom de Desconto Especial:</span>
                <span className="text-sm font-mono font-extrabold text-emerald-400">{coupon}</span>
              </div>
              <button
                onClick={handleCopyCoupon}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-400 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado!' : 'Copiar Cupom'}</span>
              </button>
            </div>
          )}

          {/* Safety Verification Badge */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Oferta verificada pela equipe Alerta Game. Link direto e seguro da loja oficial.</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => toggleFavoriteDeal(selectedDeal.id)}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isTracked
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>{isTracked ? 'Alerta Ativado' : 'Ativar Alerta de Preço'}</span>
            </button>

            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 rounded-xl text-sm font-extrabold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Acessar Loja Oficial</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};
