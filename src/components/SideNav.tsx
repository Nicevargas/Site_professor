import React from 'react';
import { ViewMode, TeacherProfile, AuthUser, UserRole } from '../types';
import { useAccessibility } from '../context/AccessibilityContext';
import { AquagendaIcon } from './AquagendaLogo';
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
  X,
  Pin,
  PinOff,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Smartphone
} from 'lucide-react';

export type SidebarMode = 'drawer' | 'pinned' | 'compact';

interface SideNavProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  currentTeacher: TeacherProfile;
  overdueCount?: number;
  currentUser?: AuthUser | null;
  isOpen: boolean;
  onClose: () => void;
  sidebarMode: SidebarMode;
  onChangeSidebarMode: (mode: SidebarMode) => void;
}

export const SideNav: React.FC<SideNavProps> = ({ 
  currentView, 
  onNavigate, 
  currentTeacher, 
  overdueCount = 0,
  currentUser,
  isOpen,
  onClose,
  sidebarMode,
  onChangeSidebarMode
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

  const handleItemClick = (id: ViewMode) => {
    onNavigate(id);
    // Automatically close if in drawer mode or on mobile screen
    if (sidebarMode === 'drawer' || window.innerWidth < 768) {
      onClose();
    }
  };

  // Determine styling classes based on mode
  const isDrawer = sidebarMode === 'drawer';
  const isCompact = sidebarMode === 'compact';
  const isPinned = sidebarMode === 'pinned';

  return (
    <>
      {/* Backdrop for Drawer Mode or Mobile open state */}
      {(isOpen || (isDrawer && isOpen)) && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Aside */}
      <aside 
        className={`bg-[#091426] text-white h-screen fixed left-0 top-0 shadow-2xl z-50 select-none flex flex-col transition-all duration-300 ease-in-out ${
          // Positioning and responsiveness:
          isDrawer
            ? `w-72 md:w-80 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
            : isCompact
              ? `${isOpen ? 'translate-x-0 w-72 md:w-20' : '-translate-x-full md:translate-x-0 md:w-20'}`
              : `${isOpen ? 'translate-x-0 w-72 md:w-64' : '-translate-x-full md:translate-x-0 md:w-64'}`
        }`}
        aria-label="Navegação Principal"
      >
        {/* Header / Brand & Close / Pin controls */}
        <div className={`p-4 border-b border-[#1e293b] ${isCompact ? 'md:p-3 md:flex md:flex-col md:items-center' : 'space-y-3'}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <AquagendaIcon className="w-8 h-8 shrink-0 drop-shadow-sm" alt="Aquagenda" />
              {(!isCompact || isOpen) && (
                <div className="min-w-0 flex-1 animate-in fade-in duration-200">
                  <span className="font-extrabold text-base text-white tracking-tight leading-none block">
                    Aquagenda
                  </span>
                  <span className="text-[10px] text-[#57dffe] font-semibold tracking-wide uppercase block mt-0.5">
                    {isDrawer ? 'Barra Móvel' : 'Agenda do Professor'}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Action Controls in Header (Close / Pin / Mode) */}
            <div className="flex items-center gap-1">
              {/* Pin / Unpin button on desktop */}
              <button
                type="button"
                onClick={() => {
                  if (sidebarMode === 'drawer') {
                    onChangeSidebarMode('pinned');
                  } else {
                    onChangeSidebarMode('drawer');
                    onClose();
                  }
                }}
                className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                title={sidebarMode === 'drawer' ? 'Fixar barra lateral na tela' : 'Tornar móvel (aparecer só quando solicitado)'}
                aria-label="Fixar ou desfixar barra lateral"
              >
                {sidebarMode === 'drawer' ? (
                  <Pin className="w-4 h-4 text-cyan-400" />
                ) : (
                  <PinOff className="w-4 h-4 text-slate-400 hover:text-cyan-300" />
                )}
              </button>

              {/* Close Button (X) - visible in drawer mode or on mobile */}
              {(isDrawer || isOpen) && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Fechar barra lateral (Esc)"
                  aria-label="Fechar menu lateral"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* User Profile Pill in Header (Hidden when compact on desktop) */}
          {(!isCompact || isOpen) && (
            <div className="flex items-center gap-2.5 pt-2 border-t border-slate-800/80 animate-in fade-in duration-200">
              <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-slate-700 shadow-xs">
                <img 
                  src={currentUser?.avatarUrl || currentTeacher.avatarUrl} 
                  alt={currentUser?.name || currentTeacher.name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={`inline-block px-1.5 py-0.2 text-[9px] font-bold rounded-md border ${roleMeta.color}`}>
                    {roleMeta.badge}
                  </span>
                  <span className="text-[11px] font-medium text-slate-300 truncate">
                    {currentUser?.name?.split(' ')[0] || 'Usuário'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className={`flex-1 py-3 space-y-1 overflow-y-auto ${isCompact && !isOpen ? 'px-2' : 'px-3'}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            // Compact icon button on desktop
            if (isCompact && !isOpen) {
              return (
                <div key={item.id} className="relative group flex justify-center">
                  <button
                    onClick={() => handleItemClick(item.id)}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-[#57dffe] text-[#091426] font-bold shadow-md shadow-cyan-500/20'
                        : 'text-[#8590a6] hover:text-white hover:bg-[#1e293b]'
                    }`}
                    title={item.label}
                    aria-label={item.label}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {item.badge && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#091426]" />
                    )}
                  </button>

                  {/* Tooltip on hover */}
                  <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl border border-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    {item.label}
                    {item.badge && <span className="ml-1.5 text-rose-400">({item.badge})</span>}
                  </div>
                </div>
              );
            }

            // Normal / Expanded or Drawer Mode Item
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 text-left cursor-pointer ${
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

        {/* Sidebar Mode Switcher (Opcão de Comportamento Móvel / Fixada / Compacta) */}
        {(!isCompact || isOpen) && (
          <div className="p-3 mx-3 mb-2 bg-[#101c33] border border-[#1e293b] rounded-xl space-y-1.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold px-0.5">
              <span>Modo da Barra</span>
              <span className="text-[#57dffe] text-[9px] font-bold">
                {sidebarMode === 'drawer' ? 'Móvel (Sob Demanda)' : sidebarMode === 'compact' ? 'Compacta' : 'Fixada'}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-1 bg-[#091426] p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => onChangeSidebarMode('drawer')}
                className={`py-1.5 px-1 rounded text-[10px] font-medium flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
                  sidebarMode === 'drawer' 
                    ? 'bg-[#57dffe] text-[#091426] font-bold shadow-xs' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Aparece só quando solicitado pelo botão ou atalho Alt+M"
              >
                <Smartphone className="w-3 h-3" />
                <span className="leading-none text-[9px]">Móvel</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeSidebarMode('pinned')}
                className={`py-1.5 px-1 rounded text-[10px] font-medium flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
                  sidebarMode === 'pinned' 
                    ? 'bg-[#57dffe] text-[#091426] font-bold shadow-xs' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Barra fixa sempre visível na lateral da tela"
              >
                <Pin className="w-3 h-3" />
                <span className="leading-none text-[9px]">Fixada</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeSidebarMode('compact')}
                className={`py-1.5 px-1 rounded text-[10px] font-medium flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
                  sidebarMode === 'compact' 
                    ? 'bg-[#57dffe] text-[#091426] font-bold shadow-xs' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Apenas ícones para maximizar o espaço útil de tela"
              >
                <PanelLeftClose className="w-3 h-3" />
                <span className="leading-none text-[9px]">Ícones</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Site Action (For non-student or student) */}
        {(!isCompact || isOpen) && (
          <div className="p-3 mx-3 mb-2 bg-[#1e293b]/70 border border-[#1e293b] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8590a6]">Vitrine Pública</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleItemClick('public-landing')}
                className="flex-1 text-xs py-1.5 px-2 bg-[#00687a] hover:bg-[#00687a]/80 text-white rounded-lg font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span>Ver Site</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleItemClick('public-booking')}
                className="text-xs py-1.5 px-2.5 bg-[#1e293b] hover:bg-slate-700 text-[#acedff] rounded-lg font-medium border border-slate-700 transition-colors cursor-pointer"
              >
                Agendar
              </button>
            </div>
          </div>
        )}

        {/* Tutorial Navigation Shortcut */}
        <div className={`px-3 pb-2 flex items-center ${isCompact && !isOpen ? 'justify-center px-1' : ''}`}>
          {(!isCompact || isOpen) ? (
            <button
              onClick={() => handleItemClick('tutorial-wizard')}
              className="w-full py-1.5 px-2 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/40 text-[#57dffe] text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Abrir Tour Interativo Passo a Passo (Alt + T)"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Tutorial</span>
            </button>
          ) : (
            <button
              onClick={() => handleItemClick('tutorial-wizard')}
              className="p-2 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/40 text-[#57dffe] transition-colors cursor-pointer"
              title="Abrir Tour Interativo Passo a Passo"
              aria-label="Tutorial"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Current Active User / Teacher Info Footer */}
        {(!isCompact || isOpen) && (
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
        )}
      </aside>

      {/* Mobile Bottom Navigation Bar with Quick Menu Launcher */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#091426] text-white shadow-[0_-4px_10px_rgba(30,41,59,0.15)] z-40 h-16 flex justify-around items-center px-2 border-t border-[#1e293b]">
        {navItems.slice(0, 3).map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
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

        {/* Mobile "Mais / Menu" button to open complete drawer */}
        <button
          onClick={() => {
            if (isOpen) {
              onClose();
            } else {
              // Open drawer
              onChangeSidebarMode('drawer');
              // Let parent know to open
              if (isOpen) onClose();
            }
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg relative transition-all ${
            isOpen ? 'text-[#57dffe]' : 'text-[#8590a6] hover:text-white'
          }`}
          title="Abrir menu completo"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Menu</span>
        </button>
      </nav>
    </>
  );
};

