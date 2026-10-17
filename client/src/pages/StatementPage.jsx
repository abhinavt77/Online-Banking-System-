import React, { useState, useEffect } from 'react';
import { useAccount } from '../context/AccountContext';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/formatters';
import api from '../api/api';
import { 
  FileText, 
  Printer, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Receipt, 
  Clock, 
  Building2,
  Calendar,
  CheckCircle2
} from 'lucide-react';

export default function StatementPage() {
  const { user } = useAuth();
  const { accounts, selectedAccount } = useAccount();

  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ totalIncome: 0, totalExpense: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [search, setSearch] = useState('');

  const loadStatement = async () => {
    setLoading(true);
    try {
      let url = `/transactions?limit=100`;
      if (filterAccount !== 'all') url += `&accountId=${filterAccount}`;
      if (filterType !== 'all') url += `&type=${filterType}`;
      if (filterCategory !== 'all') url += `&category=${filterCategory}`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;

      const res = await api.get(url);
      setTransactions(res.data.transactions || []);
      setStats(res.data.stats || { totalIncome: 0, totalExpense: 0 });
    } catch (err) {
      console.error('Error loading statement:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatement();
  }, [filterAccount, filterType, filterCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadStatement();
  };

  const handlePrint = () => {
    window.print();
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
      {/* Header & Print Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
            <FileText className="w-6 h-6 text-blue-400" />
            <span>Digital Passbook & Account Statement (INR)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Complete transaction ledger with NPCI UTR and IMPS reference numbers.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition shadow self-start sm:self-auto"
        >
          <Printer className="w-4 h-4 text-blue-400" />
          <span>Download Passbook PDF</span>
        </button>
      </div>

      {/* Printable Statement Header */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Account Holder</span>
          <div className="text-sm font-bold text-white mt-0.5">{user?.fullName}</div>
          <div className="text-xs text-slate-400 truncate">{user?.email}</div>
          {user?.panNumber && <div className="text-[10px] text-amber-400 font-mono mt-0.5">PAN: {user.panNumber}</div>}
        </div>

        <div>
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Branch & IFSC</span>
          <div className="text-sm font-bold text-orange-400 font-mono mt-0.5">APEX0001021</div>
          <div className="text-xs text-slate-300">Connaught Place, New Delhi</div>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Inflow (Credits)</span>
          <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
            +{formatINR(stats.totalIncome)}
          </div>
          <div className="text-[10px] text-slate-500">Deposits & UPI Inward</div>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Outflow (Debits)</span>
          <div className="text-sm font-bold text-rose-400 font-mono mt-0.5">
            -{formatINR(stats.totalExpense)}
          </div>
          <div className="text-[10px] text-slate-500">Transfers & BBPS Payments</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search UTR, counterparty, remark..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </form>

        <select
          value={filterAccount}
          onChange={(e) => setFilterAccount(e.target.value)}
          className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Indian Accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.account_type.toUpperCase()} (•••• {a.account_number.slice(-4)})
            </option>
          ))}
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Transaction Types</option>
          <option value="deposit">Deposits</option>
          <option value="withdrawal">ATM Withdrawals</option>
          <option value="transfer_in">Transfers Received (UPI/IMPS)</option>
          <option value="transfer_out">Transfers Sent (UPI/IMPS)</option>
          <option value="bill_payment">Bharat BillPay (BBPS)</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Categories</option>
          <option value="Salary">Salary / Income</option>
          <option value="Housing">Housing & Rent</option>
          <option value="Utilities">Utilities & BBPS</option>
          <option value="Cash">Cash ATM</option>
          <option value="Transfer">P2P Transfers</option>
          <option value="Investment">Investment & FDs</option>
        </select>
      </div>

      {/* Transactions Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Loading passbook entries...
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No transactions found matching filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">UTR / Reference No</th>
                  <th className="pb-3 font-semibold">Date & Time</th>
                  <th className="pb-3 font-semibold">Mode</th>
                  <th className="pb-3 font-semibold">Description / Beneficiary</th>
                  <th className="pb-3 font-semibold">Account</th>
                  <th className="pb-3 font-semibold text-right">Amount (₹)</th>
                  <th className="pb-3 font-semibold text-right">Balance After</th>
                  <th className="pb-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {transactions.map((txn) => {
                  const isCredit = txn.type === 'deposit' || txn.type === 'transfer_in';
                  return (
                    <tr key={txn.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 font-mono font-medium text-blue-400 truncate max-w-[130px]">
                        {txn.reference_id}
                      </td>
                      <td className="py-3 text-slate-400 whitespace-nowrap">
                        {new Date(txn.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono font-bold text-[10px]">
                          {txn.transfer_mode || 'IMPS'}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="font-semibold text-slate-100 flex items-center space-x-1.5">
                          {getTxnIcon(txn.type)}
                          <span className="truncate max-w-[180px]">{txn.counterparty_name || txn.description}</span>
                        </div>
                        {txn.counterparty_account && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            A/C or VPA: {txn.counterparty_account}
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-slate-400 capitalize font-mono">
                        •••• {txn.account_number?.slice(-4) || '••••'}
                      </td>
                      <td className={`py-3 text-right font-bold font-mono ${isCredit ? 'text-emerald-400' : 'text-slate-100'}`}>
                        {isCredit ? '+' : '-'}{formatINR(txn.amount)}
                      </td>
                      <td className="py-3 text-right font-mono text-slate-300">
                        {formatINR(txn.balance_after)}
                      </td>
                      <td className="py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
