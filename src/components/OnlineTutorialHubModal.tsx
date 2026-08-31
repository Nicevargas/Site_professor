import React, { useState } from 'react';
import { 
  TUTORIAL_STEPS, 
  TUTORIAL_FAQS, 
  KEYBOARD_SHORTCUTS 
} from '../data/tutorialData';
import { ViewMode, UserRole, TeacherProfile } from '../types';
import { useAccessibility } from '../context/AccessibilityContext';
import { VoiceReaderButton } from './VoiceReaderButton';
import { 
  X, 
  BookOpen, 
  PlayCircle, 
  HelpCircle, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  GraduationCap, 
  Headphones, 
  Users, 
  Calendar, 
  DollarSign, 
  MessageSquare, 
  Zap, 
  Globe, 
  ArrowRight, 
  Lightbulb, 
  Smartphone, 
  QrCode, 
  Send, 
  Layers, 
  Check, 
  Copy, 
  RotateCcw,
  Keyboard
} from 'lucide-react';

interface OnlineTutorialHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ViewMode) => void;
  currentTeacher: TeacherProfile;
}

export const OnlineTutorialHubModal: React.FC<OnlineTutorialHubModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  currentTeacher,
}) => {
  const [activeTab, setActiveTab] = useState<'trilhas' | 'modulos' | 'playgrounds' | 'faqs' | 'atalhos'>('trilhas');
  const [selectedRoleTrack, setSelectedRoleTrack] = useState<UserRole>('professor');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedPix, setCopiedPix] = useState(false);

  // Playground States
  const [simPhone, setSimPhone] = useState('(11) 98765-4321');
  const [simStudent, setSimStudent] = useState('Mariana Costa');
  const [simDate, setSimDate] = useState('Amanhã às 14:00');
  const [simService, setSimService] = useState('Personal Trainer Individual');
  const [simSent, setSimSent] = useState(false);

  const [simPixAmount, setSimPixAmount] = useState('180.00');
  const [simPixKey, setSimPixKey] = useState(currentTeacher.pixKey || 'contato@agendaprofessor.com.br');

  const { setIsInteractiveTourOpen } = useAccessibility();

  if (!isOpen) return null;

  const roleTracks: { role: UserRole; title: string; subtitle: string; icon: any; color: string; steps: string[] }[] = [
    {
      role: 'professor',
      title: 'Trilha do Professor / Mentor',
      subtitle: 'Como gerenciar sua agenda, cobrar com Pix e personalizar sua vitrine',
      icon: GraduationCap,
      color: 'bg-cyan-50 border-cyan-300 text-[#00687a]',
      steps: [
        '1. Cadastre seus serviços e defina durações e preços na aba "Serviços"',
        '2. Configure sua chave Pix no Financeiro para emissão automática de QR Code',
        '3. Conecte seu Google Calendar para sincronização de horários e links do Meet',
        '4. Ative o Lembrete WhatsApp 8h antes para confirmações automáticas de presença',
        '5. Adicione fotos, vídeos e depoimentos no "Meu Site" para divulgar sua vitrine'
      ]
    },
    {
      role: 'admin',
      title: 'Trilha do Administrador Geral',
      subtitle: 'Controle de multi-tenants, equipe, faturamento global e integrações',
      icon: ShieldCheck,
      color: 'bg-amber-50 border-amber-300 text-amber-900',
      steps: [
        '1. Cadastre e gerencie membros da equipe no módulo "Usuários & Permissões"',
        '2. Alterne entre professores cadastrados usando o seletor de Tenant no topo',
        '3. Acompanhe relatórios financeiros consolidados de todos os instrutores',
        '4. Configure integrações globais de webhooks com o n8n e automações',
        '5. Defina os planos de assinatura disponíveis no sistema'
      ]
    },
    {
      role: 'assistente',
      title: 'Trilha da Secretaria & Atendimento',
      subtitle: 'Agendamento rápido de aulas, cadastro de alunos e envio de lembretes',
      icon: Headphones,
      color: 'bg-purple-50 border-purple-300 text-purple-900',
      steps: [
        '1. Cadastre novos alunos no CRM com nome, WhatsApp e e-mail',
        '2. Crie agendamentos rapidamente na Agenda ou no Dashboard',
        '3. Acesse a Central de WhatsApp para enviar confirmações do dia',
        '4. Consulte valores e durações de serviços na aba "Serviços"',
        '5. Remarque ou cancele aulas a pedido dos alunos com notificações'
      ]
    },
    {
      role: 'aluno',
      title: 'Trilha do Portal do Aluno',
      subtitle: 'Como entrar nas aulas virtuais, pagar mensalidades e assistir vídeos',
      icon: Users,
      color: 'bg-emerald-50 border-emerald-300 text-emerald-900',
      steps: [
        '1. Acesse o "Portal do Aluno" para ver sua próxima aula e contagem regressiva',
        '2. Clique em "Entrar na Sala Virtual" para abrir o Google Meet no horário',
        '3. Copie o código Pix ou escaneie o QR Code na aba de faturas para pagar',
        '4. Assista a videoaulas e materiais complementares disponibilizados pelo professor',
        '5. Agende novas aulas ou sessões extras pelo botão "Agendar Nova Aula"'
      ]
    }
  ];

  const filteredFaqs = TUTORIAL_FAQS.filter(
    (faq) => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const samplePixPayload = `00020126580014BR.GOV.BCB.PIX0114${simPixKey}520400005303986540${simPixAmount}5802BR5913${currentTeacher.name}6009SAO PAULO62070503***6304ABCD`;

  return (
    <div 
      role="dialog" 
      aria-modal="true"
      aria-labelledby="tutorial-hub-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#091426] text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 text-[#57dffe] flex items-center justify-center border border-cyan-500/30 shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="tutorial-hub-title" className="text-lg font-bold">Central de Tutoriais & Aprendizado</h2>
                <span className="bg-cyan-500/20 text-[#57dffe] text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
                  Guia Interativo
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Aprenda a utilizar 100% dos recursos da plataforma com demonstrações práticas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                setIsInteractiveTourOpen(true);
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#57dffe] text-[#091426] text-xs font-bold hover:bg-cyan-300 transition-colors shadow-sm"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Tour Guiado</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100/70 border-b border-slate-200 px-6 flex gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('trilhas')}
            className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'trilhas'
                ? 'border-[#00687a] text-[#00687a]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Trilhas por Cargo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('modulos')}
            className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'modulos'
                ? 'border-[#00687a] text-[#00687a]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Todas as Funcionalidades (10)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('playgrounds')}
            className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'playgrounds'
                ? 'border-[#00687a] text-[#00687a]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Simuladores Interativos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('faqs')}
            className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'faqs'
                ? 'border-[#00687a] text-[#00687a]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Dúvidas Frequentes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('atalhos')}
            className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'atalhos'
                ? 'border-[#00687a] text-[#00687a]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Atalhos de Teclado</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: TRILHAS POR CARGO */}
          {activeTab === 'trilhas' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Escolha o seu perfil para ver os passos recomendados:</h3>
                <p className="text-xs text-slate-500 mt-0.5">Guias estruturados para cada membro da sua equipe</p>
              </div>

              {/* Role Selectors */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {roleTracks.map((trk) => {
                  const Icon = trk.icon;
                  const isSelected = selectedRoleTrack === trk.role;
                  return (
                    <button
                      key={trk.role}
                      type="button"
                      onClick={() => setSelectedRoleTrack(trk.role)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? `${trk.color} font-bold shadow-sm ring-2 ring-current`
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-2" />
                      <p className="text-xs font-bold truncate">{trk.title.split(' ')[2] || trk.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 capitalize">{trk.role}</p>
                    </button>
                  );
                })}
              </div>

              {/* Active Track Details */}
              {(() => {
                const currentTrack = roleTracks.find(t => t.role === selectedRoleTrack)!;
                const TIcon = currentTrack.icon;
                return (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[#00687a]">
                          <TIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{currentTrack.title}</h4>
                          <p className="text-xs text-slate-600">{currentTrack.subtitle}</p>
                        </div>
                      </div>
                      
                      <VoiceReaderButton 
                        textToRead={`${currentTrack.title}. ${currentTrack.subtitle}. Passos recomendados: ${currentTrack.steps.join('. ')}`}
                        label="Ouvir Trilha"
                      />
                    </div>

                    <div className="space-y-2.5">
                      {currentTrack.steps.map((st, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200/80 text-xs text-slate-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{st}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 2: TODAS AS 10 FUNCIONALIDADES */}
          {activeTab === 'modulos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Mapa Completo de Funcionalidades</h3>
                  <p className="text-xs text-slate-500">Conheça detalhadamente cada módulo da plataforma</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {TUTORIAL_STEPS.map((step) => (
                  <div 
                    key={step.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-cyan-50 text-[#00687a] px-2 py-0.5 rounded-md border border-cyan-200">
                          {step.badge}
                        </span>
                        <VoiceReaderButton 
                          textToRead={`${step.title}. ${step.subtitle}. ${step.description}`}
                          variant="icon"
                        />
                      </div>

                      <h4 className="text-xs font-bold text-[#091426]">{step.title}</h4>
                      <p className="text-[11px] font-semibold text-[#00687a] mt-0.5">{step.subtitle}</p>
                      <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigate(step.targetView);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#00687a] hover:underline"
                      >
                        <span>Abrir na Tela</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SIMULADORES / PLAYGROUNDS INTERATIVOS */}
          {activeTab === 'playgrounds' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Playgrounds & Simuladores em Tempo Real</h3>
                <p className="text-xs text-slate-500">Teste como as mensagens e cobranças funcionam antes de usar com alunos reais</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Simulador WhatsApp 8h */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">Simulador de WhatsApp (8h Antes)</h4>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Disparo Automático
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Nome do Aluno:</label>
                      <input
                        type="text"
                        value={simStudent}
                        onChange={(e) => setSimStudent(e.target.value)}
                        className="w-full h-8 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Data/Horário:</label>
                      <input
                        type="text"
                        value={simDate}
                        onChange={(e) => setSimDate(e.target.value)}
                        className="w-full h-8 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  {/* WhatsApp Bubble Preview */}
                  <div className="bg-[#e5ddd5] p-3 rounded-xl border border-slate-300 space-y-2">
                    <div className="bg-white p-3 rounded-xl shadow-xs text-xs text-slate-900 space-y-1.5 max-w-[90%]">
                      <p className="font-bold text-emerald-800">📌 Lembrete de Aula - {currentTeacher.name}</p>
                      <p>Olá, <strong>{simStudent}</strong>! Sua aula de <em>{simService}</em> está confirmada para <strong>{simDate}</strong>.</p>
                      <p className="text-[11px] text-slate-600">Por favor, confirme sua presença clicando no botão abaixo:</p>
                      <div className="bg-emerald-50 p-2 rounded-lg text-center border border-emerald-200 text-emerald-800 font-bold text-[11px]">
                        ✅ [Confirmar Presença na Aula]
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSimSent(true);
                      setTimeout(() => setSimSent(false), 3000);
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {simSent ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                    <span>{simSent ? 'Mensagem de Teste Disparada com Sucesso!' : 'Simular Disparo de Lembrete'}</span>
                  </button>
                </div>

                {/* 2. Simulador Cobrança Pix */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-cyan-100 text-[#00687a]">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">Simulador de Cobrança Pix</h4>
                    </div>
                    <span className="text-[10px] font-bold text-[#00687a] bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                      QR Code Instantâneo
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Valor da Aula (R$):</label>
                      <input
                        type="text"
                        value={simPixAmount}
                        onChange={(e) => setSimPixAmount(e.target.value)}
                        className="w-full h-8 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Chave Pix:</label>
                      <input
                        type="text"
                        value={simPixKey}
                        onChange={(e) => setSimPixKey(e.target.value)}
                        className="w-full h-8 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 truncate"
                      />
                    </div>
                  </div>

                  {/* QR Code Demo Box */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center space-y-2">
                    <div className="w-24 h-24 bg-slate-900 rounded-xl flex items-center justify-center text-white p-2">
                      <QrCode className="w-20 h-20 text-[#57dffe]" />
                    </div>
                    <p className="text-xs font-bold text-slate-900">
                      R$ {parseFloat(simPixAmount || '0').toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-500">Beneficiário: {currentTeacher.name}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(samplePixPayload);
                      setCopiedPix(true);
                      setTimeout(() => setCopiedPix(false), 2000);
                    }}
                    className="w-full py-2 bg-[#00687a] hover:bg-[#004e5c] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {copiedPix ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedPix ? 'Código Pix Copiado!' : 'Copiar Código Pix (Copia e Cola)'}</span>
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: PERGUNTAS FREQUENTES (FAQ) */}
          {activeTab === 'faqs' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Perguntas Frequentes & Dúvidas</h3>
                  <p className="text-xs text-slate-500">Respostas diretas para as dúvidas mais comuns dos professores</p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrar dúvidas..."
                    className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#00687a]"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredFaqs.map((faq) => (
                  <div key={faq.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-[#00687a] shrink-0" />
                        <span>{faq.question}</span>
                      </h4>
                      <VoiceReaderButton 
                        textToRead={`${faq.question}. Resposta: ${faq.answer}`}
                        variant="icon"
                      />
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-6">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: MAPA DE ATALHOS DE TECLADO */}
          {activeTab === 'atalhos' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Mapa Completo de Atalhos de Teclado</h3>
                <p className="text-xs text-slate-500">Navegue com velocidade total sem encostar no mouse</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {KEYBOARD_SHORTCUTS.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-2 px-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-slate-700 font-medium">{item.description}</span>
                      <kbd className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 shadow-2xs">
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Pressione <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px] font-mono">Alt + T</kbd> a qualquer momento para abrir o tour
          </p>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#00687a] hover:bg-[#004e5c] text-white text-xs font-bold transition-all shadow-sm"
          >
            Fechar Central
          </button>
        </div>
      </div>
    </div>
  );
};
