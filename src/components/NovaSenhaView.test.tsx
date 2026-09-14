import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NovaSenhaView } from './NovaSenhaView';

function montar(onSalvar = vi.fn().mockResolvedValue(null)) {
  const onConcluido = vi.fn();
  const onCancelar = vi.fn();
  render(<NovaSenhaView onSalvar={onSalvar} onConcluido={onConcluido} onCancelar={onCancelar} />);
  const digitar = (senha: string, confirmacao = senha) => {
    fireEvent.change(screen.getByLabelText('Senha nova'), { target: { value: senha } });
    fireEvent.change(screen.getByLabelText('Repita a senha nova'), { target: { value: confirmacao } });
    fireEvent.click(screen.getByRole('button', { name: /salvar senha nova/i }));
  };
  return { onSalvar, onConcluido, onCancelar, digitar };
}

describe('tela "Crie sua nova senha"', () => {
  it('senha curta não é enviada', async () => {
    const { onSalvar, digitar } = montar();
    digitar('curta1');
    expect(await screen.findByRole('alert')).toHaveTextContent(/pelo menos 8 caracteres/i);
    expect(onSalvar).not.toHaveBeenCalled();
  });

  it('as duas senhas precisam ser iguais', async () => {
    const { onSalvar, digitar } = montar();
    digitar('senhaNova123', 'senhaNova124');
    expect(await screen.findByRole('alert')).toHaveTextContent(/não são iguais/i);
    expect(onSalvar).not.toHaveBeenCalled();
  });

  it('só depois de gravar a pessoa pode entrar', async () => {
    const { onSalvar, onConcluido, digitar } = montar();
    digitar('senhaNova123');
    expect(onSalvar).toHaveBeenCalledWith('senhaNova123');
    // Antes de gravar, não havia botão de entrar
    fireEvent.click(await screen.findByRole('button', { name: /entrar no sistema/i }));
    expect(onConcluido).toHaveBeenCalledTimes(1);
  });

  it('erro do servidor aparece e a pessoa continua na tela', async () => {
    const { onConcluido, digitar } = montar(vi.fn().mockResolvedValue('A senha nova precisa ser diferente da senha atual.'));
    digitar('senhaNova123');
    expect(await screen.findByRole('alert')).toHaveTextContent(/diferente da senha atual/i);
    expect(screen.getByRole('heading', { name: /crie sua nova senha/i })).toBeInTheDocument();
    expect(onConcluido).not.toHaveBeenCalled();
  });

  it('cancelar avisa quem encerra a sessão do link', () => {
    const { onCancelar } = montar();
    fireEvent.click(screen.getByRole('button', { name: /cancelar e voltar/i }));
    expect(onCancelar).toHaveBeenCalledTimes(1);
  });
});
