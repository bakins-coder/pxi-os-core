
import React, { useState, useEffect } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { AIAgent, OrganizationType } from '../types';
import { generateAIResponse } from '../services/ai';
import {
   Bot, Sparkles, ChevronRight, Phone, Mic, ShieldAlert, Zap, Globe,
   Settings, Play, Plus, Sliders, X, ArrowRight, Activity, Speaker, Brain, GripHorizontal
} from 'lucide-react';

export const AgentHub = () => {
   const { aiAgents: agents, addAIAgent } = useDataStore();
   const strictMode = useSettingsStore(s => s.strictMode);
   const [isCreating, setIsCreating] = useState(false);
   const [newAgent, setNewAgent] = useState<Partial<AIAgent>>({
      industry: 'Catering',
      objective: 'Customer Engagement',
      voice: { name: 'Kore', accent: 'American', traits: ['Helpful'], speed: 1.0 },
      telephony: { phoneNumber: '', areaCode: '01', liveTransferNumber: '', callbackEnabled: true },
      intelligence: { kycQuestions: [], guardrails: [], script: '' }
   });

   return (
      <div className="space-y-8 animate-in fade-in pb-20">
         <div className="flex justify-between items-center mb-8">
            <div>
               <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Command Center</h1>
               <p className="text-slate-500 font-medium">Create and manage your intelligent assistants.</p>
            </div>
            <button
               onClick={() => setIsCreating(true)}
               disabled={strictMode}
               className={`${strictMode ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-950 text-white active:scale-95'} px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl flex items-center gap-3 transition-all`}
            >
               {strictMode ? <ShieldAlert size={18} /> : <Plus size={18} />}
               {strictMode ? 'Creation Restricted' : 'Create Virtual Assistant'}
            </button>
         </div>

         {strictMode && (
            <div className="bg-amber-50 border-2 border-amber-200 p-8 rounded-[2.5rem] flex items-center gap-6 animate-pulse">
               <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <ShieldAlert size={24} />
               </div>
               <div>
                  <h3 className="text-lg font-black text-amber-900 uppercase tracking-tighter">AI Strict Mode Active</h3>
                  <p className="text-xs text-amber-700 font-bold uppercase tracking-widest">Global kill-switch has been engaged by Super Admin. All autonomous agents are currently locked in manual override.</p>
               </div>
            </div>
         )}

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {agents.map(agent => (
               <div key={agent.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-2xl flex flex-col group hover:border-[#00ff9d] transition-all">
                  <div className="flex items-center gap-4 mb-10">
                     <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-[#00ff9d] group-hover:scale-110 transition-transform"><Bot size={32} /></div>
                     <div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">{agent.name}</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{agent.title}</p>
                     </div>
                  </div>
                  <div className="space-y-3 flex-1 mb-8">
                     <div className="p-4 bg-slate-50 rounded-2xl flex justify-between font-black text-[10px] uppercase">
                        <span className="text-slate-400">Primary Task</span>
                        <span className="text-slate-700">{agent.objective}</span>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-2xl flex justify-between font-black text-[10px] uppercase">
                        <span className="text-slate-400">Status</span>
                        <span className="text-green-600">{agent.status === 'Deployed' ? 'Active' : agent.status}</span>
                     </div>
                  </div>
                  <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Configure Settings</button>
               </div>
            ))}
            {agents.length === 0 && (
               <div className="col-span-full p-20 text-center bg-white rounded-[3.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300">
                  <Bot size={64} className="mb-6 opacity-10" />
                  <p className="font-black uppercase tracking-[0.2em] text-xs">No autonomous agents initialized</p>
               </div>
            )}
         </div>

         {isCreating && (
            <div className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
               <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col border border-slate-200">
                  <div className="p-8 border-b-2 border-slate-100 bg-slate-50/80 flex justify-between items-center cursor-grab active:cursor-grabbing">
                     <div className="flex items-center gap-4">
                        <GripHorizontal className="text-slate-300" />
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Assistant Config</h2>
                     </div>
                     <button onClick={() => setIsCreating(false)} className="p-3 bg-white border border-slate-100 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm"><X size={20} /></button>
                  </div>

                  <div className="p-10 space-y-8 flex-1 overflow-y-auto scrollbar-thin">
                     <div>
                        <label className="text-[11px] font-black uppercase text-slate-600 tracking-widest ml-2 mb-3 block">Assistant Persona Name</label>
                        <input
                           className="w-full p-5 bg-white border-2 border-slate-200 rounded-[1.5rem] font-black text-slate-900 text-lg outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300"
                           placeholder="e.g., Xquisite Concierge"
                           value={newAgent.name}
                           onChange={e => setNewAgent({ ...newAgent, name: e.target.value })}
                        />
                     </div>
                     <div>
                        <label className="text-[11px] font-black uppercase text-slate-600 tracking-widest ml-2 mb-3 block">Operational Industry Sector</label>
                        <select
                           className="w-full p-5 bg-white border-2 border-slate-200 rounded-[1.5rem] font-black text-slate-900 text-lg outline-none focus:border-indigo-500 transition-all cursor-pointer"
                           value={newAgent.industry}
                           onChange={e => setNewAgent({ ...newAgent, industry: e.target.value as any })}
                        >
                           <option>Hospitality</option>
                           <option>Financial Services</option>
                           <option>Logistics</option>
                        </select>
                     </div>
                     <div className="p-6 bg-indigo-50 border-2 border-indigo-100 rounded-[2rem] flex items-start gap-4">
                        <Sparkles className="text-indigo-600 shrink-0" size={24} />
                        <p className="text-[11px] font-bold text-indigo-900 leading-relaxed uppercase">Strategic Protocol: This assistant will be initialized with autonomous capability once active.</p>
                     </div>
                  </div>

                  <div className="p-10 border-t-2 border-slate-100 bg-white flex gap-6 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
                     <button onClick={() => setIsCreating(false)} className="flex-1 py-5 text-slate-400 font-black uppercase text-[11px] tracking-widest hover:bg-slate-50 rounded-[2rem] transition-all border-2 border-transparent hover:border-slate-200">Go Back</button>
                     <button
                        onClick={() => { addAIAgent(newAgent as AIAgent); setIsCreating(false); }}
                        className="flex-1 py-5 bg-slate-950 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all hover:brightness-110"
                     >
                        Activate Assistant
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};
