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

// Memoized Bar Tooltip to prevent re-renders
const CustomBarTooltip = React.memo(function CustomBarTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const total = payload.find((p) => p.dataKey === 'total_spend')?.value || 0;
    const anomaly = payload.find((p) => p.dataKey === 'anomaly_spend')?.value || 0;
    const pct = total > 0 ? ((anomaly / total) * 100).toFixed(1) : 0;

    return (
      <div className="bg-[#0D111A]/90 border border-white/[0.08] p-3.5 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-md text-xs">
        <p className="text-slate-50 font-bold mb-2">{label}</p>
        <div className="space-y-1.5 font-mono">
          <div className="flex justify-between items-center gap-5 text-sky-400 font-medium">
            <span className="font-sans text-slate-300 font-normal">Category Spend:</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center gap-5 text-rose-400 font-medium">
            <span className="font-sans text-slate-300 font-normal">Micro-Anomaly Leak:</span>
            <span>₹{anomaly.toFixed(2)}</span>
          </div>
          <div className="pt-2 border-t border-white/[0.08] flex justify-between items-center gap-5 text-amber-300 font-semibold">
            <span className="font-sans text-slate-200 font-medium">Variance Leak Ratio:</span>
            <span>{pct}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
});

// Memoized Bar Chart wrapper
const CategoricalBarChart = React.memo(function CategoricalBarChart({ items }) {
  if (!items || items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
        No categorical records available yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" debounce={50}>
      <BarChart data={items} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="category_name" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(val) => `₹${val}`} />
        <Tooltip content={<CustomBarTooltip />} />
        <Legend
          verticalAlign="top"
          align="right"
          height={30}
          iconType="circle"
          wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
        />
        <Bar dataKey="total_spend" name="Category Total" fill="#38bdf8" radius={[6, 6, 0, 0]} />
        <Bar dataKey="anomaly_spend" name="Micro-Anomaly Leak" fill="#fb7185" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
});

// Memoized Heatmap item row
const HeatmapItem = React.memo(function HeatmapItem({ cat }) {
  const isHighRisk = cat.variance_percentage >= 50;
  const isModerateRisk = cat.variance_percentage > 0 && cat.variance_percentage < 50;

  return (
    <div
      className={`p-3 rounded-xl border backdrop-blur-md transition-all duration-200 transform-gpu will-change-transform ${
        isHighRisk
          ? 'bg-rose-500/10 border-rose-500/25 hover:border-rose-400/40'
          : isModerateRisk
          ? 'bg-amber-500/10 border-amber-500/20 hover:border-amber-400/35'
          : 'bg-[#07090E]/60 border-white/[0.06] hover:border-white/[0.14]'
      }`}
    >
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-semibold text-slate-200">{cat.category_name}</span>
        <span
          className={`font-mono font-medium px-2 py-0.5 rounded-full text-[10px] ${
            isHighRisk
              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
              : isModerateRisk
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
              : 'bg-white/[0.04] text-slate-400 border border-white/[0.08]'
          }`}
        >
          {cat.variance_percentage}% Leak
        </span>
      </div>

      {/* Progress track */}
      <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full ${
            isHighRisk
              ? 'bg-rose-400'
              : isModerateRisk
              ? 'bg-amber-400'
              : 'bg-emerald-400'
          }`}
          style={{ width: `${Math.min(cat.variance_percentage, 100)}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 font-mono">
        <span>Spend: ₹{(Number(cat?.total_spend) || 0).toFixed(0)}</span>
        <span className="text-rose-400 font-medium">
          Drain: ₹{(Number(cat?.anomaly_spend) || 0).toFixed(0)}
        </span>
      </div>
    </div>
  );
});

function CategoricalVariancePanelBase({ data }) {
  // Heavy data extraction wrapped in useMemo
  const items = useMemo(() => {
    return data?.items || [];
  }, [data]);

  const dominantCategory = data?.dominant_category;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="obsidian-card p-6 flex flex-col h-full rounded-2xl"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-50 tracking-tight flex items-center gap-2">
            <PieChart className="w-4 h-4 text-violet-400" />
            Categorical Variance Heatmap & Distribution
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Breakdown across normalized 3NF categories isolating non-essential micro-expenditure leaks.
          </p>
        </div>

        {dominantCategory && (
          <div className="px-3 py-1.5 rounded-xl bg-[#07090E]/80 border border-white/[0.08] text-xs text-violet-300 flex items-center gap-1.5 self-start sm:self-auto backdrop-blur-md shadow-sm">
            <Layers className="w-3.5 h-3.5" />
            <span>Dominant: <strong className="text-slate-50 font-bold">{dominantCategory}</strong></span>
          </div>
        )}
      </div>

      {/* Main Bar Chart */}
      <div className="h-[240px] w-full mb-6 transform-gpu">
        <CategoricalBarChart items={items} />
      </div>

      {/* Categorical Variance Heatmap Grid */}
      <div className="border-t border-white/[0.08] pt-4 space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Micro-Variance Risk Heatmap
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((cat) => (
            <HeatmapItem key={cat.category_id} cat={cat} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export const CategoricalVariancePanel = React.memo(CategoricalVariancePanelBase);
export default CategoricalVariancePanel;
