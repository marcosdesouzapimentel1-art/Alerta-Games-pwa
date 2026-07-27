import React, { useState, useEffect } from 'react';
import { NewsArticle } from '../../types';
import {
  createNewsAdmin,
  updateNewsAdmin,
  deleteNewsAdmin,
  sendManualNotificationAdmin,
} from '../../services/adminService';
import {
  getNewsFromFirestore,
  NEWS_CATEGORIES,
  syncNewsFromExternalSources,
  getLatestNewsSyncLogFromFirestore,
  SyncLog,
} from '../../services/newsService';
import {
  Newspaper,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Search,
  CheckCircle,
  AlertCircle,
  Bell,
  X,
  ExternalLink,
  RefreshCw,
  Radio,
  Layers,
  FileCheck,
  Clock,
  User,
  AlertTriangle,
} from 'lucide-react';

interface AdminNewsTabProps {
  adminUser: { uid: string; name: string; email?: string };
  onRefreshStats: () => void;
}

export const AdminNewsTab: React.FC<AdminNewsTabProps> = ({
  adminUser,
  onRefreshStats,
}) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Todas');

  // Sync State
  const [syncing, setSyncing] = useState<boolean>(false);
  const [latestSyncLog, setLatestSyncLog] = useState<SyncLog | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);

  // Form Fields
  const [title, setTitle] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [image, setImage] = useState<string>('');
  const [category, setCategory] = useState<string>('PlayStation');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [source, setSource] = useState<string>('Alerta Game Admin');
  const [url, setUrl] = useState<string>('');
  const [featured, setFeatured] = useState<boolean>(false);
  const [sendNotifOnSave, setSendNotifOnSave] = useState<boolean>(true);

  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const { articles: data } = await getNewsFromFirestore({ category: 'Todas', pageSize: 100 });
      setArticles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadLatestSyncLog = async () => {
    try {
      const log = await getLatestNewsSyncLogFromFirestore();
      if (log) {
        setLatestSyncLog(log);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadArticles();
    loadLatestSyncLog();
  }, []);

  const handleSyncNewsNow = async () => {
    if (syncing) return;
    setSyncing(true);
    setFeedback(null);

    try {
      const { syncedCount, log } = await syncNewsFromExternalSources({
        uid: adminUser.uid,
        email: adminUser.email || 'admin@alertagame.com',
      });

      setLatestSyncLog(log);
      await loadArticles();
      onRefreshStats();

      setFeedback({
        type: 'success',
        message: `Sincronização realizada com sucesso! Fontes consultadas: ${log.sourcesAttempted}, Encontradas: ${log.articlesFound ?? 0}, Novas salvas: ${syncedCount}, Duplicadas ignoradas: ${log.duplicatesCount ?? 0}, Erros: ${log.errorsCount ?? 0}.`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Erro ao sincronizar notícias de fontes externas.',
      });
    } finally {
      setSyncing(false);
    }
  };

  const openCreateModal = () => {
    setEditingArticle(null);
    setTitle('');
    setSummary('');
    setContent('');
    setImage('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80');
    setCategory('PlayStation');
    setTagsInput('jogos, novidade, alerta');
    setSource('Alerta Game Editorial');
    setUrl('');
    setFeatured(false);
    setSendNotifOnSave(true);
    setIsModalOpen(true);
  };

  const openEditModal = (article: NewsArticle) => {
    setEditingArticle(article);
    setTitle(article.title || '');
    setSummary(article.summary || '');
    setContent(article.content || '');
    setImage(article.image || article.imageUrl || '');
    setCategory(article.category || 'PlayStation');
    setTagsInput(article.tags ? article.tags.join(', ') : '');
    setSource(typeof article.source === 'string' ? article.source : 'Alerta Game');
    setUrl(article.url || '');
    setFeatured(!!article.featured);
    setSendNotifOnSave(false);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) {
      setFeedback({ type: 'error', message: 'Preencha o título e o resumo da notícia.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const tagsArray = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      if (editingArticle) {
        // Edit existing
        await updateNewsAdmin(
          editingArticle.id,
          {
            title,
            summary,
            content: content || summary,
            image,
            imageUrl: image,
            category,
            tags: tagsArray,
            source,
            url,
            featured,
          },
          adminUser
        );
        setFeedback({ type: 'success', message: 'Notícia atualizada com sucesso!' });
      } else {
        // Create new
        const newId = await createNewsAdmin(
          {
            title,
            summary,
            content: content || summary,
            image,
            imageUrl: image,
            category,
            tags: tagsArray,
            source,
            url,
            author: adminUser.name,
            publishedAt: new Date().toISOString(),
            featured,
          },
          adminUser
        );

        if (sendNotifOnSave) {
          await sendManualNotificationAdmin(
            {
              title: `Notícia: ${title}`,
              message: summary,
              image,
              category,
              link: url || '',
              targetAudience: category,
            },
            adminUser
          );
        }

        setFeedback({ type: 'success', message: 'Notícia criada com sucesso!' });
      }

      setIsModalOpen(false);
      await loadArticles();
      onRefreshStats();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro ao salvar notícia.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (article: NewsArticle) => {
    if (!window.confirm(`Tem certeza que deseja excluir a notícia: "${article.title}"?`)) return;

    try {
      await deleteNewsAdmin(article.id, article.title, adminUser);
      setFeedback({ type: 'success', message: 'Notícia excluída com sucesso.' });
      await loadArticles();
      onRefreshStats();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro ao excluir notícia.' });
    }
  };

  const handleToggleFeatured = async (article: NewsArticle) => {
    try {
      const newFeatured = !article.featured;
      await updateNewsAdmin(
        article.id,
        { featured: newFeatured, title: article.title },
        adminUser
      );
      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, featured: newFeatured } : a))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const filteredArticles = articles.filter((art) => {
    const matchesSearch =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      selectedCategoryFilter === 'Todas' || art.category === selectedCategoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-100 font-heading flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-blue-400" />
            Gerenciamento de Notícias
          </h3>
          <p className="text-xs text-slate-400">
            Crie, edite, altere categorias, insira tags e destaque notícias principais.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Notícia Manual</span>
        </button>
      </div>

      {/* News Sync Control Card */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-100 font-heading">
                  Agregador & Sincronizador Automático de Notícias
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold">
                  7 Adapters RSS / API
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Obtém notícias de RAWG, IGN, GameSpot, VGC, Xbox, PlayStation e Nintendo com deduplicação no Firestore.
              </p>
            </div>
          </div>

          <button
            onClick={handleSyncNewsNow}
            disabled={syncing}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
              syncing
                ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/20 active:scale-95'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{syncing ? 'Sincronizando Fontes...' : 'Sincronizar Notícias Agora'}</span>
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Última Sync</span>
            </div>
            <p className="text-xs font-bold text-slate-200 truncate">
              {latestSyncLog?.timestamp
                ? new Date(latestSyncLog.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                : 'Pendente'}
            </p>
            <span className="text-[10px] text-slate-500 block truncate">
              {latestSyncLog?.timestamp
                ? new Date(latestSyncLog.timestamp).toLocaleDateString('pt-BR')
                : 'Sem registro'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <Layers className="w-3 h-3 text-blue-400" />
              <span>Fontes / Encontradas</span>
            </div>
            <p className="text-base font-black text-slate-100 font-heading">
              {latestSyncLog?.articlesFound ?? 0}
            </p>
            <span className="text-[10px] text-slate-400 block truncate">
              {latestSyncLog?.sourcesAttempted ?? 7} fontes consultadas
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
              <FileCheck className="w-3 h-3 text-emerald-400" />
              <span>Novas Salvas</span>
            </div>
            <p className="text-base font-black text-emerald-300 font-heading">
              +{latestSyncLog?.newArticlesCount ?? 0}
            </p>
            <span className="text-[10px] text-emerald-400/80 block truncate">
              Coleção news
            </span>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-medium">
              <CheckCircle className="w-3 h-3 text-amber-400" />
              <span>Duplicadas</span>
            </div>
            <p className="text-base font-black text-amber-300 font-heading">
              {latestSyncLog?.duplicatesCount ?? 0}
            </p>
            <span className="text-[10px] text-amber-400/80 block truncate">
              Ignoradas
            </span>
          </div>

          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/20 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] text-rose-400 font-medium">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>Falhas / Erros</span>
            </div>
            <p className="text-base font-black text-rose-300 font-heading">
              {latestSyncLog?.errorsCount ?? 0}
            </p>
            <span className="text-[10px] text-rose-400/80 block truncate">
              Fontes com erro
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <User className="w-3 h-3 text-cyan-400" />
              <span>Executado Por</span>
            </div>
            <p className="text-xs font-bold text-slate-200 truncate" title={latestSyncLog?.adminEmail || adminUser.email || 'Admin'}>
              {latestSyncLog?.adminEmail || adminUser.email || 'Admin'}
            </p>
            <span className="text-[10px] text-slate-500 block truncate">
              Role: admin
            </span>
          </div>
        </div>

        {/* Integrated Adapters Badges */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-500 mr-1">Adapters Ativos:</span>
          {['RAWG', 'IGN', 'GameSpot', 'VGC', 'Xbox Wire', 'PlayStation Blog', 'Nintendo News'].map((source) => (
            <span key={source} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
              {source}
            </span>
          ))}
        </div>
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

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por título ou resumo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-blue-500"
        >
          {NEWS_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              Categoria: {cat}
            </option>
          ))}
        </select>
      </div>

      {/* News List Table / Cards */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
          Carregando notícias do Firestore...
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
          Nenhuma notícia encontrada com os filtros selecionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className={`p-4 rounded-2xl bg-slate-900 border ${
                article.featured ? 'border-amber-500/50 shadow-md shadow-amber-500/5' : 'border-slate-800'
              } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <img
                  src={article.image || article.imageUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=200&q=80'}
                  alt={article.title}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-800 shrink-0"
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                      {article.category}
                    </span>
                    {article.featured && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 fill-current" />
                        Destaque Principal
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(article.publishedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-100 truncate">{article.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{article.summary}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => handleToggleFeatured(article)}
                  title={article.featured ? 'Remover destaque' : 'Destacar Notícia'}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    article.featured
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-amber-300'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                </button>

                <button
                  onClick={() => openEditModal(article)}
                  title="Editar Notícia"
                  className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(article)}
                  title="Excluir Notícia"
                  className="p-2 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-400 hover:bg-rose-900/60 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Create/Edit News */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 font-heading flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-blue-400" />
                {editingArticle ? 'Editar Notícia' : 'Nova Notícia Manual'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Título da Notícia *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Novo anúncio oficial de GTA 6 surpreende a comunidade"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Summary */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Resumo Curto *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Pequeno resumo exibido nos cards e push notifications..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Conteúdo Completo (Opcional)
                </label>
                <textarea
                  rows={4}
                  placeholder="Texto completo da matéria, detalhes, opiniões e análises..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Category & Featured */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  >
                    {NEWS_CATEGORIES.filter((c) => c !== 'Todas').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Imagem (URL Capa)
                  </label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Tags & Source & Link */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Tags (Separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    placeholder="gta6, ps5, rumor"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Fonte
                  </label>
                  <input
                    type="text"
                    placeholder="Rockstar Games / Alerta Game"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Link Externo
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Switches */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Destacar como notícia principal no Hero Banner</span>
                </label>

                {!editingArticle && (
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200">
                    <input
                      type="checkbox"
                      checked={sendNotifOnSave}
                      onChange={(e) => setSendNotifOnSave(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="flex items-center gap-1.5 text-cyan-300">
                      <Bell className="w-3.5 h-3.5" />
                      Enviar notificação aos usuários interessados em {category}
                    </span>
                  </label>
                )}
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-lg cursor-pointer"
                >
                  {saving ? 'Salvando...' : editingArticle ? 'Atualizar Notícia' : 'Publicar Notícia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
