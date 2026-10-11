import React from 'react';
import { AlertOctagon, RefreshCw, LogOut, ShieldAlert } from 'lucide-react';
import { authStorage } from '../services/api';

/**
 * Production-Grade React Error Boundary
 * Catches rendering exceptions and displays a sleek glassmorphic fallback UI
 * instead of letting the app unmount to a blank screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Render Crash Caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleHardReset = () => {
    authStorage.removeToken();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'An unexpected rendering error occurred.';
      const componentStack = this.state.errorInfo?.componentStack || '';

      return (
        <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-6 relative overflow-hidden font-sans">
          
          {/* Subtle Ambient Mesh Glow */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-full max-w-xl bg-white/5 backdrop-blur-2xl border border-rose-500/30 rounded-3xl p-8 shadow-2xl relative z-10">
            
            <div className="flex items-center gap-3.5 mb-5">
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  Application Render Boundary
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    Caught
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  The dashboard caught an unexpected render error and prevented a blank screen crash.
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="p-4 rounded-xl bg-black/50 border border-rose-500/20 font-mono text-xs text-rose-300 mb-6 break-words">
              <p className="font-semibold text-rose-200 mb-1 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                Error:
              </p>
              <span>{errorMessage}</span>
            </div>

            {/* Component Stack Trace (Collapsible) */}
            {componentStack && (
              <details className="mb-6 group">
                <summary className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer select-none">
                  View Component Stack Details
                </summary>
                <pre className="mt-2 p-3 rounded-xl bg-black/60 border border-white/10 text-[10px] text-slate-400 font-mono overflow-x-auto max-h-40">
                  {componentStack}
                </pre>
              </details>
            )}

            {/* Recovery Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={this.handleHardReset}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Reset Session & Return to Login</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Rendering Dashboard</span>
              </button>
            </div>

            <div className="mt-4 text-center text-[10px] text-slate-500 font-mono">
              Variance Tracker &bull; Error Boundary Protected &bull; Meghnad Saha Institute of Technology
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
