import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Database, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Tag } from 'lucide-react';

// Memoized individual row component
const LedgerRow = React.memo(function LedgerRow({ item }) {
  const dateStr = String(item?.date || item?.transaction_date || '').slice(0, 10) || 'N/A';
  const merchantStr = item?.clean_merchant || 'Merchant';
  const rawDesc = item?.raw_description || '';
  const catName = item?.category?.name || item?.category_name || 'General';
  const amountNum = Number(item?.amount || 0);
  const isFlagged = Boolean(item?.variance_flag);

  return (
    <tr
      className={`hover:bg-white/[0.04] transition-colors duration-150 font-sans transform-gpu ${
        isFlagged ? 'bg-rose-500/[0.03]' : ''
      }`}
    >
      <td className="py-3 px-4 text-slate-400 font-medium whitespace-nowrap font-mono text-[11px]">
        {dateStr}
      </td>
      <td className="py-3 px-4">
        <div className="font-bold text-slate-50 text-xs">{merchantStr}</div>
        <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs mt-0.5">
          {rawDesc}
        </div>
      </td>
      <td className="py-3 px-4 whitespace-nowrap">
        <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/[0.04] border border-white/[0.08] text-slate-300 font-sans flex items-center gap-1 w-fit">
          <Tag className="w-2.5 h-2.5 text-sky-400" />
          {catName}
        </span>
      </td>
      <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
        <span className={isFlagged ? 'text-rose-400 font-bold' : 'text-emerald-400 font-semibold'}>
          ₹{amountNum.toFixed(2)}
        </span>
      </td>
      <td className="py-3 px-4 text-center whitespace-nowrap font-sans">
        {isFlagged ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            Micro-Drain
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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
      className="obsidian-card p-6 rounded-2xl"
    >
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-50 tracking-tight flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-400" />
            3NF Transaction Ledger
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Normalized transaction records stored in database with indexed variance anomaly flags.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Anomaly Toggle */}
          <button
            onClick={() => onToggleVariance(!varianceOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 border backdrop-blur-md cursor-pointer ${
              varianceOnly
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/20 shadow-sm'
                : 'bg-[#07090E]/80 text-slate-400 border-white/[0.08] hover:text-slate-100 hover:border-white/[0.18]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Anomalies Only</span>
          </button>

          {/* Category Dropdown */}
          <select
            value={selectedCategory || ''}
            onChange={(e) => onSelectCategory(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-1.5 rounded-xl bg-[#07090E]/80 border border-white/[0.08] text-xs text-slate-300 focus:outline-none focus:border-indigo-500/70 transition-colors duration-200 backdrop-blur-md cursor-pointer"
          >
            <option value="" className="bg-[#0D121D] text-slate-200">All 3NF Categories</option>
            {categoryList.map((c) => (
              <option key={c?.id} value={c?.id} className="bg-[#0D121D] text-slate-200">
                {c?.name || 'Category'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#07090E]/50 backdrop-blur-md transform-gpu">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/[0.08] font-semibold">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Merchant / Description</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-center">Variance Flag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05] font-mono">
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 font-sans font-medium">
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
      <div className="flex items-center justify-between mt-4 text-xs text-slate-400 font-medium">
        <div>
          Showing page <span className="text-slate-50 font-bold">{page}</span> of{' '}
          <span className="text-slate-50 font-bold">{totalPages}</span> ({totalCount} entries)
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-white/[0.08] bg-[#07090E]/80 hover:bg-white/[0.08] hover:border-white/[0.18] text-slate-300 disabled:opacity-30 transition-colors duration-150 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-white/[0.08] bg-[#07090E]/80 hover:bg-white/[0.08] hover:border-white/[0.18] text-slate-300 disabled:opacity-30 transition-colors duration-150 cursor-pointer"
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
