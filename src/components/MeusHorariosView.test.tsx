import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { MeusHorariosView } from './MeusHorariosView';
import { TeacherProfile } from '../types';

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
  whatsapp: '',
  email: 'prof@teste.com',
};

function montar(horariosAula?: TeacherProfile['horariosAula'], onSalvar = vi.fn().mockResolvedValue(true)) {
  render(<MeusHorariosView currentTeacher={{ ...professor, horariosAula }} onSalvar={onSalvar} />);
  return { onSalvar };
}

function adicionar(dia: string, hora: string) {
  fireEvent.change(screen.getByLabelText(`Novo horário para ${dia}`), { target: { value: hora } });
  fireEvent.click(screen.getByRole('button', { name: `Adicionar horário em ${dia}` }));
}

const salvar = () => fireEvent.click(screen.getByRole('button', { name: /salvar horários/i }));
const dia = (nome: string) => within(screen.getByRole('region', { name: nome }));

describe('tela de horários de aula', () => {
  it('quem nunca configurou vê o horário padrão e o aviso', () => {
    montar(undefined);
    expect(screen.getByText(/ainda não definiu seus horários/i)).toBeInTheDocument();
    expect(dia('Segunda').getByText('09:00')).toBeInTheDocument();
    expect(dia('Sábado').getByText(/sem aula/i)).toBeInTheDocument();
  });

  it('ao adicionar um horário, pergunta se quer usar em outros dias e copia de uma vez', async () => {
    const { onSalvar } = montar({});
    adicionar('Segunda', '07:00');

    expect(screen.getByText(/usar os mesmos horários de segunda \(07:00\) em outros dias/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Quarta' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sexta' }));
    fireEvent.click(screen.getByRole('button', { name: /usar nos dias marcados/i }));

    expect(dia('Quarta').getByText('07:00')).toBeInTheDocument();
    expect(screen.getByText(/copiados para quarta e sexta/i)).toBeInTheDocument();

    salvar();
    await waitFor(() => expect(onSalvar).toHaveBeenCalledWith({ 1: ['07:00'], 3: ['07:00'], 5: ['07:00'] }));
    expect(await screen.findByText(/horários salvos/i)).toBeInTheDocument();
  });

  it('"Não, só Segunda" grava só aquele dia', async () => {
    const { onSalvar } = montar({});
    adicionar('Segunda', '07:00');
    fireEvent.click(screen.getByRole('button', { name: /não, só segunda/i }));

    expect(screen.queryByText(/usar os mesmos horários/i)).not.toBeInTheDocument();
    salvar();
    await waitFor(() => expect(onSalvar).toHaveBeenCalledWith({ 1: ['07:00'] }));
  });

  it('"Marcar segunda a sexta" preenche os dias úteis', async () => {
    const { onSalvar } = montar({});
    adicionar('Segunda', '06:30');
    fireEvent.click(screen.getByRole('button', { name: /marcar segunda a sexta/i }));
    fireEvent.click(screen.getByRole('button', { name: /usar nos dias marcados/i }));
    salvar();
    await waitFor(() =>
      expect(onSalvar).toHaveBeenCalledWith({
        1: ['06:30'],
        2: ['06:30'],
        3: ['06:30'],
        4: ['06:30'],
        5: ['06:30'],
      })
    );
  });

  it('avisa antes de trocar horários que o dia já tinha', async () => {
    const { onSalvar } = montar({ 1: ['07:00'], 2: ['18:00'] });
    fireEvent.click(screen.getByRole('button', { name: 'Repetir horários de Segunda em outros dias' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Terça' }));

    expect(screen.getByText(/terça já tem horários/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /usar nos dias marcados/i }));
    salvar();
    await waitFor(() => expect(onSalvar).toHaveBeenCalledWith({ 1: ['07:00'], 2: ['07:00'] }));
  });

  it('horário repetido no mesmo dia não entra', () => {
    montar({ 1: ['07:00'] });
    adicionar('Segunda', '07:00');
    expect(screen.getByRole('alert')).toHaveTextContent(/07:00 já está em segunda/i);
  });

  it('remove um horário', async () => {
    const { onSalvar } = montar({ 1: ['07:00', '18:00'] });
    fireEvent.click(screen.getByRole('button', { name: 'Remover 18:00 de Segunda' }));
    salvar();
    await waitFor(() => expect(onSalvar).toHaveBeenCalledWith({ 1: ['07:00'] }));
  });

  it('sem alteração, não há o que salvar', () => {
    montar({ 1: ['07:00'] });
    expect(screen.getByRole('button', { name: /salvar horários/i })).toBeDisabled();
  });

  it('falha ao salvar avisa e mantém o que foi feito na tela', async () => {
    montar({}, vi.fn().mockResolvedValue(false));
    adicionar('Segunda', '07:00');
    fireEvent.click(screen.getByRole('button', { name: /não, só segunda/i }));
    salvar();

    expect(await screen.findByText(/não foi possível salvar agora/i)).toBeInTheDocument();
    expect(dia('Segunda').getByText('07:00')).toBeInTheDocument();
  });

  it('grade sem nenhum horário avisa que o agendamento fica fechado', () => {
    montar({});
    expect(screen.getByText(/agendamento pelo site fica fechado/i)).toBeInTheDocument();
  });
});
