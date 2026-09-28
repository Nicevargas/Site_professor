import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentsView } from './PaymentsView';
import { PaymentInvoice, ServiceItem, TeacherProfile } from '../types';
import { STATUS_DESCONECTADO } from '../services/mercadoPagoService';
import { ASAAS_DESCONECTADO, StatusAsaas, documentoValido, PrecisaCpf } from '../services/asaasService';

const mp = vi.hoisted(() => ({
  status: vi.fn(),
  enderecoParaConectar: vi.fn(),
  desconectar: vi.fn(),
  gerarLink: vi.fn(),
}));
const asaas = vi.hoisted(() => ({
  status: vi.fn(),
  conectar: vi.fn(),
  desconectar: vi.fn(),
  gerarLink: vi.fn(),
}));

vi.mock('../services/mercadoPagoService', async (original) => ({
  ...(await original<typeof import('../services/mercadoPagoService')>()),
  mercadoPagoService: mp,
  lerRetornoDoMercadoPago: () => null,
}));
vi.mock('../services/asaasService', async (original) => ({
  ...(await original<typeof import('../services/asaasService')>()),
  asaasService: asaas,
}));

const teacher: TeacherProfile = {
  id: 'prof-ana', name: 'Ana', role: 'Professora', specialty: '', bio: '', rating: 5, reviewCount: 1,
  yearsExperience: 1, avatarUrl: '', heroImageUrl: '', whatsapp: '', email: 'ana@teste.com',
};
const services: ServiceItem[] = [
  { id: 's1', name: 'Aula', description: '', price: 100, durationMinutes: 60, active: true, modality: 'Presencial', iconName: 'pool' },
];
const pendente: PaymentInvoice = {
  id: 'inv-1', studentId: 'std-1', studentName: 'Bia', serviceOrPlanName: 'Aula', amount: 100,
  dueDate: '2026-10-01', status: 'pendente', method: 'pix', createdAt: '2026-09-28',
};
const asaasConectado: StatusAsaas = {
  conectado: true, nome: 'Ana Natação', email: 'ana@asaas.com', ambiente: 'producao', avisoConfigurado: true, conectadoEm: '2026-09-28',
};
const PIX_ASAAS = '00020101021226820014br.gov.bcb.pix2560pix.asaas.com/qr/cobv/abc5204000053039865802BR6304ABCD';

function renderizar(lista: PaymentInvoice[] = [pendente], professor: TeacherProfile = teacher) {
  const onUpdateInvoices = vi.fn();
  const onUpdateTeacher = vi.fn();
  render(
    <PaymentsView
      invoices={lista}
      students={[]}
      services={services}
      currentTeacher={professor}
      onUpdateInvoices={onUpdateInvoices}
      onUpdateTeacher={onUpdateTeacher}
    />
  );
  return { onUpdateInvoices, onUpdateTeacher };
}

