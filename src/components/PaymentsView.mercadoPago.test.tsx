import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentsView } from './PaymentsView';
import { PaymentInvoice, ServiceItem, Student, TeacherProfile } from '../types';
import { STATUS_DESCONECTADO, StatusMercadoPago } from '../services/mercadoPagoService';

const servico = vi.hoisted(() => ({
  status: vi.fn(),
  enderecoParaConectar: vi.fn(),
  desconectar: vi.fn(),
  gerarLink: vi.fn(),
}));

vi.mock('../services/mercadoPagoService', async (original) => ({
  ...(await original<typeof import('../services/mercadoPagoService')>()),
  mercadoPagoService: servico,
  lerRetornoDoMercadoPago: () => null,
}));

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
};

const students: Student[] = [
  { id: 'std-1', name: 'Mariana Costa', email: 'mariana@teste.com', phone: '(11) 98765-4321', avatar: '', joinedDate: '2025', totalClasses: 3, status: 'Ativo' },
];

const services: ServiceItem[] = [
  { id: 'serv-1', name: 'Personal Trainer 1h', description: '', price: 150, durationMinutes: 60, active: true, modality: 'Presencial', iconName: 'fitness_center' },
];

const pendente: PaymentInvoice = {
  id: 'inv-pend', studentName: 'Mariana Costa', studentId: 'std-1', serviceOrPlanName: 'Aula Avulsa',
  amount: 100, dueDate: '2026-10-01', status: 'pendente', method: 'pix', createdAt: '2026-09-28',
};

const conectado: StatusMercadoPago = {
  configurado: true, conectado: true, apelido: 'Roberto Almeida', email: 'roberto@mp.com', conectadoEm: '2026-09-28',
};

function renderizar(lista: PaymentInvoice[] = [pendente]) {
  const onUpdateInvoices = vi.fn();
  const onRefreshInvoices = vi.fn();
  const view = render(
    <PaymentsView
      invoices={lista}
      students={students}
      services={services}
      currentTeacher={teacher}
      onUpdateInvoices={onUpdateInvoices}
      onUpdateTeacher={vi.fn()}
      onRefreshInvoices={onRefreshInvoices}
    />
  );
  return { onUpdateInvoices, onRefreshInvoices, ...view };
}

describe('financeiro com Mercado Pago', () => {
  beforeEach(() => {
    Object.values(servico).forEach((f) => f.mockReset());
  });

  it('plataforma sem Mercado Pago ativado: nenhum cartão aparece', async () => {
    servico.status.mockResolvedValue(STATUS_DESCONECTADO);
    renderizar();
    await waitFor(() => expect(servico.status).toHaveBeenCalledWith('prof-roberto'));
    expect(screen.queryByRole('region', { name: /mercado pago/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /gerar link/i })).not.toBeInTheDocument();
  });

  it('ativado mas não conectado: mostra o botão Conectar Mercado Pago', async () => {
    servico.status.mockResolvedValue({ ...STATUS_DESCONECTADO, configurado: true });
    servico.enderecoParaConectar.mockRejectedValue(new Error('falhou de propósito'));
    renderizar();

    const botao = await screen.findByRole('button', { name: /conectar mercado pago/i });
    fireEvent.click(botao);
    await waitFor(() => expect(servico.enderecoParaConectar).toHaveBeenCalledWith('prof-roberto'));
    expect(await screen.findByText('falhou de propósito')).toBeInTheDocument();
  });

  it('abrir o Financeiro relê as cobranças do banco', async () => {
    servico.status.mockResolvedValue(conectado);
    const { onRefreshInvoices } = renderizar();
    await waitFor(() => expect(onRefreshInvoices).toHaveBeenCalledTimes(1));
  });

  it('conectado: mostra a conta e gera o link de uma cobrança pendente', async () => {
    servico.status.mockResolvedValue(conectado);
    servico.gerarLink.mockResolvedValue('https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=123');
    const { onUpdateInvoices } = renderizar();

    expect(await screen.findByText(/mercado pago conectado/i)).toBeInTheDocument();
    expect(screen.getByText('Roberto Almeida')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /gerar link/i }));
    await waitFor(() => expect(onUpdateInvoices).toHaveBeenCalled());
    expect(servico.gerarLink).toHaveBeenCalledWith('prof-roberto', pendente);
    const lista: PaymentInvoice[] = onUpdateInvoices.mock.calls[0][0];
    expect(lista[0].paymentLinkUrl).toContain('mercadopago.com.br');
  });

  it('conectado: cobrança nova já sai com o link do Mercado Pago', async () => {
    servico.status.mockResolvedValue(conectado);
    servico.gerarLink.mockResolvedValue('https://mp.test/link');
    const { onUpdateInvoices, rerender } = renderizar([]);
    await screen.findByText(/mercado pago conectado/i);

    fireEvent.click(screen.getByRole('button', { name: /nova cobrança \/ link/i }));
    fireEvent.change(screen.getByPlaceholderText(/pacote 4 aulas de personal/i), { target: { value: 'Pacote' } });
    fireEvent.click(screen.getByRole('button', { name: /gerar cobrança & link/i }));

    const criada: PaymentInvoice = onUpdateInvoices.mock.calls[0][0][0];
    // O App devolve a lista com a cobrança nova antes de o link chegar
    rerender(
      <PaymentsView
        invoices={[criada]}
        students={students}
        services={services}
        currentTeacher={teacher}
        onUpdateInvoices={onUpdateInvoices}
        onUpdateTeacher={vi.fn()}
      />
    );

    await waitFor(() => expect(onUpdateInvoices).toHaveBeenCalledTimes(2));
    const comLink: PaymentInvoice[] = onUpdateInvoices.mock.calls[1][0];
    expect(comLink).toHaveLength(1);
    expect(comLink[0]).toMatchObject({ id: criada.id, paymentLinkUrl: 'https://mp.test/link' });
  });

  it('cobrança paga não oferece gerar link', async () => {
    servico.status.mockResolvedValue(conectado);
    renderizar([{ ...pendente, status: 'pago', paidAt: '2026-09-28' }]);
    await screen.findByText(/mercado pago conectado/i);
    expect(screen.queryByRole('button', { name: /gerar link/i })).not.toBeInTheDocument();
  });
});
