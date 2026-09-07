import React from 'react';
import { Compass, LogIn } from 'lucide-react';

interface AddressNotFoundViewProps {
  /** O que a pessoa digitou: "joao.aquagenda.com.br" ou "joao" */
  endereco: string;
  onEnterApp: () => void;
}

/**
 * Endereço que não pertence a ninguém.
 *
 * Com o curinga no DNS, QUALQUER subdomínio chega até aqui -- inclusive erro
 * de digitação. Antes esta tela não existia e o visitante via a vitrine de um
 * professor de demonstração, achando que era o site de quem procurava.
 *
 * Diz o que aconteceu e para de vender: quem caiu aqui errou o endereço, não
 * está procurando a plataforma.
 */
export const AddressNotFoundView: React.FC<AddressNotFoundViewProps> = ({ endereco, onEnterApp }) => (
  <main className="min-h-screen bg-[#f7f9fb] flex items-center justify-center px-6 py-16">
    <div className="w-full max-w-md text-center">
      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-6">
        <Compass className="w-6 h-6 text-[#00687a]" />
      </div>

      <h1 className="text-2xl font-bold text-[#091426] mb-3">Este endereço não existe</h1>

      <p className="text-[#45474c] leading-relaxed mb-2">
        Não há nenhuma página em{' '}
        <span className="font-medium text-[#091426] break-all">{endereco}</span>.
      </p>
      <p className="text-sm text-slate-500 leading-relaxed mb-8">
        Confira se o endereço está escrito certo, ou peça o link a quem indicou.
      </p>

      <button
        type="button"
        onClick={onEnterApp}
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#00687a] text-white font-medium hover:bg-[#004e5c] transition-colors"
      >
        <LogIn className="w-4 h-4" />
        Entrar na minha conta
      </button>
    </div>
  </main>
);
