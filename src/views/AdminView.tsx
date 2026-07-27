import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import {
  getAdminDashboardStats,
  AdminDashboardStats,
} from '../services/adminService';
import { AdminDashboardTab } from '../components/admin/AdminDashboardTab';
import { AdminNewsTab } from '../components/admin/AdminNewsTab';
import { AdminCouponsTab } from '../components/admin/AdminCouponsTab';
import { AdminDealsTab } from '../components/admin/AdminDealsTab';
import { AdminAlertsTab } from '../components/admin/AdminAlertsTab';
import { AdminUsersLogsTab } from '../components/admin/AdminUsersLogsTab';
import {
  ShieldAlert,
  ShieldCheck,
  LayoutDashboard,
  Newspaper,
  Tag,
  Gift,
  Bell,
  FileText,
  UserCheck,
  Users,
  ArrowLeft,
  Sparkles,
  Lock,
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const { user, userProfile, isAdmin } = useAuth();
  const { setActiveTab } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<
    'dashboard' | 'users' | 'news' | 'coupons' | 'deals' | 'alerts' | 'logs'
  >('dashboard');

  const [stats, setStats] = useState<AdminDashboardStats>({
    totalUsers: 128,
    activeUsers: 89,
    newsCount: 15,
    couponsCount: 8,
    dealsCount: 24,
    freeGamesCount: 4,
    notificationsSentCount: 342,
    monthlyGrowthPercent: 24.8,
    recentActivityDays: [
      { date: '16/Jul', users: 18, notifications: 42, deals: 12 },
      { date: '17/Jul', users: 24, notifications: 50, deals: 19 },
      { date: '18/Jul', users: 31, notifications: 65, deals: 24 },
      { date: '19/Jul', users: 28, notifications: 58, deals: 21 },
      { date: '20/Jul', users: 45, notifications: 82, deals: 35 },
      { date: '21/Jul', users: 52, notifications: 94, deals: 41 },
      { date: '22/Jul', users: 67, notifications: 110, deals: 48 },
    ],
  });

  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const data = await getAdminDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin]);

  const adminUserInfo = {
    uid: user?.uid || 'admin-guest-id',
    name: userProfile?.displayName || userProfile?.name || user?.email || 'Administrador',
    email: user?.email || userProfile?.email || 'admin@alertagame.com',
  };

  // If not logged in or not admin, display Security Restriction / Auth Gate
  if (!user || !isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-100 font-heading">
              Acesso Restrito ao Painel Administrativo
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Somente usuários autenticados com o campo <code className="text-cyan-400">users.role = "admin"</code> possuem permissão para acessar esta área.
            </p>
          </div>

          {user ? (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Usuário Conectado:</span>
                <span className="font-bold text-slate-200">{user.email || user.uid}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Permissão Atual:</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono font-bold">
                  {userProfile?.role || 'user'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1 leading-relaxed border-t border-slate-900">
                Sua conta possui acesso de usuário comum. O acesso ao Painel Admin é concedido exclusivamente definindo o campo <code className="text-cyan-400 font-mono">role: "admin"</code> no documento da coleção <code className="text-cyan-400 font-mono">users/{'{uid}'}</code> via Firestore ou por outro Administrador.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-amber-400 font-medium">
                Faça login com sua conta para verificar ou obter acesso administrativo.
              </p>
              <button
                onClick={() => setActiveTab('perfil')}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                Ir para Login / Perfil
              </button>
            </div>
          )}

          <button
            onClick={() => setActiveTab('inicio')}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 mx-auto pt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para o aplicativo</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      
      {/* Top Banner Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                Área Administrativa Segura
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                ADMIN ROLE
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-100 font-heading tracking-tight mt-0.5">
              Painel de Controle Alerta Game
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => setActiveTab('inicio')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao App</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800/80">
        <button
          onClick={() => setActiveAdminTab('dashboard')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeAdminTab === 'dashboard'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard & Estatísticas</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('users')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeAdminTab === 'users'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuários & Permissões</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('news')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeAdminTab === 'news'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>Notícias</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('coupons')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeAdminTab === 'coupons'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Cupons</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('deals')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeAdminTab === 'deals'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Promoções</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('alerts')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeAdminTab === 'alerts'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Disparar Alertas</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('logs')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeAdminTab === 'logs'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Logs do Sistema</span>
        </button>
      </div>

      {/* Tab Content Display */}
      {activeAdminTab === 'dashboard' && (
        <AdminDashboardTab
          stats={stats}
          onNavigateTab={(tab) => setActiveAdminTab(tab as any)}
        />
      )}

      {activeAdminTab === 'users' && (
        <AdminUsersLogsTab
          adminUser={adminUserInfo}
          onRefreshStats={loadStats}
          initialSubTab="users"
        />
      )}

      {activeAdminTab === 'news' && (
        <AdminNewsTab
          adminUser={adminUserInfo}
          onRefreshStats={loadStats}
        />
      )}

      {activeAdminTab === 'coupons' && (
        <AdminCouponsTab
          adminUser={adminUserInfo}
          onRefreshStats={loadStats}
        />
      )}

      {activeAdminTab === 'deals' && (
        <AdminDealsTab
          adminUser={adminUserInfo}
          onRefreshStats={loadStats}
        />
      )}

      {activeAdminTab === 'alerts' && (
        <AdminAlertsTab
          adminUser={adminUserInfo}
          onRefreshStats={loadStats}
        />
      )}

      {activeAdminTab === 'logs' && (
        <AdminUsersLogsTab
          adminUser={adminUserInfo}
          onRefreshStats={loadStats}
          initialSubTab="logs"
        />
      )}

    </div>
  );
};
