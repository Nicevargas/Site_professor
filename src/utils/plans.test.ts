import { describe, it, expect } from 'vitest';
import { getPlan, planAllows, planRequiredFor, nextPlan, isPlanTier, PLANS } from './plans';

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
