import React, { useState } from 'react';
import { useDataStore } from '../store/useDataStore';
import { Role } from '../types';
import { generateHandoverReport } from '../utils/exportUtils';
import { Camera, FileText, Lock, User, CheckCircle, AlertTriangle, X, Menu, ChevronRight } from 'lucide-react';

export const PortionMonitor: React.FC<{ initialEventId?: string; onClose?: () => void }> = ({ initialEventId, onClose }) => {
    const { cateringEvents, employees, initializePortionMonitor, markTableServed, removeSeatServing, assignWaiterToTable, logLeftover, addHandoverEvidence } = useDataStore();

    // 1. Core Selection State
    const [selectedEventId, setSelectedEventId] = useState<string | null>(initialEventId || null);

    // 2. Derived State (Must be defined early)
    const activeEvents = cateringEvents.filter(e => e.status !== 'Completed' && e.status !== 'Draft');
    const selectedEvent = cateringEvents.find(e => e.id === selectedEventId);
    const waiters = employees.filter(e => e.role === Role.HEAD_WAITER || e.role === Role.EVENT_COORDINATOR);

    // 3. Computed Aggregates
    const itemCounts = React.useMemo(() => {
        const counts: Record<string, number> = {};
        if (!selectedEvent?.portionMonitor?.tables) return counts;
        selectedEvent.portionMonitor.tables.forEach((t: any) => {
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
    const [setupMode, setSetupMode] = useState(false);

    // Auto-scale table count based on guest count
    const defaultGuestsPerTable = 10;
    const initialTableCount = selectedEvent ? Math.ceil((selectedEvent.guestCount || 0) / defaultGuestsPerTable) : 10;

    const [tableCount, setTableCount] = useState(initialTableCount);
    const [guestsPerTable, setGuestsPerTable] = useState(defaultGuestsPerTable);

    // Update defaults if event changes
    React.useEffect(() => {
        if (selectedEvent) {
            const derivedTables = Math.ceil((selectedEvent.guestCount || 0) / 10) || 10;
            setTableCount(derivedTables);
        }
    }, [selectedEvent?.guestCount]);

    const [showLeftoverModal, setShowLeftoverModal] = useState(false);
    const [showHandoverModal, setShowHandoverModal] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Leftover Modal Inputs
    const [leftoverItem, setLeftoverItem] = useState('');
    const [leftoverQty, setLeftoverQty] = useState(0);
    const [leftoverReason, setLeftoverReason] = useState('Excess Prep');

    // Evidence Modal Inputs
    const [evidenceNote, setEvidenceNote] = useState('');
    const [evidenceFile, setEvidenceFile] = useState<string | null>(null);

    // 5. Effects
    React.useEffect(() => {
        if (selectedEvent?.items?.length && !activeItemId) {
            setActiveItemId(selectedEvent.items[0].inventoryItemId);
        }
    }, [selectedEvent, activeItemId]);

    // 6. Handlers
    const handleServe = (tableId: string) => {
        if (!selectedEvent) return;
        const itemIds = selectedEvent.items.map(i => i.inventoryItemId);
        markTableServed(selectedEvent.id, tableId, itemIds);
    };

    const handleInitialize = () => {
        if (!selectedEventId) return;
        initializePortionMonitor(selectedEventId, tableCount, guestsPerTable);
        setSetupMode(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEvidenceFile(reader.result as string);
            };
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

    // --- VIEWS ---

    // Event Selection
    if (!selectedEventId) {
        return (
            <div className="p-4 md:p-6 max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-6">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800">Portion Monitor Selection</h1>
                    {onClose && <button onClick={onClose} className="text-sm text-gray-500 hover:text-rose-500">Close</button>}
                </header>
                <div className="grid gap-4">
                    {activeEvents.length === 0 ? (
                        <div className="p-8 text-center bg-gray-50 rounded-lg">
                            <p className="text-gray-500">No active events found. Events must be Confirmed or In Progress.</p>
                        </div>
                    ) : (
                        activeEvents.map(event => (
                            <div key={event.id} onClick={() => setSelectedEventId(event.id)}
                                className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                <div>
                                    <h3 className="font-bold text-lg">{event.customerName}</h3>
                                    <p className="text-sm text-gray-600">{event.eventDate} • {event.guestCount} Guests</p>
                                    <span className={`inline-block px-2 py-1 text-xs rounded mt-2 ${event.status === 'Serving' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {event.status}
                                    </span>
                                </div>
                                <div className="text-left sm:text-right">
                                    {event.portionMonitor ? (
                                        <span className="text-green-600 flex items-center gap-1"><CheckCircle size={16} /> Active Monitor</span>
                                    ) : (
                                        <span className="text-gray-400 text-sm flex items-center gap-1">Tap to Initialize <ChevronRight size={16} /></span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    // Initialization
    if (!selectedEvent?.portionMonitor && !setupMode) {
        setSetupMode(true);
    }

    if (setupMode) {
        return (
            <div className="p-4 md:p-6 max-w-lg mx-auto bg-white rounded-xl shadow-lg mt-4 md:mt-10 mx-4">
                <h2 className="text-xl font-bold mb-4 text-gray-900">Initialize Monitor</h2>
                <p className="mb-4 text-gray-600 text-sm">Setup table configuration for {selectedEvent?.customerName}</p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700">Number of Tables</label>
                        <input type="number" value={tableCount} onChange={e => setTableCount(Number(e.target.value))} className="w-full p-2 border rounded text-slate-900" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700">Guests Per Table (Default)</label>
                        <input type="number" value={guestsPerTable} onChange={e => setGuestsPerTable(Number(e.target.value))} className="w-full p-2 border rounded text-slate-900" />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button onClick={() => { setSelectedEventId(null); onClose?.(); }} className="px-4 py-2 text-gray-600">Cancel</button>
                        <button onClick={handleInitialize} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Start Monitoring</button>
                    </div>
                </div>
            </div>
        );
    }

    // Main Monitor View
    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden relative">
            {/* Header */}
            <div className="bg-white border-b px-4 py-3 shadow-sm z-10 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                    <div>
                        <button onClick={() => { setSelectedEventId(null); onClose?.(); }} className="text-sm text-gray-500 hover:text-gray-800 mb-1 flex items-center gap-1">← Back</button>
                        <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate max-w-[200px] md:max-w-none">{selectedEvent?.customerName}</h1>
                        <p className="text-xs text-gray-500 md:hidden">{selectedEvent?.eventDate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-right mr-2 hidden sm:block">
                            <p className="text-xs text-gray-500 uppercase font-semibold">Progress</p>
                            <span className="text-sm text-gray-900 font-medium">{servedGuests}/{totalGuests} Guests</span>
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 bg-gray-100 rounded-lg lg:hidden hover:bg-gray-200"
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
                    {selectedEvent?.items.map(item => {
                        const servedCount = itemCounts[item.inventoryItemId] || 0;
                        const remaining = item.quantity - servedCount;
                        const isLowStock = remaining < item.quantity * 0.2; // 20%

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 lg:pb-4">
                        {selectedEvent?.portionMonitor?.tables.map((table: any) => (
                            <div key={table.id} className={`bg-white rounded-xl shadow-sm border-2 transition-all p-4 flex flex-col gap-3 ${table.status === 'Served' ? 'border-green-500 bg-green-50' : 'border-transparent hover:border-gray-300'}`}>
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-lg text-gray-900">{table.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                const newCap = prompt("Enter new table capacity:", table.assignedGuests.toString());
                                                if (newCap && !isNaN(Number(newCap))) {
                                                    useDataStore.getState().updateTableCapacity(selectedEventId, table.id, Number(newCap));
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
                                                if (seat.servingCount > 0) {
                                                    setSelectedSeat({ tableId: table.id, seatId: seat.id, data: seat });
                                                } else {
                                                    if (!activeItemId) {
                                                        alert("Please select an item to serve first.");
                                                        return;
                                                    }
                                                    useDataStore.getState().markSeatServed(selectedEventId, table.id, seat.id, activeItemId);
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
                                    <div className="relative">
                                        <User size={14} className="absolute left-2 top-2.5 text-gray-400" />
                                        <input
                                            list={`waiters-list-${table.id}`}
                                            disabled={table.isLocked}
                                            placeholder="Assign Waiter"
                                            value={
                                                waiters.find(w => w.id === table.assignedWaiterId)?.firstName
                                                    ? `${waiters.find(w => w.id === table.assignedWaiterId)?.firstName} ${waiters.find(w => w.id === table.assignedWaiterId)?.lastName}`
                                                    : (table.assignedWaiterId || '')
                                            }
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const matchedWaiter = waiters.find(w => `${w.firstName} ${w.lastName}` === val);
                                                assignWaiterToTable(selectedEventId, table.id, matchedWaiter ? matchedWaiter.id : val);
                                            }}
                                            className="w-full pl-7 pr-2 py-2 text-sm border rounded bg-gray-50 focus:bg-white disabled:opacity-50 text-gray-900"
                                        />
                                        <datalist id={`waiters-list-${table.id}`}>
                                            {waiters.map(w => (
                                                <option key={w.id} value={`${w.firstName} ${w.lastName}`} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Manual Add Table Button */}
                        <div className="flex items-center justify-center min-h-[200px]">
                            <button
                                onClick={() => {
                                    const caps = prompt("Enter capacity for new table:", "10");
                                    if (caps && !isNaN(Number(caps))) {
                                        // Use getState to access store outside of hook if needed, or use destructuring
                                        useDataStore.getState().addPortionMonitorTable(selectedEventId!, Number(caps));
                                    }
                                }}
                                className="flex flex-col items-center gap-2 px-6 py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all w-full h-full justify-center bg-gray-50 hover:bg-white"
                            >
                                <span className="text-4xl text-gray-300 font-light">+</span>
                                <span className="font-medium">Add Manual Table</span>
                            </button>
                        </div>
                    </div>
                </div>

                {isMobileMenuOpen && (
                    <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
                )}

                <div className={`
                    fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out
                    lg:relative lg:translate-x-0 lg:shadow-none lg:border-l lg:z-auto
                    ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
                `}>
                    <div className="h-full flex flex-col p-4 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4 lg:hidden">
                            <h3 className="font-bold text-gray-800 text-lg">Menu</h3>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 rounded hover:bg-gray-100"><X size={24} /></button>
                        </div>
                        <div className="mb-6">
                            <button onClick={() => setShowHandoverModal(true)} className="w-full py-2 bg-gray-800 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-gray-700 shadow-sm">
                                <FileText size={16} /> Handover Report
                            </button>
                        </div>
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 pt-4 border-t"><AlertTriangle size={18} className="text-orange-500" /> Leftover Log</h3>
                        <div className="space-y-3 mb-6 flex-1 overflow-y-auto min-h-[100px]">
                            {selectedEvent?.portionMonitor?.leftovers.map((l: any, idx: number) => (
                                <div key={idx} className="p-3 bg-orange-50 rounded border border-orange-100 text-sm">
                                    <div className="font-bold text-gray-800">{l.name}</div>
                                    <div className="flex justify-between mt-1 text-gray-600">
                                        <span>Qty: {l.quantity}</span>
                                        <span className="italic">{l.reason}</span>
                                    </div>
                                </div>
                            ))}
                            {selectedEvent?.portionMonitor?.leftovers.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No leftovers logged yet.</p>}
                        </div>
                        <button onClick={() => setShowLeftoverModal(true)} className="w-full py-3 mb-6 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors font-medium">
                            + Log Leftover Item
                        </button>
                        <div className="mt-auto border-t pt-4">
                            <h4 className="font-bold text-gray-800 mb-2">Handover Evidence</h4>
                            <div className="grid grid-cols-2 gap-2 mb-4 max-h-40 overflow-y-auto">
                                {selectedEvent?.portionMonitor?.handoverEvidence.map((e: any, idx: number) => (
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

            {/* MODALS */}

            {/* Seat Details Modal */}
            {selectedSeat && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-gray-900">Seat {selectedSeat.data.number} Details</h3>
                            <button onClick={() => setSelectedSeat(null)} className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"><X size={20} /></button>
                        </div>

                        <div className="space-y-3 mb-6">
                            <h4 className="text-xs font-bold text-gray-500 uppercase">Served Items</h4>
                            {selectedSeat.data.servedItems?.length > 0 ? (
                                selectedSeat.data.servedItems.map((item: any, idx: number) => (
                                    <div key={`${item.itemId}-${idx}`} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                                        <div>
                                            <p className="font-medium text-gray-800">{item.name}</p>
                                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                removeSeatServing(selectedEventId!, selectedSeat.tableId, selectedSeat.seatId, item.itemId);
                                                // Close modal if it becomes empty? No, let user see it update.
                                                // Actually, if we update store, selectedSeat.data needs to refresh? 
                                                // Since selectedSeat is local state with snapshot data, it won't auto-update unless we re-find it or assume modal closes.
                                                // Better: Close modal after action, or re-sync. 
                                                // For simplicity: Close modal. User can re-open to verify.
                                                setSelectedSeat(null);
                                            }}
                                            className="text-rose-600 hover:text-rose-700 p-2 hover:bg-rose-50 rounded"
                                            title="Remove Item"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400 text-sm">No items served.</p>
                            )}
                        </div>

                        <div className="pt-4 border-t">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Add Another Item</h4>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {selectedEvent?.items.map(item => (
                                    <button
                                        key={item.inventoryItemId}
                                        onClick={() => {
                                            useDataStore.getState().markSeatServed(selectedEventId!, selectedSeat.tableId, selectedSeat.seatId, item.inventoryItemId);
                                            setSelectedSeat(null);
                                        }}
                                        className="px-3 py-1.5 text-xs bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 border whitespace-nowrap"
                                    >
                                        + {item.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showLeftoverModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="font-bold text-lg mb-4 text-gray-900">Log Leftover Item</h3>
                        <div className="space-y-3">
                            <select value={leftoverItem} onChange={e => setLeftoverItem(e.target.value)} className="w-full p-3 border rounded bg-white text-gray-900">
                                <option value="">Select Item...</option>
                                {selectedEvent?.items.map(i => (
                                    <option key={i.inventoryItemId} value={i.inventoryItemId}>{i.name}</option>
                                ))}
                            </select>
                            <input type="number" placeholder="Quantity" value={leftoverQty} onChange={e => setLeftoverQty(Number(e.target.value))} className="w-full p-3 border rounded text-gray-900" />
                            <select value={leftoverReason} onChange={e => setLeftoverReason(e.target.value)} className="w-full p-3 border rounded bg-white text-gray-900">
                                <option>Excess Prep</option>
                                <option>Returned by Guest</option>
                                <option>Spoilage</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setShowLeftoverModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                            <button onClick={submitLeftover} className="px-4 py-2 bg-orange-600 text-white rounded">Log</button>
                        </div>
                    </div>
                </div>
            )}

            {showHandoverModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-gray-900">Service Handover</h3>
                            <button onClick={() => setShowHandoverModal(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 cursor-pointer relative min-h-[150px] flex items-center justify-center">
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                {evidenceFile ? (
                                    <div className="flex flex-col items-center">
                                        <img src={evidenceFile} alt="Preview" className="h-32 object-contain mb-2" />
                                        <p className="text-green-600 text-sm">Image captured</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-gray-500">
                                        <Camera size={32} className="mb-2" />
                                        <p>Tap to take photo or upload</p>
                                    </div>
                                )}
                            </div>
                            <textarea
                                placeholder="Add a note about this handover evidence..."
                                value={evidenceNote}
                                onChange={e => setEvidenceNote(e.target.value)}
                                className="w-full p-3 border rounded h-24"
                            />

                            <div className="flex flex-col sm:flex-row gap-2">
                                <button onClick={submitEvidence} disabled={!evidenceFile} className="flex-1 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50">
                                    Save Evidence
                                </button>
                                <button
                                    onClick={() => {
                                        if (selectedEvent && selectedEvent.portionMonitor) {
                                            try {
                                                // Generate report FIRST to ensure data availability
                                                generateHandoverReport(selectedEvent, selectedEvent.portionMonitor);

                                                // Then mark as completed
                                                useDataStore.getState().completeEvent(selectedEvent.id);

                                                alert("Event marked as Completed. Handover report generated.");
                                                setShowHandoverModal(false);
                                                onClose?.(); // Exit monitor
                                            } catch (error) {
                                                console.error("End Event Error:", error);
                                                alert(`Error identifying report or ending event: ${(error as Error).message}`);
                                            }
                                        }
                                    }}
                                    className="flex-1 py-3 bg-gray-900 text-white rounded hover:bg-black flex items-center justify-center gap-2 border border-gray-700"
                                >
                                    <FileText size={16} /> End Event & Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

