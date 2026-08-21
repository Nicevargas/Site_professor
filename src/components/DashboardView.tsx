import React, { useState } from 'react';
import { Appointment, Reminder, TeacherProfile } from '../types';
import { 
  BookOpen, 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  Plus, 
  Ban, 
  GraduationCap, 
  TrendingUp, 
  CheckSquare, 
  Square, 
  Video, 
  MapPin, 
  Calendar as CalendarIcon,
  ChevronRight,
  Sparkles,
  MessageSquare,
  Zap,
  Share2,
  DollarSign,
  CreditCard,
  BarChart3,
  Users
} from 'lucide-react';
import { calculate8hDispatchTime } from '../utils/calendarAndWhatsapp';
import { calculateFinancialOverview } from '../utils/mediaAndTextHelpers';

interface DashboardViewProps {
  currentTeacher: TeacherProfile;
  appointments: Appointment[];
  reminders: Reminder[];
  onToggleReminder: (id: string) => void;
  onAddReminder: (title: string, dueDate: string) => void;
  onSelectAppointment: (appointment: Appointment) => void;
  onOpenNewAppointmentModal: () => void;
  onOpenBlockTimeModal: () => void;
  onNavigateToAgenda: () => void;
  onOpenGoogleCalendarModal: () => void;
  onOpenWhatsApp8hModal: () => void;
  onNavigateToIntegrations?: () => void;
  onNavigateToSiteAdmin?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentTeacher,
  appointments,
  reminders,
  onToggleReminder,
  onAddReminder,
  onSelectAppointment,
  onOpenNewAppointmentModal,
  onOpenBlockTimeModal,
  onNavigateToAgenda,
  onOpenGoogleCalendarModal,
  onOpenWhatsApp8hModal,
  onNavigateToIntegrations,
  onNavigateToSiteAdmin,
}) => {
  const [newReminderText, setNewReminderText] = useState('');
  const [showAddReminder, setShowAddReminder] = useState(false);

  // Financial calculations
  const financial = calculateFinancialOverview(appointments);
  const formattedTotalRevenue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(financial.totalRevenue);
  const formattedAverageTicket = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(financial.averageTicket);

  // Today's appointments (first 3)
  const todayAppointments = appointments.slice(0, 3);
  const nextAppointment = appointments[0] || null;

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderText.trim()) return;
    onAddReminder(newReminderText.trim(), 'Hoje, ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    setNewReminderText('');
    setShowAddReminder(false);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[#f7f9fb] p-4 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8 pb-16">
        
        {/* Welcome & Actions Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#091426] tracking-tight">
              Bom dia, {currentTeacher.name.split(' ')[0]}!
            </h1>
            <p className="text-base text-[#45474c] mt-1">
              Aqui está o resumo do seu dia e seus próximos atendimentos.
            </p>
          </div>
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <button 
              onClick={onOpenBlockTimeModal}
              className="flex-1 md:flex-none h-12 px-5 rounded-lg bg-[#e0e3e5] text-[#091426] font-semibold text-sm hover:bg-[#d8dadc] transition-colors flex items-center justify-center border border-[#c5c6cd]"
            >
              <Ban className="w-4 h-4 mr-2 text-[#091426]" />
              Bloquear Horário
            </button>
            <button 
              onClick={onOpenNewAppointmentModal}
              className="flex-1 md:flex-none h-12 px-6 rounded-lg bg-[#00687a] text-white font-semibold text-sm hover:bg-[#004e5c] transition-all flex items-center justify-center shadow-ambient hover:shadow-elevated"
            >
              <Plus className="w-4 h-4 mr-2 text-white" />
              Novo Agendamento
            </button>
          </div>
        </div>

        {/* Metrics Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Metric Card 1: Receita Estimada */}
          <div className="bg-white rounded-2xl p-5 shadow-ambient border border-[#eceef0] flex flex-col justify-between h-44 hover:border-emerald-300 transition-all">
            <div className="flex justify-between items-start">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                Receita Ativa
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#45474c]">Faturamento Previsto</p>
              <p className="text-2xl font-bold text-[#091426] tracking-tight mt-0.5">{formattedTotalRevenue}</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">Ticket médio: {formattedAverageTicket}</p>
            </div>
          </div>

          {/* Metric Card 2: Aulas Hoje */}
          <div className="bg-white rounded-2xl p-5 shadow-ambient border border-[#eceef0] flex flex-col justify-between h-44 hover:border-slate-300 transition-all">
            <div className="flex justify-between items-start">
              <div className="w-11 h-11 rounded-xl bg-[#d8e3fb] flex items-center justify-center text-[#091426]">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="bg-[#acedff] text-[#001f26] px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                Hoje
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#45474c]">Aulas Marcadas</p>
              <p className="text-2xl font-bold text-[#091426] tracking-tight mt-0.5">{appointments.length}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">{financial.onlineClassesCount} online • {financial.inPersonClassesCount} presencial</p>
            </div>
          </div>

          {/* Metric Card 3: Próximo Atendimento */}
          <div className="bg-white rounded-2xl p-5 shadow-ambient border border-[#eceef0] flex flex-col justify-between h-44 hover:border-amber-300 transition-all">
            <div className="flex justify-between items-start">
              <div className="w-11 h-11 rounded-xl bg-[#ffddb8] flex items-center justify-center text-[#201100]">
                <Clock className="w-5 h-5" />
              </div>
              <span className="bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                Confirmado
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#45474c]">Próximo Atendimento</p>
              <p className="text-lg font-bold text-[#091426] truncate mt-0.5">
                {nextAppointment ? `${nextAppointment.startTime} - ${nextAppointment.studentName.split(' ')[0]} ${nextAppointment.studentName.split(' ')[1]?.[0] || ''}.` : '14:00 - João S.'}
              </p>
              <p className="text-[11px] text-amber-700 font-semibold mt-1 truncate">{nextAppointment?.serviceName || 'Mentoria de Estudos'}</p>
            </div>
          </div>

          {/* Metric Card 4: Status de Automações & n8n */}
          <div className="bg-white rounded-2xl p-5 shadow-ambient border border-[#eceef0] flex flex-col justify-between h-44 hover:border-orange-300 transition-all">
            <div className="flex justify-between items-start">
              <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100">
                <Zap className="w-5 h-5" />
              </div>
              <button
                onClick={onNavigateToIntegrations}
                className="bg-orange-100 hover:bg-orange-200 text-orange-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-colors"
              >
                n8n & Hub OK
              </button>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#45474c]">Automações & Webhook</p>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <button
                  onClick={onNavigateToIntegrations}
                  className="text-[11px] bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-md transition-colors"
                >
                  n8n
                </button>
                <button
                  onClick={onOpenGoogleCalendarModal}
                  className="text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-md transition-colors"
                >
                  Google
                </button>
                <button
                  onClick={onOpenWhatsApp8hModal}
                  className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md transition-colors"
                >
                  Whats 8h
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 8-Hour Prior WhatsApp Automated Notification Banner */}
        <div className="bg-gradient-to-r from-[#091426] to-[#122642] text-white p-5 rounded-2xl shadow-elevated border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  Automação WhatsApp 8h Antes
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Regra Ativa
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Mensagens de confirmação automáticas calculadas para disparar 8 horas antes do horário de início de cada aula.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenGoogleCalendarModal}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
              <span>Sincronizar Google</span>
            </button>
            <button
              onClick={onOpenWhatsApp8hModal}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Ver Fila de Disparos 8h</span>
            </button>
          </div>
        </div>

        {/* Site do Professor Quick Admin Strip */}
        {onNavigateToSiteAdmin && (
          <div className="bg-white rounded-2xl p-5 shadow-ambient border border-[#eceef0] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-cyan-50 text-[#00687a] flex items-center justify-center shrink-0 border border-cyan-100">
                <Sparkles className="w-5 h-5 text-[#00687a]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#091426]">
                  Site Oficial do Professor & Portfólio
                </h3>
                <p className="text-xs text-[#45474c] mt-0.5">
                  Gerencie depoimentos de alunos, currículo com títulos/prêmios, vídeos demonstrativos e galeria de fotos.
                </p>
              </div>
            </div>

            <button
              onClick={onNavigateToSiteAdmin}
              className="px-4 py-2.5 bg-[#00687a] hover:bg-[#004e5c] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 shrink-0 hover:scale-[1.02]"
            >
              <span>Gerenciar Depoimentos, Vídeos & Currículo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Content Area: Next Appointments & Right Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Next Appointments List (2 Columns) */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-ambient border border-[#eceef0] p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#091426]">Próximos Agendamentos</h2>
                <p className="text-xs text-[#45474c] mt-0.5">Clique em uma aula para gerenciar ou falar no WhatsApp</p>
              </div>
              <button 
                onClick={onNavigateToAgenda}
                className="text-[#00687a] font-semibold text-sm hover:underline flex items-center gap-1"
              >
                <span>Ver Agenda Completa</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              {todayAppointments.map((apt, index) => {
                const colors = [
                  { bg: 'bg-[#bcc7de]', text: 'text-[#091426]' },
                  { bg: 'bg-[#ffb95f]', text: 'text-[#201100]' },
                  { bg: 'bg-[#e0e3e5]', text: 'text-[#191c1e]' }
                ];
                const badgeColor = colors[index % colors.length];

                return (
                  <div
                    key={apt.id}
                    onClick={() => onSelectAppointment(apt)}
                    className="flex items-center justify-between p-4 rounded-xl bg-[#f7f9fb] border border-[#eceef0] hover:border-[#00687a]/50 hover:bg-white transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Student Initials Avatar */}
                      <div className={`w-12 h-12 rounded-full ${badgeColor.bg} ${badgeColor.text} flex items-center justify-center text-sm font-bold shadow-xs shrink-0`}>
                        {apt.studentInitials || apt.studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-base text-[#191c1e] group-hover:text-[#00687a] transition-colors">
                          {apt.studentName}
                        </h3>
                        <p className="text-sm text-[#45474c] flex items-center mt-0.5">
                          <GraduationCap className="w-4 h-4 mr-1.5 text-slate-500" />
                          {apt.serviceName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-base text-[#091426]">{apt.startTime}</p>
                      <p className="text-xs text-[#45474c] flex items-center justify-end gap-1 mt-0.5">
                        {apt.modality.includes('Online') ? (
                          <Video className="w-3.5 h-3.5 text-[#00687a]" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        <span>{apt.modality}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Weekly Stats & Lembretes */}
          <div className="space-y-6">
            {/* Weekly Classes Metric Card */}
            <div className="bg-[#091426] text-white rounded-xl p-6 shadow-elevated relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-lg font-bold mb-2">Aulas na Semana</h3>
                <div className="flex items-end space-x-3">
                  <span className="text-4xl font-extrabold tracking-tight">24</span>
                  <span className="text-sm font-medium text-[#57dffe] mb-1.5">
                    +4 em relação à semana passada
                  </span>
                </div>
                <p className="text-xs text-[#8590a6] mt-3">
                  92% de taxa de ocupação da sua grade horária.
                </p>
              </div>
              {/* Decorative background chart icon */}
              <div className="absolute right-[-10px] bottom-[-15px] opacity-10 pointer-events-none">
                <TrendingUp className="w-32 h-32 text-white" />
              </div>
            </div>

            {/* Tasks / Lembretes */}
            <div className="bg-white rounded-xl shadow-ambient border border-[#eceef0] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#091426] flex items-center">
                  <CheckSquare className="w-5 h-5 mr-2 text-[#201100]" />
                  Lembretes
                </h3>
                <button
                  onClick={() => setShowAddReminder(!showAddReminder)}
                  className="text-xs text-[#00687a] font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo</span>
                </button>
              </div>

              {/* Add reminder input form */}
              {showAddReminder && (
                <form onSubmit={handleCreateReminder} className="mb-4 p-3 bg-[#f2f4f6] rounded-lg">
                  <input
                    type="text"
                    value={newReminderText}
                    onChange={(e) => setNewReminderText(e.target.value)}
                    placeholder="O que você precisa fazer?"
                    className="w-full text-xs p-2 rounded border border-slate-300 bg-white focus:outline-none focus:border-[#00687a] mb-2"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddReminder(false)}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 text-xs bg-[#00687a] text-white rounded font-medium"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
              )}

              <ul className="space-y-3">
                {reminders.map((reminder) => (
                  <li 
                    key={reminder.id}
                    className="flex items-start space-x-3 pb-3 border-b border-[#e0e3e5] last:border-0 last:pb-0"
                  >
                    <button 
                      onClick={() => onToggleReminder(reminder.id)}
                      className="mt-0.5 text-[#00687a] hover:opacity-80 transition-opacity"
                    >
                      {reminder.completed ? (
                        <CheckSquare className="w-5 h-5 text-[#00687a]" />
                      ) : (
                        <Square className="w-5 h-5 text-[#75777d]" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${reminder.completed ? 'line-through text-slate-400' : 'text-[#191c1e] font-medium'}`}>
                        {reminder.title}
                      </p>
                      <p className={`text-xs mt-0.5 ${reminder.delayed ? 'text-[#ba1a1a] font-bold' : 'text-[#45474c]'}`}>
                        {reminder.dueDate}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full py-8 flex flex-col md:flex-row justify-between items-center text-[#45474c] text-xs border-t border-[#eceef0] mt-8">
          <p>© 2024 Agenda do Professor. Todos os direitos reservados.</p>
          <div className="flex space-x-6 mt-4 md:mt-0 font-medium">
            <a href="#contato" className="hover:text-[#091426] transition-colors">Contato</a>
            <a href="#termos" className="hover:text-[#091426] transition-colors">Termos de Uso</a>
            <a href="#privacidade" className="hover:text-[#091426] transition-colors">Privacidade</a>
          </div>
        </footer>
      </div>
    </main>
  );
};
