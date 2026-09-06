import React, { useEffect, useState } from 'react';
import { Appointment, AttendanceStatus, ATTENDANCE_LABELS, Student, STUDENT_LEVEL_LABELS } from '../types';
import { ClassSlot, summarizeAttendance } from '../utils/classes';
import { CheckCircle2, ClipboardList, MinusCircle, X, XCircle } from 'lucide-react';

interface AttendanceModalProps {
  slot: ClassSlot | null;
  students: Student[];
  onClose: () => void;
  onSave: (marks: { appointmentId: string; attendance?: AttendanceStatus; attendanceNote?: string }[]) => void;
}

const STATUS_STYLES: Record<AttendanceStatus, { on: string; icon: React.ReactNode }> = {
  presente: {
    on: 'bg-emerald-600 text-white border-emerald-600',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  falta: {
    on: 'bg-rose-600 text-white border-rose-600',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  justificada: {
    on: 'bg-amber-500 text-white border-amber-500',
    icon: <MinusCircle className="w-3.5 h-3.5" />,
  },
};

/** Lista de chamada de uma turma: marca presença aluno por aluno. */
export const AttendanceModal: React.FC<AttendanceModalProps> = ({ slot, students, onClose, onSave }) => {
  const [marks, setMarks] = useState<Record<string, AttendanceStatus | undefined>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!slot) return;
    const initialMarks: Record<string, AttendanceStatus | undefined> = {};
    const initialNotes: Record<string, string> = {};
    slot.roster.forEach((apt) => {
      initialMarks[apt.id] = apt.attendance;
      initialNotes[apt.id] = apt.attendanceNote || '';
    });
    setMarks(initialMarks);
    setNotes(initialNotes);
  }, [slot?.key, slot?.roster.length]);

  if (!slot) return null;

  const preview: Appointment[] = slot.roster.map((apt) => ({ ...apt, attendance: marks[apt.id] }));
  const summary = summarizeAttendance(preview);

  const setAll = (status: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus | undefined> = {};
    slot.roster.forEach((apt) => { next[apt.id] = status; });
    setMarks(next);
  };

  const handleSave = () => {
    onSave(
      slot.roster.map((apt) => ({
        appointmentId: apt.id,
        attendance: marks[apt.id],
        attendanceNote: (notes[apt.id] || '').trim() || undefined,
      }))
    );
    onClose();
  };

  const dateLabel = slot.date.split('-').reverse().join('/');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-start gap-4 p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-[#091426] flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#00687a]" />
              Lista de chamada
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {slot.serviceName} · {dateLabel} das {slot.startTime} às {slot.endTime} ·{' '}
              {slot.enrolled} de {slot.capacity} vagas
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600">Marcar todos:</span>
          {(Object.keys(ATTENDANCE_LABELS) as AttendanceStatus[]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setAll(status)}
              className="px-3 py-1.5 rounded-full border border-slate-300 text-slate-600 hover:border-[#00687a] hover:text-[#00687a] font-semibold"
            >
              {ATTENDANCE_LABELS[status]}
            </button>
          ))}
          <span className="ml-auto text-slate-500">
            {summary.presente} presente(s) · {summary.falta} falta(s) · {summary.pendente} sem marcar
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {slot.roster.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-8">
              Nenhum aluno matriculado nesta aula ainda.
            </p>
          )}

          {slot.roster.map((apt) => {
            const student = students.find(
              (s) => s.id === apt.studentId || s.name.trim().toLowerCase() === apt.studentName.trim().toLowerCase()
            );
            return (
              <div key={apt.id} className="border border-slate-200 rounded-xl p-3.5 bg-[#f7f9fb]">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-[#091426] truncate">{apt.studentName}</p>
                    <p className="text-[11px] text-slate-500">
                      {student?.level ? STUDENT_LEVEL_LABELS[student.level] : 'Nível não definido'}
                      {apt.studentPhone ? ` · ${apt.studentPhone}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {(Object.keys(ATTENDANCE_LABELS) as AttendanceStatus[]).map((status) => {
                      const active = marks[apt.id] === status;
                      return (
                        <button
                          key={status}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setMarks((prev) => ({ ...prev, [apt.id]: active ? undefined : status }))}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-colors ${
                            active
                              ? STATUS_STYLES[status].on
                              : 'bg-white text-slate-600 border-slate-300 hover:border-[#00687a]'
                          }`}
                        >
                          {STATUS_STYLES[status].icon}
                          {ATTENDANCE_LABELS[status]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {marks[apt.id] === 'justificada' && (
                  <input
                    type="text"
                    value={notes[apt.id] || ''}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [apt.id]: e.target.value }))}
                    placeholder="Motivo da justificativa"
                    aria-label={`Motivo da falta de ${apt.studentName}`}
                    className="mt-2.5 w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#00687a]"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={slot.roster.length === 0}
            className="px-6 py-2.5 bg-[#00687a] hover:bg-[#004e5c] disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-xs"
          >
            Salvar chamada
          </button>
        </div>
      </div>
    </div>
  );
};
