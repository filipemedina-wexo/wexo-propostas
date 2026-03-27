import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Share2, Printer, Pencil, Building2, Calendar, Clock, CheckCircle2, Copy, ThumbsUp, X, FileText } from 'lucide-react';
import { Quote, ItemType, PaymentMethod } from '../types';
import { getQuote, updateQuoteStatus } from '../services/quoteService';
import { getAllPaymentMethods } from '../services/paymentService';
import { useAuth } from './AuthProvider';
import { formatCurrency } from './Formatters';
import PasswordGate from './PasswordGate';
import { format, parseISO } from 'date-fns';
import confetti from 'canvas-confetti';

// Legacy methods for backward compatibility
const LEGACY_METHODS: PaymentMethod[] = [
  { id: 'pix', name: 'PIX (5% de desconto)', discountPercent: 5 },
  { id: 'credit_card', name: 'Cartão de Crédito (Sem desconto)', discountPercent: 0 },
  { id: 'boleto', name: 'Boleto Bancário (Sem desconto)', discountPercent: 0 },
];

const ViewQuote: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isGateOpen, setIsGateOpen] = useState(false); // Renamed to avoid confusion
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const { user } = useAuth();
  const isAdmin = !!user;
  const [loading, setLoading] = useState(true);

  // Auto-open gate for logged in users
  useEffect(() => {
    if (user) {
      setIsGateOpen(true);
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      // Load methods
      const methods = await getAllPaymentMethods();
      setPaymentMethods(methods);

      if (id) {
        const foundQuote = await getQuote(id);
        setQuote(foundQuote);
        if (foundQuote) {
          document.title = `Proposta | ${foundQuote.clientName}`;
        }
        if (foundQuote?.selectedPaymentOptionId) {
          setSelectedOptionId(foundQuote.selectedPaymentOptionId);
        } else if (foundQuote?.paymentOptions?.length) {
          setSelectedOptionId(foundQuote.paymentOptions[0].id);
        }
      }
      setLoading(false);
    };
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Carregando seu orçamento. Aguarde...</p>
      </div>
    );
  }

  if (!quote) {
    return <div className="text-center py-20 text-slate-500">Orçamento não encontrado.</div>;
  }

  // Gate check
  if (!isGateOpen) {
    return <PasswordGate onSuccess={() => setIsGateOpen(true)} />;
  }

  // Calculations
  const oneTimeItems = quote.items.filter(i => i.type === ItemType.ONE_TIME);
  const recurringItems = quote.items.filter(i => i.type === ItemType.RECURRING);

  const subtotalOneTimeOriginal = oneTimeItems.reduce((acc, curr) => acc + curr.amount, 0);
  const subtotalRecurring = recurringItems.reduce((acc, curr) => acc + curr.amount, 0);

  const isContractMode = (quote.contractMonths && quote.contractMonths > 0) || recurringItems.some(i => i.durationMonths && i.durationMonths > 0);
  const displayMonths = quote.contractMonths || Math.max(...recurringItems.map(i => i.durationMonths || 1), 0);
  const subtotalRecurringContract = isContractMode 
    ? recurringItems.reduce((acc, curr) => acc + (curr.amount * (curr.durationMonths || quote.contractMonths || 1)), 0) 
    : 0;

  const subtotalOneTime = subtotalOneTimeOriginal + subtotalRecurringContract;

  // Find method in DB or Legacy
  const paymentMethod =
    paymentMethods.find(p => p.id === quote.paymentMethodId) ||
    LEGACY_METHODS.find(p => p.id === quote.paymentMethodId) ||
    { id: 'unknown', name: 'Método não identificado', discountPercent: 0 };

  const discountAmount = (subtotalOneTime * paymentMethod.discountPercent) / 100;
  const totalOneTime = subtotalOneTime - discountAmount;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  };


  const handleAcceptClick = () => {
    setShowModal(true);
  };

  const handleConfirmAccept = async () => {
    setIsAccepting(true);

    // Trigger Confetti
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#f59e0b', '#fbbf24']
    });

    if (quote) {
      const updated = await updateQuoteStatus(quote.id, 'APPROVED', selectedOptionId || undefined);
      if (updated) setQuote(updated);
    }

    setIsAccepting(false);
    setShowModal(false);
  };

  return (
    <>
      <div className="animate-fade-in pb-12">
        {/* Logo superior */}
        <div className="mb-8 pt-4 no-print flex justify-center md:justify-start">
          <img src="/logo.png" alt="Wexo Logo" className="w-40 md:w-48 h-auto object-contain" />
        </div>
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 no-print">
          <div className="w-full md:w-auto">
            <div className="flex items-center gap-3 mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${quote.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {quote.status === 'APPROVED' ? 'Aprovado' : 'Aguardando Aceite'}
              </span>
              <span className="text-slate-400 text-sm font-medium">#{quote.id}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Detalhes do Orçamento</h1>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {isAdmin && (
              <Link to="/" className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
                <Pencil size={16} />
                Voltar ao Painel
              </Link>
            )}
            <button
              onClick={handleShare}
              className="flex-1 md:flex-none justify-center bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 relative"
            >
              {copyFeedback ? <CheckCircle2 size={16} className="text-green-500" /> : <Share2 size={16} />}
              {copyFeedback ? 'Link Copiado!' : 'Compartilhar'}
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 md:flex-none justify-center bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Printer size={16} />
              Imprimir / PDF
            </button>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-white">

          {/* Blue Line Top */}
          <div className={`h-2 w-full ${quote.status === 'APPROVED' ? 'bg-green-500' : 'bg-gradient-to-r from-blue-400 to-brand-400'}`}></div>

          <div className="p-5 md:p-12">

            {/* Success Banner if Approved (Common) */}
            {quote.status === 'APPROVED' && (
              <div className="mb-8 bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-4 text-green-800 animate-fade-in">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0">
                  <ThumbsUp size={20} />
                </div>
                <div>
                  <p className="font-bold">Proposta Aprovada!</p>
                  <p className="text-sm opacity-80">Obrigado pela confiança. Nossa equipe entrará em contato em breve para iniciar o projeto.</p>
                </div>
              </div>
            )}

            {/* LAYOUT SWITCHER */}
            {quote.layoutType === 'SIMPLE' ? (
              /* ================= SIMPLE LAYOUT ================= */
              <div className="animate-fade-in">
                {/* Header Info */}
                <div className="flex flex-col md:flex-row justify-between mb-8 border-b border-slate-100 pb-8 gap-8">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cliente</p>
                    <h2 className="text-2xl font-bold text-slate-900">{quote.clientName}</h2>
                    <p className="text-slate-500 text-sm mt-1">{quote.clientEmail}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-right">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Data</p>
                      <p className="text-slate-700">{format(parseISO(quote.createdAt), 'dd/MM/yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Validade</p>
                      <p className="text-slate-700">{format(parseISO(quote.validUntil), 'dd/MM/yyyy')}</p>
                    </div>
                    <div className="col-span-2 mt-2">
                      <p className="text-xs font-bold text-slate-400 uppercase">Prazo de Produção</p>
                      <p className="text-slate-700 font-medium">{quote.productionDays} dias úteis</p>
                    </div>
                  </div>
                </div>



                {/* Items Table */}
                <div className="mb-10">
                  <h3 className="font-bold text-slate-800 mb-4 uppercase text-xs tracking-wider">Detalhamento Financeiro</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-slate-100">
                          <th className="py-3 text-slate-500 font-medium text-sm pl-4">Descrição</th>
                          <th className="py-3 text-slate-500 font-medium text-sm text-right pr-4">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quote.items.map(item => (
                          <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 pl-4 text-slate-700">
                              <span className="font-medium">{item.description}</span>
                              {item.type === ItemType.RECURRING && <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold">{item.durationMonths ? `MENSAL (${item.durationMonths} MESES)` : 'RECORRENTE'}</span>}
                            </td>
                            <td className="py-4 pr-4 text-slate-900 font-medium text-right">{formatCurrency(item.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50">
                          <td className="py-4 pl-4 text-slate-800 font-bold text-right pt-6">Total do Projeto</td>
                          <td className="py-4 pr-4 text-slate-900 font-bold text-2xl text-right pt-6">{formatCurrency(totalOneTime)}</td>
                        </tr>
                        {!isContractMode && subtotalRecurring > 0 && (
                          <tr className="bg-slate-50">
                            <td className="py-2 pl-4 text-slate-600 text-right text-sm">Mensalidade</td>
                            <td className="py-2 pr-4 text-slate-700 font-bold text-lg text-right">{formatCurrency(subtotalRecurring)}/mês</td>
                          </tr>
                        )}
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Investment & Payment Section (Unified) */}
                <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left: Investment Hero */}
                  <div className="bg-brand-500 rounded-2xl p-8 text-white relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Building2 size={120} />
                    </div>
                    <div>
                      <h3 className="text-brand-100 uppercase tracking-widest font-semibold text-sm mb-2">Investimento Total</h3>
                      <p className="text-5xl font-bold mb-2">
                        {(() => {
                          const selectedOption = quote.paymentOptions?.find(o => o.id === selectedOptionId);
                          const finalTotal = selectedOption
                            ? subtotalOneTime * (1 - selectedOption.discountPercent / 100)
                            : totalOneTime;
                          return formatCurrency(finalTotal);
                        })()}
                      </p>

                      {/* Installments & Recurring Info */}
                      <div className="flex flex-col gap-1 mb-4">
                        {(() => {
                          const selectedOption = quote.paymentOptions?.find(o => o.id === selectedOptionId);

                          // Show installments if applicable
                          if (selectedOption && selectedOption.installments > 1) {
                            const finalTotal = subtotalOneTime * (1 - selectedOption.discountPercent / 100);
                            const installmentValue = finalTotal / selectedOption.installments;

                            return (
                              <p className="text-white font-medium text-lg bg-white/20 w-fit px-3 py-1 rounded-lg backdrop-blur-sm">
                                {selectedOption.installments}x de {formatCurrency(installmentValue)}
                              </p>
                            );
                          }
                          return null;
                        })()}

                        {!isContractMode && subtotalRecurring > 0 && (
                          <p className="text-brand-100 font-medium flex items-center gap-2">
                            <span className="text-xl">+ {formatCurrency(subtotalRecurring)}</span>
                            <span className="text-sm opacity-80 uppercase tracking-wide">Mensal</span>
                          </p>
                        )}
                      </div>

                      <p className="text-brand-100 text-sm opacity-90 max-w-xs mb-4">
                        {isContractMode 
                          ? `Valor referente ao projeto completo, englobando serviços pontuais e ${displayMonths} meses de serviços mensais associados.`
                          : 'Valor referente ao planejamento, criação e execução criativa completa do projeto.'}
                      </p>

                      {(() => {
                        const selectedOption = quote.paymentOptions?.find(o => o.id === selectedOptionId);
                        if (!selectedOption) return null;
                        
                        let termsDescription = '';
                        if (selectedOption.installments === 1) {
                          termsDescription = 'Pagamento à vista na aprovação.';
                        } else if (selectedOption.hasDownPayment) {
                          if (selectedOption.installments === 2) {
                            termsDescription = '50% na aprovação + 50% em 30 dias.';
                          } else {
                            termsDescription = `1ª parcela na aprovação + ${selectedOption.installments - 1}x mensais.`;
                          }
                        } else {
                          termsDescription = '1ª parcela para 30 dias + demais mensais.';
                        }
                        
                        return (
                          <div className="bg-black/10 p-3 rounded-lg border border-white/10 mt-auto">
                            <p className="text-sm font-medium flex items-start gap-2">
                              <Clock size={16} className="text-brand-200 mt-0.5 shrink-0" />
                              <span>{termsDescription}</span>
                            </p>
                          </div>
                        );
                      })()}
                    </div>

                    {(() => {
                      const selectedOption = quote.paymentOptions?.find(o => o.id === selectedOptionId);
                      const currentDiscountPercent = selectedOption?.discountPercent || 0;
                      const currentDiscountAmount = currentDiscountPercent > 0
                        ? subtotalOneTime * (currentDiscountPercent / 100)
                        : 0;

                      if (currentDiscountAmount > 0) {
                        return (
                          <div className="mt-8 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                            <p className="text-sm font-medium mb-1">Desconto Aplicado ({currentDiscountPercent}%)</p>
                            <p className="text-2xl font-bold">-{formatCurrency(currentDiscountAmount)}</p>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Right: Payment Conditions List */}
                  <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
                    <h3 className="text-slate-900 font-bold text-lg mb-6 flex items-center gap-2">
                      <Clock size={20} className="text-brand-500" />
                      Condições de Pagamento
                    </h3>
                    <p className="text-xs text-slate-500 mb-4 -mt-4">Por favor, selecione a condição de pagamento.</p>

                    <div className="space-y-4">
                      {quote.paymentOptions && quote.paymentOptions.length > 0 ? (
                        quote.paymentOptions.map((option, index) => {
                          const method = paymentMethods.find(m => m.id === option.paymentMethodId) || LEGACY_METHODS.find(m => m.id === option.paymentMethodId);
                          const optionTotal = subtotalOneTime * (1 - option.discountPercent / 100);
                          const isSelected = selectedOptionId === option.id;
                          const isReadOnly = quote.status === 'APPROVED';

                          // Terms Description Logic
                          let termsDescription = '';
                          if (option.installments === 1) {
                            termsDescription = 'Pagamento à vista na aprovação.';
                          } else if (option.hasDownPayment) {
                            if (option.installments === 2) {
                              termsDescription = '50% na aprovação + 50% em 30 dias.';
                            } else {
                              termsDescription = `1ª parcela na aprovação + ${option.installments - 1}x mensais.`;
                            }
                          } else {
                            termsDescription = '1ª parcela para 30 dias + demais mensais.';
                          }

                          return (
                            <div
                              key={option.id}
                              onClick={() => !isReadOnly && setSelectedOptionId(option.id)}
                              className={`p-4 rounded-xl border transition-all cursor-pointer relative ${isSelected
                                ? 'bg-white border-brand-500 shadow-sm ring-1 ring-brand-500'
                                : 'bg-white border-slate-200 hover:border-brand-300'
                                } ${isReadOnly ? 'cursor-default' : ''}`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-slate-700">
                                  {option.installments === 1 ? 'À Vista / Pix' : `Parcelado ${option.installments}x`}
                                </span>
                                <span className="font-bold text-slate-900">{formatCurrency(optionTotal)}</span>
                              </div>
                              <div className="text-xs text-slate-500 flex flex-col gap-1 mt-2 pb-1">
                                {option.discountPercent > 0 && (
                                  <span className="text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded w-fit">
                                    {option.discountPercent}% de desconto aplicado
                                  </span>
                                )}
                                <span className="flex items-center gap-1.5 mt-1">
                                  <Clock size={12} className="text-brand-400" />
                                  {termsDescription}
                                </span>
                              </div>
                              {isSelected && <div className="absolute bottom-4 right-4 text-brand-500"><CheckCircle2 size={18} /></div>}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-slate-500 text-sm">Nenhuma condição de pagamento cadastrada.</p>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* ================= PREMIUM LAYOUT (Existing) ================= */
              <div className="animate-fade-in">
                {/* Header Info */}
                <div className="flex flex-col md:flex-row justify-between mb-12 gap-8">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Orçamento Para</p>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">{quote.clientName}</h2>
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <span className="w-4 h-4 flex items-center justify-center bg-slate-100 rounded text-[10px]">✉</span>
                      {quote.clientEmail || 'Email não informado'}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Data</p>
                      <p className="font-semibold text-slate-700">{format(parseISO(quote.createdAt), 'dd/MM/yyyy')}</p>
                      {quote.updatedAt && quote.updatedAt !== quote.createdAt && (
                        <p className="text-[10px] text-slate-400 mt-1">Atualizado: {format(parseISO(quote.updatedAt), 'dd/MM HH:mm')}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Validade</p>
                      <p className="font-semibold text-slate-700">{format(parseISO(quote.validUntil), 'dd/MM/yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Prazo</p>
                      <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                        <Clock size={14} className="text-brand-500" />
                        {quote.productionDays} dias úteis
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                      <p className={`font-semibold ${quote.status === 'APPROVED' ? 'text-green-600' : 'text-brand-600'}`}>
                        {quote.status === 'APPROVED' ? 'Aprovado' : 'Aguardando'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Service Description */}
                {quote.serviceDescription && (
                  <div className="mb-12">
                    <div className="flex items-center gap-2 mb-4 text-slate-900 font-bold text-lg">
                      <div className="w-8 h-8 rounded bg-brand-100 text-brand-600 flex items-center justify-center">
                        <FileText size={18} />
                      </div>
                      O que faremos
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {quote.serviceDescription}
                    </div>
                  </div>
                )}

                {/* Features Section */}
                {quote.content?.features && quote.content.features.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center gap-2 mb-6 text-slate-900 font-bold text-lg">
                      <div className="w-8 h-8 rounded bg-brand-100 text-brand-600 flex items-center justify-center">
                        <CheckCircle2 size={18} />
                      </div>
                      O que está incluso
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {quote.content.features.map((feature, index) => (
                        <div key={feature.id || index} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <h4 className="font-bold text-slate-800 mb-1 text-sm">{feature.title}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">{feature.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Items Section */}
                <div className="mb-12">
                  <div className="flex items-center gap-2 mb-6 text-slate-900 font-bold text-lg">
                    <div className="w-8 h-8 rounded bg-brand-100 text-brand-600 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                    </div>
                    Itens do Projeto
                  </div>

                  <div className={`grid grid-cols-1 md:grid-cols-${Math.min(oneTimeItems.length, 3)} gap-6`}>
                    {oneTimeItems.map(item => (
                      <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-brand-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <h3 className="font-bold text-slate-900 text-lg mb-2">{item.description}</h3>
                        <p className="text-slate-500 text-sm leading-relaxed mb-4">
                          Planejamento, criação e execução visual completa com foco em engajamento e resultados.
                        </p>
                        <p className="text-brand-600 font-bold text-xl">{formatCurrency(item.amount)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline Section */}
                {quote.content?.timeline && quote.content.timeline.length > 0 && (
                  <div className="mb-20">
                    <div className="flex items-center gap-2 mb-8 text-slate-900 font-bold text-lg">
                      <div className="w-8 h-8 rounded bg-brand-100 text-brand-600 flex items-center justify-center">
                        <Calendar size={18} />
                      </div>
                      Etapas, Entregas e Prazo
                    </div>

                    <div className="relative max-w-4xl mx-auto">
                      {/* Desktop Center Line */}
                      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 -translate-x-px"></div>
                      {/* Mobile Left Line */}
                      <div className="md:hidden absolute left-[19px] top-0 bottom-0 w-px bg-slate-200"></div>

                      <div className="space-y-8 md:space-y-12">
                        {quote.content.timeline.map((step, index) => {
                          const isEven = index % 2 === 0;
                          return (
                            <div key={step.id || index} className={`relative flex flex-col md:flex-row items-start md:items-center ${isEven ? '' : 'md:flex-row-reverse'}`}>

                              {/* Item Content */}
                              <div className={`pl-14 md:pl-0 md:w-[45%] relative ${isEven ? 'md:text-right md:pr-12' : 'md:text-left md:pl-12'}`}>
                                {/* Mobile Marker (Absolute) */}
                                <div className={`md:hidden absolute left-0 top-0 w-10 h-10 rounded-xl bg-white border-2 border-slate-200 flex items-center justify-center font-bold text-slate-600 shadow-sm z-10`}>
                                  {index + 1}
                                </div>

                                <div>
                                  <h4 className="font-bold text-slate-900 text-lg md:text-xl mb-1">{step.title}</h4>
                                  <p className="text-sm text-slate-500 leading-relaxed mb-2">{step.description}</p>
                                  {step.duration && (
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 text-xs font-bold border border-brand-100 ${isEven ? 'md:flex-row-reverse' : ''}`}>
                                      <Clock size={12} /> {step.duration}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Desktop Center Marker */}
                              <div className="hidden md:flex w-[10%] justify-center relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-white border-2 border-slate-200 flex items-center justify-center font-bold text-slate-600 text-lg shadow-sm">
                                  {index + 1}
                                </div>
                              </div>

                              {/* Empty Space for Balance */}
                              <div className="hidden md:block md:w-[45%]"></div>

                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Investment & Payment Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">

                  {/* Left: Investment Hero */}
                  {/* Left: Investment Hero */}
                  <div className="bg-brand-500 rounded-2xl p-8 text-white relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Building2 size={120} />
                    </div>
                    <div>
                      <h3 className="text-brand-100 uppercase tracking-widest font-semibold text-sm mb-2">Investimento Total</h3>
                      <p className="text-5xl font-bold mb-2">
                        {(() => {
                          const selectedOption = quote.paymentOptions?.find(o => o.id === selectedOptionId);
                          const finalTotal = selectedOption
                            ? subtotalOneTime * (1 - selectedOption.discountPercent / 100)
                            : totalOneTime;
                          return formatCurrency(finalTotal);
                        })()}
                      </p>

                      {/* Installments & Recurring Info */}
                      <div className="flex flex-col gap-1 mb-4">
                        {(() => {
                          const selectedOption = quote.paymentOptions?.find(o => o.id === selectedOptionId);

                          // Show installments if applicable
                          if (selectedOption && selectedOption.installments > 1) {
                            const finalTotal = subtotalOneTime * (1 - selectedOption.discountPercent / 100);
                            const installmentValue = finalTotal / selectedOption.installments;

                            return (
                              <p className="text-white font-medium text-lg bg-white/20 w-fit px-3 py-1 rounded-lg backdrop-blur-sm">
                                {selectedOption.installments}x de {formatCurrency(installmentValue)}
                              </p>
                            );
                          }
                          return null;
                        })()}

                        {!isContractMode && subtotalRecurring > 0 && (
                          <p className="text-brand-100 font-medium flex items-center gap-2">
                            <span className="text-xl">+ {formatCurrency(subtotalRecurring)}</span>
                            <span className="text-sm opacity-80 uppercase tracking-wide">Mensal</span>
                          </p>
                        )}
                      </div>

                      <p className="text-brand-100 text-sm opacity-90 max-w-xs mb-4">
                        {isContractMode 
                          ? `Valor referente ao projeto completo, englobando serviços pontuais e ${displayMonths} meses de serviços mensais associados.`
                          : 'Valor referente ao planejamento, criação e execução criativa completa do projeto.'}
                      </p>

                      {(() => {
                        const selectedOption = quote.paymentOptions?.find(o => o.id === selectedOptionId);
                        if (!selectedOption) return null;
                        
                        let termsDescription = '';
                        if (selectedOption.installments === 1) {
                          termsDescription = 'Pagamento à vista na aprovação.';
                        } else if (selectedOption.hasDownPayment) {
                          if (selectedOption.installments === 2) {
                            termsDescription = '50% na aprovação + 50% em 30 dias.';
                          } else {
                            termsDescription = `1ª parcela na aprovação + ${selectedOption.installments - 1}x mensais.`;
                          }
                        } else {
                          termsDescription = '1ª parcela para 30 dias + demais mensais.';
                        }
                        
                        return (
                          <div className="bg-black/10 p-3 rounded-lg border border-white/10 mt-auto">
                            <p className="text-sm font-medium flex items-start gap-2">
                              <Clock size={16} className="text-brand-200 mt-0.5 shrink-0" />
                              <span>{termsDescription}</span>
                            </p>
                          </div>
                        );
                      })()}
                    </div>

                    {(() => {
                      const selectedOption = quote.paymentOptions?.find(o => o.id === selectedOptionId);
                      const currentDiscountPercent = selectedOption?.discountPercent || 0;
                      const currentDiscountAmount = currentDiscountPercent > 0
                        ? subtotalOneTime * (currentDiscountPercent / 100)
                        : 0;

                      if (currentDiscountAmount > 0) {
                        return (
                          <div className="mt-8 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                            <p className="text-sm font-medium mb-1">Desconto Aplicado ({currentDiscountPercent}%)</p>
                            <p className="text-2xl font-bold">-{formatCurrency(currentDiscountAmount)}</p>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Right: Payment Conditions List */}
                  <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
                    <h3 className="text-slate-900 font-bold text-lg mb-6 flex items-center gap-2">
                      <Clock size={20} className="text-brand-500" />
                      Condições de Pagamento
                    </h3>
                    <p className="text-xs text-slate-500 mb-4 -mt-4">Por favor, selecione a condição de pagamento.</p>

                    <div className="space-y-4">
                      {quote.paymentOptions && quote.paymentOptions.length > 0 ? (
                        quote.paymentOptions.map((option, index) => {
                          const method = paymentMethods.find(m => m.id === option.paymentMethodId) || LEGACY_METHODS.find(m => m.id === option.paymentMethodId);
                          const optionTotal = subtotalOneTime * (1 - option.discountPercent / 100);
                          const isSelected = selectedOptionId === option.id;
                          const isReadOnly = quote.status === 'APPROVED';

                          // Terms Description Logic
                          let termsDescription = '';
                          if (option.installments === 1) {
                            termsDescription = 'Pagamento à vista na aprovação.';
                          } else if (option.hasDownPayment) {
                            if (option.installments === 2) {
                              termsDescription = '50% na aprovação + 50% em 30 dias.';
                            } else {
                              termsDescription = `1ª parcela na aprovação + ${option.installments - 1}x mensais.`;
                            }
                          } else {
                            termsDescription = '1ª parcela para 30 dias + demais mensais.';
                          }

                          return (
                            <div
                              key={option.id}
                              onClick={() => !isReadOnly && setSelectedOptionId(option.id)}
                              className={`p-4 rounded-xl border transition-all cursor-pointer relative ${isSelected
                                ? 'bg-white border-brand-500 shadow-sm ring-1 ring-brand-500'
                                : 'bg-white border-slate-200 hover:border-brand-300'
                                } ${isReadOnly ? 'cursor-default' : ''}`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-slate-700">
                                  {option.installments === 1 ? 'À Vista / Pix' : `Parcelado ${option.installments}x`}
                                </span>
                                <span className="font-bold text-slate-900">{formatCurrency(optionTotal)}</span>
                              </div>
                              <div className="text-xs text-slate-500 flex flex-col gap-1 mt-2 pb-1">
                                {option.discountPercent > 0 && (
                                  <span className="text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded w-fit">
                                    {option.discountPercent}% de desconto aplicado
                                  </span>
                                )}
                                <span className="flex items-center gap-1.5 mt-1">
                                  <Clock size={12} className="text-brand-400" />
                                  {termsDescription}
                                </span>
                              </div>
                              {isSelected && <div className="absolute bottom-4 right-4 text-brand-500"><CheckCircle2 size={18} /></div>}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-slate-500 text-sm">Nenhuma condição de pagamento cadastrada.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recurring / Maintenance Section */}
                {recurringItems.length > 0 && (
                  <div className="mb-12 pt-12 border-t border-slate-100">
                    <h3 className="text-2xl font-bold text-slate-900 mb-6">Manutenção & Recorrência</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {recurringItems.map(item => (
                        <div key={item.id} className="border border-slate-200 rounded-xl p-6 flex justify-between items-center hover:border-brand-300 transition-colors bg-white">
                          <div>
                            <h4 className="font-bold text-slate-800">{item.description}</h4>
                            <p className="text-xs text-slate-500 mt-1">Cobrança e execução conforme detalhamento de cada serviço aprovado.</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-slate-900">{formatCurrency(item.amount)}</p>
                            <span className="text-[10px] text-slate-400 uppercase">{item.durationMonths ? `${item.durationMonths} Meses` : 'Mensal'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Button (Common) */}
            {quote.status !== 'APPROVED' && (
              <div className="flex justify-end pt-8 border-t border-slate-100">
                <button
                  onClick={handleAcceptClick}
                  disabled={isAccepting}
                  className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-12 rounded-xl shadow-lg shadow-green-600/20 transition-all transform hover:scale-[1.02] flex justify-center items-center gap-2 no-print text-lg"
                >
                  <ThumbsUp size={22} /> Aprovar Proposta
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Verify Footer */}
        <div className="text-center mt-8 text-slate-400 text-sm flex items-center justify-center gap-2 print-break">
          <CheckCircle2 size={16} className="text-slate-300" />
          Documento gerado digitalmente pela plataforma Wexo.
        </div>

      </div >

      {/* Confirmation Modal */}
      {
        showModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100 relative">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Confirmar Aprovação</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="mb-8 text-center py-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <p className="text-lg font-medium text-slate-700">Você deseja confirmar esse trabalho?</p>

                {selectedOptionId && quote.paymentOptions && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 inline-block">
                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Forma de Pagamento Selecionada</p>
                    <p className="font-bold text-brand-600 text-lg">
                      {(() => {
                        const opt = quote.paymentOptions?.find(o => o.id === selectedOptionId);
                        if (!opt) return 'Não selecionada';

                        const totalValue = subtotalOneTime * (1 - opt.discountPercent / 100);

                        // Logic for display
                        if (opt.installments === 1) {
                          return (
                            <span className="flex flex-col">
                              <span>À Vista - {formatCurrency(totalValue)}</span>
                              {opt.discountPercent > 0 && <span className="text-xs text-green-600 font-normal">({opt.discountPercent}% de desconto incluso)</span>}
                            </span>
                          );
                        } else {
                          // Installments
                          const installmentValue = totalValue / opt.installments;
                          let details = '';

                          if (opt.hasDownPayment) {
                            // If there is down payment, usually it's "Entry + Installments"
                            // The logic in paymentService/ViewQuote listing suggests:
                            // "1ª parcela na aprovação + X mensais" OR "50% + 50%"
                            if (opt.installments === 2 && opt.hasDownPayment) {
                              // Simplified logic assuming equal parts for now or based on existing logic
                              return (
                                <span className="flex flex-col">
                                  <span>Parcelado em {opt.installments}x de {formatCurrency(installmentValue)}</span>
                                  <span className="text-xs text-slate-500 font-normal">1ª parcela (entrada) de {formatCurrency(installmentValue)} + 1 parcela para 30 dias</span>
                                </span>
                              );
                            }

                            return (
                              <span className="flex flex-col">
                                <span>Parcelado em {opt.installments}x de {formatCurrency(installmentValue)}</span>
                                <span className="text-xs text-slate-500 font-normal">Sendo a 1ª parcela (entrada) + {opt.installments - 1} mensais</span>
                              </span>
                            );
                          }

                          return (
                            <span className="flex flex-col">
                              <span>Parcelado em {opt.installments}x de {formatCurrency(installmentValue)}</span>
                              <span className="text-xs text-slate-500 font-normal">Sem entrada (1ª para 30 dias)</span>
                            </span>
                          );
                        }
                      })()}
                    </p>
                  </div>
                )}

                <p className="text-sm text-slate-500 mt-4">Ao confirmar, a equipe da Wexo será notificada para iniciar o projeto.</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmAccept}
                  disabled={isAccepting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-600/20 transition-all flex justify-center items-center gap-2"
                >
                  {isAccepting ? 'Confirmando...' : 'Confirmar Aprovação'}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </>
  );
};

export default ViewQuote;
