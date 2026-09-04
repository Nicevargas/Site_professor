import React, { useState, useMemo } from 'react';
import { TeacherProfile, ServiceItem, Appointment } from '../types';
import confetti from 'canvas-confetti';
import { nextBusinessDays, formatMonthYearPtBR } from '../utils/dates';
import { findConflict, addMinutes } from './NewAppointmentModal';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Star, 
  Clock, 
  MapPin, 
  Video, 
  Calendar as CalendarIcon, 
  User, 
  Phone, 
  Mail, 
  Sparkles,
  MessageSquare,
  Check,
  CalendarPlus
} from 'lucide-react';
import { generateGoogleCalendarUrl } from '../utils/calendarAndWhatsapp';

interface PublicBookingWizardProps {
  teacher: TeacherProfile;
  services: ServiceItem[];
  preSelectedServiceId?: string;
  /** Agenda do professor: horários já ocupados não são oferecidos ao visitante */
  existingAppointments?: Appointment[];
  onBookingComplete: (newApt: Appointment) => void;
  onBackToLanding: () => void;
  onBackToDashboard: () => void;
}

export const PublicBookingWizard: React.FC<PublicBookingWizardProps> = ({
  teacher,
  services,
  preSelectedServiceId,
  existingAppointments = [],
  onBookingComplete,
  onBackToLanding,
  onBackToDashboard,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(preSelectedServiceId ? 2 : 1);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    preSelectedServiceId || (services[0]?.id || '')
  );
  
  // Step 2 selections
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedModality, setSelectedModality] = useState<string>('Online (Zoom)');

  // Step 3 student inputs
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentNotes, setStudentNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [slotTakenError, setSlotTakenError] = useState<string | null>(null);
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);

  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0];

  // Próximos cinco dias úteis a partir de amanhã
  const availableDays = useMemo(() => nextBusinessDays(5), []);

  const allTimeSlots = [
    { time: '09:00', period: 'Manhã' },
    { time: '10:30', period: 'Manhã' },
    { time: '14:00', period: 'Tarde' },
    { time: '15:30', period: 'Tarde' },
    { time: '17:00', period: 'Tarde' },
  ];

  // Primeiro dia da lista quando ainda não há escolha
  const activeDate = selectedDate || availableDays[0]?.date || '';

  // Um horário some da lista se colidir com uma aula ou bloqueio já existente
  const availableTimeSlots = useMemo(() => {
    const duration = selectedService?.durationMinutes || 60;
    return allTimeSlots.filter(
      (ts) => !findConflict({ date: activeDate, startTime: ts.time, endTime: addMinutes(ts.time, duration) }, existingAppointments)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDate, existingAppointments, selectedService?.durationMinutes]);

  const activeTimeSlot =
    selectedTimeSlot && availableTimeSlots.some((ts) => ts.time === selectedTimeSlot)
      ? selectedTimeSlot
      : availableTimeSlots[0]?.time || '';

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentPhone.trim() || !activeTimeSlot || !activeDate) return;

    const duration = selectedService?.durationMinutes || 60;
    const endTime = addMinutes(activeTimeSlot, duration);
    const chosenDay = availableDays.find((d) => d.date === activeDate) || availableDays[0];

    // Alguém pode ter reservado o mesmo horário enquanto o visitante preenchia o formulário
    if (findConflict({ date: activeDate, startTime: activeTimeSlot, endTime }, existingAppointments)) {
      setSlotTakenError('Esse horário acabou de ser reservado. Escolha outro horário disponível.');
      setStep(2);
      return;
    }

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      studentName: studentName.trim(),
      studentInitials: studentName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
      studentPhone: studentPhone.trim(),
      studentEmail: studentEmail.trim() || undefined,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      date: activeDate,
      dayOfWeek: chosenDay.dayOfWeek,
      startTime: activeTimeSlot,
      endTime: endTime,
      durationMinutes: selectedService.durationMinutes,
      modality: selectedModality as any,
      status: 'Confirmado',
      notes: studentNotes.trim() || 'Agendamento realizado pelo site.',
      clientSince: `Novo aluno (${formatMonthYearPtBR(new Date())})`,
      price: selectedService.price,
    };

    onBookingComplete(newApt);
    setCreatedAppointment(newApt);
    setIsSuccess(true);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Confetti fallback
    }
  };

  const getStepTitle = () => {
    if (step === 1) return 'Serviço';
    if (step === 2) return 'Data e Horário';
    return 'Seus Dados';
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] font-sans flex flex-col">
      {/* Top Admin Notice Bar */}
      <div className="bg-[#091426] text-white px-4 py-2 text-xs flex justify-between items-center z-50">
        <span className="font-medium text-slate-300">Página de Agendamento do Aluno</span>
        <button
          onClick={onBackToDashboard}
          className="text-xs font-semibold text-[#57dffe] hover:underline"
        >
          Voltar ao Painel
        </button>
      </div>

      {/* Transactional Progress Header */}
      <header className="bg-white sticky top-0 z-40 border-b border-[#eceef0] shadow-xs">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => {
              if (step > 1) setStep((prev) => (prev - 1) as any);
              else onBackToLanding();
            }}
            className="text-[#191c1e] p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 px-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-bold text-[#75777d] uppercase tracking-wider">
                Etapa {step} de 3
              </span>
              <span className="text-xs font-bold text-[#00687a]">
                {getStepTitle()}
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#eceef0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00687a] rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          <div className="w-8" />
        </div>
      </header>

      {/* Professional Profile Header */}
      <section className="bg-white px-4 pt-6 pb-6 border-b border-[#eceef0]">
        <div className="max-w-2xl mx-auto flex flex-col items-center text-center">
          <div className="relative w-20 h-20 md:w-24 md:h-24 mb-3">
            <img
              src={teacher.avatarUrl}
              alt={teacher.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-full shadow-ambient border-2 border-white"
            />
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#00687a] text-white rounded-full flex items-center justify-center border-2 border-white shadow-xs">
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#091426] mb-1">
            {teacher.name}
          </h1>
          <p className="text-xs md:text-sm text-[#45474c] mb-3 max-w-md">
            {teacher.specialty}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-[#45474c] bg-[#f7f9fb] px-3.5 py-1.5 rounded-full border border-[#eceef0]">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-bold text-[#091426]">{teacher.rating}</span>
            <span>({teacher.reviewCount}+ avaliações)</span>
          </div>
        </div>
      </section>

      {/* Main Form Flow */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {isSuccess && createdAppointment ? (
          /* Confirmation Success Screen */
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-elevated border border-[#eceef0] text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-[#091426] mb-2">Agendamento Confirmado!</h2>
            <p className="text-sm text-[#45474c] mb-6">
              Sua aula com <b>{teacher.name}</b> foi reservada com sucesso.
            </p>

            <div className="bg-[#f7f9fb] p-5 rounded-xl border border-[#eceef0] text-left space-y-3 mb-6 text-xs md:text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Aluno:</span>
                <span className="font-bold text-[#091426]">{createdAppointment.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Serviço:</span>
                <span className="font-bold text-[#091426]">{createdAppointment.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Data e Horário:</span>
                <span className="font-bold text-[#00687a]">
                  {createdAppointment.date} às {createdAppointment.startTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Formato:</span>
                <span className="font-semibold text-slate-700">{createdAppointment.modality}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                <span>Valor:</span>
                <span className="text-[#00687a] text-base">R$ {createdAppointment.price},00</span>
              </div>
            </div>

            {/* 8-Hour Notice */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-6 flex items-center gap-2.5 text-left">
              <Clock className="w-5 h-5 text-emerald-700 shrink-0" />
              <p className="text-xs text-emerald-900 font-medium">
                Você receberá uma mensagem de confirmação no WhatsApp com <b>8 horas de antecedência</b> para confirmar sua presença!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={generateGoogleCalendarUrl(createdAppointment, teacher)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 bg-white border border-[#00687a] text-[#00687a] hover:bg-cyan-50 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <CalendarPlus className="w-4 h-4 text-[#00687a]" />
                <span>Salvar no Google Agenda</span>
              </a>

              <button
                onClick={() => {
                  const msg = encodeURIComponent(
                    `Olá ${teacher.name}, acabei de agendar uma aula de ${createdAppointment.serviceName} para o dia ${createdAppointment.date} às ${createdAppointment.startTime}. Meu nome é ${createdAppointment.studentName}!`
                  );
                  window.open(`https://wa.me/${teacher.whatsapp}?text=${msg}`, '_blank');
                }}
                className="flex-1 py-3 px-4 bg-[#091426] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#1e293b] transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Confirmar no WhatsApp</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Step 1: Select Service */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#091426]">Escolha o Serviço</h2>
                  <p className="text-sm text-[#45474c] mt-1">
                    Selecione o tipo de aula que você precisa agendar.
                  </p>
                </div>

                <div className="space-y-4">
                  {services.filter((s) => s.active).map((svc) => (
                    <div
                      key={svc.id}
                      className={`bg-white rounded-2xl p-5 shadow-ambient border transition-all ${
                        selectedServiceId === svc.id
                          ? 'border-[#00687a] ring-2 ring-[#00687a]/20'
                          : 'border-[#eceef0] hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-base md:text-lg font-bold text-[#091426]">
                            {svc.name}
                          </h3>
                          {svc.badge && (
                            <span className="inline-block mt-1 bg-[#ffddb8] text-[#2a1700] text-[10px] font-bold px-2 py-0.5 rounded-sm">
                              {svc.badge}
                            </span>
                          )}
                          <p className="text-xs md:text-sm text-[#45474c] mt-1.5 line-clamp-2">
                            {svc.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 my-3">
                        <div className="flex items-center gap-1 bg-[#f7f9fb] px-2.5 py-1 rounded-md text-xs text-[#45474c]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{svc.durationMinutes} min</span>
                        </div>
                        <div className="flex items-center gap-1 bg-[#f7f9fb] px-2.5 py-1 rounded-md text-xs text-[#45474c]">
                          {svc.modality.includes('Online') ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                          <span>{svc.modality}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-[#eceef0] mt-3">
                        <div className="flex flex-col">
                          <span className="text-[11px] text-slate-500">Investimento</span>
                          <span className="text-lg font-extrabold text-[#00687a]">
                            R$ {svc.price},00
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedServiceId(svc.id);
                            setStep(2);
                          }}
                          className="bg-[#00687a] hover:bg-[#004e5c] text-white text-xs font-semibold px-6 py-2.5 rounded-full flex items-center gap-1.5 uppercase tracking-wider shadow-xs transition-all active:scale-95"
                        >
                          <span>Selecionar</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Select Date & Time */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#091426]">Escolha a Data e Horário</h2>
                  <p className="text-sm text-[#45474c] mt-1">
                    Aula selecionada: <span className="font-semibold text-[#00687a]">{selectedService.name}</span> (R$ {selectedService.price})
                  </p>
                </div>

                {/* Day selector */}
                <div>
                  <label className="block text-xs font-bold text-[#191c1e] mb-2 uppercase tracking-wider">
                    Dias Disponíveis
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {availableDays.map((d) => (
                      <button
                        key={d.date}
                        type="button"
                        onClick={() => { setSelectedDate(d.date); setSlotTakenError(null); }}
                        className={`p-3.5 rounded-xl text-left border transition-all ${
                          activeDate === d.date
                            ? 'bg-[#00687a] text-white border-[#00687a] shadow-sm'
                            : 'bg-white text-[#191c1e] border-[#c5c6cd] hover:border-slate-400'
                        }`}
                      >
                        <CalendarIcon className={`w-4 h-4 mb-1 ${activeDate === d.date ? 'text-cyan-200' : 'text-slate-400'}`} />
                        <p className="text-xs font-bold">{d.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time slot selector */}
                <div>
                  <label className="block text-xs font-bold text-[#191c1e] mb-2 uppercase tracking-wider">
                    Horários Disponíveis
                  </label>
                  {slotTakenError && (
                    <div role="alert" className="mb-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                      {slotTakenError}
                    </div>
                  )}
                  {availableTimeSlots.length === 0 ? (
                    <p className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-xs text-slate-600">
                      Não há horários livres neste dia. Escolha outra data ou fale com o professor no WhatsApp.
                    </p>
                  ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                    {availableTimeSlots.map((ts) => (
                      <button
                        key={ts.time}
                        type="button"
                        onClick={() => { setSelectedTimeSlot(ts.time); setSlotTakenError(null); }}
                        className={`py-3 px-2 rounded-xl text-center border transition-all ${
                          activeTimeSlot === ts.time
                            ? 'bg-[#091426] text-white border-[#091426] font-bold shadow-sm'
                            : 'bg-white text-[#191c1e] border-[#c5c6cd] hover:border-[#091426]'
                        }`}
                      >
                        <span className="text-sm block">{ts.time}</span>
                        <span className={`text-[10px] block ${activeTimeSlot === ts.time ? 'text-slate-300' : 'text-slate-400'}`}>{ts.period}</span>
                      </button>
                    ))}
                  </div>
                  )}
                </div>

                {/* Modality selector */}
                <div>
                  <label className="block text-xs font-bold text-[#191c1e] mb-2 uppercase tracking-wider">
                    Formato da Aula
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedModality('Online (Zoom)')}
                      className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                        selectedModality === 'Online (Zoom)'
                          ? 'bg-[#acedff]/30 border-[#00687a] text-[#00687a]'
                          : 'bg-white border-[#c5c6cd] text-slate-700'
                      }`}
                    >
                      <Video className="w-4 h-4" />
                      <span>Online (Zoom / Meet)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedModality('Presencial')}
                      className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                        selectedModality === 'Presencial'
                          ? 'bg-[#acedff]/30 border-[#00687a] text-[#00687a]'
                          : 'bg-white border-[#c5c6cd] text-slate-700'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Presencial</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Trocar Serviço
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="h-12 px-8 bg-[#00687a] hover:bg-[#004e5c] text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-ambient"
                  >
                    <span>Continuar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Student Details & Confirm */}
            {step === 3 && (
              <form onSubmit={handleConfirmBooking} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#091426]">Seus Dados para Confirmação</h2>
                  <p className="text-sm text-[#45474c] mt-1">
                    Enviaremos os detalhes e lembretes da aula diretamente para o seu WhatsApp.
                  </p>
                </div>

                {/* Booking Summary Card */}
                <div className="bg-white p-4 rounded-xl border border-[#eceef0] shadow-card text-xs md:text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Aula:</span>
                    <span className="font-bold text-[#091426]">{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Data e Horário:</span>
                    <span className="font-bold text-[#00687a]">
                      {activeDate.split('-').reverse().join('/')} às {activeTimeSlot}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Investimento:</span>
                    <span className="font-extrabold text-[#00687a]">R$ {selectedService.price},00</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                      Seu Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Ex: Gabriela Santos"
                      className="w-full p-3 bg-white border border-[#c5c6cd] rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                        WhatsApp com DDD *
                      </label>
                      <input
                        type="tel"
                        required
                        value={studentPhone}
                        onChange={(e) => setStudentPhone(e.target.value)}
                        placeholder="(11) 98765-4321"
                        className="w-full p-3 bg-white border border-[#c5c6cd] rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                        E-mail para Recibo
                      </label>
                      <input
                        type="email"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        placeholder="seuemail@exemplo.com"
                        className="w-full p-3 bg-white border border-[#c5c6cd] rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                      Dúvidas ou Observações para a Aula (Opcional)
                    </label>
                    <textarea
                      value={studentNotes}
                      onChange={(e) => setStudentNotes(e.target.value)}
                      rows={3}
                      placeholder="Ex: Gostaria de focar no simulado X ou melhorar resistência."
                      className="w-full p-3 bg-white border border-[#c5c6cd] rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Voltar
                  </button>

                  <button
                    type="submit"
                    className="h-12 px-8 bg-[#00687a] hover:bg-[#004e5c] text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-elevated transition-all"
                  >
                    <span>Finalizar Agendamento</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </main>
    </div>
  );
};
