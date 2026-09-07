import React from 'react';
import { CurriculumItem, FaqItem, PhotoItem, ServiceItem, TeacherProfile, TestimonialItem, VideoItem } from '../../types';
import { chosenSections, SITE_SECTIONS, SiteSectionId, sectionHasContent } from '../../utils/siteSections';
import { AlertCircle, Check, LayoutList, Lock } from 'lucide-react';

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
 * Escolha das seções que aparecem no menu e na página da vitrine.
 *
 * Duas coisas decidem o que o visitante vê: a escolha aqui e existir
 * conteúdo. Por isso a tela mostra as duas, em vez de deixar o professor
 * marcar algo que não vai aparecer e achar que é defeito.
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

  const alternar = (id: SiteSectionId) => {
    const proximas = escolhidas.includes(id)
      ? escolhidas.filter((s) => s !== id)
      : [...escolhidas, id];
    onUpdateTeacher({ ...currentTeacher, siteSections: proximas });
  };

  const noMenu = SITE_SECTIONS.filter(
    (sec) => escolhidas.includes(sec.id) && sectionHasContent(sec.id, conteudo)
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-[#00687a]">
          <LayoutList className="w-5 h-5" />
          <h2 className="text-lg font-bold text-[#091426]">Seções do site</h2>
        </div>
        <p className="text-sm text-[#45474c] max-w-2xl">
          Escolha o que aparece no menu e na página. Desmarcar esconde a seção inteira, não só o
          link — quem só dá aula particular não precisa de galeria de fotos.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SITE_SECTIONS.map((sec) => {
          const marcada = escolhidas.includes(sec.id);
          const temConteudo = sectionHasContent(sec.id, conteudo);
          const aparece = marcada && temConteudo;

          return (
            <label
              key={sec.id}
              className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                sec.alwaysOn
                  ? 'bg-slate-50 border-slate-200 cursor-default'
                  : aparece
                  ? 'bg-cyan-50/50 border-[#00687a]'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={marcada}
                disabled={sec.alwaysOn}
                onChange={() => !sec.alwaysOn && alternar(sec.id)}
              />

              <span
                className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                  marcada ? 'bg-[#00687a] border-[#00687a] text-white' : 'bg-white border-slate-300'
                }`}
                aria-hidden="true"
              >
                {sec.alwaysOn ? <Lock className="w-3 h-3" /> : marcada ? <Check className="w-3.5 h-3.5" /> : null}
              </span>

              <span className="min-w-0">
                <span className="block font-bold text-sm text-[#091426]">{sec.menuLabel}</span>

                {sec.alwaysOn ? (
                  <span className="block text-xs text-slate-500 mt-0.5">
                    Sempre visível: é a sua apresentação.
                  </span>
                ) : !temConteudo ? (
                  <span className="flex items-center gap-1.5 text-xs text-amber-700 mt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Sem {sec.needs.toLowerCase()} — não aparece nem marcada
                  </span>
                ) : marcada ? (
                  <span className="block text-xs text-emerald-700 mt-0.5">Aparecendo no site</span>
                ) : (
                  <span className="block text-xs text-slate-500 mt-0.5">Escondida do site</span>
                )}
              </span>
            </label>
          );
        })}
      </div>

      <div className="p-4 rounded-2xl bg-[#f7f9fb] border border-slate-200">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
          Como o menu fica hoje
        </p>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-[#45474c]">
          {noMenu.map((sec) => (
            <span key={sec.id}>{sec.menuLabel}</span>
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
