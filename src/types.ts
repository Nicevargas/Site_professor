export type ViewMode = 
  | 'dashboard'
  | 'agenda'
  | 'servicos'
  | 'alunos'
  | 'pagamentos'
  | 'usuarios'
  | 'portal-aluno'
  | 'site-admin'
  | 'planos'
  | 'meu-endereco'
  | 'integracoes'
  | 'public-landing'
  | 'public-booking'
  | 'configuracoes'
  | 'tutorial-wizard'
  | 'auth';

export type UserRole = 'admin' | 'professor' | 'assistente' | 'aluno';

/**
 * Empresa / escola: o "perfil principal" que agrupa vários professores.
 * Um professor autônomo simplesmente não tem empresa (companyId indefinido).
 */
export interface Company {
  id: string;
  name: string;
  /** Nome curto usado em crachás e listas */
  tradeName?: string;
  document?: string; // CNPJ
  email?: string;
  phone?: string;
  city?: string;
  logoUrl?: string;
  notes?: string;
  status: 'ativa' | 'inativa';
  createdAt: string;
}

/** Nível do aluno, usado para montar turmas e filtrar a lista de alunos. */
export type StudentLevel = 'iniciante' | 'intermediario' | 'avancado';

export const STUDENT_LEVEL_LABELS: Record<StudentLevel, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

/** Presença marcada na lista de chamada da aula. */
export type AttendanceStatus = 'presente' | 'falta' | 'justificada';

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  presente: 'Presente',
  falta: 'Falta',
  justificada: 'Falta justificada',
};

export type WaitlistStatus = 'aguardando' | 'convocado' | 'matriculado' | 'removido';

/** Interessado numa aula que já bateu o limite de alunos. */
export interface WaitlistEntry {
  id: string;
  teacherId?: string;
  serviceId: string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "14:00"
  studentId?: string;
  studentName: string;
  studentPhone?: string;
  studentEmail?: string;
  status: WaitlistStatus;
  notes?: string;
  createdAt: string; // ISO
  /** Preenchido quando o professor chama a pessoa para a vaga aberta */
  calledAt?: string;
}

/** Seções da tela "Meu Site" (também aparecem como sub-itens na barra lateral). */
export type SiteAdminTab = 'branding' | 'testimonials' | 'curriculum' | 'videos' | 'photos' | 'faqs';

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  teacherId?: string; // Professor responsável (perfil principal do usuário)
  companyId?: string; // Empresa / escola à qual o usuário pertence
  studentId?: string; // If role === 'aluno'
  status: 'ativo' | 'inativo' | 'pendente';
  createdAt: string;
  lastLogin?: string;
  permissions?: string[];
  bio?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role: UserRole;
  phone?: string;
  teacherId?: string;
  companyId?: string;
  studentId?: string;
  isDemo?: boolean;
}

export type AppointmentStatus = 'Confirmado' | 'Pendente' | 'Concluído' | 'Cancelado' | 'Bloqueado';

export type PaymentStatus = 'pago' | 'pendente' | 'vencido' | 'cancelado';
export type PaymentMethod = 'pix' | 'cartao' | 'boleto' | 'transferencia' | 'dinheiro';

export interface PaymentInvoice {
  id: string;
  teacherId?: string;
  studentId?: string;
  studentName: string;
  studentPhone?: string;
  studentEmail?: string;
  studentInitials?: string;
  serviceOrPlanName: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  paidAt?: string; // YYYY-MM-DD
  status: PaymentStatus;
  method: PaymentMethod;
  pixCode?: string;
  qrCodeBase64?: string;
  paymentLinkUrl?: string;
  notes?: string;
  createdAt: string;
  installments?: string; // e.g. "1/3", "Única", "Mensalidade"
}

export interface TestimonialItem {
  id: string;
  teacherId?: string;
  studentName: string;
  roleOrCourse: string;
  avatarUrl: string;
  rating: number;
  content: string;
  date: string;
  verified: boolean;
  featured?: boolean;
}

export type Testimonial = TestimonialItem;

export interface CurriculumItem {
  id: string;
  teacherId?: string;
  title: string;
  institution: string;
  period: string;
  category: 'education' | 'experience' | 'certification' | 'award';
  description: string;
  skills?: string[];
}

export type MediaContentType = 'podcast' | 'curso_online' | 'institucional' | 'vendas' | 'videoaula' | 'demonstrativo';

export interface VideoItem {
  id: string;
  teacherId?: string;
  title: string;
  mediaType?: MediaContentType; // 'podcast' | 'curso_online' | 'institucional' | 'vendas'
  category: string; // e.g. "Metodologia", "Aulas & Didática", "Treino & Performance", "Lançamentos & Ofertas", "Entrevistas"
  videoUrl: string; // YouTube, Spotify Embed, Vimeo, Apple Podcast or direct media URL
  thumbnailUrl: string;
  duration: string; // e.g. "04:30", "45 min", "1h 15m"
  description: string;
  featured?: boolean;
  active?: boolean; // true = ativo no site/portal, false = inativo / rascunho
  spotifyUrl?: string;
  audioUrl?: string;
  episodeNumber?: string; // e.g. "EP #12", "Aula #03", "Módulo 01"
  speakerOrGuest?: string; // e.g. "Prof. Roberto & Convidado Dr. Lucas"
  publishDate?: string;
  tags?: string[];
}

export interface PhotoItem {
  id: string;
  teacherId?: string;
  title: string;
  category: 'aulas' | 'espaco' | 'conquistas' | 'bastidores';
  imageUrl: string;
  caption: string;
  date?: string;
}

