import { describe, it, expect } from 'vitest';
import { podeVerOutroProfessor, professorDoUsuario } from './professorDoUsuario';
import { AuthUser, TeacherProfile } from '../types';
import { PERFIL_EM_BRANCO } from './perfilEmBranco';

const prof = (over: Partial<TeacherProfile>): TeacherProfile => ({
  ...PERFIL_EM_BRANCO,
  ...over,
});

const lista = [
  prof({ id: 't-aquagenda', name: 'Aquagenda', email: 'contato@aquagenda.com' }),
  prof({ id: 't-renato', name: 'Renato Simon', email: 'natacaocriativa@gmail.com' }),
  prof({ id: 't-eunice', name: 'Eunice', email: 'eunice@exemplo.com' }),
];

const user = (over: Partial<AuthUser>): AuthUser => ({
  id: 'u-1',
  email: 'natacaocriativa@gmail.com',
  role: 'professor',
  ...over,
});

describe('qual professor é do usuário logado', () => {
  it('o vínculo explícito manda, mesmo com e-mail de outro', () => {
    // teacher_id é o que o banco usa para decidir permissão; a tela precisa
    // usar o mesmo, senão mostra um e grava noutro
    const achado = professorDoUsuario(
      user({ teacherId: 't-eunice', email: 'natacaocriativa@gmail.com' }),
      lista
    );
    expect(achado?.id).toBe('t-eunice');
  });

  it('sem vínculo, casa pelo id: contas antigas eram uma linha só', () => {
    expect(professorDoUsuario(user({ id: 't-renato' }), lista)?.id).toBe('t-renato');
  });

  it('em último caso, pelo e-mail', () => {
    expect(professorDoUsuario(user({}), lista)?.id).toBe('t-renato');
  });

  it('e-mail compara sem depender de maiúscula ou espaço', () => {
    expect(professorDoUsuario(user({ email: '  NatacaoCriativa@Gmail.com ' }), lista)?.id)
      .toBe('t-renato');
  });

  it('vínculo apontando para professor que não existe cai para a próxima regra', () => {
    expect(professorDoUsuario(user({ teacherId: 't-apagado' }), lista)?.id).toBe('t-renato');
  });

  it('NUNCA devolve o primeiro da lista por desencargo', () => {
    // Era exatamente isto que fazia o professor ver a marca de um colega
    const semVinculo = professorDoUsuario(user({ id: 'u-x', email: 'ninguem@exemplo.com' }), lista);
    expect(semVinculo).toBeNull();
    expect(semVinculo).not.toBe(lista[0]);
  });

  it('visitante e lista vazia não têm professor', () => {
    expect(professorDoUsuario(null, lista)).toBeNull();
    expect(professorDoUsuario(user({}), [])).toBeNull();
  });
});

describe('quem pode olhar o perfil de outro professor', () => {
  it('só admin da plataforma e gestor da academia', () => {
    expect(podeVerOutroProfessor(user({ role: 'admin' }))).toBe(true);
    expect(podeVerOutroProfessor(user({ role: 'gestor' }))).toBe(true);
  });

  it('professor, secretaria e aluno nunca: para eles isso é sempre engano', () => {
    expect(podeVerOutroProfessor(user({ role: 'professor' }))).toBe(false);
    expect(podeVerOutroProfessor(user({ role: 'assistente' }))).toBe(false);
    expect(podeVerOutroProfessor(user({ role: 'aluno' }))).toBe(false);
    expect(podeVerOutroProfessor(null)).toBe(false);
  });
});
