import React, { useState } from 'react';
import { ViewMode, TeacherProfile, AuthUser } from '../types';
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
  ShieldCheck
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
}) => {
  const [isTenantOpen, setIsTenantOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const displayUserName = currentUser?.name || currentTeacher.name;
  const displayUserEmail = currentUser?.email || currentTeacher.email;
  const userAvatar = currentUser?.avatarUrl || currentTeacher.avatarUrl;

  return (
    <header className="bg-white border-b border-[#eceef0] flex justify-between items-center w-full px-4 md:px-8 h-16 shrink-0 z-40 sticky top-0">
      {/* Left side: View title & Breadcrumbs */}
      <div className="flex items-center gap-4">
        {/* Mobile quick view indicator */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200">
            <img 
              src={currentTeacher.avatarUrl} 
              alt={currentTeacher.name} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover" 
            />
          </div>
          <span className="font-semibold text-sm text-[#091426]">Agenda do Professor</span>
        </div>

        {/* Desktop Quick Nav Tabs */}
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
      </div>

      {/* Right side: Search, Tenant Switcher, Public Landing Button, Profile */}
      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="relative hidden sm:block">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#75777d]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar aluno, aula ou serviço..."
            className="h-10 pl-10 pr-4 rounded-full border border-[#c5c6cd] bg-[#f7f9fb] text-sm text-[#191c1e] placeholder-[#75777d] focus:bg-white focus:border-[#00687a] focus:ring-1 focus:ring-[#00687a] focus:outline-none w-52 md:w-64 transition-all"
          />
        </div>

        {/* Switch Tenant Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsTenantOpen(!isTenantOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#45474c] hover:text-[#091426] hover:bg-[#eceef0] transition-colors border border-transparent hover:border-[#c5c6cd]"
          >
            <span className="hidden lg:inline">Trocar Tenant:</span>
            <span className="text-[#00687a] max-w-[110px] truncate">{currentTeacher.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#75777d]" />
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

        {/* Public Site preview button */}
        <button
          onClick={() => onNavigate('public-landing')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-[#f2f4f6] hover:bg-[#e0e3e5] text-[#091426] rounded-full text-xs font-medium transition-colors"
          title="Ver Landing Page Pública"
        >
          <Globe className="w-3.5 h-3.5 text-[#00687a]" />
          <span>Ver Site</span>
        </button>

        {/* Profile Avatar & Menu */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-10 h-10 rounded-full overflow-hidden border border-[#c5c6cd] hover:border-[#00687a] transition-all focus:ring-2 focus:ring-[#00687a]"
          >
            <img
              src={userAvatar}
              alt={displayUserName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-[#091426] truncate">{displayUserName}</p>
                <p className="text-[11px] text-slate-500 truncate">{displayUserEmail}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Sessão Ativa
                  </span>
                  {currentUser?.isDemo && (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Modo Demo
                    </span>
                  )}
                </div>
              </div>
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
              <button
                onClick={() => {
                  onNavigate('planos');
                  setIsProfileOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Planos & Assinatura</span>
              </button>
              <div className="border-t border-slate-100 my-1"></div>
              <button
                onClick={() => {
                  onNavigate('public-landing');
                  setIsProfileOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-xs text-[#00687a] font-medium hover:bg-slate-50 flex items-center justify-between"
              >
                <span>Abrir Site do Aluno</span>
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
