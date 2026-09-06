/**
 * Planos que o professor assina do Aquagenda e o que cada um libera.
 * Não confundir com PricingPlan, que são os planos que o professor vende aos alunos dele.
 */

export type PlanTier = 'start' | 'pro' | 'premium';

/** Como a vitrine do professor é endereçada. Cada modo inclui os anteriores. */
export type AddressingMode = 'path' | 'subdomain' | 'domain';

export interface PlanDefinition {
  tier: PlanTier;
  name: string;
  priceMonth: number;
  /** Modo de endereço mais alto que o plano libera */
  addressing: AddressingMode;
  addressingLabel: string;
  addressingHint: string;
}

export const PLANS: Record<PlanTier, PlanDefinition> = {
  start: {
    tier: 'start',
    name: 'Start',
    priceMonth: 79,
    addressing: 'path',
    addressingLabel: 'Endereço dentro do Aquagenda',
    addressingHint: 'Sua vitrine fica em um endereço do Aquagenda, pronto para usar.',
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    priceMonth: 129,
    addressing: 'subdomain',
    addressingLabel: 'Endereço com o seu nome',
    addressingHint: 'Seu nome vem antes do Aquagenda, sem precisar comprar domínio.',
  },
  premium: {
    tier: 'premium',
    name: 'Premium',
    priceMonth: 199,
    addressing: 'domain',
    addressingLabel: 'Domínio próprio',
    addressingHint: 'Use o domínio que você comprou. O Aquagenda não aparece no endereço.',
  },
};

export const PLAN_ORDER: PlanTier[] = ['start', 'pro', 'premium'];

export function isPlanTier(value: unknown): value is PlanTier {
  return value === 'start' || value === 'pro' || value === 'premium';
}

/** Plano a partir do identificador, tolerando registros antigos sem o campo. */
export function getPlan(tier?: string | null): PlanDefinition {
  return isPlanTier(tier) ? PLANS[tier] : PLANS.start;
}

/** De onde vem a assinatura que vale para este professor. */
export type PlanSource = 'empresa' | 'professor';

export interface EffectivePlan {
  plan: PlanDefinition;
  source: PlanSource;
  /** Nome da academia, quando é ela quem assina */
  companyName?: string;
}

/**
 * Qual plano vale para um professor.
 *
 * A empresa manda quando existe: numa academia, quem assina é a academia, e
 * cobrar cada professor separado seria errado. Professor autônomo continua
 * com o plano dele. Espelha public.effective_plan() no banco -- os dois
 * precisam concordar, senão a tela promete o que o banco recusa.
 */
export function effectivePlan(
  teacher: { plan?: string | null; companyId?: string | null } | null | undefined,
  company?: { id: string; name: string; plan?: string | null } | null
): EffectivePlan {
  if (company && teacher?.companyId && company.id === teacher.companyId) {
    return { plan: getPlan(company.plan), source: 'empresa', companyName: company.name };
  }
  return { plan: getPlan(teacher?.plan), source: 'professor' };
}

const MODE_RANK: Record<AddressingMode, number> = { path: 0, subdomain: 1, domain: 2 };

/** O plano libera este modo de endereço? */
export function planAllows(tier: string | null | undefined, mode: AddressingMode): boolean {
  return MODE_RANK[getPlan(tier).addressing] >= MODE_RANK[mode];
}

/** Primeiro plano capaz de oferecer o modo, para a mensagem de "faça upgrade". */
export function planRequiredFor(mode: AddressingMode): PlanDefinition {
  const tier = PLAN_ORDER.find((t) => MODE_RANK[PLANS[t].addressing] >= MODE_RANK[mode]);
  return PLANS[tier || 'premium'];
}

/** Próximo plano acima do atual, ou null se já é o mais alto. */
export function nextPlan(tier: string | null | undefined): PlanDefinition | null {
  const index = PLAN_ORDER.indexOf(getPlan(tier).tier);
  const next = PLAN_ORDER[index + 1];
  return next ? PLANS[next] : null;
}
