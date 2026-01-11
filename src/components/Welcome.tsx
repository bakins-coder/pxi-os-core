import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Zap, BarChart2, Users } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const Welcome = () => {
    const { user, logout } = useAuthStore();

    return (
        <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#00ff9d]/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2"></div>

            <div className="max-w-4xl w-full z-10">
                <div className="text-center mb-16 space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[#00ff9d] text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-4">
                        <Sparkles size={14} /> Welcome to Paradigm-Xi
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                        Ready to Initialize<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff9d] to-indigo-500">Your Workspace?</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-xl max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
                        Hello <span className="text-white">{user?.name}</span>. You are one step away from deploying your intelligent operating system.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    {[
                        { icon: ShieldCheck, title: 'Secure Environment', desc: 'Enterprise-grade isolation for your data.' },
                        { icon: Zap, title: 'Neural Automation', desc: 'AI agents ready to optimize operations.' },
                        { icon: BarChart2, title: 'Real-time Intelligence', desc: 'Live analytics and financial tracking.' }
                    ].map((feature, i) => (
                        <div key={i} className="bg-white/5 border border-white/5 p-8 rounded-3xl hover:bg-white/10 transition-colors group">
                            <feature.icon size={32} className="text-[#00ff9d] mb-4 group-hover:scale-110 transition-transform" />
                            <h3 className="text-lg font-black uppercase tracking-tight mb-2">{feature.title}</h3>
                            <p className="text-slate-400 text-sm font-medium">{feature.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                    <button
                        onClick={() => window.location.hash = '/setup-wizard'}
                        className="group relative px-12 py-6 bg-[#00ff9d] text-slate-950 rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] shadow-[0_0_40px_rgba(0,255,157,0.3)] hover:shadow-[0_0_60px_rgba(0,255,157,0.5)] hover:scale-105 active:scale-95 transition-all w-full md:w-auto"
                    >
                        <span className="flex items-center justify-center gap-4">
                            Create Organisation <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                        </span>
                    </button>

                    <button onClick={logout} className="text-slate-500 text-xs font-black uppercase tracking-widest hover:text-white transition-colors">
                        Sign Out / Switch Account
                    </button>
                </div>
            </div>
        </div>
    );
};
