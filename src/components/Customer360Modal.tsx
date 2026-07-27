
import React, { useState, useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Contact, InteractionLog, CateringEvent, Invoice, Task } from '../types';
import {
    X, User, Building, Phone, Mail, MapPin,
    Calendar, FileText, Settings, History,
    Plus, MessageSquare, Clock, TrendingUp,
    Download, ExternalLink, Activity, Banknote, Paperclip,
    Loader2
} from 'lucide-react';
import { uploadEntityDocument, saveEntityMedia, supabase } from '../services/supabase';
import { InvoiceStatus } from '../types';
import { useRef } from 'react';
import { NAIRA_SYMBOL } from '../utils/finance';

interface Customer360ModalProps {
    contactId: string;
    onClose: () => void;
}

export const Customer360Modal: React.FC<Customer360ModalProps> = ({ contactId, onClose }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'preferences' | 'documents'>('overview');
    const { contacts, interactionLogs, cateringEvents, invoices, tasks, messages, entityMedia, updateContact, addInteractionLog } = useDataStore();
    const { settings } = useSettingsStore();
    const brandColor = settings.brandColor || '#4f46e5';
    const orgId = settings.id || '';

    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const contact = useMemo(() => contacts.find(c => c.id === contactId), [contacts, contactId]);

    const relatedData = useMemo(() => {
        if (!contact) return null;

        const customerEvents = cateringEvents.filter(e =>
            e.contactId === contactId || (e.customerName && e.customerName.toLowerCase() === (contact.name || '').toLowerCase())
        );
        const customerInvoices = invoices.filter(i => i.contactId === contactId);
        const customerLogs = interactionLogs.filter(l => l.contactId === contactId);
        const customerMessages = messages.filter(m => m.senderId === contactId || m.recipientId === contactId);
        const customerAttachments = entityMedia.filter(m => m.entityId === contactId);

        // Combine for timeline
        const timeline = [
            ...customerEvents.map(e => ({ type: 'Event', date: e.eventDate, summary: `Event: ${e.status}`, id: e.id })),
            ...customerInvoices.map(i => ({ type: 'Invoice', date: i.date, summary: `Invoice #${i.number} - ${NAIRA_SYMBOL}${(i.totalCents / 100).toLocaleString()}`, id: i.id })),
            ...customerLogs.map(l => ({ type: l.type, date: l.createdAt, summary: l.summary, id: l.id })),
            ...customerMessages.map(m => ({ type: 'Message', date: new Date().toISOString(), summary: `Message: ${m.content.substring(0, 30)}...`, id: m.id }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const totalRevenue = customerInvoices.reduce((sum, i) => sum + i.totalCents, 0);

        return {
            events: customerEvents,
            invoices: customerInvoices,
            logs: customerLogs,
            messages: customerMessages,
            attachments: customerAttachments,
            timeline,
            totalRevenue
        };
    }, [contact, cateringEvents, invoices, interactionLogs, messages, entityMedia, contactId]);

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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !orgId) return;

        try {
            setIsUploading(true);
            const { bucket, path } = await uploadEntityDocument(orgId, 'contact', contactId, file);

            await saveEntityMedia({
                entity_type: 'contact',
                entity_id: contactId,
                organization_id: orgId,
                bucket,
                object_path: path,
                is_primary: false
            });

            // Trigger data refresh
            useDataStore.getState().hydrateFromCloud();
        } catch (err) {
            console.error('File upload failed:', err);
            alert('Failed to upload file. Please try again.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleInvoiceClick = (invoiceId: string) => {
        window.open(`#/invoice/${invoiceId}`, '_blank');
    };

    const handleAttachmentClick = (bucket: string, path: string) => {
        if (!supabase) return;
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        if (data?.publicUrl) {
            window.open(data.publicUrl, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 md:p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col border border-slate-200 h-[92vh]">
                {/* Header */}
                <div className="p-3 md:p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-100 rounded-2xl flex items-center justify-center shadow-inner border border-white shrink-0">
                            {contact.type === 'Individual' ? <User size={26} className="text-slate-400" /> : <Building size={26} className="text-slate-400" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">{contact.name}</h2>
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                                    {contact.category}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-3 mt-1.5 text-[10px] md:text-xs">
                                <span className="flex items-center gap-1.5 font-bold text-slate-500"><Phone size={12} /> {contact.phone}</span>
                                <span className="flex items-center gap-1.5 font-bold text-slate-500"><Mail size={12} /> {contact.email}</span>
                                {contact.address && <span className="flex items-center gap-1.5 font-bold text-slate-500"><MapPin size={12} /> {contact.address}</span>}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white border border-slate-100 hover:bg-slate-50 rounded-xl transition-all shadow-sm">
                        <X size={18} className="text-slate-400" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-50/50 px-4 md:px-6 border-b border-slate-100 shrink-0">
                    {[
                        { id: 'overview', label: '360 Overview', icon: Activity },
                        { id: 'timeline', label: 'History & Logs', icon: History },
                        { id: 'preferences', label: 'Preferences', icon: Settings },
                        { id: 'documents', label: 'Documents', icon: FileText }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-1.5 px-3 md:px-4 py-2 border-b-2 transition-all text-[10px] md:text-xs font-black uppercase tracking-widest ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                            style={activeTab === tab.id ? { borderColor: brandColor, color: brandColor } : {}}
                        >
                            <tab.icon size={14} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-3 md:p-5 bg-white">
                    {activeTab === 'overview' && (
                        <div className="space-y-3 md:space-y-4 animate-in slide-in-from-bottom-4">
                            {/* KPI Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                                <div className="p-3 bg-slate-900 rounded-xl text-white shadow-md relative overflow-hidden flex flex-col justify-between h-[72px] md:h-[78px]">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl"></div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-indigo-300">Lifetime Revenue</p>
                                    <h3 className="text-base md:text-lg font-black tracking-tight leading-none">{NAIRA_SYMBOL}{(relatedData.totalRevenue / 100).toLocaleString()}</h3>
                                    <span className="text-[8px] font-bold text-indigo-300 flex items-center gap-1"><TrendingUp size={10} /> Top 10% Clientele</span>
                                </div>
                                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm flex flex-col justify-between h-[72px] md:h-[78px]">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-emerald-700">Sentiment Score</p>
                                    <h3 className="text-base md:text-lg font-black text-slate-900 tracking-tight leading-none">
                                        {((typeof contact.sentimentScore === 'number' && !isNaN(contact.sentimentScore)) ? contact.sentimentScore : 0.85) * 100}%
                                    </h3>
                                    <div className="w-full h-1 bg-emerald-200 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-emerald-600 rounded-full" 
                                            style={{ width: `${((typeof contact.sentimentScore === 'number' && !isNaN(contact.sentimentScore)) ? contact.sentimentScore : 0.85) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm text-indigo-900 flex flex-col justify-between h-[72px] md:h-[78px]">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-indigo-700">Events Hosted</p>
                                    <h3 className="text-base md:text-lg font-black tracking-tight leading-none">{relatedData.events.length}</h3>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase truncate">Latest: {relatedData.events[0]?.eventDate || 'None'}</p>
                                </div>
                            </div>

                            {/* 3-Column Detailed Overview */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
                                {/* Column 1: Log Interaction */}
                                <div className="space-y-2">
                                    <h4 className="text-[10px] md:text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                        <MessageSquare size={12} className="text-indigo-600" /> Log Interaction
                                    </h4>
                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
                                        <div className="flex gap-1.5 flex-wrap">
                                            {['Note', 'Call', 'Email', 'Meeting'].map(type => (
                                                <button
                                                    key={type}
                                                    onClick={() => setNoteType(type as any)}
                                                    className={`px-2 py-1 rounded-md text-[7px] md:text-[8px] font-black uppercase tracking-widest transition-all ${noteType === type ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
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
                                            className="w-full h-16 md:h-20 bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500/10 outline-none resize-none transition-all shadow-inner"
                                        />
                                        <button
                                            onClick={handleAddNote}
                                            className="w-full py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest shadow active:scale-95 transition-all"
                                        >
                                            Commit to History
                                        </button>
                                    </div>
                                </div>

                                {/* Column 2: Recent Activity Timeline */}
                                <div className="space-y-2">
                                    <h4 className="text-[10px] md:text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                        <History size={12} className="text-indigo-600" /> Recent Activity
                                    </h4>
                                    <div className="space-y-1.5 max-h-[170px] overflow-y-auto pr-1 scrollbar-thin">
                                        {relatedData.timeline.slice(0, 5).map((item, idx) => (
                                            <div key={idx} className="flex gap-2 p-2 border border-slate-100 rounded-lg hover:bg-slate-50 transition-all bg-white shadow-sm">
                                                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                                    {item.type === 'Invoice' ? <FileText size={12} /> : item.type === 'Event' ? <Calendar size={12} /> : <MessageSquare size={12} />}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">{item.date}</p>
                                                    <p className="text-[10px] font-bold text-slate-700 truncate leading-tight uppercase">{item.summary}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {relatedData.timeline.length === 0 && (
                                            <p className="text-[9px] text-slate-400 text-center py-4">No recent activity logs.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Column 3: Profile & Preferences Summary */}
                                <div className="space-y-2">
                                    <h4 className="text-[10px] md:text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                        <User size={12} className="text-indigo-600" /> Profile & Preferences
                                    </h4>
                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                                        <div>
                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Preferred Cuisines</p>
                                            <p className="font-bold text-slate-800 uppercase text-[10px] md:text-xs">{contact.preferences?.cuisines || 'None specified'}</p>
                                        </div>
                                        <div className="h-px bg-slate-200"></div>
                                        <div>
                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Allergies & Restrictions</p>
                                            <p className="font-black text-rose-500 uppercase text-[10px] md:text-xs">{contact.preferences?.allergies || 'No known allergies'}</p>
                                        </div>
                                        <div className="h-px bg-slate-200"></div>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            <div>
                                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Comms Channel</p>
                                                <span className="inline-block px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded text-[8px] font-black uppercase tracking-widest">{contact.preferences?.commsChannel || 'Email'}</span>
                                            </div>
                                            <div>
                                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Billing Cycle</p>
                                                <span className="inline-block px-1.5 py-0.5 bg-slate-200 border border-slate-300 text-slate-700 rounded text-[8px] font-black uppercase tracking-widest">{contact.preferences?.billingCycle || 'Immediate'}</span>
                                            </div>
                                        </div>
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
                        <div className="space-y-12 animate-in fade-in">
                            {/* Invoices Section */}
                            <section>
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                        <Banknote size={20} className="text-emerald-500" /> Financial Documents
                                    </h4>
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                        {relatedData.invoices.length} Records
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {relatedData.invoices.map((inv, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handleInvoiceClick(inv.id)}
                                            className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group border-l-4 border-l-emerald-500 cursor-pointer active:scale-95"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <FileText size={24} className="text-emerald-500" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{inv.date}</span>
                                            </div>
                                            <h5 className="text-sm font-black uppercase tracking-tight mb-1">Invoice #{inv.number}</h5>
                                            <p className="text-lg font-black text-slate-900 mb-2">{NAIRA_SYMBOL}{(inv.totalCents / 100).toLocaleString()}</p>
                                            <div className="flex justify-between items-center">
                                                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${inv.status === InvoiceStatus.PAID ? 'bg-emerald-100 text-emerald-700' :
                                                    inv.status === InvoiceStatus.PROFORMA ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {inv.status}
                                                </span>
                                                <ExternalLink size={14} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                                            </div>
                                        </div>
                                    ))}
                                    {relatedData.invoices.length === 0 && (
                                        <div className="col-span-full py-10 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                                            <Banknote size={32} className="mb-2 opacity-20" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">No financial records found</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Communication Section */}
                            <section>
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                        <MessageSquare size={20} className="text-indigo-500" /> Communication History
                                    </h4>
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                                        {relatedData.messages.length} Messages
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    {relatedData.messages.slice(0, 5).map((msg, idx) => (
                                        <div key={idx} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:bg-white hover:shadow-lg transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${msg.senderId === contactId ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                    {msg.senderId === contactId ? 'Inbound' : 'Outbound'}
                                                </span>
                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                                    {new Date().toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-800 leading-relaxed">{msg.content}</p>
                                        </div>
                                    ))}
                                    {relatedData.messages.length === 0 && (
                                        <div className="py-10 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                                            <MessageSquare size={32} className="mb-2 opacity-20" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">No message history available</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Media Section */}
                            <section>
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                        <Paperclip size={20} className="text-amber-500" /> Media & Attachments
                                    </h4>
                                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
                                        {relatedData.attachments.length} Files
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`p-8 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center hover:border-indigo-400 transition-all cursor-pointer bg-slate-50/30 group ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                                    >
                                        {isUploading ? (
                                            <Loader2 size={32} className="text-indigo-500 animate-spin mb-2" />
                                        ) : (
                                            <Plus size={32} className="text-slate-300 mb-2 group-hover:text-indigo-500 transition-colors" />
                                        )}
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">
                                            {isUploading ? 'Uploading...' : 'Upload New'}
                                        </p>
                                    </div>
                                    {relatedData.attachments.map((doc, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handleAttachmentClick(doc.bucket, doc.objectPath)}
                                            className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group relative overflow-hidden cursor-pointer active:scale-95"
                                        >
                                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all flex gap-2">
                                                <Download size={16} className="text-slate-400 hover:text-indigo-600" />
                                                <ExternalLink size={16} className="text-slate-400 hover:text-indigo-600" />
                                            </div>
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                                                <FileText size={24} className="text-slate-400" />
                                            </div>
                                            <h5 className="text-sm font-black uppercase tracking-tight mb-1 truncate pr-8">{doc.objectPath.split('/').pop()}</h5>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{doc.bucket}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-2.5 md:p-3 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-400" />
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last Relationship Sync: {new Date().toLocaleTimeString()}</p>
                    </div>
                    <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md hover:scale-105 active:scale-95 transition-all">
                        Exit View
                    </button>
                </div>
            </div>
        </div>
    );
};
