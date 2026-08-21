import React, { useState } from 'react';
import { ServiceItem, Student, Appointment } from '../types';
import { X, Calendar, Clock, Video, MapPin, Check } from 'lucide-react';

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: ServiceItem[];
  students: Student[];
  onSave: (appointment: Appointment) => void;
  preSelectedStudent?: Student | null;
}

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  isOpen,
  onClose,
  services,
  students,
  onSave,
  preSelectedStudent,
}) => {
  if (!isOpen) return null;

  const [studentName, setStudentName] = useState(preSelectedStudent?.name || '');
  const [studentPhone, setStudentPhone] = useState(preSelectedStudent?.phone || '');
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || '');
  const [date, setDate] = useState('2024-11-15');
  const [startTime, setStartTime] = useState('14:00');
  const [modality, setModality] = useState<'Online (Zoom)' | 'Online (Google Meet)' | 'Presencial'>('Online (Zoom)');
  const [notes, setNotes] = useState('');

  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;

    const [h, m] = startTime.split(':').map(Number);
    const duration = selectedService?.durationMinutes || 60;
    const totalMinutes = h * 60 + m + duration;
    const endH = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const endM = String(totalMinutes % 60).padStart(2, '0');
    const endTime = `${endH}:${endM}`;

    // Get day of week
    const dayOfWeek = new Date(date).getDay();

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      studentName: studentName.trim(),
      studentInitials: studentName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
      studentPhone: studentPhone.trim() || '(11) 98765-4321',
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      date,
      dayOfWeek: isNaN(dayOfWeek) ? 3 : dayOfWeek,
      startTime,
      endTime,
      durationMinutes: duration,
      modality,
      status: 'Confirmado',
      notes: notes.trim() || 'Aula agendada pelo painel.',
      clientSince: 'Cliente desde 2024',
      price: selectedService.price,
    };

    onSave(newApt);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-200 relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#091426]">Novo Agendamento</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome do Aluno *
            </label>
            <input
              type="text"
              required
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Digite o nome do aluno"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Serviço / Modalidade *
              </label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
              >
                {services.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.name} - R$ {svc.price}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Formato da Aula
              </label>
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value as any)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
              >
                <option value="Online (Zoom)">Online (Zoom)</option>
                <option value="Online (Google Meet)">Online (Google Meet)</option>
                <option value="Presencial">Presencial</option>
              </select>
            </div>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Horário de Início</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações / Metas
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Notas da aula..."
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
            />
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
              Confirmar Agendamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
