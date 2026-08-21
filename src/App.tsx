import React, { useState, useEffect } from 'react';
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
  FaqItem
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
  DEFAULT_SITE_FAQS
} from './data/mockData';

import { SideNav } from './components/SideNav';
import { TopAppBar } from './components/TopAppBar';
import { DashboardView } from './components/DashboardView';
import { AgendaView } from './components/AgendaView';
import { ServicesView } from './components/ServicesView';
import { StudentsView } from './components/StudentsView';
import { PricingPlansView } from './components/PricingPlansView';
import { PublicLandingView } from './components/PublicLandingView';
import { PublicBookingWizard } from './components/PublicBookingWizard';
import { SettingsView } from './components/SettingsView';
import { IntegrationsView } from './components/IntegrationsView';
import { SiteAdminView } from './components/SiteAdminView';

import { NewAppointmentModal } from './components/NewAppointmentModal';
import { BlockTimeModal } from './components/BlockTimeModal';
import { ServiceModal } from './components/ServiceModal';
import { GoogleCalendarModal } from './components/GoogleCalendarModal';
import { WhatsAppConfirmationCenterModal } from './components/WhatsAppConfirmationCenterModal';
import { supabaseService } from './services/supabaseService';
import { isSupabaseConfigured } from './lib/supabase';

export function App() {
  // Navigation & View state
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Core domain state
  const [teachers, setTeachers] = useState<TeacherProfile[]>(INITIAL_TEACHER_PROFILES);
  const [currentTeacher, setCurrentTeacher] = useState<TeacherProfile>(INITIAL_TEACHER_PROFILES[0]);
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [reminders, setReminders] = useState<Reminder[]>(INITIAL_REMEMBERS);

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
          setCurrentTeacher(dbTeachers[0]);
        }
        if (dbServices && dbServices.length > 0) {
          setServices(dbServices);
        }
        if (dbAppointments && dbAppointments.length > 0) {
          setAppointments(dbAppointments);
        }
        if (dbStudents && dbStudents.length > 0) {
          setStudents(dbStudents);
        }
        if (dbReminders && dbReminders.length > 0) {
          setReminders(dbReminders);
        }
      } catch (err) {
        console.warn('Fallback para dados locais:', err);
      }
    }

    loadSupabaseData();
  }, []);

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
    setReminders((prev) =>
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
      title,
      dueDate,
      completed: false,
    };
    setReminders((prev) => [newRem, ...prev]);
    supabaseService.saveReminder(newRem, currentTeacher.id);
  };

  // Appointment actions
  const handleSaveNewAppointment = (newApt: Appointment) => {
    setAppointments((prev) => [newApt, ...prev]);
    supabaseService.saveAppointment(newApt, currentTeacher.id);

    // Also add student if not in list
    if (!students.some((s) => s.name.toLowerCase() === newApt.studentName.toLowerCase())) {
      const newStd: Student = {
        id: `std-${Date.now()}`,
        name: newApt.studentName,
        email: newApt.studentEmail || `${newApt.studentName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
        phone: newApt.studentPhone || '(11) 98765-4321',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        joinedDate: 'Novembro 2024',
        totalClasses: 1,
        status: 'Ativo',
        notes: newApt.notes,
        lastClass: 'Hoje',
      };
      setStudents((prev) => [newStd, ...prev]);
      supabaseService.saveStudent(newStd, currentTeacher.id);
    }
  };

  const handleBlockTime = (blocked: Appointment) => {
    setAppointments((prev) => [blocked, ...prev]);
    supabaseService.saveAppointment(blocked, currentTeacher.id);
  };

  const handleUpdateAppointmentNotes = (id: string, notes: string) => {
    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id === id) {
          const updated = { ...apt, notes };
          supabaseService.saveAppointment(updated, currentTeacher.id);
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
    setAppointments((prev) => prev.filter((apt) => apt.id !== id));
    supabaseService.deleteAppointment(id);
    setSelectedAppointment(null);
  };

  // Service actions
  const handleSaveService = (savedService: ServiceItem) => {
    setServices((prev) => {
      const exists = prev.some((s) => s.id === savedService.id);
      if (exists) {
        return prev.map((s) => (s.id === savedService.id ? savedService : s));
      }
      return [savedService, ...prev];
    });
    supabaseService.saveService(savedService, currentTeacher.id);
  };

  const handleDuplicateService = (service: ServiceItem) => {
    const duplicated: ServiceItem = {
      ...service,
      id: `serv-${Date.now()}`,
      name: `${service.name} (Cópia)`,
    };
    setServices((prev) => [duplicated, ...prev]);
    supabaseService.saveService(duplicated, currentTeacher.id);
  };

  const handleDeleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    supabaseService.deleteService(id);
  };

  const handleToggleServiceActive = (id: string) => {
    setServices((prev) =>
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
      joinedDate: 'Novembro 2024',
      totalClasses: 0,
      lastClass: 'Sem aulas ainda',
    };
    setStudents((prev) => [newStudent, ...prev]);
    supabaseService.saveStudent(newStudent, currentTeacher.id);
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
