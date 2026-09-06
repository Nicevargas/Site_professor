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
import { StudentProfileView } from './components/StudentProfileView';
import { hashFromView, viewFromHash } from './utils/routes';
import { formatMonthYearPtBR, toLocalDateKey } from './utils/dates';
import { SyncErrorToast } from './components/SyncErrorToast';
import { MyAddressView } from './components/MyAddressView';
import { resolveTenant, slugify, buildPublicUrl, PLATFORM_HOST } from './utils/tenant';
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
    return 'public-landing';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [siteAdminTab, setSiteAdminTab] = useState<SiteAdminTab>('branding');

  // Multi-user & RBAC System Users State
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(() => {
    try {
      const saved = localStorage.getItem('agenda_prof_system_users');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_SYSTEM_USERS;
  });

  // Empresas / escolas: o perfil principal que agrupa professores
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);

  // Fila de espera das turmas lotadas e a chamada aberta no momento
  const [allWaitlist, setAllWaitlist] = useState<WaitlistEntry[]>(INITIAL_WAITLIST);
  const [attendanceSlot, setAttendanceSlot] = useState<ClassSlot | null>(null);

  // Endereço pedido pelo visitante: caminho, subdomínio ou domínio próprio
  const [tenantRef] = useState(() => resolveTenant(window.location));

  // Core domain state
  const [teachers, setTeachers] = useState<TeacherProfile[]>(INITIAL_TEACHER_PROFILES);
  const [currentTeacher, setCurrentTeacher] = useState<TeacherProfile>(() => {
    try {
      const savedUser = localStorage.getItem('agenda_prof_current_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        const match = INITIAL_TEACHER_PROFILES.find((t) => t.id === u.id || t.email === u.email || t.id === u.teacherId);
        if (match) return match;
        // User custom teacher profile
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
    // Visitante anônimo chegando por um endereço de professor
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
  const [allServices, setAllServices] = useState<ServiceItem[]>(INITIAL_SERVICES);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [allStudents, setAllStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [allReminders, setAllReminders] = useState<Reminder[]>(INITIAL_REMEMBERS);
  const [allInvoices, setAllInvoices] = useState<PaymentInvoice[]>(INITIAL_PAYMENT_INVOICES);

  // Marketing & Public Site Content State
  const [testimonials, setTestimonials] = useState<Testimonial[]>(INITIAL_TESTIMONIALS);
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>(INITIAL_CURRICULUM);
  const [videos, setVideos] = useState<VideoItem[]>(INITIAL_VIDEOS);
  const [photos, setPhotos] = useState<PhotoItem[]>(INITIAL_PHOTOS);
  const [faqs, setFaqs] = useState(DEFAULT_SITE_FAQS);

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

  // A vitrine pedida pelo endereço vence a lista local assim que o banco responde
  useEffect(() => {
    if (tenantRef.mode === 'none' || !isSupabaseConfigured) return;
    let cancelled = false;
    supabaseService.getTeacherByAddress({ slug: tenantRef.slug, domain: tenantRef.domain }).then((found) => {
      if (found && !cancelled) setCurrentTeacher(found);
    });
    return () => { cancelled = true; };
  }, [tenantRef.mode, tenantRef.slug, tenantRef.domain]);

  // Título e prévia de link seguem o professor da vitrine, não um texto fixo no HTML
  useEffect(() => {
    const brand = currentTeacher.brandName || 'Aquagenda';
    document.title = `${currentTeacher.name} | ${currentTeacher.specialty || brand}`;
    const setMeta = (selector: string, attr: string, value: string) => {
      const el = document.head.querySelector(selector);
      if (el) el.setAttribute(attr, value);
    };
    const description = currentTeacher.bio || `Agende aulas com ${currentTeacher.name}.`;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', currentTeacher.name);
    setMeta('meta[property="og:description"]', 'content', description);
    if (currentTeacher.heroImageUrl) setMeta('meta[property="og:image"]', 'content', currentTeacher.heroImageUrl);
    setMeta('meta[property="og:url"]', 'content', buildPublicUrl(
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
    ));
  }, [currentTeacher]);

  // URL: mantém #/rota sincronizada com a tela (botão voltar e links compartilháveis)
  useEffect(() => {
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

        if (dbTeachers && dbTeachers.length > 0) {
          setTeachers(dbTeachers);
          const currentExists = dbTeachers.find((t: TeacherProfile) => t.id === currentTeacher.id);
          const activeTeacher = currentExists || dbTeachers[0];
          setCurrentTeacher(activeTeacher);

          // Segredos de integração (n8n) vivem em integrations_config; só o dono consegue ler
          const integrations = await supabaseService.getIntegrationsConfig(activeTeacher.id);
          if (integrations) {
            setCurrentTeacher((prev) => ({ ...prev, ...integrations }));
          }
        }

        if (dbServices && dbServices.length > 0) setAllServices(dbServices);
        if (dbAppointments && dbAppointments.length > 0) setAllAppointments(dbAppointments);
        if (dbStudents && dbStudents.length > 0) setAllStudents(dbStudents);
        if (dbReminders && dbReminders.length > 0) setAllReminders(dbReminders);
        if (dbInvoices && dbInvoices.length > 0) setAllInvoices(dbInvoices);
        if (dbTestimonials && dbTestimonials.length > 0) setTestimonials(dbTestimonials);
        if (dbCurriculum && dbCurriculum.length > 0) setCurriculum(dbCurriculum);
        if (dbVideos && dbVideos.length > 0) setVideos(dbVideos);
        if (dbPhotos && dbPhotos.length > 0) setPhotos(dbPhotos);
        if (dbFaqs && dbFaqs.length > 0) setFaqs(dbFaqs);
        if (dbCompanies && dbCompanies.length > 0) setCompanies(dbCompanies);
        if (dbWaitlist) setAllWaitlist(dbWaitlist);
        if (dbSystemUsers && dbSystemUsers.length > 0) {
          setSystemUsers(dbSystemUsers);
          localStorage.setItem('agenda_prof_system_users', JSON.stringify(dbSystemUsers));
        }
      } catch (err) {
        console.warn('Could not load from Supabase, using mock local data:', err);
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
      // Só o próprio professor alimenta o perfil público com os dados do seu login
      const updatedProfile: TeacherProfile = {
        ...currentTeacher,
        ...(teacherData || {}),
        id: user.id || currentTeacher.id,
        name: teacherData?.name || user.name || currentTeacher.name,
        email: teacherData?.email || user.email || currentTeacher.email,
        specialty: teacherData?.specialty || currentTeacher.specialty,
        whatsapp: teacherData?.whatsapp || currentTeacher.whatsapp,
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

    if (user.teacherId) {
      const matchingTeacher = teachers.find((t) => t.id === user.teacherId);
      if (matchingTeacher) setCurrentTeacher(matchingTeacher);
    }

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

  // Public views without admin sidebar layout
  if (currentView === 'auth') {
    return (
      <AuthView
        currentTeacher={currentTeacher}
        onLoginSuccess={handleLoginSuccess}
        onBackToPublicSite={() => setCurrentView('public-landing')}
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
        onBackToPublicSite={() => setCurrentView('public-landing')}
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

