import React, { useMemo, useState } from 'react';
import { Appointment, ServiceItem, WaitlistEntry } from '../types';
import { buildClassSlots, ClassSlot, summarizeAttendance } from '../utils/classes';
import { openSpotAlerts, queueForSlot } from '../utils/waitlist';
import { toLocalDateKey } from '../utils/dates';
import { ClipboardList, Hourglass, Trash2, UserCheck, Users } from 'lucide-react';

interface ClassesAndWaitlistPanelProps {
  appointments: Appointment[];
  services: ServiceItem[];
  waitlist: WaitlistEntry[];
  onOpenAttendance: (slot: ClassSlot) => void;
  onPromoteWaitlistEntry: (entry: WaitlistEntry) => void;
  onRemoveWaitlistEntry: (id: string) => void;
}

const formatDate = (key: string) => key.split('-').reverse().join('/');

/**
 * Painel abaixo da grade: turmas do dia (com vagas e lista de chamada) e a
 * fila de espera dos horários lotados.
 */
export const ClassesAndWaitlistPanel: React.FC<ClassesAndWaitlistPanelProps> = ({
  appointments,
  services,
  waitlist,
  onOpenAttendance,
  onPromoteWaitlistEntry,
  onRemoveWaitlistEntry,
}) => {
  const [rosterDate, setRosterDate] = useState<string>(() => toLocalDateKey(new Date()));

  const slots = useMemo(() => buildClassSlots(appointments, services), [appointments, services]);
  const slotsOfDay = useMemo(() => slots.filter((s) => s.date === rosterDate), [slots, rosterDate]);
  const alerts = useMemo(
    () => openSpotAlerts(waitlist, appointments, services),
    [waitlist, appointments, services]
  );
  const waitingQueue = useMemo(() => {
    const groups = new Map<string, { slotLabel: string; date: string; startTime: string; entries: WaitlistEntry[] }>();
    waitlist.forEach((entry) => {
      if (entry.status !== 'aguardando' && entry.status !== 'convocado') return;
      const key = `${entry.serviceId}|${entry.date}|${entry.startTime}`;
      if (!groups.has(key)) {
        groups.set(key, {
          slotLabel: `${entry.serviceName} · ${formatDate(entry.date)} às ${entry.startTime}`,
          date: entry.date,
          startTime: entry.startTime,
          entries: queueForSlot(waitlist, entry),
        });
      }
    });
    return [...groups.values()].sort((a, b) =>
      a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)
    );
  }, [waitlist]);

  return (
    <section className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6" aria-label="Turmas e lista de espera">
      {/* Turmas do dia + chamada */}
      <div className="bg-white rounded-2xl border border-[#eceef0] shadow-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-sm text-[#091426] flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-[#00687a]" />
            Turmas e lista de chamada
          </h3>
          <input
            type="date"
            aria-label="Dia da chamada"
            value={rosterDate}
            onChange={(e) => setRosterDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#00687a]"
          />
        </div>

        <div className="p-5 space-y-3">
          {slotsOfDay.length === 0 && (
            <p className="text-xs text-slate-500 py-6 text-center">
              Nenhuma aula em {formatDate(rosterDate)}.
            </p>
          )}

          {slotsOfDay.map((slot) => {
            const summary = summarizeAttendance(slot.roster);
            const done = summary.total > 0 && summary.pendente === 0;
            return (
              <div key={slot.key} className="border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-[#091426] truncate">{slot.serviceName}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Users className="w-3.5 h-3.5" />
                    {slot.startTime}–{slot.endTime} · {slot.enrolled} de {slot.capacity} vagas
                    {slot.isFull ? ' · lotada' : ` · ${slot.spotsLeft} livre(s)`}
                  </p>
                  {summary.total > 0 && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Chamada: {done
                        ? `${summary.presente} presente(s), ${summary.falta} falta(s), ${summary.justificada} justificada(s)`
                        : `${summary.pendente} aluno(s) sem marcar`}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onOpenAttendance(slot)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 ${
                    done
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-[#00687a] hover:bg-[#004e5c] text-white'
                  }`}
                >
                  {done ? 'Ver chamada' : 'Fazer chamada'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista de espera */}
      <div className="bg-white rounded-2xl border border-[#eceef0] shadow-card overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-sm text-[#091426] flex items-center gap-2">
            <Hourglass className="w-4 h-4 text-amber-600" />
            Lista de espera ({waitlist.filter((e) => e.status === 'aguardando' || e.status === 'convocado').length})
          </h3>
        </div>

        <div className="p-5 space-y-4">
          {alerts.length > 0 && (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.entry.id}
                  role="alert"
                  className="border border-amber-300 bg-amber-50 rounded-xl p-3.5 flex flex-wrap items-center gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-amber-900">
                      Abriu vaga em {alert.entry.serviceName} · {formatDate(alert.entry.date)} às {alert.entry.startTime}
                    </p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Próximo da fila: <b>{alert.entry.studentName}</b> · {alert.spotsLeft} vaga(s) livre(s) de{' '}
                      {alert.capacity} · {alert.waitingCount} na fila
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onPromoteWaitlistEntry(alert.entry)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shrink-0"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Chamar
                  </button>
                </div>
              ))}
            </div>
          )}

          {waitingQueue.length === 0 && (
            <p className="text-xs text-slate-500 py-6 text-center">
              Ninguém na lista de espera. Quando uma turma lotar, os próximos interessados aparecem aqui.
            </p>
          )}

          {waitingQueue.map((group) => (
            <div key={group.slotLabel} className="border border-slate-200 rounded-xl overflow-hidden">
              <p className="px-4 py-2.5 bg-[#f7f9fb] text-[11px] font-bold text-slate-600 border-b border-slate-200">
                {group.slotLabel}
              </p>
              <ul className="divide-y divide-slate-100">
                {group.entries.map((entry, index) => (
                  <li key={entry.id} className="px-4 py-3 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#091426] truncate">{entry.studentName}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {entry.studentPhone || entry.studentEmail || 'Sem contato informado'}
                        {entry.status === 'convocado' ? ' · já convocado' : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onPromoteWaitlistEntry(entry)}
                      className="px-3 py-1.5 rounded-lg bg-[#00687a] hover:bg-[#004e5c] text-white text-[11px] font-bold shrink-0"
                    >
                      Matricular
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveWaitlistEntry(entry.id)}
                      aria-label={`Remover ${entry.studentName} da lista de espera`}
                      className="p-1.5 text-slate-400 hover:text-rose-600 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
