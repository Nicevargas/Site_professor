import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Appointment, 
  ServiceItem, 
  Student, 
  Reminder, 
  TeacherProfile, 
  ViewMode, 
  Testimonial,
  CurriculumItem,
  VideoItem,
  PhotoItem,
  PaymentInvoice,
  AuthUser,
  SystemUser,
  UserRole,
  SiteAdminTab,
  Company,
  WaitlistEntry,
  AttendanceStatus
} from './types';
import { 
  INITIAL_TEACHER_PROFILES, 
  INITIAL_SERVICES, 
  INITIAL_APPOINTMENTS, 
  INITIAL_STUDENTS, 
  INITIAL_REMEMBERS,
  INITIAL_TESTIMONIALS,
  INITIAL_CURRICULUM,
  INITIAL_VIDEOS,
  INITIAL_PHOTOS,
  DEFAULT_SITE_FAQS,
  INITIAL_PAYMENT_INVOICES,
  INITIAL_SYSTEM_USERS,
  INITIAL_COMPANIES,
  INITIAL_WAITLIST
} from './data/mockData';

import { AttendanceModal } from './components/AttendanceModal';
import { CompanyPanelView } from './components/CompanyPanelView';
import { CompanyLandingView } from './components/CompanyLandingView';
import { availability, ClassSlot } from './utils/classes';
import { addMinutes } from './utils/schedule';
import { SideNav, SidebarMode } from './components/SideNav';
import { TopAppBar } from './components/TopAppBar';
import { DashboardView } from './components/DashboardView';
import { AgendaView } from './components/AgendaView';
import { ServicesView } from './components/ServicesView';
import { StudentsView } from './components/StudentsView';
import { PaymentsView } from './components/PaymentsView';
import { PricingPlansView } from './components/PricingPlansView';
import { PublicLandingView } from './components/PublicLandingView';
import { PublicBookingWizard } from './components/PublicBookingWizard';
import { SettingsView } from './components/SettingsView';
import { IntegrationsView } from './components/IntegrationsView';
import { SiteAdminView } from './components/SiteAdminView';
import { AuthView } from './components/AuthView';
import { UsersManagementView } from './components/UsersManagementView';
import { StudentPortalView } from './components/StudentPortalView';

import { NewAppointmentModal } from './components/NewAppointmentModal';
import { BlockTimeModal } from './components/BlockTimeModal';
import { ServiceModal } from './components/ServiceModal';
import { GoogleCalendarModal } from './components/GoogleCalendarModal';
import { WhatsAppConfirmationCenterModal } from './components/WhatsAppConfirmationCenterModal';

import { AccessibilityProvider, useAccessibility } from './context/AccessibilityContext';
import { ReadingGuide } from './components/ReadingGuide';
import { AccessibilityToolbar } from './components/AccessibilityToolbar';
import { InteractiveTourModal } from './components/InteractiveTourModal';
import { OnlineTutorialHubModal } from './components/OnlineTutorialHubModal';
import { TutorialWizardView } from './components/TutorialWizardView';

import { supabaseService } from './services/supabaseService';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { dispatchAppointmentWebhook, dispatchFormWebhook } from './utils/webhookDispatcher';
import { canAccessView, getDefaultView, canSwitchProfiles, canViewFinances, canManageCompany, sanitizeSelfDeclaredRole } from './utils/permissions';
import { quotaStatus, PLANS, PLAN_ORDER, DIAS_DE_TESTE } from './utils/plans';
import { StudentProfileView } from './components/StudentProfileView';
import { hashFromView, viewFromHash, VIEW_TITLES } from './utils/routes';
import { formatMonthYearPtBR, toLocalDateKey } from './utils/dates';
import { SyncErrorToast } from './components/SyncErrorToast';
import { MyAddressView } from './components/MyAddressView';
import { resolveTenant, slugify, buildPublicUrl, slugFromRoute, PLATFORM_HOST } from './utils/tenant';
import { PERFIL_EM_BRANCO, perfilVazio } from './utils/perfilEmBranco';
import { podeVerOutroProfessor, professorDoUsuario } from './utils/professorDoUsuario';
import { PlatformLandingView } from './components/PlatformLandingView';
import { aplicarSeo, estruturaAcademia, estruturaPlataforma, estruturaProfessor } from './utils/seo';
import { getPlan, planAllows } from './utils/plans';


const DEFAULT_STUDENT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

