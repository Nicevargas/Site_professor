import { 
  Appointment, 
  ServiceItem, 
  Student, 
  Reminder, 
  TeacherProfile, 
  PricingPlan, 
  TestimonialItem, 
  CurriculumItem, 
  VideoItem, 
  PhotoItem,
  FaqItem,
  MessageTemplate,
  PaymentInvoice
} from '../types';

export const INITIAL_TEACHER_PROFILES: TeacherProfile[] = [
  {
    id: 'prof-roberto',
    name: 'Prof. Roberto Almeida',
    role: 'Personal Trainer & Especialista',
    specialty: 'Especialista em Performance, Reabilitação e Treinamento Inteligente',
    bio: 'Transforme sua rotina de treinos com uma metodologia focada em resultados reais, prevenção de lesões e alta performance. Treinamento inteligente para quem busca excelência.',
    rating: 4.9,
    reviewCount: 124,
    yearsExperience: 10,
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBAI63loLl-GarxR8nRCM0QR_UD9OOriq4QTFT68JOsd_926nwPUc3YQ07yVmhVMAAPYJ89Jk-h5GpttNyLMUKD4WJPNozVv5lOrRdBNWMLDFdJiooTvn2t5PA6mb_GGnUILVGezO-aIVc_7VRKB4Y9zIkR4WIpESk7H5VQbPXLr0Yc6P1uJtXayeFWG6nJcZukPp1IRYyxFma22VT0nZr1gy1JyGPPk1usK9JBwJk1dapBCXIb2Nh8Ig',
    heroImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVhd3Gm8BsjE6yAt5EHiGHPkx_BVVEYYpcN6VGKZN4g_-BDDJoJHlEE6iJDBTAPsIi8Bu_Zi0xKYVDhUk32noUxlhmBncbdKbx636FTTLanozGQ4fpbo6GQc-GEbPKLr8X3akCDmYWb2M-J3HlSXz5fOa-X9vVy9kGFQ3Q1jUqP7hi_AXvxpZHNkXGk6KDbPgKF18vC_AZOqZ4_F2M2_zOts5FiURUi6vDmmK3pxrHynQYbK3oOwMePg',
    whatsapp: '5511999887766',
    email: 'roberto.almeida@agendaprofessor.com.br',
    n8nWebhookUrl: 'https://n8n.seu-dominio.com.br/webhook/whatsapp-8h-confirmacao',
    n8nAuthToken: 'n8n_sec_99a8b7c6d5e4f3a2b1',
    whatsappAutoReminder8h: true,
    pixKey: 'roberto.almeida@agendaprofessor.com.br',
    pixKeyType: 'email',
    pixReceiverName: 'Roberto Almeida - Educação Física',
    pixBankName: 'Nubank / Itaú',
    defaultPaymentGateway: 'pix'
  },
  {
    id: 'prof-carlos',
    name: 'Carlos Silva',
    role: 'Instrutor e Educador',
    specialty: 'Matemática Avançada, Física & Preparação para Vestibulares',
    bio: 'Aulas particulares focadas no desenvolvimento do raciocínio lógico e resolução prática de exercícios dos principais vestibulares do país.',
    rating: 5.0,
    reviewCount: 98,
    yearsExperience: 8,
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzOpE1WBXepMUm3G21XYxME_H53gwFI01_uuNwk9BOF1CTTxYb4qTbeVUbV38GDICoCEU9kpzLs1nDsZxn0yxfFYrS76Dvpzz5yVPLUVK1W4yolwLDAoSUnc8m6Izd8DLb67DRvju6h-eYiJKdwXw4wwOhv8eCGdftyvFgDia9qy7kMHgSs_Yym3aNph20qDJ2S6iB4equOLDfHGfwqs4poutwgneY-qeEJqz9XoSvikiN8bWwky29MQ',
    heroImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8hjOK5vgwEF0koIHtHT-fRqaDLAvZLOXlClEgNMEVoppmGUF8c6lqqAJhnXXyYuON1d6KSCSq06-lJI7CgSfFXOKZkNsYtHUxcemND81zfiNTCr4ugxQKCh5Ai6xJX1BYeTp9z7sszydzQnXS5oj3AKSKvBCyI2w0FGyWHsFk5SyfJPUY7tdKT8Vv3-7fcwcscJaB8GbFAKutVW9uwly9Z-K-NoB9IBR9llm_dppFBzLj9bd0qNSmXQ',
    whatsapp: '5511988776655',
    email: 'carlos.silva@agendaprofessor.com.br',
    n8nWebhookUrl: 'https://n8n.seu-dominio.com.br/webhook/whatsapp-8h-confirmacao',
    n8nAuthToken: 'n8n_sec_carlos_38291a82',
    whatsappAutoReminder8h: true,
    pixKey: '11988776655',
    pixKeyType: 'phone',
    pixReceiverName: 'Carlos Silva Aulas Particulares',
    pixBankName: 'Inter / Santander',
    defaultPaymentGateway: 'pix'
  }
];

