import { describe, it, expect } from 'vitest';
import {
  getPlan, planAllows, planRequiredFor, nextPlan, isPlanTier, PLANS, effectivePlan,
} from './plans';

describe('planos e o que cada um libera', () => {
  it('professor sem plano cai no Start, não no mais alto', () => {
    expect(getPlan(undefined).tier).toBe('start');
    expect(getPlan(null).tier).toBe('start');
    expect(getPlan('inexistente').tier).toBe('start');
    expect(isPlanTier('premium')).toBe(true);
    expect(isPlanTier('enterprise')).toBe(false);
  });

  it('cada plano inclui os endereços dos planos abaixo', () => {
    expect(planAllows('start', 'path')).toBe(true);
    expect(planAllows('start', 'subdomain')).toBe(false);
    expect(planAllows('start', 'domain')).toBe(false);

    expect(planAllows('pro', 'path')).toBe(true);
    expect(planAllows('pro', 'subdomain')).toBe(true);
    expect(planAllows('pro', 'domain')).toBe(false);

    expect(planAllows('premium', 'path')).toBe(true);
    expect(planAllows('premium', 'subdomain')).toBe(true);
    expect(planAllows('premium', 'domain')).toBe(true);
  });

  it('plano desconhecido não libera nada além do Start', () => {
    expect(planAllows('hacker', 'domain')).toBe(false);
    expect(planAllows(undefined, 'subdomain')).toBe(false);
  });

  it('aponta o plano necessário para cada endereço', () => {
    expect(planRequiredFor('path').tier).toBe('start');
    expect(planRequiredFor('subdomain').tier).toBe('pro');
    expect(planRequiredFor('domain').tier).toBe('premium');
  });

  it('sugere o próximo plano, e nenhum no topo', () => {
    expect(nextPlan('start')?.tier).toBe('pro');
    expect(nextPlan('pro')?.tier).toBe('premium');
    expect(nextPlan('premium')).toBeNull();
  });

  it('os preços batem com a tabela mostrada na tela de planos', () => {
    expect(PLANS.start.priceMonth).toBe(79);
    expect(PLANS.pro.priceMonth).toBe(129);
    expect(PLANS.premium.priceMonth).toBe(199);
  });
});

describe('quem assina: a empresa vence o professor', () => {
  const academiaPremium = { id: 'comp-1', name: 'Aqua Vida', plan: 'premium' };

  it('professor de academia usa o plano da academia, não o dele', () => {
    const r = effectivePlan({ plan: 'start', companyId: 'comp-1' }, academiaPremium);
    expect(r.plan.tier).toBe('premium');
    expect(r.source).toBe('empresa');
    expect(r.companyName).toBe('Aqua Vida');
  });

  it('a academia também limita para baixo, não só para cima', () => {
    // Campo individual 'premium' herdado de antes não pode furar o plano pago
    const r = effectivePlan({ plan: 'premium', companyId: 'comp-1' }, { ...academiaPremium, plan: 'start' });
    expect(r.plan.tier).toBe('start');
    expect(r.source).toBe('empresa');
  });

  it('professor autônomo continua com a assinatura própria', () => {
    const r = effectivePlan({ plan: 'pro' }, null);
    expect(r.plan.tier).toBe('pro');
    expect(r.source).toBe('professor');
    expect(r.companyName).toBeUndefined();
  });

  it('empresa de outro id não vale: só a dele conta', () => {
    const r = effectivePlan({ plan: 'pro', companyId: 'comp-1' }, { id: 'comp-99', name: 'Outra', plan: 'premium' });
    expect(r.plan.tier).toBe('pro');
    expect(r.source).toBe('professor');
  });

  it('sem plano em lugar nenhum, cai no Start', () => {
    expect(effectivePlan(null, null).plan.tier).toBe('start');
    expect(effectivePlan({ companyId: 'comp-1' }, { id: 'comp-1', name: 'X' }).plan.tier).toBe('start');
  });

  it('domínio próprio segue o plano efetivo, não o campo do professor', () => {
    const daAcademia = effectivePlan({ plan: 'start', companyId: 'comp-1' }, academiaPremium);
    expect(planAllows(daAcademia.plan.tier, 'domain')).toBe(true);

    const autonomo = effectivePlan({ plan: 'start' }, null);
    expect(planAllows(autonomo.plan.tier, 'domain')).toBe(false);
  });
});
