/**
 * Texto de partida para a especialidade e a apresentação do professor.
 *
 * Existe porque quase ninguém escreve sobre si. No banco, 12 de 13
 * professores puseram foto, mas só 1 preencheu especialidade e apresentação.
 * Foto tem botão; texto é um campo em branco pedindo que a pessoa saiba o que
 * dizer -- e ninguém soube. Ajustar um texto pronto é muito mais fácil do que
 * começar do zero.
 *
 * O texto sai do que o professor já cadastrou: o nome das aulas diz a área, a
 * modalidade diz se é presencial ou online. Nada é inventado sobre formação,
 * anos de experiência ou resultados -- isso só o professor pode afirmar.
 *
 * As frases evitam concordância de gênero ("formado/formada", "professor/
 * professora"): o sistema não sabe como cada pessoa se apresenta.
 */

export interface ServicoParaTexto {
  name: string;
  modality?: string;
  active?: boolean;
}

export interface DadosParaTexto {
  servicos: ServicoParaTexto[];
}

type IdArea =
  | 'natacao' | 'personal' | 'pilates' | 'yoga' | 'danca'
  | 'luta' | 'musica' | 'idiomas' | 'reforco' | 'geral';

interface Area {
  id: IdArea;
  /** Como aparece no selo da vitrine */
  rotulo: string;
  /** Como entra no meio de uma frase: "Trabalho com ___" */
  nome: string;
  palavras: string[];
}

/** A ordem desempata: numa contagem igual, vale a que vem antes. */
const AREAS: Area[] = [
  { id: 'natacao', rotulo: 'Natação', nome: 'natação', palavras: ['nata', 'piscina', 'aquat', 'hidro'] },
  { id: 'pilates', rotulo: 'Pilates', nome: 'pilates', palavras: ['pilates'] },
  { id: 'yoga', rotulo: 'Yoga', nome: 'yoga', palavras: ['yoga', 'ioga'] },
  { id: 'danca', rotulo: 'Dança', nome: 'dança', palavras: ['danca', 'ballet', 'bale', 'zumba', 'forro', 'samba'] },
  {
    id: 'luta', rotulo: 'Artes marciais', nome: 'artes marciais',
    palavras: ['jiu', 'karate', 'judo', 'muay', 'boxe', 'luta', 'capoeira', 'taekwondo'],
  },
  {
    id: 'personal', rotulo: 'Personal trainer', nome: 'treino personalizado',
    palavras: ['personal', 'musculacao', 'treino', 'funcional', 'crossfit'],
  },
  {
    id: 'musica', rotulo: 'Música', nome: 'música',
    palavras: ['violao', 'piano', 'guitarra', 'canto', 'musica', 'bateria', 'ukulele'],
  },
  {
    id: 'idiomas', rotulo: 'Idiomas', nome: 'idiomas',
    palavras: ['ingles', 'espanhol', 'frances', 'idioma', 'conversacao'],
  },
  {
    id: 'reforco', rotulo: 'Reforço escolar', nome: 'reforço escolar',
    palavras: ['reforco', 'matematica', 'redacao', 'vestibular', 'enem', 'alfabetizacao'],
  },
];

const GERAL: Area = { id: 'geral', rotulo: 'Aulas particulares', nome: 'aulas particulares', palavras: [] };

/** Quantas versões diferentes cada texto tem. */
export const TOTAL_VARIACOES = 3;

const semAcento = (t: string) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const ativos = (servicos: ServicoParaTexto[]) => servicos.filter((s) => s.active !== false);

/** A área que mais aparece no nome das aulas ativas. */
export function detectarArea(servicos: ServicoParaTexto[]): Area {
  const nomes = ativos(servicos).map((s) => semAcento(s.name || ''));
  let melhor: Area = GERAL;
  let maior = 0;
  for (const area of AREAS) {
    const pontos = nomes.filter((n) => area.palavras.some((p) => n.includes(p))).length;
    if (pontos > maior) {
      maior = pontos;
      melhor = area;
    }
  }
  return melhor;
}

type Formato = 'ambos' | 'online' | 'presencial' | 'desconhecido';

