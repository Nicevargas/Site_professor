/**
 * O link do WhatsApp, montado de um jeito só.
 *
 * A vitrine montava `https://wa.me/${teacher.whatsapp}` cru, em cinco lugares
 * diferentes. Número guardado com máscara -- "(11) 98888-7777" -- virava um
 * endereço quebrado; número vazio virava `https://wa.me/`, que abre o
 * WhatsApp sem destinatário e parece que o botão não funciona.
 *
 * O DDI é assumido como 55 quando não vem. Todo cadastro até aqui é
 * brasileiro, e um número sem DDI é um link que não abre conversa nenhuma --
 * então chutar 55 acerta quase sempre e erra menos que não chutar.
 */

/** Só os dígitos, já com o DDI. Vazio quando não há número utilizável. */
export function normalizarWhatsapp(bruto: string | null | undefined): string {
  const digitos = (bruto || '').replace(/\D/g, '');
  if (!digitos) return '';

  // Curto demais para ser telefone: 8 dígitos é o fixo antigo, sem DDD
  if (digitos.length < 10) return '';

  if (digitos.startsWith('55')) {
    // 55 + DDD + número: 12 ou 13 dígitos. Mais que isso não é telefone.
    return digitos.length <= 13 ? digitos : '';
  }

  // DDD + número, sem DDI
  return digitos.length <= 11 ? `55${digitos}` : '';
}

/** Tem número que dá para conversar? */
export function temWhatsapp(bruto: string | null | undefined): boolean {
  return normalizarWhatsapp(bruto).length > 0;
}

/**
 * O endereço da conversa, ou null quando não há número.
 *
 * Devolver null é de propósito: quem chama precisa ESCONDER o botão, não
 * exibi-lo apontando para lugar nenhum. Botão que abre uma conversa vazia é
 * pior que a ausência dele -- o visitante acha que falou com o professor.
 */
export function linkWhatsapp(
  bruto: string | null | undefined,
  mensagem?: string
): string | null {
  const numero = normalizarWhatsapp(bruto);
  if (!numero) return null;
  const texto = mensagem?.trim() ? `?text=${encodeURIComponent(mensagem)}` : '';
  return `https://wa.me/${numero}${texto}`;
}
