import {
  CurriculumItem, FaqItem, PhotoItem, ServiceItem, Student, SystemUser,
  TeacherProfile, TestimonialItem, UserRole, VideoItem,
} from '../types';
import { temWhatsapp } from './whatsappLink';

/**
 * O que a plataforma está fazendo, para quem administra.
 *
 * Existe porque os problemas dos professores só apareciam por tropeço: o
 * WhatsApp vazio em todo mundo, o banco sem nenhum serviço cadastrado, a
 * vitrine sem foto. Cada um foi descoberto por acaso, um de cada vez.
 *
 * Aqui a pergunta é outra: em que passo as pessoas param? Um campo que 90%
 * deixou em branco não é descuido de 90% das pessoas -- é a tela pedindo
 * algo que ninguém entende, ou não sabe onde achar.
 */

export interface ContagemPorPapel {
  papel: UserRole;
  rotulo: string;
  total: number;
  ativos: number;
}

const ROTULO_PAPEL: Record<UserRole, string> = {
  admin: 'Administradores',
  gestor: 'Gestores de academia',
  professor: 'Professores',
  assistente: 'Secretaria',
  aluno: 'Alunos',
};

/** Ordem de leitura: de quem manda para quem usa. */
export const ORDEM_PAPEIS: UserRole[] = ['admin', 'gestor', 'professor', 'assistente', 'aluno'];

export function contarPorPapel(usuarios: SystemUser[]): ContagemPorPapel[] {
  return ORDEM_PAPEIS.map((papel) => {
    const doPapel = usuarios.filter((u) => u.role === papel);
    return {
      papel,
      rotulo: ROTULO_PAPEL[papel],
      total: doPapel.length,
      ativos: doPapel.filter((u) => u.status === 'ativo').length,
    };
  });
}

// ====================================================================
// Preenchimento do perfil
// ====================================================================

export interface ItemDePreenchimento {
  id: string;
  rotulo: string;
  /** Por que este campo importa, em uma frase */
  porque: string;
  preenchidos: number;
  total: number;
  /** 0 a 100 */
  percentual: number;
}

export interface ConteudoDoProfessor {
  services: ServiceItem[];
  videos: VideoItem[];
  photos: PhotoItem[];
  testimonials: TestimonialItem[];
  curriculum: CurriculumItem[];
  faqs: FaqItem[];
}

const cheio = (v: unknown): boolean => typeof v === 'string' && v.trim().length > 0;

/** Cada verificação sabe olhar um professor e dizer se aquilo está resolvido. */
const VERIFICACOES: {
  id: string;
  rotulo: string;
  porque: string;
  ok: (t: TeacherProfile, c: ConteudoDoProfessor) => boolean;
}[] = [
  {
    id: 'nome',
    rotulo: 'Nome',
    porque: 'É o título da vitrine e o nome que aparece na busca.',
    ok: (t) => cheio(t.name),
  },
  {
    id: 'especialidade',
    rotulo: 'Especialidade',
    porque: 'Diz em uma linha o que a pessoa ensina.',
    ok: (t) => cheio(t.specialty),
  },
  {
    id: 'bio',
    rotulo: 'Apresentação',
    porque: 'É o texto que convence quem chegou pela primeira vez.',
    ok: (t) => cheio(t.bio),
  },
  {
    id: 'foto',
    rotulo: 'Foto do professor',
    porque: 'Sem ela a vitrine mostra só as iniciais.',
    ok: (t) => cheio(t.avatarUrl),
  },
  {
    id: 'capa',
    rotulo: 'Imagem de capa',
    porque: 'A imagem grande da abertura do site.',
    ok: (t) => cheio(t.heroImageUrl),
  },
  {
    id: 'whatsapp',
    rotulo: 'WhatsApp',
    porque: 'Sem número válido o botão de conversa não aparece.',
    ok: (t) => temWhatsapp(t.whatsapp),
  },
  {
    id: 'endereco',
    rotulo: 'Endereço da vitrine',
    porque: 'É o link que o professor manda para os alunos.',
    ok: (t) => cheio(t.slug),
  },
  {
    id: 'servicos',
    rotulo: 'Pelo menos uma aula cadastrada',
    porque: 'Sem serviço ativo ninguém consegue agendar.',
    ok: (_t, c) => c.services.some((s) => s.active !== false),
  },
  {
    id: 'curriculo',
    rotulo: 'Currículo',
    porque: 'Formação e experiência sustentam o preço cobrado.',
    ok: (_t, c) => c.curriculum.length > 0,
  },
  {
    id: 'depoimentos',
    rotulo: 'Depoimentos',
    porque: 'Prova de quem já foi aluno.',
    ok: (_t, c) => c.testimonials.length > 0,
  },
  {
    id: 'midia',
    rotulo: 'Vídeos ou fotos',
    porque: 'Mostra a aula acontecendo, em vez de descrevê-la.',
    ok: (_t, c) => c.videos.length > 0 || c.photos.length > 0,
  },
  {
    id: 'faq',
    rotulo: 'Perguntas frequentes',
    porque: 'Responde antes de a dúvida virar desistência.',
    ok: (_t, c) => c.faqs.length > 0,
  },
];

