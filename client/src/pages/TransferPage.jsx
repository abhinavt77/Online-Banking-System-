import React, { useState, useEffect } from 'react';
import { useAccount } from '../context/AccountContext';
import { formatINR } from '../utils/formatters';
import api from '../api/api';
import PinModal from '../components/PinModal';
import ReceiptModal from '../components/ReceiptModal';
import { 
  Send, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Lock, 
  Wallet, 
  ShieldCheck, 
  UserCheck, 
  Loader2,
  Smartphone,
  Building
} from 'lucide-react';

export default function TransferPage() {
  const { accounts, selectedAccount, setSelectedAccount, refreshAccounts } = useAccount();

  // Form states
  const [sourceId, setSourceId] = useState(selectedAccount?.id || '');
  const [destIdentifier, setDestIdentifier] = useState('');
  const [transferMode, setTransferMode] = useState('IMPS');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [beneficiaries, setBeneficiaries] = useState([]);

  // Recipient verification state
  const [lookingUp, setLookingUp] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState(null);
  const [lookupError, setLookupError] = useState('');

  // Modals
  const [showPinModal, setShowPinModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedAccount && !sourceId) {
      setSourceId(selectedAccount.id);
    }
  }, [selectedAccount]);

  useEffect(() => {
    async function loadBeneficiaries() {
      try {
        const res = await api.get('/beneficiaries');
        setBeneficiaries(res.data.beneficiaries || []);
      } catch (err) {
        console.error('Error fetching beneficiaries:', err);
      }
    }
    loadBeneficiaries();
  }, []);

  // Live account / UPI lookup
  useEffect(() => {
    const cleaned = destIdentifier.trim();
    const isUpi = cleaned.includes('@');
    const isAcc = cleaned.length === 12 && /^\d+$/.test(cleaned);

    if (isAcc || isUpi) {
      setLookingUp(true);
      setLookupError('');
      setRecipientInfo(null);

      const timer = setTimeout(async () => {
        try {
          const res = await api.get(`/accounts/lookup/${encodeURIComponent(cleaned)}`);
          setRecipientInfo(res.data);
        } catch (err) {
          setLookupError(err.response?.data?.error || 'Beneficiary not found.');
          setRecipientInfo(null);
        } finally {
          setLookingUp(false);
        }
      }, 350);

      return () => clearTimeout(timer);
    } else {
      setRecipientInfo(null);
      setLookupError('');
    }
  }, [destIdentifier]);

  const activeSource = accounts.find(a => a.id === Number(sourceId)) || selectedAccount;

  const handleInitiateTransfer = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const transferAmt = parseFloat(amount);
    if (!activeSource) {
      setErrorMsg('Please select a funding bank account.');
      return;
    }
    if (isNaN(transferAmt) || transferAmt <= 0) {
      setErrorMsg('Please enter a valid transfer amount in INR.');
      return;
    }
    if (activeSource.balance < transferAmt) {
      setErrorMsg(`Insufficient funds. Your available balance is ${formatINR(activeSource.balance)}.`);
      return;
    }
    if (!destIdentifier) {
      setErrorMsg('Please provide a 12-digit Account Number or UPI ID.');
      return;
    }
    if (destIdentifier.trim() === activeSource.account_number || destIdentifier.trim() === activeSource.upi_id) {
      setErrorMsg('Cannot transfer money to the same account.');
      return;
    }

    setShowPinModal(true);
  };

  const handleConfirmPin = async (enteredPin) => {
    setShowPinModal(false);
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.post('/transactions/transfer', {
        sourceAccountId: activeSource.id,
        destinationAccountNumber: destIdentifier.trim(),
        transferMode,
        amount: parseFloat(amount),
        description: note || `${transferMode} Fund Transfer`,
        pin: enteredPin
      });

      setReceiptData(res.data.transfer);
      setAmount('');
      setNote('');
      setDestIdentifier('');
      setRecipientInfo(null);
      await refreshAccounts();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Transfer failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAddAmount = (addVal) => {
    const cur = parseFloat(amount) || 0;
    setAmount((cur + addVal).toString());
  };

  const handleSetMax = () => {
    if (activeSource) {
      setAmount(activeSource.balance.toString());
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
          <Send className="w-6 h-6 text-blue-400" />
          <span>IMPS & UPI Instant Fund Transfer</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Atomic instant settlements in Indian Rupees (INR) across all Indian banks with zero processing fees.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Transfer Form */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleInitiateTransfer} className="space-y-5">
            {/* Transfer Mode Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Payment Channel / Mode
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['IMPS', 'UPI', 'NEFT', 'RTGS'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTransferMode(m)}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      transferMode === m
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {m} {m === 'IMPS' ? '(24x7)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Funding Account Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Debit From Account
              </label>
              <select
                value={sourceId}
                onChange={(e) => {
                  setSourceId(e.target.value);
                  const acc = accounts.find(a => a.id === Number(e.target.value));
                  if (acc) setSelectedAccount(acc);
                }}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.account_type.toUpperCase()} (•••• {a.account_number.slice(-4)}) — Available: {formatINR(a.balance)}
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient Account or UPI Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Beneficiary 12-Digit A/C No. OR UPI ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. 501008821944 or priya@okhdfcbank"
                  value={destIdentifier}
                  onChange={(e) => setDestIdentifier(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono tracking-wider"
                />
                {lookingUp && (
                  <div className="absolute right-3.5 top-3.5 text-blue-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                )}
              </div>

              {/* Verified Recipient Box */}
              {recipientInfo && (
                <div className="mt-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center space-x-2.5 text-xs text-emerald-400 animate-in fade-in">
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="font-bold text-white text-xs">{recipientInfo.recipientName}</div>
                    <div className="text-[10px] text-emerald-300/90 font-mono">
                      IFSC: {recipientInfo.ifscCode} • {recipientInfo.branchName}
                    </div>
                  </div>
                </div>
              )}

              {lookupError && (
                <div className="mt-2 text-xs text-rose-400 flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{lookupError}</span>
                </div>
              )}
            </div>

            {/* Amount in INR */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Transfer Amount in INR (₹)
                </label>
                <button
                  type="button"
                  onClick={handleSetMax}
                  className="text-[11px] font-bold text-blue-400 hover:text-blue-300"
                >
                  Send Full Balance
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-lg">₹</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-lg font-bold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Quick Amount Chips in INR */}
              <div className="flex flex-wrap gap-2 mt-2.5">
                {[500, 2000, 5000, 10000, 25000, 50000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAddAmount(val)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition"
                  >
                    +{formatINR(val, false)}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Memo */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Payment Remark / Memo (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Rent, College Fee, Freelance, Festival Gift"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 mt-4"
            >
              <span>{isSubmitting ? 'Verifying with NPCI Gateway...' : `Proceed to Pay ${amount ? formatINR(amount) : 'INR'}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Saved Beneficiaries Quick Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2 mb-3">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Saved Beneficiaries ({beneficiaries.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Click any contact to autofill their Account Number or UPI ID.
            </p>

            <div className="space-y-2.5">
              {beneficiaries.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setDestIdentifier(b.upi_id || b.account_number)}
                  className="w-full p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-750 rounded-xl flex items-center justify-between text-left transition group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center text-xs group-hover:bg-blue-600 group-hover:text-white transition">
                      {b.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-blue-300">
                        {b.nickname || b.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {b.upi_id || `A/C: ${b.account_number}`}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-blue-400 font-medium">Select</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 bg-slate-800/40 border border-slate-750 rounded-2xl">
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>NPCI / RBI Secure Settlement</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Every transaction is protected by atomic ACID consistency and authenticated with your 4-digit PIN.
            </p>
          </div>
        </div>
      </div>

      {/* PIN Security Modal */}
      <PinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onConfirm={handleConfirmPin}
        title="Enter 4-Digit UPI / Security PIN"
        message={`Authorize payment of ${formatINR(amount || 0)} via ${transferMode} to ${recipientInfo ? recipientInfo.recipientName : destIdentifier}.`}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        data={receiptData}
      />
    </div>
  );
}
