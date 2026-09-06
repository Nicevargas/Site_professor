import React from 'react';
import { ViewMode, TeacherProfile, AuthUser, UserRole, SiteAdminTab } from '../types';
import { useAccessibility } from '../context/AccessibilityContext';
import { SITE_ADMIN_SECTIONS } from '../utils/routes';
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
  Smartphone,
  Link2,
  Building2,
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
  onOpen?: () => void;
  sidebarMode: SidebarMode;
  onChangeSidebarMode: (mode: SidebarMode) => void;
  siteAdminTab?: SiteAdminTab;
  onSelectSiteAdminTab?: (tab: SiteAdminTab) => void;
  /** Gestor só vê o financeiro quando a empresa dele libera */
  canSeeFinance?: boolean;
}

export const SideNav: React.FC<SideNavProps> = ({ 
  currentView, 
  onNavigate, 
  currentTeacher, 
  overdueCount = 0,
  currentUser,
  isOpen,
  onClose,
  onOpen,
  sidebarMode,
  onChangeSidebarMode,
  siteAdminTab,
  onSelectSiteAdminTab,
  canSeeFinance = false,
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
          { id: 'meu-endereco' as ViewMode, label: 'Meu Endereço', icon: Link2 },
          { id: 'planos' as ViewMode, label: 'Planos & Assinatura', icon: CreditCard },
          { id: 'integracoes' as ViewMode, label: 'Automações & n8n', icon: Zap },
          { id: 'configuracoes' as ViewMode, label: 'Configurações', icon: Settings },
          { id: 'public-landing' as ViewMode, label: 'Ver meu site', icon: Globe },
        ];

      case 'professor':
        return [
          { id: 'dashboard' as ViewMode, label: 'Dashboard', icon: LayoutDashboard },
          { id: 'agenda' as ViewMode, label: 'Minha Agenda', icon: CalendarIcon },
          { id: 'servicos' as ViewMode, label: 'Meus Serviços', icon: Layers },
          { id: 'alunos' as ViewMode, label: 'Meus Alunos', icon: Users },
          { id: 'pagamentos' as ViewMode, label: 'Meu Financeiro', icon: DollarSign, badge: overdueCount > 0 ? `${overdueCount}` : undefined },
          { id: 'site-admin' as ViewMode, label: 'Meu Site & Vitrine', icon: Globe },
          { id: 'meu-endereco' as ViewMode, label: 'Meu Endereço', icon: Link2 },
          { id: 'planos' as ViewMode, label: 'Planos', icon: CreditCard },
          { id: 'configuracoes' as ViewMode, label: 'Meu Perfil', icon: Settings },
          { id: 'public-landing' as ViewMode, label: 'Ver meu site', icon: Globe },
        ];

      case 'assistente':
        return [
          { id: 'dashboard' as ViewMode, label: 'Painel Geral', icon: LayoutDashboard },
          { id: 'agenda' as ViewMode, label: 'Agenda de Aulas', icon: CalendarIcon },
          { id: 'alunos' as ViewMode, label: 'Cadastro de Alunos', icon: Users },
          { id: 'servicos' as ViewMode, label: 'Consulta Serviços', icon: Layers },
          { id: 'public-landing' as ViewMode, label: 'Ver o site', icon: Globe },
        ];

      case 'aluno':
        return [
          { id: 'portal-aluno' as ViewMode, label: 'Meu Portal', icon: BookmarkCheck },
          { id: 'public-booking' as ViewMode, label: 'Agendar Nova Aula', icon: CalendarIcon },
          { id: 'public-landing' as ViewMode, label: 'Vitrine do Professor', icon: Globe },
          { id: 'configuracoes' as ViewMode, label: 'Meus Dados', icon: Settings },
        ];

      case 'gestor':
        // "da academia" x "do professor": o gestor alterna entre professores
        // pelo seletor do topo, e os rótulos deixam claro o que está vendo.
        return [
          { id: 'dashboard' as ViewMode, label: 'Painel da Academia', icon: Building2 },
          { id: 'agenda' as ViewMode, label: 'Agenda do Professor', icon: CalendarIcon },
          { id: 'alunos' as ViewMode, label: 'Alunos do Professor', icon: Users },
          { id: 'servicos' as ViewMode, label: 'Serviços do Professor', icon: Layers },
          ...(canSeeFinance
            ? [{ id: 'pagamentos' as ViewMode, label: 'Financeiro da Academia', icon: DollarSign, badge: overdueCount > 0 ? `${overdueCount}` : undefined }]
            : []),
          { id: 'usuarios' as ViewMode, label: 'Equipe & Alunos', icon: ShieldCheck },
          { id: 'configuracoes' as ViewMode, label: 'Meus Dados', icon: Settings },
        ];

      default:
        // Papel desconhecido vê o mínimo, em vez de derrubar a barra lateral
        return [
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
      case 'gestor':
        return { title: 'Gestor da Academia', badge: 'Gestor', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
      default:
        // Papel desconhecido não pode derrubar a barra lateral inteira:
        // sem este default, um papel novo devolvia undefined e quebrava o app.
        return { title: 'Usuário', badge: 'Acesso', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
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
                    {roleMeta.title}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Action Controls in Header (Close / Pin / Mode) */}
            <div className="flex items-center gap-1">
              {/* Compact (icons only) / expanded toggle on desktop */}
              {!isDrawer && (
                <button
                  type="button"
                  onClick={() => onChangeSidebarMode(isCompact ? 'pinned' : 'compact')}
                  className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                  title={isCompact ? 'Expandir barra lateral' : 'Mostrar só ícones'}
                  aria-label={isCompact ? 'Expandir barra lateral' : 'Recolher barra lateral para ícones'}
                >
                  {isCompact ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                </button>
              )}

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
              <React.Fragment key={item.id}>
              <button
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

              {/* Seções de "Meu Site" como sub-itens, para não esconder tudo em abas dentro da tela */}
              {item.id === 'site-admin' && isActive && onSelectSiteAdminTab && (
                <div className="ml-6 mt-1 mb-2 pl-3 border-l border-[#1e293b] space-y-0.5">
                  {SITE_ADMIN_SECTIONS.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => {
                        onSelectSiteAdminTab(section.id);
                        if (sidebarMode === 'drawer' || window.innerWidth < 768) onClose();
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                        siteAdminTab === section.id
                          ? 'text-[#57dffe] bg-[#1e293b]/70'
                          : 'text-[#8590a6] hover:text-white hover:bg-[#1e293b]/40'
                      }`}
                    >
                      {section.label}
                    </button>
                  ))}
                </div>
              )}
              </React.Fragment>
            );
          })}
        </nav>

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
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="block font-bold text-xs text-white truncate">{currentUser?.name || currentTeacher.name}</span>
                  <span className={`shrink-0 px-1.5 py-0.5 text-[9px] font-bold rounded-md border ${roleMeta.color}`}>
                    {roleMeta.badge}
                  </span>
                </div>
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
              onOpen?.();
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

