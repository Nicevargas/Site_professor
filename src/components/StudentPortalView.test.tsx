import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StudentPortalView } from './StudentPortalView';
import { Appointment, AuthUser, PaymentInvoice, TeacherProfile, VideoItem } from '../types';
import { toLocalDateKey, addDays } from '../utils/dates';

const teacher: TeacherProfile = {
  id: 'prof-roberto',
  name: 'Prof. Roberto Almeida',
  role: 'Personal Trainer',
  specialty: 'Treino',
  bio: '',
  rating: 5,
  reviewCount: 1,
  yearsExperience: 1,
  avatarUrl: '',
  heroImageUrl: '',
  whatsapp: '5511999999999',
  email: 'roberto@teste.com',
};

const tomorrow = toLocalDateKey(addDays(new Date(), 1));

const appointments: Appointment[] = [
  { id: 'apt-mine', studentId: 'std-1', studentName: 'Mariana Costa', studentEmail: 'mariana@teste.com', serviceId: 's1', serviceName: 'Personal 1h', date: tomorrow, dayOfWeek: 1, startTime: '10:00', endTime: '11:00', durationMinutes: 60, modality: 'Presencial', status: 'Confirmado', price: 150 },
  { id: 'apt-other', studentId: 'std-2', studentName: 'Mariana Silva', studentEmail: 'silva@teste.com', serviceId: 's1', serviceName: 'Aula do outro aluno', date: tomorrow, dayOfWeek: 1, startTime: '14:00', endTime: '15:00', durationMinutes: 60, modality: 'Presencial', status: 'Confirmado', price: 150 },
];

const invoices: PaymentInvoice[] = [
  { id: 'inv-mine', studentId: 'std-1', studentName: 'Mariana Costa', studentEmail: 'mariana@teste.com', serviceOrPlanName: 'Mensalidade minha', amount: 200, dueDate: tomorrow, status: 'pendente', method: 'pix', createdAt: tomorrow },
  { id: 'inv-other', studentId: 'std-2', studentName: 'Mariana Silva', studentEmail: 'silva@teste.com', serviceOrPlanName: 'Cobranca do outro aluno', amount: 999, dueDate: tomorrow, status: 'pendente', method: 'pix', createdAt: tomorrow },
];

const videos: VideoItem[] = [
  { id: 'v1', title: 'Aula liberada', category: 'Aulas', videoUrl: 'https://x', thumbnailUrl: 'https://y', duration: '10:00', description: '', active: true },
  { id: 'v2', title: 'Rascunho oculto', category: 'Aulas', videoUrl: 'https://x', thumbnailUrl: 'https://y', duration: '10:00', description: '', active: false },
];

function renderPortal(user: Partial<AuthUser>) {
  const currentUser: AuthUser = { id: 'u1', email: '', name: '', role: 'aluno', ...user };
  render(
    <StudentPortalView
      currentUser={currentUser}
      currentTeacher={teacher}
      appointments={appointments}
      invoices={invoices}
      videos={videos}
      onOpenBookingWizard={vi.fn()}
      onOpenWhatsApp={vi.fn()}
    />
  );
}

describe('portal do aluno: privacidade', () => {
  it('mostra só as aulas e cobranças do próprio aluno, casando pelo id', () => {
    renderPortal({ name: 'Mariana Costa', email: 'mariana@teste.com', studentId: 'std-1' });
    expect(screen.getByText(/mensalidade minha/i)).toBeInTheDocument();
    expect(screen.queryByText(/cobranca do outro aluno/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/aula do outro aluno/i)).not.toBeInTheDocument();
  });

  it('nome parecido não dá acesso aos dados de outro aluno', () => {
    // "Mariana Silva" não pode puxar os registros de "Mariana Costa"
    renderPortal({ name: 'Mariana Silva', email: 'silva@teste.com', studentId: 'std-2' });
    expect(screen.getByText(/cobranca do outro aluno/i)).toBeInTheDocument();
    expect(screen.queryByText(/mensalidade minha/i)).not.toBeInTheDocument();
  });

  it('usuário sem vínculo não vê dados de ninguém', () => {
    renderPortal({ name: 'Pessoa Sem Vinculo', email: 'ninguem@teste.com' });
    expect(screen.queryByText(/mensalidade minha/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/cobranca do outro aluno/i)).not.toBeInTheDocument();
  });

  it('vídeos inativos não aparecem para o aluno', () => {
    renderPortal({ name: 'Mariana Costa', email: 'mariana@teste.com', studentId: 'std-1' });
    expect(screen.getByText(/aula liberada/i)).toBeInTheDocument();
    expect(screen.queryByText(/rascunho oculto/i)).not.toBeInTheDocument();
  });
});
