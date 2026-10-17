import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  ArrowDownToLine, 
  Receipt, 
  CreditCard, 
  Coins, 
  FileText, 
  Users, 
  ShieldCheck, 
  HelpCircle,
  ExternalLink
} from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage, isMobileOpen, onCloseMobile }) {
  const { user } = useAuth();

  const customerNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transfer', label: 'Transfer Money', icon: ArrowLeftRight },
    { id: 'deposit-withdraw', label: 'Deposit & Withdraw', icon: ArrowDownToLine },
    { id: 'bills', label: 'Pay Bills & Utilities', icon: Receipt },
    { id: 'cards', label: 'Cards Center', icon: CreditCard },
    { id: 'loans', label: 'Loans & Term Deposits', icon: Coins },
    { id: 'statements', label: 'Ledger & Statements', icon: FileText },
    { id: 'beneficiaries', label: 'Beneficiaries', icon: Users },
  ];

  const adminNavItems = [
    { id: 'admin', label: 'Admin Management', icon: ShieldCheck },
    { id: 'statements', label: 'All Transactions', icon: FileText },
  ];

  const navItems = user?.role === 'admin' ? adminNavItems : customerNavItems;

  const handleSelect = (id) => {
    setCurrentPage(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed md:sticky top-16 z-40 h-[calc(100vh-4rem)] w-64 bg-slate-900/95 md:bg-slate-900/50 backdrop-blur-md border-r border-slate-800/80 flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Navigation Links */}
        <div className="space-y-1">
          <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {user?.role === 'admin' ? 'Bank Control' : 'Banking Services'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Security / SE Mini Project Tag */}
        <div className="p-3.5 bg-gradient-to-br from-slate-800/80 to-slate-850/80 rounded-2xl border border-slate-700/60 shadow-inner">
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>ACID Core Banking Engine</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Live database transactions with atomic rollback protection.
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-500">
            <span>SE Mini Project</span>
            <span className="font-mono text-slate-400">v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
