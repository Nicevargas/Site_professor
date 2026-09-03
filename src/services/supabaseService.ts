import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { syncResult, reportSyncError } from '../utils/syncNotifier';
import { TeacherProfile, ServiceItem, Appointment, Student, Reminder, PaymentInvoice, TestimonialItem, CurriculumItem, PhotoItem, FaqItem } from '../types';

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
        role: t.role || 'professor',
        specialty: t.specialty || '',
        bio: t.bio || '',
        whatsapp: t.whatsapp || '',
        email: t.email || '',
        avatarUrl: t.avatar_url || '',
        heroImageUrl: t.hero_image_url || '',
        rating: Number(t.rating || 5.0),
        reviewCount: Number(t.review_count || 128),
        yearsExperience: Number(t.years_experience || 8),
        // Identidade visual
        brandName: t.brand_name || undefined,
        logoUrl: t.logo_url || undefined,
        showLogo: t.show_logo ?? true,
        primaryColor: t.primary_color || undefined,
        secondaryColor: t.secondary_color || undefined,
        accentColor: t.accent_color || undefined,
        themePreset: t.theme_preset || undefined,
        // Recebimento (Pix)
        pixKey: t.pix_key || undefined,
        pixKeyType: t.pix_key_type || undefined,
        pixReceiverName: t.pix_receiver_name || undefined,
        pixBankName: t.pix_bank_name || undefined,
        defaultPaymentGateway: t.default_payment_gateway || undefined,
        whatsappAutoReminder8h: t.whatsapp_auto_reminder_8h ?? true,
        vacationMode: t.vacation_mode && typeof t.vacation_mode === 'object' ? t.vacation_mode : undefined,
      }));
    } catch (err) {
      console.warn('Erro ao buscar professores no Supabase:', err);
      return null;
    }
  },

  /**
   * Segredos de integração (n8n) ficam em integrations_config, visível só ao dono do tenant.
   */
  async getIntegrationsConfig(teacherId: string): Promise<Partial<TeacherProfile> | null> {
    if (!isSupabaseConfigured || !supabase || !teacherId) return null;
    try {
      const { data, error } = await supabase
        .from('integrations_config')
        .select('webhook_url, whatsapp_api_token, whatsapp_auto_reminder_8h')
        .eq('teacher_id', teacherId)
        .limit(1);
      if (error || !data || data.length === 0) return null;
      const row = data[0];
      return {
        n8nWebhookUrl: row.webhook_url || undefined,
        n8nAuthToken: row.whatsapp_api_token || undefined,
        whatsappAutoReminder8h: row.whatsapp_auto_reminder_8h ?? true,
      };
    } catch {
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
        role: teacher.role || 'professor',
        specialty: teacher.specialty || '',
        bio: teacher.bio || '',
        whatsapp: teacher.whatsapp || '',
        email: teacher.email || '',
        avatar_url: teacher.avatarUrl || '',
        hero_image_url: teacher.heroImageUrl || '',
        rating: teacher.rating || 5.0,
        review_count: teacher.reviewCount ?? 0,
        years_experience: teacher.yearsExperience ?? 0,
        // Identidade visual
        brand_name: teacher.brandName || null,
        logo_url: teacher.logoUrl || null,
        show_logo: teacher.showLogo ?? true,
        primary_color: teacher.primaryColor || '#00687a',
        secondary_color: teacher.secondaryColor || '#57dffe',
        accent_color: teacher.accentColor || '#004e5c',
        theme_preset: teacher.themePreset || 'ocean',
        // Recebimento (Pix)
        pix_key: teacher.pixKey || null,
        pix_key_type: teacher.pixKeyType || 'email',
        pix_receiver_name: teacher.pixReceiverName || null,
        pix_bank_name: teacher.pixBankName || null,
        default_payment_gateway: teacher.defaultPaymentGateway || 'pix',
        whatsapp_auto_reminder_8h: teacher.whatsappAutoReminder8h ?? true,
        vacation_mode: teacher.vacationMode || { enabled: false },
        updated_at: new Date().toISOString(),
      });
      if (!syncResult(error, 'perfil do professor')) return false;

      // Segredos do n8n nunca vão para a tabela pública teachers
      if (teacher.n8nWebhookUrl || teacher.n8nAuthToken) {
        const { error: integError } = await supabase.from('integrations_config').upsert({
          id: `integ-${teacher.id}`,
          teacher_id: teacher.id,
          webhook_url: teacher.n8nWebhookUrl || null,
          whatsapp_api_token: teacher.n8nAuthToken || null,
          whatsapp_auto_reminder_8h: teacher.whatsappAutoReminder8h ?? true,
          updated_at: new Date().toISOString(),
        });
        if (integError) console.warn('Erro ao salvar integrações no Supabase:', integError.message);
      }
      return true;
    } catch (err) {
      console.warn('Erro ao salvar professor no Supabase:', err);
      reportSyncError('perfil do professor', err);
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
        teacherId: s.teacher_id || undefined,
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
        description: service.description || '',
        price: service.price || 0,
        duration_minutes: service.durationMinutes || 60,
        modality: service.modality || 'Online / Presencial',
        icon_name: service.iconName || 'school',
        active: service.active ?? true,
        teacher_id: teacherId || 'prof-roberto',
      });
      return syncResult(error, 'serviço');
    } catch (err) {
      console.warn('Erro ao salvar serviço no Supabase:', err);
      reportSyncError('serviço', err);
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
      return syncResult(error, 'exclusão do serviço');
    } catch (err) {
      reportSyncError('exclusão do serviço', err);
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
        teacherId: a.teacher_id || undefined,
        studentName: a.student_name,
        studentInitials: a.student_initials || 'AL',
        studentPhone: a.student_phone || '',
        studentEmail: a.student_email || '',
        serviceId: a.service_id,
        serviceName: a.service_name,
        date: a.date,
        dayOfWeek: Number(a.day_of_week || 1),
        startTime: a.start_time,
        endTime: a.end_time,
        durationMinutes: Number(a.duration_minutes || 60),
        modality: a.modality,
        status: a.status || 'Confirmado',
        notes: a.notes || '',
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
        teacher_id: teacherId || 'prof-roberto',
        student_name: apt.studentName,
        student_initials: apt.studentInitials || 'AL',
        student_phone: apt.studentPhone || '',
        student_email: apt.studentEmail || '',
        service_id: apt.serviceId || null,
        service_name: apt.serviceName,
        date: apt.date,
        day_of_week: apt.dayOfWeek || 1,
        start_time: apt.startTime,
        end_time: apt.endTime,
        duration_minutes: apt.durationMinutes || 60,
        modality: apt.modality || 'Online (Google Meet)',
        status: apt.status || 'Confirmado',
        notes: apt.notes || '',
        price: apt.price || 150,
      });
      return syncResult(error, 'agendamento');
    } catch (err) {
      console.warn('Erro ao salvar agendamento no Supabase:', err);
      reportSyncError('agendamento', err);
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
      return syncResult(error, 'exclusão do agendamento');
    } catch (err) {
      reportSyncError('exclusão do agendamento', err);
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
        teacherId: s.teacher_id || undefined,
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
        teacher_id: teacherId || 'prof-roberto',
        name: student.name,
        email: student.email || '',
        phone: student.phone || '',
        avatar: student.avatar || '',
        joined_date: student.joinedDate || new Date().toISOString().split('T')[0],
        total_classes: student.totalClasses || 0,
        last_class: student.lastClass || '',
        status: student.status || 'Ativo',
        notes: student.notes || '',
      });
      return syncResult(error, 'aluno');
    } catch (err) {
      console.warn('Erro ao salvar aluno no Supabase:', err);
      reportSyncError('aluno', err);
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
        teacherId: r.teacher_id || undefined,
        title: r.title,
        dueDate: r.due_date,
        completed: Boolean(r.completed),
        delayed: Boolean(r.delayed),
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
        teacher_id: teacherId || 'prof-roberto',
        title: reminder.title,
        due_date: reminder.dueDate || new Date().toISOString().split('T')[0],
        completed: Boolean(reminder.completed),
        delayed: Boolean(reminder.delayed),
      });
      return syncResult(error, 'lembrete');
    } catch (err) {
      reportSyncError('lembrete', err);
      return false;
    }
  },

  /**
   * Fetch Invoices / Payments
   */
  async getInvoices(): Promise<PaymentInvoice[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      // Direct query to payments table to avoid view column aliasing discrepancies
      const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
      if (error || !data || data.length === 0) return null;
      return data.map((p: any) => ({
        id: p.id,
        teacherId: p.teacher_id,
        studentId: p.student_id,
        studentName: p.student_name,
        studentPhone: p.student_phone,
        studentEmail: p.student_email,
        studentInitials: p.student_initials || 'AL',
        serviceOrPlanName: p.service_or_plan_name,
        amount: Number(p.amount || 0),
        dueDate: p.due_date,
        paidAt: p.paid_at,
        status: p.status || 'pendente',
        method: p.method || 'pix',
        pixCode: p.pix_code,
        qrCodeBase64: p.qr_code_base64,
        paymentLinkUrl: p.payment_link_url,
        installments: p.installments,
        notes: p.notes,
        createdAt: p.created_at,
      }));
    } catch (err) {
      console.warn('Erro ao buscar cobranças no Supabase:', err);
      return null;
    }
  },

  /**
   * Save or Update a Payment / Invoice
   */
  async saveInvoice(invoice: PaymentInvoice, teacherId?: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('payments').upsert({
        id: invoice.id,
        teacher_id: teacherId || invoice.teacherId || 'prof-roberto',
        student_id: invoice.studentId || null,
        student_name: invoice.studentName,
        student_phone: invoice.studentPhone || '',
        student_email: invoice.studentEmail || '',
        student_initials: invoice.studentInitials || 'AL',
        service_or_plan_name: invoice.serviceOrPlanName,
        amount: invoice.amount,
        due_date: invoice.dueDate,
        paid_at: invoice.paidAt || null,
        status: invoice.status || 'pendente',
        method: invoice.method || 'pix',
        pix_code: invoice.pixCode || '',
        qr_code_base64: invoice.qrCodeBase64 || '',
        payment_link_url: invoice.paymentLinkUrl || '',
        installments: invoice.installments || '',
        notes: invoice.notes || '',
        updated_at: new Date().toISOString(),
      });
      return syncResult(error, 'cobrança');
    } catch (err) {
      console.warn('Erro ao salvar cobrança no Supabase:', err);
      reportSyncError('cobrança', err);
      return false;
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
      return data.map((t: any) => ({
        id: t.id,
        teacherId: t.teacher_id || undefined,
        studentName: t.student_name,
        roleOrCourse: t.role_or_course,
        avatarUrl: t.avatar_url,
        rating: Number(t.rating || 5.0),
        content: t.content,
        date: t.date,
        verified: Boolean(t.verified),
        featured: Boolean(t.featured),
      }));
    } catch {
      return null;
    }
  },

  /**
   * Fetch Curriculum (curriculum_items table)
   */
  async getCurriculum(): Promise<any[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.from('curriculum_items').select('*');
      if (error || !data || data.length === 0) return null;
      return data.map((c: any) => ({
        id: c.id,
        teacherId: c.teacher_id || undefined,
        title: c.title,
        institution: c.institution,
        period: c.period,
        category: c.category || 'education',
        description: c.description,
        skills: c.skills || [],
      }));
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
      return data.map((v: any) => ({
        id: v.id,
        teacherId: v.teacher_id || undefined,
        title: v.title,
        mediaType: v.media_type,
        category: v.category,
        videoUrl: v.video_url,
        thumbnailUrl: v.thumbnail_url,
        duration: v.duration,
        description: v.description,
        featured: Boolean(v.featured),
        active: v.active !== undefined ? Boolean(v.active) : true,
        spotifyUrl: v.spotify_url,
        audioUrl: v.audio_url,
        episodeNumber: v.episode_number,
        speakerOrGuest: v.speaker_or_guest,
        publishDate: v.publish_date,
        tags: v.tags || [],
      }));
    } catch {
      return null;
    }
  },

  /**
   * Save or Update a Video
   */
  async saveVideo(video: any, teacherId?: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('videos').upsert({
        id: video.id,
        teacher_id: teacherId || video.teacherId || 'prof-roberto',
        title: video.title,
        media_type: video.mediaType || 'institucional',
        category: video.category || 'Geral',
        video_url: video.videoUrl,
        thumbnail_url: video.thumbnailUrl || '',
        duration: video.duration || '05:00',
        description: video.description || '',
        featured: Boolean(video.featured),
        active: video.active !== undefined ? Boolean(video.active) : true,
        spotify_url: video.spotifyUrl || null,
        audio_url: video.audioUrl || null,
        episode_number: video.episodeNumber || null,
        speaker_or_guest: video.speakerOrGuest || null,
        publish_date: video.publishDate || null,
        tags: video.tags || [],
        updated_at: new Date().toISOString(),
      });
      return syncResult(error, 'vídeo');
    } catch (err) {
      console.warn('Erro ao salvar vídeo no Supabase:', err);
      reportSyncError('vídeo', err);
      return false;
    }
  },

  /**
   * Delete a Video
   */
  async deleteVideo(id: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('videos').delete().eq('id', id);
      return syncResult(error, 'exclusão do vídeo');
    } catch {
      reportSyncError('exclusão do vídeo', 'falha de rede ou de conexão');
      return false;
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
      return data.map((p: any) => ({
        id: p.id,
        teacherId: p.teacher_id || undefined,
        title: p.title,
        category: p.category,
        imageUrl: p.image_url,
        caption: p.caption,
        date: p.date,
      }));
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
      return data.map((f: any) => ({
        id: f.id,
        teacherId: f.teacher_id || undefined,
        question: f.question,
        answer: f.answer,
        category: f.category,
        featured: Boolean(f.featured),
      }));
    } catch {
      return null;
    }
  },

  /**
   * Depoimentos: gravar / remover
   */
  async saveTestimonial(item: TestimonialItem, teacherId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('testimonials').upsert({
        id: item.id,
        teacher_id: teacherId || item.teacherId || null,
        student_name: item.studentName,
        role_or_course: item.roleOrCourse || '',
        avatar_url: item.avatarUrl || '',
        rating: item.rating ?? 5,
        content: item.content,
        date: item.date || '',
        verified: item.verified ?? true,
        featured: Boolean(item.featured),
        updated_at: new Date().toISOString(),
      });
      return syncResult(error, 'depoimento');
    } catch (err) {
      console.warn('Erro ao salvar depoimento no Supabase:', err);
      reportSyncError('depoimento', err);
      return false;
    }
  },

  async deleteTestimonial(id: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('testimonials').delete().eq('id', id);
      return syncResult(error, 'exclusão do depoimento');
    } catch {
      reportSyncError('exclusão do depoimento', 'falha de rede ou de conexão');
      return false;
    }
  },

  /**
   * Currículo: gravar / remover
   */
  async saveCurriculumItem(item: CurriculumItem, teacherId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('curriculum_items').upsert({
        id: item.id,
        teacher_id: teacherId || item.teacherId || null,
        title: item.title,
        institution: item.institution || '',
        period: item.period || '',
        category: item.category || 'education',
        description: item.description || '',
        skills: item.skills || [],
        updated_at: new Date().toISOString(),
      });
      return syncResult(error, 'item do currículo');
    } catch (err) {
      console.warn('Erro ao salvar item do currículo no Supabase:', err);
      reportSyncError('item do currículo', err);
      return false;
    }
  },

  async deleteCurriculumItem(id: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('curriculum_items').delete().eq('id', id);
      return syncResult(error, 'exclusão do item do currículo');
    } catch {
      reportSyncError('exclusão do item do currículo', 'falha de rede ou de conexão');
      return false;
    }
  },

  /**
   * Fotos: gravar / remover
   */
  async savePhoto(item: PhotoItem, teacherId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('photos').upsert({
        id: item.id,
        teacher_id: teacherId || item.teacherId || null,
        title: item.title,
        category: item.category || 'aulas',
        image_url: item.imageUrl,
        caption: item.caption || '',
        date: item.date || null,
        updated_at: new Date().toISOString(),
      });
      return syncResult(error, 'foto');
    } catch (err) {
      console.warn('Erro ao salvar foto no Supabase:', err);
      reportSyncError('foto', err);
      return false;
    }
  },

  async deletePhoto(id: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('photos').delete().eq('id', id);
      return syncResult(error, 'exclusão da foto');
    } catch {
      reportSyncError('exclusão da foto', 'falha de rede ou de conexão');
      return false;
    }
  },

  /**
   * Perguntas frequentes: gravar / remover
   */
  async saveFaq(item: FaqItem, teacherId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('faqs').upsert({
        id: item.id,
        teacher_id: teacherId || item.teacherId || null,
        question: item.question,
        answer: item.answer,
        category: item.category || 'geral',
        featured: Boolean(item.featured),
        updated_at: new Date().toISOString(),
      });
      return syncResult(error, 'pergunta do FAQ');
    } catch (err) {
      console.warn('Erro ao salvar pergunta no Supabase:', err);
      reportSyncError('pergunta do FAQ', err);
      return false;
    }
  },

  async deleteFaq(id: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('faqs').delete().eq('id', id);
      return syncResult(error, 'exclusão da pergunta do FAQ');
    } catch {
      reportSyncError('exclusão da pergunta do FAQ', 'falha de rede ou de conexão');
      return false;
    }
  },

  /**
   * Fetch System Users (RBAC)
   */
  async getSystemUsers(): Promise<any[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.from('system_users').select('*').order('name');
      if (error || !data) return null;
      return data;
    } catch (err) {
      console.warn('Erro ao buscar usuários do sistema:', err);
      return null;
    }
  },

  /**
   * Find System User by Email or Username across system_users, teachers, and students
   */
  async findUserByEmail(email: string): Promise<any | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const clean = email.trim().toLowerCase();
      if (!clean) return null;

      // 1. Check in `system_users`
      try {
        let query = supabase.from('system_users').select('*');
        if (clean.includes('@')) {
          query = query.ilike('email', clean);
        } else {
          query = query.or(`email.ilike.${clean}@%,email.ilike.${clean},name.ilike.%${clean}%,id.ilike.%${clean}%`);
        }
        const { data, error } = await query.limit(1);
        if (!error && data && data.length > 0) {
          return data[0];
        }
      } catch (e) {
        console.warn('Busca em system_users gerou aviso:', e);
      }

      // 2. Check in `teachers` table
      try {
        let tQuery = supabase.from('teachers').select('*');
        if (clean.includes('@')) {
          tQuery = tQuery.ilike('email', clean);
        } else {
          tQuery = tQuery.or(`email.ilike.${clean}@%,email.ilike.${clean},name.ilike.%${clean}%,id.ilike.%${clean}%`);
        }
        const { data: teacherData, error: tError } = await tQuery.limit(1);
        if (!tError && teacherData && teacherData.length > 0) {
          const teacher = teacherData[0];
          // Um registro em `teachers` só prova que a pessoa é professora; admin nunca é inferido pelo e-mail
          const assignedRole = 'professor';
          const sysUser = {
            id: `user-prof-${teacher.id}`,
            name: teacher.name,
            email: teacher.email || (clean.includes('@') ? clean : `${clean}@agendaprofessor.com.br`),
            role: assignedRole,
            avatar_url: teacher.avatar_url,
            teacher_id: teacher.id,
            status: 'ativo',
            permissions: ['manage_own_agenda', 'manage_own_services', 'manage_own_students', 'manage_own_finances'],
          };

          // Background auto-sync into system_users
          supabase.from('system_users').upsert(sysUser).then();
          return sysUser;
        }
      } catch (e) {
        console.warn('Busca em teachers gerou aviso:', e);
      }

      // 3. Check in `students` table
      try {
        let sQuery = supabase.from('students').select('*');
        if (clean.includes('@')) {
          sQuery = sQuery.ilike('email', clean);
        } else {
          sQuery = sQuery.or(`email.ilike.${clean}@%,email.ilike.${clean},name.ilike.%${clean}%,id.ilike.%${clean}%`);
        }
        const { data: studentData, error: sError } = await sQuery.limit(1);
        if (!sError && studentData && studentData.length > 0) {
          const student = studentData[0];
          const sysUser = {
            id: `user-std-${student.id}`,
            name: student.name,
            email: student.email || (clean.includes('@') ? clean : `${clean}@aluno.com.br`),
            role: 'aluno',
            avatar_url: student.avatar,
            student_id: student.id,
            teacher_id: student.teacher_id,
            status: student.status?.toLowerCase() === 'inativo' ? 'inativo' : 'ativo',
            permissions: ['view_own_classes', 'book_classes', 'view_own_invoices', 'access_multimedia'],
          };

          // Background auto-sync into system_users
          supabase.from('system_users').upsert(sysUser).then();
          return sysUser;
        }
      } catch (e) {
        console.warn('Busca em students gerou aviso:', e);
      }

      return null;
    } catch (err) {
      console.warn('Erro ao consultar usuário por email:', err);
      return null;
    }
  },

  /**
   * Diagnostic test for Database Connection and User Lookups
   */
  async diagnoseAuthTables(email?: string): Promise<{
    supabaseConnected: boolean;
    systemUsersTable: boolean;
    teachersTable: boolean;
    studentsTable: boolean;
    userFound: any | null;
    recommendation: string;
  }> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        supabaseConnected: false,
        systemUsersTable: false,
        teachersTable: false,
        studentsTable: false,
        userFound: null,
        recommendation: 'As chaves VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não estão configuradas ou são padrões de exemplo.',
      };
    }

    let systemUsersTable = false;
    let teachersTable = false;
    let studentsTable = false;
    let userFound: any = null;

    try {
      const { error: suErr } = await supabase.from('system_users').select('id').limit(1);
      systemUsersTable = !suErr || suErr.code !== '42P01';
    } catch {
      systemUsersTable = false;
    }

    try {
      const { error: tErr } = await supabase.from('teachers').select('id').limit(1);
      teachersTable = !tErr || tErr.code !== '42P01';
    } catch {
      teachersTable = false;
    }

    try {
      const { error: stErr } = await supabase.from('students').select('id').limit(1);
      studentsTable = !stErr || stErr.code !== '42P01';
    } catch {
      studentsTable = false;
    }

    if (email) {
      userFound = await this.findUserByEmail(email);
    }

    let recommendation = 'Tabelas do banco de dados verificadas e operacionais.';
    if (!systemUsersTable) {
      recommendation = 'A tabela "system_users" precisa ser criada no Supabase executando o script schema.sql no SQL Editor.';
    } else if (email && !userFound) {
      recommendation = `O usuário "${email}" não foi localizado nas tabelas de usuários, professores ou alunos. Verifique se o e-mail digitado confere ou cadastre-se na aba "Criar Cadastro".`;
    }

    return {
      supabaseConnected: true,
      systemUsersTable,
      teachersTable,
      studentsTable,
      userFound,
      recommendation,
    };
  },

  /**
   * Save or Update a System User
   */
  async saveSystemUser(user: {
    id?: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
    phone?: string;
    teacherId?: string;
    studentId?: string;
    status?: string;
    permissions?: string[];
  }): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const cleanEmail = user.email.trim().toLowerCase();
      const userId = user.id || `user-${Date.now()}`;
      const { error } = await supabase.from('system_users').upsert({
        id: userId,
        name: user.name,
        email: cleanEmail,
        role: user.role || 'professor',
        avatar_url: user.avatarUrl || null,
        phone: user.phone || null,
        teacher_id: user.teacherId || null,
        student_id: user.studentId || null,
        status: user.status || 'ativo',
        permissions: user.permissions || [
          user.role === 'admin' ? 'all_access' : 'manage_own_agenda'
        ],
        updated_at: new Date().toISOString(),
      });
      return syncResult(error, 'usuário');
    } catch (err) {
      console.warn('Erro ao salvar usuário no sistema:', err);
      reportSyncError('usuário', err);
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
          role: t.role || 'professor',
          specialty: t.specialty || '',
          bio: t.bio || '',
          whatsapp: t.whatsapp || '',
          email: t.email || '',
          avatar_url: t.avatarUrl || '',
          hero_image_url: t.heroImageUrl || '',
          rating: t.rating || 5.0,
          total_students: 25,
          updated_at: new Date().toISOString(),
        });
      }

      // 2. Services
      for (const s of services) {
        await supabase.from('services').upsert({
          id: s.id,
          teacher_id: 'prof-roberto',
          name: s.name,
          description: s.description || '',
          price: s.price || 0,
          duration_minutes: s.durationMinutes || 60,
          modality: s.modality || 'Online / Presencial',
          icon_name: s.iconName || 'school',
          active: s.active ?? true,
        });
      }

      // 3. Students
      for (const st of students) {
        await supabase.from('students').upsert({
          id: st.id,
          teacher_id: 'prof-roberto',
          name: st.name,
          email: st.email || '',
          phone: st.phone || '',
          avatar: st.avatar || '',
          joined_date: st.joinedDate || new Date().toISOString().split('T')[0],
          total_classes: st.totalClasses || 0,
          last_class: st.lastClass || '',
          status: st.status || 'Ativo',
          notes: st.notes || '',
        });
      }

      // 4. Appointments
      for (const a of appointments) {
        await supabase.from('appointments').upsert({
          id: a.id,
          teacher_id: 'prof-roberto',
          student_name: a.studentName,
          student_initials: a.studentInitials || 'AL',
          student_phone: a.studentPhone || '',
          student_email: a.studentEmail || '',
          service_id: a.serviceId || null,
          service_name: a.serviceName,
          date: a.date,
          day_of_week: a.dayOfWeek || 1,
          start_time: a.startTime,
          end_time: a.endTime,
          duration_minutes: a.durationMinutes || 60,
          modality: a.modality || 'Online (Google Meet)',
          status: a.status || 'Confirmado',
          notes: a.notes || '',
          price: a.price || 150,
        });
      }

      // 5. Reminders
      for (const r of reminders) {
        await supabase.from('reminders').upsert({
          id: r.id,
          teacher_id: 'prof-roberto',
          title: r.title,
          due_date: r.dueDate || new Date().toISOString().split('T')[0],
          completed: Boolean(r.completed),
          delayed: Boolean(r.delayed),
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
