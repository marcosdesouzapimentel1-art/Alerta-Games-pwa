import React, { useState, useEffect } from 'react';
import { AdminLog, UserProfile } from '../../types';
import {
  getAdminLogs,
  getAllUsersAdmin,
  updateUserRoleAdmin,
} from '../../services/adminService';
import {
  ShieldCheck,
  UserCheck,
  Users,
  FileText,
  Clock,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  UserCog,
  RefreshCw,
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

interface AdminUsersLogsTabProps {
  adminUser: { uid: string; name: string };
  onRefreshStats: () => void;
  initialSubTab?: 'logs' | 'users';
}

export const AdminUsersLogsTab: React.FC<AdminUsersLogsTabProps> = ({
  adminUser,
  onRefreshStats,
  initialSubTab = 'logs',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'logs' | 'users'>(initialSubTab);

  useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  // Logs State
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(true);
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');

  // Users State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchLogsData = async () => {
    setLoadingLogs(true);
    try {
      const data = await getAdminLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching admin logs:', err);
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchUsersData = async () => {
    setLoadingUsers(true);
    try {
      const data = await getAllUsersAdmin();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching admin users:', err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchLogsData();
    fetchUsersData();
  }, []);

  const handleRoleToggle = async (targetUser: UserProfile) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    const targetName = targetUser.displayName || targetUser.name || targetUser.email || 'Usuário';
    
    if (
      !window.confirm(
        `Deseja alterar as permissões de ${targetName} para ${newRole.toUpperCase()}?`
      )
    )
      return;

    try {
      await updateUserRoleAdmin(
        targetUser.uid,
        targetUser.email || targetUser.uid,
        newRole,
        adminUser
      );

      setUsers((prev) =>
        prev.map((u) => (u.uid === targetUser.uid ? { ...u, role: newRole } : u))
      );

      setFeedback({
        type: 'success',
        message: `Permissões de ${targetName} alteradas para ${newRole.toUpperCase()}.`,
      });

      await fetchLogsData();
      onRefreshStats();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro ao alterar permissão.' });
    }
  };

  // Safe search filtering
  const qLog = (logSearchQuery || '').toLowerCase().trim();
  const filteredLogs = logs.filter((l) => {
    if (!l) return false;
    const name = String(l.userName || l.userId || '').toLowerCase();
    const action = String(l.action || '').toLowerCase();
    const target = String(l.target || '').toLowerCase();
    return name.includes(qLog) || action.includes(qLog) || target.includes(qLog);
  });

  const qUser = (userSearchQuery || '').toLowerCase().trim();
  const filteredUsers = users.filter((u) => {
    if (!u) return false;
    const displayName = String(u.displayName || u.name || '').toLowerCase();
    const email = String(u.email || '').toLowerCase();
    const uid = String(u.uid || '').toLowerCase();
    return displayName.includes(qUser) || email.includes(qUser) || uid.includes(qUser);
  });

  const formatDate = (dateVal: any) => {
    try {
      if (!dateVal) return 'Data não disponível';
      if (dateVal.seconds) return new Date(dateVal.seconds * 1000).toLocaleDateString('pt-BR');
      const d = new Date(dateVal);
      return isNaN(d.getTime()) ? 'Data não disponível' : d.toLocaleDateString('pt-BR');
    } catch {
      return 'Data não disponível';
    }
  };

  const formatDateTime = (dateVal: any) => {
    try {
      if (!dateVal) return 'Data não disponível';
      if (dateVal.seconds) return new Date(dateVal.seconds * 1000).toLocaleString('pt-BR');
      const d = new Date(dateVal);
      return isNaN(d.getTime()) ? 'Data não disponível' : d.toLocaleString('pt-BR');
    } catch {
      return 'Data não disponível';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Toggle Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-100 font-heading flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            Segurança, Registros e Permissões
          </h3>
          <p className="text-xs text-slate-400">
            Acompanhe logs de auditoria administrativa e gerencie as roles de acesso (users vs admin).
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
          <button
            onClick={() => setActiveSubTab('logs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'logs'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Logs do Sistema ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'users'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Usuários ({users.length})</span>
          </button>
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

      {/* SUBTAB 1: ADMIN LOGS TABLE */}
      {activeSubTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Filtrar por administrador, ação ou alvo..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              onClick={fetchLogsData}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Atualizar Logs</span>
            </button>
          </div>

          {loadingLogs ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
              Carregando registros de auditoria em admin_logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
              Nenhum registro de log encontrado.
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Administrador</th>
                      <th className="py-3 px-4">Ação Realizada</th>
                      <th className="py-3 px-4">Alvo / Item</th>
                      <th className="py-3 px-4">Detalhes</th>
                      <th className="py-3 px-4">Data e Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredLogs.map((log, idx) => (
                      <tr key={log.id || idx} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-100 flex items-center gap-2">
                          <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{log.userName || log.userId || 'Admin'}</span>
                        </td>
                        <td className="py-3 px-4 font-bold text-cyan-300">{log.action || '-'}</td>
                        <td className="py-3 px-4 text-slate-200">{log.target || '-'}</td>
                        <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">{log.details || '-'}</td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {formatDateTime(log.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: USERS PERMISSIONS MANAGEMENT */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar usuário por nome, email ou UID..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              onClick={fetchUsersData}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Atualizar Usuários</span>
            </button>
          </div>

          {loadingUsers ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
              Carregando lista de usuários do Firestore...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
              Nenhum usuário encontrado.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.uid || Math.random().toString()}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={user.photoURL || user.avatarUrl || logoImg}
                      alt={user.displayName || 'Gamer'}
                      className="w-10 h-10 rounded-xl object-cover bg-slate-950 border border-slate-800 shrink-0"
                    />

                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-100 truncate">
                        {user.displayName || user.name || 'Gamer Alerta'}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">{user.email || user.uid}</p>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Cadastrado em: {formatDate(user.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        user.role === 'admin'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      Role: {user.role ? user.role.toUpperCase() : 'USER'}
                    </span>

                    <button
                      onClick={() => handleRoleToggle(user)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <UserCog className="w-3 h-3" />
                      <span>{user.role === 'admin' ? 'Tornar User' : 'Tornar Admin'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
