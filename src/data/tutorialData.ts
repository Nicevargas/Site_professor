import { TutorialStep, FAQItem } from '../types';

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'dashboard-overview',
    title: '1. Dashboard & Visão Executiva',
    subtitle: 'O centro de controle diário do professor e da equipe',
    description: 'Acompanhe seu faturamento diário e mensal, visualize a próxima aula com contagem regressiva e gerencie tarefas prioritárias.',
    detailedText: 'No Dashboard você tem acesso imediato aos principais indicadores: receita estimada, ticket médio por aula, lista de alunos do dia e lista de lembretes rápidos. A partir daqui você pode agendar uma nova aula ou bloquear horários com 1 clique.',
    badge: 'Visão Geral',
    iconName: 'LayoutDashboard',
    targetView: 'dashboard',
    highlightElementSelector: '#dashboard-overview-card',
    tip: 'Dica: Você pode ativar o "Modo Férias" no topo do Dashboard para pausar novos agendamentos automaticamente.',
    audioNarrationText: 'Bem-vindo ao Dashboard! Aqui você visualiza o resumo da sua operação, incluindo faturamento estimado, próximas aulas agendadas e tarefas rápidas.',
    keyFeatures: [
      'Contador de próxima aula com link rápido',
      'Métricas de faturamento e ticket médio',
      'Lista rápida de tarefas e lembretes',
      'Atalhos para nova aula, bloqueio e modo férias'
    ]
  },
  {
    id: 'agenda-and-google',
    title: '2. Agenda & Google Calendar',
    subtitle: 'Grade semanal e diária com sincronização em nuvem',
    description: 'Visualize seus agendamentos por dia ou semana, edite horários, adicione links de videochamadas (Meet/Zoom) e sincronize com sua conta Google.',
    detailedText: 'A Agenda permite navegar entre os dias, alternar entre modos Semana e Dia, filtrar por status (Confirmado, Pendente, Bloqueado) e clicar em qualquer horário vago para criar um agendamento instantâneo. Ao clicar em um evento, você pode abrir o evento direto no Google Agenda.',
    badge: 'Produtividade',
    iconName: 'Calendar',
    targetView: 'agenda',
    highlightElementSelector: '#agenda-calendar-grid',
    tip: 'Dica: Utilize o botão "Sincronizar Google Calendar" para vincular e exportar eventos com link de Meet gerado automaticamente.',
    audioNarrationText: 'Na Agenda, você organiza seus compromissos com visão semanal e diária. Suas aulas podem ser sincronizadas automaticamente com o Google Calendar.',
    keyFeatures: [
      'Visão flexível em Grade Semanal e Diária',
      'Sincronização bidirecional com Google Agenda',
      'Criação de link de videoconferência (Meet / Zoom)',
      'Bloqueio de horários para pausas e almoço'
    ]
  },
  {
    id: 'whatsapp-reminder-8h',
    title: '3. Lembrete WhatsApp (8h Antes)',
    subtitle: 'Reduza faltas a zero com confirmação automática',
    description: 'Envie lembretes com data, horário e botão de confirmação para o WhatsApp do aluno exatamente 8 horas antes de cada aula.',
    detailedText: 'O sistema calcula automaticamente o horário de disparo (8h antes da aula). Ao abrir a Central de Lembretes WhatsApp, você vê a lista de alunos do dia, o texto formatado profissionalmente e pode enviar diretamente via WhatsApp Web ou disparar via Webhook n8n.',
    badge: 'Automação',
    iconName: 'MessageSquare',
    targetView: 'agenda',
    highlightElementSelector: '#whatsapp-reminder-trigger',
    tip: 'Dica: O aluno recebe o link para confirmar presença com 1 toque, atualizando o status na sua agenda para "Confirmado".',
    audioNarrationText: 'O Lembrete WhatsApp de 8 horas antes avisa o aluno com mensagem personalizada e botão de confirmação, garantindo presença e profissionalismo.',
    keyFeatures: [
      'Cálculo inteligente do horário de disparo (8h antes)',
      'Texto pronto com nome, aula, horário e link de acesso',
      'Disparo direto no WhatsApp ou via n8n webhook',
      'Status em tempo real de mensagens enviadas'
    ]
  },
  {
    id: 'services-and-pricing',
    title: '4. Serviços, Pacotes & Modalidades',
    subtitle: 'Defina seu cardápio de aulas, preços e durações',
    description: 'Cadastre suas modalidades (Aulas Individuais, Pacotes Mensais, Mentorias) com preços, duração em minutos e tipo de atendimento.',
    detailedText: 'Cada serviço cadastrado é exibido automaticamente no seu Site Público e no Assistente de Agendamento. Você pode configurar serviços Online (com Meet), Presenciais ou Híbridos, além de destacar pacotes promocionais com selos especiais.',
    badge: 'Comercial',
    iconName: 'Layers',
    targetView: 'servicos',
    highlightElementSelector: '#services-cards-grid',
    tip: 'Dica: Adicione selos como "Mais Procurado" ou "Destaque" para chamar a atenção dos visitantes na sua vitrine.',
    audioNarrationText: 'Em Serviços, você cadastra suas aulas particulares, planos mensais e mentorias com valores, durações e modalidades online ou presencial.',
    keyFeatures: [
      'Cadastro de serviços com preço e duração (ex: 50min, 60min)',
      'Seleção de modalidade: Online, Presencial ou Híbrida',
      'Selos promocionais e ícones personalizados',
      'Disponibilidade imediata no wizard de agendamento'
    ]
  },
  {
    id: 'students-crm',
    title: '5. Alunos & Gestão de CRM',
    subtitle: 'Ficha completa de cada aluno e histórico de evolução',
    description: 'Mantenha o cadastro atualizado com WhatsApp, e-mail, quantidade de aulas realizadas, anotações de evolução e status.',
    detailedText: 'O módulo de Alunos permite acompanhar a frequência de cada estudante, registrar observações pedagógicas confidenciais e clicar em "Agendar Aula" para criar uma nova aula com os dados do aluno já preenchidos.',
    badge: 'Relacionamento',
    iconName: 'Users',
    targetView: 'alunos',
    highlightElementSelector: '#students-table-section',
    tip: 'Dica: Use o botão de WhatsApp rápido na tabela para iniciar uma conversa direta com o aluno.',
    audioNarrationText: 'No CRM de Alunos, você consulta o histórico de aulas de cada estudante, notas de acompanhamento e contatos rápidos.',
    keyFeatures: [
      'Histórico de aulas realizadas e faltas',
      'Anotações pedagógicas e metas do aluno',
      'Contato rápido via WhatsApp com 1 clique',
      'Atalho para novo agendamento pré-preenchido'
    ]
  },
  {
    id: 'financial-and-pix',
    title: '6. Financeiro & Cobranças Pix',
    subtitle: 'Controle de recebimentos com QR Code Pix instantâneo',
    description: 'Emita faturas para alunos, gere QR Code Copia e Cola Pix e acompanhe cobranças pendentes, pagas e vencidas.',
    detailedText: 'O painel Financeiro permite cadastrar sua chave Pix (CPF, CNPJ, E-mail, Celular ou Chave Aleatória) e gerar faturas automáticas para cada serviço. O aluno pode escanear o QR Code ou copiar o código Pix para pagar em segundos pelo banco.',
    badge: 'Financeiro',
    iconName: 'DollarSign',
    targetView: 'pagamentos',
    highlightElementSelector: '#payments-invoices-list',
    tip: 'Dica: Ao marcar uma fatura como paga, o saldo financeiro do seu mês é atualizado automaticamente.',
    audioNarrationText: 'No módulo Financeiro, você controla faturas, emite cobranças Pix com QR Code Copia e Cola e gerencia pagamentos de mensalidades.',
    keyFeatures: [
      'Geração de QR Code e Pix Copia e Cola oficial',
      'Filtros por status: Pago, Pendente e Vencido',
      'Configuração da chave Pix do professor com validação',
      'Comprovante digital e histórico financeiro'
    ]
  },
  {
    id: 'student-portal',
    title: '7. Portal Exclusivo do Aluno',
    subtitle: 'Área do estudante para aulas, pagamentos e materiais',
    description: 'Seus alunos têm um portal próprio onde entram nas salas do Google Meet, copiam o Pix da mensalidade e assistem videoaulas.',
    detailedText: 'O Portal do Aluno oferece uma experiência moderna para o estudante: ele visualiza o link da próxima aula com contagem regressiva, pode agendar novas sessões pelo wizard, efetuar pagamentos e acessar a biblioteca de vídeos e podcasts gravados pelo professor.',
    badge: 'Experiência Aluno',
    iconName: 'BookmarkCheck',
    targetView: 'portal-aluno',
    highlightElementSelector: '#student-portal-container',
    tip: 'Dica: O aluno não precisa instalar nada; o portal funciona em qualquer celular ou computador.',
    audioNarrationText: 'O Portal do Aluno permite que seu estudante entre na sala virtual do Google Meet, realize pagamentos Pix e assista às aulas gravadas.',
    keyFeatures: [
      'Acesso direto à sala virtual (Google Meet / Zoom)',
      'Central de pagamentos Pix com código copia e cola',
      'Biblioteca de videoaulas e materiais de apoio',
      'Assistente de agendamento integrado'
    ]
  },
  {
    id: 'public-site-and-branding',
    title: '8. Meu Site & Vitrine Profissional',
    subtitle: 'Sua página pública com agendamento online e identidade visual',
    description: 'Personalize fotos, vídeos demonstrativos, depoimentos de alunos reais, currículo acadêmico e paleta de cores da sua marca.',
    detailedText: 'Cada professor possui uma Landing Page de alta conversão. Você pode adicionar depoimentos de alunos satisfeitos, galeria de fotos do seu espaço, vídeos do YouTube, perguntas frequentes e escolher entre diversos temas de cores profissionais.',
    badge: 'Marketing',
    iconName: 'Globe',
    targetView: 'site-admin',
    highlightElementSelector: '#site-admin-tabs',
    tip: 'Dica: Compartilhe o link da sua vitrine nas redes sociais para que novos alunos agendem aulas diretamente com você.',
    audioNarrationText: 'Personalize seu site público com fotos, vídeos, depoimentos, currículo e cores da sua marca para atrair novos alunos.',
    keyFeatures: [
      'Landing page moderna com agendamento online',
      'Customizador de cores, logo e tema visual',
      'Galeria de fotos, vídeos e podcasts',
      'Depoimentos reais e seção de Perguntas Frequentes (FAQ)'
    ]
  },
  {
    id: 'users-and-rbac',
    title: '9. Usuários & Permissões (RBAC)',
    subtitle: 'Acesso seguro para Administradores, Professores, Secretárias e Alunos',
    description: 'Gerencie sua equipe com 4 níveis de acesso: Administrador Geral, Professor/Mentor, Secretaria/Atendimento e Aluno.',
    detailedText: 'Com o sistema de controle de acesso (RBAC), você pode delegar agendamentos para sua secretária sem expor seus relatórios financeiros, ou ter múltiplos professores compartilhando o mesmo sistema com isolamento de dados.',
    badge: 'Segurança & Equipe',
    iconName: 'ShieldCheck',
    targetView: 'usuarios',
    highlightElementSelector: '#users-rbac-table',
    tip: 'Dica: Utilize o alternador rápido no menu superior para testar a visão de qualquer cargo com 1 clique durante apresentações.',
    audioNarrationText: 'Em Usuários e Permissões, você adiciona novos membros da equipe e define cargos com restrições de segurança personalizadas.',
    keyFeatures: [
      '4 Níveis de Acesso: Admin, Professor, Secretaria e Aluno',
      'Matriz visual de permissões granulares',
      'Simulador de sessão em 1 clique',
      'Proteção de dados financeiros confidenciais'
    ]
  },
  {
    id: 'n8n-and-automations',
    title: '10. Automações & Webhooks n8n',
    subtitle: 'Conecte seu WhatsApp, CRMs e bancos de dados externos',
    description: 'Dispare webhooks automáticos para o n8n ou Zapier sempre que uma aula for agendada, cancelada ou paga.',
    detailedText: 'O módulo de Integrações oferece suporte a Webhooks com envio de payload JSON completo, permitindo conectar com instâncias de Evolution API, Z-API, Baileys, Google Sheets e Supabase em tempo real.',
    badge: 'Avançado',
    iconName: 'Zap',
    targetView: 'integracoes',
    highlightElementSelector: '#integrations-webhook-card',
    tip: 'Dica: Teste o disparo de webhook com o botão "Disparar Webhook de Teste" para validar seu fluxo no n8n.',
    audioNarrationText: 'O painel de Automações permite conectar seu sistema ao n8n, enviando mensagens automáticas no WhatsApp e integrando com outros softwares.',
    keyFeatures: [
      'Webhook nativo com payload JSON de agendamentos',
      'Token de autenticação Bearer para segurança',
      'Playground de teste de disparo em tempo real',
      'Modelos prontos de mensagem com variáveis dinâmicas'
    ]
  }
];

