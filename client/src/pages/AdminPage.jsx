import React, { useState, useEffect } from 'react';
import { formatINR } from '../utils/formatters';
import api from '../api/api';
import { 
  ShieldCheck, 
  Users, 
  Wallet, 
  Coins, 
  Activity, 
  Lock, 
  Unlock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  Search,
  Building2,
  TrendingUp
} from 'lucide-react';

export default function AdminPage() {
  const [metrics, setMetrics] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loans, setLoans] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('loans');
  const [actionMsg, setActionMsg] = useState('');

  const loadAdminData = async () => {
    try {
      const [overviewRes, accRes, loansRes, usersRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/accounts'),
        api.get('/admin/loans'),
        api.get('/admin/users')
      ]);

      setMetrics(overviewRes.data.metrics);
      setRecentLogs(overviewRes.data.recentLogs || []);
      setAccounts(accRes.data.accounts || []);
      setLoans(loansRes.data.loans || []);
      setUsers(usersRes.data.users || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleLoanDecision = async (loanId, decision) => {
    try {
      const res = await api.patch(`/admin/loans/${loanId}/decision`, { decision });
      setActionMsg(res.data.message);
      setTimeout(() => setActionMsg(''), 2500);
      await loadAdminData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to process decision');
    }
  };

  const handleToggleFreeze = async (accountId) => {
    try {
      const res = await api.patch(`/admin/accounts/${accountId}/freeze`);
      setActionMsg(res.data.message);
      setTimeout(() => setActionMsg(''), 2500);
      await loadAdminData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update account freeze state');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 via-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Bank Branch Administration & Liquidity Control (INR)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              RBI Compliance, retail loan underwritings, customer risk governance, and NPCI audit logs.
            </p>
          </div>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center space-x-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Total Bank Liquidity</span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white mt-2 font-mono">
              {formatINR(metrics.totalLiquidity)}
            </div>
            <span className="text-[10px] text-emerald-400">Deposits Across {metrics.totalAccounts} Accounts</span>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>KYC Verified Customers</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white mt-2 font-mono">
              {metrics.totalUsers} Active
            </div>
            <span className="text-[10px] text-blue-400">PAN & Aadhaar Linked</span>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Pending Loan Review</span>
              <Coins className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-400 mt-2 font-mono">
              {metrics.pendingLoansCount} Applications
            </div>
            <span className="text-[10px] text-slate-400">Requires Disbursal Approval</span>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>IMPS/UPI Volume</span>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white mt-2 font-mono">
              {formatINR(metrics.totalTxnVolume)}
            </div>
            <span className="text-[10px] text-purple-400">{metrics.totalTxnCount} Core Ledger Entries</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 self-start w-fit">
        <button
          onClick={() => setActiveTab('loans')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'loans'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Retail Loan Approvals ({loans.filter(l => l.status === 'pending').length} Pending)
        </button>

        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'accounts'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Indian Bank Accounts & Freeze Risk Control ({accounts.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'audit'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Security Audit Trail
        </button>
      </div>

      {/* Tab 1: Loans */}
      {activeTab === 'loans' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-hidden">
          <h3 className="text-base font-bold text-white mb-4">Underwriting & Loan Disbursals (INR)</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Applicant</th>
                  <th className="pb-3 font-semibold">Purpose</th>
                  <th className="pb-3 font-semibold">Requested Principal</th>
                  <th className="pb-3 font-semibold">Tenure</th>
                  <th className="pb-3 font-semibold">Interest Rate</th>
                  <th className="pb-3 font-semibold">Monthly EMI</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5">
                      <div className="font-bold text-white">{loan.full_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">PAN: {loan.pan_number || 'N/A'} • A/C •••• {loan.account_number?.slice(-4)}</div>
                    </td>
                    <td className="py-3.5 text-slate-200">{loan.purpose}</td>
                    <td className="py-3.5 font-bold font-mono text-white">{formatINR(loan.amount)}</td>
                    <td className="py-3.5 text-slate-400">{loan.term_months} Mos</td>
                    <td className="py-3.5 text-slate-300 font-mono">{loan.interest_rate}%</td>
                    <td className="py-3.5 font-bold font-mono text-blue-400">{formatINR(loan.monthly_emi)}</td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        loan.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : loan.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      {loan.status === 'pending' ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleLoanDecision(loan.id, 'approved')}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition"
                          >
                            Approve & Disburse
                          </button>
                          <button
                            onClick={() => handleLoanDecision(loan.id, 'rejected')}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow transition"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium">Decided</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Accounts & Risk */}
      {activeTab === 'accounts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-hidden">
          <h3 className="text-base font-bold text-white mb-4">Core Retail Accounts & Risk Controls</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Account Number</th>
                  <th className="pb-3 font-semibold">Customer Name</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">IFSC Code</th>
                  <th className="pb-3 font-semibold">Balance (INR)</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Risk Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 font-mono font-semibold text-blue-400">{acc.account_number}</td>
                    <td className="py-3.5">
                      <div className="font-semibold text-white">{acc.full_name}</div>
                      <div className="text-[10px] text-slate-500">{acc.email}</div>
                    </td>
                    <td className="py-3.5 capitalize text-slate-300">{acc.account_type}</td>
                    <td className="py-3.5 font-mono text-orange-400">{acc.ifsc_code}</td>
                    <td className="py-3.5 font-bold font-mono text-white">{formatINR(acc.balance)}</td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        acc.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {acc.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleToggleFreeze(acc.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                          acc.status === 'frozen'
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30'
                        }`}
                      >
                        {acc.status === 'frozen' ? 'Unfreeze Account' : 'Freeze Account'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-hidden">
          <h3 className="text-base font-bold text-white mb-4">RBI Compliance & Security Audit Logs</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Timestamp</th>
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Action</th>
                  <th className="pb-3 font-semibold">Details</th>
                  <th className="pb-3 font-semibold text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 font-medium text-white">
                      {log.full_name || 'System / Service'}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 font-mono font-semibold text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 text-slate-300 max-w-sm truncate">
                      {log.details}
                    </td>
                    <td className="py-3 text-right font-mono text-slate-500 text-[11px]">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
