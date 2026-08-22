export interface ColorThemePreset {
  id: string;
  name: string;
  category: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  previewGradient: string;
  suggestedNiche: string;
}

export const THEME_COLOR_PRESETS: ColorThemePreset[] = [
  {
    id: 'ocean',
    name: 'Oceano & Ciano',
    category: 'Clássico & Tecnológico',
    description: 'Tons equilibrados de azul petróleo e ciano vibrante. Foco, clareza e alta conversão.',
    primaryColor: '#00687a',
    secondaryColor: '#57dffe',
    accentColor: '#004e5c',
    previewGradient: 'from-[#00687a] to-[#57dffe]',
    suggestedNiche: 'Educação, Saúde, Tecnologia & Performance',
  },
  {
    id: 'emerald',
    name: 'Esmeralda & Fitness',
    category: 'Saúde & Bem-Estar',
    description: 'Verde esmeralda revigorante com toques mentolados. Transmite energia, saúde e resultados.',
    primaryColor: '#059669',
    secondaryColor: '#34d399',
    accentColor: '#047857',
    previewGradient: 'from-[#059669] to-[#34d399]',
    suggestedNiche: 'Personal Trainer, Nutrição, Yoga & Pilates',
  },
  {
    id: 'indigo',
    name: 'Índigo & Corporativo',
    category: 'Acadêmico & Negócios',
    description: 'Azul profundo de alta sofisticação com lavanda suave. Transmite autoridade e confiança.',
    primaryColor: '#4338ca',
    secondaryColor: '#818cf8',
    accentColor: '#312e81',
    previewGradient: 'from-[#4338ca] to-[#818cf8]',
    suggestedNiche: 'Vestibulares, Idiomas, Finanças & Mentoria',
  },
  {
    id: 'purple',
    name: 'Roxo & Criatividade',
    category: 'Artes & Inovação',
    description: 'Violeta dinâmico e fúcsia luminoso. Estimula criatividade, inovação e modernidade.',
    primaryColor: '#7c3aed',
    secondaryColor: '#c084fc',
    accentColor: '#5b21b6',
    previewGradient: 'from-[#7c3aed] to-[#c084fc]',
    suggestedNiche: 'Música, Design, Programação & Artes',
  },
  {
    id: 'sunset',
    name: 'Coral & Sunset',
    category: 'Alta Energia',
    description: 'Laranja vibrante e coral energizante. Ideal para dinamismo, esportes e motivação.',
    primaryColor: '#ea580c',
    secondaryColor: '#fb923c',
    accentColor: '#9a3412',
    previewGradient: 'from-[#ea580c] to-[#fb923c]',
    suggestedNiche: 'Crossfit, Lutas, Dança, Culinária & Eventos',
  },
  {
    id: 'slate',
    name: 'Dark Slate & Luxo',
    category: 'Premium & Elegância',
    description: 'Chumbo escuro e ciano gelo. Visual executivo moderno, minimalista e premium.',
    primaryColor: '#0f172a',
    secondaryColor: '#38bdf8',
    accentColor: '#1e293b',
    previewGradient: 'from-[#0f172a] to-[#38bdf8]',
    suggestedNiche: 'Consultoria VIP, Alta Gestão & Treinadores Elite',
  },
  {
    id: 'rose',
    name: 'Rubi & Rose',
    category: 'Beleza & Equilíbrio',
    description: 'Rosa magenta elegante com tons quentes. Transmite acolhimento, cuidado e excelência.',
    primaryColor: '#e11d48',
    secondaryColor: '#fb7185',
    accentColor: '#9f1239',
    previewGradient: 'from-[#e11d48] to-[#fb7185]',
    suggestedNiche: 'Estética, Dança, Terapia & Bem-Estar',
  },
  {
    id: 'amber',
    name: 'Âmbar & Ouro',
    category: 'Liderança & Sabedoria',
    description: 'Dourado nobre e âmbar acolhedor. Transmite prestígio, experiência e sabedoria.',
    primaryColor: '#b45309',
    secondaryColor: '#fbbf24',
    accentColor: '#78350f',
    previewGradient: 'from-[#b45309] to-[#fbbf24]',
    suggestedNiche: 'Oratória, Liderança, Coaching & Concursos',
  }
];

export const THEME_PRESETS = THEME_COLOR_PRESETS;

export interface PresetLogoOption {
  id: string;
  name: string;
  niche: string;
  iconName: string;
  imageUrl: string;
}

export const PRESET_LOGO_OPTIONS: PresetLogoOption[] = [
  {
    id: 'fitness-pro',
    name: 'Fitness & Treinamento Pro',
    niche: 'Personal Trainer & Performance',
    iconName: 'Dumbbell',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'edu-academy',
    name: 'Academia do Conhecimento',
    niche: 'Educação & Exatas',
    iconName: 'GraduationCap',
    imageUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'music-studio',
    name: 'Harmonia & Música',
    niche: 'Música & Instrumentos',
    iconName: 'Music',
    imageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'wellness-zen',
    name: 'Zen & Equilíbrio',
    niche: 'Yoga, Pilates & Terapias',
    iconName: 'HeartHandshake',
    imageUrl: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'tech-dev',
    name: 'Tech & Código',
    niche: 'Programação & Tecnologia',
    iconName: 'Code',
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'business-elite',
    name: 'Consultoria Elite',
    niche: 'Mentoria & Carreira',
    iconName: 'Briefcase',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=200&auto=format&fit=crop&q=80',
  },
];

export const DEFAULT_LOGOS = PRESET_LOGO_OPTIONS.map((logo) => ({
  id: logo.id,
  name: logo.name,
  url: logo.imageUrl,
}));
