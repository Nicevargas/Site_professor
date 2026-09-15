/**
 * Regras do fluxo "descobrir o ID do grupo do WhatsApp".
 *
 * Mesma ideia de novidade.mjs: gerar-fluxo.mjs copia estas funções para o nó
 * de código do n8n, e grupos.teste.mjs testa exatamente este código.
 *
 * Campos conferidos no código da Evolution API (fetchAllGroups): id, subject,
 * size, announce, isCommunity.
 */

/** Para buscar "aquagenda" e achar "Professores Aquágenda". */
function semAcento(texto) {
  return String(texto || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/**
 * Tabela simples dos grupos: nome, ID, participantes e quem pode enviar.
 * `busca` filtra pelo nome, sem ligar para maiúscula ou acento.
 * Aceita a resposta da Evolution como lista ou item a item (como o n8n entrega).
 */
export function listarGrupos(respostas, busca) {
  const grupos = (Array.isArray(respostas) ? respostas : [respostas])
    // O nó da Evolution no n8n entrega { success: true, data: [grupos] }
    .flatMap((r) => (r && !Array.isArray(r) && Array.isArray(r.data) ? r.data : [r]))
    .flatMap((r) => (Array.isArray(r) ? r : [r]))
    .filter((g) => g && typeof g.id === 'string' && g.id.endsWith('@g.us'));

  const termo = semAcento(busca).trim();
  return grupos
    .filter((g) => !termo || semAcento(g.subject).includes(termo))
    .map((g) => ({
      grupo: g.subject || '(sem nome)',
      id: g.id,
      participantes: typeof g.size === 'number' ? g.size : null,
      quemPodeEnviar: g.announce ? 'só administradores' : 'todos',
      comunidade: g.isCommunity ? 'sim' : 'não',
    }))
    .sort((a, b) => a.grupo.localeCompare(b.grupo, 'pt-BR'));
}
