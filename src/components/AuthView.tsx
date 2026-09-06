import React, { useState } from 'react';
import { AquagendaIcon } from './AquagendaLogo';
import { 
  Lock, 
  Mail, 
  User, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sparkles,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  GraduationCap,
  Phone,
  Check,
  Headphones,
  Users
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';
import { AuthUser, TeacherProfile, UserRole } from '../types';
import { sanitizeSelfDeclaredRole } from '../utils/permissions';

/** Hash SHA-256 (hex) para o cadastro local de demonstração: senha nunca fica em texto puro no navegador. */
async function hashPassword(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

interface AuthViewProps {
  currentTeacher: TeacherProfile;
  onLoginSuccess: (user: AuthUser, teacherData?: Partial<TeacherProfile>) => void;
  onBackToPublicSite: () => void;
}

interface LocalRegisteredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  specialty?: string;
  whatsapp?: string;
}

export const AuthView: React.FC<AuthViewProps> = ({
  currentTeacher,
  onLoginSuccess,
  onBackToPublicSite,
}) => {
  const [tab, setTab] = useState<'login' | 'signup' | 'forgot'>('login');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('professor');
  const [specialty, setSpecialty] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const primaryColor = currentTeacher.primaryColor || '#00687a';

  // Helper to get local stored users
  const getStoredUsers = (): LocalRegisteredUser[] => {
    try {
      const data = localStorage.getItem('agenda_prof_registered_users');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveStoredUsers = (users: LocalRegisteredUser[]) => {
    try {
      localStorage.setItem('agenda_prof_registered_users', JSON.stringify(users));
    } catch {
      // ignore
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setErrorMessage('Por favor, informe seu e-mail e sua senha de acesso.');
      return;
    }

    setIsLoading(true);

    if (!isSupabaseConfigured) {
      // Modo demonstração (sem banco): cadastro local com senha em hash SHA-256
      const hashedPassword = await hashPassword(password);
      setTimeout(() => {
        setIsLoading(false);
        const users = getStoredUsers();
        const found = users.find((u) => u.email.toLowerCase() === cleanEmail);

        if (found) {
          const legacyPlainMatch = found.passwordHash === password;
          if (found.passwordHash !== hashedPassword && !legacyPlainMatch) {
            setErrorMessage('Senha incorreta. Verifique os dados digitados ou recupere sua senha.');
            return;
          }
          if (legacyPlainMatch) {
            // Migra cadastros antigos (senha em texto puro) para hash
            saveStoredUsers(users.map((u) => (u.id === found.id ? { ...u, passwordHash: hashedPassword } : u)));
          }
          onLoginSuccess({
            id: found.id,
            email: found.email,
            name: found.name,
            role: found.role || 'professor',
            avatarUrl: currentTeacher.avatarUrl,
            isDemo: false,
          }, {
            name: found.name,
            email: found.email,
            specialty: found.specialty || currentTeacher.specialty,
            whatsapp: found.whatsapp || currentTeacher.whatsapp,
          });
          return;
        }

        // Check if admin or known demo logins
        if (cleanEmail.includes('admin')) {
          onLoginSuccess({
            id: 'user-admin-1',
            email: cleanEmail,
            name: 'Administrador Geral',
            role: 'admin',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            isDemo: true,
          });
          return;
        }

        if (cleanEmail.includes('secretaria') || cleanEmail.includes('assist')) {
          onLoginSuccess({
            id: 'user-assist-1',
            email: cleanEmail,
            name: 'Camila Fernandes (Secretaria)',
            role: 'assistente',
            avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
            isDemo: true,
          });
          return;
        }

        if (cleanEmail.includes('mariana') || cleanEmail.includes('aluno')) {
          onLoginSuccess({
            id: 'std-1',
            email: cleanEmail,
            name: 'Mariana Costa (Aluna)',
            role: 'aluno',
            studentId: 'std-1',
            avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBK4ZdjGlXcYUkNbEPgBCJ2ybOX87uTuhEIW-bh1S_6aUuhw3LbpojczkFt7hLMuVkBrvtmonkTNLYDBnpXnY8VeoyWHUzo9lTl7o4AYZV53TqGGXbGuc3CVUOLKbpGRa80w_0YcCGtnYeuP97M5S1TuGnG5L72vqotjZDwMVDIWF9N7shtJ2fI_9L2OOOUCTYfgP1vQF4Vjms-_6o4t7L90jfsLMghpGEespEMyKNBXoQr7B-RD-cww',
            isDemo: true,
          });
          return;
        }

        // Default match teacher
        onLoginSuccess({
          id: currentTeacher.id,
          email: cleanEmail,
          name: currentTeacher.name,
          role: 'professor',
          avatarUrl: currentTeacher.avatarUrl,
          isDemo: true,
        });
      }, 500);
      return;
    }

    // 1. Attempt Supabase Auth login
    const { data, error } = await supabaseService.signIn(cleanEmail, password);

    if (data?.user) {
      setIsLoading(false);
      // Try to get detailed profile from system_users
      const dbUser = await supabaseService.findUserByEmail(cleanEmail);
      const userRole = (dbUser?.role as UserRole) || sanitizeSelfDeclaredRole(data.user.user_metadata?.role);
      
      onLoginSuccess({
        id: dbUser?.id || data.user.id,
        email: data.user.email || cleanEmail,
        name: dbUser?.name || data.user.user_metadata?.full_name || currentTeacher.name,
        role: userRole,
        avatarUrl: dbUser?.avatar_url || currentTeacher.avatarUrl,
        teacherId: dbUser?.teacher_id,
        studentId: dbUser?.student_id,
        isDemo: false,
      });
      return;
    }

    // Sem sessão válida no Supabase Auth não há login: nenhum atalho por e-mail ou cadastro local.
    setIsLoading(false);
    setErrorMessage(error || 'E-mail ou senha não localizados. Se você ainda não possui conta, crie seu acesso na aba "Criar Cadastro".');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    // Cadastro público só cria professor ou aluno; admin e secretaria são criados por um admin
    const safeRole = sanitizeSelfDeclaredRole(role);

    if (!cleanEmail || !password || !cleanName) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios (Nome, E-mail e Senha).');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha de segurança deve conter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas digitadas não coincidem. Digite novamente.');
      return;
    }

    setIsLoading(true);

    // Save locally for fallback persistence
    const currentUsers = getStoredUsers();
    const newUserId = 'user-' + Date.now();
    const newUser: LocalRegisteredUser = {
      id: newUserId,
      name: cleanName,
      email: cleanEmail,
      passwordHash: await hashPassword(password),
      role: safeRole,
      specialty: specialty.trim() || (role === 'professor' ? 'Professor Especialista' : undefined),
      whatsapp: whatsapp.trim() || currentTeacher.whatsapp,
    };
    currentUsers.push(newUser);
    saveStoredUsers(currentUsers);

    if (isSupabaseConfigured) {
      // Cadastrar é só criar a conta no Supabase Auth. A linha em system_users
      // é criada pelo gatilho on_auth_user_created, com o papel e o telefone
      // que vão aqui no metadata. Tentar inserir por fora daria erro de
      // permissão: antes do signUp não existe sessão nenhuma.
      const { error: signUpError } = await supabaseService.signUp(
        cleanEmail,
        password,
        cleanName,
        { role: safeRole, phone: whatsapp.trim() || undefined }
      );

      if (signUpError) {
        setIsLoading(false);
        setErrorMessage(signUpError);
        return;
      }
    }

    setIsLoading(false);
    setSuccessMessage(`Cadastro de ${safeRole} realizado com sucesso! Acessando o sistema...`);
    
    setTimeout(() => {
      onLoginSuccess({
        id: newUserId,
        email: cleanEmail,
        name: cleanName,
        role: safeRole,
        avatarUrl: currentTeacher.avatarUrl,
        isDemo: false,
      }, {
        name: cleanName,
        email: cleanEmail,
        specialty: specialty.trim() || currentTeacher.specialty,
        whatsapp: whatsapp.trim() || currentTeacher.whatsapp,
      });
    }, 600);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Por favor, informe seu e-mail cadastrado.');
      return;
    }

    setIsLoading(true);

    if (!isSupabaseConfigured) {
      setTimeout(() => {
        setIsLoading(false);
        setSuccessMessage(`Um e-mail com instruções para redefinição de senha foi simulado para ${cleanEmail}.`);
      }, 500);
      return;
    }

    const { error } = await supabaseService.resetPassword(cleanEmail);
    setIsLoading(false);

    if (error) {
      setErrorMessage(error);
    } else {
      setSuccessMessage('Um link seguro para redefinição de senha foi enviado para o seu e-mail.');
    }
  };

  const loginAs = (userRole: UserRole, userEmail: string, userName: string, avatar: string, studentId?: string) => {
    onLoginSuccess({
      id: `demo-${userRole}`,
      email: userEmail,
      name: userName,
      role: userRole,
      avatarUrl: avatar,
      studentId: studentId,
      isDemo: true,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#091426] via-[#0d213a] to-[#003844] text-white flex flex-col justify-between p-4 md:p-8">
      {/* Top Header */}
      <div className="max-w-5xl mx-auto w-full flex flex-col sm:flex-row justify-between items-center gap-3 pb-4">
        <button
          onClick={onBackToPublicSite}
          className="flex items-center gap-2 text-xs md:text-sm font-medium text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 px-4 py-2 rounded-xl backdrop-blur-md transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Site Aberto do Professor</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-cyan-300 font-semibold bg-cyan-950/70 border border-cyan-800/80 px-3.5 py-1.5 rounded-full shadow-xs">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Acesso Multi-usuário com RBAC (Supabase + RLS)</span>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="max-w-lg w-full mx-auto bg-white/95 text-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl border border-white/20 animate-in fade-in zoom-in-95 duration-200 my-auto space-y-5">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <AquagendaIcon className="w-12 h-12 drop-shadow-md" alt="Aquagenda" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#009EE2] block">
              Aquagenda
            </span>
            <h1 className="text-2xl font-black text-[#091426] tracking-tight mt-0.5">
              {tab === 'login' && 'Entrar no Sistema'}
              {tab === 'signup' && 'Criar Conta de Acesso'}
              {tab === 'forgot' && 'Recuperar Senha'}
            </h1>
          </div>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            {tab === 'login' && 'Acesse com seu e-mail e senha correspondente ao seu nível de permissão.'}
            {tab === 'signup' && 'Cadastre-se como Professor, Assistente ou Aluno com painel customizado.'}
            {tab === 'forgot' && 'Informe seu e-mail cadastrado para redefinir sua senha com segurança.'}
          </p>
        </div>

        {/* Tab Switcher */}
        {tab !== 'forgot' && (
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                tab === 'login' 
                  ? 'bg-white text-[#091426] shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Entrar (Login)
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('signup');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                tab === 'signup' 
                  ? 'bg-white text-[#091426] shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Criar Cadastro
            </button>
          </div>
        )}

        {/* Notification alerts */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TAB 1: LOGIN */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">E-mail Cadastrado</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@... ou roberto@... ou mariana@..."
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#00687a] focus:ring-1 focus:ring-[#00687a]"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">Senha de Acesso</label>
                <button
                  type="button"
                  onClick={() => {
                    setTab('forgot');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-[11px] text-[#00687a] hover:underline font-semibold"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#00687a] focus:ring-1 focus:ring-[#00687a]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-white font-bold rounded-xl text-xs shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: SIGN UP */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Dra. Juliana Santos"
                  required
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#00687a]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nível de Acesso (Cargo) *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                >
                  <option value="professor">🎓 Professor / Mentor</option>
                  <option value="aluno">🎒 Aluno / Cliente</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp de Contato</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="11999998888"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#00687a]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">E-mail de Login *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu-email@exemplo.com"
                  required
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#00687a]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Senha (Mín. 6 dígitos) *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirmar Senha *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 text-white font-bold rounded-xl text-xs shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
              style={{ backgroundColor: primaryColor }}
            >
              <span>Criar Conta e Acessar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* TAB 3: FORGOT PASSWORD */}
        {tab === 'forgot' && (
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">E-mail Cadastrado</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu-email@exemplo.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 text-white font-bold rounded-xl text-xs shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              <KeyRound className="w-4 h-4" />
              <span>Enviar Link de Redefinição</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('login')}
              className="w-full py-2 text-slate-600 hover:text-slate-900 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Voltar ao Login
            </button>
          </form>
        )}

        {/* Atalhos de demonstração: só existem quando não há banco conectado */}
        {!isSupabaseConfigured && (
        <div className="pt-4 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Modo demonstração (sem banco conectado)</span>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Demo</span>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-left">
            <button
              type="button"
              onClick={() => loginAs('admin', 'admin@agendaprofessor.com.br', 'Admin Geral (Diretoria)', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')}
              className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/80 transition-all group"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-amber-900 truncate">👑 Admin Geral</p>
                  <p className="text-[10px] text-amber-700 truncate">Acesso total irrestrito</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => loginAs('professor', currentTeacher.email, currentTeacher.name, currentTeacher.avatarUrl)}
              className="p-2.5 rounded-xl border border-cyan-200 bg-cyan-50/60 hover:bg-cyan-100/80 transition-all group"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#00687a] text-white flex items-center justify-center font-bold text-xs">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-cyan-950 truncate">🎓 Prof. Roberto</p>
                  <p className="text-[10px] text-cyan-700 truncate">Agenda & Aulas</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => loginAs('assistente', 'secretaria@agendaprofessor.com.br', 'Camila Fernandes (Secretaria)', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80')}
              className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/80 transition-all group"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                  <Headphones className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-purple-900 truncate">📋 Secretaria</p>
                  <p className="text-[10px] text-purple-700 truncate">Agenda & Atendimento</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => loginAs('aluno', 'mariana.costa@email.com', 'Mariana Costa (Aluna)', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBK4ZdjGlXcYUkNbEPgBCJ2ybOX87uTuhEIW-bh1S_6aUuhw3LbpojczkFt7hLMuVkBrvtmonkTNLYDBnpXnY8VeoyWHUzo9lTl7o4AYZV53TqGGXbGuc3CVUOLKbpGRa80w_0YcCGtnYeuP97M5S1TuGnG5L72vqotjZDwMVDIWF9N7shtJ2fI_9L2OOOUCTYfgP1vQF4Vjms-_6o4t7L90jfsLMghpGEespEMyKNBXoQr7B-RD-cww', 'std-1')}
              className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 transition-all group"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-emerald-900 truncate">🎒 Mariana (Aluna)</p>
                  <p className="text-[10px] text-emerald-700 truncate">Portal do Aluno & Pix</p>
                </div>
              </div>
            </button>
            </div>
          </div>
        </div>
        )}

      </div>

      {/* Footer info */}
      <div className="max-w-md mx-auto text-center text-xs text-slate-400 pt-3">
        © {new Date().getFullYear()} Plataforma Multi-usuários • Proteção com Row Level Security (RLS)
      </div>
    </div>
  );
};
