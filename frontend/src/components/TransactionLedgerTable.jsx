import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Database, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Tag } from 'lucide-react';

// Memoized individual row component
const LedgerRow = React.memo(function LedgerRow({ item, index }) {
  const dateStr = String(item?.date || item?.transaction_date || '').slice(0, 10) || 'N/A';
  const merchantStr = item?.clean_merchant || 'Merchant';
  const rawDesc = item?.raw_description || '';
  const catName = item?.category?.name || item?.category_name || 'General';
  const amountNum = Number(item?.amount || 0);
  const isFlagged = Boolean(item?.variance_flag);

  return (
    <tr
      className={`hover:bg-white/10 transition-colors duration-200 font-sans ${
        isFlagged ? 'bg-rose-500/[0.04]' : ''
      }`}
    >
      <td className="py-3 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
        {dateStr}
      </td>
      <td className="py-3 px-4">
        <div className="font-medium text-white text-xs">{merchantStr}</div>
        <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs">
          {rawDesc}
        </div>
      </td>
      <td className="py-3 px-4 whitespace-nowrap">
        <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-slate-300 font-sans flex items-center gap-1 w-fit">
          <Tag className="w-2.5 h-2.5 text-sky-400" />
          {catName}
        </span>
      </td>
      <td className="py-3 px-4 text-right font-mono font-medium whitespace-nowrap">
        <span className={isFlagged ? 'text-rose-300 font-semibold' : 'text-emerald-400 font-normal'}>
          ₹{amountNum.toFixed(2)}
        </span>
      </td>
      <td className="py-3 px-4 text-center whitespace-nowrap font-sans">
        {isFlagged ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-400/25">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            Micro-Drain
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-400/20">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Normal
          </span>
        )}
      </td>
    </tr>
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
  const items = useMemo(() => {
    return Array.isArray(transactions) ? transactions : [];
  }, [transactions]);

  const totalCount = Number(total) || 0;
  const pageLimit = Number(limit) || 20;
  const totalPages = Math.ceil(totalCount / pageLimit) || 1;
  const categoryList = Array.isArray(categories) ? categories : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-2xl p-6 transition-colors duration-200 hover:border-white/20"
    >
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-400" />
            3NF Transaction Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Normalized transaction records stored in database with indexed variance anomaly flags.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Anomaly Toggle */}
          <button
            onClick={() => onToggleVariance(!varianceOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors duration-200 flex items-center gap-1.5 border backdrop-blur-xl ${
              varianceOnly
                ? 'bg-rose-500/15 text-rose-200 border-rose-400/30'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Anomalies Only</span>
          </button>

          {/* Category Dropdown */}
          <select
            value={selectedCategory || ''}
            onChange={(e) => onSelectCategory(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-sky-400/70 transition-colors duration-200 backdrop-blur-xl"
          >
            <option value="" className="bg-slate-900 text-white">All 3NF Categories</option>
            {categoryList.map((c) => (
              <option key={c?.id} value={c?.id} className="bg-slate-900 text-white">
                {c?.name || 'Category'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-white/5 text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10 font-semibold">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Merchant / Description</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-center">Variance Flag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono">
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 font-sans">
                  No records match the current filter.
                </td>
              </tr>
            ) : (
              items.map((t, idx) => (
                <LedgerRow key={t?.id || idx} item={t} index={idx} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
        <div>
          Showing page <span className="text-white font-medium">{page}</span> of{' '}
          <span className="text-white font-medium">{totalPages}</span> ({totalCount} entries)
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 transition-colors duration-150"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 transition-colors duration-150"
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
