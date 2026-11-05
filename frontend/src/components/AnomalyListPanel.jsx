import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from './CountUp';
import { AlertTriangle, Search, Filter, Calendar, Tag, Info, Eye, EyeOff, Lock } from 'lucide-react';

// Memoized individual anomaly row component with privacy protection
const AnomalyRow = React.memo(function AnomalyRow({ item, index }) {
  const [isRevealed, setIsRevealed] = useState(false);
  const amountNum = Number(item?.amount || 0);
  const dateStr = item?.date ? String(item.date).slice(0, 10) : 'N/A';
  const merchantStr = item?.clean_merchant || 'Micro-Transaction';
  const catStr = item?.category || 'Discretionary';
  const reasonStr = item?.reason || item?.anomaly_reason || 'Recurring micro-spend leak under ₹500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.25) }}
      className="p-3.5 rounded-xl bg-[#0D121D]/50 hover:bg-white/[0.04] transition-all duration-150 border border-white/[0.06] hover:border-white/[0.14] backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group transform-gpu will-change-transform"
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_12px_-2px_rgba(244,63,94,0.25)] shrink-0 mt-0.5 sm:mt-0">
          <AlertTriangle className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {isRevealed ? (
              <span className="font-bold text-slate-50 text-xs truncate">
                {merchantStr}
              </span>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-slate-500 font-mono text-[11px] select-none">
                <Lock className="w-2.5 h-2.5 text-slate-500" />
                <span>••••••••••</span>
              </div>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-300 border border-white/[0.08] flex items-center gap-1 font-sans">
              <Tag className="w-2.5 h-2.5 text-sky-400" />
              {catStr}
            </span>
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 font-mono">
              <Calendar className="w-2.5 h-2.5" />
              {dateStr}
            </span>
          </div>
          {isRevealed ? (
            <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
              {item?.raw_description || ''}
            </p>
          ) : (
            <p className="text-[10px] text-slate-500 font-sans italic mt-0.5">
              Vendor and narration hidden by privacy shield
            </p>
          )}
          <p className="text-[11px] text-rose-300 font-medium mt-1 flex items-center gap-1">
            <Info className="w-3 h-3 text-rose-400 shrink-0" />
            <span>{reasonStr}</span>
          </p>
        </div>
      </div>

      <div className="text-right shrink-0 self-end sm:self-auto font-mono flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-rose-400">
            -₹{amountNum.toFixed(2)}
          </span>
          <button
            type="button"
            onClick={() => setIsRevealed((prev) => !prev)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
              isRevealed
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/20'
            }`}
            title={isRevealed ? 'Hide vendor' : 'View vendor'}
          >
            {isRevealed ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3 text-sky-400" />}
            <span>{isRevealed ? 'Hide' : 'View'}</span>
          </button>
        </div>
        <span className="text-[10px] text-slate-400 font-medium font-sans">
          Micro-Spend Leak
        </span>
      </div>
    </motion.div>
  );
});

function AnomalyListPanelBase({ anomaliesData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const items = Array.isArray(anomaliesData?.items) ? anomaliesData.items : [];
  const totalAnomalies = Number(anomaliesData?.total_anomalies) || 0;
  const totalDrain = Number(anomaliesData?.total_anomaly_drain) || 0;

  // Heavy filtering logic memoized to prevent execution on unrelated renders
  const filteredItems = useMemo(() => {
    const term = (searchTerm || '').trim().toLowerCase();
    return items.filter((item) => {
      if (!item) return false;
      const merchant = String(item.clean_merchant || '').toLowerCase();
      const desc = String(item.raw_description || '').toLowerCase();
      const reason = String(item.reason || item.anomaly_reason || '').toLowerCase();

      const matchesSearch =
        !term ||
        merchant.includes(term) ||
        desc.includes(term) ||
        reason.includes(term);

      const matchesCategory =
        selectedCategory === 'ALL' || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, selectedCategory]);

  // Memoized unique categories
  const categories = useMemo(() => {
    return [
      'ALL',
      ...Array.from(new Set(items.map((i) => i?.category).filter(Boolean))),
    ];
  }, [items]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="p-6 flex flex-col h-full rounded-2xl bg-gradient-to-b from-white/[0.05] via-[#0D121D]/80 to-[#07090E]/90 backdrop-blur-xl border border-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.1)] relative overflow-hidden"
    >
      {/* Top Reflection Highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase block mb-1">
            ANOMALY DETECTION FEED
          </span>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Identified Micro-Expenditure Anomalies
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
              <CountUp end={totalAnomalies} duration={1.2} preserveValue /> FLAGGED
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Micro-spends (&le; ₹500) isolated by NLP as recurring non-essential cash drains.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-right self-start sm:self-auto backdrop-blur-md shadow-sm">
          <span className="text-[9px] uppercase font-mono font-semibold text-rose-300 block tracking-wider">TOTAL LEAKAGE</span>
          <span className="text-sm font-bold text-rose-300 font-mono flex items-baseline justify-end">
            <span>₹</span>
            <CountUp end={totalDrain} decimals={2} duration={1.5} separator="," preserveValue />
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search merchant, raw description, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#07090E]/80 border border-white/[0.08] text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500/70 transition backdrop-blur-md"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-2 px-3 rounded-xl bg-[#07090E]/80 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-indigo-500/70 transition backdrop-blur-md"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-[#0D121D] text-slate-200">
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Anomaly Cards List */}
      <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1">
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No micro-spend anomalies detected matching criteria.
          </div>
        ) : (
          <AnimatePresence>
            {filteredItems.map((item, idx) => (
              <AnomalyRow key={item?.id || idx} item={item} index={idx} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

export const AnomalyListPanel = React.memo(AnomalyListPanelBase);
export default AnomalyListPanel;