export const INITIAL_SERVICES: ServiceItem[] = [
  {
    id: 'serv-1',
    teacherId: 'prof-roberto',
    name: 'Personal Trainer 1h',
    description: 'Sessão individual focada em hipertrofia e condicionamento físico personalizado.',
    price: 150,
    durationMinutes: 60,
    active: true,
    modality: 'Online / Presencial',
    iconName: 'fitness_center'
  },
  {
    id: 'serv-2',
    teacherId: 'prof-roberto',
    name: 'Aula de Natação',
    description: 'Turma adulto ou individual. Aperfeiçoamento dos 4 estilos e respiração.',
    price: 120,
    durationMinutes: 45,
    active: true,
    modality: 'Presencial',
    iconName: 'pool'
  },
  {
    id: 'serv-3',
    teacherId: 'prof-roberto',
    name: 'Avaliação Física',
    description: 'Bioimpedância e medidas antropométricas completas com relatório detalhado.',
    price: 80,
    durationMinutes: 30,
    active: false,
    modality: 'Presencial',
    iconName: 'sports_martial_arts'
  },
  {
    id: 'serv-4',
    teacherId: 'prof-carlos',
    name: 'Aula Particular - Matemática',
    description: 'Revisão focada nas suas dificuldades específicas. Ideal para acompanhamento contínuo.',
    price: 150,
    durationMinutes: 60,
    active: true,
    modality: 'Online / Presencial',
    iconName: 'school'
  },
  {
    id: 'serv-5',
    teacherId: 'prof-carlos',
    name: 'Mentoria Pré-Vestibular',
    description: 'Sessão intensiva focada em resolução de provas anteriores e estratégias de estudo.',
    price: 220,
    durationMinutes: 90,
    active: true,
    modality: 'Apenas Online',
    iconName: 'menu_book'
  },
  {
    id: 'serv-6',
    teacherId: 'prof-carlos',
    name: 'Revisão de Véspera',
    description: 'Revisão expressa dos tópicos mais importantes um dia antes da prova.',
    price: 300,
    durationMinutes: 120,
    active: true,
    modality: 'Online / Presencial',
    badge: 'Alta Procura',
    iconName: 'calculate'
  }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-1',
    teacherId: 'prof-roberto',
    name: 'Mariana Costa',
    email: 'mariana.costa@email.com',
    phone: '(11) 98765-4321',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBK4ZdjGlXcYUkNbEPgBCJ2ybOX87uTuhEIW-bh1S_6aUuhw3LbpojczkFt7hLMuVkBrvtmonkTNLYDBnpXnY8VeoyWHUzo9lTl7o4AYZV53TqGGXbGuc3CVUOLKbpGRa80w_0YcCGtnYeuP97M5S1TuGnG5L72vqotjZDwMVDIWF9N7shtJ2fI_9L2OOOUCTYfgP1vQF4Vjms-_6o4t7L90jfsLMghpGEespEMyKNBXoQr7B-RD-cww',
    joinedDate: 'Março 2023',
    totalClasses: 18,
    status: 'Ativo',
    notes: 'Focar em conversação avançada e preparo para entrevista de emprego.',
    lastClass: '14/11/2024'
  },
  {
    id: 'std-2',
    teacherId: 'prof-roberto',
    name: 'João Pedro',
    email: 'joao.pedro@email.com',
    phone: '(11) 97654-3210',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    joinedDate: 'Agosto 2023',
    totalClasses: 12,
    status: 'Ativo',
    notes: 'Preparação para vestibular de Medicina. Foco em Geometria Espacial.',
    lastClass: '15/11/2024'
  },
  {
    id: 'std-3',
    teacherId: 'prof-roberto',
    name: 'Ana Beatriz',
    email: 'ana.beatriz@email.com',
    phone: '(11) 96543-2109',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    joinedDate: 'Janeiro 2024',
    totalClasses: 9,
    status: 'Ativo',
    notes: 'Treinamento de conversação e termos de negócios.',
    lastClass: '16/11/2024'
  },
  {
    id: 'std-4',
    teacherId: 'prof-carlos',
    name: 'João Silva',
    email: 'joao.silva@email.com',
    phone: '(11) 95432-1098',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    joinedDate: 'Maio 2023',
    totalClasses: 22,
    status: 'Ativo',
    notes: 'Matemática Avançada (Cálculo 1 e Álgebra Linear).',
    lastClass: 'Hoje'
  },
  {
    id: 'std-5',
    teacherId: 'prof-carlos',
    name: 'Maria Almeida',
    email: 'maria.almeida@email.com',
    phone: '(11) 94321-0987',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    joinedDate: 'Fevereiro 2024',
    totalClasses: 6,
    status: 'Ativo',
    notes: 'Física Básica e Cinemática.',
    lastClass: 'Hoje'
  },
  {
    id: 'std-6',
    teacherId: 'prof-carlos',
    name: 'Carlos Pereira',
    email: 'carlos.pereira@email.com',
    phone: '(11) 93210-9876',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    joinedDate: 'Novembro 2023',
    totalClasses: 14,
    status: 'Ativo',
    notes: 'Dúvidas em Química Orgânica.',
    lastClass: 'Hoje'
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-1',
    teacherId: 'prof-carlos',
    studentName: 'João Silva',
    studentInitials: 'JS',
    studentAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    studentPhone: '(11) 95432-1098',
    serviceId: 'serv-4',
    serviceName: 'Matemática Avançada',
    date: '2024-11-15',
    dayOfWeek: 3, // Qua
    startTime: '14:00',
    endTime: '15:00',
    durationMinutes: 60,
    modality: 'Online (Zoom)',
    status: 'Confirmado',
    notes: 'Avançar no conteúdo de integrais trigonométricas.',
    clientSince: 'Cliente desde 2023',
    price: 150
  },
  {
    id: 'apt-2',
    teacherId: 'prof-carlos',
    studentName: 'Maria Almeida',
    studentInitials: 'MA',
    studentAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    studentPhone: '(11) 94321-0987',
    serviceId: 'serv-4',
    serviceName: 'Física Básica',
    date: '2024-11-15',
    dayOfWeek: 3, // Qua
    startTime: '15:30',
    endTime: '16:30',
    durationMinutes: 60,
    modality: 'Presencial',
    status: 'Confirmado',
    notes: 'Exercícios práticos de cinemática e leis de Newton.',
    clientSince: 'Cliente desde 2024',
    price: 150
  },
  {
    id: 'apt-3',
    teacherId: 'prof-carlos',
    studentName: 'Carlos Pereira',
    studentInitials: 'CP',
    studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    studentPhone: '(11) 93210-9876',
    serviceId: 'serv-5',
    serviceName: 'Dúvidas - Química',
    date: '2024-11-15',
    dayOfWeek: 3, // Qua
    startTime: '17:00',
    endTime: '18:00',
    durationMinutes: 60,
    modality: 'Online (Google Meet)',
    status: 'Confirmado',
    notes: 'Revisão para prova trimestral.',
    clientSince: 'Cliente desde 2023',
    price: 150
  },
  {
    id: 'apt-4',
    teacherId: 'prof-roberto',
    studentName: 'Mariana Costa',
    studentInitials: 'MC',
    studentAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBK4ZdjGlXcYUkNbEPgBCJ2ybOX87uTuhEIW-bh1S_6aUuhw3LbpojczkFt7hLMuVkBrvtmonkTNLYDBnpXnY8VeoyWHUzo9lTl7o4AYZV53TqGGXbGuc3CVUOLKbpGRa80w_0YcCGtnYeuP97M5S1TuGnG5L72vqotjZDwMVDIWF9N7shtJ2fI_9L2OOOUCTYfgP1vQF4Vjms-_6o4t7L90jfsLMghpGEespEMyKNBXoQr7B-RD-cww',
    studentPhone: '(11) 98765-4321',
    serviceId: 'serv-1',
    serviceName: 'Personal Trainer 1h',
    date: '2024-11-14',
    dayOfWeek: 2, // Ter
    startTime: '09:00',
    endTime: '10:00',
    durationMinutes: 60,
    modality: 'Presencial',
    status: 'Confirmado',
    notes: 'Treinamento focado em hipertrofia e fortalecimento postural.',
    clientSince: 'Cliente desde 2023',
    price: 150
  },
  {
    id: 'apt-5',
    teacherId: 'prof-roberto',
    studentName: 'João Pedro',
    studentInitials: 'JP',
    studentAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    studentPhone: '(11) 97654-3210',
    serviceId: 'serv-2',
    serviceName: 'Aula de Natação',
    date: '2024-11-15',
    dayOfWeek: 3, // Qua
    startTime: '10:00',
    endTime: '10:45',
    durationMinutes: 45,
    modality: 'Presencial',
    status: 'Pendente',
    notes: 'Aperfeiçoamento de nado crawl e respiração bilateral.',
    clientSince: 'Cliente desde 2023',
    price: 120
  },
  {
    id: 'apt-6',
    teacherId: 'prof-roberto',
    studentName: 'Ana Beatriz',
    studentInitials: 'AB',
    studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    studentPhone: '(11) 96543-2109',
    serviceId: 'serv-1',
    serviceName: 'Personal Trainer 1h',
    date: '2024-11-16',
    dayOfWeek: 4, // Qui
    startTime: '13:00',
    endTime: '14:00',
    durationMinutes: 60,
    modality: 'Online (Google Meet)',
    status: 'Confirmado',
    notes: 'Avaliação de mobilidade e treino de pernas.',
    clientSince: 'Cliente desde 2024',
    price: 150
  }
];

