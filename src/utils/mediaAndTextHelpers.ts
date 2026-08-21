import { Appointment } from '../types';

/**
 * Parses and formats any valid YouTube URL (watch, embed, short link, youtu.be, shorts)
 * into a safe embed URL format.
 */
export function formatYouTubeEmbedUrl(inputUrl: string): string {
  if (!inputUrl) return '';
  const trimmed = inputUrl.trim();

  // If already an embed URL, ensure proper syntax
  if (trimmed.includes('youtube.com/embed/')) {
    return trimmed;
  }

  // Extract from youtube.com/watch?v=VIDEO_ID
  const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/i);
  if (watchMatch && watchMatch[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  // Extract from youtu.be/VIDEO_ID
  const shortMatch = trimmed.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (shortMatch && shortMatch[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  // Extract from youtube.com/shorts/VIDEO_ID
  const shortsMatch = trimmed.match(/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i);
  if (shortsMatch && shortsMatch[1]) {
    return `https://www.youtube.com/embed/${shortsMatch[1]}`;
  }

  // Fallback if URL is already standard or non-standard video
  return trimmed;
}

/**
 * Reads a local browser file and converts it into a Base64 Data URL
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Erro ao ler arquivo como imagem base64.'));
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Replaces dynamic template variables like {nome_aluno}, {data}, {horario}, {professor}, {link_aula}
 */
export function applyTemplateVariables(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`\\{${key}\\}`, 'gi');
    result = result.replace(regex, value || '');
  }
  return result;
}

export interface FinancialOverview {
  totalRevenue: number;
  confirmedRevenue: number;
  pendingRevenue: number;
  totalClasses: number;
  completedClasses: number;
  confirmedClasses: number;
  averageTicket: number;
  onlineClassesCount: number;
  inPersonClassesCount: number;
  classesDurationHours: number;
}

/**
 * Calculates financial and attendance metrics from appointment list
 */
export function calculateFinancialOverview(appointments: Appointment[]): FinancialOverview {
  let totalRevenue = 0;
  let confirmedRevenue = 0;
  let pendingRevenue = 0;
  let completedClasses = 0;
  let confirmedClasses = 0;
  let onlineClassesCount = 0;
  let inPersonClassesCount = 0;
  let totalMinutes = 0;

  appointments.forEach((apt) => {
    const price = apt.price || 0;
    totalRevenue += price;

    if (apt.status === 'Confirmado') {
      confirmedRevenue += price;
      confirmedClasses++;
    } else if (apt.status === 'Concluído') {
      confirmedRevenue += price;
      completedClasses++;
    } else if (apt.status === 'Pendente') {
      pendingRevenue += price;
    }

    if (apt.modality?.toLowerCase().includes('online')) {
      onlineClassesCount++;
    } else {
      inPersonClassesCount++;
    }

    totalMinutes += apt.durationMinutes || 60;
  });

  const totalCount = appointments.length;
  const averageTicket = totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0;
  const classesDurationHours = Math.round((totalMinutes / 60) * 10) / 10;

  return {
    totalRevenue,
    confirmedRevenue,
    pendingRevenue,
    totalClasses: totalCount,
    completedClasses,
    confirmedClasses,
    averageTicket,
    onlineClassesCount,
    inPersonClassesCount,
    classesDurationHours,
  };
}

/**
 * Generates and triggers download of a standardized CSV file for financial and agenda reports
 */
export function exportAppointmentsToCsv(appointments: Appointment[], teacherName: string): void {
  const headers = [
    'ID',
    'Data',
    'Horario Inicio',
    'Horario Fim',
    'Aluno',
    'Telefone Aluno',
    'Email Aluno',
    'Servico',
    'Modalidade',
    'Valor (R$)',
    'Status',
    'Link Videochamada',
    'Notas'
  ];

  const rows = appointments.map((apt) => [
    apt.id,
    apt.date,
    apt.startTime,
    apt.endTime,
    `"${(apt.studentName || '').replace(/"/g, '""')}"`,
    `"${(apt.studentPhone || '').replace(/"/g, '""')}"`,
    `"${(apt.studentEmail || '').replace(/"/g, '""')}"`,
    `"${(apt.serviceName || '').replace(/"/g, '""')}"`,
    `"${(apt.modality || '').replace(/"/g, '""')}"`,
    apt.price || 0,
    apt.status,
    `"${(apt.meetingUrl || '').replace(/"/g, '""')}"`,
    `"${(apt.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `relatorio_aulas_${teacherName.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
