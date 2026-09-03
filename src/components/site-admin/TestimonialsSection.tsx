import React, { useState } from 'react';
import { readFileAsDataUrl } from '../../utils/mediaAndTextHelpers';
import { TeacherProfile, TestimonialItem } from '../../types';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit3,
  Star,
  X,
  CheckCircle2,
  Upload
} from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';

interface TestimonialsSectionProps {
  currentTeacher: TeacherProfile;
  testimonials: TestimonialItem[];
  onUpdateTestimonials: (items: TestimonialItem[]) => void;
  showToast: (msg: string) => void;
}

/** Seção "Testimonials" da tela Meu Site: lista, filtros e formulário (modal). */
export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  currentTeacher,
  testimonials,
  onUpdateTestimonials,
  showToast,
}) => {
  // Testimonial Modal State
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialItem | null>(null);
  const [testName, setTestName] = useState('');
  const [testRole, setTestRole] = useState('');
  const [testAvatar, setTestAvatar] = useState('');
  const [testRating, setTestRating] = useState(5);
  const [testContent, setTestContent] = useState('');
  const [testFeatured, setTestFeatured] = useState(true);

  // Preset Image URLs for quick selection
  const presetAvatars = [
    { label: 'Aluna Mariana', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBK4ZdjGlXcYUkNbEPgBCJ2ybOX87uTuhEIW-bh1S_6aUuhw3LbpojczkFt7hLMuVkBrvtmonkTNLYDBnpXnY8VeoyWHUzo9lTl7o4AYZV53TqGGXbGuc3CVUOLKbpGRa80w_0YcCGtnYeuP97M5S1TuGnG5L72vqotjZDwMVDIWF9N7shtJ2fI_9L2OOOUCTYfgP1vQF4Vjms-_6o4t7L90jfsLMghpGEespEMyKNBXoQr7B-RD-cww' },
    { label: 'Aluno João', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' },
    { label: 'Aluna Ana', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
    { label: 'Aluno Lucas', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80' },
    { label: 'Aluna Maria', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
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
      const savedItem = updated.find((t) => t.id === editingTestimonial.id);
      if (savedItem) supabaseService.saveTestimonial(savedItem, currentTeacher.id);
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
      supabaseService.saveTestimonial(newItem, currentTeacher.id);
      showToast('Novo depoimento adicionado ao site!');
    }
    setIsTestimonialModalOpen(false);
  };

  const handleDeleteTestimonial = (id: string) => {
    onUpdateTestimonials(testimonials.filter((t) => t.id !== id));
    supabaseService.deleteTestimonial(id);
    showToast('Depoimento removido.');
  };

  return (
    <>
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
    </>
  );
};
