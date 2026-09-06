import { Appointment, AttendanceStatus, ServiceItem } from '../types';

/**
 * Turmas: um "slot" é a combinação serviço + data + horário de início.
 * Cada aluno matriculado é um Appointment próprio, e todos os appointments
 * do mesmo slot dividem o mesmo limite de vagas. Aula individual = limite 1,
 * que é como o sistema se comportava antes de existir capacidade.
 */

export const DEFAULT_CAPACITY = 1;

export interface ClassSlot {
  key: string;
  serviceId: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  enrolled: number;
  spotsLeft: number;
  isFull: boolean;
  /** Matrículas ativas (não canceladas), em ordem alfabética */
  roster: Appointment[];
}

export function slotKeyOf(a: { serviceId?: string; date: string; startTime: string }): string {
  return `${a.serviceId || 'sem-servico'}|${a.date}|${a.startTime}`;
}

/** Aulas ativas ocupam vaga; canceladas e bloqueios não. */
export function isEnrolling(apt: Appointment): boolean {
  return apt.status !== 'Cancelado' && apt.status !== 'Bloqueado';
}

/** Limite do serviço, com piso 1 e sem número quebrado. */
export function serviceCapacity(service?: Pick<ServiceItem, 'capacity'> | null): number {
  const raw = Math.floor(Number(service?.capacity));
  return Number.isFinite(raw) && raw >= 1 ? raw : DEFAULT_CAPACITY;
}

/**
 * Limite efetivo do horário: o override gravado nas matrículas do slot vence
 * o limite do serviço, para o professor poder abrir uma turma menor num dia.
 */
export function slotCapacity(slotAppointments: Appointment[], service?: ServiceItem | null): number {
  const override = slotAppointments
    .map((a) => Math.floor(Number(a.capacity)))
    .find((n) => Number.isFinite(n) && n >= 1);
  return override ?? serviceCapacity(service);
}

export function countEnrolled(
  appointments: Appointment[],
  slot: { serviceId?: string; date: string; startTime: string }
): number {
  const key = slotKeyOf(slot);
  return appointments.filter((a) => isEnrolling(a) && slotKeyOf(a) === key).length;
}

export interface SlotAvailability {
  capacity: number;
  enrolled: number;
  spotsLeft: number;
  isFull: boolean;
}

/** Quantas vagas restam num horário, considerando o limite do serviço e os overrides. */
export function availability(
  appointments: Appointment[],
  slot: { serviceId?: string; date: string; startTime: string },
  service?: ServiceItem | null,
  options: { ignoreAppointmentId?: string } = {}
): SlotAvailability {
  const key = slotKeyOf(slot);
  const inSlot = appointments.filter((a) => slotKeyOf(a) === key && a.id !== options.ignoreAppointmentId);
  const capacity = slotCapacity(inSlot, service);
  const enrolled = inSlot.filter(isEnrolling).length;
  return {
    capacity,
    enrolled,
    spotsLeft: Math.max(0, capacity - enrolled),
    isFull: enrolled >= capacity,
  };
}

/** Já existe matrícula ativa desta pessoa neste horário? */
export function isAlreadyEnrolled(
  appointments: Appointment[],
  slot: { serviceId?: string; date: string; startTime: string },
  person: { studentId?: string; studentName?: string },
  ignoreAppointmentId?: string
): boolean {
  const key = slotKeyOf(slot);
  const name = (person.studentName || '').trim().toLowerCase();
  return appointments.some((a) => {
    if (a.id === ignoreAppointmentId || !isEnrolling(a) || slotKeyOf(a) !== key) return false;
    if (person.studentId && a.studentId) return a.studentId === person.studentId;
    return Boolean(name) && a.studentName.trim().toLowerCase() === name;
  });
}

/** Agrupa a agenda em turmas, para a lista de chamada e para o painel de vagas. */
export function buildClassSlots(appointments: Appointment[], services: ServiceItem[]): ClassSlot[] {
  const byKey = new Map<string, Appointment[]>();
  appointments.forEach((apt) => {
    if (apt.status === 'Bloqueado') return;
    const key = slotKeyOf(apt);
    const list = byKey.get(key);
    if (list) list.push(apt);
    else byKey.set(key, [apt]);
  });

  const slots: ClassSlot[] = [];
  byKey.forEach((list, key) => {
    const first = list[0];
    const service = services.find((s) => s.id === first.serviceId);
    const capacity = slotCapacity(list, service);
    const roster = list
      .filter(isEnrolling)
      .sort((a, b) => a.studentName.localeCompare(b.studentName, 'pt-BR'));
    slots.push({
      key,
      serviceId: first.serviceId,
      serviceName: first.serviceName || service?.name || 'Aula',
      date: first.date,
      startTime: first.startTime,
      endTime: first.endTime,
      capacity,
      enrolled: roster.length,
      spotsLeft: Math.max(0, capacity - roster.length),
      isFull: roster.length >= capacity,
      roster,
    });
  });

  return slots.sort((a, b) =>
    a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)
  );
}

export interface AttendanceSummary {
  total: number;
  presente: number;
  falta: number;
  justificada: number;
  pendente: number;
}

export function summarizeAttendance(roster: Appointment[]): AttendanceSummary {
  const count = (status: AttendanceStatus) => roster.filter((a) => a.attendance === status).length;
  return {
    total: roster.length,
    presente: count('presente'),
    falta: count('falta'),
    justificada: count('justificada'),
    pendente: roster.filter((a) => !a.attendance).length,
  };
}
