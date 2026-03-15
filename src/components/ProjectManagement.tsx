import React, { useState } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Project, Task } from '../types';
import {
   Layers, ChevronRight, Columns, CalendarRange, ListTodo, AlertCircle
} from 'lucide-react';

const KanbanBoard = ({ project }: { project: Project }) => {
   const { advanceProjectTask } = useDataStore();
   const projectTasks = project.tasks || [];

   // Group by status
   const columns = {
      'Todo': projectTasks.filter(t => t.status === 'Todo'),
      'In Progress': projectTasks.filter(t => t.status === 'In Progress'),
      'Review': projectTasks.filter(t => t.status === 'Review'),
      'Done': projectTasks.filter(t => t.status === 'Done' || t.status === 'Completed')
   };

   const getNextStatusLabel = (status: string) => {
      switch (status) {
         case 'Todo': return 'Start Progress';
         case 'In Progress': return 'Move to Review';
         case 'Review': return 'Complete Task';
         default: return null;
      }
   };

   return (
      <div className="flex gap-6 overflow-x-auto pb-8 snap-x no-scrollbar">
         {Object.entries(columns).map(([status, items]) => (
            <div key={status} className="bg-slate-50/50 rounded-[2.5rem] p-6 min-w-[320px] w-[320px] flex-shrink-0 border border-slate-100/50 snap-center">
               <div className="flex justify-between items-center mb-6 px-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                     {status}
                  </h4>
                  <span className="bg-white border border-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black shadow-sm">
                     {items.length}
                  </span>
               </div>
               <div className="space-y-4">
                  {items.map(task => {
                     const nextLabel = getNextStatusLabel(task.status);
                     return (
                        <div
                           key={task.id}
                           onClick={() => nextLabel && advanceProjectTask(project.id, task.id)}
                           className={`bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${nextLabel ? 'cursor-pointer hover:border-indigo-200 group' : ''} relative overflow-hidden`}
                        >
                           {task.priority === 'Critical' && (
                              <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
                           )}
                           <div className="flex justify-between items-start mb-4">
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl ${task.priority === 'Critical' ? 'bg-rose-50 text-rose-600' :
                                 task.priority === 'High' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'
                                 }`}>{task.priority}</span>
                              <span className="text-[9px] text-slate-400 font-black tracking-widest bg-slate-50 px-2 py-1 rounded-lg">{task.dueDate.slice(5)}</span>
                           </div>
                           <h5 className="font-bold text-slate-900 text-[15px] mb-2 leading-tight">{task.title}</h5>
                           <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-6 font-medium">{task.description}</p>

                           {nextLabel && (
                              <div className="pt-4 border-t border-slate-50 flex items-center justify-between group-hover:text-indigo-600 transition-colors">
                                 <span className="text-[9px] font-black uppercase tracking-[0.2em]">{nextLabel}</span>
                                 <ChevronRight size={14} className="transform group-hover:translate-x-2 transition-transform duration-300" />
                              </div>
                           )}
                        </div>
                     );
                  })}
                  {items.length === 0 && (
                     <div className="flex flex-col items-center justify-center py-20 opacity-30 border-4 border-dotted border-slate-200 rounded-[2rem]">
                        <ListTodo size={32} className="text-slate-300 mb-3" />
                        <p className="text-[9px] font-black uppercase tracking-widest">No tasks pending</p>
                     </div>
                  )}
               </div>
            </div>
         ))}
      </div>
   );
};

const GanttChart = ({ project }: { project: Project }) => {
   const projectTasks = project.tasks || [];

   // Sort by due date
   const sortedTasks = [...projectTasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

   return (
      <div className="bg-white rounded-[3rem] p-10 border border-slate-100/50 shadow-2xl shadow-slate-200/50 overflow-hidden">
         <div className="overflow-x-auto no-scrollbar">
            <div className="min-w-[900px]">
               <div className="grid grid-cols-12 gap-6 mb-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50 pb-6">
                  <div className="col-span-5">Technical Activity</div>
                  <div className="col-span-2">Deadline</div>
                  <div className="col-span-2">Priority</div>
                  <div className="col-span-3 text-right">Current Status</div>
               </div>
               <div className="space-y-3 relative">
                  <div className="absolute left-[22px] top-6 bottom-6 w-0.5 bg-slate-50 z-0"></div>

                  {sortedTasks.map((task) => (
                     <div key={task.id} className="relative z-10 grid grid-cols-12 gap-6 items-center p-5 rounded-[1.5rem] hover:bg-slate-50 transition-all duration-300 group border border-transparent hover:border-slate-100">
                        <div className="col-span-5 flex items-center gap-5">
                           <div className={`w-4 h-4 rounded-full border-[3px] shrink-0 transition-colors ${task.status === 'Done' || task.status === 'Completed' ? 'bg-emerald-500 border-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-white border-slate-200 group-hover:border-indigo-200'}`}></div>
                           <div className="min-w-0">
                              <p className={`font-bold text-[14px] text-slate-800 truncate ${task.status === 'Done' || task.status === 'Completed' ? 'line-through opacity-40' : ''}`}>{task.title}</p>
                              {(task.priority === 'Critical' || task.title.includes('Cooking')) && <span className="text-[9px] text-rose-500 font-black uppercase tracking-widest flex items-center gap-1.5 mt-1 animate-pulse"><AlertCircle size={10} /> Live Operation Critical</span>}
                           </div>
                        </div>
                        <div className="col-span-2 text-[11px] font-black text-slate-400 uppercase tracking-widest tracking-tighter">{task.dueDate}</div>
                        <div className="col-span-2">
                           <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl ${task.priority === 'Critical' ? 'bg-rose-50 text-rose-600' :
                              task.priority === 'High' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'
                              }`}>{task.priority}</span>
                        </div>
                        <div className="col-span-3 text-right">
                           <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${task.status === 'Done' || task.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              task.status === 'In Progress' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                              }`}>{task.status}</span>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
   );
};

export const ProjectManagement = () => {
   const [activeView, setActiveView] = useState<'roster' | 'kanban' | 'gantt'>('roster');
   const projects = useDataStore(state => state.projects);
   const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
   const brandColor = useSettingsStore(s => s.settings.brandColor) || '#00ff9d';

   const selectedProject = projects.find(p => p.id === selectedProjectId);

   const handleProjectSelect = (proj: Project) => {
      setSelectedProjectId(proj.id);
      setActiveView('kanban'); // Auto switch to Kanban on select
   };

   return (
      <div className="space-y-8 animate-in fade-in pb-20">
         <div className="bg-slate-950 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl mb-8">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#00ff9d]/20 rounded-full blur-[100px] -mr-40 -mt-40" style={{ backgroundColor: `${brandColor}33` }}></div>
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl animate-float" style={{ backgroundColor: brandColor }}>
                     <Layers size={36} className="text-slate-950" />
                  </div>
                  <div>
                     <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Project Hub</h1>
                     {selectedProject && (
                        <div className="flex items-center gap-2 mt-2 opacity-80">
                           <span className="text-xs font-bold text-white/50">Viewing Project:</span>
                           <span className="text-sm font-black text-white">{selectedProject.name}</span>
                           <button onClick={() => setSelectedProjectId(null)} className="ml-2 text-[10px] bg-white/10 px-2 py-0.5 rounded hover:bg-white/20">Change</button>
                        </div>
                     )}
                     {!selectedProject && (
                        <div className="flex items-center gap-3 mt-1">
                           <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5" style={{ color: brandColor }}>
                              {projects.length} Active Projects
                           </span>
                        </div>
                     )}
                  </div>
               </div>

               {selectedProject ? (
                  <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
                     {[
                        { id: 'kanban', label: 'Kanban', icon: Columns },
                        { id: 'gantt', label: 'Timeline', icon: CalendarRange }
                     ].map(tab => (
                        <button
                           key={tab.id}
                           onClick={() => setActiveView(tab.id as any)}
                           className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeView === tab.id ? 'text-slate-950' : 'text-white/50 hover:text-white'}`}
                           style={activeView === tab.id ? { backgroundColor: brandColor } : {}}
                        >
                           <tab.icon size={14} /> {tab.label}
                        </button>
                     ))}
                  </div>
               ) : null}
            </div>
         </div>

         {!selectedProject ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
               {projects.map(proj => (
                  <div key={proj.id} onClick={() => handleProjectSelect(proj)} className="bg-white p-10 rounded-[4rem] border border-slate-100 hover:border-indigo-600 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-2 transition-all group cursor-pointer relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Layers size={140} className="text-slate-900" />
                     </div>
                     <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-6 relative z-10 pr-8 leading-none">{proj.name}</h3>

                     <div className="flex justify-between items-end mb-3 relative z-10">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{proj.progress}% Complete</span>
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">{proj.status}</span>
                     </div>
                     <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-8 relative z-10">
                        <div className="h-full bg-slate-950 transition-all duration-1000" style={{ width: `${proj.progress}%`, backgroundColor: brandColor }}></div>
                     </div>

                     <div className="flex justify-between items-center relative z-10">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{proj.tasks?.length || 0} Actions</span>
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                           <ChevronRight className="text-slate-300 group-hover:text-white transition-colors" />
                        </div>
                     </div>
                     <div className="mt-8 flex flex-wrap gap-2 relative z-10">
                        {proj.tasks?.some(t => t.priority === 'Critical' && t.status !== 'Done' && t.status !== 'Completed') && (
                           <span className="px-3 py-1.5 bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-widest rounded-xl border border-rose-100 shadow-sm animate-pulse">Critical Actions Pending</span>
                        )}
                     </div>
                  </div>
               ))}
               {projects.length === 0 && (
                  <div className="col-span-full py-40 text-center border-4 border-dashed border-slate-100 rounded-[4rem]">
                     <Layers size={64} className="mx-auto text-slate-200 mb-6" />
                     <p className="text-slate-400 font-black uppercase tracking-widest">No active projects detected</p>
                     <p className="text-slate-400 text-xs mt-2">Create a new Catering Order to initialize a project.</p>
                  </div>
               )}
            </div>
         ) : (
            <>
               {activeView === 'kanban' && <KanbanBoard project={selectedProject} />}
               {activeView === 'gantt' && <GanttChart project={selectedProject} />}
            </>
         )}
      </div>
   );
};
