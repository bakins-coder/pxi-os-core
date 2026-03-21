import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useDataStore } from '../store/useDataStore';
import { Camera, FileText, Lock, User, CheckCircle, AlertTriangle, Menu, ChevronRight, Loader2 } from 'lucide-react';

export const ExternalMonitor: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const { cateringEvents, markSeatServed, markTableServed, updateTableCapacity, assignWaiterToTable, logLeftover, addHandoverEvidence, hydrateFromCloud } = useDataStore();

    // 1. Find event by token
    const selectedEvent = cateringEvents.find(e => e.portionMonitor?.waiterAccessToken === token);
    const selectedEventId = selectedEvent?.id;

    // 2. Hydrate data on mount
    useEffect(() => {
        hydrateFromCloud();
    }, []);

    // 3. Computed Aggregates
    const itemCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        if (!selectedEvent?.portionMonitor?.tables) return counts;
        selectedEvent.portionMonitor?.tables?.forEach((t: any) => {
            t.seats?.forEach((s: any) => {
                s.servedItems?.forEach((i: any) => {
                    counts[i.itemId] = (counts[i.itemId] || 0) + i.quantity;
                });
            });
        });
        return counts;
    }, [selectedEvent]);

    const totalGuests = selectedEvent?.portionMonitor?.tables.reduce((sum: number, t: any) => sum + t.assignedGuests, 0) || 0;
    const servedGuests = selectedEvent?.portionMonitor?.tables.reduce((sum: number, t: any) => {
        const tableServedCount = t.seats?.filter((s: any) => s.servingCount > 0).length || 0;
        return sum + tableServedCount;
    }, 0) || 0;
    const progress = totalGuests > 0 ? (servedGuests / totalGuests) * 100 : 0;

    // 4. Action & Modal State
    const [activeItemId, setActiveItemId] = useState<string>('');
    const [selectedSeat, setSelectedSeat] = useState<{ tableId: string; seatId: string; data: any } | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Leftover Modal Inputs
    const [showLeftoverModal, setShowLeftoverModal] = useState(false);
    const [leftoverItem, setLeftoverItem] = useState('');
    const [leftoverQty, setLeftoverQty] = useState(0);
    const [leftoverReason, setLeftoverReason] = useState('Excess Prep');

    // Evidence Modal Inputs
    const [showHandoverModal, setShowHandoverModal] = useState(false);
    const [evidenceNote, setEvidenceNote] = useState('');
    const [evidenceFile, setEvidenceFile] = useState<string | null>(null);

    // 5. Effects
    useEffect(() => {
        if (selectedEvent?.items?.length && !activeItemId) {
            setActiveItemId(selectedEvent.items[0].inventoryItemId);
        }
    }, [selectedEvent, activeItemId]);

    if (!selectedEvent) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 md:p-10">
                <div className="relative w-24 h-24 mb-8">
                    <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-rose-500 animate-spin"></div>
                    <div className="absolute inset-4 flex items-center justify-center">
                        <AlertTriangle size={32} className="text-rose-500/40" />
                    </div>
                </div>
                <h1 className="text-2xl font-black uppercase tracking-tighter mb-4">Invalid Monitor Link</h1>
                <p className="text-slate-500 text-center max-w-md font-bold uppercase text-[10px] tracking-widest leading-relaxed">
                    The access token provided is invalid or has expired. Please request a new link from the event supervisor.
                </p>
            </div>
        );
    }

    // Handlers
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setEvidenceFile(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const submitEvidence = () => {
        if (selectedEventId && evidenceFile) {
            addHandoverEvidence(selectedEventId, evidenceFile, evidenceNote);
            setEvidenceFile(null);
            setEvidenceNote('');
            setShowHandoverModal(false);
        }
    };

    const submitLeftover = () => {
        if (selectedEventId && leftoverItem && leftoverQty > 0) {
            logLeftover(selectedEventId, leftoverItem, leftoverQty, leftoverReason);
            setShowLeftoverModal(false);
            setLeftoverItem('');
            setLeftoverQty(0);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden relative">
            {/* Header */}
            <div className="bg-white border-b px-4 py-3 shadow-sm z-10 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-tighter rounded">External Access</span>
                            <span className="text-[10px] text-gray-400 font-medium">Waiters & Supervisors</span>
                        </div>
                        <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate max-w-[200px] md:max-w-none">{selectedEvent.customerName}</h1>
                        <p className="text-xs text-gray-500 md:hidden">{selectedEvent.eventDate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-right mr-2 hidden sm:block">
                            <p className="text-xs text-gray-500 uppercase font-semibold">Progress</p>
                            <span className="text-sm text-gray-900 font-medium">{servedGuests}/{totalGuests} Guests</span>
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 bg-gray-100 rounded-lg md:hidden hover:bg-gray-200"
                        >
                            <Menu size={20} className="text-gray-700" />
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>

                {/* Item Selector Toolbar */}
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                    {selectedEvent.items?.map(item => {
                        const servedCount = itemCounts[item.inventoryItemId] || 0;
                        const remaining = item.quantity - servedCount;
                        const isLowStock = remaining < item.quantity * 0.2;

                        return (
                            <button
                                key={item.inventoryItemId}
                                onClick={() => setActiveItemId(item.inventoryItemId)}
                                className={`
                                flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-all flex flex-col items-center
                                ${activeItemId === item.inventoryItemId
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}
                            `}
                            >
                                <span>{item.name}</span>
                                <span className={`text-[10px] ${activeItemId === item.inventoryItemId ? 'text-indigo-200' : isLowStock ? 'text-rose-500 font-bold' : 'text-gray-400'}`}>
                                    ({remaining} left)
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 md:pb-4">
                        {selectedEvent.portionMonitor?.tables?.map((table: any) => (
                            <div key={table.id} className={`bg-white rounded-xl shadow-sm border-2 transition-all p-4 flex flex-col gap-3 ${table.status === 'Served' ? 'border-green-500 bg-green-50' : 'border-transparent hover:border-gray-300'}`}>
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-lg text-gray-900">{table.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                const newCap = prompt("Enter new table capacity:", table.assignedGuests.toString());
                                                if (newCap && !isNaN(Number(newCap))) {
                                                    updateTableCapacity(selectedEvent.id, table.id, Number(newCap));
                                                }
                                            }}
                                            className="p-1 px-2 text-xs bg-gray-100 rounded hover:bg-gray-200 text-gray-600"
                                        >
                                            Edit Cap ({table.assignedGuests})
                                        </button>
                                        {table.isLocked && <Lock size={16} className="text-green-600" />}
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-2 my-2">
                                    {table.seats?.map((seat: any) => (
                                        <button
                                            key={seat.id}
                                            onClick={() => {
                                                if (seat.servingCount <= 0) {
                                                    if (!activeItemId) {
                                                        alert("Please select an item to serve first.");
                                                        return;
                                                    }
                                                    markSeatServed(selectedEvent.id, table.id, seat.id, activeItemId);
                                                }
                                            }}
                                            className={`
                                                aspect-square rounded-full flex flex-col items-center justify-center text-xs font-bold border transition-all relative overflow-hidden
                                                ${seat.servingCount > 0 ? 'bg-green-100 border-green-300 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}
                                            `}
                                        >
                                            <span className="z-10 relative">{seat.number}</span>
                                            {seat.servingCount > 0 && <span className="text-[10px] font-normal z-10 relative">x{seat.servingCount}</span>}
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-auto space-y-2">
                                    <input
                                        placeholder="Assign Waiter"
                                        value={table.assignedWaiterId || ''}
                                        onChange={(e) => assignWaiterToTable(selectedEvent.id, table.id, e.target.value)}
                                        className="w-full px-3 py-2 text-sm border rounded bg-gray-50 focus:bg-white text-gray-900"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Desktop Desktop Actions Panel / Mobile Drawer */}
                <div className={`
                    fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out
                    md:relative md:translate-x-0 md:shadow-none md:border-l md:z-auto
                    ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
                `}>
                    <div className="h-full flex flex-col p-4 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4 md:hidden">
                            <h3 className="font-bold text-gray-800 text-lg">Menu</h3>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 rounded hover:bg-gray-100"><Menu size={24} /></button>
                        </div>

                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 pt-4"><AlertTriangle size={18} className="text-orange-500" /> Leftover Log</h3>
                        <div className="space-y-3 mb-6 flex-1 overflow-y-auto min-h-[100px]">
                            {selectedEvent.portionMonitor?.leftovers?.map((l: any, idx: number) => (
                                <div key={idx} className="p-3 bg-orange-50 rounded border border-orange-100 text-sm">
                                    <div className="font-bold text-gray-800">{l.name}</div>
                                    <div className="flex justify-between mt-1 text-gray-600">
                                        <span>Qty: {l.quantity}</span>
                                        <span className="italic">{l.reason}</span>
                                    </div>
                                </div>
                            ))}
                            {selectedEvent.portionMonitor?.leftovers.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No leftovers logged yet.</p>}
                        </div>
                        <button onClick={() => setShowLeftoverModal(true)} className="w-full py-3 mb-6 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors font-medium">
                            + Log Leftover Item
                        </button>

                        <div className="mt-auto border-t pt-4">
                            <h4 className="font-bold text-gray-800 mb-2">Handover Evidence</h4>
                            <div className="grid grid-cols-2 gap-2 mb-4 max-h-40 overflow-y-auto text-gray-900">
                                {selectedEvent.portionMonitor?.handoverEvidence?.map((e: any, idx: number) => (
                                    <div key={idx} className="relative group aspect-square bg-gray-100 rounded overflow-hidden">
                                        <img src={e.url} alt="Evidence" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setShowHandoverModal(true)} className="w-full py-3 bg-gray-100 rounded text-gray-700 hover:bg-gray-200">
                                <Camera size={16} className="inline mr-2" /> Add Photo
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALS (Simplified for external access) */}
            {showLeftoverModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">Log Leftover</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Item Name</label>
                                <select value={leftoverItem} onChange={e => setLeftoverItem(e.target.value)} className="w-full p-2 border rounded text-gray-900">
                                    <option value="">Select Item</option>
                                    {selectedEvent.items?.map(i => <option key={i.inventoryItemId} value={i.inventoryItemId}>{i.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Quantity</label>
                                <input type="number" value={leftoverQty} onChange={e => setLeftoverQty(Number(e.target.value))} className="w-full p-2 border rounded text-gray-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Reason</label>
                                <select value={leftoverReason} onChange={e => setLeftoverReason(e.target.value)} className="w-full p-2 border rounded text-gray-900">
                                    <option>Excess Prep</option>
                                    <option>Guest No-show</option>
                                    <option>Order Cancelled</option>
                                    <option>Quality Issue</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => setShowLeftoverModal(false)} className="px-4 py-2 text-gray-500">Cancel</button>
                                <button onClick={submitLeftover} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold">Save Log</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showHandoverModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">Handover Evidence</h2>
                        <div className="space-y-4">
                            {!evidenceFile ? (
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                                    <Camera size={48} className="mx-auto text-gray-300 mb-2" />
                                    <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" id="evidence-upload" />
                                    <label htmlFor="evidence-upload" className="cursor-pointer text-indigo-600 font-bold hover:underline">Take Photo / Upload</label>
                                </div>
                            ) : (
                                <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden">
                                    <img src={evidenceFile} className="w-full h-full object-cover" />
                                    <button onClick={() => setEvidenceFile(null)} className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full"><Loader2 size={16} /></button>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Notes (Optional)</label>
                                <textarea value={evidenceNote} onChange={e => setEvidenceNote(e.target.value)} className="w-full p-2 border rounded text-gray-900" placeholder="Describe what's in the photo..." />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => setShowHandoverModal(false)} className="px-4 py-2 text-gray-500">Cancel</button>
                                <button onClick={submitEvidence} disabled={!evidenceFile} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold disabled:opacity-50">Upload Evidence</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
