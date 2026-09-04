import React, { useState } from 'react';
import { Appointment, ServiceItem, AppointmentStatus, TeacherProfile } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  History, 
  Clock, 
  Layers, 
  MessageSquare, 
  X, 
  Check, 
  AlertCircle,
  Calendar as CalendarIcon,
  Plus,
  Share2,
  ExternalLink,
  Zap,
  CheckCheck
} from 'lucide-react';
import { generateGoogleCalendarUrl, getWhatsApp8hLink, calculate8hDispatchTime } from '../utils/calendarAndWhatsapp';

interface AgendaViewProps {
  appointments: Appointment[];
  services: ServiceItem[];
  currentTeacher: TeacherProfile;
  selectedAppointment: Appointment | null;
  onSelectAppointment: (apt: Appointment | null) => void;
  onUpdateAppointmentNotes: (id: string, notes: string) => void;
  onCancelAppointment: (id: string, reason?: string) => void;
  onReopenAppointment?: (id: string) => void;
  onDeleteAppointment?: (id: string) => void;
  onRescheduleAppointment: (apt: Appointment) => void;
  onOpenNewAppointmentModal: () => void;
  onOpenGoogleCalendarModal: (apt?: Appointment) => void;
  onOpenWhatsApp8hModal: () => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  appointments,
  services,
  currentTeacher,
  selectedAppointment,
  onSelectAppointment,
  onUpdateAppointmentNotes,
  onCancelAppointment,
  onReopenAppointment,
  onDeleteAppointment,
  onRescheduleAppointment,
  onOpenNewAppointmentModal,
  onOpenGoogleCalendarModal,
  onOpenWhatsApp8hModal,
}) => {
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Confirmado' | 'Pendente' | 'Cancelado'>('Todos');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('all');
  const [calendarViewMode, setCalendarViewMode] = useState<'dia' | 'semana' | 'mes'>('semana');
  const [selectedDay, setSelectedDay] = useState<number>(15); // 15 Nov (Wed)
  const [editingNotes, setEditingNotes] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);

  // Sync editing notes when selectedAppointment changes
  React.useEffect(() => {
    if (selectedAppointment) {
      setEditingNotes(selectedAppointment.notes || '');
    }
  }, [selectedAppointment]);

  const handleSaveNotes = () => {
    if (!selectedAppointment) return;
    setIsSavingNotes(true);
    onUpdateAppointmentNotes(selectedAppointment.id, editingNotes);
    setTimeout(() => setIsSavingNotes(false), 500);
  };

  const handleOpenWhatsApp = (apt: Appointment) => {
    const cleanPhone = (apt.studentPhone || '5511987654321').replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá ${apt.studentName}, tudo bem? Confirmando nossa aula de ${apt.serviceName} no dia ${apt.date} às ${apt.startTime}. Qualquer dúvida estou à disposição!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  // Aulas canceladas saem da grade e aparecem no histórico próprio, abaixo do calendário
  const filteredAppointments = appointments.filter((apt) => {
    if (apt.status === 'Cancelado') return false;
    if (statusFilter !== 'Todos' && statusFilter !== 'Cancelado' && apt.status !== statusFilter) return false;
    if (selectedServiceId !== 'all' && apt.serviceId !== selectedServiceId) return false;
    return true;
  });

  const cancelledAppointments = appointments
    .filter((apt) => apt.status === 'Cancelado')
    .filter((apt) => selectedServiceId === 'all' || apt.serviceId === selectedServiceId)
    .sort((a, b) => (b.cancelledAt || b.date).localeCompare(a.cancelledAt || a.date));

  const confirmCancellation = () => {
    if (!cancellingId) return;
    onCancelAppointment(cancellingId, cancelReason);
    setCancellingId(null);
    setCancelReason('');
  };

  const weekDays = [
    { dayNumber: 13, dayName: 'Seg', dayOfWeek: 1 },
    { dayNumber: 14, dayName: 'Ter', dayOfWeek: 2 },
    { dayNumber: 15, dayName: 'Qua', dayOfWeek: 3, isToday: true },
    { dayNumber: 16, dayName: 'Qui', dayOfWeek: 4 },
    { dayNumber: 17, dayName: 'Sex', dayOfWeek: 5 },
    { dayNumber: 18, dayName: 'Sáb', dayOfWeek: 6, isWeekend: true },
    { dayNumber: 19, dayName: 'Dom', dayOfWeek: 0, isWeekend: true },
  ];

  const timeHours = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  return (
    <main className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#f7f9fb] relative">
      {/* Sidebar: Filters & Mini Calendar (Bento style) */}
      <aside className="w-full lg:w-80 shrink-0 p-4 md:p-6 flex flex-col gap-4 overflow-y-auto border-r border-[#c5c6cd] bg-white">
        
        {/* Filter Card */}
        <div className="bg-[#f7f9fb] p-5 rounded-xl shadow-card border border-[#e0e3e5]">
          <h2 className="text-lg font-bold text-[#091426] mb-4">Filtros</h2>
          
          <div className="space-y-4">
            {/* Status Filter */}
            <div>
              <label className="text-xs font-semibold text-[#45474c] block mb-2">
                Status da Aula
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter('Todos')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    statusFilter === 'Todos'
                      ? 'bg-[#091426] text-white shadow-xs'
                      : 'bg-[#eceef0] border border-[#c5c6cd] text-[#191c1e] hover:bg-[#e0e3e5]'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setStatusFilter('Confirmado')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    statusFilter === 'Confirmado'
                      ? 'bg-[#00687a] text-white'
                      : 'bg-[#eceef0] border border-[#c5c6cd] text-[#191c1e] hover:bg-[#e0e3e5]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#57dffe]"></span>
                  Confirmado
                </button>
                <button
                  onClick={() => setStatusFilter('Pendente')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    statusFilter === 'Pendente'
                      ? 'bg-[#c88000] text-white'
                      : 'bg-[#eceef0] border border-[#c5c6cd] text-[#191c1e] hover:bg-[#e0e3e5]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#ffb95f]"></span>
                  Pendente
                </button>
                <button
                  onClick={() => setStatusFilter('Cancelado')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    statusFilter === 'Cancelado'
                      ? 'bg-[#ba1a1a] text-white'
                      : 'bg-[#eceef0] border border-[#c5c6cd] text-[#191c1e] hover:bg-[#e0e3e5]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#ffdad6]"></span>
                  Canceladas ({cancelledAppointments.length})
                </button>
              </div>
            </div>

            {/* Service Filter */}
            <div>
              <label className="text-xs font-semibold text-[#45474c] block mb-2">
                Serviço
              </label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#c5c6cd] rounded-lg text-sm text-[#191c1e] focus:border-[#00687a] focus:ring-1 focus:ring-[#00687a] focus:outline-none"
              >
                <option value="all">Todos os Serviços</option>
                {services.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Mini Calendar Card */}
        <div className="bg-[#f7f9fb] p-5 rounded-xl shadow-card border border-[#e0e3e5] hidden lg:block">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-[#091426]">Novembro 2024</h3>
            <div className="flex gap-1">
              <button className="p-1 rounded hover:bg-[#e0e3e5] text-[#45474c]">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1 rounded hover:bg-[#e0e3e5] text-[#45474c]">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            <span className="text-xs font-semibold text-[#75777d]">D</span>
            <span className="text-xs font-semibold text-[#75777d]">S</span>
            <span className="text-xs font-semibold text-[#75777d]">T</span>
            <span className="text-xs font-semibold text-[#75777d]">Q</span>
            <span className="text-xs font-semibold text-[#75777d]">Q</span>
            <span className="text-xs font-semibold text-[#75777d]">S</span>
            <span className="text-xs font-semibold text-[#75777d]">S</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-[#191c1e]">
            <div className="py-1.5 text-[#75777d] opacity-40">29</div>
            <div className="py-1.5 text-[#75777d] opacity-40">30</div>
            <div className="py-1.5 text-[#75777d] opacity-40">31</div>
            <div className="py-1.5 rounded hover:bg-slate-200 cursor-pointer">1</div>
            <div className="py-1.5 rounded hover:bg-slate-200 cursor-pointer">2</div>
            <div className="py-1.5 rounded hover:bg-slate-200 cursor-pointer">3</div>
            <div className="py-1.5 rounded hover:bg-slate-200 cursor-pointer">4</div>
            <div className="py-1.5 rounded hover:bg-slate-200 cursor-pointer">5</div>
            <div className="py-1.5 rounded hover:bg-slate-200 cursor-pointer">6</div>
            <div className="py-1.5 rounded hover:bg-slate-200 cursor-pointer">7</div>
            <div className="py-1.5 rounded bg-[#091426] text-white font-bold cursor-pointer">8</div>
            <div className="py-1.5 rounded hover:bg-slate-200 cursor-pointer">9</div>
            <div className="py-1.5 rounded hover:bg-slate-200 cursor-pointer">10</div>
            <div className="py-1.5 rounded hover:bg-slate-200 cursor-pointer">11</div>
            <div className="py-1.5 rounded hover:bg-slate-200 cursor-pointer">12</div>
            <div className="py-1.5 rounded hover:bg-slate-200 cursor-pointer">13</div>
            <div className="py-1.5 rounded hover:bg-slate-200 cursor-pointer">14</div>
            <div className={`py-1.5 rounded font-bold cursor-pointer ${selectedDay === 15 ? 'bg-[#00687a] text-white' : 'hover:bg-slate-200'}`} onClick={() => setSelectedDay(15)}>15</div>
            <div className="py-1.5 rounded hover:bg-slate-200 cursor-pointer">16</div>
            <div className="py-1.5 rounded hover:bg-slate-200 cursor-pointer">17</div>
            <div className="py-1.5 rounded hover:bg-slate-200 cursor-pointer">18</div>
          </div>
        </div>

        {/* Quick manual schedule button */}
        <button
          onClick={onOpenNewAppointmentModal}
          className="w-full py-3 px-4 bg-[#00687a] hover:bg-[#004e5c] text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Agendar Nova Aula</span>
        </button>
      </aside>

      {/* Main Calendar Area */}
      <section className="flex-1 flex flex-col min-w-0 bg-white relative">
        {/* Calendar Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:px-8 md:py-4 border-b border-[#c5c6cd] gap-4 bg-white z-10 shadow-xs">
          <div className="flex items-center gap-4">
            <h2 className="text-xl md:text-2xl font-bold text-[#091426] truncate">
              13 - 19 Novembro
            </h2>
            <div className="flex items-center gap-1">
              <button className="w-9 h-9 flex items-center justify-center rounded-full border border-[#c5c6cd] text-[#45474c] hover:bg-[#eceef0] transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-9 h-9 flex items-center justify-center rounded-full border border-[#c5c6cd] text-[#45474c] hover:bg-[#eceef0] transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setSelectedDay(15)}
                className="px-3.5 py-1.5 rounded-full border border-[#c5c6cd] text-xs font-semibold text-[#191c1e] hover:bg-[#eceef0] transition-colors ml-2 hidden sm:block"
              >
                Hoje
              </button>
            </div>
          </div>

          {/* Actions & View mode toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Google Calendar Action Button */}
            <button
              onClick={() => onOpenGoogleCalendarModal()}
              className="px-3.5 py-1.5 rounded-lg border border-[#c5c6cd] hover:border-[#00687a] bg-white text-xs font-semibold text-[#091426] hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs"
              title="Compartilhar & Sincronizar com Google Agenda"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Google Agenda</span>
            </button>

            {/* 8h WhatsApp Confirmation Action Button */}
            <button
              onClick={onOpenWhatsApp8hModal}
              className="px-3.5 py-1.5 rounded-lg border border-emerald-300 hover:border-emerald-500 bg-emerald-50 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 shadow-xs"
              title="Disparar confirmações 8 horas antes pelo WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp 8h</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>

            {/* View mode toggle (Dia / Semana / Mês) */}
            <div className="bg-[#eceef0] border border-[#c5c6cd] rounded-lg p-1 flex">
              <button
                onClick={() => setCalendarViewMode('dia')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  calendarViewMode === 'dia' ? 'bg-white shadow-xs text-[#091426]' : 'text-[#45474c] hover:text-[#091426]'
                }`}
              >
                Dia
              </button>
              <button
                onClick={() => setCalendarViewMode('semana')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  calendarViewMode === 'semana' ? 'bg-white shadow-xs text-[#091426]' : 'text-[#45474c] hover:text-[#091426]'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setCalendarViewMode('mes')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all hidden sm:block ${
                  calendarViewMode === 'mes' ? 'bg-white shadow-xs text-[#091426]' : 'text-[#45474c] hover:text-[#091426]'
                }`}
              >
                Mês
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid (Week View) */}
        <div className="flex-1 overflow-auto calendar-scroll bg-white">
          <div className="min-w-[850px] h-full flex flex-col">
            
            {/* Header Row (Days) */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-[#c5c6cd] sticky top-0 bg-white z-20 shadow-xs">
              <div className="p-2 border-r border-[#c5c6cd] flex items-end justify-center">
                <span className="text-[11px] font-semibold text-[#75777d]">GMT-3</span>
              </div>

              {weekDays.map((wd) => (
                <div 
                  key={wd.dayNumber}
                  className={`p-3 text-center border-r border-[#c5c6cd] last:border-r-0 flex flex-col items-center ${
                    wd.isWeekend ? 'bg-[#f2f4f6]/50' : ''
                  }`}
                >
                  <span className={`text-xs uppercase font-semibold ${wd.isToday ? 'text-[#00687a] font-bold' : 'text-[#75777d]'}`}>
                    {wd.dayName}
                  </span>
                  <span 
                    className={`text-base font-bold mt-1 ${
                      wd.isToday 
                        ? 'bg-[#acedff] text-[#001f26] w-9 h-9 rounded-full flex items-center justify-center shadow-xs' 
                        : wd.isWeekend ? 'text-[#75777d] opacity-70' : 'text-[#191c1e]'
                    }`}
                  >
                    {wd.dayNumber}
                  </span>
                </div>
              ))}
            </div>

            {/* Time Grid with appointments */}
            <div className="flex-1 relative pb-12">
              {/* Background vertical columns */}
              <div className="absolute inset-0 grid grid-cols-[80px_repeat(7,1fr)] pointer-events-none">
                <div className="border-r border-[#c5c6cd]"></div>
                <div className="border-r border-[#c5c6cd]"></div>
                <div className="border-r border-[#c5c6cd]"></div>
                <div className="border-r border-[#c5c6cd]"></div>
                <div className="border-r border-[#c5c6cd]"></div>
                <div className="border-r border-[#c5c6cd]"></div>
                <div className="border-r border-[#c5c6cd] bg-[#f2f4f6]/30"></div>
                <div className="bg-[#f2f4f6]/30"></div>
              </div>

              {/* Time Rows */}
              <div className="grid grid-cols-[80px_1fr] relative">
                {/* Time Labels Column */}
                <div className="flex flex-col border-r border-[#c5c6cd] bg-white z-10 select-none">
                  {timeHours.map((hour) => (
                    <div key={hour} className="h-20 border-b border-[#c5c6cd] flex items-start justify-center pt-2">
                      <span className="text-xs font-medium text-[#75777d]">{hour}</span>
                    </div>
                  ))}
                </div>

                {/* Events Area */}
                <div className="relative w-full h-full">
                  {/* Dashed Horizontal Lines */}
                  <div className="absolute inset-0 flex flex-col pointer-events-none">
                    {timeHours.map((hour) => (
                      <div key={hour} className="h-20 border-b border-[#e0e3e5] border-dashed opacity-60 w-full"></div>
                    ))}
                  </div>

                  {/* Render Appointments as positioned blocks */}
                  {/* Slot calculation:
                      Day columns: 1 (Seg)=0%, 2 (Ter)=14.28%, 3 (Qua)=28.57%, 4 (Qui)=42.85%, 5 (Sex)=57.14%, 6 (Sáb)=71.42%, 0 (Dom)=85.71%
                      Hour rows: 08:00=0px, 09:00=80px, 10:00=160px, 11:00=240px, 12:00=320px, 13:00=400px, 14:00=480px, 15:00=560px, 16:00=640px, 17:00=720px
                  */}

                  {filteredAppointments.map((apt) => {
                    // Calculate left offset based on day of week (1=Seg -> left:0, 2=Ter -> left: 14.28%, etc.)
                    let dayIndex = apt.dayOfWeek === 0 ? 6 : apt.dayOfWeek - 1; // 0=Dom -> index 6, 1=Seg -> 0
                    const leftPct = dayIndex * 14.285;

                    // Calculate top offset based on startTime
                    const [h, m] = apt.startTime.split(':').map(Number);
                    const startMinutesFrom8 = (h - 8) * 60 + (m || 0);
                    const topPx = (startMinutesFrom8 / 60) * 80;
                    const heightPx = Math.max(50, (apt.durationMinutes / 60) * 80);

                    const isConfirmed = apt.status === 'Confirmado';
                    const isPending = apt.status === 'Pendente';

                    return (
                      <div
                        key={apt.id}
                        onClick={() => onSelectAppointment(apt)}
                        style={{
                          left: `${leftPct}%`,
                          top: `${topPx}px`,
                          width: '14.285%',
                          height: `${heightPx}px`,
                        }}
                        className="absolute p-1 cursor-pointer group z-20 transition-all"
                      >
                        <div
                          className={`w-full h-full rounded-lg p-2.5 shadow-sm hover:shadow-md transition-all group-hover:scale-[1.02] flex flex-col overflow-hidden relative border ${
                            isConfirmed
                              ? 'bg-[#acedff] text-[#001f26] border-[#4cd7f6]'
                              : isPending
                              ? 'bg-[#ffddb8] text-[#2a1700] border-[#ffb95f]'
                              : 'bg-slate-100 text-slate-800 border-slate-300'
                          }`}
                        >
                          {/* Accent left border pill */}
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg ${
                              isConfirmed ? 'bg-[#00687a]' : isPending ? 'bg-[#c88000]' : 'bg-slate-500'
                            }`}
                          />
                          <span className="text-[11px] font-semibold opacity-85 mb-0.5 tracking-tight pl-1">
                            {apt.startTime} - {apt.endTime}
                          </span>
                          <span className="text-xs font-bold leading-tight truncate pl-1">
                            {apt.studentName}
                          </span>
                          <span className="text-[11px] truncate opacity-90 pl-1 mt-0.5">
                            {apt.serviceName}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Histórico de cancelamentos: aulas canceladas ficam registradas, fora da grade */}
        {(statusFilter === 'Cancelado' || (statusFilter === 'Todos' && cancelledAppointments.length > 0)) && (
          <section className="mt-6" aria-label="Histórico de cancelamentos">
            <div className="bg-white rounded-2xl border border-[#eceef0] shadow-ambient p-5">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-4 h-4 text-[#ba1a1a]" />
                <h3 className="text-sm font-bold text-[#091426]">
                  Histórico de cancelamentos ({cancelledAppointments.length})
                </h3>
              </div>

              {cancelledAppointments.length === 0 ? (
                <p className="text-xs text-[#45474c] py-4 text-center">
                  Nenhuma aula cancelada até agora.
                </p>
              ) : (
                <ul className="divide-y divide-[#eceef0]">
                  {cancelledAppointments.map((apt) => (
                    <li key={apt.id}>
                      <button
                        onClick={() => onSelectAppointment(apt)}
                        className="w-full text-left py-3 flex items-start justify-between gap-3 hover:bg-[#f7f9fb] rounded-lg px-2 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#191c1e] truncate">
                            {apt.studentName}
                            <span className="font-normal text-[#45474c]"> · {apt.serviceName}</span>
                          </p>
                          <p className="text-[11px] text-[#45474c] mt-0.5">
                            Aula em {apt.date.split('-').reverse().join('/')} às {apt.startTime}
                            {apt.cancelledAt && ` · cancelada em ${apt.cancelledAt.split('-').reverse().join('/')}`}
                          </p>
                          {apt.cancellationReason && (
                            <p className="text-[11px] text-[#ba1a1a] mt-0.5 truncate">
                              Motivo: {apt.cancellationReason}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-[10px] font-bold">
                          Cancelada
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* Confirmação de cancelamento com motivo opcional */}
        {cancellingId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
            <div role="dialog" aria-label="Cancelar aula" className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <h3 className="text-base font-bold text-[#091426]">Cancelar esta aula?</h3>
              <p className="text-xs text-[#45474c] mt-1">
                A aula sai da agenda e fica registrada no histórico de cancelamentos. O horário volta a ficar livre.
              </p>

              <label htmlFor="cancel-reason" className="block text-xs font-semibold text-slate-700 mt-4 mb-1">
                Motivo (opcional)
              </label>
              <input
                id="cancel-reason"
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex: Aluno pediu remarcação"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
              />

              <div className="flex justify-end gap-2.5 mt-5">
                <button
                  onClick={() => { setCancellingId(null); setCancelReason(''); }}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Voltar
                </button>
                <button
                  onClick={confirmCancellation}
                  className="px-5 py-2.5 bg-[#ba1a1a] hover:bg-red-800 text-white text-xs font-bold rounded-xl"
                >
                  Confirmar cancelamento
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sliding Appointment Details Panel (Drawer) */}
        {selectedAppointment && (
          <div className="absolute top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col border-l border-[#c5c6cd] animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 flex justify-between items-center border-b border-[#eceef0] bg-[#f7f9fb]">
              <div>
                <h3 className="text-lg font-bold text-[#091426]">Detalhes da Aula</h3>
                <p className="text-xs text-slate-500">{selectedAppointment.date}</p>
              </div>
              <button
                onClick={() => onSelectAppointment(null)}
                className="w-9 h-9 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {/* Status Chip */}
              <div className="flex items-center justify-between">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                    selectedAppointment.status === 'Cancelado'
                      ? 'bg-[#ffdad6] text-[#ba1a1a]'
                      : selectedAppointment.status === 'Confirmado'
                      ? 'bg-[#acedff] text-[#001f26]'
                      : 'bg-[#ffddb8] text-[#2a1700]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedAppointment.status === 'Cancelado'
                        ? 'bg-[#ba1a1a]'
                        : selectedAppointment.status === 'Confirmado'
                        ? 'bg-[#00687a]'
                        : 'bg-[#c88000]'
                    }`}
                  />
                  <span>{selectedAppointment.status}</span>
                </span>

                <span className="text-sm font-bold text-[#00687a]">
                  R$ {selectedAppointment.price},00
                </span>
              </div>

              {/* Student Info */}
              <div className="flex items-center gap-4 bg-[#f7f9fb] p-4 rounded-xl border border-[#eceef0]">
                <img
                  src={
                    selectedAppointment.studentAvatar ||
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuBBK4ZdjGlXcYUkNbEPgBCJ2ybOX87uTuhEIW-bh1S_6aUuhw3LbpojczkFt7hLMuVkBrvtmonkTNLYDBnpXnY8VeoyWHUzo9lTl7o4AYZV53TqGGXbGuc3CVUOLKbpGRa80w_0YcCGtnYeuP97M5S1TuGnG5L72vqotjZDwMVDIWF9N7shtJ2fI_9L2OOOUCTYfgP1vQF4Vjms-_6o4t7L90jfsLMghpGEespEMyKNBXoQr7B-RD-cww'
                  }
                  alt={selectedAppointment.studentName}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-base text-[#191c1e] truncate">
                    {selectedAppointment.studentName}
                  </h4>
                  <p className="text-xs text-[#45474c] flex items-center gap-1 mt-1">
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    <span>{selectedAppointment.clientSince || 'Cliente desde 2023'}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedAppointment.studentPhone}</p>
                </div>
              </div>

              {/* Service & Time (Bento Grid Style) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-[#c5c6cd] p-4 rounded-xl shadow-xs">
                  <Layers className="w-5 h-5 text-[#00687a] mb-2" />
                  <p className="text-[11px] font-semibold text-[#75777d] uppercase tracking-wider mb-1">
                    Serviço
                  </p>
                  <p className="text-sm font-bold text-[#191c1e] truncate">
                    {selectedAppointment.serviceName}
                  </p>
                  <span className="text-[11px] text-slate-500">{selectedAppointment.modality}</span>
                </div>

                <div className="bg-white border border-[#c5c6cd] p-4 rounded-xl shadow-xs">
                  <Clock className="w-5 h-5 text-[#00687a] mb-2" />
                  <p className="text-[11px] font-semibold text-[#75777d] uppercase tracking-wider mb-1">
                    Horário
                  </p>
                  <p className="text-sm font-bold text-[#191c1e]">
                    {selectedAppointment.startTime} - {selectedAppointment.endTime}
                  </p>
                  <span className="text-[11px] text-slate-500">{selectedAppointment.durationMinutes} min</span>
                </div>
              </div>

              {/* Editable Notes Area */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-[#191c1e]">Notas da Aula</p>
                  <button
                    onClick={handleSaveNotes}
                    className="text-xs font-semibold text-[#00687a] hover:underline"
                  >
                    {isSavingNotes ? 'Salvando...' : 'Salvar Nota'}
                  </button>
                </div>
                <textarea
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  placeholder="Adicione observações, links de materiais ou metas do aluno..."
                  rows={4}
                  className="w-full p-3 rounded-lg border border-[#c5c6cd] bg-[#f7f9fb] text-sm text-[#191c1e] focus:bg-white focus:border-[#00687a] focus:ring-1 focus:ring-[#00687a] focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Drawer Actions Footer */}
            <div className="p-6 border-t border-[#eceef0] flex flex-col gap-2.5 bg-[#f7f9fb]">
              {/* WhatsApp 8h Confirmation Button */}
              <button
                onClick={() => {
                  const link = getWhatsApp8hLink(selectedAppointment, currentTeacher);
                  window.open(link, '_blank');
                }}
                className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all"
                title="Dispara a mensagem de confirmação programada para 8 horas antes da aula"
              >
                <MessageSquare className="w-4 h-4 text-emerald-200" />
                <span>Enviar Confirmação WhatsApp (8h Antes)</span>
              </button>

              {/* Google Agenda Button */}
              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href={generateGoogleCalendarUrl(selectedAppointment, currentTeacher)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 bg-white border border-[#c5c6cd] hover:border-[#00687a] text-[#091426] font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  title="Abrir diretamente no Google Agenda"
                >
                  <CalendarIcon className="w-4 h-4 text-blue-600" />
                  <span>Google Agenda</span>
                </a>

                <button
                  onClick={() => handleOpenWhatsApp(selectedAppointment)}
                  className="h-11 bg-[#091426] hover:bg-[#1e293b] text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Conversar</span>
                </button>
              </div>

              {selectedAppointment.status === 'Cancelado' ? (
                <div className="space-y-3 pt-1">
                  <div className="p-3.5 rounded-xl bg-[#ffdad6]/50 border border-[#ffdad6] text-xs text-[#410002]">
                    <p className="font-bold">
                      Cancelada
                      {selectedAppointment.cancelledAt
                        ? ` em ${selectedAppointment.cancelledAt.split('-').reverse().join('/')}`
                        : ''}
                    </p>
                    {selectedAppointment.cancellationReason && (
                      <p className="mt-1">Motivo: {selectedAppointment.cancellationReason}</p>
                    )}
                  </div>
                  <div className="flex gap-2.5">
                    {onReopenAppointment && (
                      <button
                        onClick={() => onReopenAppointment(selectedAppointment.id)}
                        className="flex-1 h-10 bg-[#00687a] hover:bg-[#004e5c] text-white font-semibold text-xs rounded-xl transition-colors"
                      >
                        Reabrir aula
                      </button>
                    )}
                    {onDeleteAppointment && (
                      <button
                        onClick={() => {
                          if (window.confirm('Excluir esta aula do histórico? Esta ação não pode ser desfeita.')) {
                            onDeleteAppointment(selectedAppointment.id);
                          }
                        }}
                        className="flex-1 h-10 border border-[#c5c6cd] bg-white text-[#ba1a1a] font-semibold text-xs rounded-xl hover:bg-red-50 transition-colors"
                      >
                        Excluir do histórico
                      </button>
                    )}
                  </div>
                </div>
              ) : (
              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => onRescheduleAppointment(selectedAppointment)}
                  className="flex-1 h-10 border border-[#c5c6cd] bg-white text-[#191c1e] font-semibold text-xs rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Reagendar
                </button>
                <button
                  onClick={() => { setCancellingId(selectedAppointment.id); setCancelReason(''); }}
                  className="flex-1 h-10 bg-[#ffdad6] text-[#ba1a1a] font-semibold text-xs rounded-xl hover:bg-red-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
              )}
            </div>
          </div>
        )}

        {/* Overlay backdrop when details panel is open on mobile */}
        {selectedAppointment && (
          <div
            onClick={() => onSelectAppointment(null)}
            className="fixed inset-0 bg-black/20 backdrop-blur-xs z-40 lg:hidden"
          />
        )}
      </section>
    </main>
  );
};
