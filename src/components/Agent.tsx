
import React, { useState, useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { AIAgentMode, AgenticLog } from '../types';
import {
   Bot, Shield, Zap, Activity, Radio,
   ShieldCheck, Check, X, MessageCircle, Send, Paperclip, Mic, Globe, Smartphone, FileText
} from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, CartesianGrid, XAxis } from 'recharts';

export const Agent = () => {
   const settings = useSettingsStore(s => s.settings);
   const updateSettings = useSettingsStore(s => s.updateSettings);
   const { agenticLogs: logs } = useDataStore();

   const mode = settings.agentMode;
   const [activeView, setActiveView] = useState<'monitor' | 'approvals' | 'channels'>('monitor');

   const pendingApprovals = useMemo(() =>
      logs.filter(l => l.outcome === 'Escalated' || l.outcome === 'Pending Approval')
      , [logs]);

   const handleApprove = (logId: string) => {
      // In a real system, this would call a store action to update the log
      console.log('Manually approving log:', logId);
   };

   const handleSetAgentMode = (newMode: AIAgentMode) => {
      updateSettings({ agentMode: newMode });
   };

   return (
      <div className="space-y-6 pb-20 animate-in fade-in">
         <div className="bg-slate-950 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#00ff9d]/20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-[#00ff9d] rounded-3xl flex items-center justify-center shadow-2xl animate-float">
                     <Bot size={36} className="text-slate-950" />
                  </div>
                  <div>
                     <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">OmniAgent Hub</h1>
                     <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#00ff9d] border border-white/5">
                           <Radio size={12} className="animate-pulse text-[#00ff9d]" /> Autonomous Loop Active
                        </span>
                     </div>
                  </div>
               </div>

               <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
                  {[AIAgentMode.HUMAN_FIRST, AIAgentMode.HYBRID, AIAgentMode.AI_AGENTIC].map(m => (
                     <button key={m} onClick={() => handleSetAgentMode(m)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-[#00ff9d] text-slate-950 shadow-lg' : 'text-white/50 hover:text-white'}`}>
                        {m}
                     </button>
                  ))}
               </div>
            </div>
         </div>

         <div className="flex gap-4 border-b border-slate-200">
            {[
               { id: 'monitor', label: 'Telemetry', icon: Activity },
               { id: 'channels', label: 'Live Channels', icon: Globe },
               { id: 'approvals', label: 'Guardrail Hits', icon: ShieldCheck, count: pendingApprovals.length }
            ].map(tab => (
               <button key={tab.id} onClick={() => setActiveView(tab.id as any)} className={`pb-4 px-4 text-sm font-black uppercase tracking-widest flex items-center gap-2 transition-all relative ${activeView === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                  <tab.icon size={16} /> {tab.label}
                  {tab.count !== undefined && tab.count > 0 && <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[9px] animate-pulse">{tab.count}</span>}
                  {activeView === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full animate-in zoom-in"></div>}
               </button>
            ))}
         </div>

         {activeView === 'monitor' && (
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl h-96">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[{ t: '09:00', v: 40 }, { t: '10:00', v: 80 }, { t: '11:00', v: 65 }, { t: '12:00', v: 95 }, { t: '13:00', v: 85 }]}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="t" hide />
                     <Tooltip />
                     <Area type="monotone" dataKey="v" stroke="#00ff9d" strokeWidth={4} fill="#00ff9d" fillOpacity={0.1} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         )}

         {activeView === 'channels' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col h-[600px]">
                  <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg"><MessageCircle size={24} /></div>
                        <div>
                           <h3 className="font-black text-slate-800 uppercase tracking-tight">WhatsApp / Telegram Bridge</h3>
                           <p className="text-[10px] text-slate-400 font-black uppercase">Live Neural Socket 8080</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase text-emerald-600">Syncing</span>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30">
                     <div className="flex gap-4">
                        <div className="w-10 h-10 bg-slate-200 rounded-xl shrink-0"></div>
                        <div className="space-y-2">
                           <div className="bg-white p-5 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 max-w-sm">
                              <p className="text-sm font-medium text-slate-700">"Hello Xquisite! Sending the venue photos via WhatsApp now. We need to accommodate 300 guests instead of 250."</p>
                           </div>
                           <div className="flex items-center gap-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                              <Bot size={16} className="text-indigo-600" />
                              <span className="text-[10px] font-black uppercase text-indigo-600">AI Note: Updated Event guestCount to 300.</span>
                           </div>
                        </div>
                     </div>

                     <div className="flex gap-4">
                        <div className="w-10 h-10 bg-slate-200 rounded-xl shrink-0"></div>
                        <div className="space-y-2 flex-1">
                           <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 flex items-center gap-4 max-w-sm">
                              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center"><FileText className="text-slate-400" /></div>
                              <div><p className="text-xs font-black uppercase text-slate-800">Layout_Plan.pdf</p><p className="text-[10px] text-slate-400">Telegram Doc • 2.4MB</p></div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="p-8 border-t border-slate-100 bg-white flex gap-4">
                     <button className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all"><Paperclip /></button>
                     <input className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none" placeholder="Reply to external channel..." />
                     <button className="p-4 bg-slate-950 text-[#00ff9d] rounded-2xl shadow-xl"><Send /></button>
                  </div>
               </div>

               <div className="space-y-8">
                  <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff9d]/10 rounded-full blur-3xl"></div>
                     <h3 className="text-[10px] font-black text-[#00ff9d] uppercase tracking-[0.3em] mb-8">Channel Telemetry</h3>
                     <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                           <div className="flex items-center gap-3 mb-4">
                              <Smartphone size={20} className="text-emerald-400" />
                              <span className="text-[10px] font-black uppercase">WhatsApp</span>
                           </div>
                           <p className="text-2xl font-black">24 Active</p>
                        </div>
                        <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                           <div className="flex items-center gap-3 mb-4">
                              <Globe size={20} className="text-blue-400" />
                              <span className="text-[10px] font-black uppercase">Telegram</span>
                           </div>
                           <p className="text-2xl font-black">12 Active</p>
                        </div>
                     </div>
                  </div>

                  <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
                     <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-8 leading-none">Automated Extractions</h3>
                     <div className="space-y-6">
                        {[
                           { label: 'Entity Identification', status: 'Optimal', val: '98%' },
                           { label: 'Voice Intent Clarity', status: 'Stabilizing', val: '84%' },
                           { label: 'OCR Document Read', status: 'Optimal', val: '92%' }
                        ].map(stat => (
                           <div key={stat.label}>
                              <div className="flex justify-between items-center mb-2">
                                 <span className="text-[10px] font-black uppercase text-slate-400">{stat.label}</span>
                                 <span className="text-[10px] font-black uppercase text-indigo-600">{stat.val}</span>
                              </div>
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                 <div className="h-full bg-indigo-500" style={{ width: stat.val }}></div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeView === 'approvals' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {pendingApprovals.map(log => (
                  <div key={log.id} className="bg-white p-8 rounded-[3rem] border-2 border-rose-100 shadow-xl flex flex-col justify-between">
                     <div>
                        <div className="flex justify-between items-start mb-6">
                           <div className="p-4 bg-rose-50 rounded-2xl text-rose-600"><Shield size={24} /></div>
                           <span className="px-3 py-1 bg-rose-50 text-rose-700 text-[10px] font-black uppercase rounded-full border border-rose-100">{log.outcome}</span>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Policy Violation Hit</h3>
                        <p className="text-slate-500 text-sm font-medium mb-8">Agent: {log.intent} | Violation: {log.policyApplied}</p>
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 mb-8 italic text-slate-600 text-sm">
                           "{log.reasoning}"
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <button onClick={() => handleApprove(log.id)} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-100 active:scale-95 transition-all">Authorize Action</button>
                        <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Discard</button>
                     </div>
                  </div>
               ))}
               {pendingApprovals.length === 0 && (
                  <div className="col-span-2 p-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-300">
                     <ShieldCheck size={64} className="mx-auto mb-4 opacity-10" />
                     <p className="font-black uppercase tracking-widest">No Guardrail Alerts</p>
                  </div>
               )}
            </div>
         )}
      </div>
   );
};
