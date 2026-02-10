
import React, { useState, useMemo } from 'react';
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
}

export const EventCalendar: React.FC<EventCalendarProps> = ({ tasks: propsTasks, events: propsEvents, className }) => {
  const storeTasks = useDataStore(state => state.tasks);
  const storeEvents = useDataStore(state => state.cateringEvents);

  const tasks = propsTasks || storeTasks;
  const events = propsEvents || storeEvents;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState<{ type: 'task' | 'event', data: any } | null>(null);

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const itemsByDate = useMemo(() => {
    const map: Record<number, { type: 'task' | 'event', data: any }[]> = {};

    tasks.forEach(task => {
      const taskDate = new Date(task.dueDate);
      if (taskDate.getMonth() === currentDate.getMonth() && taskDate.getFullYear() === currentDate.getFullYear()) {
        const day = taskDate.getDate();
        if (!map[day]) map[day] = [];
        map[day].push({ type: 'task', data: task });
      }
    });

    events.forEach(event => {
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
    <div className={`bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col h-full min-h-[400px] md:min-h-[500px] animate-in fade-in ${className}`}>
      <div className="p-4 md:p-8 border-b border-slate-50 flex items-center justify-between bg-white">
        <div className="py-2">
          <h2 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tighter">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Operational Heatmap</p>
        </div>
        <div className="flex gap-1 md:gap-2">
          <button onClick={prevMonth} className="p-2 md:p-3 hover:bg-slate-100 rounded-xl md:rounded-2xl transition-all border border-slate-100 shadow-sm"><ChevronLeft size={16} className="md:w-5 md:h-5" /></button>
          <button onClick={nextMonth} className="p-2 md:p-3 hover:bg-slate-100 rounded-xl md:rounded-2xl transition-all border border-slate-100 shadow-sm"><ChevronRight size={16} className="md:w-5 md:h-5" /></button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-7 overflow-y-auto">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="p-2 md:p-4 text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-r bg-slate-50/50 text-center">{d}</div>
        ))}
        {days.map((day, i) => (
          <div key={i} className="border-b border-r p-1 md:p-4 hover:bg-indigo-50/30 transition-all group overflow-y-auto min-h-[60px] md:min-h-[100px]">
            {day && (
              <>
                <div className="font-black text-slate-300 text-xs mb-2">{day}</div>
                <div className="space-y-1">
                  {itemsByDate[day]?.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedItem(item)}
                      className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase truncate shadow-sm cursor-pointer border ${item.type === 'event'
                        ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700'
                        : 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700'
                        }`}
                    >
                      {item.type === 'event' && <ChefHat size={8} className="inline mr-1 mb-0.5" />}
                      {item.data.title || item.data.customerName}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
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