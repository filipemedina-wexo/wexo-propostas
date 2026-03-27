import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface PasswordGateProps {
  onSuccess: () => void;
}

const PasswordGate: React.FC<PasswordGateProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'wexo26') {
      onSuccess();
    } else {
      setError(true);
      // Shake animation effect would go here
    }
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center animate-fade-in px-4">
      
      {/* Logo Placeholder just for visual parity with screenshot */}
      {/* Substituindo Logo */}
      <div className="flex justify-center mb-6">
        <img src="/logo.png" alt="Wexo Logo" className="w-40 md:w-48 h-auto object-contain" />
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-md relative overflow-hidden">
        {/* Colorful top border */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-green-400 to-yellow-400"></div>

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600">
            <Lock size={32} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">Acesso Restrito</h1>
        <p className="text-center text-slate-500 text-sm mb-8">
          Bem-vindo! Por favor, insira a senha fornecida para visualizar os detalhes da sua proposta comercial.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 ml-1">Senha de Acesso</label>
            <div className="relative">
              <div className="absolute left-4 top-3.5 text-slate-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
              </div>
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={`w-full bg-slate-50 border ${error ? 'border-red-300 ring-red-100' : 'border-slate-200'} rounded-xl py-3 pl-11 pr-12 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
              />
              <button 
                type="button"
                className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <p className="text-red-500 text-xs mt-2 ml-1">Senha incorreta. Tente "wexo26".</p>}
          </div>

          <button 
            type="submit"
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-500/20 transition-all transform active:scale-[0.98] flex justify-center items-center gap-2 mt-4"
          >
            Acessar Proposta <span className="text-lg">→</span>
          </button>
        </form>
        
        <div className="mt-6 text-center">
           <a href="#" className="text-xs text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1">
             <span className="w-3 h-3 rounded-full border border-slate-400 flex items-center justify-center text-[8px]">?</span>
             Esqueceu a senha ou precisa de ajuda?
           </a>
        </div>
      </div>
    </div>
  );
};

export default PasswordGate;
