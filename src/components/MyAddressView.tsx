import React, { useState } from 'react';
import { TeacherProfile, UserRole, Company } from '../types';
import {
  Link2, Check, Copy, ExternalLink, Lock, AlertTriangle, ArrowUpRight, Globe, ShieldCheck,
} from 'lucide-react';
import {
  PLANS, PLAN_ORDER, PlanTier, AddressingMode, effectivePlan,
  getPlan, planAllows, planRequiredFor, nextPlan,
} from '../utils/plans';
import { buildPublicUrl, slugify, PLATFORM_HOST } from '../utils/tenant';

interface MyAddressViewProps {
  currentTeacher: TeacherProfile;
  /** Papel de quem está olhando: só admin troca o plano */
  userRole: UserRole;
  onUpdateTeacher: (updated: TeacherProfile) => void;
  onOpenPlans: () => void;
  /** Identificadores já em uso, para avisar antes de salvar */
  takenSlugs?: string[];
  /** Empresa do professor, quando ele pertence a uma; ela é quem assina */
  company?: Company | null;
}

const platform = PLATFORM_HOST || 'aquagenda.com.br';

export const MyAddressView: React.FC<MyAddressViewProps> = ({
  currentTeacher,
  userRole,
  onUpdateTeacher,
  onOpenPlans,
  takenSlugs = [],
  company = null,
}) => {
  // A empresa manda quando existe: numa academia quem assina é a academia
  const { plan, source: planSource, companyName } = effectivePlan(currentTeacher, company);
  const planTier = plan.tier;
  const fallbackSlug = currentTeacher.slug || slugify(currentTeacher.name);

  const [slug, setSlug] = useState(fallbackSlug);
  const [domain, setDomain] = useState(currentTeacher.customDomain || '');
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const isAdmin = userRole === 'admin';
  const activeMode: AddressingMode =
    currentTeacher.customDomain && planAllows(planTier, 'domain')
      ? 'domain'
      : planAllows(planTier, 'subdomain')
      ? 'subdomain'
      : 'path';

  const liveUrl = buildPublicUrl(activeMode, {
    slug: currentTeacher.slug || fallbackSlug,
    domain: currentTeacher.customDomain,
    platformHost: platform,
  });

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSaveSlug = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = slugify(slug);
    if (!clean || clean.length < 2) {
      setError('Use pelo menos duas letras ou números.');
      return;
    }
    const conflicts = takenSlugs.some(
      (s) => s.toLowerCase() === clean && s.toLowerCase() !== (currentTeacher.slug || '').toLowerCase()
    );
    if (conflicts) {
      setError('Esse endereço já está em uso por outro professor. Escolha outro.');
      return;
    }
    setError(null);
    setSlug(clean);
    onUpdateTeacher({ ...currentTeacher, slug: clean });
    flash();
  };

  const handleSaveDomain = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (clean && !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(clean)) {
      setError('Informe só o endereço, sem https:// e sem barras. Ex: profroberto.com.br');
      return;
    }
    setError(null);
    setDomain(clean);
    onUpdateTeacher({
      ...currentTeacher,
      customDomain: clean || undefined,
      customDomainStatus: clean ? 'pendente' : 'nenhum',
    });
    flash();
  };

  const handleChangePlan = (tier: PlanTier) => {
    if (!isAdmin) return;
    const updated: TeacherProfile = { ...currentTeacher, plan: tier };
    // Rebaixar de plano não pode deixar um domínio próprio ativo para trás
    if (tier !== 'premium' && updated.customDomain) {
      updated.customDomain = undefined;
      updated.customDomainStatus = 'nenhum';
      setDomain('');
    }
    onUpdateTeacher(updated);
    flash();
  };

  const inputClass =
    'w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#57dffe] focus:border-[#00687a]';
  const card = 'bg-white rounded-2xl border border-slate-200 shadow-card p-6';

  return (
    <main className="flex-1 overflow-y-auto bg-[#f7f9fb] p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6 pb-20">
        <header>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#091426] tracking-tight flex items-center gap-2.5">
            <Link2 className="w-6 h-6 text-[#00687a]" />
            Meu endereço
          </h1>
          <p className="text-sm text-[#45474c] mt-1">
            É o link que você manda para os alunos e coloca nas redes sociais. O que ele pode ser
            depende do seu plano.
          </p>
        </header>

        {saved && (
          <div role="status" className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <Check className="w-4 h-4" />
            Endereço atualizado.
          </div>
        )}

        {error && (
          <div role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Endereço em uso */}
        <section className={card} aria-label="Endereço em uso">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#75777d]">Endereço em uso</p>
              <p className="text-lg font-bold text-[#091426] mt-1 break-all">{liveUrl}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => copy(liveUrl, 'live')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {copied === 'live' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'live' ? 'Copiado' : 'Copiar'}
              </button>
              <a
                href={liveUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#00687a] hover:bg-[#004e5c] text-white text-xs font-bold transition-colors"
              >
                Abrir <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
          <p className="text-xs text-[#45474c] mt-3 pt-3 border-t border-slate-100">
            Plano <strong className="text-[#00687a]">{plan.name}</strong>
            {planSource === 'empresa' && companyName ? (
              <> &middot; assinatura de <strong>{companyName}</strong></>
            ) : null}
            {' '}&middot; {plan.addressingHint}
          </p>
        </section>

        {/* Identificador */}
        <section className={card} aria-label="Seu identificador">
          <h2 className="text-sm font-bold text-[#091426]">Seu identificador</h2>
          <p className="text-xs text-[#45474c] mt-1 mb-4">
            Aparece no endereço nos planos Start e Pro. Mude com cuidado: os links já compartilhados
            deixam de funcionar.
          </p>
          <form onSubmit={handleSaveSlug} className="flex flex-col sm:flex-row gap-2.5 sm:items-end">
            <div className="flex-1">
              <label htmlFor="slug" className="block text-xs font-semibold text-slate-700 mb-1">
                Identificador
              </label>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setError(null); }}
                placeholder="roberto-almeida"
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#00687a] hover:bg-[#004e5c] text-white text-xs font-bold transition-colors shrink-0"
            >
              Salvar
            </button>
          </form>
          <p className="text-[11px] text-[#75777d] mt-2 font-mono break-all">
            {buildPublicUrl(planAllows(currentTeacher.plan, 'subdomain') ? 'subdomain' : 'path', {
              slug: slugify(slug) || 'seu-nome',
              platformHost: platform,
            })}
          </p>
        </section>

        {/* Domínio próprio */}
        <section className={card} aria-label="Domínio próprio">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#00687a]" />
            <h2 className="text-sm font-bold text-[#091426]">Domínio próprio</h2>
            {!planAllows(currentTeacher.plan, 'domain') && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                <Lock className="w-3 h-3" />
                Plano {planRequiredFor('domain').name}
              </span>
            )}
          </div>

          {planAllows(currentTeacher.plan, 'domain') ? (
            <>
              <p className="text-xs text-[#45474c] mt-1 mb-4">
                Informe o domínio que você comprou. Depois de salvar, aponte o DNS dele para o
                Aquagenda seguindo as instruções que aparecem aqui.
              </p>
              <form onSubmit={handleSaveDomain} className="flex flex-col sm:flex-row gap-2.5 sm:items-end">
                <div className="flex-1">
                  <label htmlFor="domain" className="block text-xs font-semibold text-slate-700 mb-1">
                    Domínio
                  </label>
                  <input
                    id="domain"
                    type="text"
                    value={domain}
                    onChange={(e) => { setDomain(e.target.value); setError(null); }}
                    placeholder="profrobertoalmeida.com.br"
                    className={inputClass}
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#00687a] hover:bg-[#004e5c] text-white text-xs font-bold transition-colors shrink-0"
                >
                  Salvar
                </button>
              </form>

              {currentTeacher.customDomain && (
                <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Aguardando a configuração do DNS
                  </p>
                  <p className="text-[11px] text-amber-800 mt-1">
                    No painel onde você registrou o domínio, crie os registros abaixo. A verificação
                    automática entra na próxima etapa do projeto.
                  </p>
                  <pre className="mt-2.5 p-2.5 bg-white/70 rounded-lg text-[11px] font-mono text-amber-900 overflow-x-auto">
{`www  CNAME  ${platform}.
@    A      <ip-da-plataforma>`}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-[#45474c] mt-2">
              No plano {planRequiredFor('domain').name} você usa o domínio que comprou, e o nome do
              Aquagenda não aparece no endereço dos seus alunos.
            </p>
          )}
        </section>

        {/* Planos */}
        <section className={card} aria-label="Planos">
          <h2 className="text-sm font-bold text-[#091426]">
            {isAdmin ? 'Plano do professor' : 'Seu plano'}
          </h2>
          <p className="text-xs text-[#45474c] mt-1 mb-4">
            {isAdmin
              ? 'Somente administradores mudam o plano. A troca vale na hora.'
              : 'Cada plano libera um tipo de endereço.'}
          </p>

          {planSource === 'empresa' && (
            <p className="mb-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#45474c]">
              Quem assina é <strong>{companyName}</strong>, e o plano vale para todos os professores da
              academia. Para mudar de plano, fale com a administração.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {PLAN_ORDER.map((tier) => {
              const def = PLANS[tier];
              const isCurrent = def.tier === plan.tier;
              return (
                <div
                  key={tier}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCurrent ? 'border-[#00687a] bg-cyan-50/60 ring-1 ring-[#00687a]' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-bold text-[#091426]">{def.name}</span>
                    <span className="text-[11px] text-[#45474c]">R$ {def.priceMonth}/mês</span>
                  </div>
                  <p className="text-[11px] font-semibold text-[#00687a] mt-1.5">{def.addressingLabel}</p>
                  <p className="text-[11px] text-[#45474c] mt-0.5 leading-snug">{def.addressingHint}</p>

                  {isCurrent ? (
                    <p className="mt-2.5 text-[10px] font-bold uppercase tracking-wider text-[#00687a]">Plano atual</p>
                  ) : planSource === 'empresa' ? null : isAdmin ? (
                    <button
                      onClick={() => handleChangePlan(tier)}
                      className="mt-2.5 w-full py-1.5 rounded-lg border border-slate-300 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Mudar para {def.name}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>

          {!isAdmin && nextPlan(currentTeacher.plan) && (
            <button
              onClick={onOpenPlans}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#00687a] hover:underline"
            >
              Ver o que muda no plano {nextPlan(currentTeacher.plan)!.name}
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </section>
      </div>
    </main>
  );
};
