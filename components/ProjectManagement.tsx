import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Project, ProjectTask, ProjectAIAlert, InteractionChannel } from '../types';
import { runProjectAnalysis, textToSpeech } from '../services/ai';
import { 
  Briefcase, Plus, Calendar, Kanban, BarChart2, Bot, Sparkles, 
  Clock, AlertTriangle, CheckCircle2, ChevronRight, MoreVertical,
  Filter, Search, Layers, Activity, Send, Phone, MessageSquare, 
  Check, X, Zap, ShieldAlert, TrendingUp, Info, LayoutGrid, Users, RefreshCw
} from 'lucide-react';

const KanbanBoard = ({ project }: { project: Project }) => {
  const statuses: ProjectTask['status'][] = ['Todo', 'In Progress', 'Review', 'Done'];
  const brandColor = db.organizationSettings.brandColor || '#4f46e5';

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full overflow-x-auto pb-4">
      {statuses.map(status => (
        <div key={status} className="flex flex-col min-w-[280px]">
          <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{status}</h3>
            <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {project.tasks.filter(t => t.status === status).length}
            </span>
          </div>
          <div className="flex-1 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200 p-2 space-y-3 min-h-[500px]">
            {project.tasks.filter(t => t.status === status).map(task => (
              <div key={task.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group cursor-grab active:cursor-grabbing">
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                    task.priority === 'Critical' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                    task.priority === 'High' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                    'bg-blue-50 text-blue-600 border border-blue-100'
                  }`}>
                    {task.priority}
                  </span>
                  <button className="text-slate-300 hover:text-slate-500"><MoreVertical size={14}/></button>
                </div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-2 leading-tight group-hover:text-indigo-600 transition-colors">{task.title}</h4>
                <div className="flex justify-between items-center mt-4">
                   <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase">
                      <Clock size={10}/> {new Date(task.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                   </div>
                   <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm overflow-hidden bg-slate-100">
                      <img src={db.teamMembers.find(m => m.id === task.assigneeId)?.avatar} className="w-full h-full object-cover" />
                   </div>
                </div>
              </div>
            ))}
            <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-white hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center gap-2">
               <Plus size={14}/> Add Task
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const GanttChart = ({ project }: { project: Project }) => {
  const brandColor = db.organizationSettings.brandColor || '#4f46e5';
  const start = new Date(project.startDate);
  const end = new Date(project.endDate);
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 5;
  const daysArray = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  return (
    <div className="bg-slate-950 rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col h-full shadow-2xl">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
         <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Temporal Logistics Map</h3>
         <div className="flex gap-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            <span className="text-[9px] text-slate-500 font-bold uppercase">Live Timeline</span>
         </div>
      </div>
      
      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="min-w-[1200px]">
          {/* Header Row */}
          <div className="flex border-b border-white/5">
            <div className="w-64 p-4 sticky left-0 bg-slate-950 z-20 border-r border-white/5 text-[9px] font-black text-slate-500 uppercase">Operational Tasks</div>
            <div className="flex">
              {daysArray.map((day, i) => (
                <div key={i} className="w-20 p-4 text-center border-r border-white/5">
                  <div className="text-[10px] font-black text-slate-300">{day.getDate()}</div>
                  <div className="text-[8px] text-slate-600 font-bold uppercase">{day.toLocaleString('default', { month: 'short' })}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Task Rows */}
          {project.tasks.map(task => {
            const taskStart = new Date(task.startDate);
            const taskEnd = new Date(task.endDate);
            const offset = Math.ceil((taskStart.getTime() - start.getTime()) / (1000 * 3600 * 24));
            const duration = Math.max(1, Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 3600 * 24)));

            return (
              <div key={task.id} className="flex border-b border-white/5 group hover:bg-white/5 transition-colors">
                <div className="w-64 p-4 sticky left-0 bg-slate-950 z-20 border-r border-white/5 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${task.status === 'Done' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
                  <span className="text-[10px] font-bold text-slate-300 uppercase truncate">{task.title}</span>
                </div>
                <div className="flex relative h-16 w-full">
                  <div 
                    className="absolute h-8 top-4 rounded-xl flex items-center px-4 transition-all hover:scale-[1.01] hover:brightness-110 shadow-lg cursor-pointer"
                    style={{ 
                      left: `${offset * 80}px`, 
                      width: `${duration * 80}px`,
                      backgroundColor: task.status === 'Done' ? '#10b98133' : `${brandColor}33`,
                      border: `1px solid ${task.status === 'Done' ? '#10b98155' : `${brandColor}55`}`
                    }}
                  >
                    <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: task.status === 'Done' ? '#10b981' : brandColor }}></div>
                    <span className="text-[8px] font-black text-white uppercase truncate">{task.assigneeId}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const AIAssistantView = ({ project }: { project: Project }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [showVoiceAlert, setShowVoiceAlert] = useState(false);
  const [voiceAlertTranscript, setVoiceAlertTranscript] = useState("");

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await runProjectAnalysis(project.id);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const simulateCriticalCall = async () => {
    const text = `Alert: Task "Procure Raw Materials" is over 24 hours behind schedule. The Shell Executive Retreat requires items by morning. Please confirm dispatch immediately.`;
    setVoiceAlertTranscript(text);
    setShowVoiceAlert(true);
    
    const base64Audio = await textToSpeech(text);
    const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
    audio.play();

    db.addProjectAIAlert(project.id, {
        type: 'Critical',
        message: 'Critical call initiated to Procurement Officer regarding raw material delays.',
        actionTaken: 'Autonomous Voice Call Dispatched.',
        channelUsed: ['Voice', 'WhatsApp']
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full animate-in fade-in">
       <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-500/10 transition-colors"></div>
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="flex items-center gap-6">
                   <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-indigo-400 shadow-2xl animate-float">
                      <Bot size={40}/>
                   </div>
                   <div>
                      <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Agentic Project Manager</h2>
                      <p className="text-slate-500 font-medium mt-1">Autonomous monitoring for {project.name}.</p>
                   </div>
                </div>
                <button 
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                >
                   {isAnalyzing ? <RefreshCw className="animate-spin" size={20}/> : <Sparkles size={20}/>}
                   {isAnalyzing ? 'Analyzing Ops...' : 'Generate Status Briefing'}
                </button>
             </div>

             {analysis && (
                <div className="mt-10 space-y-8 animate-in slide-in-from-top-4">
                   <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                      <div className="flex items-center gap-2 mb-4 text-indigo-600">
                         <span className="text-[10px] font-black uppercase tracking-[0.2em]">Management Summary</span>
                      </div>
                      <p className="text-slate-700 font-medium text-lg leading-relaxed italic">"{analysis.summary}"</p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-8 bg-rose-50 rounded-[2.5rem] border border-rose-100">
                         <div className="flex items-center gap-2 mb-6 text-rose-600">
                            <ShieldAlert size={20}/>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Identified Red Flags</span>
                         </div>
                         <div className="space-y-3">
                            {analysis.redFlags.map((flag: string, i: number) => (
                               <div key={i} className="flex items-start gap-3 text-rose-900 font-bold text-sm">
                                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                  {flag}
                               </div>
                            ))}
                         </div>
                         <button 
                            onClick={simulateCriticalCall}
                            className="w-full mt-8 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-100 transition-all flex items-center justify-center gap-2"
                         >
                            <Phone size={14}/> Dispatch Critical Voice Alert
                         </button>
                      </div>

                      <div className="p-8 bg-indigo-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                         <div className="flex items-center gap-2 mb-6 text-indigo-300">
                            <Activity size={20}/>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">AI Strategic Vibe</span>
                         </div>
                         <div className="text-center py-6">
                            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em] mb-2">OPERATIONAL HEALTH</div>
                            <div className={`text-6xl font-black tracking-tighter ${analysis.vibe === 'Critical' ? 'text-rose-400' : analysis.vibe === 'Risk' ? 'text-amber-400' : 'text-emerald-400'}`}>
                               {analysis.vibe}
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             )}
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
             <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Agent Execution Logs</h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Ops Feed</span>
             </div>
             <div className="divide-y divide-slate-50">
                {project.aiAlerts.map(alert => (
                   <div key={alert.id} className="p-6 hover:bg-slate-50 transition-colors flex gap-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                         alert.type === 'Critical' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'
                      }`}>
                         {alert.type === 'Critical' ? <ShieldAlert size={24}/> : <Info size={24}/>}
                      </div>
                      <div className="flex-1">
                         <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                            <div className="flex gap-1">
                               {alert.channelUsed.map(c => (
                                  <span key={c} className="bg-slate-100 text-slate-500 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">{c}</span>
                               ))}
                            </div>
                         </div>
                         <p className="font-bold text-slate-700 text-sm">{alert.message}</p>
                         <p className="text-xs text-indigo-600 mt-2 font-black uppercase tracking-widest flex items-center gap-1">
                            <Bot size={12}/> {alert.actionTaken}
                         </p>
                      </div>
                   </div>
                ))}
             </div>
          </div>
       </div>

       <div className="space-y-8">
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
             <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mb-16 blur-2xl"></div>
             <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-6">Autonomous Triggers</h3>
             <div className="space-y-4">
                {[
                   { name: 'Delay Detection', status: 'Active', icon: Clock },
                   { name: 'Resource Leveling', status: 'Standby', icon: Layers },
                   { name: 'External WhatsApp Sync', status: 'Active', icon: MessageSquare },
                   { name: 'Management Escalate', status: 'Active', icon: Zap }
                ].map(trig => (
                   <div key={trig.name} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                         <trig.icon size={16} className="text-indigo-400"/>
                         <span className="text-xs font-bold text-slate-300">{trig.name}</span>
                      </div>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${trig.status === 'Active' ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>{trig.status}</span>
                   </div>
                ))}
             </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Assigned Squad</h3>
             <div className="space-y-6">
                {db.teamMembers.map(member => (
                   <div key={member.id} className="flex items-center gap-4">
                      <div className="relative">
                         <img src={member.avatar} className="w-12 h-12 rounded-2xl bg-slate-100 object-cover shadow-md" />
                         <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div>
                         <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{member.name}</h4>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{member.role}</p>
                      </div>
                   </div>
                ))}
             </div>
             <button className="w-full mt-10 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
                <Plus size={16}/> Modify Roster
             </button>
          </div>
       </div>

       {showVoiceAlert && (
          <div className="fixed inset-x-0 top-6 z-[100] flex justify-center px-4 animate-in slide-in-from-top-full duration-500">
             <div className="bg-indigo-600 text-white rounded-[2rem] shadow-2xl p-6 w-full max-w-lg flex items-center gap-6 border-b-4 border-indigo-800">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 animate-pulse">
                   <Phone size={32}/>
                </div>
                <div className="flex-1">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200 mb-1">Live Agent Voice Dispatch</p>
                   <p className="text-sm font-bold leading-relaxed">"{voiceAlertTranscript}"</p>
                </div>
                <button onClick={() => setShowVoiceAlert(false)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X/></button>
             </div>
          </div>
       )}
    </div>
  );
};

export const ProjectManagement = () => {
  const [activeView, setActiveView] = useState<'roster' | 'kanban' | 'gantt' | 'assistant'>('roster');
  const [projects, setProjects] = useState<Project[]>(db.projects);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const brandColor = db.organizationSettings.brandColor || '#4f46e5';

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
       setProjects([...db.projects]);
    });
    return unsubscribe;
  }, []);

  const handleCreateProject = () => {
     const name = prompt("Enter Project/Event Name:");
     if (name) {
        db.addProject({ name, startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 86400000*7).toISOString().split('T')[0] });
     }
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      {/* HERO SECTION - NEXUS STYLE */}
      <div className="bg-slate-950 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl mb-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl animate-float">
                   <Layers size={36} />
                </div>
                <div>
                   <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Project Hub</h1>
                   <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-300 border border-white/5">
                         <Zap size={12} className="text-indigo-400"/> Operational Logistics Synced
                      </span>
                   </div>
                </div>
             </div>

             <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md overflow-x-auto max-w-full">
                {[
                  { id: 'roster', label: 'Matrix', icon: LayoutGrid },
                  { id: 'kanban', label: 'Flow', icon: Kanban },
                  { id: 'gantt', label: 'Temporal', icon: Calendar },
                  { id: 'assistant', label: 'Agentic', icon: Bot }
                ].map(tab => (
                   <button 
                      key={tab.id} 
                      onClick={() => setActiveView(tab.id as any)} 
                      className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeView === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
                   >
                      <tab.icon size={14}/> {tab.label}
                   </button>
                ))}
             </div>
          </div>
       </div>

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <p className="text-slate-500 font-medium">Logistics synchronization and temporal flow management.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
           <button 
             onClick={handleCreateProject}
             className="flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95"
             style={{ backgroundColor: brandColor, boxShadow: `0 10px 20px ${brandColor}33` }}
           >
             <Plus size={16}/> New Campaign
           </button>
        </div>
      </div>

      {!selectedProject && activeView !== 'roster' ? (
         <div className="bg-white p-20 rounded-[3rem] border border-dashed border-slate-200 text-center text-slate-400">
            <Layers size={64} className="mx-auto mb-6 opacity-10"/>
            <p className="text-xl font-bold uppercase tracking-widest">Select an Active Project to Access View</p>
            {/* Fix: Replaced undefined setActiveTab with the correct setter setActiveView */}
            <button onClick={() => setActiveView('roster')} className="mt-6 text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] hover:underline underline-offset-8">Return to Matrix</button>
         </div>
      ) : (
         <div className="h-full">
            {activeView === 'roster' && (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {projects.map(proj => (
                     <div 
                        key={proj.id} 
                        onClick={() => setSelectedProject(proj)}
                        className={`bg-white p-8 rounded-[3rem] border-2 cursor-pointer transition-all hover:shadow-2xl group ${selectedProject?.id === proj.id ? 'border-indigo-600 shadow-xl' : 'border-slate-100 hover:border-indigo-300 shadow-sm'}`}
                     >
                        <div className="flex justify-between items-start mb-6">
                           <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              proj.status === 'Active' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-500 border border-slate-100'
                           }`}>
                              {proj.status}
                           </span>
                           <TrendingUp className={proj.progress > 50 ? 'text-emerald-500' : 'text-slate-300'} size={20}/>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2 group-hover:text-indigo-600 transition-colors leading-tight">{proj.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-bold mb-8">
                           <Calendar size={12}/> {proj.startDate} • {proj.endDate}
                        </div>
                        
                        <div className="space-y-4">
                           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                              <span>Velocity</span>
                              <span>{proj.progress}%</span>
                           </div>
                           <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full transition-all duration-1000 ease-out" style={{ width: `${proj.progress}%`, backgroundColor: brandColor }}></div>
                           </div>
                        </div>

                        <div className="mt-8 flex justify-between items-center">
                           <div className="flex -space-x-3">
                              {proj.tasks.slice(0, 3).map((t, idx) => (
                                 <div key={idx} className="w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden bg-slate-200">
                                    <img src={db.teamMembers.find(m => m.id === t.assigneeId)?.avatar} />
                                 </div>
                              ))}
                           </div>
                           <ChevronRight className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all"/>
                        </div>
                     </div>
                  ))}
               </div>
            )}

            {activeView === 'kanban' && selectedProject && <KanbanBoard project={selectedProject} />}
            {activeView === 'gantt' && selectedProject && <GanttChart project={selectedProject} />}
            {activeView === 'assistant' && selectedProject && <AIAssistantView project={selectedProject} />}
         </div>
      )}
    </div>
  );
};
