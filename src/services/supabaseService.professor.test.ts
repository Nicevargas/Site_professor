import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Gravação sem professor conhecido não chega ao banco.
 *
 * Serviço, lembrete, cobrança e vídeo usavam 'prof-roberto' quando não
 * sabiam de quem era o registro -- um professor de demonstração que não
 * existe. O banco recusava e o aviso falava em permissão. Aqui o banco é
 * simulado: o que importa é o que o serviço TENTA mandar para ele.
 */
const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('../lib/supabase', () => ({ isSupabaseConfigured: true, supabase: { from } }));

import { supabaseService } from './supabaseService';
import { explainSyncReason, PROFESSOR_DESCONHECIDO, SYNC_ERROR_EVENT } from '../utils/syncNotifier';
import { ServiceItem } from '../types';

const servico: ServiceItem = {
  id: 'serv-teste',
  name: 'Personal',
  description: '',
  price: 60,
  durationMinutes: 45,
  active: false,
  modality: 'Online / Presencial',
  iconName: 'pool',
};

let avisos: string[] = [];
const ouvir = (e: Event) => avisos.push(String((e as CustomEvent).detail?.reason));

beforeEach(() => {
  avisos = [];
  from.mockReset();
  from.mockReturnValue({ upsert: vi.fn().mockResolvedValue({ error: null }) });
  window.addEventListener(SYNC_ERROR_EVENT, ouvir);
});

afterEach(() => {
  window.removeEventListener(SYNC_ERROR_EVENT, ouvir);
});

describe('gravação sem professor conhecido', () => {
  it('serviço sem dono não é enviado ao banco, e avisa o motivo certo', async () => {
    const ok = await supabaseService.saveService(servico, '');
    expect(ok).toBe(false);
    expect(from).not.toHaveBeenCalled();
    expect(avisos).toEqual([PROFESSOR_DESCONHECIDO]);
  });

  it('lembrete, cobrança e vídeo seguem a mesma regra', async () => {
    expect(await supabaseService.saveReminder({ id: 'r1', title: 'x' } as any, undefined)).toBe(false);
    expect(await supabaseService.saveInvoice({ id: 'i1', amount: 10 } as any, '   ')).toBe(false);
    expect(await supabaseService.saveVideo({ id: 'v1', title: 'x' }, undefined)).toBe(false);
    expect(from).not.toHaveBeenCalled();
    expect(avisos).toHaveLength(3);
    expect(avisos.every((a) => a === PROFESSOR_DESCONHECIDO)).toBe(true);
  });

  it('nunca manda o professor de demonstração', async () => {
    await supabaseService.saveService(servico, 'user-camila');
    const linha = from.mock.results[0].value.upsert.mock.calls[0][0];
    expect(linha.teacher_id).toBe('user-camila');
    expect(JSON.stringify(linha)).not.toContain('prof-roberto');
  });

  it('usa o dono que o próprio registro já traz, quando a tela não informa', async () => {
    await supabaseService.saveInvoice({ id: 'i2', amount: 10, teacherId: 'user-adriana' } as any, undefined);
    const linha = from.mock.results[0].value.upsert.mock.calls[0][0];
    expect(linha.teacher_id).toBe('user-adriana');
  });
});

describe('mensagem para quem vê o erro', () => {
  it('diz o que fazer, sem falar em permissão', () => {
    const texto = explainSyncReason(PROFESSOR_DESCONHECIDO);
    expect(texto).toMatch(/identificar seu perfil de professor/i);
    expect(texto).toMatch(/saia e entre de novo/i);
    expect(texto).not.toMatch(/permiss/i);
  });
});
