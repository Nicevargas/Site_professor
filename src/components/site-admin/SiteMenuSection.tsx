import React from 'react';
import { CurriculumItem, FaqItem, PhotoItem, ServiceItem, TeacherProfile, TestimonialItem, VideoItem } from '../../types';
import {
  chosenSections, moveSection, SITE_SECTIONS, SiteSectionId, sectionHasContent, sectionLabel,
} from '../../utils/siteSections';
import { AlertCircle, ArrowDown, ArrowUp, Check, LayoutList, Lock, RotateCcw } from 'lucide-react';

interface SiteMenuSectionProps {
  currentTeacher: TeacherProfile;
  curriculum: CurriculumItem[];
  services: ServiceItem[];
  videos: VideoItem[];
  photos: PhotoItem[];
  testimonials: TestimonialItem[];
  faqs: FaqItem[];
  onUpdateTeacher: (updated: TeacherProfile) => void;
}

/**
 * Seções da vitrine: quais aparecem, em que ordem e com que nome.
 *
 * A ordem definida aqui vale para o menu E para a página -- reordenar só o
 * menu faria os dois discordarem. Duas coisas decidem o que o visitante vê:
 * a escolha e existir conteúdo; a tela mostra as duas, para ninguém marcar
 * algo que não vai aparecer e achar que é defeito.
 */
export const SiteMenuSection: React.FC<SiteMenuSectionProps> = ({
  currentTeacher,
  curriculum,
  services,
  videos,
  photos,
  testimonials,
  faqs,
  onUpdateTeacher,
}) => {
  const conteudo = { curriculum, services, videos, photos, testimonials, faqs };
  const escolhidas = chosenSections(currentTeacher.siteSections);
  const rotulos = currentTeacher.siteSectionLabels || {};

  const definicao = (id: SiteSectionId) => SITE_SECTIONS.find((s) => s.id === id)!;

  const salvarOrdem = (proximas: SiteSectionId[]) =>
    onUpdateTeacher({ ...currentTeacher, siteSections: proximas });

  const alternar = (id: SiteSectionId) => {
    salvarOrdem(
      escolhidas.includes(id) ? escolhidas.filter((s) => s !== id) : [...escolhidas, id]
    );
  };

  const mover = (id: SiteSectionId, direcao: 'cima' | 'baixo') =>
    salvarOrdem(moveSection(escolhidas, id, direcao));

  const renomear = (id: SiteSectionId, valor: string) => {
    const proximos = { ...rotulos };
    // Guardar só o que foi trocado: rótulo igual ao padrão não vira dado
    if (!valor.trim() || valor.trim() === definicao(id).menuLabel) delete proximos[id];
    else proximos[id] = valor;
    onUpdateTeacher({ ...currentTeacher, siteSectionLabels: proximos });
  };

  // Ocultas ficam no fim, para as visíveis aparecerem na ordem real da página
  const ocultas = SITE_SECTIONS.filter((sec) => !escolhidas.includes(sec.id)).map((sec) => sec.id);
  const listadas: SiteSectionId[] = [...escolhidas, ...ocultas];

  const noMenu = escolhidas.filter((id) => sectionHasContent(id, conteudo));

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-[#00687a]">
          <LayoutList className="w-5 h-5" />
          <h2 className="text-lg font-bold text-[#091426]">Seções do site</h2>
        </div>
        <p className="text-sm text-[#45474c] max-w-2xl">
          Escolha o que aparece, em que ordem e com que nome. Desmarcar esconde a seção inteira,
          não só o link. A ordem daqui vale para o menu e para a página.
        </p>
      </header>

      <ol className="flex flex-col gap-3">
        {listadas.map((id) => {
          const sec = definicao(id);
          const marcada = escolhidas.includes(id);
          const temConteudo = sectionHasContent(id, conteudo);
          const aparece = marcada && temConteudo;
          const posicao = escolhidas.indexOf(id);
          const podeSubir = marcada && posicao > 1;
          const podeDescer = marcada && posicao > 0 && posicao < escolhidas.length - 1;

          return (
            <li
              key={id}
              className={`p-4 rounded-2xl border transition-all ${
                sec.alwaysOn
                  ? 'bg-slate-50 border-slate-200'
                  : aparece
                  ? 'bg-cyan-50/50 border-[#00687a]'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => !sec.alwaysOn && alternar(id)}
                  disabled={sec.alwaysOn}
                  aria-pressed={marcada}
                  aria-label={`${marcada ? 'Esconder' : 'Mostrar'} ${sec.menuLabel}`}
                  className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                    marcada ? 'bg-[#00687a] border-[#00687a] text-white' : 'bg-white border-slate-300'
                  } ${sec.alwaysOn ? 'cursor-default' : ''}`}
                >
                  {sec.alwaysOn ? <Lock className="w-3 h-3" /> : marcada ? <Check className="w-3.5 h-3.5" /> : null}
                </button>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={sectionLabel(id, rotulos)}
                      onChange={(e) => renomear(id, e.target.value)}
                      aria-label={`Nome de ${sec.menuLabel} no menu`}
                      className="min-w-0 flex-1 px-2.5 py-1.5 text-sm font-bold text-[#091426] bg-transparent border border-transparent rounded-lg hover:border-slate-300 focus:bg-white focus:border-[#00687a] focus:outline-none"
                    />
                    {rotulos[id] && (
                      <button
                        type="button"
                        onClick={() => renomear(id, '')}
                        title={`Voltar para "${sec.menuLabel}"`}
                        aria-label={`Restaurar o nome padrão de ${sec.menuLabel}`}
                        className="p-1.5 text-slate-400 hover:text-[#00687a] shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {sec.alwaysOn ? (
                    <p className="text-xs text-slate-500">Sempre visível, sempre no topo: é a sua apresentação.</p>
                  ) : !temConteudo ? (
                    <p className="flex items-center gap-1.5 text-xs text-amber-700">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Sem {sec.needs.toLowerCase()} — não aparece nem marcada
                    </p>
                  ) : marcada ? (
                    <p className="text-xs text-emerald-700">Aparecendo no site</p>
                  ) : (
                    <p className="text-xs text-slate-500">Escondida do site</p>
                  )}
                </div>

                {/* Setas em vez de arrastar: funcionam no toque e no teclado */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => mover(id, 'cima')}
                    disabled={!podeSubir}
                    aria-label={`Mover ${sec.menuLabel} para cima`}
                    className="p-1.5 rounded-lg text-slate-500 enabled:hover:bg-slate-100 enabled:hover:text-[#00687a] disabled:opacity-25"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(id, 'baixo')}
                    disabled={!podeDescer}
                    aria-label={`Mover ${sec.menuLabel} para baixo`}
                    className="p-1.5 rounded-lg text-slate-500 enabled:hover:bg-slate-100 enabled:hover:text-[#00687a] disabled:opacity-25"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="p-4 rounded-2xl bg-[#f7f9fb] border border-slate-200">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
          Como o menu fica hoje
        </p>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-[#45474c]">
          {noMenu.map((id) => (
            <span key={id}>{sectionLabel(id, rotulos)}</span>
          ))}
        </nav>
        {noMenu.length === 1 && (
          <p className="text-xs text-slate-500 mt-2">
            Só o Início por enquanto. Cadastre serviços, vídeos ou depoimentos e as seções
            aparecem sozinhas.
          </p>
        )}
      </div>
    </div>
  );
};
