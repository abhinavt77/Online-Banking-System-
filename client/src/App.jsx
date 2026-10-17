import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccountProvider } from './context/AccountContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TransferPage from './pages/TransferPage';
import DepositWithdrawPage from './pages/DepositWithdrawPage';
import BillsPage from './pages/BillsPage';
import CardsPage from './pages/CardsPage';
import LoansPage from './pages/LoansPage';
import StatementPage from './pages/StatementPage';
import BeneficiariesPage from './pages/BeneficiariesPage';
import AdminPage from './pages/AdminPage';

function BankingApp() {
  const { user, loading } = useAuth();
  const [guestView, setGuestView] = useState('landing'); // 'landing', 'login', 'register'
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // If initial auth check is running
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center animate-pulse">
          <span className="text-white font-extrabold text-xl">A</span>
        </div>
        <div className="text-xs text-slate-400 font-medium">Securing Apex Banking Session...</div>
      </div>
    );
  }

  // Not signed in
  if (!user) {
    if (guestView === 'landing') {
      return (
        <LandingPage
          onGoLogin={() => setGuestView('login')}
          onGoRegister={() => setGuestView('register')}
          onSelectPage={(page) => setCurrentPage(page)}
        />
      );
    }
    return (
      <LoginPage
        initialMode={guestView}
        onBackToHome={() => setGuestView('landing')}
        onSelectPage={(page) => setCurrentPage(page)}
      />
    );
  }

  // Signed in application layout
  return (
    <AccountProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
        <Navbar
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />

        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          <Sidebar
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            isMobileOpen={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {currentPage === 'dashboard' && <DashboardPage onNavigate={setCurrentPage} />}
            {currentPage === 'transfer' && <TransferPage />}
            {currentPage === 'deposit-withdraw' && <DepositWithdrawPage />}
            {currentPage === 'bills' && <BillsPage />}
            {currentPage === 'cards' && <CardsPage />}
            {currentPage === 'loans' && <LoansPage />}
            {currentPage === 'statements' && <StatementPage />}
            {currentPage === 'beneficiaries' && (
              <BeneficiariesPage onNavigateToTransfer={() => setCurrentPage('transfer')} />
            )}
            {currentPage === 'admin' && <AdminPage />}
          </main>
        </div>
      </div>
    </AccountProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BankingApp />
    </AuthProvider>
  );
}
