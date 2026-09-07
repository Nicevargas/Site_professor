import React, { useState } from 'react';
import { 
  SystemUser, 
  UserRole, 
  TeacherProfile, 
  AuthUser,
  Company
} from '../types';
import { QuotaStatus } from '../utils/plans';
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
  DollarSign,
  Building2,
  Plus,
  Globe
} from 'lucide-react';

interface UsersManagementViewProps {
  users: SystemUser[];
  onAddUser: (user: Omit<SystemUser, 'id' | 'createdAt'>) => void;
  onUpdateUser: (id: string, updates: Partial<SystemUser>) => void;
  onDeleteUser: (id: string) => void;
  onSwitchUser: (user: SystemUser) => void;
  currentUser: AuthUser | null;
  teachers: TeacherProfile[];
  companies?: Company[];
  /** Papel de quem está usando a tela; o gestor não cria admin nem outro gestor */
  currentRole?: UserRole;
  /** Ocupação da conta diante do limite do plano */
  quota?: QuotaStatus;
  onOpenPlans?: () => void;
  onSaveCompany?: (company: Company) => void;
  onDeleteCompany?: (id: string) => void;
}

/** Opção do seletor de professor que cria um perfil novo em vez de reaproveitar um existente. */
export const NEW_TEACHER_OPTION = '__novo_professor__';

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onSwitchUser,
  currentUser,
  teachers,
  companies = [],
  currentRole = 'admin',
  quota,
  onOpenPlans,
  onSaveCompany,
  onDeleteCompany,
}) => {
  // Elevar papel é coisa da plataforma. O banco recusa de qualquer jeito
  // (system_users_manager_insert), mas a tela não deve nem oferecer.
  const canAssignPrivilegedRoles = currentRole === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'todos' | UserRole>('todos');
  const [activeTab, setActiveTab] = useState<'usuarios' | 'empresas' | 'permissoes'>('usuarios');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  // New User Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('professor');
  const [phone, setPhone] = useState('');
  const [teacherId, setTeacherId] = useState<string>(teachers[0]?.id || NEW_TEACHER_OPTION);
  const [companyId, setCompanyId] = useState<string>('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');

  // Empresas
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [convidadoCopiado, setConvidadoCopiado] = useState<string | null>(null);

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

  /**
   * Convite pendente: a pessoa foi cadastrada mas ainda não criou o acesso.
   * Quem faz a ligação é o gatilho on_auth_user_created, quando ela se
   * cadastra com o MESMO e-mail -- daí o convite vira conta ativa.
   */
  const isConvitePendente = (user: SystemUser) => user.status === 'pendente';

  const copiarConvite = async (user: SystemUser) => {
    const endereco = `${window.location.origin}${window.location.pathname}#/entrar`;
    const texto = [
      `Olá, ${user.name.split(' ')[0]}!`,
      '',
      'Seu acesso ao Aquagenda já está preparado. Para entrar, crie seu cadastro em:',
      endereco,
      '',
      `Use exatamente este e-mail: ${user.email}`,
      'Se usar outro, o acesso não será reconhecido.',
    ].join('\n');

    try {
      await navigator.clipboard.writeText(texto);
      setConvidadoCopiado(user.id);
      setTimeout(() => setConvidadoCopiado(null), 2500);
    } catch {
      window.prompt('Copie o convite abaixo:', texto);
    }
  };

  const teacherName = (id?: string) => teachers.find((t) => t.id === id)?.name;
  const companyName = (id?: string) => companies.find((c) => c.id === id)?.name;

  /** Empresa e professor aos quais o usuário responde, para a coluna "Vínculo". */
  const describeLink = (user: SystemUser): { company?: string; teacher?: string; orphan: boolean } => {
    if (user.role === 'admin') return { orphan: false };
    const company = companyName(user.companyId) || companyName(teachers.find((t) => t.id === user.teacherId)?.companyId);
    const teacher = teacherName(user.teacherId);
    return { company, teacher, orphan: Boolean(user.teacherId) && !teacher };
  };

  const getRoleBadge = (userRole: UserRole) => {
    switch (userRole) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Administrador Geral</span>
          </span>
        );
      case 'gestor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Gestor da Empresa</span>
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
    // O banco recusaria de qualquer jeito (gatilho enforce_user_quota);
    // parar aqui evita a ida perdida e explica o motivo.
    if (quota?.isFull) return;

    onAddUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role,
      phone: phone.trim() || '(11) 98888-0000',
      teacherId: role === 'admin' ? undefined : teacherId === NEW_TEACHER_OPTION ? `prof-${Date.now()}` : teacherId,
      companyId: role === 'admin' ? undefined : companyId || undefined,
      // Convite: só vira 'ativo' quando a pessoa cria o acesso com este e-mail
      status: 'pendente',
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
    setCompanyId('');
    setTeacherId(teachers[0]?.id || NEW_TEACHER_OPTION);
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
      teacherId: editingUser.role === 'admin' ? undefined : editingUser.teacherId,
      companyId: editingUser.role === 'admin' ? undefined : editingUser.companyId,
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
              {currentRole === 'gestor'
                ? 'Você administra os professores, a secretaria e os alunos da sua academia. Contas de outras academias não aparecem aqui.'
                : 'Controle de múltiplos usuários, perfis de permissão (RBAC) e controle de acesso individual.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              disabled={quota?.isFull}
              title={
                quota?.isFull
                  ? `O plano permite ${quota.limit} usuários e a conta já tem ${quota.used}.`
                  : undefined
              }
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm shadow-sm transition-all ${
                quota?.isFull
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#00687a] hover:bg-[#004e5c] text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Usuário</span>
            </button>
          </div>
        </div>

        {quota && (quota.isFull || quota.isNearLimit) && (
          <div
            role="status"
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center gap-3 ${
              quota.isFull
                ? 'bg-rose-50 border-rose-200'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-bold ${quota.isFull ? 'text-rose-800' : 'text-amber-900'}`}>
                {quota.isFull
                  ? `Seu plano chegou ao limite de ${quota.limit} usuários`
                  : `Faltam ${quota.remaining} usuário(s) para o limite do seu plano`}
              </p>
              <p className={`text-xs mt-0.5 ${quota.isFull ? 'text-rose-700' : 'text-amber-800'}`}>
                {quota.used} de {quota.limit} usuários em uso.{' '}
                {quota.isFull
                  ? quota.suggested
                    ? `Para cadastrar mais, mude para o ${quota.suggested.name} (${quota.suggested.usersLabel}, R$ ${quota.suggested.priceMonth}/mês).`
                    : 'Fale com o suporte para uma conta acima de 500 usuários.'
                  : 'Professores, secretaria e alunos contam para o limite.'}
              </p>
            </div>
            {onOpenPlans && quota.suggested && (
              <button
                onClick={onOpenPlans}
                className="px-4 py-2.5 rounded-xl bg-[#00687a] hover:bg-[#004e5c] text-white text-xs font-bold shrink-0"
              >
                Ver planos
              </button>
            )}
          </div>
        )}

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
          {onSaveCompany && (
            <button
              onClick={() => setActiveTab('empresas')}
              className={`pb-3 text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'empresas'
                  ? 'text-[#00687a] border-b-2 border-[#00687a]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Empresas / Escolas ({companies.length})</span>
            </button>
          )}
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
                      <th className="py-3.5 px-4">Vínculo (Empresa / Professor)</th>
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

                          {/* Vínculo */}
                          <td className="py-4 px-4">
                            {(() => {
                              const link = describeLink(user);
                              if (user.role === 'admin') {
                                return <span className="text-slate-400">Plataforma (sem vínculo)</span>;
                              }
                              if (link.orphan) {
                                return (
                                  <button
                                    onClick={() => setEditingUser(user)}
                                    className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full font-bold"
                                  >
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    Vínculo quebrado — corrigir
                                  </button>
                                );
                              }
                              if (!link.company && !link.teacher) {
                                return (
                                  <button
                                    onClick={() => setEditingUser(user)}
                                    className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-bold"
                                  >
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    Sem vínculo — definir
                                  </button>
                                );
                              }
                              return (
                                <div className="space-y-0.5">
                                  {link.company && (
                                    <p className="flex items-center gap-1.5 font-semibold text-slate-700">
                                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                      {link.company}
                                    </p>
                                  )}
                                  {link.teacher && (
                                    <p className="flex items-center gap-1.5 text-slate-500">
                                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                                      {link.teacher}
                                    </p>
                                  )}
                                </div>
                              );
                            })()}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              user.status === 'ativo'
                                ? 'bg-emerald-50 text-emerald-700'
                                : user.status === 'pendente'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                user.status === 'ativo' ? 'bg-emerald-500'
                                : user.status === 'pendente' ? 'bg-amber-500'
                                : 'bg-slate-400'
                              }`}></span>
                              <span className="capitalize">
                                {isConvitePendente(user) ? 'Convite pendente' : user.status}
                              </span>
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
                              {/* Convite ainda não aceito: o caminho útil aqui é
                                  reenviar as instruções, não simular acesso a
                                  uma conta que ainda não existe. */}
                              {isConvitePendente(user) && (
                                <button
                                  onClick={() => copiarConvite(user)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                                    convidadoCopiado === user.id
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                                  }`}
                                  title={`Copiar as instruções de acesso para ${user.name}`}
                                >
                                  {convidadoCopiado === user.id ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Copiado</span>
                                    </>
                                  ) : (
                                    <>
                                      <Mail className="w-3.5 h-3.5" />
                                      <span>Copiar convite</span>
                                    </>
                                  )}
                                </button>
                              )}

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
        {activeTab === 'empresas' && onSaveCompany && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                A empresa é o perfil principal: agrupa vários professores e os usuários que respondem a eles.
                Professor autônomo simplesmente não fica em nenhuma empresa.
              </p>
              <button
                onClick={() => { setEditingCompany(null); setIsCompanyModalOpen(true); }}
                className="flex items-center justify-center gap-2 bg-[#00687a] hover:bg-[#004e5c] text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-sm transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Empresa</span>
              </button>
            </div>

            {companies.length === 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center">
                <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-700">Nenhuma empresa cadastrada</p>
                <p className="text-xs text-slate-500 mt-1">
                  Cadastre uma empresa para vincular vários professores e a equipe deles ao mesmo perfil principal.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {companies.map((company) => {
                const companyTeachers = teachers.filter((t) => t.companyId === company.id);
                const companyUsers = users.filter(
                  (u) => u.companyId === company.id || companyTeachers.some((t) => t.id === u.teacherId)
                );
                return (
                  <div key={company.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-[#091426] truncate">{company.name}</h3>
                        <p className="text-xs text-slate-400 truncate">{company.document || 'Sem CNPJ informado'}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                        company.status === 'ativa'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {company.status === 'ativa' ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>

                    <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                      {company.email && <p className="truncate">{company.email}</p>}
                      {company.phone && <p>{company.phone}</p>}
                      {company.city && <p className="text-slate-400">{company.city}</p>}
                    </div>

                    <div className="mt-4 flex gap-2 text-[11px]">
                      <span className="px-2.5 py-1 rounded-full bg-cyan-50 text-[#00687a] border border-cyan-200 font-bold">
                        {companyTeachers.length} professor(es)
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold">
                        {companyUsers.length} usuário(s)
                      </span>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
                      <button
                        onClick={() => { setEditingCompany(company); setIsCompanyModalOpen(true); }}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                      >
                        Editar
                      </button>
                      {onDeleteCompany && (
                        <button
                          onClick={() => {
                            if (companyTeachers.length > 0) {
                              window.alert(
                                'Esta empresa ainda tem professores vinculados. Troque a empresa deles antes de excluir.'
                              );
                              return;
                            }
                            if (window.confirm(`Excluir a empresa "${company.name}"?`)) onDeleteCompany(company.id);
                          }}
                          aria-label={`Excluir ${company.name}`}
                          className="px-3 py-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
                  <label htmlFor="add-name" className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
                  <input
                    id="add-name"
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
                    <label htmlFor="add-email" className="block font-bold text-slate-700 mb-1">E-mail de Acesso *</label>
                    <input
                      id="add-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="juliana@email.com"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="add-phone" className="block font-bold text-slate-700 mb-1">WhatsApp / Telefone</label>
                    <input
                      id="add-phone"
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 98765-4321"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="add-role" className="block font-bold text-slate-700 mb-1">Nível de Acesso (Cargo) *</label>
                  <select
                    id="add-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none font-medium bg-white"
                  >
                    <option value="professor">🎓 Professor / Instrutor / Mentor</option>
                    <option value="assistente">📋 Secretaria / Assistente / Atendimento</option>
                    <option value="aluno">🎒 Aluno / Cliente (Portal do Aluno)</option>
                    {canAssignPrivilegedRoles && (
                      <>
                        <option value="gestor">🏢 Gestor da Empresa (toda a academia)</option>
                        <option value="admin">👑 Administrador Geral (Acesso Total)</option>
                      </>
                    )}
                  </select>
                </div>

                {role !== 'admin' && (
                  <div className="space-y-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#00687a]" />
                      Vínculo com o perfil principal
                    </p>

                    <div>
                      <label htmlFor="add-company" className="block font-bold text-slate-700 mb-1">
                        Empresa / Escola
                      </label>
                      <select
                        id="add-company"
                        value={companyId}
                        onChange={(e) => setCompanyId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none font-medium bg-white"
                      >
                        <option value="">Sem empresa (professor autônomo)</option>
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="add-teacher" className="block font-bold text-slate-700 mb-1">
                        {role === 'professor' ? 'Perfil de professor' : 'Professor responsável'}
                      </label>
                      <select
                        id="add-teacher"
                        value={teacherId}
                        onChange={(e) => setTeacherId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none font-medium bg-white"
                      >
                        {role === 'professor' && (
                          <option value={NEW_TEACHER_OPTION}>Criar um perfil novo para esta pessoa</option>
                        )}
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.role})</option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {role === 'professor'
                          ? 'Vincule a um perfil de professor que já existe (agenda, serviços e site dele) ou crie um novo.'
                          : 'Define de qual professor esta pessoa enxerga agenda, alunos e cobranças.'}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="add-password" className="block font-bold text-slate-700 mb-1">Senha Inicial Provisória</label>
                  <input
                    id="add-password"
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
                  <label htmlFor="edit-name" className="block font-bold text-slate-700 mb-1">Nome Completo</label>
                  <input
                    id="edit-name"
                    type="text"
                    required
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="edit-email" className="block font-bold text-slate-700 mb-1">E-mail</label>
                    <input
                      id="edit-email"
                      type="email"
                      required
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-phone" className="block font-bold text-slate-700 mb-1">WhatsApp / Telefone</label>
                    <input
                      id="edit-phone"
                      type="text"
                      value={editingUser.phone || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="edit-role" className="block font-bold text-slate-700 mb-1">Cargo / Nível de Acesso</label>
                    <select
                      id="edit-role"
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none bg-white font-medium"
                    >
                      <option value="professor">🎓 Professor / Mentor</option>
                      <option value="assistente">📋 Secretaria / Assistente</option>
                      <option value="aluno">🎒 Aluno / Cliente</option>
                      {canAssignPrivilegedRoles && (
                        <>
                          <option value="gestor">🏢 Gestor da Empresa</option>
                          <option value="admin">👑 Administrador Geral</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="edit-status" className="block font-bold text-slate-700 mb-1">Status da Conta</label>
                    <select
                      id="edit-status"
                      value={editingUser.status}
                      onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as 'ativo' | 'inativo' })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none bg-white font-medium"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo / Bloqueado</option>
                    </select>
                  </div>
                </div>

                {editingUser.role !== 'admin' && (
                  <div className="space-y-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#00687a]" />
                      Vínculo com o perfil principal
                    </p>

                    <div>
                      <label htmlFor="edit-company" className="block font-bold text-slate-700 mb-1">
                        Empresa / Escola
                      </label>
                      <select
                        id="edit-company"
                        value={editingUser.companyId || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, companyId: e.target.value || undefined })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none font-medium bg-white"
                      >
                        <option value="">Sem empresa (professor autônomo)</option>
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="edit-teacher" className="block font-bold text-slate-700 mb-1">
                        {editingUser.role === 'professor' ? 'Perfil de professor' : 'Professor responsável'}
                      </label>
                      <select
                        id="edit-teacher"
                        value={editingUser.teacherId || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, teacherId: e.target.value || undefined })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none font-medium bg-white"
                      >
                        <option value="">Nenhum (sem professor responsável)</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.role})</option>
                        ))}
                        {editingUser.teacherId && !teachers.some((t) => t.id === editingUser.teacherId) && (
                          <option value={editingUser.teacherId}>
                            {editingUser.teacherId} (perfil não encontrado)
                          </option>
                        )}
                      </select>
                      {editingUser.teacherId && !teachers.some((t) => t.id === editingUser.teacherId) && (
                        <p className="text-[11px] text-rose-600 mt-1">
                          Este usuário aponta para um perfil de professor que não existe. Escolha um da lista para corrigir.
                        </p>
                      )}
                    </div>
                  </div>
                )}

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

        {/* MODAL EMPRESA */}
        {isCompanyModalOpen && onSaveCompany && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setIsCompanyModalOpen(false)}>
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-elevated border border-slate-200" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#00687a]" />
                  <h3 className="font-bold text-base text-[#091426]">
                    {editingCompany ? `Editar: ${editingCompany.name}` : 'Nova Empresa / Escola'}
                  </h3>
                </div>
                <button onClick={() => setIsCompanyModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                className="space-y-4 mt-4 text-xs"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const value = (field: string) =>
                    (form.elements.namedItem(field) as HTMLInputElement | HTMLSelectElement | null)?.value.trim() || '';
                  const name = value('company-name');
                  if (!name) return;
                  onSaveCompany({
                    ...(editingCompany || {}),
                    id: editingCompany?.id || `comp-${Date.now()}`,
                    name,
                    document: value('company-document') || undefined,
                    email: value('company-email') || undefined,
                    phone: value('company-phone') || undefined,
                    city: value('company-city') || undefined,
                    status: value('company-status') === 'inativa' ? 'inativa' : 'ativa',
                    // Vitrine da academia
                    slug: value('company-slug') || undefined,
                    headline: value('company-headline') || undefined,
                    bio: value('company-bio') || undefined,
                    createdAt: editingCompany?.createdAt || new Date().toISOString().slice(0, 10),
                  });
                  setIsCompanyModalOpen(false);
                  setEditingCompany(null);
                }}
              >
                <div>
                  <label htmlFor="company-name" className="block font-bold text-slate-700 mb-1">Nome da empresa *</label>
                  <input
                    id="company-name"
                    name="company-name"
                    required
                    defaultValue={editingCompany?.name || ''}
                    placeholder="Ex: Academia Aqua Vida"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="company-document" className="block font-bold text-slate-700 mb-1">CNPJ</label>
                    <input
                      id="company-document"
                      name="company-document"
                      defaultValue={editingCompany?.document || ''}
                      placeholder="00.000.000/0001-00"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="company-city" className="block font-bold text-slate-700 mb-1">Cidade</label>
                    <input
                      id="company-city"
                      name="company-city"
                      defaultValue={editingCompany?.city || ''}
                      placeholder="São Paulo - SP"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="company-email" className="block font-bold text-slate-700 mb-1">E-mail</label>
                    <input
                      id="company-email"
                      name="company-email"
                      type="email"
                      defaultValue={editingCompany?.email || ''}
                      placeholder="contato@empresa.com.br"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="company-phone" className="block font-bold text-slate-700 mb-1">Telefone</label>
                    <input
                      id="company-phone"
                      name="company-phone"
                      defaultValue={editingCompany?.phone || ''}
                      placeholder="(11) 3000-0000"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <p className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#00687a]" />
                    Vitrine da academia
                  </p>
                  <p className="text-[11px] text-slate-500">
                    A página pública da academia lista os professores dela. Cada professor continua
                    com a vitrine dele; esta é a porta de entrada de quem procura a escola.
                  </p>

                  <div>
                    <label htmlFor="company-slug" className="block font-bold text-slate-700 mb-1">
                      Endereço público
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 shrink-0">/e/</span>
                      <input
                        id="company-slug"
                        name="company-slug"
                        defaultValue={editingCompany?.slug || ''}
                        placeholder="aqua-vida"
                        pattern="[a-z0-9][a-z0-9-]{1,47}"
                        title="Letras minúsculas, números e hífen"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Não pode ser igual ao endereço de um professor: os dois dividem o mesmo espaço.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="company-headline" className="block font-bold text-slate-700 mb-1">
                      Título da página
                    </label>
                    <input
                      id="company-headline"
                      name="company-headline"
                      defaultValue={editingCompany?.headline || ''}
                      placeholder="Natação e preparação física em São Paulo"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="company-bio" className="block font-bold text-slate-700 mb-1">
                      Sobre a academia
                    </label>
                    <textarea
                      id="company-bio"
                      name="company-bio"
                      rows={2}
                      defaultValue={editingCompany?.bio || ''}
                      placeholder="Turmas pequenas, avaliação individual e horários flexíveis."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="company-status" className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    id="company-status"
                    name="company-status"
                    defaultValue={editingCompany?.status || 'ativa'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#00687a] focus:outline-none bg-white font-medium"
                  >
                    <option value="ativa">Ativa</option>
                    <option value="inativa">Inativa</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCompanyModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#00687a] hover:bg-[#004e5c] text-white font-bold transition-colors"
                  >
                    {editingCompany ? 'Salvar Empresa' : 'Cadastrar Empresa'}
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
