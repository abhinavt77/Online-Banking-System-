import React, { useState } from 'react';
import { Lock, X, AlertCircle } from 'lucide-react';

export default function PinModal({ isOpen, onClose, onConfirm, title = 'Authorization Required', message = 'Please enter your 4-digit Transaction Security PIN to confirm this action.' }) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (index, val) => {
    if (!/^\d*$/.test(val)) return;
    const newPin = [...pin];
    newPin[index] = val.slice(-1);
    setPin(newPin);
    setError('');

    // Auto-focus next input
    if (val && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerify = () => {
    const enteredPin = pin.join('');
    if (enteredPin.length !== 4) {
      setError('Please enter all 4 digits of your Security PIN.');
      return;
    }
    onConfirm(enteredPin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-400">
          <Lock className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-center text-white">{title}</h3>
        <p className="text-xs text-slate-400 text-center mt-1.5 leading-relaxed">
          {message}
        </p>

        {/* PIN Inputs */}
        <div className="flex justify-center space-x-3 my-6">
          {pin.map((digit, index) => (
            <input
              key={index}
              id={`pin-${index}`}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 text-center text-2xl font-bold bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              autoFocus={index === 0}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center space-x-1.5 text-xs text-rose-400 justify-center mb-4">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="text-center text-[11px] text-slate-500 mb-5">
          Default Demo PIN is <span className="text-blue-400 font-mono font-bold">1234</span>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium rounded-xl text-sm transition"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-blue-600/30"
          >
            Authorize
          </button>
        </div>
      </div>
    </div>
  );
}
