import React, { useState } from 'react';
import { Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { dataUrlKb, readImageResized } from '../utils/mediaAndTextHelpers';
import { supabaseService } from '../services/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';
import { SafeImage } from './SafeImage';

interface ImageFieldProps {
  label: string;
  /** Para que serve esta imagem, em uma linha */
  hint: string;
  value: string;
  onChange: (url: string) => void;
  /** Nome de quem aparece, para o espaço reservado das iniciais */
  fallbackName?: string;
  /** Maior lado depois de redimensionar. Foto de rosto não precisa de 1200. */
  maxSide?: number;
  /** 'circulo' para foto de pessoa, 'largo' para capa */
  shape?: 'circulo' | 'largo';
  /** Dono da imagem: define a pasta no Storage e a permissão de escrita */
  teacherId?: string;
  /** Nome do campo, para o arquivo ser reconhecível na pasta */
  campo?: string;
}

/**
 * Um campo de imagem: arquivo do computador ou endereço na internet.
 *
 * Existe porque só a logo tinha editor. A foto do professor e a capa da
 * vitrine não podiam ser trocadas em lugar nenhum -- ficavam no espaço
 * reservado com as iniciais, e a única saída era mexer no banco.
 *
 * O arquivo é reduzido antes de virar data URL. Sem isso, a foto do celular
 * viaja inteira para o banco e de lá para cada visitante do site.
 */
export const ImageField: React.FC<ImageFieldProps> = ({
  label,
  hint,
  value,
  onChange,
  fallbackName,
  maxSide = 1200,
  shape = 'largo',
  teacherId,
  campo = 'imagem',
}) => {
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const aoEscolherArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro(null);
    setCarregando(true);
    try {
      const preparada = await readImageResized(file, maxSide);

      /**
       * Storage primeiro; data URL só quando não há para onde subir.
       *
       * O data URL funciona, mas mora dentro da linha do professor: engorda
       * toda consulta e viaja inteiro para cada visitante. Com o balde, o
       * banco guarda um endereço curto e o arquivo vem por CDN.
       */
      if (isSupabaseConfigured && teacherId) {
        const url = await supabaseService.uploadImage(preparada.file, teacherId, campo);
        if (url) {
          onChange(url);
          return;
        }
        // Subir falhou (permissão, balde ausente, rede). Guardar embutido é
        // pior, mas é melhor que perder a imagem que a pessoa acabou de
        // escolher -- e o aviso diz o que aconteceu.
        setErro('Não consegui enviar a imagem para o servidor; ela ficou salva dentro do seu cadastro. Funciona, mas deixa o site mais pesado.');
      }

      onChange(preparada.dataUrl);
    } catch {
      setErro('Não foi possível ler esta imagem. Tente um arquivo JPG, PNG ou WebP.');
    } finally {
      setCarregando(false);
      // Permite escolher o MESMO arquivo de novo depois de remover
      e.target.value = '';
    }
  };

  const peso = value.startsWith('data:') ? dataUrlKb(value) : 0;

  return (
    <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
      <div>
        <h4 className="text-sm font-bold text-[#091426] flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-[#00687a]" />
          {label}
        </h4>
        <p className="text-[11px] text-slate-500 mt-0.5">{hint}</p>
      </div>

      <div className="flex items-center gap-4">
        <div
          className={`shrink-0 overflow-hidden bg-slate-100 ${
            shape === 'circulo' ? 'w-20 h-20 rounded-full' : 'w-32 h-20 rounded-xl'
          }`}
        >
          <SafeImage
            src={value}
            alt={label}
            fallbackName={fallbackName}
            className="object-cover w-full h-full"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <label className="px-4 py-2 bg-[#00687a] hover:bg-[#004e5c] text-white text-xs font-bold rounded-xl cursor-pointer transition-colors inline-flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            <span>{carregando ? 'Carregando…' : value ? 'Trocar imagem' : 'Escolher imagem'}</span>
            <input type="file" accept="image/*" onChange={aoEscolherArquivo} className="hidden" />
          </label>

          {value && (
            <button
              type="button"
              onClick={() => { onChange(''); setErro(null); }}
              className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-rose-700 rounded-xl border border-slate-200 hover:border-rose-200 inline-flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remover
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-slate-600">
          …ou cole o endereço de uma imagem
        </label>
        <input
          type="url"
          value={value.startsWith('data:') ? '' : value}
          onChange={(e) => { onChange(e.target.value); setErro(null); }}
          placeholder="https://…"
          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#00687a]"
        />
        {value.startsWith('data:') && (
          <p className="text-[11px] text-slate-400">
            Imagem enviada do computador{peso ? ` · ${peso} KB` : ''}.
          </p>
        )}
      </div>

      {erro && <p className="text-[11px] text-amber-700 leading-relaxed">{erro}</p>}
    </div>
  );
};
