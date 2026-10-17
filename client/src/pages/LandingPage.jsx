import React from 'react';
import { 
  Building2, 
  ShieldCheck, 
  ArrowRight, 
  Zap, 
  CreditCard, 
  Lock, 
  Coins, 
  Receipt, 
  TrendingUp, 
  CheckCircle,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage({ onGoLogin, onGoRegister, onSelectPage }) {
  const { login } = useAuth();
  const [loadingDemo, setLoadingDemo] = React.useState('');

  const handleQuickLogin = async (email, password, role) => {
    try {
      setLoadingDemo(role);
      await login(email, password);
      if (role === 'admin') {
        onSelectPage('admin');
      } else {
        onSelectPage('dashboard');
      }
    } catch (err) {
      alert('Failed to log in with demo credentials: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingDemo('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 via-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Apex<span className="text-blue-400 font-extrabold">Bank</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.5 bg-orange-500/20 border border-orange-500/30 text-orange-400 font-bold rounded">
                INDIA
              </span>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onGoLogin}
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              Sign In
            </button>
            <button
              onClick={onGoRegister}
              className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/30 transition"
            >
              Open Indian Bank A/C
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-16 pb-20 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
            {/* Pill */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold mb-6 animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>RBI Regulated Schedule Commercial Bank — Core Banking Solution</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
              India's Modern Digital Bank <br />
              <span className="bg-gradient-to-r from-orange-400 via-amber-200 to-emerald-400 bg-clip-text text-transparent">
                Powering UPI, IMPS & RuPay in INR
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Experience instant 24x7 IMPS & UPI transfers in Indian Rupees (₹), RuPay Platinum contactless cards, Bharat BillPay (BBPS) utility settlements, and high-yield fixed deposits.
            </p>

            {/* Quick Demo Login CTA Box for Evaluators */}
            <div className="mt-10 p-5 max-w-2xl mx-auto bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                🚀 One-Click Demo Sign In (Pre-seeded with INR balances)
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  disabled={loadingDemo !== ''}
                  onClick={() => handleQuickLogin('aarav@example.com', 'password123', 'customer')}
                  className="flex items-center justify-between p-3.5 bg-gradient-to-r from-blue-900/40 to-blue-800/40 hover:from-blue-900/60 hover:to-blue-800/60 border border-blue-600/40 rounded-xl transition text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                      AS
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-blue-300">
                        Aarav Sharma
                      </div>
                      <div className="text-xs text-emerald-400 font-mono">
                        ₹9,95,800.00 Total
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition" />
                </button>

                <button
                  disabled={loadingDemo !== ''}
                  onClick={() => handleQuickLogin('admin@apexbank.com', 'admin123', 'admin')}
                  className="flex items-center justify-between p-3.5 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 hover:from-indigo-900/60 hover:to-purple-900/60 border border-indigo-600/40 rounded-xl transition text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-indigo-300">
                        Bank Branch Admin
                      </div>
                      <div className="text-xs text-slate-400">
                        Underwriting & Liquidity Portal
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition" />
                </button>
              </div>

              <div className="mt-3 flex items-center justify-center space-x-4 text-[11px] text-slate-400">
                <span>Default Demo PIN: <strong className="text-blue-400 font-mono">1234</strong></span>
                <span>•</span>
                <span>IFSC: <strong className="text-orange-400 font-mono">APEX0001021</strong></span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-12 bg-slate-900/40 border-y border-slate-800/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Engineered for Indian Banking Requirements
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Complete compliance with RBI, NPCI IMPS/UPI clearing, and Bharat BillPay guidelines.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl hover:border-slate-700 transition">
                <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">IMPS & UPI 24x7 Clearing</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Real-time money transfer using either 12-digit Account Number + IFSC Code or Virtual Payment Address (UPI ID) with 4-digit PIN verification.
                </p>
              </div>

              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl hover:border-slate-700 transition">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-4">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">RuPay Contactless EMV</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Instant virtual RuPay Platinum card issuance. Set daily POS/E-com limits in INR (₹5,000 to ₹5,00,000) and instant card lock toggle.
                </p>
              </div>

              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl hover:border-slate-700 transition">
                <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center mb-4">
                  <Coins className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">FDs up to 8.25% APY & Loans</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Lock in guaranteed returns on Fixed Deposits, or apply for Vehicle and Personal Loans with automated EMI calculation in Indian Rupees.
                </p>
              </div>

              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl hover:border-slate-700 transition">
                <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-xl flex items-center justify-center mb-4">
                  <Receipt className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Bharat BillPay (BBPS)</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Direct bill settlements for BESCOM, Tata Power, Reliance JioFiber, Airtel, and FASTag with downloadable PDF receipts.
                </p>
              </div>

              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl hover:border-slate-700 transition">
                <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">INR Cashflow & Analytics</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Interactive monthly inflow & outflow graphs formatted in Indian Lakhs and Thousands with filterable passbook records.
                </p>
              </div>

              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl hover:border-slate-700 transition">
                <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-xl flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Branch Admin Risk Governance</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Review total liquidity across all branches, freeze suspicious accounts, and disburse approved loan funds directly into customer accounts.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-slate-300">Apex Bank India</span>
            <span>— Licensed by Reserve Bank of India (RBI)</span>
          </div>
          <div>
            SE Mini Project — Indian Banking System in INR (₹)
          </div>
        </div>
      </footer>
    </div>
  );
}
