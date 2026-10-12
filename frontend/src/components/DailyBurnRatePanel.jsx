import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import CountUp from './CountUp';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, AlertCircle, Calendar } from 'lucide-react';

// Memoized Custom Tooltip to prevent re-renders on unrelated parent state changes
const CustomTooltip = React.memo(function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const normal = payload[0]?.value || 0;
    const anomaly = payload[1]?.value || 0;
    const total = normal + anomaly;
    return (
      <div className="bg-[#0D111A]/90 border border-white/[0.08] p-3.5 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-md text-xs">
        <p className="text-slate-300 font-medium mb-2.5 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-sky-400" />
          <span>{label}</span>
        </p>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center gap-5 text-emerald-400 font-medium">
            <span className="font-normal text-slate-300">Standard Spend:</span>
            <span className="font-mono">₹{normal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center gap-5 text-rose-400 font-medium">
            <span className="font-normal text-slate-300">Micro-Anomaly Leak:</span>
            <span className="font-mono">₹{anomaly.toFixed(2)}</span>
          </div>
          <div className="pt-2 border-t border-white/[0.08] flex justify-between items-center gap-5 text-slate-50 font-bold">
            <span className="text-slate-200 font-medium">Daily Aggregated:</span>
            <span className="font-mono">₹{total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
});

// Memoized Chart wrapper to isolate Recharts rendering tree
const DailyBurnChart = React.memo(function DailyBurnChart({ chartData }) {
  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
        <AlertCircle className="w-8 h-8 mb-2 opacity-40 text-sky-400" />
        <p className="text-sm font-medium">No transaction statements loaded.</p>
        <p className="text-xs text-slate-500 mt-1">Upload a CSV statement to render burn rate analytics.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" debounce={50}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="normalGradSoft" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#34d399" stopOpacity={0.28} />
            <stop offset="95%" stopColor="#34d399" stopOpacity={0.0} />
          </linearGradient>
          <linearGradient id="anomalyGradSoft" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#fb7185" stopOpacity={0.32} />
            <stop offset="95%" stopColor="#fb7185" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="date"
          stroke="#64748b"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickFormatter={(val) => val.slice(5)}
        />
        <YAxis
          stroke="#64748b"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickFormatter={(val) => `₹${val}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="top"
          align="right"
          height={30}
          iconType="circle"
          wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
        />
        <Area
          type="monotone"
          dataKey="normal_spend"
          name="Standard Spend"
          stroke="#34d399"
          strokeWidth={1.8}
          fillOpacity={1}
          fill="url(#normalGradSoft)"
          stackId="1"
        />
        <Area
          type="monotone"
          dataKey="anomaly_spend"
          name="Micro-Anomaly Drain"
          stroke="#fb7185"
          strokeWidth={1.8}
          fillOpacity={1}
          fill="url(#anomalyGradSoft)"
          stackId="1"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

function DailyBurnRatePanelBase({ data, averageBurn, highestSpendDay }) {
  // Heavy data extraction wrapped in useMemo
  const chartData = useMemo(() => {
    return data?.items || [];
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="obsidian-card p-6 flex flex-col h-full rounded-2xl"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-50 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            Daily Burn Rate Trajectory
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Time-series distribution comparing standard expenditure against low-value micro-spend anomalies.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-xl bg-[#07090E]/80 border border-white/[0.08] text-right backdrop-blur-md shadow-sm">
            <span className="text-[10px] uppercase font-medium text-slate-400 block">Avg Burn</span>
            <span className="text-xs font-semibold text-amber-400 font-mono">
              ₹<CountUp end={Number(averageBurn) || 0} decimals={2} duration={1.4} preserveValue />/day
            </span>
          </div>
          {highestSpendDay && (
            <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-right backdrop-blur-md">
              <span className="text-[10px] uppercase font-medium text-rose-300 block">Peak Spend</span>
              <span className="text-xs font-semibold text-rose-300 font-mono">{String(highestSpendDay || '')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 w-full min-h-[290px] transform-gpu">
        <DailyBurnChart chartData={chartData} />
      </div>
    </motion.div>
  );
}

export const DailyBurnRatePanel = React.memo(DailyBurnRatePanelBase);
export default DailyBurnRatePanel;
