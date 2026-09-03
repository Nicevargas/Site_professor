import React, { useState } from 'react';
import { X, Ban, Calendar, Clock } from 'lucide-react';
import { Appointment } from '../types';
import { toLocalDateKey } from '../utils/dates';

interface BlockTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBlock: (blockedApt: Appointment) => void;
}

export const BlockTimeModal: React.FC<BlockTimeModalProps> = ({
  isOpen,
  onClose,
  onBlock,
}) => {
  // Hooks sempre antes de qualquer retorno condicional
  const [date, setDate] = useState(toLocalDateKey(new Date()));
  const [startTime, setStartTime] = useState('11:00');
  const [endTime, setEndTime] = useState('12:00');
  const [reason, setReason] = useState('Compromisso Pessoal / Almoço');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const duration = (eh * 60 + em) - (sh * 60 + sm);

    // "T00:00:00" evita que a data volte um dia por causa do fuso horário
    const dayOfWeek = new Date(`${date}T00:00:00`).getDay();

    const blocked: Appointment = {
      id: `block-${Date.now()}`,
      studentName: `[Bloqueado] ${reason}`,
      studentInitials: 'BL',
      serviceId: 'block',
      serviceName: reason,
      date,
      dayOfWeek: isNaN(dayOfWeek) ? 3 : dayOfWeek,
      startTime,
      endTime,
      durationMinutes: Math.max(30, duration),
      modality: 'Presencial',
      status: 'Bloqueado',
      notes: 'Horário bloqueado na grade do professor.',
      price: 0,
    };

    onBlock(blocked);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <Ban className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-[#091426]">Bloquear Horário</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#45474c] mb-6">
          Horários bloqueados não ficarão disponíveis para agendamento público pelos alunos.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo do Bloqueio</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Início</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Fim</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl"
            >
              Bloquear na Grade
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
