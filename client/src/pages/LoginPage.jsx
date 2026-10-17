import React, { useState } from 'react';
import { Building2, Lock, Mail, User, Phone, ShieldCheck, ArrowRight, Eye, EyeOff, AlertCircle, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ initialMode = 'login', onSelectPage, onBackToHome }) {
  const [mode, setMode] = useState(initialMode);
  const { login, register } = useAuth();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [pin, setPin] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const user = await login(email, password);
        if (user.role === 'admin') {
          onSelectPage('admin');
        } else {
          onSelectPage('dashboard');
        }
      } else {
        const user = await register({
          fullName,
          email,
          password,
          phone,
          panNumber,
          pin
        });
        onSelectPage('dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-blue-600 selection:text-white">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div 
          onClick={onBackToHome}
          className="inline-flex items-center space-x-2.5 cursor-pointer group mb-2"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 via-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            Apex<span className="text-blue-400 font-extrabold">Bank</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.5 bg-orange-500/20 border border-orange-500/30 text-orange-400 font-bold rounded">
              INDIA
            </span>
          </span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          {mode === 'login' ? 'Sign in to Indian NetBanking' : 'Open Indian Digital Savings Account'}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Secure, RBI-compliant 256-bit encrypted banking session.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 sm:px-10 rounded-3xl shadow-2xl relative">
          {/* Tab Switcher */}
          <div className="flex bg-slate-800/80 p-1 rounded-xl mb-6 border border-slate-700/60">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                mode === 'login' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                mode === 'register' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              New A/C (KYC)
            </button>
          </div>

          {/* Quick Demo Credentials Autofill */}
          {mode === 'login' && (
            <div className="mb-6 p-3 bg-slate-850 bg-slate-800/50 border border-slate-700/50 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                1-Click Indian Demo Login:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemo('aarav@example.com', 'password123')}
                  className="px-2.5 py-1.5 bg-slate-700/60 hover:bg-slate-700 text-xs font-medium text-emerald-300 rounded-lg text-left truncate transition"
                >
                  🇮🇳 Aarav Sharma
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('admin@apexbank.com', 'admin123')}
                  className="px-2.5 py-1.5 bg-slate-700/60 hover:bg-slate-700 text-xs font-medium text-indigo-300 rounded-lg text-left truncate transition"
                >
                  🛡️ Branch Admin
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Legal Name (as per Aadhaar/PAN)</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aarav Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Permanent Account Number (PAN)</label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      maxLength={10}
                      required
                      placeholder="e.g. ABCPS1234K"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 uppercase font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Mobile Number (Linked with Aadhaar)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">4-Digit UPI / Transaction PIN</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="1234"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Used to authenticate IMPS & UPI transfers.</span>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email ID</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 mt-4"
            >
              <span>{loading ? 'Authenticating...' : mode === 'login' ? 'Sign In to NetBanking' : 'Complete Online KYC & Open A/C'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onBackToHome}
              className="text-xs text-slate-400 hover:text-slate-200 transition"
            >
              ← Back to Main Homepage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
