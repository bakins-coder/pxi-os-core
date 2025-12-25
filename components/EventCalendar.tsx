
import React, { useState, useEffect } from 'react';
import { nexusStore } from '../services/nexusStore';
import { Task } from '../types';
import { 
  ChevronLeft, ChevronRight, Clock, MapPin, User, CalendarDays, X
} from 'lucide-react';

export const EventCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>(nexusStore.tasks);

  useEffect(() => {
    const unsubscribe = nexusStore.subscribe(() => setTasks([...nexusStore.tasks]));
    return unsubscribe;
  }, []);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const days = Array.from({ length: daysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth()) }, (_, i) => i);

  const eventsByDate: Record<number, Task[]> = {};
  tasks.forEach(task => {
    const taskDate = new Date(task.dueDate);
    if (taskDate.getMonth() === currentDate.getMonth() && taskDate.getFullYear() === currentDate.getFullYear()) {
      const day = taskDate.getDate();
      if (!eventsByDate[day]) eventsByDate[day] = [];
      eventsByDate[day].push(task);
    }
  });

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col h-[calc(100vh-180px)] animate-in fade-in">
      <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
        <div className="flex items-center gap-4">
          <CalendarDays className="text-indigo-600" size={24}/>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-3 bg-white border rounded-xl hover:bg-slate-50"><ChevronLeft size={20}/></button>
          <button onClick={nextMonth} className="p-3 bg-white border rounded-xl hover:bg-slate-50"><ChevronRight size={20}/></button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-7">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="p-4 bg-slate-50 border-b border-r text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{d}</div>
        ))}
        {blanks.map(b => <div key={`b-${b}`} className="border-b border-r bg-slate-50/20"></div>)}
        {days.map(day => (
          <div key={day} className="border-b border-r p-4 hover:bg-indigo-50/30 transition-all group">
            <div className="font-black text-slate-300 text-xs mb-2">{day}</div>
            <div className="space-y-1">
              {eventsByDate[day]?.map(event => (
                <div key={event.id} onClick={() => setSelectedTask(event)} className="bg-indigo-600 text-white px-2 py-1 rounded-lg text-[9px] font-black uppercase truncate shadow-md cursor-pointer">{event.title}</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedTask && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in zoom-in duration-200">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md p-10 relative">
               <button onClick={() => setSelectedTask(null)} className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-full"><X/></button>
               <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 block">Task Details</span>
               <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-6">{selectedTask.title}</h3>
               <div className="space-y-4 text-sm font-medium text-slate-600">
                  <div className="flex items-center gap-3"><Clock size={16} className="text-indigo-400"/> Due: {selectedTask.dueDate}</div>
                  <div className="flex items-start gap-3"><MapPin size={16} className="text-indigo-400"/> {selectedTask.description}</div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
