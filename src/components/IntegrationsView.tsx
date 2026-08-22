import React, { useState } from 'react';
import { TeacherProfile, ServiceItem, Appointment, Student, Reminder } from '../types';
import { 
  Calendar, 
  MessageSquare, 
  Check, 
  Copy, 
  ExternalLink, 
  Zap, 
  Download, 
  Sparkles,
  Layers,
  Send,
  ShieldCheck,
  Workflow,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { downloadIcsCalendarFile } from '../utils/calendarAndWhatsapp';
import { applyTemplateVariables } from '../utils/mediaAndTextHelpers';

interface IntegrationsViewProps {
  currentTeacher: TeacherProfile;
  services: ServiceItem[];
  appointments: Appointment[];
  students: Student[];
  reminders: Reminder[];
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({
  currentTeacher,
  services,
  appointments,
  students,
}) => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'google' | 'status'>('whatsapp');

  // WhatsApp Templates state
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<'8h_reminder' | 'confirmation' | 'post_class'>('8h_reminder');
  const [templates, setTemplates] = useState({
    '8h_reminder': `*CONFIRMAÇÃO DE AULA - 8H ANTES* ⏰\nOlá, {aluno_nome}! Tudo bem? 👋\nPassando para confirmar sua aula de {servico_nome} agendada para hoje às {horario} (daqui a ~8 horas).\n\nProfessor: {professor_nome}\nModalidade: {modalidade}\nLink: {link_aula}\n\nPor favor, responda com:\n👉 SIM para confirmar\n👉 REAGENDAR caso precise de outro horário`,
    'confirmation': `*AGENDAMENTO CONFIRMADO!* ✅\nOlá, {aluno_nome}!\nSua sessão de {servico_nome} com o(a) {professor_nome} foi confirmada para o dia {data} às {horario}.\n\nNos vemos em breve!`,
    'post_class': `*OBRIGADO PELA AULA!* 🌟\nOlá, {aluno_nome}! Espero que a aula de {servico_nome} tenha sido muito produtiva hoje. Caso tenha dúvidas sobre os exercícios, envie por aqui!`
  });

  const handleInsertVariable = (variableTag: string) => {
    setTemplates((prev) => ({
      ...prev,
      [selectedTemplateKey]: (prev[selectedTemplateKey] || '') + ' ' + variableTag,
    }));
  };

  const sampleStudent = students[0] || { name: 'Mariana Costa', phone: '+55 11 98765-4321', email: 'mariana.costa@email.com' };
  const sampleService = services[0] || { name: 'Mentoria Individual', price: 180 };
  const sampleAppointment = appointments[0] || {
    id: 'sample-1',
    teacherId: currentTeacher.id,
    studentName: sampleStudent.name,
    studentInitials: 'MC',
    serviceName: sampleService.name,
    date: new Date().toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '15:00',
    modality: 'Online (Google Meet)',
    status: 'confirmado' as const,
  };

  const renderedPreview = applyTemplateVariables(templates[selectedTemplateKey], {
    aluno_nome: sampleStudent.name,
    servico_nome: sampleService.name,
    data: new Date().toLocaleDateString('pt-BR'),
    horario: sampleAppointment.startTime,
    professor_nome: currentTeacher.name,
    modalidade: sampleAppointment.modality,
    link_aula: 'https://meet.google.com/abc-defg-hij',
  });

  const icalFeedUrl = `https://agendaprofessor.com.br/api/ical/${currentTeacher.id}.ics`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2500);
  };

  return (
    <main className="flex-1 p-4 md:p-10 bg-[#f7f9fb] pb-32 overflow-y-auto font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#091426] tracking-tight flex items-center gap-2.5">
              <Zap className="w-7 h-7 text-[#00687a]" />
              <span>Automações & Notificações</span>
            </h1>
            <p className="text-sm text-[#45474c] mt-1">
              Personalize suas mensagens automáticas de WhatsApp e sincronize sua agenda com o Google Calendar.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Envio Automático Ativo
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'whatsapp'
                ? 'border-[#00687a] text-[#00687a]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp (Templates & Avisos 8h)</span>
          </button>

          <button
            onClick={() => setActiveTab('google')}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'google'
                ? 'border-[#00687a] text-[#00687a]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Google Agenda (Sincronização)</span>
          </button>

          <button
            onClick={() => setActiveTab('status')}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'status'
                ? 'border-[#00687a] text-[#00687a]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Status das Integrações</span>
          </button>
        </div>

        {/* TAB 1: WHATSAPP 8H & TEMPLATE EDITOR */}
        {activeTab === 'whatsapp' && (
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-ambient border border-[#eceef0] space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#091426]">
                  Central de Notificações WhatsApp & Modelos de Mensagem
                </h2>
                <p className="text-xs text-slate-500">
                  Edite os textos das notificações automáticas enviadas para seus alunos.
                </p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <p className="text-xs font-bold text-emerald-950">Gatilho Automático de 8 Horas Ativo</p>
              </div>
              <p className="text-xs text-emerald-800">
                Cada aula registrada na sua agenda é computada com antecedência de 8 horas para envio automático da confirmação e do link de acesso.
              </p>
            </div>

            {/* Template Selection & Editor */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Selecione o Modelo de Mensagem
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { key: '8h_reminder', label: '⏰ Lembrete 8h Antes' },
                    { key: 'confirmation', label: '✅ Confirmação Imediata' },
                    { key: 'post_class', label: '🌟 Pós-Aula & Feedback' },
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => {
                        setSelectedTemplateKey(t.key as any);
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        selectedTemplateKey === t.key
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Variable Chips */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-semibold text-slate-600">Inserir variáveis dinâmicas no texto:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { tag: '{aluno_nome}', label: 'Nome do Aluno' },
                    { tag: '{servico_nome}', label: 'Nome da Aula/Serviço' },
                    { tag: '{data}', label: 'Data' },
                    { tag: '{horario}', label: 'Horário' },
                    { tag: '{professor_nome}', label: 'Nome do Professor' },
                    { tag: '{modalidade}', label: 'Modalidade' },
                    { tag: '{link_aula}', label: 'Link da Aula' },
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleInsertVariable(chip.tag)}
                      className="text-[10px] font-mono bg-white hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 px-2 py-1 rounded border border-slate-300 transition-colors"
                    >
                      + {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Texto da Mensagem (com suporte a formatação WhatsApp: *negrito*, _itálico_)
                </label>
                <textarea
                  rows={6}
                  value={templates[selectedTemplateKey]}
                  onChange={(e) =>
                    setTemplates((prev) => ({
                      ...prev,
                      [selectedTemplateKey]: e.target.value,
                    }))
                  }
                  className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 leading-relaxed focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Live Preview Card */}
              <div className="bg-emerald-950 text-emerald-50 p-5 rounded-2xl border border-emerald-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Prévia em Tempo Real (WhatsApp)
                  </span>
                  <span className="text-[10px] bg-emerald-800/60 text-emerald-300 px-2 py-0.5 rounded">
                    Exemplo com {sampleStudent.name}
                  </span>
                </div>
                <div className="p-4 bg-emerald-900/60 rounded-xl border border-emerald-700/50 text-xs font-sans whitespace-pre-wrap leading-relaxed">
                  {renderedPreview}
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleCopy(renderedPreview, 'preview-msg')}
                    className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {copiedItem === 'preview-msg' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedItem === 'preview-msg' ? 'Copiado!' : 'Copiar Prévia'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GOOGLE AGENDA */}
        {activeTab === 'google' && (
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-ambient border border-[#eceef0] space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#091426]">
                  Sincronização com Google Agenda & iCalendar
                </h2>
                <p className="text-xs text-slate-500">
                  Exporte suas aulas para o aplicativo de calendário do celular ou Google Agenda.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="font-bold text-sm text-slate-900">Baixar Arquivo .ICS da Agenda</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Gere um arquivo padrão iCalendar contendo todas as {appointments.length} aulas registradas na sua agenda para importar no Outlook, Apple Calendar ou Google Agenda.
                </p>
                <button
                  onClick={() => downloadIcsCalendarFile(appointments, currentTeacher)}
                  className="w-full py-3 bg-[#00687a] hover:bg-[#004e5c] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Arquivo .ICS ({appointments.length} aulas)</span>
                </button>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="font-bold text-sm text-slate-900">Link de Feed de Calendário</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Copie o link de inscrição direta para manter o Google Calendar sincronizado em tempo real com novos agendamentos.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={icalFeedUrl}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-700"
                  />
                  <button
                    onClick={() => handleCopy(icalFeedUrl, 'ical-url')}
                    className="px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors"
                  >
                    {copiedItem === 'ical-url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedItem === 'ical-url' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STATUS DAS INTEGRAÇÕES */}
        {activeTab === 'status' && (
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-ambient border border-[#eceef0] space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-11 h-11 rounded-2xl bg-cyan-100 text-[#00687a] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#091426]">
                  Status das Integrações do Sistema
                </h2>
                <p className="text-xs text-slate-500">
                  Visão geral das integrações em nuvem e automações conectadas à sua conta.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-[#f7f9fb] rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Operacional
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">WhatsApp & Avisos 8h</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Envios automáticos de confirmação e lembretes configurados para cada aula.
                  </p>
                </div>
              </div>

              <div className="p-5 bg-[#f7f9fb] rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Sincronizado
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Google Calendar</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Exportação em formato padrão .ics e links de agendamento compatíveis.
                  </p>
                </div>
              </div>

              <div className="p-5 bg-[#f7f9fb] rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Workflow className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    Gerenciado
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Webhooks em Nuvem</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Eventos de formulário e agendamentos despachados de forma transparente em background.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[#00687a] shrink-0" />
              <p className="text-xs text-slate-600 leading-relaxed">
                As integrações técnicas com servidores e APIs são mantidas de forma centralizada pelo desenvolvedor. Os formulários submetidos no painel são transmitidos automaticamente para os canais configurados.
              </p>
            </div>
          </div>
        )}

      </div>
    </main>
  );
};
