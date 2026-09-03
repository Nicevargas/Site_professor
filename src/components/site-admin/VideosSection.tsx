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
  Mic,
  Headphones,
  Tv,
  ShoppingBag,
  Tag,
  EyeOff,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';
import { VideoMediaType, VIDEO_TYPE_LABELS, resolveVideoType } from './videoPresets';
import { VideoFormModal, VideoFormMode } from './VideoFormModal';
import { VideoPreviewModal } from './VideoPreviewModal';

interface VideosSectionProps {
  currentTeacher: TeacherProfile;
  videos: VideoItem[];
  onUpdateVideos: (items: VideoItem[]) => void;
  showToast: (msg: string) => void;
}

/**
 * Seção "Vídeos e podcasts" da tela Meu Site: contadores, filtros e lista.
 * O formulário fica em VideoFormModal e o player de teste em VideoPreviewModal.
 */
export const VideosSection: React.FC<VideosSectionProps> = ({
  currentTeacher,
  videos,
  onUpdateVideos,
  showToast,
}) => {
  const [formMode, setFormMode] = useState<VideoFormMode | null>(null);

  // Filtros da lista
  const [videoTypeFilter, setVideoTypeFilter] = useState<'todos' | 'podcast' | 'curso_online' | 'institucional' | 'vendas'>('todos');
  const [videoStatusFilter, setVideoStatusFilter] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [videoCategoryFilter, setVideoCategoryFilter] = useState<string>('todos');
  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  const handleToggleActiveVideo = (item: VideoItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = item.active === false ? true : false;
    const updated = videos.map((v) => (v.id === item.id ? { ...v, active: newStatus } : v));
    onUpdateVideos(updated);
    supabaseService.saveVideo({ ...item, active: newStatus }, currentTeacher.id);
    showToast(newStatus ? `"${item.title}" agora está ATIVO e visível no site.` : `"${item.title}" agora está INATIVO (oculto do público).`);
  };

  const openNewVideo = (type: VideoMediaType = 'curso_online') => setFormMode({ kind: 'new', type });
  const openEditVideo = (item: VideoItem) => setFormMode({ kind: 'edit', item });

  const handleSaveVideo = (item: VideoItem, isEdit: boolean) => {
    onUpdateVideos(isEdit ? videos.map((v) => (v.id === item.id ? item : v)) : [...videos, item]);
    supabaseService.saveVideo(item, currentTeacher.id);
    const label = VIDEO_TYPE_LABELS[resolveVideoType(item)];
    showToast(isEdit ? `${label} atualizado com sucesso!` : `Novo ${label} adicionado com sucesso!`);
    setFormMode(null);
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

      {formMode && (
        <VideoFormModal
          mode={formMode}
          videos={videos}
          currentTeacher={currentTeacher}
          onSave={handleSaveVideo}
          onClose={() => setFormMode(null)}
        />
      )}

      {previewVideoUrl && <VideoPreviewModal url={previewVideoUrl} onClose={() => setPreviewVideoUrl(null)} />}
    </>
  );
};