export const INITIAL_REMEMBERS: Reminder[] = [
  {
    id: 'rem-1',
    teacherId: 'prof-roberto',
    title: 'Enviar planilha de treino para Mariana C.',
    dueDate: 'Hoje, 13:00',
    completed: false
  },
  {
    id: 'rem-2',
    teacherId: 'prof-carlos',
    title: 'Revisar simulado de Matemática',
    dueDate: 'Atrasado',
    completed: false,
    delayed: true
  },
  {
    id: 'rem-3',
    teacherId: 'prof-roberto',
    title: 'Confirmar lista de presença para turma de Natação',
    dueDate: 'Amanhã, 09:00',
    completed: true
  }
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'plan-start',
    name: 'Start',
    priceMonth: 79,
    description: 'Essencial para quem está começando.',
    features: [
      'Website Básico',
      'Agenda Integrada',
      'Integração WhatsApp'
    ],
    ctaText: 'Começar Start'
  },
  {
    id: 'plan-pro',
    name: 'Pro',
    priceMonth: 129,
    description: 'Para professores que querem se destacar.',
    isPopular: true,
    featuresHeader: 'TUDO DO START, MAIS:',
    features: [
      'Site Personalizado',
      'Otimização SEO',
      'Domínio Customizado'
    ],
    ctaText: 'Assinar Pro'
  },
  {
    id: 'plan-premium',
    name: 'Premium',
    priceMonth: 199,
    description: 'A solução completa para sua carreira.',
    featuresHeader: 'TUDO DO PRO, MAIS:',
    features: [
      'Pagamentos Online',
      'Área do Aluno',
      'Relatórios Financeiros Avançados'
    ],
    ctaText: 'Ser Premium'
  }
];

