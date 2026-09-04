import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { AgendaView } from './AgendaView';
import { Appointment, ServiceItem, TeacherProfile } from '../types';
import { addDays, toLocalDateKey, buildWeek, formatWeekRange, formatMonthYearPtBR } from '../utils/dates';

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

const services: ServiceItem[] = [
  { id: 'serv-1', name: 'Personal Trainer 1h', description: '', price: 150, durationMinutes: 60, active: true, modality: 'Presencial', iconName: 'fitness_center' },
];

const active: Appointment = {
  id: 'apt-ativa', studentName: 'Mariana Costa', serviceId: 'serv-1', serviceName: 'Personal Trainer 1h',
  date: '2026-09-07', dayOfWeek: 1, startTime: '10:00', endTime: '11:00', durationMinutes: 60,
  modality: 'Presencial', status: 'Confirmado', price: 150,
};

const cancelled: Appointment = {
  id: 'apt-cancelada', studentName: 'João Pedro', serviceId: 'serv-1', serviceName: 'Personal Trainer 1h',
  date: '2026-09-08', dayOfWeek: 2, startTime: '14:00', endTime: '15:00', durationMinutes: 60,
  modality: 'Presencial', status: 'Cancelado', price: 150,
  cancelledAt: '2026-09-04', cancellationReason: 'Aluno viajou',
};

function renderAgenda(appointments: Appointment[], selected: Appointment | null = null) {
  const onCancelAppointment = vi.fn();
  const onReopenAppointment = vi.fn();
  const onDeleteAppointment = vi.fn();
  render(
    <AgendaView
      appointments={appointments}
      services={services}
      currentTeacher={teacher}
      selectedAppointment={selected}
      onSelectAppointment={vi.fn()}
      onUpdateAppointmentNotes={vi.fn()}
      onCancelAppointment={onCancelAppointment}
      onReopenAppointment={onReopenAppointment}
      onDeleteAppointment={onDeleteAppointment}
      onRescheduleAppointment={vi.fn()}
      onOpenNewAppointmentModal={vi.fn()}
      onOpenGoogleCalendarModal={vi.fn()}
      onOpenWhatsApp8hModal={vi.fn()}
    />
  );
  return { onCancelAppointment, onReopenAppointment, onDeleteAppointment };
}

const periodTitle = () => screen.getByRole('heading', { name: /período exibido/i });
const history = () => screen.getByRole('region', { name: /histórico de cancelamentos/i });

/** Aula em um dia relativo a hoje, para os testes da grade. */
function aptOn(daysFromToday: number, studentName: string, startTime = '10:00'): Appointment {
  const d = addDays(new Date(), daysFromToday);
  return {
    id: `apt-${studentName.replace(/\s/g, '')}-${daysFromToday}`,
    studentName,
    serviceId: 'serv-1',
    serviceName: 'Personal Trainer 1h',
    date: toLocalDateKey(d),
    dayOfWeek: d.getDay(),
    startTime,
    endTime: '11:00',
    durationMinutes: 60,
    modality: 'Presencial',
    status: 'Confirmado',
    price: 150,
  };
}

