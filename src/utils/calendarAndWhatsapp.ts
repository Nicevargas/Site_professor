import { Appointment, TeacherProfile } from '../types';

/**
 * Generates a direct Google Calendar web event creation URL
 */
export function generateGoogleCalendarUrl(apt: Appointment, teacher: TeacherProfile): string {
  // Format date and time to YYYYMMDDTHHmmSS
  const cleanDate = apt.date.replace(/-/g, ''); // 20241115
  const [startH, startM] = apt.startTime.split(':');
  const [endH, endM] = apt.endTime.split(':');

  const startFormatted = `${cleanDate}T${startH.padStart(2, '0')}${startM.padStart(2, '0')}00`;
  const endFormatted = `${cleanDate}T${endH.padStart(2, '0')}${endM.padStart(2, '0')}00`;

  const title = encodeURIComponent(`Aula de ${apt.serviceName} - ${apt.studentName} (${teacher.name})`);
  const details = encodeURIComponent(
    `Aula agendada via Agenda do Professor.\n\n` +
    `• Aluno(a): ${apt.studentName}\n` +
    `• Professor(a): ${teacher.name}\n` +
    `• Serviço: ${apt.serviceName}\n` +
    `• Modalidade: ${apt.modality}\n` +
    `• Valor: R$ ${apt.price},00\n` +
    `• Observações: ${apt.notes || 'Sem observações adicionais.'}\n\n` +
    `Contato Aluno: ${apt.studentPhone || 'Não informado'}\n` +
    `Contato Professor: ${teacher.whatsapp}`
  );
  const location = encodeURIComponent(
    apt.modality.includes('Online') ? 'Online (Google Meet / Zoom)' : 'Presencial - Consultar Local com Professor'
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startFormatted}/${endFormatted}&details=${details}&location=${location}`;
}

/**
 * Generates and triggers download of a standardized .ics iCalendar file for single or multiple appointments
 */
export function downloadIcsCalendarFile(appointments: Appointment[], teacher: TeacherProfile, fileName = 'agenda_professor.ics'): void {
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Agenda do Professor//Google Calendar Sync//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Agenda - ${teacher.name}`,
    'X-WR-TIMEZONE:America/Sao_Paulo',
  ];

  appointments.forEach((apt) => {
    const cleanDate = apt.date.replace(/-/g, '');
    const [startH, startM] = apt.startTime.split(':');
    const [endH, endM] = apt.endTime.split(':');

    const dtStart = `${cleanDate}T${startH.padStart(2, '0')}${startM.padStart(2, '0')}00`;
    const dtEnd = `${cleanDate}T${endH.padStart(2, '0')}${endM.padStart(2, '0')}00`;
    const summary = `Aula: ${apt.serviceName} - ${apt.studentName}`;
    const description = `Aula com ${teacher.name}\\nAluno: ${apt.studentName}\\nModalidade: ${apt.modality}\\nValor: R$ ${apt.price},00\\nNotas: ${apt.notes || ''}`;
    const location = apt.modality.includes('Online') ? 'Online' : 'Presencial';

    icsContent.push(
      'BEGIN:VEVENT',
      `UID:apt-${apt.id}-${cleanDate}@agendaprofessor.com.br`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      `STATUS:CONFIRMED`,
      'END:VEVENT'
    );
  });

  icsContent.push('END:VCALENDAR');

  const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Builds the exact 8-hour prior WhatsApp confirmation message text
 */
export function build8hConfirmationMessage(apt: Appointment, teacher: TeacherProfile): string {
  const firstName = apt.studentName.split(' ')[0];
  const teacherFirstName = teacher.name.replace('Prof. ', '');

  return (
    `*CONFIRMAÇÃO DE AULA - 8H ANTES* ⏰\n\n` +
    `Olá, ${firstName}! Tudo bem? 👋\n` +
    `Aqui é do atendimento do Prof. ${teacherFirstName}.\n\n` +
    `Passando para confirmar sua aula agendada para *hoje*:\n\n` +
    `📚 *Aula:* ${apt.serviceName}\n` +
    `🗓️ *Data:* ${formatDisplayDate(apt.date)}\n` +
    `⏰ *Horário:* ${apt.startTime} às ${apt.endTime} (daqui a ~8 horas)\n` +
    `📍 *Formato:* ${apt.modality}\n` +
    (apt.modality.includes('Online') ? `🔗 *Link da Sala:* Enviado 15min antes da aula\n` : '') +
    `\n` +
    `Por favor, responda com:\n` +
    `👉 *SIM* para confirmar sua presença\n` +
    `👉 *REAGENDAR* caso precise de outro horário\n\n` +
    `Qualquer dúvida estou à disposição! Até logo. ✨`
  );
}

/**
 * Builds standard WhatsApp direct link
 */
export function getWhatsApp8hLink(apt: Appointment, teacher: TeacherProfile): string {
  const phone = (apt.studentPhone || '5511999999999').replace(/\D/g, '');
  const finalPhone = phone.startsWith('55') ? phone : `55${phone}`;
  const message = encodeURIComponent(build8hConfirmationMessage(apt, teacher));
  return `https://wa.me/${finalPhone}?text=${message}`;
}

/**
 * Calculates the exact dispatch time (8 hours before class start)
 */
export function calculate8hDispatchTime(dateStr: string, startTime: string): { dispatchDate: string; dispatchTime: string; isWithin8hWindow: boolean } {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = startTime.split(':').map(Number);

    const classDateTime = new Date(year, month - 1, day, hours, minutes);
    const dispatchDateTime = new Date(classDateTime.getTime() - 8 * 60 * 60 * 1000);

    const now = new Date();
    // Check if current time is within or past the 8h trigger window before class
    const hoursDiff = (classDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isWithin8hWindow = hoursDiff <= 8.5 && hoursDiff >= -1; // up to 1h after start

    const dispatchTime = dispatchDateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dispatchDate = dispatchDateTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    return {
      dispatchDate,
      dispatchTime,
      isWithin8hWindow,
    };
  } catch {
    return {
      dispatchDate: 'Hoje',
      dispatchTime: '08:00',
      isWithin8hWindow: true,
    };
  }
}

function formatDisplayDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  } catch {
    return dateStr;
  }
}
