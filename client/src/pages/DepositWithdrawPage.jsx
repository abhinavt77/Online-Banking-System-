import React, { useState } from 'react';
import { useAccount } from '../context/AccountContext';
import { formatINR } from '../utils/formatters';
import api from '../api/api';
import ReceiptModal from '../components/ReceiptModal';
import { 
  ArrowDownToLine, 
  ArrowUpRight, 
  Wallet, 
  CheckCircle2, 
  AlertCircle, 
  Building, 
  CreditCard 
} from 'lucide-react';

export default function DepositWithdrawPage() {
  const { accounts, selectedAccount, setSelectedAccount, refreshAccounts } = useAccount();

  const [activeTab, setActiveTab] = useState('deposit');
  const [selectedAccId, setSelectedAccId] = useState(selectedAccount?.id || '');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI Auto-Infeed');
  const [note, setNote] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receiptData, setReceiptData] = useState(null);

  const activeAcc = accounts.find(a => a.id === Number(selectedAccId)) || selectedAccount;

  const handleAction = async (e) => {
    e.preventDefault();
    setError('');

    const val = parseFloat(amount);
    if (!activeAcc) {
      setError('Please select an account.');
      return;
    }
    if (isNaN(val) || val <= 0) {
      setError('Please enter a positive amount in INR.');
      return;
    }
    if (activeTab === 'withdraw' && activeAcc.balance < val) {
      setError(`Insufficient balance. Current balance: ${formatINR(activeAcc.balance)}.`);
      return;
    }

    setLoading(true);
    try {
      if (activeTab === 'deposit') {
        const res = await api.post('/transactions/deposit', {
          accountId: activeAcc.id,
          amount: val,
          method,
          note: note || `${method} - Completed`
        });
        setReceiptData({
          referenceId: res.data.referenceId,
          amount: res.data.amount,
          newBalance: res.data.newBalance,
          senderAccount: 'INDIAN CLEARING GATEWAY',
          recipientAccount: activeAcc.account_number,
          recipientName: 'Direct Inflow (INR)',
          transferMode: 'UPI/NEFT',
          date: new Date().toISOString()
        });
      } else {
        const res = await api.post('/transactions/withdraw', {
          accountId: activeAcc.id,
          amount: val,
          note: note || 'ATM Cash Withdrawal'
        });
        setReceiptData({
          referenceId: res.data.referenceId,
          amount: res.data.amount,
          newBalance: res.data.newBalance,
          senderAccount: activeAcc.account_number,
          recipientAccount: 'CASH / NFS ATM',
          recipientName: 'Apex ATM Cash Dispenser',
          transferMode: 'ATM NFS',
          date: new Date().toISOString()
        });
      }

      setAmount('');
      setNote('');
      await refreshAccounts();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Operation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
          <ArrowDownToLine className="w-6 h-6 text-blue-400" />
          <span>Deposit Inflow & ATM Cash Dispensation</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Instant UPI Inward clearing, NEFT deposits, and Cash Withdrawal across National Financial Switch (NFS) ATMs.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        {/* Tab Toggle */}
        <div className="flex bg-slate-800/80 p-1 rounded-2xl mb-6 border border-slate-700/60">
          <button
            type="button"
            onClick={() => { setActiveTab('deposit'); setError(''); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 ${
              activeTab === 'deposit'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Deposit INR Funds</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('withdraw'); setError(''); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 ${
              activeTab === 'withdraw'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>ATM Cash Withdrawal</span>
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAction} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Indian Bank Account
            </label>
            <select
              value={selectedAccId || activeAcc?.id}
              onChange={(e) => {
                setSelectedAccId(e.target.value);
                const acc = accounts.find(a => a.id === Number(e.target.value));
                if (acc) setSelectedAccount(acc);
              }}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.account_type.toUpperCase()} (•••• {a.account_number.slice(-4)}) — Balance: {formatINR(a.balance)}
                </option>
              ))}
            </select>
          </div>

          {activeTab === 'deposit' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Deposit Mode / Channel
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="UPI Auto-Infeed">UPI Direct Inflow (Instant)</option>
                <option value="NEFT / RTGS Wire">NEFT / RTGS Corporate Salary Wire</option>
                <option value="Cash Deposit Machine (CDM)">Cash Deposit Machine (CDM) Infeed</option>
                <option value="Cheque CTS Clearing">Cheque Truncation System (CTS-2010)</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Amount in INR (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-lg">₹</span>
              <input
                type="number"
                min="100"
                step="100"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-lg font-bold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="flex flex-wrap gap-2 mt-2.5">
              {[500, 2000, 5000, 10000, 25000, 50000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val.toString())}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  +{formatINR(val, false)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Transaction Remark (Optional)
            </label>
            <input
              type="text"
              placeholder={activeTab === 'deposit' ? 'e.g. Consulting, Festive Gift' : 'e.g. Travel Cash, Market shopping'}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 text-white font-bold rounded-xl text-sm transition shadow-lg flex items-center justify-center space-x-2 mt-4 ${
              activeTab === 'deposit'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
            }`}
          >
            <span>{loading ? 'Processing via Indian Clearing...' : activeTab === 'deposit' ? 'Confirm Inward Deposit (INR)' : 'Dispense Cash at ATM'}</span>
          </button>
        </form>
      </div>

      <ReceiptModal
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        data={receiptData}
      />
    </div>
  );
}
