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

// Memoized Custom Tooltip for Executive Financial Terminal
const CustomTooltip = React.memo(function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const normal = payload[0]?.value || 0;
    const anomaly = payload[1]?.value || 0;
    const total = normal + anomaly;
    return (
      <div className="bg-[#0D121D]/95 border border-white/10 p-3.5 rounded-xl shadow-[0_12px_35px_-5px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.1)] backdrop-blur-xl text-xs font-mono">
        <p className="text-slate-300 font-semibold mb-2.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
          <Calendar className="w-3.5 h-3.5 text-sky-400" />
          <span>{label}</span>
        </p>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center gap-6 text-slate-300">
            <span className="font-sans text-slate-400">Standard Spend:</span>
            <span className="font-bold text-white">₹{normal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center gap-6 text-rose-400">
            <span className="font-sans text-slate-400">Micro-Anomaly Leak:</span>
            <span className="font-bold">₹{anomaly.toFixed(2)}</span>
          </div>
          <div className="pt-2 border-t border-white/10 flex justify-between items-center gap-6 text-slate-50 font-bold">
            <span className="font-sans text-slate-300">Total Capital Depleted:</span>
            <span className="text-amber-400">₹{total.toFixed(2)}</span>
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
        <AlertCircle className="w-8 h-8 mb-2 opacity-40 text-slate-400" />
        <p className="text-xs uppercase font-mono tracking-wider font-semibold">No Statement Transactions Loaded</p>
        <p className="text-xs text-slate-500 mt-1">Upload a CSV statement to render burn rate analytics.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" debounce={50}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          {/* Executive Steel Blue Gradient for Standard Spend */}
          <linearGradient id="execSteelGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
          </linearGradient>
          {/* Executive Muted Copper Gradient for Anomaly Leak */}
          <linearGradient id="execCopperGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FB7185" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#FB7185" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="date"
          stroke="#64748b"
          tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'monospace' }}
          tickFormatter={(val) => val.slice(5)}
        />
        <YAxis
          stroke="#64748b"
          tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'monospace' }}
          tickFormatter={(val) => `₹${val}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="top"
          align="right"
          height={32}
          iconType="circle"
          wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingBottom: '8px' }}
        />
        <Area
          type="monotone"
          dataKey="normal_spend"
          name="Standard Capital Spend"
          stroke="#38BDF8"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#execSteelGrad)"
          stackId="1"
        />
        <Area
          type="monotone"
          dataKey="anomaly_spend"
          name="Micro-Anomaly Drain"
          stroke="#FB7185"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#execCopperGrad)"
          stackId="1"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

function DailyBurnRatePanelBase({ data, averageBurn, highestSpendDay }) {
  const chartData = useMemo(() => {
    return data?.items || [];
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="p-6 flex flex-col h-full rounded-2xl bg-gradient-to-b from-white/[0.05] via-[#0D121D]/80 to-[#07090E]/90 backdrop-blur-xl border border-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.1)] relative overflow-hidden"
    >
      {/* Top Reflection Highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase block mb-1">
            CAPITAL BURN DYNAMICS
          </span>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            Daily Burn Rate Trajectory
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Time-series distribution comparing standard expenditure against low-value micro-spend anomalies.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-xl bg-[#07090E]/80 border border-white/10 text-right backdrop-blur-md shadow-sm">
            <span className="text-[9px] uppercase font-mono font-semibold text-slate-400 block tracking-wider">MEAN VELOCITY</span>
            <span className="text-xs font-bold text-amber-400 font-mono">
              ₹<CountUp end={Number(averageBurn) || 0} decimals={2} duration={1.4} preserveValue />/DAY
            </span>
          </div>
          {highestSpendDay && (
            <div className="px-3 py-1.5 rounded-xl bg-[#07090E]/80 border border-white/10 text-right backdrop-blur-md shadow-sm hidden md:block">
              <span className="text-[9px] uppercase font-mono font-semibold text-slate-400 block tracking-wider">PEAK SPIKE</span>
              <span className="text-xs font-semibold text-slate-300 font-mono">
                {highestSpendDay}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="flex-1 w-full min-h-[260px] sm:min-h-[300px]">
        <DailyBurnChart chartData={chartData} />
      </div>
    </motion.div>
  );
}

export const DailyBurnRatePanel = React.memo(DailyBurnRatePanelBase);
export default DailyBurnRatePanel;
