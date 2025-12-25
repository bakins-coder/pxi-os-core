
import React, { useState, useEffect } from 'react';
import { nexusStore } from '../services/nexusStore';
import { AIAgent, OrganizationType } from '../types';
import { generateAIResponse } from '../services/ai';
import { 
  Bot, Sparkles, ChevronRight, Phone, Mic, ShieldAlert, Zap, Globe, 
  Settings, Play, Plus, Sliders, X, ArrowRight, Activity, Speaker, Brain
} from 'lucide-react';

export const AgentHub = () => {
  const [agents, setAgents] = useState<AIAgent[]>(nexusStore.aiAgents);
  const [isCreating, setIsCreating] = useState(false);
  const [newAgent, setNewAgent] = useState<Partial<AIAgent>>({
    industry: 'Catering',
    objective: 'Speed to Lead',
    voice: { name: 'Kore', accent: 'American', traits: ['Persuasive'], speed: 1.0 },
    telephony: { phoneNumber: '', areaCode: '01', liveTransferNumber: '', callbackEnabled: true },
    intelligence: { kycQuestions: [], guardrails: [], script: '' }
  });

  useEffect(() => {
    const unsubscribe = nexusStore.subscribe(() => setAgents([...nexusStore.aiAgents]));
    return unsubscribe;
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Agent Foundry</h1>
          <p className="text-slate-500 font-medium">Provision synthetic sales and ops professionals.</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="bg-slate-950 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl flex items-center gap-3 active:scale-95 transition-all"><Plus size={18}/> Provision New Agent</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {agents.map(agent => (
          <div key={agent.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-2xl flex flex-col group hover:border-[#00ff9d] transition-all">
             <div className="flex items-center gap-4 mb-10">
                <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-[#00ff9d] group-hover:scale-110 transition-transform"><Bot size={32}/></div>
                <div>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">{agent.name}</h3>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{agent.title}</p>
                </div>
             </div>
             <div className="space-y-3 flex-1 mb-8">
                <div className="p-4 bg-slate-50 rounded-2xl flex justify-between font-black text-[10px] uppercase">
                   <span className="text-slate-400">Objective</span>
                   <span className="text-slate-700">{agent.objective}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl flex justify-between font-black text-[10px] uppercase">
                   <span className="text-slate-400">Status</span>
                   <span className="text-green-600">{agent.status}</span>
                </div>
             </div>
             <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Configuration</button>
          </div>
        ))}
      </div>

      {isCreating && (
         <div className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] p-12 shadow-2xl w-full max-w-xl">
               <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-10">Agent Specs.</h2>
               <div className="space-y-6">
                  <input className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" placeholder="Designation Name" value={newAgent.name} onChange={e => setNewAgent({...newAgent, name: e.target.value})}/>
                  <select className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={newAgent.industry} onChange={e => setNewAgent({...newAgent, industry: e.target.value as any})}>
                     <option>Catering</option><option>Banking</option><option>Logistics</option>
                  </select>
                  <button onClick={() => { nexusStore.addAIAgent(newAgent); setIsCreating(false); }} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100">Establish Core</button>
                  <button onClick={() => setIsCreating(false)} className="w-full py-2 text-slate-400 font-black uppercase text-[10px]">Cancel</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
