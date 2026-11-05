import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Loader2,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { api } from '../services/api';

/**
 * AuthPage Component
 *
 * High-Stakes Corporate Aesthetic Redesign:
 * 1. Ambient Background: Floating orbital glow spheres & dark ambient mesh.
 * 2. Glassmorphic Card: Frosted glassmorphism container (backdrop-blur-2xl, border-white/10).
 * 3. Fluid Tab Switching: Framer Motion layoutId sliding pill transition.
 * 4. Input Field Polish: Subtle inner shadows, delicate borders & smooth glowing focus rings.
 * 5. Button & Interaction Upgrades: Rich gradient, glowing box-shadow, tactile whileTap={{ scale: 0.98 }}.
 * 6. Staggered Entrance: Cascading Framer Motion fade-up sequence.
 */
function AuthPageBase({ onAuthSuccess, onBypass }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleQuickFillDemo = () => {
    setEmail('user@example.com');
    setPassword('UserPass@2026');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.login(email, password);
        setSuccessMsg('Authentication verified. Initializing secure session...');
        setTimeout(() => {
          onAuthSuccess(res.user);
        }, 350);
      } else {
        if (!fullName.trim()) {
          throw new Error('Please enter your full name.');
        }
        await api.signup(email, password, fullName);
        setSuccessMsg('Account registered successfully! Logging you in...');
        const loginRes = await api.login(email, password);
        setTimeout(() => {
          onAuthSuccess(loginRes.user);
        }, 350);
      }
    } catch (err) {
      const msg = err.message || '';
      setError(msg || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Staggered Entrance Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.25, 1, 0.5, 1] },
    },
  };

  return (
    <div className="relative min-h-screen bg-[#07090E] text-slate-100 flex flex-col justify-between items-center p-4 sm:p-6 overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* 1. Ambient Background: Dark Animated Mesh & Floating Orbital Glowing Spheres */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        {/* Orbital Sphere 1 (Indigo / Blue Glow - Top Left) */}
        <motion.div
          animate={{
            x: [0, 45, 0],
            y: [0, -35, 0],
            scale: [1, 1.15, 1],
            opacity: [0.35, 0.55, 0.35],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-32 -left-32 w-96 sm:w-[32rem] h-96 sm:h-[32rem] bg-indigo-600/25 rounded-full blur-[100px] transform-gpu"
        />

        {/* Orbital Sphere 2 (Sky / Cyan Glow - Center Right) */}
        <motion.div
          animate={{
            x: [0, -50, 0],
            y: [0, 40, 0],
            scale: [1, 1.2, 1],
            opacity: [0.25, 0.45, 0.25],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
          className="absolute top-1/3 -right-36 w-80 sm:w-[28rem] h-80 sm:h-[28rem] bg-sky-500/20 rounded-full blur-[110px] transform-gpu"
        />

        {/* Orbital Sphere 3 (Violet / Purple Glow - Bottom Center) */}
        <motion.div
          animate={{
            x: [0, 35, 0],
            y: [0, 45, 0],
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
          className="absolute -bottom-36 left-1/4 w-96 sm:w-[30rem] h-96 sm:h-[30rem] bg-violet-600/20 rounded-full blur-[120px] transform-gpu"
        />

        {/* Subtle dot matrix texture for high-stakes corporate fintech depth */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px] opacity-60" />
      </div>

      {/* Top Header Row with Skip Demo Button */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md pt-2 flex items-center justify-between z-10"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-sky-400 backdrop-blur-md shadow-[0_0_15px_-3px_rgba(56,189,248,0.3)]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm text-slate-50 tracking-tight">Variance Tracker</span>
            <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-300 border border-white/[0.08]">
              v1.0 MCA
            </span>
          </div>
        </div>

        {onBypass && (
          <button
            onClick={onBypass}
            className="text-xs text-slate-400 hover:text-slate-100 px-3 py-1.5 rounded-xl bg-[#0D121D]/75 hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.18] backdrop-blur-md transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Skip Demo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </motion.header>

      {/* Main Centered Authentication Area with 6. Staggered Entrance */}
      <main className="w-full max-w-md my-auto py-6 z-10 flex flex-col items-center">
        {/* 2. Glassmorphic Card Container */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full rounded-3xl p-7 sm:p-9 bg-gradient-to-b from-white/[0.06] via-[#0D121D]/85 to-[#07090E]/95 backdrop-blur-2xl border border-white/10 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.15)] relative overflow-hidden"
        >
          {/* Subtle Ambient Radial Highlight on Card's Top Edge */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-36 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* 3. Fluid Tab Switching with Framer Motion layoutId */}
          <motion.div variants={itemVariants} className="relative flex p-1.5 rounded-2xl bg-[#07090E]/80 border border-white/10 mb-6 backdrop-blur-md shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError('');
                setSuccessMsg('');
              }}
              className="relative flex-1 py-2.5 text-xs font-semibold rounded-xl text-center transition-colors duration-200 cursor-pointer z-10"
            >
              {isLogin && (
                <motion.div
                  layoutId="active-auth-tab"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-sky-500 to-violet-600 shadow-[0_0_15px_rgba(99,102,241,0.35)] border border-white/20"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <span className={`relative z-10 transition-colors duration-200 ${isLogin ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}>
                Sign In
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError('');
                setSuccessMsg('');
              }}
              className="relative flex-1 py-2.5 text-xs font-semibold rounded-xl text-center transition-colors duration-200 cursor-pointer z-10"
            >
              {!isLogin && (
                <motion.div
                  layoutId="active-auth-tab"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-sky-500 to-violet-600 shadow-[0_0_15px_rgba(99,102,241,0.35)] border border-white/20"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <span className={`relative z-10 transition-colors duration-200 ${!isLogin ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}>
                Create Account
              </span>
            </button>
          </motion.div>

          {/* Card Title & Institutional Subtitle */}
          <motion.div variants={itemVariants} className="text-center mb-6">
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              {isLogin ? 'Scholar Authentication' : 'Initialize Profile'}
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1.5 leading-relaxed">
              {isLogin
                ? 'Sign in to access 3NF normalized ledger & anomaly analytics'
                : 'Create scholar profile to calibrate anomaly thresholds'}
            </p>
          </motion.div>

          {/* Feedback Notifications */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-400/25 text-rose-300 text-xs flex items-center gap-2.5 backdrop-blur-md shadow-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-300 text-xs flex items-center gap-2.5 backdrop-blur-md shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Authentication Form with 4. Input Field Polish */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <motion.div
                variants={itemVariants}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-sky-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#07090E]/90 border border-white/10 text-slate-50 placeholder-slate-500 text-xs shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400/60 focus:shadow-[0_0_20px_-3px_rgba(99,102,241,0.35)] transition-all duration-200"
                  />
                </div>
              </motion.div>
            )}

            <motion.div variants={itemVariants}>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-sky-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="scholar@university.edu"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#07090E]/90 border border-white/10 text-slate-50 placeholder-slate-500 text-xs shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400/60 focus:shadow-[0_0_20px_-3px_rgba(99,102,241,0.35)] transition-all duration-200"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-sky-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#07090E]/90 border border-white/10 text-slate-50 placeholder-slate-500 text-xs font-mono shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400/60 focus:shadow-[0_0_20px_-3px_rgba(99,102,241,0.35)] transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors duration-150 cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            {/* Quick Demo Credentials Preset Button */}
            {isLogin && (
              <motion.div variants={itemVariants} className="pt-1 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleQuickFillDemo}
                  className="text-indigo-400 hover:text-sky-300 text-[11px] font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all duration-150 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Fill Demo Credentials</span>
                </button>
                <span className="text-[10px] text-slate-500 font-medium">In-Browser Isolated Session</span>
              </motion.div>
            )}

            {/* 5. Upgraded Action Button */}
            <motion.div variants={itemVariants} className="pt-2">
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-500 via-sky-500 to-violet-600 hover:from-indigo-400 hover:via-sky-400 hover:to-violet-500 border border-indigo-400/30 shadow-[0_0_25px_-3px_rgba(99,102,241,0.5)] hover:shadow-[0_0_35px_rgba(56,189,248,0.6)] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transform-gpu group"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying Session...</span>
                  </>
                ) : (
                  <>
                    <span>{isLogin ? 'Sign In & Launch Dashboard' : 'Complete Registration'}</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>
        </motion.div>
      </main>

      {/* Institutional Watermark Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="w-full max-w-4xl z-10 py-4 text-center"
      >
        <p className="text-xs text-slate-400 font-medium tracking-wide">
          Variance Tracker &bull; Micro-Expenditure &amp; Anomaly Detection System &bull; MCA Minor Project
        </p>
      </motion.footer>

    </div>
  );
}

export const AuthPage = React.memo(AuthPageBase);
export default AuthPage;
