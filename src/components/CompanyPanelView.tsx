import React from 'react';
import { Appointment, Company, PaymentInvoice, ServiceItem, Student, TeacherProfile } from '../types';
import { computeCompanyStats, formatBRL, formatPercent, TeacherStats } from '../utils/companyStats';
import { getGreeting } from '../utils/names';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarDays,
  GraduationCap,
  TrendingUp,
  Users,
} from 'lucide-react';

interface CompanyPanelViewProps {
  company: Company | null;
  teachers: TeacherProfile[];
  appointments: Appointment[];
  students: Student[];
  invoices: PaymentInvoice[];
  services: ServiceItem[];
  /** Liberado pela empresa (companies.manager_sees_finance) */
  showFinance: boolean;
  managerName?: string;
  /** Entrar na operação de um professor específico */
  onOpenTeacher: (teacher: TeacherProfile) => void;
}

/**
 * Painel da academia: o resumo somado, e a porta de entrada para a agenda de
 * cada professor. É a primeira tela do gestor.
 */
export const CompanyPanelView: React.FC<CompanyPanelViewProps> = ({
  company,
  teachers,
  appointments,
  students,
  invoices,
  services,
  showFinance,
  managerName,
  onOpenTeacher,
}) => {
  const stats = computeCompanyStats(teachers, appointments, students, invoices, services, {
    includeFinance: showFinance,
  });

  const nomeEmpresa = company?.name || 'Minha academia';

  return (
    <main className="flex-1 p-4 md:p-10 bg-[#f7f9fb] pb-32 overflow-y-auto font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        <header className="space-y-1">
          <div className="flex items-center gap-2 text-[#00687a]">
            <Building2 className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Painel da academia</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#091426] tracking-tight">
            {getGreeting()}{managerName ? `, ${managerName}` : ''}
          </h1>
          <p className="text-sm text-[#45474c]">
            {nomeEmpresa} · {teachers.length} professor(es) ·{' '}
            {showFinance
              ? 'você tem acesso ao financeiro dos professores'
              : 'sem acesso ao financeiro dos professores'}
          </p>
        </header>

        {teachers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Nenhum professor nesta academia ainda</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Cadastre os professores em Usuários e permissões, vinculando cada um à empresa.
              Eles aparecem aqui assim que tiverem agenda.
            </p>
          </div>
        ) : (
          <>
            {/* Resumo somado */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Resumo da academia">
              <SummaryTile
                icon={<CalendarDays className="w-5 h-5" />}
                label="Aulas hoje"
                value={String(stats.totalAulasHoje)}
                hint={`${stats.totalAulasSemana} na semana`}
              />
              <SummaryTile
                icon={<Users className="w-5 h-5" />}
                label="Alunos ativos"
                value={String(stats.totalAlunos)}
                hint="somando os professores"
              />
              <SummaryTile
                icon={<TrendingUp className="w-5 h-5" />}
                label="Ocupação das turmas"
                value={formatPercent(stats.ocupacaoGeral)}
                hint={stats.ocupacaoGeral === null ? 'sem turmas nesta semana' : 'vagas preenchidas na semana'}
              />
              {showFinance ? (
                <SummaryTile
                  icon={<TrendingUp className="w-5 h-5" />}
                  label="A receber"
                  value={formatBRL(stats.totalAReceber || 0)}
                  hint={`${formatBRL(stats.totalRecebidoNoMes || 0)} recebido no mês`}
                  alert={Boolean(stats.totalVencidas && stats.totalVencidas > 0)}
                  alertText={stats.totalVencidas ? `${stats.totalVencidas} cobrança(s) vencida(s)` : undefined}
                />
              ) : (
                <SummaryTile
                  icon={<GraduationCap className="w-5 h-5" />}
                  label="Professores"
                  value={String(teachers.length)}
                  hint="nesta academia"
                />
              )}
            </section>

            {/* Professor a professor */}
            <section className="space-y-4" aria-label="Professores da academia">
              <h2 className="text-lg font-bold text-[#091426]">Por professor</h2>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3.5 px-5">Professor</th>
                        <th className="py-3.5 px-4 text-right">Hoje</th>
                        <th className="py-3.5 px-4 text-right">Semana</th>
                        <th className="py-3.5 px-4 text-right">Alunos</th>
                        <th className="py-3.5 px-4 text-right">Ocupação</th>
                        {showFinance && <th className="py-3.5 px-4 text-right">A receber</th>}
                        <th className="py-3.5 px-5 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats.teachers.map((t) => (
                        <TeacherRow
                          key={t.teacher.id}
                          stats={t}
                          showFinance={showFinance}
                          onOpen={() => onOpenTeacher(t.teacher)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Abrir um professor troca a academia inteira para a operação dele: agenda, alunos e
                serviços passam a ser os desse professor. O seletor no topo volta a qualquer momento.
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
};

const SummaryTile: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  alert?: boolean;
  alertText?: string;
}> = ({ icon, label, value, hint, alert, alertText }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-1">
    <div className="flex items-center justify-between text-[#00687a]">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      {icon}
    </div>
    <p className="text-2xl font-bold text-[#091426] tabular-nums">{value}</p>
    {alert && alertText ? (
      <p className="text-[11px] font-semibold text-rose-700 flex items-center gap-1">
        <AlertTriangle className="w-3.5 h-3.5" />
        {alertText}
      </p>
    ) : (
      <p className="text-[11px] text-slate-400">{hint}</p>
    )}
  </div>
);

const TeacherRow: React.FC<{
  stats: TeacherStats;
  showFinance: boolean;
  onOpen: () => void;
}> = ({ stats, showFinance, onOpen }) => {
  const { teacher } = stats;
  return (
    <tr className="hover:bg-slate-50/70 transition-colors">
      <td className="py-4 px-5">
        <div className="flex items-center gap-3">
          {teacher.avatarUrl ? (
            <img
              src={teacher.avatarUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#00687a]/10 text-[#00687a] flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-sm text-[#091426] truncate">{teacher.name}</p>
            <p className="text-slate-400 truncate">{teacher.specialty || teacher.role}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4 text-right tabular-nums font-semibold text-[#091426]">{stats.aulasHoje}</td>
      <td className="py-4 px-4 text-right tabular-nums text-slate-600">{stats.aulasSemana}</td>
      <td className="py-4 px-4 text-right tabular-nums text-slate-600">{stats.alunosAtivos}</td>
      <td className="py-4 px-4 text-right">
        <span className="tabular-nums text-slate-600">{formatPercent(stats.ocupacao)}</span>
        {stats.vagasOferecidas > 0 && (
          <span className="block text-[11px] text-slate-400 tabular-nums">
            {stats.vagasOcupadas}/{stats.vagasOferecidas} vagas
          </span>
        )}
      </td>
      {showFinance && (
        <td className="py-4 px-4 text-right">
          <span className="tabular-nums font-semibold text-[#091426]">
            {formatBRL(stats.aReceber || 0)}
          </span>
          {Boolean(stats.cobrancasVencidas) && (
            <span className="block text-[11px] font-semibold text-rose-700 tabular-nums">
              {stats.cobrancasVencidas} vencida(s)
            </span>
          )}
        </td>
      )}
      <td className="py-4 px-5 text-right">
        <button
          onClick={onOpen}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00687a] hover:bg-[#004e5c] text-white font-bold transition-colors"
        >
          <span>Abrir</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
};
