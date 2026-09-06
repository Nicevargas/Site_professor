import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StudentsView } from './StudentsView';
import { Student } from '../types';

function aluno(over: Partial<Student> = {}): Student {
  return {
    id: 'std-1', name: 'Ana Souza', email: 'ana@teste.com', phone: '(11) 90000-0000',
    avatar: '', joinedDate: 'Janeiro 2026', totalClasses: 4, status: 'Ativo', ...over,
  };
}

function renderView(students: Student[]) {
  const onAddStudent = vi.fn();
  const onUpdateStudent = vi.fn();
  render(
    <StudentsView
      students={students}
      onAddStudent={onAddStudent}
      onSelectStudentToSchedule={vi.fn()}
      onUpdateStudent={onUpdateStudent}
    />
  );
  return { onAddStudent, onUpdateStudent };
}

describe('nível do aluno', () => {
  it('mostra o nível no card e avisa quando ainda não foi definido', () => {
    renderView([aluno({ level: 'avancado' }), aluno({ id: 'std-2', name: 'Bruno Lima' })]);
    // 'Avançado' também é uma opção do seletor: o teste olha só a etiqueta (span)
    const etiquetas = screen.getAllByText('Avançado').filter((el) => el.tagName === 'SPAN');
    expect(etiquetas).toHaveLength(1);
    expect(screen.getByText('Sem nível')).toBeInTheDocument();
  });

  it('filtra a lista por nível', () => {
    renderView([
      aluno({ level: 'iniciante' }),
      aluno({ id: 'std-2', name: 'Bruno Lima', level: 'avancado' }),
    ]);
    expect(screen.getByText('Bruno Lima')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/filtrar por nível/i), { target: { value: 'iniciante' } });
    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    expect(screen.queryByText('Bruno Lima')).not.toBeInTheDocument();
  });

  it('o professor troca o nível direto no card', () => {
    const { onUpdateStudent } = renderView([aluno({ level: 'iniciante' })]);
    fireEvent.change(screen.getByLabelText(/^nível:$/i), { target: { value: 'intermediario' } });
    expect(onUpdateStudent).toHaveBeenCalledWith('std-1', { level: 'intermediario' });
  });

  it('dá para voltar o aluno para "não definido"', () => {
    const { onUpdateStudent } = renderView([aluno({ level: 'avancado' })]);
    fireEvent.change(screen.getByLabelText(/^nível:$/i), { target: { value: '' } });
    expect(onUpdateStudent).toHaveBeenCalledWith('std-1', { level: undefined });
  });

  it('o cadastro novo já nasce com nível', () => {
    const { onAddStudent } = renderView([]);
    fireEvent.click(screen.getByRole('button', { name: /cadastrar aluno/i }));

    fireEvent.change(screen.getByPlaceholderText(/lucas fernandes/i), { target: { value: 'Carla Dias' } });
    fireEvent.change(screen.getByLabelText(/nível do aluno/i), { target: { value: 'avancado' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar aluno/i }));

    expect(onAddStudent).toHaveBeenCalledTimes(1);
    expect(onAddStudent.mock.calls[0][0]).toMatchObject({ name: 'Carla Dias', level: 'avancado' });
  });
});
