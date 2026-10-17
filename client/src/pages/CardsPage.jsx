import React, { useState, useEffect } from 'react';
import { useAccount } from '../context/AccountContext';
import { formatINR } from '../utils/formatters';
import api from '../api/api';
import VirtualCard from '../components/VirtualCard';
import { 
  CreditCard, 
  PlusCircle, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  SlidersHorizontal,
  CheckCircle2,
  X
} from 'lucide-react';

export default function CardsPage() {
  const { accounts, selectedAccount } = useAccount();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  // New card modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [cardBrand, setCardBrand] = useState('RuPay');
  const [cardType, setCardType] = useState('debit');
  const [targetAccId, setTargetAccId] = useState(selectedAccount?.id || '');
  const [issuing, setIssuing] = useState(false);

  const loadCards = async () => {
    try {
      const res = await api.get('/cards');
      setCards(res.data.cards || []);
    } catch (err) {
      console.error('Error fetching cards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const handleIssueCard = async (e) => {
    e.preventDefault();
    setIssuing(true);
    try {
      const activeId = targetAccId || selectedAccount?.id || accounts[0]?.id;
      await api.post('/cards', {
        accountId: activeId,
        cardType,
        brand: cardBrand
      });
      setShowIssueModal(false);
      await loadCards();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to issue card');
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
            <CreditCard className="w-6 h-6 text-blue-400" />
            <span>RuPay & International Cards Center</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your EMV Contactless RuPay, Visa, and Mastercard debit & credit cards with dynamic INR limits.
          </p>
        </div>

        <button
          onClick={() => setShowIssueModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Issue New RuPay Card</span>
        </button>
      </div>

      {/* Cards Display Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          Loading cards...
        </div>
      ) : cards.length === 0 ? (
        <div className="py-16 text-center bg-slate-900 border border-slate-800 rounded-3xl p-8">
          <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No active cards found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            You do not currently have any virtual cards. Click below to issue an instant RuPay Platinum card.
          </p>
          <button
            onClick={() => setShowIssueModal(true)}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
          >
            Issue Instant RuPay Card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {cards.map((card) => (
            <div key={card.id} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <VirtualCard card={card} onRefresh={loadCards} />
            </div>
          ))}
        </div>
      )}

      {/* Security Features Showcase Banner */}
      <div className="mt-8 p-6 bg-slate-900 border border-slate-800 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Instant Card Kill Switch</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Misplaced your card? Freeze and unlock domestic POS/ATM usage instantly.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">RBI Tokenization Safety</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Compliant with RBI digital payment tokenization guidelines for safe shopping.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Custom INR Limits</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Set domestic transaction limits from ₹5,000 up to ₹5,00,000 in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Issue Card Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative">
            <button
              onClick={() => setShowIssueModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white">Issue Digital Virtual Card</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              Instant generation ready for UPI linking, online shopping, and contactless payments.
            </p>

            <form onSubmit={handleIssueCard} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Card Network</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCardBrand('RuPay')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      cardBrand === 'RuPay'
                        ? 'bg-orange-600/20 border-orange-500 text-orange-400 shadow'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    RuPay Global
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardBrand('Visa')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      cardBrand === 'Visa'
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    VISA Signature
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardBrand('Mastercard')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      cardBrand === 'Mastercard'
                        ? 'bg-amber-600/20 border-amber-500 text-white shadow'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    Mastercard
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Card Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCardType('debit')}
                    className={`p-3 rounded-xl border text-center font-bold transition ${
                      cardType === 'debit'
                        ? 'bg-emerald-600/20 border-emerald-500 text-white shadow'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    Debit (Bank Balance)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardType('credit')}
                    className={`p-3 rounded-xl border text-center font-bold transition ${
                      cardType === 'credit'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    Credit (₹2.5L Line)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Linked Bank Account</label>
                <select
                  value={targetAccId || selectedAccount?.id}
                  onChange={(e) => setTargetAccId(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 text-xs"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.account_type.toUpperCase()} (•••• {a.account_number.slice(-4)}) — Balance: {formatINR(a.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issuing}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30"
                >
                  {issuing ? 'Generating RuPay EMV...' : 'Issue Card Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
