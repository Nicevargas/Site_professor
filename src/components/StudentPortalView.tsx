import React, { useState } from 'react';
import { 
  Appointment, 
  PaymentInvoice, 
  TeacherProfile, 
  VideoItem, 
  AuthUser 
} from '../types';
import { 
  Calendar, 
  Clock, 
  Video, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  MessageSquare, 
  GraduationCap, 
  Play, 
  Headphones, 
  Sparkles, 
  QrCode, 
  ArrowRight,
  ShieldCheck,
  Check,
  User,
  Plus
} from 'lucide-react';

interface StudentPortalViewProps {
  currentUser: AuthUser | null;
  currentTeacher: TeacherProfile;
  appointments: Appointment[];
  invoices: PaymentInvoice[];
  videos: VideoItem[];
  onOpenBookingWizard: () => void;
  onOpenWhatsApp: () => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  currentUser,
  currentTeacher,
  appointments,
  invoices,
  videos,
  onOpenBookingWizard,
  onOpenWhatsApp,
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentInvoice | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [activeMedia, setActiveMedia] = useState<VideoItem | null>(null);

  const studentName = currentUser?.name || 'Mariana Costa';
  const studentEmail = currentUser?.email || 'mariana.costa@email.com';

  // Filter student's own appointments
  const myAppointments = appointments.filter((app) => {
    return (
      app.studentName.toLowerCase().includes(studentName.toLowerCase()) ||
      (app.studentEmail && app.studentEmail.toLowerCase() === studentEmail.toLowerCase()) ||
      app.studentName.toLowerCase().includes('mariana')
    );
  });

  const upcomingAppointments = myAppointments.filter(
    (a) => a.status === 'Confirmado' || a.status === 'Pendente'
  );

  const pastAppointments = myAppointments.filter(
    (a) => a.status === 'Concluído'
  );

  // Filter student's own invoices
  const myInvoices = invoices.filter((inv) => {
    return (
      inv.studentName.toLowerCase().includes(studentName.toLowerCase()) ||
      (inv.studentEmail && inv.studentEmail.toLowerCase() === studentEmail.toLowerCase()) ||
      inv.studentName.toLowerCase().includes('mariana')
    );
  });

  const pendingInvoices = myInvoices.filter((i) => i.status === 'pendente' || i.status === 'vencido');
  const paidInvoices = myInvoices.filter((i) => i.status === 'pago');

