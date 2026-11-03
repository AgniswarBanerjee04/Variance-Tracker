import React from 'react';
import { Activity, ShieldAlert, Upload, Cpu, RefreshCw, GraduationCap, LogOut, User, SlidersHorizontal } from 'lucide-react';

function NavbarBase({
  currentUser,
  onOpenUpload,
  onOpenSandbox,
  onOpenBudgetLimit,
  miscLimit,
  onRefresh,
  loading,
  onOpenAuth,
  onLogout,
}) {
  // Dynamically retrieve username from authentication context / session state
  // Fallback: If auth only returns an email address, extract the string before '@'
  const dynamicUsername = React.useMemo(() => {
    if (!currentUser) return 'User';
    const rawName =
      currentUser.displayName ||
      currentUser.name ||
      currentUser.full_name ||
      currentUser.username;

    if (rawName && typeof rawName === 'string' && rawName.trim() && rawName.trim() !== 'User Profile') {
      return rawName.trim();
    }

    const email = currentUser.email;
    if (email && typeof email === 'string' && email.includes('@')) {
      const extracted = email.split('@')[0];
      if (extracted && extracted.trim()) {
        return extracted.trim();
      }
    }

    return rawName || email || 'User';
  }, [currentUser]);
  return (
    <header className="sticky top-0 z-40 bg-[#07090E]/80 backdrop-blur-md border-b border-white/[0.06] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] transform-gpu will-change-transform">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Project Info */}
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-sky-400 backdrop-blur-md shadow-[0_0_15px_-3px_rgba(56,189,248,0.25)]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base sm:text-lg text-slate-50 tracking-tight">
                Variance Tracker
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-rose-400" /> Anomaly AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              MCA Minor Project
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Budget Limit Config Button */}
          <button
            onClick={onOpenBudgetLimit}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-[#0D121D]/75 hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.18] transition-all duration-200 flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
            title="Configure Miscellaneous Spend Limit"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline font-mono">Limit: ₹{Number(miscLimit || 2000).toLocaleString('en-IN')}</span>
            <span className="md:hidden">Limit</span>
          </button>

          <button
            onClick={onOpenSandbox}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 border border-indigo-400/30 shadow-md shadow-indigo-500/20 transition-all duration-200 flex items-center gap-1.5 transform-gpu active:scale-95 cursor-pointer"
            title="Open NLP UPI String Parser Sandbox"
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-100" />
            <span className="hidden md:inline">NLP Sandbox</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 border border-indigo-400/30 shadow-md shadow-indigo-500/20 transition-all duration-200 flex items-center gap-1.5 transform-gpu active:scale-95 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Ingest CSV</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 bg-[#0D121D]/75 hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.18] transition-all duration-200 backdrop-blur-md cursor-pointer"
            title="Refresh Analytics Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          {/* User Profile / Auth Switcher */}
          <div className="pl-2 border-l border-white/[0.08] flex items-center space-x-2">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div
                  className="px-2.5 py-1 rounded-xl bg-[#0D121D]/75 border border-white/[0.08] hover:border-white/[0.18] text-slate-200 text-xs flex items-center gap-1.5 backdrop-blur-md cursor-pointer transition-all duration-200"
                  onClick={onOpenAuth}
                  title="View Profile"
                >
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden lg:inline font-medium">
                    {dynamicUsername}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors duration-200 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 border border-indigo-400/30 shadow-md shadow-indigo-500/20 transition-all duration-200 flex items-center gap-1.5 transform-gpu active:scale-95 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-indigo-100" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}

export const Navbar = React.memo(NavbarBase);
export default Navbar;
