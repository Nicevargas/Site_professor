import { describe, it, expect } from 'vitest';
import { TeacherProfile } from '../types';
import { PERFIL_EM_BRANCO } from '../utils/perfilEmBranco';

/**
 * O que saveTeacher manda para o banco nos campos de endereço.
 *
 * Testar o serviço inteiro exigiria um Supabase de mentira; o que importa
 * aqui é a REGRA, e ela cabe numa função. Se mudar em supabaseService,
 * mude aqui junto -- e o comentário lá aponta para cá.
 *
 * A regra existe porque o slug do "Renato Simon" foi apagado em produção:
 * qualquer gravação do perfil escrevia `slug: teacher.slug || null`, e o
 * objeto em memória perdia o slug quando o login acontecia antes de a lista
 * de professores chegar do banco. Salvar a logo derrubava o endereço.
 */
function camposDeEndereco(teacher: TeacherProfile): Record<string, unknown> {
  return {
    ...(teacher.slug !== undefined ? { slug: teacher.slug || null } : {}),
    ...(teacher.customDomain !== undefined
      ? { custom_domain: teacher.customDomain || null }
      : {}),
  };
}

const prof = (over: Partial<TeacherProfile>): TeacherProfile => ({ ...PERFIL_EM_BRANCO, ...over });

describe('endereço na gravação do perfil', () => {
  it('campo ausente não vira campo apagado', () => {
    // Salvar cores ou foto com um perfil que não conhece o slug não pode
    // derrubar o endereço público de quem já tinha um
    const campos = camposDeEndereco(prof({ name: 'Renato' }));
    expect('slug' in campos).toBe(false);
    expect('custom_domain' in campos).toBe(false);
  });

  it('string vazia apaga de verdade: é o que a tela "Meu endereço" faz', () => {
    const campos = camposDeEndereco(prof({ slug: '' }));
    expect(campos.slug).toBeNull();
  });

  it('slug preenchido é gravado como está', () => {
    expect(camposDeEndereco(prof({ slug: 'renato-simon' })).slug).toBe('renato-simon');
  });

  it('domínio próprio segue a mesma regra', () => {
    expect('custom_domain' in camposDeEndereco(prof({ customDomain: undefined }))).toBe(false);
    expect(camposDeEndereco(prof({ customDomain: '' })).custom_domain).toBeNull();
    expect(camposDeEndereco(prof({ customDomain: 'x.com.br' })).custom_domain).toBe('x.com.br');
  });

  it('o molde em branco não carrega endereço, então não apaga nada', () => {
    // PERFIL_EM_BRANCO é o que o app usa enquanto o banco não respondeu
    expect(camposDeEndereco(PERFIL_EM_BRANCO)).toEqual({});
  });
});