export const FAQ_ITEMS = [
  {
    id: 'faq-1',
    question: 'Existe taxa de implementação?',
    answer: 'Não. Todos os nossos planos são livres de taxas de configuração ou implementação. Você paga apenas a mensalidade do plano escolhido e já pode começar a usar a plataforma.'
  },
  {
    id: 'faq-2',
    question: 'Posso mudar de plano depois?',
    answer: 'Sim, você pode fazer o upgrade ou downgrade do seu plano a qualquer momento diretamente pelo seu painel de controle, sem multas.'
  },
  {
    id: 'faq-3',
    question: 'Como funciona a integração com o WhatsApp?',
    answer: 'A plataforma gera links automáticos de confirmação e lembretes para envio com um clique direto pelo WhatsApp do professor ou via disparo automático.'
  },
  {
    id: 'faq-4',
    question: 'Os alunos precisam baixar algum aplicativo para agendar?',
    answer: 'Não! Os alunos acessam seu link personalizado diretamente pelo navegador do celular ou computador, escolhem o serviço e o horário em poucos segundos.'
  }
];

export const INITIAL_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'test-1',
    studentName: 'Mariana Costa',
    roleOrCourse: 'Aluna de Mentoria Individual',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBK4ZdjGlXcYUkNbEPgBCJ2ybOX87uTuhEIW-bh1S_6aUuhw3LbpojczkFt7hLMuVkBrvtmonkTNLYDBnpXnY8VeoyWHUzo9lTl7o4AYZV53TqGGXbGuc3CVUOLKbpGRa80w_0YcCGtnYeuP97M5S1TuGnG5L72vqotjZDwMVDIWF9N7shtJ2fI_9L2OOOUCTYfgP1vQF4Vjms-_6o4t7L90jfsLMghpGEespEMyKNBXoQr7B-RD-cww',
    rating: 5,
    content: 'O método de ensino é surreal de bom. Consegui evoluir em 3 meses o que não consegui em 2 anos em cursos tradicionais. Acompanhamento diário e suporte impecável!',
    date: '10/11/2024',
    verified: true,
    featured: true
  },
  {
    id: 'test-2',
    studentName: 'João Pedro Ramos',
    roleOrCourse: 'Aprovado em Medicina na USP',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    content: 'A didática e a clareza nas explicações foram fundamentais para a minha aprovação no vestibular mais concorrido. As listas de exercícios personalizadas fizeram toda a diferença.',
    date: '02/11/2024',
    verified: true,
    featured: true
  },
  {
    id: 'test-3',
    studentName: 'Ana Beatriz Souza',
    roleOrCourse: 'Executiva de Tecnologia & Negócios',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    content: 'Praticidade total para agendar, receber notificações 8h antes no WhatsApp e ter aulas com material de altíssimo nível. Recomendo para todos os meus colegas!',
    date: '28/10/2024',
    verified: true,
    featured: true
  },
  {
    id: 'test-4',
    studentName: 'Lucas Albuquerque',
    roleOrCourse: 'Atleta Amador & Aluno de Performance',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    content: 'Profissional extremamente capacitado, atencioso e com embasamento científico sólido. Meus resultados de força e mobilidade superaram todas as expectativas.',
    date: '15/10/2024',
    verified: true,
    featured: false
  }
];

