import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Copy, ExternalLink, ArrowRight } from 'lucide-react';

const ShareQuote: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [copied, setCopied] = useState(false);

    const shareUrl = `${window.location.protocol}//${window.location.host}/#/view/${id}`;
    const password = "wexo"; // Default password as per current authService logic

    const fullMessage = `Olá! Segue o link da sua proposta comercial:\n\n${shareUrl}\n\nSenha de acesso: ${password}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(fullMessage);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center animate-fade-in">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 text-center">

                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                    <CheckCircle2 size={40} />
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-2">Proposta Criada com Sucesso!</h1>
                <p className="text-slate-500 mb-8">Agora basta enviar para o seu cliente.</p>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left mb-6 relative group">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Mensagem Pronta</label>
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans bg-white p-3 rounded-lg border border-slate-100">
                        {fullMessage}
                    </pre>

                    <button
                        onClick={handleCopy}
                        className="absolute top-4 right-4 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 p-2 rounded-lg shadow-sm transition-all flex items-center gap-2 text-xs font-bold"
                    >
                        {copied ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                        {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                </div>

                <div className="flex flex-col gap-3">
                    <Link
                        to={`/view/${id}`}
                        className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        Visualizar Proposta <ExternalLink size={18} />
                    </Link>
                    <Link
                        to="/"
                        className="w-full bg-white hover:bg-slate-50 text-slate-600 font-bold py-3.5 rounded-xl border border-slate-200 transition-all"
                    >
                        Voltar ao Dashboard
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default ShareQuote;
