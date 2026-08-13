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
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string>('');
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
    setSyncProgress(15);
    setSyncStatusMessage('Conectando à Cloud Function v2 oficial...');
    setFeedback(null);

    const progressInterval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev < 40) {
          setSyncStatusMessage('Consultando RSS Feeds dos Portais Brasileiros (pt-BR)...');
          return prev + 12;
        } else if (prev < 80) {
          setSyncStatusMessage('Processando notícias e efetuando deduplicação...');
          return prev + 8;
        } else if (prev < 95) {
          setSyncStatusMessage('Gravando lote de notícias na coleção news do Firestore...');
          return prev + 3;
        }
        return prev;
      });
    }, 300);

    try {
      // Requisição direta para a URL atualizada da Cloud Function
      const response = await fetch('https://syncnewsmanual-j3zyulq6mq-rj.a.run.app');
      const json = await response.json();

      clearInterval(progressInterval);
      setSyncProgress(100);

      if (json.success && json.data) {
        setSyncStatusMessage('Sincronização concluída com sucesso!');
        await loadArticles();
        await loadLatestSyncLog();
        onRefreshStats();

        setFeedback({
          type: 'success',
          message: `Sincronização concluída! ${json.data.totalFound} notícias consultadas, ${json.data.totalAdded} novas matérias adicionadas das fontes nacionais.`,
        });
      } else {
        throw new Error(json.message || 'Erro ao sincronizar notícias.');
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setSyncProgress(0);
      setSyncStatusMessage('');
      setFeedback({
        type: 'error',
        message: err?.message || 'Erro de comunicação com a Cloud Function.',
      });
    } finally {
      setTimeout(() => {
        setSyncing(false);
        setSyncProgress(0);
        setSyncStatusMessage('');
      }, 1500);
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
        await createNewsAdmin(
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
                  Agregador & Sincronizador de Notícias Nacionais
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold">
                  8 Adapters RSS (pt-BR)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Obtém notícias em português de Adrenaline, Voxel, MeuPlayStation, PSX Brasil, Xbox Power, Nintendo Blast, Flow Games e IGN Brasil.
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
            <span>{syncing ? 'Sincronizando via Cloud Function...' : 'Sincronizar Notícias Agora'}</span>
          </button>
        </div>

        {/* Sync Progress Bar */}
        {(syncing || syncProgress > 0) && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-cyan-400">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>{syncStatusMessage || 'Sincronizando com as fontes brasileiras...'}</span>
              </div>
              <span className="font-mono text-cyan-300 font-bold">{syncProgress}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-800/90 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-all duration-300 ease-out rounded-full shadow-lg shadow-cyan-500/50"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Integrated Adapters Badges (Fontes Brasileiras) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-500 mr-1">Adapters Ativos (pt-BR):</span>
          {[
            'Adrenaline',
            'Voxel',
            'MeuPlayStation',
            'PSX Brasil',
            'Xbox Power',
            'Nintendo Blast',
            'Flow Games',
            'IGN Brasil',
          ].map((source) => (
            <span key={source} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 font-mono text-[10px]">
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

      {/* News List */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
          Carregando notícias do Firestore...
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
          Nenhuma notícia encontrada na coleção. Clique em "Sincronizar Notícias Agora" acima para carregar as matérias mais recentes das fontes brasileiras.
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
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-mono">
                      {typeof article.source === 'string' ? article.source : 'Fonte BR'}
                    </span>
                    {article.featured && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 fill-current" />
                        Destaque
                      </span>
                    )}
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
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Título da Notícia *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Novo anúncio oficial sobre games no Brasil"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Resumo Curto *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Resumo exibido no aplicativo..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Conteúdo Completo (Opcional)
                </label>
                <textarea
                  rows={4}
                  placeholder="Texto completo da matéria..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Tags (Separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    placeholder="ps5, xbox, noticia"
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
                    placeholder="Alerta Game Editorial"
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

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Destacar notícia no topo do app</span>
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
                      Enviar notificação para {category}
                    </span>
                  </label>
                )}
              </div>

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
