import React, { useState } from 'react';
import { db } from '../services/mockDb';
import { Task } from '../types';
// Fix: Added X and ensure Star is imported if needed (Star not used currently in this file)
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, MapPin, User, Search, Filter, Plus, CalendarDays, X
} from 'lucide-react';

export const EventCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 10, 1)); // Nov 2024 for demo
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const days = Array.from({ length: daysInMonth(year, currentDate.getMonth()) }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth(year, currentDate.getMonth()) }, (_, i) => i);

  // Map tasks to dates
  const eventsByDate: Record<number, Task[]> = {};
  db.tasks.forEach(task => {
    const taskDate = new Date(task.dueDate);
    if (taskDate.getMonth() === currentDate.getMonth() && taskDate.getFullYear() === currentDate.getFullYear()) {
      const day = taskDate.getDate();
      if (!eventsByDate[day]) eventsByDate[day] = [];
      eventsByDate[day].push(task);
    }
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-180px)] animate-in fade-in">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><CalendarDays size={20}/></div>
          <h2 className="text-xl font-bold text-slate-800">{monthName} {year}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-200 rounded-lg transition-colors"><ChevronLeft size={20}/></button>
          <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">Today</button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-200 rounded-lg transition-colors"><ChevronRight size={20}/></button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-7 text-sm">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="p-3 bg-slate-50 border-b border-r border-slate-100 font-bold text-slate-500 text-center uppercase tracking-widest text-[10px]">
            {d}
          </div>
        ))}
        {blanks.map(b => <div key={`b-${b}`} className="border-b border-r border-slate-50 bg-slate-50/30"></div>)}
        {days.map(day => (
          <div key={day} className="min-h-[100px] border-b border-r border-slate-100 p-2 group hover:bg-indigo-50/30 transition-colors">
            <div className="font-bold text-slate-400 mb-1">{day}</div>
            <div className="space-y-1">
              {eventsByDate[day]?.map(event => (
                <div 
                  key={event.id}
                  onClick={() => setSelectedTask(event)}
                  className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer truncate shadow-sm border transition-all hover:scale-[1.02] ${
                    event.priority === 'High' ? 'bg-red-100 text-red-700 border-red-200' :
                    event.priority === 'Medium' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                    'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {event.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                  selectedTask.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'
                }`}>{selectedTask.priority} Priority</span>
                <h3 className="text-xl font-bold text-slate-800 mt-2">{selectedTask.title}</h3>
              </div>
              <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
            </div>
            <div className="space-y-4 text-sm text-slate-600">
              <div className="flex items-center gap-3"><Clock size={16}/> Due: {selectedTask.dueDate}</div>
              <div className="flex items-start gap-3"><MapPin size={16}/><p>{selectedTask.description}</p></div>
              <div className="flex items-center gap-3"><User size={16}/> Assigned to: {db.teamMembers.find(u => u.id === selectedTask.assigneeId)?.name}</div>
            </div>
            <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold mt-8 shadow-lg">Open in CRM</button>
          </div>
        </div>
      )}
    </div>
  );
};