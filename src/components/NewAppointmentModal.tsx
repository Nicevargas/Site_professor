import React, { useState, useEffect } from 'react';
import { ServiceItem, Student, Appointment } from '../types';
import { X, AlertTriangle, CalendarClock, Users } from 'lucide-react';
import { toLocalDateKey } from '../utils/dates';
import { addMinutes, checkBooking, findConflict, toMinutes } from '../utils/schedule';
import { availability, serviceCapacity } from '../utils/classes';

// Reexportados para não quebrar quem já importava daqui
export { toMinutes, addMinutes, findConflict };

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: ServiceItem[];
  students: Student[];
  onSave: (appointment: Appointment) => void;
  preSelectedStudent?: Student | null;
  /** Agenda atual do professor, usada para impedir dois compromissos no mesmo horário */
  existingAppointments?: Appointment[];
  /** Quando informado, o formulário reagenda esta aula mantendo o mesmo id */
  editingAppointment?: Appointment | null;
  /** Oferecido quando a turma está lotada: coloca a pessoa na lista de espera */
  onAddToWaitlist?: (entry: {
    serviceId: string;
    serviceName: string;
    date: string;
    startTime: string;
    studentId?: string;
    studentName: string;
    studentPhone?: string;
    studentEmail?: string;
  }) => void;
}

type Modality = 'Online (Zoom)' | 'Online (Google Meet)' | 'Presencial';

