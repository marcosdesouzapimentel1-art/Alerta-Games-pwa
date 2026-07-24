import React, { useState, useEffect } from 'react';
import { Coupon } from '../../types';
import {
  createCouponAdmin,
  updateCouponAdmin,
  deleteCouponAdmin,
  toggleCouponStatusAdmin,
} from '../../services/adminService';
import { couponsService } from '../../services/couponsService';
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle,
  AlertCircle,
  Power,
  X,
  ExternalLink,
  Percent,
} from 'lucide-react';

interface AdminCouponsTabProps {
  adminUser: { uid: string; name: string };
  onRefreshStats: () => void;
}

const CATEGORY_OPTIONS = [
  'Games',
  'Hardware',
  'Periféricos',
  'Gift Cards',
  'Consoles',
  'PC Gamer',
  'Celulares',
  'Assinaturas',
  'Acessórios',
];

export const AdminCouponsTab: React.FC<AdminCouponsTabProps> = ({
  adminUser,
  onRefreshStats,
}) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form Fields
  const [store, setStore] = useState<string>('PlayStation Store');
  const [title, setTitle] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [discount, setDiscount] = useState<string>('15% OFF');
  const [category, setCategory] = useState<string>('Games');
  const [expirationDate, setExpirationDate] = useState<string>('2026-12-31');
  const [affiliateUrl, setAffiliateUrl] = useState<string>('');
  const [image, setImage] = useState<string>('');
  const [active, setActive] = useState<boolean>(true);

  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await couponsService.getCoupons();
      setCoupons(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setStore('Amazon Brasil');
    setTitle('Cupom R$ 50 OFF em jogos e acessórios PS5');
    setCode('GAMER50');
    setDiscount('R$ 50 OFF');
    setCategory('Games');
    setExpirationDate('2026-12-31');
    setAffiliateUrl('https://amazon.com.br');
    setImage('https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=200&q=80');
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setStore(coupon.store || coupon.storeName || '');
    setTitle(coupon.title || '');
    setCode(coupon.code || '');
    setDiscount(coupon.discount || '10% OFF');
    setCategory(coupon.category || 'Games');
    setExpirationDate(coupon.expirationDate || coupon.validUntil || '2026-12-31');
    setAffiliateUrl(coupon.affiliateUrl || coupon.storeUrl || '');
    setImage(coupon.image || coupon.storeLogoUrl || '');
    setActive(coupon.active ?? true);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !store.trim() || !discount.trim()) {
      setFeedback({ type: 'error', message: 'Preencha o título, a loja e o valor de desconto.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      if (editingCoupon) {
        await updateCouponAdmin(
          editingCoupon.id,
          {
            store,
            title,
            code,
            discount,
            category,
            expirationDate,
            affiliateUrl,
            image,
            active,
          },
          adminUser
        );
        setFeedback({ type: 'success', message: 'Cupom atualizado com sucesso!' });
      } else {
        await createCouponAdmin(
          {
            store,
            title,
            code,
            discount,
            category,
            expirationDate,
            affiliateUrl,
            image,
            active,
          },
          adminUser
        );
        setFeedback({ type: 'success', message: 'Cupom criado com sucesso!' });
      }

      setIsModalOpen(false);
      await loadCoupons();
      onRefreshStats();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro ao salvar cupom.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!window.confirm(`Tem certeza que deseja excluir o cupom: "${coupon.title}"?`)) return;

    try {
      await deleteCouponAdmin(coupon.id, coupon.title, adminUser);
      setFeedback({ type: 'success', message: 'Cupom excluído com sucesso.' });
      await loadCoupons();
      onRefreshStats();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro ao excluir cupom.' });
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const newActive = !coupon.active;
      await toggleCouponStatusAdmin(coupon.id, coupon.title, newActive, adminUser);
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, active: newActive } : c))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.store.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.code && c.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-100 font-heading flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-400" />
            Gerenciamento de Cupons de Desconto
          </h3>
          <p className="text-xs text-slate-400">
            Cadastre, edite, ative ou desative cupons promocionais para os usuários.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Cupom</span>
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
          placeholder="Buscar por cupom, loja ou código..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Coupon Cards */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
          Carregando cupons do banco de dados...
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
          Nenhum cupom encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredCoupons.map((coupon) => (
            <div
              key={coupon.id}
              className={`p-4 rounded-2xl bg-slate-900 border ${
                coupon.active ? 'border-slate-800' : 'border-slate-800/50 opacity-60'
              } flex flex-col justify-between gap-3`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {coupon.image ? (
                    <img
                      src={coupon.image}
                      alt={coupon.store}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-sm shrink-0">
                      <Percent className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                      {coupon.store}
                    </span>
                    <h4 className="text-xs font-bold text-slate-100">{coupon.title}</h4>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    coupon.active
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {coupon.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              {/* Coupon Code & Discount Details */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Desconto / Código</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-black text-emerald-400">{coupon.discount}</span>
                    {coupon.code && (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[10px] border border-slate-700">
                        {coupon.code}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right text-[10px] text-slate-400">
                  <span>Validade:</span>
                  <p className="font-mono text-slate-300">{coupon.expirationDate || '2026-12-31'}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                <button
                  onClick={() => handleToggleActive(coupon)}
                  className={`px-3 py-1.5 rounded-xl border font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                    coupon.active
                      ? 'bg-slate-800 hover:bg-slate-700 text-rose-300 border-slate-700'
                      : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/50'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{coupon.active ? 'Desativar' : 'Ativar Cupom'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(coupon)}
                    className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(coupon)}
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

      {/* Modal Create/Edit Coupon */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 font-heading flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                {editingCoupon ? 'Editar Cupom' : 'Cadastrar Novo Cupom'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Store & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Nome da Loja *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: PlayStation Store, Steam, Amazon"
                    value={store}
                    onChange={(e) => setStore(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Título do Cupom *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: R$ 50 OFF na compra de jogos digitais"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Discount & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Desconto Exibido *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 20% OFF ou R$ 100 OFF"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Código do Cupom
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: ALERTA20"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono uppercase focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Expiration Date & Image */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Validade
                  </label>
                  <input
                    type="text"
                    placeholder="AAAA-MM-DD"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Logo / Imagem URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Affiliate URL */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Link da Loja / Afiliado
                </label>
                <input
                  type="text"
                  placeholder="https://loja.com.br/promocao?tag=alertagame"
                  value={affiliateUrl}
                  onChange={(e) => setAffiliateUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Status Switch */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">
                  Status Inicial do Cupom
                </span>
                <button
                  type="button"
                  onClick={() => setActive(!active)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    active
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {active ? 'Ativo' : 'Inativo'}
                </button>
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
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors shadow-lg cursor-pointer"
                >
                  {saving ? 'Salvando...' : editingCoupon ? 'Atualizar Cupom' : 'Cadastrar Cupom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
