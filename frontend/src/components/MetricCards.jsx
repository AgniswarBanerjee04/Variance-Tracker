import React from 'react';
import { motion } from 'framer-motion';
import CountUp from './CountUp';
import { IndianRupee, Flame, AlertTriangle, Layers, TrendingDown, Sparkles } from 'lucide-react';

// Memoized individual card component to prevent child re-renders
const MetricCardItem = React.memo(function MetricCardItem({
  index,
  title,
  icon: Icon,
  iconColorClass,
  iconBgClass,
  value,
  prefix = '₹',
  suffix = null,
  badge = null,
  subtitle,
  decimals = 2,
  isAnomaly = false,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.08,
        duration: 0.45,
        ease: [0.25, 1, 0.5, 1],
      }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      className={`relative p-6 bg-white/5 backdrop-blur-2xl border ${
        isAnomaly ? 'border-rose-400/25' : 'border-white/10'
      } shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-2xl transition-colors duration-200 hover:border-white/20`}
    >
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2 rounded-xl ${iconBgClass} ${iconColorClass} border border-white/5`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-baseline flex-wrap gap-1.5">
        {prefix && <span className={`${iconColorClass} font-semibold`}>{prefix}</span>}
        <CountUp
          start={0}
          end={value}
          duration={1.6}
          decimals={decimals}
          separator=","
          preserveValue
        />
        {suffix}
        {badge}
      </div>

      <div className="text-xs text-slate-400 mt-2.5 flex items-center gap-1.5">
        {subtitle}
      </div>
    </motion.div>
  );
});

function MetricCardsBase({ metrics }) {
  const totalSpend = Number(metrics?.total_expenditure) || 0;
  const anomalyDrain = Number(metrics?.total_anomaly_drain) || 0;
  const anomaliesFlagged = Number(metrics?.total_anomalies_flagged) || 0;
  const totalTxns = Number(metrics?.total_transactions) || 0;
  const burnRate = Number(metrics?.average_burn_rate) || 0;
  const drainRatio = Number(metrics?.anomaly_drain_ratio) || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. Total Spend */}
      <MetricCardItem
        index={0}
        title="Total Ledger Spend"
        icon={IndianRupee}
        iconColorClass="text-sky-300"
        iconBgClass="bg-sky-500/10"
        value={totalSpend}
        subtitle={
          <>
            <span className="text-emerald-400/90 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> 100% Ingested
            </span>
            <span>across ledger lines</span>
          </>
        }
      />

      {/* 2. Micro-Anomaly Drain */}
      <MetricCardItem
        index={1}
        title="Micro-Anomaly Drain"
        icon={AlertTriangle}
        iconColorClass="text-rose-300"
        iconBgClass="bg-rose-500/15"
        value={anomalyDrain}
        isAnomaly={true}
        badge={
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-200 font-semibold border border-rose-400/25 ml-1">
            <CountUp start={0} end={drainRatio} duration={1.2} decimals={1} />% Leak
          </span>
        }
        subtitle={
          <span className="flex items-center gap-1 text-rose-300/80">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Recurring spends &le; ₹500</span>
          </span>
        }
      />

      {/* 3. Daily Burn Rate */}
      <MetricCardItem
        index={2}
        title="Daily Burn Rate"
        icon={Flame}
        iconColorClass="text-amber-300"
        iconBgClass="bg-amber-500/10"
        value={burnRate}
        suffix={<span className="text-xs text-slate-400 font-normal ml-0.5">/ day</span>}
        subtitle="Mean daily capital depletion rate"
      />

      {/* 4. Flagged Ratio */}
      <MetricCardItem
        index={3}
        title="Flagged Transactions"
        icon={Layers}
        iconColorClass="text-indigo-300"
        iconBgClass="bg-indigo-500/10"
        value={anomaliesFlagged}
        decimals={0}
        prefix={null}
        suffix={
          <span className="text-sm font-normal text-slate-400 ml-1">
            / <CountUp start={0} end={totalTxns} duration={1.4} /> txns
          </span>
        }
        subtitle="Identified by NLP Heuristic & Anomaly Model"
      />
    </div>
  );
}

export const MetricCards = React.memo(MetricCardsBase);
export default MetricCards;
