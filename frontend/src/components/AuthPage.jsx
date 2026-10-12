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
} from 'lucide-react';
import { api } from '../services/api';

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
    setEmail('scholar@msit.edu.in');
    setPassword('ResearchPass@2026');
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
        setSuccessMsg('Authentication verified. Launching dashboard...');
        setTimeout(() => {
          onAuthSuccess(res.user);
        }, 400);
      } else {
        if (!fullName.trim()) {
          throw new Error('Please enter your full name.');
        }
        await api.signup(email, password, fullName);
        setSuccessMsg('Account registered successfully! Logging you in...');
        const loginRes = await api.login(email, password);
        setTimeout(() => {
          onAuthSuccess(loginRes.user);
        }, 400);
      }
    } catch (err) {
      const msg = err.message || '';
      if (
        msg.includes('Cannot connect to backend server') ||
        msg.includes('Failed to fetch') ||
        msg.includes('502') ||
        msg.includes('Bad Gateway') ||
        msg.includes('NetworkError')
      ) {
        setError('Cannot connect to backend server. Is FastAPI running?');
      } else {
        setError(msg || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#07090E] text-slate-100 flex flex-col justify-between items-center p-4 sm:p-6 overflow-hidden">
      
      {/* Fixed Ambient Obsidian Radial Glow Overlay */}
      <div className="obsidian-radial-glow" />

      {/* Top Header Row with Skip Button */}
      <header className="w-full max-w-md pt-2 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-sky-400 backdrop-blur-md shadow-[0_0_12px_-2px_rgba(56,189,248,0.25)]">
            <Cpu className="w-4 h-4" />
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
      </header>

      {/* Centered Single Frosted Glass Panel (Task 3 Directive) */}
      <main className="w-full max-w-md my-auto py-6 z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
          className="w-full obsidian-card rounded-2xl sm:rounded-3xl p-7 sm:p-8 relative"
        >
          {/* Segmented Tab Switcher */}
          <div className="flex p-1 rounded-xl bg-[#07090E]/80 border border-white/[0.08] mb-6 backdrop-blur-md">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                isLogin
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20 border border-indigo-400/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                !isLogin
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20 border border-indigo-400/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Card Title */}
          <div className="text-center mb-6">
            <h1 className="text-lg font-bold text-slate-50 tracking-tight">
              {isLogin ? 'Scholar Authentication' : 'Initialize Profile'}
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {isLogin
                ? 'Sign in to access 3NF normalized ledger & anomaly analytics'
                : 'Create scholar profile to calibrate anomaly thresholds'}
            </p>
          </div>

          {/* Notifications */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-400/20 text-rose-300 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 text-xs flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label className="block text-[11px] font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Agniswar Banerjee"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#07090E]/80 border border-white/[0.08] text-slate-50 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500/70 transition-colors duration-200"
                  />
                </div>
              </motion.div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="scholar@msit.edu.in"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#07090E]/80 border border-white/[0.08] text-slate-50 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500/70 transition-colors duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#07090E]/80 border border-white/[0.08] text-slate-50 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500/70 transition-colors duration-200 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors duration-150 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Demo Login Preset Button */}
            {isLogin && (
              <div className="pt-1 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleQuickFillDemo}
                  className="text-indigo-400 hover:text-indigo-300 text-[11px] font-medium flex items-center gap-1 transition-colors duration-150 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Fill Demo Credentials</span>
                </button>
                <span className="text-[10px] text-slate-400 font-medium">FastAPI JWT Auth</span>
              </div>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 border border-indigo-400/30 shadow-md shadow-indigo-500/20 transition-all duration-200 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 transform-gpu active:scale-95 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Sign In & Launch Dashboard' : 'Complete Registration'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </main>

      {/* Developer Footer with Lowered Opacity (Task 3 Directive) */}
      <footer className="w-full max-w-4xl z-10 py-4 text-center">
        <p className="text-xs text-slate-400 font-medium tracking-wide">
          Developed by Agniswar Banerjee &amp; Abhirup Dasgupta | Program: MCA | Department of Computer Applications | Meghnad Saha Institute of Technology
        </p>
      </footer>

    </div>
  );
}

export const AuthPage = React.memo(AuthPageBase);
export default AuthPage;
