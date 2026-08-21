import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = ((import.meta as any).env?.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'MY_SUPABASE_URL' &&
  !supabaseUrl.includes('placeholder')
);

let supabaseInstance: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('Erro ao inicializar cliente Supabase:', err);
    supabaseInstance = null;
  }
}

export const supabase = supabaseInstance;

export interface SupabaseStatus {
  configured: boolean;
  connected: boolean;
  url: string;
  error?: string;
}

export async function checkSupabaseConnection(): Promise<SupabaseStatus> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      configured: false,
      connected: false,
      url: supabaseUrl || 'Não configurado (.env)',
      error: 'Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não informadas.',
    };
  }

  try {
    const { error } = await supabase.from('teachers').select('id').limit(1);
    if (error) {
      // Table might not exist yet, but connection to Supabase host worked
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return {
          configured: true,
          connected: true,
          url: supabaseUrl,
          error: 'Conectado ao Supabase, mas as tabelas ainda precisam ser criadas via SQL Schema.',
        };
      }
      return {
        configured: true,
        connected: false,
        url: supabaseUrl,
        error: error.message,
      };
    }
    return {
      configured: true,
      connected: true,
      url: supabaseUrl,
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      url: supabaseUrl,
      error: err.message || 'Falha na conexão com Supabase',
    };
  }
}
