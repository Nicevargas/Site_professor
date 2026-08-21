import React from 'react';
import { ViewMode, TeacherProfile } from '../types';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Layers, 
  Users, 
  Settings, 
  CreditCard,
  ExternalLink,
  Zap,
  Globe
} from 'lucide-react';

interface SideNavProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  currentTeacher: TeacherProfile;
}

export const SideNav: React.FC<SideNavProps> = ({ currentView, onNavigate, currentTeacher }) => {
  const navItems = [
    { id: 'dashboard' as ViewMode, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'agenda' as ViewMode, label: 'Agenda', icon: CalendarIcon },
    { id: 'servicos' as ViewMode, label: 'Serviços', icon: Layers },
    { id: 'alunos' as ViewMode, label: 'Alunos', icon: Users },
    { id: 'site-admin' as ViewMode, label: 'Meu Site & Conteúdo', icon: Globe },
    { id: 'planos' as ViewMode, label: 'Planos', icon: CreditCard },
    { id: 'integracoes' as ViewMode, label: 'Automações & n8n', icon: Zap },
    { id: 'configuracoes' as ViewMode, label: 'Configurações', icon: Settings },
  ];

  return (
    <>
      {/* Desktop SideNav */}
      <aside className="hidden md:flex flex-col bg-[#091426] text-white h-screen w-64 fixed left-0 top-0 shadow-xl z-50 select-none">
        {/* Header / Teacher Profile in SideNav */}
        <div className="p-6 border-b border-[#1e293b] flex items-center gap-3">
          <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border border-[#1e293b] shadow-sm">
            <img 
              src={currentTeacher.avatarUrl} 
              alt={currentTeacher.name} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold text-sm text-white truncate tracking-tight">
              Agenda do Professor
            </h1>
            <p className="text-xs text-[#8590a6] truncate mt-0.5">
              Painel de Gestão
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 space-y-1.5 overflow-y-auto px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150 text-left ${
                  isActive
                    ? 'bg-[#1e293b] text-[#57dffe] font-semibold border-l-4 border-[#57dffe] shadow-sm pl-3'
                    : 'text-[#8590a6] hover:text-white hover:bg-[#1e293b]/60'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#57dffe]' : 'text-[#8590a6]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Public Site Quick Button */}
        <div className="p-4 mx-3 mb-2 bg-[#1e293b]/70 border border-[#1e293b] rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8590a6]">Site Público</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <p className="text-xs text-slate-300 mb-3 line-clamp-1">Página do Aluno & Agendamento</p>
          <div className="flex gap-2">
            <button
              onClick={() => onNavigate('public-landing')}
              className="flex-1 text-xs py-2 px-2 bg-[#00687a] hover:bg-[#00687a]/80 text-white rounded-lg font-medium flex items-center justify-center gap-1 transition-colors"
            >
              <span>Ver Site</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              onClick={() => onNavigate('public-booking')}
              className="text-xs py-2 px-2.5 bg-[#1e293b] hover:bg-slate-700 text-[#acedff] rounded-lg font-medium border border-slate-700 transition-colors"
              title="Testar Fluxo de Agendamento"
            >
              Agendar
            </button>
          </div>
        </div>

        {/* Teacher Footer in SideNav */}
        <div className="p-4 border-t border-[#1e293b]">
          <div className="flex items-center gap-3">
            <img 
              src={currentTeacher.avatarUrl} 
              alt={currentTeacher.name}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-[#1e293b]" 
            />
            <div className="min-w-0 flex-1">
              <span className="block font-semibold text-sm text-white truncate">{currentTeacher.name}</span>
              <span className="block text-xs text-[#8590a6] truncate">{currentTeacher.role}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#091426] text-white shadow-[0_-4px_10px_rgba(30,41,59,0.15)] z-50 h-16 flex justify-around items-center px-2 border-t border-[#1e293b]">
        {navItems.slice(0, 5).map((item) => {
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