export interface FaqItem {
  id: string;
  teacherId?: string;
  question: string;
  answer: string;
  category?: 'geral' | 'online' | 'agendamento' | 'pagamento';
  featured?: boolean;
}

export interface MessageTemplate {
  id: string;
  type: '8h_reminder' | 'immediate_confirm' | '1h_reminder' | 'cancellation';
  title: string;
  description: string;
  template: string;
  active: boolean;
}

export interface Appointment {
  id: string;
  teacherId?: string;
  /** Vínculo com o aluno cadastrado; usado pelo portal para mostrar só o que é dele */
  studentId?: string;
  studentName: string;
  studentInitials?: string;
  studentAvatar?: string;
  studentPhone?: string;
  studentEmail?: string;
  serviceId: string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  startTime: string; // "14:00"
  endTime: string; // "15:00"
  durationMinutes: number;
  modality: 'Online (Zoom)' | 'Online (Google Meet)' | 'Presencial' | 'Online';
  meetingUrl?: string;
  status: AppointmentStatus;
  notes?: string;
  clientSince?: string;
  price: number;
  /** Quando a aula foi cancelada (YYYY-MM-DD). Preenchido só em status 'Cancelado'. */
  cancelledAt?: string;
  /** Motivo informado no cancelamento, exibido no histórico. */
  cancellationReason?: string;
  /**
   * Limite de alunos deste horário. Quando ausente vale o limite do serviço.
   * Todas as matrículas do mesmo slot (serviço + data + hora) compartilham o limite.
   */
  capacity?: number;
  /** Presença marcada na lista de chamada. */
  attendance?: AttendanceStatus;
  attendanceNote?: string;
  attendanceMarkedAt?: string; // ISO
}

export interface ServiceItem {
  id: string;
  teacherId?: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  active: boolean;
  modality: 'Online / Presencial' | 'Apenas Online' | 'Presencial' | 'Online';
  badge?: string;
  iconName: 'fitness_center' | 'pool' | 'sports_martial_arts' | 'school' | 'calculate' | 'menu_book' | 'videocam';
  /** Quantos alunos cabem por horário. 1 = aula individual (padrão). */
  capacity?: number;
  /** Níveis atendidos por este serviço. Vazio = todos. */
  levels?: StudentLevel[];
}

export interface Student {
  id: string;
  teacherId?: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  joinedDate: string;
  totalClasses: number;
  status: 'Ativo' | 'Inativo';
  notes?: string;
  lastClass?: string;
  /** Nível técnico do aluno (iniciante / intermediário / avançado). */
  level?: StudentLevel;
}

export interface Reminder {
  id: string;
  teacherId?: string;
  title: string;
  dueDate: string;
  completed: boolean;
  delayed?: boolean;
}

export interface VacationModeConfig {
  enabled: boolean;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD
  title?: string;
  message?: string;
  allowWaitlistOrContact?: boolean;
  customButtonText?: string;
  notifyExistingAppointments?: boolean;
}

export interface TeacherProfile {
  id: string;
  name: string;
  /** Empresa / escola dona deste professor. Vazio = professor autônomo. */
  companyId?: string;
  /** Assinatura do professor com o Aquagenda: define o endereço que ele pode usar */
  plan?: 'start' | 'pro' | 'premium';
  /** Identificador do endereço público: "roberto-almeida" */
  slug?: string;
  /** Domínio próprio, só no plano Premium */
  customDomain?: string;
  customDomainStatus?: 'nenhum' | 'pendente' | 'verificado' | 'erro';
  role: string;
  specialty: string;
  bio: string;
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  avatarUrl: string;
  heroImageUrl: string;
  whatsapp: string;
  email: string;
  n8nWebhookUrl?: string;
  n8nAuthToken?: string;
  whatsappAutoReminder8h?: boolean;
  pixKey?: string;
  pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  pixReceiverName?: string;
  pixBankName?: string;
  defaultPaymentGateway?: string;
  // Custom Visual Identity & Branding
  logoUrl?: string;
  brandName?: string;
  showLogo?: boolean;
  primaryColor?: string; // e.g. '#00687a'
  secondaryColor?: string; // e.g. '#57dffe'
  accentColor?: string; // e.g. '#004e5c'
  themePreset?: 'ocean' | 'emerald' | 'indigo' | 'purple' | 'sunset' | 'slate' | 'rose' | 'custom';
  // Vacation / Out of Office Mode
  vacationMode?: VacationModeConfig;
}

export interface PricingPlan {
  id: string;
  name: string;
  priceMonth: number;
  description: string;
  isPopular?: boolean;
  featuresHeader?: string;
  features: string[];
  ctaText: string;
}

// ==========================================
// ACCESSIBILITY & TUTORIAL TYPES
// ==========================================

export type AccessibilityFontSize = 'normal' | 'medium' | 'large' | 'xlarge';
export type AccessibilityContrastMode = 'normal' | 'high-contrast-dark' | 'high-contrast-light' | 'monochrome';

export interface AccessibilitySettings {
  fontSize: AccessibilityFontSize;
  contrastMode: AccessibilityContrastMode;
  dyslexiaFont: boolean;
  reducedMotion: boolean;
  enhancedFocus: boolean;
  highlightLinks: boolean;
  readingGuide: boolean;
  voiceSpeed: number; // 0.75, 1, 1.25, 1.5
  autoNarrateOnTour: boolean;
}

export interface TutorialStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  detailedText: string;
  roleTarget?: UserRole | 'all';
  targetView: ViewMode;
  highlightElementSelector?: string;
  badge: string;
  iconName: string;
  tip?: string;
  audioNarrationText: string;
  keyFeatures: string[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'geral' | 'agenda' | 'pix' | 'whatsapp' | 'alunos' | 'site' | 'acessibilidade';
}