function AppInner() {
  const { isInteractiveTourOpen, setIsInteractiveTourOpen, isTutorialHubOpen, setIsTutorialHubOpen } = useAccessibility();

  // Authentication & session state (defaults to null if not logged in)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('agenda_prof_current_user');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return null;
  });

  // Navigation & View state - defaults to public-landing for visitors, dashboard/portal for logged in
  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    // Link compartilhado ou recarga da página: respeita a rota na URL (#/agenda, #/meu-site...)
    const fromHash = viewFromHash(window.location.hash);
    if (fromHash) return fromHash;
    try {
      const saved = localStorage.getItem('agenda_prof_current_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u.role === 'aluno') return 'portal-aluno';
        return 'dashboard';
      }
    } catch {
      // ignore
    }
    // Sem endereço de professor ou academia, quem chega é visitante da
    // plataforma, não de uma vitrine. Antes caía em 'public-landing' e via o
    // site de um professor qualquer do banco.
    return resolveTenant(window.location).mode === 'none' ? 'plataforma' : 'public-landing';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [siteAdminTab, setSiteAdminTab] = useState<SiteAdminTab>('branding');

  /**
   * Com o Supabase ligado, o banco é a única verdade.
   *
   * Antes o estado começava nos dados de demonstração e o banco só os
   * substituía quando respondia -- então a primeira tela era sempre a do
   * professor de mentira, e quem tinha zero vídeos continuava vendo os
   * vídeos do exemplo para sempre.
   *
   * Sem Supabase configurado os dados falsos voltam a valer: aí eles são o
   * produto, não um resto.
   */
  const semear = <T,>(exemplo: T[]): T[] => (isSupabaseConfigured ? [] : exemplo);

  /** Em que pé está a primeira carga do banco. Sem banco, não há o que esperar. */
  const [cargaInicial, setCargaInicial] = useState<'carregando' | 'pronta' | 'falhou'>(
    isSupabaseConfigured ? 'carregando' : 'pronta'
  );


  // Multi-user & RBAC System Users State
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(() => {
    // O que o navegador guardou é sempre uma foto velha: serve para o modo
    // sem banco, não para adiantar a tela de quem tem banco.
    if (isSupabaseConfigured) return [];
    try {
      const saved = localStorage.getItem('agenda_prof_system_users');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_SYSTEM_USERS;
  });

  // Empresas / escolas: o perfil principal que agrupa professores
  const [companies, setCompanies] = useState<Company[]>(() => semear(INITIAL_COMPANIES));

  // Fila de espera das turmas lotadas e a chamada aberta no momento
  const [allWaitlist, setAllWaitlist] = useState<WaitlistEntry[]>(() => semear(INITIAL_WAITLIST));
  const [attendanceSlot, setAttendanceSlot] = useState<ClassSlot | null>(null);

  // Endereço pedido pelo visitante: caminho, subdomínio ou domínio próprio
  const [tenantRef] = useState(() => resolveTenant(window.location));

  /**
   * Academia pedida pelo endereço. Em /e/<slug> o caminho já diz que é uma
   * academia; em subdomínio e domínio próprio, quem descobre é a busca --
   * o endereço pode ser de professor ou de academia, nunca dos dois.
   */
  const [addressedCompany, setAddressedCompany] = useState<Company | null>(null);
  /**
   * Em que pé está a busca do endereço pedido na URL.
   * 'ocioso' vale para quem entrou pela raiz, sem pedir vitrine nenhuma.
   */
  const [statusEndereco, setStatusEndereco] =
    useState<'ocioso' | 'procurando' | 'encontrado' | 'nao-encontrado'>('ocioso');
  /** O visitante já escolheu um professor dentro da página da academia */
  const [pickedTeacherFromCompany, setPickedTeacherFromCompany] = useState(false);

  // Core domain state
  const [teachers, setTeachers] = useState<TeacherProfile[]>(() => semear(INITIAL_TEACHER_PROFILES));
  const [currentTeacher, setCurrentTeacher] = useState<TeacherProfile>(() => {
    // Com banco, ninguém é semeado: o perfil chega de lá. Enquanto não chega,
    // vale o molde em branco -- se algum caminho de render escapar da espera,
    // aparece vazio, e não o nome de outra pessoa.
    if (isSupabaseConfigured) return PERFIL_EM_BRANCO;

    try {
      const savedUser = localStorage.getItem('agenda_prof_current_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        const match = INITIAL_TEACHER_PROFILES.find((t) => t.id === u.id || t.email === u.email || t.id === u.teacherId);
        if (match) return match;
        const savedTeacher = localStorage.getItem(`agenda_prof_teacher_${u.id}`);
        if (savedTeacher) return JSON.parse(savedTeacher);
        // Só um professor vira perfil de vitrine. Admin, secretaria e aluno olham
        // o tenant selecionado, senão o nome do admin viraria o nome do site.
        if (u.role === 'professor') {
          return {
            ...INITIAL_TEACHER_PROFILES[0],
            id: u.id,
            name: u.name,
            email: u.email,
            slug: undefined,
            customDomain: undefined,
          };
        }
        return INITIAL_TEACHER_PROFILES[0];
      }
    } catch {
      // fallback
    }

    const ref = resolveTenant(window.location);
    if (ref.mode !== 'none') {
      const byAddress = INITIAL_TEACHER_PROFILES.find((t) =>
        ref.domain ? t.customDomain === ref.domain : (t.slug || slugify(t.name)) === ref.slug
      );
      if (byAddress) return byAddress;
    }
    return INITIAL_TEACHER_PROFILES[0];
  });

  // Data collections
  const [allServices, setAllServices] = useState<ServiceItem[]>(() => semear(INITIAL_SERVICES));
  const [allAppointments, setAllAppointments] = useState<Appointment[]>(() => semear(INITIAL_APPOINTMENTS));
  const [allStudents, setAllStudents] = useState<Student[]>(() => semear(INITIAL_STUDENTS));
  const [allReminders, setAllReminders] = useState<Reminder[]>(() => semear(INITIAL_REMEMBERS));
  const [allInvoices, setAllInvoices] = useState<PaymentInvoice[]>(() => semear(INITIAL_PAYMENT_INVOICES));

  // Marketing & Public Site Content State
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => semear(INITIAL_TESTIMONIALS));
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>(() => semear(INITIAL_CURRICULUM));
  const [videos, setVideos] = useState<VideoItem[]>(() => semear(INITIAL_VIDEOS));
  const [photos, setPhotos] = useState<PhotoItem[]>(() => semear(INITIAL_PHOTOS));
  const [faqs, setFaqs] = useState(() => semear(DEFAULT_SITE_FAQS));

  // Filtered views based on current teacher/tenant
  const services = useMemo(() => {
    return allServices.filter(s => !s.teacherId || s.teacherId === currentTeacher.id);
  }, [allServices, currentTeacher.id]);

  const appointments = useMemo(() => {
    return allAppointments.filter(a => !a.teacherId || a.teacherId === currentTeacher.id);
  }, [allAppointments, currentTeacher.id]);

  const students = useMemo(() => {
    return allStudents.filter(s => !s.teacherId || s.teacherId === currentTeacher.id);
  }, [allStudents, currentTeacher.id]);

  const reminders = useMemo(() => {
    return allReminders.filter(r => !r.teacherId || r.teacherId === currentTeacher.id);
  }, [allReminders, currentTeacher.id]);

  const waitlist = useMemo(() => {
    return allWaitlist.filter(w => !w.teacherId || w.teacherId === currentTeacher.id);
  }, [allWaitlist, currentTeacher.id]);

  // ---- Escopo de empresa (gestor da academia) ----
  const currentCompanyId = useMemo(() => {
    if (currentUser?.companyId) return currentUser.companyId;
    if (currentUser?.teacherId) {
      return teachers.find((t) => t.id === currentUser.teacherId)?.companyId;
    }
    return undefined;
  }, [currentUser?.companyId, currentUser?.teacherId, teachers]);

  const currentCompany = useMemo(
    () => companies.find((c) => c.id === currentCompanyId) || null,
    [companies, currentCompanyId]
  );

  /** O gestor só enxerga (e só troca entre) os professores da empresa dele. */
  const isManager = currentUser?.role === 'gestor';
  const managerSeesFinance = Boolean(currentCompany?.managerSeesFinance);

  const teachersInScope = useMemo(() => {
    if (!isManager) return teachers;
    return teachers.filter((t) => t.companyId && t.companyId === currentCompanyId);
  }, [isManager, teachers, currentCompanyId]);

  /**
   * Ocupação da conta diante do limite do plano.
   *
   * "Usuário" é todo mundo com acesso -- professores, secretaria e alunos --
   * porque é isso que a faixa "1 a 10 usuários" significa para um personal
   * com nove alunos. Admin da plataforma não ocupa vaga de cliente.
   *
   * Espelha public.account_user_count(); quem realmente barra é o gatilho
   * enforce_user_quota no banco. Aqui é só para avisar antes da ida perdida.
   */
  const accountQuota = useMemo(() => {
    const idsDaEmpresa = new Set(
      currentCompanyId
        ? teachers.filter((t) => t.companyId === currentCompanyId).map((t) => t.id)
        : [currentTeacher.id]
    );
    const usados = systemUsers.filter(
      (u) =>
        u.role !== 'admin' &&
        ((currentCompanyId && u.companyId === currentCompanyId) ||
          (u.teacherId && idsDaEmpresa.has(u.teacherId)))
    ).length;

    const tier = currentCompany?.plan || currentTeacher.plan;
    return quotaStatus(tier, usados);
  }, [systemUsers, teachers, currentCompanyId, currentCompany?.plan, currentTeacher.id, currentTeacher.plan]);

  /**
   * Usuários que o gestor administra: os da empresa dele, direto pelo
   * companyId ou indireto pelo professor a que respondem. Isto espelha a
   * política system_users_manager_read; o banco é quem manda de verdade.
   */
  const usersInScope = useMemo(() => {
    if (!isManager) return systemUsers;
    const idsDaEmpresa = new Set(teachersInScope.map((t) => t.id));
    return systemUsers.filter(
      (u) =>
        (u.companyId && u.companyId === currentCompanyId) ||
        (u.teacherId && idsDaEmpresa.has(u.teacherId))
    );
  }, [isManager, systemUsers, teachersInScope, currentCompanyId]);

  const invoices = useMemo(() => {
    return allInvoices.filter(inv => !inv.teacherId || inv.teacherId === currentTeacher.id);
  }, [allInvoices, currentTeacher.id]);

  // Conteúdo multimídia do professor atual (isolamento por tenant também no site e no portal)
  const teacherVideos = useMemo(() => {
    return videos.filter(v => !v.teacherId || v.teacherId === currentTeacher.id);
  }, [videos, currentTeacher.id]);

  const teacherTestimonials = useMemo(() => {
    return testimonials.filter(t => !t.teacherId || t.teacherId === currentTeacher.id);
  }, [testimonials, currentTeacher.id]);

  const teacherCurriculum = useMemo(() => {
    return curriculum.filter(c => !c.teacherId || c.teacherId === currentTeacher.id);
  }, [curriculum, currentTeacher.id]);

  const teacherPhotos = useMemo(() => {
    return photos.filter(p => !p.teacherId || p.teacherId === currentTeacher.id);
  }, [photos, currentTeacher.id]);

  const teacherFaqs = useMemo(() => {
    return faqs.filter(f => !f.teacherId || f.teacherId === currentTeacher.id);
  }, [faqs, currentTeacher.id]);

  const overdueCount = useMemo(() => {
    return invoices.filter(inv => inv.status === 'vencido').length;
  }, [invoices]);

  // Sidebar Display Mode (Móvel / Sob Demanda vs Fixada vs Compacta)
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(() => {
    try {
      const saved = localStorage.getItem('aquagenda_sidebar_mode');
      if (saved === 'drawer' || saved === 'pinned' || saved === 'compact') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'pinned';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const handleToggleSidebar = useCallback(() => {
    if (sidebarMode === 'drawer') {
      setIsSidebarOpen(prev => !prev);
    } else {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(prev => !prev);
      } else {
        // On desktop, clicking menu toggle switches to drawer mode (or toggles pin)
        const nextMode = sidebarMode === 'pinned' ? 'drawer' : 'pinned';
        setSidebarMode(nextMode);
        try {
          localStorage.setItem('aquagenda_sidebar_mode', nextMode);
        } catch {}
        if (nextMode === 'drawer') {
          setIsSidebarOpen(false);
        }
      }
    }
  }, [sidebarMode]);

  const handleChangeSidebarMode = useCallback((newMode: SidebarMode) => {
    setSidebarMode(newMode);
    try {
      localStorage.setItem('aquagenda_sidebar_mode', newMode);
    } catch {}
    if (newMode === 'drawer') {
      setIsSidebarOpen(false);
    }
  }, []);

  // Keyboard shortcut listener: Alt + M or Ctrl + B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if ((e.altKey && (e.key === 'm' || e.key === 'M')) || (e.ctrlKey && (e.key === 'b' || e.key === 'B'))) {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  // Academia pedida pelo endereço: primeiro o que está em memória
  useEffect(() => {
    if (tenantRef.mode === 'none' || tenantRef.kind === 'professor') return;
    const achada = companies.find((c) =>
      tenantRef.domain ? c.customDomain === tenantRef.domain : c.slug === tenantRef.slug
    );
    if (achada) setAddressedCompany(achada);
  }, [companies, tenantRef.mode, tenantRef.kind, tenantRef.slug, tenantRef.domain]);

  /**
   * ...e depois o banco, que é a fonte da verdade.
   *
   * As duas buscas ficam juntas de propósito. Separadas, nenhuma das duas
   * sabia se a outra tinha achado algo, então "não encontrei" era
   * indistinguível de "ainda estou procurando" -- e o endereço errado caía no
   * professor de demonstração. Com o curinga no DNS isso deixou de ser raro:
   * qualquer subdomínio digitado errado chega até aqui.
   */
  useEffect(() => {
    if (tenantRef.mode === 'none' || !isSupabaseConfigured) return;
    let cancelled = false;
    setStatusEndereco('procurando');

    const ref = { slug: tenantRef.slug, domain: tenantRef.domain };
    Promise.all([
      tenantRef.kind === 'professor' ? Promise.resolve(null) : supabaseService.getCompanyByAddress(ref),
      tenantRef.kind === 'empresa' ? Promise.resolve(null) : supabaseService.getTeacherByAddress(ref),
    ]).then(([empresa, professor]) => {
      if (cancelled) return;
      if (empresa) setAddressedCompany(empresa);
      if (professor) setCurrentTeacher(professor);
      setStatusEndereco(empresa || professor ? 'encontrado' : 'nao-encontrado');
    }).catch(() => {
      // Banco fora do ar não é endereço inexistente: melhor mostrar o que
      // temos em memória do que acusar de erro quem digitou certo.
      if (!cancelled) setStatusEndereco('encontrado');
    });

    return () => { cancelled = true; };
  }, [tenantRef.mode, tenantRef.kind, tenantRef.slug, tenantRef.domain]);

  /**
   * Endereço sem vitrine não é beco sem saída.
   *
   * Quando o endereço não corresponde a professor nem academia, não há o que
   * mostrar de público ali -- mas o sistema continua sendo o mesmo.
   *
   * Visitante vai para a página da plataforma, não para o login: quem chegou
   * por um endereço qualquer pode nem ter conta, e um formulário seco não diz
   * onde ele caiu nem o que isso aqui é. A página tem o botão de entrar, então
   * quem já é cliente perde um clique e ganha um destino que faz sentido.
   *
   * Quem já está logado vai direto para o próprio painel.
   */
  useEffect(() => {
    if (statusEndereco !== 'nao-encontrado' || currentView !== 'public-landing') return;
    setCurrentView(currentUser ? getDefaultView(currentUser.role) : 'plataforma');
  }, [statusEndereco, currentView, currentUser]);

  /**
   * Título, prévia de link e dados estruturados seguem a página aberta.
   *
   * Tudo num efeito só, e sempre o conjunto inteiro: numa SPA o <head> é
   * compartilhado, então quem não escreve um valor herda o da página
   * anterior -- era assim que a vitrine de um professor saía com a descrição
   * de outro no WhatsApp.
   */
  useEffect(() => {
    // A plataforma não é a vitrine de ninguém
    if (currentView === 'plataforma') {
      const url = PLATFORM_HOST ? `https://${PLATFORM_HOST}/` : window.location.origin + '/';
      aplicarSeo({
        titulo: 'Aquagenda | Agenda, alunos e site para quem ensina',
        descricao:
          'Sistema de agenda, alunos, pagamentos e site próprio para professores, estúdios e academias. '
          + `Vagas por turma, lista de espera, chamada e cobrança por PIX. ${DIAS_DE_TESTE} dias grátis.`,
        url,
        estrutura: estruturaPlataforma(url, PLAN_ORDER.map((t) => PLANS[t])),
      });
      return;
    }

    // Painel, login e telas internas não pertencem ao índice de busca
    if (currentView !== 'public-landing' && currentView !== 'public-booking') {
      aplicarSeo({
        titulo: `${VIEW_TITLES[currentView]} | Aquagenda`,
        descricao: 'Área do sistema Aquagenda.',
        indexavel: false,
      });
      return;
    }

    // Sem ninguém carregado ainda não há nome para pôr: escrever um agora
    // seria escrever o de outra pessoa.
    if (perfilVazio(currentTeacher) && !addressedCompany) return;

    // Na página da academia, quem dá nome ao link é a academia -- senão o
    // compartilhamento mostraria o nome de um professor qualquer dela.
    if (addressedCompany && !pickedTeacherFromCompany) {
      const nome = addressedCompany.tradeName || addressedCompany.name;
      const descricao =
        addressedCompany.bio
        || addressedCompany.headline
        || `Agende aulas com os professores da ${nome}.`;
      const url = buildPublicUrl(addressedCompany.customDomain ? 'domain' : 'path', {
        slug: addressedCompany.slug,
        domain: addressedCompany.customDomain,
        kind: 'empresa',
        platformHost: PLATFORM_HOST,
      });

      aplicarSeo({
        titulo: `${nome}${addressedCompany.headline ? ` | ${addressedCompany.headline}` : ''}`,
        descricao,
        url,
        imagem: addressedCompany.heroImageUrl,
        estrutura: estruturaAcademia({
          nome,
          descricao,
          url,
          imagem: addressedCompany.heroImageUrl,
          telefone: addressedCompany.phone,
        }),
      });
      return;
    }

    const marca = currentTeacher.brandName || 'Aquagenda';
    const descricao = currentTeacher.bio || `Agende aulas com ${currentTeacher.name}.`;
    const url = buildPublicUrl(
      currentTeacher.customDomain && planAllows(currentTeacher.plan, 'domain')
        ? 'domain'
        : planAllows(currentTeacher.plan, 'subdomain')
        ? 'subdomain'
        : 'path',
      {
        slug: currentTeacher.slug || slugify(currentTeacher.name),
        domain: currentTeacher.customDomain,
        platformHost: PLATFORM_HOST,
      }
    );

    aplicarSeo({
      titulo: `${currentTeacher.name} | ${currentTeacher.specialty || marca}`,
      descricao,
      url,
      imagem: currentTeacher.heroImageUrl || currentTeacher.avatarUrl,
      tipo: 'profile',
      estrutura: estruturaProfessor({
        nome: currentTeacher.name,
        descricao,
        url,
        imagem: currentTeacher.heroImageUrl || currentTeacher.avatarUrl,
        especialidade: currentTeacher.specialty,
        telefone: currentTeacher.whatsapp,
      }),
    });
  }, [currentTeacher, addressedCompany, pickedTeacherFromCompany, currentView]);

  // URL: mantém #/rota sincronizada com a tela (botão voltar e links compartilháveis)
  useEffect(() => {
    // Link de vitrine no hash (#/p/<slug>, #/e/<slug>) é o endereço que a
    // pessoa compartilha: sobrescrever tiraria o professor da URL, e quem
    // copiasse da barra mandaria o link errado.
    const enderecoDeVitrine = slugFromRoute('', window.location.hash);
    if (enderecoDeVitrine && currentView === 'public-landing') return;

    const path = hashFromView(currentView);
    if (window.location.hash !== `#${path}`) {
      window.history.pushState(null, '', `#${path}`);
    }
  }, [currentView]);

  useEffect(() => {
    const syncFromUrl = () => {
      const view = viewFromHash(window.location.hash);
      if (view) setCurrentView(view);
    };
    window.addEventListener('popstate', syncFromUrl);
    window.addEventListener('hashchange', syncFromUrl);
    return () => {
      window.removeEventListener('popstate', syncFromUrl);
      window.removeEventListener('hashchange', syncFromUrl);
    };
  }, []);

  // Guarda de rotas por papel: nunca manter aberta uma tela que o papel atual não pode acessar
  useEffect(() => {
    if (!currentUser) return;
    if (!canAccessView(currentUser.role, currentView, { managerSeesFinance })) {
      setCurrentView(getDefaultView(currentUser.role));
    }
  }, [currentUser, currentView, managerSeesFinance]);

  // Load from Supabase on startup
  useEffect(() => {
    async function loadData() {
      if (!isSupabaseConfigured) return;

      try {
        const [
          dbTeachers,
          dbServices,
          dbAppointments,
          dbStudents,
          dbReminders,
          dbInvoices,
          dbTestimonials,
          dbCurriculum,
          dbVideos,
          dbPhotos,
          dbFaqs,
          dbSystemUsers,
          dbCompanies,
          dbWaitlist
        ] = await Promise.all([
          supabaseService.getTeachers(),
          supabaseService.getServices(),
          supabaseService.getAppointments(),
          supabaseService.getStudents(),
          supabaseService.getReminders(),
          supabaseService.getInvoices(),
          supabaseService.getTestimonials(),
          supabaseService.getCurriculum(),
          supabaseService.getVideos(),
          supabaseService.getPhotos(),
          supabaseService.getFaqs(),
          supabaseService.getSystemUsers(),
          supabaseService.getCompanies(),
          supabaseService.getWaitlist(),
        ]);

        if (dbTeachers) setTeachers(dbTeachers);
        if (dbTeachers && dbTeachers.length > 0) {
          /**
           * O professor de quem está logado -- nunca "o primeiro da lista".
           *
           * Cair no dbTeachers[0] fazia o professor abrir "Meu site" e ver a
           * marca de um colega; ao salvar, o banco recusava por permissão, e
           * o erro era a única pista de que a tela mostrava outra pessoa.
           *
           * Sem vínculo, só quem administra pode olhar outro perfil. Para os
           * demais fica em branco: a tela vazia diz a verdade.
           */
          const meu = professorDoUsuario(currentUser, dbTeachers);
          const activeTeacher =
            meu || (podeVerOutroProfessor(currentUser) || !currentUser ? dbTeachers[0] : null);

          if (activeTeacher) {
            setCurrentTeacher(activeTeacher);

            // Segredos de integração (n8n) vivem em integrations_config; só o dono consegue ler
            const integrations = await supabaseService.getIntegrationsConfig(activeTeacher.id);
            if (integrations) {
              setCurrentTeacher((prev) => ({ ...prev, ...integrations }));
            }
          }
        }

        if (dbServices) setAllServices(dbServices);
        if (dbAppointments) setAllAppointments(dbAppointments);
        if (dbStudents) setAllStudents(dbStudents);
        if (dbReminders) setAllReminders(dbReminders);
        if (dbInvoices) setAllInvoices(dbInvoices);
        if (dbTestimonials) setTestimonials(dbTestimonials);
        if (dbCurriculum) setCurriculum(dbCurriculum);
        if (dbVideos) setVideos(dbVideos);
        if (dbPhotos) setPhotos(dbPhotos);
        if (dbFaqs) setFaqs(dbFaqs);
        if (dbCompanies) setCompanies(dbCompanies);
        if (dbWaitlist) setAllWaitlist(dbWaitlist);
        if (dbSystemUsers) {
          setSystemUsers(dbSystemUsers);
          localStorage.setItem('agenda_prof_system_users', JSON.stringify(dbSystemUsers));
        }
        setCargaInicial('pronta');
      } catch (err) {
        // Não há mais dados de exemplo para cair de volta: quem não carrega
        // fica sem nada, e a tela precisa dizer isso em vez de girar para
        // sempre esperando um perfil que não vem.
        console.warn('Não foi possível carregar do Supabase:', err);
        setCargaInicial('falhou');
      }
    }

    loadData();
  }, []);

  // Listen to Supabase Auth State
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          const email = session.user.email || '';
          const dbUser = await supabaseService.findUserByEmail(email);
          const role = (dbUser?.role as UserRole) || sanitizeSelfDeclaredRole(session.user.user_metadata?.role);
          const authUser: AuthUser = {
            id: dbUser?.id || session.user.id,
            email: email,
            name: dbUser?.name || session.user.user_metadata?.full_name || currentTeacher.name,
            role: role,
            avatarUrl: dbUser?.avatar_url || currentTeacher.avatarUrl,
            teacherId: dbUser?.teacher_id,
            studentId: dbUser?.student_id,
            isDemo: false,
          };
          setCurrentUser(authUser);
          localStorage.setItem('agenda_prof_current_user', JSON.stringify(authUser));
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const email = session.user.email || '';
          const dbUser = await supabaseService.findUserByEmail(email);
          const role = (dbUser?.role as UserRole) || sanitizeSelfDeclaredRole(session.user.user_metadata?.role);
          const authUser: AuthUser = {
            id: dbUser?.id || session.user.id,
            email: email,
            name: dbUser?.name || session.user.user_metadata?.full_name || currentTeacher.name,
            role: role,
            avatarUrl: dbUser?.avatar_url || currentTeacher.avatarUrl,
            teacherId: dbUser?.teacher_id,
            studentId: dbUser?.student_id,
            isDemo: false,
          };
          setCurrentUser(authUser);
          localStorage.setItem('agenda_prof_current_user', JSON.stringify(authUser));
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [currentTeacher]);

  const handleLoginSuccess = (user: AuthUser, teacherData?: Partial<TeacherProfile>) => {
    setCurrentUser(user);
    localStorage.setItem('agenda_prof_current_user', JSON.stringify(user));

    if (user.role === 'professor') {
      /**
       * A base é o professor DELE, não o que estava na tela.
       *
       * Espalhar o currentTeacher aqui copiava bio, cores, logo e slug de
       * quem estivesse carregado no momento -- outro professor, no caso
       * comum -- e só trocava o id. O login saía com a identidade de um
       * colega colada por cima.
       */
      const base = professorDoUsuario(user, teachers) || PERFIL_EM_BRANCO;
      const updatedProfile: TeacherProfile = {
        ...base,
        ...(teacherData || {}),
        id: base.id || user.id,
        name: teacherData?.name || base.name || user.name || '',
        email: teacherData?.email || base.email || user.email || '',
        specialty: teacherData?.specialty || base.specialty,
        whatsapp: teacherData?.whatsapp || base.whatsapp,
      };
      setCurrentTeacher(updatedProfile);
      localStorage.setItem(`agenda_prof_teacher_${updatedProfile.id}`, JSON.stringify(updatedProfile));

      setTeachers((prev) => {
        const exists = prev.some((t) => t.id === updatedProfile.id || t.email === updatedProfile.email);
        if (exists) {
          return prev.map((t) => (t.id === updatedProfile.id || t.email === updatedProfile.email ? updatedProfile : t));
        }
        return [updatedProfile, ...prev];
      });
    } else if (user.role === 'gestor') {
      // Gestor não tem tenant próprio: entra no primeiro professor da empresa
      // dele, para que agenda e alunos já abram em algo que exista.
      const daEmpresa = teachers.filter((t) => t.companyId && t.companyId === user.companyId);
      if (daEmpresa.length > 0) setCurrentTeacher(daEmpresa[0]);
    } else if (user.teacherId) {
      // Assistente ou aluno: apenas seleciona o professor ao qual está vinculado, sem alterar o perfil dele
      const linkedTeacher = teachers.find((t) => t.id === user.teacherId);
      if (linkedTeacher) setCurrentTeacher(linkedTeacher);
    }

    setCurrentView(getDefaultView(user.role));
  };

  const handleLogout = async () => {
    await supabaseService.signOut();
    setCurrentUser(null);
    localStorage.removeItem('agenda_prof_current_user');
    setCurrentView('public-landing');
  };

  // RBAC User Management Handlers
  const persistSystemUser = (user: SystemUser) => {
    supabaseService.saveSystemUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      teacherId: user.teacherId,
      studentId: user.studentId,
      status: user.status,
      permissions: user.permissions,
      bio: user.bio,
    });
  };

  const handleAddUser = (newUserData: Omit<SystemUser, 'id' | 'createdAt'>) => {
    const newUser: SystemUser = {
      ...newUserData,
      // O gestor só cadastra dentro da própria academia. A tela já limita as
      // opções, e o RLS recusaria outra empresa -- isto evita a ida perdida.
      companyId: isManager ? currentCompanyId : newUserData.companyId,
      id: `user-${Date.now()}`,
      createdAt: toLocalDateKey(new Date()),
    };

    // Professor cujo vínculo não existe ganha um perfil de verdade: sem isso o
    // teacherId ficaria apontando para o vazio e a conta não teria agenda.
    if (newUser.role === 'professor' && newUser.teacherId && !teachers.some((t) => t.id === newUser.teacherId)) {
      const profile: TeacherProfile = {
        ...INITIAL_TEACHER_PROFILES[0],
        id: newUser.teacherId,
        companyId: newUser.companyId,
        name: newUser.name,
        email: newUser.email,
        whatsapp: (newUser.phone || '').replace(/\D/g, ''),
        bio: newUser.bio || '',
        slug: undefined,
        customDomain: undefined,
      };
      setTeachers((prev) => [profile, ...prev]);
      supabaseService.saveTeacher(profile);
    }
    setSystemUsers((prev) => {
      const updated = [newUser, ...prev];
      localStorage.setItem('agenda_prof_system_users', JSON.stringify(updated));
      return updated;
    });
    persistSystemUser(newUser);
  };

  const handleUpdateUser = (id: string, updates: Partial<SystemUser>) => {
    const target = systemUsers.find((u) => u.id === id);
    setSystemUsers((prev) => {
      const updated = prev.map((u) => (u.id === id ? { ...u, ...updates } : u));
      localStorage.setItem('agenda_prof_system_users', JSON.stringify(updated));
      return updated;
    });
    if (target) persistSystemUser({ ...target, ...updates });
  };

  const handleDeleteUser = (id: string) => {
    setSystemUsers((prev) => {
      const updated = prev.filter((u) => u.id !== id);
      localStorage.setItem('agenda_prof_system_users', JSON.stringify(updated));
      return updated;
    });
    supabaseService.deleteSystemUser(id);
  };

  const handleSwitchUser = (user: SystemUser) => {
    // Somente admin pode assumir outro perfil (suporte / demonstração)
    if (!currentUser || !canSwitchProfiles(currentUser.role)) return;
    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      teacherId: user.teacherId,
      studentId: user.studentId,
      phone: user.phone,
      isDemo: true,
    };
    setCurrentUser(authUser);
    localStorage.setItem('agenda_prof_current_user', JSON.stringify(authUser));

    // Mesma regra do login: o professor do perfil assumido, não o da tela
    const assumido = professorDoUsuario(authUser, teachers);
    if (assumido) setCurrentTeacher(assumido);

    setCurrentView(getDefaultView(user.role));
  };

  // Atualização dos próprios dados (aluno) sem tocar no perfil do professor
  const handleUpdateOwnProfile = (updates: { name?: string; phone?: string }) => {
    if (!currentUser) return;
    const updatedUser: AuthUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    localStorage.setItem('agenda_prof_current_user', JSON.stringify(updatedUser));

    if (systemUsers.some((u) => u.id === updatedUser.id)) {
      handleUpdateUser(updatedUser.id, updates);
    }

    if (!updatedUser.isDemo) {
      // Atualiza a própria linha pelo auth_user_id: o id guardado no navegador
      // pode não ser o da linha no banco, e aí o upsert virava INSERT recusado
      supabaseService.saveOwnProfile({
        name: updatedUser.name || '',
        phone: updatedUser.phone,
        avatarUrl: updatedUser.avatarUrl,
      });
    }
  };

  // Selected state for modals & drawers
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isBlockTimeOpen, setIsBlockTimeOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isGoogleCalendarModalOpen, setIsGoogleCalendarModalOpen] = useState(false);
  const [calendarTargetAppointment, setCalendarTargetAppointment] = useState<Appointment | null>(null);
  const [isWhatsApp8hModalOpen, setIsWhatsApp8hModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [preSelectedStudent, setPreSelectedStudent] = useState<Student | null>(null);
  const [reschedulingAppointment, setReschedulingAppointment] = useState<Appointment | null>(null);
  const [bookingServiceId, setBookingServiceId] = useState<string | undefined>(undefined);

  // Reminder toggles
  const handleToggleReminder = (id: string) => {
    const target = allReminders.find((rem) => rem.id === id);
    if (!target) return;
    const updated = { ...target, completed: !target.completed };
    setAllReminders((prev) => prev.map((rem) => (rem.id === id ? updated : rem)));
    supabaseService.saveReminder(updated, currentTeacher.id);
  };

  const handleAddReminder = (title: string, dueDate: string) => {
    const newRem: Reminder = {
      id: `rem-${Date.now()}`,
      teacherId: currentTeacher.id,
      title,
      dueDate,
      completed: false,
    };
    setAllReminders((prev) => [newRem, ...prev]);
    supabaseService.saveReminder(newRem, currentTeacher.id);
    dispatchFormWebhook('reminder.created', currentTeacher, newRem);
  };

  // Appointment actions
  const handleSaveNewAppointment = (newApt: Appointment) => {
    const scopedApt: Appointment = {
      ...newApt,
      teacherId: currentTeacher.id,
    };
    // Mesmo id = reagendamento: substitui em vez de duplicar
    const isReschedule = allAppointments.some((apt) => apt.id === scopedApt.id);
    setAllAppointments((prev) =>
      isReschedule ? prev.map((apt) => (apt.id === scopedApt.id ? scopedApt : apt)) : [scopedApt, ...prev]
    );
    supabaseService.saveAppointment(scopedApt, currentTeacher.id);
    dispatchAppointmentWebhook(scopedApt, currentTeacher, isReschedule ? 'updated' : 'created');
    setReschedulingAppointment(null);
    if (isReschedule || scopedApt.status === 'Bloqueado') return;

    // Aluno novo entra no CRM só com os dados reais informados, sem valores inventados
    const alreadyKnown = allStudents.some(
      (s) => s.name.trim().toLowerCase() === scopedApt.studentName.trim().toLowerCase() && (!s.teacherId || s.teacherId === currentTeacher.id)
    );
    if (!alreadyKnown) {
      const newStd: Student = {
        id: `std-${Date.now()}`,
        teacherId: currentTeacher.id,
        name: scopedApt.studentName,
        email: scopedApt.studentEmail || '',
        phone: scopedApt.studentPhone || '',
        avatar: DEFAULT_STUDENT_AVATAR,
        joinedDate: formatMonthYearPtBR(new Date()),
        totalClasses: 1,
        status: 'Ativo',
        notes: scopedApt.notes,
        lastClass: scopedApt.date,
      };
      setAllStudents((prev) => [newStd, ...prev]);
      supabaseService.saveStudent(newStd, currentTeacher.id);
      dispatchFormWebhook('student.created', currentTeacher, newStd);
    }
  };

  const handleBlockTime = (blocked: Appointment) => {
    const scopedBlocked: Appointment = {
      ...blocked,
      teacherId: currentTeacher.id,
    };
    setAllAppointments((prev) => [scopedBlocked, ...prev]);
    supabaseService.saveAppointment(scopedBlocked, currentTeacher.id);
  };

  const handleUpdateAppointmentNotes = (id: string, notes: string) => {
    const target = allAppointments.find((apt) => apt.id === id);
    if (!target) return;
    const updated = { ...target, notes };
    setAllAppointments((prev) => prev.map((apt) => (apt.id === id ? updated : apt)));
    supabaseService.saveAppointment(updated, currentTeacher.id);
    dispatchAppointmentWebhook(updated, currentTeacher, 'updated');
    if (selectedAppointment && selectedAppointment.id === id) {
      setSelectedAppointment({ ...selectedAppointment, notes });
    }
  };

  /** Cancelar preserva o histórico: marca a aula como cancelada com data e motivo. */
  const handleCancelAppointment = (id: string, reason?: string) => {
    const target = allAppointments.find((a) => a.id === id);
    if (!target) return;
    const cancelled: Appointment = {
      ...target,
      status: 'Cancelado',
      cancelledAt: toLocalDateKey(new Date()),
      cancellationReason: reason?.trim() || undefined,
    };
    setAllAppointments((prev) => prev.map((apt) => (apt.id === id ? cancelled : apt)));
    supabaseService.saveAppointment(cancelled, currentTeacher.id);
    dispatchAppointmentWebhook(cancelled, currentTeacher, 'cancelled');
    setSelectedAppointment(null);
  };

  /** Reabrir devolve a aula cancelada para a agenda, se o horário ainda estiver livre. */
  const handleReopenAppointment = (id: string) => {
    const target = allAppointments.find((a) => a.id === id);
    if (!target) return;

    // Reabrir não pode furar o limite: no meio-tempo a turma pode ter enchido
    const service = allServices.find((sv) => sv.id === target.serviceId);
    const slot = availability(allAppointments, target, service, { ignoreAppointmentId: target.id });
    if (slot.isFull) {
      window.alert(
        `Não dá para reabrir: a turma de ${target.serviceName} às ${target.startTime} já está com ${slot.enrolled} de ${slot.capacity} vagas ocupadas.`
      );
      return;
    }

    const restored: Appointment = {
      ...target,
      status: 'Confirmado',
      cancelledAt: undefined,
      cancellationReason: undefined,
    };
    setAllAppointments((prev) => prev.map((apt) => (apt.id === id ? restored : apt)));
    supabaseService.saveAppointment(restored, currentTeacher.id);
    dispatchAppointmentWebhook(restored, currentTeacher, 'updated');
    setSelectedAppointment(restored);
  };

  /** Apagar de vez, usado só no histórico de cancelamentos. */
  const handleDeleteAppointment = (id: string) => {
    setAllAppointments((prev) => prev.filter((apt) => apt.id !== id));
    supabaseService.deleteAppointment(id);
    setSelectedAppointment(null);
  };

  // ==========================================================
  // EMPRESAS: o perfil principal que agrupa professores e usuários
  // ==========================================================
  const handleSaveCompany = (company: Company) => {
    setCompanies((prev) => {
      const exists = prev.some((c) => c.id === company.id);
      return exists ? prev.map((c) => (c.id === company.id ? company : c)) : [company, ...prev];
    });
    supabaseService.saveCompany(company);
  };

  const handleDeleteCompany = (id: string) => {
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    // Quem apontava para esta empresa fica sem vínculo, em vez de apontar para o vazio
    setSystemUsers((prev) => {
      const updated = prev.map((u) => (u.companyId === id ? { ...u, companyId: undefined } : u));
      localStorage.setItem('agenda_prof_system_users', JSON.stringify(updated));
      return updated;
    });
    supabaseService.deleteCompany(id);
  };

  // ==========================================================
  // LISTA DE ESPERA das turmas lotadas
  // ==========================================================
  const persistWaitlistEntry = (entry: WaitlistEntry) => {
    setAllWaitlist((prev) => {
      const exists = prev.some((e) => e.id === entry.id);
      return exists ? prev.map((e) => (e.id === entry.id ? entry : e)) : [...prev, entry];
    });
    supabaseService.saveWaitlistEntry(entry, entry.teacherId || currentTeacher.id);
  };

  const handleAddToWaitlist = (data: {
    serviceId: string;
    serviceName: string;
    date: string;
    startTime: string;
    studentId?: string;
    studentName: string;
    studentPhone?: string;
    studentEmail?: string;
  }) => {
    const entry: WaitlistEntry = {
      ...data,
      id: `wait-${Date.now()}`,
      teacherId: currentTeacher.id,
      status: 'aguardando',
      createdAt: new Date().toISOString(),
    };
    persistWaitlistEntry(entry);
    return entry;
  };

  const handleRemoveWaitlistEntry = (id: string) => {
    setAllWaitlist((prev) => prev.filter((e) => e.id !== id));
    supabaseService.deleteWaitlistEntry(id);
  };

  /** Chamar da fila: vira aula de verdade, se a vaga ainda existir. */
  const handlePromoteWaitlistEntry = (entry: WaitlistEntry) => {
    const service = allServices.find((sv) => sv.id === entry.serviceId);
    const slot = availability(allAppointments, entry, service);
    if (slot.isFull) {
      window.alert(
        `A vaga já foi preenchida: ${slot.enrolled} de ${slot.capacity} lugares ocupados em ${entry.serviceName} às ${entry.startTime}.`
      );
      return;
    }

    const duration = service?.durationMinutes || 60;
    const dayOfWeek = new Date(`${entry.date}T00:00:00`).getDay();
    const appointment: Appointment = {
      id: `apt-${Date.now()}`,
      teacherId: currentTeacher.id,
      studentId: entry.studentId,
      studentName: entry.studentName,
      studentInitials: entry.studentName.trim().split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
      studentPhone: entry.studentPhone,
      studentEmail: entry.studentEmail,
      serviceId: entry.serviceId,
      serviceName: entry.serviceName || service?.name || 'Aula',
      date: entry.date,
      dayOfWeek: isNaN(dayOfWeek) ? 1 : dayOfWeek,
      startTime: entry.startTime,
      endTime: addMinutes(entry.startTime, duration),
      durationMinutes: duration,
      modality: (service?.modality === 'Presencial' ? 'Presencial' : 'Online (Google Meet)') as Appointment['modality'],
      status: 'Confirmado',
      price: service?.price ?? 0,
      capacity: slot.capacity,
      notes: 'Matriculado a partir da lista de espera.',
    };

    setAllAppointments((prev) => [appointment, ...prev]);
    supabaseService.saveAppointment(appointment, currentTeacher.id);
    dispatchAppointmentWebhook(appointment, currentTeacher, 'created');

    const promoted: WaitlistEntry = { ...entry, status: 'matriculado', calledAt: new Date().toISOString() };
    setAllWaitlist((prev) => prev.map((e) => (e.id === entry.id ? promoted : e)));
    supabaseService.saveWaitlistEntry(promoted, currentTeacher.id);
  };

  // ==========================================================
  // LISTA DE CHAMADA: a presença fica gravada na própria aula
  // ==========================================================
  const handleSaveAttendance = (
    marks: { appointmentId: string; attendance?: AttendanceStatus; attendanceNote?: string }[]
  ) => {
    const markedAt = new Date().toISOString();
    const byId = new Map(marks.map((m) => [m.appointmentId, m]));

    setAllAppointments((prev) =>
      prev.map((apt) => {
        const mark = byId.get(apt.id);
        if (!mark) return apt;
        return {
          ...apt,
          attendance: mark.attendance,
          attendanceNote: mark.attendance === 'justificada' ? mark.attendanceNote : undefined,
          attendanceMarkedAt: mark.attendance ? markedAt : undefined,
        };
      })
    );

    marks.forEach((mark) => {
      const apt = allAppointments.find((a) => a.id === mark.appointmentId);
      if (!apt) return;
      supabaseService.saveAppointment(
        {
          ...apt,
          attendance: mark.attendance,
          attendanceNote: mark.attendance === 'justificada' ? mark.attendanceNote : undefined,
          attendanceMarkedAt: mark.attendance ? markedAt : undefined,
        },
        currentTeacher.id
      );
    });
  };

  /** Ajuste de dados do aluno feito pelo professor (hoje: o nível). */
  const handleUpdateStudent = (id: string, updates: Partial<Student>) => {
    const target = allStudents.find((s) => s.id === id);
    if (!target) return;
    const updated = { ...target, ...updates };
    setAllStudents((prev) => prev.map((s) => (s.id === id ? updated : s)));
    supabaseService.saveStudent(updated, updated.teacherId || currentTeacher.id);
  };

  // Service actions
  const handleSaveService = (savedService: ServiceItem) => {
    const scopedService: ServiceItem = {
      ...savedService,
      teacherId: currentTeacher.id,
    };
    setAllServices((prev) => {
      const exists = prev.some((s) => s.id === scopedService.id);
      if (exists) {
        return prev.map((s) => (s.id === scopedService.id ? scopedService : s));
      }
      return [scopedService, ...prev];
    });
    supabaseService.saveService(scopedService, currentTeacher.id);
  };

  const handleDuplicateService = (service: ServiceItem) => {
    const duplicated: ServiceItem = {
      ...service,
      id: `serv-${Date.now()}`,
      teacherId: currentTeacher.id,
      name: `${service.name} (Cópia)`,
    };
    setAllServices((prev) => [duplicated, ...prev]);
    supabaseService.saveService(duplicated, currentTeacher.id);
  };

  const handleDeleteService = (id: string) => {
    setAllServices((prev) => prev.filter((s) => s.id !== id));
    supabaseService.deleteService(id);
  };

  const handleToggleServiceActive = (id: string) => {
    setAllServices((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = { ...s, active: !s.active };
          supabaseService.saveService(updated, currentTeacher.id);
          return updated;
        }
        return s;
      })
    );
  };

  // Student actions
  const handleAddStudent = (newStudentData: Omit<Student, 'id' | 'totalClasses' | 'joinedDate'>) => {
    const newStudent: Student = {
      ...newStudentData,
      id: `std-${Date.now()}`,
      teacherId: currentTeacher.id,
      joinedDate: formatMonthYearPtBR(new Date()),
      totalClasses: 0,
      lastClass: 'Sem aulas ainda',
    };
    setAllStudents((prev) => [newStudent, ...prev]);
    supabaseService.saveStudent(newStudent, currentTeacher.id);
    dispatchFormWebhook('student.created', currentTeacher, newStudent);
  };

  const handleScheduleForStudent = (student: Student) => {
    setPreSelectedStudent(student);
    setIsNewAppointmentOpen(true);
  };

  // Cobranças: a tela financeira devolve a lista do professor atual; aqui ela é
  // mesclada com as dos outros professores e as diferenças são gravadas no banco
  const handleUpdateInvoices = (nextForTeacher: PaymentInvoice[]) => {
    const scoped = nextForTeacher.map((inv) => ({ ...inv, teacherId: inv.teacherId || currentTeacher.id }));
    const previous = allInvoices.filter((inv) => !inv.teacherId || inv.teacherId === currentTeacher.id);
    const nextIds = new Set(scoped.map((inv) => inv.id));

    previous
      .filter((inv) => !nextIds.has(inv.id))
      .forEach((inv) => supabaseService.deleteInvoice(inv.id));

    scoped
      .filter((inv) => {
        const before = previous.find((p) => p.id === inv.id);
        return !before || JSON.stringify(before) !== JSON.stringify(inv);
      })
      .forEach((inv) => supabaseService.saveInvoice(inv, currentTeacher.id));

    setAllInvoices((prev) => [
      ...scoped,
      ...prev.filter((inv) => inv.teacherId && inv.teacherId !== currentTeacher.id),
    ]);
  };

  // Public Booking Flow
  const handleStartBookingFromLanding = (serviceId?: string) => {
    setBookingServiceId(serviceId);
    setCurrentView('public-booking');
  };

  const handleBookingCompleted = (newApt: Appointment) => {
    handleSaveNewAppointment(newApt);
  };

  // Filtered lists if global search is used
  const filteredAppointmentsForView = appointments.filter((apt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      apt.studentName.toLowerCase().includes(q) ||
      apt.serviceName.toLowerCase().includes(q) ||
      apt.notes?.toLowerCase().includes(q)
    );
  });

  const filteredServicesForView = services.filter((svc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      svc.name.toLowerCase().includes(q) ||
      svc.description.toLowerCase().includes(q)
    );
  });

  /**
   * Endereço que não é de ninguém.
   *
   * Só para visitante: quem está logado veio usar o sistema, e trocar a tela
   * dele por um erro de endereço seria tirá-lo do próprio painel.
   */
  /**
   * A vitrine não abre com o perfil em branco.
   *
   * Agora que nada é semeado com dados de exemplo, o intervalo entre abrir a
   * página e o banco responder tem um perfil vazio. Renderizar isso seria
   * trocar "site de outra pessoa" por "site sem nome" -- as duas erradas.
   * Espera-se, e a página aparece uma vez só, certa.
   */
  if (currentView === 'public-landing' && !currentUser && perfilVazio(currentTeacher)
      && !addressedCompany && statusEndereco !== 'nao-encontrado') {
    // Carga que falhou não vira espera eterna: o visitante precisa saber que
    // o problema é nosso, e poder tentar de novo.
    if (cargaInicial === 'falhou') {
      return (
        <main className="min-h-screen bg-[#f7f9fb] flex items-center justify-center px-6 text-center">
          <div className="max-w-sm">
            <h1 className="text-xl font-bold text-[#091426] mb-2">Não foi possível carregar a página</h1>
            <p className="text-sm text-[#45474c] mb-6">
              O problema é do nosso lado. Tente novamente em alguns instantes.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-3 rounded-xl bg-[#00687a] text-white font-medium hover:bg-[#004e5c] transition-colors"
            >
              Tentar de novo
            </button>
          </div>
        </main>
      );
    }

    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center" role="status" aria-label="Carregando">
        <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-[#00687a] animate-spin" />
      </div>
    );
  }

  // A página que vende o Aquagenda: fora de qualquer vitrine, e antes do login
  if (currentView === 'plataforma' && !currentUser) {
    return (
      <PlatformLandingView
        onEnterApp={() => setCurrentView('auth')}
        onCreateAccount={() => setCurrentView('auth')}
      />
    );
  }

  // Public views without admin sidebar layout
  if (currentView === 'auth') {
    return (
      <AuthView
        currentTeacher={currentTeacher}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  /**
   * Vitrine da academia: quando o endereço aponta para uma empresa e o
   * visitante ainda não escolheu um professor, a porta de entrada é a
   * página dela. Escolher um professor cai na vitrine dele, como sempre.
   */
  if (currentView === 'public-landing' && addressedCompany && !pickedTeacherFromCompany) {
    const daAcademia = teachers.filter((t) => t.companyId === addressedCompany.id);
    return (
      <CompanyLandingView
        company={addressedCompany}
        teachers={daAcademia}
        services={allServices}
        onSelectTeacher={(teacher) => {
          setCurrentTeacher(teacher);
          setPickedTeacherFromCompany(true);
        }}
        onEnterApp={() => setCurrentView('auth')}
      />
    );
  }

  if (currentView === 'public-landing') {
    return (
      <PublicLandingView
        teacher={currentTeacher}
        services={services}
        testimonials={teacherTestimonials}
        curriculum={teacherCurriculum}
        videos={teacherVideos}
        photos={teacherPhotos}
        faqs={teacherFaqs}
        isAuthenticated={!!currentUser}
        onOpenLogin={() => setCurrentView('auth')}
        onStartBooking={handleStartBookingFromLanding}
        onBackToDashboard={() => {
          if (currentUser?.role === 'aluno') {
            setCurrentView('portal-aluno');
          } else {
            setCurrentView('dashboard');
          }
        }}
        onOpenSiteAdmin={() => setCurrentView('site-admin')}
        onOpenPlans={() => setCurrentView('planos')}
        backToCompany={
          addressedCompany && pickedTeacherFromCompany
            ? {
                name: addressedCompany.tradeName || addressedCompany.name,
                onBack: () => setPickedTeacherFromCompany(false),
              }
            : undefined
        }
      />
    );
  }

  if (currentView === 'public-booking') {
    return (
      <PublicBookingWizard
        teacher={currentTeacher}
        services={services}
        preSelectedServiceId={bookingServiceId}
        existingAppointments={appointments}
        onBookingComplete={handleBookingCompleted}
        onJoinWaitlist={handleAddToWaitlist}
        onBackToLanding={() => setCurrentView('public-landing')}
        onBackToDashboard={() => {
          if (currentUser?.role === 'aluno') {
            setCurrentView('portal-aluno');
          } else {
            setCurrentView('dashboard');
          }
        }}
      />
    );
  }

  if (currentView === 'tutorial-wizard') {
    return (
      <TutorialWizardView
        currentTeacher={currentTeacher}
        currentUser={currentUser}
        onNavigate={(view) => {
          setCurrentView(view);
          setSelectedAppointment(null);
        }}
        appointments={appointments}
        services={services}
      />
    );
  }

  // Strict route guard: Only authenticated/registered users can access the administrative backoffice
  if (!currentUser) {
    return (
      <AuthView
        currentTeacher={currentTeacher}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Enquanto o guard de rotas redireciona, não renderizar uma tela proibida para este papel
  if (!canAccessView(currentUser.role, currentView, { managerSeesFinance })) {
    return null;
  }

  // Dynamic left padding based on active sidebar mode:
  // - 'pinned': 256px (md:pl-64)
  // - 'compact': 80px (md:pl-20)
  // - 'drawer': 0px (pl-0, floats as mobile overlay when requested)
  const contentPadding = 
    sidebarMode === 'pinned' 
      ? 'md:pl-64' 
      : sidebarMode === 'compact' 
        ? 'md:pl-20' 
        : 'pl-0';

  return (
    <div className="flex h-screen bg-[#f7f9fb] font-sans antialiased text-[#191c1e] overflow-hidden">
      {/* Side Navigation Bar */}
      <SideNav
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          setSelectedAppointment(null);
        }}
        currentTeacher={currentTeacher}
        overdueCount={overdueCount}
        currentUser={currentUser}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpen={() => setIsSidebarOpen(true)}
        sidebarMode={sidebarMode}
        onChangeSidebarMode={handleChangeSidebarMode}
        siteAdminTab={siteAdminTab}
        onSelectSiteAdminTab={setSiteAdminTab}
        canSeeFinance={canViewFinances(currentUser.role, { managerSeesFinance })}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col ${contentPadding} min-w-0 h-screen overflow-hidden transition-[padding] duration-300 ease-in-out`}>
        {/* Top Header */}
        <TopAppBar
          currentView={currentView}
          onNavigate={(view) => {
            setCurrentView(view);
            setSelectedAppointment(null);
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          teachers={teachersInScope}
          currentTeacher={currentTeacher}
          onSelectTeacher={setCurrentTeacher}
          currentUser={currentUser}
          onLogout={handleLogout}
          systemUsers={canSwitchProfiles(currentUser.role) ? systemUsers : []}
          onSwitchUser={canSwitchProfiles(currentUser.role) ? handleSwitchUser : undefined}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          sidebarMode={sidebarMode}
          onChangeSidebarMode={handleChangeSidebarMode}
        />

        {/* Dynamic Main View */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {currentView === 'dashboard' && isManager && (
            <CompanyPanelView
              company={currentCompany}
              teachers={teachersInScope}
              appointments={allAppointments}
              students={allStudents}
              invoices={allInvoices}
              services={allServices}
              showFinance={managerSeesFinance}
              managerName={currentUser.name}
              onOpenTeacher={(teacher) => {
                setCurrentTeacher(teacher);
                setCurrentView('agenda');
              }}
            />
          )}

          {currentView === 'dashboard' && !isManager && (
            <DashboardView
              currentTeacher={currentTeacher}
              appointments={filteredAppointmentsForView}
              reminders={reminders}
              onToggleReminder={handleToggleReminder}
              onAddReminder={handleAddReminder}
              onSelectAppointment={(apt) => {
                setSelectedAppointment(apt);
                setCurrentView('agenda');
              }}
              onOpenNewAppointmentModal={() => {
                setPreSelectedStudent(null);
                setIsNewAppointmentOpen(true);
              }}
              onOpenBlockTimeModal={() => setIsBlockTimeOpen(true)}
              onNavigateToAgenda={() => setCurrentView('agenda')}
              onOpenGoogleCalendarModal={() => {
                setCalendarTargetAppointment(null);
                setIsGoogleCalendarModalOpen(true);
              }}
              onOpenWhatsApp8hModal={() => setIsWhatsApp8hModalOpen(true)}
              onNavigateToIntegrations={canViewFinances(currentUser.role) ? () => setCurrentView('integracoes') : undefined}
              onNavigateToSiteAdmin={canViewFinances(currentUser.role) ? () => setCurrentView('site-admin') : undefined}
              onNavigateToPayments={canViewFinances(currentUser.role) ? () => setCurrentView('pagamentos') : undefined}
              onNavigateToTutorialWizard={() => setCurrentView('tutorial-wizard')}
              canManageBusiness={canViewFinances(currentUser.role)}
            />
          )}

          {currentView === 'agenda' && (
            <AgendaView
              appointments={filteredAppointmentsForView}
              services={services}
              currentTeacher={currentTeacher}
              selectedAppointment={selectedAppointment}
              onSelectAppointment={setSelectedAppointment}
              onUpdateAppointmentNotes={handleUpdateAppointmentNotes}
              onCancelAppointment={handleCancelAppointment}
              onReopenAppointment={handleReopenAppointment}
              onDeleteAppointment={handleDeleteAppointment}
              onRescheduleAppointment={(apt) => {
                setReschedulingAppointment(apt);
                setPreSelectedStudent(null);
                setSelectedAppointment(null);
                setIsNewAppointmentOpen(true);
              }}
              onOpenNewAppointmentModal={() => {
                setPreSelectedStudent(null);
                setIsNewAppointmentOpen(true);
              }}
              onOpenGoogleCalendarModal={(apt) => {
                setCalendarTargetAppointment(apt || selectedAppointment || null);
                setIsGoogleCalendarModalOpen(true);
              }}
              onOpenWhatsApp8hModal={() => setIsWhatsApp8hModalOpen(true)}
              waitlist={waitlist}
              onOpenAttendance={setAttendanceSlot}
              onPromoteWaitlistEntry={handlePromoteWaitlistEntry}
              onRemoveWaitlistEntry={handleRemoveWaitlistEntry}
            />
          )}

          {currentView === 'servicos' && (
            <ServicesView
              services={filteredServicesForView}
              onOpenNewServiceModal={() => {
                setEditingService(null);
                setIsServiceModalOpen(true);
              }}
              onEditService={(svc) => {
                setEditingService(svc);
                setIsServiceModalOpen(true);
              }}
              onDuplicateService={handleDuplicateService}
              onDeleteService={handleDeleteService}
              onToggleActive={handleToggleServiceActive}
            />
          )}

          {currentView === 'alunos' && (
            <StudentsView
              students={students}
              onAddStudent={handleAddStudent}
              onSelectStudentToSchedule={handleScheduleForStudent}
              onUpdateStudent={handleUpdateStudent}
            />
          )}

          {currentView === 'pagamentos' && (
            <PaymentsView
              invoices={invoices}
              students={students}
              services={services}
              currentTeacher={currentTeacher}
              onUpdateInvoices={handleUpdateInvoices}
              onUpdateTeacher={(updated) => {
                setCurrentTeacher(updated);
                setTeachers((prev) =>
                  prev.map((t) => (t.id === updated.id ? updated : t))
                );
                supabaseService.saveTeacher(updated);
              }}
            />
          )}

          {currentView === 'usuarios' && (
            <UsersManagementView
              users={isManager ? usersInScope : systemUsers}
              teachers={teachersInScope}
              companies={isManager ? (currentCompany ? [currentCompany] : []) : companies}
              currentRole={currentUser.role}
              quota={accountQuota}
              onOpenPlans={() => setCurrentView('planos')}
              onSaveCompany={canManageCompany(currentUser.role) ? handleSaveCompany : undefined}
              onDeleteCompany={currentUser.role === 'admin' ? handleDeleteCompany : undefined}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onSwitchUser={handleSwitchUser}
            />
          )}

          {currentView === 'portal-aluno' && (
            <StudentPortalView
              currentUser={currentUser}
              currentTeacher={currentTeacher}
              teachers={teachers}
              appointments={allAppointments}
              invoices={allInvoices}
              videos={videos}
              onOpenBookingWizard={() => setCurrentView('public-booking')}
              onOpenWhatsApp={() => {
                const phone = (currentTeacher.whatsapp || '').replace(/\D/g, '');
                if (!phone) return;
                const texto = encodeURIComponent(
                  `Olá ${currentTeacher.name}, aqui é ${currentUser.name || 'seu aluno'}.`
                );
                window.open(`https://wa.me/${phone}?text=${texto}`, '_blank');
              }}
            />
          )}

          {currentView === 'site-admin' && (
            <SiteAdminView
              currentTeacher={currentTeacher}
              testimonials={teacherTestimonials}
              curriculum={teacherCurriculum}
              videos={teacherVideos}
              photos={teacherPhotos}
              faqs={teacherFaqs}
              onUpdateTestimonials={setTestimonials}
              onUpdateCurriculum={setCurriculum}
              onUpdateVideos={setVideos}
              onUpdatePhotos={setPhotos}
              onUpdateFaqs={setFaqs}
              onUpdateTeacher={(updated) => {
                setCurrentTeacher(updated);
                setTeachers((prev) =>
                  prev.map((t) => (t.id === updated.id ? updated : t))
                );
                supabaseService.saveTeacher(updated);
              }}
              services={services}
              onOpenPublicSite={() => setCurrentView('public-landing')}
              activeTab={siteAdminTab}
              onTabChange={setSiteAdminTab}
            />
          )}

          {currentView === 'planos' && <PricingPlansView />}

          {currentView === 'meu-endereco' && (
            <MyAddressView
              currentTeacher={currentTeacher}
              userRole={currentUser.role}
              takenSlugs={teachers.filter((t) => t.id !== currentTeacher.id).map((t) => t.slug || slugify(t.name))}
              company={companies.find((c) => c.id === currentTeacher.companyId) || null}
              onOpenPlans={() => setCurrentView('planos')}
              onUpdateTeacher={(updated) => {
                setCurrentTeacher(updated);
                setTeachers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
                supabaseService.saveTeacher(updated);
              }}
            />
          )}

          {currentView === 'integracoes' && (
            <IntegrationsView
              currentTeacher={currentTeacher}
              services={services}
              appointments={appointments}
              students={students}
              reminders={reminders}
            />
          )}

          {currentView === 'configuracoes' && currentUser.role === 'aluno' && (
            <StudentProfileView
              currentUser={currentUser}
              currentTeacher={currentTeacher}
              onUpdateProfile={handleUpdateOwnProfile}
            />
          )}

          {currentView === 'configuracoes' && currentUser.role !== 'aluno' && (
            <SettingsView
              currentTeacher={currentTeacher}
              onUpdateTeacher={(updated) => {
                setCurrentTeacher(updated);
                setTeachers((prev) =>
                  prev.map((t) => (t.id === updated.id ? updated : t))
                );
                supabaseService.saveTeacher(updated);
              }}
            />
          )}
        </div>
      </div>

      {/* Global Modals */}
      <NewAppointmentModal
        isOpen={isNewAppointmentOpen}
        onClose={() => {
          setIsNewAppointmentOpen(false);
          setPreSelectedStudent(null);
          setReschedulingAppointment(null);
        }}
        services={services}
        students={students}
        onSave={handleSaveNewAppointment}
        preSelectedStudent={preSelectedStudent}
        existingAppointments={appointments}
        editingAppointment={reschedulingAppointment}
        onAddToWaitlist={handleAddToWaitlist}
      />

      <AttendanceModal
        slot={attendanceSlot}
        students={students}
        onClose={() => setAttendanceSlot(null)}
        onSave={handleSaveAttendance}
      />

      <BlockTimeModal
        isOpen={isBlockTimeOpen}
        onClose={() => setIsBlockTimeOpen(false)}
        onBlock={handleBlockTime}
      />

      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => {
          setIsServiceModalOpen(false);
          setEditingService(null);
        }}
        onSave={handleSaveService}
        editingService={editingService}
      />

      <GoogleCalendarModal
        isOpen={isGoogleCalendarModalOpen}
        onClose={() => {
          setIsGoogleCalendarModalOpen(false);
          setCalendarTargetAppointment(null);
        }}
        appointments={appointments}
        teacher={currentTeacher}
        selectedAppointment={calendarTargetAppointment}
      />

      <WhatsAppConfirmationCenterModal
        isOpen={isWhatsApp8hModalOpen}
        onClose={() => setIsWhatsApp8hModalOpen(false)}
        appointments={appointments}
        teacher={currentTeacher}
      />

      {/* Accessibility & Reading Assistance */}
      <ReadingGuide />
      <AccessibilityToolbar />

      {/* Interactive Tour & Tutorial Hub Modals */}
      <InteractiveTourModal
        isOpen={isInteractiveTourOpen}
        onClose={() => setIsInteractiveTourOpen(false)}
        currentView={currentView}
        onNavigate={setCurrentView}
      />

      <OnlineTutorialHubModal
        isOpen={isTutorialHubOpen}
        onClose={() => setIsTutorialHubOpen(false)}
        onNavigate={setCurrentView}
        currentTeacher={currentTeacher}
      />
    </div>
  );
}

export function App() {
  return (
    <AccessibilityProvider>
      <AppInner />
      {/* Aviso global quando uma gravação no Supabase falha (qualquer tela) */}
      <SyncErrorToast />
    </AccessibilityProvider>
  );
}

export default App;

