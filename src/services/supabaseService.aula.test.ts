import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Domingo é domingo e aula gratuita é R$ 0 -- no banco e de volta no app.
 *
 * O serviço usava `valor || padrão`, e 0 conta como vazio: domingo virava
 * segunda e R$ 0 virava R$ 150, na gravação e na leitura. O banco é simulado:
 * o que importa é o que o serviço manda e o que ele devolve ao app.
 */
const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('../lib/supabase', () => ({ isSupabaseConfigured: true, supabase: { from } }));

import { supabaseService } from './supabaseService';
import { Appointment } from '../types';

// 20/09/2026 é domingo
const aulaGratisNoDomingo: Appointment = {
  id: 'apt-domingo',
  teacherId: 'prof-1',
  studentName: 'Ana Souza',
  serviceId: 'serv-1',
  serviceName: 'Aula experimental',
  date: '2026-09-20',
  dayOfWeek: 0,
  startTime: '08:00',
  endTime: '09:00',
  durationMinutes: 60,
  modality: 'Presencial',
  status: 'Confirmado',
  price: 0,
};

beforeEach(() => {
  from.mockReset();
});

describe('gravar aula no banco', () => {
  it('aula marcada pelo professor num domingo, gratuita, vai como domingo e R$ 0', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    from.mockReturnValue({ upsert });

    await supabaseService.saveAppointment(aulaGratisNoDomingo, 'prof-1');

    const linha = upsert.mock.calls[0][0];
    expect(linha.day_of_week).toBe(0);
    expect(linha.price).toBe(0);
  });

  it('reserva pelo site segue a mesma regra', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    from.mockReturnValue({ insert });

    await supabaseService.createPublicBooking(aulaGratisNoDomingo, null, 'prof-1');

    const linha = insert.mock.calls[0][0];
    expect(linha.day_of_week).toBe(0);
    expect(linha.price).toBe(0);
  });

  it('o dia gravado sai da data, mesmo que a tela mande outro', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    from.mockReturnValue({ upsert });

    await supabaseService.saveAppointment({ ...aulaGratisNoDomingo, dayOfWeek: 1 }, 'prof-1');

    expect(upsert.mock.calls[0][0].day_of_week).toBe(0);
  });

  it('aula sem valor informado continua com o preço padrão', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    from.mockReturnValue({ upsert });

    await supabaseService.saveAppointment({ ...aulaGratisNoDomingo, price: undefined as unknown as number }, 'prof-1');

    expect(upsert.mock.calls[0][0].price).toBe(150);
  });
});

describe('ler aula do banco', () => {
  function bancoDevolve(linhas: object[]) {
    const order = vi.fn().mockResolvedValue({ data: linhas, error: null });
    const select = vi.fn(() => ({ order }));
    from.mockReturnValue({ select });
  }

  const linhaBase = {
    id: 'apt-1',
    teacher_id: 'prof-1',
    student_name: 'Ana Souza',
    service_id: 'serv-1',
    service_name: 'Aula experimental',
    start_time: '08:00',
    end_time: '09:00',
    duration_minutes: 60,
    modality: 'Presencial',
    status: 'Confirmado',
  };

  it('domingo e R$ 0 voltam como domingo e R$ 0', async () => {
    bancoDevolve([{ ...linhaBase, date: '2026-09-20', day_of_week: 0, price: 0 }]);

    const [aula] = (await supabaseService.getAppointments())!;

    expect(aula.dayOfWeek).toBe(0);
    expect(aula.price).toBe(0);
  });

  it('aula antiga de domingo gravada como segunda aparece como domingo', async () => {
    bancoDevolve([{ ...linhaBase, date: '2026-09-20', day_of_week: 1, price: '80.00' }]);

    const [aula] = (await supabaseService.getAppointments())!;

    expect(aula.dayOfWeek).toBe(0);
    expect(aula.price).toBe(80);
  });

  it('valor vazio no banco continua mostrando o preço padrão', async () => {
    bancoDevolve([{ ...linhaBase, date: '2026-09-21', day_of_week: 1, price: null }]);

    const [aula] = (await supabaseService.getAppointments())!;

    expect(aula.dayOfWeek).toBe(1);
    expect(aula.price).toBe(150);
  });
});
