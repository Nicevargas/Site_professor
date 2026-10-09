import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ServiceModal } from './ServiceModal';
import { ServiceItem } from '../types';

function abrir(editingService: ServiceItem | null = null) {
  const onSave = vi.fn();
  render(<ServiceModal isOpen onClose={vi.fn()} onSave={onSave} editingService={editingService} />);
  fireEvent.change(screen.getByPlaceholderText(/aula particular de física/i), { target: { value: 'Natação infantil' } });
  const salvar = () => {
    fireEvent.click(screen.getByRole('button', { name: /salvar serviço/i }));
    return onSave.mock.calls.at(-1)?.[0] as ServiceItem;
  };
  return { salvar, onSave };
}

const servico: ServiceItem = {
  id: 'serv-1', name: 'Aula', description: 'x', price: 80, durationMinutes: 35,
  active: true, modality: 'Presencial', iconName: 'pool', capacity: 4,
};

describe('formulário de serviço', () => {
  it('limite de alunos: dá para apagar o 1 e digitar outro número', () => {
    const { salvar } = abrir();
    const limite = screen.getByLabelText(/limite de alunos por horário/i) as HTMLInputElement;

    // Antes, apagar devolvia "1" na hora e digitar 8 virava 18
    fireEvent.change(limite, { target: { value: '' } });
    expect(limite.value).toBe('');
    fireEvent.change(limite, { target: { value: '8' } });
    expect(limite.value).toBe('8');
    expect(salvar().capacity).toBe(8);
  });

  it('limite vazio salva 1; acima de 60 o navegador segura o salvar', () => {
    const { salvar, onSave } = abrir();
    const limite = screen.getByLabelText(/limite de alunos por horário/i) as HTMLInputElement;
    fireEvent.change(limite, { target: { value: '' } });
    expect(salvar().capacity).toBe(1);

    // max=60 no campo: o navegador mostra o aviso dele e não envia o formulário
    fireEvent.change(limite, { target: { value: '500' } });
    expect(limite.validity.rangeOverflow).toBe(true);
    salvar();
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('duração de 40 minutos está na lista', () => {
    const { salvar } = abrir();
    fireEvent.change(screen.getByLabelText(/duração \(minutos\)/i), { target: { value: '40' } });
    expect(salvar().durationMinutes).toBe(40);
  });

  it('"Outra duração…" abre o campo e salva os minutos digitados', () => {
    const { salvar, onSave } = abrir();
    expect(screen.queryByLabelText('Duração em minutos')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/duração \(minutos\)/i), { target: { value: 'outra' } });
    fireEvent.change(screen.getByLabelText('Duração em minutos'), { target: { value: '35' } });
    expect(salvar().durationMinutes).toBe(35);

    // Vazio vira 60; fora da faixa (5 a 240) o navegador segura o salvar
    fireEvent.change(screen.getByLabelText('Duração em minutos'), { target: { value: '' } });
    expect(salvar().durationMinutes).toBe(60);
    const antes = onSave.mock.calls.length;
    fireEvent.change(screen.getByLabelText('Duração em minutos'), { target: { value: '999' } });
    salvar();
    expect(onSave).toHaveBeenCalledTimes(antes);
  });

  it('editar serviço com duração fora da lista mostra a duração dele, não um campo em branco', () => {
    const { salvar } = abrir(servico);
    expect((screen.getByLabelText(/duração \(minutos\)/i) as HTMLSelectElement).value).toBe('outra');
    expect((screen.getByLabelText('Duração em minutos') as HTMLInputElement).value).toBe('35');
    expect(salvar()).toMatchObject({ id: 'serv-1', durationMinutes: 35, capacity: 4, price: 80 });
  });

  it('valor: dá para apagar e digitar; aula gratuita (R$ 0) continua 0', () => {
    const { salvar } = abrir({ ...servico, price: 0, durationMinutes: 60 });
    const valor = screen.getByLabelText(/valor \(r\$\)/i) as HTMLInputElement;
    expect(valor.value).toBe('0');
    expect(salvar().price).toBe(0);
    fireEvent.change(valor, { target: { value: '' } });
    expect(valor.value).toBe('');
    fireEvent.change(valor, { target: { value: '120' } });
    expect(salvar().price).toBe(120);
  });
});