/** Filtra o conteúdo que pertence a um professor. */
export function conteudoDoProfessor(
  teacherId: string,
  tudo: ConteudoDoProfessor
): ConteudoDoProfessor {
  const dele = <T extends { teacherId?: string }>(lista: T[]) =>
    lista.filter((i) => !i.teacherId || i.teacherId === teacherId);

  return {
    services: dele(tudo.services as (ServiceItem & { teacherId?: string })[]),
    videos: dele(tudo.videos as (VideoItem & { teacherId?: string })[]),
    photos: dele(tudo.photos as (PhotoItem & { teacherId?: string })[]),
    testimonials: dele(tudo.testimonials as (TestimonialItem & { teacherId?: string })[]),
    curriculum: dele(tudo.curriculum as (CurriculumItem & { teacherId?: string })[]),
    faqs: dele(tudo.faqs as (FaqItem & { teacherId?: string })[]),
  };
}

/**
 * Quantos professores resolveram cada item, do mais esquecido ao mais feito.
 *
 * A ordem é de propósito: o topo da lista é onde as pessoas estão travando, e
 * é isso que se quer ver ao abrir a tela.
 */
export function preenchimentoDosPerfis(
  professores: TeacherProfile[],
  tudo: ConteudoDoProfessor
): ItemDePreenchimento[] {
  const total = professores.length;

  const itens = VERIFICACOES.map((v) => {
    const preenchidos = professores.filter((t) => v.ok(t, conteudoDoProfessor(t.id, tudo))).length;
    return {
      id: v.id,
      rotulo: v.rotulo,
      porque: v.porque,
      preenchidos,
      total,
      percentual: total ? Math.round((preenchidos / total) * 100) : 0,
    };
  });

  return itens.sort((a, b) => a.percentual - b.percentual);
}

export interface PerfilDoProfessor {
  id: string;
  nome: string;
  email: string;
  /** Quantos itens resolvidos, de VERIFICACOES.length */
  resolvidos: number;
  totalItens: number;
  percentual: number;
  /** O que falta, na ordem da lista */
  faltando: string[];
}

/** Cada professor e o que falta nele, do menos completo para o mais. */
export function perfisIncompletos(
  professores: TeacherProfile[],
  tudo: ConteudoDoProfessor
): PerfilDoProfessor[] {
  return professores
    .map((t) => {
      const conteudo = conteudoDoProfessor(t.id, tudo);
      const faltando = VERIFICACOES.filter((v) => !v.ok(t, conteudo)).map((v) => v.rotulo);
      const resolvidos = VERIFICACOES.length - faltando.length;
      return {
        id: t.id,
        nome: t.name || '(sem nome)',
        email: t.email || '',
        resolvidos,
        totalItens: VERIFICACOES.length,
        percentual: Math.round((resolvidos / VERIFICACOES.length) * 100),
        faltando,
      };
    })
    .sort((a, b) => a.percentual - b.percentual);
}

// ====================================================================
// Onde as pessoas param
// ====================================================================

export interface DegrauDoFunil {
  rotulo: string;
  /** Explica o que a queda deste degrau significa */
  significa: string;
  quantos: number;
  /** Quantos chegaram ao degrau anterior */
  base: number;
}

/**
 * O caminho de um professor novo até ter uma vitrine que funciona.
 *
 * Cada degrau só conta quem passou pelo anterior. A maior queda entre dois
 * degraus é o passo onde a plataforma está perdendo gente -- e é uma
 * pergunta melhor que "quantos cadastros temos".
 */
export function funilDeAtivacao(
  professores: TeacherProfile[],
  tudo: ConteudoDoProfessor,
  alunos: Student[]
): DegrauDoFunil[] {
  const criados = professores;

  const comIdentidade = criados.filter((t) => cheio(t.specialty) || cheio(t.bio));
  const comImagem = comIdentidade.filter((t) => cheio(t.avatarUrl) || cheio(t.heroImageUrl));
  const comServico = comImagem.filter((t) =>
    conteudoDoProfessor(t.id, tudo).services.some((s) => s.active !== false)
  );
  const comAluno = comServico.filter((t) => alunos.some((a) => a.teacherId === t.id));

  return [
    {
      rotulo: 'Criaram a conta',
      significa: 'Chegaram até aqui.',
      quantos: criados.length,
      base: criados.length,
    },
    {
      rotulo: 'Escreveram sobre si',
      significa: 'Quem para aqui abriu o painel e não soube por onde começar.',
      quantos: comIdentidade.length,
      base: criados.length,
    },
    {
      rotulo: 'Puseram uma imagem',
      significa: 'Quem para aqui não achou onde trocar foto ou capa.',
      quantos: comImagem.length,
      base: comIdentidade.length,
    },
    {
      rotulo: 'Cadastraram uma aula',
      significa: 'Sem isto o site existe mas ninguém consegue agendar.',
      quantos: comServico.length,
      base: comImagem.length,
    },
    {
      rotulo: 'Têm ao menos um aluno',
      significa: 'A partir daqui a plataforma passou a servir para alguma coisa.',
      quantos: comAluno.length,
      base: comServico.length,
    },
  ];
}

/**
 * O degrau onde mais gente some. Null quando ninguém some.
 *
 * Só entram degraus com perda de verdade. Sem esse filtro, um funil em que
 * todos passaram por tudo ainda apontava um "culpado", e a tela avisava
 * "a maior perda é aqui: de 2 que chegaram, 2 passaram" -- alarme sobre
 * uma coisa que deu certo.
 */
export function maiorQueda(degraus: DegrauDoFunil[]): DegrauDoFunil | null {
  const comPerda = degraus.slice(1).filter((d) => d.base > 0 && d.quantos < d.base);
  if (!comPerda.length) return null;

  return comPerda.reduce((pior, atual) => {
    const perdaAtual = (atual.base - atual.quantos) / atual.base;
    const perdaPior = (pior.base - pior.quantos) / pior.base;
    return perdaAtual > perdaPior ? atual : pior;
  });
}
