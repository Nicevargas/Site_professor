import { AuthUser, TeacherProfile } from '../types';

/**
 * Qual professor pertence a quem está logado.
 *
 * Existe porque a escolha era feita no olho: o app pegava
 * `dbTeachers[0]` quando não reconhecia ninguém -- o primeiro da lista, que
 * é outra pessoa. O professor abria "Meu site" e via a marca, as cores e o
 * texto de um colega; ao salvar, o banco recusava por permissão, e a
 * mensagem de erro era a única pista de que algo estava trocado.
 *
 * A ordem de busca vai do mais confiável para o menos:
 *
 * 1. `teacherId` -- o vínculo explícito gravado em system_users. É o que o
 *    banco usa para decidir permissão, então é o que a tela deve usar também.
 * 2. `id` -- contas antigas, criadas quando usuário e professor eram a mesma
 *    linha.
 * 3. `email` -- último recurso, para quem tem cadastro mas perdeu o vínculo.
 *
 * Devolver null é uma resposta legítima: significa "este login não está
 * ligado a nenhum professor". Melhor uma tela vazia dizendo isso do que a
 * vitrine de outra pessoa parecendo a sua.
 */
export function professorDoUsuario(
  user: AuthUser | null | undefined,
  teachers: TeacherProfile[]
): TeacherProfile | null {
  if (!user || !teachers.length) return null;

  if (user.teacherId) {
    const porVinculo = teachers.find((t) => t.id === user.teacherId);
    if (porVinculo) return porVinculo;
  }

  const porId = teachers.find((t) => t.id === user.id);
  if (porId) return porId;

  const email = (user.email || '').trim().toLowerCase();
  if (email) {
    const porEmail = teachers.find((t) => (t.email || '').trim().toLowerCase() === email);
    if (porEmail) return porEmail;
  }

  return null;
}

/**
 * Quem pode olhar a conta de outro professor sem que isso seja engano.
 *
 * Só o admin da plataforma e o gestor da academia. Para professor,
 * secretaria e aluno, cair no perfil de outra pessoa nunca é o certo.
 */
export function podeVerOutroProfessor(user: AuthUser | null | undefined): boolean {
  return user?.role === 'admin' || user?.role === 'gestor';
}
