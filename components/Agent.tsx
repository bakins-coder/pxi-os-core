
import React, { useState, useEffect } from 'react';
import { nexusStore } from '../services/nexusStore';
import { AIAgentMode, AgenticLog } from '../types';
import { 
  Bot, Shield, Zap, Activity, Radio,
  ShieldCheck, Check, X
} from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, CartesianGrid, XAxis } from 'recharts';

export const Agent = () => {
  const [mode, setMode] = useState<AIAgentMode>(nexusStore.organizationSettings.agentMode);
  const [activeView, setActiveView] = useState<'monitor' | 'approvals' | 'governance'>('monitor');
  const [logs, setLogs] = useState<AgenticLog[]>(nexusStore.agenticLogs);

  useEffect(() => {
    const unsubscribe = nexusStore.subscribe(() => {
      setMode(nexusStore.organizationSettings.agentMode);
      setLogs([...nexusStore.agenticLogs]);
    });
    return unsubscribe;
  }, []);

  const pendingApprovals = logs.filter(l => l.outcome === 'Escalated' || l.outcome === 'Pending Approval');

  const handleApprove = (logId: string) => {
    const log = nexusStore.agenticLogs.find(l => l.id === logId);
    if (log) {
       log.outcome = 'Resolved';
       log.actionTaken = 'Manual Approval Granted';
       nexusStore.notify();
    }
  };

  return (
    <div className="space-y-6">
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
                         <Radio size={12} className="animate-pulse text-[#00ff9d]"/> Autonomous Loop Active
                      </span>
                   </div>
                </div>
             </div>

             <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
                {[AIAgentMode.HUMAN_FIRST, AIAgentMode.HYBRID, AIAgentMode.AI_AGENTIC].map(m => (
                   <button key={m} onClick={() => nexusStore.setAgentMode(m)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-[#00ff9d] text-slate-950' : 'text-white/50'}`}>
                      {m}
                   </button>
                ))}
             </div>
          </div>
       </div>

       <div className="flex gap-4 border-b border-slate-200">
          {[
            { id: 'monitor', label: 'Monitor', icon: Activity },
            { id: 'approvals', label: 'Approval Queue', icon: ShieldCheck, count: pendingApprovals.length }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveView(tab.id as any)} className={`pb-4 px-4 text-sm font-black uppercase tracking-widest flex items-center gap-2 transition-all relative ${activeView === tab.id ? 'text-indigo-600' : 'text-slate-400'}`}>
               <tab.icon size={16}/> {tab.label}
               {tab.count !== undefined && tab.count > 0 && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[9px]">{tab.count}</span>}
               {activeView === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full"></div>}
            </button>
          ))}
       </div>

       {activeView === 'monitor' && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-96">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{t: '09:00', v: 40}, {t: '10:00', v: 80}, {t: '11:00', v: 65}, {t: '12:00', v: 95}]}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="t" hide />
                   <Tooltip />
                   <Area type="monotone" dataKey="v" stroke="#00ff9d" strokeWidth={4} fill="#00ff9d" fillOpacity={0.1} />
                </AreaChart>
             </ResponsiveContainer>
          </div>
       )}
    </div>
  );
};
