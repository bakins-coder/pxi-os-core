import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ error, errorInfo });

        // Log to error reporting service (e.g., Sentry, LogRocket)
        console.error('Error caught by boundary:', error, errorInfo);

        // TODO: Send to error monitoring service
        // if (window.Sentry) {
        //   window.Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
        // }
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    private handleGoHome = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
                    <div className="max-w-2xl w-full bg-slate-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-rose-500/10 to-orange-500/10 p-10 border-b border-white/5">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-4 bg-rose-500/20 rounded-2xl border border-rose-500/30">
                                    <AlertTriangle size={32} className="text-rose-400" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">
                                        System Fault Detected
                                    </h1>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                                        Neural Core Exception Handler
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Error Details */}
                        <div className="p-10 space-y-6">
                            <div className="bg-slate-950 border border-white/5 rounded-2xl p-6">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">
                                    Error Message
                                </p>
                                <p className="text-sm text-rose-400 font-mono">
                                    {this.state.error?.message || 'Unknown error occurred'}
                                </p>
                            </div>

                            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                                <details className="bg-slate-950 border border-white/5 rounded-2xl p-6">
                                    <summary className="text-[9px] font-black uppercase tracking-widest text-slate-500 cursor-pointer hover:text-white transition-colors">
                                        Component Stack (Dev Only)
                                    </summary>
                                    <pre className="mt-4 text-xs text-slate-400 font-mono overflow-auto max-h-64 p-4 bg-black/30 rounded-xl">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                </details>
                            )}

                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
                                <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-2">
                                    ⚡ Recovery Protocol
                                </p>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    This error has been automatically logged. Your work may have been preserved in local storage.
                                    Try refreshing the page or returning to the dashboard.
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-10 pt-0 flex gap-4">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest transition-all active:scale-95"
                            >
                                <RefreshCw size={16} />
                                Try Again
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-emerald-500 hover:bg-emerald-600 rounded-2xl text-slate-900 font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                            >
                                <Home size={16} />
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
