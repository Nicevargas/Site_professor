import React from 'react';
import { ViewMode, TeacherProfile, AuthUser, UserRole } from '../types';
import { useAccessibility } from '../context/AccessibilityContext';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Layers, 
  Users, 
  Settings, 
  CreditCard,
  ExternalLink, 
  Zap, 
  Globe, 
  DollarSign,
  ShieldCheck,
  GraduationCap,
  Headphones,
  UserCheck,
  BookmarkCheck,
  Video,
  HelpCircle,
  PlayCircle,
  Accessibility
} from 'lucide-react';

interface SideNavProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  currentTeacher: TeacherProfile;
  overdueCount?: number;
  currentUser?: AuthUser | null;
}

export const SideNav: React.FC<SideNavProps> = ({ 
  currentView, 
  onNavigate, 
  currentTeacher, 
  overdueCount = 0,
  currentUser
}) => {
  const userRole: UserRole = currentUser?.role || 'professor';
  const { setIsTutorialHubOpen, setIsInteractiveTourOpen, setIsA11yModalOpen } = useAccessibility();

  // Dynamic Navigation Items based on User Role (RBAC)
  const getNavItems = () => {
    switch (userRole) {
      case 'admin':
        return [
          { id: 'dashboard' as ViewMode, label: 'Dashboard Geral', icon: LayoutDashboard },
          { id: 'agenda' as ViewMode, label: 'Agenda Global', icon: CalendarIcon },
          { id: 'servicos' as ViewMode, label: 'Serviços', icon: Layers },
          { id: 'alunos' as ViewMode, label: 'Alunos & CRM', icon: Users },
          { id: 'pagamentos' as ViewMode, label: 'Financeiro & Pix', icon: DollarSign, badge: overdueCount > 0 ? `${overdueCount}` : undefined },
          { id: 'usuarios' as ViewMode, label: 'Usuários & Permissões', icon: ShieldCheck },
          { id: 'site-admin' as ViewMode, label: 'Meu Site & Conteúdo', icon: Globe },
          { id: 'planos' as ViewMode, label: 'Planos & Assinatura', icon: CreditCard },
          { id: 'integracoes' as ViewMode, label: 'Automações & n8n', icon: Zap },
          { id: 'configuracoes' as ViewMode, label: 'Configurações', icon: Settings },
        ];

      case 'professor':
        return [
          { id: 'dashboard' as ViewMode, label: 'Dashboard', icon: LayoutDashboard },
          { id: 'agenda' as ViewMode, label: 'Minha Agenda', icon: CalendarIcon },
          { id: 'servicos' as ViewMode, label: 'Meus Serviços', icon: Layers },
          { id: 'alunos' as ViewMode, label: 'Meus Alunos', icon: Users },
          { id: 'pagamentos' as ViewMode, label: 'Meu Financeiro', icon: DollarSign, badge: overdueCount > 0 ? `${overdueCount}` : undefined },
          { id: 'site-admin' as ViewMode, label: 'Meu Site & Vitrine', icon: Globe },
          { id: 'planos' as ViewMode, label: 'Planos', icon: CreditCard },
          { id: 'configuracoes' as ViewMode, label: 'Meu Perfil', icon: Settings },
        ];

      case 'assistente':
        return [
          { id: 'dashboard' as ViewMode, label: 'Painel Geral', icon: LayoutDashboard },
          { id: 'agenda' as ViewMode, label: 'Agenda de Aulas', icon: CalendarIcon },
          { id: 'alunos' as ViewMode, label: 'Cadastro de Alunos', icon: Users },
          { id: 'servicos' as ViewMode, label: 'Consulta Serviços', icon: Layers },
          { id: 'configuracoes' as ViewMode, label: 'Configurações', icon: Settings },
        ];

      case 'aluno':
        return [
          { id: 'portal-aluno' as ViewMode, label: 'Meu Portal', icon: BookmarkCheck },
          { id: 'public-booking' as ViewMode, label: 'Agendar Nova Aula', icon: CalendarIcon },
          { id: 'public-landing' as ViewMode, label: 'Vitrine do Professor', icon: Globe },
          { id: 'configuracoes' as ViewMode, label: 'Meus Dados', icon: Settings },
        ];
    }
  };

  const navItems = getNavItems();

  const getRoleLabel = () => {
    switch (userRole) {
      case 'admin':
        return { title: 'Administrador Geral', badge: 'Admin', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'professor':
        return { title: 'Professor / Mentor', badge: 'Especialista', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
      case 'assistente':
        return { title: 'Secretaria & Atendimento', badge: 'Assistente', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'aluno':
        return { title: 'Portal do Aluno', badge: 'Aluno', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    }
  };

  const roleMeta = getRoleLabel();

  return (
    <>
      {/* Desktop SideNav */}
      <aside className="hidden md:flex flex-col bg-[#091426] text-white h-screen w-64 fixed left-0 top-0 shadow-xl z-50 select-none">
        {/* Header / Profile & Role in SideNav */}
        <div className="p-5 border-b border-[#1e293b] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-[#1e293b] shadow-sm">
            <img 
              src={currentUser?.avatarUrl || currentTeacher.avatarUrl} 
              alt={currentUser?.name || currentTeacher.name} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold text-sm text-white truncate tracking-tight">
              Agenda do Professor
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-block px-1.5 py-0.2 text-[10px] font-bold rounded-md border ${roleMeta.color}`}>
                {roleMeta.badge}
              </span>
              <span className="text-[11px] text-[#8590a6] truncate">
                {currentUser?.name?.split(' ')[0] || 'Usuário'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 text-left ${
                  isActive
                    ? 'bg-[#1e293b] text-[#57dffe] font-bold border-l-4 border-[#57dffe] shadow-sm pl-2.5'
                    : 'text-[#8590a6] hover:text-white hover:bg-[#1e293b]/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#57dffe]' : 'text-[#8590a6]'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white shrink-0">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Site Action (For non-student or student) */}
        <div className="p-3 mx-3 mb-2 bg-[#1e293b]/70 border border-[#1e293b] rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8590a6]">Vitrine Pública</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onNavigate('public-landing')}
              className="flex-1 text-xs py-1.5 px-2 bg-[#00687a] hover:bg-[#00687a]/80 text-white rounded-lg font-medium flex items-center justify-center gap-1 transition-colors"
            >
              <span>Ver Site</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              onClick={() => onNavigate('public-booking')}
              className="text-xs py-1.5 px-2.5 bg-[#1e293b] hover:bg-slate-700 text-[#acedff] rounded-lg font-medium border border-slate-700 transition-colors"
            >
              Agendar
            </button>
          </div>
        </div>

        {/* Tutorial & Accessibility Navigation Shortcuts */}
        <div className="px-3 pb-2 flex items-center gap-1.5">
          <button
            onClick={() => onNavigate('tutorial-wizard')}
            className="flex-1 py-1.5 px-2 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/40 text-[#57dffe] text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Abrir Tour Interativo Passo a Passo (Alt + T)"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Tutorial</span>
          </button>

          <button
            onClick={() => setIsA11yModalOpen(true)}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Configurações de Acessibilidade (Alt + H)"
            aria-label="Acessibilidade"
          >
            <Accessibility className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Current Active User / Teacher Info Footer */}
        <div className="p-3.5 border-t border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-700">
              <img 
                src={currentUser?.avatarUrl || currentTeacher.avatarUrl} 
                alt="Perfil"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block font-bold text-xs text-white truncate">{currentUser?.name || currentTeacher.name}</span>
              <span className="block text-[10px] text-slate-400 truncate">{currentUser?.email || currentTeacher.email}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#091426] text-white shadow-[0_-4px_10px_rgba(30,41,59,0.15)] z-50 h-16 flex justify-around items-center px-2 border-t border-[#1e293b]">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg relative transition-all ${
                isActive ? 'text-[#57dffe]' : 'text-[#8590a6] hover:text-white'
              }`}
            >
              {isActive && (
                <div className="absolute -top-1 w-6 h-1 bg-[#57dffe] rounded-full" />
              )}
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-1">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
