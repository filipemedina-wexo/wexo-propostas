import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import CreateQuote from './components/CreateQuote';
import ViewQuote from './components/ViewQuote';
import ShareQuote from './components/ShareQuote';
import ServicesPage from './components/ServicesPage';
import PaymentMethodsPage from './components/PaymentMethodsPage';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { AuthProvider, useAuth } from './components/AuthProvider';

// Global Fade Animation
const GlobalStyles = () => (
  <style>{`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.4s ease-out forwards;
    }
  `}</style>
);

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <GlobalStyles />
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/services" element={
              <ProtectedRoute>
                <ServicesPage />
              </ProtectedRoute>
            } />
            <Route path="/payments" element={
              <ProtectedRoute>
                <PaymentMethodsPage />
              </ProtectedRoute>
            } />
            <Route path="/new" element={
              <ProtectedRoute>
                <CreateQuote />
              </ProtectedRoute>
            } />
            <Route path="/edit/:id" element={
              <ProtectedRoute>
                <CreateQuote />
              </ProtectedRoute>
            } />
            <Route path="/share/:id" element={
              <ProtectedRoute>
                <ShareQuote />
              </ProtectedRoute>
            } />

            {/* Public Routes (with internal PasswordGate) */}
            <Route path="/view/:id" element={<ViewQuote />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;