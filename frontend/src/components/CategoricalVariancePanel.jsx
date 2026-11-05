import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { PieChart, Layers } from 'lucide-react';

// Memoized Bar Tooltip
const CustomBarTooltip = React.memo(function CustomBarTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const total = payload.find((p) => p.dataKey === 'total_spend')?.value || 0;
    const anomaly = payload.find((p) => p.dataKey === 'anomaly_spend')?.value || 0;
    const pct = total > 0 ? ((anomaly / total) * 100).toFixed(1) : 0;

    return (
      <div className="bg-white/95 dark:bg-[#0D121D]/95 border border-slate-200 dark:border-white/10 p-3.5 rounded-xl shadow-lg dark:shadow-[0_12px_35px_-5px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.1)] backdrop-blur-xl text-xs font-mono">
        <p className="text-slate-900 dark:text-white font-bold mb-2 text-[11px] uppercase tracking-wider">{label}</p>
        <div className="space-y-1.5 font-mono">
          <div className="flex justify-between items-center gap-5 text-slate-700 dark:text-slate-300">
            <span className="font-sans text-slate-500 dark:text-slate-400 font-normal">Category Total:</span>
            <span className="font-bold text-slate-900 dark:text-white">₹{total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center gap-5 text-rose-600 dark:text-rose-400">
            <span className="font-sans text-slate-500 dark:text-slate-400 font-normal">Micro-Anomaly Leak:</span>
            <span className="font-bold">₹{anomaly.toFixed(2)}</span>
          </div>
          <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-between items-center gap-5 text-amber-600 dark:text-amber-400 font-semibold">
            <span className="font-sans text-slate-600 dark:text-slate-300 font-medium">Variance Leak Ratio:</span>
            <span>{pct}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
});

// Memoized Bar Chart wrapper with Executive Palette
const CategoricalBarChart = React.memo(function CategoricalBarChart({ items }) {
  if (!items || items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 text-xs font-mono font-medium">
        No categorical records available yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" debounce={50}>
      <BarChart data={items} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="category_name"
          stroke="#64748b"
          tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'monospace' }}
        />
        <YAxis
          stroke="#64748b"
          tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'monospace' }}
          tickFormatter={(val) => `₹${val}`}
        />
        <Tooltip content={<CustomBarTooltip />} />
        <Legend
          verticalAlign="top"
          align="right"
          height={32}
          iconType="circle"
          wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingBottom: '8px' }}
        />
        <Bar dataKey="total_spend" name="Category Total" fill="#38BDF8" radius={[4, 4, 0, 0]} />
        <Bar dataKey="anomaly_spend" name="Micro-Anomaly Leak" fill="#FB7185" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
});

// Memoized Heatmap item row with Executive Terminal Styling
const HeatmapItem = React.memo(function HeatmapItem({ cat }) {
  const isHighRisk = cat.variance_percentage >= 50;
  const isModerateRisk = cat.variance_percentage > 0 && cat.variance_percentage < 50;

  return (
    <div
      className={`p-3 rounded-xl border backdrop-blur-md transition-all duration-200 transform-gpu will-change-transform ${
        isHighRisk
          ? 'bg-rose-500/10 border-rose-500/25 hover:border-rose-400/40 shadow-sm'
          : isModerateRisk
          ? 'bg-amber-500/10 border-amber-500/20 hover:border-amber-400/35 shadow-sm'
          : 'bg-slate-100/90 dark:bg-[#07090E]/60 border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.14]'
      }`}
    >
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-semibold text-slate-800 dark:text-slate-200 font-sans">{cat.category_name}</span>
        <span
          className={`font-mono font-bold px-2 py-0.5 rounded-full text-[10px] ${
            isHighRisk
              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/25'
              : isModerateRisk
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/25'
              : 'bg-slate-200/60 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-white/[0.08]'
          }`}
        >
          {cat.variance_percentage}% LEAK
        </span>
      </div>

      {/* Progress track */}
      <div className="w-full bg-slate-200 dark:bg-black/50 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isHighRisk
              ? 'bg-rose-500 dark:bg-rose-400'
              : isModerateRisk
              ? 'bg-amber-500 dark:bg-amber-400'
              : 'bg-emerald-500 dark:bg-emerald-400'
          }`}
          style={{ width: `${Math.min(cat.variance_percentage, 100)}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-mono">
        <span>SPEND: ₹{(Number(cat?.total_spend) || 0).toFixed(0)}</span>
        <span className="text-rose-600 dark:text-rose-400 font-semibold">
          DRAIN: ₹{(Number(cat?.anomaly_spend) || 0).toFixed(0)}
        </span>
      </div>
    </div>
  );
});

function CategoricalVariancePanelBase({ data }) {
  const items = useMemo(() => {
    return data?.items || [];
  }, [data]);

  const dominantCategory = data?.dominant_category;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="p-6 flex flex-col h-full rounded-2xl bg-gradient-to-b from-white via-slate-50/80 to-white dark:from-white/[0.05] dark:via-[#0D121D]/80 dark:to-[#07090E]/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.1)] relative overflow-hidden"
    >
      {/* Top Reflection Highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-white/15 to-transparent" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase block mb-1">
            CATEGORICAL RISK MATRIX
          </span>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <PieChart className="w-4 h-4 text-sky-500 dark:text-sky-400" />
            Categorical Variance Heatmap &amp; Distribution
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
            Normalized ledger distribution showing capital allocation and non-essential anomaly leakage.
          </p>
        </div>

        {dominantCategory && (
          <div className="px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-[#07090E]/80 border border-slate-200 dark:border-white/10 text-right backdrop-blur-md shadow-sm shrink-0">
            <span className="text-[9px] uppercase font-mono font-semibold text-slate-500 dark:text-slate-400 block tracking-wider">DOMINANT EXPENSE</span>
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400 font-mono">
              {dominantCategory}
            </span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 items-stretch">
        {/* Left Column: Recharts Bar Chart */}
        <div className="w-full min-h-[220px] sm:min-h-[250px] flex flex-col">
          <CategoricalBarChart items={items} />
        </div>

        {/* Right Column: Categorical Heatmap Matrix */}
        <div className="flex flex-col justify-between space-y-2.5 overflow-y-auto max-h-[300px] pr-1">
          {items.slice(0, 4).map((cat) => (
            <HeatmapItem key={cat.category_id} cat={cat} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export const CategoricalVariancePanel = React.memo(CategoricalVariancePanelBase);
export default CategoricalVariancePanel;
