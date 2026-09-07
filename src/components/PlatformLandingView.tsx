import React from 'react';
import {
  ArrowRight, CalendarDays, Check, ClipboardCheck, CreditCard, Globe,
  GraduationCap, MessageCircle, ShieldCheck, Users,
} from 'lucide-react';
import { AquagendaIcon } from './AquagendaLogo';
import { DIAS_DE_TESTE, PLANS, PLAN_ORDER, PlanTier } from '../utils/plans';

interface PlatformLandingViewProps {
  onEnterApp: () => void;
  onCreateAccount: () => void;
}

/**
 * A página que vende o Aquagenda.
 *
 * É o que aparece quando ninguém foi pedido pelo endereço: a raiz do domínio
 * e qualquer entrada sem professor. Antes disso, a raiz mostrava a vitrine de
 * um professor qualquer do banco -- o visitante achava que tinha chegado no
 * site de alguém.
 *
 * Os preços vêm de utils/plans.ts, os mesmos que o app cobra. Repetir os
 * números aqui garantiria que um dia eles discordassem.
 */

const RECURSOS = [
  {
    icone: CalendarDays,
    titulo: 'Agenda com vaga contada',
    texto:
      'Cada turma tem um limite. Ao encher, o próximo aluno entra na lista de espera em vez de ouvir "não tem mais lugar".',
  },
  {
    icone: ClipboardCheck,
    titulo: 'Chamada e nível do aluno',
    texto:
      'Presença registrada na aula, e cada aluno marcado como iniciante, médio ou avançado — para montar turma sem depender da memória.',
  },
  {
    icone: Globe,
    titulo: 'Seu site, no seu endereço',
    texto:
      'Uma vitrine pronta com suas aulas, vídeos, depoimentos e formação. Você escolhe quais seções aparecem, em que ordem e com que nome.',
  },
  {
    icone: CreditCard,
    titulo: 'Cobrança por PIX',
    texto:
      'Mensalidades e aulas avulsas com chave PIX própria. O aluno paga sem sair da conversa.',
  },
  {
    icone: MessageCircle,
    titulo: 'Lembrete no WhatsApp',
    texto:
      'Aviso automático oito horas antes da aula. Menos falta, menos horário perdido, menos mensagem manual.',
  },
  {
    icone: GraduationCap,
    titulo: 'Portal do aluno',
    texto:
      'O aluno vê as aulas, o histórico e os pagamentos dele. Quem treina com mais de um professor vê todos numa tela só.',
  },
  {
    icone: Users,
    titulo: 'Equipe e academia',
    texto:
      'Vários professores sob a mesma conta, cada um com os próprios alunos. A academia tem página própria e monta a equipe por convite.',
  },
  {
    icone: ShieldCheck,
    titulo: 'Cada um vê o que é seu',
    texto:
      'Professor, secretaria, gestor e aluno enxergam coisas diferentes. A separação vale no banco de dados, não só na tela.',
  },
];

const DESTAQUE: Record<PlanTier, string | null> = {
  start: null,
  pro: 'Mais escolhido',
  premium: null,
};