export const INITIAL_CURRICULUM: CurriculumItem[] = [
  {
    id: 'curr-1',
    title: 'Mestrado em Educação & Metodologias de Ensino',
    institution: 'Universidade de São Paulo (USP)',
    period: '2019 - 2021',
    category: 'education',
    description: 'Pesquisa focada em aprendizagem acelerada, retenção de conhecimento e personalização do ensino individualizado.',
    skills: ['Metodologias Ativas', 'Neuroaprendizagem', 'Didática Aplicada']
  },
  {
    id: 'curr-2',
    title: 'Bacharelado & Licenciatura Plena',
    institution: 'Universidade Estadual de Campinas (UNICAMP)',
    period: '2013 - 2017',
    category: 'education',
    description: 'Formação sólida com ênfase em pedagogia moderna, desenvolvimento de planos de estudo e avaliação formativa.',
    skills: ['Planejamento Pedagógico', 'Resolução de Problemas', 'Avaliação Contínua']
  },
  {
    id: 'curr-3',
    title: 'Docente & Mentor Especialista de Alto Rendimento',
    institution: 'Instituto de Ensino & Treinamento de Elite',
    period: '2018 - Presente',
    category: 'experience',
    description: 'Mais de 1.200 horas de aulas particulares ministradas com taxa de aprovação/satisfação superior a 98% comprovada por alunos.',
    skills: ['Mentoria Individual', 'Acompanhamento 1-a-1', 'Suporte WhatsApp']
  },
  {
    id: 'curr-4',
    title: 'Certificação Internacional de Especialista',
    institution: 'International Education & Coaching Board (IECB)',
    period: '2022',
    category: 'certification',
    description: 'Acreditação internacional em docência remota, mentoria de alta performance e uso de ferramentas interativas.',
    skills: ['Ensino Híbrido', 'Tecnologias Educacionais', 'Google Meet & Zoom']
  },
  {
    id: 'curr-5',
    title: 'Prêmio Excelência em Ensino & Satisfação Discente',
    institution: 'Associação de Educadores Independentes',
    period: '2023',
    category: 'award',
    description: 'Reconhecimento concedido pela excelência didática e impacto positivo no desenvolvimento acadêmico e profissional de centenas de alunos.',
    skills: ['Excelência Didática', 'Satisfação Máxima']
  }
];

