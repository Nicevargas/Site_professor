export type ViewMode = 
  | 'dashboard'
  | 'agenda'
  | 'servicos'
  | 'alunos'
  | 'site-admin'
  | 'planos'
  | 'integracoes'
  | 'public-landing'
  | 'public-booking'
  | 'configuracoes';

export type AppointmentStatus = 'Confirmado' | 'Pendente' | 'Concluído' | 'Cancelado' | 'Bloqueado';

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

export interface VideoItem {
  id: string;
  title: string;
  category: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;
  description: string;
  featured?: boolean;
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
  title: string;
  dueDate: string;
  completed: boolean;
  delayed?: boolean;
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
