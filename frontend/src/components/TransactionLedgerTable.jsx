import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Tag,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  Lock,
} from 'lucide-react';

/**
 * Individual Transaction Ledger Row with Bank Data Privacy Shield.
 * Hides vendor and narration by default; reveals when 'View' is clicked.
 */
const LedgerRow = React.memo(function LedgerRow({ item, globalPrivacy }) {
  const [isRevealed, setIsRevealed] = useState(false);

  // If global privacy is disabled, reveal all; otherwise respect row's local toggle state
  const isVisible = globalPrivacy === false ? true : isRevealed;

  const dateStr = String(item?.date || item?.transaction_date || '').slice(0, 10) || 'N/A';
  const merchantStr = item?.clean_merchant || 'Merchant';
  const rawDesc = item?.raw_description || '';
  const catName = item?.category?.name || item?.category_name || 'General';
  const amountNum = Number(item?.amount || 0);
  const isFlagged = Boolean(item?.variance_flag);

  return (
    <>
      <tr
        className={`hover:bg-slate-100/60 dark:hover:bg-white/[0.04] transition-colors duration-150 font-sans transform-gpu ${
          isFlagged ? 'bg-rose-500/[0.04] dark:bg-rose-500/[0.03]' : ''
        }`}
      >
        {/* 1. Date Column */}
        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap font-mono text-[11px]">
          {dateStr}
        </td>

        {/* 2. Narration / Vendor Column - Masked by default for transaction privacy */}
        <td className="py-3 px-4">
          {isVisible ? (
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-slate-50 text-xs">{merchantStr}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/15 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 font-mono uppercase font-semibold">
                  Revealed
                </span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono truncate max-w-xs mt-0.5" title={rawDesc}>
                {rawDesc}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-white/[0.03] border border-slate-300 dark:border-white/[0.06] text-slate-500 font-mono text-[11px] select-none">
                <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="tracking-widest">••••••••••••••••</span>
              </div>
              <span className="text-[10px] text-slate-500 font-sans italic hidden sm:inline">
                (Vendor hidden for privacy)
              </span>
            </div>
          )}
        </td>

        {/* 3. Category Column */}
        <td className="py-3 px-4 whitespace-nowrap">
          {isVisible ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200/60 dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 font-sans flex items-center gap-1 w-fit">
              <Tag className="w-2.5 h-2.5 text-sky-500 dark:text-sky-400" />
              {catName}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-600 font-mono text-[10px] select-none">••••••</span>
          )}
        </td>

        {/* 4. Amount Column with Interactive Privacy Toggle Button */}
        <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
          <div className="inline-flex items-center justify-end gap-2.5">
            <span className={isFlagged ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}>
              ₹{amountNum.toFixed(2)}
            </span>
            <button
              type="button"
              onClick={() => setIsRevealed((prev) => !prev)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all duration-150 cursor-pointer border ${
                isVisible
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                  : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 hover:bg-sky-500/20 shadow-sm'
              }`}
              title={isVisible ? 'Hide Narration & Vendor' : 'View Narration & Vendor'}
            >
              {isVisible ? (
                <>
                  <EyeOff className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                  <span>Hide</span>
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                  <span>View</span>
                </>
              )}
            </button>
          </div>
        </td>

        {/* 5. Variance Status Column */}
        <td className="py-3 px-4 text-center whitespace-nowrap font-sans">
          {isFlagged ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30">
              <AlertTriangle className="w-3 h-3 text-rose-500 dark:text-rose-400" />
              Micro-Drain
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
              Normal
            </span>
          )}
        </td>
      </tr>

      {/* Expanded Details Accordion when 'View' is active */}
      <AnimatePresence>
        {isVisible && (
          <tr className="bg-sky-500/[0.02] border-b border-sky-500/10">
            <td colSpan={5} className="py-2.5 px-4">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="p-3 rounded-xl bg-[#090D15]/90 border border-sky-500/20 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-sky-400 font-sans tracking-wider">
                      Merchant / Vendor:
                    </span>
                    <span className="text-slate-100 font-bold">{merchantStr}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                      {catName}
                    </span>
                    {item?.reference_no && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Ref: {item.reference_no}
                      </span>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-sans tracking-wider shrink-0 mt-0.5">
                      Bank Narration:
                    </span>
                    <p className="text-slate-300 font-mono text-[11px] bg-black/40 px-2 py-1 rounded border border-white/5 break-all">
                      {rawDesc || 'N/A'}
                    </p>
                  </div>
                </div>
                {isFlagged && item?.anomaly_reason && (
                  <div className="text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl max-w-sm shrink-0">
                    <span className="font-bold block text-rose-400 text-[10px] uppercase tracking-wide">
                      Micro-Spend Anomaly
                    </span>
                    <span>{item.anomaly_reason}</span>
                  </div>
                )}
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
});

function TransactionLedgerTableBase({
  transactions,
  total,
  page,
  limit,
  onPageChange,
  varianceOnly,
  onToggleVariance,
  categories,
  selectedCategory,
  onSelectCategory,
}) {
  const [globalPrivacy, setGlobalPrivacy] = useState(true);

  const items = useMemo(() => {
    return Array.isArray(transactions) ? transactions : [];
  }, [transactions]);

  const totalCount = Number(total) || 0;
  const pageLimit = Number(limit) || 20;
  const totalPages = Math.ceil(totalCount / pageLimit) || 1;
  const categoryList = Array.isArray(categories) ? categories : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="p-6 rounded-2xl bg-gradient-to-b from-white via-slate-50/80 to-white dark:from-white/[0.05] dark:via-[#0D121D]/80 dark:to-[#07090E]/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.1)] relative overflow-hidden"
    >
      {/* Top Reflection Highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-white/15 to-transparent" />

      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase block mb-1">
            LEDGER ENTITY MATRIX
          </span>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-500 dark:text-sky-400" />
            3NF Normalized Transaction Ledger
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
            Normalized bank records with privacy masking. Click &ldquo;View&rdquo; on any row to reveal where money was spent.
          </p>
        </div>

        {/* Filters and Privacy Mode Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Master Privacy Toggle */}
          <button
            type="button"
            onClick={() => setGlobalPrivacy((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 border backdrop-blur-md cursor-pointer ${
              globalPrivacy
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 shadow-sm'
                : 'bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-white/[0.18]'
            }`}
            title="Toggle privacy masking across all ledger rows"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Privacy Shield: {globalPrivacy ? 'ON' : 'OFF'}</span>
          </button>

          {/* Anomaly Toggle */}
          <button
            type="button"
            onClick={() => onToggleVariance(!varianceOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 border backdrop-blur-md cursor-pointer ${
              varianceOnly
                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 shadow-sm'
                : 'bg-slate-100/90 dark:bg-[#07090E]/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.08] hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-white/[0.18]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
            <span>Anomalies Only</span>
          </button>

          {/* Category Dropdown */}
          <select
            value={selectedCategory || ''}
            onChange={(e) => onSelectCategory(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-[#07090E]/80 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-indigo-500/70 transition-colors duration-200 backdrop-blur-md cursor-pointer"
          >
            <option value="" className="bg-white dark:bg-[#0D121D] text-slate-800 dark:text-slate-200">All 3NF Categories</option>
            {categoryList.map((c) => (
              <option key={c?.id} value={c?.id} className="bg-white dark:bg-[#0D121D] text-slate-800 dark:text-slate-200">
                {c?.name || 'Category'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white/70 dark:bg-[#07090E]/50 backdrop-blur-md transform-gpu">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-100/90 dark:bg-white/[0.03] text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-white/[0.08] font-semibold">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Merchant / Narration</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-right">Amount & Privacy</th>
              <th className="py-3 px-4 text-center">Variance Flag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70 dark:divide-white/[0.05] font-mono">
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400 font-sans font-medium">
                  No records match the current filter.
                </td>
              </tr>
            ) : (
              items.map((t, idx) => (
                <LedgerRow key={t?.id || idx} item={t} globalPrivacy={globalPrivacy} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
        <div>
          Showing page <span className="text-slate-900 dark:text-slate-50 font-bold">{page}</span> of{' '}
          <span className="text-slate-900 dark:text-slate-50 font-bold">{totalPages}</span> ({totalCount} entries)
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-100/90 dark:bg-[#07090E]/80 hover:bg-slate-200/90 dark:hover:bg-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.18] text-slate-700 dark:text-slate-300 disabled:opacity-30 transition-colors duration-150 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-100/90 dark:bg-[#07090E]/80 hover:bg-slate-200/90 dark:hover:bg-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.18] text-slate-700 dark:text-slate-300 disabled:opacity-30 transition-colors duration-150 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export const TransactionLedgerTable = React.memo(TransactionLedgerTableBase);
export default TransactionLedgerTable;