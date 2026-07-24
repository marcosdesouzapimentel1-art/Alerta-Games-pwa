import React from 'react';
import { AdminDashboardStats } from '../../services/adminService';
import {
  Users,
  UserCheck,
  Newspaper,
  Tag,
  Gift,
  Gamepad2,
  Bell,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface AdminDashboardTabProps {
  stats: AdminDashboardStats;
  onNavigateTab: (tab: 'users' | 'news' | 'coupons' | 'deals' | 'alerts' | 'logs') => void;
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({
  stats,
  onNavigateTab,
}) => {
  const maxActivityVal = Math.max(
    ...stats.recentActivityDays.map((d) => d.notifications),
    100
  );

  return (
    <div className="space-y-6">
      
      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        
        {/* Total Users */}
        <div
          onClick={() => onNavigateTab('users')}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 relative overflow-hidden group hover:border-cyan-500/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Total de Usuários</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-heading text-slate-100">
              {stats.totalUsers}
            </span>
            <span className="text-[11px] font-bold text-emerald-400 flex items-center">
              +{stats.monthlyGrowthPercent}% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="text-[10px] text-slate-500 flex justify-between items-center">
            <span>Cadastrados no Firestore</span>
            <span className="text-cyan-400 hover:underline">Ver todos &rarr;</span>
          </div>
        </div>

        {/* Active Users */}
        <div
          onClick={() => onNavigateTab('users')}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 relative overflow-hidden group hover:border-emerald-500/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Usuários Ativos</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-heading text-emerald-300">
              {stats.activeUsers}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {Math.round((stats.activeUsers / stats.totalUsers) * 100)}% engajamento
            </span>
          </div>
          <div className="text-[10px] text-slate-500 flex justify-between items-center">
            <span>Acessaram nos últimos 7 dias</span>
            <span className="text-emerald-400 hover:underline">Ver todos &rarr;</span>
          </div>
        </div>

        {/* News Count */}
        <div
          onClick={() => onNavigateTab('news')}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 relative overflow-hidden group hover:border-blue-500/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Notícias</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Newspaper className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-heading text-blue-300">
              {stats.newsCount}
            </span>
            <span className="text-[10px] text-blue-400 hover:underline">Gerenciar &rarr;</span>
          </div>
          <div className="text-[10px] text-slate-500">Publicadas no aplicativo</div>
        </div>

        {/* Coupons Count */}
        <div
          onClick={() => onNavigateTab('coupons')}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 relative overflow-hidden group hover:border-amber-500/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Cupons Ativos</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-heading text-amber-300">
              {stats.couponsCount}
            </span>
            <span className="text-[10px] text-amber-400 hover:underline">Gerenciar &rarr;</span>
          </div>
          <div className="text-[10px] text-slate-500">Lojas parceiras</div>
        </div>

        {/* Deals / Promotions */}
        <div
          onClick={() => onNavigateTab('deals')}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 relative overflow-hidden group hover:border-purple-500/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Promoções</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-heading text-purple-300">
              {stats.dealsCount}
            </span>
            <span className="text-[10px] text-purple-400 hover:underline">Gerenciar &rarr;</span>
          </div>
          <div className="text-[10px] text-slate-500">Ofertas e descontos</div>
        </div>

        {/* Free Games */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Jogos Grátis</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Gamepad2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-heading text-cyan-300">
              {stats.freeGamesCount}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Epic / Steam</span>
          </div>
          <div className="text-[10px] text-slate-500">Ativos este mês</div>
        </div>

        {/* Notifications Sent */}
        <div
          onClick={() => onNavigateTab('alerts')}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 relative overflow-hidden group hover:border-rose-500/40 transition-colors cursor-pointer col-span-2 sm:col-span-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Alertas & Notificações Enviadas</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-heading text-rose-300">
              {stats.notificationsSentCount}
            </span>
            <span className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>Enviar Novo Alerta</span>
            </span>
          </div>
          <div className="text-[10px] text-slate-500">Disparadas via Firebase Cloud Messaging & In-App</div>
        </div>

      </div>

      {/* Visual Statistics Chart */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100 font-heading">
              Estatísticas de Engajamento & Atividade Diária
            </h3>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Crescimento constante
          </span>
        </div>

        {/* Bar Visualizer */}
        <div className="space-y-3 pt-2">
          <div className="flex items-end gap-3 h-44 pt-4 px-2 border-b border-slate-800">
            {stats.recentActivityDays.map((day, idx) => {
              const heightPct = Math.round((day.notifications / maxActivityVal) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-[10px] text-cyan-300 px-2 py-1 rounded border border-slate-700 whitespace-nowrap shadow-lg">
                    {day.notifications} Notificações | {day.users} Usuários
                  </div>

                  <div className="w-full max-w-[28px] bg-slate-800 rounded-t-xl overflow-hidden relative h-full flex items-end">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-gradient-to-t from-blue-600 via-cyan-500 to-cyan-400 rounded-t-xl transition-all duration-500"
                    />
                  </div>

                  <span className="text-[10px] font-mono text-slate-400">{day.date}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-6 text-[11px] text-slate-400 pt-2">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-cyan-400 inline-block" />
              Notificações Disparadas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
              Usuários Ativos por Dia
            </span>
          </div>
        </div>
      </div>

      {/* Admin Quick Actions */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 font-heading flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          Ações Rápidas de Gestão
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => onNavigateTab('news')}
            className="p-4 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-all cursor-pointer group"
          >
            <Newspaper className="w-5 h-5 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-slate-200">Publicar Nova Notícia</h4>
            <p className="text-[11px] text-slate-400">Criar notícia manual com tags e capa</p>
          </button>

          <button
            onClick={() => onNavigateTab('coupons')}
            className="p-4 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-all cursor-pointer group"
          >
            <Tag className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-slate-200">Adicionar Cupom</h4>
            <p className="text-[11px] text-slate-400">Cadastrar cupom de loja parceira</p>
          </button>

          <button
            onClick={() => onNavigateTab('alerts')}
            className="p-4 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-all cursor-pointer group"
          >
            <Bell className="w-5 h-5 text-rose-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-slate-200">Disparar Alerta</h4>
            <p className="text-[11px] text-slate-400">Enviar push notification para público</p>
          </button>
        </div>
      </div>

    </div>
  );
};
