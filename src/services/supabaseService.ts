import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { TeacherProfile, ServiceItem, Appointment, Student, Reminder } from '../types';

export const supabaseService = {
  /**
   * Fetch all teachers or return null if not available
   */
  async getTeachers(): Promise<TeacherProfile[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.from('teachers').select('*').order('name');
      if (error || !data || data.length === 0) return null;
      return data.map((t: any) => ({
        id: t.id,
        name: t.name,
        role: t.role,
        specialty: t.specialty || '',
        bio: t.bio || '',
        whatsapp: t.whatsapp || '',
        email: t.email || '',
        avatarUrl: t.avatar_url || '',
        heroImageUrl: t.hero_image_url || '',
        rating: Number(t.rating || 5.0),
        reviewCount: Number(t.review_count || 128),
        yearsExperience: Number(t.years_experience || 8),
      }));
    } catch (err) {
      console.warn('Erro ao buscar professores no Supabase:', err);
      return null;
    }
  },

  /**
   * Upsert teacher
   */
  async saveTeacher(teacher: TeacherProfile): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('teachers').upsert({
        id: teacher.id,
        name: teacher.name,
        role: teacher.role,
        specialty: teacher.specialty,
        bio: teacher.bio,
        whatsapp: teacher.whatsapp,
        email: teacher.email,
        avatar_url: teacher.avatarUrl,
        hero_image_url: teacher.heroImageUrl,
        rating: teacher.rating,
        review_count: teacher.reviewCount,
        years_experience: teacher.yearsExperience,
        updated_at: new Date().toISOString(),
      });
      return !error;
    } catch (err) {
      console.warn('Erro ao salvar professor no Supabase:', err);
      return false;
    }
  },

  /**
   * Fetch all services
   */
  async getServices(): Promise<ServiceItem[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.from('services').select('*').order('created_at', { ascending: false });
      if (error || !data || data.length === 0) return null;
      return data.map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description || '',
        price: Number(s.price),
        durationMinutes: Number(s.duration_minutes),
        modality: s.modality,
        iconName: s.icon_name || 'school',
        active: Boolean(s.active),
      }));
    } catch (err) {
      console.warn('Erro ao buscar serviços no Supabase:', err);
      return null;
    }
  },

  /**
   * Save or Update a Service
   */
  async saveService(service: ServiceItem, teacherId?: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('services').upsert({
        id: service.id,
        name: service.name,
        description: service.description,
        price: service.price,
        duration_minutes: service.durationMinutes,
        modality: service.modality,
        icon_name: service.iconName,
        active: service.active,
        teacher_id: teacherId || 'teacher-roberto',
      });
      return !error;
    } catch (err) {
      console.warn('Erro ao salvar serviço no Supabase:', err);
      return false;
    }
  },

  /**
   * Delete a Service
   */
  async deleteService(serviceId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('services').delete().eq('id', serviceId);
      return !error;
    } catch (err) {
      return false;
    }
  },

  /**
   * Fetch all appointments
   */
  async getAppointments(): Promise<Appointment[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.from('appointments').select('*').order('date', { ascending: true });
      if (error || !data || data.length === 0) return null;
      return data.map((a: any) => ({
        id: a.id,
        studentName: a.student_name,
        studentInitials: a.student_initials || 'AL',
        studentPhone: a.student_phone,
        studentEmail: a.student_email,
        serviceId: a.service_id,
        serviceName: a.service_name,
        date: a.date,
        dayOfWeek: Number(a.day_of_week || 1),
        startTime: a.start_time,
        endTime: a.end_time,
        durationMinutes: Number(a.duration_minutes || 60),
        modality: a.modality,
        status: a.status,
        notes: a.notes,
        price: Number(a.price || 150),
      }));
    } catch (err) {
      console.warn('Erro ao buscar agendamentos no Supabase:', err);
      return null;
    }
  },

  /**
   * Save or Update an Appointment
   */
  async saveAppointment(apt: Appointment, teacherId?: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('appointments').upsert({
        id: apt.id,
        teacher_id: teacherId || 'teacher-roberto',
        student_name: apt.studentName,
        student_initials: apt.studentInitials,
        student_phone: apt.studentPhone,
        student_email: apt.studentEmail,
        service_id: apt.serviceId,
        service_name: apt.serviceName,
        date: apt.date,
        day_of_week: apt.dayOfWeek,
        start_time: apt.startTime,
        end_time: apt.endTime,
        duration_minutes: apt.durationMinutes,
        modality: apt.modality,
        status: apt.status,
        notes: apt.notes,
        price: apt.price,
      });
      return !error;
    } catch (err) {
      console.warn('Erro ao salvar agendamento no Supabase:', err);
      return false;
    }
  },

  /**
   * Delete an Appointment
   */
  async deleteAppointment(appointmentId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('appointments').delete().eq('id', appointmentId);
      return !error;
    } catch (err) {
      return false;
    }
  },

  /**
   * Fetch all students
   */
  async getStudents(): Promise<Student[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.from('students').select('*').order('name');
      if (error || !data || data.length === 0) return null;
      return data.map((s: any) => ({
        id: s.id,
        name: s.name,
        email: s.email || '',
        phone: s.phone || '',
        avatar: s.avatar || '',
        joinedDate: s.joined_date || '',
        totalClasses: Number(s.total_classes || 0),
        lastClass: s.last_class || '',
        status: s.status || 'Ativo',
        notes: s.notes || '',
      }));
    } catch (err) {
      console.warn('Erro ao buscar alunos no Supabase:', err);
      return null;
    }
  },

  /**
   * Save or Update a Student
   */
  async saveStudent(student: Student, teacherId?: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('students').upsert({
        id: student.id,
        teacher_id: teacherId || 'teacher-roberto',
        name: student.name,
        email: student.email,
        phone: student.phone,
        avatar: student.avatar,
        joined_date: student.joinedDate,
        total_classes: student.totalClasses,
        last_class: student.lastClass,
        status: student.status,
        notes: student.notes,
      });
      return !error;
    } catch (err) {
      console.warn('Erro ao salvar aluno no Supabase:', err);
      return false;
    }
  },

  /**
   * Fetch all reminders
   */
  async getReminders(): Promise<Reminder[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.from('reminders').select('*').order('created_at', { ascending: false });
      if (error || !data || data.length === 0) return null;
      return data.map((r: any) => ({
        id: r.id,
        title: r.title,
        dueDate: r.due_date,
        completed: Boolean(r.completed),
      }));
    } catch (err) {
      console.warn('Erro ao buscar lembretes no Supabase:', err);
      return null;
    }
  },

  /**
   * Save or Update a Reminder
   */
  async saveReminder(reminder: Reminder, teacherId?: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('reminders').upsert({
        id: reminder.id,
        teacher_id: teacherId || 'teacher-roberto',
        title: reminder.title,
        due_date: reminder.dueDate,
        completed: reminder.completed,
      });
      return !error;
    } catch (err) {
      return false;
    }
  },

  /**
   * Seed all initial data to Supabase (Initial Provisioning)
   */
  async seedAllData(
    teachers: TeacherProfile[],
    services: ServiceItem[],
    appointments: Appointment[],
    students: Student[],
    reminders: Reminder[]
  ): Promise<{ success: boolean; message: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        message: 'Supabase não está configurado. Preencha as credenciais em .env',
      };
    }

    try {
      // 1. Teachers
      for (const t of teachers) {
        await supabase.from('teachers').upsert({
          id: t.id,
          name: t.name,
          role: t.role,
          specialty: t.specialty,
          bio: t.bio,
          whatsapp: t.whatsapp,
          email: t.email,
          avatar_url: t.avatarUrl,
          hero_image_url: t.heroImageUrl,
          rating: t.rating,
          review_count: t.reviewCount,
          years_experience: t.yearsExperience,
        });
      }

      // 2. Services
      for (const s of services) {
        await supabase.from('services').upsert({
          id: s.id,
          teacher_id: 'teacher-roberto',
          name: s.name,
          description: s.description,
          price: s.price,
          duration_minutes: s.durationMinutes,
          modality: s.modality,
          icon_name: s.iconName,
          active: s.active,
        });
      }

      // 3. Students
      for (const st of students) {
        await supabase.from('students').upsert({
          id: st.id,
          teacher_id: 'teacher-roberto',
          name: st.name,
          email: st.email,
          phone: st.phone,
          avatar: st.avatar,
          joined_date: st.joinedDate,
          total_classes: st.totalClasses,
          last_class: st.lastClass,
          status: st.status,
          notes: st.notes,
        });
      }

      // 4. Appointments
      for (const a of appointments) {
        await supabase.from('appointments').upsert({
          id: a.id,
          teacher_id: 'teacher-roberto',
          student_name: a.studentName,
          student_initials: a.studentInitials,
          student_phone: a.studentPhone,
          student_email: a.studentEmail,
          service_id: a.serviceId,
          service_name: a.serviceName,
          date: a.date,
          day_of_week: a.dayOfWeek,
          start_time: a.startTime,
          end_time: a.endTime,
          duration_minutes: a.durationMinutes,
          modality: a.modality,
          status: a.status,
          notes: a.notes,
          price: a.price,
        });
      }

      // 5. Reminders
      for (const r of reminders) {
        await supabase.from('reminders').upsert({
          id: r.id,
          teacher_id: 'teacher-roberto',
          title: r.title,
          due_date: r.dueDate,
          completed: r.completed,
        });
      }

      return {
        success: true,
        message: 'Dados sincronizados com o Supabase com sucesso!',
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Erro ao sincronizar dados: ${err.message || err}`,
      };
    }
  },

  /**
   * Fetch Invoices
   */
  async getInvoices(): Promise<any[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
      if (error || !data || data.length === 0) return null;
      return data;
    } catch {
      return null;
    }
  },

  /**
   * Fetch Testimonials
   */
  async getTestimonials(): Promise<any[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.from('testimonials').select('*');
      if (error || !data || data.length === 0) return null;
      return data;
    } catch {
      return null;
    }
  },

  /**
   * Fetch Curriculum
   */
  async getCurriculum(): Promise<any[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.from('curriculum').select('*');
      if (error || !data || data.length === 0) return null;
      return data;
    } catch {
      return null;
    }
  },

  /**
   * Fetch Videos
   */
  async getVideos(): Promise<any[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.from('videos').select('*');
      if (error || !data || data.length === 0) return null;
      return data;
    } catch {
      return null;
    }
  },

  /**
   * Fetch Photos
   */
  async getPhotos(): Promise<any[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.from('photos').select('*');
      if (error || !data || data.length === 0) return null;
      return data;
    } catch {
      return null;
    }
  },

  /**
   * Fetch FAQs
   */
  async getFaqs(): Promise<any[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.from('faqs').select('*');
      if (error || !data || data.length === 0) return null;
      return data;
    } catch {
      return null;
    }
  },

  /**
   * ==========================================
   * SUPABASE AUTHENTICATION METHODS
   * ==========================================
   */

  /**
   * Sign In with Email & Password
   */
  async signIn(email: string, password: string):Promise<{ data: any; error: string | null }> {
    if (!isSupabaseConfigured || !supabase) {
      return { data: null, error: 'Supabase não configurado. Use o modo de teste.' };
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        let translatedError = error.message;
        if (error.message.includes('Invalid login credentials')) {
          translatedError = 'E-mail ou senha incorretos.';
        } else if (error.message.includes('Email not confirmed')) {
          translatedError = 'E-mail ainda não confirmado. Verifique sua caixa de entrada.';
        }
        return { data: null, error: translatedError };
      }
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Falha ao autenticar usuário.' };
    }
  },

  /**
   * Sign Up with Email & Password & Full Name
   */
  async signUp(email: string, password: string, fullName?: string): Promise<{ data: any; error: string | null }> {
    if (!isSupabaseConfigured || !supabase) {
      return { data: null, error: 'Supabase não configurado. Use o modo de teste.' };
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || '',
          },
        },
      });
      if (error) {
        let translatedError = error.message;
        if (error.message.includes('already registered')) {
          translatedError = 'Este e-mail já está cadastrado. Tente entrar.';
        } else if (error.message.includes('Password should be at least')) {
          translatedError = 'A senha deve ter no mínimo 6 caracteres.';
        }
        return { data: null, error: translatedError };
      }
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Falha ao cadastrar usuário.' };
    }
  },

  /**
   * Reset password via email
   */
  async resetPassword(email: string): Promise<{ error: string | null }> {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Supabase não configurado. Use o modo de teste.' };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Erro ao enviar e-mail de recuperação.' };
    }
  },

  /**
   * Sign Out
   */
  async signOut(): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return true;
    try {
      const { error } = await supabase.auth.signOut();
      return !error;
    } catch (err) {
      console.warn('Erro ao deslogar:', err);
      return false;
    }
  },

  /**
   * Get current session / user
   */
  async getCurrentUser() {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data } = await supabase.auth.getUser();
      return data.user;
    } catch {
      return null;
    }
  },
};
