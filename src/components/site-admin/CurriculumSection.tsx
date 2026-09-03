import React, { useState } from 'react';
import { TeacherProfile, CurriculumItem } from '../../types';
import {
  GraduationCap,
  Plus,
  Trash2,
  Edit3,
  Award,
  Briefcase,
  BookOpen,
  X
} from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';

interface CurriculumSectionProps {
  currentTeacher: TeacherProfile;
  curriculum: CurriculumItem[];
  onUpdateCurriculum: (items: CurriculumItem[]) => void;
  showToast: (msg: string) => void;
}

/** Seção "Curriculum" da tela Meu Site: lista, filtros e formulário (modal). */
export const CurriculumSection: React.FC<CurriculumSectionProps> = ({
  currentTeacher,
  curriculum,
  onUpdateCurriculum,
  showToast,
}) => {
  // Curriculum Modal State
  const [isCurriculumModalOpen, setIsCurriculumModalOpen] = useState(false);
  const [editingCurriculum, setEditingCurriculum] = useState<CurriculumItem | null>(null);
  const [currTitle, setCurrTitle] = useState('');
  const [currInstitution, setCurrInstitution] = useState('');
  const [currPeriod, setCurrPeriod] = useState('');
  const [currCategory, setCurrCategory] = useState<'education' | 'experience' | 'certification' | 'award'>('education');
  const [currDescription, setCurrDescription] = useState('');
  const [currSkills, setCurrSkills] = useState('');


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
      const savedItem = updated.find((c) => c.id === editingCurriculum.id);
      if (savedItem) supabaseService.saveCurriculumItem(savedItem, currentTeacher.id);
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
      supabaseService.saveCurriculumItem(newItem, currentTeacher.id);
      showToast('Item adicionado ao currículo!');
    }
    setIsCurriculumModalOpen(false);
  };

  const handleDeleteCurriculum = (id: string) => {
    onUpdateCurriculum(curriculum.filter((c) => c.id !== id));
    supabaseService.deleteCurriculumItem(id);
    showToast('Item de currículo removido.');
  };

  return (
    <>
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
    </>
  );
};
