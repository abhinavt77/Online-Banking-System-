import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Send, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Smartphone,
  CreditCard 
} from 'lucide-react';

export default function BeneficiariesPage({ onNavigateToTransfer }) {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('APEX0001021');
  const [upiId, setUpiId] = useState('');
  const [nickname, setNickname] = useState('');
  const [bankName, setBankName] = useState('Apex Bank');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadBeneficiaries = async () => {
    try {
      const res = await api.get('/beneficiaries');
      setBeneficiaries(res.data.beneficiaries || []);
    } catch (err) {
      console.error('Error loading beneficiaries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBeneficiaries();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      await api.post('/beneficiaries', {
        name,
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim(),
        upiId: upiId.trim(),
        nickname: nickname || name,
        bankName
      });
      setShowAddModal(false);
      setName('');
      setAccountNumber('');
      setUpiId('');
      setNickname('');
      await loadBeneficiaries();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to add beneficiary.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this beneficiary?')) return;
    try {
      await api.delete(`/beneficiaries/${id}`);
      await loadBeneficiaries();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
            <Users className="w-6 h-6 text-blue-400" />
            <span>Frequent Beneficiaries & UPI Contacts</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Save verified Indian bank accounts and Virtual Payment Addresses (UPI VPA) for single-click payments.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Beneficiary / UPI</span>
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading contacts...</div>
      ) : beneficiaries.length === 0 ? (
        <div className="py-16 text-center bg-slate-900 border border-slate-800 rounded-3xl p-8">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No saved beneficiaries</h3>
          <p className="text-xs text-slate-400 mt-1">
            Add frequent transfer recipients to speed up checkout.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
          >
            Add Payee
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {beneficiaries.map((b) => (
            <div
              key={b.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 via-blue-600 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {b.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">
                        {b.nickname || b.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {b.name}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(b.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                    title="Remove Payee"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 p-3 bg-slate-800/60 border border-slate-750 rounded-xl space-y-1.5 text-xs font-mono">
                  {b.upi_id && (
                    <div className="flex justify-between items-center text-slate-400 text-[10px]">
                      <span>UPI ID:</span>
                      <span className="text-emerald-400 font-bold font-sans">{b.upi_id}</span>
                    </div>
                  )}
                  {b.account_number && (
                    <div className="flex justify-between items-center text-slate-400 text-[10px]">
                      <span>A/C Number:</span>
                      <span className="text-blue-300 font-semibold">{b.account_number}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-slate-400 text-[10px]">
                    <span>Bank & IFSC:</span>
                    <span className="text-orange-400 font-sans">{b.bank_name || 'Apex Bank'} ({b.ifsc_code || 'APEX0001021'})</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => onNavigateToTransfer(b.upi_id || b.account_number)}
                  className="w-full py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Money (IMPS/UPI)</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white">Add Beneficiary / UPI Contact</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Save contact for IMPS, NEFT, and Instant UPI Payments.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAdd} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Beneficiary Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">12-Digit Account Number (Optional if UPI entered)</label>
                <input
                  type="text"
                  maxLength={12}
                  placeholder="e.g. 501008821944"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Bank IFSC Code</label>
                <input
                  type="text"
                  placeholder="e.g. APEX0001021 or HDFC0001244"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono uppercase focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Virtual Payment Address (UPI ID)</label>
                <input
                  type="text"
                  placeholder="e.g. priya@okhdfcbank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Contact Nickname</label>
                <input
                  type="text"
                  placeholder="e.g. Priya (Sister)"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30"
                >
                  {submitting ? 'Saving...' : 'Save Beneficiary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