export const INITIAL_VIDEOS: VideoItem[] = [
  {
    id: 'vid-1',
    title: 'Apresentação Institucional: Conheça Nossa Metodologia de Mentoria & Aulas',
    mediaType: 'institucional',
    category: 'Vídeo Institucional',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
    duration: '03:45',
    description: 'Conheça em detalhes como estruturamos cada aula, o acompanhamento pós-sessão, materiais exclusivos e como ajudamos nossos alunos a alcançarem seus objetivos.',
    featured: true,
    speakerOrGuest: 'Prof. Roberto Alencar'
  },
  {
    id: 'vid-2',
    title: 'Vídeo Aula Prática: Resolução Passo a Passo & Raciocínio Estruturado',
    mediaType: 'videoaula',
    category: 'Vídeo Aula',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80',
    duration: '14:20',
    description: 'Uma demonstração real da didática aplicada em aula: foco no raciocínio rápido, desmistificação de conceitos complexos e resolução guiada de exercícios.',
    featured: true,
    episodeNumber: 'Aula #01',
    speakerOrGuest: 'Prof. Roberto Alencar'
  },
  {
    id: 'vid-3',
    title: 'Podcast Café com Didática #14 - Como Criar Rotinas de Alta Performance nos Estudos',
    mediaType: 'podcast',
    category: 'Podcast & Entrevistas',
    videoUrl: 'https://open.spotify.com/embed/episode/7777777777777777777777',
    spotifyUrl: 'https://open.spotify.com/',
    thumbnailUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=80',
    duration: '38:15',
    description: 'Neste episódio discutimos estratégias comprovadas pela neurociência para eliminar a procrastinação, organizar cronogramas e reter 3x mais conteúdo.',
    featured: true,
    episodeNumber: 'EP #14',
    speakerOrGuest: 'Prof. Roberto Alencar & Dra. Camila Sampaio'
  },
  {
    id: 'vid-4',
    title: 'Vídeo Institucional: Tour pelo Nosso Ambiente e Atendimento Individual',
    mediaType: 'institucional',
    category: 'Vídeo Institucional',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
    duration: '02:30',
    description: 'Veja como funciona nossa estrutura presencial e online, equipamentos de transmissão em alta definição e suporte individualizado.',
    featured: false,
    speakerOrGuest: 'Prof. Roberto Alencar'
  },
  {
    id: 'vid-5',
    title: 'Vídeo Aula: 5 Erros Mais Comuns em Provas e Como Evitá-los',
    mediaType: 'videoaula',
    category: 'Vídeo Aula',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&auto=format&fit=crop&q=80',
    duration: '08:50',
    description: 'Análise detalhada das armadilhas mais recorrentes e técnicas de revisão rápida para garantir máxima precisão nos testes.',
    featured: false,
    episodeNumber: 'Aula #02',
    speakerOrGuest: 'Prof. Roberto Alencar'
  },
  {
    id: 'vid-6',
    title: 'Podcast Sala de Aula #07 - Preparação Mental e Ansiedade Pré-Exame',
    mediaType: 'podcast',
    category: 'Podcast & Entrevistas',
    videoUrl: 'https://open.spotify.com/embed/episode/7777777777777777777777',
    spotifyUrl: 'https://open.spotify.com/',
    thumbnailUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&auto=format&fit=crop&q=80',
    duration: '42:00',
    description: 'Conversa franca com dicas de controle emocional, respiração e gerenciamento do tempo durante momentos de grande pressão acadêmica ou profissional.',
    featured: false,
    episodeNumber: 'EP #07',
    speakerOrGuest: 'Prof. Roberto Alencar & Psicóloga Mariana Rios'
  }
];

export const INITIAL_PHOTOS: PhotoItem[] = [
  {
    id: 'photo-1',
    title: 'Sessão de Mentoria & Atendimento 1-a-1',
    category: 'aulas',
    imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80',
    caption: 'Foco total no desenvolvimento individual de cada aluno com plano personalizado e atenção aos detalhes.',
    date: '2024'
  },
  {
    id: 'photo-2',
    title: 'Espaço de Atendimento & Estúdio Equipado',
    category: 'espaco',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
    caption: 'Ambiente climatizado, silencioso e projetado para máximo conforto e concentração durante os atendimentos.',
    date: '2024'
  },
  {
    id: 'photo-3',
    title: 'Material Didático & Planejamento das Sessões',
    category: 'bastidores',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
    caption: 'Cadernos de exercícios, resumos gráficos e acompanhamento contínuo via plataforma digital.',
    date: '2024'
  },
  {
    id: 'photo-4',
    title: 'Cerimônia de Premiação & Conquistas dos Alunos',
    category: 'conquistas',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
    caption: 'Comemoração dos resultados e aprovações dos alunos ao longo de anos de dedicação conjunta.',
    date: '2023'
  },
  {
    id: 'photo-5',
    title: 'Aulas Práticas com Tecnologia e Interatividade',
    category: 'aulas',
    imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
    caption: 'Uso de mesas digitalizadoras, quadros virtuais interativos e gravação em alta definição das aulas.',
    date: '2024'
  },
  {
    id: 'photo-6',
    title: 'Laboratório & Equipamentos de Alta Precisão',
    category: 'espaco',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80',
    caption: 'Infraestrutura completa de ponta para avaliações detalhadas e suporte técnico de excelência.',
    date: '2024'
  }
];

