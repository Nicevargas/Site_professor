import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StudentPortalView } from './StudentPortalView';
import { Appointment, AuthUser, PaymentInvoice, TeacherProfile, VideoItem } from '../types';
import { toLocalDateKey, addDays } from '../utils/dates';

/**
 * Aluno que treina com mais de um professor.
 *
 * O portal recebe a agenda inteira e faz o recorte por dono do registro --
 * é o mesmo caminho que o RLS já usa no banco (is_own_student_record casa
 * por e-mail e ignora teacher_id). Por isso os testes de vazamento aqui
 * são tão importantes quanto os de funcionalidade.
 */

function prof(id: string, name: string, whatsapp = ''): TeacherProfile {
  return {
    id, name, role: 'Instrutor', specialty: 'Especialidade', bio: '',
    rating: 5, reviewCount: 1, yearsExperience: 1,
    avatarUrl: '', heroImageUrl: '', whatsapp, email: `${id}@teste.com`,
  };
}

const roberto = prof('prof-roberto', 'Prof. Roberto Almeida', '5511999999999');
const carlos = prof('prof-carlos', 'Prof. Carlos Silva', '5511988888888');
const teachers = [roberto, carlos];

const amanha = toLocalDateKey(addDays(new Date(), 1));

function aula(over: Partial<Appointment>): Appointment {
  return {
    id: `apt-${Math.random().toString(36).slice(2)}`,
    studentName: 'Mariana Costa', studentEmail: 'mariana@teste.com', studentId: 'std-1',
    serviceId: 's1', serviceName: 'Aula', date: amanha, dayOfWeek: 1,
    startTime: '10:00', endTime: '11:00', durationMinutes: 60,
    modality: 'Presencial', status: 'Confirmado', price: 150, ...over,
  };
}

function cobranca(over: Partial<PaymentInvoice>): PaymentInvoice {
  return {
    id: `inv-${Math.random().toString(36).slice(2)}`,
    studentName: 'Mariana Costa', studentEmail: 'mariana@teste.com', studentId: 'std-1',
    serviceOrPlanName: 'Mensalidade', amount: 200, dueDate: amanha,
    status: 'pendente', method: 'pix', createdAt: amanha, ...over,
  };
}

const aluna: AuthUser = {
  id: 'u1', email: 'mariana@teste.com', name: 'Mariana Costa', role: 'aluno', studentId: 'std-1',
};

function renderPortal(
  appointments: Appointment[],
  invoices: PaymentInvoice[] = [],
  videos: VideoItem[] = [],
  user: AuthUser = aluna
) {
  render(
    <StudentPortalView
      currentUser={user}
      currentTeacher={roberto}
      teachers={teachers}
      appointments={appointments}
      invoices={invoices}
      videos={videos}
      onOpenBookingWizard={vi.fn()}
      onOpenWhatsApp={vi.fn()}
    />
  );
}

