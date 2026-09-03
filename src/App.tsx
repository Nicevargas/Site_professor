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
  SiteAdminTab
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
  INITIAL_SYSTEM_USERS
} from './data/mockData';

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
import { canAccessView, getDefaultView, canSwitchProfiles, canViewFinances, sanitizeSelfDeclaredRole } from './utils/permissions';
import { StudentProfileView } from './components/StudentProfileView';
import { hashFromView, viewFromHash } from './utils/routes';


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
        return {
          ...INITIAL_TEACHER_PROFILES[0],
          id: u.id,
          name: u.name,
          email: u.email,
        };
      }
    } catch {
      // fallback
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

  const invoices = useMemo(() => {
    return allInvoices.filter(inv => !inv.teacherId || inv.teacherId === currentTeacher.id);
  }, [allInvoices, currentTeacher.id]);

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
    if (!canAccessView(currentUser.role, currentView)) {
      setCurrentView(getDefaultView(currentUser.role));
    }
  }, [currentUser, currentView]);

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
          dbFaqs
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
        ]);

        if (dbTeachers && dbTeachers.length > 0) {
          setTeachers(dbTeachers);
          const currentExists = dbTeachers.find((t: TeacherProfile) => t.id === currentTeacher.id);
          if (currentExists) {
            setCurrentTeacher(currentExists);
          } else {
            setCurrentTeacher(dbTeachers[0]);
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
  const handleAddUser = (newUserData: Omit<SystemUser, 'id' | 'createdAt'>) => {
    const newUser: SystemUser = {
      ...newUserData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setSystemUsers((prev) => {
      const updated = [newUser, ...prev];
      localStorage.setItem('agenda_prof_system_users', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateUser = (id: string, updates: Partial<SystemUser>) => {
    setSystemUsers((prev) => {
      const updated = prev.map((u) => (u.id === id ? { ...u, ...updates } : u));
      localStorage.setItem('agenda_prof_system_users', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteUser = (id: string) => {
    setSystemUsers((prev) => {
      const updated = prev.filter((u) => u.id !== id);
      localStorage.setItem('agenda_prof_system_users', JSON.stringify(updated));
      return updated;
    });
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
      supabaseService.saveSystemUser({
        id: updatedUser.id,
        name: updatedUser.name || '',
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        avatarUrl: updatedUser.avatarUrl,
        teacherId: updatedUser.teacherId,
        studentId: updatedUser.studentId,
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
  const [bookingServiceId, setBookingServiceId] = useState<string | undefined>(undefined);

  // Reminder toggles
  const handleToggleReminder = (id: string) => {
    setAllReminders((prev) =>
      prev.map((rem) => {
        if (rem.id === id) {
          const updated = { ...rem, completed: !rem.completed };
          supabaseService.saveReminder(updated, currentTeacher.id);
          return updated;
        }
        return rem;
      })
    );
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
    setAllAppointments((prev) => [scopedApt, ...prev]);
    supabaseService.saveAppointment(scopedApt, currentTeacher.id);

    // Background Webhook dispatch to n8n / integration server
    dispatchAppointmentWebhook(scopedApt, currentTeacher, 'created');

    // Also add student if not in list
    if (!allStudents.some((s) => s.name.toLowerCase() === scopedApt.studentName.toLowerCase() && s.teacherId === currentTeacher.id)) {
      const newStd: Student = {
        id: `std-${Date.now()}`,
        teacherId: currentTeacher.id,
        name: scopedApt.studentName,
        email: scopedApt.studentEmail || `${scopedApt.studentName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
        phone: scopedApt.studentPhone || '(11) 98765-4321',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        joinedDate: 'Novembro 2024',
        totalClasses: 1,
        status: 'Ativo',
        notes: scopedApt.notes,
        lastClass: 'Hoje',
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
    setAllAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id === id) {
          const updated = { ...apt, notes };
          supabaseService.saveAppointment(updated, currentTeacher.id);
          dispatchAppointmentWebhook(updated, currentTeacher, 'updated');
          return updated;
        }
        return apt;
      })
    );
    if (selectedAppointment && selectedAppointment.id === id) {
      setSelectedAppointment({ ...selectedAppointment, notes });
    }
  };

  const handleCancelAppointment = (id: string) => {
    const target = allAppointments.find((a) => a.id === id);
    if (target) {
      dispatchAppointmentWebhook({ ...target, status: 'Cancelado' }, currentTeacher, 'cancelled');
    }
    setAllAppointments((prev) => prev.filter((apt) => apt.id !== id));
    supabaseService.deleteAppointment(id);
    setSelectedAppointment(null);
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
      joinedDate: 'Novembro 2024',
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
        testimonials={testimonials}
        curriculum={curriculum}
        videos={videos}
        photos={photos}
        faqs={faqs}
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
        onBookingComplete={handleBookingCompleted}
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
  if (!canAccessView(currentUser.role, currentView)) {
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
          teachers={teachers}
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
          {currentView === 'dashboard' && (
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
              onRescheduleAppointment={(apt) => {
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
            />
          )}

          {currentView === 'pagamentos' && (
            <PaymentsView
              invoices={invoices}
              students={students}
              services={services}
              currentTeacher={currentTeacher}
              onUpdateInvoices={setAllInvoices}
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
              users={systemUsers}
              currentTeacher={currentTeacher}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onSwitchSession={handleSwitchUser}
            />
          )}

          {currentView === 'portal-aluno' && (
            <StudentPortalView
              currentUser={currentUser}
              currentTeacher={currentTeacher}
              appointments={appointments}
              invoices={invoices}
              videos={videos}
              onOpenBookingWizard={() => setCurrentView('public-booking')}
              onOpenPublicSite={() => setCurrentView('public-landing')}
            />
          )}

          {currentView === 'site-admin' && (
            <SiteAdminView
              currentTeacher={currentTeacher}
              testimonials={testimonials}
              curriculum={curriculum}
              videos={videos}
              photos={photos}
              faqs={faqs}
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
        }}
        services={services}
        students={students}
        onSave={handleSaveNewAppointment}
        preSelectedStudent={preSelectedStudent}
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
    </AccessibilityProvider>
  );
}

export default App;

