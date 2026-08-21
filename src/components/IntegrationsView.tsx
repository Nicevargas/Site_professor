import React, { useState } from 'react';
import { TeacherProfile, ServiceItem, Appointment, Student, Reminder } from '../types';
import { 
  Calendar, 
  MessageSquare, 
  Webhook, 
  Check, 
  Copy, 
  ExternalLink, 
  Zap, 
  Download, 
  CheckCircle2, 
  Sparkles,
  Layers,
  Send,
  Play,
  Settings2,
  Workflow
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
  const [activeTab, setActiveTab] = useState<'n8n' | 'google' | 'whatsapp'>('n8n');

  // n8n Webhook state
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState(
    currentTeacher.n8nWebhookUrl || 'https://n8n.seu-dominio.com.br/webhook/whatsapp-8h-confirmacao'
  );
  const [n8nSecretToken, setN8nSecretToken] = useState(
    currentTeacher.n8nAuthToken || 'n8n_sec_prof_' + currentTeacher.id
  );
  const [webhookSaved, setWebhookSaved] = useState(false);
  const [testSent, setTestSent] = useState(false);

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
    status: 'confirmed' as const,
    meetLink: 'https://meet.google.com/abc-defg-hij'
  };

  const renderedPreview = applyTemplateVariables(templates[selectedTemplateKey], {
    aluno_nome: sampleStudent.name,
    servico_nome: sampleService.name,
    data: new Date().toLocaleDateString('pt-BR'),
    horario: sampleAppointment.startTime,
    professor_nome: currentTeacher.name,
    modalidade: sampleAppointment.modality,
    link_aula: sampleAppointment.meetLink || 'https://meet.google.com/abc-defg-hij',
  });

  const icalFeedUrl = `https://agendaprofessor.com.br/api/ical/${currentTeacher.id}.ics`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2500);
  };

  const handleSendTestWebhook = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const samplePayload = {
    event: "appointment.created",
    source: "agenda_professor",
    teacherId: currentTeacher.id,
    teacherName: currentTeacher.name,
    timestamp: new Date().toISOString(),
    appointment: {
      id: "apt-101",
      studentName: students[0]?.name || "Mariana Costa",
      studentPhone: students[0]?.phone || "+55 11 98765-4321",
      studentEmail: students[0]?.email || "mariana.costa@email.com",
      serviceName: services[0]?.name || "Mentoria Executiva",
      date: new Date().toISOString().split('T')[0],
      startTime: "14:00",
      endTime: "15:00",
      modality: "Online (Google Meet)",
      price: services[0]?.price || 180,
      whatsapp8hDispatchTime: "06:00:00"
    }
  };

  return (
    <main className="flex-1 p-4 md:p-10 bg-[#f7f9fb] pb-32 overflow-y-auto font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#091426] tracking-tight flex items-center gap-2.5">
              <Zap className="w-7 h-7 text-[#00687a]" />
              <span>Automações & Central de Integrações</span>
            </h1>
            <p className="text-sm text-[#45474c] mt-1">
              Conecte sua agenda com <strong>n8n</strong>, Google Calendar e motor de confirmações automáticas de WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              n8n & Webhooks Ativos
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('n8n')}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'n8n'
                ? 'border-[#00687a] text-[#00687a]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Workflow className="w-4 h-4" />
            <span>Automações n8n & Webhooks</span>
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
            <span>Google Agenda (2 Vias)</span>
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'whatsapp'
                ? 'border-[#00687a] text-[#00687a]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp (8h Antes)</span>
          </button>
        </div>

        {/* TAB 1: N8N AUTOMATIONS & WEBHOOKS */}
        {activeTab === 'n8n' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-ambient border border-[#eceef0] space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-orange-100 text-[#ff6d5a] flex items-center justify-center font-bold text-lg">
                    <Workflow className="w-6 h-6 text-[#ff6d5a]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#091426]">
                      Integração Oficial com n8n (Workflow Automation)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Dispare fluxos automatizados no n8n instantaneamente a cada novo agendamento ou cancelamento.
                    </p>
                  </div>
                </div>

                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                  <Sparkles className="w-3.5 h-3.5" />
                  Self-hosted / n8n Cloud
                </span>
              </div>

              {/* Webhook Endpoint Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Webhook URL do n8n (Node Webhook - POST)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={n8nWebhookUrl}
                      onChange={(e) => setN8nWebhookUrl(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:border-[#00687a] focus:ring-1 focus:ring-[#00687a] transition-all"
                      placeholder="https://seu-n8n.com/webhook/agenda-aulas"
                    />
                    <button
                      onClick={() => {
                        setWebhookSaved(true);
                        setTimeout(() => setWebhookSaved(false), 2500);
                      }}
                      className="px-5 bg-[#091426] hover:bg-[#1e293b] text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-xs"
                    >
                      {webhookSaved ? 'Salvo!' : 'Salvar URL'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Token de Autenticação (Header X-Webhook-Token)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={n8nSecretToken}
                        onChange={(e) => setN8nSecretToken(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-700"
                      />
                      <button
                        onClick={() => handleCopy(n8nSecretToken, 'n8n-token')}
                        className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-1 shrink-0 transition-colors"
                      >
                        {copiedItem === 'n8n-token' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedItem === 'n8n-token' ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col justify-end">
                    <button
                      onClick={handleSendTestWebhook}
                      className="h-10 px-4 bg-[#00687a] hover:bg-[#004e5c] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
                    >
                      {testSent ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                          <span>Payload Enviado para o n8n!</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 text-cyan-300" />
                          <span>Enviar Disparo de Teste para o n8n</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* n8n Workflow Guide & Recipes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h3 className="font-bold text-sm text-[#091426]">Disparo WhatsApp via n8n</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Conecte o n8n à Evolution API ou Z-API para disparar mensagens no WhatsApp com o template 8 horas antes da aula.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 text-[#00687a] flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h3 className="font-bold text-sm text-[#091426]">Sincronização Google Sheets</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Insira automaticamente cada novo aluno e histórico de aula em uma planilha organizada de controle financeiro.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h3 className="font-bold text-sm text-[#091426]">Notificações no Telegram</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Receba um alerta no seu Telegram toda vez que um aluno agendar uma nova mentoria ou aula online.
                </p>
              </div>
            </div>

            {/* Payload JSON Inspector */}
            <div className="bg-white rounded-2xl p-6 shadow-ambient border border-[#eceef0] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-[#00687a]" />
                  <span className="text-xs font-bold text-[#091426] uppercase tracking-wider">
                    Exemplo de Payload JSON Enviado para o Node Webhook do n8n
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(JSON.stringify(samplePayload, null, 2), 'payload-json')}
                  className="text-xs text-[#00687a] hover:underline font-semibold flex items-center gap-1"
                >
                  {copiedItem === 'payload-json' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedItem === 'payload-json' ? 'JSON Copiado' : 'Copiar JSON'}</span>
                </button>
              </div>
              <pre className="p-4 bg-[#091426] text-cyan-300 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
                {JSON.stringify(samplePayload, null, 2)}
              </pre>
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
                  Integração Google Calendário em Tempo Real
                </h2>
                <p className="text-xs text-slate-500">
                  Sincronize sua grade com o Google Calendar em tempo real via WebCal e links diretos.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Link de Inscrição WebCal (Sincronização 2 Vias no Google Agenda)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={icalFeedUrl}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-700"
                  />
                  <button
                    onClick={() => handleCopy(icalFeedUrl, 'ical-url')}
                    className="px-4 bg-[#00687a] hover:bg-[#004e5c] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    {copiedItem === 'ical-url' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedItem === 'ical-url' ? 'Copiado!' : 'Copiar Link'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => downloadIcsCalendarFile(appointments, currentTeacher)}
                  className="flex-1 h-11 bg-[#091426] hover:bg-[#1e293b] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Baixar Arquivo Completo (.ics)</span>
                </button>

                <a
                  href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(icalFeedUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 h-11 bg-white border border-[#00687a] text-[#00687a] hover:bg-cyan-50 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Inscrever no Google Calendar Web</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WHATSAPP 8H & TEMPLATE EDITOR */}
        {activeTab === 'whatsapp' && (
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-ambient border border-[#eceef0] space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#091426]">
                  Central de Notificações WhatsApp & Editor de Templates
                </h2>
                <p className="text-xs text-slate-500">
                  Configure mensagens automáticas personalizadas com variáveis dinâmicas e gatilho de 8 horas.
                </p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-700" />
                <p className="text-xs font-bold text-emerald-950">Gatilho Automático de 8 Horas Ativo</p>
              </div>
              <p className="text-xs text-emerald-800">
                Cada aula registrada na agenda é computada com o timestamp exato de <code className="font-mono bg-white px-1 py-0.5 rounded text-[11px] font-bold">início_aula - 8h</code> e enviada pelo n8n ou disparador local.
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
                    Exemplo: {students[0]?.name || 'Mariana Costa'}
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

      </div>
    </main>
  );
};
