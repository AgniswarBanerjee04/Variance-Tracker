import React from 'react';
import {
  Activity,
  ShieldCheck,
  Upload,
  Cpu,
  RefreshCw,
  LogOut,
  User,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';

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
  // Safe extraction of formatted username from name or email split before '@'
  const displayName = React.useMemo(() => {
    if (!currentUser) return 'User';
    const explicitName =
      currentUser.displayName ||
      currentUser.name ||
      currentUser.full_name ||
      currentUser.username;

    if (
      explicitName &&
      typeof explicitName === 'string' &&
      explicitName.trim() &&
      explicitName.trim() !== 'User Profile'
    ) {
      return explicitName.trim();
    }

    const email = currentUser.email;
    if (email && typeof email === 'string' && email.includes('@')) {
      const parts = email.split('@');
      if (parts[0] && parts[0].trim()) {
        return parts[0].trim();
      }
    }

    return currentUser?.name || currentUser?.email?.split('@')?.[0] || 'User';
  }, [currentUser]);

  return (
    <header className="sticky top-0 z-40 bg-[#07090E]/90 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.7)] transform-gpu will-change-transform">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Institutional Identity */}
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]">
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="font-bold text-base sm:text-lg text-slate-50 tracking-tight font-sans">
                Variance Tracker
              </span>
              <span className="px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-widest rounded bg-white/[0.04] text-slate-300 border border-white/10 flex items-center gap-1 shadow-sm">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>TERMINAL v1.0</span>
              </span>
            </div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-medium hidden sm:block">
              MCA Semester Minor Project &bull; MSIT
            </p>
          </div>
        </div>

        {/* Executive Action Controls & Institutional Dividers */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 divide-x divide-white/10">
          
          <div className="flex items-center space-x-2 sm:space-x-2.5 pr-2">
            {/* Miscellaneous Spend Limit Pill */}
            <button
              onClick={onOpenBudgetLimit}
              className="px-3 py-1.5 rounded-xl text-xs font-mono text-slate-300 hover:text-white bg-[#0D121D]/80 hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all duration-200 flex items-center gap-1.5 backdrop-blur-md cursor-pointer shadow-sm"
              title="Configure Miscellaneous Spend Limit"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">LIMIT: ₹{Number(miscLimit || 2000).toLocaleString('en-IN')}</span>
              <span className="md:hidden">₹{Number(miscLimit || 2000).toLocaleString('en-IN')}</span>
            </button>

            {/* NLP Sandbox Button */}
            <button
              onClick={onOpenSandbox}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium text-slate-300 hover:text-white bg-[#0D121D]/80 hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all duration-200 flex items-center gap-1.5 backdrop-blur-md cursor-pointer shadow-sm"
              title="Open NLP UPI String Parser Sandbox"
            >
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
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
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 bg-[#0D121D]/80 hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all duration-200 backdrop-blur-md cursor-pointer shadow-sm"
              title="Refresh Analytics Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>

          {/* User Profile / Auth Switcher with clean formatted username */}
          <div className="pl-2.5 flex items-center space-x-2">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div
                  className="px-3 py-1.5 rounded-xl bg-[#0D121D]/90 border border-white/10 hover:border-white/20 text-slate-200 text-xs flex items-center gap-2 backdrop-blur-md cursor-pointer transition-all duration-200 shadow-sm"
                  onClick={onOpenAuth}
                  title="Authenticated Profile"
                >
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-mono text-[10px] font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline font-mono font-semibold text-slate-100">
                    {displayName}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors duration-200 cursor-pointer"
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

export const Navbar = React.memo(NavbarBase);
export default Navbar;
