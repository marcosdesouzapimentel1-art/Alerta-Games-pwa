import React, { useState } from 'react';
import { SendNotificationPayload, sendManualNotificationAdmin } from '../../services/adminService';
import {
  Bell,
  Send,
  Users,
  CheckCircle,
  AlertCircle,
  X,
  Image as ImageIcon,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';

interface AdminAlertsTabProps {
  adminUser: { uid: string; name: string };
  onRefreshStats: () => void;
}

const CATEGORY_TARGETS = [
  { value: 'todos', label: 'Todos os Usuários Cadastrados' },
  { value: 'PlayStation', label: 'Interessados em PlayStation / PS Plus' },
  { value: 'Xbox', label: 'Interessados em Xbox / Game Pass' },
  { value: 'Nintendo', label: 'Interessados em Nintendo Switch' },
  { value: 'PC', label: 'Interessados em PC Gamer & Steam' },
  { value: 'GTA 6', label: 'Fãs de GTA 6' },
  { value: 'Fortnite', label: 'Jogadores de Fortnite' },
  { value: 'Call of Duty', label: 'Jogadores de Call of Duty' },
  { value: 'Epic Games', label: 'Caçadores de Jogos Grátis Epic' },
];

export const AdminAlertsTab: React.FC<AdminAlertsTabProps> = ({
  adminUser,
  onRefreshStats,
}) => {
  const [title, setTitle] = useState<string>('🚨 ALERTA URGENTE: Jogo Triplo A Grátis por Tempo Limitado!');
  const [message, setMessage] = useState<string>(
    'Resgate agora mesmo diretamente no aplicativo ou na loja parceira antes que a promoção expire!'
  );
  const [image, setImage] = useState<string>(
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80'
  );
  const [category, setCategory] = useState<string>('Notícias importantes');
  const [link, setLink] = useState<string>('https://alertagame.com.br');
  const [targetAudience, setTargetAudience] = useState<string>('todos');

  const [sending, setSending] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setFeedback({ type: 'error', message: 'Preencha o título e a mensagem do alerta.' });
      return;
    }

    setSending(true);
    setFeedback(null);

    try {
      const targetCount = await sendManualNotificationAdmin(
        {
          title,
          message,
          image,
          category,
          link,
          targetAudience,
        },
        adminUser
      );

      setFeedback({
        type: 'success',
        message: `Notificação enviada com sucesso para ${targetCount} usuário(s) no Firestore!`,
      });

      onRefreshStats();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro ao disparar notificação.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <h3 className="text-base font-bold text-slate-100 font-heading flex items-center gap-2">
          <Bell className="w-5 h-5 text-rose-400" />
          Central de Disparo de Alertas Manuais
        </h3>
        <p className="text-xs text-slate-400">
          Envie notificações push e avisos no aplicativo direcionados para todos os usuários ou públicos segmentados.
        </p>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Send Form */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <form onSubmit={handleSend} className="space-y-4">
            
            {/* Target Audience */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-400" />
                Público Alvo (Enviar Para) *
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-medium focus:outline-none focus:border-rose-500"
              >
                {CATEGORY_TARGETS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Notification Title */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Título do Alerta *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Novo Cupom Amazon 20% OFF em Acessórios"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-medium focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Mensagem do Alerta *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Ex: Não perca essa oferta incrível disponível até o fim do dia..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-medium focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Categoria do Alerta
              </label>
              <input
                type="text"
                placeholder="Ex: Notícias importantes, Cupons e ofertas, GTA 6..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Image URL & Action Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                  Imagem de Capa (URL)
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                  Link de Redirecionamento
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{sending ? 'Disparando Notificações...' : 'Disparar Notificação Agora'}</span>
              </button>
            </div>

          </form>
        </div>

        {/* Live Mobile Notification Preview */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-300 font-heading flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Prévia do Card de Notificação
            </h4>

            {/* Simulated Phone Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 shadow-2xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold">
                    AG
                  </div>
                  <span className="text-[11px] font-bold text-cyan-300 font-mono">Alerta Game</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">agora</span>
              </div>

              {image && (
                <img
                  src={image}
                  alt="Notificação Capa"
                  className="w-full h-28 rounded-xl object-cover border border-slate-800"
                />
              )}

              <div className="space-y-1">
                <h5 className="text-xs font-bold text-slate-100">{title || 'Título do Alerta'}</h5>
                <p className="text-[11px] text-slate-300 leading-relaxed">{message || 'Mensagem do alerta...'}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold">
                  {category}
                </span>
                <span>Toque para ver oferta &rarr;</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <span className="font-bold text-cyan-400 block">Dica de Notificação:</span>
            <p>Utilize títulos com emojis chamativos e mensagens diretas para obter a maior taxa de cliques.</p>
          </div>
        </div>

      </div>

    </div>
  );
};
