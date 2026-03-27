import React, { useEffect, useState } from 'react';
import { Plus, Trash2, CreditCard } from 'lucide-react';
import { getAllPaymentMethods, createPaymentMethod, deletePaymentMethod } from '../services/paymentService';
import { PaymentMethod } from '../types';

const PaymentMethodsPage: React.FC = () => {
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [name, setName] = useState('');
    const [discount, setDiscount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadMethods();
    }, []);

    const loadMethods = async () => {
        const data = await getAllPaymentMethods();
        setMethods(data);
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!name) return;
        setIsSubmitting(true);

        const newMethod = await createPaymentMethod({
            name,
            discountPercent: parseFloat(discount) || 0,
            active: true
        });

        if (newMethod) {
            setMethods([...methods, newMethod]);
            setName('');
            setDiscount('');
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta forma de pagamento?')) {
            const success = await deletePaymentMethod(id);
            if (success) {
                setMethods(methods.filter(m => m.id !== id));
            }
        }
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Formas de Pagamento</h1>
                <p className="text-slate-500 mt-1">Gerencie as opções de pagamento e descontos oferecidos.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Create Form */}
                <div className="md:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Plus size={18} className="text-brand-500" /> Nova Opção
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                    placeholder="Ex: Pix, Dinheiro, etc."
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Desconto (%)</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                    placeholder="0"
                                    value={discount}
                                    onChange={e => setDiscount(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={handleCreate}
                                disabled={isSubmitting || !name}
                                className="w-full bg-slate-900 hover:bg-black text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'Salvando...' : 'Adicionar'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="divide-y divide-slate-100">
                            {loading ? (
                                <div className="p-8 text-center text-slate-400">Carregando...</div>
                            ) : methods.length === 0 ? (
                                <div className="p-12 text-center flex flex-col items-center text-slate-400">
                                    <CreditCard size={48} className="mb-4 opacity-20" />
                                    <p>Nenhuma forma de pagamento cadastrada.</p>
                                </div>
                            ) : (
                                methods.map(method => (
                                    <div key={method.id} className="p-4 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center">
                                                <CreditCard size={14} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800">{method.name}</p>
                                                {method.discountPercent > 0 && (
                                                    <p className="text-xs text-green-600 font-medium">{method.discountPercent}% de desconto</p>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(method.id)}
                                            className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PaymentMethodsPage;
