import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MyAddressView } from './MyAddressView';
import { TeacherProfile, UserRole } from '../types';

const base: TeacherProfile = {
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
  whatsapp: '',
  email: 'roberto@teste.com',
  plan: 'start',
  slug: 'roberto-almeida',
};

function renderView(teacher: Partial<TeacherProfile> = {}, userRole: UserRole = 'professor', takenSlugs: string[] = []) {
  const onUpdateTeacher = vi.fn();
  render(
    <MyAddressView
      currentTeacher={{ ...base, ...teacher }}
      userRole={userRole}
      takenSlugs={takenSlugs}
      onUpdateTeacher={onUpdateTeacher}
      onOpenPlans={vi.fn()}
    />
  );
  return { onUpdateTeacher };
}

const liveSection = () => screen.getByLabelText('Endereço em uso');

describe('tela Meu endereço', () => {
  it('no Start mostra o endereço por caminho', () => {
    renderView({ plan: 'start' });
    expect(within(liveSection()).getByText('https://aquagenda.com.br/p/roberto-almeida')).toBeInTheDocument();
  });

  it('no Pro o nome do professor vem antes do domínio', () => {
    renderView({ plan: 'pro' });
    expect(within(liveSection()).getByText('https://roberto-almeida.aquagenda.com.br')).toBeInTheDocument();
  });

  it('no Premium com domínio próprio, o Aquagenda some do endereço', () => {
    renderView({ plan: 'premium', customDomain: 'profroberto.com.br' });
    expect(within(liveSection()).getByText('https://profroberto.com.br')).toBeInTheDocument();
  });

  it('domínio próprio fica trancado fora do Premium', () => {
    renderView({ plan: 'pro' });
    const domainSection = screen.getByLabelText('Domínio próprio');
    expect(within(domainSection).getByText('Plano Premium')).toBeInTheDocument();
    expect(screen.queryByLabelText(/^domínio$/i)).not.toBeInTheDocument();
  });

  it('no Premium o campo de domínio aparece e normaliza o que foi digitado', () => {
    const { onUpdateTeacher } = renderView({ plan: 'premium' });
    fireEvent.change(screen.getByLabelText(/^domínio$/i), { target: { value: 'HTTPS://ProfRoberto.com.br/vitrine' } });
    fireEvent.click(screen.getAllByRole('button', { name: /^salvar$/i })[1]);

    expect(onUpdateTeacher).toHaveBeenCalledTimes(1);
    expect(onUpdateTeacher.mock.calls[0][0]).toMatchObject({
      customDomain: 'profroberto.com.br',
      customDomainStatus: 'pendente',
    });
  });

  it('identificador em uso por outro professor é recusado', () => {
    const { onUpdateTeacher } = renderView({}, 'professor', ['carlos-silva']);
    fireEvent.change(screen.getByLabelText('Identificador'), { target: { value: 'Carlos Silva' } });
    fireEvent.click(screen.getAllByRole('button', { name: /^salvar$/i })[0]);

    expect(screen.getByRole('alert')).toHaveTextContent(/já está em uso/i);
    expect(onUpdateTeacher).not.toHaveBeenCalled();
  });

  it('identificador digitado com acento e título é normalizado ao salvar', () => {
    const { onUpdateTeacher } = renderView();
    fireEvent.change(screen.getByLabelText('Identificador'), { target: { value: 'Profa. Ana Conceição' } });
    fireEvent.click(screen.getAllByRole('button', { name: /^salvar$/i })[0]);
    expect(onUpdateTeacher.mock.calls[0][0].slug).toBe('ana-conceicao');
  });

  it('professor não muda o próprio plano', () => {
    renderView({ plan: 'start' }, 'professor');
    expect(screen.queryByRole('button', { name: /mudar para premium/i })).not.toBeInTheDocument();
  });

  it('admin muda o plano do professor', () => {
    const { onUpdateTeacher } = renderView({ plan: 'start' }, 'admin');
    fireEvent.click(screen.getByRole('button', { name: /mudar para premium/i }));
    expect(onUpdateTeacher.mock.calls[0][0].plan).toBe('premium');
  });

  it('rebaixar de plano tira o domínio próprio junto', () => {
    const { onUpdateTeacher } = renderView({ plan: 'premium', customDomain: 'profroberto.com.br' }, 'admin');
    fireEvent.click(screen.getByRole('button', { name: /mudar para start/i }));
    expect(onUpdateTeacher.mock.calls[0][0]).toMatchObject({
      plan: 'start',
      customDomain: undefined,
      customDomainStatus: 'nenhum',
    });
  });
});