export const TUTORIAL_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'agenda',
    question: 'Como funciona o lembrete de WhatsApp 8 horas antes da aula?',
    answer: 'O sistema calcula o horário exato da aula e subtrai 8 horas. No horário agendado, você pode disparar a mensagem com 1 clique pela Central de WhatsApp ou deixar no modo automático conectado ao seu webhook n8n.'
  },
  {
    id: 'faq-2',
    category: 'pix',
    question: 'Como o aluno realiza o pagamento via Pix?',
    answer: 'Ao gerar uma fatura, o sistema gera o código Copia e Cola e o QR Code Pix com o valor exato e sua chave cadastrada. O aluno acessa pelo Portal do Aluno ou recebe o link e paga instantaneamente no app do banco dele.'
  },
  {
    id: 'faq-3',
    category: 'geral',
    question: 'Posso usar o sistema para aulas presenciais e online?',
    answer: 'Sim! Ao cadastrar um serviço ou agendamento, você escolhe se é "Online (com link do Google Meet/Zoom)", "Presencial" ou "Híbrido".'
  },
  {
    id: 'faq-4',
    category: 'acessibilidade',
    question: 'Quais recursos de acessibilidade estão disponíveis no sistema?',
    answer: 'O sistema conta com aumento de fonte até 150%, modo alto contraste (escuro, claro e monocromático), fonte facilitada para dislexia, leitor de tela com voz sintetizada em português, régua de leitura para foco e navegação completa por atalhos de teclado.'
  },
  {
    id: 'faq-5',
    category: 'whatsapp',
    question: 'Como minha secretária ou recepcionista acessa o sistema?',
    answer: 'Basta cadastrar o usuário com o perfil "Secretaria & Atendimento". Ela terá acesso para agendar aulas, cadastrar alunos e consultar serviços, sem visualizar seus relatórios financeiros.'
  },
  {
    id: 'faq-6',
    category: 'site',
    question: 'Onde encontro o link do meu site para enviar aos alunos?',
    answer: 'Clique no botão "Site" no topo da página ou acesse "Meu Site & Vitrine" no menu lateral. Você pode copiar a URL do seu perfil público e divulgar no Instagram, WhatsApp e redes sociais.'
  }
];

export const KEYBOARD_SHORTCUTS = [
  { key: 'Alt + 1', description: 'Abrir Dashboard Principal' },
  { key: 'Alt + 2', description: 'Abrir Minha Agenda' },
  { key: 'Alt + 3', description: 'Abrir Meus Serviços' },
  { key: 'Alt + A', description: 'Abrir Lista de Alunos (CRM)' },
  { key: 'Alt + F', description: 'Abrir Financeiro & Pix' },
  { key: 'Alt + U', description: 'Abrir Usuários & Permissões' },
  { key: 'Alt + S', description: 'Abrir Meu Site & Vitrine' },
  { key: 'Alt + P', description: 'Abrir Portal do Aluno' },
  { key: 'Alt + T', description: 'Iniciar Tour Interativo Passo a Passo' },
  { key: 'Alt + H', description: 'Abrir Central de Acessibilidade & Ajuda' },
  { key: 'Alt + V', description: 'Ouvir Narração da Tela Atual' },
  { key: 'Esc', description: 'Fechar qualquer Modal, Tour ou Menu Aberto' },
];
