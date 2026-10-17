import React from 'react';
import { CheckCircle2, Download, Printer, X, Copy, Check } from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function ReceiptModal({ isOpen, onClose, data }) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !data) return null;

  const copyRef = () => {
    navigator.clipboard.writeText(data.referenceId || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Icon Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-400">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h3 className="text-xl font-bold text-white">Payment Successful</h3>
          <p className="text-xs text-slate-400 mt-1">
            Processed via National Financial Network ({data.transferMode || 'IMPS'} 24x7 Instant).
          </p>
        </div>

        {/* Amount Highlight */}
        <div className="my-6 p-4 bg-slate-800/80 border border-slate-700/60 rounded-2xl text-center">
          <div className="text-xs text-slate-400 font-medium">Transaction Amount</div>
          <div className="text-3xl font-extrabold text-white mt-1">
            {formatINR(data.amount)}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium mt-1">
            Status: Completed (NPCI / RBI Clearance)
          </div>
        </div>

        {/* Details Table */}
        <div className="space-y-3 text-xs border-y border-slate-800 py-4 my-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Reference (UTR) No:</span>
            <button 
              onClick={copyRef}
              className="flex items-center space-x-1.5 font-mono text-blue-400 font-semibold hover:text-blue-300"
            >
              <span>{data.referenceId}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Payment Channel:</span>
            <span className="font-semibold text-blue-400">{data.transferMode || 'IMPS 24x7'}</span>
          </div>

          {data.senderAccount && (
            <div className="flex justify-between">
              <span className="text-slate-400">Debited From A/C:</span>
              <span className="font-mono text-slate-200">•••• {data.senderAccount.slice(-4)}</span>
            </div>
          )}

          {data.recipientAccount && (
            <div className="flex justify-between">
              <span className="text-slate-400">Credited To A/C:</span>
              <span className="font-mono text-slate-200">•••• {data.recipientAccount.slice(-4)}</span>
            </div>
          )}

          {data.recipientName && (
            <div className="flex justify-between">
              <span className="text-slate-400">Beneficiary Name:</span>
              <span className="font-medium text-slate-100">{data.recipientName}</span>
            </div>
          )}

          {data.recipientUpi && (
            <div className="flex justify-between">
              <span className="text-slate-400">Beneficiary UPI ID:</span>
              <span className="font-mono text-emerald-400">{data.recipientUpi}</span>
            </div>
          )}

          {data.newBalance !== undefined && (
            <div className="flex justify-between">
              <span className="text-slate-400">Available Balance:</span>
              <span className="font-bold text-white">
                {formatINR(data.newBalance)}
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-slate-400">Timestamp:</span>
            <span className="text-slate-300">
              {new Date().toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium rounded-xl text-xs flex items-center justify-center space-x-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-blue-600/30"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
