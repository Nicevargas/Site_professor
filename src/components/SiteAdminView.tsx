import React, { useState, useEffect } from 'react';
import { TeacherProfile, TestimonialItem, CurriculumItem, VideoItem, PhotoItem, FaqItem, SiteAdminTab } from '../types';
import {
  Globe,
  MessageSquare,
  GraduationCap,
  Video,
  Image as ImageIcon,
  ExternalLink,
  Eye,
  CheckCircle2,
  HelpCircle,
  Palette
} from 'lucide-react';
import { SiteBrandingCustomizer } from './SiteBrandingCustomizer';
import { TestimonialsSection } from './site-admin/TestimonialsSection';
import { CurriculumSection } from './site-admin/CurriculumSection';
import { VideosSection } from './site-admin/VideosSection';
import { PhotosSection } from './site-admin/PhotosSection';
import { FaqsSection } from './site-admin/FaqsSection';

/**
 * Tela "Meu Site": cabeçalho, resumo e navegação entre seções.
 * Cada seção (depoimentos, currículo, vídeos, fotos, FAQ) vive em src/components/site-admin/.
 */
interface SiteAdminViewProps {
  currentTeacher: TeacherProfile;
  testimonials: TestimonialItem[];
  curriculum: CurriculumItem[];
  videos: VideoItem[];
  photos: PhotoItem[];
  faqs?: FaqItem[];
  onUpdateTestimonials: (items: TestimonialItem[]) => void;
  onUpdateCurriculum: (items: CurriculumItem[]) => void;
  onUpdateVideos: (items: VideoItem[]) => void;
  onUpdatePhotos: (items: PhotoItem[]) => void;
  onUpdateFaqs?: (items: FaqItem[]) => void;
  onUpdateTeacher?: (updated: TeacherProfile) => void;
  onOpenPublicSite: () => void;
  /** Seção pedida pela barra lateral (sub-itens de "Meu Site") */
  activeTab?: SiteAdminTab;
  onTabChange?: (tab: SiteAdminTab) => void;
}

