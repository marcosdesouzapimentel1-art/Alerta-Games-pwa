import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { LogIn, UserPlus, KeyRound, Mail, Lock, User as UserIcon, Sparkles, LogOut } from 'lucide-react';

interface AuthCardProps {
  onSuccess?: () => void;
}

export const AuthCard: React.FC<AuthCardProps> = ({ onSuccess }) => {
  const { user, userProfile, loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword, logout } = useAuth();
  const { showToast } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await loginWithGoogle();
      showToast('Login com Google realizado com sucesso! 🎮');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao fazer login com Google.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !email.includes('@')) {
      setErrorMsg('Por favor, informe um e-mail válido.');
      return;
    }

    if (mode !== 'forgot' && (!password || password.length < 6)) {
      setErrorMsg('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setErrorMsg('Por favor, informe seu nome ou apelido gamer.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        showToast('Bem-vindo de volta! Login realizado. 🚀');
      } else if (mode === 'register') {
        await registerWithEmail(email, password, name.trim());
        showToast('Conta gamer criada com sucesso no Alerta Game! 🎉');
      } else if (mode === 'forgot') {
        await resetPassword(email);
        showToast('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
        setMode('login');
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMsg('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Este e-mail já está cadastrado.');
      } else {
        setErrorMsg(err.message || 'Ocorreu um erro. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (user && userProfile) {
    return (
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={userProfile.photoURL || userProfile.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80'}
              alt={userProfile.displayName || userProfile.name}
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-cyan-500/50"
            />
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                {userProfile.displayName || userProfile.name}
              </h3>
              <p className="text-xs text-slate-400">{userProfile.email}</p>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              showToast('Sessão encerrada.');
            }}
            className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-2xl backdrop-blur-xl">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-2">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black font-heading text-slate-100">
          {mode === 'login' && 'Entrar na sua Conta Gamer'}
          {mode === 'register' && 'Criar Conta no Alerta Game'}
          {mode === 'forgot' && 'Recuperar Senha'}
        </h2>
        <p className="text-xs text-slate-400">
          {mode === 'login' && 'Acesse seus favoritos, notificações e ofertas salvas'}
          {mode === 'register' && 'Junte-se à maior comunidade de ofertas e notícias de jogos'}
          {mode === 'forgot' && 'Enviaremos um link de redefinição para o seu e-mail'}
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {/* Google Sign In Button */}
      {mode !== 'forgot' && (
        <>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={submitting}
            className="w-full py-3 px-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-bold flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.4 0 15.3c0 2.9.7 5.6 1.9 8l3.7-2.9c-.2-.7-.4-1.5-.4-2.3z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
              />
            </svg>
            <span>Continuar com Google</span>
          </button>

          <div className="relative flex items-center my-2">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="shrink mx-3 text-[11px] text-slate-500 uppercase font-mono">ou use e-mail</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>
        </>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">Nome / Apelido Gamer</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: GamerPro2026"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 block">E-mail</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        {mode !== 'forgot' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 block">Senha</label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  Esqueci minha senha
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha secreta"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <span>Processando...</span>
          ) : mode === 'login' ? (
            <>
              <LogIn className="w-4 h-4" />
              <span>Entrar na Conta</span>
            </>
          ) : mode === 'register' ? (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Criar Conta Gamer</span>
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              <span>Enviar Link de Recuperação</span>
            </>
          )}
        </button>
      </form>

      {/* Switcher */}
      <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/80">
        {mode === 'login' && (
          <p>
            Ainda não tem conta?{' '}
            <button
              onClick={() => setMode('register')}
              className="text-cyan-400 font-bold hover:underline cursor-pointer"
            >
              Cadastre-se gratuitamente
            </button>
          </p>
        )}
        {mode === 'register' && (
          <p>
            Já possui uma conta?{' '}
            <button
              onClick={() => setMode('login')}
              className="text-cyan-400 font-bold hover:underline cursor-pointer"
            >
              Fazer Login
            </button>
          </p>
        )}
        {mode === 'forgot' && (
          <button
            onClick={() => setMode('login')}
            className="text-cyan-400 font-bold hover:underline cursor-pointer"
          >
            Voltar para o Login
          </button>
        )}
      </div>
    </div>
  );
};
