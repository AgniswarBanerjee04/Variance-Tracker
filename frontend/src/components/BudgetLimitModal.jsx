import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, Check, IndianRupee, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

/**
 * Budget Limit Configuration Modal.
 * Allows user to define numerical maximum spend limit for miscellaneous / micro-anomaly items.
 * Persists value into localStorage across sessions.
 */
export default function BudgetLimitModal({
  isOpen,
  onClose,
  currentLimit = 2000,
  onLimitSaved,
}) {
  const [limitInput, setLimitInput] = useState(String(currentLimit));
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLimitInput(String(currentLimit));
    setSavedSuccess(false);
    setError(null);
  }, [currentLimit, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e?.preventDefault();
    const parsed = parseFloat(limitInput);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid positive numerical limit in ₹.');
      return;
    }

    const savedVal = api.setMiscSpendLimit(parsed);
    setSavedSuccess(true);
    setError(null);
    if (onLimitSaved) {
      onLimitSaved(savedVal);
    }
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const PRESETS = [1000, 2000, 3000, 5000, 10000];

  return (
    <div className="fixed inset-0 z-50 bg-[#07090E]/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
        className="w-full max-w-md rounded-2xl sm:rounded-3xl p-6 sm:p-7 obsidian-card border border-white/[0.08] relative overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors duration-200 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-50 tracking-tight">
              Set Miscellaneous Spend Limit
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Defines the threshold where spending alerts trigger during statement ingestion.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Numerical Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Maximum Monthly Limit (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono">
                ₹
              </span>
              <input
                type="number"
                step="50"
                min="100"
                value={limitInput}
                onChange={(e) => {
                  setLimitInput(e.target.value);
                  setError(null);
                }}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#0D121D]/90 border border-white/[0.1] text-slate-100 font-mono text-sm focus:outline-none focus:border-sky-500/70 transition-colors"
                placeholder="2000"
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-rose-400 mt-1 font-medium">{error}</p>}
          </div>

          {/* Quick Presets */}
          <div>
            <span className="block text-[11px] font-medium text-slate-400 mb-1.5">
              Quick Threshold Presets:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setLimitInput(String(p))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer ${
                    Number(limitInput) === p
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      : 'bg-white/[0.03] text-slate-300 border-white/[0.08] hover:border-white/[0.18]'
                  }`}
                >
                  ₹{p.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.05]">
            Persisted in local storage across browser sessions. If total spending in non-essential and miscellaneous categories exceeds this value upon CSV upload, an alert modal is triggered.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 border border-sky-400/30 shadow-md shadow-sky-500/20 transition-all flex items-center gap-1.5 cursor-pointer transform-gpu active:scale-95"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Limit</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

