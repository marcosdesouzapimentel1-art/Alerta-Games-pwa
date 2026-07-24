import React, { useState } from 'react';
import { GamerInterest } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { Gamepad2, Check, Sparkles, Flame } from 'lucide-react';

export const ALL_GAMER_INTERESTS: { id: GamerInterest; name: string; icon: string; category: string }[] = [
  { id: 'PlayStation', name: 'PlayStation', icon: '🎮', category: 'Plataforma' },
  { id: 'Xbox', name: 'Xbox', icon: '🎮', category: 'Plataforma' },
  { id: 'Nintendo', name: 'Nintendo Switch', icon: '🎮', category: 'Plataforma' },
  { id: 'PC', name: 'PC Gaming', icon: '💻', category: 'Plataforma' },
  { id: 'Steam', name: 'Steam', icon: '🚀', category: 'Loja / Serviço' },
  { id: 'Epic Games', name: 'Epic Games', icon: '🎁', category: 'Loja / Serviço' },
  { id: 'Game Pass', name: 'Xbox Game Pass', icon: '🟢', category: 'Assinatura' },
  { id: 'PS Plus', name: 'PlayStation Plus', icon: '🔵', category: 'Assinatura' },
  { id: 'GTA 6', name: 'GTA 6', icon: '🚗', category: 'Jogo' },
  { id: 'Fortnite', name: 'Fortnite', icon: '⚡', category: 'Jogo' },
  { id: 'Call of Duty', name: 'Call of Duty', icon: '🎯', category: 'Jogo' },
];

interface MeusInteressesProps {
  onClose?: () => void;
}

export const MeusInteresses: React.FC<MeusInteressesProps> = ({ onClose }) => {
  const { userProfile, updateInterests } = useAuth();
  const { showToast } = useApp();

  const [selected, setSelected] = useState<GamerInterest[]>(
    userProfile?.gamePreferences || ['PlayStation', 'PC', 'GTA 6', 'Steam', 'Game Pass']
  );
  const [isSaving, setIsSaving] = useState(false);

  const toggleInterest = (id: GamerInterest) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateInterests(selected);
      showToast('Preferências salvas! Seu feed e alertas foram personalizados. 🎯');
      if (onClose) onClose();
    } catch (err) {
      showToast('Erro ao salvar preferências no Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black font-heading text-slate-100 flex items-center gap-2">
              Meus Interesses & Preferências
            </h3>
            <p className="text-xs text-slate-400">
              Escolha suas marcas, jogos e serviços favoritos para personalizar seu feed
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
          {selected.length} Selecionados
        </span>
      </div>

      {/* Chips Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {ALL_GAMER_INTERESTS.map((interest) => {
          const isSelected = selected.includes(interest.id);
          return (
            <button
              key={interest.id}
              type="button"
              onClick={() => toggleInterest(interest.id)}
              className={`p-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/10 scale-[1.02]'
                  : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <span className="text-base">{interest.icon}</span>
                <span className="truncate">{interest.name}</span>
              </span>

              <div
                className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                  isSelected ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-800 border border-slate-700'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Save Action */}
      <div className="pt-2 flex items-center justify-end gap-3">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 fill-current" />
          <span>{isSaving ? 'Salvando no Firestore...' : 'Salvar Preferências'}</span>
        </button>
      </div>
    </div>
  );
};
