import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Package } from 'lucide-react';
import { getAllServices, createService, deleteService } from '../services/servicesService';
import { Service, ItemType } from '../types';
import { formatCurrency } from './Formatters';
import { useAuth } from './AuthProvider';

const ServicesPage: React.FC = () => {
    const { user } = useAuth();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [desc, setDesc] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<ItemType>(ItemType.ONE_TIME);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        const data = await getAllServices();
        setServices(data);
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!desc || !amount) return;
        setIsSubmitting(true);

        const newService = await createService({
            description: desc,
            amount: parseFloat(amount.replace(',', '.')),
            type: type,
            userEmail: user?.email
        });

        if (newService) {
            setServices([newService, ...services]);
            setDesc('');
            setAmount('');
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este serviço?')) {
            const success = await deleteService(id);
            if (success) {
                setServices(services.filter(s => s.id !== id));
            }
        }
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Meus Serviços</h1>
                <p className="text-slate-500 mt-1">Gerencie seus serviços recorrentes para criar propostas mais rápido.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Create Form */}
                <div className="md:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Plus size={18} className="text-brand-500" /> Novo Serviço
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                    placeholder="Ex: Consultoria"
                                    value={desc}
                                    onChange={e => setDesc(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                    placeholder="0,00"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                                <div className="flex bg-slate-100 rounded-lg p-1">
                                    <button
                                        className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${type === ItemType.ONE_TIME ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'}`}
                                        onClick={() => setType(ItemType.ONE_TIME)}
                                    >
                                        Único
                                    </button>
                                    <button
                                        className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${type === ItemType.RECURRING ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'}`}
                                        onClick={() => setType(ItemType.RECURRING)}
                                    >
                                        Mensal
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleCreate}
                                disabled={isSubmitting || !desc || !amount}
                                className="w-full bg-slate-900 hover:bg-black text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'Salvando...' : 'Adicionar Serviço'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="divide-y divide-slate-100">
                            {loading ? (
                                <div className="p-8 text-center text-slate-400">Carregando serviços...</div>
                            ) : services.length === 0 ? (
                                <div className="p-12 text-center flex flex-col items-center text-slate-400">
                                    <Package size={48} className="mb-4 opacity-20" />
                                    <p>Nenhum serviço cadastrado.</p>
                                </div>
                            ) : (
                                services.map(service => (
                                    <div key={service.id} className="p-4 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                                        <div>
                                            <p className="font-medium text-slate-800">{service.description}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="font-semibold text-slate-600 text-sm">
                                                    {formatCurrency(service.amount)}
                                                </span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${service.type === ItemType.RECURRING ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                    {service.type === ItemType.RECURRING ? 'Mensal' : 'Único'}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(service.id)}
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

export default ServicesPage;
