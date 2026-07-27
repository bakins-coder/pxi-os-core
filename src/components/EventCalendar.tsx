import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../store/useDataStore';
import { Task, CateringEvent } from '../types';
import {
  ChevronLeft, ChevronRight, ChefHat, X
} from 'lucide-react';
import { EventDetailCard } from './EventDetailCard';


interface EventCalendarProps {
  tasks?: Task[];
  events?: CateringEvent[];
  className?: string;
  onEventClick?: (event: CateringEvent) => void;
}

export const EventCalendar: React.FC<EventCalendarProps> = ({ tasks: propsTasks, events: propsEvents, className, onEventClick }) => {
  const storeTasks = useDataStore(state => state.tasks);
  const storeEvents = useDataStore(state => state.cateringEvents);

  const tasks = propsTasks || storeTasks;
  const events = propsEvents || storeEvents;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState<{ type: 'task' | 'event', data: any } | null>(null);
  const navigate = useNavigate();

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const itemsByDate = useMemo(() => {
    const map: Record<number, { type: 'task' | 'event', data: any }[]> = {};

    tasks?.forEach(task => {
      const taskDate = new Date(task.dueDate);
      if (taskDate.getMonth() === currentDate.getMonth() && taskDate.getFullYear() === currentDate.getFullYear()) {
        const day = taskDate.getDate();
        if (!map[day]) map[day] = [];
        map[day].push({ type: 'task', data: task });
      }
    });

    events?.forEach(event => {
      const eventDate = new Date(event.eventDate);
      if (eventDate.getMonth() === currentDate.getMonth() && eventDate.getFullYear() === currentDate.getFullYear()) {
        const day = eventDate.getDate();
        if (!map[day]) map[day] = [];
        map[day].push({ type: 'event', data: event });
      }
    });
    return map;
  }, [tasks, events, currentDate]);

  const days = [];
  for (let i = 0; i < firstDayOfMonth(currentDate); i++) days.push(null);
  for (let i = 1; i <= daysInMonth(currentDate); i++) days.push(i);

  return (
    <div className={`bg-white rounded-2xl border border-transparent overflow-hidden flex flex-col h-full animate-in fade-in ${className}`}>
      <div className="p-1.5 md:p-2 border-b border-slate-50 flex items-center justify-between bg-white shrink-0">
        <div>
          <h2 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-tighter leading-none">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <p className="text-[6px] md:text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Operations</p>
        </div>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-md transition-all border border-slate-100 shadow-sm"><ChevronLeft size={12} /></button>
          <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-md transition-all border border-slate-100 shadow-sm"><ChevronRight size={12} /></button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-7 border-t border-l border-slate-100 overflow-y-auto no-scrollbar">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="p-1 text-[8px] font-extrabold text-slate-500 uppercase tracking-widest bg-slate-50/70 text-center border-r border-b border-slate-100">{d}</div>
        ))}
        {days.map((day, i) => {
          const isToday = day && 
            day === new Date().getDate() && 
            currentDate.getMonth() === new Date().getMonth() && 
            currentDate.getFullYear() === new Date().getFullYear();
          const isWeekend = i % 7 === 0 || i % 7 === 6; // Sunday or Saturday
          
          return (
            <div 
              key={i} 
              className={`p-1 min-h-[36px] md:min-h-[42px] border-r border-b border-slate-100 transition-all flex flex-col justify-between group relative
                ${day ? 'hover:bg-slate-50/50 cursor-pointer' : 'bg-slate-50/20'}
                ${isWeekend && day ? 'bg-slate-50/30' : 'bg-white'}
              `}
            >
              {day ? (
                <>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className={`text-[9px] font-black px-1 py-0.2 rounded-md ${isToday ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}>
                      {day}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  </div>
                  <div className="space-y-1 flex-1 overflow-y-auto no-scrollbar max-h-[30px]">
                    {itemsByDate[day]?.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onEventClick && item.type === 'event') {
                            onEventClick(item.data);
                          } else {
                            setSelectedItem(item);
                          }
                        }}
                        className={`px-1 py-0.5 rounded text-[7px] font-black uppercase truncate border transition-all hover:scale-[1.02] flex items-center gap-1 shadow-sm
                          ${item.type === 'event'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 hover:bg-emerald-100/70'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200/60 hover:bg-indigo-100/70'
                          }`}
                      >
                        {item.type === 'event' ? (
                          <ChefHat size={8} className="shrink-0 text-emerald-600" />
                        ) : (
                          <span className="w-1 h-1 rounded-full bg-indigo-500 shrink-0"></span>
                        )}
                        <span className="truncate">{item.data.title || item.data.customerName}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:8px_8px] opacity-30"></div>
              )}
            </div>
          );
        })}
      </div>

      {selectedItem && (
        <EventDetailCard 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)} 
        />
      )}
    </div>
  );
};