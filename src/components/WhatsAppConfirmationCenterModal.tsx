import React, { useState } from 'react';
import { Appointment, TeacherProfile } from '../types';
import { 
  X, 
  MessageSquare, 
  Clock, 
  Send, 
  Check, 
  CheckCheck, 
  Copy, 
  AlertCircle, 
  Sparkles, 
  ChevronRight,
  Calendar as CalendarIcon,
  ShieldCheck,
  Zap,
  RotateCcw
} from 'lucide-react';
import { 
  build8hConfirmationMessage, 
  getWhatsApp8hLink, 
  calculate8hDispatchTime 
} from '../utils/calendarAndWhatsapp';

interface WhatsAppConfirmationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  teacher: TeacherProfile;
  onConfirmStatus?: (aptId: string) => void;
}

export const WhatsAppConfirmationCenterModal: React.FC<WhatsAppConfirmationCenterModalProps> = ({
  isOpen,
  onClose,
  appointments,
  teacher,
  onConfirmStatus,
}) => {
  if (!isOpen) return null;

  const [sentAppointments, setSentAppointments] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isBatchSending, setIsBatchSending] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'all' | 'preview'>('pending');
  const [previewApt, setPreviewApt] = useState<Appointment>(appointments[0] || null);

  // Group appointments with 8h calculations
  const calculatedList = appointments.map((apt) => {
    const calc = calculate8hDispatchTime(apt.date, apt.startTime);
    const isSent = sentAppointments[apt.id] || false;
    return {
      apt,
      ...calc,
      isSent,
    };
  });

  const pending8hList = calculatedList.filter((item) => !item.isSent);

  const handleSendSingle = (apt: Appointment) => {
    const link = getWhatsApp8hLink(apt, teacher);
    window.open(link, '_blank');
    setSentAppointments((prev) => ({ ...prev, [apt.id]: true }));
    if (onConfirmStatus) {
      onConfirmStatus(apt.id);
    }
  };

  const handleCopyMessage = (apt: Appointment) => {
    const text = build8hConfirmationMessage(apt, teacher);
    navigator.clipboard.writeText(text);
    setCopiedId(apt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleBatchDispatch = () => {
    if (pending8hList.length === 0) return;
    setIsBatchSending(true);
    setBatchProgress(10);

    // Simulate batch dispatch animation
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setBatchProgress(Math.min(100, Math.round((count / pending8hList.length) * 100)));
      
      if (count >= pending8hList.length) {
        clearInterval(interval);
        setTimeout(() => {
          const allSent: Record<string, boolean> = { ...sentAppointments };
          pending8hList.forEach((item) => {
            allSent[item.apt.id] = true;
          });
          setSentAppointments(allSent);
          setIsBatchSending(false);
          setBatchProgress(0);
        }, 600);
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold text-[#091426]">
                  Disparo de Confirmação WhatsApp (8h Antes)
                </h2>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  Automático / 1-Clique
                </span>
              </div>
              <p className="text-xs text-[#45474c] mt-0.5">
                Envie mensagens automáticas ou personalizadas 8 horas antes do início de cada aula.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 8h Automation Info Banner */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200/80 mb-4 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-950">
                  Regra Ativa: Disparo com 8 Horas de Antecedência
                </p>
                <p className="text-[11px] text-emerald-800">
                  O sistema agenda e calcula o horário exato de envio de acordo com o início da aula.
                </p>
              </div>
            </div>

            <button
              onClick={handleBatchDispatch}
              disabled={isBatchSending || pending8hList.length === 0}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all shrink-0"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isBatchSending ? `Disparando (${batchProgress}%)` : `Disparar Todos (${pending8hList.length})`}</span>
            </button>
          </div>

          {isBatchSending && (
            <div className="w-full bg-emerald-200 h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className="bg-emerald-600 h-full transition-all duration-300"
                style={{ width: `${batchProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-slate-200 mb-4 text-xs font-semibold shrink-0">
          <button
            onClick={() => setSelectedTab('pending')}
            className={`pb-2.5 px-3 transition-colors border-b-2 ${
              selectedTab === 'pending'
                ? 'border-[#00687a] text-[#00687a]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Aulas Prontas para Envio ({pending8hList.length})
          </button>
          <button
            onClick={() => setSelectedTab('all')}
            className={`pb-2.5 px-3 transition-colors border-b-2 ${
              selectedTab === 'all'
                ? 'border-[#00687a] text-[#00687a]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Todas as Aulas ({appointments.length})
          </button>
          <button
            onClick={() => setSelectedTab('preview')}
            className={`pb-2.5 px-3 transition-colors border-b-2 ${
              selectedTab === 'preview'
                ? 'border-[#00687a] text-[#00687a]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Modelo da Mensagem (8h)
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {selectedTab === 'preview' ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#f7f9fb] rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#091426]">Pré-visualização da Mensagem (8h Antes):</span>
                  <button
                    onClick={() => previewApt && handleCopyMessage(previewApt)}
                    className="text-xs text-[#00687a] font-semibold hover:underline flex items-center gap-1"
                  >
                    {copiedId === previewApt?.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === previewApt?.id ? 'Copiado!' : 'Copiar Texto'}</span>
                  </button>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs font-mono whitespace-pre-wrap text-slate-800 leading-relaxed shadow-xs">
                  {previewApt ? build8hConfirmationMessage(previewApt, teacher) : 'Nenhuma aula selecionada.'}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>O aluno pode responder <b>SIM</b> para confirmar instantaneamente no seu sistema ou solicitar reagendamento.</span>
              </div>
            </div>
          ) : (
            (selectedTab === 'pending' ? pending8hList : calculatedList).map((item) => {
              const { apt, dispatchTime, dispatchDate, isWithin8hWindow, isSent } = item;
              return (
                <div
                  key={apt.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSent
                      ? 'bg-slate-50/70 border-slate-200 opacity-80'
                      : isWithin8hWindow
                      ? 'bg-emerald-50/40 border-emerald-200 shadow-xs'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#091426] truncate">
                        {apt.studentName}
                      </h4>
                      {isSent ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCheck className="w-3 h-3" />
                          <span>Lembrete 8h Enviado</span>
                        </span>
                      ) : isWithin8hWindow ? (
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>Janela de 8h Aberta</span>
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          Disparo Agendado para {dispatchTime} (8h antes)
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600">
                      📚 {apt.serviceName} • ⏰ Aula: <b>{apt.startTime}</b> ({apt.date}) • 📍 {apt.modality}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      WhatsApp: {apt.studentPhone || '(11) 98765-4321'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(apt)}
                      title="Copiar texto da mensagem de confirmação 8h"
                      className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs transition-colors"
                    >
                      {copiedId === apt.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendSingle(apt)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                        isSent
                          ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                          : 'bg-[#091426] hover:bg-[#1e293b] text-white'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isSent ? 'Reenviar' : 'Enviar 8h no WhatsApp'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {selectedTab === 'pending' && pending8hList.length === 0 && (
            <div className="text-center py-12 bg-[#f7f9fb] rounded-2xl border border-dashed border-slate-300">
              <CheckCheck className="w-12 h-12 text-emerald-600 mx-auto mb-2 opacity-80" />
              <h3 className="text-sm font-bold text-[#091426]">Tudo Pronto!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Todas as confirmações de 8 horas antes foram enviadas ou já estão registradas.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-4 shrink-0">
          <span className="text-xs text-slate-500">
            {appointments.length} aulas monitoradas pelo assistente de 8 horas.
          </span>
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
