import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertOctagon, X, ArrowRight, ShieldAlert } from 'lucide-react';

/**
 * Prominent alert modal popup triggered when miscellaneous / micro-anomaly spending
 * exceeds the user's configured monthly limit during CSV statement ingestion.
 */
export default function MiscSpendAlertModal({
  isOpen,
  onClose,
  limit = 2000,
  totalSpend = 0,
}) {
  if (!isOpen) return null;

  const excess = Math.max(0, totalSpend - limit);

  return (
    <div className="fixed inset-0 z-50 bg-[#07090E]/85 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
        className="w-full max-w-lg rounded-2xl sm:rounded-3xl p-7 obsidian-card border border-rose-500/40 shadow-[0_0_40px_-5px_rgba(244,63,94,0.35)] relative overflow-hidden"
      >
        {/* Subtle warning glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors duration-200 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_20px_-3px_rgba(244,63,94,0.3)] shrink-0">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-50 tracking-tight">
                Spending Threshold Breach
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Action Required
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Client-side budget enforcement detected an expenditure limit violation.
            </p>
          </div>
        </div>

        {/* Prominent Required Alert Message */}
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 mb-6">
          <p className="text-sm sm:text-base font-bold text-rose-300 tracking-tight leading-snug">
            Alert: Your monthly limit for miscellaneous spending has been reached. Please stop spending more.
          </p>
        </div>

        {/* Budget vs Calculated Spend Telemetry */}
        <div className="grid grid-cols-2 gap-3 mb-6 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="block text-[11px] text-slate-400 font-sans font-medium mb-1">
              Your Monthly Limit
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-100">
              ₹{Number(limit || 0).toFixed(2)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <span className="block text-[11px] text-rose-300 font-sans font-medium mb-1">
              Parsed Misc/Anomaly Spend
            </span>
            <span className="text-sm sm:text-base font-bold text-rose-400">
              ₹{Number(totalSpend || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {excess > 0 && (
          <div className="mb-6 px-3.5 py-2 rounded-xl bg-black/40 border border-rose-500/20 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Excess Drainage Over Limit:</span>
            <span className="font-mono font-bold text-rose-400">+₹{excess.toFixed(2)}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 border border-rose-400/30 shadow-lg shadow-rose-500/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer transform-gpu active:scale-95"
          >
            <span>Acknowledge &amp; Review Transactions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

