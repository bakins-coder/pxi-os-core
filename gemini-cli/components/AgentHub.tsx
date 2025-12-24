
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { AIAgent, OrganizationType } from '../types';
import { generateAIResponse } from '../services/ai';
import { 
  Bot, Sparkles, ChevronRight, Phone, Mic, ShieldAlert, Zap, Globe, 
  Settings, Play, Plus, Sliders, Calendar, Search, Users, Radio, 
  CheckCircle2, X, ArrowRight, Activity, Speaker, Brain, MessageSquare, 
  Hash, Clock, Lock
} from 'lucide-react';

const INDUSTRIES: OrganizationType[] = ['Banking', 'Catering', 'Healthcare', 'Marketing Agency', 'SDR', 'Logistics'];
const OBJECTIVES = ['Community Update', 'Lead Reactivation', 'Speed to Lead', 'Appointment Setting'];
const VOICES = [
  { id: 'v1', name: 'Zephyr', accent: 'British', traits: ['Assertive', 'Sophisticated'] },
  { id: 'v2', name: 'Kore', accent: 'American', traits: ['Friendly', 'Energetic'] },
  { id: 'v3', name: 'Puck', accent: 'Australian', traits: ['Casual', 'Straightforward'] },
  { id: 'v4', name: 'Fenrir', accent: 'American', traits: ['Persuasive', 'Straightforward'] }
];

