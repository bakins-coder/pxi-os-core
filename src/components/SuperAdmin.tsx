
import React, { useState } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useDataStore } from '../store/useDataStore';
import {
    Shield, Globe, Palette, Zap, Building2, TrendingUp, AlertCircle,
    CheckCircle2, Server, Terminal, Lock, Unlock, Moon, Sun, Monitor,
    LayoutDashboard
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const mockClientBanks = [
    { id: '1', name: 'Xquisite Celebrations', status: 'Healthy', revenue: 45000000, projects: 12, health: 98 },
    { id: '2', name: 'Nebula Events', status: 'Warning', revenue: 12000000, projects: 5, health: 72 },
    { id: '3', name: 'Quantum Catering', status: 'Healthy', revenue: 8500000, projects: 8, health: 91 },
    { id: '4', name: 'Solaris Hospitality', status: 'Restricted', revenue: 0, projects: 0, health: 15 },
];

const revenueData = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 2000 },
    { name: 'Thu', revenue: 2780 },
    { name: 'Fri', revenue: 1890 },
    { name: 'Sat', revenue: 2390 },
    { name: 'Sun', revenue: 3490 },
];

export const SuperAdmin = () => {
    const { settings, setBrandColor, strictMode } = useSettingsStore();
    const brandColor = settings.brandColor || '#00ff9d';
    const [activeTab, setActiveTab] = useState<'matrix' | 'branding' | 'security'>('matrix');

    const handleToggleStrictMode = () => {
        // In a real app, this would update a global system flag
        useSettingsStore.setState({ strictMode: !strictMode });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Block */}
            <div className="bg-slate-950 p-10 rounded-[3rem] border border-white/5 relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[100px] opacity-20 -mr-40 -mt-40 transition-colors duration-1000" style={{ backgroundColor: brandColor }}></div>

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse" style={{ backgroundColor: brandColor }}>
                            <Shield size={40} className="text-slate-950" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase leading-none text-white">Super-Admin <span style={{ color: brandColor }}>Control Center</span></h1>
                            <div className="flex items-center gap-4 mt-3">
                                <span className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 text-slate-400">
                                    <Server size={12} style={{ color: brandColor }} /> Global Grid Protocol v2.4
                                </span>
                                <span className="flex items-center gap-2 bg-[#00ff9d]/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-[#00ff9d]/20 text-[#00ff9d]">
                                    <Terminal size={12} /> Root Access Confirmed
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-xl">
                        {[
                            { id: 'matrix', label: 'Client Matrix', icon: Globe },
                            { id: 'branding', label: 'Theme Engine', icon: Palette },
                            { id: 'security', label: 'Shield & AI', icon: Zap }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === tab.id ? 'text-slate-950 shadow-xl' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                                style={activeTab === tab.id ? { backgroundColor: brandColor } : {}}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {activeTab === 'matrix' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Client Table Card */}
                    <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-md rounded-[3rem] border border-white/5 overflow-hidden">
                        <div className="p-8 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white">Multi-Tenant Client Banks</h2>
                            <button className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">Export Ledger</button>
                        </div>
                        <div className="p-4 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                        <th className="px-6 py-4">Client Identifier</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Revenue (NGN)</th>
                                        <th className="px-6 py-4">Health Index</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {mockClientBanks.map(client => (
                                        <tr key={client.id} className="group hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">{client.name[0]}</div>
                                                    <span className="text-sm font-bold text-white uppercase tracking-tight">{client.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${client.status === 'Healthy' ? 'bg-emerald-500/10 text-emerald-400' :
                                                        client.status === 'Warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                                                    }`}>
                                                    {client.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-right font-black text-white text-sm">
                                                ₦{(client.revenue / 100).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-1000"
                                                            style={{
                                                                width: `${client.health}%`,
                                                                backgroundColor: client.health > 80 ? '#10b981' : client.health > 50 ? '#f59e0b' : '#ef4444'
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-black text-slate-400">{client.health}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Platform Performance Card */}
                    <div className="bg-slate-900/50 backdrop-blur-md rounded-[3rem] border border-white/5 p-8 flex flex-col">
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white mb-8">Platform Velocity</h2>
                        <div className="flex-1 min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={brandColor} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={brandColor} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                    <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#020617', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px' }}
                                        itemStyle={{ color: brandColor }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke={brandColor} fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Global Uptime</span>
                                <span className="text-xs font-black text-[#00ff9d]">99.998%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-[#00ff9d] w-[99.9%]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'branding' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-900/50 backdrop-blur-md rounded-[3rem] border border-white/5 p-12">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8">Theme Engine</h2>

                        <div className="space-y-12">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 block">Primary Brand Color</label>
                                <div className="flex items-center gap-6">
                                    <input
                                        type="color"
                                        value={brandColor}
                                        onChange={(e) => setBrandColor(e.target.value)}
                                        className="w-20 h-20 rounded-2xl bg-transparent border-4 border-white/10 cursor-pointer overflow-hidden shadow-2xl"
                                    />
                                    <div>
                                        <p className="text-xl font-black text-white uppercase tracking-widest mb-1">{brandColor}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">HEX PROTOCOL ACTIVE</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 block">Style Presets</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { name: 'Xquisite Red', color: '#ff6b6b' },
                                        { name: 'Neon Paradigm', color: '#00ff9d' },
                                        { name: 'Indigo Orbit', color: '#6366f1' },
                                        { name: 'Aureate Gold', color: '#f59e0b' }
                                    ].map(preset => (
                                        <button
                                            key={preset.name}
                                            onClick={() => setBrandColor(preset.color)}
                                            className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col gap-2 group"
                                        >
                                            <div className="w-full h-2 rounded-full" style={{ backgroundColor: preset.color }}></div>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white">{preset.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-950 rounded-[3rem] border border-white/5 p-12 relative overflow-hidden flex flex-col items-center justify-center text-center">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[100px] opacity-10" style={{ backgroundColor: brandColor }}></div>
                        <div className="relative z-10 w-full space-y-8">
                            <div className="w-32 h-32 mx-auto rounded-3xl border-2 border-dashed border-white/20 flex items-center justify-center" style={{ borderColor: `${brandColor}44` }}>
                                <Monitor size={48} className="text-white/20" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-2">Platform Preview</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                                    Theme changes are synchronized across all <br />tenant nodes in real-time.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <div className="w-8 h-2 rounded-full mb-2" style={{ backgroundColor: brandColor }}></div>
                                    <div className="w-12 h-1 bg-white/10 rounded-full"></div>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: brandColor }}>
                                        <CheckCircle2 size={12} className="text-slate-950" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'security' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* AI Control Card */}
                    <div className="bg-slate-900/50 backdrop-blur-md rounded-[3rem] border border-white/5 p-12">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Neural Oversight (AI)</h2>
                                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Global Kill-Switch Interface</p>
                            </div>
                        </div>

                        <div className="bg-slate-950/50 p-8 rounded-[2rem] border border-white/5">
                            <div className="flex justify-between items-center gap-10">
                                <div className="space-y-2">
                                    <h3 className="text-lg font-black text-white uppercase tracking-tighter">Strict Mode</h3>
                                    <p className="text-xs text-slate-500 font-bold leading-relaxed uppercase tracking-tight">
                                        Immediately deactivates all autonomous AI agents and automated neural pathways. System reverts to pure manual orchestration.
                                    </p>
                                </div>
                                <button
                                    onClick={handleToggleStrictMode}
                                    className={`w-28 h-12 rounded-full p-1.5 transition-all duration-500 flex items-center ${strictMode ? 'bg-rose-500' : 'bg-slate-800'}`}
                                >
                                    <div className={`h-full aspect-square rounded-full transition-all duration-500 flex items-center justify-center ${strictMode ? 'ml-[calc(100%-2.5rem)] bg-white text-rose-500' : 'bg-slate-600 text-slate-400'}`}>
                                        {strictMode ? <Lock size={14} /> : <Unlock size={14} />}
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-1 gap-4">
                            {[
                                { label: 'Auto-Post Generation', desc: 'Marketing automation pipeline', active: !strictMode },
                                { label: 'Neural Receipt Analysis', desc: 'Optical ledger character recognition', active: !strictMode },
                                { label: 'Logistics Orchestrator', desc: 'Predictive van dispatching', active: !strictMode }
                            ].map(feat => (
                                <div key={feat.label} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center opacity-70">
                                    <div>
                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">{feat.label}</p>
                                        <p className="text-[8px] text-slate-600 uppercase font-black">{feat.desc}</p>
                                    </div>
                                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${feat.active ? 'text-[#00ff9d]' : 'text-slate-600 italic'}`}>
                                        {feat.active ? 'ACTIVE' : 'DISABLED'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Access Logs */}
                    <div className="bg-slate-950 rounded-[3rem] border border-white/5 p-12 overflow-hidden flex flex-col">
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white mb-10">Global Authentication Logs</h2>
                        <div className="space-y-6 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10">
                            {[
                                { user: 'Admin User', action: 'Access Matrix', time: '2m ago', icon: Shield },
                                { user: 'System Root', action: 'Build Hydration', time: '14m ago', icon: Server },
                                { user: 'Finance Node', action: 'Ledger Commit', time: '38m ago', icon: Building2 },
                                { user: 'Agent 01', action: 'Neural Sync', time: '1h ago', icon: Zap },
                                { user: 'System Root', action: 'State Persist', time: '4h ago', icon: Server },
                            ].map((log, i) => (
                                <div key={i} className="flex gap-4 items-center group">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 group-hover:text-[#00ff9d] group-hover:border-[#00ff9d]/20 transition-all">
                                        <log.icon size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[10px] font-black text-white uppercase tracking-tight">{log.user}</p>
                                            <span className="text-[8px] font-bold text-slate-600 uppercase italic">{log.time}</span>
                                        </div>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{log.action}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="mt-12 w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                            Clear Auth Cache
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
