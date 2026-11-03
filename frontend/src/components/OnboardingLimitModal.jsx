import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowRight, Check, SlidersHorizontal, Sparkles } from 'lucide-react';
import { api } from '../services/api';

/**
 * Mandatory Onboarding Limit Setter Component.
 * Blocks access to the main dashboard immediately following sign in / sign up
 * until the user defines and saves their monthly miscellaneous spend limit to localStorage.
 * This component is unclosable and cannot be dismissed without submitting a valid limit.
 */
export default function OnboardingLimitModal({ onComplete, initialUser }) {
  const [limitInput, setLimitInput] = useState('2000');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const PRESETS = [1000, 2000, 3000, 5000, 10000];

  const handleSubmit = (e) => {
    e?.preventDefault();
    const parsed = parseFloat(limitInput);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid positive numerical limit in ₹.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const savedVal = api.setMiscSpendLimit(parsed);
      setTimeout(() => {
        if (onComplete) {
          onComplete(savedVal);
        }
      }, 300);
    } catch (err) {
      setError('Failed to persist limit. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#07090E]/95 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
        className="w-full max-w-lg rounded-3xl p-8 sm:p-10 obsidian-card border border-sky-500/30 shadow-[0_0_50px_-10px_rgba(56,189,248,0.25)] relative overflow-hidden"
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Step Badge & Welcome Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-sky-400" />
              Mandatory Setup &bull; Step 1 of 1
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-50 tracking-tight">
            Welcome to Variance Tracker
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1 leading-relaxed">
            Before accessing the analytics dashboard, you must configure your monthly threshold for miscellaneous and discretionary expenditures.
          </p>
        </div>

        {/* Informational Guidance Box */}
        <div className="p-4 rounded-2xl bg-[#0D121D]/90 border border-white/[0.08] mb-6 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 text-sky-400 font-semibold">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Why is this required?</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            The Variance Anomaly Engine evaluates statement items against this benchmark. If low-value micro-spend leaks in discretionary categories exceed this limit upon ingestion, an automated breach alert will be triggered.
          </p>
        </div>

        {/* Unclosable Input Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Monthly Miscellaneous Spend Limit (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base font-mono font-semibold">
                ₹
              </span>
              <input
                type="number"
                step="50"
                min="100"
                required
                value={limitInput}
                onChange={(e) => {
                  setLimitInput(e.target.value);
                  setError(null);
                }}
                className="w-full pl-9 pr-4 py-3 rounded-2xl bg-[#090D15] border border-white/[0.12] text-slate-50 font-mono text-base font-semibold focus:outline-none focus:border-sky-500/80 transition shadow-inner"
                placeholder="2000"
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-rose-400 mt-1.5 font-medium">{error}</p>}
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <span className="block text-[11px] font-medium text-slate-400 mb-2">
              Select a Recommended Monthly Limit:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setLimitInput(String(p));
                    setError(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium border transition-all cursor-pointer ${
                    Number(limitInput) === p
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm'
                      : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:border-white/[0.18] hover:text-slate-200'
                  }`}
                >
                  ₹{p.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* Unclosable Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 px-5 text-xs font-bold rounded-2xl text-white bg-gradient-to-r from-sky-500 via-indigo-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 border border-sky-400/30 shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer transform-gpu active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Check className="w-4 h-4 text-white animate-bounce" />
                  <span>Saving &amp; Launching Dashboard...</span>
                </>
              ) : (
                <>
                  <span>Save Limit &amp; Enter Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
