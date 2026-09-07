import React, { useEffect, useState } from 'react';

interface SafeImageProps {
  /** Pode vir vazio: perfil recém-criado não tem foto nem capa */
  src?: string | null;
  alt: string;
  className?: string;
  /** Mostrado no lugar da imagem quando não há src ou o carregamento falha */
  fallback?: React.ReactNode;
  /** Sem fallback próprio, usa as iniciais deste nome */
  fallbackName?: string;
  style?: React.CSSProperties;
}

/**
 * Imagem que não quebra.
 *
 * Passar src={undefined} para um <img> faz o React omitir o atributo, e o
 * navegador desenha o ícone de imagem quebrada -- foi exatamente o que
 * apareceu na vitrine de um professor sem foto de capa. Perfil criado pelo
 * convite nasce sem imagem nenhuma, então este caso é o normal, não a
 * exceção.
 *
 * Aqui, sem src (ou com src que falhou), nada de <img>: entra um substituto
 * desenhado, que ocupa o mesmo espaço e não parece defeito.
 */
export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallback,
  fallbackName,
  style,
}) => {
  const limpo = (src || '').trim();
  const [falhou, setFalhou] = useState(false);

  // Trocar de professor precisa dar nova chance à imagem do próximo
  useEffect(() => { setFalhou(false); }, [limpo]);

  if (!limpo || falhou) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-slate-400 ${className}`}
        style={style}
        role="img"
        aria-label={alt}
      >
        {fallback ?? <span className="font-bold">{initials(fallbackName || alt)}</span>}
      </div>
    );
  }

  return (
    <img
      src={limpo}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
      style={style}
      onError={() => setFalhou(true)}
    />
  );
};

/** "Prof. Roberto Almeida" vira "RA". */
function initials(name: string): string {
  const partes = (name || '')
    .trim()
    .split(/\s+/)
    .filter((p) => !/^(prof|profa|dr|dra|sr|sra)\.?$/i.test(p));
  const escolhidas = partes.length >= 2 ? [partes[0], partes[partes.length - 1]] : partes;
  return escolhidas.map((p) => p[0] || '').join('').slice(0, 2).toUpperCase() || '?';
}
