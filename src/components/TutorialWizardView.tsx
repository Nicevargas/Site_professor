import React, { useState } from 'react';
import { ViewMode, TeacherProfile, AuthUser, Appointment, ServiceItem } from '../types';
import { useAccessibility } from '../context/AccessibilityContext';
import { VoiceReaderButton } from './VoiceReaderButton';
import { 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Clock, 
  Smartphone, 
  BookOpen, 
  Users, 
  CreditCard, 
  GraduationCap, 
  Globe, 
  ShieldCheck, 
  PlayCircle, 
  RotateCcw, 
  ArrowRight, 
  ExternalLink,
  MessageSquare,
  QrCode,
  Copy,
  Check,
  Zap,
  HelpCircle,
  Award,
  Sliders,
  FileSpreadsheet
} from 'lucide-react';

interface TutorialWizardViewProps {
  currentTeacher: TeacherProfile;
  currentUser: AuthUser | null;
  onNavigate: (view: ViewMode) => void;
  appointments: Appointment[];
  services: ServiceItem[];
}

interface WizardStep {
  id: number;
  key: string;
  targetView: ViewMode;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  howToSteps: string[];
  proTips: string[];
  checklistItems: string[];
  speechText: string;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 1,
    key: 'overview',
    targetView: 'dashboard',
    icon: Sparkles,
    title: 'Boas-vindas à sua Plataforma Completa',
    subtitle: 'Conheça a estrutura unificada de gestão pedagógica, agenda e faturamento',
    badge: 'Visão Geral',
    description: 'Nossa plataforma foi desenvolvida para eliminar o trabalho manual de professores, escolas e mentores. Aqui você centraliza sua vitrine pública, sincronização com Google Calendar, cobranças via Pix e envio automático de lembretes no WhatsApp.',
    howToSteps: [
      'Navegue pelo menu lateral ou atalhos rápidos do teclado (Alt + 1, Alt + 2, etc.).',
      'Use a barra de acessibilidade no topo ou pressione Alt + H para adaptar contraste e tamanho de fonte.',
      'Configure seu perfil profissional, foto e biografia na aba Meu Site.',
      'Acompanhe métricas financeiras e próximas aulas no Dashboard.'
    ],
    proTips: [
      'Você pode alternar entre perfis de Professor, Secretaria e Aluno sem sair da plataforma.',
      'Todos os dados são salvos localmente e sincronizados em tempo real com o banco de dados.'
    ],
    checklistItems: [
      'Entendi o propósito da plataforma',
      'Localizei o menu lateral de navegação',
      'Sei onde ajustar as opções de acessibilidade'
    ],
    speechText: 'Bem-vindo ao Tour da Plataforma. Este assistente passo a passo vai te ensinar como agendar aulas, disparar lembretes de WhatsApp, emitir cobranças Pix e personalizar sua vitrine.'
  },
  {
    id: 2,
    key: 'dashboard',
    targetView: 'dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard Inteligente & Resumo Diário',
    subtitle: 'Métricas em tempo real, lembretes de tarefas e próxima aula em destaque',
    badge: 'Produtividade',
    description: 'O Dashboard é sua central de comando matinal. Ele calcula a receita estimada, lista os atendimentos do dia com contador regressivo e permite adicionar lembretes rápidos.',
    howToSteps: [
      'Visualize o card "Próximo Atendimento" para conferir aluno, horário e link do Google Meet.',
      'Clique no botão "Ouvir Resumo" para escutar sua rotina narrada por voz.',
      'Adicione tarefas rápidas na seção de Lembretes do Dia.',
      'Ative o "Modo Férias" quando for pausar seus agendamentos públicos.'
    ],
    proTips: [
      'O card do próximo atendimento calcula automaticamente o tempo restante para a aula começar.',
      'A receita prevista soma todas as aulas confirmadas do mês vigente.'
    ],
    checklistItems: [
      'Sei onde ver a próxima aula do dia',
      'Aprendi a criar um lembrete rápido',
      'Localizei o botão de narração por voz'
    ],
    speechText: 'No Dashboard você tem acesso imediato à sua próxima aula, métricas de faturamento e lembretes rápidos de tarefas.'
  },
  {
    id: 3,
    key: 'agenda',
    targetView: 'agenda',
    icon: CalendarIcon,
    title: 'Agenda Semanal & Sincronização Google Calendar',
    subtitle: 'Grade interativa de horários, bloqueios de folga e links de videochamada',
    badge: 'Agendamentos',
    description: 'Gerencie toda a sua semana com visão em grade horária (7h às 22h) ou lista cronológica. Integre sua conta do Google Calendar para evitar choques de horário.',
    howToSteps: [
      'Clique em qualquer horário vazio na grade para abrir a tela de Novo Agendamento.',
      'Selecione o Aluno, o Serviço (que define o valor e tempo) e a modalidade (Online ou Presencial).',
      'Defina se o link do Google Meet deve ser gerado automaticamente.',
      'Arraste ou clique nas aulas para remarcar ou atualizar o status (Confirmado, Pendente, Cancelado).'
    ],
    proTips: [
      'A sincronização com o Google Calendar adiciona o link do Google Meet diretamente no convite do aluno.',
      'Use o filtro de professores caso gerencie uma equipe com múltiplos mentores.'
    ],
    checklistItems: [
      'Aprendi a agendar um novo horário na grade',
      'Sei como gerar links do Google Meet',
      'Entendi os status de confirmação da aula'
    ],
    speechText: 'Na Agenda Semanal você visualiza todos os seus compromissos, agenda novas aulas e integra automaticamente com o Google Calendar.'
  },
  {
    id: 4,
    key: 'whatsapp',
    targetView: 'dashboard',
    icon: Smartphone,
    title: 'Automação WhatsApp & Lembretes 8h Antes',
    subtitle: 'Reduza faltas e no-shows disparando confirmações automáticas com 1 clique',
    badge: 'Automação',
    description: 'O maior vilão do rendimento de professores são as faltas de última hora. O sistema calcula o gatilho ideal de 8 horas antes da aula e prepara a mensagem com horário, link da aula e chave Pix.',
    howToSteps: [
      'No Dashboard ou na Agenda, localize o botão "Disparar WhatsApp 8h".',
      'A mensagem é gerada com o nome do aluno, horário exato, instruções e link do Google Meet.',
      'Clique em "Enviar via WhatsApp" para abrir o WhatsApp Web ou Desktop com a mensagem preenchida.',
      'O aluno pode responder confirmando a presença ou solicitando reagendamento.'
    ],
    proTips: [
      'Disparos com 8 horas de antecedência reduzem o índice de no-show em mais de 78%.',
      'Você também pode automatizar esse envio usando nosso Webhook n8n.'
    ],
    checklistItems: [
      'Entendi como o cálculo de 8 horas antes funciona',
      'Sei como abrir o WhatsApp com mensagem formatada',
      'Localizei o link da sala virtual dentro da mensagem'
    ],
    speechText: 'O Lembrete de WhatsApp 8 horas antes avisa o aluno com link da sala e dados da aula, reduzindo drasticamente faltas e esquecimentos.'
  },
  {
    id: 5,
    key: 'servicos',
    targetView: 'servicos',
    icon: BookOpen,
    title: 'Catálogo de Serviços, Pacotes & Preços',
    subtitle: 'Defina duração, valores avulsos ou pacotes mensais para sua vitrine pública',
    badge: 'Monetização',
    description: 'Cadastre suas modalidades de ensino (Aulas Particulares, Mentorias, Preparatório TOEFL, Pacotes de 4 a 8 aulas). Os serviços cadastrados aparecem automaticamente na sua página de agendamento online.',
    howToSteps: [
      'Acesse a tela "Serviços" no menu lateral.',
      'Clique em "+ Novo Serviço" e preencha nome, descrição, duração (ex: 50 min) e preço (R$).',
      'Escolha a cor de identificação que será usada na grade da agenda.',
      'Ative a opção "Disponível na Vitrine Pública" para permitir que novos clientes agendem sozinhos.'
    ],
    proTips: [
      'Crie pacotes promocionais com desconto por aula para fidelizar alunos em ciclos mensais.',
      'As cores dos serviços ajudam a bater o olho na agenda e identificar o tipo de atendimento.'
    ],
    checklistItems: [
      'Cadastrei ou localizei um serviço de exemplo',
      'Defini o tempo de duração e valor em Reais',
      'Entendi como ativar a exibição na vitrine online'
    ],
    speechText: 'No menu Serviços você cadastra suas aulas particulares, mentorias e pacotes com preços e durações personalizadas.'
  },
  {
    id: 6,
    key: 'alunos',
    targetView: 'alunos',
    icon: Users,
    title: 'CRM de Alunos & Ficha Pedagógica',
    subtitle: 'Histórico completo, anotações de evolução, nível e dados de contato',
    badge: 'CRM Pedagógico',
    description: 'Mantenha todas as informações do seu estudante em um único prontuário: nível de proficiência, material em uso, histórico de frequência, link para pasta no Drive e observações pedagógicas.',
    howToSteps: [
      'Acesse a aba "Alunos" para ver a lista de estudantes cadastrados.',
      'Clique no card do aluno para abrir o Prontuário Pedagógico Completo.',
      'Registre metas de aprendizagem, anotações da última aula e links de lição de casa.',
      'Envie mensagens de WhatsApp diretamente pelo botão de chat no perfil do aluno.'
    ],
    proTips: [
      'O histórico financeiro e de presença do aluno é computado automaticamente conforme as aulas acontecem.',
      'Você pode gerar um acesso com login e senha para o aluno entrar no Portal exclusivo dele.'
    ],
    checklistItems: [
      'Localizei a lista de alunos cadastrados',
      'Abri a ficha de evolução pedagógica',
      'Aprendi a registrar anotações pós-aula'
    ],
    speechText: 'No CRM de Alunos você organiza prontuários de evolução, metas pedagógicas, níveis de aprendizado e histórico de pagamentos.'
  },
  {
    id: 7,
    key: 'pagamentos',
    targetView: 'pagamentos',
    icon: CreditCard,
    title: 'Gestão Financeira & Cobranças Pix Instantâneas',
    subtitle: 'Geração de Pix Copia e Cola, controle de faturas pagas e inadimplência',
    badge: 'Financeiro',
    description: 'Chega de planilhas desorganizadas. O módulo financeiro registra cada aula prestada, gera cobranças Pix com QR Code e código Copia e Cola, e calcula seus ganhos líquidos mensais.',
    howToSteps: [
      'Acesse a aba "Financeiro & Faturas".',
      'Para cobrar um aluno, clique em "Nova Cobrança Pix".',
      'Informe o valor, descrição da aula e gere o Pix Copia e Cola.',
      'Envie o código Pix direto no WhatsApp do aluno ou marque a fatura como "Paga" após o comprovante.'
    ],
    proTips: [
      'Configure sua chave Pix padrão nas Configurações da plataforma.',
      'O relatório exporta dados para prestação de contas e planejamento tributário.'
    ],
    checklistItems: [
      'Entendi o fluxo de emissão de faturas',
      'Gerei um código Pix Copia e Cola de teste',
      'Aprendi a marcar uma fatura como liquidada'
    ],
    speechText: 'No Financeiro você controla receitas, emite cobranças Pix com código Copia e Cola e monitora o pagamento de cada aluno.'
  },
  {
    id: 8,
    key: 'portal-aluno',
    targetView: 'portal-aluno',
    icon: GraduationCap,
    title: 'Portal Exclusivo do Aluno',
    subtitle: 'Área do estudante com próximas aulas, gravação de conteúdos e faturas',
    badge: 'Experiência do Aluno',
    description: 'Ofereça uma experiência premium aos seus alunos. Eles possuem um portal dedicado onde encontram o link da sala de aula, materiais de apoio, lições de casa e histórico de faturas.',
    howToSteps: [
      'Acesse a aba "Portal do Aluno" para pré-visualizar a visão do estudante.',
      'O aluno pode entrar na sala de aula virtual com 1 clique no botão "Acessar Google Meet".',
      'Ele visualiza o calendário de aulas agendadas e pode solicitar novos horários.',
      'Encontra materiais em PDF, links de áudio e exercícios para download.'
    ],
    proTips: [
      'Alunos que têm acesso ao portal sentem maior percepção de valor e profissionalismo.',
      'O portal funciona perfeitamente no celular, sem necessidade de baixar aplicativos pesados.'
    ],
    checklistItems: [
      'Visualizei a tela como um aluno enxerga',
      'Identifiquei o botão de entrada na sala virtual',
      'Localizei a aba de materiais e faturas'
    ],
    speechText: 'O Portal do Aluno é o ambiente exclusivo onde o estudante assiste às aulas, acessa materiais de estudo e confere seus comprovantes.'
  },
  {
    id: 9,
    key: 'site-admin',
    targetView: 'site-admin',
    icon: Globe,
    title: 'Meu Site, Vitrine Pública & Auto-Agendamento',
    subtitle: 'Página profissional personalizada para divulgar nas redes sociais e captar alunos',
    badge: 'Marketing & Captação',
    description: 'Sua plataforma inclui um mini-site completo com bio, depoimentos, fotos, serviços e link de auto-agendamento. Basta compartilhar o link na sua bio do Instagram ou WhatsApp.',
    howToSteps: [
      'Acesse a aba "Meu Site" no menu lateral.',
      'Edite seu título profissional, foto de capa, especialidades e depoimentos de alunos.',
      'Clique em "Ver Vitrine Pública" para ver como seu site aparece para o público na internet.',
      'Copie o link da vitrine e adicione na sua bio do Instagram.'
    ],
    proTips: [
      'Novos interessados podem escolher o serviço, horário disponível e preencher os dados de contato sozinhos.',
      'O agendamento cai direto na sua agenda com status "Pendente" para sua aprovação.'
    ],
    checklistItems: [
      'Personalizei o título e informações do perfil',
      'Abri e testei a Vitrine Pública',
      'Copiei o link de compartilhamento da minha página'
    ],
    speechText: 'No Meu Site você customiza sua vitrine pública com biografia, fotos e depoimentos para receber novos agendamentos da internet.'
  },
  {
    id: 10,
    key: 'usuarios',
    targetView: 'usuarios',
    icon: ShieldCheck,
    title: 'Equipe, Permissões (RBAC) & Automações n8n',
    subtitle: 'Gestão de múltiplos professores, secretárias, controle de acesso e webhooks',
    badge: 'Gestão & Escala',
    description: 'Se você possui uma escola ou equipe de mentores, defina exatamente o que cada membro pode ver. Assistentes só acessam a agenda, professores veem apenas seus próprios alunos e administradores têm acesso total.',
    howToSteps: [
      'Acesse "Usuários & Equipe" para cadastrar professores ou secretárias.',
      'Defina a função (Admin, Professor, Assistente ou Aluno).',
      'Na aba "Integrações", configure os Webhooks do n8n para sincronizar agendamentos com seu CRM ou planilhas do Google.',
      'Acompanhe o log de atividades e auditoria do sistema.'
    ],
    proTips: [
      'O controle de acesso por papéis (RBAC) impede que professores acessem o faturamento global da escola.',
      'Os Webhooks disparam notificações instantâneas a cada novo agendamento.'
    ],
    checklistItems: [
      'Entendi os diferentes papéis de usuário (Admin, Professor, Aluno)',
      'Localizei a seção de integrações com n8n e Webhooks',
      'Finalizei todas as etapas do Tour de Aprendizado'
    ],
    speechText: 'Na gestão de equipe você cadastra outros professores e secretárias com permissões controladas, e conecta integrações externas via Webhooks.'
  }
];

