import React, { useState, useEffect } from 'react';
import { Promotion, PromotionCategory } from '../../types';
import {
  createDealAdmin,
  updateDealAdmin,
  deleteDealAdmin,
} from '../../services/adminService';
import { promotionsService } from '../../services/promotionsService';
import {
  Gift,
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  ExternalLink,
  Store,
  DollarSign,
} from 'lucide-react';

interface AdminDealsTabProps {
  adminUser: { uid: string; name: string };
  onRefreshStats: () => void;
}

const PROMOTION_CATEGORIES: PromotionCategory[] = [
  'Jogos',
  'Consoles',
  'Controles',
  'Headsets',
  'Placas de vídeo',
  'Notebooks gamer',
  'Gift Cards',
  'Assinaturas',
];

export const AdminDealsTab: React.FC<AdminDealsTabProps> = ({
  adminUser,
  onRefreshStats,
}) => {
  const [deals, setDeals] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDeal, setEditingDeal] = useState<Promotion | null>(null);

  // Form Fields
  const [productTitle, setProductTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('Jogos');
  const [store, setStore] = useState<string>('');
  const [oldPrice, setOldPrice] = useState<number>(0);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [image, setImage] = useState<string>('');
  const [link, setLink] = useState<string>('');
  const [affiliateUrl, setAffiliateUrl] = useState<string>('');
  const [expirationDate, setExpirationDate] = useState<string>('2026-12-31');
  const [active, setActive] = useState<boolean>(true);

  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadDeals = async () => {
    setLoading(true);
    try {
      const data = await promotionsService.getPromotions();
      setDeals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  // Auto-calculate discount percentage when prices change
  const handlePriceChange = (newOld: number, newCurr: number) => {
    setOldPrice(newOld);
    setCurrentPrice(newCurr);
    if (newOld > 0 && newCurr < newOld) {
      const calculatedPct = Math.round(((newOld - newCurr) / newOld) * 100);
      setDiscountPercent(calculatedPct);
    }
  };

  const openCreateModal = () => {
    setEditingDeal(null);
    setProductTitle('');
    setCategory('Jogos');
    setStore('');
    setOldPrice(0);
    setCurrentPrice(0);
    setDiscountPercent(0);
    setImage('');
    setLink('');
    setAffiliateUrl('');
    setExpirationDate('2026-12-31');
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (deal: Promotion) => {
    setEditingDeal(deal);
    setProductTitle(deal.productTitle || '');
    setCategory(deal.category || 'Jogos');
    setStore(deal.store || '');
    setOldPrice(deal.oldPrice || 0);
    setCurrentPrice(deal.currentPrice || 0);
    setDiscountPercent(deal.discountPercent || 0);
    setImage(deal.image || '');
    setLink(deal.link || '');
    setAffiliateUrl(deal.affiliateUrl || deal.link || '');
    setExpirationDate(deal.expirationDate || '2026-12-31');
    setActive(deal.active ?? true);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productTitle.trim() || !store.trim() || currentPrice <= 0) {
      setFeedback({ type: 'error', message: 'Preencha o produto, a loja e o preço promocional.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      if (editingDeal) {
        await updateDealAdmin(
          editingDeal.id,
          {
            productTitle,
            category,
            store,
            oldPrice,
            currentPrice,
            discountPercent,
            image,
            link,
            affiliateUrl: affiliateUrl || link,
            expirationDate,
            active,
          },
          adminUser
        );
        setFeedback({ type: 'success', message: 'Promoção atualizada com sucesso!' });
      } else {
        await createDealAdmin(
          {
            productTitle,
            category,
            store,
            oldPrice,
            currentPrice,
            discountPercent,
            image,
            link,
            affiliateUrl: affiliateUrl || link,
            expirationDate,
            active,
            createdAt: new Date().toISOString(),
          },
          adminUser
        );
        setFeedback({ type: 'success', message: 'Promoção cadastrada com sucesso!' });
      }

      setIsModalOpen(false);
      await loadDeals();
      onRefreshStats();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro ao salvar promoção.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (deal: Promotion) => {
    if (!window.confirm(`Tem certeza que deseja excluir a promoção: "${deal.productTitle}"?`)) return;

    try {
      await deleteDealAdmin(deal.id, deal.productTitle, adminUser);
      setFeedback({ type: 'success', message: 'Promoção excluída com sucesso.' });
      await loadDeals();
      onRefreshStats();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro ao excluir promoção.' });
    }
  };

  const filteredDeals = deals.filter(
    (d) =>
      d.productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.store.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-100 font-heading flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-400" />
            Gerenciamento de Promoções e Ofertas
          </h3>
          <p className="text-xs text-slate-400">
            Cadastre ofertas de jogos, hardware, altere o percentual de desconto e atualize a loja ou validade.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Promoção</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por nome do produto ou loja..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Deals List */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
          Carregando ofertas do Firestore...
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
          Nenhuma promoção encontrada.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredDeals.map((deal) => (
            <div
              key={deal.id}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <img
                  src={deal.image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=200&q=80'}
                  alt={deal.productTitle}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-800 shrink-0"
                />

                <div className="min-w-0 space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                      {deal.store}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{deal.category}</span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{deal.productTitle}</h4>

                  {/* Price Comparison */}
                  <div className="flex items-baseline gap-2 pt-0.5">
                    <span className="text-sm font-black text-emerald-400 font-mono">
                      R$ {deal.currentPrice?.toFixed(2)}
                    </span>
                    {deal.oldPrice > 0 && (
                      <span className="text-[11px] text-slate-500 line-through font-mono">
                        R$ {deal.oldPrice?.toFixed(2)}
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                      -{deal.discountPercent}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Details & Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-[10px] font-mono text-slate-400">
                  Validade: {deal.expirationDate || '2026-12-31'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(deal)}
                    className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-purple-400 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(deal)}
                    className="p-1.5 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-400 hover:bg-rose-900/60 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Modal Create/Edit Promotion */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 font-heading flex items-center gap-2">
                <Gift className="w-4 h-4 text-purple-400" />
                {editingDeal ? 'Editar Promoção' : 'Cadastrar Nova Oferta'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Product Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Nome do Produto / Jogo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: PlayStation 5 Slim Digital + 2 Jogos"
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Store & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Loja Parceira *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Amazon Brasil, Kabum, Steam"
                    value={store}
                    onChange={(e) => setStore(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
                  >
                    {PROMOTION_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing & Calculated Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Preço De (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="349.90"
                    value={oldPrice}
                    onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0, currentPrice)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Preço Por (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="174.90"
                    value={currentPrice}
                    onChange={(e) => handlePriceChange(oldPrice, parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-bold text-xs font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Desconto (%)
                  </label>
                  <input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold text-xs font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Image & Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Imagem URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Validade da Oferta
                  </label>
                  <input
                    type="text"
                    placeholder="AAAA-MM-DD"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Link */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Link da Oferta / Afiliado
                </label>
                <input
                  type="text"
                  placeholder="https://loja.com/produto?aff=alertagame"
                  value={link}
                  onChange={(e) => {
                    setLink(e.target.value);
                    setAffiliateUrl(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shadow-lg cursor-pointer"
                >
                  {saving ? 'Salvando...' : editingDeal ? 'Atualizar Promoção' : 'Cadastrar Oferta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
