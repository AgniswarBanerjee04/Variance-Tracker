import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Play, CheckCircle2, AlertTriangle, X, Loader2, Sparkles, Tag, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

const PRESET_UPI_STRINGS = [
  { str: 'UPI/PAYTM*QR_CHAI_TAPRI/SBI', amt: 40.0, label: 'Chai Tapri Micro-Spend (₹40)' },
  { str: 'UPI/PAYTM*QR_CIGARETTE_SHOP/HDFC', amt: 90.0, label: 'Cigarette Shop Micro-Spend (₹90)' },
  { str: 'UPI/SWIGGY_INSTAMART/ICICI', amt: 145.0, label: 'Swiggy Instamart (₹145)' },
  { str: 'UPI/NETFLIX_SUBSCRIPTION/AXIS', amt: 199.0, label: 'Netflix Subscription (₹199)' },
  { str: 'UPI/RENT_PAYMENT_OCT/HDFC_BANK', amt: 12000.0, label: 'Rent Payment (₹12,000)' },
  { str: 'NEFT/ELECTRICITY_BILL_WBSEDCL/SBI', amt: 1450.0, label: 'Electricity Utility (₹1,450)' },
];

function NLPSandboxModalBase({ isOpen, onClose }) {
  const [rawString, setRawString] = useState('UPI/PAYTM*QR_CHAI_TAPRI/SBI');
  const [amount, setAmount] = useState('40.0');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleRunAnalysis = async () => {
    if (!rawString.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.parseRawUPI(rawString, amount);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Error executing NLP parser.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (preset) => {
    setRawString(preset.str);
    setAmount(preset.amt.toString());
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
        className="w-full max-w-2xl rounded-2xl sm:rounded-3xl p-7 bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] relative overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors duration-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-sky-400 backdrop-blur-xl">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                UPI Merchant NLP & Anomaly Sandbox
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate raw Indian UPI descriptors through token normalization & micro-expenditure detection heuristics.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mb-4">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-2">
            Test Statement Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_UPI_STRINGS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors duration-150 flex items-center gap-1 backdrop-blur-xl"
              >
                <Sparkles className="w-3 h-3 text-sky-400" />
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Inputs */}
        <div className="space-y-3.5 mb-5">
          <div>
            <label className="block text-[11px] font-medium text-slate-300 uppercase tracking-wider mb-1">
              Raw Descriptor String
            </label>
            <input
              type="text"
              value={rawString}
              onChange={(e) => setRawString(e.target.value)}
              placeholder="e.g. UPI/40123/PAYTM*QR_Chai/SBI"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-sky-400/70 transition-colors duration-200"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 uppercase tracking-wider mb-1">
              Transaction Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="40.0"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-sky-400/70 transition-colors duration-200"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end mb-5">
          <button
            type="button"
            onClick={handleRunAnalysis}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-sky-500/80 hover:bg-sky-500 border border-sky-400/30 shadow-md shadow-sky-500/15 transition-all duration-200 flex items-center gap-2 disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Tokens...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Evaluate Anomaly Model</span>
              </>
            )}
          </button>
        </div>

        {/* Result Card */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`p-4 rounded-xl border backdrop-blur-xl ${
                result.variance_flag
                  ? 'bg-rose-500/10 border-rose-400/25'
                  : 'bg-emerald-500/10 border-emerald-400/25'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-sky-400" />
                  Classification Output
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    result.variance_flag
                      ? 'bg-rose-500/20 text-rose-200 border-rose-400/30'
                      : 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                  }`}
                >
                  {result.variance_flag ? '⚠️ Micro-Anomaly Drain' : '✅ Standard Spend'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-sans">Clean Merchant:</span>
                  <span className="text-white font-medium">{result.clean_merchant}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-sans">Normalized Category:</span>
                  <span className="text-white font-medium">{result.category_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-sans">Amount:</span>
                  <span className="text-sky-300 font-semibold">₹{parseFloat(result.amount).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-sans">Confidence Score:</span>
                  <span className="text-indigo-300 font-semibold">{(result.confidence_score * 100).toFixed(0)}%</span>
                </div>
              </div>

              {result.anomaly_reason && (
                <div className="mt-3 pt-2.5 border-t border-white/10 text-xs text-rose-300 font-sans">
                  <strong>Detection Rationale:</strong> {result.anomaly_reason}
                </div>
              )}
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-3 rounded-xl bg-rose-500/10 border border-rose-400/25 text-rose-300 text-xs flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export const NLPSandboxModal = React.memo(NLPSandboxModalBase);
export default NLPSandboxModal;