describe('financeiro com Asaas', () => {
  beforeEach(() => {
    [...Object.values(mp), ...Object.values(asaas)].forEach((f) => f.mockReset());
    mp.status.mockResolvedValue(STATUS_DESCONECTADO);
  });
  afterEach(() => vi.restoreAllMocks());

  it('professor cola a chave, o app confere o formato e conecta', async () => {
    asaas.status.mockResolvedValue(ASAAS_DESCONECTADO);
    asaas.conectar.mockResolvedValue(asaasConectado);
    renderizar();

    fireEvent.click(await screen.findByRole('button', { name: /conectar asaas/i }));
    const campo = screen.getByPlaceholderText('$aact_...');
    const conectar = screen.getByRole('button', { name: /^conectar$/i });

    fireEvent.change(campo, { target: { value: 'chave-errada' } });
    expect(conectar).toBeDisabled();
    expect(screen.getByText(/não parece uma chave do asaas/i)).toBeInTheDocument();

    fireEvent.change(campo, { target: { value: '  $aact_prod_abc123  ' } });
    fireEvent.click(conectar);
    await waitFor(() => expect(asaas.conectar).toHaveBeenCalledWith('prof-ana', '  $aact_prod_abc123  '));
    expect(await screen.findByRole('heading', { name: /asaas conectado/i })).toBeInTheDocument();
    expect(screen.getByText('Ana Natação')).toBeInTheDocument();
  });

  it('primeira cobrança do aluno: pede o CPF, recusa CPF inválido e tenta de novo com o válido', async () => {
    asaas.status.mockResolvedValue(asaasConectado);
    asaas.gerarLink
      .mockRejectedValueOnce(new PrecisaCpf())
      .mockRejectedValueOnce(new PrecisaCpf())
      .mockResolvedValueOnce({ link: 'https://www.asaas.com/i/123', pixCode: PIX_ASAAS, avisoPix: null });
    const perguntar = vi.spyOn(window, 'prompt');
    const { onUpdateInvoices } = renderizar();

    // CPF inválido: não chama o Asaas de novo
    perguntar.mockReturnValueOnce('111.111.111-11');
    fireEvent.click(await screen.findByRole('button', { name: /gerar link/i }));
    expect(await screen.findByText(/esse cpf não é válido/i)).toBeInTheDocument();
    expect(asaas.gerarLink).toHaveBeenCalledTimes(1);

    // CPF válido: segunda tentativa leva o CPF
    perguntar.mockReturnValueOnce('529.982.247-25');
    fireEvent.click(screen.getByRole('button', { name: /gerar link/i }));
    await waitFor(() => expect(onUpdateInvoices).toHaveBeenCalled());
    expect(asaas.gerarLink).toHaveBeenLastCalledWith('prof-ana', pendente, '529.982.247-25');
    const lista: PaymentInvoice[] = onUpdateInvoices.mock.calls[0][0];
    expect(lista[0]).toMatchObject({ paymentLinkUrl: 'https://www.asaas.com/i/123', pixCode: PIX_ASAAS });
    expect(mp.gerarLink).not.toHaveBeenCalled();
  });

  it('Pix do Asaas conta como baixa automática: o copiar da linha entrega o código', async () => {
    asaas.status.mockResolvedValue(asaasConectado);
    renderizar([{ ...pendente, paymentLinkUrl: 'https://www.asaas.com/i/123', pixCode: PIX_ASAAS }]);
    await screen.findByRole('heading', { name: /asaas conectado/i });
    expect(screen.queryByRole('button', { name: /gerar pix/i })).not.toBeInTheDocument();
    expect(screen.getByTitle('Copiar código Pix')).toBeInTheDocument();
  });

  it('com os dois conectados, vale a escolha do professor e dá para trocar', async () => {
    mp.status.mockResolvedValue({ configurado: true, conectado: true, apelido: 'Ana', email: null, conectadoEm: null });
    asaas.status.mockResolvedValue(asaasConectado);
    mp.gerarLink.mockResolvedValue({ link: 'https://mp.test', pixCode: null, avisoPix: null });
    const { onUpdateTeacher } = renderizar([pendente], { ...teacher, defaultPaymentGateway: 'pix' });

    const radioMp = await screen.findByRole('radio', { name: 'Mercado Pago' });
    expect(radioMp).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: /gerar link/i }));
    await waitFor(() => expect(mp.gerarLink).toHaveBeenCalled());
    expect(asaas.gerarLink).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('radio', { name: 'Asaas' }));
    expect(onUpdateTeacher).toHaveBeenCalledWith(expect.objectContaining({ defaultPaymentGateway: 'asaas' }));
  });
});

describe('CPF/CNPJ', () => {
  it('confere os dígitos verificadores', () => {
    expect(documentoValido('529.982.247-25')).toBe(true);
    expect(documentoValido('529.982.247-24')).toBe(false);
    expect(documentoValido('111.111.111-11')).toBe(false);
    expect(documentoValido('11.222.333/0001-81')).toBe(true);
    expect(documentoValido('11.222.333/0001-80')).toBe(false);
    expect(documentoValido('123')).toBe(false);
  });
});
