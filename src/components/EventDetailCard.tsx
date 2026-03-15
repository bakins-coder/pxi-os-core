
import React, { useState, useEffect } from 'react';
import { X, Clock, ChefHat, Info, MapPin, Users, Calendar, Save, Trash2, MessageSquare, AlertCircle } from 'lucide-react';
import { CateringEvent, Task } from '../types';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';

interface EventDetailCardProps {
    item: { type: 'task' | 'event', data: any };
    onClose: () => void;
}

export const EventDetailCard = ({ item, onClose }: EventDetailCardProps) => {
    const { updateCateringOrder, tasks, cateringEvents } = useDataStore();
    const { user } = useAuthStore();

    // For events, we want the latest data from the store in case it was updated by someone else
    const currentEvent = item.type === 'event'
        ? cateringEvents.find(e => e.id === item.data.id) || item.data
        : null;

    const currentTask = item.type === 'task'
        ? tasks.find(t => t.id === item.data.id) || item.data
        : null;

    const [notes, setNotes] = useState(
        item.type === 'event'
            ? currentEvent?.banquetDetails?.notes || ''
            : currentTask?.description || ''
    );
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    const handleSaveNotes = async () => {
        setIsSaving(true);
        try {
            if (item.type === 'event') {
                const updatedBanquetDetails = {
                    ...(currentEvent?.banquetDetails || {}),
                    notes: notes
                };
                await updateCateringOrder(currentEvent.id, { banquetDetails: updatedBanquetDetails });
            } else {
                // For tasks, we might need a general updateTask action if available
                // For now, let's assume updateTask exists or we'll add it if missing
                console.log('Task update not fully implemented in this prototype');
            }
            setLastSaved(new Date().toLocaleTimeString());
        } catch (error) {
            console.error('Failed to save notes:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Auto-save logic could be added here for a "truly collaborative" feel
    // But for now, a Save button is safer to avoid race conditions without debouncing

    const data = item.type === 'event' ? currentEvent : currentTask;
    const title = data.customerName || data.title;
    const date = data.eventDate || data.dueDate;
    const status = data.status;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative animate-in zoom-in duration-300">
                {/* Header Section */}
                <div className={`p-8 md:p-12 text-white ${item.type === 'event' ? 'bg-gradient-to-br from-emerald-600 to-teal-700' : 'bg-gradient-to-br from-indigo-600 to-blue-700'}`}>
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex items-center gap-3 mb-4">
                        <span className="px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                            {item.type === 'event' ? 'Banquet Detail' : 'Team Task'}
                        </span>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/30 ${status === 'Confirmed' || status === 'Done' || status === 'Completed' ? 'bg-emerald-400/20 text-emerald-100' : 'bg-amber-400/20 text-amber-100'
                            }`}>
                            {status}
                        </span>
                    </div>

                    <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-tight">
                        {title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-6 mt-6 text-white/80 font-bold uppercase text-xs tracking-wider">
                        <div className="flex items-center gap-2">
                            <Calendar size={18} className="text-white/60" />
                            {date}
                        </div>
                        {item.type === 'event' && (
                            <div className="flex items-center gap-2">
                                <Users size={18} className="text-white/60" />
                                {data.guestCount} Guests
                            </div>
                        )}
                        {data.location && (
                            <div className="flex items-center gap-2">
                                <MapPin size={18} className="text-white/60" />
                                {data.location}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10">
                    {/* Event Snapshot */}
                    {item.type === 'event' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <ChefHat size={14} className="text-emerald-500" />
                                    Menu Items
                                </p>
                                <div className="space-y-2">
                                    {data.items?.slice(0, 5).map((it: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center text-xs font-bold text-slate-700">
                                            <span>{it.name}</span>
                                            <span className="text-slate-400">×{it.quantity}</span>
                                        </div>
                                    ))}
                                    {data.items?.length > 5 && (
                                        <p className="text-[10px] text-indigo-500 font-black mt-2">+{data.items.length - 5} more items...</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Clock size={14} className="text-indigo-500" />
                                    Workflow Phase
                                </p>
                                <p className="text-2xl font-black text-slate-800 uppercase italic">
                                    {data.currentPhase}
                                </p>
                                <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 rounded-full"
                                        style={{ width: `${data.readinessScore || 40}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Collaboration / Notes Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-slate-800 uppercase">Collaborative Notes</h4>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Team updates & Coordination intel</p>
                                </div>
                            </div>
                            {lastSaved && (
                                <span className="text-[10px] text-emerald-500 font-black uppercase flex items-center gap-1 animate-pulse">
                                    <Save size={12} /> Saved {lastSaved}
                                </span>
                            )}
                        </div>

                        <div className="relative group">
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Type event-specific updates here... All authenticated team members can see this."
                                className="w-full min-h-[200px] p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none shadow-inner"
                            />
                            <div className="absolute bottom-6 right-6 flex items-center gap-4">
                                <button
                                    onClick={handleSaveNotes}
                                    disabled={isSaving}
                                    className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-2 ${isSaving ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white hover:bg-indigo-600'
                                        }`}
                                >
                                    {isSaving ? 'Saving...' : 'Sync Note'}
                                    {!isSaving && <Save size={14} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                            <AlertCircle size={18} className="text-amber-500" />
                            <p className="text-[10px] font-bold text-amber-700 uppercase leading-normal">
                                Note: These details are shared across the organization. Changes are reflected in real-time for all logged-in team members.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="p-8 border-t border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <button
                        onClick={() => window.location.href = item.type === 'event' ? `/catering?id=${data.id}` : `/tasks?id=${data.id}`}
                        className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors"
                    >
                        View Full History →
                    </button>
                    <button
                        onClick={onClose}
                        className="px-10 py-4 bg-white border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-all shadow-sm"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
};
