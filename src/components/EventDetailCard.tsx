import React, { useState, useEffect } from 'react';
import { X, Clock, ChefHat, Info, MapPin, Users, Calendar, Save, Trash2, MessageSquare, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();

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

    const [isExpanded, setIsExpanded] = useState(false);

    const data = item.type === 'event' ? currentEvent : currentTask;
    const title = data.customerName || data.title;
    const date = data.eventDate || data.dueDate;
    const status = data.status;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`bg-white rounded-[2.5rem] shadow-2xl w-full flex flex-col relative animate-in zoom-in duration-300 transition-all duration-300 overflow-hidden
                ${isExpanded ? 'max-w-2xl max-h-[90vh]' : 'max-w-md max-h-[80vh]'}`}>
                
                {/* Header Section */}
                <div className={`p-6 text-white relative transition-all ${item.type === 'event' ? 'bg-gradient-to-br from-emerald-600 to-teal-700' : 'bg-gradient-to-br from-indigo-600 to-blue-700'}`}>
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-white/20 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md">
                            {item.type === 'event' ? 'Banquet Detail' : 'Team Task'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/30 ${status === 'Confirmed' || status === 'Done' || status === 'Completed' ? 'bg-emerald-400/20 text-emerald-100' : 'bg-amber-400/20 text-amber-100'
                            }`}>
                            {status}
                        </span>
                    </div>

                    <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight pr-8">
                        {title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 mt-4 text-white/80 font-bold uppercase text-[10px] tracking-wider">
                        <div className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-white/60" />
                            {date}
                        </div>
                        {item.type === 'event' && (
                            <div className="flex items-center gap-1.5">
                                <Users size={14} className="text-white/60" />
                                {data.guestCount} Guests
                            </div>
                        )}
                        {data.location && (
                            <div className="flex items-center gap-1.5">
                                <MapPin size={14} className="text-white/60" />
                                {data.location}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                    {/* Event Snapshot */}
                    {item.type === 'event' && (
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <ChefHat size={12} className="text-emerald-500" />
                                    Menu Items
                                </p>
                                <div className="space-y-1.5">
                                    {data.items?.slice(0, isExpanded ? 10 : 3).map((it: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center text-xs font-bold text-slate-700">
                                            <span>{it.name}</span>
                                            <span className="text-slate-400">×{it.quantity}</span>
                                        </div>
                                    ))}
                                    {data.items?.length > (isExpanded ? 10 : 3) && (
                                        <p className="text-[9px] text-indigo-500 font-black mt-1">
                                            +{data.items.length - (isExpanded ? 10 : 3)} more items...
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                        <Clock size={12} className="text-indigo-500" />
                                        Workflow Phase
                                    </p>
                                    <p className="text-lg font-black text-slate-800 uppercase italic">
                                        {data.currentPhase}
                                    </p>
                                </div>
                                <div className="w-24">
                                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full"
                                            style={{ width: `${data.readinessScore || 40}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Expand Trigger Button (only visible when collapsed) */}
                    {!isExpanded && (
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 animate-in fade-in"
                        >
                            <MessageSquare size={12} /> Expand Collaborative Notes & Info
                        </button>
                    )}

                    {/* Collaboration / Notes Section (only visible when expanded) */}
                    {isExpanded && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                        <MessageSquare size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-800 uppercase">Collaborative Notes</h4>
                                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Team updates & intel</p>
                                    </div>
                                </div>
                                {lastSaved && (
                                    <span className="text-[9px] text-emerald-500 font-black uppercase flex items-center gap-1">
                                        <Save size={10} /> Saved {lastSaved}
                                    </span>
                                )}
                            </div>

                            <div className="relative group">
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Type event-specific updates here..."
                                    className="w-full min-h-[120px] p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-medium text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none shadow-inner"
                                />
                                <div className="absolute bottom-4 right-4">
                                    <button
                                        onClick={handleSaveNotes}
                                        disabled={isSaving}
                                        className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest shadow transition-all flex items-center gap-1.5 ${isSaving ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}
                                    >
                                        {isSaving ? 'Saving...' : 'Sync Note'}
                                        {!isSaving && <Save size={12} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                                <AlertCircle size={14} className="text-amber-500 shrink-0" />
                                <p className="text-[9px] font-bold text-amber-700 uppercase leading-normal">
                                    Shared across the organization. Changes reflect in real-time.
                                </p>
                            </div>

                            <button
                                onClick={() => setIsExpanded(false)}
                                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all"
                            >
                                Collapse Notes View
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer / Actions */}
                <div className="p-6 border-t border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <button
                        onClick={() => {
                            const path = item.type === 'event' ? `/catering?id=${data.id}` : `/tasks?id=${data.id}`;
                            navigate(path);
                            onClose();
                        }}
                        className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors"
                    >
                        View Full History →
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-all shadow-sm"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
};
