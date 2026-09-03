import React, { useState, useEffect } from 'react';
import { TeacherProfile, VideoItem } from '../../types';
import {
  BookOpen,
  X,
  Mic,
  Tv,
  ShoppingBag,
  EyeOff,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { formatYouTubeEmbedUrl, formatAnyMediaEmbedUrl } from '../../utils/mediaAndTextHelpers';
import { VideoMediaType, VIDEO_CATEGORY_PRESETS, presetVideoThumbnails } from './videoPresets';

export type VideoFormMode =
  | { kind: 'new'; type: VideoMediaType }
  | { kind: 'edit'; item: VideoItem };

interface VideoFormModalProps {
  mode: VideoFormMode;
  /** Lista atual, usada para numerar episódios e módulos */
  videos: VideoItem[];
  currentTeacher: TeacherProfile;
  onSave: (item: VideoItem, isEdit: boolean) => void;
  onClose: () => void;
}

/**
 * Formulário de vídeo, curso, podcast ou vídeo de vendas.
 * Guarda o próprio estado dos campos; quem persiste é a lista (VideosSection).
 */
export const VideoFormModal: React.FC<VideoFormModalProps> = ({ mode, videos, currentTeacher, onSave, onClose }) => {
  const editingVideo = mode.kind === 'edit' ? mode.item : null;

  const [vidMediaType, setVidMediaType] = useState<VideoMediaType>('curso_online');
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

  const changeVideoType = (type: VideoMediaType) => {
    setVidMediaType(type);
    const allPresets = Object.values(VIDEO_CATEGORY_PRESETS).flat();
    if (!vidCategory.trim() || allPresets.includes(vidCategory)) {
      setVidCategory(VIDEO_CATEGORY_PRESETS[type][0]);
    }
  };

  const initNew = (type: VideoMediaType) => {
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
  };


  const initEdit = (item: VideoItem) => {
    const resolvedType: VideoMediaType = 
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
  };

  // O modal monta a cada abertura: inicializa os campos conforme o modo
  useEffect(() => {
    if (mode.kind === 'edit') initEdit(mode.item);
    else initNew(mode.type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vidTitle.trim() || !vidUrl.trim()) return;

    // Normaliza qualquer link de mídia (YouTube, Spotify, Vimeo, arquivo direto)
    const { embedUrl } = formatAnyMediaEmbedUrl(vidUrl);
    const finalEmbedUrl = embedUrl || formatYouTubeEmbedUrl(vidUrl);
    const fallbackThumb = presetVideoThumbnails[vidMediaType][0].url;

    const fields = {
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

    const item: VideoItem = editingVideo
      ? { ...editingVideo, ...fields }
      : { id: `vid-${Date.now()}`, ...fields };
    onSave(item, Boolean(editingVideo));
  };

  return (
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
                onClick={() => onClose()}
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
                  onClick={() => onClose()}
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
  );
};
