import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../store/useDataStore';
import { Task, CateringEvent } from '../types';
import {
  ChevronLeft, ChevronRight, ChefHat, X
} from 'lucide-react';


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
    <div className={`bg-white rounded-3xl border border-transparent overflow-hidden flex flex-col h-full animate-in fade-in ${className}`}>
      <div className="p-3 md:p-4 border-b border-slate-50 flex items-center justify-between bg-white shrink-0">
        <div className="py-0.5">
          <h2 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-tighter">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Operations</p>
        </div>
        <div className="flex gap-1 md:gap-2">
          <button onClick={prevMonth} className="p-1.5 md:p-2 hover:bg-slate-100 rounded-lg md:rounded-xl transition-all border border-slate-100 shadow-sm"><ChevronLeft size={12} className="md:w-3.5 md:h-3.5" /></button>
          <button onClick={nextMonth} className="p-1.5 md:p-2 hover:bg-slate-100 rounded-lg md:rounded-xl transition-all border border-slate-100 shadow-sm"><ChevronRight size={12} className="md:w-3.5 md:h-3.5" /></button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-7 overflow-y-auto no-scrollbar">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="p-2 md:p-3 text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/30 text-center">{d}</div>
        ))}
        {days.map((day, i) => (
          <div key={i} className="p-1 md:p-2 hover:bg-indigo-50/30 transition-all group overflow-y-auto min-h-[40px] md:min-h-[50px]">
            {day && (
              <>
                <div className="font-black text-slate-300 text-[10px] mb-1.5">{day}</div>
                <div className="space-y-1">
                  {itemsByDate[day]?.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if (item.type === 'event') {
                          navigate(`/catering?id=${item.data.id}`);
                        } else {
                          setSelectedItem(item);
                        }
                      }}
                      className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase truncate shadow-sm cursor-pointer border ${item.type === 'event'
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

      {/* We no longer render EventDetailCard for items that should navigate instead */}
    </div>
  );
};