import React from 'react';
import { motion } from 'framer-motion';
import CountUp from './CountUp';
import { IndianRupee, Flame, AlertTriangle, Layers, TrendingDown, Sparkles } from 'lucide-react';

// Animation Variants for Staggered Entrance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 1, 0.5, 1] },
  },
};

// Memoized individual metric card component
const MetricCardItem = React.memo(function MetricCardItem({
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
      variants={itemVariants}
      whileHover={{
        scale: 1.015,
        y: -3,
        transition: { duration: 0.2 },
      }}
      className={`relative p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-white/[0.05] via-[#0D121D]/80 to-[#07090E]/90 backdrop-blur-xl border border-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.1)] transition-all duration-300 hover:border-white/20 hover:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.8)] overflow-hidden ${
        isAnomaly ? 'hover:border-rose-500/30' : ''
      }`}
    >
      {/* Delicate Top Reflection Glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Header Row: Tracked-out uppercase subheader in muted grays */}
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
          {title}
        </span>
        <div className={`p-2 rounded-xl ${iconBgClass} ${iconColorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* Primary Value: High-visibility bright white with platinum/gold accents */}
      <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-baseline flex-wrap gap-1.5 font-mono">
        {prefix && <span className={`${iconColorClass} font-semibold`}>{prefix}</span>}
        <CountUp
          start={0}
          end={value}
          duration={1.5}
          decimals={decimals}
          separator=","
          preserveValue
        />
        {suffix}
        {badge}
      </div>

      {/* Subtitle / Contextual Indicator */}
      <div className="text-[11px] font-medium text-slate-400 mt-2.5 flex items-center gap-1.5">
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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 transform-gpu"
    >
      {/* 1. Total Spend - Platinum & Steel Blue */}
      <MetricCardItem
        title="TOTAL LEDGER SPEND"
        icon={IndianRupee}
        iconColorClass="text-slate-100"
        iconBgClass="bg-white/[0.04] border border-white/10 shadow-sm"
        value={totalSpend}
        subtitle={
          <>
            <span className="text-emerald-400 font-mono font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> 100% INGESTED
            </span>
            <span className="text-slate-400">&bull; Normalized 3NF</span>
          </>
        }
      />

      {/* 2. Micro-Anomaly Drain - Muted Copper / Warm Amber Accent */}
      <MetricCardItem
        title="ANOMALY CAPITAL DRAIN"
        icon={AlertTriangle}
        iconColorClass="text-rose-400"
        iconBgClass="bg-rose-500/10 border border-rose-500/20 shadow-sm"
        value={anomalyDrain}
        isAnomaly={true}
        badge={
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 ml-1">
            <CountUp start={0} end={drainRatio} duration={1.2} decimals={1} />% LEAK
          </span>
        }
        subtitle={
          <span className="flex items-center gap-1 text-slate-300 font-mono text-[11px]">
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            <span>Non-essential spends &le; ₹500</span>
          </span>
        }
      />

      {/* 3. Daily Burn Rate - Muted Gold Accent */}
      <MetricCardItem
        title="DAILY CAPITAL BURN"
        icon={Flame}
        iconColorClass="text-amber-400"
        iconBgClass="bg-amber-500/10 border border-amber-500/20 shadow-sm"
        value={burnRate}
        suffix={<span className="text-xs text-slate-400 font-mono ml-0.5">/ DAY</span>}
        subtitle="Mean daily capital depletion velocity"
      />

      {/* 4. Flagged Transactions - Institutional Slate */}
      <MetricCardItem
        title="FLAGGED TRANSACTIONS"
        icon={Layers}
        iconColorClass="text-sky-400"
        iconBgClass="bg-sky-500/10 border border-sky-500/20 shadow-sm"
        value={anomaliesFlagged}
        decimals={0}
        prefix={null}
        suffix={
          <span className="text-xs font-mono text-slate-400 ml-1">
            / <CountUp start={0} end={totalTxns} duration={1.4} /> TXNS
          </span>
        }
        subtitle="Identified by NLP Heuristic Model"
      />
    </motion.div>
  );
}

export const MetricCards = React.memo(MetricCardsBase);
export default MetricCards;
