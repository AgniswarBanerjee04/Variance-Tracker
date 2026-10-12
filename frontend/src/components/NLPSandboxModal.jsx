import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Play, AlertTriangle, X, Loader2, Sparkles, Tag } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-[#07090E]/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
        className="w-full max-w-2xl rounded-2xl sm:rounded-3xl p-7 obsidian-card relative overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors duration-200 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sky-400 backdrop-blur-md shadow-[0_0_12px_-2px_rgba(56,189,248,0.25)]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-50 tracking-tight">
                UPI Merchant NLP & Anomaly Sandbox
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
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
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-colors duration-150 flex items-center gap-1 backdrop-blur-md cursor-pointer"
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#07090E]/80 border border-white/[0.08] text-slate-50 font-mono text-xs focus:outline-none focus:border-indigo-500/70 transition-colors duration-200"
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#07090E]/80 border border-white/[0.08] text-slate-50 font-mono text-xs focus:outline-none focus:border-indigo-500/70 transition-colors duration-200"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end mb-5">
          <button
            type="button"
            onClick={handleRunAnalysis}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 border border-indigo-400/30 shadow-md shadow-indigo-500/20 transition-all duration-200 flex items-center gap-2 disabled:opacity-40 transform-gpu active:scale-95 cursor-pointer"
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
              className={`p-4 rounded-xl border backdrop-blur-md transform-gpu ${
                result.variance_flag
                  ? 'bg-rose-500/10 border-rose-500/25'
                  : 'bg-emerald-500/10 border-emerald-500/25'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-50 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-sky-400" />
                  Classification Output
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    result.variance_flag
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/25'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
                  }`}
                >
                  {result.variance_flag ? '⚠️ Micro-Anomaly Drain' : '✅ Standard Spend'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-sans font-medium">Clean Merchant:</span>
                  <span className="text-slate-50 font-bold">{result.clean_merchant}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-sans font-medium">Normalized Category:</span>
                  <span className="text-slate-50 font-bold">{result.category_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-sans font-medium">Amount:</span>
                  <span className="text-sky-400 font-bold">₹{parseFloat(result.amount).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-sans font-medium">Confidence Score:</span>
                  <span className="text-violet-400 font-bold">{(result.confidence_score * 100).toFixed(0)}%</span>
                </div>
              </div>

              {result.anomaly_reason && (
                <div className="mt-3 pt-2.5 border-t border-white/[0.08] text-xs text-rose-300 font-sans">
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
              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2"
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
