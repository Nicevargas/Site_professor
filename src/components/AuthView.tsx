import React, { useState } from 'react';
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
  Check
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';
import { AuthUser, TeacherProfile } from '../types';

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
      // Local check
      setTimeout(() => {
        setIsLoading(false);
        const users = getStoredUsers();
        const found = users.find((u) => u.email.toLowerCase() === cleanEmail);

        if (found) {
          if (found.passwordHash !== password) {
            setErrorMessage('Senha incorreta. Verifique os dados digitados ou recupere sua senha.');
            return;
          }
          onLoginSuccess({
            id: found.id,
            email: found.email,
            name: found.name,
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

        // Check if matching default demo teacher
        if (cleanEmail === currentTeacher.email.toLowerCase() || cleanEmail === 'curtatche@gmail.com' || cleanEmail === 'admin@professor.com' || cleanEmail.includes('@')) {
          onLoginSuccess({
            id: currentTeacher.id,
            email: cleanEmail,
            name: currentTeacher.name,
            avatarUrl: currentTeacher.avatarUrl,
            isDemo: true,
          });
          return;
        }

        setErrorMessage('Nenhuma conta encontrada com este e-mail. Por favor, faça seu cadastro na aba "Criar Conta".');
      }, 500);
      return;
    }

    const { data, error } = await supabaseService.signIn(cleanEmail, password);
    setIsLoading(false);

    if (error) {
      setErrorMessage(error);
    } else if (data?.user) {
      onLoginSuccess({
        id: data.user.id,
        email: data.user.email || cleanEmail,
        name: data.user.user_metadata?.full_name || currentTeacher.name,
        avatarUrl: currentTeacher.avatarUrl,
        isDemo: false,
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

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
    const existing = currentUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing && !isSupabaseConfigured) {
      setIsLoading(false);
      setErrorMessage('Este e-mail já possui cadastro. Use a aba "Entrar" com sua senha.');
      return;
    }

    const newUserId = 'prof-user-' + Date.now();
    const newUser: LocalRegisteredUser = {
      id: newUserId,
      name: cleanName,
      email: cleanEmail,
      passwordHash: password,
      specialty: specialty.trim() || 'Professor Especialista',
      whatsapp: whatsapp.trim() || currentTeacher.whatsapp,
    };
    currentUsers.push(newUser);
    saveStoredUsers(currentUsers);

    if (!isSupabaseConfigured) {
      setTimeout(() => {
        setIsLoading(false);
        setSuccessMessage('Cadastro de professor realizado com sucesso! Acessando painel...');
        setTimeout(() => {
          onLoginSuccess({
            id: newUserId,
            email: cleanEmail,
            name: cleanName,
            avatarUrl: currentTeacher.avatarUrl,
            isDemo: false,
          }, {
            name: cleanName,
            email: cleanEmail,
            specialty: specialty.trim() || 'Professor Especialista',
            whatsapp: whatsapp.trim() || currentTeacher.whatsapp,
          });
        }, 800);
      }, 500);
      return;
    }

    const { data, error } = await supabaseService.signUp(cleanEmail, password, cleanName);
    setIsLoading(false);

    if (error) {
      setErrorMessage(error);
    } else {
      if (data?.session) {
        onLoginSuccess({
          id: data.user.id,
          email: data.user.email || cleanEmail,
          name: cleanName,
          avatarUrl: currentTeacher.avatarUrl,
          isDemo: false,
        }, {
          name: cleanName,
          email: cleanEmail,
          specialty: specialty.trim() || currentTeacher.specialty,
          whatsapp: whatsapp.trim() || currentTeacher.whatsapp,
        });
      } else {
        setSuccessMessage('Cadastro realizado com sucesso! Enviamos um link de confirmação para o seu e-mail.');
      }
    }
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

  const handleQuickDemoLogin = () => {
    onLoginSuccess({
      id: currentTeacher.id,
      email: currentTeacher.email,
      name: currentTeacher.name,
      avatarUrl: currentTeacher.avatarUrl,
      isDemo: true,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#091426] via-[#0d213a] to-[#003844] text-white flex flex-col justify-between p-4 md:p-8">
      {/* Top Header */}
      <div className="max-w-5xl mx-auto w-full flex flex-col sm:flex-row justify-between items-center gap-3 pb-6">
        <button
          onClick={onBackToPublicSite}
          className="flex items-center gap-2 text-xs md:text-sm font-medium text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 px-4 py-2 rounded-xl backdrop-blur-md transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Site Aberto do Professor</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-cyan-300 font-semibold bg-cyan-950/70 border border-cyan-800/80 px-3.5 py-1.5 rounded-full shadow-xs">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Área Administrativa Restrita • Acesso Autenticado</span>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="max-w-lg w-full mx-auto bg-white/95 text-slate-900 rounded-3xl p-6 md:p-9 shadow-2xl backdrop-blur-xl border border-white/20 animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: primaryColor }}>
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-[#091426] tracking-tight">
            {tab === 'login' && 'Entrar na Área do Professor'}
            {tab === 'signup' && 'Cadastrar Novo Professor'}
            {tab === 'forgot' && 'Recuperar Senha de Acesso'}
          </h1>
          <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
            {tab === 'login' && 'Área restrita e segura para gerenciar agenda, alunos, relatórios financeiros e configurações do site.'}
            {tab === 'signup' && 'Crie seu login e senha para gerenciar suas aulas e personalizar seu site oficial de agendamentos.'}
            {tab === 'forgot' && 'Informe seu e-mail cadastrado para receber o link de redefinição de senha.'}
          </p>
        </div>

        {/* Informative Security Banner */}
        <div className="mb-5 p-3 rounded-2xl bg-cyan-50 border border-cyan-200/80 text-cyan-950 text-xs flex items-center gap-2.5">
          <div className="p-1 rounded-lg bg-cyan-200/70 text-[#00687a] shrink-0">
            <Check className="w-3.5 h-3.5 font-bold" />
          </div>
          <p className="text-[11px] leading-tight text-cyan-900">
            <strong>Site do profissional:</strong> Livre e aberto para alunos agendarem. <br />
            <strong>Painel de Gestão:</strong> Acesso protegido apenas com login e senha.
          </p>
        </div>

        {/* Tab Switcher (if not in forgot mode) */}
        {tab !== 'forgot' && (
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
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
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
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
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TAB 1: LOGIN */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
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
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-[#00687a] focus:ring-1 focus:ring-[#00687a]"
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
                  className="text-xs text-[#00687a] hover:underline font-semibold"
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
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-[#00687a] focus:ring-1 focus:ring-[#00687a]"
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
              className="w-full py-3 text-white font-bold rounded-xl text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Entrar no Painel Administrativo</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: SIGN UP / CADASTRO */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo do Professor *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Prof. Matheus Silva"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-[#00687a] focus:ring-1 focus:ring-[#00687a]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Disciplina / Especialidade</label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="Ex: Matemática & Física"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-[#00687a] focus:ring-1 focus:ring-[#00687a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp de Contato</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="5511999998888"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-[#00687a] focus:ring-1 focus:ring-[#00687a]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">E-mail Profissional (Login) *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu-email@exemplo.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-[#00687a] focus:ring-1 focus:ring-[#00687a]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Senha (Mín. 6 dígitos) *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-[#00687a] focus:ring-1 focus:ring-[#00687a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirmar Senha *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-[#00687a] focus:ring-1 focus:ring-[#00687a]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-white font-bold rounded-xl text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Criar Cadastro e Acessar Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 3: FORGOT PASSWORD */}
        {tab === 'forgot' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
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
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-[#00687a] focus:ring-1 focus:ring-[#00687a]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-white font-bold rounded-xl text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Enviar Link de Redefinição</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="w-full py-2.5 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Voltar ao Login
            </button>
          </form>
        )}

        {/* Quick Demo Access Strip */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-2">
          <p className="text-[11px] text-slate-400">
            Ambiente de Demonstração / Testes Rápidos:
          </p>
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Acessar com Perfil de Demonstração Rápido</span>
          </button>
        </div>
      </div>

      {/* Footer info */}
      <div className="max-w-md mx-auto text-center text-xs text-slate-400 pt-4">
        © {new Date().getFullYear()} Agenda do Professor • Sistema com autenticação protegida via Supabase & RLS
      </div>
    </div>
  );
};

