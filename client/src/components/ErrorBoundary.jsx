import React from 'react';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled rendering error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-app-bg text-app-text flex items-center justify-center p-6 font-sans select-none selection:bg-brand-primary selection:text-black">
          <div className="w-full max-w-md bg-app-card rounded-[2rem] border border-border-base p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
            {/* Ambient Background Glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center text-center space-y-6">
              {/* Animated Danger Icon */}
              <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-xl shadow-red-500/5 animate-pulse">
                <AlertOctagon className="h-8 w-8" />
              </div>

              {/* Title & Detail */}
              <div className="space-y-2">
                <h1 className="text-lg font-black uppercase tracking-wider text-white">Interface Interrupted</h1>
                <p className="text-xs text-app-muted leading-relaxed max-w-sm">
                  An unexpected exception occurred while rendering this view. The hub is keeping your sessions and states secure.
                </p>
              </div>

              {/* Shortized Technical Stacktrace (if dev env) */}
              {this.state.error && (
                <div className="w-full text-left bg-app-bg/50 border border-white/5 rounded-xl p-4 overflow-x-auto max-h-32 scrollbar-hide">
                  <code className="text-[10px] text-red-400 font-mono block whitespace-pre">
                    {this.state.error.toString()}
                  </code>
                </div>
              )}

              {/* Recovery Action HUD */}
              <div className="w-full grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-app-text text-black font-black uppercase text-[10px] tracking-widest hover:bg-brand-primary transition-all active:scale-95 shadow-lg shadow-black/20"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reset View
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-surface-100 border border-border-base text-app-text font-black uppercase text-[10px] tracking-widest hover:border-brand-primary hover:text-brand-primary transition-all active:scale-95"
                >
                  <Home className="h-3.5 w-3.5" />
                  Return Hub
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
