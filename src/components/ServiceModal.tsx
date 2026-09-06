import React, { useState, useEffect } from 'react';
import { ServiceItem, StudentLevel, STUDENT_LEVEL_LABELS } from '../types';
import { X, Dumbbell, Waves, Activity, GraduationCap, Calculator, Sparkles } from 'lucide-react';

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
  const [price, setPrice] = useState(editingService?.price || 150);
  const [durationMinutes, setDurationMinutes] = useState(editingService?.durationMinutes || 60);
  const [modality, setModality] = useState(editingService?.modality || 'Online / Presencial');
  const [iconName, setIconName] = useState<ServiceItem['iconName']>(editingService?.iconName || 'school');
  const [active, setActive] = useState(editingService ? editingService.active : true);
  const [capacity, setCapacity] = useState(editingService?.capacity || 1);
  const [levels, setLevels] = useState<StudentLevel[]>(editingService?.levels || []);

  useEffect(() => {
    if (editingService) {
      setName(editingService.name);
      setDescription(editingService.description);
      setPrice(editingService.price);
      setDurationMinutes(editingService.durationMinutes);
      setModality(editingService.modality);
      setIconName(editingService.iconName);
      setActive(editingService.active);
      setCapacity(editingService.capacity || 1);
      setLevels(editingService.levels || []);
    } else {
      setName('');
      setDescription('');
      setPrice(150);
      setDurationMinutes(60);
      setModality('Online / Presencial');
      setIconName('school');
      setActive(true);
      setCapacity(1);
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
      price: Number(price),
      durationMinutes: Number(durationMinutes),
      modality: modality as any,
      iconName,
      active,
      capacity: Math.max(1, Number(capacity) || 1),
      levels: levels.length ? levels : undefined,
    };

    onSave(savedService);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-200">
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor (R$) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Duração (minutos)
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
              >
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min (1h)</option>
                <option value={90}>90 min (1h30)</option>
                <option value={120}>120 min (2h)</option>
              </select>
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
                min="1"
                max="60"
                value={capacity}
                onChange={(e) => setCapacity(Math.max(1, Number(e.target.value) || 1))}
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
