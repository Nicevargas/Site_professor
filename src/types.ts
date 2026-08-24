export type ViewMode = 
  | 'dashboard'
  | 'agenda'
  | 'servicos'
  | 'alunos'
  | 'pagamentos'
  | 'site-admin'
  | 'planos'
  | 'integracoes'
  | 'public-landing'
  | 'public-booking'
  | 'configuracoes'
  | 'auth';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
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
  serviceOrPlanName: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  paidAt?: string; // YYYY-MM-DD
  status: PaymentStatus;
  method: PaymentMethod;
  pixCode?: string;
  paymentLinkUrl?: string;
  notes?: string;
  createdAt: string;
  installments?: string; // e.g. "1/3", "Única", "Mensalidade"
}

export interface TestimonialItem {
  id: string;
  studentName: string;
  roleOrCourse: string;
  avatarUrl: string;
  rating: number;
  content: string;
  date: string;
  verified: boolean;
  featured?: boolean;
}

export interface CurriculumItem {
  id: string;
  title: string;
  institution: string;
  period: string;
  category: 'education' | 'experience' | 'certification' | 'award';
  description: string;
  skills?: string[];
}

export type MediaContentType = 'institucional' | 'videoaula' | 'podcast' | 'demonstrativo';

export interface VideoItem {
  id: string;
  teacherId?: string;
  title: string;
  mediaType?: MediaContentType; // 'institucional' | 'videoaula' | 'podcast' | 'demonstrativo'
  category: string; // e.g. "Vídeo Institucional", "Vídeo Aula", "Podcast", "Amostra Didática"
  videoUrl: string; // YouTube, Spotify Embed, Vimeo, Apple Podcast or direct media URL
  thumbnailUrl: string;
  duration: string; // e.g. "04:30", "45 min", "1h 15m"
  description: string;
  featured?: boolean;
  spotifyUrl?: string;
  audioUrl?: string;
  episodeNumber?: string; // e.g. "EP #12", "Aula #03"
  speakerOrGuest?: string; // e.g. "Prof. Roberto & Convidado Dr. Lucas"
  publishDate?: string;
  tags?: string[];
}

export interface PhotoItem {
  id: string;
  title: string;
  category: 'aulas' | 'espaco' | 'conquistas' | 'bastidores';
  imageUrl: string;
  caption: string;
  date?: string;
}

export interface FaqItem {
  id: string;
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
