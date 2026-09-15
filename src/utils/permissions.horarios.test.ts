import { describe, it, expect } from 'vitest';
import { canAccessView } from './permissions';
import { hashFromView, viewFromHash, VIEW_TITLES } from './routes';

describe('tela de horários de aula', () => {
  it('abre para professor e admin', () => {
    expect(canAccessView('professor', 'horarios')).toBe(true);
    expect(canAccessView('admin', 'horarios')).toBe(true);
  });

  it('fica fechada para quem não define a grade do professor', () => {
    expect(canAccessView('assistente', 'horarios')).toBe(false);
    expect(canAccessView('aluno', 'horarios')).toBe(false);
    expect(canAccessView('gestor', 'horarios')).toBe(false);
  });

  it('tem endereço e título próprios', () => {
    expect(hashFromView('horarios')).toBe('/horarios');
    expect(viewFromHash('#/horarios')).toBe('horarios');
    expect(VIEW_TITLES.horarios).toBe('Horários de aula');
  });
});
