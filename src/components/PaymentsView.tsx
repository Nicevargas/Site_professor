import React, { useState, useMemo } from 'react';
import { 
  PaymentInvoice, 
  Student, 
  ServiceItem, 
  TeacherProfile,
  PaymentStatus,
  PaymentMethod
} from '../types';
import { 
  DollarSign, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  Send, 
  Copy, 
  Check, 
  QrCode, 
  ExternalLink, 
  Download, 
  Share2, 
  Settings, 
  User, 
  Calendar, 
  ChevronRight, 
  X, 
  FileText, 
  Sparkles, 
  MessageSquare,
  AlertCircle,
  TrendingUp,
  Receipt,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';

interface PaymentsViewProps {
  invoices: PaymentInvoice[];
  students: Student[];
  services: ServiceItem[];
  currentTeacher: TeacherProfile;
  onUpdateInvoices: (invoices: PaymentInvoice[]) => void;
  onUpdateTeacher: (teacher: TeacherProfile) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  invoices,
  students,
  services,
  currentTeacher,
  onUpdateInvoices,
  onUpdateTeacher,
}) => {
  // Filters and state
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethodFilter, setSelectedMethodFilter] = useState<'all' | PaymentMethod>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals state
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPixSettingsOpen, setIsPixSettingsOpen] = useState(false);
  const [selectedInvoiceForShare, setSelectedInvoiceForShare] = useState<PaymentInvoice | null>(null);

  // Quick Action notification
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Helper copy function
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showNotification('Copiado para a área de transferência!');
  };

  // Calculations for KPI Cards
  const metrics = useMemo(() => {
    let totalReceived = 0;
    let totalPending = 0;
    let totalOverdue = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    invoices.forEach((inv) => {
      if (inv.status === 'pago') {
        totalReceived += inv.amount;
        paidCount++;
      } else if (inv.status === 'pendente') {
        totalPending += inv.amount;
        pendingCount++;
      } else if (inv.status === 'vencido') {
        totalOverdue += inv.amount;
        overdueCount++;
      }
    });

    const totalBilled = totalReceived + totalPending + totalOverdue;
    const defaultRate = totalBilled > 0 ? (totalOverdue / totalBilled) * 100 : 0;

    return {
      totalReceived,
      totalPending,
      totalOverdue,
      paidCount,
      pendingCount,
      overdueCount,
      totalBilled,
      defaultRate: defaultRate.toFixed(1),
    };
  }, [invoices]);

  // List of overdue / delinquent invoices
  const overdueInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.status === 'vencido');
  }, [invoices]);

  // Filtered invoices for display
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Status filter
      if (activeStatusFilter !== 'all' && inv.status !== activeStatusFilter) {
        return false;
      }
      // Method filter
      if (selectedMethodFilter !== 'all' && inv.method !== selectedMethodFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = inv.studentName.toLowerCase().includes(q);
        const matchesService = inv.serviceOrPlanName.toLowerCase().includes(q);
        const matchesId = inv.id.toLowerCase().includes(q);
        if (!matchesName && !matchesService && !matchesId) return false;
      }
      return true;
    });
  }, [invoices, activeStatusFilter, selectedMethodFilter, searchQuery]);

  // Status Change actions
  const handleMarkAsPaid = (invoiceId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = invoices.map((inv) => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          status: 'pago' as PaymentStatus,
          paidAt: today,
        };
      }
      return inv;
    });
    onUpdateInvoices(updated);
    showNotification('Pagamento confirmado e registrado com sucesso!');
  };

  const handleMarkAsPending = (invoiceId: string) => {
    const updated = invoices.map((inv) => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          status: 'pendente' as PaymentStatus,
          paidAt: undefined,
        };
      }
      return inv;
    });
    onUpdateInvoices(updated);
    showNotification('Status alterado para Pendente.');
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta cobrança?')) {
      const updated = invoices.filter((inv) => inv.id !== invoiceId);
      onUpdateInvoices(updated);
      showNotification('Cobrança removida com sucesso.');
    }
  };

  // Open Share Modal
  const handleOpenShare = (invoice: PaymentInvoice) => {
    setSelectedInvoiceForShare(invoice);
    setIsShareModalOpen(true);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'ID Cobrança',
      'Aluno',
      'Telefone',
      'E-mail',
      'Serviço / Plano',
      'Valor (R$)',
      'Vencimento',
      'Data Pagamento',
      'Status',
      'Método',
      'Parcelas',
      'Observações'
    ];

    const rows = invoices.map((inv) => [
      inv.id,
      `"${inv.studentName}"`,
      `"${inv.studentPhone || ''}"`,
      `"${inv.studentEmail || ''}"`,
      `"${inv.serviceOrPlanName}"`,
      inv.amount.toFixed(2),
      inv.dueDate,
      inv.paidAt || '',
      inv.status.toUpperCase(),
      inv.method.toUpperCase(),
      inv.installments || 'Única',
      `"${inv.notes || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_cobrancas_${currentTeacher.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Relatório financeiro exportado em CSV!');
  };

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Format date helper
  const formatDateBR = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Compute days difference for due date tags
  const getDueBadge = (dueDateStr: string, status: PaymentStatus) => {
    if (status === 'pago') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Pago
        </span>
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = dueDateStr.split('-').map(Number);
    const dueDate = new Date(y, m - 1, d);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const daysOverdue = Math.abs(diffDays);
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          Vencido há {daysOverdue} {daysOverdue === 1 ? 'dia' : 'dias'}
        </span>
      );
    } else if (diffDays === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
          <Clock className="w-3 h-3 text-amber-600" />
          Vence Hoje
        </span>
      );
    } else if (diffDays <= 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
          <Clock className="w-3 h-3 text-blue-600" />
          Vence em {diffDays} {diffDays === 1 ? 'dia' : 'dias'}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          <Calendar className="w-3 h-3 text-slate-500" />
          {formatDateBR(dueDateStr)}
        </span>
      );
    }
  };

  return (
    <main className="flex-1 p-4 md:p-8 bg-[#f7f9fb] pb-32 overflow-y-auto font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Notice toast */}
        {actionNotice && (
          <div className="fixed top-20 right-6 z-50 bg-[#091426] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-top-4 duration-200">
            <Sparkles className="w-4 h-4 text-[#57dffe]" />
            <span className="text-xs font-medium">{actionNotice}</span>
          </div>
        )}

        {/* Top Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#00687a] uppercase tracking-wider">
                Módulo Financeiro & Recebíveis
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                PIX & Links Automáticos
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#091426] tracking-tight mt-1">
              Gestão de Pagamentos & Vencimentos
            </h1>
            <p className="text-xs md:text-sm text-[#45474c] mt-1">
              Emita cobranças, envie links de pagamento por WhatsApp, controle datas de vencimento e reduza a inadimplência.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsPixSettingsOpen(true)}
              className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
              title="Configurar Chave PIX e Dados de Recebimento"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Configurar PIX</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
              title="Exportar dados para planilha Excel / CSV"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>

            <button
              onClick={() => setIsNewInvoiceOpen(true)}
              className="px-4 py-2.5 bg-[#00687a] hover:bg-[#004e5c] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Cobrança / Link</span>
            </button>
          </div>
        </div>

        {/* Financial KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Recebido */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-ambient flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">Total Recebido (Mês)</p>
              <h3 className="text-2xl font-extrabold text-emerald-600 tracking-tight mt-1">
                {formatCurrency(metrics.totalReceived)}
              </h3>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {metrics.paidCount} {metrics.paidCount === 1 ? 'fatura paga' : 'faturas pagas'}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: A Receber (Pendentes) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-ambient flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">A Receber (No Prazo)</p>
              <h3 className="text-2xl font-extrabold text-blue-600 tracking-tight mt-1">
                {formatCurrency(metrics.totalPending)}
              </h3>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
                <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                  {metrics.pendingCount} {metrics.pendingCount === 1 ? 'fatura a vencer' : 'faturas a vencer'}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Inadimplência / Vencidos */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-ambient flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">Inadimplência (Vencidos)</p>
              <h3 className="text-2xl font-extrabold text-rose-600 tracking-tight mt-1">
                {formatCurrency(metrics.totalOverdue)}
              </h3>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
                <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                  {metrics.overdueCount} {metrics.overdueCount === 1 ? 'aluno em atraso' : 'alunos em atraso'}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Taxa de Inadimplência */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-ambient flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">Taxa de Inadimplência</p>
              <h3 className="text-2xl font-extrabold text-[#091426] tracking-tight mt-1">
                {metrics.defaultRate}%
              </h3>
              <div className="flex items-center gap-1 text-[11px] mt-2">
                {Number(metrics.defaultRate) > 15 ? (
                  <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Atenção necessária
                  </span>
                ) : (
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Saúde financeira estável
                  </span>
                )}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Overdue Delinquency Alert Banner (Régua de Cobrança) */}
        {overdueInvoices.length > 0 && (
          <div className="bg-gradient-to-r from-rose-50 to-orange-50 rounded-2xl p-5 border border-rose-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-200/80 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-rose-950">
                    Controle de Inadimplência ({overdueInvoices.length} {overdueInvoices.length === 1 ? 'cobrança vencida' : 'cobranças vencidas'})
                  </h3>
                  <p className="text-xs text-rose-800">
                    Total em atraso: <strong>{formatCurrency(metrics.totalOverdue)}</strong>. Use os atalhos abaixo para enviar lembretes com link de pagamento direto no WhatsApp.
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-rose-800 bg-rose-100/80 px-3 py-1 rounded-full self-start sm:self-auto">
                Ação Recomendada: Cobrança Amigável
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {overdueInvoices.map((inv) => (
                <div 
                  key={inv.id}
                  className="bg-white/90 backdrop-blur rounded-xl p-3.5 border border-rose-200 flex flex-col justify-between gap-2 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">{inv.studentName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{inv.serviceOrPlanName}</p>
                    </div>
                    <span className="text-xs font-black text-rose-600">
                      {formatCurrency(inv.amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                    <div className="text-rose-700 font-medium">
                      Venceu em: {formatDateBR(inv.dueDate)}
                    </div>

                    <button
                      onClick={() => handleOpenShare(inv)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Cobrar no WhatsApp</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Table / Invoices List Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-ambient overflow-hidden">
          
          {/* Filters Bar */}
          <div className="p-4 md:p-6 border-b border-slate-100 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              
              {/* Status Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setActiveStatusFilter('all')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeStatusFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todas ({invoices.length})
                </button>
                <button
                  onClick={() => setActiveStatusFilter('pendente')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeStatusFilter === 'pendente'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>A Vencer ({metrics.pendingCount})</span>
                </button>
                <button
                  onClick={() => setActiveStatusFilter('vencido')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeStatusFilter === 'vencido'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Vencidas ({metrics.overdueCount})</span>
                </button>
                <button
                  onClick={() => setActiveStatusFilter('pago')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeStatusFilter === 'pago'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Pagas ({metrics.paidCount})</span>
                </button>
              </div>

              {/* Search & Method Filter */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar aluno ou serviço..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#00687a] focus:ring-1 focus:ring-[#00687a] transition-all"
                  />
                </div>

                <select
                  value={selectedMethodFilter}
                  onChange={(e) => setSelectedMethodFilter(e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:border-[#00687a]"
                >
                  <option value="all">Todos os Métodos</option>
                  <option value="pix">PIX</option>
                  <option value="cartao">Cartão de Crédito</option>
                  <option value="boleto">Boleto</option>
                </select>
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3.5 px-4">Aluno / Cliente</th>
                  <th className="py-3.5 px-4">Serviço / Plano</th>
                  <th className="py-3.5 px-4">Valor</th>
                  <th className="py-3.5 px-4">Vencimento</th>
                  <th className="py-3.5 px-4">Método</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-sm">Nenhuma cobrança encontrada</p>
                      <p className="text-xs text-slate-400 mt-1">Tente ajustar os filtros ou crie uma nova cobrança.</p>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr 
                      key={inv.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#00687a]/10 text-[#00687a] font-bold flex items-center justify-center text-xs shrink-0">
                            {inv.studentName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{inv.studentName}</p>
                            <p className="text-[11px] text-slate-400">{inv.studentPhone || inv.studentEmail || 'Sem contato'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Service / Notes */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{inv.serviceOrPlanName}</p>
                        <p className="text-[11px] text-slate-500">{inv.installments || 'Única'} {inv.notes ? `• ${inv.notes}` : ''}</p>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                        {formatCurrency(inv.amount)}
                      </td>

                      {/* Due Date & Badge */}
                      <td className="py-3.5 px-4">
                        {getDueBadge(inv.dueDate, inv.status)}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 capitalize bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          {inv.method === 'pix' && <QrCode className="w-3 h-3 text-emerald-600" />}
                          {inv.method === 'cartao' && <CreditCard className="w-3 h-3 text-blue-600" />}
                          {inv.method === 'boleto' && <FileText className="w-3 h-3 text-orange-600" />}
                          {inv.method}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {inv.status === 'pago' && (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                            <Check className="w-3 h-3" /> Pago
                          </span>
                        )}
                        {inv.status === 'pendente' && (
                          <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-[11px]">
                            <Clock className="w-3 h-3" /> Pendente
                          </span>
                        )}
                        {inv.status === 'vencido' && (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-[11px]">
                            <AlertTriangle className="w-3 h-3" /> Inadimplente
                          </span>
                        )}
                        {inv.status === 'cancelado' && (
                          <span className="inline-flex items-center gap-1 font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                            Cancelado
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Share / WhatsApp button */}
                          <button
                            onClick={() => handleOpenShare(inv)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Enviar cobrança / link no WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          {/* Copy Payment Link */}
                          <button
                            onClick={() => handleCopy(inv.paymentLinkUrl || `https://pay.agendaprofessor.com.br/pay/${inv.id}`, `link-${inv.id}`)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Copiar Link de Pagamento"
                          >
                            {copiedId === `link-${inv.id}` ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          {/* Quick Toggle Paid */}
                          {inv.status !== 'pago' ? (
                            <button
                              onClick={() => handleMarkAsPaid(inv.id)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-bold text-[11px] transition-colors"
                              title="Registrar pagamento recebido"
                            >
                              Dar Baixa
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMarkAsPending(inv.id)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium text-[11px] transition-colors"
                              title="Reverter para pendente"
                            >
                              Reabrir
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Informative Instructions Card */}
        <div className="bg-[#091426] text-white rounded-2xl p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#57dffe]/20 text-[#57dffe] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Como funciona a automação de recebimentos e régua de cobrança
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Mantenha suas finanças organizadas sem atrito com seus alunos.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-[#1e293b] rounded-xl border border-slate-700 space-y-2">
              <span className="text-xs font-bold text-[#57dffe]">1. Geração de Link & PIX</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ao cadastrar a cobrança, o sistema gera o <strong>PIX Copia e Cola</strong> e o link seguro de pagamento com os dados do seu banco cadastrado.
              </p>
            </div>

            <div className="p-4 bg-[#1e293b] rounded-xl border border-slate-700 space-y-2">
              <span className="text-xs font-bold text-[#57dffe]">2. Envio no WhatsApp em 1 Clique</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Acesse o botão do WhatsApp para disparar a mensagem polida já formatada com valor, data de vencimento e chave PIX para o aluno.
              </p>
            </div>

            <div className="p-4 bg-[#1e293b] rounded-xl border border-slate-700 space-y-2">
              <span className="text-xs font-bold text-[#57dffe]">3. Controle de Inadimplência</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Cobranças não pagas após o vencimento entram automaticamente no painel de inadimplentes para renegociação e disparo de avisos.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Modal 1: Nova Cobrança / Link de Pagamento */}
      {isNewInvoiceOpen && (
        <NewInvoiceModal
          students={students}
          services={services}
          currentTeacher={currentTeacher}
          onClose={() => setIsNewInvoiceOpen(false)}
          onSave={(newInvoice) => {
            onUpdateInvoices([newInvoice, ...invoices]);
            setIsNewInvoiceOpen(false);
            showNotification('Cobrança criada com sucesso!');
          }}
        />
      )}

      {/* Modal 2: Compartilhar Link & Cobrar no WhatsApp */}
      {isShareModalOpen && selectedInvoiceForShare && (
        <SharePaymentModal
          invoice={selectedInvoiceForShare}
          currentTeacher={currentTeacher}
          onClose={() => {
            setIsShareModalOpen(false);
            setSelectedInvoiceForShare(null);
          }}
          onMarkAsPaid={() => {
            handleMarkAsPaid(selectedInvoiceForShare.id);
            setIsShareModalOpen(false);
          }}
        />
      )}

      {/* Modal 3: Configurações de PIX e Recebimento */}
      {isPixSettingsOpen && (
        <PixSettingsModal
          currentTeacher={currentTeacher}
          onClose={() => setIsPixSettingsOpen(false)}
          onSave={(updatedTeacher) => {
            onUpdateTeacher(updatedTeacher);
            setIsPixSettingsOpen(false);
            showNotification('Configurações de PIX salvas com sucesso!');
          }}
        />
      )}

    </main>
  );
};

// -------------------------------------------------------------
// MODAL: Nova Cobrança
// -------------------------------------------------------------
interface NewInvoiceModalProps {
  students: Student[];
  services: ServiceItem[];
  currentTeacher: TeacherProfile;
  onClose: () => void;
  onSave: (invoice: PaymentInvoice) => void;
}

const NewInvoiceModal: React.FC<NewInvoiceModalProps> = ({
  students,
  services,
  currentTeacher,
  onClose,
  onSave,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [customStudentName, setCustomStudentName] = useState('');
  const [customStudentPhone, setCustomStudentPhone] = useState('');
  const [serviceOrPlanName, setServiceOrPlanName] = useState(services[0]?.name || 'Aula Particular');
  const [amount, setAmount] = useState(services[0]?.price || 150);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [method, setMethod] = useState<PaymentMethod>('pix');
  const [installments, setInstallments] = useState('Única');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let studentName = customStudentName;
    let studentPhone = customStudentPhone;
    let studentEmail = '';

    if (selectedStudentId !== 'custom') {
      const found = students.find((s) => s.id === selectedStudentId);
      if (found) {
        studentName = found.name;
        studentPhone = found.phone;
        studentEmail = found.email;
      }
    }

    if (!studentName.trim()) {
      alert('Por favor, informe o nome do aluno.');
      return;
    }

    const newId = `inv-${Date.now().toString().slice(-6)}`;
    const pixKey = currentTeacher.pixKey || currentTeacher.email;

    const newInvoice: PaymentInvoice = {
      id: newId,
      studentId: selectedStudentId !== 'custom' ? selectedStudentId : undefined,
      studentName,
      studentPhone,
      studentEmail,
      serviceOrPlanName,
      amount: Number(amount),
      dueDate,
      status: 'pendente',
      method,
      installments,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString().split('T')[0],
      paymentLinkUrl: `https://pay.agendaprofessor.com.br/pay/${newId}`,
      pixCode: `00020126580014br.gov.bcb.pix0136${pixKey}5204000053039865405${Number(amount).toFixed(2)}5802BR5920${currentTeacher.name.slice(0, 20)}6009Sao Paulo62070503***6304XYZ`,
    };

    onSave(newInvoice);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 my-8 space-y-6 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00687a]/10 text-[#00687a] flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#091426]">Nova Cobrança / Link de Pagamento</h2>
              <p className="text-xs text-slate-500">Emita um link direto ou gere PIX Copia e Cola para o aluno.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Student selection */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Aluno / Destinatário *</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#00687a]"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.phone || s.email})
                </option>
              ))}
              <option value="custom">+ Outro Aluno / Cobrança Avulsa</option>
            </select>
          </div>

          {selectedStudentId === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={customStudentName}
                  onChange={(e) => setCustomStudentName(e.target.value)}
                  placeholder="Ex: Beatriz Lima"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">WhatsApp / Telefone</label>
                <input
                  type="text"
                  value={customStudentPhone}
                  onChange={(e) => setCustomStudentPhone(e.target.value)}
                  placeholder="(11) 99999-8888"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          )}

          {/* Service / Description */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Descrição do Serviço / Plano *</label>
            <input
              type="text"
              required
              value={serviceOrPlanName}
              onChange={(e) => setServiceOrPlanName(e.target.value)}
              placeholder="Ex: Pacote 4 Aulas de Personal / Mensalidade de Setembro"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#00687a]"
            />
          </div>

          {/* Value & Due date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Valor Total (R$) *</label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#00687a]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Data de Vencimento *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#00687a]"
              />
            </div>
          </div>

          {/* Payment Method & Installments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Forma de Pagamento Principal</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white"
              >
                <option value="pix">PIX (Chave & QR Code Dinâmico)</option>
                <option value="cartao">Cartão de Crédito</option>
                <option value="boleto">Boleto Bancário</option>
                <option value="dinheiro">Dinheiro / Transferência</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Condição / Parcelas</label>
              <input
                type="text"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                placeholder="Ex: À vista, Mensalidade, 2x, 3x..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Observações Internas (Opcional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Aluno pediu para pagar até o 5º dia útil"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#00687a] hover:bg-[#004e5c] text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Gerar Cobrança & Link</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

// -------------------------------------------------------------
// MODAL: Compartilhar Cobrança & WhatsApp
// -------------------------------------------------------------
interface SharePaymentModalProps {
  invoice: PaymentInvoice;
  currentTeacher: TeacherProfile;
  onClose: () => void;
  onMarkAsPaid: () => void;
}

const SharePaymentModal: React.FC<SharePaymentModalProps> = ({
  invoice,
  currentTeacher,
  onClose,
  onMarkAsPaid,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDateBR = (dateStr: string) => {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const pixKey = currentTeacher.pixKey || currentTeacher.email || 'roberto.almeida@agendaprofessor.com.br';
  const paymentLink = invoice.paymentLinkUrl || `https://pay.agendaprofessor.com.br/pay/${invoice.id}`;

  const isOverdue = invoice.status === 'vencido';

  // Customized WhatsApp text message
  const whatsappMessage = isOverdue
    ? `*LEMBRETE DE PAGAMENTO PENDENTE* ⚠️\n\nOlá, ${invoice.studentName}! Tudo bem? 👋\nAqui é do atendimento do Prof. ${currentTeacher.name}.\n\nConstatamos em nosso sistema que a fatura referente a *${invoice.serviceOrPlanName}* no valor de *${formatCurrency(invoice.amount)}* venceu no dia *${formatDateBR(invoice.dueDate)}*.\n\n🔑 *Chave PIX:* ${pixKey}\n🔗 *Link para Pagamento Online / Cartão:* ${paymentLink}\n\nCaso já tenha realizado o pagamento, favor desconsiderar ou nos enviar o comprovante por aqui. Obrigado! 🙏`
    : `*LINK DE PAGAMENTO - ${currentTeacher.name.toUpperCase()}* 💳\n\nOlá, ${invoice.studentName}! Tudo bem? 👋\nSegue o link para o pagamento referente a *${invoice.serviceOrPlanName}*:\n\n💰 *Valor:* ${formatCurrency(invoice.amount)}\n🗓️ *Vencimento:* ${formatDateBR(invoice.dueDate)}\n\n🔑 *Chave PIX:* ${pixKey}\n🔗 *Pagar com Cartão / Link:* ${paymentLink}\n\nQualquer dúvida, estamos à disposição!`;

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenWhatsApp = () => {
    const rawPhone = (invoice.studentPhone || '').replace(/\D/g, '');
    const cleanPhone = rawPhone.length >= 10 ? (rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`) : '';
    const encodedText = encodeURIComponent(whatsappMessage);
    
    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 my-8 space-y-6 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#091426]">Cobrar / Enviar Link de Pagamento</h2>
              <p className="text-xs text-slate-500">Destinatário: <strong>{invoice.studentName}</strong></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Summary Card */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
          <div>
            <p className="text-slate-500">{invoice.serviceOrPlanName}</p>
            <p className="font-extrabold text-slate-900 text-base mt-0.5">{formatCurrency(invoice.amount)}</p>
            <p className="text-slate-500 mt-1">Vencimento: <strong>{formatDateBR(invoice.dueDate)}</strong></p>
          </div>
          <div className="text-right">
            {invoice.status === 'pago' ? (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold">PAGO</span>
            ) : invoice.status === 'vencido' ? (
              <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full font-bold">VENCIDO</span>
            ) : (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-bold">PENDENTE</span>
            )}
          </div>
        </div>

        {/* WhatsApp Message Preview */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mensagem Formatada para WhatsApp</span>
            </label>
            <button
              onClick={() => handleCopyText(whatsappMessage, 'wa-msg')}
              className="text-[11px] text-[#00687a] font-bold hover:underline flex items-center gap-1"
            >
              {copiedKey === 'wa-msg' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'wa-msg' ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>
          </div>

          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl font-sans text-slate-800 whitespace-pre-line text-xs max-h-48 overflow-y-auto leading-relaxed">
            {whatsappMessage}
          </div>
        </div>

        {/* Quick Copy Link and PIX */}
        <div className="space-y-3 pt-1 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Chave PIX do Professor:</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={pixKey}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 text-xs"
              />
              <button
                type="button"
                onClick={() => handleCopyText(pixKey, 'pix-key')}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors border border-slate-300 shrink-0"
              >
                {copiedKey === 'pix-key' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Link de Pagamento Seguro:</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={paymentLink}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 text-xs truncate"
              />
              <button
                type="button"
                onClick={() => handleCopyText(paymentLink, 'pay-link')}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors border border-slate-300 shrink-0"
              >
                {copiedKey === 'pay-link' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-slate-100 text-xs">
          {invoice.status !== 'pago' && (
            <button
              type="button"
              onClick={onMarkAsPaid}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Dar Baixa como Pago</span>
            </button>
          )}

          <div className="flex gap-2 sm:ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>Abrir no WhatsApp</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// -------------------------------------------------------------
// MODAL: Configurações de PIX e Recebimentos
// -------------------------------------------------------------
interface PixSettingsModalProps {
  currentTeacher: TeacherProfile;
  onClose: () => void;
  onSave: (teacher: TeacherProfile) => void;
}

const PixSettingsModal: React.FC<PixSettingsModalProps> = ({
  currentTeacher,
  onClose,
  onSave,
}) => {
  const [pixKey, setPixKey] = useState(currentTeacher.pixKey || currentTeacher.email || '');
  const [pixKeyType, setPixKeyType] = useState(currentTeacher.pixKeyType || 'email');
  const [pixReceiverName, setPixReceiverName] = useState(currentTeacher.pixReceiverName || currentTeacher.name);
  const [pixBankName, setPixBankName] = useState(currentTeacher.pixBankName || 'Nubank / Inter');
  const [defaultPaymentGateway, setDefaultPaymentGateway] = useState(currentTeacher.defaultPaymentGateway || 'pix');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...currentTeacher,
      pixKey,
      pixKeyType: pixKeyType as any,
      pixReceiverName,
      pixBankName,
      defaultPaymentGateway,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 my-8 space-y-6 animate-in zoom-in-95 duration-150 text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#091426]">Configuração de PIX & Recebimento</h2>
              <p className="text-xs text-slate-500">Dados exibidos aos alunos nas mensagens de cobrança.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tipo de Chave *</label>
              <select
                value={pixKeyType}
                onChange={(e) => setPixKeyType(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white"
              >
                <option value="email">E-mail</option>
                <option value="phone">Celular (Telefone)</option>
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="random">Chave Aleatória (EVP)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Chave PIX *</label>
              <input
                type="text"
                required
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="Ex: seu-email@exemplo.com ou 11999998888"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nome do Titular da Conta *</label>
            <input
              type="text"
              required
              value={pixReceiverName}
              onChange={(e) => setPixReceiverName(e.target.value)}
              placeholder="Ex: Roberto Almeida - Treinamento"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Instituição Bancária / Banco</label>
            <input
              type="text"
              value={pixBankName}
              onChange={(e) => setPixBankName(e.target.value)}
              placeholder="Ex: Nubank / Banco Inter / Itaú"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Gateway de Cartão / Pagamentos Online</label>
            <select
              value={defaultPaymentGateway}
              onChange={(e) => setDefaultPaymentGateway(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white"
            >
              <option value="pix">PIX Direto na Conta (Sem taxas adicionais)</option>
              <option value="mercadopago">Mercado Pago (Checkout transparente)</option>
              <option value="stripe">Stripe</option>
              <option value="asaas">Asaas (Cobranças & Carnês)</option>
              <option value="infinitepay">InfinitePay</option>
              <option value="pagbank">PagBank (PagSeguro)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#00687a] hover:bg-[#004e5c] text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Configurações</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
