import { describe, it, expect } from 'vitest';
import {
  getPlan, planAllows, planRequiredFor, nextPlan, isPlanTier, PLANS, effectivePlan,
  userLimitOf, quotaStatus, planForUsers,
} from './plans';
import { PRICING_PLANS } from '../data/mockData';

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

  it('a tela de planos mostra exatamente os preços da fonte única', () => {
    // PRICING_PLANS repetia os valores à mão: dois lugares com o mesmo
    // número, e uma atualização esquecia o outro. Agora é derivado.
    const daTela = new Map(PRICING_PLANS.map((p) => [p.name, p.priceMonth]));
    expect(daTela.get('Start')).toBe(PLANS.start.priceMonth);
    expect(daTela.get('Pro')).toBe(PLANS.pro.priceMonth);
    expect(daTela.get('Premium')).toBe(PLANS.premium.priceMonth);
  });

  it('a tela de planos abre pela faixa de usuários, que é o que separa os planos', () => {
    const start = PRICING_PLANS.find((p) => p.name === 'Start');
    expect(start?.features[0]).toBe('1 a 10 usuários');
    expect(PRICING_PLANS.find((p) => p.name === 'Pro')?.features[0]).toBe('11 a 100 usuários');
    expect(PRICING_PLANS.find((p) => p.name === 'Premium')?.features[0]).toBe('101 a 500 usuários');
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

describe('limite de usuários por plano', () => {
  it('as faixas da tabela de preços', () => {
    expect(PLANS.start).toMatchObject({ priceMonth: 99, maxUsers: 10 });
    expect(PLANS.pro).toMatchObject({ priceMonth: 180, maxUsers: 100 });
    expect(PLANS.premium).toMatchObject({ priceMonth: 350, maxUsers: 500 });
  });

  it('plano desconhecido cai no menor limite, nunca no maior', () => {
    expect(userLimitOf(undefined)).toBe(10);
    expect(userLimitOf('enterprise')).toBe(10);
  });

  it('a conta enche exatamente no limite, não depois', () => {
    expect(quotaStatus('start', 9).isFull).toBe(false);
    expect(quotaStatus('start', 10).isFull).toBe(true);
    expect(quotaStatus('start', 10).remaining).toBe(0);
  });

  it('avisa antes de travar, nos últimos 10% das vagas', () => {
    expect(quotaStatus('start', 8).isNearLimit).toBe(false);
    expect(quotaStatus('start', 9).isNearLimit).toBe(true);
    // Cheio não é "quase cheio": são estados diferentes na tela
    expect(quotaStatus('start', 10).isNearLimit).toBe(false);
  });

  it('sugere o menor plano que comporta, e não o mais caro', () => {
    expect(quotaStatus('start', 10).suggested?.tier).toBe('pro');
    expect(quotaStatus('pro', 100).suggested?.tier).toBe('premium');
    expect(planForUsers(11)?.tier).toBe('pro');
    expect(planForUsers(101)?.tier).toBe('premium');
  });

  it('acima de 500 não há plano: é conversa de suporte', () => {
    expect(planForUsers(501)).toBeNull();
    expect(quotaStatus('premium', 500).suggested).toBeNull();
  });

  it('conta com folga não avisa nada', () => {
    const q = quotaStatus('premium', 12);
    expect(q.isFull).toBe(false);
    expect(q.isNearLimit).toBe(false);
    expect(q.remaining).toBe(488);
  });
});
