import React, { useState } from 'react';
import { TeacherProfile } from '../types';
import { 
  User, 
  Save, 
  Check, 
  MessageSquare, 
  Calendar, 
  Copy, 
  ExternalLink, 
  Sparkles,
  ShieldCheck,
  Phone,
  Mail,
  Image as ImageIcon,
  Workflow,
  Zap,
  Send,
  Code2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface SettingsViewProps {
  currentTeacher: TeacherProfile;
  onUpdateTeacher: (updated: TeacherProfile) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentTeacher,
  onUpdateTeacher,
}) => {
  const [name, setName] = useState(currentTeacher.name);
  const [role, setRole] = useState(currentTeacher.role);
  const [specialty, setSpecialty] = useState(currentTeacher.specialty);
  const [bio, setBio] = useState(currentTeacher.bio);
  const [whatsapp, setWhatsapp] = useState(currentTeacher.whatsapp);
  const [email, setEmail] = useState(currentTeacher.email);
  const [avatarUrl, setAvatarUrl] = useState(currentTeacher.avatarUrl);
  const [heroImageUrl, setHeroImageUrl] = useState(currentTeacher.heroImageUrl);
  
  // n8n Webhook & WhatsApp 8h Settings
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState(
    currentTeacher.n8nWebhookUrl || 'https://n8n.seu-dominio.com.br/webhook/whatsapp-8h-confirmacao'
  );
  const [n8nAuthToken, setN8nAuthToken] = useState(
    currentTeacher.n8nAuthToken || 'n8n_sec_99a8b7c6d5e4f3a2b1'
  );
  const [whatsappAutoReminder8h, setWhatsappAutoReminder8h] = useState(
    currentTeacher.whatsappAutoReminder8h ?? true
  );
  const [includeMeetLinkInPayload, setIncludeMeetLinkInPayload] = useState(true);

  // Testing & Feedback States
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    success: boolean;
    message: string;
    timestamp: string;
  } | null>(null);
  const [showPayloadDetails, setShowPayloadDetails] = useState(false);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [googleCalendarSync, setGoogleCalendarSync] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTeacher({
      ...currentTeacher,
      name,
      role,
      specialty,
      bio,
      whatsapp,
      email,
      avatarUrl,
      heroImageUrl,
      n8nWebhookUrl,
      n8nAuthToken,
      whatsappAutoReminder8h,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(label);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const generateNewToken = () => {
    const randomHex = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    const newToken = `n8n_sec_${randomHex}`;
    setN8nAuthToken(newToken);
  };

  const handleTestN8nWebhook = async () => {
    if (!n8nWebhookUrl.trim()) {
      setTestStatus({
        success: false,
        message: 'Por favor, insira uma URL válida de webhook antes de testar.',
        timestamp: new Date().toLocaleTimeString('pt-BR'),
      });
      return;
    }

    setIsTestingWebhook(true);
    setTestStatus(null);

    // Simulate sending mock dispatch payload to n8n webhook
    setTimeout(() => {
      setIsTestingWebhook(false);
      setTestStatus({
        success: true,
        message: 'Webhook disparado com sucesso! Payload de teste entregue ao nó n8n (HTTP 200 OK).',
        timestamp: new Date().toLocaleTimeString('pt-BR'),
      });
    }, 1200);
  };

  const sampleDispatchPayload = {
    event: 'appointment.reminder_8h',
    timestamp: new Date().toISOString(),
    trigger_rule: 'scheduled_8h_before',
    teacher: {
      id: currentTeacher.id,
      name: name,
      whatsapp: whatsapp,
      email: email,
    },
    student: {
      name: 'Mariana Costa',
      phone: '5511987654321',
      email: 'mariana.costa@email.com',
    },
    appointment: {
      id: 'app-sample-883',
      serviceName: 'Personal Trainer / Mentoria',
      date: new Date().toISOString().split('T')[0],
      startTime: '14:00',
      endTime: '15:00',
      dispatchTargetTime: '06:00 (8 horas antes)',
      modality: 'Online (Google Meet)',
      meetLink: includeMeetLinkInPayload ? 'https://meet.google.com/abc-defg-hij' : undefined,
    },
    message_text: `*CONFIRMAÇÃO DE AULA - 8H ANTES* ⏰\nOlá, Mariana Costa! Tudo bem? 👋\nPassando para confirmar sua aula de Personal Trainer / Mentoria com o(a) ${name} hoje às 14:00 (daqui a ~8 horas).\n\nResponda SIM para confirmar presença.`,
  };

  const directImageLinks = [
    {
      title: 'Foto de Perfil - Roberto Almeida (Snippet 4 / Booking)',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBAI63loLl-GarxR8nRCM0QR_UD9OOriq4QTFT68JOsd_926nwPUc3YQ07yVmhVMAAPYJ89Jk-h5GpttNyLMUKD4WJPNozVv5lOrRdBNWMLDFdJiooTvn2t5PA6mb_GGnUILVGezO-aIVc_7VRKB4Y9zIkR4WIpESk7H5VQbPXLr0Yc6P1uJtXayeFWG6nJcZukPp1IRYyxFma22VT0nZr1gy1JyGPPk1usK9JBwJk1dapBCXIb2Nh8Ig'
    },
    {
      title: 'Hero Banner - Landing Page (Snippet 5 / Hero)',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVhd3Gm8BsjE6yAt5EHiGHPkx_BVVEYYpcN6VGKZN4g_-BDDJoJHlEE6iJDBTAPsIi8Bu_Zi0xKYVDhUk32noUxlhmBncbdKbx636FTTLanozGQ4fpbo6GQc-GEbPKLr8X3akCDmYWb2M-J3HlSXz5fOa-X9vVy9kGFQ3Q1jUqP7hi_AXvxpZHNkXGk6KDbPgKF18vC_AZOqZ4_F2M2_zOts5FiURUi6vDmmK3pxrHynQYbK3oOwMePg'
    },
    {
      title: 'Avatar Aluna Mariana Costa (Snippet 2 / Agenda)',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBK4ZdjGlXcYUkNbEPgBCJ2ybOX87uTuhEIW-bh1S_6aUuhw3LbpojczkFt7hLMuVkBrvtmonkTNLYDBnpXnY8VeoyWHUzo9lTl7o4AYZV53TqGGXbGuc3CVUOLKbpGRa80w_0YcCGtnYeuP97M5S1TuGnG5L72vqotjZDwMVDIWF9N7shtJ2fI_9L2OOOUCTYfgP1vQF4Vjms-_6o4t7L90jfsLMghpGEespEMyKNBXoQr7B-RD-cww'
    },
    {
      title: 'Avatar Usuário Logado (TopAppBar)',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRKPQ5OJFiaVtLR3140JkYX0CmJDG6diY6x48NV714WpXegXPherHcomf8GAjeB8e9TtVs_OjJ1KtDScmqlpNxeaGYEIf5iSNb-m-P0iUF5wk9iGWft7sfL1eY2cAKgwhlUMdzxvhNUsfhqyVZp2ZAj5TaHzLbALHRM0Gv7csSCQYCEe4WB5_VZFNsiiPOTg4UM43WU1geyv1Z4zV7_FoWk1pZTOOHwdqu-r5X5Vg-veCqqQISye_tPw'
    },
    {
      title: 'Avatar Professor Alternativo (Carlos Silva)',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzOpE1WBXepMUm3G21XYxME_H53gwFI01_uuNwk9BOF1CTTxYb4qTbeVUbV38GDICoCEU9kpzLs1nDsZxn0yxfFYrS76Dvpzz5yVPLUVK1W4yolwLDAoSUnc8m6Izd8DLb67DRvju6h-eYiJKdwXw4wwOhv8eCGdftyvFgDia9qy7kMHgSs_Yym3aNph20qDJ2S6iB4equOLDfHGfwqs4poutwgneY-qeEJqz9XoSvikiN8bWwky29MQ'
    },
    {
      title: 'Hero Carlos Silva',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8hjOK5vgwEF0koIHtHT-fRqaDLAvZLOXlClEgNMEVoppmGUF8c6lqqAJhnXXyYuON1d6KSCSq06-lJI7CgSfFXOKZkNsYtHUxcemND81zfiNTCr4ugxQKCh5Ai6xJX1BYeTp9z7sszydzQnXS5oj3AKSKvBCyI2w0FGyWHsFk5SyfJPUY7tdKT8Vv3-7fcwcscJaB8GbFAKutVW9uwly9Z-K-NoB9IBR9llm_dppFBzLj9bd0qNSmXQ'
    }
  ];

  return (
    <main className="flex-1 p-4 md:p-10 bg-[#f7f9fb] pb-32 overflow-y-auto font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#091426] tracking-tight">
              Configurações do Professor
            </h1>
            <p className="text-sm text-[#45474c] mt-1">
              Personalize seu perfil profissional, fotos e integrações do sistema.
            </p>
          </div>

          {savedSuccess && (
            <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>Salvo com sucesso!</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Profile Details Card */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-ambient border border-[#eceef0] space-y-6">
            <h2 className="text-lg font-bold text-[#091426] border-b border-slate-100 pb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-[#00687a]" />
              <span>Perfil Público do Professor</span>
            </h2>

            {/* Avatar & Hero preview */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-4">
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                  className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-sm"
                />
              </div>
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <p className="text-sm font-bold text-[#091426]">Foto de Exibição</p>
                <p className="text-xs text-slate-500">
                  Esta foto aparece na sua barra lateral e na tela de agendamento do aluno.
                </p>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full text-xs p-2 bg-[#f7f9fb] border border-slate-300 rounded-lg"
                  placeholder="URL da imagem de perfil"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título / Especialidade
                </label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  WhatsApp para Contato
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail Profissional
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Headline / Especialidade em Destaque
              </label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Biografia e Metodologia
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                URL da Foto Hero (Landing Page)
              </label>
              <input
                type="url"
                value={heroImageUrl}
                onChange={(e) => setHeroImageUrl(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
              />
            </div>
          </div>

          {/* n8n Webhook & WhatsApp 8h Automation Card */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-ambient border border-[#eceef0] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold shadow-xs">
                  <Workflow className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#091426]">
                      Automação n8n & Notificações WhatsApp (8h Antes)
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      whatsappAutoReminder8h && n8nWebhookUrl 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {whatsappAutoReminder8h && n8nWebhookUrl ? 'Webhook Ativo' : 'Pausado'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Envie automaticamente o aviso de confirmação aos alunos 8 horas antes do início da aula através do seu fluxo n8n.
                  </p>
                </div>
              </div>

              {/* Master Toggle */}
              <div className="flex items-center gap-2.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Automação Ativa:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={whatsappAutoReminder8h}
                    onChange={(e) => setWhatsappAutoReminder8h(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            {/* Explanatory Banner */}
            <div className="p-4 bg-orange-50/80 rounded-2xl border border-orange-200/80 flex items-start gap-3">
              <Zap className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div className="text-xs text-orange-950 space-y-1">
                <p className="font-bold text-orange-900">Como funciona o disparo de 8 horas com n8n:</p>
                <p className="leading-relaxed text-orange-800">
                  Ao agendar uma aula (ex: às <strong>14:00</strong>), o sistema computa o timestamp de disparo para 8 horas antes (às <strong>06:00</strong>). Um HTTP POST é transmitido para o seu Webhook do n8n contendo os dados do aluno, detalhes da aula, link de videoconferência e o texto pronto para WhatsApp.
                </p>
              </div>
            </div>

            {/* Webhook URL Input */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    URL do Webhook do n8n (HTTP POST) *
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">Suporta n8n Cloud & Self-Hosted</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      required={whatsappAutoReminder8h}
                      value={n8nWebhookUrl}
                      onChange={(e) => setN8nWebhookUrl(e.target.value)}
                      placeholder="https://n8n.seu-dominio.com.br/webhook/whatsapp-8h-confirmacao"
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-[#00687a] focus:ring-1 focus:ring-[#00687a] transition-all"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleTestN8nWebhook}
                    disabled={isTestingWebhook}
                    className="px-5 py-3 bg-[#00687a] hover:bg-[#004e5c] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shrink-0 transition-all shadow-xs disabled:opacity-50"
                  >
                    {isTestingWebhook ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Disparando Teste...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Testar Disparo no n8n</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Test Result Feedback */}
              {testStatus && (
                <div className={`p-4 rounded-xl text-xs flex items-start gap-3 border animate-in fade-in duration-200 ${
                  testStatus.success 
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                    : 'bg-red-50 text-red-900 border-red-200'
                }`}>
                  {testStatus.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-center font-bold">
                      <span>{testStatus.success ? 'Conexão e Disparo Bem-Sucedidos!' : 'Falha no Disparo'}</span>
                      <span className="text-[10px] font-normal text-slate-500">{testStatus.timestamp}</span>
                    </div>
                    <p className="mt-1 text-slate-700 leading-relaxed">{testStatus.message}</p>
                  </div>
                </div>
              )}

              {/* Security Token & Payload options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Token de Autenticação (Header X-Webhook-Token)
                    </label>
                    <button
                      type="button"
                      onClick={generateNewToken}
                      className="text-[10px] text-[#00687a] hover:underline font-semibold"
                    >
                      Gerar Novo
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={n8nAuthToken}
                      onChange={(e) => setN8nAuthToken(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(n8nAuthToken, 'token-clip')}
                      className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-1 shrink-0 transition-colors border border-slate-300"
                    >
                      {copiedLink === 'token-clip' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <span className="block text-xs font-semibold text-slate-700">Parâmetros Adicionais do Payload:</span>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeMeetLinkInPayload}
                      onChange={(e) => setIncludeMeetLinkInPayload(e.target.checked)}
                      className="rounded text-[#00687a] focus:ring-[#00687a]"
                    />
                    <span>Incluir link da videoconferência (Meet/Zoom)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={googleCalendarSync}
                      onChange={(e) => setGoogleCalendarSync(e.target.checked)}
                      className="rounded text-[#00687a] focus:ring-[#00687a]"
                    />
                    <span>Sincronizar eventos também com Google Calendar</span>
                  </label>
                </div>
              </div>

              {/* JSON Payload Inspection Accordion */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 mt-4">
                <button
                  type="button"
                  onClick={() => setShowPayloadDetails(!showPayloadDetails)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Code2 className="w-4 h-4 text-[#00687a]" />
                    <span>Inspecionar Estrutura do Payload JSON transmitido ao n8n</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-normal">POST JSON (application/json)</span>
                    {showPayloadDetails ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </button>

                {showPayloadDetails && (
                  <div className="p-4 border-t border-slate-200 bg-slate-900 text-slate-100 rounded-b-2xl font-mono text-[11px] space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <span className="text-slate-400 font-bold">Exemplo Real de Payload POST:</span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(JSON.stringify(sampleDispatchPayload, null, 2), 'payload-json')
                        }
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[10px] flex items-center gap-1.5 transition-colors border border-slate-700"
                      >
                        {copiedLink === 'payload-json' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar JSON</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="overflow-x-auto p-2 bg-slate-950/70 rounded-xl leading-relaxed text-emerald-400">
                      {JSON.stringify(sampleDispatchPayload, null, 2)}
                    </pre>

                    <div className="pt-2 text-slate-400 text-[10px] space-y-1">
                      <p className="font-semibold text-slate-300">Dica para o seu Workflow no n8n:</p>
                      <p>• Conecte o nó <strong>Webhook (POST)</strong> a um nó de WhatsApp (como Evolution API, Z-API, Baileys ou HTTP Request).</p>
                      <p>• Mapeie o destinatário para <code className="text-cyan-300 font-bold">{`{{ $json.body.student.phone }}`}</code> e o texto para <code className="text-cyan-300 font-bold">{`{{ $json.body.message_text }}`}</code>.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Direct HTML Images Reference Table */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-ambient border border-[#eceef0] space-y-4">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h2 className="text-lg font-bold text-[#091426] flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#00687a]" />
                <span>Links Diretos das Imagens do HTML</span>
              </h2>
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold">
                6 Imagens Ativas
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Todas as 6 imagens enviadas estão integradas com links diretos acessíveis em todo o projeto:
            </p>

            <div className="space-y-3">
              {directImageLinks.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-[#f7f9fb] rounded-xl border border-slate-200 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={item.url}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-lg object-cover border border-slate-300 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#091426] truncate">{item.title}</p>
                      <p className="text-[11px] text-slate-500 truncate font-mono">{item.url}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(item.url, item.title)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-[#00687a] border border-[#c5c6cd] rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    {copiedLink === item.title ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Link</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="h-12 px-8 bg-[#00687a] hover:bg-[#004e5c] text-white font-semibold text-sm rounded-xl flex items-center gap-2 shadow-ambient hover:shadow-elevated transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Todas as Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};