export const DEFAULT_SITE_FAQS: FaqItem[] = [
  {
    id: 'faq-site-1',
    question: 'Como funciona o acesso à aula online?',
    answer: 'Após confirmar o agendamento, você recebe o link exclusivo do Google Meet ou Zoom. Além disso, 8 horas antes e 15 minutos antes da aula enviamos o link direto para o seu WhatsApp cadastrado.',
    category: 'online',
    featured: true
  },
  {
    id: 'faq-site-2',
    question: 'Qual a política de cancelamento ou reagendamento?',
    answer: 'Você pode reagendar ou cancelar sua aula gratuitamente com até 4 horas de antecedência diretamente pelo link enviado no WhatsApp ou entrando em contato com o professor.',
    category: 'agendamento',
    featured: true
  },
  {
    id: 'faq-site-3',
    question: 'Quais são as formas de pagamento aceitas?',
    answer: 'Aceitamos PIX (com confirmação instantânea), Cartão de Crédito em até 12x e transferência bancária. Para pacotes mensais, você pode optar por cobrança recorrente sem comprometer o limite do cartão.',
    category: 'pagamento',
    featured: true
  },
  {
    id: 'faq-site-4',
    question: 'O material didático está incluso no valor da aula?',
    answer: 'Sim! Todas as aulas incluem listas de exercícios selecionadas, resumos em PDF, resolução guiada em quadro digital e suporte a dúvidas pontuais via WhatsApp entre as aulas.',
    category: 'geral',
    featured: true
  },
  {
    id: 'faq-site-5',
    question: 'Posso agendar uma primeira aula de avaliação / alinhamento?',
    answer: 'Com certeza! Na primeira sessão realizamos um diagnóstico completo das suas necessidades, nível atual e objetivos para montar um plano de estudos 100% individualizado.',
    category: 'geral',
    featured: false
  },
  {
    id: 'faq-site-6',
    question: 'Como funcionam os pacotes de aulas mensais?',
    answer: 'Oferecemos planos de 4, 8 ou 12 aulas mensais com desconto progressivo no valor da hora/aula e horários fixos garantidos na agenda toda semana.',
    category: 'pagamento',
    featured: false
  }
];

export const DEFAULT_MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tpl-8h',
    type: '8h_reminder',
    title: 'Lembrete de Aula (8h Antes)',
    description: 'Enviado automaticamente ou em 1 clique ~8 horas antes do início da aula para confirmação do aluno.',
    template: `*CONFIRMAÇÃO DE AULA - 8H ANTES* ⏰\n\nOlá, {nome_aluno}! Tudo bem? 👋\nAqui é do atendimento do Prof. {professor}.\n\nPassando para confirmar sua aula agendada para *hoje*:\n\n📚 *Aula:* {nome_servico}\n🗓️ *Data:* {data}\n⏰ *Horário:* {horario}\n📍 *Formato:* {modalidade}\n🔗 *Link de Acesso:* {link_aula}\n\nResponda com *1* para CONFIRMAR ou *2* para REAGENDAR. Até logo! 🚀`,
    active: true
  },
  {
    id: 'tpl-immediate',
    type: 'immediate_confirm',
    title: 'Boas-Vindas & Confirmação Imediata',
    description: 'Enviado no momento em que o aluno conclui o agendamento no site.',
    template: `*AGENDAMENTO CONFIRMADO COM SUCESSO!* ✅\n\nOlá, {nome_aluno}! Seu agendamento foi registrado com o Prof. {professor}.\n\n📋 *Detalhes da Sessão:*\n• *Serviço:* {nome_servico}\n• *Data:* {data}\n• *Horário:* {horario}\n• *Valor:* R$ {valor},00\n• *Link da Sala:* {link_aula}\n\nAdicione o evento à sua agenda e aguarde nosso lembrete no dia da aula! Qualquer dúvida, estamos à disposição.`,
    active: true
  },
  {
    id: 'tpl-1h',
    type: '1h_reminder',
    title: 'Lembrete Expresso (1h Antes)',
    description: 'Aviso final com o link da sala 1 hora antes de começar.',
    template: `*SUA AULA COMEÇA EM 1 HORA!* ⏳\n\nOlá, {nome_aluno}! Apenas relembrando que sua aula com o Prof. {professor} iniciará às {horario}.\n\n🔗 *Acesse a sala aqui:* {link_aula}\n\nTenha em mãos seu caderno e dúvidas. Até já!`,
    active: true
  },
  {
    id: 'tpl-cancel',
    type: 'cancellation',
    title: 'Aviso de Reagendamento / Cancelamento',
    description: 'Notificação quando um horário é liberado ou alterado.',
    template: `*ATUALIZAÇÃO DE AGENDAMENTO* 🔄\n\nOlá, {nome_aluno}. A sua aula de *{nome_servico}* agendada para {data} às {horario} foi atualizada no sistema.\n\nPara escolher um novo horário disponível, acesse o link de agendamento online ou nos avise por aqui.`,
    active: true
  }
];

