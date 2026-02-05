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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 overflow-x-auto pb-4">
         {Object.entries(columns).map(([status, items]) => (
            <div key={status} className="bg-slate-50 rounded-3xl p-4 min-w-[280px]">
               <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 px-2 flex justify-between">
                  {status} <span className="bg-slate-200 text-slate-600 px-2 rounded-full">{items.length}</span>
               </h4>
               <div className="space-y-3">
                  {items.map(task => {
                     const nextLabel = getNextStatusLabel(task.status);
                     return (
                        <div
                           key={task.id}
                           onClick={() => nextLabel && advanceProjectTask(project.id, task.id)}
                           className={`bg-white p-4 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md ${nextLabel ? 'cursor-pointer hover:border-indigo-200 group' : ''} ${task.priority === 'Critical' ? 'border-l-4 border-l-rose-500' : ''}`}
                        >
                           <div className="flex justify-between items-start mb-2">
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${task.priority === 'Critical' ? 'bg-rose-100 text-rose-600' :
                                 task.priority === 'High' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                                 }`}>{task.priority}</span>
                              <span className="text-[10px] text-slate-400 font-bold">{task.dueDate.slice(5)}</span>
                           </div>
                           <h5 className="font-bold text-slate-800 text-sm mb-1">{task.title}</h5>
                           <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">{task.description}</p>

                           {nextLabel && (
                              <div className="pt-3 border-t border-slate-50 flex items-center justify-between group-hover:text-indigo-600 transition-colors">
                                 <span className="text-[9px] font-black uppercase tracking-widest">{nextLabel}</span>
                                 <ChevronRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
                              </div>
                           )}
                        </div>
                     );
                  })}
                  {items.length === 0 && (
                     <div className="text-center py-8 opacity-30 border-2 border-dashed border-slate-200 rounded-2xl">
                        <p className="text-[10px] font-black uppercase">No tasks</p>
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
      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 overflow-hidden">
         <div className="overflow-x-auto">
            <div className="min-w-[800px]">
               <div className="grid grid-cols-12 gap-4 mb-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 pb-4">
                  <div className="col-span-4">Task Activity</div>
                  <div className="col-span-2">Due Date</div>
                  <div className="col-span-2">Priority</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2 text-right">Assignee</div>
               </div>
               <div className="space-y-2 relative">
                  {/* Simple vertical connector line */}
                  <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-100 z-0"></div>

                  {sortedTasks.map((task, idx) => (
                     <div key={task.id} className="relative z-10 grid grid-cols-12 gap-4 items-center p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
                        <div className="col-span-4 flex items-center gap-4">
                           <div className={`w-3 h-3 rounded-full border-2 ${task.status === 'Done' ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'}`}></div>
                           <div>
                              <p className={`font-bold text-sm text-slate-800 ${task.status === 'Done' ? 'line-through opacity-50' : ''}`}>{task.title}</p>
                              {task.title.includes('Cooking') && <span className="text-[9px] text-rose-500 font-black uppercase tracking-wider flex items-center gap-1 mt-0.5"><AlertCircle size={8} /> Day of Event Critical</span>}
                           </div>
                        </div>
                        <div className="col-span-2 text-xs font-medium text-slate-600">{task.dueDate}</div>
                        <div className="col-span-2">
                           <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${task.priority === 'Critical' ? 'bg-rose-100 text-rose-600' :
                              task.priority === 'High' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                              }`}>{task.priority}</span>
                        </div>
                        <div className="col-span-2">
                           <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${task.status === 'Done' ? 'bg-emerald-100 text-emerald-600' :
                              task.status === 'In Progress' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
                              }`}>{task.status}</span>
                        </div>
                        <div className="col-span-2 text-right text-xs text-slate-400">Team</div>
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
   const [selectedProject, setSelectedProject] = useState<Project | null>(null);
   const brandColor = useSettingsStore(s => s.settings.brandColor) || '#00ff9d';

   const handleProjectSelect = (proj: Project) => {
      setSelectedProject(proj);
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
                           <button onClick={() => setSelectedProject(null)} className="ml-2 text-[10px] bg-white/10 px-2 py-0.5 rounded hover:bg-white/20">Change</button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {projects.map(proj => (
                  <div key={proj.id} onClick={() => handleProjectSelect(proj)} className="bg-white p-8 rounded-[3rem] border-2 border-slate-50 hover:border-indigo-600 hover:shadow-2xl transition-all group cursor-pointer relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Layers size={100} className="text-slate-200" />
                     </div>
                     <h3 className="text-xl font-black text-slate-800 uppercase mb-4 relative z-10 pr-8">{proj.name}</h3>
                     <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-6 relative z-10">
                        <div className="h-full bg-indigo-600" style={{ width: `${proj.progress}%` }}></div>
                     </div>
                     <div className="flex justify-between items-center relative z-10">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{proj.tasks?.length || 0} Management Tasks</span>
                        <ChevronRight className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                     </div>
                     <div className="mt-6 flex flex-wrap gap-2 relative z-10">
                        {proj.tasks?.some(t => t.priority === 'Critical' && t.status !== 'Done') && (
                           <span className="px-2 py-1 bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-wider rounded-lg border border-rose-100">Critical Actions Pending</span>
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
