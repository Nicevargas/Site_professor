import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentsView } from './PaymentsView';
import { PaymentInvoice, ServiceItem, Student, TeacherProfile } from '../types';
import { addDays, toLocalDateKey } from '../utils/dates';

const teacher: TeacherProfile = {
  id: 'prof-roberto',
  name: 'Prof. Roberto Almeida',
  role: 'Personal Trainer',
  specialty: 'Treino',
  bio: '',
  rating: 5,
  reviewCount: 1,
  yearsExperience: 1,
  avatarUrl: '',
  heroImageUrl: '',
  whatsapp: '5511999999999',
  email: 'roberto@teste.com',
  pixKey: 'roberto@teste.com',
  pixKeyType: 'email',
  pixReceiverName: 'Roberto Almeida',
  pixBankName: 'Nubank',
};

const students: Student[] = [
  { id: 'std-1', name: 'Mariana Costa', email: 'mariana@teste.com', phone: '(11) 98765-4321', avatar: '', joinedDate: '2025', totalClasses: 3, status: 'Ativo' },
  { id: 'std-2', name: 'João Pedro', email: 'joao@teste.com', phone: '(11) 97654-3210', avatar: '', joinedDate: '2025', totalClasses: 1, status: 'Ativo' },
];

const services: ServiceItem[] = [
  { id: 'serv-1', name: 'Personal Trainer 1h', description: '', price: 150, durationMinutes: 60, active: true, modality: 'Presencial', iconName: 'fitness_center' },
];

const today = toLocalDateKey(new Date());
const tenDaysAgo = toLocalDateKey(addDays(new Date(), -10));

const invoices: PaymentInvoice[] = [
  { id: 'inv-pago', studentName: 'Mariana Costa', studentId: 'std-1', serviceOrPlanName: 'Pacote Mensal', amount: 200, dueDate: today, paidAt: today, status: 'pago', method: 'pix', createdAt: today },
  { id: 'inv-pend', studentName: 'João Pedro', studentId: 'std-2', serviceOrPlanName: 'Aula Avulsa', amount: 100, dueDate: today, status: 'pendente', method: 'pix', createdAt: today },
  { id: 'inv-venc', studentName: 'Ana Lima', serviceOrPlanName: 'Mensalidade', amount: 150, dueDate: tenDaysAgo, status: 'vencido', method: 'boleto', createdAt: tenDaysAgo },
];

function renderPayments(list: PaymentInvoice[] = invoices) {
  const onUpdateInvoices = vi.fn();
  const onUpdateTeacher = vi.fn();
  render(
    <PaymentsView
      invoices={list}
      students={students}
      services={services}
      currentTeacher={teacher}
      onUpdateInvoices={onUpdateInvoices}
      onUpdateTeacher={onUpdateTeacher}
    />
  );
  return { onUpdateInvoices, onUpdateTeacher };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('financeiro', () => {
  it('resume recebido, pendente e vencido a partir do status das cobranças', () => {
    renderPayments();
    expect(screen.getByText(/inadimplência \(vencidos\)/i)).toBeInTheDocument();
    expect(screen.getByText(/vencidas \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/vencido há 10 dias/i)).toBeInTheDocument();
    expect(screen.getAllByText(/R\$\s?150/).length).toBeGreaterThan(0);
  });

  it('registrar pagamento marca a cobrança como paga com a data de hoje', () => {
    const { onUpdateInvoices } = renderPayments();
    const [markPaid] = screen.getAllByTitle(/registrar pagamento recebido/i);
    fireEvent.click(markPaid);

    expect(onUpdateInvoices).toHaveBeenCalledTimes(1);
    const updated: PaymentInvoice[] = onUpdateInvoices.mock.calls[0][0];
    const changed = updated.filter((inv) => inv.status === 'pago');
    expect(changed).toHaveLength(2);
    const justPaid = changed.find((inv) => inv.id !== 'inv-pago')!;
    expect(justPaid.paidAt).toBe(new Date().toISOString().split('T')[0]);
    expect(updated.find((inv) => inv.id === 'inv-pago')).toEqual(invoices[0]);
  });

  it('reabrir volta a cobrança para pendente e limpa a data de pagamento', () => {
    const { onUpdateInvoices } = renderPayments();
    fireEvent.click(screen.getByTitle(/reverter para pendente/i));
    const updated: PaymentInvoice[] = onUpdateInvoices.mock.calls[0][0];
    const reopened = updated.find((inv) => inv.id === 'inv-pago')!;
    expect(reopened.status).toBe('pendente');
    expect(reopened.paidAt).toBeUndefined();
  });

  it('filtrar por vencidas mostra só a cobrança em atraso', () => {
    renderPayments();
    fireEvent.click(screen.getByText(/vencidas \(1\)/i));
    expect(screen.queryAllByTitle(/registrar pagamento recebido/i)).toHaveLength(1);
    expect(screen.queryByTitle(/reverter para pendente/i)).not.toBeInTheDocument();
  });

  it('nova cobrança nasce pendente, com aluno, valor do serviço, link e código Pix', () => {
    const { onUpdateInvoices } = renderPayments();
    fireEvent.click(screen.getByRole('button', { name: /nova cobrança \/ link/i }));
    expect(screen.getByText(/nova cobrança \/ link de pagamento/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/pacote 4 aulas de personal/i), { target: { value: 'Pacote de 4 aulas' } });
    fireEvent.click(screen.getByRole('button', { name: /gerar cobrança & link/i }));

    expect(onUpdateInvoices).toHaveBeenCalledTimes(1);
    const updated: PaymentInvoice[] = onUpdateInvoices.mock.calls[0][0];
    expect(updated).toHaveLength(invoices.length + 1);
    const created = updated[0];
    expect(created).toMatchObject({
      status: 'pendente',
      studentId: 'std-1',
      studentName: 'Mariana Costa',
      serviceOrPlanName: 'Pacote de 4 aulas',
      amount: 150,
      method: 'pix',
    });
    expect(created.paymentLinkUrl).toContain(created.id);
    expect(created.pixCode).toContain('roberto@teste.com');
  });

  it('salvar configuração de Pix devolve o professor com a nova chave e mantém o restante', () => {
    const { onUpdateTeacher } = renderPayments();
    fireEvent.click(screen.getByTitle(/configurar chave pix/i));
    expect(screen.getByText(/configuração de pix & recebimento/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/seu-email@exemplo\.com ou 11999998888/i), { target: { value: '11988887777' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar configurações/i }));

    expect(onUpdateTeacher).toHaveBeenCalledTimes(1);
    const saved: TeacherProfile = onUpdateTeacher.mock.calls[0][0];
    expect(saved.pixKey).toBe('11988887777');
    expect(saved.pixReceiverName).toBe('Roberto Almeida');
    expect(saved.id).toBe('prof-roberto');
    expect(saved.whatsapp).toBe('5511999999999');
  });
});