describe('agenda: grade com datas reais', () => {
  it('abre na semana de hoje, não em uma data fixa do passado', () => {
    renderAgenda([]);
    expect(screen.queryByText(/13 - 19 novembro/i)).not.toBeInTheDocument();
    expect(periodTitle()).toHaveTextContent(formatWeekRange(buildWeek(new Date())));
  });

  it('mostra as aulas da semana atual e esconde as de outras semanas', () => {
    renderAgenda([aptOn(0, 'Aluno Desta Semana'), aptOn(30, 'Aluno Do Mes Que Vem')]);
    expect(screen.getByText('Aluno Desta Semana')).toBeInTheDocument();
    expect(screen.queryByText('Aluno Do Mes Que Vem')).not.toBeInTheDocument();
  });

  it('avançar e voltar trocam a semana; Hoje volta para a atual', () => {
    renderAgenda([aptOn(0, 'Aula De Hoje')]);
    const thisWeek = formatWeekRange(buildWeek(new Date()));

    fireEvent.click(screen.getByRole('button', { name: /próximo período/i }));
    expect(periodTitle()).not.toHaveTextContent(thisWeek);
    expect(screen.queryByText('Aula De Hoje')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /período anterior/i }));
    expect(periodTitle()).toHaveTextContent(thisWeek);
    expect(screen.getByText('Aula De Hoje')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /próximo período/i }));
    fireEvent.click(screen.getByRole('button', { name: /^hoje$/i }));
    expect(periodTitle()).toHaveTextContent(thisWeek);
  });

  it('o modo Dia mostra só o dia escolhido', () => {
    // duas aulas na mesma semana, em dias diferentes de hoje
    const hoje = aptOn(0, 'Aula De Hoje');
    const outroDia = aptOn(new Date().getDay() === 1 ? 1 : -1, 'Aula Outro Dia');
    renderAgenda([hoje, outroDia]);

    fireEvent.click(screen.getByRole('button', { name: /^dia$/i }));
    expect(screen.getByText('Aula De Hoje')).toBeInTheDocument();
    expect(screen.queryByText('Aula Outro Dia')).not.toBeInTheDocument();
  });

  it('o modo Mês lista as aulas do mês em uma grade própria', () => {
    renderAgenda([aptOn(0, 'Aula De Hoje')]);
    fireEvent.click(screen.getByRole('button', { name: /^mês$/i }));

    const month = screen.getByLabelText(/calendário do mês/i);
    expect(within(month).getByRole('button', { name: /aula de hoje/i })).toBeInTheDocument();
    expect(periodTitle()).toHaveTextContent(formatMonthYearPtBR(new Date()));
  });

  it('clicar num dia do mini calendário leva a grade para aquela semana', () => {
    renderAgenda([aptOn(30, 'Aluno Do Mes Que Vem')]);
    expect(screen.queryByText('Aluno Do Mes Que Vem')).not.toBeInTheDocument();

    // navega o mini calendário até o mês seguinte e clica no dia da aula
    const target = toLocalDateKey(addDays(new Date(), 30));
    fireEvent.click(screen.getByRole('button', { name: /próximo mês/i }));
    const dayLabel = new RegExp(`ir para ${target.split('-').reverse().join('/')}`, 'i');
    fireEvent.click(screen.getByRole('button', { name: dayLabel }));

    expect(screen.getByText('Aluno Do Mes Que Vem')).toBeInTheDocument();
  });
});

describe('agenda: histórico de cancelamentos', () => {
  it('aula cancelada sai da grade e aparece no histórico com data e motivo', () => {
    renderAgenda([active, cancelled]);
    const panel = history();
    expect(within(panel).getByText(/joão pedro/i)).toBeInTheDocument();
    expect(within(panel).getByText(/cancelada em 04\/09\/2026/i)).toBeInTheDocument();
    expect(within(panel).getByText(/aluno viajou/i)).toBeInTheDocument();
    expect(within(panel).queryByText(/mariana costa/i)).not.toBeInTheDocument();
  });

  it('o contador do filtro mostra quantas foram canceladas', () => {
    renderAgenda([active, cancelled]);
    expect(screen.getByRole('button', { name: /canceladas \(1\)/i })).toBeInTheDocument();
  });

  it('sem cancelamentos o histórico não ocupa espaço, mas abre pelo filtro', () => {
    renderAgenda([active]);
    expect(screen.queryByRole('region', { name: /histórico de cancelamentos/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /canceladas \(0\)/i }));
    expect(within(history()).getByText(/nenhuma aula cancelada/i)).toBeInTheDocument();
  });

  it('cancelar pede confirmação e envia o motivo digitado', () => {
    const { onCancelAppointment } = renderAgenda([active], active);
    fireEvent.click(screen.getByRole('button', { name: /^cancelar$/i }));

    const dialog = screen.getByRole('dialog', { name: /cancelar aula/i });
    fireEvent.change(within(dialog).getByLabelText(/motivo/i), { target: { value: 'Professor doente' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /confirmar cancelamento/i }));

    expect(onCancelAppointment).toHaveBeenCalledWith('apt-ativa', 'Professor doente');
  });

  it('voltar na confirmação não cancela nada', () => {
    const { onCancelAppointment } = renderAgenda([active], active);
    fireEvent.click(screen.getByRole('button', { name: /^cancelar$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^voltar$/i }));
    expect(onCancelAppointment).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: /cancelar aula/i })).not.toBeInTheDocument();
  });

  it('aula cancelada oferece reabrir e excluir, não cancelar de novo', () => {
    const { onReopenAppointment } = renderAgenda([cancelled], cancelled);
    // a data aparece no histórico e no painel de detalhes; aqui basta que exista
    expect(screen.getAllByText(/cancelada em 04\/09\/2026/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/motivo: aluno viajou/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /^cancelar$/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /reabrir aula/i }));
    expect(onReopenAppointment).toHaveBeenCalledWith('apt-cancelada');
  });

  it('excluir do histórico pede confirmação', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { onDeleteAppointment } = renderAgenda([cancelled], cancelled);
    fireEvent.click(screen.getByRole('button', { name: /excluir do histórico/i }));
    expect(window.confirm).toHaveBeenCalled();
    expect(onDeleteAppointment).toHaveBeenCalledWith('apt-cancelada');
    vi.restoreAllMocks();
  });
});
