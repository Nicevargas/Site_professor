import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PublicBookingWizard } from './PublicBookingWizard';
import { ServiceItem, TeacherProfile } from '../types';
import { rotuloCurtoDoDia } from '../utils/dates';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

const professor: TeacherProfile = {
  id: 'prof-1',
  name: 'Prof. Teste',
  role: 'professor',
  specialty: '',
  bio: '',
  rating: 5,
  reviewCount: 0,
  yearsExperience: 1,
  avatarUrl: '',
  heroImageUrl: '',
  whatsapp: '5511999999999',
  email: 'prof@teste.com',
};

const services: ServiceItem[] = [
  { id: 'serv-1', name: 'Natação 1h', description: '', price: 100, durationMinutes: 60, active: true, modality: 'Presencial', iconName: 'pool' },
];

function proximo(diaDaSemana: number): Date {
  const d = new Date();
  do {
    d.setDate(d.getDate() + 1);
  } while (d.getDay() !== diaDaSemana);
  return d;
}

function abrir(horariosAula: TeacherProfile['horariosAula']) {
  render(
    <PublicBookingWizard
      teacher={{ ...professor, horariosAula }}
      services={services}
      preSelectedServiceId="serv-1"
      existingAppointments={[]}
      onBookingComplete={vi.fn()}
      onBackToLanding={vi.fn()}
      onBackToDashboard={vi.fn()}
    />
  );
}

const botaoDoHorario = (hora: string) => screen.queryByRole('button', { name: new RegExp(`^${hora}`) });

describe('agendamento do site com os horários do professor', () => {
  it('oferece só os dias e horários que o professor configurou', () => {
    abrir({ 3: ['07:00', '19:30'] });

    expect(screen.getByRole('button', { name: new RegExp(rotuloCurtoDoDia(proximo(3)), 'i') })).toBeInTheDocument();
    expect(botaoDoHorario('07:00')).toHaveTextContent(/manhã/i);
    expect(botaoDoHorario('19:30')).toHaveTextContent(/noite/i);
    // Os horários fixos antigos não aparecem mais para quem configurou
    expect(botaoDoHorario('09:00')).not.toBeInTheDocument();
  });

  it('professor que fechou todos os horários: avisa em vez de mostrar dia vazio', () => {
    abrir({});
    expect(screen.getByText(/ainda não abriu horários para agendar pelo site/i)).toBeInTheDocument();
  });
});