function detectarFormato(servicos: ServicoParaTexto[]): Formato {
  const modalidades = ativos(servicos).map((s) => s.modality || '');
  const online = modalidades.some((m) => m.includes('Online'));
  const presencial = modalidades.some((m) => m.includes('Presencial'));
  if (online && presencial) return 'ambos';
  if (online) return 'online';
  if (presencial) return 'presencial';
  return 'desconhecido';
}

const FORMATO_NA_FRASE: Record<Formato, string> = {
  ambos: ', em aulas presenciais e online',
  online: ', em aulas online',
  presencial: ', em aulas presenciais',
  desconhecido: '',
};

const FORMATO_NO_SELO: Record<Formato, string> = {
  ambos: 'Presencial e online',
  online: 'Online',
  presencial: 'Presencial',
  desconhecido: '',
};

const variacaoValida = (v: number) => ((Math.floor(v) % TOTAL_VARIACOES) + TOTAL_VARIACOES) % TOTAL_VARIACOES;

/**
 * Uma linha curta, para o selo acima do nome na vitrine.
 * O selo é pequeno e em maiúsculas: texto comprido vira uma faixa ilegível.
 */
export function sugerirEspecialidade(dados: DadosParaTexto, variacao = 0): string {
  const area = detectarArea(dados.servicos);
  const formato = FORMATO_NO_SELO[detectarFormato(dados.servicos)];
  switch (variacaoValida(variacao)) {
    case 0:
      return formato ? `${area.rotulo} · ${formato}` : area.rotulo;
    case 1:
      return `${area.rotulo} no seu ritmo`;
    default:
      // Curto de propósito: "com atenção individual" estourava o selo em
      // "Aulas particulares", o rótulo mais longo
      return `${area.rotulo} sob medida`;
  }
}

/** Os nomes das aulas, numa lista legível: "a, b e c". No máximo três. */
function listaDeAulas(servicos: ServicoParaTexto[]): string {
  const nomes = ativos(servicos).map((s) => s.name.trim()).filter(Boolean).slice(0, 3);
  if (nomes.length < 2) return '';
  return nomes.length === 2
    ? `${nomes[0]} e ${nomes[1]}`
    : `${nomes[0]}, ${nomes[1]} e ${nomes[2]}`;
}

/** Um parágrafo curto de apresentação, para o texto abaixo do nome. */
export function sugerirApresentacao(dados: DadosParaTexto, variacao = 0): string {
  const area = detectarArea(dados.servicos);
  const formato = FORMATO_NA_FRASE[detectarFormato(dados.servicos)];

  const abertura = [
    `Trabalho com ${area.nome}${formato}. Cada aula é planejada a partir do seu objetivo e do seu ritmo, para você evoluir com segurança.`,
    `Ensino ${area.nome}${formato} para quem quer aprender de verdade, sem fórmula pronta. Você começa de onde está, e o caminho é ajustado a cada aula.`,
    `Meu trabalho é ${area.nome}${formato}, com atenção a quem está aprendendo, do primeiro contato até o resultado que você procura.`,
  ][variacaoValida(variacao)];

  const aulas = listaDeAulas(dados.servicos);
  const oferta = aulas ? ` Hoje ofereço ${aulas}.` : '';

  return `${abertura}${oferta} Escolha um horário e agende a sua primeira aula.`;
}

/**
 * O texto é uma das sugestões, sem edição?
 *
 * Serve para a tela oferecer "outra sugestão" só enquanto a pessoa não mexeu.
 * Texto que ela escreveu ou ajustou nunca é trocado por um botão.
 */
export function ehSugestao(
  texto: string,
  dados: DadosParaTexto,
  tipo: 'especialidade' | 'apresentacao'
): boolean {
  const alvo = (texto || '').trim();
  if (!alvo) return false;
  const gerar = tipo === 'especialidade' ? sugerirEspecialidade : sugerirApresentacao;
  for (let v = 0; v < TOTAL_VARIACOES; v++) {
    if (gerar(dados, v) === alvo) return true;
  }
  return false;
}
