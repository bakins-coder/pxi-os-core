
import React, { useState } from 'react';
import { db } from '../services/mockDb';
import { executeAgentWorkflow, generateAIResponse } from '../services/ai';
/* Fixed: MarketingChannel added to exported types */
import { Workflow, InvoiceStatus, MarketingPost, MarketingChannel, SocialInteraction } from '../types';
import { 
  Bot, Play, Pause, MoreVertical, Zap, CheckCircle2, 
  Clock, AlertTriangle, FileText, ChevronRight, Activity, Sparkles,
  Calendar as CalendarIcon, MessageSquare, PenTool, Hash, Send, Check, X,
  LayoutTemplate, Linkedin, Twitter, Mail, Rss, BarChart3, Edit3
} from 'lucide-react';

const MarketingStudio = () => {
  const [activeView, setActiveView] = useState<'calendar' | 'monitor'>('calendar');
  /* Fixed: Missing marketingPosts and socialInteractions arrays in db */
  const [posts, setPosts] = useState<MarketingPost[]>(db.marketingPosts);
  const [interactions, setInteractions] = useState<SocialInteraction[]>(db.socialInteractions);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  
  const [campaignTopic, setCampaignTopic] = useState('');
  const [campaignChannel, setCampaignChannel] = useState<MarketingChannel>('Blog');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateCampaign = async () => {
    if (!campaignTopic) return;
    setIsGenerating(true);
    
    const prompt = `Write a creative ${campaignChannel} post about: ${campaignTopic}.`;
    const content = await generateAIResponse(prompt);
    
    /* Fixed: Missing addMarketingPost method in db */
    const newPost = db.addMarketingPost({
      type: campaignChannel,
      title: `${campaignChannel} Campaign: ${campaignTopic}`,
      content: content,
      status: 'Draft',
      scheduledDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      generatedByAI: true
    });

    setPosts([...db.marketingPosts]);
    setIsGenerating(false);
    setIsGeneratorOpen(false);
    setCampaignTopic('');
  };

  const handleActionInteraction = (id: string, action: 'reply' | 'dismiss') => {
    /* Fixed: Missing updateSocialInteraction method in db */
    if (action === 'reply') {
      db.updateSocialInteraction(id, { status: 'Actioned' });
      alert("AI Reply Sent! (Simulated)");
    } else {
      db.updateSocialInteraction(id, { status: 'Dismissed' });
    }
    setInteractions([...db.socialInteractions]);
  };

  const getChannelIcon = (type: MarketingChannel) => {
    switch (type) {
      case 'Twitter': return <Twitter size={14} />;
      case 'LinkedIn': return <Linkedin size={14} />;
      case 'Newsletter': return <Mail size={14} />;
      case 'Blog': return <Rss size={14} />;
      case 'Instagram': return <LayoutTemplate size={14} />;
      default: return <Hash size={14} />;
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex gap-2">
             <button 
               // Fix: Corrected function call from setActiveTab to setActiveView
               onClick={() => setActiveView('calendar')}
               className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeView === 'calendar' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
             >
                <CalendarIcon size={16}/> Content Calendar
             </button>
             <button 
               // Fix: Corrected function call from setActiveTab to setActiveView
               onClick={() => setActiveView('monitor')}
               className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeView === 'monitor' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
             >
                <Activity size={16}/> Social Monitor
                {interactions.filter(i => i.status === 'New').length > 0 && (
                   <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                      {interactions.filter(i => i.status === 'New').length}
                   </span>
                )}
             </button>
          </div>
          <button 
            onClick={() => setIsGeneratorOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
          >
             <Sparkles size={16}/> AI Campaign Generator
          </button>
       </div>

       {activeView === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 space-y-4">
                {posts.sort((a,b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()).map(post => (
                   <div key={post.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4 group hover:border-indigo-300 transition-colors">
                      <div className="flex-shrink-0 w-16 text-center">
                         <div className="text-xs text-slate-500 font-bold uppercase">{new Date(post.scheduledDate).toLocaleString('default', { month: 'short' })}</div>
                         <div className="text-2xl font-bold text-slate-800">{new Date(post.scheduledDate).getDate()}</div>
                      </div>
                      <div className="flex-1">
                         <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border ${
                               post.type === 'Twitter' ? 'bg-sky-50 text-sky-600 border-sky-100' :
                               post.type === 'LinkedIn' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                               'bg-orange-50 text-orange-600 border-orange-100'
                            }`}>
                               {getChannelIcon(post.type)} {post.type}
                            </span>
                            <span className={`text-[10px] font-bold uppercase ${
                               post.status === 'Published' ? 'text-green-600' : 
                               post.status === 'Scheduled' ? 'text-blue-600' : 'text-slate-400'
                            }`}>
                               {post.status}
                            </span>
                         </div>
                         <h3 className="font-bold text-slate-800 text-sm mb-1">{post.title}</h3>
                         <p className="text-xs text-slate-500 line-clamp-2">{post.content}</p>
                      </div>
                      
                      <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition-all">
                         <Edit3 size={16}/>
                      </button>
                   </div>
                ))}
                {posts.length === 0 && <div className="text-center p-8 text-slate-400 italic">No scheduled content. Use the generator to start.</div>}
             </div>

             <div className="bg-white p-6 rounded-xl border border-slate-200 h-fit space-y-6">
                <div>
                   <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <BarChart3 size={18} className="text-indigo-600"/> Engagement Overview
                   </h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 rounded-lg">
                         <div className="text-xs text-slate-500 mb-1">Total Views</div>
                         <div className="text-xl font-bold text-slate-800">12.5K</div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                         <div className="text-xs text-slate-500 mb-1">Interactions</div>
                         <div className="text-xl font-bold text-slate-800">843</div>
                      </div>
                   </div>
                </div>
                
                <div className="border-t border-slate-100 pt-4">
                   <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Top Performing</h4>
                   <div className="space-y-3">
                      {posts.filter(p => (p.engagement?.views || 0) > 0).slice(0, 3).map(post => (
                         <div key={post.id} className="text-sm">
                            <div className="truncate font-medium text-slate-700">{post.title}</div>
                            <div className="text-xs text-green-600 font-bold">{post.engagement?.views} views</div>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
       )}

       {activeView === 'monitor' && (
          <div className="space-y-4">
             {interactions.filter(i => i.status === 'New').length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                   <div className="bg-green-100 text-green-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 size={24}/>
                   </div>
                   <h3 className="font-bold text-slate-800">All caught up!</h3>
                   <p className="text-slate-500 text-sm">No new social interactions require attention.</p>
                </div>
             )}

             {interactions.filter(i => i.status === 'New').map(interaction => (
                <div key={interaction.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
                   <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-slate-100">
                      <div className="flex justify-between items-start mb-3">
                         <div className="flex items-center gap-2">
                            <span className={`p-1.5 rounded-full ${interaction.platform === 'Twitter' ? 'bg-sky-100 text-sky-600' : 'bg-blue-100 text-blue-700'}`}>
                               {getChannelIcon(interaction.platform)}
                            </span>
                            <div>
                               <div className="font-bold text-sm text-slate-800">{interaction.user} <span className="text-slate-400 font-normal">{interaction.handle}</span></div>
                               <div className="text-[10px] text-slate-400">{new Date(interaction.timestamp).toLocaleString()}</div>
                            </div>
                         </div>
                         <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${
                            interaction.sentiment === 'Positive' ? 'bg-green-100 text-green-700' :
                            interaction.sentiment === 'Negative' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                         }`}>{interaction.sentiment}</span>
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed">"{interaction.content}"</p>
                   </div>

                   <div className="p-4 bg-slate-50 w-full md:w-96 flex flex-col justify-between">
                      <div>
                         <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 uppercase mb-2">
                            <Bot size={12}/> AI Analysis
                         </div>
                         <p className="text-xs text-slate-600 mb-4">{interaction.aiAnalysis}</p>
                         
                         <div className="bg-white p-3 rounded border border-slate-200 mb-4">
                            <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Suggested Reply</div>
                            <p className="text-xs text-slate-800 italic">{interaction.suggestedResponse}</p>
                         </div>
                      </div>
                      
                      <div className="flex gap-2">
                         <button 
                           onClick={() => handleActionInteraction(interaction.id, 'dismiss')}
                           className="flex-1 bg-white border border-slate-200 text-slate-600 py-2 rounded-lg text-xs font-bold hover:bg-slate-100"
                         >
                            Dismiss
                         </button>
                         <button 
                           onClick={() => handleActionInteraction(interaction.id, 'reply')}
                           className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center justify-center gap-1"
                         >
                            <Send size={12}/> Approve & Reply
                         </button>
                      </div>
                   </div>
                </div>
             ))}
          </div>
       )}

       {isGeneratorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
             <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                   <Sparkles className="text-purple-600"/> Create Campaign
                </h3>
                
                <div className="space-y-4">
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Channel</label>
                      <div className="grid grid-cols-3 gap-2">
                         {['Blog', 'Twitter', 'LinkedIn'].map(c => (
                            <button 
                               key={c} 
                               onClick={() => setCampaignChannel(c as MarketingChannel)}
                               className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                                  campaignChannel === c ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                               }`}
                            >
                               {c}
                            </button>
                         ))}
                      </div>
                   </div>
                   
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Topic / Prompt</label>
                      <textarea 
                         className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none"
                         placeholder="e.g. Announce our new summer collection with a focus on sustainability..."
                         value={campaignTopic}
                         onChange={e => setCampaignTopic(e.target.value)}
                      />
                   </div>

                   <div className="flex justify-end gap-2 pt-2">
                      <button 
                        onClick={() => setIsGeneratorOpen(false)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-bold"
                      >
                         Cancel
                      </button>
                      <button 
                        onClick={handleGenerateCampaign}
                        disabled={!campaignTopic || isGenerating}
                        className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                      >
                         {isGenerating ? 'Generating...' : 'Generate Draft'}
                         {isGenerating && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                      </button>
                   </div>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

export const Automation = () => {
  const [activeTab, setActiveTab] = useState<'workflows' | 'marketing'>('workflows');
  /* Fixed: Property workflows added to db */
  const [workflows, setWorkflows] = useState<Workflow[]>(db.workflows);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  const handleRunWorkflow = async (workflow: Workflow) => {
     setRunningId(workflow.id);
     
     let contextData = "";
     /* Fixed: Workflow type properties accessed correctly */
     if (workflow.trigger === 'Invoice Overdue') {
        const overdue = db.invoices.filter(i => {
           const due = new Date(i.dueDate);
           return due < new Date() && i.status !== InvoiceStatus.PAID;
        });
        
        if (overdue.length === 0) {
           contextData = "No overdue invoices found. No action needed.";
        } else {
           const summary = overdue.map(inv => {
             const company = db.companies.find(c => c.id === inv.companyId);
             const contact = db.contacts.find(c => c.companyId === company?.id);
             return `- Invoice ${inv.number} for ${company?.name} ($${inv.total}). Days overdue: ${Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24))}. Contact: ${contact?.email}`;
           }).join('\n');
           contextData = `Overdue Invoices List:\n${summary}`;
        }
     } else if (workflow.trigger === 'New Lead') {
        contextData = `New Lead Detected: Acme Corp interested in Enterprise plan. Contact: john@acme.com.`;
     } else {
        contextData = "Manual trigger test.";
     }

     await executeAgentWorkflow(workflow.id, workflow.agentName, workflow.agentRole, contextData);

     setWorkflows([...db.workflows]);
     setRunningId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
             <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Bot className="text-indigo-600"/> Automation & Agents
             </h1>
             <p className="text-slate-500">Deploy autonomous agents for operations and marketing.</p>
          </div>
          
          <div className="bg-white p-1 rounded-lg border border-slate-200 flex">
             <button 
               onClick={() => setActiveTab('workflows')}
               className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'workflows' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-indigo-600'}`}
             >
                Operational Agents
             </button>
             <button 
               onClick={() => setActiveTab('marketing')}
               className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'marketing' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-indigo-600'}`}
             >
                <Sparkles size={14}/> Marketing Studio
             </button>
          </div>
       </div>

       {activeTab === 'marketing' ? (
          <MarketingStudio />
       ) : (
          <>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                   <div className="relative z-10">
                      <p className="text-indigo-100 font-medium mb-1">Active Agents</p>
                      <h3 className="text-3xl font-bold">4</h3>
                      <div className="mt-4 flex items-center gap-2 text-xs bg-white/20 w-fit px-2 py-1 rounded-lg backdrop-blur-sm">
                         <Activity size={12} className="animate-pulse"/> 2 Running now
                      </div>
                   </div>
                   <Bot size={120} className="absolute -right-6 -bottom-6 text-white/10" />
                </div>
                
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                      <div>
                         <p className="text-slate-500 font-medium mb-1">Tasks Automated</p>
                         <h3 className="text-3xl font-bold text-slate-800">1,284</h3>
                      </div>
                      <div className="p-2 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 size={20}/></div>
                   </div>
                   <div className="text-xs text-slate-400">Saved approx. 142 hours this month</div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                      <div>
                         <p className="text-slate-500 font-medium mb-1">Error Rate</p>
                         <h3 className="text-3xl font-bold text-slate-800">0.2%</h3>
                      </div>
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Activity size={20}/></div>
                   </div>
                   <div className="text-xs text-slate-400">All flagged for human review</div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                   <h2 className="font-bold text-slate-800 text-lg">Deployed Workflows</h2>
                   {workflows.map(wf => (
                      <div 
                         key={wf.id} 
                         className={`bg-white rounded-xl border transition-all ${selectedWorkflow?.id === wf.id ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/20' : 'border-slate-200 hover:border-indigo-300'}`}
                         onClick={() => setSelectedWorkflow(wf)}
                      >
                         <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                               <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                     <Bot size={24} className="text-indigo-600"/>
                                  </div>
                                  <div>
                                     <h3 className="font-bold text-slate-800 text-lg">{wf.name}</h3>
                                     <p className="text-sm text-slate-500 flex items-center gap-2">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">{wf.agentName}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1"><Zap size={12} className="text-orange-500"/> {wf.trigger}</span>
                                     </p>
                                  </div>
                               </div>
                               <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${wf.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                     {wf.status}
                                  </span>
                                  <button className="text-slate-400 hover:text-slate-600 p-1"><MoreVertical size={20}/></button>
                               </div>
                            </div>
                            
                            <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-2">
                               <div className="text-xs text-slate-400 flex items-center gap-1">
                                  <Clock size={12}/> Last run: {wf.lastRun ? new Date(wf.lastRun).toLocaleString() : 'Never'}
                               </div>
                               <button 
                                  onClick={(e) => { e.stopPropagation(); handleRunWorkflow(wf); }}
                                  disabled={runningId === wf.id}
                                  className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                                     runningId === wf.id ? 'bg-slate-100 text-slate-400 cursor-wait' : 'bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'
                                  }`}
                                >
                                  {runningId === wf.id ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <Play size={16}/>}
                                  {runningId === wf.id ? 'Agent Working...' : 'Run Now'}
                               </button>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>

                <div className="bg-white rounded-xl border border-slate-200 h-[600px] flex flex-col">
                   {selectedWorkflow ? (
                      <>
                         <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                               <FileText size={18} className="text-slate-500"/> Live Agent Logs
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Real-time execution details for {selectedWorkflow.name}</p>
                         </div>
                         <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
                            {selectedWorkflow.logs.length === 0 && <p className="text-slate-400 italic text-center mt-10">No logs available. Run the agent to see activity.</p>}
                            {selectedWorkflow.logs.map((log, i) => (
                               <div key={i} className="flex gap-2 items-start border-l-2 border-slate-200 pl-2 py-1">
                                  <span className="text-slate-400 whitespace-nowrap">{log.match(/\[(.*?)\]/)?.[1] || ''}</span>
                                  <span className={`${log.includes('Error') ? 'text-red-600' : 'text-slate-700'}`}>
                                     {log.replace(/\[(.*?)\]/, '').trim()}
                                  </span>
                               </div>
                            ))}
                         </div>
                         <div className="p-4 border-t border-slate-100">
                            <div className="bg-indigo-50 rounded-lg p-3 text-xs text-indigo-700 border border-indigo-100">
                               <strong>System Instruction:</strong> {selectedWorkflow.agentRole}
                            </div>
                         </div>
                      </>
                   ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                         <Bot size={48} className="mb-4 opacity-20"/>
                         <p>Select a workflow to view agent configuration and real-time logs.</p>
                      </div>
                   )}
                </div>

             </div>
          </>
       )}
    </div>
  );
};
