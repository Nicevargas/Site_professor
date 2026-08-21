import React, { useState } from 'react';
import { TeacherProfile, ServiceItem, TestimonialItem, CurriculumItem, VideoItem, PhotoItem, FaqItem } from '../types';
import { 
  ArrowRight, 
  CheckCircle2, 
  Star, 
  ShieldCheck, 
  Award, 
  Clock, 
  MapPin, 
  MessageSquare, 
  Layers, 
  Sparkles, 
  ChevronRight, 
  ChevronDown,
  ArrowLeft,
  GraduationCap,
  Briefcase,
  BookOpen,
  Video,
  Play,
  Image as ImageIcon,
  Check,
  Phone,
  Mail,
  Calendar,
  X,
  ExternalLink,
  Edit3,
  Sliders,
  HelpCircle,
  Search,
  Laptop,
  Users
} from 'lucide-react';

interface PublicLandingViewProps {
  teacher: TeacherProfile;
  services: ServiceItem[];
  testimonials: TestimonialItem[];
  curriculum: CurriculumItem[];
  videos: VideoItem[];
  photos: PhotoItem[];
  faqs?: FaqItem[];
  onStartBooking: (serviceId?: string) => void;
  onBackToDashboard: () => void;
  onOpenSiteAdmin: () => void;
  onOpenPlans: () => void;
}

