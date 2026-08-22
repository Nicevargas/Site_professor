import React, { useState, useEffect, useMemo } from 'react';
import { 
  ViewMode, 
  Appointment, 
  ServiceItem, 
  Student, 
  Reminder, 
  TeacherProfile,
  TestimonialItem,
  CurriculumItem,
  VideoItem,
  PhotoItem,
  FaqItem,
  PaymentInvoice,
  AuthUser
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
  INITIAL_PAYMENT_INVOICES
} from './data/mockData';

import { SideNav } from './components/SideNav';
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

import { NewAppointmentModal } from './components/NewAppointmentModal';
import { BlockTimeModal } from './components/BlockTimeModal';
import { ServiceModal } from './components/ServiceModal';
import { GoogleCalendarModal } from './components/GoogleCalendarModal';
import { WhatsAppConfirmationCenterModal } from './components/WhatsAppConfirmationCenterModal';
import { supabaseService } from './services/supabaseService';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { dispatchAppointmentWebhook, dispatchFormWebhook } from './utils/webhookDispatcher';

export function App() {
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

  // Navigation & View state - defaults to public-landing for visitors, dashboard for logged in
  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem('agenda_prof_current_user');
      if (saved) return 'dashboard';
    } catch {
      // ignore
    }
    return 'public-landing';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Core domain state
  const [teachers, setTeachers] = useState<TeacherProfile[]>(INITIAL_TEACHER_PROFILES);
  const [currentTeacher, setCurrentTeacher] = useState<TeacherProfile>(() => {
    try {
      const savedUser = localStorage.getItem('agenda_prof_current_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        const match = INITIAL_TEACHER_PROFILES.find((t) => t.id === u.id || t.email === u.email);
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
      // ignore
    }
    return INITIAL_TEACHER_PROFILES[0];
  });

  // All domain entities across teachers
  const [allServices, setAllServices] = useState<ServiceItem[]>(INITIAL_SERVICES);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [allStudents, setAllStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [allReminders, setAllReminders] = useState<Reminder[]>(INITIAL_REMEMBERS);
  const [allInvoices, setAllInvoices] = useState<PaymentInvoice[]>(INITIAL_PAYMENT_INVOICES);

  // User-scoped data: Only show data belonging to the current teacher / active user
  const services = useMemo(() => {
    return allServices.filter(
      (s) => s.teacherId === currentTeacher.id || (!s.teacherId && currentTeacher.id === 'prof-roberto')
    );
  }, [allServices, currentTeacher.id]);

  const appointments = useMemo(() => {
    return allAppointments.filter(
      (a) => a.teacherId === currentTeacher.id || (!a.teacherId && currentTeacher.id === 'prof-roberto')
    );
  }, [allAppointments, currentTeacher.id]);

  const students = useMemo(() => {
    return allStudents.filter(
      (st) => st.teacherId === currentTeacher.id || (!st.teacherId && currentTeacher.id === 'prof-roberto')
    );
  }, [allStudents, currentTeacher.id]);

  const reminders = useMemo(() => {
    return allReminders.filter(
      (r) => r.teacherId === currentTeacher.id || (!r.teacherId && currentTeacher.id === 'prof-roberto')
    );
  }, [allReminders, currentTeacher.id]);

  const invoices = useMemo(() => {
    return allInvoices.filter(
      (inv) => inv.teacherId === currentTeacher.id || (!inv.teacherId && currentTeacher.id === 'prof-roberto')
    );
  }, [allInvoices, currentTeacher.id]);

  // Compute delinquent / overdue count for current teacher
  const overdueCount = useMemo(() => {
    return invoices.filter((i) => i.status === 'vencido').length;
  }, [invoices]);

  // Content state for teacher site
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(INITIAL_TESTIMONIALS);
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>(INITIAL_CURRICULUM);
  const [videos, setVideos] = useState<VideoItem[]>(INITIAL_VIDEOS);
  const [photos, setPhotos] = useState<PhotoItem[]>(INITIAL_PHOTOS);
  const [faqs, setFaqs] = useState<FaqItem[]>(DEFAULT_SITE_FAQS);

  // Initial load from Supabase if configured
  useEffect(() => {
    async function loadSupabaseData() {
      if (!isSupabaseConfigured) return;
      try {
        const [dbTeachers, dbServices, dbAppointments, dbStudents, dbReminders] = await Promise.all([
          supabaseService.getTeachers(),
          supabaseService.getServices(),
          supabaseService.getAppointments(),
          supabaseService.getStudents(),
          supabaseService.getReminders(),
        ]);

        if (dbTeachers && dbTeachers.length > 0) {
          setTeachers(dbTeachers);
        }
        if (dbServices && dbServices.length > 0) {
          setAllServices(dbServices);
        }
        if (dbAppointments && dbAppointments.length > 0) {
          setAllAppointments(dbAppointments);
        }
        if (dbStudents && dbStudents.length > 0) {
          setAllStudents(dbStudents);
        }
        if (dbReminders && dbReminders.length > 0) {
          setAllReminders(dbReminders);
        }
      } catch (err) {
        console.warn('Fallback para dados locais:', err);
      }
    }

    loadSupabaseData();
  }, []);

  // Supabase Auth listener & Session restoration
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || currentTeacher.name,
            avatarUrl: currentTeacher.avatarUrl,
            isDemo: false,
          };
          setCurrentUser(authUser);
          localStorage.setItem('agenda_prof_current_user', JSON.stringify(authUser));
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || currentTeacher.name,
            avatarUrl: currentTeacher.avatarUrl,
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

    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    await supabaseService.signOut();
    setCurrentUser(null);
    localStorage.removeItem('agenda_prof_current_user');
    setCurrentView('public-landing');
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
        onBackToDashboard={() => setCurrentView('dashboard')}
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
        onBackToDashboard={() => setCurrentView('dashboard')}
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
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 h-screen overflow-hidden">
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
              onNavigateToIntegrations={() => setCurrentView('integracoes')}
              onNavigateToSiteAdmin={() => setCurrentView('site-admin')}
              onNavigateToPayments={() => setCurrentView('pagamentos')}
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

          {currentView === 'configuracoes' && (
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
    </div>
  );
}

export default App;
