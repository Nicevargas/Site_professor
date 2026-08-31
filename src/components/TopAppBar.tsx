import React, { useState } from 'react';
import { ViewMode, TeacherProfile, AuthUser, SystemUser, UserRole } from '../types';
import { useAccessibility } from '../context/AccessibilityContext';
import { 
  Search, 
  Menu, 
  User, 
  ChevronDown, 
  Globe, 
  Check, 
  Bell, 
  Sparkles, 
  LogOut, 
  ShieldCheck,
  GraduationCap,
  Headphones,
  Users,
  BookmarkCheck,
  RotateCcw,
  HelpCircle,
  PlayCircle,
  Accessibility
} from 'lucide-react';


interface TopAppBarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  teachers: TeacherProfile[];
  currentTeacher: TeacherProfile;
  onSelectTeacher: (teacher: TeacherProfile) => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  systemUsers?: SystemUser[];
  onSwitchUser?: (user: SystemUser) => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  currentView,
  onNavigate,
  searchQuery,
  onSearchChange,
  teachers,
  currentTeacher,
  onSelectTeacher,
  currentUser,
  onLogout,
  systemUsers = [],
  onSwitchUser,
}) => {
  const [isTenantOpen, setIsTenantOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  
  const { setIsInteractiveTourOpen, setIsTutorialHubOpen, setIsA11yModalOpen } = useAccessibility();

  const displayUserName = currentUser?.name || currentTeacher.name;
  const displayUserEmail = currentUser?.email || currentTeacher.email;
  const userAvatar = currentUser?.avatarUrl || currentTeacher.avatarUrl;
  const userRole = currentUser?.role || 'professor';

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', icon: ShieldCheck, bg: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'professor':
        return { label: 'Professor', icon: GraduationCap, bg: 'bg-cyan-100 text-[#00687a] border-cyan-300' };
      case 'assistente':
        return { label: 'Secretaria', icon: Headphones, bg: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'aluno':
        return { label: 'Aluno', icon: Users, bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    }
  };

  const currentRoleBadge = getRoleBadge(userRole);
  const RoleIcon = currentRoleBadge.icon;

  return (
    <header className="bg-white border-b border-[#eceef0] flex justify-between items-center w-full px-4 md:px-8 h-16 shrink-0 z-40 sticky top-0">
      {/* Left side: View title & Breadcrumbs */}
      <div className="flex items-center gap-4">
        {/* Mobile quick view indicator */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200">
            <img 
              src={userAvatar} 
              alt={displayUserName} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover" 
            />
          </div>
          <span className="font-semibold text-sm text-[#091426]">Agenda do Professor</span>
        </div>

        {/* Desktop Quick Nav Tabs */}
        {userRole !== 'aluno' ? (
          <div className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => onNavigate('dashboard')}
              className={`text-sm font-semibold transition-colors pb-1 ${
                currentView === 'dashboard'
                  ? 'text-[#091426] border-b-2 border-[#091426]'
                  : 'text-[#45474c] hover:text-[#091426]'
              }`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => onNavigate('agenda')}
              className={`text-sm font-semibold transition-colors pb-1 ${
                currentView === 'agenda'
                  ? 'text-[#091426] border-b-2 border-[#091426]'
                  : 'text-[#45474c] hover:text-[#091426]'
              }`}
            >
              Agenda
            </button>
            <button 
              onClick={() => onNavigate('servicos')}
              className={`text-sm font-semibold transition-colors pb-1 ${
                currentView === 'servicos'
                  ? 'text-[#091426] border-b-2 border-[#091426]'
                  : 'text-[#45474c] hover:text-[#091426]'
              }`}
            >
              Serviços
            </button>
            {userRole === 'admin' && (
              <button 
                onClick={() => onNavigate('usuarios')}
                className={`text-sm font-semibold transition-colors pb-1 ${
                  currentView === 'usuarios'
                    ? 'text-[#091426] border-b-2 border-[#091426]'
                    : 'text-[#45474c] hover:text-[#091426]'
                }`}
              >
                Usuários & RBAC
              </button>
            )}
            <button 
              onClick={() => onNavigate('pagamentos')}
              className={`text-sm font-semibold transition-colors pb-1 ${
                currentView === 'pagamentos'
                  ? 'text-[#091426] border-b-2 border-[#091426]'
                  : 'text-[#45474c] hover:text-[#091426]'
              }`}
            >
              Financeiro
            </button>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => onNavigate('portal-aluno')}
              className={`text-sm font-semibold transition-colors pb-1 ${
                currentView === 'portal-aluno'
                  ? 'text-[#00687a] border-b-2 border-[#00687a]'
                  : 'text-[#45474c] hover:text-[#091426]'
              }`}
            >
              Portal do Aluno
            </button>
            <button 
              onClick={() => onNavigate('public-booking')}
              className={`text-sm font-semibold transition-colors pb-1 ${
                currentView === 'public-booking'
                  ? 'text-[#00687a] border-b-2 border-[#00687a]'
                  : 'text-[#45474c] hover:text-[#091426]'
              }`}
            >
              Agendar Aula
            </button>
            <button 
              onClick={() => onNavigate('public-landing')}
              className="text-sm font-semibold text-[#45474c] hover:text-[#091426]"
            >
              Vitrine do Professor
            </button>
          </div>
        )}
      </div>

      {/* Right side: Search, Role Switcher, Tenant Switcher, Profile */}
      <div className="flex items-center gap-2.5">
        {/* Search Bar */}
        <div className="relative hidden lg:block">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#75777d]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar..."
            className="h-9 pl-9 pr-3 rounded-full border border-[#c5c6cd] bg-[#f7f9fb] text-xs text-[#191c1e] placeholder-[#75777d] focus:bg-white focus:border-[#00687a] focus:ring-1 focus:ring-[#00687a] focus:outline-none w-44 transition-all"
          />
        </div>

        {/* FAST DEMO ROLE SWITCHER */}
        {systemUsers.length > 0 && onSwitchUser && (
          <div className="relative">
            <button
              onClick={() => setIsRoleSwitcherOpen(!isRoleSwitcherOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200"
              title="Trocar Perfil de Acesso Rapidamente para Demonstração"
            >
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${currentRoleBadge.bg}`}>
                <RoleIcon className="w-3 h-3" />
                <span>{currentRoleBadge.label}</span>
              </span>
              <span className="hidden sm:inline text-slate-800 text-[11px] max-w-[90px] truncate">{displayUserName.split(' ')[0]}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {isRoleSwitcherOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Simular Nível de Acesso</p>
                    <span className="text-[10px] font-bold text-[#00687a] bg-cyan-50 px-1.5 py-0.5 rounded">Multi-usuários</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Alterne instantaneamente entre os perfis:</p>
                </div>

                <div className="py-1 max-h-72 overflow-y-auto">
                  {systemUsers.map((user) => {
                    const isSelected = currentUser?.id === user.id || currentUser?.email.toLowerCase() === user.email.toLowerCase();
                    const badge = getRoleBadge(user.role);
                    const BIcon = badge.icon;

                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          onSwitchUser(user);
                          setIsRoleSwitcherOpen(false);
                        }}
                        className={`w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-slate-50 transition-colors text-left ${
                          isSelected ? 'bg-cyan-50/50 font-bold' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-200">
                          <img
                            src={user.avatarUrl || userAvatar}
                            alt={user.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-[#091426] truncate">{user.name}</p>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold border ${badge.bg}`}>
                              <BIcon className="w-2.5 h-2.5" />
                              <span>{badge.label}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">{user.email}</span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#00687a] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Switch Tenant Dropdown (For Admin / Multi-teacher) */}
        {userRole === 'admin' && (
          <div className="relative">
            <button
              onClick={() => setIsTenantOpen(!isTenantOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#45474c] hover:text-[#091426] hover:bg-[#eceef0] transition-colors border border-transparent hover:border-[#c5c6cd]"
            >
              <span className="hidden xl:inline text-slate-400 text-[11px]">Tenant:</span>
              <span className="text-[#00687a] font-bold max-w-[90px] truncate">{currentTeacher.name}</span>
              <ChevronDown className="w-3 h-3 text-[#75777d]" />
            </button>

            {isTenantOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Selecione o Professor</p>
                </div>
                {teachers.map((teacher) => (
                  <button
                    key={teacher.id}
                    onClick={() => {
                      onSelectTeacher(teacher);
                      setIsTenantOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left ${
                      currentTeacher.id === teacher.id ? 'bg-[#acedff]/20 font-semibold' : ''
                    }`}
                  >
                    <img 
                      src={teacher.avatarUrl} 
                      alt={teacher.name} 
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" 
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[#091426] truncate">{teacher.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{teacher.role}</p>
                    </div>
                    {currentTeacher.id === teacher.id && (
                      <Check className="w-4 h-4 text-[#00687a] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tutorial & Help Hub Button */}
        <button
          onClick={() => setIsTutorialHubOpen(true)}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-[#00687a] border border-cyan-200 rounded-full text-xs font-semibold transition-colors"
          title="Abrir Central de Tutoriais e Ajuda Online"
        >
          <HelpCircle className="w-3.5 h-3.5 text-[#00687a]" />
          <span>Tutorial</span>
        </button>

        {/* Public Site preview button */}
        <button
          onClick={() => onNavigate('public-landing')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#f2f4f6] hover:bg-[#e0e3e5] text-[#091426] rounded-full text-xs font-medium transition-colors"
          title="Ver Landing Page Pública"
        >
          <Globe className="w-3.5 h-3.5 text-[#00687a]" />
          <span>Site</span>
        </button>

        {/* Profile Avatar & Menu */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-9 h-9 rounded-full overflow-hidden border border-[#c5c6cd] hover:border-[#00687a] transition-all focus:ring-2 focus:ring-[#00687a]"
          >
            <img
              src={userAvatar}
              alt={displayUserName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-[#091426] truncate">{displayUserName}</p>
                <p className="text-[11px] text-slate-500 truncate">{displayUserEmail}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${currentRoleBadge.bg}`}>
                    <RoleIcon className="w-3 h-3" />
                    <span>{currentRoleBadge.label}</span>
                  </span>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Ativo
                  </span>
                </div>
              </div>

              {userRole === 'admin' && (
                <button
                  onClick={() => {
                    onNavigate('usuarios');
                    setIsProfileOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Gerenciar Usuários & Equipe</span>
                </button>
              )}

              {userRole === 'aluno' && (
                <button
                  onClick={() => {
                    onNavigate('portal-aluno');
                    setIsProfileOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Meu Portal do Aluno</span>
                </button>
              )}

              <button
                onClick={() => {
                  onNavigate('configuracoes');
                  setIsProfileOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Meu Perfil & Configurações</span>
              </button>

              <div className="border-t border-slate-100 my-1"></div>

              {/* Tutorial & Tour Dropdown Items */}
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  setIsTutorialHubOpen(true);
                }}
                className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-3.5 h-3.5 text-[#00687a]" />
                  <span>Central de Tutoriais & FAQ</span>
                </span>
                <span className="text-[10px] text-slate-400">Guia</span>
              </button>

              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  setIsInteractiveTourOpen(true);
                }}
                className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <PlayCircle className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Tour Guiado Passo a Passo</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Alt+T</span>
              </button>

              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  setIsA11yModalOpen(true);
                }}
                className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Accessibility className="w-3.5 h-3.5 text-slate-500" />
                  <span>Acessibilidade & Atalhos</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Alt+H</span>
              </button>

              <div className="border-t border-slate-100 my-1"></div>

              <button
                onClick={() => {
                  onNavigate('public-landing');
                  setIsProfileOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-xs text-[#00687a] font-medium hover:bg-slate-50 flex items-center justify-between"
              >
                <span>Abrir Vitrine Pública</span>
                <Globe className="w-3.5 h-3.5" />
              </button>

              {onLogout && (
                <>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onLogout();
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sair da Conta (Logout)</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
