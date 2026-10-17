import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccount } from '../context/AccountContext';
import { formatINR } from '../utils/formatters';
import { 
  Building2, 
  Wallet, 
  ChevronDown, 
  LogOut, 
  ShieldCheck, 
  User, 
  Bell, 
  Menu, 
  X,
  CreditCard
} from 'lucide-react';

export default function Navbar({ onToggleMobileMenu, isMobileMenuOpen, currentPage, setCurrentPage }) {
  const { user, logout } = useAuth();
  const { accounts, selectedAccount, setSelectedAccount } = useAccount();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Mobile Toggle */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div 
              onClick={() => setCurrentPage('dashboard')}
              className="flex items-center space-x-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 via-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  Apex<span className="text-blue-400 font-extrabold">Bank</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-orange-500/20 border border-orange-500/30 text-orange-400 font-bold rounded">
                    INDIA
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wider block -mt-1 uppercase">
                  Schedule Commercial Bank
                </span>
              </div>
            </div>
          </div>

          {/* Center: Account Selector (for Customers) */}
          {user?.role === 'customer' && accounts.length > 0 && (
            <div className="hidden sm:block relative">
              <button
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                className="flex items-center space-x-3 px-3.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition text-left"
              >
                <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 capitalize">
                    {selectedAccount?.account_type} (IFSC: {selectedAccount?.ifsc_code || 'APEX0001021'})
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {formatINR(selectedAccount?.balance)}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
              </button>

              {accountDropdownOpen && (
                <div 
                  className="absolute left-0 mt-2 w-80 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setAccountDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Select Active Bank Account
                  </div>
                  {accounts.map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => {
                        setSelectedAccount(acc);
                        setAccountDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition ${
                        selectedAccount?.id === acc.id ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' : 'hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-medium capitalize">{acc.account_type} A/C</div>
                        <div className="text-xs text-slate-400 font-mono">A/C: •••• {acc.account_number.slice(-4)}</div>
                        <div className="text-[10px] text-blue-400 font-mono">UPI: {acc.upi_id || 'aarav@apexbank'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">
                          {formatINR(acc.balance)}
                        </div>
                        <div className={`text-[10px] capitalize ${acc.status === 'active' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ● {acc.status}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Right: RBI Badge & User Profile */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>RBI Regulated Bank</span>
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-3 p-1.5 pl-2 hover:bg-slate-800/80 rounded-xl border border-transparent hover:border-slate-700/60 transition"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-white leading-tight">
                    {user?.fullName || 'User'}
                  </div>
                  <div className="text-[11px] font-medium text-blue-400 capitalize">
                    {user?.role === 'admin' ? 'Bank Branch Admin' : 'Retail Customer'}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
              </button>

              {profileDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in"
                  onMouseLeave={() => setProfileDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-sm font-semibold text-white">{user?.fullName}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    {user?.panNumber && (
                      <p className="text-[10px] text-amber-400 font-mono mt-0.5">PAN: {user.panNumber}</p>
                    )}
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300 capitalize">
                      {user?.role}
                    </span>
                  </div>

                  {user?.role === 'admin' && (
                    <button
                      onClick={() => {
                        setCurrentPage('admin');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg mt-1"
                    >
                      <ShieldCheck className="w-4 h-4 text-blue-400" />
                      <span>Admin Management</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      logout();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg mt-1 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