export const SiteAdminView: React.FC<SiteAdminViewProps> = ({
  currentTeacher,
  testimonials,
  curriculum,
  videos,
  photos,
  faqs = [],
  onUpdateTestimonials,
  onUpdateCurriculum,
  onUpdateVideos,
  onUpdatePhotos,
  onUpdateFaqs = (_items: FaqItem[]) => {},
  onUpdateTeacher = (_updated: TeacherProfile) => {},
  onOpenPublicSite,
  activeTab: requestedTab,
  onTabChange,
}) => {
  const [activeTab, setActiveTabState] = useState<SiteAdminTab>(requestedTab || 'branding');

  useEffect(() => {
    if (requestedTab && requestedTab !== activeTab) setActiveTabState(requestedTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedTab]);

  const setActiveTab = (tab: SiteAdminTab) => {
    setActiveTabState(tab);
    onTabChange?.(tab);
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <main className="flex-1 p-4 md:p-10 bg-[#f7f9fb] pb-32 overflow-y-auto font-sans">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Top Notification Toast */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 bg-[#091426] text-white px-5 py-3 rounded-2xl shadow-elevated border border-slate-700 flex items-center gap-3 animate-in slide-in-from-top duration-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Header with Quick Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#091426] tracking-tight flex items-center gap-2.5">
              <Globe className="w-7 h-7 text-[#00687a]" />
              <span>Painel Admin do Site do Professor</span>
            </h1>
            <p className="text-sm text-[#45474c] mt-1">
              Gerencie os depoimentos dos alunos, qualificações do currículo, vídeos demonstrativos e galeria de fotos exibidos na sua landing page pública.
            </p>
          </div>

          <button
            onClick={onOpenPublicSite}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#00687a] hover:bg-[#004e5c] text-white rounded-xl text-xs font-bold transition-all shadow-ambient hover:scale-[1.02] shrink-0"
          >
            <Eye className="w-4 h-4 text-cyan-300" />
            <span>Visualizar Site Público</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>

        {/* Metrics Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3.5">
          <div 
            onClick={() => setActiveTab('branding')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'branding'
                ? 'bg-white border-[#00687a] shadow-ambient ring-2 ring-[#00687a]/10'
                : 'bg-white/80 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Cores & Logo</span>
              <Palette className="w-4 h-4 text-[#00687a]" />
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <div 
                className="w-5 h-5 rounded-full border border-slate-300 shadow-xs" 
                style={{ backgroundColor: currentTeacher.primaryColor || '#00687a' }} 
              />
              <div 
                className="w-5 h-5 rounded-full border border-slate-300 shadow-xs" 
                style={{ backgroundColor: currentTeacher.secondaryColor || '#57dffe' }} 
              />
            </div>
            <span className="text-[11px] text-[#00687a] font-semibold block mt-1">Identidade Visual</span>
          </div>

          <div 
            onClick={() => setActiveTab('testimonials')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'testimonials'
                ? 'bg-white border-[#00687a] shadow-ambient ring-2 ring-[#00687a]/10'
                : 'bg-white/80 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Depoimentos</span>
              <MessageSquare className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-[#091426] mt-2">{testimonials.length}</div>
            <span className="text-[11px] text-emerald-600 font-semibold">100% 5 Estrelas</span>
          </div>

          <div 
            onClick={() => setActiveTab('curriculum')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'curriculum'
                ? 'bg-white border-[#00687a] shadow-ambient ring-2 ring-[#00687a]/10'
                : 'bg-white/80 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Currículo & Títulos</span>
              <GraduationCap className="w-4 h-4 text-[#00687a]" />
            </div>
            <div className="text-2xl font-bold text-[#091426] mt-2">{curriculum.length}</div>
            <span className="text-[11px] text-slate-500 font-medium">Formação & Prêmios</span>
          </div>

          <div 
            onClick={() => setActiveTab('videos')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'videos'
                ? 'bg-white border-[#00687a] shadow-ambient ring-2 ring-[#00687a]/10'
                : 'bg-white/80 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Vídeos & Podcasts</span>
              <Video className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-[#091426] mt-2">{videos.length}</div>
            <span className="text-[11px] text-slate-500 font-medium">Aulas, Inst. & Podcasts</span>
          </div>

          <div 
            onClick={() => setActiveTab('photos')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'photos'
                ? 'bg-white border-[#00687a] shadow-ambient ring-2 ring-[#00687a]/10'
                : 'bg-white/80 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Galeria de Fotos</span>
              <ImageIcon className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-[#091426] mt-2">{photos.length}</div>
            <span className="text-[11px] text-slate-500 font-medium">Espaço & Momentos</span>
          </div>

          <div 
            onClick={() => setActiveTab('faqs')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'faqs'
                ? 'bg-white border-[#00687a] shadow-ambient ring-2 ring-[#00687a]/10'
                : 'bg-white/80 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Perguntas (FAQ)</span>
              <HelpCircle className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="text-2xl font-bold text-[#091426] mt-2">{faqs.length}</div>
            <span className="text-[11px] text-cyan-700 font-medium">Dúvidas Frequentes</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('branding')}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'branding'
                ? 'border-[#00687a] text-[#00687a]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>🎨 Identidade Visual, Cores & Logo</span>
          </button>

          <button
            onClick={() => setActiveTab('testimonials')}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'testimonials'
                ? 'border-[#00687a] text-[#00687a]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Depoimentos ({testimonials.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('curriculum')}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'curriculum'
                ? 'border-[#00687a] text-[#00687a]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Currículo & Experiência ({curriculum.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'videos'
                ? 'border-[#00687a] text-[#00687a]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Vídeos, Aulas & Podcasts ({videos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'photos'
                ? 'border-[#00687a] text-[#00687a]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Fotos & Galeria ({photos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('faqs')}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'faqs'
                ? 'border-[#00687a] text-[#00687a]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Perguntas & Respostas FAQ ({faqs.length})</span>
          </button>
        </div>

        {/* ------------------- TAB: IDENTIDADE VISUAL & CORES ------------------- */}
        {activeTab === 'branding' && (
          <SiteBrandingCustomizer
            currentTeacher={currentTeacher}
            onUpdateTeacher={(updated) => {
              onUpdateTeacher(updated);
              showToast('Identidade visual e logo atualizadas!');
            }}
            onOpenPublicSite={onOpenPublicSite}
          />
        )}

        {activeTab === 'testimonials' && (
          <TestimonialsSection
            currentTeacher={currentTeacher}
            testimonials={testimonials}
            onUpdateTestimonials={onUpdateTestimonials}
            showToast={showToast}
          />
        )}

        {activeTab === 'curriculum' && (
          <CurriculumSection
            currentTeacher={currentTeacher}
            curriculum={curriculum}
            onUpdateCurriculum={onUpdateCurriculum}
            showToast={showToast}
          />
        )}

        {activeTab === 'videos' && (
          <VideosSection
            currentTeacher={currentTeacher}
            videos={videos}
            onUpdateVideos={onUpdateVideos}
            showToast={showToast}
          />
        )}

        {activeTab === 'photos' && (
          <PhotosSection
            currentTeacher={currentTeacher}
            photos={photos}
            onUpdatePhotos={onUpdatePhotos}
            showToast={showToast}
          />
        )}

        {activeTab === 'faqs' && (
          <FaqsSection
            currentTeacher={currentTeacher}
            faqs={faqs}
            onUpdateFaqs={onUpdateFaqs}
            showToast={showToast}
          />
        )}
      </div>
    </main>
  );
};
