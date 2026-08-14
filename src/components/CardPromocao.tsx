import React from 'react';
import { Tag, Bell, Flame, Copy, Check, Star, ExternalLink } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface CardPromocaoProps {
  deal: any; // Aceita tanto GameDeal (Mocks) quanto Promotion (Firebase)
}

export const CardPromocao: React.FC<CardPromocaoProps> = ({ deal }) => {
  const { setSelectedDeal, favoriteDealIds, toggleFavoriteDeal, showToast } = useApp();
  const [copiedCoupon, setCopiedCoupon] = React.useState(false);

  const isTracked = favoriteDealIds.includes(deal?.id);

  // Mapeamento seguro de propriedades (Firebase Real vs Mocks) + Fallback para falhas
  const title = deal?.productTitle || deal?.gameTitle || 'Oferta Especial';
  const image = deal?.image || deal?.imageUrl || '';
  const store = deal?.store || 'Loja';
  const discountPct = deal?.discountPercent ?? 0;
  const currentPrice = Number(deal?.currentPrice ?? deal?.discountPrice ?? 0);
  const oldPrice = Number(deal?.oldPrice ?? deal?.originalPrice ?? 0);
  const coupon = deal?.couponCode || '';
  const isLow = deal?.isHistoricalLow || false;
  const rating = Number(deal?.rating ?? 5.0);
  
  // Tratamento seguro de data
  const rawDate = deal?.expirationDate || deal?.expiresAt;
  const displayDate = rawDate 
    ? new Date(rawDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) 
    : 'Sem data';

  const handleCopyCoupon = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (coupon) {
      navigator.clipboard.writeText(coupon);
      setCopiedCoupon(true);
      showToast(`Cupom ${coupon} copiado!`);
      setTimeout(() => setCopiedCoupon(false), 2000);
    }
  };

  const getStoreBadgeColor = (storeName: string) => {
    switch (storeName) {
      case 'Steam':
        return 'bg-blue-600/20 text-blue-400 border-blue-500/30';
      case 'PlayStation Store':
        return 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30';
      case 'Xbox Store':
        return 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30';
      case 'Nintendo eShop':
        return 'bg-rose-600/20 text-rose-400 border-rose-500/30';
      case 'Epic Games':
        return 'bg-amber-600/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-cyan-600/20 text-cyan-400 border-cyan-500/30';
    }
  };

  return (
    <div
      onClick={() => setSelectedDeal(deal)}
      className="group relative bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 flex flex-col justify-between cursor-pointer"
    >
      <div>
        {/* Deal Cover Image */}
        <div className="relative h-40 sm:h-44 w-full overflow-hidden bg-slate-950">
          <img
            src={image}
            alt={title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

          {/* Discount Tag */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/30 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 fill-current" />
              -{discountPct}%
            </span>
            {isLow && (
              <span className="px-2 py-1 rounded-lg text-[10px] font-extrabold bg-amber-500 text-slate-950 flex items-center gap-0.5 shadow-md shadow-amber-500/20">
                <Flame className="w-3 h-3 fill-current" />
                MENOR PREÇO
              </span>
            )}
          </div>

          {/* Alert Bell Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (deal?.id) toggleFavoriteDeal(deal.id);
            }}
            className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
              isTracked
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30'
                : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
            title={isTracked ? 'Alerta Ativo' : 'Ativar Alerta de Preço'}
          >
            <Bell className={`w-4 h-4 ${isTracked ? 'fill-current animate-bounce' : ''}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${getStoreBadgeColor(store)}`}>
              {store}
            </span>
            <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{rating.toFixed(1)}</span>
            </div>
          </div>

          <h3 className="text-base font-extrabold font-heading text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-1 mb-3">
            {title}
          </h3>

          {/* Coupon Code section */}
          {coupon && (
            <div
              onClick={handleCopyCoupon}
              className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-xs mb-3 hover:bg-slate-950 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-slate-300 font-mono">
                <span className="text-slate-400">Cupom:</span>
                <span className="font-bold text-emerald-400">{coupon}</span>
              </div>
              <button className="text-emerald-400 hover:text-emerald-300">
                {copiedCoupon ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* Pricing Block - Totalmente seguro com a função Number() */}
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-xl sm:text-2xl font-black font-heading text-emerald-400">
              R$ {currentPrice.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-xs text-slate-500 line-through">
              R$ {oldPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-5 pb-4 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <span className="text-[11px] text-slate-400">
          Validade: {displayDate}
        </span>

        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold hover:underline">
          <span>Ver Oferta</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
