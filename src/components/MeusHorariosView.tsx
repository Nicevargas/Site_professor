import React, { useMemo, useState } from 'react';
import { AlertTriangle, Check, Clock, Copy, Plus, X } from 'lucide-react';
import { DiaDaSemana, GradeSemanal, TeacherProfile } from '../types';
import {
  DIAS,
  adicionarHorario,
  copiarHorarios,
  diasQueSeraoSubstituidos,
  gradeEfetiva,
  horarioValido,
  horariosDoDia,
  listaDeDias,
  mesmaGrade,
  nomeDoDia,
  normalizarGrade,
  removerHorario,
} from '../utils/gradeSemanal';

interface MeusHorariosViewProps {
  currentTeacher: TeacherProfile;
  /** Grava a grade; devolve se deu certo */
  onSalvar: (grade: GradeSemanal) => Promise<boolean>;
}

const DIAS_UTEIS: DiaDaSemana[] = [1, 2, 3, 4, 5];

/**
 * "Horários de aula": os horários que o aluno vê para agendar pelo site.
 *
 * Cadastrar dia por dia era repetitivo -- a maioria dá aula nos mesmos
 * horários vários dias da semana. Por isso, ao adicionar um horário, a tela
 * pergunta se ele vale também para outros dias, e copia de uma vez.
 */
