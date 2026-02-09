import React, { useState } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import { Requisition } from '../types';
import {
    ClipboardList, CheckCircle2, XCircle, Clock,
    Search, Filter, ChevronRight, Edit3,
    Check, X, Box, Info
} from 'lucide-react';

// Reusing and adapting RequisitionEditModal logic
const RequisitionEditModal = ({ isOpen, onClose, requisition }: { isOpen: boolean, onClose: () => void, requisition: Requisition | null }) => {
    const { updateRequisition, approveRequisition, rejectRequisition } = useDataStore();

    const [editedReq, setEditedReq] = useState<Partial<Requisition>>({});

    React.useEffect(() => {
        if (requisition) setEditedReq(requisition);
    }, [requisition]);

    if (!isOpen || !requisition) return null;

    const handleApprove = () => {
        approveRequisition(requisition.id);
        onClose();
    };

    const handleReject = () => {
        rejectRequisition(requisition.id);
        onClose();
    };

    const handleSave = () => {
        updateRequisition(requisition.id, editedReq);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#020617]/90 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-indigo-500/10 to-transparent">
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Review Requisition</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Ref: {requisition.id.slice(0, 8)}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
                </div>

                <div className="p-8 space-y-6 text-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Item Name</label>
                            <input
                                type="text"
                                value={editedReq.itemName || ''}
                                onChange={e => setEditedReq({ ...editedReq, itemName: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</label>
                            <select
                                value={editedReq.category}
                                onChange={e => setEditedReq({ ...editedReq, category: e.target.value as any })}
                                className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                            >
                                <option value="Food">Food & Beverage</option>
                                <option value="Hardware">Hardware / Equipment</option>
                                <option value="Service">Services / Freelance</option>
                                <option value="Financial">Financial / Operational</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quantity</label>
                            <input
                                type="number"
                                value={editedReq.quantity || 0}
                                onChange={e => setEditedReq({ ...editedReq, quantity: Number(e.target.value), totalAmountCents: (editedReq.pricePerUnitCents || 0) * Number(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Price per Unit (Cents)</label>
                            <input
                                type="number"
                                value={editedReq.pricePerUnitCents || 0}
                                onChange={e => setEditedReq({ ...editedReq, pricePerUnitCents: Number(e.target.value), totalAmountCents: (editedReq.quantity || 0) * Number(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Internal Notes</label>
                        <textarea
                            value={editedReq.notes || ''}
                            onChange={e => setEditedReq({ ...editedReq, notes: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm h-24 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                            placeholder="Provide reason for this request or specific details..."
                        />
                    </div>

                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-center justify-between">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Projected Total Cost</span>
                        <span className="text-xl font-black text-white">₦{((editedReq.totalAmountCents || 0) / 100).toLocaleString()}</span>
                    </div>
                </div>

                <div className="p-8 bg-[#020617]/50 flex flex-col sm:flex-row gap-4">
                    <button onClick={handleReject} className="flex-1 px-6 py-4 rounded-2xl border-2 border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
                        <XCircle size={16} /> Deny Request
                    </button>
                    <button onClick={handleSave} className="flex-1 px-6 py-4 rounded-2xl border-2 border-white/10 text-slate-400 hover:border-indigo-500 hover:text-indigo-400 font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
                        <Edit3 size={16} /> Save Changes
                    </button>
                    <button onClick={handleApprove} className="sm:flex-[1.5] px-8 py-4 rounded-2xl bg-[#00ff9d] text-slate-950 font-black uppercase text-[10px] tracking-widest transition-all hover:shadow-[0_0_30px_rgba(0,255,157,0.3)] active:scale-95 flex items-center justify-center gap-2">
                        <CheckCircle2 size={16} /> Approve Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export const RequisitionsHub: React.FC = () => {
    const { requisitions } = useDataStore();
    const [activeTab, setActiveTab] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('All');
    const [selectedReq, setSelectedReq] = useState<Requisition | null>(null);

    const filteredRequisitions = requisitions.filter(r => {
        // Show Paid as well in Approved tab for overview
        if (r.status !== activeTab && !(activeTab === 'Approved' && r.status === 'Paid')) return false;
        const matchesSearch = r.itemName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || r.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const stats = {
        pending: requisitions.filter(r => r.status === 'Pending').length,
        approved: requisitions.filter(r => r.status === 'Approved' || r.status === 'Paid').length,
        rejected: requisitions.filter(r => r.status === 'Rejected').length,
        totalVolume: requisitions.reduce((acc, curr) => acc + (curr.totalAmountCents || 0), 0) / 100
    };

    return (
        <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                            <ClipboardList className="text-indigo-400" size={24} />
                        </div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Requisitions Hub</h1>
                    </div>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] max-w-md">MD Strategic Oversight: Unified spending control and operational approval gateway.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 min-w-[140px]">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Pending Approval</p>
                        <p className="text-xl font-black text-amber-400">{stats.pending}</p>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 min-w-[140px]">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Processed</p>
                        <p className="text-xl font-black text-emerald-400">{stats.approved}</p>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 min-w-[140px]">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Rejected</p>
                        <p className="text-xl font-black text-rose-400">{stats.rejected}</p>
                    </div>
                    <div className="bg-[#00ff9d] rounded-2xl p-4 min-w-[140px] shadow-[0_0_20px_rgba(0,255,157,0.1)]">
                        <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-1">Total Volume</p>
                        <p className="text-xl font-black text-slate-950">₦{stats.totalVolume.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Tabs and Filters */}
            <div className="bg-[#0f172a] rounded-[2rem] border border-white/5 p-6 md:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none"></div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
                    <div className="flex bg-[#020617] p-1.5 rounded-2xl border border-white/5 self-start">
                        {(['Pending', 'Approved', 'Rejected'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                    : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                            >
                                {tab} {tab === 'Pending' && stats.pending > 0 && <span className="ml-1 bg-white/10 px-1.5 rounded-md text-slate-300">{stats.pending}</span>}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative group w-full sm:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search requisitions..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-[#020617] border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-[10px] font-bold text-white uppercase tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700"
                            />
                        </div>

                        <div className="flex items-center gap-2 bg-[#020617] border border-white/10 rounded-2xl px-4 py-3 w-full sm:w-auto">
                            <Filter size={14} className="text-slate-500" />
                            <select
                                value={filterCategory}
                                onChange={e => setFilterCategory(e.target.value)}
                                className="bg-transparent border-none text-[10px] font-black text-slate-400 uppercase tracking-widest outline-none cursor-pointer min-w-[100px]"
                            >
                                <option value="All">All Categories</option>
                                <option value="Food">Food</option>
                                <option value="Hardware">Hardware</option>
                                <option value="Service">Service</option>
                                <option value="Financial">Financial</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Requisition List */}
                <div className="space-y-4">
                    {filteredRequisitions.length > 0 ? (
                        filteredRequisitions.map(req => (
                            <div
                                key={req.id}
                                onClick={() => setSelectedReq(req)}
                                className="group flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl bg-[#020617]/50 border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all cursor-pointer relative overflow-hidden"
                            >
                                {/* Status Indicator Bar */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${req.status === 'Pending' ? 'bg-amber-500' :
                                        (req.status === 'Approved' || req.status === 'Paid') ? 'bg-emerald-500' :
                                            'bg-rose-500'}`}
                                />

                                <div className="flex items-center gap-6 mb-4 md:mb-0">
                                    <div className={`p-4 rounded-2xl shrink-0 ${req.category === 'Food' ? 'bg-orange-500/10 text-orange-400' :
                                            req.category === 'Hardware' ? 'bg-blue-500/10 text-blue-400' :
                                                req.category === 'Service' ? 'bg-purple-500/10 text-purple-400' :
                                                    'bg-emerald-500/10 text-emerald-400'
                                        }`}>
                                        <Box size={20} />
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors mb-1">{req.itemName}</h3>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                                <Clock size={10} /> {req.id.slice(0, 8)}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{req.category}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Qty: {req.quantity}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-10">
                                    <div className="text-right">
                                        <p className="text-xl font-black text-white leading-none mb-1">₦{(req.totalAmountCents / 100).toLocaleString()}</p>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">₦{(req.pricePerUnitCents / 100).toLocaleString()} / unit</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {req.status === 'Pending' && (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); useDataStore.getState().rejectRequisition(req.id); }}
                                                    className="p-3 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                                                    title="Quick Reject"
                                                >
                                                    <X size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); useDataStore.getState().approveRequisition(req.id); }}
                                                    className="p-3 rounded-xl bg-[#00ff9d] text-slate-950 font-black shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                                                    title="Quick Approve"
                                                >
                                                    <Check size={16} />
                                                </button>
                                            </>
                                        )}
                                        <div className="p-3 text-slate-700 group-hover:text-slate-400 transition-colors">
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
                            <div className="p-6 bg-white/5 rounded-full mb-4">
                                <Info size={32} className="text-slate-600" />
                            </div>
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">No Requisitions Found</h3>
                            <p className="text-[10px] text-slate-600 uppercase font-bold tracking-tighter mt-2">The operational ledger is clear for this filter selection.</p>
                        </div>
                    )}
                </div>
            </div>

            {selectedReq && (
                <RequisitionEditModal
                    isOpen={!!selectedReq}
                    onClose={() => setSelectedReq(null)}
                    requisition={selectedReq}
                />
            )}
        </div>
    );
};

export default RequisitionsHub;
