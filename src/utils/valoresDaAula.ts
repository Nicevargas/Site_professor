/**
 * Dia da semana e valor de uma aula, como vão para o banco e voltam dele.
 *
 * O código usava `valor || padrão`. Em JavaScript o número 0 conta como
 * vazio, então domingo (0) virava segunda (1) e aula gratuita (R$ 0) virava
 * R$ 150 -- na gravação e de novo na leitura. Aqui 0 é um valor de verdade.
 */

const DATA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 0 = domingo ... 6 = sábado.
 *
 * A data manda: o dia da semana é consequência dela, e calcular pela data
 * também acerta aulas antigas cujo dia gravado não bate. Sem data válida,
 * vale o dia informado (0 incluso). Sem nenhum dos dois, segunda, como antes.
 */
export function diaDaSemanaDaAula(date: unknown, dayOfWeek?: unknown): number {
  if (typeof date === 'string' && DATA.test(date)) {
    // "T00:00:00" evita que o fuso horário volte a data um dia
    const dia = new Date(`${date}T00:00:00`).getDay();
    if (!Number.isNaN(dia)) return dia;
  }
  if (dayOfWeek !== null && dayOfWeek !== undefined && dayOfWeek !== '') {
    const n = Number(dayOfWeek);
    if (Number.isInteger(n) && n >= 0 && n <= 6) return n;
  }
  return 1;
}

export const VALOR_PADRAO_DA_AULA = 150;

/** R$ 0 é aula gratuita e fica 0. Só valor ausente ou inválido usa o padrão. */
export function valorDaAula(price: unknown): number {
  if (price === null || price === undefined || price === '') return VALOR_PADRAO_DA_AULA;
  const n = Number(price);
  return Number.isFinite(n) && n >= 0 ? n : VALOR_PADRAO_DA_AULA;
}
