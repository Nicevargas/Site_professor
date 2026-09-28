import { TeacherProfile } from '../types';

/**
 * Pix Copia e Cola (BR Code estático), no padrão do Banco Central.
 *
 * Antes o app montava o código à mão, com tamanhos de campo fixos e o
 * código de verificação escrito "XYZ" -- nenhum banco aceitava colar aquilo.
 * Aqui cada campo leva o próprio tamanho, e o final (campo 63) é o CRC16
 * calculado de verdade.
 */

type TipoChave = TeacherProfile['pixKeyType'];

/** Campo EMV: id de 2 dígitos + tamanho de 2 dígitos + valor. */
function campo(id: string, valor: string): string {
  return `${id}${String(valor.length).padStart(2, '0')}${valor}`;
}

/** CRC16-CCITT (polinômio 0x1021, início 0xFFFF), como pede o manual do BR Code. */
export function crc16(texto: string): string {
  let crc = 0xffff;
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Sem acento e só com caracteres que todo banco aceita no nome e na cidade. */
function textoSimples(texto: string, max: number): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 .-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/**
 * A chave como o Pix a registra.
 *
 * Celular é o caso que mais falha: o professor digita "(11) 98888-7777" e o
 * Pix só conhece "+5511988887777".
 */
export function normalizarChavePix(chave: string, tipo?: TipoChave): string {
  const limpa = chave.trim();
  const digitos = limpa.replace(/\D/g, '');

  if (tipo === 'cpf' || tipo === 'cnpj') return digitos;
  if (tipo === 'email' || (!tipo && limpa.includes('@'))) return limpa.toLowerCase();
  if (tipo === 'phone') {
    if (limpa.startsWith('+')) return `+${digitos}`;
    return digitos.startsWith('55') && digitos.length >= 12 ? `+${digitos}` : `+55${digitos}`;
  }
  return limpa;
}

export interface DadosPix {
  chave: string;
  tipo?: TipoChave;
  recebedor: string;
  cidade?: string;
  valor?: number;
  /** Identificador que aparece no extrato. Sem ele, "***". */
  identificador?: string;
}

export function gerarPixCopiaECola(dados: DadosPix): string {
  const chave = normalizarChavePix(dados.chave, dados.tipo);
  const contaDoRecebedor = campo('00', 'br.gov.bcb.pix') + campo('01', chave);
  const identificador =
    (dados.identificador || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***';

  let codigo =
    campo('00', '01') +
    campo('26', contaDoRecebedor) +
    campo('52', '0000') +
    campo('53', '986') +
    (dados.valor && dados.valor > 0 ? campo('54', dados.valor.toFixed(2)) : '') +
    campo('58', 'BR') +
    campo('59', textoSimples(dados.recebedor, 25) || 'RECEBEDOR') +
    campo('60', textoSimples(dados.cidade || 'BRASIL', 15) || 'BRASIL') +
    campo('62', campo('05', identificador));

  codigo += '6304';
  return codigo + crc16(codigo);
}

/**
 * O Pix Copia e Cola de uma cobrança do professor, ou vazio se ele não
 * cadastrou chave. Nunca inventa chave a partir do e-mail de login: o
 * aluno pagaria para uma chave que talvez nem exista.
 */
export function pixDaCobranca(
  professor: Pick<TeacherProfile, 'pixKey' | 'pixKeyType' | 'pixReceiverName' | 'name'>,
  valor: number,
  cobrancaId?: string
): string {
  if (!professor.pixKey?.trim()) return '';
  return gerarPixCopiaECola({
    chave: professor.pixKey,
    tipo: professor.pixKeyType,
    recebedor: professor.pixReceiverName || professor.name,
    valor,
    identificador: cobrancaId,
  });
}
