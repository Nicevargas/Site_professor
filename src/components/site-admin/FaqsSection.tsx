import React, { useState } from 'react';
import { TeacherProfile, FaqItem } from '../../types';
import {
  Plus,
  Trash2,
  Edit3,
  X,
  Search,
  Filter,
  HelpCircle
} from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';

interface FaqsSectionProps {
  currentTeacher: TeacherProfile;
  faqs: FaqItem[];
  onUpdateFaqs: (items: FaqItem[]) => void;
  showToast: (msg: string) => void;
}

/** Seção "Faqs" da tela Meu Site: lista, filtros e formulário (modal). */
export const FaqsSection: React.FC<FaqsSectionProps> = ({
  currentTeacher,
  faqs,
  onUpdateFaqs,
  showToast,
}) => {
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
      const savedItem = updated.find((f) => f.id === editingFaq.id);
      if (savedItem) supabaseService.saveFaq(savedItem, currentTeacher.id);
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
      supabaseService.saveFaq(newItem, currentTeacher.id);
      showToast('Nova dúvida adicionada ao FAQ!');
    }
    setIsFaqModalOpen(false);
  };

  const handleDeleteFaq = (id: string) => {
    onUpdateFaqs(faqs.filter((f) => f.id !== id));
    supabaseService.deleteFaq(id);
    showToast('Dúvida removida do FAQ.');
  };

  return (
    <>
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
    </>
  );
};
