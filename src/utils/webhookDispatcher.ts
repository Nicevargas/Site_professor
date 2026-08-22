import { Appointment, Student, ServiceItem, TeacherProfile, Reminder, PaymentInvoice } from '../types';
import { calculate8hDispatchTime, build8hConfirmationMessage } from './calendarAndWhatsapp';

export interface WebhookEventPayload {
  event: 
    | 'appointment.created' 
    | 'appointment.updated' 
    | 'appointment.cancelled' 
    | 'student.created' 
    | 'reminder.created'
    | 'payment.updated'
    | 'vacation.updated';
  timestamp: string;
  source: string;
  teacher: {
    id: string;
    name: string;
    email?: string;
    whatsapp?: string;
    specialty?: string;
  };
  data: Record<string, any>;
}

// Default backend webhook endpoint (managed centrally by developers)
const DEFAULT_WEBHOOK_URL = 
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_N8N_WEBHOOK_URL) ||
  'https://n8n.seu-dominio.com.br/webhook/whatsapp-8h-confirmacao';

/**
 * Automatically dispatches structured data from forms to the backend webhook in the background.
 * The teacher never needs to configure URLs or technical payload schemas in the UI.
 */
export async function dispatchFormWebhook(
  event: WebhookEventPayload['event'],
  teacher: TeacherProfile,
  data: Record<string, any>
): Promise<boolean> {
  try {
    const payload: WebhookEventPayload = {
      event,
      timestamp: new Date().toISOString(),
      source: 'agenda_professor_admin',
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        whatsapp: teacher.whatsapp,
        specialty: teacher.specialty,
      },
      data,
    };

    const targetUrl = teacher.n8nWebhookUrl || DEFAULT_WEBHOOK_URL;
    const token = teacher.n8nAuthToken || `sec_${teacher.id}`;

    // Background HTTP POST
    fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Teacher-Id': teacher.id,
        'X-Webhook-Token': token,
      },
      body: JSON.stringify(payload),
      mode: 'cors',
    }).catch((err) => {
      // Non-blocking log for developer inspection
      console.info('[Webhook Dispatcher] Notificação em segundo plano enviada:', event, payload);
    });

    return true;
  } catch (err) {
    console.warn('[Webhook Dispatcher] Erro ao despachar formulário:', err);
    return false;
  }
}

/**
 * Helper to dispatch when an appointment is created or updated
 */
export function dispatchAppointmentWebhook(
  apt: Appointment,
  teacher: TeacherProfile,
  action: 'created' | 'updated' | 'cancelled' = 'created'
) {
  const dispatchInfo = calculate8hDispatchTime(apt.date, apt.startTime);
  const whatsappText = build8hConfirmationMessage(apt, teacher);

  dispatchFormWebhook(`appointment.${action}`, teacher, {
    appointmentId: apt.id,
    studentName: apt.studentName,
    studentPhone: apt.studentPhone,
    studentEmail: apt.studentEmail,
    serviceName: apt.serviceName,
    date: apt.date,
    startTime: apt.startTime,
    endTime: apt.endTime,
    durationMinutes: apt.durationMinutes,
    modality: apt.modality,
    status: apt.status,
    price: apt.price,
    notes: apt.notes,
    whatsapp8hDispatchTime: dispatchInfo.dispatchTime,
    whatsapp8hDispatchDate: dispatchInfo.dispatchDate,
    messageText: whatsappText,
  });
}
