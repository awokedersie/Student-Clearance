import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-blue-900 to-black">
          <div className="relative w-full max-w-lg">
            {/* Glow */}
            <div className="absolute -inset-4 bg-rose-500/20 rounded-[50px] blur-3xl"></div>
            <div className="relative bg-white/[0.04] backdrop-blur-xl rounded-[40px] border border-white/10 p-12 text-center"
              style={{ boxShadow: '0 30px 60px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.1)' }}>
              <div className="w-20 h-20 bg-rose-500/20 border border-rose-500/30 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">
                🚨
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight mb-3">Something went wrong</h1>
              <p className="text-indigo-200/60 font-medium text-sm mb-2">An unexpected runtime error occurred.</p>
              {this.state.error?.message && (
                <p className="text-rose-300/70 text-xs font-mono bg-white/5 px-4 py-3 rounded-2xl border border-white/10 mt-4 mb-8 text-left break-all">
                  {this.state.error.message}
                </p>
              )}
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/20 tracking-widest uppercase text-xs transition-all active:scale-95"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

