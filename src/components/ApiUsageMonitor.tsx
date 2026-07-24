import React, { useEffect, useState } from 'react';
import { useApiUsageStore } from '../store/useApiUsageStore';
import { useAuthStore } from '../store/useAuthStore';
import { Activity, AlertTriangle } from 'lucide-react';

export const ApiUsageMonitor: React.FC = () => {
    const user = useAuthStore((state) => state.user);
    const { getMetrics, cleanup } = useApiUsageStore();
    const [metrics, setMetrics] = useState({ rpm: 0, rpd: 0, tpm: 0 });

    // Only show for super admin
    const isSuperAdmin = user?.role?.toLowerCase() === 'super admin' || user?.role?.toLowerCase() === 'system_admin';

    useEffect(() => {
        if (!isSuperAdmin) return;

        // Update metrics every 2 seconds
        const intervalId = setInterval(() => {
            cleanup();
            setMetrics(getMetrics());
        }, 2000);

        // Initial fetch
        cleanup();
        setMetrics(getMetrics());

        return () => clearInterval(intervalId);
    }, [isSuperAdmin, getMetrics, cleanup]);

    if (!isSuperAdmin) return null;

    const { rpm, rpd, tpm } = metrics;

    // Warning thresholds
    const isRpmHigh = rpm >= 12; // Limit 15
    const isRpmCritical = rpm >= 15;
    
    const isRpdHigh = rpd >= 1200; // Limit 1500
    const isRpdCritical = rpd >= 1500;
    
    const isTpmHigh = tpm >= 800000; // Limit 1M
    const isTpmCritical = tpm >= 1000000;

    return (
        <div className="fixed bottom-4 left-4 z-[9999] bg-slate-900 text-slate-300 text-xs rounded-lg shadow-xl border border-slate-700 p-3 flex flex-col gap-2 w-48 font-mono opacity-90 hover:opacity-100 transition-opacity backdrop-blur-sm">
            <div className="flex items-center gap-2 border-b border-slate-700 pb-2 mb-1">
                <Activity size={14} className="text-emerald-400" />
                <span className="font-semibold text-slate-100 uppercase tracking-wider text-[10px]">API Diagnostics</span>
            </div>
            
            <div className="flex justify-between items-center">
                <span className="text-slate-400">RPM (60s)</span>
                <div className={`font-medium flex items-center gap-1 ${isRpmCritical ? 'text-red-400' : isRpmHigh ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {rpm} / 15
                    {isRpmHigh && <AlertTriangle size={12} />}
                </div>
            </div>
            
            <div className="flex justify-between items-center">
                <span className="text-slate-400">RPD (24h)</span>
                <div className={`font-medium flex items-center gap-1 ${isRpdCritical ? 'text-red-400' : isRpdHigh ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {rpd} / 1.5k
                    {isRpdHigh && <AlertTriangle size={12} />}
                </div>
            </div>
            
            <div className="flex justify-between items-center">
                <span className="text-slate-400">TPM (60s)</span>
                <div className={`font-medium flex items-center gap-1 ${isTpmCritical ? 'text-red-400' : isTpmHigh ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {(tpm / 1000).toFixed(1)}k / 1M
                    {isTpmHigh && <AlertTriangle size={12} />}
                </div>
            </div>
        </div>
    );
};