export const PublicLandingView: React.FC<PublicLandingViewProps> = ({
  teacher,
  services,
  testimonials,
  curriculum,
  videos,
  photos,
  faqs = [],
  onStartBooking,
  onBackToDashboard,
  onOpenSiteAdmin,
  onOpenPlans,
}) => {
  const activeServices = services.filter((s) => s.active);
  const [selectedPhotoCategory, setSelectedPhotoCategory] = useState<string>('todos');
  const [activeVideoModal, setActiveVideoModal] = useState<VideoItem | null>(null);
  const [activePhotoModal, setActivePhotoModal] = useState<PhotoItem | null>(null);

  // Services Filter state
  const [serviceModalityFilter, setServiceModalityFilter] = useState<'todos' | 'online' | 'presencial'>('todos');
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');

  // FAQ Accordion state
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(faqs[0]?.id || null);
  const [faqCategoryFilter, setFaqCategoryFilter] = useState<string>('todos');

  const filteredServices = activeServices.filter((svc) => {
    const matchesSearch = svc.name.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
                          svc.description.toLowerCase().includes(serviceSearchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (serviceModalityFilter === 'online') {
      return svc.modality.toLowerCase().includes('online');
    }
    if (serviceModalityFilter === 'presencial') {
      return svc.modality.toLowerCase().includes('presencial');
    }
    return true;
  });

  const filteredPhotos = selectedPhotoCategory === 'todos' 
    ? photos 
    : photos.filter((p) => p.category === selectedPhotoCategory);

  const filteredFaqs = faqCategoryFilter === 'todos'
    ? faqs
    : faqs.filter((f) => f.category === faqCategoryFilter);

  const toggleFaq = (id: string) => {
    setExpandedFaqId((prev) => (prev === id ? null : id));
  };

  // Structured Data (JSON-LD) for Search Engine Optimization & Google Rich Snippets
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": "https://agendaprofessor.com.br/#professor",
        "name": teacher.name,
        "jobTitle": teacher.role,
        "description": teacher.bio,
        "image": teacher.avatarUrl,
        "telephone": `+${teacher.whatsapp}`,
        "email": teacher.email,
        "url": "https://agendaprofessor.com.br/",
        "knowsAbout": [
          "Aulas Particulares",
          "Mentoria Individual",
          "Preparação para Vestibulares e Concursos",
          "Metodologia Ativa de Aprendizagem"
        ]
      },
      {
        "@type": "ProfessionalService",
        "@id": "https://agendaprofessor.com.br/#service",
        "name": `${teacher.name} - Aulas Particulares & Consultoria`,
        "url": "https://agendaprofessor.com.br/",
        "image": teacher.heroImageUrl,
        "telephone": `+${teacher.whatsapp}`,
        "priceRange": "$$",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "BR",
          "addressRegion": "SP"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "5.0",
          "reviewCount": testimonials.length > 0 ? testimonials.length : 12,
          "bestRating": "5",
          "worstRating": "1"
        },
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Catálogo de Aulas e Mentorias",
          "itemListElement": activeServices.map((s, idx) => ({
            "@type": "Offer",
            "itemOffered": {
              "@type": "Course",
              "name": s.name,
              "description": s.description
            },
            "price": s.price,
            "priceCurrency": "BRL",
            "position": idx + 1
          }))
        }
      },
      ...(faqs.length > 0
        ? [
            {
              "@type": "FAQPage",
              "mainEntity": faqs.map((f) => ({
                "@type": "Question",
                "name": f.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": f.answer
                }
              }))
            }
          ]
        : [])
    ]
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] font-sans flex flex-col selection:bg-[#00687a] selection:text-white">
      {/* Dynamic SEO JSON-LD for Googlebot / Search Crawlers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {/* Top Admin Notice Bar */}
      <div className="bg-[#091426] text-white px-4 md:px-8 py-2.5 text-xs flex flex-col sm:flex-row justify-between items-center gap-2 z-50 sticky top-0 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-slate-200">Site Oficial do Professor</span>
          <span className="hidden md:inline text-slate-400">| Preview em tempo real com dados administrativos</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSiteAdmin}
            className="flex items-center gap-1.5 px-3 py-1 bg-cyan-900/60 hover:bg-cyan-900 text-cyan-300 rounded-lg text-xs font-semibold transition-colors border border-cyan-700/50"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Gerenciar Depoimentos, Vídeos & Fotos</span>
          </button>
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Painel de Gestão</span>
          </button>
        </div>
      </div>

      {/* TopNavBar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-[#eceef0] sticky top-9 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 md:px-10 h-18 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src={teacher.avatarUrl}
              alt={teacher.name}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border-2 border-[#00687a]/30 shadow-xs"
            />
            <div>
              <div className="font-bold text-base text-[#091426] leading-tight">{teacher.name}</div>
              <div className="text-[11px] text-[#00687a] font-semibold">{teacher.role}</div>
            </div>
          </div>

            <nav className="hidden lg:flex items-center gap-6 font-medium text-xs text-[#45474c]">
              <a href="#inicio" className="hover:text-[#00687a] py-2 transition-colors">
                Início
              </a>
              <a href="#curriculo" className="hover:text-[#00687a] py-2 transition-colors">
                Currículo & Títulos
              </a>
              <a href="#servicos" className="hover:text-[#00687a] py-2 transition-colors">
                Aulas & Serviços
              </a>
              <a href="#videos" className="hover:text-[#00687a] py-2 transition-colors">
                Vídeos & Aulas
              </a>
              <a href="#galeria" className="hover:text-[#00687a] py-2 transition-colors">
                Galeria
              </a>
              <a href="#depoimentos" className="hover:text-[#00687a] py-2 transition-colors">
                Depoimentos
              </a>
              <a href="#faq" className="hover:text-[#00687a] py-2 transition-colors flex items-center gap-1 font-semibold text-[#00687a]">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Dúvidas (FAQ)</span>
              </a>
            </nav>

          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/${teacher.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl hover:bg-emerald-100 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
            <button
              onClick={() => onStartBooking()}
              className="text-xs md:text-sm font-semibold bg-[#00687a] text-white px-5 py-2.5 rounded-xl hover:bg-[#004e5c] shadow-sm transition-all flex items-center gap-1.5 hover:scale-[1.02]"
            >
              <span>Agendar Aula</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" className="w-full bg-white border-b border-[#eceef0] py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Hero Left Content */}
          <div className="w-full lg:w-1/2 flex flex-col gap-5 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-50 border border-cyan-100 rounded-full w-fit">
              <Sparkles className="w-3.5 h-3.5 text-[#00687a]" />
              <span className="text-xs font-bold text-[#00687a] uppercase tracking-wider">
                {teacher.specialty}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#091426] tracking-tight leading-[1.15]">
              {teacher.name}
            </h1>
            
            <p className="text-base md:text-lg text-[#45474c] leading-relaxed max-w-xl">
              {teacher.bio}
            </p>

            {/* Value Highlights */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Atendimento 100% Personalizado</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Lembretes no WhatsApp 8h antes</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Metodologia Comprovada</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Online (Google Meet/Zoom) e Presencial</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-3">
              <button
                onClick={() => onStartBooking()}
                className="h-12 bg-[#00687a] hover:bg-[#004e5c] text-white font-semibold text-sm px-8 rounded-xl shadow-ambient hover:shadow-elevated transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                <span>Agendar Horário Agora</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#curriculo"
                className="h-12 bg-[#f7f9fb] hover:bg-slate-100 text-[#091426] font-semibold text-sm px-6 rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <GraduationCap className="w-4 h-4 text-[#00687a]" />
                <span>Ver Formação & Currículo</span>
              </a>

              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#f7f9fb] rounded-xl border border-[#eceef0]">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-xs font-bold text-[#091426]">{teacher.rating}</span>
                <span className="text-xs text-slate-500">({teacher.reviewCount}+ avaliações)</span>
              </div>
            </div>
          </div>

          {/* Hero Right Image */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[440px] aspect-[4/5] rounded-3xl overflow-hidden shadow-elevated border-4 border-white">
              <img
                src={teacher.heroImageUrl}
                alt={teacher.name}
                referrerPolicy="no-referrer"
                className="object-cover w-full h-full"
              />

              {/* Floating Experience Badge */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-elevated border border-slate-100 flex items-center gap-4">
                <div className="bg-[#00687a] text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs shrink-0">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#091426]">+{teacher.yearsExperience} Anos de Excelência</div>
                  <div className="text-xs text-[#45474c]">Mais de 1.200 horas de aulas e aprovações</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION: CURRÍCULO & FORMAÇÃO ================= */}
      <section id="curriculo" className="py-16 md:py-24 max-w-7xl mx-auto px-4 md:px-10 w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-50 rounded-full text-xs font-bold text-[#00687a] mb-3">
            <GraduationCap className="w-4 h-4" />
            <span>Trajetória Acadêmica & Profissional</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-[#091426]">
            Currículo, Títulos & Experiência
          </h2>
          <p className="text-sm md:text-base text-[#45474c] mt-2">
            Conheça as qualificações de ponta, pesquisas e certificações que garantem um ensino de máxima qualidade.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {curriculum.map((curr) => {
            const isEdu = curr.category === 'education';
            const isExp = curr.category === 'experience';
            const isCert = curr.category === 'certification';
            const isAward = curr.category === 'award';

            return (
              <div
                key={curr.id}
                className="bg-white rounded-3xl p-6 md:p-8 shadow-ambient border border-[#eceef0] hover:border-[#00687a]/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      isEdu ? 'bg-cyan-100 text-[#00687a]' :
                      isExp ? 'bg-blue-100 text-blue-700' :
                      isCert ? 'bg-purple-100 text-purple-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {isEdu && <GraduationCap className="w-6 h-6" />}
                      {isExp && <Briefcase className="w-6 h-6" />}
                      {isCert && <BookOpen className="w-6 h-6" />}
                      {isAward && <Award className="w-6 h-6" />}
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      isEdu ? 'bg-cyan-50 text-[#00687a] border border-cyan-200' :
                      isExp ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      isCert ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                      'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {isEdu ? 'Formação' : isExp ? 'Experiência' : isCert ? 'Certificação' : 'Prêmio'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base md:text-lg text-[#091426] leading-snug">
                      {curr.title}
                    </h3>
                    <p className="text-xs md:text-sm font-semibold text-[#00687a] mt-1">
                      {curr.institution} <span className="text-slate-400 font-normal">| {curr.period}</span>
                    </p>
                  </div>

                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed pt-1">
                    {curr.description}
                  </p>
                </div>

                {curr.skills && curr.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-4 mt-4 border-t border-slate-100">
                    {curr.skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-lg"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= SECTION: AULAS & SERVIÇOS ================= */}
      <section id="servicos" className="bg-white py-16 md:py-24 border-y border-[#eceef0] w-full">
        <div className="max-w-7xl mx-auto px-4 md:px-10">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full text-xs font-bold text-emerald-800 mb-3">
              <Calendar className="w-4 h-4" />
              <span>Formatos de Atendimento</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold text-[#091426]">
              Modalidades e Aulas Disponíveis
            </h2>
            <p className="text-sm md:text-base text-[#45474c] mt-2">
              Escolha a aula ideal para seu momento e garanta seu horário diretamente na agenda online.
            </p>
          </div>

          {/* Search & Modality Filter Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto mb-10">
            {/* Filter Pills */}
            <div className="flex items-center p-1 bg-slate-100 rounded-2xl w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setServiceModalityFilter('todos')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  serviceModalityFilter === 'todos'
                    ? 'bg-white text-[#00687a] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todas as Aulas ({activeServices.length})
              </button>
              <button
                onClick={() => setServiceModalityFilter('online')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  serviceModalityFilter === 'online'
                    ? 'bg-[#00687a] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Online (Meet/Zoom)</span>
              </button>
              <button
                onClick={() => setServiceModalityFilter('presencial')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  serviceModalityFilter === 'presencial'
                    ? 'bg-[#00687a] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Presencial</span>
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por disciplina ou aula..."
                value={serviceSearchTerm}
                onChange={(e) => setServiceSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#00687a] focus:bg-white transition-colors"
              />
              {serviceSearchTerm && (
                <button
                  onClick={() => setServiceSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {filteredServices.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 max-w-lg mx-auto">
              <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Nenhum serviço encontrado para este filtro.</p>
              <button
                onClick={() => {
                  setServiceModalityFilter('todos');
                  setServiceSearchTerm('');
                }}
                className="text-xs text-[#00687a] font-bold mt-2 hover:underline"
              >
                Limpar filtros de busca
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredServices.map((svc) => (
                <div
                  key={svc.id}
                  className="bg-[#f7f9fb] rounded-3xl p-7 border border-[#eceef0] hover:border-[#00687a] hover:bg-white hover:shadow-elevated transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-bold text-[#00687a] bg-cyan-100/60 px-3 py-1 rounded-full flex items-center gap-1.5">
                        {svc.modality.toLowerCase().includes('online') ? (
                          <Laptop className="w-3 h-3" />
                        ) : (
                          <MapPin className="w-3 h-3" />
                        )}
                        {svc.modality}
                      </span>
                      {svc.badge && (
                        <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold">
                          {svc.badge}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-[#091426] mb-2 group-hover:text-[#00687a] transition-colors">
                      {svc.name}
                    </h3>
                    <p className="text-xs md:text-sm text-[#45474c] mb-6 leading-relaxed">
                      {svc.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-200/80">
                    <div className="flex justify-between items-baseline mb-4">
                      <div>
                        <span className="text-[11px] font-medium text-slate-500">Investimento</span>
                        <p className="text-2xl font-black text-[#00687a]">R$ {svc.price},00</p>
                      </div>
                      <span className="text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {svc.durationMinutes} min
                      </span>
                    </div>

                    <button
                      onClick={() => onStartBooking(svc.id)}
                      className="w-full h-11 bg-[#00687a] hover:bg-[#004e5c] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs group-hover:shadow-ambient"
                    >
                      <span>Selecionar e Agendar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ================= SECTION: VÍDEOS & DEMONSTRAÇÕES ================= */}
      <section id="videos" className="py-16 md:py-24 max-w-7xl mx-auto px-4 md:px-10 w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 rounded-full text-xs font-bold text-rose-700 mb-3">
            <Video className="w-4 h-4" />
            <span>Didática em Ação</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-[#091426]">
            Vídeos Demonstrativos & Aulas de Amostra
          </h2>
          <p className="text-sm md:text-base text-[#45474c] mt-2">
            Veja na prática como são ministradas as aulas, o ritmo das explicações e a metodologia aplicada.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {videos.map((vid) => (
            <div
              key={vid.id}
              onClick={() => setActiveVideoModal(vid)}
              className="bg-white rounded-3xl overflow-hidden shadow-ambient border border-[#eceef0] hover:border-rose-400 hover:shadow-elevated transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail with Play Overlay */}
                <div className="relative aspect-video bg-slate-900 overflow-hidden">
                  <img
                    src={vid.thumbnailUrl}
                    alt={vid.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/95 text-rose-600 flex items-center justify-center shadow-elevated group-hover:scale-115 transition-transform">
                      <Play className="w-6 h-6 fill-rose-600 ml-1" />
                    </div>
                  </div>
                  <span className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-xs text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded-md">
                    {vid.duration}
                  </span>
                </div>

                <div className="p-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full">
                      {vid.category}
                    </span>
                    {vid.featured && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                        Em Destaque
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-[#091426] line-clamp-2 group-hover:text-rose-600 transition-colors">
                    {vid.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {vid.description}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-2">
                <span className="text-xs font-bold text-rose-600 flex items-center gap-1.5 group-hover:underline">
                  <Play className="w-3.5 h-3.5 fill-rose-600" />
                  <span>Assistir Vídeo Demonstrativo</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= SECTION: GALERIA DE FOTOS ================= */}
      <section id="galeria" className="bg-white py-16 md:py-24 border-y border-[#eceef0] w-full">
        <div className="max-w-7xl mx-auto px-4 md:px-10">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full text-xs font-bold text-emerald-800 mb-3">
              <ImageIcon className="w-4 h-4" />
              <span>Espaço & Bastidores</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold text-[#091426]">
              Galeria de Fotos do Professor
            </h2>
            <p className="text-sm md:text-base text-[#45474c] mt-2">
              Confira os registros de atendimentos individuais, materiais didáticos e nosso ambiente de estudo.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {[
              { id: 'todos', label: 'Todas as Fotos' },
              { id: 'aulas', label: '📚 Aulas & Mentorias' },
              { id: 'espaco', label: '🏢 Espaço & Estrutura' },
              { id: 'conquistas', label: '🏆 Conquistas & Alunos' },
              { id: 'bastidores', label: '🔍 Bastidores & Materiais' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedPhotoCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedPhotoCategory === cat.id
                    ? 'bg-[#00687a] text-white shadow-xs'
                    : 'bg-[#f7f9fb] text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Photos Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setActivePhotoModal(photo)}
                className="bg-[#f7f9fb] rounded-3xl overflow-hidden border border-[#eceef0] hover:border-[#00687a] hover:shadow-elevated transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-white text-xs font-semibold">Clique para ampliar</span>
                  </div>
                  <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md">
                    {photo.category}
                  </span>
                </div>

                <div className="p-5 space-y-1">
                  <h3 className="font-bold text-sm text-[#091426] line-clamp-1 group-hover:text-[#00687a] transition-colors">
                    {photo.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {photo.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SECTION: DEPOIMENTOS ================= */}
      <section id="depoimentos" className="py-16 md:py-24 max-w-7xl mx-auto px-4 md:px-10 w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full text-xs font-bold text-amber-800 mb-3">
            <MessageSquare className="w-4 h-4" />
            <span>Avaliações Reais</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-[#091426]">
            O que dizem os Alunos
          </h2>
          <p className="text-sm md:text-base text-[#45474c] mt-2">
            Depoimentos espontâneos de quem acelerou seu aprendizado e alcançou aprovações e resultados reais.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-white p-7 rounded-3xl border border-[#eceef0] shadow-ambient hover:border-amber-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex text-amber-400 gap-0.5">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verificado
                  </span>
                </div>

                <p className="text-xs md:text-sm text-slate-700 italic leading-relaxed mb-6">
                  "{t.content}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <img
                  src={t.avatarUrl}
                  alt={t.studentName}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-xs"
                />
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-[#091426]">{t.studentName}</h4>
                  <span className="text-[11px] text-[#00687a] font-medium">{t.roleOrCourse}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= SECTION: PERGUNTAS FREQUENTES (FAQ) ================= */}
      <section id="faq" className="py-16 md:py-24 max-w-5xl mx-auto px-4 md:px-10 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-50 rounded-full text-xs font-bold text-[#00687a] mb-3">
            <HelpCircle className="w-4 h-4" />
            <span>Tire Suas Dúvidas</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-[#091426]">
            Perguntas Frequentes
          </h2>
          <p className="text-sm md:text-base text-[#45474c] mt-2">
            Respostas rápidas para as principais dúvidas sobre metodologia, agendamentos, pagamentos e cancelamentos.
          </p>
        </div>

        {/* FAQ Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {[
            { id: 'todos', label: 'Todas as Dúvidas' },
            { id: 'online', label: 'Aulas Online' },
            { id: 'agendamento', label: 'Agendamento & Prazos' },
            { id: 'pagamento', label: 'Pagamentos & Planos' },
            { id: 'geral', label: 'Metodologia & Geral' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFaqCategoryFilter(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                faqCategoryFilter === cat.id
                  ? 'bg-[#00687a] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3.5">
          {filteredFaqs.map((faq) => {
            const isOpen = expandedFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen ? 'border-[#00687a]/60 shadow-sm' : 'border-[#eceef0] hover:border-slate-300 shadow-ambient'
                }`}
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center gap-4 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#00687a] shrink-0" />
                    <span className="font-bold text-sm md:text-base text-[#091426]">
                      {faq.question}
                    </span>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                    isOpen ? 'bg-cyan-50 text-[#00687a] rotate-180' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs md:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    <p>{faq.answer}</p>
                    <div className="mt-3 flex items-center justify-between pt-2 text-[11px] text-slate-400">
                      <span className="capitalize font-medium">Categoria: {faq.category}</span>
                      <a
                        href={`https://wa.me/${teacher.whatsapp}?text=${encodeURIComponent(`Olá, ainda tenho uma dúvida sobre: ${faq.question}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#00687a] font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        Perguntar no WhatsApp
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= FINAL CTA STRIP ================= */}
      <section className="bg-gradient-to-r from-[#004e5c] to-[#00687a] text-white py-16 px-4 md:px-10 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-300">
            Comece Hoje Mesmo
          </span>
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            Pronto para transformar seus resultados e acelerar seus objetivos?
          </h2>
          <p className="text-sm md:text-base text-cyan-100 max-w-xl mx-auto leading-relaxed">
            Agende uma aula individual em menos de 1 minuto. Notificações automáticas no WhatsApp para você nunca mais esquecer o horário.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-4 pt-2">
            <button
              onClick={() => onStartBooking()}
              className="h-13 bg-white text-[#00687a] hover:bg-slate-100 font-bold text-sm px-8 rounded-xl shadow-elevated transition-all flex items-center gap-2 hover:scale-105"
            >
              <span>Agendar Minha Aula Agora</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href={`https://wa.me/${teacher.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="h-13 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 rounded-xl shadow-elevated transition-all flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              <span>Falar no WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#eceef0] py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-bold text-sm text-[#091426]">
            <span>{teacher.name}</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-normal text-slate-500">{teacher.role}</span>
          </div>
          <div className="flex gap-6">
            <a href="#curriculo" className="hover:text-[#00687a]">Currículo</a>
            <a href="#servicos" className="hover:text-[#00687a]">Aulas</a>
            <a href="#videos" className="hover:text-[#00687a]">Vídeos</a>
            <a href="#galeria" className="hover:text-[#00687a]">Galeria</a>
            <a href="#depoimentos" className="hover:text-[#00687a]">Depoimentos</a>
          </div>
          <p>© {new Date().getFullYear()} Agenda do Professor. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* ================= MODAL VÍDEO REPRODUÇÃO ================= */}
      {activeVideoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setActiveVideoModal(null)}>
          <div className="bg-slate-900 rounded-3xl max-w-3xl w-full p-4 overflow-hidden shadow-elevated border border-slate-700 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 text-white">
              <div>
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">{activeVideoModal.category}</span>
                <h4 className="text-sm font-bold text-white">{activeVideoModal.title}</h4>
              </div>
              <button onClick={() => setActiveVideoModal(null)} className="p-1 text-slate-400 hover:text-white rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black">
              <iframe
                src={activeVideoModal.videoUrl}
                title={activeVideoModal.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <p className="text-xs text-slate-400 mt-3">{activeVideoModal.description}</p>
          </div>
        </div>
      )}

      {/* ================= MODAL FOTO LIGHTBOX ================= */}
      {activePhotoModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setActivePhotoModal(null)}>
          <div className="bg-slate-900 rounded-3xl max-w-2xl w-full p-4 overflow-hidden shadow-elevated border border-slate-700 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 text-white">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">{activePhotoModal.category}</span>
              <button onClick={() => setActivePhotoModal(null)} className="p-1 text-slate-400 hover:text-white rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden max-h-[70vh] flex items-center justify-center bg-black">
              <img
                src={activePhotoModal.imageUrl}
                alt={activePhotoModal.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="mt-3 text-white">
              <h4 className="text-sm font-bold">{activePhotoModal.title}</h4>
              <p className="text-xs text-slate-400 mt-1">{activePhotoModal.caption}</p>
            </div>
          </div>
        </div>
      )}

      {/* ================= FLOATING WHATSAPP FAB BUTTON ================= */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        <a
          href={`https://wa.me/${teacher.whatsapp}?text=${encodeURIComponent('Olá, Prof! Gostaria de tirar dúvidas sobre as aulas e agendamentos.')}`}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-elevated transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white"
          title="Falar com o Professor no WhatsApp"
        >
          <div className="relative">
            <Phone className="w-5 h-5 fill-white text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full" />
          </div>
          <div className="hidden sm:flex flex-col text-left leading-tight pr-1">
            <span className="text-[10px] uppercase font-bold text-emerald-100 tracking-wider">Online Agora</span>
            <span className="text-xs font-extrabold text-white">Falar no WhatsApp</span>
          </div>
        </a>
      </div>

    </div>
  );
};
