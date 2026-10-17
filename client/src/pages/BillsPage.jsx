import React, { useState } from 'react';
import { useAccount } from '../context/AccountContext';
import { formatINR } from '../utils/formatters';
import api from '../api/api';
import ReceiptModal from '../components/ReceiptModal';
import { 
  Zap, 
  Droplet, 
  Wifi, 
  Smartphone, 
  Receipt, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  Car 
} from 'lucide-react';

export default function BillsPage() {
  const { accounts, selectedAccount, refreshAccounts } = useAccount();

  const [category, setCategory] = useState('electricity');
  const [billerName, setBillerName] = useState('BESCOM Bangalore Electricity');
  const [consumerNumber, setConsumerNumber] = useState('BESCOM-993812');
  const [amount, setAmount] = useState('3450.00');
  const [selectedAccId, setSelectedAccId] = useState(selectedAccount?.id || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receiptData, setReceiptData] = useState(null);

  const categories = [
    { id: 'electricity', label: 'Electricity (Power)', icon: Zap, color: 'text-amber-400 bg-amber-500/10' },
    { id: 'broadband', label: 'Broadband / Fiber', icon: Wifi, color: 'text-indigo-400 bg-indigo-500/10' },
    { id: 'mobile', label: 'Mobile Prepaid / DTH', icon: Smartphone, color: 'text-emerald-400 bg-emerald-500/10' },
    { id: 'water', label: 'Water Utility (DJB)', icon: Droplet, color: 'text-cyan-400 bg-cyan-500/10' },
  ];

  const billerPresets = {
    electricity: [
      { name: 'BESCOM Bangalore Electricity', ref: 'BESCOM-993812', due: '3450.00' },
      { name: 'Tata Power Mumbai Distribution', ref: 'TATAPOW-55441', due: '2840.50' },
      { name: 'BSES Rajdhani Power Delhi', ref: 'BSES-DEL-10291', due: '4120.00' },
    ],
    broadband: [
      { name: 'Reliance JioFiber Gigabit', ref: 'JIOFIB-884129', due: '1199.00' },
      { name: 'Airtel Xstream Fiber Broadband', ref: 'AIRTEL-772188', due: '999.00' },
      { name: 'ACT Fibernet Lightning', ref: 'ACT-BLR-44120', due: '825.00' },
    ],
    mobile: [
      { name: 'Jio 5G True Unlimited 84 Days', ref: '9820144552', due: '749.00' },
      { name: 'Airtel 5G Postpaid Family Plan', ref: '9811054321', due: '1199.00' },
      { name: 'NHAI FASTag Toll Recharge', ref: 'FASTAG-DL01AB9921', due: '1000.00' },
    ],
    water: [
      { name: 'Delhi Jal Board (DJB)', ref: 'DJB-WAT-331290', due: '680.00' },
      { name: 'Bangalore Water Supply (BWSSB)', ref: 'BWSSB-77182', due: '840.00' },
    ]
  };

  const handleCategoryChange = (catId) => {
    setCategory(catId);
    const presets = billerPresets[catId] || [];
    if (presets.length > 0) {
      setBillerName(presets[0].name);
      setConsumerNumber(presets[0].ref);
      setAmount(presets[0].due);
    }
  };

  const handleSelectPreset = (p) => {
    setBillerName(p.name);
    setConsumerNumber(p.ref);
    setAmount(p.due);
  };

  const handlePayBill = async (e) => {
    e.preventDefault();
    setError('');

    const activeAcc = accounts.find(a => a.id === Number(selectedAccId)) || selectedAccount;
    const payAmt = parseFloat(amount);

    if (!activeAcc) {
      setError('Please select an account for payment.');
      return;
    }
    if (isNaN(payAmt) || payAmt <= 0) {
      setError('Please enter a valid bill amount in INR.');
      return;
    }
    if (activeAcc.balance < payAmt) {
      setError(`Insufficient balance. Account balance is ${formatINR(activeAcc.balance)}.`);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/transactions/bill-pay', {
        accountId: activeAcc.id,
        billerName,
        billCategory: category.toUpperCase(),
        billerAccountNumber: consumerNumber,
        amount: payAmt
      });

      setReceiptData({
        referenceId: res.data.referenceId,
        amount: payAmt,
        newBalance: res.data.newBalance,
        senderAccount: activeAcc.account_number,
        recipientAccount: consumerNumber,
        recipientName: billerName,
        transferMode: 'Bharat BillPay (BBPS)',
        date: new Date().toISOString()
      });

      await refreshAccounts();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Bill payment failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
          <Receipt className="w-6 h-6 text-blue-400" />
          <span>Bharat BillPay (BBPS) Utilities & Recharges</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Unified Indian utility settlements powered by NPCI Bharat Bill Payment System with instant clearance.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {categories.map((c) => {
          const Icon = c.icon;
          const isSel = category === c.id;
          return (
            <button
              key={c.id}
              onClick={() => handleCategoryChange(c.id)}
              className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                isSel
                  ? 'bg-blue-600/20 border-blue-500/50 shadow-lg shadow-blue-500/10'
                  : 'bg-slate-900 border-slate-800 hover:bg-slate-850'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">{c.label}</span>
                <span className="text-[10px] text-slate-400">BBPS Instant</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Form */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handlePayBill} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Debit From Indian Bank Account
              </label>
              <select
                value={selectedAccId || selectedAccount?.id}
                onChange={(e) => setSelectedAccId(e.target.value)}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.account_type.toUpperCase()} (•••• {a.account_number.slice(-4)}) — Balance: {formatINR(a.balance)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Biller Organization (BBPS Registered)
              </label>
              <input
                type="text"
                required
                value={billerName}
                onChange={(e) => setBillerName(e.target.value)}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Consumer CA Number / Mobile / FASTag ID
              </label>
              <input
                type="text"
                required
                placeholder="e.g. BESCOM-993812"
                value={consumerNumber}
                onChange={(e) => setConsumerNumber(e.target.value)}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Bill Due Amount (INR ₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-lg">₹</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-lg font-bold text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 mt-4"
            >
              <span>{loading ? 'Processing via BBPS...' : `Authorize & Settle ${formatINR(amount || 0)}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Quick Sample Bills Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-2">Available Indian Bills to Settle</h3>
            <p className="text-xs text-slate-400 mb-4">
              Click a sample utility bill to auto-populate consumer info and due amount.
            </p>

            <div className="space-y-3">
              {(billerPresets[category] || []).map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectPreset(p)}
                  className="p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700 rounded-xl cursor-pointer transition group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-blue-300">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Ref: {p.ref}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-white font-mono">
                        {formatINR(p.due)}
                      </div>
                      <span className="text-[10px] text-amber-400">Due Now</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-3.5 bg-slate-850 rounded-2xl border border-slate-800 text-xs text-slate-400">
            <strong>BBPS Clearance:</strong> All payments made via Apex Bank reflect on utility discom servers within 15 seconds.
          </div>
        </div>
      </div>

      <ReceiptModal
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        data={receiptData}
      />
    </div>
  );
}
