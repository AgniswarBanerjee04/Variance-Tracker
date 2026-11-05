import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { authStorage } from '../services/api';

/**
 * Navbar / Header Component
 *
 * Implements:
 * 1. Force Auth State Synchronization: Subscribed to props and localStorage session state,
 *    strictly evaluating: const displayUsername = user?.email ? user.email.split('@')[0] : (user?.name || 'Guest User');
 * 2. Explicitly mounted Theme Toggle component positioned IMMEDIATELY TO THE LEFT of the username badge.
 * 3. Direct DOM Modification: Actively toggles the 'dark' class on document.documentElement (<html> tag).
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
  // Maintain a reactive user state synchronized with props AND session storage (authStorage)
  const [user, setUser] = useState(() => currentUser || authStorage.getUser());

  useEffect(() => {
    // Keep in sync with currentUser prop or local session
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

  // 2. System-wide Theme State:
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

  // 3. Verify & Execute DOM Modification:
  // Actively toggles the 'dark' class on document.documentElement (<html> tag)
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

            {/* 2. Theme Toggle Button - Explicitly Mounted IMMEDIATELY TO THE LEFT of the username profile badge */}
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

            {/* Username Profile Badge - Displays {displayUsername} */}
            <div
              className="px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-[#0D121D]/90 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2 backdrop-blur-md cursor-pointer transition-all duration-200 shadow-sm"
              onClick={onOpenAuth}
              title={`Authenticated Profile: ${displayUsername}`}
            >
              <div className="w-5 h-5 rounded-full bg-indigo-500/15 dark:bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-mono text-[10px] font-bold">
                {displayUsername.charAt(0).toUpperCase()}
              </div>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">
                {displayUsername}
              </span>
            </div>

            {/* Sign Out (when authenticated) or Login Button */}
            {user ? (
              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 dark:hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors duration-200 cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
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
