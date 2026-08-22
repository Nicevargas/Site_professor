import React, { useState } from 'react';
import { TeacherProfile, VacationModeConfig } from '../types';
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
  ChevronUp, 
  Palette, 
  Upload,
  Palmtree,
  CalendarCheck,
  Eye
} from 'lucide-react';
import { THEME_PRESETS, DEFAULT_LOGOS } from '../utils/themePresets';
import { readFileAsDataUrl } from '../utils/mediaAndTextHelpers';
import { formatVacationDateBR } from '../utils/vacationHelpers';

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
  
  // Visual Branding, Colors & Logo
  const [brandName, setBrandName] = useState(currentTeacher.brandName || currentTeacher.name);
  const [logoUrl, setLogoUrl] = useState(currentTeacher.logoUrl || DEFAULT_LOGOS[0].url);
  const [showLogo, setShowLogo] = useState(currentTeacher.showLogo ?? true);
  const [primaryColor, setPrimaryColor] = useState(currentTeacher.primaryColor || '#00687a');
  const [secondaryColor, setSecondaryColor] = useState(currentTeacher.secondaryColor || '#57dffe');
  const [accentColor, setAccentColor] = useState(currentTeacher.accentColor || '#004e5c');
  const [themePreset, setThemePreset] = useState<string>(currentTeacher.themePreset || 'ocean-teal');

  // Vacation / Out of Office Mode
  const [vacationEnabled, setVacationEnabled] = useState(currentTeacher.vacationMode?.enabled || false);
  const [vacationStartDate, setVacationStartDate] = useState(currentTeacher.vacationMode?.startDate || '');
  const [vacationEndDate, setVacationEndDate] = useState(currentTeacher.vacationMode?.endDate || '');
  const [vacationReturnDate, setVacationReturnDate] = useState(currentTeacher.vacationMode?.returnDate || '');
  const [vacationTitle, setVacationTitle] = useState(currentTeacher.vacationMode?.title || 'Recesso Pedagógico / Férias');
  const [vacationMessage, setVacationMessage] = useState(
    currentTeacher.vacationMode?.message ||
      'Estou em período de recesso. O agendamento online está temporariamente pausado. Retornaremos com as aulas em breve!'
  );
  const [vacationAllowWaitlist, setVacationAllowWaitlist] = useState(
    currentTeacher.vacationMode?.allowWaitlistOrContact ?? true
  );
  const [vacationCustomButtonText, setVacationCustomButtonText] = useState(
    currentTeacher.vacationMode?.customButtonText || 'Entrar na Lista de Espera'
  );

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

  const handleApplyPreset = (preset: typeof THEME_PRESETS[0]) => {
    setThemePreset(preset.id);
    setPrimaryColor(preset.primaryColor);
    setSecondaryColor(preset.secondaryColor);
    setAccentColor(preset.accentColor);
  };

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await readFileAsDataUrl(file);
        setLogoUrl(dataUrl);
      } catch (err) {
        console.error('Error reading logo file:', err);
      }
    }
  };

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
      brandName,
      logoUrl,
      showLogo,
      primaryColor,
      secondaryColor,
      accentColor,
      themePreset,
      n8nWebhookUrl,
      n8nAuthToken,
      whatsappAutoReminder8h,
      vacationMode: {
        enabled: vacationEnabled,
        startDate: vacationStartDate || undefined,
        endDate: vacationEndDate || undefined,
        returnDate: vacationReturnDate || undefined,
        title: vacationTitle.trim() || 'Recesso Pedagógico / Férias',
        message: vacationMessage.trim() || 'Estou em período de recesso. Agendamentos temporariamente pausados.',
        allowWaitlistOrContact: vacationAllowWaitlist,
        customButtonText: vacationCustomButtonText.trim() || 'Entrar na Lista de Espera',
      }
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

          {/* Visual Identity, Colors & Logo Card */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-ambient border border-[#eceef0] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#091426]">
                    Identidade Visual, Cores & Logotipo
                  </h2>
                  <p className="text-xs text-slate-500">
                    Defina as cores principais, paleta e logo que estilizam o site público e a página de agendamento dos alunos.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-full border border-slate-300 shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                  title={`Cor Primária: ${primaryColor}`}
                />
                <div 
                  className="w-6 h-6 rounded-full border border-slate-300 shadow-xs"
                  style={{ backgroundColor: secondaryColor }}
                  title={`Cor Secundária: ${secondaryColor}`}
                />
                <div 
                  className="w-6 h-6 rounded-full border border-slate-300 shadow-xs"
                  style={{ backgroundColor: accentColor }}
                  title={`Cor de Destaque: ${accentColor}`}
                />
              </div>
            </div>

            {/* Presets Grid */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Paletas de Cores Recomendadas
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {THEME_PRESETS.map((preset) => {
                  const isSelected = themePreset === preset.id || primaryColor === preset.primaryColor;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col gap-1.5 transition-all ${
                        isSelected 
                          ? 'border-[#00687a] bg-cyan-50/60 ring-2 ring-[#00687a]/20' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 truncate">{preset.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#00687a]" />}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full border border-slate-300 shadow-xs shrink-0" style={{ backgroundColor: preset.primaryColor }} />
                        <span className="w-4 h-4 rounded-full border border-slate-300 shadow-xs shrink-0" style={{ backgroundColor: preset.secondaryColor }} />
                        <span className="w-4 h-4 rounded-full border border-slate-300 shadow-xs shrink-0" style={{ backgroundColor: preset.accentColor }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Hex Color Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Cor Primária (Botões & Títulos)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 text-xs p-2 font-mono bg-[#f7f9fb] border border-slate-300 rounded-lg uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Cor Secundária (Realces & Badges)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 text-xs p-2 font-mono bg-[#f7f9fb] border border-slate-300 rounded-lg uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Cor de Destaque (Gradientes & CTA)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1 text-xs p-2 font-mono bg-[#f7f9fb] border border-slate-300 rounded-lg uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Logo and Brand Name */}
            <div className="pt-3 border-t border-slate-100 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Comercial / Marca do Site
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#00687a]"
                    placeholder="Ex: Prof. Matheus Silva | Aulas de Física"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    URL ou Arquivo do Logotipo
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="flex-1 p-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#00687a]"
                      placeholder="https://... ou faça upload"
                    />
                    <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 border border-slate-200 shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoFileUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Logo presets selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600">Modelos de Logotipo Prontos:</label>
                <div className="flex flex-wrap items-center gap-3">
                  {DEFAULT_LOGOS.map((logo) => (
                    <button
                      key={logo.id}
                      type="button"
                      onClick={() => setLogoUrl(logo.url)}
                      className={`flex items-center gap-2 p-1.5 pr-3 rounded-xl border transition-all ${
                        logoUrl === logo.url 
                          ? 'border-[#00687a] bg-cyan-50/60 ring-2 ring-[#00687a]/20' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <img 
                        src={logo.url} 
                        alt={logo.name} 
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-lg object-contain bg-slate-50 border border-slate-200" 
                      />
                      <span className="text-xs text-slate-700 font-medium">{logo.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ================= CARD: MODO DE FÉRIAS & AUSÊNCIA ================= */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-ambient border border-[#eceef0] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shadow-xs">
                  <Palmtree className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#091426]">
                      Modo de Férias & Recesso Pedagógico
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      vacationEnabled 
                        ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {vacationEnabled ? '🌴 FÉRIAS ATIVADAS' : 'DESATIVADO'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Oculte ou pause a disponibilidade de agendamento online no seu site público durante seus períodos de ausência ou descanso.
                  </p>
                </div>
              </div>

              {/* Fast toggle switch */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={vacationEnabled}
                  onChange={(e) => setVacationEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500 shadow-inner"></div>
              </label>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Atalhos Rápidos de Período
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const y = new Date().getFullYear();
                    setVacationStartDate(`${y}-12-20`);
                    setVacationEndDate(`${y + 1}-01-05`);
                    setVacationReturnDate(`${y + 1}-01-06`);
                    setVacationTitle('Recesso de Fim de Ano');
                    setVacationMessage(`Estaremos em recesso de fim de ano de 20/12 a 05/01. As aulas retornam em 06/01/${y + 1}.`);
                    setVacationEnabled(true);
                  }}
                  className="p-3 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-xl text-left transition-all text-xs"
                >
                  <p className="font-bold text-slate-800">Fim de Ano</p>
                  <p className="text-[10px] text-slate-500">20 Dez - 05 Jan</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const y = new Date().getFullYear();
                    setVacationStartDate(`${y}-07-15`);
                    setVacationEndDate(`${y}-07-31`);
                    setVacationReturnDate(`${y}-08-01`);
                    setVacationTitle('Férias de Inverno / Julho');
                    setVacationMessage(`Período de férias de 15/07 a 31/07. Novos agendamentos online reabrem em 01/08/${y}.`);
                    setVacationEnabled(true);
                  }}
                  className="p-3 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-xl text-left transition-all text-xs"
                >
                  <p className="font-bold text-slate-800">Férias de Julho</p>
                  <p className="text-[10px] text-slate-500">15 Jul - 31 Jul</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const s = new Date();
                    const e = new Date();
                    e.setDate(s.getDate() + 7);
                    const r = new Date();
                    r.setDate(s.getDate() + 8);
                    const sStr = s.toISOString().split('T')[0];
                    const eStr = e.toISOString().split('T')[0];
                    const rStr = r.toISOString().split('T')[0];
                    setVacationStartDate(sStr);
                    setVacationEndDate(eStr);
                    setVacationReturnDate(rStr);
                    setVacationTitle('Pausa Temporária / Ausência');
                    setVacationMessage(`Estarei ausente entre ${formatVacationDateBR(sStr, false)} e ${formatVacationDateBR(eStr, false)}. Retorno às aulas em ${formatVacationDateBR(rStr, true)}.`);
                    setVacationEnabled(true);
                  }}
                  className="p-3 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-xl text-left transition-all text-xs"
                >
                  <p className="font-bold text-slate-800">Pausa de 1 Semana</p>
                  <p className="text-[10px] text-slate-500">+7 dias de recesso</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const s = new Date();
                    const e = new Date();
                    e.setDate(s.getDate() + 14);
                    const r = new Date();
                    r.setDate(s.getDate() + 15);
                    const sStr = s.toISOString().split('T')[0];
                    const eStr = e.toISOString().split('T')[0];
                    const rStr = r.toISOString().split('T')[0];
                    setVacationStartDate(sStr);
                    setVacationEndDate(eStr);
                    setVacationReturnDate(rStr);
                    setVacationTitle('Férias Pedagógicas (15 Dias)');
                    setVacationMessage(`Período de férias de 15 dias entre ${formatVacationDateBR(sStr, false)} e ${formatVacationDateBR(eStr, false)}. As aulas recomeçam em ${formatVacationDateBR(rStr, true)}.`);
                    setVacationEnabled(true);
                  }}
                  className="p-3 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-xl text-left transition-all text-xs"
                >
                  <p className="font-bold text-slate-800">Férias 15 Dias</p>
                  <p className="text-[10px] text-slate-500">+15 dias de pausa</p>
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
                  value={vacationStartDate}
                  onChange={(e) => setVacationStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Término da Ausência</span>
                </label>
                <input
                  type="date"
                  value={vacationEndDate}
                  onChange={(e) => {
                    setVacationEndDate(e.target.value);
                    if (!vacationReturnDate && e.target.value) {
                      try {
                        const d = new Date(e.target.value + 'T12:00:00');
                        d.setDate(d.getDate() + 1);
                        setVacationReturnDate(d.toISOString().split('T')[0]);
                      } catch {
                        // ignore
                      }
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5 text-amber-900">
                  <CalendarCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Data de Retorno das Aulas</span>
                </label>
                <input
                  type="date"
                  value={vacationReturnDate}
                  onChange={(e) => setVacationReturnDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-amber-50/70 border border-amber-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Title & Message */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título do Aviso no Site
                </label>
                <input
                  type="text"
                  value={vacationTitle}
                  onChange={(e) => setVacationTitle(e.target.value)}
                  placeholder="Ex: Recesso Pedagógico / Férias"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mensagem Informativa aos Alunos e Visitantes
                </label>
                <textarea
                  rows={3}
                  value={vacationMessage}
                  onChange={(e) => setVacationMessage(e.target.value)}
                  placeholder="Explique o período de recesso e que novos agendamentos online reabrirão na data de retorno..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>

            {/* Waitlist Toggle */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Permitir que Alunos entrem na Lista de Espera pelo WhatsApp</span>
                  </span>
                  <p className="text-[11px] text-slate-500">
                    O botão de agendamento é substituído por uma chamada para o WhatsApp com mensagem pré-formatada para o retorno.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={vacationAllowWaitlist}
                  onChange={(e) => setVacationAllowWaitlist(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
              </div>

              {vacationAllowWaitlist && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Texto do Botão de Contato
                  </label>
                  <input
                    type="text"
                    value={vacationCustomButtonText}
                    onChange={(e) => setVacationCustomButtonText(e.target.value)}
                    placeholder="Ex: Entrar na Lista de Espera"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>

            {/* Public Banner Live Preview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Pré-visualização do Banner no Site Público:</span>
                </span>
                <span className="text-[10px] text-slate-400">Tempo real</span>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/70 border border-amber-300 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                    <Palmtree className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-xs font-bold text-amber-950">
                        {vacationTitle || 'Período de Recesso / Férias'}
                      </h4>
                      {vacationReturnDate && (
                        <span className="px-2 py-0.5 bg-amber-200/80 text-amber-900 rounded-md text-[10px] font-bold">
                          Retorno das aulas em {formatVacationDateBR(vacationReturnDate, true)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-amber-900/90 mt-1 leading-relaxed">
                      {vacationMessage || 'Estou em período de recesso. Agendamentos temporariamente pausados.'}
                    </p>
                    {vacationAllowWaitlist && (
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold shadow-xs">
                          <Phone className="w-3 h-3" />
                          <span>{vacationCustomButtonText || 'Entrar na Lista de Espera'}</span>
                        </span>
                        <span className="text-[10px] text-amber-800 font-medium">
                          Agendamento direto pausado
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notificações & Avisos Automáticos WhatsApp (8h Antes) */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-ambient border border-[#eceef0] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-xs">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#091426]">
                      Notificações & Avisos Automáticos de WhatsApp (8h Antes)
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      whatsappAutoReminder8h 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {whatsappAutoReminder8h ? 'Ativo em Segundo Plano' : 'Pausado'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Envie automaticamente o aviso de confirmação aos alunos 8 horas antes do início de cada aula.
                  </p>
                </div>
              </div>

              {/* Master Toggle */}
              <div className="flex items-center gap-2.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Envio Automático:</span>
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

            {/* Informational Banner for Teacher */}
            <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 flex items-start gap-3">
              <Zap className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-950 space-y-1">
                <p className="font-bold text-emerald-900">Integração Automática & Despacho Direto:</p>
                <p className="leading-relaxed text-emerald-800">
                  Todas as aulas agendadas e formulários preenchidos são sincronizados e despachados automaticamente para a central de mensagens e webhooks configurados. O professor só precisa gerenciar a agenda e seus alunos; as integrações técnicas são operadas pelo sistema.
                </p>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="space-y-4 pt-1">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Preferências de Mensagens e Agendamento
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-start gap-3 p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={includeMeetLinkInPayload}
                    onChange={(e) => setIncludeMeetLinkInPayload(e.target.checked)}
                    className="mt-0.5 rounded text-[#00687a] focus:ring-[#00687a]"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-slate-800">
                      Incluir Link da Sala Virtual
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      Insere automaticamente o link do Google Meet ou Zoom na mensagem de lembrete enviada ao aluno.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={googleCalendarSync}
                    onChange={(e) => setGoogleCalendarSync(e.target.checked)}
                    className="mt-0.5 rounded text-[#00687a] focus:ring-[#00687a]"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-slate-800">
                      Sincronização com Google Agenda
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      Gera links diretos e arquivos .ics de calendário para adicionar aos calendários pessoais dos alunos.
                    </span>
                  </div>
                </label>
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