  const handleCopyPix = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  return (
    <main className="flex-1 p-4 md:p-10 bg-[#f7f9fb] pb-32 overflow-y-auto font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Welcome Header */}
        <div className="bg-gradient-to-br from-[#091426] via-[#004e5c] to-[#00687a] rounded-3xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-bold text-cyan-200 border border-white/10">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Portal do Aluno • Área Exclusiva</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
                Olá, {studentName.split(' ')[0]}! 👋
              </h1>
              <p className="text-sm text-cyan-100/90 max-w-xl">
                Acompanhe suas aulas com o <strong>{currentTeacher.name}</strong>, acesse as salas virtuais, visualize seus pagamentos e agende novos horários.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={onOpenBookingWizard}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#57dffe] hover:bg-[#45cbe9] text-[#091426] font-bold text-sm shadow-md transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Agendar Nova Aula</span>
              </button>
              <button
                onClick={onOpenWhatsApp}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Falar no WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-8 pt-6 border-t border-white/10">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-cyan-200 font-semibold">Aulas Realizadas</p>
              <p className="text-2xl font-extrabold mt-0.5">{pastAppointments.length + 18}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-cyan-200 font-semibold">Próximas Aulas</p>
              <p className="text-2xl font-extrabold mt-0.5">{upcomingAppointments.length}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-[11px] uppercase tracking-wider text-cyan-200 font-semibold">Faturas Pendentes</p>
              <p className="text-2xl font-extrabold mt-0.5">
                {pendingInvoices.length > 0 ? (
                  <span className="text-amber-300">{pendingInvoices.length} pendente(s)</span>
                ) : (
                  <span className="text-emerald-300">Tudo em dia ✓</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Próximas Aulas */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#00687a]" />
              <h2 className="text-lg md:text-xl font-bold text-[#091426]">Minhas Próximas Aulas</h2>
            </div>
            <button
              onClick={onOpenBookingWizard}
              className="text-xs font-bold text-[#00687a] hover:underline flex items-center gap-1"
            >
              <span>Ver mais horários</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-[#091426]">Nenhuma aula agendada para os próximos dias</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Garanta o seu horário na agenda do professor com antecedência para não perder sua vaga.
              </p>
              <button
                onClick={onOpenBookingWizard}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00687a] text-white text-xs font-bold hover:bg-[#004e5c] transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Escolher Horário Agora</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingAppointments.map((app) => (
                <div 
                  key={app.id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:border-[#00687a]/40 transition-all space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#00687a]/10 text-[#00687a] flex items-center justify-center font-bold text-sm">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#091426]">{app.serviceName}</h3>
                        <p className="text-xs text-slate-500">{currentTeacher.name}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {app.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl text-slate-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>{app.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{app.startTime} às {app.endTime}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-slate-500">
                      Modalidade: <strong className="text-slate-800">{app.modality}</strong>
                    </div>

                    {app.meetingUrl ? (
                      <a
                        href={app.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00687a] hover:bg-[#004e5c] text-white text-xs font-bold shadow-xs transition-all"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Entrar na Sala Virtual</span>
                      </a>
                    ) : (
                      <button
                        onClick={onOpenWhatsApp}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Combinar no WhatsApp</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Faturas & Pagamentos Pix */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg md:text-xl font-bold text-[#091426]">Minhas Mensalidades & Pagamentos Pix</h2>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            {myInvoices.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Nenhuma cobrança registrada no momento.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {myInvoices.map((inv) => {
                  const isPending = inv.status === 'pendente' || inv.status === 'vencido';

                  return (
                    <div key={inv.id} className="py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-[#091426]">{inv.serviceOrPlanName}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            inv.status === 'pago' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : inv.status === 'vencido'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {inv.status === 'pago' ? 'Pago ✓' : inv.status === 'vencido' ? 'Vencido' : 'Pendente'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Vencimento: {inv.dueDate} • Valor: <strong className="text-slate-800">R$ {inv.amount.toFixed(2)}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {isPending && (
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Pagar com Pix</span>
                          </button>
                        )}
                        {inv.status === 'pago' && (
                          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Quitado em {inv.paidAt || '15/08/2026'}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Biblioteca Multimídia & Podcasts */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg md:text-xl font-bold text-[#091426]">Vídeos de Estudo & Podcasts Liberados</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.slice(0, 3).map((vid) => (
              <div 
                key={vid.id}
                onClick={() => setActiveMedia(vid)}
                className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="relative aspect-video bg-slate-900 overflow-hidden">
                  <img
                    src={vid.thumbnailUrl}
                    alt={vid.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-white/90 text-[#00687a] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      {vid.mediaType === 'podcast' ? <Headphones className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5 fill-current" />}
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold">
                    {vid.duration}
                  </span>
                </div>
                <div className="p-4 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#00687a]">
                    {vid.category}
                  </span>
                  <h3 className="font-bold text-xs text-[#091426] line-clamp-1">{vid.title}</h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{vid.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MODAL PAGAMENTO PIX */}
        {selectedInvoice && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setSelectedInvoice(null)}>
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-elevated border border-slate-200 animate-in zoom-in-95 text-center space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <QrCode className="w-6 h-6" />
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-[#091426]">Pagamento via Pix Instantâneo</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedInvoice.serviceOrPlanName}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <p className="text-xs text-slate-500">Valor a pagar:</p>
                <p className="text-2xl font-extrabold text-[#091426] mt-0.5">R$ {selectedInvoice.amount.toFixed(2)}</p>
                <p className="text-[11px] text-slate-400 mt-1">Beneficiário: {currentTeacher.pixReceiverName || currentTeacher.name}</p>
              </div>

              {/* Pix Copy Code Box */}
              <div className="space-y-2 text-left">
                <label className="text-xs font-bold text-slate-700">Código Pix Copia e Cola:</label>
                <div className="p-3 bg-slate-100 rounded-xl text-[11px] font-mono text-slate-700 break-all select-all border border-slate-200 max-h-24 overflow-y-auto">
                  {selectedInvoice.pixCode || `00020126580014br.gov.bcb.pix0136${currentTeacher.pixKey || currentTeacher.email}5204000053039865405${selectedInvoice.amount.toFixed(2)}5802BR5922${currentTeacher.name}6009Sao Paulo62070503***63049911`}
                </div>
              </div>

              <button
                onClick={() => handleCopyPix(selectedInvoice.pixCode || currentTeacher.pixKey || currentTeacher.email)}
                className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  copiedPix
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#00687a] hover:bg-[#004e5c] text-white'
                }`}
              >
                {copiedPix ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Código Pix Copiado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Código Pix</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setSelectedInvoice(null)}
                className="w-full text-xs text-slate-500 hover:text-slate-700 font-bold py-1"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
};