const normalizeModality = (value?: string): Modality =>
  value === 'Presencial' || value === 'Online (Google Meet)' ? value : 'Online (Zoom)';

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  isOpen,
  onClose,
  services,
  students,
  onSave,
  preSelectedStudent,
  existingAppointments = [],
  editingAppointment = null,
  onAddToWaitlist,
}) => {
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || '');
  const [date, setDate] = useState(toLocalDateKey(new Date()));
  const [startTime, setStartTime] = useState('14:00');
  const [modality, setModality] = useState<Modality>('Online (Zoom)');
  const [notes, setNotes] = useState('');
  const [capacity, setCapacity] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [isFullError, setIsFullError] = useState(false);

  // Ao abrir, carrega a aula em reagendamento ou o aluno pré-selecionado
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setIsFullError(false);
    if (editingAppointment) {
      const editingService = services.find((s) => s.id === editingAppointment.serviceId);
      setStudentName(editingAppointment.studentName);
      setStudentPhone(editingAppointment.studentPhone || '');
      setSelectedServiceId(editingAppointment.serviceId || services[0]?.id || '');
      setDate(editingAppointment.date);
      setStartTime(editingAppointment.startTime);
      setModality(normalizeModality(editingAppointment.modality));
      setNotes(editingAppointment.notes || '');
      setCapacity(editingAppointment.capacity || serviceCapacity(editingService));
      return;
    }
    setStudentName(preSelectedStudent?.name || '');
    setStudentPhone(preSelectedStudent?.phone || '');
    setSelectedServiceId(services[0]?.id || '');
    setDate(toLocalDateKey(new Date()));
    setStartTime('14:00');
    setModality('Online (Zoom)');
    setNotes('');
    setCapacity(serviceCapacity(services[0]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingAppointment?.id, preSelectedStudent?.id]);

  // Trocar de serviço traz o limite padrão daquele serviço
  useEffect(() => {
    if (!isOpen || editingAppointment) return;
    const service = services.find((s) => s.id === selectedServiceId);
    setCapacity(serviceCapacity(service));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServiceId, isOpen]);

  if (!isOpen) return null;

  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0];
  const isReschedule = Boolean(editingAppointment);
  const knownStudentForForm = students.find(
    (s) => s.name.trim().toLowerCase() === studentName.trim().toLowerCase()
  );

  // Ocupação do horário escolhido, já considerando o limite digitado aqui
  const slotState = selectedService
    ? availability(
        existingAppointments,
        { serviceId: selectedService.id, date, startTime },
        { ...selectedService, capacity },
        { ignoreAppointmentId: editingAppointment?.id }
      )
    : null;

  const handleAddToWaitlist = () => {
    if (!selectedService || !onAddToWaitlist || !studentName.trim()) return;
    onAddToWaitlist({
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      date,
      startTime,
      studentId: knownStudentForForm?.id,
      studentName: studentName.trim(),
      studentPhone: studentPhone.trim() || knownStudentForForm?.phone || undefined,
      studentEmail: knownStudentForForm?.email || undefined,
    });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !selectedService) return;

    const duration = editingAppointment?.durationMinutes || selectedService.durationMinutes || 60;
    const endTime = addMinutes(startTime, duration);
    const knownForCheck = students.find(
      (s) => s.name.trim().toLowerCase() === studentName.trim().toLowerCase()
    );

    const check = checkBooking(
      {
        id: editingAppointment?.id,
        serviceId: selectedService.id,
        date,
        startTime,
        endTime,
        studentId: editingAppointment?.studentId || knownForCheck?.id,
        studentName: studentName.trim(),
      },
      existingAppointments,
      { ...selectedService, capacity }
    );
    if (!check.ok) {
      setError(check.message || 'Não foi possível agendar neste horário.');
      setIsFullError(check.reason === 'lotado');
      return;
    }
    setIsFullError(false);

    // "T00:00:00" evita que a data volte um dia por causa do fuso horário
    const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
    const knownStudent = students.find((s) => s.name.trim().toLowerCase() === studentName.trim().toLowerCase());

    const appointment: Appointment = {
      ...(editingAppointment || {}),
      id: editingAppointment?.id || `apt-${Date.now()}`,
      studentId: editingAppointment?.studentId || knownStudent?.id,
      capacity,
      studentName: studentName.trim(),
      studentInitials: studentName.trim().split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
      studentPhone: studentPhone.trim() || knownStudent?.phone || undefined,
      studentEmail: editingAppointment?.studentEmail || knownStudent?.email || undefined,
      studentAvatar: editingAppointment?.studentAvatar || knownStudent?.avatar || undefined,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      date,
      dayOfWeek: isNaN(dayOfWeek) ? 1 : dayOfWeek,
      startTime,
      endTime,
      durationMinutes: duration,
      modality,
      status: editingAppointment?.status && editingAppointment.status !== 'Cancelado' ? editingAppointment.status : 'Confirmado',
      notes: notes.trim() || undefined,
      clientSince: editingAppointment?.clientSince || (knownStudent ? `Cliente desde ${knownStudent.joinedDate}` : undefined),
      price: editingAppointment?.price ?? selectedService.price,
    };

    onSave(appointment);
    onClose();
  };

  const inputClass = 'w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-200 relative">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#091426]">{isReschedule ? 'Reagendar Aula' : 'Novo Agendamento'}</h2>
            {isReschedule && editingAppointment && (
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5" />
                Antes: {editingAppointment.date.split('-').reverse().join('/')} às {editingAppointment.startTime}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="apt-student" className="block text-xs font-semibold text-slate-700 mb-1">
              Nome do Aluno *
            </label>
            <input
              id="apt-student"
              type="text"
              required
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Digite o nome do aluno"
              className={inputClass}
              list="apt-student-options"
            />
            <datalist id="apt-student-options">
              {students.map((s) => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="apt-service" className="block text-xs font-semibold text-slate-700 mb-1">
                Serviço / Modalidade *
              </label>
              <select
                id="apt-service"
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className={inputClass}
              >
                {services.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.name} - R$ {svc.price}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="apt-modality" className="block text-xs font-semibold text-slate-700 mb-1">
                Formato da Aula
              </label>
              <select
                id="apt-modality"
                value={modality}
                onChange={(e) => setModality(e.target.value as Modality)}
                className={inputClass}
              >
                <option value="Online (Zoom)">Online (Zoom)</option>
                <option value="Online (Google Meet)">Online (Google Meet)</option>
                <option value="Presencial">Presencial</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="apt-date" className="block text-xs font-semibold text-slate-700 mb-1">Data</label>
              <input
                id="apt-date"
                type="date"
                required
                value={date}
                onChange={(e) => { setDate(e.target.value); setError(null); }}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="apt-time" className="block text-xs font-semibold text-slate-700 mb-1">Horário de Início</label>
              <input
                id="apt-time"
                type="time"
                required
                value={startTime}
                onChange={(e) => { setStartTime(e.target.value); setError(null); }}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="apt-capacity" className="block text-xs font-semibold text-slate-700 mb-1">
              Limite de alunos nesta aula
            </label>
            <div className="flex items-center gap-3">
              <input
                id="apt-capacity"
                type="number"
                min={1}
                max={60}
                value={capacity}
                onChange={(e) => {
                  setCapacity(Math.max(1, Number(e.target.value) || 1));
                  setError(null);
                }}
                className={`${inputClass} w-24`}
              />
              {slotState && (
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {slotState.enrolled} de {capacity} vagas ocupadas
                  {slotState.spotsLeft > 0
                    ? ` · ${slotState.spotsLeft} livre${slotState.spotsLeft > 1 ? 's' : ''}`
                    : ' · turma lotada'}
                </p>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              1 = aula individual. Acima disso vira turma: outros alunos podem ser matriculados no mesmo horário.
              O padrão vem do serviço e vale só para este horário.
            </p>
          </div>

          <div>
            <label htmlFor="apt-phone" className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp do aluno</label>
            <input
              id="apt-phone"
              type="tel"
              value={studentPhone}
              onChange={(e) => setStudentPhone(e.target.value)}
              placeholder="(11) 90000-0000"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="apt-notes" className="block text-xs font-semibold text-slate-700 mb-1">
              Observações / Metas
            </label>
            <textarea
              id="apt-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Notas da aula..."
              className={inputClass}
            />
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <span>{error}</span>
                {isFullError && onAddToWaitlist && (
                  <button
                    type="button"
                    onClick={handleAddToWaitlist}
                    className="block px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold"
                  >
                    Colocar {studentName.trim() || 'o aluno'} na lista de espera
                  </button>
                )}
              </div>
            </div>
          )}

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
              {isReschedule ? 'Confirmar Reagendamento' : 'Confirmar Agendamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
