import React from 'react';
import { Contact, CateringEvent } from '../types';
import { useDataStore } from '../store/useDataStore';
import { generateHandoverReport } from '../utils/exportUtils';
import { X, FileText, Calendar, CheckCircle, Clock } from 'lucide-react';

interface CustomerEventsModalProps {
    contact: Contact;
    onClose: () => void;
}

export const CustomerEventsModal: React.FC<CustomerEventsModalProps> = ({ contact, onClose }) => {
    const { cateringEvents } = useDataStore();

    // Filter events for this customer
    // matching by name is loose, but consistent with current simple schema
    const customerEvents = cateringEvents.filter(e =>
        e.customerName.toLowerCase() === contact.name.toLowerCase()
    ).sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col border border-slate-200 max-h-[85vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Event History</h2>
                        <p className="text-sm text-slate-500 font-bold">{contact.name}</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white border border-slate-200 hover:bg-rose-500 hover:text-white text-slate-400 rounded-2xl transition-all shadow-sm"><X size={20} /></button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 scrollbar-thin">
                    {customerEvents.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="uppercase font-black tracking-widest text-xs">No events found for this customer</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {customerEvents.map(event => (
                                <div key={event.id} className="border border-slate-100 rounded-2xl p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-bold text-slate-900">{event.eventDate}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${event.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                event.status === 'Serving' ? 'bg-indigo-100 text-indigo-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                {event.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium">{event.guestCount} Guests • {event.location || 'No Location'}</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {event.portionMonitor ? (
                                            <button
                                                onClick={() => generateHandoverReport(event, event.portionMonitor!)}
                                                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors text-xs font-black uppercase tracking-wide"
                                            >
                                                <FileText size={14} /> Download Report
                                            </button>
                                        ) : (
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1">
                                                <Clock size={12} /> No Report Data
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button onClick={onClose} className="px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Close History</button>
                </div>
            </div>
        </div>
    );
};
