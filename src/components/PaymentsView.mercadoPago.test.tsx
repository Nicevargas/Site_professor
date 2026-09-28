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

// Formato de um Pix dinâmico do Mercado Pago (aponta para um endereço dele)
const PIX_MP = '00020126580014br.gov.bcb.pix2536pix-qr.mercadopago.com/instore/o/v2/abc5204000053039865802BR6304ABCD';

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
    servico.gerarLink.mockResolvedValue({
      link: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=123',
      pixCode: PIX_MP,
      avisoPix: null,
    });
    const { onUpdateInvoices } = renderizar();

    expect(await screen.findByText(/mercado pago conectado/i)).toBeInTheDocument();
    expect(screen.getByText('Roberto Almeida')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /gerar link/i }));
    await waitFor(() => expect(onUpdateInvoices).toHaveBeenCalled());
    expect(servico.gerarLink).toHaveBeenCalledWith('prof-roberto', pendente);
    const lista: PaymentInvoice[] = onUpdateInvoices.mock.calls[0][0];
    expect(lista[0].paymentLinkUrl).toContain('mercadopago.com.br');
    expect(lista[0].pixCode).toBe(PIX_MP);
  });

  it('conta sem chave Pix no Mercado Pago: gera o link e explica o que falta', async () => {
    servico.status.mockResolvedValue(conectado);
    servico.gerarLink.mockResolvedValue({
      link: 'https://mp.test/link',
      pixCode: null,
      avisoPix: 'Sua conta do Mercado Pago ainda não tem chave Pix.',
    });
    const { onUpdateInvoices } = renderizar();
    fireEvent.click(await screen.findByRole('button', { name: /gerar link/i }));

    expect(await screen.findByText(/ainda não tem chave pix/i)).toBeInTheDocument();
    const lista: PaymentInvoice[] = onUpdateInvoices.mock.calls[0][0];
    expect(lista[0].paymentLinkUrl).toBe('https://mp.test/link');
    expect(lista[0].pixCode).toBeUndefined();
  });

  it('cobrança com link mas sem Pix do Mercado Pago oferece Gerar Pix', async () => {
    servico.status.mockResolvedValue(conectado);
    renderizar([{ ...pendente, paymentLinkUrl: 'https://mp.test/link' }]);
    expect(await screen.findByRole('button', { name: /gerar pix/i })).toBeInTheDocument();
  });

  it('WhatsApp: mensagem avisa do código, e o código Pix vai sozinho no segundo envio', async () => {
    servico.status.mockResolvedValue(conectado);
    const abrir = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderizar([{ ...pendente, studentPhone: '(11) 98765-4321', paymentLinkUrl: 'https://mp.test/link', pixCode: PIX_MP }]);
    await screen.findByText(/mercado pago conectado/i);
    expect(screen.queryByRole('button', { name: /gerar pix/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByTitle(/enviar cobrança/i));
    fireEvent.click(screen.getByRole('button', { name: /1\. enviar mensagem/i }));
    const mensagem = decodeURIComponent(String(abrir.mock.calls[0][0]).split('text=')[1]);
    expect(mensagem).toMatch(/vai na próxima mensagem/);
    expect(mensagem).not.toContain(PIX_MP);

    fireEvent.click(screen.getByRole('button', { name: /2\. enviar código pix/i }));
    const url = String(abrir.mock.calls[1][0]);
    expect(url.startsWith('https://wa.me/5511987654321?text=')).toBe(true);
    expect(decodeURIComponent(url.split('text=')[1])).toBe(PIX_MP);
    abrir.mockRestore();
  });

  it('conectado: cobrança nova já sai com o link do Mercado Pago', async () => {
    servico.status.mockResolvedValue(conectado);
    servico.gerarLink.mockResolvedValue({ link: 'https://mp.test/link', pixCode: null, avisoPix: null });
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
