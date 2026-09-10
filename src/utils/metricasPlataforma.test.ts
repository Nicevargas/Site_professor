import { describe, it, expect } from 'vitest';
import {
  contarPorPapel, funilDeAtivacao, maiorQueda, perfisIncompletos, preenchimentoDosPerfis,
  ConteudoDoProfessor,
} from './metricasPlataforma';
import { PERFIL_EM_BRANCO } from './perfilEmBranco';
import { Student, SystemUser, TeacherProfile, UserRole } from '../types';

const vazio: ConteudoDoProfessor = {
  services: [], videos: [], photos: [], testimonials: [], curriculum: [], faqs: [],
};

const prof = (over: Partial<TeacherProfile>): TeacherProfile => ({ ...PERFIL_EM_BRANCO, ...over });

const usuario = (role: UserRole, status: SystemUser['status'] = 'ativo'): SystemUser => ({
  id: `u-${Math.random()}`, name: 'x', email: 'x@x', role, status, createdAt: '',
});

describe('cadastros por perfil', () => {
  it('conta cada papel e separa quem está ativo', () => {
    const contagem = contarPorPapel([
      usuario('professor'), usuario('professor'), usuario('professor', 'inativo'),
      usuario('aluno'), usuario('admin'),
    ]);
    const professores = contagem.find((c) => c.papel === 'professor')!;
    expect(professores.total).toBe(3);
    expect(professores.ativos).toBe(2);
    expect(contagem.find((c) => c.papel === 'aluno')!.total).toBe(1);
  });

  it('papel sem ninguém aparece zerado, não some da lista', () => {
    // Um zero explícito informa; a ausência da linha só levanta dúvida
    const contagem = contarPorPapel([usuario('admin')]);
    expect(contagem).toHaveLength(5);
    expect(contagem.find((c) => c.papel === 'gestor')!.total).toBe(0);
  });
});

describe('preenchimento dos perfis', () => {
  it('ordena do mais esquecido para o mais feito', () => {
    const professores = [
      prof({ id: 'a', name: 'Ana', specialty: 'Natação' }),
      prof({ id: 'b', name: 'Bia' }),
    ];
    const itens = preenchimentoDosPerfis(professores, vazio);

    // O topo é onde as pessoas travam -- é isso que se quer ver ao abrir
    expect(itens[0].percentual).toBeLessThanOrEqual(itens[itens.length - 1].percentual);
    expect(itens.find((i) => i.id === 'nome')!.percentual).toBe(100);
    expect(itens.find((i) => i.id === 'especialidade')!.percentual).toBe(50);
    expect(itens.find((i) => i.id === 'bio')!.percentual).toBe(0);
  });

  it('WhatsApp com máscara conta como preenchido; vazio, não', () => {
    const itens = preenchimentoDosPerfis(
      [prof({ id: 'a', whatsapp: '(11) 98888-7777' }), prof({ id: 'b', whatsapp: '' })],
      vazio
    );
    expect(itens.find((i) => i.id === 'whatsapp')!.preenchidos).toBe(1);
  });

  it('sem professor nenhum não divide por zero', () => {
    const itens = preenchimentoDosPerfis([], vazio);
    expect(itens.every((i) => i.percentual === 0 && i.total === 0)).toBe(true);
  });
});

describe('quem precisa de ajuda', () => {
  it('lista o menos completo primeiro, com o que falta', () => {
    const professores = [
      prof({ id: 'a', name: 'Ana', specialty: 'x', bio: 'y', avatarUrl: 'z' }),
      prof({ id: 'b', name: 'Bia' }),
    ];
    const perfis = perfisIncompletos(professores, vazio);
    expect(perfis[0].nome).toBe('Bia');
    expect(perfis[0].faltando).toContain('Apresentação');
    expect(perfis[1].faltando).not.toContain('Apresentação');
  });

  it('professor sem nome não vira linha em branco na tabela', () => {
    expect(perfisIncompletos([prof({ id: 'a' })], vazio)[0].nome).toBe('(sem nome)');
  });
});

describe('onde as pessoas param', () => {
  const aluno = (teacherId: string): Student =>
    ({ id: 's1', teacherId, name: 'Aluno' } as Student);

  it('cada degrau conta só quem passou pelo anterior', () => {
    const professores = [
      prof({ id: 'a', name: 'A', specialty: 'x', avatarUrl: 'img' }),
      prof({ id: 'b', name: 'B', specialty: 'x' }),
      prof({ id: 'c', name: 'C' }),
    ];
    const degraus = funilDeAtivacao(professores, vazio, []);

    expect(degraus[0].quantos).toBe(3);  // criaram a conta
    expect(degraus[1].quantos).toBe(2);  // escreveram sobre si
    expect(degraus[2].quantos).toBe(1);  // puseram imagem
    expect(degraus[3].quantos).toBe(0);  // nenhum serviço cadastrado
  });

  it('aponta o degrau da maior queda, não o menor número', () => {
    const professores = [
      prof({ id: 'a', name: 'A', specialty: 'x', avatarUrl: 'i' }),
      prof({ id: 'b', name: 'B', specialty: 'x', avatarUrl: 'i' }),
      prof({ id: 'c', name: 'C' }),
    ];
    const degraus = funilDeAtivacao(professores, vazio, [aluno('a')]);
    const pior = maiorQueda(degraus);

    // "Cadastraram uma aula" perde 100% de quem chegou; é onde travam
    expect(pior?.rotulo).toBe('Cadastraram uma aula');
  });

  it('sem ninguém cadastrado não inventa um culpado', () => {
    expect(maiorQueda(funilDeAtivacao([], vazio, []))).toBeNull();
  });
});

describe('aviso da maior perda', () => {
  it('funil sem perda nenhuma não aponta culpado', () => {
    // Todos passaram por tudo: avisar "a maior perda é aqui: 2 de 2
    // passaram" é alarme sobre uma coisa que deu certo
    const completo = prof({
      id: 'a', name: 'A', specialty: 'x', bio: 'y', avatarUrl: 'i',
    });
    const conteudo: ConteudoDoProfessor = {
      ...vazio,
      services: [{ id: 's', name: 'Aula', active: true, teacherId: 'a' } as never],
    };
    const degraus = funilDeAtivacao([completo], conteudo, [{ id: 'x', teacherId: 'a' } as Student]);
    expect(degraus.every((d) => d.quantos === d.base)).toBe(true);
    expect(maiorQueda(degraus)).toBeNull();
  });
});
