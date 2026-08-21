import React, { useState } from 'react';
import { PRICING_PLANS, FAQ_ITEMS } from '../data/mockData';
import { 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  HelpCircle,
  CreditCard,
  X
} from 'lucide-react';

export const PricingPlansView: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');
  const [selectedPlanModal, setSelectedPlanModal] = useState<any | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const handleSubscribe = (plan: any) => {
    setSelectedPlanModal(plan);
    setIsSubscribed(false);
  };

  return (
    <main className="flex-1 p-4 md:p-10 bg-[#f7f9fb] pb-32 overflow-y-auto font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold text-[#00687a] uppercase tracking-wider">
            Investimento com Retorno Imediato
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#091426] tracking-tight mt-2">
            Planos & Assinatura
          </h1>
          <p className="text-sm md:text-base text-[#45474c] mt-2">
            Escolha o plano ideal para gerenciar sua agenda, atrair novos alunos e profissionalizar sua carreira.
          </p>

          {/* Billing Cycle Switcher */}
          <div className="mt-8 inline-flex items-center bg-[#eceef0] p-1 rounded-full border border-[#c5c6cd]">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                !isAnnual ? 'bg-white text-[#091426] shadow-xs' : 'text-[#45474c] hover:text-[#091426]'
              }`}
            >
              Faturamento Mensal
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                isAnnual ? 'bg-[#00687a] text-white shadow-xs' : 'text-[#45474c] hover:text-[#091426]'
              }`}
            >
              <span>Anual</span>
              <span className="bg-[#acedff] text-[#001f26] text-[10px] px-2 py-0.5 rounded-full font-extrabold">
                -20% OFF
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Bento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {PRICING_PLANS.map((plan) => {
            const calculatedPrice = isAnnual 
              ? Math.round(plan.priceMonth * 0.8) 
              : plan.priceMonth;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-8 transition-all relative flex flex-col justify-between ${
                  plan.isPopular
                    ? 'bg-white border-2 border-[#00687a] shadow-elevated md:-translate-y-2'
                    : 'bg-white border border-[#eceef0] shadow-ambient hover:border-slate-300'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00687a] text-white text-[11px] font-bold uppercase tracking-wider px-4 py-1 rounded-full shadow-xs">
                    Mais Popular
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-[#091426] mb-1">{plan.name}</h3>
                  <p className="text-xs text-[#45474c] mb-6">{plan.description}</p>

                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-extrabold text-[#091426]">
                      R$ {calculatedPrice}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/ mês</span>
                  </div>

                  {plan.featuresHeader && (
                    <p className="text-[11px] font-bold text-[#75777d] uppercase tracking-wider mb-4">
                      {plan.featuresHeader}
                    </p>
                  )}

                  <ul className="space-y-3.5 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-xs md:text-sm text-[#191c1e]">
                        <div className="w-5 h-5 rounded-full bg-[#acedff]/30 text-[#00687a] flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleSubscribe(plan)}
                  className={`w-full py-3.5 px-6 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
                    plan.isPopular
                      ? 'bg-[#00687a] hover:bg-[#004e5c] text-white shadow-ambient hover:shadow-elevated'
                      : 'bg-[#eceef0] hover:bg-[#e0e3e5] text-[#091426]'
                  }`}
                >
                  <span>{plan.ctaText}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto pt-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#091426] flex items-center justify-center gap-2">
              <HelpCircle className="w-6 h-6 text-[#00687a]" />
              <span>Perguntas Frequentes</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">Tire suas dúvidas sobre assinaturas e recursos.</p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-[#eceef0] overflow-hidden transition-all shadow-xs"
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full p-5 text-left font-semibold text-sm text-[#091426] flex justify-between items-center hover:bg-slate-50/80 transition-colors"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#00687a] shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs md:text-sm text-[#45474c] leading-relaxed border-t border-slate-100 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal: Simulated Checkout */}
        {selectedPlanModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-slate-200 relative">
              <button
                onClick={() => setSelectedPlanModal(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>

              {isSubscribed ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-[#091426] mb-2">Plano Ativado com Sucesso!</h3>
                  <p className="text-xs text-[#45474c] mb-6">
                    Você agora tem acesso a todos os recursos do plano <b>{selectedPlanModal.name}</b>.
                  </p>
                  <button
                    onClick={() => setSelectedPlanModal(null)}
                    className="w-full py-3 bg-[#091426] text-white rounded-xl text-xs font-semibold"
                  >
                    Concluir
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#acedff]/30 text-[#00687a] flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#091426]">Assinar Plano {selectedPlanModal.name}</h3>
                      <p className="text-xs text-slate-500">R$ {selectedPlanModal.priceMonth}/mês sem fidelidade</p>
                    </div>
                  </div>

                  <div className="bg-[#f7f9fb] p-4 rounded-xl border border-slate-200 mb-6 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Subtotal:</span>
                      <span className="font-semibold">R$ {selectedPlanModal.priceMonth},00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Taxa de Configuração:</span>
                      <span className="font-semibold text-emerald-600">R$ 0,00 (Grátis)</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-[#091426]">
                      <span>Total Mensal:</span>
                      <span className="text-sm text-[#00687a]">R$ {selectedPlanModal.priceMonth},00/mês</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nome no Cartão</label>
                      <input
                        type="text"
                        defaultValue="Prof. Roberto Almeida"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Número do Cartão</label>
                      <input
                        type="text"
                        defaultValue="•••• •••• •••• 4242"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setIsSubscribed(true)}
                    className="w-full py-3.5 bg-[#00687a] hover:bg-[#004e5c] text-white rounded-xl font-bold text-xs shadow-ambient transition-all"
                  >
                    Confirmar Assinatura
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
