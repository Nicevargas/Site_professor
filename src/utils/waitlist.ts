import { Appointment, ServiceItem, WaitlistEntry } from '../types';
import { availability, slotKeyOf } from './classes';

/**
 * Lista de espera: quando o horário bate o limite de alunos, o interessado
 * entra na fila em vez de agendar. Abrindo vaga (cancelamento ou aumento do
 * limite), o professor vê o alerta e chama a próxima pessoa com um clique.
 */

export function isWaiting(entry: WaitlistEntry): boolean {
  return entry.status === 'aguardando' || entry.status === 'convocado';
}

export function queueForSlot(
  entries: WaitlistEntry[],
  slot: { serviceId?: string; date: string; startTime: string }
): WaitlistEntry[] {
  const key = slotKeyOf(slot);
  return entries
    .filter((e) => isWaiting(e) && slotKeyOf(e) === key)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Posição da pessoa na fila daquele horário (1 = próxima). 0 = não está na fila. */
export function positionInQueue(entries: WaitlistEntry[], entryId: string): number {
  const target = entries.find((e) => e.id === entryId);
  if (!target) return 0;
  return queueForSlot(entries, target).findIndex((e) => e.id === entryId) + 1;
}

export function alreadyWaiting(
  entries: WaitlistEntry[],
  slot: { serviceId?: string; date: string; startTime: string },
  person: { studentId?: string; studentName?: string; studentEmail?: string }
): boolean {
  const name = (person.studentName || '').trim().toLowerCase();
  const email = (person.studentEmail || '').trim().toLowerCase();
  return queueForSlot(entries, slot).some((e) => {
    if (person.studentId && e.studentId) return e.studentId === person.studentId;
    if (email && e.studentEmail) return e.studentEmail.trim().toLowerCase() === email;
    return Boolean(name) && e.studentName.trim().toLowerCase() === name;
  });
}

export interface OpenSpotAlert {
  entry: WaitlistEntry;
  waitingCount: number;
  spotsLeft: number;
  capacity: number;
}

/**
 * Horários que abriram vaga e têm gente esperando.
 * Só o primeiro da fila de cada horário é oferecido, para não chamar dois
 * alunos para a mesma vaga.
 */
export function openSpotAlerts(
  entries: WaitlistEntry[],
  appointments: Appointment[],
  services: ServiceItem[]
): OpenSpotAlert[] {
  const seen = new Set<string>();
  const alerts: OpenSpotAlert[] = [];

  entries
    .filter(isWaiting)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .forEach((entry) => {
      const key = slotKeyOf(entry);
      if (seen.has(key)) return;
      seen.add(key);

      const service = services.find((s) => s.id === entry.serviceId);
      const { spotsLeft, capacity } = availability(appointments, entry, service);
      if (spotsLeft <= 0) return;

      alerts.push({
        entry,
        waitingCount: queueForSlot(entries, entry).length,
        spotsLeft,
        capacity,
      });
    });

  return alerts.sort((a, b) =>
    a.entry.date === b.entry.date
      ? a.entry.startTime.localeCompare(b.entry.startTime)
      : a.entry.date.localeCompare(b.entry.date)
  );
}
