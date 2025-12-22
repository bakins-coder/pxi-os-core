import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { AIAgentMode, InteractionChannel, AgenticLog } from '../types';
import { 
  Bot, Shield, Zap, Activity, ShieldAlert, Radio, Clock, 
  ChevronRight, ArrowUpRight, Cpu, ToggleLeft, ToggleRight,
  ShieldCheck, MessageSquare, Phone, Mail, AlertTriangle, 
  Globe, MoreVertical, Server, Database, BarChart3, TrendingUp, Check, X
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

export const Agent = () => {
  const [mode, setMode] = useState<AIAgentMode>(db.organizationSettings.agentMode);
  const [activeView, setActiveView] = useState<'monitor' | 'approvals' | 'governance'>('monitor');
  const [logs, setLogs] = useState<AgenticLog[]>(db.agenticLogs);

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setMode(db.organizationSettings.agentMode);
      setLogs([...db.agenticLogs]);
    });
    return unsubscribe;
  }, []);

  const pendingApprovals = logs.filter(l => l.outcome === 'Escalated' || l.outcome === 'Pending Approval');

  const handleApprove = (logId: string) => {
    const log = db.agenticLogs.find(l => l.id === logId);
    if (log) {
       log.outcome = 'Resolved';
       log.actionTaken = 'Manual Approval Granted';
       db.notify();
    }
  };

  return (
    <div className="space-y-6">
       <div className="bg-slate-950 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl animate-float">
                   <Bot size={36} />
                </div>
                <div>
                   <h1 className="text-3xl font-black tracking-tighter">OmniAgent Hub</h1>
                   <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-300 border border-white/5">
                         <Radio size={12} className="animate-pulse text-indigo-400"/> Autonomous Loop Active
                      </span>
                   </div>
                </div>
             </div>

             <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
                {[AIAgentMode.HUMAN_FIRST, AIAgentMode.HYBRID, AIAgentMode.AI_AGENTIC].map(m => (
                   <button key={m} onClick={() => db.setAgentMode(m)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-indigo-600 text-white' : 'text-white/50'}`}>
                      {m}
                   </button>
                ))}
             </div>
          </div>
       </div>

       <div className="flex gap-4 border-b border-slate-200">
          {[
            { id: 'monitor', label: 'Monitor', icon: Activity },
            { id: 'approvals', label: 'Approval Queue', icon: ShieldCheck, count: pendingApprovals.length },
            { id: 'governance', label: 'Governance', icon: Shield }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveView(tab.id as any)} className={`pb-4 px-4 text-sm font-black uppercase tracking-widest flex items-center gap-2 transition-all relative ${activeView === tab.id ? 'text-indigo-600' : 'text-slate-400'}`}>
               <tab.icon size={16}/> {tab.label}
               {tab.count !== undefined && tab.count > 0 && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[9px]">{tab.count}</span>}
               {activeView === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full"></div>}
            </button>
          ))}
       </div>

       {activeView === 'approvals' && (
          <div className="space-y-4 animate-in slide-in-from-bottom-4">
             {pendingApprovals.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 italic">No actions pending human approval.</div>
             ) : (
                pendingApprovals.map(log => (
                   <div key={log.id} className="bg-white p-6 rounded-3xl border-2 border-indigo-50 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex-1">
                         <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-2 py-0.5 rounded">High Probability Intent</span>
                            <span className="text-[10px] font-bold text-slate-400">{log.channel} • {new Date(log.timestamp).toLocaleTimeString()}</span>
                         </div>
                         <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight mb-2">AI Intent: {log.intent}</h4>
                         <p className="text-slate-600 text-sm italic mb-4">"Reasoning: {log.reasoning}"</p>
                      </div>
                      <div className="flex gap-2">
                         <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"><X size={24}/></button>
                         <button onClick={() => handleApprove(log.id)} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2">
                            <Check size={20}/> Confirm Action
                         </button>
                      </div>
                   </div>
                ))
             )}
          </div>
       )}

       {activeView === 'monitor' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-6">Throughput Efficiency</h3>
                   <div className="h-64 w-full">
                      <ResponsiveContainer>
                         <AreaChart data={[{t: '09:00', v: 40}, {t: '10:00', v: 80}, {t: '11:00', v: 65}, {t: '12:00', v: 95}]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <Tooltip />
                            <Area type="monotone" dataKey="v" stroke="#4f46e5" strokeWidth={4} fill="#4f46e5" fillOpacity={0.1} />
                         </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </div>
             </div>
             <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">System Node Status</h3>
                <div className="space-y-4">
                   {['Reasoning Engine', 'Grounding Search', 'Vision API', 'Database Loop'].map(node => (
                      <div key={node} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                         <span className="text-xs font-bold text-slate-300">{node}</span>
                         <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">Stable</span>
                      </div>
                   ))}
                </div>
             </div>
          </div>
       )}
    </div>
  );
};