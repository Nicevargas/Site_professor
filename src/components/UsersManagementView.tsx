import React, { useState } from 'react';
import { 
  SystemUser, 
  UserRole, 
  TeacherProfile, 
  AuthUser 
} from '../types';
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  GraduationCap, 
  Headphones, 
  Sparkles, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Edit3, 
  Trash2, 
  LogIn, 
  Lock, 
  Mail, 
  Phone, 
  Calendar,
  Layers,
  Check,
  Eye,
  Settings,
  DollarSign
} from 'lucide-react';

interface UsersManagementViewProps {
  users: SystemUser[];
  onAddUser: (user: Omit<SystemUser, 'id' | 'createdAt'>) => void;
  onUpdateUser: (id: string, updates: Partial<SystemUser>) => void;
  onDeleteUser: (id: string) => void;
  onSwitchUser: (user: SystemUser) => void;
  currentUser: AuthUser | null;
  teachers: TeacherProfile[];
}

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onSwitchUser,
  currentUser,
  teachers,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'todos' | UserRole>('todos');
  const [activeTab, setActiveTab] = useState<'usuarios' | 'permissoes'>('usuarios');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  // New User Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('professor');
  const [phone, setPhone] = useState('');
  const [teacherId, setTeacherId] = useState<string>(teachers[0]?.id || 'prof-roberto');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');

  const countAdmin = users.filter((u) => u.role === 'admin').length;
  const countProfessor = users.filter((u) => u.role === 'professor').length;
  const countAssistente = users.filter((u) => u.role === 'assistente').length;
  const countAluno = users.filter((u) => u.role === 'aluno').length;

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm));
    const matchesRole = roleFilter === 'todos' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (userRole: UserRole) => {
    switch (userRole) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Administrador Geral</span>
          </span>
        );
      case 'professor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-50 text-[#00687a] border border-cyan-200">
            <GraduationCap className="w-3.5 h-3.5 text-[#00687a]" />
            <span>Professor / Mentor</span>
          </span>
        );
      case 'assistente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Headphones className="w-3.5 h-3.5 text-purple-600" />
            <span>Secretaria / Assistente</span>
          </span>
        );
      case 'aluno':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Aluno / Cliente</span>
          </span>
        );
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    onAddUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role,
      phone: phone.trim() || '(11) 98888-0000',
      teacherId: role === 'assistente' || role === 'aluno' ? teacherId : role === 'professor' ? `prof-${Date.now()}` : undefined,
      status: 'ativo',
      lastLogin: 'Nunca',
      bio: bio.trim() || `Usuário do tipo ${role} cadastrado no sistema.`,
      avatarUrl: role === 'aluno' 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      permissions: role === 'admin' 
        ? ['all_access'] 
        : role === 'professor' 
        ? ['manage_own_agenda', 'manage_own_services', 'manage_own_finances'] 
        : role === 'assistente' 
        ? ['view_agenda', 'register_students', 'send_whatsapp_reminders'] 
        : ['view_own_classes', 'book_classes', 'view_own_invoices'],
    });

    setName('');
    setEmail('');
    setRole('professor');
    setPhone('');
    setPassword('');
    setBio('');
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    onUpdateUser(editingUser.id, {
      name: editingUser.name,
      email: editingUser.email,
      role: editingUser.role,
      phone: editingUser.phone,
      status: editingUser.status,
      bio: editingUser.bio,
    });

    setEditingUser(null);
  };

  return (
    <main className="flex-1 p-4 md:p-10 bg-[#f7f9fb] pb-32 overflow-y-auto font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header with Title & Action */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#00687a]/10 rounded-xl text-[#00687a]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#091426] tracking-tight">
                Gestão de Usuários & Níveis de Acesso
              </h1>
            </div>
            <p className="text-sm text-[#75777d] mt-1">
              Controle de múltiplos usuários, perfis de permissão (RBAC) e controle de acesso individual.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-[#00687a] hover:bg-[#004e5c] text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-sm transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Usuário</span>
            </button>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Usuários</p>
              <h3 className="text-2xl font-extrabold text-[#091426] mt-1">{users.length}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Cadastrados no sistema</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200/70 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Administradores</p>
              <h3 className="text-2xl font-extrabold text-amber-800 mt-1">{countAdmin}</h3>
              <p className="text-[11px] text-amber-600 mt-0.5">Acesso total irrestrito</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-cyan-200/70 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#00687a] uppercase tracking-wider">Professores</p>
              <h3 className="text-2xl font-extrabold text-[#00687a] mt-1">{countProfessor}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Gestão de aulas e alunos</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-cyan-50 flex items-center justify-center text-[#00687a]">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-purple-200/70 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Assistentes / Alunos</p>
              <h3 className="text-2xl font-extrabold text-purple-800 mt-1">{countAssistente + countAluno}</h3>
              <p className="text-[11px] text-purple-600 mt-0.5">{countAssistente} secretárias • {countAluno} alunos</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Headphones className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`pb-3 text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'usuarios'
                ? 'text-[#00687a] border-b-2 border-[#00687a]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Lista de Usuários da Equipe ({filteredUsers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('permissoes')}
            className={`pb-3 text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'permissoes'
                ? 'text-[#00687a] border-b-2 border-[#00687a]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Matriz de Níveis de Acesso & Permissões</span>
          </button>
        </div>

        {activeTab === 'usuarios' && (
          <div className="space-y-6">
            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, e-mail ou telefone..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00687a]"
                />
              </div>

              {/* Role filter pills */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <span className="text-xs font-semibold text-slate-400 mr-1">Filtrar:</span>
                <button
                  onClick={() => setRoleFilter('todos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    roleFilter === 'todos'
                      ? 'bg-[#00687a] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({users.length})
                </button>
                <button
                  onClick={() => setRoleFilter('admin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    roleFilter === 'admin'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                  }`}
                >
                  Admin ({countAdmin})
                </button>
                <button
                  onClick={() => setRoleFilter('professor')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    roleFilter === 'professor'
                      ? 'bg-[#00687a] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-cyan-50 hover:text-[#00687a]'
                  }`}
                >
                  Professores ({countProfessor})
                </button>
                <button
                  onClick={() => setRoleFilter('assistente')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    roleFilter === 'assistente'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-700'
                  }`}
                >
                  Assistentes ({countAssistente})
                </button>
                <button
                  onClick={() => setRoleFilter('aluno')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    roleFilter === 'aluno'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  Alunos ({countAluno})
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-5">Usuário</th>
                      <th className="py-3.5 px-4">Nível de Acesso (Cargo)</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Contato</th>
                      <th className="py-3.5 px-4">Último Acesso</th>
                      <th className="py-3.5 px-5 text-right">Ações & Simulação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user) => {
                      const isCurrent = currentUser?.id === user.id || currentUser?.email.toLowerCase() === user.email.toLowerCase();

                      return (
                        <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* User info */}
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200">
                                <img
                                  src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                                  alt={user.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-sm text-[#091426] truncate">{user.name}</p>
                                  {isCurrent && (
                                    <span className="text-[10px] font-bold bg-[#00687a]/10 text-[#00687a] px-2 py-0.5 rounded-full">
                                      Você (Atual)
                                    </span>
                                  )}
                                </div>
                                <p className="text-slate-400 text-xs truncate">{user.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-4 px-4">
                            {getRoleBadge(user.role)}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              user.status === 'ativo' 
                                ? 'bg-emerald-50 text-emerald-700' 
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ativo' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                              <span className="capitalize">{user.status}</span>
                            </span>
                          </td>

                          {/* Contact */}
                          <td className="py-4 px-4">
                            <div className="space-y-0.5 text-slate-600">
                              <p className="flex items-center gap-1 text-xs">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{user.phone || 'Não informado'}</span>
                              </p>
                              <p className="flex items-center gap-1 text-[11px] text-slate-400">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span className="truncate max-w-[150px]">{user.email}</span>
                              </p>
                            </div>
                          </td>

                          {/* Last Login */}
                          <td className="py-4 px-4 text-slate-500">
                            {user.lastLogin || 'Nunca'}
                          </td>

                          {/* Actions & Switch Role */}
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Fast Switch / Demo test button */}
                              <button
                                onClick={() => onSwitchUser(user)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                                  isCurrent
                                    ? 'bg-slate-100 text-slate-400 cursor-default'
                                    : 'bg-[#00687a]/10 hover:bg-[#00687a] text-[#00687a] hover:text-white'
                                }`}
                                title="Entrar na visão deste usuário para testar permissões"
                                disabled={isCurrent}
                              >
                                <LogIn className="w-3.5 h-3.5" />
                                <span>{isCurrent ? 'Sessão Ativa' : 'Simular Acesso'}</span>
                              </button>

                              <button
                                onClick={() => setEditingUser(user)}
                                className="p-1.5 text-slate-400 hover:text-[#00687a] hover:bg-slate-100 rounded-lg transition-colors"
                                title="Editar Usuário"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {users.length > 1 && (
                                <button
                                  onClick={() => onDeleteUser(user.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Remover Usuário"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab Permissions Matrix */}
        {activeTab === 'permissoes' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[#091426]">Matriz de Permissões por Nível de Acesso (RBAC)</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tabela detalhada com as ações permitidas para cada perfil de usuário dentro da plataforma.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Módulo / Recurso</th>
                    <th className="py-3 px-4 text-center">👑 Admin Geral</th>
                    <th className="py-3 px-4 text-center">🎓 Professor / Mentor</th>
                    <th className="py-3 px-4 text-center">📋 Secretaria / Assistente</th>
                    <th className="py-3 px-4 text-center">🎒 Aluno / Cliente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-800">Visualizar e Editar Agenda Geral</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Total (Todos os profs)</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Minhas Aulas</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Total da Unidade</td>
                    <td className="py-3 px-4 text-center text-slate-400 font-medium">✗ (Apenas suas aulas)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-800">Gerenciar Serviços & Valores</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Total</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Próprios Serviços</td>
                    <td className="py-3 px-4 text-center text-slate-400 font-medium">Apenas Leitura</td>
                    <td className="py-3 px-4 text-center text-slate-400 font-medium">✗</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-800">Cadastro & CRM de Alunos</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Total</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Próprios Alunos</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Total</td>
                    <td className="py-3 px-4 text-center text-slate-400 font-medium">✗ (Apenas seu perfil)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-800">Financeiro & Recebimentos Pix</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Relatório Geral & Chaves</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Suas Cobranças e Pix</td>
                    <td className="py-3 px-4 text-center text-amber-600 font-medium">Emissão sem saldo global</td>
                    <td className="py-3 px-4 text-center text-slate-400 font-medium">Minhas Faturas & Pix</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-800">Disparo de WhatsApp 8h / Lembretes</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Total</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Suas Aulas</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Total</td>
                    <td className="py-3 px-4 text-center text-slate-400 font-medium">✗ (Recebe mensagens)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-800">Gerenciar Usuários & Níveis de Acesso</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Total</td>
                    <td className="py-3 px-4 text-center text-slate-400 font-medium">✗</td>
                    <td className="py-3 px-4 text-center text-slate-400 font-medium">✗</td>
                    <td className="py-3 px-4 text-center text-slate-400 font-medium">✗</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-800">Customizar Meu Site, Vídeos & Podcasts</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Total</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Própria Vitrine</td>
                    <td className="py-3 px-4 text-center text-slate-400 font-medium">✗</td>
                    <td className="py-3 px-4 text-center text-slate-400 font-medium">✗ (Apenas assiste)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL ADICIONAR NOVO USUÁRIO */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setIsAddModalOpen(false)}>
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-elevated border border-slate-200 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#00687a]" />
                  <h3 className="font-bold text-base text-[#091426]">Cadastrar Novo Usuário</h3>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4 mt-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Dra. Juliana Santos"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">E-mail de Acesso *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="juliana@email.com"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">WhatsApp / Telefone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 98765-4321"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nível de Acesso (Cargo) *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none font-medium bg-white"
                  >
                    <option value="professor">🎓 Professor / Instrutor / Mentor</option>
                    <option value="assistente">📋 Secretaria / Assistente / Atendimento</option>
                    <option value="aluno">🎒 Aluno / Cliente (Portal do Aluno)</option>
                    <option value="admin">👑 Administrador Geral (Acesso Total)</option>
                  </select>
                </div>

                {(role === 'assistente' || role === 'aluno') && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Vincular ao Professor Responsável</label>
                    <select
                      value={teacherId}
                      onChange={(e) => setTeacherId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none font-medium bg-white"
                    >
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>{t.name} ({t.role})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Senha Inicial Provisória</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#00687a] hover:bg-[#004e5c] text-white font-bold transition-colors"
                  >
                    Cadastrar Usuário
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL EDITAR USUÁRIO */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setEditingUser(null)}>
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-elevated border border-slate-200 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-[#00687a]" />
                  <h3 className="font-bold text-base text-[#091426]">Editar Usuário: {editingUser.name}</h3>
                </div>
                <button onClick={() => setEditingUser(null)} className="p-1 text-slate-400 hover:text-slate-700 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 mt-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">E-mail</label>
                    <input
                      type="email"
                      required
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">WhatsApp / Telefone</label>
                    <input
                      type="text"
                      value={editingUser.phone || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cargo / Nível de Acesso</label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none bg-white font-medium"
                    >
                      <option value="professor">🎓 Professor / Mentor</option>
                      <option value="assistente">📋 Secretaria / Assistente</option>
                      <option value="aluno">🎒 Aluno / Cliente</option>
                      <option value="admin">👑 Administrador Geral</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Status da Conta</label>
                    <select
                      value={editingUser.status}
                      onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as 'ativo' | 'inativo' })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none bg-white font-medium"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo / Bloqueado</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#00687a] hover:bg-[#004e5c] text-white font-bold transition-colors"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </main>
  );
};
