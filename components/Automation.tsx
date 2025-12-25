
import React, { useState, useEffect } from 'react';
import { nexusStore } from '../services/nexusStore';
import { executeAgentWorkflow, generateAIResponse } from '../services/ai';
import { Workflow, MarketingPost, MarketingChannel, SocialInteraction } from '../types';
import { 
  Bot, Play, Zap, CheckCircle2, 
  Clock, Activity, Sparkles,
  Calendar as CalendarIcon, Send, X, Edit3, BarChart3
} from 'lucide-react';

const MarketingStudio = () => {
  const [activeView, setActiveView] = useState<'calendar' | 'monitor'>('calendar');
  const [posts, setPosts] = useState<MarketingPost[]>(nexusStore.marketingPosts);
  const [interactions, setInteractions] = useState<SocialInteraction[]>(nexusStore.socialInteractions);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [campaignTopic, setCampaignTopic] = useState('');
  const [campaignChannel, setCampaignChannel] = useState<MarketingChannel>('Blog');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const unsubscribe = nexusStore.subscribe(() => {
      setPosts([...nexusStore.marketingPosts]);
      setInteractions([...nexusStore.socialInteractions]);
    });
    return unsubscribe;
  }, []);

  const handleGenerateCampaign = async () => {
    if (!campaignTopic) return;
    setIsGenerating(true);
    const content = await generateAIResponse(`Write a creative ${campaignChannel} post about: ${campaignTopic}.`);
    nexusStore.addMarketingPost({
      type: campaignChannel,
      title: `${campaignChannel}: ${campaignTopic}`,
      content: content,
      status: 'Draft',
      scheduledDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      generatedByAI: true
    });
    setIsGenerating(false);
    setIsGeneratorOpen(false);
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex gap-2">
             <button onClick={() => setActiveView('calendar')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeView === 'calendar' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}>
                <CalendarIcon size={16}/> Calendar
             </button>
             <button onClick={() => setActiveView('monitor')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeView === 'monitor' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}>
                <Activity size={16}/> Monitor
             </button>
          </div>
          <button onClick={() => setIsGeneratorOpen(true)} className="bg-[#00ff9d] text-slate-950 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm"><Sparkles size={16}/> AI Generator</button>
       </div>

       {activeView === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {posts.map(post => (
                <div key={post.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                   <div className="flex justify-between items-start mb-4">
                      <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">{post.type}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{post.status}</span>
                   </div>
                   <h3 className="font-black text-slate-800 uppercase text-sm mb-2">{post.title}</h3>
                   <p className="text-slate-500 text-xs line-clamp-3 mb-6 leading-relaxed italic">"{post.content}"</p>
                   <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-mono">{post.scheduledDate}</span>
                      <button className="text-indigo-600"><Edit3 size={16}/></button>
                   </div>
                </div>
             ))}
          </div>
       )}
    </div>
  );
};

export const Automation = () => {
  const [activeTab, setActiveTab] = useState<'workflows' | 'marketing'>('workflows');
  const [workflows, setWorkflows] = useState<Workflow[]>(nexusStore.workflows);
  const [runningId, setRunningId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = nexusStore.subscribe(() => setWorkflows([...nexusStore.workflows]));
    return unsubscribe;
  }, []);

  const handleRunWorkflow = async (workflow: Workflow) => {
     setRunningId(workflow.id);
     await executeAgentWorkflow(workflow.id, workflow.agentName, workflow.agentRole, "Manual test context from nexusStore.");
     setRunningId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Automation Matrix</h1>
          <div className="bg-white p-1 rounded-2xl border border-slate-200 flex shadow-sm">
             <button onClick={() => setActiveTab('workflows')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'workflows' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Workflows</button>
             <button onClick={() => setActiveTab('marketing')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'marketing' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Marketing</button>
          </div>
       </div>

       {activeTab === 'marketing' ? <MarketingStudio /> : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {workflows.map(wf => (
                <div key={wf.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col justify-between group hover:border-[#00ff9d] transition-all">
                   <div>
                      <div className="flex justify-between items-start mb-6">
                         <div className="p-4 bg-slate-900 rounded-2xl text-[#00ff9d]"><Bot size={24}/></div>
                         <span className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-black uppercase rounded-full">{wf.status}</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">{wf.name}</h3>
                      <p className="text-slate-500 text-sm font-medium mb-8">Trigger: {wf.trigger}</p>
                   </div>
                   <button 
                      onClick={() => handleRunWorkflow(wf)}
                      disabled={runningId === wf.id}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                   >
                      {runningId === wf.id ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Play size={14}/>}
                      {runningId === wf.id ? 'Agent Active' : 'Trigger Execution'}
                   </button>
                </div>
             ))}
          </div>
       )}
    </div>
  );
};
