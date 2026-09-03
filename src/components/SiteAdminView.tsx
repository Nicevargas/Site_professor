import React, { useState, useEffect } from 'react';
import { TeacherProfile, TestimonialItem, CurriculumItem, VideoItem, PhotoItem, FaqItem, SiteAdminTab } from '../types';
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
  Palette,
  Mic,
  Radio,
  Headphones,
  Film,
  Tv,
  Music,
  PlayCircle,
  ShoppingBag,
  Tag,
  EyeOff,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  BadgeCheck
} from 'lucide-react';
import { formatYouTubeEmbedUrl, formatAnyMediaEmbedUrl, readFileAsDataUrl } from '../utils/mediaAndTextHelpers';
import { supabaseService } from '../services/supabaseService';
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

  // Video & Podcast Modal State
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [vidMediaType, setVidMediaType] = useState<'podcast' | 'curso_online' | 'institucional' | 'vendas'>('curso_online');
  const [vidActive, setVidActive] = useState<boolean>(true);
  const [vidTitle, setVidTitle] = useState('');
  const [vidCategory, setVidCategory] = useState('Aulas & Didática');
  const [vidUrl, setVidUrl] = useState('');
  const [vidThumbnail, setVidThumbnail] = useState('');
  const [vidDuration, setVidDuration] = useState('04:00');
  const [vidDescription, setVidDescription] = useState('');
  const [vidFeatured, setVidFeatured] = useState(false);
  const [vidEpisodeNumber, setVidEpisodeNumber] = useState('');
  const [vidSpeakerOrGuest, setVidSpeakerOrGuest] = useState('');
  const [vidSpotifyUrl, setVidSpotifyUrl] = useState('');

  // Video Filter State for Admin Tab
  const [videoTypeFilter, setVideoTypeFilter] = useState<'todos' | 'podcast' | 'curso_online' | 'institucional' | 'vendas'>('todos');
  const [videoStatusFilter, setVideoStatusFilter] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [videoCategoryFilter, setVideoCategoryFilter] = useState<string>('todos');
  const [videoSearchQuery, setVideoSearchQuery] = useState('');

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

  // Sugestões de categoria por tipo de conteúdo (a categoria continua livre para digitar)
  const VIDEO_CATEGORY_PRESETS: Record<'podcast' | 'curso_online' | 'institucional' | 'vendas', string[]> = {
    podcast: ['Entrevistas & Debates', 'Bate-papo com Alunos', 'Dicas Rápidas', 'Bastidores'],
    curso_online: ['Aulas & Didática', 'Treino & Performance', 'Resolução de Exercícios', 'Módulo Introdutório'],
    institucional: ['Metodologia & Apresentação', 'Infraestrutura & Espaço', 'Depoimentos & Prova Social', 'Boas-vindas'],
    vendas: ['Lançamentos & Ofertas', 'Matrículas Abertas', 'Planos & Pacotes', 'Mentoria Exclusiva'],
  };

  const presetVideoThumbnails = {
    institucional: [
      { label: 'Apresentação & Metodologia', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80' },
      { label: 'Tour pelo Espaço & Estúdio', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80' },
      { label: 'Boas-Vindas & Resultados', url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80' },
    ],
    curso_online: [
      { label: 'Curso / Aula Didática', url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80' },
      { label: 'Resolução de Questões', url: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&auto=format&fit=crop&q=80' },
      { label: 'Material & Quadro Digital', url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80' },
    ],
    videoaula: [
      { label: 'Curso / Aula Didática', url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80' },
      { label: 'Resolução de Questões', url: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&auto=format&fit=crop&q=80' },
      { label: 'Material & Quadro Digital', url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80' },
    ],
    podcast: [
      { label: 'Microfone de Estúdio', url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=80' },
      { label: 'Entrevista / Fones', url: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&auto=format&fit=crop&q=80' },
      { label: 'Mesa de Áudio & Podcast', url: 'https://images.unsplash.com/photo-1589903102058-aebd6ac8990d?w=800&auto=format&fit=crop&q=80' },
    ],
    vendas: [
      { label: 'Apresentação de Oferta & Planos', url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80' },
      { label: 'Matrículas & Inscrições Abertas', url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=80' },
      { label: 'Mentoria Exclusiva & Vagas', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80' },
    ]
  };

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

  // ---------------- VIDEO, CURSO & PODCAST HANDLERS ----------------
  const handleToggleActiveVideo = (item: VideoItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = item.active === false ? true : false;
    const updated = videos.map((v) => (v.id === item.id ? { ...v, active: newStatus } : v));
    onUpdateVideos(updated);
    supabaseService.saveVideo({ ...item, active: newStatus }, currentTeacher.id);
    showToast(newStatus ? `"${item.title}" agora está ATIVO e visível no site.` : `"${item.title}" agora está INATIVO (oculto do público).`);
  };

  const openNewVideo = (type: 'podcast' | 'curso_online' | 'institucional' | 'vendas' = 'curso_online') => {
    setEditingVideo(null);
    setVidMediaType(type);
    setVidActive(true);
    setVidFeatured(false);
    
    if (type === 'podcast') {
      setVidTitle('');
      setVidCategory('Entrevistas & Debates');
      setVidUrl('https://open.spotify.com/embed/episode/7777777777777777777777');
      setVidSpotifyUrl('https://open.spotify.com/');
      setVidThumbnail(presetVideoThumbnails.podcast[0].url);
      setVidDuration('35:00');
      setVidDescription('');
      setVidEpisodeNumber(`EP #${videos.filter(v => v.mediaType === 'podcast').length + 1}`);
      setVidSpeakerOrGuest(`${currentTeacher.name} & Convidado`);
    } else if (type === 'curso_online') {
      setVidTitle('');
      setVidCategory('Aulas & Didática');
      setVidUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
      setVidThumbnail(presetVideoThumbnails.curso_online[0].url);
      setVidDuration('15:00');
      setVidDescription('');
      setVidEpisodeNumber(`Módulo 0${videos.filter(v => v.mediaType === 'curso_online' || v.mediaType === 'videoaula').length + 1}`);
      setVidSpeakerOrGuest(currentTeacher.name);
    } else if (type === 'institucional') {
      setVidTitle('');
      setVidCategory('Metodologia & Apresentação');
      setVidUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
      setVidThumbnail(presetVideoThumbnails.institucional[0].url);
      setVidDuration('03:30');
      setVidDescription('');
      setVidEpisodeNumber('Apresentação Oficial');
      setVidSpeakerOrGuest(currentTeacher.name);
    } else {
      // vendas
      setVidTitle('');
      setVidCategory('Lançamentos & Ofertas');
      setVidUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
      setVidThumbnail(presetVideoThumbnails.vendas[0].url);
      setVidDuration('04:30');
      setVidDescription('');
      setVidEpisodeNumber('Matrículas & Planos');
      setVidSpeakerOrGuest(currentTeacher.name);
    }

    setIsVideoModalOpen(true);
  };

  // Troca de tipo dentro do formulário: ajusta a categoria sugerida se ela ainda for uma das sugestões
  const changeVideoType = (type: 'podcast' | 'curso_online' | 'institucional' | 'vendas') => {
    setVidMediaType(type);
    const allPresets = Object.values(VIDEO_CATEGORY_PRESETS).flat();
    if (!vidCategory.trim() || allPresets.includes(vidCategory)) {
      setVidCategory(VIDEO_CATEGORY_PRESETS[type][0]);
    }
  };

  const openEditVideo = (item: VideoItem) => {
    setEditingVideo(item);
    const resolvedType: 'podcast' | 'curso_online' | 'institucional' | 'vendas' = 
      item.mediaType === 'podcast' ? 'podcast' :
      item.mediaType === 'vendas' ? 'vendas' :
      item.mediaType === 'curso_online' || item.mediaType === 'videoaula' ? 'curso_online' :
      item.mediaType === 'institucional' ? 'institucional' :
      (item.category?.toLowerCase().includes('podcast') ? 'podcast' :
       item.category?.toLowerCase().includes('venda') || item.category?.toLowerCase().includes('oferta') ? 'vendas' :
       item.category?.toLowerCase().includes('aula') ? 'curso_online' : 'institucional');

    setVidMediaType(resolvedType);
    setVidActive(item.active !== false);
    setVidTitle(item.title);
    setVidCategory(item.category || (resolvedType === 'podcast' ? 'Entrevistas & Debates' : resolvedType === 'curso_online' ? 'Aulas & Didática' : resolvedType === 'vendas' ? 'Lançamentos & Ofertas' : 'Metodologia & Apresentação'));
    setVidUrl(item.videoUrl);
    setVidThumbnail(item.thumbnailUrl);
    setVidDuration(item.duration);
    setVidDescription(item.description);
    setVidFeatured(item.featured ?? false);
    setVidEpisodeNumber(item.episodeNumber || '');
    setVidSpeakerOrGuest(item.speakerOrGuest || '');
    setVidSpotifyUrl(item.spotifyUrl || '');
    setIsVideoModalOpen(true);
  };

  const handleSaveVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vidTitle.trim() || !vidUrl.trim()) return;

    // Sanitize any media URL automatically (YouTube, Spotify, Vimeo, etc.)
    const { embedUrl } = formatAnyMediaEmbedUrl(vidUrl);
    const finalEmbedUrl = embedUrl || formatYouTubeEmbedUrl(vidUrl);

    // Default fallback thumbnail based on media type
    const fallbackThumb = vidMediaType === 'podcast' 
      ? presetVideoThumbnails.podcast[0].url
      : vidMediaType === 'curso_online'
      ? presetVideoThumbnails.curso_online[0].url
      : vidMediaType === 'vendas'
      ? presetVideoThumbnails.vendas[0].url
      : presetVideoThumbnails.institucional[0].url;

    const typeLabels = {
      podcast: 'Podcast',
      curso_online: 'Curso Online',
      institucional: 'Vídeo Institucional',
      vendas: 'Vídeo de Vendas'
    };

    if (editingVideo) {
      const updatedItem: VideoItem = {
        ...editingVideo,
        title: vidTitle,
        mediaType: vidMediaType,
        category: vidCategory.trim() || 'Geral',
        active: vidActive,
        videoUrl: finalEmbedUrl,
        thumbnailUrl: vidThumbnail || fallbackThumb,
        duration: vidDuration,
        description: vidDescription,
        featured: vidFeatured,
        episodeNumber: vidEpisodeNumber.trim() || undefined,
        speakerOrGuest: vidSpeakerOrGuest.trim() || undefined,
        spotifyUrl: vidSpotifyUrl.trim() || undefined,
      };
      const updated = videos.map((v) => (v.id === editingVideo.id ? updatedItem : v));
      onUpdateVideos(updated);
      supabaseService.saveVideo(updatedItem, currentTeacher.id);
      showToast(`${typeLabels[vidMediaType]} atualizado com sucesso!`);
    } else {
      const newItem: VideoItem = {
        id: `vid-${Date.now()}`,
        title: vidTitle,
        mediaType: vidMediaType,
        category: vidCategory.trim() || 'Geral',
        active: vidActive,
        videoUrl: finalEmbedUrl,
        thumbnailUrl: vidThumbnail || fallbackThumb,
        duration: vidDuration,
        description: vidDescription,
        featured: vidFeatured,
        episodeNumber: vidEpisodeNumber.trim() || undefined,
        speakerOrGuest: vidSpeakerOrGuest.trim() || undefined,
        spotifyUrl: vidSpotifyUrl.trim() || undefined,
      };
      onUpdateVideos([...videos, newItem]);
      supabaseService.saveVideo(newItem, currentTeacher.id);
      showToast(`Novo ${typeLabels[vidMediaType]} adicionado com sucesso!`);
    }
    setIsVideoModalOpen(false);
  };

  const handleDeleteVideo = (id: string) => {
    onUpdateVideos(videos.filter((v) => v.id !== id));
    supabaseService.deleteVideo(id);
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

        {/* ------------------- TAB 3: VÍDEOS, CURSOS, PODCASTS & VENDAS ------------------- */}
        {activeTab === 'videos' && (() => {
          const countTotal = videos.length;
          const countActive = videos.filter(v => v.active !== false).length;
          const countInactive = videos.filter(v => v.active === false).length;

          const countPodcast = videos.filter(v => v.mediaType === 'podcast' || (!v.mediaType && v.category?.toLowerCase().includes('podcast'))).length;
          const countCursoOnline = videos.filter(v => v.mediaType === 'curso_online' || v.mediaType === 'videoaula' || (!v.mediaType && (v.category?.toLowerCase().includes('aula') || v.category?.toLowerCase().includes('amostra')))).length;
          const countInstitucional = videos.filter(v => v.mediaType === 'institucional' || (!v.mediaType && v.category?.toLowerCase().includes('institucional'))).length;
          const countVendas = videos.filter(v => v.mediaType === 'vendas' || (!v.mediaType && (v.category?.toLowerCase().includes('venda') || v.category?.toLowerCase().includes('oferta')))).length;

          const availableCategories = Array.from(new Set(videos.map(v => v.category).filter(Boolean))) as string[];

          const filteredVideos = videos.filter(vid => {
            const currentType: 'podcast' | 'curso_online' | 'institucional' | 'vendas' = 
              vid.mediaType === 'podcast' ? 'podcast' :
              vid.mediaType === 'vendas' ? 'vendas' :
              vid.mediaType === 'curso_online' || vid.mediaType === 'videoaula' ? 'curso_online' :
              vid.mediaType === 'institucional' ? 'institucional' :
              (vid.category?.toLowerCase().includes('podcast') ? 'podcast' :
               vid.category?.toLowerCase().includes('venda') || vid.category?.toLowerCase().includes('oferta') ? 'vendas' :
               vid.category?.toLowerCase().includes('aula') ? 'curso_online' : 'institucional');

            const matchesType = videoTypeFilter === 'todos' || currentType === videoTypeFilter;

            const isAct = vid.active !== false;
            const matchesStatus = 
              videoStatusFilter === 'todos' ||
              (videoStatusFilter === 'ativos' && isAct) ||
              (videoStatusFilter === 'inativos' && !isAct);

            const matchesCategory = videoCategoryFilter === 'todos' || vid.category === videoCategoryFilter;

            const matchesQuery = !videoSearchQuery.trim() || 
              vid.title.toLowerCase().includes(videoSearchQuery.toLowerCase()) ||
              vid.description.toLowerCase().includes(videoSearchQuery.toLowerCase()) ||
              (vid.category && vid.category.toLowerCase().includes(videoSearchQuery.toLowerCase())) ||
              (vid.speakerOrGuest && vid.speakerOrGuest.toLowerCase().includes(videoSearchQuery.toLowerCase())) ||
              (vid.episodeNumber && vid.episodeNumber.toLowerCase().includes(videoSearchQuery.toLowerCase()));

            return matchesType && matchesStatus && matchesCategory && matchesQuery;
          });

          return (
            <div className="space-y-6">
              {/* Header & Quick Action Buttons */}
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-200">
                <div>
                  <h2 className="text-lg font-bold text-[#091426] flex items-center gap-2">
                    <Video className="w-5 h-5 text-rose-600" />
                    <span>Divulgação Multimídia: Podcasts, Cursos Online, Institucional & Vendas</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Organize seus conteúdos por tipo (Podcast, Curso Online, Institucional ou Vendas), defina categorias e controle se cada vídeo está Ativo ou Oculto no site.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => openNewVideo('podcast')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>+ Podcast</span>
                  </button>

                  <button
                    onClick={() => openNewVideo('curso_online')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>+ Curso Online</span>
                  </button>

                  <button
                    onClick={() => openNewVideo('institucional')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>+ Institucional</span>
                  </button>

                  <button
                    onClick={() => openNewVideo('vendas')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>+ Vídeo de Vendas</span>
                  </button>

                  <button
                    onClick={() => openNewVideo('curso_online')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#00687a] hover:bg-[#004e5c] text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Conteúdo</span>
                  </button>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                <div 
                  onClick={() => { setVideoTypeFilter('todos'); setVideoStatusFilter('todos'); }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    videoTypeFilter === 'todos' && videoStatusFilter === 'todos'
                      ? 'bg-white border-[#00687a] shadow-xs ring-1 ring-[#00687a]'
                      : 'bg-white/80 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Geral</span>
                  <div className="text-xl font-extrabold text-[#091426] mt-0.5">{countTotal}</div>
                  <span className="text-[10px] text-slate-400">Cadastrados</span>
                </div>

                <div 
                  onClick={() => setVideoStatusFilter('ativos')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    videoStatusFilter === 'ativos'
                      ? 'bg-emerald-50/80 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                      : 'bg-white/80 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Ativos
                  </span>
                  <div className="text-xl font-extrabold text-emerald-800 mt-0.5">{countActive}</div>
                  <span className="text-[10px] text-emerald-600">No Ar no Site</span>
                </div>

                <div 
                  onClick={() => setVideoStatusFilter('inativos')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    videoStatusFilter === 'inativos'
                      ? 'bg-slate-100 border-slate-500 shadow-xs ring-1 ring-slate-500'
                      : 'bg-white/80 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block flex items-center gap-1">
                    <EyeOff className="w-3 h-3 text-slate-400" /> Inativos
                  </span>
                  <div className="text-xl font-extrabold text-slate-700 mt-0.5">{countInactive}</div>
                  <span className="text-[10px] text-slate-500">Rascunhos / Ocultos</span>
                </div>

                <div 
                  onClick={() => setVideoTypeFilter('podcast')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    videoTypeFilter === 'podcast'
                      ? 'bg-purple-50 border-purple-500 shadow-xs ring-1 ring-purple-500'
                      : 'bg-white/80 border-slate-200 hover:border-purple-300'
                  }`}
                >
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block flex items-center gap-1">
                    <Mic className="w-3 h-3" /> Podcasts
                  </span>
                  <div className="text-xl font-extrabold text-purple-900 mt-0.5">{countPodcast}</div>
                  <span className="text-[10px] text-purple-600">Áudio & Spotify</span>
                </div>

                <div 
                  onClick={() => setVideoTypeFilter('curso_online')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    videoTypeFilter === 'curso_online'
                      ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                      : 'bg-white/80 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> Cursos
                  </span>
                  <div className="text-xl font-extrabold text-emerald-900 mt-0.5">{countCursoOnline}</div>
                  <span className="text-[10px] text-emerald-600">Aulas Didáticas</span>
                </div>

                <div 
                  onClick={() => setVideoTypeFilter('institucional')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    videoTypeFilter === 'institucional'
                      ? 'bg-blue-50 border-blue-500 shadow-xs ring-1 ring-blue-500'
                      : 'bg-white/80 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block flex items-center gap-1">
                    <Tv className="w-3 h-3" /> Institucional
                  </span>
                  <div className="text-xl font-extrabold text-blue-900 mt-0.5">{countInstitucional}</div>
                  <span className="text-[10px] text-blue-600">Apresentações</span>
                </div>

                <div 
                  onClick={() => setVideoTypeFilter('vendas')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    videoTypeFilter === 'vendas'
                      ? 'bg-amber-50 border-amber-500 shadow-xs ring-1 ring-amber-500'
                      : 'bg-white/80 border-slate-200 hover:border-amber-300'
                  }`}
                >
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3" /> Vendas
                  </span>
                  <div className="text-xl font-extrabold text-amber-900 mt-0.5">{countVendas}</div>
                  <span className="text-[10px] text-amber-600">Ofertas & Planos</span>
                </div>
              </div>

              {/* Filters Strip & Search Bar */}
              <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                {/* Format Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setVideoTypeFilter('todos')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      videoTypeFilter === 'todos'
                        ? 'bg-[#00687a] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Todos ({videos.length})
                  </button>

                  <button
                    onClick={() => setVideoTypeFilter('podcast')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      videoTypeFilter === 'podcast'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-purple-50 hover:text-purple-700'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Podcasts ({countPodcast})</span>
                  </button>

                  <button
                    onClick={() => setVideoTypeFilter('curso_online')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      videoTypeFilter === 'curso_online'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Cursos Online ({countCursoOnline})</span>
                  </button>

                  <button
                    onClick={() => setVideoTypeFilter('institucional')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      videoTypeFilter === 'institucional'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>Institucionais ({countInstitucional})</span>
                  </button>

                  <button
                    onClick={() => setVideoTypeFilter('vendas')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      videoTypeFilter === 'vendas'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-800'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Vendas ({countVendas})</span>
                  </button>
                </div>

                {/* Status Filter & Category Dropdown & Search */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  {/* Status toggle pill group */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => setVideoStatusFilter('todos')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        videoStatusFilter === 'todos' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Status: Todos
                    </button>
                    <button
                      onClick={() => setVideoStatusFilter('ativos')}
                      className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                        videoStatusFilter === 'ativos' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:text-emerald-900'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" /> Ativos
                    </button>
                    <button
                      onClick={() => setVideoStatusFilter('inativos')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        videoStatusFilter === 'inativos' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Inativos
                    </button>
                  </div>

                  {/* Category Dropdown */}
                  {availableCategories.length > 0 && (
                    <div className="relative">
                      <select
                        value={videoCategoryFilter}
                        onChange={(e) => setVideoCategoryFilter(e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-300 text-slate-700 rounded-xl px-3 py-2 pr-7 font-medium focus:outline-hidden focus:border-[#00687a]"
                      >
                        <option value="todos">Todas Categorias</option>
                        {availableCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Search Field */}
                  <div className="relative min-w-[200px] flex-1 sm:flex-none">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={videoSearchQuery}
                      onChange={(e) => setVideoSearchQuery(e.target.value)}
                      placeholder="Buscar por título, categoria..."
                      className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#00687a]"
                    />
                    {videoSearchQuery && (
                      <button
                        onClick={() => setVideoSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid of Media Cards */}
              {filteredVideos.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Video className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-[#091426]">Nenhum conteúdo encontrado</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Não encontramos vídeos ou podcasts com os filtros selecionados (Formato: {videoTypeFilter}, Status: {videoStatusFilter}, Categoria: {videoCategoryFilter}).
                  </p>
                  <button
                    onClick={() => { 
                      setVideoTypeFilter('todos'); 
                      setVideoStatusFilter('todos');
                      setVideoCategoryFilter('todos');
                      setVideoSearchQuery(''); 
                    }}
                    className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                  >
                    Limpar Todos os Filtros
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {filteredVideos.map((vid) => {
                    const resolvedType: 'podcast' | 'curso_online' | 'institucional' | 'vendas' = 
                      vid.mediaType === 'podcast' ? 'podcast' :
                      vid.mediaType === 'vendas' ? 'vendas' :
                      vid.mediaType === 'curso_online' || vid.mediaType === 'videoaula' ? 'curso_online' :
                      vid.mediaType === 'institucional' ? 'institucional' :
                      (vid.category?.toLowerCase().includes('podcast') ? 'podcast' :
                       vid.category?.toLowerCase().includes('venda') || vid.category?.toLowerCase().includes('oferta') ? 'vendas' :
                       vid.category?.toLowerCase().includes('aula') ? 'curso_online' : 'institucional');

                    const isVideoActive = vid.active !== false;

                    return (
                      <div
                        key={vid.id}
                        className={`rounded-2xl overflow-hidden flex flex-col justify-between transition-all group ${
                          isVideoActive
                            ? 'bg-white shadow-ambient border border-[#eceef0] hover:border-[#00687a]/50'
                            : 'bg-slate-50/80 border border-dashed border-slate-300 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <div>
                          {/* Thumbnail with Play Overlay */}
                          <div 
                            className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer" 
                            onClick={() => setPreviewVideoUrl(vid.videoUrl)}
                          >
                            <img
                              src={vid.thumbnailUrl}
                              alt={vid.title}
                              referrerPolicy="no-referrer"
                              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                                isVideoActive ? 'opacity-90' : 'opacity-60 grayscale-40'
                              }`}
                            />
                            
                            {/* Top-Left: Type Badge */}
                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                              {resolvedType === 'podcast' ? (
                                <span className="flex items-center gap-1 bg-purple-900/90 backdrop-blur-xs text-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-md border border-purple-500/30">
                                  <Mic className="w-3 h-3 text-purple-300" />
                                  <span>Podcast</span>
                                </span>
                              ) : resolvedType === 'curso_online' ? (
                                <span className="flex items-center gap-1 bg-emerald-900/90 backdrop-blur-xs text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/30">
                                  <BookOpen className="w-3 h-3 text-emerald-300" />
                                  <span>Curso Online</span>
                                </span>
                              ) : resolvedType === 'vendas' ? (
                                <span className="flex items-center gap-1 bg-amber-900/90 backdrop-blur-xs text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-500/30">
                                  <ShoppingBag className="w-3 h-3 text-amber-300" />
                                  <span>Vendas</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 bg-blue-900/90 backdrop-blur-xs text-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-500/30">
                                  <Tv className="w-3 h-3 text-blue-300" />
                                  <span>Institucional</span>
                                </span>
                              )}

                              {vid.episodeNumber && (
                                <span className="bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                                  {vid.episodeNumber}
                                </span>
                              )}
                            </div>

                            {/* Top-Right: Active/Inactive Badge (Clickable) */}
                            <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => handleToggleActiveVideo(vid, e)}
                                title={isVideoActive ? "Conteúdo ATIVO no site. Clique para Ocultar/Desativar." : "Conteúdo INATIVO (oculto do público). Clique para Ativar."}
                                className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md shadow-xs transition-all ${
                                  isVideoActive
                                    ? 'bg-emerald-950/85 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50'
                                    : 'bg-slate-900/85 hover:bg-slate-800 text-slate-300 border border-slate-600'
                                }`}
                              >
                                {isVideoActive ? (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>Ativo</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3 h-3 text-amber-400" />
                                    <span>Inativo</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Center Play Button Overlay */}
                            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-white/95 text-[#00687a] flex items-center justify-center shadow-elevated group-hover:scale-110 transition-transform">
                                {resolvedType === 'podcast' ? (
                                  <Headphones className="w-5 h-5 text-purple-700" />
                                ) : (
                                  <Play className="w-5 h-5 fill-rose-600 text-rose-600 ml-0.5" />
                                )}
                              </div>
                            </div>

                            {/* Duration Badge */}
                            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                              {vid.duration}
                            </span>
                          </div>

                          <div className="p-5 space-y-2.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              {/* Category Pill */}
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00687a] bg-cyan-50 border border-cyan-200/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Tag className="w-2.5 h-2.5 text-[#00687a]" />
                                {vid.category}
                              </span>

                              <div className="flex items-center gap-1">
                                {!isVideoActive && (
                                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded">
                                    Oculto do Site
                                  </span>
                                )}
                                {vid.featured && (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded">
                                    ★ Destaque
                                  </span>
                                )}
                              </div>
                            </div>

                            <h3 className="font-bold text-sm text-[#091426] line-clamp-2 leading-snug">
                              {vid.title}
                            </h3>

                            {vid.speakerOrGuest && (
                              <p className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                                <span className="text-slate-400">Com:</span> {vid.speakerOrGuest}
                              </p>
                            )}

                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {vid.description}
                            </p>
                          </div>
                        </div>

                        {/* Card Footer with Actions */}
                        <div className="p-4 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between">
                          <button
                            onClick={() => setPreviewVideoUrl(vid.videoUrl)}
                            className="text-xs text-[#00687a] font-semibold hover:underline flex items-center gap-1"
                          >
                            {resolvedType === 'podcast' ? (
                              <>
                                <Headphones className="w-3.5 h-3.5 text-purple-600" />
                                <span>Ouvir</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 text-rose-600" />
                                <span>Assistir</span>
                              </>
                            )}
                          </button>

                          <div className="flex items-center gap-1">
                            {/* Toggle Active Switch Button */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleActiveVideo(vid, e)}
                              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold ${
                                isVideoActive 
                                  ? 'text-emerald-700 hover:bg-emerald-50' 
                                  : 'text-slate-500 hover:bg-slate-200/70'
                              }`}
                              title={isVideoActive ? "Clique para Desativar este vídeo" : "Clique para Ativar este vídeo"}
                            >
                              {isVideoActive ? (
                                <>
                                  <ToggleRight className="w-4 h-4 text-emerald-600" />
                                  <span className="hidden sm:inline">Ativo</span>
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="w-4 h-4 text-slate-400" />
                                  <span className="hidden sm:inline">Inativo</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => openEditVideo(vid)}
                              className="p-1.5 text-slate-400 hover:text-[#00687a] hover:bg-slate-200/60 rounded-lg transition-colors"
                              title="Editar este vídeo"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteVideo(vid.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Excluir este vídeo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

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

      {/* ================= MODAL VÍDEO, AULA & PODCAST ================= */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-elevated border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                {vidMediaType === 'podcast' ? (
                  <Mic className="w-5 h-5 text-purple-600" />
                ) : vidMediaType === 'curso_online' ? (
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                ) : vidMediaType === 'vendas' ? (
                  <ShoppingBag className="w-5 h-5 text-amber-600" />
                ) : (
                  <Tv className="w-5 h-5 text-blue-600" />
                )}
                <div>
                  <h3 className="font-bold text-base text-[#091426]">
                    {editingVideo 
                      ? `Editar ${
                          vidMediaType === 'podcast' ? 'Podcast' : 
                          vidMediaType === 'curso_online' ? 'Curso Online' : 
                          vidMediaType === 'vendas' ? 'Vídeo de Vendas' : 'Vídeo Institucional'
                        }`
                      : 'Novo Conteúdo Multimídia'
                    }
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Selecione o formato (Podcast, Curso Online, Institucional ou Vendas), defina a categoria e controle o status Ativo/Inativo.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVideo} className="space-y-4">
              {/* 1. Type Selector Pills - 4 Types */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  1. Formato / Tipo de Conteúdo
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      changeVideoType('podcast');
                      if (!editingVideo) {
                        setVidCategory('Podcast & Entrevistas');
                        setVidThumbnail(presetVideoThumbnails.podcast[0].url);
                        if (!vidEpisodeNumber) setVidEpisodeNumber(`EP #${videos.filter(v => v.mediaType === 'podcast').length + 1}`);
                      }
                    }}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center transition-all ${
                      vidMediaType === 'podcast'
                        ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold shadow-xs ring-1 ring-purple-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Mic className="w-4 h-4 text-purple-600" />
                    <span className="text-xs">Podcast</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      changeVideoType('curso_online');
                      if (!editingVideo) {
                        setVidCategory('Curso Online & Aulas');
                        setVidThumbnail(presetVideoThumbnails.curso_online[0].url);
                        if (!vidEpisodeNumber) setVidEpisodeNumber(`Aula #${videos.filter(v => v.mediaType === 'curso_online' || v.mediaType === 'videoaula').length + 1}`);
                      }
                    }}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center transition-all ${
                      vidMediaType === 'curso_online'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-xs ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs">Curso Online</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      changeVideoType('institucional');
                      if (!editingVideo) {
                        setVidCategory('Institucional & Metodologia');
                        setVidThumbnail(presetVideoThumbnails.institucional[0].url);
                      }
                    }}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center transition-all ${
                      vidMediaType === 'institucional'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-xs ring-1 ring-blue-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Tv className="w-4 h-4 text-blue-600" />
                    <span className="text-xs">Institucional</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      changeVideoType('vendas');
                      if (!editingVideo) {
                        setVidCategory('Planos & Matrículas');
                        setVidThumbnail(presetVideoThumbnails.vendas[0].url);
                      }
                    }}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center transition-all ${
                      vidMediaType === 'vendas'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold shadow-xs ring-1 ring-amber-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 text-amber-600" />
                    <span className="text-xs">Vendas</span>
                  </button>
                </div>
              </div>

              {/* 2. Status: Ativo / Inativo Toggle Box */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      {vidActive ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>Status do Conteúdo: {vidActive ? 'ATIVO NO SITE' : 'INATIVO (OCULTO)'}</span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {vidActive
                        ? '✓ Visível para todos os visitantes e alunos na área de vídeos.'
                        : '✕ Oculto da visualização pública, mantido como rascunho ou arquivo.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setVidActive(!vidActive)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                      vidActive
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {vidActive ? (
                      <>
                        <ToggleRight className="w-4 h-4" />
                        <span>Publicado</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4" />
                        <span>Oculto</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Title Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título do {
                    vidMediaType === 'podcast' ? 'Podcast / Episódio' : 
                    vidMediaType === 'curso_online' ? 'Curso Online / Aula' : 
                    vidMediaType === 'vendas' ? 'Vídeo de Vendas / Oferta' : 'Vídeo Institucional'
                  }
                </label>
                <input
                  type="text"
                  required
                  value={vidTitle}
                  onChange={(e) => setVidTitle(e.target.value)}
                  placeholder={
                    vidMediaType === 'podcast'
                      ? 'Ex: PodCast Didático #14 - Como Criar Rotinas de Estudo'
                      : vidMediaType === 'curso_online'
                      ? 'Ex: Módulo 01 - Fundamentos e Resolução Prática'
                      : vidMediaType === 'vendas'
                      ? 'Ex: Apresentação da Turma VIP e Condições Especiais'
                      : 'Ex: Conheça Nossa Metodologia de Ensino Personalizado'
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#00687a]"
                />
              </div>

              {/* Category & Duration with Suggestion Chips */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Categoria do Vídeo
                    </label>
                    <input
                      type="text"
                      required
                      value={vidCategory}
                      onChange={(e) => setVidCategory(e.target.value)}
                      placeholder="Ex: Metodologia, Aulas, Oferta..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Duração (Ex: 05:20 ou 42:00)
                    </label>
                    <input
                      type="text"
                      value={vidDuration}
                      onChange={(e) => setVidDuration(e.target.value)}
                      placeholder="Ex: 05:20"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                </div>

                {/* Category Preset Suggestions */}
                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                  <span className="text-[10px] text-slate-400 font-medium mr-1">Sugestões:</span>
                  {VIDEO_CATEGORY_PRESETS[vidMediaType].map((catPreset) => (
                    <button
                      key={catPreset}
                      type="button"
                      onClick={() => setVidCategory(catPreset)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                        vidCategory === catPreset
                          ? 'bg-[#00687a] text-white border-[#00687a] font-bold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                      }`}
                    >
                      {catPreset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Episode Number & Speaker / Guest */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nº do Episódio / Aula / Módulo (Opcional)
                  </label>
                  <input
                    type="text"
                    value={vidEpisodeNumber}
                    onChange={(e) => setVidEpisodeNumber(e.target.value)}
                    placeholder={
                      vidMediaType === 'podcast' ? 'Ex: EP #14' : 
                      vidMediaType === 'curso_online' ? 'Ex: Aula #01' : 
                      vidMediaType === 'vendas' ? 'Ex: Oferta 2025' : 'Ex: Geral'
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Apresentador / Professor / Convidado
                  </label>
                  <input
                    type="text"
                    value={vidSpeakerOrGuest}
                    onChange={(e) => setVidSpeakerOrGuest(e.target.value)}
                    placeholder="Ex: Prof. Roberto & Equipe"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Media URL Field */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    URL do Vídeo ou Áudio (YouTube, Spotify, Vimeo, MP4/MP3)
                  </label>
                  <span className="text-[10px] text-slate-400">YouTube, Spotify & Vimeo</span>
                </div>
                <input
                  type="url"
                  required
                  value={vidUrl}
                  onChange={(e) => setVidUrl(e.target.value)}
                  placeholder={
                    vidMediaType === 'podcast'
                      ? 'https://open.spotify.com/episode/... ou https://youtube.com/watch?v=...'
                      : 'https://www.youtube.com/watch?v=... ou https://vimeo.com/...'
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-mono focus:outline-hidden focus:border-[#00687a]"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {vidMediaType === 'podcast'
                    ? '💡 Suporta link padrão de episódio do Spotify ou link do YouTube.'
                    : '💡 Cole o link normal do YouTube (watch, share ou shorts) ou Vimeo.'}
                </p>
              </div>

              {/* Spotify External Link (Optional for Podcasts) */}
              {vidMediaType === 'podcast' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Link de Perfil / Canal no Spotify (Opcional para botão "Ouvir no Spotify")
                  </label>
                  <input
                    type="url"
                    value={vidSpotifyUrl}
                    onChange={(e) => setVidSpotifyUrl(e.target.value)}
                    placeholder="https://open.spotify.com/show/..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-mono"
                  />
                </div>
              )}

              {/* Thumbnail URL & Presets */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Imagem de Capa (Thumbnail)
                </label>
                <input
                  type="url"
                  value={vidThumbnail}
                  onChange={(e) => setVidThumbnail(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-mono"
                />

                {/* Quick Thumbnail Presets */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Sugestões de Capas para {
                      vidMediaType === 'podcast' ? 'Podcast' : 
                      vidMediaType === 'curso_online' ? 'Curso Online' : 
                      vidMediaType === 'vendas' ? 'Vendas' : 'Institucional'
                    }:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {presetVideoThumbnails[vidMediaType].map((p) => (
                      <button
                        key={p.url}
                        type="button"
                        onClick={() => setVidThumbnail(p.url)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                          vidThumbnail === p.url
                            ? 'bg-[#00687a] text-white border-[#00687a]'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resumo / Descrição do Conteúdo
                </label>
                <textarea
                  rows={2}
                  value={vidDescription}
                  onChange={(e) => setVidDescription(e.target.value)}
                  placeholder="Explique os tópicos abordados, aprendizados principais e benefícios para os alunos..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 leading-relaxed"
                />
              </div>

              {/* Featured Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="vidFeatured"
                  checked={vidFeatured}
                  onChange={(e) => setVidFeatured(e.target.checked)}
                  className="w-4 h-4 text-[#00687a] rounded border-slate-300 focus:ring-[#00687a]"
                />
                <label htmlFor="vidFeatured" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Destacar este conteúdo como principal na página pública
                </label>
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
                  className="px-5 py-2 text-xs font-bold bg-[#00687a] text-white hover:bg-[#004e5c] rounded-xl shadow-xs"
                >
                  {editingVideo ? 'Salvar Alterações' : 'Adicionar Conteúdo'}
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

      {/* ================= MODAL TESTE DE PLAY DE VÍDEO & PODCAST ================= */}
      {previewVideoUrl && (() => {
        const isSpotify = previewVideoUrl.includes('spotify.com');
        const isAudio = /\.(mp3|wav|ogg|aac|m4a)(\?.*)?$/i.test(previewVideoUrl);
        const isDirectVideo = /\.(mp4|webm|ogv|mov)(\?.*)?$/i.test(previewVideoUrl);

        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewVideoUrl(null)}>
            <div className={`bg-slate-900 rounded-3xl w-full p-4 overflow-hidden shadow-elevated border border-slate-700 ${isSpotify ? 'max-w-xl' : 'max-w-3xl'}`} onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center pb-3 text-white">
                <span className="text-xs font-bold flex items-center gap-2">
                  {isSpotify ? (
                    <>
                      <Mic className="w-4 h-4 text-purple-400" />
                      <span>Player Spotify / Podcast</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 text-rose-500 fill-rose-500" />
                      <span>Player de Demonstração</span>
                    </>
                  )}
                </span>
                <button onClick={() => setPreviewVideoUrl(null)} className="p-1 text-slate-400 hover:text-white rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isSpotify ? (
                <div className="w-full rounded-2xl overflow-hidden bg-black">
                  <iframe
                    src={previewVideoUrl}
                    title="Spotify Podcast"
                    className="w-full h-[232px] sm:h-[352px] border-0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
                </div>
              ) : isAudio ? (
                <div className="p-6 bg-slate-800 rounded-2xl flex flex-col items-center justify-center gap-4 text-white">
                  <Headphones className="w-12 h-12 text-[#57dffe]" />
                  <audio controls className="w-full">
                    <source src={previewVideoUrl} />
                    Seu navegador não suporta reprodução de áudio.
                  </audio>
                </div>
              ) : isDirectVideo ? (
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black">
                  <video controls className="w-full h-full object-contain">
                    <source src={previewVideoUrl} />
                    Seu navegador não suporta reprodução de vídeo.
                  </video>
                </div>
              ) : (
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black">
                  <iframe
                    src={previewVideoUrl}
                    title="Demonstração"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          </div>
        );
      })()}

    </main>
  );
};
