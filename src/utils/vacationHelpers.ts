import { VacationModeConfig } from '../types';

/**
 * Check if vacation mode is currently considered active.
 * If enabled is true, and dates are specified, it checks whether today falls within the range.
 * If no dates are specified but enabled is true, it is immediately active.
 */
export function isVacationActive(vacationMode?: VacationModeConfig): boolean {
  if (!vacationMode || !vacationMode.enabled) return false;

  // If no date range specified, enabled = true means permanently active
  if (!vacationMode.startDate && !vacationMode.endDate) return true;

  const today = new Date().toISOString().split('T')[0];

  if (vacationMode.startDate && vacationMode.endDate) {
    return today >= vacationMode.startDate && today <= vacationMode.endDate;
  }

  if (vacationMode.startDate && !vacationMode.endDate) {
    return today >= vacationMode.startDate;
  }

  if (!vacationMode.startDate && vacationMode.endDate) {
    return today <= vacationMode.endDate;
  }

  return true;
}

/**
 * Format date from 'YYYY-MM-DD' to 'DD/MM/YYYY' or 'DD de Mês'
 */
export function formatVacationDateBR(dateStr?: string, withYear = true): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];

    const monthsBR = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    const monthIdx = parseInt(month, 10) - 1;
    const monthName = monthsBR[monthIdx] || month;

    if (withYear) {
      return `${day}/${month}/${year}`;
    }
    return `${day} de ${monthName}`;
  } catch {
    return dateStr;
  }
}

/**
 * Returns formatted period text for display (e.g. "20/12 a 05/01/2025")
 */
export function getVacationPeriodLabel(vacationMode?: VacationModeConfig): string {
  if (!vacationMode) return '';
  const start = vacationMode.startDate ? formatVacationDateBR(vacationMode.startDate, false) : '';
  const end = vacationMode.endDate ? formatVacationDateBR(vacationMode.endDate, true) : '';

  if (start && end) {
    return `${start} até ${end}`;
  }
  if (start) {
    return `a partir de ${start}`;
  }
  if (end) {
    return `até ${end}`;
  }
  return 'Período Indeterminado';
}

/**
 * Returns friendly return date label (e.g. "10 de Janeiro")
 */
export function getVacationReturnLabel(vacationMode?: VacationModeConfig): string {
  if (!vacationMode) return '';
  if (vacationMode.returnDate) {
    return formatVacationDateBR(vacationMode.returnDate, true);
  }
  if (vacationMode.endDate) {
    // Return next day after end date if possible
    try {
      const d = new Date(vacationMode.endDate + 'T12:00:00');
      d.setDate(d.getDate() + 1);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return formatVacationDateBR(vacationMode.endDate, true);
    }
  }
  return 'em breve';
}

/**
 * Generates direct WhatsApp Link for student to join waitlist during vacation
 */
export function getVacationWhatsAppWaitlistLink(
  whatsapp: string,
  teacherName: string,
  returnDateLabel?: string,
  serviceName?: string
): string {
  const cleanPhone = (whatsapp || '5511999887766').replace(/\D/g, '');
  const returnInfo = returnDateLabel ? ` para o retorno em ${returnDateLabel}` : '';
  const serviceInfo = serviceName ? ` de *${serviceName}*` : '';

  const msg = `Olá ${teacherName}! 👋 Vi no seu site que você está em período de recesso/férias. Gostaria de entrar na lista de espera para agendar uma aula${serviceInfo}${returnInfo}. Poderia me avisar assim que abrir novos horários? Obrigado(a)!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
}
