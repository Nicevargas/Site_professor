/**
 * Só os campos que a pessoa mudou.
 *
 * As telas de edição copiam o perfil quando abrem, e o "Salvar" devolvia o
 * formulário inteiro para o banco. Se a tela abrisse com o perfil ainda
 * vazio, ou com um valor padrão no lugar de um campo em branco, o salvar
 * gravava esse vazio ou esse padrão por cima do dado real -- mesmo nos campos
 * que ninguém tocou.
 *
 * Comparando o formulário de agora com o de quando a tela abriu, o que não
 * mudou simplesmente não vai. O dado que já estava no banco fica como está.
 */

const igual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  // Objetos (como o modo férias) comparam pelo conteúdo, não pela referência:
  // o formulário remonta o objeto a cada render
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return false;
};

export function camposAlterados<T extends object>(inicial: T, atual: T): Partial<T> {
  const mudou: Partial<T> = {};
  for (const chave of Object.keys(atual) as (keyof T)[]) {
    if (!igual(inicial[chave], atual[chave])) {
      mudou[chave] = atual[chave];
    }
  }
  return mudou;
}