export const PlatformLandingView: React.FC<PlatformLandingViewProps> = ({
  onEnterApp,
  onCreateAccount,
}) => (
  <div className="min-h-screen bg-white text-[#091426]">
    {/* ================= TOPO ================= */}
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <AquagendaIcon className="w-8 h-8" />
          <span className="font-bold tracking-tight">Aquagenda</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEnterApp}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-[#00687a] hover:bg-cyan-50 transition-colors"
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={onCreateAccount}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-[#00687a] hover:bg-[#004e5c] text-white transition-colors"
          >
            Testar grátis
          </button>
        </div>
      </div>
    </header>

    {/* ================= ABERTURA ================= */}
    <section className="bg-gradient-to-b from-cyan-50/60 to-white border-b border-slate-200">
      <div className="max-w-3xl mx-auto px-5 py-20 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#57dffe] text-[#00505e] text-xs font-bold mb-6">
          <Check className="w-3.5 h-3.5" />
          {DIAS_DE_TESTE} dias grátis, sem cartão
        </span>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-5">
          Sua agenda, seus alunos e seu site.
          <br />
          <span className="text-[#00687a]">Num lugar só.</span>
        </h1>

        <p className="text-lg text-[#45474c] leading-relaxed mb-9 max-w-xl mx-auto">
          Feito para quem ensina em turma: natação, personal, estúdios e academias. Marque aulas,
          controle vagas, receba por PIX e tenha uma página própria — sem planilha e sem site
          separado.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={onCreateAccount}
            className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-[#00687a] hover:bg-[#004e5c] text-white font-bold transition-colors"
          >
            Começar {DIAS_DE_TESTE} dias grátis
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onEnterApp}
            className="inline-flex items-center justify-center px-7 py-4 rounded-2xl border border-slate-300 hover:border-[#00687a] hover:text-[#00687a] font-semibold transition-colors"
          >
            Já tenho conta
          </button>
        </div>
      </div>
    </section>

    {/* ================= RECURSOS ================= */}
    <section className="max-w-6xl mx-auto px-5 py-20" aria-labelledby="recursos">
      <h2 id="recursos" className="text-3xl font-bold tracking-tight text-center mb-3">
        O que você deixa de fazer à mão
      </h2>
      <p className="text-[#45474c] text-center mb-12 max-w-xl mx-auto">
        Cada item aqui resolve um problema que hoje mora numa planilha, num caderno ou na sua
        cabeça.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {RECURSOS.map(({ icone: Icone, titulo, texto }) => (
          <div key={titulo} className="p-5 rounded-2xl border border-slate-200 hover:border-[#57dffe] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center mb-4">
              <Icone className="w-5 h-5 text-[#00687a]" />
            </div>
            <h3 className="font-bold mb-1.5">{titulo}</h3>
            <p className="text-sm text-[#45474c] leading-relaxed">{texto}</p>
          </div>
        ))}
      </div>
    </section>

    {/* ================= PLANOS ================= */}
    <section className="bg-[#f7f9fb] border-y border-slate-200" aria-labelledby="planos">
      <div className="max-w-6xl mx-auto px-5 py-20">
        <h2 id="planos" className="text-3xl font-bold tracking-tight text-center mb-3">
          Preço por tamanho, não por recurso
        </h2>
        <p className="text-[#45474c] text-center mb-12 max-w-xl mx-auto">
          Todos os planos têm o sistema inteiro. O que muda é quantas pessoas cabem na conta e como
          é o seu endereço na internet.
        </p>

        <div className="grid md:grid-cols-3 gap-5 items-start">
          {PLAN_ORDER.map((tier) => {
            const plano = PLANS[tier];
            const destaque = DESTAQUE[tier];

            return (
              <div
                key={tier}
                className={`p-6 rounded-2xl bg-white flex flex-col ${
                  destaque ? 'border-2 border-[#00687a] md:-mt-3 shadow-lg' : 'border border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-lg font-bold">{plano.name}</h3>
                  {destaque && (
                    <span className="px-2.5 py-1 rounded-full bg-[#00687a] text-white text-[10px] font-bold uppercase tracking-wider">
                      {destaque}
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#45474c] mb-5 min-h-[2.5rem]">{plano.audience}</p>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-sm font-semibold text-[#45474c]">R$</span>
                  <span className="text-4xl font-bold tracking-tight">{plano.priceMonth}</span>
                  <span className="text-sm text-[#75777d]">/mês</span>
                </div>
                <p className="text-xs text-[#75777d] mb-6">{plano.usersLabel}</p>

                <ul className="space-y-2.5 mb-7 flex-1">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-[#00687a] shrink-0 mt-0.5" />
                    <span>Sistema completo, sem recurso bloqueado</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-[#00687a] shrink-0 mt-0.5" />
                    <span>{plano.usersLabel}, entre equipe e alunos</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-[#00687a] shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-semibold">{plano.addressingLabel}.</strong>{' '}
                      {plano.addressingHint}
                    </span>
                  </li>
                </ul>

                <button
                  type="button"
                  onClick={onCreateAccount}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
                    destaque
                      ? 'bg-[#00687a] hover:bg-[#004e5c] text-white'
                      : 'border border-slate-300 hover:border-[#00687a] hover:text-[#00687a]'
                  }`}
                >
                  Testar {DIAS_DE_TESTE} dias
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-[#75777d] mt-8">
          O teste não pede cartão. Você escolhe o plano depois de usar.
        </p>
      </div>
    </section>

    {/* ================= FECHAMENTO ================= */}
    <section className="max-w-2xl mx-auto px-5 py-20 text-center">
      <h2 className="text-3xl font-bold tracking-tight mb-4">
        Comece hoje, decida daqui a um mês
      </h2>
      <p className="text-[#45474c] leading-relaxed mb-8">
        Crie a conta, cadastre suas turmas e veja como fica. Sem cartão, sem contrato e sem
        instalar nada.
      </p>
      <button
        type="button"
        onClick={onCreateAccount}
        className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#00687a] hover:bg-[#004e5c] text-white font-bold transition-colors"
      >
        Criar minha conta
        <ArrowRight className="w-4 h-4" />
      </button>
    </section>

    <footer className="border-t border-slate-200">
      <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#75777d]">
        <div className="flex items-center gap-2">
          <AquagendaIcon className="w-5 h-5" />
          <span>© {new Date().getFullYear()} Aquagenda</span>
        </div>
        <button type="button" onClick={onEnterApp} className="hover:text-[#00687a] transition-colors">
          Entrar na minha conta
        </button>
      </div>
    </footer>
  </div>
);
