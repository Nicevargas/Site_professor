import React, { useState, useEffect } from 'react';
import { ServiceItem, StudentLevel, STUDENT_LEVEL_LABELS } from '../types';
import { X, Dumbbell, Waves, Activity, GraduationCap, Calculator, Sparkles } from 'lucide-react';

/** Durações oferecidas na lista. Qualquer outra entra por "Outra duração…". */
export const DURACOES_PADRAO = [20, 30, 40, 45, 50, 60, 75, 90, 120];
const DURACAO_MIN = 5;
const DURACAO_MAX = 240;
const CAPACIDADE_MAX = 60;

const rotuloDaDuracao = (min: number) => {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const resto = min % 60;
  return `${min} min (${h}h${resto ? String(resto).padStart(2, '0') : ''})`;
};

/** Número inteiro dentro da faixa; texto vazio ou inválido vira o padrão. */
const inteiroNaFaixa = (texto: string, min: number, max: number, padrao: number) => {
  const n = Math.round(Number(texto.replace(',', '.')));
  if (!texto.trim() || !Number.isFinite(n)) return padrao;
  return Math.min(max, Math.max(min, n));
};

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: ServiceItem) => void;
  editingService: ServiceItem | null;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingService,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(editingService?.name || '');
  const [description, setDescription] = useState(editingService?.description || '');
  // Valor, limite e duração livre ficam como TEXTO enquanto a pessoa digita.
  // Guardados como número, apagar o "1" devolvia 1 na hora e digitar 5 virava
  // 15: no celular não dava para trocar o limite de alunos.
  const [price, setPrice] = useState(String(editingService?.price ?? 150));
  const [durationMinutes, setDurationMinutes] = useState(editingService?.durationMinutes || 60);
  const [duracaoLivre, setDuracaoLivre] = useState(
    Boolean(editingService && !DURACOES_PADRAO.includes(editingService.durationMinutes))
  );
  const [duracaoDigitada, setDuracaoDigitada] = useState(String(editingService?.durationMinutes || ''));
  const [modality, setModality] = useState(editingService?.modality || 'Online / Presencial');
  const [iconName, setIconName] = useState<ServiceItem['iconName']>(editingService?.iconName || 'school');
  const [active, setActive] = useState(editingService ? editingService.active : true);
  const [capacity, setCapacity] = useState(String(editingService?.capacity || 1));
  const [levels, setLevels] = useState<StudentLevel[]>(editingService?.levels || []);

  useEffect(() => {
    if (editingService) {
      setName(editingService.name);
      setDescription(editingService.description);
      setPrice(String(editingService.price ?? 150));
      setDurationMinutes(editingService.durationMinutes);
      setDuracaoLivre(!DURACOES_PADRAO.includes(editingService.durationMinutes));
      setDuracaoDigitada(String(editingService.durationMinutes || ''));
      setModality(editingService.modality);
      setIconName(editingService.iconName);
      setActive(editingService.active);
      setCapacity(String(editingService.capacity || 1));
      setLevels(editingService.levels || []);
    } else {
      setName('');
      setDescription('');
      setPrice('150');
      setDurationMinutes(60);
      setDuracaoLivre(false);
      setDuracaoDigitada('');
      setModality('Online / Presencial');
      setIconName('school');
      setActive(true);
      setCapacity('1');
      setLevels([]);
    }
  }, [editingService]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const savedService: ServiceItem = {
      id: editingService ? editingService.id : `serv-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'Serviço personalizado com metodologia exclusiva.',
      // R$ 0 é aula gratuita: só o campo vazio ou negativo vira 0
      price: Math.max(0, Number(price.replace(',', '.')) || 0),
      durationMinutes: duracaoLivre
        ? inteiroNaFaixa(duracaoDigitada, DURACAO_MIN, DURACAO_MAX, 60)
        : Number(durationMinutes),
      modality: modality as any,
      iconName,
      active,
      capacity: inteiroNaFaixa(capacity, 1, CAPACIDADE_MAX, 1),
      levels: levels.length ? levels : undefined,
    };

    onSave(savedService);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
      {/* Rolagem própria: com o teclado do celular aberto, o "Salvar Serviço" saía da tela */}
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-200 max-h-[90dvh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#091426]">
            {editingService ? 'Editar Serviço' : 'Novo Serviço'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome do Serviço / Modalidade *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Aula Particular de Física"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descrição Curta
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Descreva o que está incluso nesta aula ou mentoria..."
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="svc-price" className="block text-xs font-semibold text-slate-700 mb-1">
                Valor (R$) *
              </label>
              <input
                id="svc-price"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
              />
            </div>

            <div>
              <label htmlFor="svc-duration" className="block text-xs font-semibold text-slate-700 mb-1">
                Duração (minutos)
              </label>
              <select
                id="svc-duration"
                value={duracaoLivre ? 'outra' : durationMinutes}
                onChange={(e) => {
                  if (e.target.value === 'outra') {
                    setDuracaoLivre(true);
                    setDuracaoDigitada((atual) => atual || String(durationMinutes));
                  } else {
                    setDuracaoLivre(false);
                    setDurationMinutes(Number(e.target.value));
                  }
                }}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
              >
                {DURACOES_PADRAO.map((min) => (
                  <option key={min} value={min}>{rotuloDaDuracao(min)}</option>
                ))}
                <option value="outra">Outra duração…</option>
              </select>
              {duracaoLivre && (
                <input
                  type="number"
                  inputMode="numeric"
                  min={DURACAO_MIN}
                  max={DURACAO_MAX}
                  aria-label="Duração em minutos"
                  placeholder="Ex.: 35"
                  value={duracaoDigitada}
                  onChange={(e) => setDuracaoDigitada(e.target.value)}
                  className="w-full mt-2 p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="svc-capacity" className="block text-xs font-semibold text-slate-700 mb-1">
                Limite de alunos por horário
              </label>
              <input
                id="svc-capacity"
                type="number"
                inputMode="numeric"
                min="1"
                max={CAPACIDADE_MAX}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                1 = aula individual. Acima disso o horário vira turma e, ao lotar, os próximos entram na lista de espera.
              </p>
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-1">Níveis atendidos</span>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(STUDENT_LEVEL_LABELS) as StudentLevel[]).map((lvl) => {
                  const checked = levels.includes(lvl);
                  return (
                    <label
                      key={lvl}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                        checked
                          ? 'bg-[#00687a] text-white border-[#00687a]'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-[#00687a]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() =>
                          setLevels((prev) =>
                            prev.includes(lvl) ? prev.filter((l) => l !== lvl) : [...prev, lvl]
                          )
                        }
                      />
                      {STUDENT_LEVEL_LABELS[lvl]}
                    </label>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Nenhum marcado = aberto a todos os níveis.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Formato Disponível
              </label>
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value as any)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
              >
                <option value="Online / Presencial">Online / Presencial</option>
                <option value="Apenas Online">Apenas Online</option>
                <option value="Presencial">Presencial</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ícone da Modalidade
              </label>
              <select
                value={iconName}
                onChange={(e) => setIconName(e.target.value as any)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
              >
                <option value="school">Graduação / Aula</option>
                <option value="fitness_center">Personal / Fitness</option>
                <option value="pool">Natação</option>
                <option value="calculate">Matemática / Cálculo</option>
                <option value="sports_martial_arts">Esportes / Físico</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="activeCheckbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 text-[#00687a] rounded border-slate-300"
            />
            <label htmlFor="activeCheckbox" className="text-xs font-semibold text-slate-800">
              Serviço ativo para agendamento pelos alunos
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#00687a] hover:bg-[#004e5c] text-white text-xs font-semibold rounded-xl shadow-xs"
            >
              Salvar Serviço
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