export const TutorialWizardView: React.FC<TutorialWizardViewProps> = ({
  currentTeacher,
  currentUser,
  onNavigate,
  appointments,
  services
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedChecklists, setCompletedChecklists] = useState<Record<string, boolean>>({});
  const [copiedPix, setCopiedPix] = useState(false);
  const [demoReminderSent, setDemoReminderSent] = useState(false);
  const [selectedDemoRole, setSelectedDemoRole] = useState<'admin' | 'professor' | 'assistente' | 'aluno'>('professor');

  const { setIsA11yModalOpen } = useAccessibility();

  const step = WIZARD_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === WIZARD_STEPS.length - 1;
  const progressPercent = Math.round(((currentStepIndex + 1) / WIZARD_STEPS.length) * 100);

  const toggleChecklist = (key: string) => {
    setCompletedChecklists(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleCopyDemoPix = () => {
    navigator.clipboard.writeText('00020126580014BR.GOV.BCB.PIX0136prof.silva@exemplo.com.br5204000053039865406120.005802BR5920Professor Silva6009Sao Paulo62070503***6304E8A2');
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#091426] text-white flex flex-col font-sans">
      
      {/* Top Wizard Navigation Header */}
      <header className="bg-[#12243d] border-b border-slate-700/80 px-4 md:px-8 py-3.5 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Logo & Tour Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00687a] to-[#57dffe] text-[#091426] flex items-center justify-center font-black text-lg shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#57dffe] bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                  Wizard de Treinamento Passo a Passo
                </span>
                <span className="text-xs text-slate-400">
                  Etapa {step.id} de {WIZARD_STEPS.length}
                </span>
              </div>
              <h1 className="text-base md:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>{step.title}</span>
              </h1>
            </div>
          </div>

          {/* Quick Actions & Header Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            
            {/* Audio Reader for this step */}
            <VoiceReaderButton
              textToRead={`${step.title}. ${step.description} Como praticar: ${step.howToSteps.join('. ')}`}
              label="Ouvir Explicação"
            />

            {/* Accessibility Shortcut */}
            <button
              onClick={() => setIsA11yModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Acessibilidade (Alt + H)"
            >
              <Sliders className="w-3.5 h-3.5 text-[#57dffe]" />
              <span>Acessibilidade</span>
            </button>

            {/* Exit Wizard Button */}
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-800 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Sair do Tour</span>
            </button>
          </div>
        </div>

        {/* Global Step Progress Bar */}
        <div className="max-w-7xl mx-auto mt-3">
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-[#00687a] via-[#57dffe] to-emerald-400 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Wizard Layout Body */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Stepper Menu (Col 3 on Large) */}
        <nav aria-label="Etapas do Tour" className="lg:col-span-4 bg-[#12243d]/80 rounded-2xl p-4 border border-slate-700/80 shadow-lg space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/70 mb-3 px-1">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Módulos do Sistema ({progressPercent}%)
            </span>
            <span className="text-[11px] text-[#57dffe] font-semibold">
              {currentStepIndex + 1}/{WIZARD_STEPS.length}
            </span>
          </div>

          <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {WIZARD_STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isActive = idx === currentStepIndex;
              const isPassed = idx < currentStepIndex;

              return (
                <button
                  key={s.key}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-3 cursor-pointer ${
                    isActive 
                      ? 'bg-[#00687a] text-white font-bold shadow-md border border-[#57dffe]/40' 
                      : isPassed
                      ? 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isActive 
                      ? 'bg-[#57dffe] text-[#091426]' 
                      : isPassed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isPassed ? <Check className="w-3.5 h-3.5" /> : s.id}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs">{s.title}</div>
                    <div className="text-[10px] text-slate-400 truncate">{s.badge}</div>
                  </div>

                  {isActive && <ArrowRight className="w-3.5 h-3.5 text-[#57dffe] shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Quick jump to real screen */}
          <div className="pt-3 border-t border-slate-700/70 mt-3">
            <button
              onClick={() => onNavigate(step.targetView)}
              className="w-full py-2 px-3 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/60 text-[#57dffe] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Abrir Tela Real: {step.badge}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </nav>

        {/* Right Column: Step Deep Dive & Live Interactive Demonstration (Col 8 on Large) */}
        <main className="lg:col-span-8 space-y-6">
          
          {/* Step Main Banner Card */}
          <div className="bg-[#12243d] rounded-3xl p-6 md:p-8 border border-slate-700 shadow-xl relative overflow-hidden">
            
            {/* Header info badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#00687a] text-[#57dffe] border border-[#57dffe]/30">
                  {step.badge}
                </span>
                <span className="text-xs text-slate-400">
                  Tempo estimado: ~2 min
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate(step.targetView)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Ver na Prática</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#57dffe]" />
                </button>
              </div>
            </div>

            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mb-2">
              {step.title}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              {step.description}
            </p>

            {/* How to use step by step */}
            <div className="bg-[#091426]/70 rounded-2xl p-5 border border-slate-700/60 space-y-3 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#57dffe] flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Passo a Passo Recomendado:</span>
              </h3>
              <div className="space-y-2">
                {step.howToSteps.map((instruction, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs text-slate-200">
                    <span className="w-5 h-5 rounded-full bg-[#00687a] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{instruction}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Live Playground / Simulator according to current step */}
            <div className="bg-slate-900/90 rounded-2xl p-5 border border-cyan-800/40 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Simulador Interativo do Módulo
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Sandbox ao Vivo
                </span>
              </div>

              {/* DEMO 1: Visão Geral */}
              {step.key === 'overview' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
                    <CalendarIcon className="w-5 h-5 text-cyan-400 mx-auto mb-1.5" />
                    <div className="text-xs font-bold text-white">Google Calendar</div>
                    <div className="text-[10px] text-slate-400">Sincronização 2 Vias</div>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
                    <Smartphone className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
                    <div className="text-xs font-bold text-white">WhatsApp 8h</div>
                    <div className="text-[10px] text-slate-400">Anti-Faltas</div>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
                    <CreditCard className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
                    <div className="text-xs font-bold text-white">Pix Copia/Cola</div>
                    <div className="text-[10px] text-slate-400">Faturas Rápidas</div>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
                    <Globe className="w-5 h-5 text-purple-400 mx-auto mb-1.5" />
                    <div className="text-xs font-bold text-white">Meu Site</div>
                    <div className="text-[10px] text-slate-400">Vitrine Online</div>
                  </div>
                </div>
              )}

              {/* DEMO 2: Dashboard */}
              {step.key === 'dashboard' && (
                <div className="bg-slate-800/80 p-4 rounded-xl space-y-3 border border-slate-700">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">Próxima Aula: Carlos Drummond</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">Hoje às 15:00</span>
                  </div>
                  <div className="text-xs text-slate-300 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#57dffe]" />
                    <span>Faltam 1h 24min para o início da videochamada</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => alert('Simulação: Sala do Google Meet aberta com sucesso!')}
                      className="px-3 py-1.5 bg-[#00687a] hover:bg-[#00687a]/80 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Abrir Google Meet</span>
                    </button>
                    <button 
                      onClick={() => alert('Simulação: Lembrete disparado para o WhatsApp do aluno Carlos!')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Avisar no WhatsApp</span>
                    </button>
                  </div>
                </div>
              )}

              {/* DEMO 3: Agenda */}
              {step.key === 'agenda' && (
                <div className="space-y-2">
                  <div className="text-xs text-slate-300">Exemplo da grade de horários com cálculo de choque:</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-emerald-950/40 border border-emerald-600/40 p-2.5 rounded-xl text-center">
                      <div className="text-[10px] text-emerald-400 font-bold">09:00 - 10:00</div>
                      <div className="text-xs font-bold text-white">Mariana Costa</div>
                      <div className="text-[10px] text-slate-300">Confirmado</div>
                    </div>
                    <div className="bg-cyan-950/40 border border-cyan-600/40 p-2.5 rounded-xl text-center">
                      <div className="text-[10px] text-cyan-400 font-bold">14:00 - 15:00</div>
                      <div className="text-xs font-bold text-white">Pedro Henrique</div>
                      <div className="text-[10px] text-slate-300">Google Meet</div>
                    </div>
                    <div className="bg-slate-800/90 border border-dashed border-slate-600 p-2.5 rounded-xl text-center flex flex-col justify-center items-center">
                      <div className="text-[10px] text-slate-400">16:00 - 17:00</div>
                      <div className="text-xs font-bold text-[#57dffe]">+ Livre para Agendar</div>
                    </div>
                  </div>
                </div>
              )}

              {/* DEMO 4: WhatsApp */}
              {step.key === 'whatsapp' && (
                <div className="bg-[#0b141a] p-4 rounded-xl border border-emerald-800/40 space-y-3 font-sans">
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-bold border-b border-slate-800 pb-2">
                    <span>📱 Pré-visualização da Mensagem no WhatsApp (8h Antes)</span>
                    <span className="text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-200">Gatilho Automático</span>
                  </div>
                  <div className="bg-[#1f2c34] p-3 rounded-xl text-xs text-slate-200 leading-relaxed max-w-md shadow">
                    <p className="font-bold text-emerald-400 mb-1">Olá, Beatriz! Tudo bem? 🎓</p>
                    <p>Lembrando da nossa aula de <strong>Inglês Avançado</strong> hoje às <strong>16:00</strong>.</p>
                    <p className="mt-1 text-cyan-300">🔗 Link da sala: https://meet.google.com/abc-demo-xyz</p>
                    <p className="mt-1 text-slate-300">Por favor, responda com <strong>SIM</strong> para confirmar sua presença!</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDemoReminderSent(true)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{demoReminderSent ? 'Mensagem Testada com Sucesso!' : 'Testar Envio Simulado'}</span>
                    </button>
                    {demoReminderSent && (
                      <span className="text-xs text-emerald-400 font-medium">
                        ✓ Mensagem pronta para o WhatsApp
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* DEMO 5: Serviços */}
              {step.key === 'servicos' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-800 p-3.5 rounded-xl border-l-4 border-cyan-400 border border-slate-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-bold text-white">Aula Particular Individual</div>
                        <div className="text-[11px] text-slate-400">Duração: 50 minutos</div>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">R$ 120,00</span>
                    </div>
                  </div>
                  <div className="bg-slate-800 p-3.5 rounded-xl border-l-4 border-purple-400 border border-slate-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-bold text-white">Pacote Mensal (4 Aulas)</div>
                        <div className="text-[11px] text-slate-400">Duração: 4 x 50 min</div>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">R$ 440,00</span>
                    </div>
                  </div>
                </div>
              )}

              {/* DEMO 6: Alunos */}
              {step.key === 'alunos' && (
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center text-xs">
                        LC
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Lucas Carvalho</div>
                        <div className="text-[10px] text-slate-400">Nível B2 - Intermediário Alto</div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">Ativo</span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg text-xs text-slate-300">
                    <strong>Última Anotação:</strong> Praticou conversação sobre viagens; focar no uso do Present Perfect na próxima sessão.
                  </div>
                </div>
              )}

              {/* DEMO 7: Pagamentos */}
              {step.key === 'pagamentos' && (
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Fatura #1042 - Mensalidade de Aulas</div>
                      <div className="text-[11px] text-slate-400">Vencimento: Hoje • Valor: R$ 120,00</div>
                    </div>
                    <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 font-bold text-xs">Pendente</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg font-mono text-[10px] text-slate-300 overflow-x-auto">
                    <QrCode className="w-4 h-4 text-[#57dffe] shrink-0" />
                    <span className="truncate">00020126580014BR.GOV.BCB.PIX...6304E8A2</span>
                    <button
                      onClick={handleCopyDemoPix}
                      className="ml-auto px-2 py-1 bg-cyan-950 hover:bg-cyan-900 text-[#57dffe] rounded text-[10px] font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedPix ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPix ? 'Copiado!' : 'Copiar Pix'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* DEMO 8: Portal Aluno */}
              {step.key === 'portal-aluno' && (
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-2 text-xs">
                  <div className="font-bold text-[#57dffe] flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    <span>Visão do Aluno no Celular / Computador:</span>
                  </div>
                  <div className="bg-gradient-to-r from-[#091426] to-[#00687a] p-3 rounded-xl text-white flex items-center justify-between">
                    <div>
                      <div className="font-bold">Sua próxima aula: Hoje às 17h</div>
                      <div className="text-[10px] text-slate-300">Prof. {currentTeacher.name}</div>
                    </div>
                    <button className="px-3 py-1.5 bg-[#57dffe] text-[#091426] font-bold rounded-lg text-xs">
                      Entrar na Aula
                    </button>
                  </div>
                </div>
              )}

              {/* DEMO 9: Meu Site */}
              {step.key === 'site-admin' && (
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Link da sua Vitrine Pública:</span>
                    <span className="text-[#57dffe] font-mono text-[11px]">sua-escola.com/prof-silva</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl text-center">
                    <div className="font-bold text-white">{currentTeacher.name}</div>
                    <div className="text-[11px] text-slate-400">{currentTeacher.headline || 'Professor Especialista'}</div>
                    <div className="mt-2 inline-block px-3 py-1 bg-emerald-600 text-white font-bold rounded-full text-[11px]">
                      Agendar Horário Online
                    </div>
                  </div>
                </div>
              )}

              {/* DEMO 10: Equipe e RBAC */}
              {step.key === 'usuarios' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-300">Simule a troca de papel para testar o nível de acesso:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['admin', 'professor', 'assistente', 'aluno'] as const).map(role => (
                      <button
                        key={role}
                        onClick={() => setSelectedDemoRole(role)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedDemoRole === role
                            ? 'bg-[#00687a] text-white border border-[#57dffe]'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {role === 'admin' && '👑 Administrador'}
                        {role === 'professor' && '👨‍🏫 Professor'}
                        {role === 'assistente' && '📋 Secretária'}
                        {role === 'aluno' && '🎓 Aluno'}
                      </button>
                    ))}
                  </div>
                  <div className="bg-slate-800 p-2.5 rounded-lg text-xs text-slate-300">
                    <strong>Permissão ativa para {selectedDemoRole}:</strong>{' '}
                    {selectedDemoRole === 'admin' && 'Acesso total: visualiza faturamento global, gerencia todos os professores e configurações.'}
                    {selectedDemoRole === 'professor' && 'Acesso restrito à própria agenda, próprios alunos e serviços associados.'}
                    {selectedDemoRole === 'assistente' && 'Visualiza agendamentos e dispara lembretes sem acesso aos números financeiros sensíveis.'}
                    {selectedDemoRole === 'aluno' && 'Acessa apenas o portal do estudante com suas próprias aulas e faturas.'}
                  </div>
                </div>
              )}
            </div>

            {/* Checklist of learned concepts */}
            <div className="mt-6 pt-5 border-t border-slate-700/80 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>O que você aprendeu nesta etapa:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {step.checklistItems.map((item, idx) => {
                  const checkKey = `${step.key}_${idx}`;
                  const isChecked = !!completedChecklists[checkKey];

                  return (
                    <button
                      key={idx}
                      onClick={() => toggleChecklist(checkKey)}
                      className={`p-2.5 rounded-xl text-xs text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                        isChecked 
                          ? 'bg-emerald-950/40 border border-emerald-600/50 text-emerald-200' 
                          : 'bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 ${
                        isChecked ? 'bg-emerald-500 text-[#091426]' : 'border border-slate-500'
                      }`}>
                        {isChecked && <Check className="w-3 h-3 font-bold" />}
                      </div>
                      <span className="leading-snug">{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pro Tips Box */}
            {step.proTips.length > 0 && (
              <div className="mt-5 p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-amber-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Dica de Ouro:</span>
                </span>
                <p className="text-amber-100/90 leading-relaxed">
                  {step.proTips[0]}
                </p>
              </div>
            )}

            {/* Bottom Wizard Stepper Controls */}
            <div className="mt-8 pt-6 border-t border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Back step button */}
              <button
                type="button"
                disabled={isFirstStep}
                onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  isFirstStep
                    ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Módulo Anterior</span>
              </button>

              {/* Step indicator */}
              <div className="text-xs text-slate-400 font-medium">
                Passo <strong>{currentStepIndex + 1}</strong> de <strong>{WIZARD_STEPS.length}</strong>
              </div>

              {/* Next step / Finish button */}
              {!isLastStep ? (
                <button
                  type="button"
                  onClick={() => setCurrentStepIndex(prev => Math.min(WIZARD_STEPS.length - 1, prev + 1))}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-[#00687a] to-[#57dffe] hover:brightness-110 text-[#091426] font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <span>Próximo Módulo ({WIZARD_STEPS[currentStepIndex + 1]?.badge})</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#091426] font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>Concluir Tour & Ir para o Painel</span>
                </button>
              )}
            </div>

          </div>
        </main>
      </div>

    </div>
  );
};
