import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  GraduationCap,
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
    <div className="relative min-h-screen flex flex-col justify-between items-center p-4 sm:p-6 overflow-hidden">
      
      {/* Background Animated Floating Mesh Blobs */}
      <div className="animated-mesh-bg">
        <div className="mesh-blob mesh-blob-1" />
        <div className="mesh-blob mesh-blob-2" />
        <div className="mesh-blob mesh-blob-3" />
      </div>

      {/* Top Header Row with Skip Button */}
      <header className="w-full max-w-md pt-2 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-sky-400 backdrop-blur-xl">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-sm text-white tracking-tight">Variance Tracker</span>
            <span className="ml-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
              v1.0 MCA
            </span>
          </div>
        </div>

        {onBypass && (
          <button
            onClick={onBypass}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl transition-colors duration-200 flex items-center gap-1.5"
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
          className="w-full bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-2xl sm:rounded-3xl p-7 sm:p-8 relative"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-20 -right-20 w-44 h-44 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Segmented Tab Switcher */}
          <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 mb-6 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors duration-200 ${
                isLogin
                  ? 'bg-white/10 text-white shadow-sm border border-white/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors duration-200 ${
                !isLogin
                  ? 'bg-white/10 text-white shadow-sm border border-white/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Card Title */}
          <div className="text-center mb-6">
            <h1 className="text-lg font-bold text-white tracking-tight">
              {isLogin ? 'Scholar Authentication' : 'Initialize Profile'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-400/70 transition-colors duration-200"
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-400/70 transition-colors duration-200"
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
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-400/70 transition-colors duration-200 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors duration-150"
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
                  className="text-sky-300 hover:text-sky-200 text-[11px] flex items-center gap-1 transition-colors duration-150"
                >
                  <Sparkles className="w-3 h-3 text-sky-400" />
                  <span>Fill Demo Credentials</span>
                </button>
                <span className="text-[10px] text-slate-400">FastAPI JWT Auth</span>
              </div>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-sky-500/80 hover:bg-sky-500 border border-sky-400/40 shadow-lg shadow-sky-500/20 transition-all duration-200 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
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
        <p className="text-xs text-white/50 tracking-wide font-normal">
          Developed by Agniswar Banerjee &amp; Abhirup Dasgupta | Program: MCA | Department of Computer Applications | Meghnad Saha Institute of Technology
        </p>
      </footer>

    </div>
  );
}

export const AuthPage = React.memo(AuthPageBase);
export default AuthPage;