export const MeusHorariosView: React.FC<MeusHorariosViewProps> = ({ currentTeacher, onSalvar }) => {
  const usandoPadrao = currentTeacher.horariosAula == null;
  // Retrato de quando a tela abriu: a base para "desfazer"
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const inicial = useMemo(() => gradeEfetiva(currentTeacher.horariosAula), []);

  const [grade, setGrade] = useState<GradeSemanal>(inicial);
  const [gravada, setGravada] = useState<GradeSemanal | null>(usandoPadrao ? null : inicial);
  const [novos, setNovos] = useState<Partial<Record<number, string>>>({});
  const [avisoDia, setAvisoDia] = useState<{ dia: number; texto: string } | null>(null);
  const [pergunta, setPergunta] = useState<{ origem: DiaDaSemana; destinos: DiaDaSemana[] } | null>(null);
  const [copiados, setCopiados] = useState<string | null>(null);
  const [estado, setEstado] = useState<'parado' | 'salvando' | 'salvo' | 'erro'>('parado');

  // Nunca salvou = há o que salvar, mesmo sem mexer (confirma a grade padrão)
  const alterada = gravada === null || !mesmaGrade(grade, gravada);
  const diferenteDoInicio = !mesmaGrade(grade, gravada ?? inicial);
  const semNenhumHorario = DIAS.every(({ dia }) => horariosDoDia(grade, dia).length === 0);

  const mexeu = () => {
    setEstado('parado');
    setCopiados(null);
  };

  const adicionar = (dia: DiaDaSemana) => {
    const hora = (novos[dia] || '').trim();
    if (!horarioValido(hora)) {
      setAvisoDia({ dia, texto: 'Escolha um horário antes de adicionar.' });
      return;
    }
    if (horariosDoDia(grade, dia).includes(hora)) {
      setAvisoDia({ dia, texto: `${hora} já está em ${nomeDoDia(dia)}.` });
      return;
    }
    setGrade((g) => adicionarHorario(g, dia, hora));
    setNovos((n) => ({ ...n, [dia]: '' }));
    setAvisoDia(null);
    mexeu();
    // A pergunta do pedido: esses horários valem para outros dias também?
    setPergunta((p) => (p && p.origem === dia ? p : { origem: dia, destinos: [] }));
  };

  const remover = (dia: DiaDaSemana, hora: string) => {
    const nova = removerHorario(grade, dia, hora);
    setGrade(nova);
    mexeu();
    if (pergunta?.origem === dia && horariosDoDia(nova, dia).length === 0) setPergunta(null);
  };

  const alternarDestino = (dia: DiaDaSemana) => {
    setPergunta((p) =>
      p ? { ...p, destinos: p.destinos.includes(dia) ? p.destinos.filter((d) => d !== dia) : [...p.destinos, dia] } : p
    );
  };

  const marcarDiasUteis = () => {
    setPergunta((p) => (p ? { ...p, destinos: DIAS_UTEIS.filter((d) => d !== p.origem) } : p));
  };

  const aplicarCopia = () => {
    if (!pergunta || pergunta.destinos.length === 0) return;
    setGrade((g) => copiarHorarios(g, pergunta.origem, pergunta.destinos));
    setPergunta(null);
    setEstado('parado');
    setCopiados(
      `Horários de ${nomeDoDia(pergunta.origem)} copiados para ${listaDeDias(pergunta.destinos)}. Falta clicar em "Salvar horários".`
    );
  };

  const salvar = async () => {
    const limpa = normalizarGrade(grade);
    setEstado('salvando');
    let ok = false;
    try {
      ok = await onSalvar(limpa);
    } catch {
      ok = false;
    }
    if (ok) {
      setGrade(limpa);
      setGravada(limpa);
      setCopiados(null);
      setEstado('salvo');
    } else {
      setEstado('erro');
    }
  };

  const desfazer = () => {
    setGrade(gravada ?? inicial);
    setPergunta(null);
    setAvisoDia(null);
    mexeu();
  };

  const card = 'bg-white rounded-2xl border border-slate-200 shadow-card p-5';
  const botaoSecundario =
    'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50';
  const botaoPrimario =
    'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00687a] hover:bg-[#004e5c] text-white text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <main className="flex-1 overflow-y-auto bg-[#f7f9fb] p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-4 pb-28">
        <header className="mb-2">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#091426] tracking-tight flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-[#00687a]" />
            Horários de aula
          </h1>
          <p className="text-sm text-[#45474c] mt-1">
            Escolha os horários em que você dá aula em cada dia. São eles que o aluno vê para agendar pelo seu
            site. Mudar os horários não mexe nas aulas que já estão marcadas.
          </p>
        </header>

        {usandoPadrao && (
          <div role="status" className="flex items-start gap-2 p-3 rounded-xl bg-cyan-50 border border-[#57dffe] text-[#00505e] text-xs">
            <Clock className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Você ainda não definiu seus horários. Até salvar, o site mostra o horário padrão: segunda a sexta,
              às 09:00, 10:30, 14:00, 15:30 e 17:00.
            </span>
          </div>
        )}

        {DIAS.map(({ dia, nome }) => {
          const horarios = horariosDoDia(grade, dia);
          const perguntaAqui = pergunta?.origem === dia && horarios.length > 0 ? pergunta : null;
          const substituidos = perguntaAqui ? diasQueSeraoSubstituidos(grade, dia, perguntaAqui.destinos) : [];
          return (
            <section key={dia} className={card} aria-label={nome}>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-sm font-bold text-[#091426] w-24 shrink-0">{nome}</h2>
                <div className="flex flex-wrap gap-2 flex-1 min-w-0">
                  {horarios.length === 0 ? (
                    <span className="text-xs text-slate-400">Sem aula</span>
                  ) : (
                    horarios.map((h) => (
                      <span
                        key={h}
                        className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-full bg-[#00687a]/10 text-[#00505e] text-xs font-semibold"
                      >
                        {h}
                        <button
                          type="button"
                          onClick={() => remover(dia, h)}
                          aria-label={`Remover ${h} de ${nome}`}
                          className="p-0.5 rounded-full hover:bg-[#00687a]/20"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="time"
                  aria-label={`Novo horário para ${nome}`}
                  value={novos[dia] || ''}
                  onChange={(e) => {
                    setNovos((n) => ({ ...n, [dia]: e.target.value }));
                    if (avisoDia?.dia === dia) setAvisoDia(null);
                  }}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
                />
                <button
                  type="button"
                  onClick={() => adicionar(dia)}
                  aria-label={`Adicionar horário em ${nome}`}
                  className={botaoSecundario}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar
                </button>
                {horarios.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPergunta({ origem: dia, destinos: [] })}
                    aria-label={`Repetir horários de ${nome} em outros dias`}
                    className={botaoSecundario}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Repetir em outros dias
                  </button>
                )}
              </div>

              {avisoDia?.dia === dia && (
                <p role="alert" className="mt-2 text-xs text-rose-700">
                  {avisoDia.texto}
                </p>
              )}

              {perguntaAqui && (
                <div
                  role="group"
                  aria-label={`Repetir horários de ${nome}`}
                  className="mt-4 p-4 rounded-xl bg-cyan-50 border border-[#57dffe]"
                >
                  <p className="text-sm font-semibold text-[#00505e]">
                    Quer usar os mesmos horários de {nome} ({horarios.join(', ')}) em outros dias?
                  </p>
                  <p className="text-xs text-[#45474c] mt-1">Marque os dias. Assim você não precisa cadastrar um por um.</p>

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {DIAS.filter((d) => d.dia !== dia).map((d) => (
                      <label
                        key={d.dia}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={perguntaAqui.destinos.includes(d.dia)}
                          onChange={() => alternarDestino(d.dia)}
                          className="accent-[#00687a]"
                        />
                        {d.nome}
                      </label>
                    ))}
                    <button type="button" onClick={marcarDiasUteis} className="text-xs font-semibold text-[#00687a] underline px-1">
                      Marcar segunda a sexta
                    </button>
                  </div>

                  {substituidos.length > 0 && (
                    <p className="flex items-start gap-2 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mt-3">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        {listaDeDias(substituidos)} {substituidos.length > 1 ? 'já têm' : 'já tem'} horários. Eles serão
                        trocados pelos de {nome}.
                      </span>
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      onClick={aplicarCopia}
                      disabled={perguntaAqui.destinos.length === 0}
                      className={botaoPrimario}
                    >
                      Usar nos dias marcados
                    </button>
                    <button type="button" onClick={() => setPergunta(null)} className={botaoSecundario}>
                      Não, só {nome}
                    </button>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Barra de salvar: sempre à vista, a tela é comprida */}
      <div className="sticky bottom-0 -mx-4 md:-mx-8 px-4 md:px-8 py-3 bg-white/95 backdrop-blur border-t border-slate-200">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs min-w-0 flex-1">
            {estado === 'salvo' && (
              <p role="status" className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <Check className="w-4 h-4" />
                Horários salvos. O agendamento do seu site já usa esses horários.
              </p>
            )}
            {estado === 'erro' && (
              <p role="alert" className="flex items-start gap-1.5 text-rose-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Não foi possível salvar agora. Seus horários continuam aqui na tela; tente de novo em instantes.
              </p>
            )}
            {estado !== 'salvo' && estado !== 'erro' && copiados && (
              <p role="status" className="text-[#00505e]">{copiados}</p>
            )}
            {estado !== 'salvo' && estado !== 'erro' && !copiados && semNenhumHorario && (
              <p className="text-amber-800">Nenhum dia tem horário. Se salvar assim, o agendamento pelo site fica fechado.</p>
            )}
            {estado !== 'salvo' && estado !== 'erro' && !copiados && !semNenhumHorario && (
              <p className="text-[#45474c]">{alterada ? 'Há alterações que ainda não foram salvas.' : 'Tudo salvo.'}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            {diferenteDoInicio && (
              <button type="button" onClick={desfazer} className={botaoSecundario}>
                Desfazer alterações
              </button>
            )}
            <button type="button" onClick={salvar} disabled={!alterada || estado === 'salvando'} className={botaoPrimario}>
              {estado === 'salvando' ? 'Salvando…' : 'Salvar horários'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
