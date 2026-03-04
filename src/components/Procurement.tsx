import React, { useState } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import { Requisition } from '../types';
import { ShoppingCart, Plus, CheckCircle2, Clock, Info, Box, Trash2, Send } from 'lucide-react';

export const Procurement: React.FC = () => {
    const { requisitions, addRequisitionsBulk } = useDataStore();
    const { user } = useAuthStore();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [draftRequests, setDraftRequests] = useState<Partial<Requisition>[]>([]);

    const [formData, setFormData] = useState({
        itemName: '',
        category: 'Food' as 'Food' | 'Hardware' | 'Service' | 'Financial',
        quantity: 1,
        pricePerUnit: 0,
        notes: ''
    });

    const myRequisitions = requisitions
        .filter(r => r.requestorId === user?.id)
        .sort((a, b) => b.id.localeCompare(a.id));

    const handleAddToList = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !formData.itemName || formData.quantity <= 0) return;

        const newDraft: Partial<Requisition> = {
            id: `draft-${Date.now()}`,
            type: 'Purchase',
            category: formData.category,
            itemName: formData.itemName,
            quantity: formData.quantity,
            pricePerUnitCents: formData.pricePerUnit * 100,
            totalAmountCents: formData.quantity * (formData.pricePerUnit * 100),
            requestorId: user.id,
            status: 'Pending',
            notes: formData.notes,
        };

        setDraftRequests([...draftRequests, newDraft]);
        setFormData({
            itemName: '',
            category: formData.category, // preserve category context
            quantity: 1,
            pricePerUnit: 0,
            notes: ''
        });
    };

    const handleRemoveFromList = (id: string) => {
        setDraftRequests(draftRequests.filter(req => req.id !== id));
    };

    const handleSubmitBatch = async () => {
        if (!user || draftRequests.length === 0) return;
        setIsSubmitting(true);

        const newReqs = draftRequests.map((draft, idx) => ({
            ...draft,
            id: `REQ-${Date.now()}-${idx}`
        }));

        setTimeout(() => {
            addRequisitionsBulk(newReqs);
            setIsSubmitting(false);
            setSuccessMessage(`Successfully submitted ${newReqs.length} request(s) to MD!`);
            setDraftRequests([]);

            setTimeout(() => setSuccessMessage(''), 4000);
        }, 800);
    };

    const batchTotalCents = draftRequests.reduce((sum, req) => sum + (req.totalAmountCents || 0), 0);

    return (
        <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                        <ShoppingCart className="text-indigo-400" size={24} />
                    </div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Procurement</h1>
                </div>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] max-w-xl">
                    Draft multiple purchase requests and submit them as a single batch to the MD's Requisitions Hub for approval.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 gap-y-12">
                {/* Form Section (Left Column) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-[#0f172a] rounded-[2rem] border border-white/5 p-6 md:p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none"></div>

                        <h2 className="text-lg font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                            <Plus size={18} className="text-indigo-400" /> New Item
                        </h2>

                        <form onSubmit={handleAddToList} className="space-y-5 relative z-10">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Item Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.itemName}
                                    onChange={e => setFormData({ ...formData, itemName: e.target.value })}
                                    placeholder="e.g. Tomatoes (Basket)"
                                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                        className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                    >
                                        <option value="Food">Food / Raw Material</option>
                                        <option value="Hardware">Hardware / Equipment</option>
                                        <option value="Service">Service</option>
                                        <option value="Financial">Financial / Fees</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Est. Unit Price (₦)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.pricePerUnit || ''}
                                        onChange={e => setFormData({ ...formData, pricePerUnit: parseFloat(e.target.value) || 0 })}
                                        placeholder="0.00"
                                        className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quantity Required</label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={formData.quantity || ''}
                                    onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Justification / Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Explain why this is needed..."
                                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none h-24 placeholder:text-slate-600"
                                />
                            </div>

                            <div className="pt-4 mt-6 border-t border-white/5">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Item Est. Total</span>
                                    <span className="text-lg font-black text-white">₦{(formData.quantity * formData.pricePerUnit).toLocaleString()}</span>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!formData.itemName || formData.quantity <= 0}
                                    className={`w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-2
                                        ${!formData.itemName || formData.quantity <= 0
                                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                            : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                                        }`}
                                >
                                    <Plus size={14} /> Add to Draft Batch
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Drafts & History Section (Right Column) */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Pending Batch Card */}
                    <div className="bg-[#0f172a] rounded-[2rem] border border-indigo-500/20 p-6 md:p-8 shadow-[0_0_50px_rgba(79,70,229,0.1)] relative overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                                    <Send size={18} className="text-indigo-400" /> Current Draft Batch
                                </h2>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Review items before submitting to MD</p>
                            </div>
                            <div className="text-right">
                                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Batch Total</span>
                                <span className="text-xl font-black text-[#00ff9d]">₦{batchTotalCents.toLocaleString()}</span>
                            </div>
                        </div>

                        {successMessage && (
                            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                                <p className="text-xs font-bold text-emerald-300">{successMessage}</p>
                            </div>
                        )}

                        {draftRequests.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 py-10 border-2 border-dashed border-white/5 rounded-2xl">
                                <div className="p-4 bg-white/5 rounded-full mb-3">
                                    <ShoppingCart size={24} className="text-slate-600" />
                                </div>
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">No Drafts Yet</h3>
                                <p className="text-[10px] text-slate-600 uppercase font-bold tracking-tighter mt-2 max-w-xs">
                                    Add items using the form to build your procurement batch.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[300px]">
                                {draftRequests.map((req, idx) => (
                                    <div key={req.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-[#020617]/50 border border-white/5 hover:border-indigo-500/30 transition-all animate-in slide-in-from-left-2 group">
                                        <div className="flex items-start md:items-center gap-4">
                                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/5 text-[9px] font-black text-slate-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors shrink-0">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-white uppercase tracking-tight">{req.itemName}</h4>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">{req.category}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Qty: {req.quantity}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                        ₦{((Number(req.pricePerUnitCents) || 0) / 100).toLocaleString()} ea
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between md:justify-end gap-6 mt-3 md:mt-0 pl-10 md:pl-0 w-full md:w-auto">
                                            <div className="text-left md:text-right">
                                                <p className="text-base font-black text-white leading-none">
                                                    ₦{((Number(req.totalAmountCents) || 0) / 100).toLocaleString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveFromList(req.id!)}
                                                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                                                title="Remove Item"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="pt-6 mt-6 border-t border-white/5">
                            <button
                                onClick={handleSubmitBatch}
                                disabled={isSubmitting || draftRequests.length === 0}
                                className={`w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-2
                                    ${isSubmitting || draftRequests.length === 0
                                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]'
                                    }`}
                            >
                                {isSubmitting ? (
                                    'Submitting Batch to MD...'
                                ) : (
                                    <>
                                        <Send size={14} /> Submit {draftRequests.length > 0 ? draftRequests.length : ''} Request(s) to MD
                                    </>
                                )}
                            </button>
                        </div>
                    </div>


                    {/* My Requisitions History Card */}
                    <div className="bg-[#0f172a] rounded-[2rem] border border-white/5 p-6 md:p-8 shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                                <Clock size={18} className="text-slate-400" /> Past Submissions
                            </h2>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Pending
                                <span className="w-2 h-2 rounded-full bg-emerald-500 ml-3"></span> Approved
                            </div>
                        </div>

                        {myRequisitions.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 py-10">
                                <div className="p-6 bg-white/5 rounded-full mb-4">
                                    <Info size={32} className="text-slate-600" />
                                </div>
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">No Past Requests</h3>
                            </div>
                        ) : (
                            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[400px]">
                                {myRequisitions.map(req => (
                                    <div
                                        key={req.id}
                                        className="group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl bg-[#020617]/50 border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all relative overflow-hidden"
                                    >
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${req.status === 'Pending' ? 'bg-amber-500' :
                                            (req.status === 'Approved' || req.status === 'Paid') ? 'bg-emerald-500' :
                                                'bg-rose-500'}`}
                                        />

                                        <div className="flex items-start md:items-center gap-5">
                                            <div className={`p-3 rounded-xl shrink-0 mt-1 md:mt-0 ${req.category === 'Food' ? 'bg-orange-500/10 text-orange-400' :
                                                req.category === 'Hardware' ? 'bg-blue-500/10 text-blue-400' :
                                                    req.category === 'Service' ? 'bg-purple-500/10 text-purple-400' :
                                                        'bg-emerald-500/10 text-emerald-400'
                                                }`}>
                                                <Box size={20} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h4 className="text-sm font-black text-white uppercase tracking-tight">{req.itemName}</h4>
                                                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${req.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                        (req.status === 'Approved' || req.status === 'Paid') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                        }`}>
                                                        {req.status}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{req.id.slice(0, 12)}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                                    <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">{req.category}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Qty: {req.quantity}</span>
                                                    {req.notes && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                                            <span className="text-[9px] font-medium text-slate-500 truncate max-w-[120px]">{req.notes}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-left md:text-right mt-4 md:mt-0 pl-[60px] md:pl-0">
                                            <p className="text-lg font-black text-white leading-none mb-1">
                                                ₦{((Number(req.totalAmountCents) || 0) / 100).toLocaleString()}
                                            </p>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                                Est: ₦{((Number(req.pricePerUnitCents) || 0) / 100).toLocaleString()} / unit
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Procurement;
