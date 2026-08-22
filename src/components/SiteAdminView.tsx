import React, { useState } from 'react';
import { TeacherProfile, TestimonialItem, CurriculumItem, VideoItem, PhotoItem, FaqItem } from '../types';
import { 
  Globe, 
  MessageSquare, 
  GraduationCap, 
  Video, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Star, 
  ExternalLink, 
  Sparkles, 
  Eye, 
  Award, 
  Briefcase, 
  BookOpen, 
  Play, 
  X,
  Clock,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Upload,
  FileImage,
  Palette
} from 'lucide-react';
import { formatYouTubeEmbedUrl, readFileAsDataUrl } from '../utils/mediaAndTextHelpers';
import { SiteBrandingCustomizer } from './SiteBrandingCustomizer';

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
}) => {
  const [activeTab, setActiveTab] = useState<'branding' | 'testimonials' | 'curriculum' | 'videos' | 'photos' | 'faqs'>('branding');

  // Testimonial Modal State
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialItem | null>(null);
  const [testName, setTestName] = useState('');
  const [testRole, setTestRole] = useState('');
  const [testAvatar, setTestAvatar] = useState('');
  const [testRating, setTestRating] = useState(5);
  const [testContent, setTestContent] = useState('');
  const [testFeatured, setTestFeatured] = useState(true);

  // Curriculum Modal State
  const [isCurriculumModalOpen, setIsCurriculumModalOpen] = useState(false);
  const [editingCurriculum, setEditingCurriculum] = useState<CurriculumItem | null>(null);
  const [currTitle, setCurrTitle] = useState('');
  const [currInstitution, setCurrInstitution] = useState('');
  const [currPeriod, setCurrPeriod] = useState('');
  const [currCategory, setCurrCategory] = useState<'education' | 'experience' | 'certification' | 'award'>('education');
  const [currDescription, setCurrDescription] = useState('');
  const [currSkills, setCurrSkills] = useState('');

  // Video Modal State
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [vidTitle, setVidTitle] = useState('');
  const [vidCategory, setVidCategory] = useState('Aula de Amostra');
  const [vidUrl, setVidUrl] = useState('');
  const [vidThumbnail, setVidThumbnail] = useState('');
  const [vidDuration, setVidDuration] = useState('05:00');
  const [vidDescription, setVidDescription] = useState('');
  const [vidFeatured, setVidFeatured] = useState(false);

  // Photo Modal State
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<PhotoItem | null>(null);
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoCategory, setPhotoCategory] = useState<'aulas' | 'espaco' | 'conquistas' | 'bastidores'>('aulas');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');

  // FAQ Modal State
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqCategory, setFaqCategory] = useState<'online' | 'agendamento' | 'pagamento' | 'geral'>('geral');
  const [faqFeatured, setFaqFeatured] = useState(true);

  // Search & Filters for Admin Tables
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [faqCategoryFilter, setFaqCategoryFilter] = useState('todos');

  // Preview & Notification State
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Preset Image URLs for quick selection
  const presetAvatars = [
    { label: 'Aluna Mariana', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBK4ZdjGlXcYUkNbEPgBCJ2ybOX87uTuhEIW-bh1S_6aUuhw3LbpojczkFt7hLMuVkBrvtmonkTNLYDBnpXnY8VeoyWHUzo9lTl7o4AYZV53TqGGXbGuc3CVUOLKbpGRa80w_0YcCGtnYeuP97M5S1TuGnG5L72vqotjZDwMVDIWF9N7shtJ2fI_9L2OOOUCTYfgP1vQF4Vjms-_6o4t7L90jfsLMghpGEespEMyKNBXoQr7B-RD-cww' },
    { label: 'Aluno João', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' },
    { label: 'Aluna Ana', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
    { label: 'Aluno Lucas', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80' },
    { label: 'Aluna Maria', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
  ];

  const presetPhotos = [
    { label: 'Aula 1-a-1', url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80' },
    { label: 'Estúdio / Espaço', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80' },
    { label: 'Material de Apoio', url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80' },
    { label: 'Conquistas / Turma', url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80' },
    { label: 'Tecnologia em Aula', url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80' },
    { label: 'Laboratório', url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80' },
  ];

  // ---------------- TESTIMONIAL HANDLERS ----------------
  const openNewTestimonial = () => {
    setEditingTestimonial(null);
    setTestName('');
    setTestRole('');
    setTestAvatar(presetAvatars[0].url);
    setTestRating(5);
    setTestContent('');
    setTestFeatured(true);
    setIsTestimonialModalOpen(true);
  };

  const openEditTestimonial = (item: TestimonialItem) => {
    setEditingTestimonial(item);
    setTestName(item.studentName);
    setTestRole(item.roleOrCourse);
    setTestAvatar(item.avatarUrl);
    setTestRating(item.rating);
    setTestContent(item.content);
    setTestFeatured(item.featured ?? true);
    setIsTestimonialModalOpen(true);
  };

  const handleSaveTestimonial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim() || !testContent.trim()) return;

    if (editingTestimonial) {
      const updated = testimonials.map((t) =>
        t.id === editingTestimonial.id
          ? {
              ...t,
              studentName: testName,
              roleOrCourse: testRole || 'Aluno',
              avatarUrl: testAvatar || presetAvatars[0].url,
              rating: testRating,
              content: testContent,
              featured: testFeatured,
            }
          : t
      );
      onUpdateTestimonials(updated);
      showToast('Depoimento atualizado com sucesso!');
    } else {
      const newItem: TestimonialItem = {
        id: `test-${Date.now()}`,
        studentName: testName,
        roleOrCourse: testRole || 'Aluno',
        avatarUrl: testAvatar || presetAvatars[0].url,
        rating: testRating,
        content: testContent,
        date: new Date().toLocaleDateString('pt-BR'),
        verified: true,
        featured: testFeatured,
      };
      onUpdateTestimonials([newItem, ...testimonials]);
      showToast('Novo depoimento adicionado ao site!');
    }
    setIsTestimonialModalOpen(false);
  };

  const handleDeleteTestimonial = (id: string) => {
    onUpdateTestimonials(testimonials.filter((t) => t.id !== id));
    showToast('Depoimento removido.');
  };

  // ---------------- CURRICULUM HANDLERS ----------------
  const openNewCurriculum = () => {
    setEditingCurriculum(null);
    setCurrTitle('');
    setCurrInstitution('');
    setCurrPeriod('');
    setCurrCategory('education');
    setCurrDescription('');
    setCurrSkills('');
    setIsCurriculumModalOpen(true);
  };

  const openEditCurriculum = (item: CurriculumItem) => {
    setEditingCurriculum(item);
    setCurrTitle(item.title);
    setCurrInstitution(item.institution);
    setCurrPeriod(item.period);
    setCurrCategory(item.category);
    setCurrDescription(item.description);
    setCurrSkills(item.skills?.join(', ') || '');
    setIsCurriculumModalOpen(true);
  };

  const handleSaveCurriculum = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currTitle.trim() || !currInstitution.trim()) return;

    const skillsArray = currSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingCurriculum) {
      const updated = curriculum.map((c) =>
        c.id === editingCurriculum.id
          ? {
              ...c,
              title: currTitle,
              institution: currInstitution,
              period: currPeriod,
              category: currCategory,
              description: currDescription,
              skills: skillsArray,
            }
          : c
      );
      onUpdateCurriculum(updated);
      showToast('Currículo atualizado com sucesso!');
    } else {
      const newItem: CurriculumItem = {
        id: `curr-${Date.now()}`,
        title: currTitle,
        institution: currInstitution,
        period: currPeriod || '2024',
        category: currCategory,
        description: currDescription,
        skills: skillsArray,
      };
      onUpdateCurriculum([...curriculum, newItem]);
      showToast('Item adicionado ao currículo!');
    }
    setIsCurriculumModalOpen(false);
  };

  const handleDeleteCurriculum = (id: string) => {
    onUpdateCurriculum(curriculum.filter((c) => c.id !== id));
    showToast('Item de currículo removido.');
  };

  // ---------------- VIDEO HANDLERS ----------------
  const openNewVideo = () => {
    setEditingVideo(null);
    setVidTitle('');
    setVidCategory('Aula de Amostra');
    setVidUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
    setVidThumbnail('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80');
    setVidDuration('05:00');
    setVidDescription('');
    setVidFeatured(false);
    setIsVideoModalOpen(true);
  };

  const openEditVideo = (item: VideoItem) => {
    setEditingVideo(item);
    setVidTitle(item.title);
    setVidCategory(item.category);
    setVidUrl(item.videoUrl);
    setVidThumbnail(item.thumbnailUrl);
    setVidDuration(item.duration);
    setVidDescription(item.description);
    setVidFeatured(item.featured ?? false);
    setIsVideoModalOpen(true);
  };

  const handleSaveVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vidTitle.trim() || !vidUrl.trim()) return;

    // Sanitize YouTube URL automatically (converts watch?v= to /embed/ etc)
    const formattedUrl = formatYouTubeEmbedUrl(vidUrl);

    if (editingVideo) {
      const updated = videos.map((v) =>
        v.id === editingVideo.id
          ? {
              ...v,
              title: vidTitle,
              category: vidCategory,
              videoUrl: formattedUrl,
              thumbnailUrl: vidThumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
              duration: vidDuration,
              description: vidDescription,
              featured: vidFeatured,
            }
          : v
      );
      onUpdateVideos(updated);
      showToast('Vídeo atualizado com sucesso!');
    } else {
      const newItem: VideoItem = {
        id: `vid-${Date.now()}`,
        title: vidTitle,
        category: vidCategory,
        videoUrl: formattedUrl,
        thumbnailUrl: vidThumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
        duration: vidDuration,
        description: vidDescription,
        featured: vidFeatured,
      };
      onUpdateVideos([...videos, newItem]);
      showToast('Novo vídeo adicionado ao site!');
    }
    setIsVideoModalOpen(false);
  };

  const handleDeleteVideo = (id: string) => {
    onUpdateVideos(videos.filter((v) => v.id !== id));
    showToast('Vídeo removido.');
  };

  // ---------------- PHOTO HANDLERS ----------------
  const openNewPhoto = () => {
    setEditingPhoto(null);
    setPhotoTitle('');
    setPhotoCategory('aulas');
    setPhotoUrl(presetPhotos[0].url);
    setPhotoCaption('');
    setIsPhotoModalOpen(true);
  };

  const openEditPhoto = (item: PhotoItem) => {
    setEditingPhoto(item);
    setPhotoTitle(item.title);
    setPhotoCategory(item.category);
    setPhotoUrl(item.imageUrl);
    setPhotoCaption(item.caption);
    setIsPhotoModalOpen(true);
  };

  const handlePhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPhotoUrl(dataUrl);
      showToast('Foto carregada do dispositivo!');
    } catch (err) {
      showToast('Erro ao ler a imagem. Tente outro arquivo.');
    }
  };

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setTestAvatar(dataUrl);
      showToast('Avatar carregado do dispositivo!');
    } catch (err) {
      showToast('Erro ao ler o avatar.');
    }
  };

  const handleSavePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoTitle.trim() || !photoUrl.trim()) return;

    if (editingPhoto) {
      const updated = photos.map((p) =>
        p.id === editingPhoto.id
          ? {
              ...p,
              title: photoTitle,
              category: photoCategory,
              imageUrl: photoUrl,
              caption: photoCaption,
            }
          : p
      );
      onUpdatePhotos(updated);
      showToast('Foto atualizada com sucesso!');
    } else {
      const newItem: PhotoItem = {
        id: `photo-${Date.now()}`,
        title: photoTitle,
        category: photoCategory,
        imageUrl: photoUrl,
        caption: photoCaption,
        date: new Date().getFullYear().toString(),
      };
      onUpdatePhotos([...photos, newItem]);
      showToast('Nova foto adicionada à galeria!');
    }
    setIsPhotoModalOpen(false);
  };

  const handleDeletePhoto = (id: string) => {
    onUpdatePhotos(photos.filter((p) => p.id !== id));
    showToast('Foto removida da galeria.');
  };

  // ---------------- FAQ HANDLERS ----------------
  const openNewFaq = () => {
    setEditingFaq(null);
    setFaqQuestion('');
    setFaqAnswer('');
    setFaqCategory('geral');
    setFaqFeatured(true);
    setIsFaqModalOpen(true);
  };

  const openEditFaq = (item: FaqItem) => {
    setEditingFaq(item);
    setFaqQuestion(item.question);
    setFaqAnswer(item.answer);
    setFaqCategory(item.category as any);
    setFaqFeatured(item.featured ?? true);
    setIsFaqModalOpen(true);
  };

  const handleSaveFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion.trim() || !faqAnswer.trim()) return;

    if (editingFaq) {
      const updated = faqs.map((f) =>
        f.id === editingFaq.id
          ? {
              ...f,
              question: faqQuestion,
              answer: faqAnswer,
              category: faqCategory,
              featured: faqFeatured,
            }
          : f
      );
      onUpdateFaqs(updated);
      showToast('Dúvida (FAQ) atualizada com sucesso!');
    } else {
      const newItem: FaqItem = {
        id: `faq-${Date.now()}`,
        question: faqQuestion,
        answer: faqAnswer,
        category: faqCategory,
        featured: faqFeatured,
      };
      onUpdateFaqs([...faqs, newItem]);
      showToast('Nova dúvida adicionada ao FAQ!');
    }
    setIsFaqModalOpen(false);
  };

  const handleDeleteFaq = (id: string) => {
    onUpdateFaqs(faqs.filter((f) => f.id !== id));
    showToast('Dúvida removida do FAQ.');
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
              <span className="text-xs font-semibold text-slate-500">Vídeos & Aulas</span>
              <Video className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-[#091426] mt-2">{videos.length}</div>
            <span className="text-[11px] text-slate-500 font-medium">Aulas Demonstrativas</span>
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
            <span>Vídeos & Demonstrações ({videos.length})</span>
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

        {/* ------------------- TAB 1: DEPOIMENTOS ------------------- */}
        {activeTab === 'testimonials' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#091426]">
                  Depoimentos de Alunos Cadastrados
                </h2>
                <p className="text-xs text-slate-500">
                  Os depoimentos com nota 5 estrelas e foto aparecem em destaque no seu site público.
                </p>
              </div>

              <button
                onClick={openNewTestimonial}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00687a] hover:bg-[#004e5c] text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Novo Depoimento</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testimonials.map((test) => (
                <div
                  key={test.id}
                  className="bg-white rounded-2xl p-6 shadow-ambient border border-[#eceef0] flex flex-col justify-between hover:border-[#00687a]/40 transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={test.avatarUrl}
                          alt={test.studentName}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-xs"
                        />
                        <div>
                          <h3 className="font-bold text-sm text-[#091426]">{test.studentName}</h3>
                          <p className="text-xs text-[#00687a] font-medium">{test.roleOrCourse}</p>
                          <span className="text-[10px] text-slate-400">{test.date}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditTestimonial(test)}
                          className="p-2 text-slate-400 hover:text-[#00687a] hover:bg-cyan-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTestimonial(test.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex text-amber-400 gap-0.5">
                      {[...Array(test.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>

                    <p className="text-xs text-slate-600 italic leading-relaxed bg-[#f7f9fb] p-3 rounded-xl border border-slate-100">
                      "{test.content}"
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Aluno Verificado
                    </span>
                    {test.featured && (
                      <span className="bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-md border border-amber-200">
                        Destaque no Site
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------- TAB 2: CURRÍCULO ------------------- */}
        {activeTab === 'curriculum' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#091426]">
                  Qualificações, Formação & Experiência
                </h2>
                <p className="text-xs text-slate-500">
                  Adicione seus diplomas, certificações, prêmios e histórico de docência para gerar autoridade imediata.
                </p>
              </div>

              <button
                onClick={openNewCurriculum}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00687a] hover:bg-[#004e5c] text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Item ao Currículo</span>
              </button>
            </div>

            <div className="space-y-4">
              {curriculum.map((curr) => {
                const isEdu = curr.category === 'education';
                const isExp = curr.category === 'experience';
                const isCert = curr.category === 'certification';
                const isAward = curr.category === 'award';

                return (
                  <div
                    key={curr.id}
                    className="bg-white rounded-2xl p-6 shadow-ambient border border-[#eceef0] flex flex-col md:flex-row justify-between gap-4 hover:border-[#00687a]/40 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
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

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-sm text-[#091426]">{curr.title}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isEdu ? 'bg-cyan-50 text-[#00687a] border border-cyan-200' :
                            isExp ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            isCert ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                            'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {isEdu ? 'Formação' : isExp ? 'Experiência' : isCert ? 'Certificação' : 'Prêmio'}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-slate-700">
                          {curr.institution} <span className="text-slate-400 font-normal">({curr.period})</span>
                        </p>

                        <p className="text-xs text-slate-600 leading-relaxed pt-1 max-w-2xl">
                          {curr.description}
                        </p>

                        {curr.skills && curr.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {curr.skills.map((s, idx) => (
                              <span
                                key={idx}
                                className="text-[11px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md"
                              >
                                #{s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center justify-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <button
                        onClick={() => openEditCurriculum(curr)}
                        className="p-2 text-slate-500 hover:text-[#00687a] hover:bg-cyan-50 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span className="md:hidden">Editar</span>
                      </button>
                      <button
                        onClick={() => handleDeleteCurriculum(curr.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="md:hidden">Excluir</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------- TAB 3: VÍDEOS ------------------- */}
        {activeTab === 'videos' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#091426]">
                  Vídeos Demonstrativos & Aulas de Amostra
                </h2>
                <p className="text-xs text-slate-500">
                  Mostre sua didática na prática com vídeos incorporados do YouTube ou links diretos.
                </p>
              </div>

              <button
                onClick={openNewVideo}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00687a] hover:bg-[#004e5c] text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Novo Vídeo</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {videos.map((vid) => (
                <div
                  key={vid.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-ambient border border-[#eceef0] flex flex-col justify-between hover:border-[#00687a]/40 transition-all group"
                >
                  <div>
                    {/* Thumbnail with Play Overlay */}
                    <div className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer" onClick={() => setPreviewVideoUrl(vid.videoUrl)}>
                      <img
                        src={vid.thumbnailUrl}
                        alt={vid.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/90 text-rose-600 flex items-center justify-center shadow-elevated group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 fill-rose-600 ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                        {vid.duration}
                      </span>
                    </div>

                    <div className="p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                          {vid.category}
                        </span>
                        {vid.featured && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                            Destaque
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-sm text-[#091426] line-clamp-2">
                        {vid.title}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {vid.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setPreviewVideoUrl(vid.videoUrl)}
                      className="text-xs text-[#00687a] font-semibold hover:underline flex items-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Testar Play</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditVideo(vid)}
                        className="p-1.5 text-slate-400 hover:text-[#00687a] rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteVideo(vid.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------- TAB 4: FOTOS ------------------- */}
        {activeTab === 'photos' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#091426]">
                  Galeria de Fotos do Professor & Espaço
                </h2>
                <p className="text-xs text-slate-500">
                  Fotos de alta qualidade de aulas práticas, materiais didáticos, estúdio e momentos de conquista.
                </p>
              </div>

              <button
                onClick={openNewPhoto}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00687a] hover:bg-[#004e5c] text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Nova Foto</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-ambient border border-[#eceef0] flex flex-col justify-between hover:border-[#00687a]/40 transition-all group"
                >
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    <img
                      src={photo.imageUrl}
                      alt={photo.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                      {photo.category}
                    </span>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <h3 className="font-bold text-sm text-[#091426] line-clamp-1">{photo.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {photo.caption}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">Ano: {photo.date || '2024'}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditPhoto(photo)}
                        className="p-1.5 text-slate-400 hover:text-[#00687a] rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------- TAB 5: FAQ & PERGUNTAS FREQUENTES ------------------- */}
        {activeTab === 'faqs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#091426]">
                  Perguntas & Respostas Frequentes (FAQ)
                </h2>
                <p className="text-xs text-slate-500">
                  Esclareça dúvidas comuns dos novos alunos sobre formatos de aula, cancelamento, pagamentos e suporte.
                </p>
              </div>

              <button
                onClick={openNewFaq}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00687a] hover:bg-[#004e5c] text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Pergunta FAQ</span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                {[
                  { id: 'todos', label: 'Todas' },
                  { id: 'online', label: 'Aulas Online' },
                  { id: 'agendamento', label: 'Agendamento' },
                  { id: 'pagamento', label: 'Pagamento' },
                  { id: 'geral', label: 'Geral' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setFaqCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      faqCategoryFilter === cat.id
                        ? 'bg-[#00687a] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar dúvidas..."
                  value={faqSearchQuery}
                  onChange={(e) => setFaqSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#00687a]"
                />
              </div>
            </div>

            {/* FAQ List */}
            <div className="space-y-3.5">
              {faqs
                .filter((f) => {
                  const matchCat = faqCategoryFilter === 'todos' || f.category === faqCategoryFilter;
                  const matchSearch = f.question.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
                                      f.answer.toLowerCase().includes(faqSearchQuery.toLowerCase());
                  return matchCat && matchSearch;
                })
                .map((faq) => (
                  <div
                    key={faq.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-ambient hover:border-[#00687a]/40 transition-all flex flex-col md:flex-row justify-between gap-4 items-start"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          faq.category === 'online' ? 'bg-cyan-50 text-cyan-800 border border-cyan-200' :
                          faq.category === 'agendamento' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                          faq.category === 'pagamento' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          'bg-purple-50 text-purple-800 border border-purple-200'
                        }`}>
                          {faq.category}
                        </span>
                        {faq.featured && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                            ★ Em Destaque
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-sm md:text-base text-[#091426]">
                        {faq.question}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 self-end md:self-center shrink-0 pt-2 md:pt-0">
                      <button
                        onClick={() => openEditFaq(faq)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-[#00687a] hover:text-white text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDeleteFaq(faq.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

      </div>

      {/* ================= MODAL DEPOIMENTO ================= */}
      {isTestimonialModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-elevated border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-[#00687a]" />
                <h3 className="font-bold text-base text-[#091426]">
                  {editingTestimonial ? 'Editar Depoimento' : 'Novo Depoimento de Aluno'}
                </h3>
              </div>
              <button
                onClick={() => setIsTestimonialModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTestimonial} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Aluno</label>
                <input
                  type="text"
                  required
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="Ex: Mariana Costa"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#00687a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Curso / Conquista</label>
                  <input
                    type="text"
                    value={testRole}
                    onChange={(e) => setTestRole(e.target.value)}
                    placeholder="Ex: Aprovada em Medicina"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Avaliação (Estrelas)</label>
                  <select
                    value={testRating}
                    onChange={(e) => setTestRating(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 Estrelas)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 Estrelas)</option>
                    <option value={3}>⭐⭐⭐ (3 Estrelas)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Avatar / Foto do Aluno</label>
                <div className="flex gap-2 items-center mb-2">
                  <input
                    type="url"
                    value={testAvatar}
                    onChange={(e) => setTestAvatar(e.target.value)}
                    placeholder="https://... ou faça upload"
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-mono"
                  />
                  <label className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer shrink-0 transition-colors border border-slate-300">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {testAvatar && (
                  <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-200 mb-2">
                    <img src={testAvatar} alt="Prévia" className="w-8 h-8 rounded-full object-cover" />
                    <span className="text-[11px] text-slate-600 font-medium truncate">Prévia do Avatar</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold">Sugestões rápidas:</span>
                  {presetAvatars.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTestAvatar(p.url)}
                      className="text-[10px] bg-slate-100 hover:bg-cyan-50 hover:text-[#00687a] px-2 py-0.5 rounded text-slate-600 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Texto do Depoimento</label>
                <textarea
                  rows={3}
                  required
                  value={testContent}
                  onChange={(e) => setTestContent(e.target.value)}
                  placeholder="Descreva a experiência do aluno com as suas aulas..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="featured-check"
                  checked={testFeatured}
                  onChange={(e) => setTestFeatured(e.target.checked)}
                  className="rounded text-[#00687a] focus:ring-[#00687a]"
                />
                <label htmlFor="featured-check" className="text-xs text-slate-700 font-medium">
                  Exibir em destaque no carrossel da página inicial
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTestimonialModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#00687a] text-white hover:bg-[#004e5c] rounded-xl shadow-xs"
                >
                  {editingTestimonial ? 'Salvar Alterações' : 'Adicionar Depoimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL CURRÍCULO ================= */}
      {isCurriculumModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-elevated border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-5 h-5 text-[#00687a]" />
                <h3 className="font-bold text-base text-[#091426]">
                  {editingCurriculum ? 'Editar Item do Currículo' : 'Novo Título / Experiência'}
                </h3>
              </div>
              <button
                onClick={() => setIsCurriculumModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCurriculum} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título / Curso / Cargo</label>
                <input
                  type="text"
                  required
                  value={currTitle}
                  onChange={(e) => setCurrTitle(e.target.value)}
                  placeholder="Ex: Mestrado em Educação & Metodologias"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Instituição / Empresa</label>
                  <input
                    type="text"
                    required
                    value={currInstitution}
                    onChange={(e) => setCurrInstitution(e.target.value)}
                    placeholder="Ex: Universidade de São Paulo (USP)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={currCategory}
                    onChange={(e) => setCurrCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                  >
                    <option value="education">🎓 Formação Acadêmica</option>
                    <option value="experience">💼 Experiência Docente</option>
                    <option value="certification">📜 Certificação Especialista</option>
                    <option value="award">🏆 Prêmio / Reconhecimento</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Período / Ano</label>
                  <input
                    type="text"
                    value={currPeriod}
                    onChange={(e) => setCurrPeriod(e.target.value)}
                    placeholder="Ex: 2019 - 2021"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tags / Habilidades (separar por vírgula)</label>
                  <input
                    type="text"
                    value={currSkills}
                    onChange={(e) => setCurrSkills(e.target.value)}
                    placeholder="Ex: Didática, Neurociência"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição / Detalhes</label>
                <textarea
                  rows={3}
                  value={currDescription}
                  onChange={(e) => setCurrDescription(e.target.value)}
                  placeholder="Resumo das conquistas, carga horária ou foco da pesquisa..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCurriculumModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#00687a] text-white hover:bg-[#004e5c] rounded-xl shadow-xs"
                >
                  {editingCurriculum ? 'Salvar Alterações' : 'Adicionar Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL VÍDEO ================= */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-elevated border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <Video className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-base text-[#091426]">
                  {editingVideo ? 'Editar Vídeo' : 'Novo Vídeo Demonstrativo'}
                </h3>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVideo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título do Vídeo</label>
                <input
                  type="text"
                  required
                  value={vidTitle}
                  onChange={(e) => setVidTitle(e.target.value)}
                  placeholder="Ex: Como Funciona Nossa Metodologia de Aulas"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria / Tópico</label>
                  <input
                    type="text"
                    value={vidCategory}
                    onChange={(e) => setVidCategory(e.target.value)}
                    placeholder="Ex: Aula de Amostra"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duração (Ex: 04:30)</label>
                  <input
                    type="text"
                    value={vidDuration}
                    onChange={(e) => setVidDuration(e.target.value)}
                    placeholder="Ex: 05:20"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">URL de Incorporação (YouTube Embed ou MP4)</label>
                <input
                  type="url"
                  required
                  value={vidUrl}
                  onChange={(e) => setVidUrl(e.target.value)}
                  placeholder="https://www.youtube.com/embed/..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">URL da Imagem de Capa (Thumbnail)</label>
                <input
                  type="url"
                  value={vidThumbnail}
                  onChange={(e) => setVidThumbnail(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={vidDescription}
                  onChange={(e) => setVidDescription(e.target.value)}
                  placeholder="Breve resumo do que é ensinado no vídeo..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-xl shadow-xs"
                >
                  {editingVideo ? 'Salvar Alterações' : 'Adicionar Vídeo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL FOTO ================= */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-elevated border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-[#091426]">
                  {editingPhoto ? 'Editar Foto' : 'Nova Foto da Galeria'}
                </h3>
              </div>
              <button
                onClick={() => setIsPhotoModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePhoto} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título da Foto</label>
                <input
                  type="text"
                  required
                  value={photoTitle}
                  onChange={(e) => setPhotoTitle(e.target.value)}
                  placeholder="Ex: Sessão Prática de Mentoria 1-a-1"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria</label>
                <select
                  value={photoCategory}
                  onChange={(e) => setPhotoCategory(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                >
                  <option value="aulas">📚 Aulas & Atendimentos</option>
                  <option value="espaco">🏢 Espaço & Estúdio</option>
                  <option value="conquistas">🏆 Conquistas & Alunos</option>
                  <option value="bastidores">🔍 Bastidores & Materiais</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Imagem / Foto</label>
                <div className="flex gap-2 items-center mb-2">
                  <input
                    type="url"
                    required
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... ou faça upload"
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-mono"
                  />
                  <label className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer shrink-0 transition-colors border border-slate-300">
                    <Upload className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {photoUrl && (
                  <div className="relative aspect-video max-h-36 rounded-xl overflow-hidden border border-slate-200 mb-2">
                    <img src={photoUrl} alt="Prévia" className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">Prévia</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold">Sugestões rápidas:</span>
                  {presetPhotos.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPhotoUrl(p.url)}
                      className="text-[10px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 px-2 py-0.5 rounded text-slate-600 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Legenda / Descrição</label>
                <textarea
                  rows={2}
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="Descreva o contexto da imagem..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 rounded-xl shadow-xs"
                >
                  {editingPhoto ? 'Salvar Alterações' : 'Adicionar Foto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL FAQ ================= */}
      {isFaqModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-elevated border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-5 h-5 text-cyan-700" />
                <h3 className="font-bold text-base text-[#091426]">
                  {editingFaq ? 'Editar Pergunta (FAQ)' : 'Nova Pergunta Frequente (FAQ)'}
                </h3>
              </div>
              <button
                onClick={() => setIsFaqModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFaq} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pergunta / Dúvida Comum</label>
                <input
                  type="text"
                  required
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                  placeholder="Ex: Como funciona a reposição em caso de falta?"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#00687a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria</label>
                <select
                  value={faqCategory}
                  onChange={(e) => setFaqCategory(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                >
                  <option value="online">💻 Aulas Online & Metodologia</option>
                  <option value="agendamento">📅 Agendamento & Reagendamento</option>
                  <option value="pagamento">💳 Pagamento & Planos</option>
                  <option value="geral">📌 Dúvidas Gerais</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Resposta Explicativa</label>
                <textarea
                  rows={4}
                  required
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  placeholder="Explique detalhadamente as regras, links de acesso ou políticas..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 leading-relaxed focus:bg-white focus:border-[#00687a]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="faq-featured-check"
                  checked={faqFeatured}
                  onChange={(e) => setFaqFeatured(e.target.checked)}
                  className="rounded text-[#00687a] focus:ring-[#00687a]"
                />
                <label htmlFor="faq-featured-check" className="text-xs text-slate-700 font-medium">
                  Exibir esta dúvida em destaque na landing page pública
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFaqModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#00687a] text-white hover:bg-[#004e5c] rounded-xl shadow-xs"
                >
                  {editingFaq ? 'Salvar Alterações' : 'Adicionar Pergunta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TESTE DE PLAY DE VÍDEO ================= */}
      {previewVideoUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewVideoUrl(null)}>
          <div className="bg-slate-900 rounded-3xl max-w-3xl w-full p-4 overflow-hidden shadow-elevated border border-slate-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 text-white">
              <span className="text-xs font-bold flex items-center gap-2">
                <Play className="w-4 h-4 text-rose-500 fill-rose-500" />
                Player de Demonstração
              </span>
              <button onClick={() => setPreviewVideoUrl(null)} className="p-1 text-slate-400 hover:text-white rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black">
              <iframe
                src={previewVideoUrl}
                title="Demonstração"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

    </main>
  );
};
