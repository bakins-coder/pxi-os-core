import React, { useState, useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { Requisition } from '../types';
import { RequisitionEditModal } from './RequisitionsHub';
import { CheckCircle2, Clock, XCircle, Edit3, X, AlertCircle } from 'lucide-react';

interface RequisitionTrackerProps {
    eventId: string;
}

export const RequisitionTracker: React.FC<RequisitionTrackerProps> = ({ eventId }) => {
    const requisitions = useDataStore(state => state.requisitions);
    // Filter requisitions for this specific event
    const eventRequisitions = useMemo(() =>
        requisitions.filter(r => r.referenceId === eventId),
        [requisitions, eventId]
    );

    const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
    const [editingReq, setEditingReq] = useState<Requisition | null>(null);

    // Further filter by active tab status
    const filteredReqs = useMemo(() => {
        if (activeTab === 'All') return eventRequisitions;
        if (activeTab === 'Approved') return eventRequisitions.filter(r => r.status === 'Approved' || r.status === 'Paid');
        return eventRequisitions.filter(r => r.status === activeTab);
    }, [eventRequisitions, activeTab]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved':
            case 'Paid': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
            case 'Rejected': return 'text-rose-500 bg-rose-50 border-rose-100';
            default: return 'text-amber-500 bg-amber-50 border-amber-100';
        }
    };

    return (
        <div className="space-y-6">
            {/* Tabs & Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Requisitions</h3>
                <div className="flex p-1 bg-slate-100 rounded-xl">
                    {['All', 'Approved', 'Pending', 'Rejected'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredReqs.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No requisitions found</p>
                    </div>
                ) : (
                    filteredReqs.map(req => (
                        <div key={req.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center hover:border-indigo-100 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getStatusColor(req.status)} transition-colors`}>
                                    {req.status === 'Paid' || req.status === 'Approved' ? <CheckCircle2 size={18} /> :
                                        req.status === 'Rejected' ? <XCircle size={18} /> : <Clock size={18} />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-900 transition-colors">{req.itemName}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                            ₦{(req.totalAmountCents / 100).toLocaleString()}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">•</span>
                                        {req.notes && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[150px]">{req.notes}</span>}
                                    </div>
                                    {req.status === 'Rejected' && (
                                        <p className="text-[10px] font-medium text-rose-500 mt-1 flex items-center gap-1">
                                            <AlertCircle size={10} /> Rejected
                                        </p>
                                    )}
                                </div>
                            </div>

                            {req.status === 'Rejected' && (
                                <button
                                    onClick={() => setEditingReq(req)}
                                    className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <Edit3 size={14} /> Fix
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Reuse RequisitionEditModal from RequisitionsHub */}
            {editingReq && (
                <RequisitionEditModal
                    isOpen={!!editingReq}
                    onClose={() => setEditingReq(null)}
                    requisition={editingReq}
                />
            )}
        </div>
    );
};