describe('aluno com vários professores', () => {
  it('vê as aulas dos dois professores numa tela só', () => {
    renderPortal([
      aula({ serviceId: 'nat', serviceName: 'Natação', teacherId: 'prof-roberto' }),
      aula({ serviceId: 'mat', serviceName: 'Matemática', teacherId: 'prof-carlos', startTime: '15:00', endTime: '16:00' }),
    ]);

    expect(screen.getByText('Natação')).toBeInTheDocument();
    expect(screen.getByText('Matemática')).toBeInTheDocument();
  });

  it('diz de qual professor é cada aula', () => {
    renderPortal([
      aula({ serviceName: 'Natação', teacherId: 'prof-roberto' }),
      aula({ serviceName: 'Matemática', teacherId: 'prof-carlos', startTime: '15:00', endTime: '16:00' }),
    ]);

    const cardNatacao = screen.getByText('Natação').closest('div')!.parentElement as HTMLElement;
    const cardMat = screen.getByText('Matemática').closest('div')!.parentElement as HTMLElement;
    expect(cardNatacao.textContent).toContain('Prof. Roberto Almeida');
    expect(cardMat.textContent).toContain('Prof. Carlos Silva');
  });

  it('mostra a faixa de professores com o contato de cada um', () => {
    renderPortal([
      aula({ teacherId: 'prof-roberto' }),
      aula({ teacherId: 'prof-carlos', startTime: '15:00', endTime: '16:00' }),
    ]);

    expect(screen.getByRole('region', { name: /meus professores/i })).toBeInTheDocument();
    // O primeiro nome ignora o título: "Prof. Roberto Almeida" vira "Roberto"
    expect(screen.getByRole('link', { name: /falar com roberto/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /falar com carlos/i })).toBeInTheDocument();
  });

  it('com um professor só, não polui a tela com a faixa nem com o contador', () => {
    renderPortal([aula({ teacherId: 'prof-roberto' })]);

    expect(screen.queryByRole('region', { name: /meus professores/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/^Professores$/)).not.toBeInTheDocument();
  });

  it('separa as cobranças por professor quando há mais de um', () => {
    renderPortal(
      [aula({ teacherId: 'prof-roberto' }), aula({ teacherId: 'prof-carlos', startTime: '15:00', endTime: '16:00' })],
      [
        cobranca({ serviceOrPlanName: 'Mensalidade natação', teacherId: 'prof-roberto' }),
        cobranca({ serviceOrPlanName: 'Mensalidade matemática', teacherId: 'prof-carlos' }),
      ]
    );

    const linha = screen.getByText('Mensalidade matemática').closest('div')!.parentElement as HTMLElement;
    expect(linha.textContent).toContain('Prof. Carlos Silva');
  });

  it('NÃO vaza aula de outro aluno, mesmo recebendo a agenda inteira', () => {
    renderPortal([
      aula({ serviceName: 'Minha aula', teacherId: 'prof-roberto' }),
      aula({
        serviceName: 'Aula alheia',
        teacherId: 'prof-carlos',
        studentId: 'std-99',
        studentName: 'Mariana Silva',
        studentEmail: 'outra@teste.com',
      }),
    ]);

    expect(screen.getByText('Minha aula')).toBeInTheDocument();
    expect(screen.queryByText('Aula alheia')).not.toBeInTheDocument();
    // Um professor só: o da aula que é dela de verdade
    expect(screen.queryByRole('region', { name: /meus professores/i })).not.toBeInTheDocument();
  });

  it('NÃO vaza cobrança de outro aluno', () => {
    renderPortal(
      [aula({ teacherId: 'prof-roberto' })],
      [
        cobranca({ serviceOrPlanName: 'Minha mensalidade' }),
        cobranca({
          serviceOrPlanName: 'Mensalidade alheia',
          studentId: 'std-99',
          studentName: 'Outra Pessoa',
          studentEmail: 'outra@teste.com',
        }),
      ]
    );

    expect(screen.getByText('Minha mensalidade')).toBeInTheDocument();
    expect(screen.queryByText('Mensalidade alheia')).not.toBeInTheDocument();
  });

  it('só mostra conteúdo dos professores dela, não da plataforma inteira', () => {
    const videos: VideoItem[] = [
      { id: 'v1', teacherId: 'prof-roberto', title: 'Vídeo do meu professor', category: 'Aulas', videoUrl: 'https://x', thumbnailUrl: 'https://y', duration: '10:00', description: '', active: true },
      { id: 'v2', teacherId: 'prof-estranho', title: 'Vídeo de professor alheio', category: 'Aulas', videoUrl: 'https://x', thumbnailUrl: 'https://y', duration: '10:00', description: '', active: true },
    ];
    renderPortal([aula({ teacherId: 'prof-roberto' })], [], videos);

    expect(screen.getByText('Vídeo do meu professor')).toBeInTheDocument();
    expect(screen.queryByText('Vídeo de professor alheio')).not.toBeInTheDocument();
  });

  it('aluna sem aula nenhuma ainda cai no professor pelo qual entrou', () => {
    renderPortal([]);
    expect(screen.getByText(/Prof\. Roberto Almeida/)).toBeInTheDocument();
  });
});