export const INITIAL_PAYMENT_INVOICES: PaymentInvoice[] = [
  {
    id: 'inv-101',
    teacherId: 'prof-roberto',
    studentId: 'std-1',
    studentName: 'Mariana Costa',
    studentPhone: '(11) 98765-4321',
    studentEmail: 'mariana.costa@email.com',
    serviceOrPlanName: 'Pacote Mensal - 4 Aulas (Personal)',
    amount: 550,
    dueDate: '2026-08-20',
    status: 'vencido',
    method: 'pix',
    pixCode: '00020126580014br.gov.bcb.pix0136roberto.almeida@agendaprofessor.com.br5204000053039865405550.005802BR5922Roberto Almeida6009Sao Paulo62070503***6304ABCD',
    paymentLinkUrl: 'https://pay.agendaprofessor.com.br/pay/inv-101',
    notes: 'Mensalidade de Agosto. 1 dia de atraso.',
    createdAt: '2026-08-10',
    installments: 'Mensalidade'
  },
  {
    id: 'inv-102',
    teacherId: 'prof-roberto',
    studentId: 'std-2',
    studentName: 'João Pedro',
    studentPhone: '(11) 97654-3210',
    studentEmail: 'joao.pedro@email.com',
    serviceOrPlanName: 'Mentoria Pré-Vestibular (Avulsa)',
    amount: 220,
    dueDate: '2026-08-21',
    status: 'pendente',
    method: 'pix',
    pixCode: '00020126580014br.gov.bcb.pix0136roberto.almeida@agendaprofessor.com.br5204000053039865405220.005802BR5922Roberto Almeida6009Sao Paulo62070503***6304EF01',
    paymentLinkUrl: 'https://pay.agendaprofessor.com.br/pay/inv-102',
    notes: 'Vence hoje! Sessão individual agendada.',
    createdAt: '2026-08-18',
    installments: 'À vista'
  },
  {
    id: 'inv-103',
    teacherId: 'prof-roberto',
    studentId: 'std-3',
    studentName: 'Ana Beatriz',
    studentPhone: '(11) 96543-2109',
    studentEmail: 'ana.beatriz@email.com',
    serviceOrPlanName: 'Plano Trimestral - Treinamento Inteligente',
    amount: 1400,
    dueDate: '2026-08-25',
    status: 'pendente',
    method: 'cartao',
    paymentLinkUrl: 'https://pay.agendaprofessor.com.br/pay/inv-103',
    notes: 'Parcelamento em 3x no Cartão de Crédito.',
    createdAt: '2026-08-15',
    installments: '1/3'
  },
  {
    id: 'inv-104',
    teacherId: 'prof-carlos',
    studentId: 'std-4',
    studentName: 'João Silva',
    studentPhone: '(11) 95432-1098',
    studentEmail: 'joao.silva@email.com',
    serviceOrPlanName: 'Aula Particular - Matemática Avançada',
    amount: 150,
    dueDate: '2026-08-15',
    paidAt: '2026-08-15',
    status: 'pago',
    method: 'pix',
    pixCode: '00020126580014br.gov.bcb.pix0136roberto.almeida@agendaprofessor.com.br5204000053039865405150.005802BR5922Roberto Almeida6009Sao Paulo62070503***63049911',
    paymentLinkUrl: 'https://pay.agendaprofessor.com.br/pay/inv-104',
    notes: 'Pago via PIX. Comprovante validado.',
    createdAt: '2026-08-12',
    installments: 'À vista'
  },
  {
    id: 'inv-105',
    teacherId: 'prof-carlos',
    studentId: 'std-5',
    studentName: 'Maria Almeida',
    studentPhone: '(11) 94321-0987',
    studentEmail: 'maria.almeida@email.com',
    serviceOrPlanName: 'Pacote 8 Sessões - Performance & Saúde',
    amount: 980,
    dueDate: '2026-08-14',
    paidAt: '2026-08-14',
    status: 'pago',
    method: 'cartao',
    paymentLinkUrl: 'https://pay.agendaprofessor.com.br/pay/inv-105',
    notes: 'Confirmado no Cartão de Crédito.',
    createdAt: '2026-08-10',
    installments: '2x'
  },
  {
    id: 'inv-106',
    teacherId: 'prof-carlos',
    studentId: 'std-6',
    studentName: 'Carlos Pereira',
    studentPhone: '(11) 93210-9876',
    studentEmail: 'carlos.pereira@email.com',
    serviceOrPlanName: 'Revisão Expressa de Véspera',
    amount: 300,
    dueDate: '2026-08-10',
    status: 'vencido',
    method: 'boleto',
    paymentLinkUrl: 'https://pay.agendaprofessor.com.br/pay/inv-106',
    notes: 'Inadimplente há 11 dias. Boleto não compensado.',
    createdAt: '2026-08-05',
    installments: 'Única'
  }
];


