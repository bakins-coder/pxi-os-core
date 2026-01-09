import React, { useState, useEffect, useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { Task, CateringEvent } from '../types';
import {
  ChevronLeft, ChevronRight, Clock, MapPin, User, CalendarDays, X, ChefHat, Info
} from 'lucide-react';

interface EventCalendarProps {
  tasks?: Task[];
  events?: CateringEvent[];
}

export const EventCalendar: React.FC<EventCalendarProps> = ({ tasks: propsTasks, events: propsEvents }) => {
  const storeTasks = useDataStore(state => state.tasks);
  const storeEvents = useDataStore(state => state.cateringEvents);

  const tasks = propsTasks || storeTasks;
  const events = propsEvents || storeEvents;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState<{ type: 'task' | 'event', data: any } | null>(null);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const days = Array.from({ length: daysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth()) }, (_, i) => i);

  const itemsByDate = useMemo(() => {
    const map: Record<number, { type: 'task' | 'event', data: any }[]> = {};

    // Map Tasks
    tasks.forEach(task => {
      const taskDate = new Date(task.dueDate);
      if (taskDate.getMonth() === currentDate.getMonth() && taskDate.getFullYear() === currentDate.getFullYear()) {
        const day = taskDate.getDate();
        if (!map[day]) map[day] = [];
        map[day].push({ type: 'task', data: task });
      }
    });

    // Map Catering Events
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

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col h-[calc(100vh-180px)] animate-in fade-in">
      <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
        <div className="flex items-center gap-4">
          <CalendarDays className="text-indigo-600" size={24} />
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-3 bg-white border rounded-xl hover:bg-slate-50"><ChevronLeft size={20} /></button>
          <button onClick={nextMonth} className="p-3 bg-white border rounded-xl hover:bg-slate-50"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-7">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="p-4 bg-slate-50 border-b border-r text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{d}</div>
        ))}
        {blanks.map(b => <div key={`b-${b}`} className="border-b border-r bg-slate-50/20"></div>)}
        {days.map(day => (
          <div key={day} className="border-b border-r p-4 hover:bg-indigo-50/30 transition-all group overflow-y-auto min-h-[100px]">
            <div className="font-black text-slate-300 text-xs mb-2">{day}</div>
            <div className="space-y-1">
              {itemsByDate[day]?.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedItem(item)}
                  className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase truncate shadow-sm cursor-pointer border ${item.type === 'event'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-indigo-600 text-white border-indigo-500'
                    }`}
                >
                  {item.type === 'event' && <ChefHat size={8} className="inline mr-1 mb-0.5" />}
                  {item.data.title || item.data.customerName}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in zoom-in duration-200">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md p-10 relative">
            <button onClick={() => setSelectedItem(null)} className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-full"><X /></button>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 block">{selectedItem.type === 'event' ? 'Banquet Detail' : 'Task Details'}</span>
            <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-6">{selectedItem.data.title || selectedItem.data.customerName}</h3>
            <div className="space-y-4 text-sm font-medium text-slate-600">
              <div className="flex items-center gap-3"><Clock size={16} className="text-indigo-400" /> {selectedItem.type === 'event' ? 'Date' : 'Due'}: {selectedItem.data.eventDate || selectedItem.data.dueDate}</div>
              {selectedItem.type === 'event' && <div className="flex items-center gap-3"><ChefHat size={16} className="text-emerald-500" /> Guests: {selectedItem.data.guestCount}</div>}
              <div className="flex items-start gap-3"><Info size={16} className="text-indigo-400" /> {selectedItem.data.description || selectedItem.data.notes || 'No notes attached.'}</div>
            </div>
            {selectedItem.type === 'event' && selectedItem.data.financials && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Quick Financials</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-600 uppercase">Valuation</span>
                  <span className="text-xl font-black text-indigo-600">₦{(selectedItem.data.financials.revenueCents / 100).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};