import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Calendar, Save, Trash2, Download } from 'lucide-react';
import { formatCurrency } from './Formatters';
import { ItemType, QuoteItem, Quote, Service, PaymentMethod, PaymentOption, LayoutType, QuoteContent } from '../types';
import { generateShortId, saveQuote, getQuote } from '../services/quoteService';
import { getAllServices } from '../services/servicesService';
import { getAllPaymentMethods } from '../services/paymentService';
import { useAuth } from './AuthProvider';

const CreateQuote: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Edit Mode
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Client State
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [productionDays, setProductionDays] = useState<number>(15);
  const [contractMonths, setContractMonths] = useState<number>(6);
  const [validUntil, setValidUntil] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [layoutType, setLayoutType] = useState<LayoutType>('PREMIUM');
  const [content, setContent] = useState<QuoteContent>({
    briefing: { title: 'Proposta & Briefing Inicial', text: '' },
    timeline: [
      { id: '1', step: 1, title: 'Briefing', description: 'Envio e análise das informações iniciais', duration: '2 dias' },
      { id: '2', step: 2, title: 'Primeira Prévia', description: 'Apresentação do conceito visual', duration: '5 dias' },
      { id: '3', step: 3, title: 'Refinamento', description: 'Ajustes baseados no feedback', duration: '3 dias' },
      { id: '4', step: 4, title: 'Entrega Final', description: 'Publicação e entrega dos acessos', duration: '1 dia' },
    ],
    features: [
      { id: '1', title: 'Criatividade Premium', description: 'Identidade visual única e focada em resultados.' },
      { id: '2', title: 'Estratégia Focada', description: 'Planejamento alinhado aos objetivos do seu negócio.' },
      { id: '3', title: 'Conteúdo Viral', description: 'Foco em altos níveis de engajamento e conversão visual.' },
    ]
  });

  // Date tracking for editing
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  // Items State
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemType, setNewItemType] = useState<ItemType>(ItemType.ONE_TIME);
  const [newItemDuration, setNewItemDuration] = useState<number>(6);

  // Payment State
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([]);

  // Initial Load (Edit Mode & Resources)
  React.useEffect(() => {
    const init = async () => {
      setLoading(true);

      // Load Payment Methods first
      const methods = await getAllPaymentMethods();
      setPaymentMethods(methods);

      // Load Available Services
      const services = await getAllServices();
      setAvailableServices(services);
      // If editing, load quote
      if (id) {
        const quote = await getQuote(id);
        if (quote) {
          setClientName(quote.clientName);
          setClientEmail(quote.clientEmail || '');
          setServiceDescription(quote.serviceDescription || '');
          setLayoutType(quote.layoutType || 'PREMIUM');
          if (quote.content) {
            // Merge default values with loaded content to ensure structure exists
            setContent(prev => ({ ...prev, ...quote.content }));
          }
          setProductionDays(quote.productionDays);
          setContractMonths(quote.contractMonths || 6);
          setValidUntil(quote.validUntil.split('T')[0]);
          setItems(quote.items);
          if (quote.paymentOptions && quote.paymentOptions.length > 0) {
            setPaymentOptions(quote.paymentOptions);
          } else if (quote.paymentMethodId) {
            // Migration
            const method = methods.find(m => m.id === quote.paymentMethodId);
            setPaymentOptions([{
              id: Math.random().toString(36).substr(2, 9),
              paymentMethodId: quote.paymentMethodId,
              installments: quote.installments || 1,
              hasDownPayment: quote.hasDownPayment || false,
              discountPercent: method?.discountPercent || 0
            }]);
          }
          setCreatedAt(quote.createdAt);
        }
      } else if (methods.length > 0) {
        setPaymentOptions([{
          id: Math.random().toString(36).substr(2, 9),
          paymentMethodId: methods[0].id,
          installments: 1,
          hasDownPayment: false,
          discountPercent: methods[0].discountPercent
        }]);
      }
      setLoading(false);
    };

    init();
  }, [id]);

  // Load Services for Modal
  React.useEffect(() => {
    if (showServiceModal) {
      getAllServices().then(setAvailableServices);
    }
  }, [showServiceModal]);

  // Computed
  const subtotalOneTime = items
    .filter(i => i.type === ItemType.ONE_TIME)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const subtotalRecurringContract = items
    .filter(i => i.type === ItemType.RECURRING)
    .reduce((acc, curr) => acc + (curr.amount * (curr.durationMonths || contractMonths || 1)), 0);

  const totalProjectValue = subtotalOneTime + subtotalRecurringContract;

  const selectedPayment = paymentMethods.find(p => p.id === (paymentOptions[0]?.paymentMethodId || ''));
  const discountAmount = selectedPayment ? (totalProjectValue * (paymentOptions[0]?.discountPercent ?? selectedPayment.discountPercent)) / 100 : 0;
  const totalWithDiscount = totalProjectValue - discountAmount;

  const addItem = () => {
    if (!newItemDesc || !newItemAmount) return;
    const amount = parseFloat(newItemAmount.replace(',', '.')); // Simple handling for comma
    if (isNaN(amount)) return;

    const newItem: QuoteItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: newItemDesc,
      amount: amount,
      type: newItemType,
      ...(newItemType === ItemType.RECURRING ? { durationMonths: newItemDuration } : {})
    };

    setItems([...items, newItem]);
    setNewItemDesc('');
    setNewItemAmount('');
    setNewItemDuration(contractMonths || 6);
  };

  const addServiceItem = (service: Service) => {
    const newItem: QuoteItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: service.description,
      amount: service.amount,
      type: service.type
    };
    setItems([...items, newItem]);
    setShowServiceModal(false);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleSave = (isDraft: boolean = false) => {
    if (!clientName) {
      alert('Por favor, insira o nome do cliente.');
      return;
    }
    if (items.length === 0) {
      alert('Adicione pelo menos um item ao orçamento.');
      return;
    }
    if (paymentOptions.length === 0) {
      alert('Adicione pelo menos uma forma de pagamento.');
      return;
    }

    const newQuote: Quote = {
      id: id || generateShortId(), // Keep existing ID if editing
      clientName,
      clientEmail,
      serviceDescription,
      layoutType,
      content,
      createdAt: createdAt || new Date().toISOString(), // Keep original creation date
      validUntil,
      productionDays,
      contractMonths,
      items,
      paymentMethodId: paymentOptions[0]?.paymentMethodId || '', // Legacy support
      installments: paymentOptions[0]?.installments || 1, // Legacy support
      hasDownPayment: paymentOptions[0]?.hasDownPayment || false, // Legacy support
      paymentOptions,
      status: isDraft ? 'DRAFT' : 'SENT', // Use DRAFT if requested
      userEmail: user?.email
    };

    saveQuote(newQuote).then(() => {
      if (isDraft) {
        navigate('/'); // Go to Dashboard on Draft
      } else {
        navigate(`/share/${newQuote.id}`); // Go to Share on Final
      }
    }).catch(err => {
      alert('Erro ao salvar proposta. Tente novamente.');
      console.error(err);
    });
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Carregando dados da proposta...</div>;

  return (
    <div className="animate-fade-in relative">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{id ? 'Editar Orçamento' : 'Novo Orçamento'}</h1>
        <p className="text-slate-500 mt-1">Crie propostas profissionais para seus clientes em minutos.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Inputs */}
        <div className="flex-1 space-y-6">

          {/* Layout Selection */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold">
              <span className="text-brand-500">🎨</span>
              <h2>Layout da Proposta</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setLayoutType('SIMPLE')}
                className={`p-4 rounded-xl border-2 transition-all text-left flex items-start gap-3 ${layoutType === 'SIMPLE' ? 'border-brand-500 bg-brand-50/50' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${layoutType === 'SIMPLE' ? 'border-brand-500' : 'border-slate-300'}`}>
                  {layoutType === 'SIMPLE' && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                </div>
                <div>
                  <h3 className={`font-bold ${layoutType === 'SIMPLE' ? 'text-brand-700' : 'text-slate-700'}`}>Simples</h3>
                  <p className="text-xs text-slate-500 mt-1">Layout clássico em tabela. Ideal para orçamentos rápidos e diretos.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLayoutType('PREMIUM')}
                className={`p-4 rounded-xl border-2 transition-all text-left flex items-start gap-3 ${layoutType === 'PREMIUM' ? 'border-brand-500 bg-brand-50/50' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${layoutType === 'PREMIUM' ? 'border-brand-500' : 'border-slate-300'}`}>
                  {layoutType === 'PREMIUM' && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                </div>
                <div>
                  <h3 className={`font-bold ${layoutType === 'PREMIUM' ? 'text-brand-700' : 'text-slate-700'}`}>Completa</h3>
                  <p className="text-xs text-slate-500 mt-1">Layout completo com descrição detalhada, timeline e apresentação visual premium.</p>
                </div>
              </button>
            </div>
          </div>

          {/* Client Data Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold">
              <UserCircleIcon className="w-5 h-5 text-brand-500" />
              <h2>Dados do Cliente</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Nome do Cliente / Empresa</label>
                <input
                  type="text"
                  placeholder="Ex: Agência Criativa XYZ"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Email (Opcional)</label>
                <input
                  type="email"
                  placeholder="contato@empresa.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Validade da Proposta</label>
                  <div className="relative">
                    <input
                      type="date"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                      value={validUntil}
                      onChange={e => setValidUntil(e.target.value)}
                    />
                    <Calendar className="absolute right-3 top-2.5 text-slate-400 w-5 h-5 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Prazo de Produção</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="15"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                      value={productionDays}
                      onChange={e => setProductionDays(parseInt(e.target.value) || 0)}
                    />
                    <span className="absolute right-4 top-2.5 text-slate-400 text-sm">dias</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Duração do Contrato</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="6"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                      value={contractMonths}
                      onChange={e => setContractMonths(parseInt(e.target.value) || 0)}
                    />
                    <span className="absolute right-4 top-2.5 text-slate-400 text-sm">meses</span>
                  </div>
                </div>
              </div>
              {layoutType === 'PREMIUM' && (
                <>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Descrição / Escopo do Serviço</label>
                    <textarea
                      placeholder="Descreva detalhadamente o objetivo do projeto, escopo e entregáveis..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all min-h-[100px]"
                      value={serviceDescription}
                      onChange={e => setServiceDescription(e.target.value)}
                    />
                  </div>

                  {/* Features Editor */}
                  <div className="mt-6 pt-6 border-t border-slate-100 animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Destaques do Projeto</h3>
                      <button
                        type="button"
                        onClick={() => setContent(prev => ({
                          ...prev,
                          features: [...(prev.features || []), { id: Math.random().toString(), title: 'Novo Destaque', description: 'Descrição do diferencial' }]
                        }))}
                        className="text-xs text-brand-600 font-bold hover:text-brand-800 flex items-center gap-1"
                      >
                        <Plus size={14} /> Adicionar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {content.features?.map((feature, index) => (
                        <div key={feature.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg relative group">
                          <button
                            type="button"
                            onClick={() => setContent(prev => ({
                              ...prev,
                              features: prev.features?.filter(f => f.id !== feature.id)
                            }))}
                            className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} />
                          </button>
                          <input
                            type="text"
                            className="block w-full bg-transparent font-bold text-slate-800 text-sm mb-1 focus:outline-none focus:border-b border-brand-300"
                            value={feature.title}
                            onChange={e => {
                              const newFeatures = [...(content.features || [])];
                              newFeatures[index].title = e.target.value;
                              setContent({ ...content, features: newFeatures });
                            }}
                          />
                          <textarea
                            className="block w-full bg-transparent text-xs text-slate-500 focus:outline-none focus:border-b border-brand-300 resize-none"
                            rows={2}
                            value={feature.description}
                            onChange={e => {
                              const newFeatures = [...(content.features || [])];
                              newFeatures[index].description = e.target.value;
                              setContent({ ...content, features: newFeatures });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Timeline Editor */}
                  <div className="mt-6 pt-6 border-t border-slate-100 animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Cronograma (Timeline)</h3>
                      <button
                        type="button"
                        onClick={() => setContent(prev => ({
                          ...prev,
                          timeline: [...(prev.timeline || []), { id: Math.random().toString(), step: (prev.timeline?.length || 0) + 1, title: 'Nova Etapa', description: 'Descrição da etapa', duration: 'X dias' }]
                        }))}
                        className="text-xs text-brand-600 font-bold hover:text-brand-800 flex items-center gap-1"
                      >
                        <Plus size={14} /> Adicionar Etapa
                      </button>
                    </div>

                    <div className="space-y-3">
                      {content.timeline?.map((step, index) => (
                        <div key={step.id} className="flex gap-3 items-start p-3 bg-slate-50 border border-slate-200 rounded-lg relative group">
                          <div className="flex bg-white w-6 h-6 rounded-full items-center justify-center border border-slate-200 text-xs font-bold text-slate-500 shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input
                              type="text"
                              className="bg-transparent font-bold text-slate-800 text-sm focus:outline-none focus:border-b border-brand-300"
                              value={step.title}
                              placeholder="Título da Etapa"
                              onChange={e => {
                                const newTimeline = [...(content.timeline || [])];
                                newTimeline[index].title = e.target.value;
                                setContent({ ...content, timeline: newTimeline });
                              }}
                            />
                            <div className="flex gap-2">
                              <input
                                type="text"
                                className="bg-transparent text-xs text-slate-500 focus:outline-none focus:border-b border-brand-300 w-full"
                                value={step.description}
                                placeholder="Descrição"
                                onChange={e => {
                                  const newTimeline = [...(content.timeline || [])];
                                  newTimeline[index].description = e.target.value;
                                  setContent({ ...content, timeline: newTimeline });
                                }}
                              />
                              <input
                                type="text"
                                className="bg-transparent text-xs text-brand-600 font-bold focus:outline-none focus:border-b border-brand-300 w-24 text-right"
                                value={step.duration || ''}
                                placeholder="Prazo (Ex: 2 dias)"
                                onChange={e => {
                                  const newTimeline = [...(content.timeline || [])];
                                  newTimeline[index].duration = e.target.value;
                                  setContent({ ...content, timeline: newTimeline });
                                }}
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setContent(prev => ({
                              ...prev,
                              timeline: prev.timeline?.filter(t => t.id !== step.id)
                            }))}
                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Add Item Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold">
              <Plus className="w-5 h-5 text-brand-500" />
              <h2>Adicionar Item</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Descrição do Item</label>
                  <input
                    type="text"
                    placeholder="Ex: Planejamento Estratégico Visual"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    value={newItemDesc}
                    onChange={e => setNewItemDesc(e.target.value)}
                  />
                </div>
                <div className={newItemType === ItemType.RECURRING ? "grid grid-cols-2 gap-2" : ""}>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Valor (R$)</label>
                    <input
                      type="number"
                      placeholder="0,00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                      value={newItemAmount}
                      onChange={e => setNewItemAmount(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addItem()}
                    />
                  </div>
                  {newItemType === ItemType.RECURRING && (
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Meses</label>
                      <input
                        type="number"
                        placeholder="Ex: 4"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                        value={newItemDuration}
                        onChange={e => setNewItemDuration(parseInt(e.target.value) || 1)}
                        onKeyDown={e => e.key === 'Enter' && addItem()}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex bg-slate-100 rounded-lg p-1">
                  <button
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${newItemType === ItemType.ONE_TIME ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setNewItemType(ItemType.ONE_TIME)}
                  >
                    Pagamento Único
                  </button>
                  <button
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${newItemType === ItemType.RECURRING ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setNewItemType(ItemType.RECURRING)}
                  >
                    Mensalidade
                  </button>
                </div>

                <button
                  onClick={addItem}
                  className="bg-slate-900 hover:bg-black text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Plus size={16} />
                  Adicionar ao Orçamento
                </button>
              </div>
            </div>
          </div>

          {/* Payment Conditions */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold">
              <span className="text-brand-500">💳</span>
              <h2>Condições de Pagamento</h2>
            </div>
            <div className="space-y-6">
              {paymentOptions.map((option, index) => (
                <div key={option.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative group/option">
                  <button
                    onClick={() => setPaymentOptions(paymentOptions.filter(o => o.id !== option.id))}
                    className="absolute -right-2 -top-2 bg-white border border-slate-200 text-red-500 p-1.5 rounded-full shadow-sm opacity-0 group-hover/option:opacity-100 transition-opacity z-10"
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Método</label>
                      <select
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                        value={option.paymentMethodId}
                        onChange={e => {
                          const newMethods = [...paymentOptions];
                          newMethods[index].paymentMethodId = e.target.value;
                          const method = paymentMethods.find(m => m.id === e.target.value);
                          if (method) newMethods[index].discountPercent = method.discountPercent;
                          setPaymentOptions(newMethods);
                        }}
                      >
                        {paymentMethods.map(method => (
                          <option key={method.id} value={method.id}>{method.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Desconto (%)</label>
                      <input
                        type="number"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                        value={option.discountPercent}
                        onChange={e => {
                          const newMethods = [...paymentOptions];
                          newMethods[index].discountPercent = parseFloat(e.target.value) || 0;
                          setPaymentOptions(newMethods);
                        }}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Parcelamento</label>
                      <select
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                        value={option.installments}
                        onChange={e => {
                          const newMethods = [...paymentOptions];
                          newMethods[index].installments = parseInt(e.target.value);
                          setPaymentOptions(newMethods);
                        }}
                      >
                        {[1, 2, 3, 4, 5, 6, 10, 12].map(n => (
                          <option key={n} value={n}>{n === 1 ? 'À vista' : `${n}x`}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => {
                          const newMethods = [...paymentOptions];
                          newMethods[index].hasDownPayment = !newMethods[index].hasDownPayment;
                          setPaymentOptions(newMethods);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all w-full ${option.hasDownPayment ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-slate-200 text-slate-500'}`}
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${option.hasDownPayment ? 'bg-brand-500 border-brand-500' : 'bg-white border-slate-300'}`}>
                          {option.hasDownPayment && <div className="w-1 h-1 bg-white rounded-full"></div>}
                        </div>
                        <span className="text-xs font-medium">Com Entrada</span>
                      </button>
                    </div>

                    <div className="col-span-1 md:col-span-2 mt-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Prazos de Pagamento (Texto Descritivo)</label>
                      <input
                        type="text"
                        placeholder="Ex: 50% na aprovação e 50% na entrega final"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                        value={option.paymentTerms || ''}
                        onChange={e => {
                          const newMethods = [...paymentOptions];
                          newMethods[index].paymentTerms = e.target.value;
                          setPaymentOptions(newMethods);
                        }}
                      />
                    </div>
                  </div>

                  {option.installments > 1 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 border-dashed">
                      <p className="text-[10px] font-bold text-slate-400 uppercase flex justify-between">
                        <span>Preview do Pagamento ({option.discountPercent}% desc.)</span>
                        <span className="text-brand-600">Total: {formatCurrency(totalProjectValue * (1 - option.discountPercent / 100))}</span>
                      </p>
                      <div className="mt-1 text-xs text-slate-600">
                        {option.hasDownPayment
                          ? `Ato: ${formatCurrency((totalProjectValue * (1 - option.discountPercent / 100)) / option.installments)} + ${option.installments - 1}x de ${formatCurrency((totalProjectValue * (1 - option.discountPercent / 100)) / option.installments)}`
                          : `${option.installments}x de ${formatCurrency((totalProjectValue * (1 - option.discountPercent / 100)) / option.installments)}`
                        }
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={() => {
                  if (paymentMethods.length === 0) return;
                  setPaymentOptions([...paymentOptions, {
                    id: Math.random().toString(36).substr(2, 9),
                    paymentMethodId: paymentMethods[0].id,
                    installments: 1,
                    hasDownPayment: false,
                    discountPercent: paymentMethods[0].discountPercent
                  }]);
                }}
                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-brand-500 hover:border-brand-500 hover:bg-brand-50 transition-all flex items-center justify-center gap-2 font-medium"
              >
                <Plus size={16} />
                Adicionar Opção de Pagamento
              </button>
            </div>
          </div>



        </div>

        {/* Right Column: Summary */}
        <div className="w-full lg:w-96 space-y-6">

          {/* Total Card */}
          <div className="bg-brand-500 text-white p-6 rounded-2xl shadow-lg shadow-brand-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>
            </div>
            <p className="text-brand-100 text-xs font-semibold tracking-wider uppercase mb-1">Investimento Total do Contrato</p>
            <h2 className="text-4xl font-bold">{formatCurrency(totalProjectValue)}</h2>
            {contractMonths > 0 && items.some(i => i.type === ItemType.RECURRING) && (
              <p className="text-brand-50 text-xs mt-2 opacity-90 block">
                Contrato de {contractMonths} meses englobando valores fixos e mensais listados.
              </p>
            )}
          </div>

          {/* Item Summary List */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resumo dos Itens</h3>
            </div>

            <div className="divide-y divide-slate-50">
              {items.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Nenhum item adicionado ainda.
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors group relative">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-slate-700">{item.description}</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(item.amount)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.type === ItemType.RECURRING ? 'bg-blue-100 text-blue-600' : 'bg-brand-100 text-brand-600'}`}>
                        {item.type === ItemType.RECURRING ? `Mensal (${item.durationMonths} meses)` : 'Pagamento Único'}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <div className="flex justify-between text-sm text-slate-500 mb-2">
                <span>Itens Totais:</span>
                <span>{items.length}</span>
              </div>
              <button
                onClick={() => handleSave(false)}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-3 rounded-xl shadow-lg shadow-brand-500/20 transition-all transform hover:translate-y-[-1px] flex justify-center items-center gap-2"
              >
                Gerar proposta <span className="text-lg">→</span>
              </button>
              <button
                onClick={() => handleSave(true)}
                className="w-full text-center text-slate-500 text-sm mt-3 hover:text-slate-800 transition-colors"
              >
                Salvar como Rascunho
              </button>
            </div>
          </div>
        </div>

      </div >
      {/* Service Selection Modal */}
      {
        showServiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900">Importar Serviço</h3>
                <button onClick={() => setShowServiceModal(false)}><Trash2 size={20} className="text-slate-400 rotate-45" /></button>
              </div>

              <div className="space-y-2">
                {availableServices.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">Nenhum serviço salvo.</p>
                ) : (
                  availableServices.map(service => (
                    <button
                      key={service.id}
                      onClick={() => addServiceItem(service)}
                      className="w-full text-left p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-slate-800">{service.description}</span>
                        <span className="font-semibold text-brand-600">{formatCurrency(service.amount)}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase">{service.type === ItemType.RECURRING ? 'Mensal' : 'Único'}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )
      }
    </div >

  );
};

// Helper icon
const UserCircleIcon = ({ className }: { className: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

export default CreateQuote;