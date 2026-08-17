import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { usePWA } from '../contexts/PWAContext';
import { AuthCard } from '../components/AuthCard';
import { MeusInteresses } from '../components/MeusInteresses';
import { InstallModal } from '../components/InstallModal';
import { mockNews, mockDeals, mockReleases } from '../data/mockData';
import { mockCoupons } from '../data/mockCoupons';
import {
  ShieldCheck,
  Award,
  Target,
  BookOpen,
  Sparkles,
  Gamepad2,
  Settings,
  Smartphone,
  LogOut,
  UserCheck,
  Heart,
  Tag,
  Gift,
  Newspaper,
  Calendar,
  ExternalLink,
  Edit2,
  Check,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

export const PerfilView: React.FC = () => {
  const { user, userProfile, logout, updateProfile, isAdmin } = useAuth();
  const {
    setActiveTab,
    favoriteNewsIds,
    favoriteDealIds,
    trackedReleaseIds,
    favoriteCouponIds,
    setSelectedNews,
    setSelectedDeal,
    setSelectedCoupon,
    showToast,
  } = useApp();
  const { isInstalled, isInstallable, promptInstall } = usePWA();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile?.displayName || userProfile?.name || '');
  const [editPhoto, setEditPhoto] = useState(userProfile?.photoURL || userProfile?.avatarUrl || '');
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [activeFavTab, setActiveFavTab] = useState<'noticias' | 'cupons' | 'promocoes' | 'lancamentos'>('noticias');

  // Resolved list items
  const savedNewsList = mockNews.filter((item) => favoriteNewsIds.includes(item.id));
  const savedDealsList = mockDeals.filter((item) => favoriteDealIds.includes(item.id));
  const savedCouponsList = mockCoupons.filter((item) => favoriteCouponIds.includes(item.id));
  const savedReleasesList = mockReleases.filter((item) => trackedReleaseIds.includes(item.id));

  const totalFavoritesCount =
    favoriteNewsIds.length + favoriteDealIds.length + favoriteCouponIds.length + trackedReleaseIds.length;

  // Função para lidar com upload de imagem direto da galeria do celular ou PC
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('A imagem é muito grande! Escolha uma com menos de 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setEditPhoto(base64String);
      showToast('Imagem carregada com sucesso!');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfileEdit = async () => {
    if (!editName.trim()) return;
    try {
      await updateProfile({
        displayName: editName.trim(),
        name: editName.trim(),
        photoURL: editPhoto.trim() || undefined,
        avatarUrl: editPhoto.trim() || undefined,
      });
      setIsEditing(false);
      showToast('Perfil atualizado e salvo no banco de dados! 🎮');
    } catch (err) {
      showToast('Erro ao atualizar perfil.');
    }
  };

  const getBadgeIcon = (icon: string) => {
    switch (icon) {
      case 'Award': return <Award className="w-5 h-5 text-amber-400" />;
      case 'Target': return <Target className="w-5 h-5 text-cyan-400" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5 text-emerald-400" />;
      default: return <ShieldCheck className="w-5 h-5 text-purple-400" />;
    }
  };

  const formattedCreatedDate = userProfile?.createdAt
    ? new Date(userProfile.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : userProfile?.joinedDate || 'Janeiro de 2026';

  return (
    <div className="space-y-8 pb-24 max-w-4xl mx-auto">

      {/* Guest / Unauthenticated Prompt or Profile Header */}
      {!user ? (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-900/30 via-slate-900 to-blue-900/30 border border-cyan-500/30 text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <UserCheck className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black font-heading text-slate-100">
              Crie seu Perfil Gamer Personalizado
            </h2>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Faça login ou cadastre-se para salvar seus cupons, notícias, jogos acompanhados e receber alertas customizados baseados nas suas plataformas favoritas.
            </p>
          </div>

          <AuthCard />
        </div>
      ) : (
        /* Authenticated User Header Card */
        <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl overflow-hidden">
          
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left z-10">
            
            {/* Avatar with Glow ring */}
            <div className="relative group shrink-0">
              <img
                src={userProfile?.photoURL || userProfile?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80'}
                alt={userProfile?.displayName || userProfile?.name || 'Gamer'}
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-2xl object-cover ring-4 ring-cyan-500/40 shadow-xl shadow-cyan-500/20"
              />
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg text-[10px] font-black bg-cyan-500 text-slate-950 shadow-md">
                LVL {userProfile?.xpLevel || 1}
              </span>
            </div>

            {/* User Info & Edit form */}
            <div className="flex-1 space-y-3 w-full">
              {!isEditing ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-black font-heading text-slate-100 flex items-center justify-center sm:justify-start gap-2">
                      {userProfile?.displayName || userProfile?.name || 'Jogador Alerta'}
                      <button
                        onClick={() => {
                          setEditName(userProfile?.displayName || userProfile?.name || '');
                          setEditPhoto(userProfile?.photoURL || userProfile?.avatarUrl || '');
                          setIsEditing(true);
                        }}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                        title="Editar nome ou foto"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </h1>
                    <p className="text-xs font-mono text-cyan-400">
                      {userProfile?.gamerTag || userProfile?.email}
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center justify-center sm:justify-start gap-1 pt-1">
                      <Calendar className="w-3 h-3" />
                      Cadastrado em {formattedCreatedDate}
                    </p>
                  </div>

                  <div className="flex items-center justify-center sm:justify-end gap-2 flex-wrap">
                    {isAdmin && (
                      <button
                        onClick={() => setActiveTab('admin')}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-cyan-500/20"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Painel Admin</span>
                      </button>
                    )}

                    <button
                      onClick={() => setActiveTab('configuracoes')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Ajustes</span>
                    </button>

                    <button
                      onClick={() => {
                        logout();
                        showToast('Sessão encerrada.');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sair</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Edit Profile Form com Upload Real de Imagem da Galeria */
                <div className="space-y-3 bg-slate-950/90 p-4 rounded-2xl border border-cyan-500/30 text-left shadow-xl">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase font-mono flex items-center gap-1.5">
                    <Edit2 className="w-3.5 h-3.5" /> Editar Perfil & Foto
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Nome / Apelido</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-slate-400 block">Avatar / Foto de Perfil</label>
                      
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        {/* Botão de carregar da galeria/dispositivo */}
                        <label className="w-full sm:w-auto px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all">
                          <Upload className="w-4 h-4" />
                          <span>Escolher da Galeria / PC</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                        
                        <span className="text-[10px] text-slate-500">ou cole o link da imagem abaixo:</span>
                      </div>

                      <input
                        type="text"
                        value={editPhoto}
                        onChange={(e) => setEditPhoto(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveProfileEdit}
                      className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Salvar Alterações</span>
                    </button>
                  </div>
                </div>
              )}

              <p className="text-xs text-amber-400 font-bold flex items-center justify-center sm:justify-start gap-1">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                {userProfile?.title || 'Mestre Caçador de Ofertas'}
              </p>

              {/* Level XP Progress Bar */}
              <div className="pt-1 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>Progresso do Nível {userProfile?.xpLevel || 1}</span>
                  <span>3.450 / 5.000 XP</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full w-[69%]" />
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
          <span className="text-2xl font-black font-heading text-cyan-400">
            {totalFavoritesCount}
          </span>
          <span className="text-xs text-slate-400 block">Total Favoritos</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
          <span className="text-2xl font-black font-heading text-blue-400">
            {favoriteNewsIds.length}
          </span>
          <span className="text-xs text-slate-400 block">Notícias Salvas</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
          <span className="text-2xl font-black font-heading text-amber-400">
            {favoriteCouponIds.length}
          </span>
          <span className="text-xs text-slate-400 block">Cupons Salvos</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
          <span className="text-2xl font-black font-heading text-purple-400">
            {trackedReleaseIds.length + favoriteDealIds.length}
          </span>
          <span className="text-xs text-slate-400 block">Jogos Acompanhados</span>
        </div>
      </div>

      {/* Personalização - Meus Interesses Component (Agora integrado e funcional) */}
      <MeusInteresses />

      {/* Perfil Gamer: Itens Salvos & Acompanhados */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-lg font-black font-heading text-slate-100 flex items-center gap-2">
            <Heart className="w-5 h-5 text-cyan-400 fill-cyan-500/20" />
            Meus Itens Salvos & Jogos Acompanhados
          </h2>

          <button
            onClick={() => setActiveTab('favoritos')}
            className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Ver em Favoritos</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Favorite Sub-Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveFavTab('noticias')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeFavTab === 'noticias'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>Notícias ({savedNewsList.length})</span>
          </button>

          <button
            onClick={() => setActiveFavTab('cupons')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeFavTab === 'cupons'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Cupons ({savedCouponsList.length})</span>
          </button>

          <button
            onClick={() => setActiveFavTab('promocoes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeFavTab === 'promocoes'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Promoções ({savedDealsList.length})</span>
          </button>

          <button
            onClick={() => setActiveFavTab('lancamentos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeFavTab === 'lancamentos'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Jogos Acompanhados ({savedReleasesList.length})</span>
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 min-h-[160px]">
          {activeFavTab === 'noticias' && (
            savedNewsList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {savedNewsList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedNews(item)}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex items-center gap-3 cursor-pointer group"
                  >
                    <img
                      src={item.imageUrl || item.image}
                      alt={item.title}
                      className="w-14 h-14 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase">{item.category}</span>
                      <h4 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">Nenhuma notícia salva ainda.</p>
            )
          )}

          {activeFavTab === 'cupons' && (
            savedCouponsList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {savedCouponsList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedCoupon(item)}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase">{item.store}</span>
                      <h4 className="text-xs font-bold text-slate-100">{item.title}</h4>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black">
                      {item.discount}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">Nenhum cupom salvo ainda.</p>
            )
          )}

          {activeFavTab === 'promocoes' && (
            savedDealsList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {savedDealsList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedDeal(item)}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-cyan-400 uppercase">{item.store}</span>
                      <h4 className="text-xs font-bold text-slate-100">{item.gameTitle}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-emerald-400">R$ {item.discountPrice.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-500 line-through block">R$ {item.originalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">Nenhuma promoção salva ainda.</p>
            )
          )}

          {activeFavTab === 'lancamentos' && (
            savedReleasesList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {savedReleasesList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-14 h-14 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-purple-400 uppercase">Lançamento</span>
                      <h4 className="text-xs font-bold text-slate-100">{item.title}</h4>
                      <p className="text-[10px] text-slate-400">{item.releaseDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">Nenhum jogo acompanhado ainda.</p>
            )
          )}
        </div>
      </div>

      {/* PWA App Status Box */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
            <Gamepad2 className="w-4 h-4 text-cyan-400" />
            Status do Aplicativo Alerta Game (PWA)
          </h4>
          <p className="text-xs text-slate-400">
            {isInstalled
              ? 'Aplicativo instalado e executando em modo nativo Standalone.'
              : 'O aplicativo está rodando via navegador. Instale no celular para uso em tela cheia!'}
          </p>
        </div>

        {!isInstalled && (
          <button
            onClick={() => {
              if (isInstallable) {
                promptInstall();
              } else {
                setIsInstallModalOpen(true);
              }
            }}
            className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-cyan-500/20"
          >
            <Smartphone className="w-4 h-4" />
            <span>Instalar no Celular</span>
          </button>
        )}
      </div>

      {/* Install Modal */}
      <InstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

    </div>
  );
};
