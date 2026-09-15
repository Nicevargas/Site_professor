import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Salvar os horários de aula não pode reescrever o resto do professor.
 *
 * saveTeacher manda a linha inteira e completa campo vazio com valor padrão
 * (cor, tema, forma de pagamento). A tela de horários só mexe nos horários --
 * então grava só essa coluna. O banco é simulado: o que importa é o que o
 * serviço TENTA mandar.
 */
const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('../lib/supabase', () => ({ isSupabaseConfigured: true, supabase: { from } }));

import { supabaseService } from './supabaseService';
import { PROFESSOR_DESCONHECIDO, SYNC_ERROR_EVENT } from '../utils/syncNotifier';

function bancoResponde(resposta: { data: unknown; error: unknown }) {
  const select = vi.fn().mockResolvedValue(resposta);
  const eq = vi.fn(() => ({ select }));
  const update = vi.fn(() => ({ eq }));
  const upsert = vi.fn();
  from.mockReturnValue({ update, upsert });
  return { update, eq, select, upsert };
}

let avisos: string[] = [];
const ouvir = (e: Event) => avisos.push(String((e as CustomEvent).detail?.reason));

beforeEach(() => {
  avisos = [];
  from.mockReset();
  window.addEventListener(SYNC_ERROR_EVENT, ouvir);
});

afterEach(() => {
  window.removeEventListener(SYNC_ERROR_EVENT, ouvir);
});

describe('gravar horários de aula', () => {
  it('grava só a coluna dos horários, na linha do próprio professor', async () => {
    const { update, eq, upsert } = bancoResponde({ data: [{ id: 'prof-1' }], error: null });

    const ok = await supabaseService.saveClassSchedule('prof-1', { 1: ['07:00'], 3: ['07:00'] });

    expect(ok).toBe(true);
    expect(from).toHaveBeenCalledWith('teachers');
    expect(update).toHaveBeenCalledWith({ class_schedule: { 1: ['07:00'], 3: ['07:00'] } });
    expect(Object.keys((update.mock.calls[0] as unknown[])[0] as object)).toEqual(['class_schedule']);
    expect(eq).toHaveBeenCalledWith('id', 'prof-1');
    // Nada de upsert da linha inteira
    expect(upsert).not.toHaveBeenCalled();
  });

  it('sem saber quem é o professor, nem chega ao banco', async () => {
    const ok = await supabaseService.saveClassSchedule('', { 1: ['07:00'] });
    expect(ok).toBe(false);
    expect(from).not.toHaveBeenCalled();
    expect(avisos).toEqual([PROFESSOR_DESCONHECIDO]);
  });

  it('banco que não alterou nenhuma linha (sem permissão) conta como falha', async () => {
    bancoResponde({ data: [], error: null });
    const ok = await supabaseService.saveClassSchedule('prof-1', { 1: ['07:00'] });
    expect(ok).toBe(false);
    expect(avisos).toHaveLength(1);
  });

  it('coluna que ainda não existe no banco é falha, não sucesso', async () => {
    bancoResponde({ data: null, error: { code: '42703', message: 'column "class_schedule" does not exist' } });
    const ok = await supabaseService.saveClassSchedule('prof-1', { 1: ['07:00'] });
    expect(ok).toBe(false);
  });
});
