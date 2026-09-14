import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { SENHA_MINIMA } from '../utils/erroDeAcesso';

/**
 * "Crie sua nova senha" -- a tela de quem chegou pelo link do e-mail.
 *
 * O link abre uma sessão só para trocar a senha. Enquanto a senha nova não é
 * gravada, o painel não abre: antes, clicar no link já colocava a pessoa
 * dentro do sistema sem senha nova nenhuma.
 */
interface NovaSenhaViewProps {
  /** Grava a senha; devolve a mensagem de erro, ou null se deu certo */
  onSalvar: (senha: string) => Promise<string | null>;
  /** Senha gravada: a pessoa entra no sistema */
  onConcluido: () => void;
  /** Desistiu: a sessão do link é encerrada */
  onCancelar: () => void;
}

export const NovaSenhaView: React.FC<NovaSenhaViewProps> = ({ onSalvar, onConcluido, onCancelar }) => {
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pronta, setPronta] = useState(false);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!senha) return setErro('Digite a senha nova.');
    if (senha.length < SENHA_MINIMA) return setErro(`A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`);
    if (senha !== confirmacao) return setErro('As duas senhas não são iguais. Digite de novo.');

    setSalvando(true);
    const falha = await onSalvar(senha);
    setSalvando(false);
    if (falha) return setErro(falha);
    setPronta(true);
  };

  const campo =
    'w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-[#00687a]';

  return (
    <main className="min-h-screen bg-[#f7f9fb] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {pronta ? (
          <div className="text-center" role="status">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-600" aria-hidden="true" />
            <h1 className="text-xl font-bold text-[#091426] mb-2">Senha nova criada</h1>
            <p className="text-sm text-[#45474c] mb-6">
              Pronto. Da próxima vez, entre com seu e-mail e esta senha nova.
            </p>
            <button
              type="button"
              onClick={onConcluido}
              className="w-full py-2.5 rounded-xl bg-[#00687a] text-white text-sm font-bold hover:opacity-90"
            >
              Entrar no sistema
            </button>
          </div>
        ) : (
          <form onSubmit={salvar} noValidate>
            <div className="w-11 h-11 rounded-full bg-[#00687a]/10 flex items-center justify-center mb-4">
              <KeyRound className="w-5 h-5 text-[#00687a]" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold text-[#091426] mb-1">Crie sua nova senha</h1>
            <p className="text-sm text-[#45474c] mb-5">
              Use pelo menos {SENHA_MINIMA} caracteres. Misturar letras e números deixa a senha mais segura.
            </p>

            <label htmlFor="nova-senha" className="block text-xs font-bold text-slate-700 mb-1">
              Senha nova
            </label>
            <div className="relative mb-3">
              <input
                id="nova-senha"
                type={mostrar ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="new-password"
                autoFocus
                className={`${campo} pr-10`}
              />
              <button
                type="button"
                onClick={() => setMostrar((v) => !v)}
                aria-label={mostrar ? 'Esconder senha' : 'Mostrar senha'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {mostrar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <label htmlFor="confirmar-senha" className="block text-xs font-bold text-slate-700 mb-1">
              Repita a senha nova
            </label>
            <input
              id="confirmar-senha"
              type={mostrar ? 'text' : 'password'}
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              autoComplete="new-password"
              className={`${campo} mb-4`}
            />

            {erro && (
              <p role="alert" className="flex gap-2 items-start text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{erro}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={salvando}
              className="w-full py-2.5 rounded-xl bg-[#00687a] text-white text-sm font-bold hover:opacity-90 disabled:opacity-60"
            >
              {salvando ? 'Salvando…' : 'Salvar senha nova'}
            </button>

            <p className="flex gap-2 items-start text-xs text-[#45474c] mt-4">
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#00687a]" aria-hidden="true" />
              <span>Por segurança, o link do e-mail só serve para criar a senha. Você entra no sistema depois de salvar.</span>
            </p>

            <button
              type="button"
              onClick={onCancelar}
              disabled={salvando}
              className="w-full mt-3 text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Cancelar e voltar para Entrar
            </button>
          </form>
        )}
      </div>
    </main>
  );
};
