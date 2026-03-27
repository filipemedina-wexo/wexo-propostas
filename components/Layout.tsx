import React, { ReactNode } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, FileText, Settings, Users, Bell, Search } from 'lucide-react';
import { logout } from '../services/authService';
import { useAuth } from './AuthProvider';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const getUserName = () => {
    if (!user) return '';
    return user.user_metadata?.name || user.user_metadata?.full_name || user.email || 'Usuário';
  };

  const displayName = getUserName();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return (name || 'U').substring(0, 2).toUpperCase();
  };
  
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // If not logged in, just simple center layout
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
         <main className="flex-1 flex flex-col justify-center items-center p-4">
            {children}
         </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col no-print shrink-0 md:min-h-screen">
        {/* Logo */}
        <div 
          onClick={() => navigate('/')}
          className="p-6 flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity border-b border-slate-100"
        >
          <img src="/logo.png" alt="Wexo Logo" className="w-32 md:w-40 h-auto object-contain" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 flex flex-col gap-1 px-4">
          <Link
            to="/"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${
              isActive('/') 
                ? 'bg-brand-500 text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-brand-600'
            }`}
          >
            <LayoutDashboard size={18} strokeWidth={2.5} />
            DASHBOARD
          </Link>
          
          <Link
            to="/services"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${
              isActive('/services') 
                ? 'bg-brand-500 text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-brand-600'
            }`}
          >
            <FileText size={18} strokeWidth={2.5} />
            SERVIÇOS
          </Link>

          <Link
            to="/payments"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${
              isActive('/payments') 
                ? 'bg-brand-500 text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-brand-600'
            }`}
          >
            <Settings size={18} strokeWidth={2.5} />
            PAGAMENTOS
          </Link>
        </nav>

        {/* Support & Logout */}
        <div className="p-4 border-t border-slate-100 flex flex-col gap-1">
           <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition-colors"
          >
            <LogOut size={18} strokeWidth={2.5} />
            LOGOUT
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex justify-between items-center px-8 no-print shrink-0">
          <div className="text-xl font-bold text-slate-900 tracking-tight">PROPOSTAS WEXO</div>
          
          <div className="flex items-center gap-6">
            <button className="text-slate-400 hover:text-slate-600 transition-colors relative">
               <Bell size={20} />
               <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
               <Settings size={20} />
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 uppercase">{displayName}</p>
                <p className="text-[10px] text-slate-500 font-medium">Head of Sales</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                {getInitials(displayName)}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
