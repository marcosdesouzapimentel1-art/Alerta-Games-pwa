import React from 'react';
import { Gamepad2, Shield, FileText, Mail, Info, Heart } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const Footer: React.FC = () => {
  const { setActiveTab } = useApp();

  return (
    <footer className="w-full bg-slate-900/60 border-t border-slate-800/80 py-8 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400 rounded-xl border border-cyan-500/30">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white font-display">Alerta Game</h3>
            <p className="text-xs text-slate-400">Notícias, Lançamentos e Promoções Gamer em Tempo Real</p>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-400">
          <button
            onClick={() => setActiveTab('sobre')}
            className="hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Sobre</span>
          </button>
          <span>•</span>
          <button
            onClick={() => setActiveTab('contato')}
            className="hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Contato</span>
          </button>
          <span>•</span>
          <button
            onClick={() => setActiveTab('termos-uso')}
            className="hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Termos de Uso</span>
          </button>
          <span>•</span>
          <button
            onClick={() => setActiveTab('politica-privacidade')}
            className="hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacidade</span>
          </button>
        </div>

        {/* Copyright */}
        <div className="text-xs text-slate-500 text-center md:text-right flex items-center gap-1">
          <span>© 2026 Alerta Game. Feito com</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
        </div>
      </div>
    </footer>
  );
};
