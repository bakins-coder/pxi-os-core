
import React, { useState, useEffect } from 'react';
import { nexusStore } from '../services/nexusStore';
import { Project } from '../types';
import { runProjectAnalysis } from '../services/ai';
import { 
  Plus, Calendar, Columns3, Bot, Sparkles, Clock, RefreshCw, LayoutGrid, Layers, TrendingUp, ChevronRight
} from 'lucide-react';

export const ProjectManagement = () => {
  const [activeView, setActiveView] = useState<'roster' | 'kanban' | 'assistant'>('roster');
  const [projects, setProjects] = useState<Project[]>(nexusStore.projects);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const brandColor = nexusStore.organizationSettings.brandColor || '#00ff9d';

  useEffect(() => {
    const unsubscribe = nexusStore.subscribe(() => setProjects([...nexusStore.projects]));
    return unsubscribe;
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      <div className="bg-slate-950 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl mb-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00ff9d]/20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-[#00ff9d] rounded-3xl flex items-center justify-center shadow-2xl animate-float">
                   <Layers size={36} className="text-slate-950" />
                </div>
                <div>
                   <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Project Hub</h1>
                   <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#00ff9d] border border-white/5">
                         Logistics Matrix Synced
                      </span>
                   </div>
                </div>
             </div>

             <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
                {['roster', 'kanban', 'assistant'].map(tab => (
                   <button key={tab} onClick={() => setActiveView(tab as any)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeView === tab ? 'bg-[#00ff9d] text-slate-950' : 'text-white/50'}`}>
                      {tab}
                   </button>
                ))}
             </div>
          </div>
       </div>

       {activeView === 'roster' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {projects.map(proj => (
                <div key={proj.id} onClick={() => setSelectedProject(proj)} className="bg-white p-8 rounded-[3rem] border-2 border-slate-50 hover:border-indigo-600 hover:shadow-2xl transition-all group">
                   <h3 className="text-xl font-black text-slate-800 uppercase mb-4">{proj.name}</h3>
                   <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
                      <div className="h-full bg-indigo-600" style={{ width: `${proj.progress}%` }}></div>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{proj.progress}% Velocity</span>
                      <ChevronRight className="text-slate-300 group-hover:text-indigo-600"/>
                   </div>
                </div>
             ))}
          </div>
       )}
    </div>
  );
};
