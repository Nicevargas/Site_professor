import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import { PixQrCode, imagemDoPix } from './PixQrCode';
import { gerarPixCopiaECola } from '../utils/pix';

const codigo = gerarPixCopiaECola({ chave: 'ana@pix.com', tipo: 'email', recebedor: 'Ana', valor: 1 });

/** Lê o QR de volta, como faria a câmera do banco. */
function lerQr(dataUrl: string): string | undefined {
  const png = PNG.sync.read(Buffer.from(dataUrl.split(',')[1], 'base64'));
  return jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data;
}

describe('QR Code do Pix', () => {
  afterEach(() => vi.restoreAllMocks());

  it('o QR lido pela câmera devolve exatamente o Pix Copia e Cola', async () => {
    expect(lerQr(await imagemDoPix(codigo))).toBe(codigo);
  });

  it('mostra a imagem; botões só na tela do professor', async () => {
    const { rerender } = render(<PixQrCode codigo={codigo} />);
    expect(await screen.findByAltText('QR Code do Pix')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /compartilhar/i })).not.toBeInTheDocument();

    rerender(<PixQrCode codigo={codigo} comAcoes />);
    expect(screen.getByRole('button', { name: /compartilhar qr code/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /baixar/i })).toBeInTheDocument();
  });

  it('onde o navegador não compartilha arquivo, compartilhar baixa a imagem', async () => {
    Object.assign(navigator, { canShare: undefined });
    const clique = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<PixQrCode codigo={codigo} comAcoes nomeArquivo="pix-teste" />);
    fireEvent.click(await screen.findByRole('button', { name: /compartilhar qr code/i }));
    await waitFor(() => expect(clique).toHaveBeenCalled());
    expect((clique.mock.instances[0] as unknown as HTMLAnchorElement).download).toBe('pix-teste.png');
  });
});
