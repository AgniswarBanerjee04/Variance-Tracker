import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  ShieldCheck,
  Upload,
  Cpu,
  RefreshCw,
  LogOut,
  User,
  SlidersHorizontal,
  Sun,
  Moon,
  ChevronDown,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { authStorage } from '../services/api';

/**
 * Navbar / Header Component
 *
 * Implements:
 * 1. Isolated Profile Badge Click: Clicking the username badge toggles an interactive dropdown menu
 *    instead of instantly logging out.
 * 2. Standard Dropdown Profile Menu:
 *    - Glassmorphic card (bg-white/95 dark:bg-slate-900/95, backdrop-blur-2xl, border-white/10).
 *    - Displays full user credentials ("Signed in as: [Full Email Address]").
 *    - Dedicated destructive Logout button with rose hover effects at the bottom.
 *    - Click outside & Escape key listeners to close automatically.
 * 3. Force Auth State Synchronization: Subscribed to props and localStorage session state,
 *    strictly evaluating: const displayUsername = user?.email ? user.email.split('@')[0] : (user?.name || 'Guest User');
 * 4. Explicitly mounted Theme Toggle component positioned IMMEDIATELY TO THE LEFT of the username badge.
 * 5. Direct DOM Modification: Actively toggles the 'dark' class on document.documentElement (<html> tag).
 */