export const AgentHub = () => {
  const [agents, setAgents] = useState<AIAgent[]>(db.aiAgents);
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState(1);
  const [newAgent, setNewAgent] = useState<Partial<AIAgent>>({
    industry: 'Catering',
    objective: 'Speed to Lead',
    voice: { name: 'Kore', accent: 'American', traits: ['Persuasive'], speed: 1.0 },
    telephony: { phoneNumber: '', areaCode: '01', liveTransferNumber: '', callbackEnabled: true },
    intelligence: { kycQuestions: [], guardrails: [], script: '' }
  });

  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const brandColor = db.organizationSettings.brandColor || '#4f46e5';

  useEffect(() => {
    const unsubscribe = db.subscribe(() => setAgents([...db.aiAgents]));
    return unsubscribe;
  }, []);

  const handleCreateAgent = () => {
    db.addAIAgent(newAgent);
    setIsCreating(false);
    setStep(1);
  };

  const generateScriptViaAI = async () => {
    setIsGeneratingScript(true);
    const prompt = `Write a high-converting ${newAgent.objective} script for a ${newAgent.industry} agent named ${newAgent.name}. Title: ${newAgent.title}. Include specific KYC questions about timeline and budget.`;
    const script = await generateAIResponse(prompt);
    setNewAgent(prev => ({ 
      ...prev, 
      intelligence: { ...prev.intelligence!, script } 
    }));
    setIsGeneratingScript(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">Agent Foundry</h1>
          <p className="text-slate-500 font-medium">Deploy fine-tuned synthetic agents for specialized sales & operations.</p>
        </div>
        
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl flex items-center gap-3 transition-all active:scale-95"
        >
          <Plus size={20}/> Provision New Agent
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {agents.map(agent => (
          <div key={agent.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl group hover:border-indigo-400 transition-all flex flex-col relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  agent.status === 'Deployed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600 animate-pulse'
                }`}>
                  {agent.status}
                </span>
             </div>
             
             <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                   <Bot size={32}/>
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-none">{agent.name}</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{agent.title}</p>
                </div>
             </div>

             <div className="space-y-4 flex-1">
                <div className="flex justify-between items-center text-xs p-3 bg-slate-50 rounded-xl">
                   <span className="text-slate-400 font-bold">Objective</span>
                   <span className="font-black text-slate-700 uppercase tracking-tighter">{agent.objective}</span>
                </div>
                <div className="flex justify-between items-center text-xs p-3 bg-slate-50 rounded-xl">
                   <span className="text-slate-400 font-bold">Telephony</span>
                   <span className="font-mono font-bold text-indigo-600">{agent.telephony.phoneNumber || 'Provisioning...'}</span>
                </div>
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                   <div className="flex items-center gap-2 mb-2 text-indigo-600 font-black uppercase text-[9px] tracking-widest">
                      <Speaker size={12}/> {agent.voice.name} Voice Profile
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {agent.voice.traits.map(t => (
                        <span key={t} className="px-2 py-0.5 bg-white text-[8px] font-black uppercase rounded border border-indigo-200">{t}</span>
                      ))}
                   </div>
                </div>
             </div>

             <div className="mt-8 pt-6 border-t border-slate-50 flex gap-3">
                <button className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Metrics</button>
                <button className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                   <Settings size={14}/> Config
                </button>
             </div>
          </div>
        ))}
      </div>

      {/* --- CREATE AGENT MULTI-STEP MODAL --- */}
      {isCreating && (
        <div className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-5xl h-[85vh] flex overflow-hidden">
              
              {/* Step Sidebar */}
              <div className="w-80 bg-slate-950 p-10 flex flex-col justify-between text-white">
                 <div>
                    <div className="flex items-center gap-3 mb-12">
                       <Sparkles size={24} className="text-indigo-400"/>
                       <span className="font-black text-lg uppercase tracking-tighter">Synthetic Core</span>
                    </div>
                    <div className="space-y-8">
                       {[
                         { s: 1, label: 'Onboarding', icon: Globe },
                         { s: 2, label: 'Identity & Voice', icon: Mic },
                         { s: 3, label: 'Telephony (Digits)', icon: Phone },
                         { s: 4, label: 'KYC & Logic', icon: Brain }
                       ].map(i => (
                         <div key={i.s} className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black transition-all ${
                              step === i.s ? 'bg-indigo-600 shadow-lg' : step > i.s ? 'bg-emerald-500' : 'bg-slate-800 text-slate-500'
                            }`}>
                               {step > i.s ? <CheckCircle2 size={18}/> : i.s}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${step === i.s ? 'text-white' : 'text-slate-500'}`}>{i.label}</span>
                         </div>
                       ))}
                    </div>
                 </div>
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-[10px] text-slate-400 font-medium italic">
                    AI agents are fine-tuned on industry sales tactics and SDR role-play data.
                 </div>
              </div>

              {/* Form Area */}
              <div className="flex-1 p-14 overflow-y-auto relative flex flex-col">
                 <button onClick={() => setIsCreating(false)} className="absolute top-10 right-10 p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X/></button>

                 <div className="flex-1">
                    {step === 1 && (
                       <div className="animate-in slide-in-from-right duration-300 space-y-10">
                          <div>
                             <h2 className="text-4xl font-black text-slate-900 tracking-tight">Onboarding.</h2>
                             <p className="text-slate-500 font-medium">Select the industry fine-tuning for this agent.</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                             {INDUSTRIES.map(ind => (
                                <button 
                                  key={ind} 
                                  onClick={() => setNewAgent({...newAgent, industry: ind})}
                                  className={`p-6 rounded-[2rem] border-2 text-left transition-all ${newAgent.industry === ind ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-50 bg-slate-50 hover:border-indigo-200'}`}
                                >
                                   <div className="font-black uppercase tracking-widest text-xs mb-2">{ind}</div>
                                   <p className="text-[10px] text-slate-400 font-medium">Loads {ind}-specific sales tactics & niche roles.</p>
                                </button>
                             ))}
                          </div>

                          <div className="space-y-4">
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Campaign Objective</label>
                             <div className="flex flex-wrap gap-2">
                                {OBJECTIVES.map(obj => (
                                   <button 
                                     key={obj} 
                                     onClick={() => setNewAgent({...newAgent, objective: obj as any})}
                                     className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${newAgent.objective === obj ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                                   >
                                      {obj}
                                   </button>
                                ))}
                             </div>
                          </div>
                       </div>
                    )}

                    {step === 2 && (
                       <div className="animate-in slide-in-from-right duration-300 space-y-10">
                          <div>
                             <h2 className="text-4xl font-black text-slate-900 tracking-tight">Identity & Persona.</h2>
                             <p className="text-slate-500 font-medium">Assign a strategic title and engineer their synthetic voice.</p>
                          </div>

                          <div className="grid grid-cols-2 gap-8">
                             <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Agent Given Name</label>
                                <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" placeholder="e.g. Phoenix" value={newAgent.name} onChange={e => setNewAgent({...newAgent, name: e.target.value})}/>
                             </div>
                             <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Strategic Title</label>
                                <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" placeholder="e.g. Inside Sales Agent" value={newAgent.title} onChange={e => setNewAgent({...newAgent, title: e.target.value})}/>
                             </div>
                          </div>

                          <div className="space-y-6">
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Synthetic Voice Selection</label>
                             <div className="grid grid-cols-2 gap-4">
                                {VOICES.map(v => (
                                   <button 
                                      key={v.id}
                                      onClick={() => setNewAgent({...newAgent, voice: { ...newAgent.voice!, name: v.name, accent: v.accent }})}
                                      className={`p-6 rounded-[2rem] border-2 text-left transition-all flex items-center justify-between ${newAgent.voice?.name === v.name ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-50 bg-slate-50 hover:border-indigo-200'}`}
                                   >
                                      <div>
                                         <div className="font-black uppercase text-xs mb-1">{v.name} ({v.accent})</div>
                                         <div className="flex gap-1">
                                            {v.traits.map(t => <span key={t} className="text-[8px] bg-white px-1.5 py-0.5 rounded border border-indigo-100 font-bold uppercase">{t}</span>)}
                                         </div>
                                      </div>
                                      <button className="p-3 bg-white rounded-xl shadow-sm hover:scale-110 transition-transform"><Play size={16} className="text-indigo-600"/></button>
                                   </button>
                                ))}
                             </div>
                          </div>

                          <div className="bg-slate-50 p-8 rounded-[2.5rem] space-y-6 border border-slate-100">
                             <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Response Latency (Age Tuner)</span>
                                <span className="font-black text-indigo-600">{newAgent.voice?.speed === 1.0 ? 'Standard (Adults)' : newAgent.voice?.speed! > 1.2 ? 'Fast (Gen Z)' : 'Deliberate (Seniors)'}</span>
                             </div>
                             <input 
                               type="range" 
                               min="0.5" 
                               max="2.0" 
                               step="0.1" 
                               className="w-full accent-indigo-600"
                               value={newAgent.voice?.speed}
                               onChange={e => setNewAgent({...newAgent, voice: { ...newAgent.voice!, speed: parseFloat(e.target.value) }})}
                             />
                             <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                <span>Deliberate</span>
                                <span>Dynamic</span>
                                <span>Reactive</span>
                             </div>
                          </div>
                       </div>
                    )}

                    {step === 3 && (
                       <div className="animate-in slide-in-from-right duration-300 space-y-10">
                          <div>
                             <h2 className="text-4xl font-black text-slate-900 tracking-tight">Telephony.</h2>
                             <p className="text-slate-500 font-medium">Claim your area code and set live bridge parameters.</p>
                          </div>

                          <div className="grid grid-cols-2 gap-8">
                             <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                <h3 className="text-xs font-black uppercase tracking-widest mb-6">Claim Local Number</h3>
                                <div className="flex gap-2 mb-6">
                                   <input className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 font-mono text-lg" placeholder="Area Code (e.g. 0803)" value={newAgent.telephony?.areaCode} onChange={e => setNewAgent({...newAgent, telephony: { ...newAgent.telephony!, areaCode: e.target.value }})}/>
                                   <button className="bg-indigo-600 px-6 rounded-xl font-black text-[10px] uppercase">Claim</button>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold">Matching digits claimed from PXI global gateway.</p>
                             </div>

                             <div className="space-y-6">
                                <div>
                                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Live Bridge Transfer Number</label>
                                   <div className="relative">
                                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                                      <input className="w-full pl-10 pr-4 py-4 border border-slate-200 rounded-2xl font-bold bg-slate-50" placeholder="+234..." value={newAgent.telephony?.liveTransferNumber} onChange={e => setNewAgent({...newAgent, telephony: { ...newAgent.telephony!, liveTransferNumber: e.target.value }})}/>
                                   </div>
                                </div>
                                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl bg-white shadow-sm">
                                   <div className="flex items-center gap-3">
                                      <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Clock size={16}/></div>
                                      <span className="text-xs font-bold text-slate-600">Handle Callback Logic</span>
                                   </div>
                                   <input 
                                     type="checkbox" 
                                     className="w-5 h-5 accent-indigo-600" 
                                     checked={newAgent.telephony?.callbackEnabled}
                                     onChange={e => setNewAgent({...newAgent, telephony: { ...newAgent.telephony!, callbackEnabled: e.target.checked }})}
                                   />
                                </div>
                             </div>
                          </div>

                          <div className="p-8 bg-indigo-900 rounded-[2.5rem] text-white flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <Calendar size={28} className="text-indigo-300"/>
                                <div>
                                   <h4 className="font-bold text-lg">Calendar Sync Activated</h4>
                                   <p className="text-xs text-indigo-300">Agent can slot appointments into Google/Outlook gaps.</p>
                                </div>
                             </div>
                             <div className="px-4 py-2 bg-white/10 rounded-xl font-black text-[10px] uppercase border border-white/10">Authorized</div>
                          </div>
                       </div>
                    )}

                    {step === 4 && (
                       <div className="animate-in slide-in-from-right duration-300 space-y-10">
                          <div>
                             <h2 className="text-4xl font-black text-slate-900 tracking-tight">Logic & Guardrails.</h2>
                             <p className="text-slate-500 font-medium">Define "Selling Signals" and KYC expectations.</p>
                          </div>

                          <div className="space-y-6">
                             <div className="flex justify-between items-center">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Conversational Script Builder</label>
                                <button 
                                  onClick={generateScriptViaAI}
                                  disabled={isGeneratingScript}
                                  className="text-[9px] font-black text-indigo-600 uppercase flex items-center gap-1 hover:underline"
                                >
                                   {isGeneratingScript ? <Sliders className="animate-spin" size={12}/> : <Sparkles size={12}/>} 
                                   Generate Script via GPT
                                </button>
                             </div>
                             <textarea 
                               className="w-full h-40 bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none"
                               value={newAgent.intelligence?.script}
                               onChange={e => setNewAgent({...newAgent, intelligence: { ...newAgent.intelligence!, script: e.target.value }})}
                             />
                          </div>

                          <div className="grid grid-cols-2 gap-8">
                             <div className="bg-slate-50 p-6 rounded-3xl">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">KYC Question Bank</h4>
                                <div className="space-y-3">
                                   {['Timeline Expectation', 'Budget Qualification', 'Key Motivation'].map(q => (
                                      <div key={q} className="flex items-center gap-3 text-xs font-bold text-slate-600 bg-white p-3 rounded-xl border border-slate-100">
                                         <CheckCircle2 size={14} className="text-emerald-500"/> {q}
                                      </div>
                                   ))}
                                </div>
                             </div>
                             <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100">
                                <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4">Hard Guardrails</h4>
                                <div className="space-y-3">
                                   {['No Discount > 10%', 'Strict Professional Vibe', 'No Competitor Slashing'].map(g => (
                                      <div key={g} className="flex items-center gap-3 text-xs font-bold text-rose-700 bg-white/50 p-3 rounded-xl border border-rose-100">
                                         <Lock size={14} className="text-rose-400"/> {g}
                                      </div>
                                   ))}
                                </div>
                             </div>
                          </div>
                       </div>
                    )}
                 </div>

                 <div className="mt-14 pt-8 border-t border-slate-100 flex justify-between items-center">
                    {step > 1 ? (
                       <button onClick={() => setStep(step - 1)} className="text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-indigo-600 transition-colors">Back</button>
                    ) : <div></div>}
                    
                    {step < 4 ? (
                       <button 
                         onClick={() => setStep(step + 1)}
                         className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-3 active:scale-95 transition-all"
                       >
                          Continue Setup <ArrowRight size={18}/>
                       </button>
                    ) : (
                       <button 
                         onClick={handleCreateAgent}
                         className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl flex items-center gap-3 active:scale-95 transition-all"
                       >
                          Establish Core & Deploy <CheckCircle2 size={18}/>
                       </button>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
