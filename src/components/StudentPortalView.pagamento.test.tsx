import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StudentPortalView } from './StudentPortalView';
import { AuthUser, PaymentInvoice, TeacherProfile } from '../types';

const base = {
  role: 'Professor', specialty: '', bio: '', rating: 5, reviewCount: 1, yearsExperience: 1,
  avatarUrl: '', heroImageUrl: '', whatsapp: '', email: '',
};
const ana: TeacherProfile = { ...base, id: 'prof-ana', name: 'Ana', pixKey: 'ana@pix.com', pixKeyType: 'email' };
const bruno: TeacherProfile = { ...base, id: 'prof-bruno', name: 'Bruno', pixKey: 'bruno@pix.com', pixKeyType: 'email' };
const semPix: TeacherProfile = { ...base, id: 'prof-sem', name: 'Sem Pix' };

const aluno: AuthUser = { id: 'u1', email: 'aluno@teste.com', name: 'Aluno', role: 'aluno', studentId: 'std-1' };

const cobranca = (id: string, teacherId: string, extra: Partial<PaymentInvoice> = {}): PaymentInvoice => ({
  id, teacherId, studentId: 'std-1', studentName: 'Aluno', serviceOrPlanName: `Aula ${id}`,
  amount: 120, dueDate: '2026-10-01', status: 'pendente', method: 'pix', createdAt: '2026-09-28', ...extra,
});

function renderizar(invoices: PaymentInvoice[]) {
  render(
    <StudentPortalView
      currentUser={aluno}
      currentTeacher={ana}
      teachers={[ana, bruno, semPix]}
      appointments={[]}
      invoices={invoices}
      videos={[]}
      onOpenBookingWizard={vi.fn()}
      onOpenWhatsApp={vi.fn()}
    />
  );
}

describe('portal do aluno: pagar a cobrança', () => {
  it('o Pix é do professor da cobrança, não do professor da tela', () => {
    renderizar([cobranca('b1', 'prof-bruno')]);
    fireEvent.click(screen.getByRole('button', { name: /pagar com pix/i }));
    const codigo = screen.getByText(/br\.gov\.bcb\.pix/);
    expect(codigo.textContent).toContain('bruno@pix.com');
    expect(codigo.textContent).not.toContain('ana@pix.com');
    expect(screen.getByText(/beneficiário: bruno/i)).toBeInTheDocument();
  });

  it('professor sem chave Pix: nada de código inventado, orienta a falar com ele', () => {
    renderizar([cobranca('s1', 'prof-sem')]);
    fireEvent.click(screen.getByRole('button', { name: /pagar com pix/i }));
    expect(screen.queryByText(/br\.gov\.bcb\.pix/)).not.toBeInTheDocument();
    expect(screen.getByText(/ainda não cadastrou a chave pix/i)).toBeInTheDocument();
  });

  it('cobrança com link do Mercado Pago ganha o botão de pagar online', () => {
    renderizar([cobranca('m1', 'prof-ana', { paymentLinkUrl: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=1' })]);
    const link = screen.getByRole('link', { name: /pagar pelo mercado pago/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('mercadopago.com.br'));
    expect(link).toHaveAttribute('target', '_blank');
  });
});