export function Navbar({
  currentUser,
  onOpenUpload,
  onOpenSandbox,
  onOpenBudgetLimit,
  miscLimit,
  onRefresh,
  loading,
  onOpenAuth,
  onLogout,
  theme: controlledTheme,
  onToggleTheme,
}) {
  // 1. Force Auth State Synchronization:
  const [user, setUser] = useState(() => currentUser || authStorage.getUser());

  useEffect(() => {
    const activeUser = currentUser || authStorage.getUser();
    setUser(activeUser);
  }, [currentUser]);

  // Subscribe to storage and custom auth_state_change events so Navbar updates instantly upon login
  useEffect(() => {
    const handleAuthChange = () => {
      const activeUser = authStorage.getUser();
      setUser(activeUser);
    };

    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('auth_state_change', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('auth_state_change', handleAuthChange);
    };
  }, []);

  // Strictly evaluate displayUsername per specification:
  const displayUsername = user?.email
    ? user.email.split('@')[0]
    : (user?.name || 'Guest User');

  // 2. Profile Dropdown State & Click-Outside Handler:
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen]);

  // 3. System-wide Theme State:
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('theme');
        if (saved === 'light' || saved === 'dark') return saved;
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      } catch {
        return 'dark';
      }
    }
    return 'dark';
  });

  // Sync if controlledTheme prop changes
  useEffect(() => {
    if (controlledTheme && controlledTheme !== theme) {
      setTheme(controlledTheme);
    }
  }, [controlledTheme, theme]);

  // 4. Verify & Execute DOM Modification:
  const handleToggleTheme = useCallback(() => {
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    const nextTheme = isDark ? 'light' : 'dark';

    if (nextTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    try {
      localStorage.setItem('theme', nextTheme);
    } catch (e) {
      console.warn('Failed to save theme in localStorage:', e);
    }

    setTheme(nextTheme);

    if (onToggleTheme) {
      onToggleTheme();
    }
  }, [onToggleTheme]);

  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-[#07090E]/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 shadow-sm dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.7)] transition-colors duration-200 transform-gpu will-change-transform">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Institutional Identity */}
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-800 dark:text-slate-100 shadow-sm">
            <Activity className="w-4 h-4 text-sky-500 dark:text-sky-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-50 tracking-tight font-sans">
                Variance Tracker
              </span>
              <span className="px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-widest rounded bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 flex items-center gap-1 shadow-sm">
                <ShieldCheck className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                <span>TERMINAL v1.0</span>
              </span>
            </div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              MCA Semester Minor Project &bull; MSIT
            </p>
          </div>
        </div>

        {/* Executive Action Controls & Institutional Dividers */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 divide-x divide-slate-200 dark:divide-white/10">
          
          <div className="flex items-center space-x-2 sm:space-x-2.5 pr-2">
            {/* Miscellaneous Spend Limit Pill */}
            <button
              onClick={onOpenBudgetLimit}
              className="px-3 py-1.5 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100/90 dark:bg-[#0D121D]/80 hover:bg-slate-200/90 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-200 flex items-center gap-1.5 backdrop-blur-md cursor-pointer shadow-sm"
              title="Configure Miscellaneous Spend Limit"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span className="hidden md:inline">LIMIT: ₹{Number(miscLimit || 2000).toLocaleString('en-IN')}</span>
              <span className="md:hidden">₹{Number(miscLimit || 2000).toLocaleString('en-IN')}</span>
            </button>

            {/* NLP Sandbox Button */}
            <button
              onClick={onOpenSandbox}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100/90 dark:bg-[#0D121D]/80 hover:bg-slate-200/90 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-200 flex items-center gap-1.5 backdrop-blur-md cursor-pointer shadow-sm"
              title="Open NLP UPI String Parser Sandbox"
            >
              <Cpu className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
              <span className="hidden md:inline">NLP SANDBOX</span>
            </button>

            {/* Ingest Statement CSV Button */}
            <button
              onClick={onOpenUpload}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 via-sky-500 to-violet-600 hover:from-indigo-400 hover:via-sky-400 hover:to-violet-500 border border-indigo-400/30 shadow-[0_0_20px_-3px_rgba(99,102,241,0.4)] transition-all duration-200 flex items-center gap-1.5 transform-gpu active:scale-95 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Ingest CSV</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100/90 dark:bg-[#0D121D]/80 hover:bg-slate-200/90 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-200 backdrop-blur-md cursor-pointer shadow-sm"
              title="Refresh Analytics Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-500 dark:text-sky-400' : ''}`} />
            </button>
          </div>

          {/* User Profile & Theme Controls */}
          <div className="pl-2.5 flex items-center space-x-2">

            {/* 1. Theme Toggle Button - Positioned IMMEDIATELY TO THE LEFT of the username profile badge */}
            <button
              type="button"
              id="theme-toggle"
              onClick={handleToggleTheme}
              aria-label="Toggle Light/Dark Theme"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100/90 dark:bg-[#0D121D]/80 hover:bg-slate-200/90 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-200 backdrop-blur-md cursor-pointer shadow-sm flex items-center justify-center shrink-0"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-sky-500 transition-transform duration-200 hover:-rotate-12" />
              )}
            </button>

            {/* 2. Interactive Profile Badge with Dropdown Container */}
            {user ? (
              <div className="relative" ref={profileMenuRef}>
                {/* Clickable Profile Badge: Toggles Dropdown (No instant logout) */}
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 backdrop-blur-md cursor-pointer transition-all duration-200 shadow-sm ${
                    isProfileOpen
                      ? 'bg-slate-200 dark:bg-white/[0.12] border-indigo-500/40 text-slate-900 dark:text-white ring-2 ring-indigo-500/20'
                      : 'bg-slate-100/90 dark:bg-[#0D121D]/90 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-800 dark:text-slate-200'
                  }`}
                  aria-expanded={isProfileOpen}
                  aria-haspopup="true"
                  title="View Profile Details"
                >
                  <div className="w-5 h-5 rounded-full bg-indigo-500/15 dark:bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-mono text-[10px] font-bold shrink-0">
                    {displayUsername.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-100 max-w-[120px] sm:max-w-[160px] truncate">
                    {displayUsername}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      isProfileOpen ? 'rotate-180 text-indigo-500 dark:text-indigo-300' : ''
                    }`}
                  />
                </button>

                {/* 3. Standard Glassmorphic Profile Dropdown Menu */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] z-50 overflow-hidden font-sans"
                    >
                      {/* User Identity Header */}
                      <div className="p-4 border-b border-slate-100 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02]">
                        <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Signed in as
                        </p>
                        <p
                          className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5"
                          title={user?.email || 'scholar@university.edu'}
                        >
                          {user?.email || 'scholar@university.edu'}
                        </p>
                        
                        <div className="flex items-center gap-1.5 mt-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>ACTIVE SESSION</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">
                            MCA Terminal
                          </span>
                        </div>
                      </div>

                      {/* Quick Details & System Controls */}
                      <div className="p-2 space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            if (onOpenBudgetLimit) onOpenBudgetLimit();
                          }}
                          className="w-full px-3 py-2 rounded-xl text-xs text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                            <span>Monthly Spend Limit</span>
                          </div>
                          <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">
                            ₹{Number(miscLimit || 2000).toLocaleString('en-IN')}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            if (onOpenSandbox) onOpenSandbox();
                          }}
                          className="w-full px-3 py-2 rounded-xl text-xs text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Cpu className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                          <span>NLP UPI Sandbox</span>
                        </button>
                      </div>

                      {/* 4. Dedicated Destructive Logout Action Button */}
                      <div className="p-2 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50/30 dark:bg-white/[0.01]">
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            if (onLogout) onLogout();
                          }}
                          className="w-full px-3 py-2 rounded-xl text-xs text-left text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/15 border border-transparent hover:border-rose-500/20 transition-all flex items-center gap-2 font-medium cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                          <span>Sign Out of Terminal</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 border border-indigo-400/30 shadow-md shadow-indigo-500/20 transition-all duration-200 flex items-center gap-1.5 transform-gpu active:scale-95 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )}

          </div>

        </div>

      </div>
    </header>
  );
}

export default Navbar;
