import React, { useMemo } from 'react';
import { AlertTriangle, BarChart3, TrendingDown, Users } from 'lucide-react';
import { Company, Student, SystemUser, TeacherProfile } from '../types';
import {
  ConteudoDoProfessor, contarPorPapel, funilDeAtivacao, maiorQueda,
  perfisIncompletos, preenchimentoDosPerfis,
} from '../utils/metricasPlataforma';

interface AdminMetricsViewProps {
  systemUsers: SystemUser[];
  teachers: TeacherProfile[];
  companies: Company[];
  students: Student[];
  conteudo: ConteudoDoProfessor;
}

const Barra: React.FC<{ percentual: number; tom?: 'normal' | 'alerta' }> = ({ percentual, tom = 'normal' }) => (
  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
    <div
      className={`h-full rounded-full transition-all ${
        tom === 'alerta' ? 'bg-amber-500' : 'bg-[#00687a]'
      }`}
      style={{ width: `${Math.max(percentual, percentual > 0 ? 2 : 0)}%` }}
    />
  </div>
);

/**
 * O que está acontecendo na plataforma, para quem administra.
 *
 * A pergunta desta tela não é "quantos cadastros temos". É "em que passo as
 * pessoas param". Um campo que 90% deixou em branco não é descuido de 90%
 * das pessoas -- é a tela pedindo algo que ninguém entende ou não acha.
 */
