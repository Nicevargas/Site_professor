import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsView } from './SettingsView';
import { PERFIL_EM_BRANCO } from '../utils/perfilEmBranco';
import { TeacherProfile } from '../types';

/**
 * "Meu Perfil" não pode alterar o que ninguém mexeu.
 *
 * O salvar mandava o formulário inteiro. Um campo que a tela preenchia
 * sozinha -- como a logo padrão -- ia para o banco como se fosse escolha do
 * professor, e um perfil copiado vazio apagava os dados reais.
 */
const professora: TeacherProfile = {
  ...PERFIL_EM_BRANCO,
  id: 'prof-ana',
  name: 'Ana Lima',
  email: 'ana@exemplo.com',
  whatsapp: '11988887777',
  specialty: 'Natação',
  bio: 'Apresentação que ela mesma escreveu.',
  avatarUrl: 'https://exemplo.com/ana.jpg',
  // sem logo, de propósito
};

const campoApresentacao = () => screen.getByPlaceholderText(/conte em poucas linhas/i);

describe('salvar "Meu Perfil"', () => {
  it('manda só o campo alterado e mantém o resto como está no banco', () => {
    const onUpdateTeacher = vi.fn();
    render(<SettingsView currentTeacher={professora} onUpdateTeacher={onUpdateTeacher} />);

    fireEvent.change(campoApresentacao(), { target: { value: 'Texto novo.' } });
    fireEvent.submit(campoApresentacao().closest('form')!);

    expect(onUpdateTeacher).toHaveBeenCalledTimes(1);
    const salvo: TeacherProfile = onUpdateTeacher.mock.calls[0][0];
    expect(salvo.bio).toBe('Texto novo.');
    expect(salvo.name).toBe('Ana Lima');
    expect(salvo.whatsapp).toBe('11988887777');
    expect(salvo.avatarUrl).toBe('https://exemplo.com/ana.jpg');
  });

  it('não grava a logo padrão em quem nunca escolheu uma', () => {
    const onUpdateTeacher = vi.fn();
    render(<SettingsView currentTeacher={professora} onUpdateTeacher={onUpdateTeacher} />);

    fireEvent.change(campoApresentacao(), { target: { value: 'Outro texto.' } });
    fireEvent.submit(campoApresentacao().closest('form')!);

    const salvo: TeacherProfile = onUpdateTeacher.mock.calls[0][0];
    expect(salvo.logoUrl).toBeUndefined();
  });

  it('salvar sem mudar nada não grava', () => {
    const onUpdateTeacher = vi.fn();
    render(<SettingsView currentTeacher={professora} onUpdateTeacher={onUpdateTeacher} />);

    fireEvent.submit(campoApresentacao().closest('form')!);

    expect(onUpdateTeacher).not.toHaveBeenCalled();
  });

  it('mudar e voltar ao original depois de salvar ainda grava a volta', () => {
    // A comparação parte do último salvo, não da abertura da tela
    const onUpdateTeacher = vi.fn();
    render(<SettingsView currentTeacher={professora} onUpdateTeacher={onUpdateTeacher} />);
    const form = () => campoApresentacao().closest('form')!;

    fireEvent.change(campoApresentacao(), { target: { value: 'Versão 2.' } });
    fireEvent.submit(form());
    fireEvent.change(campoApresentacao(), { target: { value: professora.bio } });
    fireEvent.submit(form());

    expect(onUpdateTeacher).toHaveBeenCalledTimes(2);
    expect(onUpdateTeacher.mock.calls[1][0].bio).toBe(professora.bio);
  });
});
