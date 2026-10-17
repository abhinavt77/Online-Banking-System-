import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccount } from '../context/AccountContext';
import { formatINR } from '../utils/formatters';
import api from '../api/api';
import SpendingChart from '../components/SpendingChart';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  CreditCard, 
  Send, 
  PlusCircle, 
  ArrowDownToLine, 
  Receipt, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles,
  Smartphone
} from 'lucide-react';

export default function DashboardPage({ onNavigate }) {
  const { user } = useAuth();
  const { accounts, selectedAccount, setSelectedAccount, totalBalance, refreshAccounts } = useAccount();

  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ totalIncome: 0, totalExpense: 0 });
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [hideBalance, setHideBalance] = useState(false);
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [newAccType, setNewAccType] = useState('savings');
  const [initialDeposit, setInitialDeposit] = useState('10000');
  const [creatingAcc, setCreatingAcc] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [txnRes, benRes] = await Promise.all([
          api.get('/transactions?limit=8'),
          api.get('/beneficiaries')
        ]);
        setTransactions(txnRes.data.transactions || []);
        setStats(txnRes.data.stats || { totalIncome: 0, totalExpense: 0 });
        setBeneficiaries(benRes.data.beneficiaries || []);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      }
    }
    loadDashboardData();
  }, [selectedAccount]);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setCreatingAcc(true);
    try {
      await api.post('/accounts', {
        accountType: newAccType,
        initialDeposit: parseFloat(initialDeposit) || 0
      });
      setShowNewAccountModal(false);
      await refreshAccounts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create account');
    } finally {
      setCreatingAcc(false);
    }
  };

  const getTxnIcon = (type) => {
    switch (type) {
      case 'deposit':
      case 'transfer_in':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
      case 'withdrawal':
      case 'transfer_out':
        return <ArrowUpRight className="w-4 h-4 text-rose-400" />;
      case 'bill_payment':
        return <Receipt className="w-4 h-4 text-amber-400" />;
      default:
        return <Clock className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Namaste, {user?.fullName?.split(' ')[0] || 'Customer'}
            </h1>
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Welcome to your Apex Bank India Digital NetBanking dashboard.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setShowNewAccountModal(true)}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-200 transition"
          >
            <PlusCircle className="w-4 h-4 text-blue-400" />
            <span>Open Additional A/C</span>
          </button>
          <button
            onClick={() => onNavigate('transfer')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition"
          >
            <Send className="w-4 h-4" />
            <span>IMPS / UPI Transfer</span>
          </button>
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Wealth / Primary Account Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/30 rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex justify-between items-start relative z-10">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                  Total Liquid Net Worth (INR)
                </span>
                <button
                  onClick={() => setHideBalance(!hideBalance)}
                  className="text-slate-400 hover:text-white transition"
                  title="Toggle Balance Visibility"
                >
                  {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-white mt-2 tracking-tight">
                {hideBalance ? '••••••••' : formatINR(totalBalance)}
              </div>
            </div>

            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Accounts Active</span>
            </div>
          </div>

          {/* Active Account Pill */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 relative z-10 text-xs">
            <div>
              <span className="text-slate-400 block">Primary Account No:</span>
              <span className="font-mono text-slate-200 font-semibold text-sm">
                {selectedAccount?.account_number || '•••• •••• ••••'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">IFSC Code:</span>
              <span className="font-mono text-orange-400 font-semibold text-sm">
                {selectedAccount?.ifsc_code || 'APEX0001021'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Linked UPI ID:</span>
              <span className="font-mono text-emerald-400 font-semibold text-sm">
                {selectedAccount?.upi_id || 'aarav@apexbank'}
              </span>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5 relative z-10">
            <button
              onClick={() => onNavigate('transfer')}
              className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-2xl flex flex-col items-center text-center transition group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                <Send className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-white">Send Money</span>
              <span className="text-[10px] text-slate-400">IMPS / UPI 24x7</span>
            </button>

            <button
              onClick={() => onNavigate('deposit-withdraw')}
              className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-2xl flex flex-col items-center text-center transition group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                <ArrowDownToLine className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-white">Deposit Inflow</span>
              <span className="text-[10px] text-slate-400">UPI / NetBanking</span>
            </button>

            <button
              onClick={() => onNavigate('deposit-withdraw')}
              className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-2xl flex flex-col items-center text-center transition group"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-white">ATM Cash</span>
              <span className="text-[10px] text-slate-400">NFS ATM Network</span>
            </button>

            <button
              onClick={() => onNavigate('bills')}
              className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-2xl flex flex-col items-center text-center transition group"
            >
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                <Receipt className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-white">Bharat BillPay</span>
              <span className="text-[10px] text-slate-400">BESCOM, Jio, etc.</span>
            </button>
          </div>
        </div>

        {/* Multi-Accounts Switcher List */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Wallet className="w-4 h-4 text-blue-400" />
                <span>My Bank Accounts ({accounts.length})</span>
              </h3>
              <button
                onClick={() => setShowNewAccountModal(true)}
                className="text-[11px] font-semibold text-blue-400 hover:text-blue-300"
              >
                + Add A/C
              </button>
            </div>

            <div className="space-y-3">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => setSelectedAccount(acc)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                    selectedAccount?.id === acc.id
                      ? 'bg-blue-600/15 border-blue-500/40 shadow-md'
                      : 'bg-slate-800/40 border-slate-750 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-bold text-white capitalize">
                        {acc.account_type} Account
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        A/C: •••• {acc.account_number.slice(-4)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-white">
                        {hideBalance ? '••••' : formatINR(acc.balance)}
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">INR (₹)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Payee Send Row */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-xs font-semibold text-slate-400">Frequent UPI / IMPS Payees</span>
              <button
                onClick={() => onNavigate('beneficiaries')}
                className="text-[11px] text-blue-400 hover:text-blue-300"
              >
                Manage
              </button>
            </div>
            <div className="flex items-center space-x-2 overflow-x-auto pb-1">
              {beneficiaries.slice(0, 4).map((b) => (
                <button
                  key={b.id}
                  onClick={() => onNavigate('transfer')}
                  className="flex flex-col items-center shrink-0 w-14 text-center group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-300 group-hover:border-blue-500 group-hover:bg-blue-600/20 transition">
                    {b.name.charAt(0)}
                  </div>
                  <span className="text-[10px] text-slate-300 mt-1 truncate w-full">
                    {b.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Chart & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SpendingChart 
            income={stats.totalIncome || 145800} 
            expense={stats.totalExpense || 38450} 
          />
        </div>

        {/* Recent Transactions List */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Passbook Activity</span>
              </h3>
              <button
                onClick={() => onNavigate('statements')}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
              >
                <span>All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-800/80">
              {transactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No passbook entries yet.
                </div>
              ) : (
                transactions.slice(0, 5).map((txn) => {
                  const isCredit = txn.type === 'deposit' || txn.type === 'transfer_in';
                  return (
                    <div key={txn.id} className="py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-slate-800 rounded-xl">
                          {getTxnIcon(txn.type)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 truncate max-w-[130px]">
                            {txn.counterparty_name || txn.description}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(txn.created_at).toLocaleDateString('en-IN')} • {txn.transfer_mode || 'IMPS'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`font-bold font-mono ${isCredit ? 'text-emerald-400' : 'text-slate-100'}`}>
                          {isCredit ? '+' : '-'}{formatINR(txn.amount)}
                        </div>
                        <div className="text-[9px] text-slate-500 uppercase">
                          {txn.status}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <button
              onClick={() => onNavigate('statements')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-xl text-xs transition text-center"
            >
              View Full Passbook & Statement
            </button>
          </div>
        </div>
      </div>

      {/* New Account Creation Modal */}
      {showNewAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Open Indian Sub-Account</h3>
            <p className="text-xs text-slate-400 mb-4">
              Instantly create a dedicated Salary or High-Yield Savings account.
            </p>

            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Account Type</label>
                <select
                  value={newAccType}
                  onChange={(e) => setNewAccType(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="savings">High-Yield Savings (7.0% APY)</option>
                  <option value="salary">Corporate Salary A/C (Zero Balance)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Initial Funding Deposit (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewAccountModal(false)}
                  className="flex-1 py-2 px-3 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAcc}
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-md"
                >
                  {creatingAcc ? 'Opening...' : 'Confirm & Open'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
