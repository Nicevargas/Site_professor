import React, { useState } from 'react';
import { Appointment, TeacherProfile } from '../types';
import { 
  X, 
  Calendar as CalendarIcon, 
  Download, 
  ExternalLink, 
  Check, 
  Copy, 
  RefreshCw, 
  Share2, 
  CheckCircle2, 
  Sparkles,
  Layers
} from 'lucide-react';
import { generateGoogleCalendarUrl, downloadIcsCalendarFile } from '../utils/calendarAndWhatsapp';

interface GoogleCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  teacher: TeacherProfile;
  selectedAppointment?: Appointment | null;
}

export const GoogleCalendarModal: React.FC<GoogleCalendarModalProps> = ({
  isOpen,
  onClose,
  appointments,
  teacher,
  selectedAppointment,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'individual' | 'full' | 'sync'>('individual');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const targetApt = selectedAppointment || appointments[0];

  const shareCalendarUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(
    `https://agendaprofessor.com.br/api/ical/${teacher.id}.ics`
  )}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareCalendarUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSimulateSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-[#091426]">
                Integração & Compartilhamento Google Calendário
              </h2>
              <p className="text-xs text-[#45474c]">
                Sincronize suas aulas e compartilhe sua agenda com o Google Calendar
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 mb-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('individual')}
            className={`pb-2.5 px-3 transition-colors border-b-2 ${
              activeTab === 'individual'
                ? 'border-[#00687a] text-[#00687a]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Adicionar Aula Atual
          </button>
          <button
            onClick={() => setActiveTab('full')}
            className={`pb-2.5 px-3 transition-colors border-b-2 ${
              activeTab === 'full'
                ? 'border-[#00687a] text-[#00687a]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Exportar Agenda (.ics)
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-2.5 px-3 transition-colors border-b-2 ${
              activeTab === 'sync'
                ? 'border-[#00687a] text-[#00687a]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sincronização em Tempo Real
          </button>
        </div>

        {/* Tab 1: Single appointment export */}
        {activeTab === 'individual' && targetApt && (
          <div className="space-y-4">
            <div className="bg-[#f7f9fb] p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-[#00687a] uppercase tracking-wider">
                Aula Selecionada
              </span>
              <h3 className="text-base font-bold text-[#091426] mt-1">
                {targetApt.serviceName} - {targetApt.studentName}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                🗓️ Data: <b>{targetApt.date}</b> às <b>{targetApt.startTime} - {targetApt.endTime}</b> ({targetApt.modality})
              </p>
            </div>

            <p className="text-xs text-slate-600">
              Clique abaixo para abrir diretamente o Google Agenda com todos os dados preenchidos (nome do aluno, link de aula, horário e lembrete):
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={generateGoogleCalendarUrl(targetApt, teacher)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 h-12 bg-[#00687a] hover:bg-[#004e5c] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir no Google Agenda</span>
              </a>

              <button
                type="button"
                onClick={() => downloadIcsCalendarFile([targetApt], teacher, `aula_${targetApt.studentName.toLowerCase().replace(/\s+/g, '_')}.ics`)}
                className="px-4 h-12 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Baixar Evento (.ics)</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Full Schedule Export */}
        {activeTab === 'full' && (
          <div className="space-y-4">
            <div className="bg-[#f7f9fb] p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#091426]">Total de Aulas na Grade:</span>
                <span className="text-xs font-bold bg-[#acedff] text-[#001f26] px-2.5 py-0.5 rounded-full">
                  {appointments.length} Aulas Agendadas
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Gere um arquivo universal iCalendar (.ics) contendo todas as aulas da semana/mês para importar em lote no seu Google Agenda, Apple Calendar ou Outlook.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => downloadIcsCalendarFile(appointments, teacher, `agenda_completa_${teacher.name.toLowerCase().replace(/\s+/g, '_')}.ics`)}
                className="w-full h-12 bg-[#091426] hover:bg-[#1e293b] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Baixar Todas as {appointments.length} Aulas em .ICS</span>
              </button>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[11px] font-bold text-slate-700 mb-1">Como importar no Google Calendar:</p>
                <ol className="text-[11px] text-slate-600 list-decimal list-inside space-y-0.5">
                  <li>Baixe o arquivo .ics clicando no botão acima.</li>
                  <li>No Google Agenda (web), clique na engrenagem ⚙️ &gt; <b>Configurações</b>.</li>
                  <li>Selecione <b>Importar e exportar</b> e selecione o arquivo baixado.</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: 2-Way Sync & Live Share */}
        {activeTab === 'sync' && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-900">Sincronização Ativa em 2 Vias</h4>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Novas aulas agendadas pelos alunos ou bloqueios de horário são atualizados automaticamente na sua conta Google.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Link de Inscrição na Agenda (WebCal / Google Calendar Feed)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareCalendarUrl}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-700 truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 bg-[#00687a] hover:bg-[#004e5c] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Última sincronização: Há poucos segundos
              </span>

              <button
                type="button"
                onClick={handleSimulateSync}
                disabled={isSyncing}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#00687a] ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : syncSuccess ? 'Sincronizado!' : 'Forçar Sincronização Agora'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-6 border-t border-slate-100 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
