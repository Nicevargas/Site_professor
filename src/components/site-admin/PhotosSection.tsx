import React, { useState } from 'react';
import { TeacherProfile, PhotoItem } from '../../types';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit3,
  X,
  Upload
} from 'lucide-react';
import { readFileAsDataUrl } from '../../utils/mediaAndTextHelpers';
import { supabaseService } from '../../services/supabaseService';

interface PhotosSectionProps {
  currentTeacher: TeacherProfile;
  photos: PhotoItem[];
  onUpdatePhotos: (items: PhotoItem[]) => void;
  showToast: (msg: string) => void;
}

/** Seção "Photos" da tela Meu Site: lista, filtros e formulário (modal). */
export const PhotosSection: React.FC<PhotosSectionProps> = ({
  currentTeacher,
  photos,
  onUpdatePhotos,
  showToast,
}) => {
  // Photo Modal State
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<PhotoItem | null>(null);
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoCategory, setPhotoCategory] = useState<'aulas' | 'espaco' | 'conquistas' | 'bastidores'>('aulas');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');

  const presetPhotos = [
    { label: 'Aula 1-a-1', url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80' },
    { label: 'Estúdio / Espaço', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80' },
    { label: 'Material de Apoio', url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80' },
    { label: 'Conquistas / Turma', url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80' },
    { label: 'Tecnologia em Aula', url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80' },
    { label: 'Laboratório', url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80' },
  ];

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
      const savedItem = updated.find((p) => p.id === editingPhoto.id);
      if (savedItem) supabaseService.savePhoto(savedItem, currentTeacher.id);
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
      supabaseService.savePhoto(newItem, currentTeacher.id);
      showToast('Nova foto adicionada à galeria!');
    }
    setIsPhotoModalOpen(false);
  };

  const handleDeletePhoto = (id: string) => {
    onUpdatePhotos(photos.filter((p) => p.id !== id));
    supabaseService.deletePhoto(id);
    showToast('Foto removida da galeria.');
  };

  return (
    <>
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
    </>
  );
};
