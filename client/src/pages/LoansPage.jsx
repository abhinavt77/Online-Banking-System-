import React, { useState, useEffect } from 'react';
import { useAccount } from '../context/AccountContext';
import { formatINR } from '../utils/formatters';
import api from '../api/api';
import { 
  Coins, 
  Calculator, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Percent, 
  TrendingUp, 
  Calendar,
  X 
} from 'lucide-react';

export default function LoansPage() {
  const { accounts, selectedAccount, refreshAccounts } = useAccount();

  const [activeTab, setActiveTab] = useState('loans');
  const [loans, setLoans] = useState([]);
  const [fds, setFds] = useState([]);
  const [loading, setLoading] = useState(true);

  // EMI Calculator State in INR
  const [calcAmount, setCalcAmount] = useState(500000); // 5 Lakhs
  const [calcMonths, setCalcMonths] = useState(36);

  // Loan Application Modal
  const [showApplyLoan, setShowApplyLoan] = useState(false);
  const [loanPurpose, setLoanPurpose] = useState('Electric Vehicle Loan (Tata Nexon EV)');
  const [applyAmount, setApplyAmount] = useState(500000);
  const [applyTerm, setApplyTerm] = useState(36);
  const [targetAccId, setTargetAccId] = useState(selectedAccount?.id || '');
  const [submittingLoan, setSubmittingLoan] = useState(false);
  const [loanSuccessMsg, setLoanSuccessMsg] = useState('');

  // FD Modal State
  const [showOpenFd, setShowOpenFd] = useState(false);
  const [fdAmount, setFdAmount] = useState(100000); // 1 Lakh
  const [fdMonths, setFdMonths] = useState(12);
  const [fdAccId, setFdAccId] = useState(selectedAccount?.id || '');
  const [submittingFd, setSubmittingFd] = useState(false);
  const [fdSuccessMsg, setFdSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      const [loansRes, fdsRes] = await Promise.all([
        api.get('/loans'),
        api.get('/loans/fixed-deposits')
      ]);
      setLoans(loansRes.data.loans || []);
      setFds(fdsRes.data.fixedDeposits || []);
    } catch (err) {
      console.error('Error fetching loans & FDs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const calcRate = calcMonths <= 24 ? 8.25 : calcMonths <= 36 ? 8.75 : 9.5;
  const r = calcRate / 12 / 100;
  const calcMonthlyEmi = (calcAmount * r * Math.pow(1 + r, calcMonths)) / (Math.pow(1 + r, calcMonths) - 1) || 0;
  const calcTotalPayable = calcMonthlyEmi * calcMonths;
  const calcTotalInterest = calcTotalPayable - calcAmount;

  const handleApplyLoan = async (e) => {
    e.preventDefault();
    setSubmittingLoan(true);
    try {
      const activeId = targetAccId || selectedAccount?.id || accounts[0]?.id;
      const res = await api.post('/loans', {
        accountId: activeId,
        amount: parseFloat(applyAmount),
        termMonths: parseInt(applyTerm, 10),
        purpose: loanPurpose
      });
      setLoanSuccessMsg(res.data.message);
      setTimeout(() => {
        setLoanSuccessMsg('');
        setShowApplyLoan(false);
      }, 1500);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit loan application');
    } finally {
      setSubmittingLoan(false);
    }
  };

  const handleOpenFd = async (e) => {
    e.preventDefault();
    setSubmittingFd(true);
    try {
      const activeId = fdAccId || selectedAccount?.id || accounts[0]?.id;
      const res = await api.post('/loans/fixed-deposits', {
        accountId: activeId,
        amount: parseFloat(fdAmount),
        tenureMonths: parseInt(fdMonths, 10)
      });
      setFdSuccessMsg(res.data.message);
      setTimeout(() => {
        setFdSuccessMsg('');
        setShowOpenFd(false);
      }, 1500);
      await refreshAccounts();
      await loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to open Fixed Deposit');
    } finally {
      setSubmittingFd(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
            <Coins className="w-6 h-6 text-blue-400" />
            <span>Retail Loans & Term Fixed Deposits (INR)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Calculate EMI schedules, apply for personal/vehicle credit, or book high-yield Fixed Deposits up to 8.25% APY.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('loans')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'loans'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Retail Loans & EMI
          </button>
          <button
            onClick={() => setActiveTab('fd')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'fd'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Fixed Deposits (FD)
          </button>
        </div>
      </div>

      {activeTab === 'loans' ? (
        <div className="space-y-6">
          {/* Interactive Loan EMI Calculator */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center space-x-2 mb-6">
              <Calculator className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold text-white">Interactive Indian Loan & EMI Estimator</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold mb-2">
                    <span className="text-slate-300">Loan Principal Amount:</span>
                    <span className="text-lg font-bold text-blue-400 font-mono">
                      {formatINR(calcAmount, false)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50000"
                    max="5000000"
                    step="25000"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>₹50,000</span>
                    <span>₹25,00,000 (25L)</span>
                    <span>₹50,00,000 (50L)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-semibold mb-2">
                    <span className="text-slate-300">Tenure (Tenor in Months):</span>
                    <span className="text-lg font-bold text-indigo-400 font-mono">
                      {calcMonths} Months ({Math.round(calcMonths / 12 * 10) / 10} Years)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="60"
                    step="6"
                    value={calcMonths}
                    onChange={(e) => setCalcMonths(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>12 Months</span>
                    <span>36 Months (3 Yrs)</span>
                    <span>60 Months (5 Yrs)</span>
                  </div>
                </div>
              </div>

              {/* Calculator Output Card */}
              <div className="p-5 bg-slate-800/80 border border-slate-700/60 rounded-2xl space-y-4 text-center">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Estimated Monthly EMI</span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
                    {formatINR(calcMonthlyEmi)}
                  </div>
                  <span className="text-[10px] text-emerald-400 font-medium">@ {calcRate}% Annual APR</span>
                </div>

                <div className="pt-3 border-t border-slate-700/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Total Interest</span>
                    <span className="font-bold text-slate-200">{formatINR(calcTotalInterest)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Total Repayment</span>
                    <span className="font-bold text-slate-200">{formatINR(calcTotalPayable)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setApplyAmount(calcAmount);
                    setApplyTerm(calcMonths);
                    setShowApplyLoan(true);
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-blue-600/30"
                >
                  Apply for this Loan
                </button>
              </div>
            </div>
          </div>

          {/* Active Loans Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white">Your Loan Applications & History</h3>
              <button
                onClick={() => setShowApplyLoan(true)}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-1"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Application</span>
              </button>
            </div>

            {loans.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                You have no active or pending loans.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="pb-3 font-semibold">Purpose</th>
                      <th className="pb-3 font-semibold">Principal (INR)</th>
                      <th className="pb-3 font-semibold">Term</th>
                      <th className="pb-3 font-semibold">Rate</th>
                      <th className="pb-3 font-semibold">Monthly EMI</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {loans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 font-medium text-white">{loan.purpose}</td>
                        <td className="py-3.5 font-bold font-mono text-slate-200">{formatINR(loan.amount)}</td>
                        <td className="py-3.5 text-slate-400">{loan.term_months} Months</td>
                        <td className="py-3.5 text-slate-300 font-mono">{loan.interest_rate}%</td>
                        <td className="py-3.5 font-bold font-mono text-blue-400">{formatINR(loan.monthly_emi)}</td>
                        <td className="py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            loan.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : loan.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {loan.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Fixed Deposits (FD) View */
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  DICGC Insured Deposits
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  High-Yield Fixed Term Deposits (INR)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Lock in rates up to 8.25% APY. Insured up to ₹5,00,000 under DICGC (RBI subsidiary).
                </p>
              </div>

              <button
                onClick={() => setShowOpenFd(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 transition self-start sm:self-auto"
              >
                Open Fixed Deposit (FD)
              </button>
            </div>

            {/* Interest Rates Ladder */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl text-center">
                <span className="text-xs text-slate-400">Short-Term (3-6 Mos)</span>
                <div className="text-2xl font-black text-white mt-1">6.00%</div>
                <span className="text-[10px] text-emerald-400">Guaranteed APY</span>
              </div>

              <div className="p-4 bg-emerald-600/15 border border-emerald-500/30 rounded-2xl text-center">
                <span className="text-xs text-emerald-300 font-semibold">1 Year Term (12 Mos)</span>
                <div className="text-2xl font-black text-white mt-1">7.50%</div>
                <span className="text-[10px] text-emerald-400">Most Popular for Tax Savers</span>
              </div>

              <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl text-center">
                <span className="text-xs text-slate-400">Long-Term (24-36 Mos)</span>
                <div className="text-2xl font-black text-white mt-1">8.25%</div>
                <span className="text-[10px] text-emerald-400">Maximum Yield Payout</span>
              </div>
            </div>
          </div>

          {/* Active FDs Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4">Your Active Term Fixed Deposits</h3>

            {fds.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                You have no active fixed deposits. Open one to start earning guaranteed interest!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="pb-3 font-semibold">FD Receipt No</th>
                      <th className="pb-3 font-semibold">Principal (INR)</th>
                      <th className="pb-3 font-semibold">Annual Rate</th>
                      <th className="pb-3 font-semibold">Tenure</th>
                      <th className="pb-3 font-semibold">Maturity Payout</th>
                      <th className="pb-3 font-semibold">Maturity Date</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {fds.map((fd) => (
                      <tr key={fd.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 font-mono text-slate-300">FD-IN-{fd.id.toString().padStart(4, '0')}</td>
                        <td className="py-3.5 font-bold font-mono text-white">{formatINR(fd.principal_amount)}</td>
                        <td className="py-3.5 text-emerald-400 font-semibold">{fd.interest_rate}%</td>
                        <td className="py-3.5 text-slate-400">{fd.tenure_months} Mos</td>
                        <td className="py-3.5 font-bold font-mono text-emerald-400">{formatINR(fd.maturity_amount)}</td>
                        <td className="py-3.5 text-slate-300 font-mono">{fd.maturity_date}</td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                            {fd.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loan Apply Modal */}
      {showApplyLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative">
            <button onClick={() => setShowApplyLoan(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white">Apply for Retail Loan (INR)</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Submitted applications are reviewed by Bank Underwriting for automated disbursal.
            </p>

            {loanSuccessMsg && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{loanSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleApplyLoan} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Disbursal Bank Account</label>
                <select
                  value={targetAccId || selectedAccount?.id}
                  onChange={(e) => setTargetAccId(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.account_type.toUpperCase()} (•••• {a.account_number.slice(-4)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Loan Purpose</label>
                <input
                  type="text"
                  required
                  value={loanPurpose}
                  onChange={(e) => setLoanPurpose(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Principal Amount (₹)</label>
                  <input
                    type="number"
                    min="25000"
                    max="10000000"
                    required
                    value={applyAmount}
                    onChange={(e) => setApplyAmount(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tenure</label>
                  <select
                    value={applyTerm}
                    onChange={(e) => setApplyTerm(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="12">12 Months (8.25%)</option>
                    <option value="24">24 Months (8.25%)</option>
                    <option value="36">36 Months (8.75%)</option>
                    <option value="48">48 Months (9.50%)</option>
                    <option value="60">60 Months (9.50%)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowApplyLoan(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLoan}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30"
                >
                  {submittingLoan ? 'Submitting Application...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Open FD Modal */}
      {showOpenFd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative">
            <button onClick={() => setShowOpenFd(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white">Book Fixed Term Deposit</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Funds will be debited from your savings account and booked under DICGC protection.
            </p>

            {fdSuccessMsg && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{fdSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleOpenFd} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Funding Account</label>
                <select
                  value={fdAccId || selectedAccount?.id}
                  onChange={(e) => setFdAccId(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.account_type.toUpperCase()} (•••• {a.account_number.slice(-4)}) — Balance: {formatINR(a.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Deposit Principal in INR (₹)</label>
                <input
                  type="number"
                  min="5000"
                  max="5000000"
                  step="5000"
                  required
                  value={fdAmount}
                  onChange={(e) => setFdAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Lock-in Period</label>
                <select
                  value={fdMonths}
                  onChange={(e) => setFdMonths(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="6">6 Months — 6.0% APY</option>
                  <option value="12">12 Months — 7.5% APY</option>
                  <option value="24">24 Months — 8.25% APY</option>
                </select>
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowOpenFd(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFd}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30"
                >
                  {submittingFd ? 'Booking Deposit...' : 'Confirm Term Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
