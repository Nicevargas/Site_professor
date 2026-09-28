import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Share2 } from 'lucide-react';

/**
 * QR Code de um Pix Copia e Cola, gerado no próprio navegador.
 *
 * O QR é só outro jeito de escrever o mesmo código: o banco lê a imagem e
 * chega exatamente ao texto do Copia e Cola. Por isso serve tanto para o
 * Pix do Mercado Pago (que dá baixa sozinho) quanto para o feito com a
 * chave do professor.
 */
export async function imagemDoPix(codigo: string): Promise<string> {
  return QRCode.toDataURL(codigo, { errorCorrectionLevel: 'M', margin: 2, width: 480 });
}

interface PixQrCodeProps {
  codigo: string;
  /** Texto que acompanha a imagem ao compartilhar. */
  legenda?: string;
  /** Nome do arquivo ao baixar, sem extensão. */
  nomeArquivo?: string;
  /** Mostra os botões de compartilhar e baixar (tela do professor). */
  comAcoes?: boolean;
  tamanho?: number;
}

export const PixQrCode: React.FC<PixQrCodeProps> = ({
  codigo,
  legenda,
  nomeArquivo = 'pix',
  comAcoes = false,
  tamanho = 180,
}) => {
  const [imagem, setImagem] = useState('');

  useEffect(() => {
    let ativo = true;
    imagemDoPix(codigo)
      .then((url) => ativo && setImagem(url))
      .catch(() => ativo && setImagem(''));
    return () => {
      ativo = false;
    };
  }, [codigo]);

  const baixar = () => {
    const a = document.createElement('a');
    a.href = imagem;
    a.download = `${nomeArquivo}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  /**
   * No celular, abre a lista de apps (WhatsApp incluso) já com a imagem.
   * Onde o navegador não sabe compartilhar arquivo (quase todo computador),
   * baixa a imagem para o professor anexar.
   */
  const compartilhar = async () => {
    try {
      const blob = await (await fetch(imagem)).blob();
      const arquivo = new File([blob], `${nomeArquivo}.png`, { type: 'image/png' });
      const dados: ShareData = { files: [arquivo], ...(legenda ? { text: legenda } : {}) };
      if (navigator.canShare?.(dados)) {
        await navigator.share(dados);
        return;
      }
    } catch (err) {
      // Quem fecha a lista de apps cancela o compartilhamento: não é erro
      if ((err as Error)?.name === 'AbortError') return;
    }
    baixar();
  };

  if (!imagem) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <img
        src={imagem}
        alt="QR Code do Pix"
        width={tamanho}
        height={tamanho}
        className="rounded-xl border border-slate-200 bg-white"
      />
      {comAcoes && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={compartilhar}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartilhar QR Code</span>
          </button>
          <button
            type="button"
            onClick={baixar}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar</span>
          </button>
        </div>
      )}
    </div>
  );
};
