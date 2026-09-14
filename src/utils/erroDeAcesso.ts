/**
 * Erros de login, cadastro e senha em português.
 *
 * O Supabase responde em inglês ("Invalid login credentials", "Email rate
 * limit exceeded"...), e o app mostrava essas frases como vieram. Aqui cada
 * uma vira o que a pessoa precisa saber e o que fazer em seguida.
 *
 * Mensagem que não está na lista não passa em inglês: vira um aviso geral.
 */

type Regra = [RegExp, string | ((achado: RegExpMatchArray) => string)];

const REGRAS: Regra[] = [
  [/invalid login credentials/i, 'E-mail ou senha incorretos. Confira os dados ou use "Esqueci minha senha".'],
  [/email not confirmed/i, 'Seu e-mail ainda não foi confirmado. Abra o e-mail que enviamos e clique no link.'],
  [/already (registered|been registered)|user already exists/i, 'Este e-mail já tem cadastro. Entre com sua senha ou use "Esqueci minha senha".'],
  [/password should be at least (\d+)/i, (m) => `A senha precisa ter pelo menos ${m[1]} caracteres.`],
  [/password should contain/i, 'A senha precisa misturar letras e números.'],
  [/weak|easy to guess|pwned|leaked/i, 'Essa senha é muito fácil de adivinhar. Escolha outra.'],
  [/should be different from the old password|same.password/i, 'A senha nova precisa ser diferente da senha atual.'],
  [/reauthenticat/i, 'Por segurança, entre de novo no sistema antes de trocar a senha.'],
  [/after (\d+) seconds?/i, (m) => `Por segurança, espere ${m[1]} segundos antes de tentar de novo.`],
  [/email rate limit|over_email_send_rate_limit/i, 'Enviamos muitos e-mails em pouco tempo. Espere alguns minutos e peça de novo.'],
  [/rate limit|too many requests/i, 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.'],
  [/invalid or has expired|otp_expired|token has expired|expired/i, 'Este link expirou ou já foi usado. Peça um novo em "Esqueci minha senha".'],
  [/auth session missing|session.not.found|jwt/i, 'Sua sessão terminou. Entre de novo ou peça um novo link em "Esqueci minha senha".'],
  [/invalid format|unable to validate email|invalid email/i, 'Esse e-mail não parece válido. Confira se digitou certo.'],
  [/signups? not allowed|signup is disabled/i, 'Novos cadastros estão fechados no momento.'],
  [/user not found/i, 'Não encontramos cadastro com esse e-mail.'],
  [/access_denied/i, 'O acesso por este link não foi autorizado. Peça um novo em "Esqueci minha senha".'],
  [/failed to fetch|networkerror|network request failed|load failed/i, 'Sem conexão com o servidor. Confira sua internet e tente de novo.'],
];

export const ERRO_GERAL_DE_ACESSO = 'Não foi possível concluir agora. Tente de novo em alguns minutos.';

export function traduzirErroDeAcesso(mensagem: string | null | undefined): string {
  const texto = (mensagem || '').trim();
  if (!texto) return ERRO_GERAL_DE_ACESSO;
  for (const [padrao, resposta] of REGRAS) {
    const achado = texto.match(padrao);
    if (achado) return typeof resposta === 'string' ? resposta : resposta(achado);
  }
  return ERRO_GERAL_DE_ACESSO;
}

/** Tamanho mínimo de senha: o mesmo número configurado no Supabase. */
export const SENHA_MINIMA = 8;
