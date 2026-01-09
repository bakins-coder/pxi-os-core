import React, { useState, useEffect } from 'react';
import { X, Download, RefreshCw } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setShowPrompt(false);
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Remember dismissal for 7 days
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in slide-in-from-bottom-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-xl">
                                <Download size={20} className="text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-tight">
                                    Install App
                                </h3>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                    Offline Access
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="p-1 hover:bg-white/5 rounded-lg transition-colors text-slate-500"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                        Install Paradigm-Xi for faster access, offline functionality, and a native app experience.
                    </p>

                    <button
                        onClick={handleInstall}
                        className="w-full py-3 px-4 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
                    >
                        Install Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export const AppUpdateNotification: React.FC = () => {
    const [showUpdate, setShowUpdate] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                setShowUpdate(true);
            });
        }
    }, []);

    const handleUpdate = () => {
        setUpdating(true);
        window.location.reload();
    };

    if (!showUpdate) return null;

    return (
        <div className="fixed top-6 right-6 z-50 max-w-sm animate-in slide-in-from-top-4">
            <div className="bg-emerald-500 border border-emerald-400 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <RefreshCw size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-tight">
                                Update Available
                            </h3>
                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-100">
                                New Version Ready
                            </p>
                        </div>
                    </div>

                    <p className="text-xs text-white/90 leading-relaxed mb-4">
                        A new version of Paradigm-Xi is available. Refresh to get the latest features and improvements.
                    </p>

                    <button
                        onClick={handleUpdate}
                        disabled={updating}
                        className="w-full py-3 px-4 bg-white hover:bg-slate-100 rounded-xl text-emerald-600 font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-lg disabled:opacity-50"
                    >
                        {updating ? (
                            <span className="flex items-center justify-center gap-2">
                                <RefreshCw size={12} className="animate-spin" />
                                Updating...
                            </span>
                        ) : (
                            'Update Now'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
