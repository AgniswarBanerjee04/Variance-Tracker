import React from 'react';
import { Activity, ShieldAlert, Upload, Cpu, RefreshCw, GraduationCap, LogOut, User } from 'lucide-react';

function NavbarBase({
  currentUser,
  onOpenUpload,
  onOpenSandbox,
  onRefresh,
  loading,
  onOpenAuth,
  onLogout,
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Project Info */}
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-sky-400 backdrop-blur-xl">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base sm:text-lg text-white tracking-tight">
                Variance Tracker
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-rose-500/15 text-rose-300 border border-rose-400/25 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-rose-400" /> Anomaly AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              MCA Minor Project &bull; Meghnad Saha Institute of Technology
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          <button
            onClick={onOpenSandbox}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl transition-colors duration-200 flex items-center gap-1.5"
            title="Open NLP UPI String Parser Sandbox"
          >
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">NLP Sandbox</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-sky-500/80 hover:bg-sky-500 border border-sky-400/30 transition-all duration-200 flex items-center gap-1.5 shadow-md shadow-sky-500/15"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Ingest CSV</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors duration-200"
            title="Refresh Analytics Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          {/* User Profile / Auth Switcher */}
          <div className="pl-2 border-l border-white/10 flex items-center space-x-2">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div
                  className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs flex items-center gap-1.5 backdrop-blur-xl cursor-pointer hover:bg-white/10 transition-colors duration-200"
                  onClick={onOpenAuth}
                  title="View / Switch Scholar Account"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-300" />
                  <span className="hidden lg:inline font-medium">
                    {currentUser?.full_name || currentUser?.name || currentUser?.email || 'Scholar'}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-400/20 transition-colors duration-200"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-colors duration-200 flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-sky-400" />
                <span>Scholar Login</span>
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
