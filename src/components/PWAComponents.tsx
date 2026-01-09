
import React, { useState, useEffect } from 'react';
import { X, Download, RefreshCw } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showManualInstructions, setShowManualInstructions] = useState(false);

    useEffect(() => {
        // Check if already installed
        const checkStandalone = () => {
            const isStand = window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone ||
                document.referrer.includes('android-app://');
            setIsStandalone(isStand);
        };

        checkStandalone();
        window.addEventListener('resize', checkStandalone); // Orientation change might trigger query update

        // Check if user dismissed it recently (7 days)
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed && !showManualInstructions) {
            const dismissedTime = parseInt(dismissed);
            if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
                // We want to show the persistent button anyway, just maybe not auto-expand
            }
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        // Check if event already fired and was captured globally
        if ((window as any).deferredPrompt) {
            setDeferredPrompt((window as any).deferredPrompt);
            setShowPrompt(true);
        }

        window.addEventListener('beforeinstallprompt', handler);
        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('resize', checkStandalone);
        };
    }, [showManualInstructions]);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowPrompt(false);
                setDeferredPrompt(null);
            }
        } else {
            // Fallback: Show manual instructions
            setShowManualInstructions(true);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    };

    if (isStandalone) return null;

    // Manual Instruction Modal
    if (showManualInstructions) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl relative">
                    <button onClick={() => setShowManualInstructions(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-2"><Download size={32} /></div>
                        <h3 className="text-xl font-black text-slate-900 uppercase">Install Manually</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Since you are viewing this on a secure preview or local network, the automatic prompt might be blocked by Android.
                        </p>
                        <div className="w-full bg-slate-50 p-4 rounded-xl text-left space-y-3 border border-slate-100">
                            <div className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-black">1</span>
                                <p className="text-xs font-bold text-slate-700">Tap the browser menu (3 dots) at the top right.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-black">2</span>
                                <p className="text-xs font-bold text-slate-700">Select <span className="text-indigo-600">"Add to Home screen"</span> or "Install App".</p>
                            </div>
                        </div>
                        <button onClick={() => setShowManualInstructions(false)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-widest">Got it</button>
                    </div>
                </div>
            </div>
        );
    }

    // Persistent Floating Button (Always visible if not standalone)
    return (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 flex flex-col items-end gap-4">
            {/* Auto Prompt Card - Only if event captured */}
            {showPrompt && deferredPrompt && (
                <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 max-w-xs mb-2">
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="text-sm font-black text-white uppercase">Install App</h3>
                        <button onClick={handleDismiss}><X size={16} className="text-slate-400" /></button>
                    </div>
                    <p className="text-xs text-slate-300 mb-4">Get the native app experience with offline access.</p>
                    <button onClick={handleInstall} className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg">Install Now</button>
                </div>
            )}

            {/* Persistent Mini FAB */}
            {!showPrompt && (
                <button
                    onClick={handleInstall}
                    className="flex items-center gap-3 px-5 py-3 bg-slate-900/90 backdrop-blur-md text-white rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all border border-white/10"
                >
                    <Download size={16} className="text-[#00ff9d]" />
                    <span className="hidden md:inline">Install App</span>
                    <span className="md:hidden">Install</span>
                </button>
            )}
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
