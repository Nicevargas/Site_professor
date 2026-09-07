import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SafeImage } from './SafeImage';

/**
 * O bug que estes testes travam: <img src={undefined}> faz o React omitir o
 * atributo, e o navegador desenha o ícone de imagem quebrada. Apareceu na
 * vitrine de um professor sem foto de capa -- e perfil criado pelo convite
 * nasce SEM imagem nenhuma, então esse é o caso comum, não a exceção.
 */
describe('imagem que não quebra', () => {
  it('sem src, não renderiza <img> nenhuma', () => {
    const { container } = render(<SafeImage src={undefined} alt="Prof. Roberto Almeida" />);
    expect(container.querySelector('img')).toBeNull();
  });

  it('string vazia e espaços em branco contam como sem imagem', () => {
    const vazia = render(<SafeImage src="" alt="Ana" />);
    expect(vazia.container.querySelector('img')).toBeNull();

    const espacos = render(<SafeImage src="   " alt="Ana" />);
    expect(espacos.container.querySelector('img')).toBeNull();
  });

  it('o substituto continua legível para leitor de tela', () => {
    render(<SafeImage src={null} alt="Prof. Roberto Almeida" />);
    expect(screen.getByRole('img', { name: 'Prof. Roberto Almeida' })).toBeInTheDocument();
  });

  it('as iniciais ignoram o título do professor', () => {
    render(<SafeImage src="" alt="Prof. Roberto Almeida" />);
    expect(screen.getByText('RA')).toBeInTheDocument();
  });

  it('nome de uma palavra só usa a primeira letra', () => {
    render(<SafeImage src="" alt="Mariana" />);
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('com src válido, renderiza a imagem de verdade', () => {
    const { container } = render(<SafeImage src="https://exemplo.com/foto.jpg" alt="Ana" />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('src', 'https://exemplo.com/foto.jpg');
  });

  it('imagem que falha ao carregar vira o substituto, e não fica quebrada', () => {
    const { container } = render(<SafeImage src="https://exemplo.com/some.jpg" alt="Ana Souza" />);
    fireEvent.error(container.querySelector('img')!);

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('AS')).toBeInTheDocument();
  });

  it('aceita um substituto próprio no lugar das iniciais', () => {
    render(<SafeImage src="" alt="Capa" fallback={<span>Sem capa</span>} />);
    expect(screen.getByText('Sem capa')).toBeInTheDocument();
  });

  it('o substituto ocupa o mesmo espaço da imagem, para o layout não pular', () => {
    const { container } = render(
      <SafeImage src="" alt="Ana" className="w-10 h-10 rounded-full" />
    );
    const box = container.firstElementChild as HTMLElement;
    expect(box.className).toContain('w-10');
    expect(box.className).toContain('h-10');
    expect(box.className).toContain('rounded-full');
  });
});
