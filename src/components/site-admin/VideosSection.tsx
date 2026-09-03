import React, { useState } from 'react';
import { TeacherProfile, VideoItem } from '../../types';
import {
  Video,
  Plus,
  Trash2,
  Edit3,
  BookOpen,
  Play,
  X,
  Search,
  Filter,
  Mic,
  Headphones,
  Tv,
  ShoppingBag,
  Tag,
  EyeOff,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { formatYouTubeEmbedUrl, formatAnyMediaEmbedUrl } from '../../utils/mediaAndTextHelpers';
import { supabaseService } from '../../services/supabaseService';

interface VideosSectionProps {
  currentTeacher: TeacherProfile;
  videos: VideoItem[];
  onUpdateVideos: (items: VideoItem[]) => void;
  showToast: (msg: string) => void;
}

/** Seção "Videos" da tela Meu Site: lista, filtros e formulário (modal). */
export const VideosSection: React.FC<VideosSectionProps> = ({
  currentTeacher,
  videos,
  onUpdateVideos,
  showToast,
}) => {
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

  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

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

  return (
    <>
        {(() => {
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
    </>
  );
};
