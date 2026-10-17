import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Unlock, Wifi, Sliders } from 'lucide-react';
import { formatINR } from '../utils/formatters';
import api from '../api/api';

export default function VirtualCard({ card, onRefresh }) {
  const [showSensitive, setShowSensitive] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(card.daily_limit);
  const [limitMsg, setLimitMsg] = useState('');

  const formattedNumber = showSensitive
    ? card.card_number.replace(/(\d{4})/g, '$1 ').trim()
    : `•••• •••• •••• ${card.card_number.slice(-4)}`;

  const handleToggleFreeze = async () => {
    setIsUpdating(true);
    try {
      await api.patch(`/cards/${card.id}/freeze`);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle card status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveLimit = async () => {
    try {
      await api.patch(`/cards/${card.id}/limit`, { dailyLimit });
      setLimitMsg('Limit updated!');
      setTimeout(() => {
        setLimitMsg('');
        setShowLimitModal(false);
        if (onRefresh) onRefresh();
      }, 1200);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update limit');
    }
  };

  const isRupay = card.brand === 'RuPay';
  const isMastercard = card.brand === 'Mastercard';
  const isCredit = card.card_type === 'credit';

  return (
    <div className="space-y-4">
      {/* 3D Bank Card */}
      <div className={`relative h-56 w-full rounded-2xl p-6 text-white shadow-2xl transition-all duration-300 overflow-hidden ${
        isRupay
          ? 'bg-gradient-to-tr from-slate-900 via-orange-950/40 to-emerald-950/40 border border-orange-500/30'
          : isCredit 
          ? 'bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-900 border border-indigo-500/40' 
          : 'bg-gradient-to-tr from-slate-900 via-slate-850 to-blue-950 border border-blue-500/30'
      }`}>
        {/* Frozen Overlay */}
        {card.is_frozen === 1 && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-20 flex flex-col items-center justify-center space-y-2 animate-in fade-in">
            <Lock className="w-10 h-10 text-rose-400" />
            <span className="text-sm font-bold tracking-wider text-rose-300 uppercase">Card is Blocked / Frozen</span>
            <span className="text-xs text-slate-400">Transactions are temporarily disabled</span>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-300 flex items-center gap-1.5">
              Apex Bank India
            </span>
            <div className="text-sm font-extrabold tracking-wide mt-0.5">
              {isRupay ? 'RuPay Platinum Global' : isCredit ? 'World Elite Credit' : 'Signature Debit'}
            </div>
          </div>
          <Wifi className="w-6 h-6 text-slate-400 rotate-90" />
        </div>

        {/* EMV Chip */}
        <div className="my-5 flex items-center space-x-3">
          <div className="w-11 h-8 rounded-md bg-gradient-to-tr from-amber-200 via-yellow-400 to-amber-500 shadow-md border border-amber-300/60 relative overflow-hidden flex items-center justify-center">
            <div className="w-full h-[1px] bg-amber-700/60 absolute top-2" />
            <div className="w-full h-[1px] bg-amber-700/60 absolute bottom-2" />
            <div className="h-full w-[1px] bg-amber-700/60 absolute left-3" />
            <div className="h-full w-[1px] bg-amber-700/60 absolute right-3" />
          </div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
            {isRupay ? 'RuPay Contactless' : 'EMV Chip Contactless'}
          </span>
        </div>

        {/* Card Number */}
        <div className="font-mono text-lg sm:text-xl font-bold tracking-widest drop-shadow-md">
          {formattedNumber}
        </div>

        {/* Footer Details */}
        <div className="mt-4 flex justify-between items-end">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400">Cardholder Name</div>
            <div className="text-xs font-semibold tracking-wider uppercase font-mono">
              {card.card_holder}
            </div>
          </div>

          <div className="text-center">
            <div className="text-[9px] uppercase tracking-wider text-slate-400">Expires</div>
            <div className="text-xs font-semibold font-mono">
              {String(card.expiry_month).padStart(2, '0')}/{String(card.expiry_year).slice(-2)}
            </div>
          </div>

          <div className="text-center">
            <div className="text-[9px] uppercase tracking-wider text-slate-400">CVV</div>
            <div className="text-xs font-semibold font-mono">
              {showSensitive ? card.cvv : '•••'}
            </div>
          </div>

          {/* Network Brand Logo */}
          <div className="font-extrabold italic text-right">
            {isRupay ? (
              <div className="flex items-center space-x-1 bg-white/95 px-2 py-0.5 rounded shadow">
                <span className="text-[#097138] font-black text-sm tracking-tighter">Ru</span>
                <span className="text-[#092f62] font-black text-sm tracking-tighter">Pay</span>
                <span className="text-orange-500 font-extrabold text-[10px]">❯</span>
              </div>
            ) : isMastercard ? (
              <div className="flex -space-x-2">
                <span className="w-6 h-6 rounded-full bg-rose-500/90 inline-block"></span>
                <span className="w-6 h-6 rounded-full bg-amber-500/90 inline-block"></span>
              </div>
            ) : (
              <span className="text-white text-lg font-black tracking-wider">VISA</span>
            )}
          </div>
        </div>
      </div>

      {/* Card Controls */}
      <div className="flex items-center justify-between p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs">
        <button
          onClick={() => setShowSensitive(!showSensitive)}
          className="flex items-center space-x-1.5 text-slate-300 hover:text-white transition"
        >
          {showSensitive ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
          <span>{showSensitive ? 'Hide CVV' : 'View CVV'}</span>
        </button>

        <button
          onClick={handleToggleFreeze}
          disabled={isUpdating}
          className={`flex items-center space-x-1.5 font-medium transition ${
            card.is_frozen === 1 
              ? 'text-emerald-400 hover:text-emerald-300' 
              : 'text-rose-400 hover:text-rose-300'
          }`}
        >
          {card.is_frozen === 1 ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          <span>{card.is_frozen === 1 ? 'Unfreeze Card' : 'Lock Card'}</span>
        </button>

        <button
          onClick={() => setShowLimitModal(!showLimitModal)}
          className="flex items-center space-x-1.5 text-blue-400 hover:text-blue-300 transition"
        >
          <Sliders className="w-4 h-4" />
          <span>Limit: {formatINR(card.daily_limit, false)}</span>
        </button>
      </div>

      {/* Daily Limit Modal */}
      {showLimitModal && (
        <div className="p-4 bg-slate-800/90 border border-slate-700 rounded-xl space-y-3 animate-in fade-in">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-semibold">Adjust Daily Spending Limit:</span>
            <span className="text-blue-400 font-bold">{formatINR(dailyLimit, false)}</span>
          </div>
          <input
            type="range"
            min="5000"
            max="500000"
            step="5000"
            value={dailyLimit}
            onChange={(e) => setDailyLimit(Number(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer"
          />
          <div className="flex justify-between items-center">
            {limitMsg && <span className="text-xs text-emerald-400 font-medium">{limitMsg}</span>}
            <button
              onClick={handleSaveLimit}
              className="ml-auto px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
            >
              Update Limit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