export const AdminMetricsView: React.FC<AdminMetricsViewProps> = ({
  systemUsers,
  teachers,
  companies,
  students,
  conteudo,
}) => {
  const porPapel = useMemo(() => contarPorPapel(systemUsers), [systemUsers]);
  const preenchimento = useMemo(
    () => preenchimentoDosPerfis(teachers, conteudo),
    [teachers, conteudo]
  );
  const degraus = useMemo(
    () => funilDeAtivacao(teachers, conteudo, students),
    [teachers, conteudo, students]
  );
  const pior = useMemo(() => maiorQueda(degraus), [degraus]);
  const perfis = useMemo(() => perfisIncompletos(teachers, conteudo), [teachers, conteudo]);

  const completosDeVerdade = perfis.filter((p) => p.percentual === 100).length;

  return (
    <div className="space-y-6 pb-10">
      <header>
        <h1 className="text-2xl font-bold text-[#091426] flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[#00687a]" />
          Painel da plataforma
        </h1>
        <p className="text-sm text-[#45474c] mt-1 max-w-2xl">
          Quem está cadastrado, o quanto cada perfil está preenchido e onde as pessoas
          param. Visível só para administradores.
        </p>
      </header>

      {/* ============ CADASTROS POR PERFIL ============ */}
      <section className="bg-white p-5 rounded-2xl border border-slate-200" aria-labelledby="por-papel">
        <h2 id="por-papel" className="text-sm font-bold text-[#091426] flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-[#00687a]" />
          Cadastros por perfil
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {porPapel.map((p) => (
            <div key={p.papel} className="p-4 rounded-xl border border-slate-200">
              <div className="text-2xl font-bold text-[#091426]">{p.total}</div>
              <div className="text-xs font-semibold text-[#45474c] mt-0.5">{p.rotulo}</div>
              {p.total > p.ativos && (
                <div className="text-[11px] text-amber-700 mt-1">
                  {p.total - p.ativos} não {p.total - p.ativos === 1 ? 'está ativo' : 'estão ativos'}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          {[
            { rotulo: 'Vitrines de professor', valor: teachers.length },
            { rotulo: 'Academias', valor: companies.length },
            { rotulo: 'Alunos cadastrados', valor: students.length },
            { rotulo: 'Perfis 100% completos', valor: completosDeVerdade },
          ].map((c) => (
            <div key={c.rotulo} className="p-4 rounded-xl bg-[#f7f9fb] border border-slate-200">
              <div className="text-xl font-bold text-[#091426]">{c.valor}</div>
              <div className="text-[11px] text-[#45474c] mt-0.5">{c.rotulo}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ ONDE PARAM ============ */}
      <section className="bg-white p-5 rounded-2xl border border-slate-200" aria-labelledby="funil">
        <h2 id="funil" className="text-sm font-bold text-[#091426] flex items-center gap-2 mb-1">
          <TrendingDown className="w-4 h-4 text-[#00687a]" />
          Onde as pessoas param
        </h2>
        <p className="text-xs text-[#45474c] mb-4">
          Cada degrau conta só quem passou pelo anterior.
        </p>

        {pior && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              A maior perda é em <strong>{pior.rotulo.toLowerCase()}</strong>: de {pior.base} que
              chegaram, {pior.quantos} passaram. {pior.significa}
            </span>
          </div>
        )}

        <ol className="space-y-3">
          {degraus.map((d) => {
            const pct = d.base ? Math.round((d.quantos / d.base) * 100) : 0;
            return (
              <li key={d.rotulo}>
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <span className="text-xs font-semibold text-[#091426]">{d.rotulo}</span>
                  <span className="text-xs text-[#45474c] shrink-0">
                    {d.quantos}
                    <span className="text-slate-400"> de {d.base}</span>
                  </span>
                </div>
                <Barra percentual={pct} tom={pct < 50 ? 'alerta' : 'normal'} />
                <p className="text-[11px] text-slate-500 mt-1">{d.significa}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ============ PREENCHIMENTO ============ */}
      <section className="bg-white p-5 rounded-2xl border border-slate-200" aria-labelledby="preench">
        <h2 id="preench" className="text-sm font-bold text-[#091426] mb-1">
          O que falta nos perfis
        </h2>
        <p className="text-xs text-[#45474c] mb-4">
          Do mais esquecido para o mais feito. O topo é onde a plataforma está difícil.
        </p>

        <ul className="space-y-3">
          {preenchimento.map((item) => (
            <li key={item.id}>
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <span className="text-xs font-semibold text-[#091426]">{item.rotulo}</span>
                <span className="text-xs text-[#45474c] shrink-0">
                  {item.preenchidos}
                  <span className="text-slate-400"> de {item.total}</span>
                  <span className="ml-2 font-semibold">{item.percentual}%</span>
                </span>
              </div>
              <Barra percentual={item.percentual} tom={item.percentual < 50 ? 'alerta' : 'normal'} />
              <p className="text-[11px] text-slate-500 mt-1">{item.porque}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ============ QUEM PRECISA DE AJUDA ============ */}
      <section className="bg-white p-5 rounded-2xl border border-slate-200" aria-labelledby="quem">
        <h2 id="quem" className="text-sm font-bold text-[#091426] mb-1">
          Quem precisa de ajuda
        </h2>
        <p className="text-xs text-[#45474c] mb-4">
          Do perfil menos completo para o mais completo.
        </p>

        {perfis.length === 0 ? (
          <p className="text-xs text-slate-500">Nenhum professor cadastrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-3 font-bold">Professor</th>
                  <th className="py-2 pr-3 font-bold whitespace-nowrap">Completo</th>
                  <th className="py-2 font-bold">O que falta</th>
                </tr>
              </thead>
              <tbody>
                {perfis.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 align-top">
                    <td className="py-2.5 pr-3">
                      <div className="font-semibold text-[#091426]">{p.nome}</div>
                      {p.email && <div className="text-[11px] text-slate-400">{p.email}</div>}
                    </td>
                    <td className="py-2.5 pr-3 whitespace-nowrap">
                      <span
                        className={`font-bold ${
                          p.percentual < 50 ? 'text-amber-700' : 'text-[#00687a]'
                        }`}
                      >
                        {p.percentual}%
                      </span>
                      <span className="text-slate-400"> ({p.resolvidos}/{p.totalItens})</span>
                    </td>
                    <td className="py-2.5 text-[#45474c]">
                      {p.faltando.length === 0 ? (
                        <span className="text-emerald-700 font-semibold">Nada — perfil completo</span>
                      ) : (
                        p.faltando.join(' · ')
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
