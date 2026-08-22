import React, { useState, useEffect } from 'react';
import { TeacherProfile, VacationModeConfig } from '../types';
import { 
  Palmtree, 
  X, 
  Calendar, 
  Clock, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  MessageSquare, 
  Phone, 
  Eye, 
  Info,
  CalendarCheck,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { 
  formatVacationDateBR, 
  getVacationPeriodLabel, 
  getVacationReturnLabel 
} from '../utils/vacationHelpers';

interface VacationModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTeacher: TeacherProfile;
  onSaveVacationMode: (config: VacationModeConfig) => void;
}

export const VacationModeModal: React.FC<VacationModeModalProps> = ({
  isOpen,
  onClose,
  currentTeacher,
  onSaveVacationMode,
}) => {
  const currentConfig = currentTeacher.vacationMode || {
    enabled: false,
    startDate: '',
    endDate: '',
    returnDate: '',
    title: 'Recesso Pedagógico / Férias',
    message: 'Estou em período de recesso. O agendamento online está temporariamente pausado. Retornaremos com as aulas em breve!',
    allowWaitlistOrContact: true,
    customButtonText: 'Entrar na Lista de Espera',
  };

  const [enabled, setEnabled] = useState(currentConfig.enabled);
  const [startDate, setStartDate] = useState(currentConfig.startDate || '');
  const [endDate, setEndDate] = useState(currentConfig.endDate || '');
  const [returnDate, setReturnDate] = useState(currentConfig.returnDate || '');
  const [title, setTitle] = useState(currentConfig.title || 'Recesso Pedagógico / Férias');
  const [message, setMessage] = useState(
    currentConfig.message ||
      'Estou em período de recesso. O agendamento online está temporariamente pausado. Retornaremos com as aulas em breve!'
  );
  const [allowWaitlist, setAllowWaitlist] = useState(currentConfig.allowWaitlistOrContact ?? true);
  const [customButtonText, setCustomButtonText] = useState(
    currentConfig.customButtonText || 'Entrar na Lista de Espera'
  );
  const [previewMode, setPreviewMode] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      const cfg = currentTeacher.vacationMode || {
        enabled: false,
        startDate: '',
        endDate: '',
        returnDate: '',
        title: 'Recesso Pedagógico / Férias',
        message: 'Estou em período de recesso. O agendamento online está temporariamente pausado. Retornaremos com as aulas em breve!',
        allowWaitlistOrContact: true,
        customButtonText: 'Entrar na Lista de Espera',
      };
      setEnabled(cfg.enabled);
      setStartDate(cfg.startDate || '');
      setEndDate(cfg.endDate || '');
      setReturnDate(cfg.returnDate || '');
      setTitle(cfg.title || 'Recesso Pedagógico / Férias');
      setMessage(
        cfg.message ||
          'Estou em período de recesso. O agendamento online está temporariamente pausado. Retornaremos com as aulas em breve!'
      );
      setAllowWaitlist(cfg.allowWaitlistOrContact ?? true);
      setCustomButtonText(cfg.customButtonText || 'Entrar na Lista de Espera');
    }
  }, [isOpen, currentTeacher]);

  if (!isOpen) return null;

  // Presets
  const applyPreset = (type: 'fim_de_ano' | 'julho' | 'uma_semana' | 'duas_semanas') => {
    const today = new Date();
    const currentYear = today.getFullYear();

    if (type === 'fim_de_ano') {
      const start = `${currentYear}-12-20`;
      const end = `${currentYear + 1}-01-05`;
      const ret = `${currentYear + 1}-01-06`;
      setStartDate(start);
      setEndDate(end);
      setReturnDate(ret);
      setTitle('Recesso de Fim de Ano');
      setMessage(
        `Estaremos em recesso de fim de ano de 20/12 a 05/01. As aulas e atendimentos regulares retornam em 06/01/${currentYear + 1}.`
      );
      setEnabled(true);
    } else if (type === 'julho') {
      const start = `${currentYear}-07-15`;
      const end = `${currentYear}-07-31`;
      const ret = `${currentYear}-08-01`;
      setStartDate(start);
      setEndDate(end);
      setReturnDate(ret);
      setTitle('Férias de Inverno / Julho');
      setMessage(
        `Período de férias de 15/07 a 31/07. Novos agendamentos online reabrem em 01/08/${currentYear}.`
      );
      setEnabled(true);
    } else if (type === 'uma_semana') {
      const s = new Date();
      const e = new Date();
      e.setDate(s.getDate() + 7);
      const r = new Date();
      r.setDate(s.getDate() + 8);
      const sStr = s.toISOString().split('T')[0];
      const eStr = e.toISOString().split('T')[0];
      const rStr = r.toISOString().split('T')[0];
      setStartDate(sStr);
      setEndDate(eStr);
      setReturnDate(rStr);
      setTitle('Pausa Temporária / Ausência');
      setMessage(
        `Estarei ausente para capacitação/recesso entre ${formatVacationDateBR(sStr, false)} e ${formatVacationDateBR(eStr, false)}. Retorno às atividades em ${formatVacationDateBR(rStr, true)}.`
      );
      setEnabled(true);
    } else if (type === 'duas_semanas') {
      const s = new Date();
      const e = new Date();
      e.setDate(s.getDate() + 14);
      const r = new Date();
      r.setDate(s.getDate() + 15);
      const sStr = s.toISOString().split('T')[0];
      const eStr = e.toISOString().split('T')[0];
      const rStr = r.toISOString().split('T')[0];
      setStartDate(sStr);
      setEndDate(eStr);
      setReturnDate(rStr);
      setTitle('Férias Pedagógicas (15 Dias)');
      setMessage(
        `Período de férias de 15 dias entre ${formatVacationDateBR(sStr, false)} e ${formatVacationDateBR(eStr, false)}. As aulas recomeçam em ${formatVacationDateBR(rStr, true)}.`
      );
      setEnabled(true);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const config: VacationModeConfig = {
      enabled,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      returnDate: returnDate || undefined,
      title: title.trim() || 'Recesso Pedagógico / Férias',
      message: message.trim() || 'Estou em período de recesso. Agendamentos temporariamente pausados.',
      allowWaitlistOrContact: allowWaitlist,
      customButtonText: customButtonText.trim() || 'Entrar na Lista de Espera',
    };
    onSaveVacationMode(config);
    onClose();
  };

  const returnLabel = returnDate ? formatVacationDateBR(returnDate, true) : (endDate ? formatVacationDateBR(endDate, true) : 'em breve');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-6 text-white flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              <Palmtree className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">Modo de Férias & Ausência</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  enabled ? 'bg-emerald-400 text-emerald-950' : 'bg-white/20 text-white'
                }`}>
                  {enabled ? 'ATIVADO' : 'DESATIVADO'}
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-1">
                Pause temporariamente os agendamentos online durante seus períodos de descanso ou recesso.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Main Activation Toggle */}
          <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
            enabled 
              ? 'bg-amber-50/80 border-amber-300 shadow-xs' 
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="space-y-0.5 pr-4">
              <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Palmtree className={`w-4 h-4 ${enabled ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>Ativar Modo de Férias</span>
              </span>
              <p className="text-xs text-slate-500">
                Quando ativado, os alunos verão um aviso elegante no seu site e o agendamento direto ficará pausado.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Presets Row */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Atalhos Rápidos de Período
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('fim_de_ano')}
                className="p-2.5 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-xl text-left transition-all text-xs"
              >
                <p className="font-bold text-slate-800">Fim de Ano</p>
                <p className="text-[10px] text-slate-500">20 Dez - 05 Jan</p>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('julho')}
                className="p-2.5 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-xl text-left transition-all text-xs"
              >
                <p className="font-bold text-slate-800">Férias de Julho</p>
                <p className="text-[10px] text-slate-500">15 Jul - 31 Jul</p>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('uma_semana')}
                className="p-2.5 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-xl text-left transition-all text-xs"
              >
                <p className="font-bold text-slate-800">1 Semana</p>
                <p className="text-[10px] text-slate-500">+7 dias de pausa</p>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('duas_semanas')}
                className="p-2.5 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-xl text-left transition-all text-xs"
              >
                <p className="font-bold text-slate-800">15 Dias</p>
                <p className="text-[10px] text-slate-500">+15 dias de férias</p>
              </button>
            </div>
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Início da Ausência</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Término da Ausência</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (!returnDate && e.target.value) {
                    try {
                      const d = new Date(e.target.value + 'T12:00:00');
                      d.setDate(d.getDate() + 1);
                      setReturnDate(d.toISOString().split('T')[0]);
                    } catch {
                      // ignore
                    }
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5 text-amber-900">
                <CalendarCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Data de Retorno das Aulas</span>
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Title & Custom Message */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Título do Aviso (Exibido no Site)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Recesso Pedagógico de Verão"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mensagem para os Alunos e Visitantes
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explique o período de recesso e quando os novos agendamentos serão normalizados..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
              />
            </div>
          </div>

          {/* Waitlist & WhatsApp Options */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Permitir Lista de Espera via WhatsApp</span>
                </span>
                <p className="text-[11px] text-slate-500">
                  Substitui o botão de agendamento por um botão direto para o aluno reservar vaga para o retorno.
                </p>
              </div>
              <input
                type="checkbox"
                checked={allowWaitlist}
                onChange={(e) => setAllowWaitlist(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
              />
            </div>

            {allowWaitlist && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Texto do Botão no Site
                </label>
                <input
                  type="text"
                  value={customButtonText}
                  onChange={(e) => setCustomButtonText(e.target.value)}
                  placeholder="Ex: Entrar na Lista de Espera no WhatsApp"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>

          {/* Live Preview on Public Site */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Pré-visualização do Aviso no Site Público</span>
              </span>
              <span className="text-[10px] text-slate-400">Como o aluno verá</span>
            </div>

            {/* Mocked Public Banner Preview */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/70 border border-amber-200 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                  <Palmtree className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-xs font-bold text-amber-950">
                      {title || 'Período de Recesso / Férias'}
                    </h4>
                    {returnDate && (
                      <span className="px-2 py-0.5 bg-amber-200/80 text-amber-900 rounded-md text-[10px] font-bold">
                        Retorno em {returnLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-amber-900/90 mt-1 leading-relaxed">
                    {message || 'Estou em período de recesso. Agendamentos temporariamente pausados.'}
                  </p>
                  {allowWaitlist && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold shadow-xs">
                        <Phone className="w-3 h-3" />
                        <span>{customButtonText || 'Entrar na Lista de Espera'}</span>
                      </span>
                      <span className="text-[10px] text-amber-800 font-medium">
                        Agendamentos online diretos pausados
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <button
            type="button"
            onClick={() => {
              setEnabled(false);
              setStartDate('');
              setEndDate('');
              setReturnDate('');
            }}
            className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          >
            Limpar e Desativar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02]"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Configuração</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
