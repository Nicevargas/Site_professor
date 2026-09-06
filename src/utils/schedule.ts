import { Appointment, ServiceItem } from '../types';
import { availability, isAlreadyEnrolled, SlotAvailability, slotKeyOf } from './classes';

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function addMinutes(time: string, minutes: number): string {
  const total = toMinutes(time) + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Primeiro compromisso (aula ou bloqueio) que se sobrepõe ao candidato no mesmo dia. */
export function findConflict(
  candidate: { id?: string; date: string; startTime: string; endTime: string },
  appointments: Appointment[]
): Appointment | null {
  const start = toMinutes(candidate.startTime);
  const end = toMinutes(candidate.endTime);
  return (
    appointments.find(
      (apt) =>
        apt.id !== candidate.id &&
        apt.date === candidate.date &&
        apt.status !== 'Cancelado' &&
        toMinutes(apt.startTime) < end &&
        toMinutes(apt.endTime) > start
    ) || null
  );
}

export type BookingBlockReason = 'bloqueado' | 'choque' | 'lotado' | 'duplicado';

export interface BookingCheck {
  ok: boolean;
  reason?: BookingBlockReason;
  conflict?: Appointment;
  availability: SlotAvailability;
  message?: string;
}

interface BookingCandidate {
  id?: string;
  serviceId?: string;
  date: string;
  startTime: string;
  endTime: string;
  studentId?: string;
  studentName?: string;
}

/**
 * Decide se dá para matricular alguém num horário.
 * Numa turma (limite > 1), sobrepor a própria turma não é choque: só bloqueia
 * quando lotou, quando a pessoa já está matriculada, quando o horário está
 * bloqueado ou quando bate com OUTRA aula/turma.
 */
export function checkBooking(
  candidate: BookingCandidate,
  appointments: Appointment[],
  service?: ServiceItem | null
): BookingCheck {
  const slotAvailability = availability(appointments, candidate, service, {
    ignoreAppointmentId: candidate.id,
  });
  const start = toMinutes(candidate.startTime);
  const end = toMinutes(candidate.endTime);
  const candidateKey = slotKeyOf(candidate);

  const overlapping = appointments.filter(
    (apt) =>
      apt.id !== candidate.id &&
      apt.date === candidate.date &&
      apt.status !== 'Cancelado' &&
      toMinutes(apt.startTime) < end &&
      toMinutes(apt.endTime) > start
  );

  const blocked = overlapping.find((apt) => apt.status === 'Bloqueado');
  if (blocked) {
    return {
      ok: false,
      reason: 'bloqueado',
      conflict: blocked,
      availability: slotAvailability,
      message: `Este horário choca com um horário bloqueado (${blocked.startTime} às ${blocked.endTime}). Escolha outro horário.`,
    };
  }

  const otherClass = overlapping.find((apt) => slotKeyOf(apt) !== candidateKey);
  if (otherClass) {
    return {
      ok: false,
      reason: 'choque',
      conflict: otherClass,
      availability: slotAvailability,
      message: `Este horário choca com a aula de ${otherClass.studentName} (${otherClass.startTime} às ${otherClass.endTime}). Escolha outro horário.`,
    };
  }

  if (isAlreadyEnrolled(appointments, candidate, candidate, candidate.id)) {
    return {
      ok: false,
      reason: 'duplicado',
      availability: slotAvailability,
      message: `${candidate.studentName || 'Este aluno'} já está matriculado nesta aula.`,
    };
  }

  if (slotAvailability.isFull) {
    return {
      ok: false,
      reason: 'lotado',
      availability: slotAvailability,
      message: `Turma lotada: ${slotAvailability.enrolled} de ${slotAvailability.capacity} vagas ocupadas. Entre na lista de espera ou escolha outro horário.`,
    };
  }

  return { ok: true, availability: slotAvailability };
}
