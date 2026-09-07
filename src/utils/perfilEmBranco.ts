import { TeacherProfile } from '../types';

/**
 * Perfil sem ninguém dentro, para o intervalo entre abrir o app e o banco
 * responder.
 *
 * Antes esse intervalo era preenchido pelo professor de demonstração, o
 * "Prof. Roberto Almeida": quem abria a vitrine via o site dele por um
 * instante -- ou para sempre, quando o endereço não existia. Um molde vazio
 * erra em silêncio; um molde com nome erra dizendo o nome errado.
 *
 * Os campos são os obrigatórios de TeacherProfile. Não é um professor de
 * verdade e não deve ser gravado em lugar nenhum.
 */
export const PERFIL_EM_BRANCO: TeacherProfile = {
  id: '',
  name: '',
  role: '',
  specialty: '',
  bio: '',
  rating: 0,
  reviewCount: 0,
  yearsExperience: 0,
  avatarUrl: '',
  heroImageUrl: '',
  whatsapp: '',
  email: '',
};

/** Ainda não veio ninguém do banco. */
export const perfilVazio = (t: TeacherProfile | null | undefined): boolean => !t?.id;
