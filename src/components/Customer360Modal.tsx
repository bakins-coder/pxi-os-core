
import React, { useState, useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Contact, InteractionLog, CateringEvent, Invoice, Task } from '../types';
import {
    X, User, Building, Phone, Mail, MapPin,
    Calendar, FileText, Settings, History,
    Plus, MessageSquare, Clock, TrendingUp,
    Download, ExternalLink, Activity
} from 'lucide-react';

interface Customer360ModalProps {
    contactId: string;
    onClose: () => void;
}

export const Customer360Modal: React.FC<Customer360ModalProps> = ({ contactId, onClose }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'preferences' | 'documents'>('overview');
    const { contacts, interactionLogs, cateringEvents, invoices, tasks, updateContact, addInteractionLog } = useDataStore();
    const brandColor = useSettingsStore(s => s.settings.brandColor) || '#4f46e5';

    const contact = useMemo(() => contacts.find(c => c.id === contactId), [contacts, contactId]);

    const relatedData = useMemo(() => {
        if (!contact) return null;

        const customerEvents = cateringEvents.filter(e =>
            e.contactId === contactId || (e.customerName && e.customerName.toLowerCase() === contact.name.toLowerCase())
        );
        const customerInvoices = invoices.filter(i => i.contactId === contactId);
        const customerLogs = interactionLogs.filter(l => l.contactId === contactId);

        // Combine for timeline
        const timeline = [
            ...customerEvents.map(e => ({ type: 'Event', date: e.eventDate, summary: `Event: ${e.status}`, id: e.id })),
            ...customerInvoices.map(i => ({ type: 'Invoice', date: i.date, summary: `Invoice #${i.number} - ₦${(i.totalCents / 100).toLocaleString()}`, id: i.id })),
            ...customerLogs.map(l => ({ type: l.type, date: l.createdAt, summary: l.summary, id: l.id }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const totalRevenue = customerInvoices.reduce((sum, i) => sum + i.totalCents, 0);

        return {
            events: customerEvents,
            invoices: customerInvoices,
            logs: customerLogs,
            timeline,
            totalRevenue
        };
    }, [contact, cateringEvents, invoices, interactionLogs, contactId]);

    const [newNote, setNewNote] = useState('');
    const [noteType, setNoteType] = useState<InteractionLog['type']>('Note');

    if (!contact || !relatedData) return null;

    const handleAddNote = () => {
        if (!newNote) return;
        addInteractionLog({
            contactId,
            type: noteType,
            summary: newNote.substring(0, 50),
            content: newNote
        });
        setNewNote('');
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col border border-slate-200 h-[90vh]">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                    <div className="flex gap-6">
                        <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center shadow-inner border-2 border-white">
                            {contact.type === 'Individual' ? <User size={40} className="text-slate-400" /> : <Building size={40} className="text-slate-400" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">{contact.name}</h2>
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                                    {contact.category}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-4 mt-3">
                                <span className="flex items-center gap-2 text-xs font-bold text-slate-500"><Phone size={14} /> {contact.phone}</span>
                                <span className="flex items-center gap-2 text-xs font-bold text-slate-500"><Mail size={14} /> {contact.email}</span>
                                {contact.address && <span className="flex items-center gap-2 text-xs font-bold text-slate-500"><MapPin size={14} /> {contact.address}</span>}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 bg-white border border-slate-100 hover:bg-slate-50 rounded-2xl transition-all shadow-sm">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-50/50 px-8 border-b border-slate-100">
                    {[
                        { id: 'overview', label: '360 Overview', icon: Activity },
                        { id: 'timeline', label: 'History & Logs', icon: History },
                        { id: 'preferences', label: 'Preferences', icon: Settings },
                        { id: 'documents', label: 'Documents', icon: FileText }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-5 border-b-4 transition-all text-xs font-black uppercase tracking-widest ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                            style={activeTab === tab.id ? { borderColor: brandColor, color: brandColor } : {}}
                        >
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-10 bg-white">
                    {activeTab === 'overview' && (
                        <div className="space-y-10 animate-in slide-in-from-bottom-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-4">Lifetime Revenue</p>
                                    <p className="text-4xl font-black tracking-tighter">₦{(relatedData.totalRevenue / 100).toLocaleString()}</p>
                                    <div className="mt-6 flex items-center gap-2 text-xs font-bold text-indigo-300">
                                        <TrendingUp size={16} /> Top 10% Clientele
                                    </div>
                                </div>
                                <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-4">Sentiment Score</p>
                                    <p className="text-4xl font-black text-slate-900 tracking-tighter">{(contact.sentimentScore * 100).toFixed(0)}%</p>
                                    <div className="w-full h-2 bg-emerald-200 rounded-full mt-6 overflow-hidden">
                                        <div className="h-full bg-emerald-600" style={{ width: `${contact.sentimentScore * 100}%` }}></div>
                                    </div>
                                </div>
                                <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 shadow-sm text-indigo-900">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4">Events Hosted</p>
                                    <p className="text-4xl font-black tracking-tighter">{relatedData.events.length}</p>
                                    <p className="mt-6 text-xs font-bold opacity-70">Latest: {relatedData.events[0]?.eventDate || 'None'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                        <MessageSquare size={20} className="text-indigo-600" /> Log Interaction
                                    </h3>
                                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                                        <div className="flex gap-4 mb-4">
                                            {['Note', 'Call', 'Email', 'Meeting'].map(type => (
                                                <button
                                                    key={type}
                                                    onClick={() => setNoteType(type as any)}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${noteType === type ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                                                    style={noteType === type ? { backgroundColor: brandColor } : {}}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                        <textarea
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            placeholder="Capture touchpoint details..."
                                            className="w-full h-32 bg-white border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 outline-none resize-none transition-all"
                                        />
                                        <button
                                            onClick={handleAddNote}
                                            className="w-full mt-4 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                                        >
                                            Commit to History
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                        <History size={20} className="text-indigo-600" /> Recent Activity
                                    </h3>
                                    <div className="space-y-4">
                                        {relatedData.timeline.slice(0, 4).map((item, idx) => (
                                            <div key={idx} className="flex gap-4 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                                    {item.type === 'Invoice' ? <FileText size={16} /> : item.type === 'Event' ? <Calendar size={16} /> : <MessageSquare size={16} />}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.date}</p>
                                                    <p className="text-xs font-bold text-slate-800">{item.summary}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'timeline' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4">
                            <div className="border-l-4 border-slate-100 ml-5 space-y-10 pb-10">
                                {relatedData.timeline.map((item, idx) => (
                                    <div key={idx} className="relative pl-12">
                                        <div className="absolute left-[-10px] top-0 w-4 h-4 rounded-full bg-white border-4 border-indigo-600 shadow-sm" style={{ borderColor: brandColor }}></div>
                                        <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 hover:shadow-xl transition-all group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${item.type === 'Invoice' ? 'bg-emerald-100 text-emerald-700' :
                                                            item.type === 'Event' ? 'bg-indigo-100 text-indigo-700' :
                                                                'bg-slate-200 text-slate-600'
                                                        }`}>
                                                        {item.type}
                                                    </span>
                                                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.15em]">{item.date}</p>
                                                </div>
                                                <button className="p-2 opacity-0 group-hover:opacity-100 transition-all bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-indigo-600">
                                                    <ExternalLink size={14} />
                                                </button>
                                            </div>
                                            <p className="text-sm font-bold text-slate-800 uppercase tracking-tight">{item.summary}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                        <div className="space-y-10 animate-in fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6 p-8 bg-slate-50 rounded-[3rem] border border-slate-200 shadow-inner">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Menu & Dietaries</h4>
                                    <div className="space-y-4">
                                        <label className="block">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Preferred Cuisines</span>
                                            <input
                                                className="w-full mt-2 bg-white border border-slate-200 rounded-xl p-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                                                placeholder="e.g., Nigerian, Continental"
                                                defaultValue={contact.preferences?.cuisines || ''}
                                                onBlur={(e) => updateContact(contactId, { preferences: { ...contact.preferences, cuisines: e.target.value } })}
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Allergies / Restrictions</span>
                                            <input
                                                className="w-full mt-2 bg-white border border-slate-200 rounded-xl p-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                                                placeholder="e.g., Nut Allergy, Vegan"
                                                defaultValue={contact.preferences?.allergies || ''}
                                                onBlur={(e) => updateContact(contactId, { preferences: { ...contact.preferences, allergies: e.target.value } })}
                                            />
                                        </label>
                                    </div>
                                </div>
                                <div className="space-y-6 p-8 bg-slate-50 rounded-[3rem] border border-slate-200 shadow-inner">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Service Preferences</h4>
                                    <div className="space-y-4">
                                        <label className="block">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Comms Channel</span>
                                            <select
                                                className="w-full mt-2 bg-white border border-slate-200 rounded-xl p-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                                                defaultValue={contact.preferences?.commsChannel || ''}
                                                onChange={(e) => updateContact(contactId, { preferences: { ...contact.preferences, commsChannel: e.target.value } })}
                                            >
                                                <option value="WhatsApp">WhatsApp</option>
                                                <option value="Email">Email</option>
                                                <option value="Phone Call">Phone Call</option>
                                            </select>
                                        </label>
                                        <label className="block">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Billing Cycle</span>
                                            <select
                                                className="w-full mt-2 bg-white border border-slate-200 rounded-xl p-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                                                defaultValue={contact.preferences?.billingCycle || ''}
                                                onChange={(e) => updateContact(contactId, { preferences: { ...contact.preferences, billingCycle: e.target.value } })}
                                            >
                                                <option value="Immediate">Immediate / Per Event</option>
                                                <option value="Monthly">Monthly Consolidated</option>
                                            </select>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'documents' && (
                        <div className="animate-in fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="p-8 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center hover:border-indigo-400 transition-all cursor-pointer bg-slate-50/30">
                                    <Plus size={32} className="text-slate-300 mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Add Documentation</p>
                                </div>
                                {contact.documentLinks?.map((doc, idx) => (
                                    <div key={idx} className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <Download size={16} className="text-slate-400 hover:text-indigo-600 cursor-pointer" />
                                        </div>
                                        <FileText size={32} className="text-indigo-600 mb-4" style={{ color: brandColor }} />
                                        <h5 className="text-sm font-black uppercase tracking-tight mb-1">{doc.name}</h5>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{doc.date}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Relationship Sync: {new Date().toLocaleTimeString()}</p>
                    </div>
                    <button onClick={onClose} className="px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
                        Exit View
                    </button>
                </div>
            </div>
        </div>
    );
};
