import React, { useState, useEffect } from 'react';
import { useDataStore } from '../store/useDataStore';
import { CateringEvent, Role } from '../types';
import { generateHandoverReport } from '../utils/exportUtils';
import { Camera, FileText, Lock, User, CheckCircle, AlertTriangle, Upload, Save, X } from 'lucide-react';

export const PortionMonitor: React.FC = () => {
    const { cateringEvents, employees, initializePortionMonitor, markTableServed, assignWaiterToTable, logLeftover, addHandoverEvidence } = useDataStore();
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [showLeftoverModal, setShowLeftoverModal] = useState(false);
    const [showHandoverModal, setShowHandoverModal] = useState(false);

    // Setup Modal State
    const [setupMode, setSetupMode] = useState(false);
    const [tableCount, setTableCount] = useState(10);
    const [guestsPerTable, setGuestsPerTable] = useState(10);

    // Leftover Modal State
    const [leftoverItem, setLeftoverItem] = useState('');
    const [leftoverQty, setLeftoverQty] = useState(0);
    const [leftoverReason, setLeftoverReason] = useState('Excess Prep');

    // Evidence Modal
    const [evidenceNote, setEvidenceNote] = useState('');
    const [evidenceFile, setEvidenceFile] = useState<string | null>(null);

    const activeEvents = cateringEvents.filter(e => e.status !== 'Completed' && e.status !== 'Draft');
    const selectedEvent = cateringEvents.find(e => e.id === selectedEventId);
    const waiters = employees.filter(e => e.role === Role.WAITER || e.role === Role.HEAD_WAITER || e.role === Role.EVENT_COORDINATOR);

    const handleServe = (tableId: string) => {
        if (!selectedEvent) return;
        // In a complex version, we'd select specific items. For "Quick Serve", we serve all items in the deal.
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

    // Calculate Aggregates
    const totalGuests = selectedEvent?.portionMonitor?.tables.reduce((sum, t) => sum + t.assignedGuests, 0) || 0;
    const servedGuests = selectedEvent?.portionMonitor?.tables.reduce((sum, t) => t.status === 'Served' ? sum + t.assignedGuests : sum, 0) || 0;
    const progress = totalGuests > 0 ? (servedGuests / totalGuests) * 100 : 0;

    if (!selectedEventId) {
        return (
            <div className=\"p-6 max-w-4xl mx-auto\">
                < h1 className =\"text-2xl font-bold mb-6 text-gray-800\">Portion Monitor Selection</h1>
                    < div className = "grid gap-4" >
                    {
                        activeEvents.length === 0 ? (
                            <div className=\"p-8 text-center bg-gray-50 rounded-lg\">
                            <p className =\"text-gray-500\">No active events found. Events must be Confirmed or In Progress.</p>
                        </div >
                    ) : (
    activeEvents.map(event => (
        <div key={event.id} onClick={() => setSelectedEventId(event.id)}
            className=\"p-4 bg-white border rounded-lg shadow-sm hover:shadow-md cursor-pointer transition-all flex justify-between items-center\">
            < div >
    <h3 className=\"font-bold text-lg\">{event.customerName}</h3>
    < p className =\"text-sm text-gray-600\">{event.eventDate} • {event.guestCount} Guests</p>
    < span className = {`inline-block px-2 py-1 text-xs rounded mt-2 ${event.status === 'Serving' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
    { event.status }
                                    </span >
                                </div >
        <div className=\"text-right\">
                                    {
            event.portionMonitor ? (
                <span className=\"text-green-600 flex items-center gap-1\"><CheckCircle size={16}/> Active Monitor</span>
                                    ) : (
    <span className=\"text-gray-400 text-sm\">Tap to Initialize</span>
                                    )}
                                </div >
                            </div >
                        ))
                    )}
                </div >
            </div >
        );
    }

if (!selectedEvent?.portionMonitor && !setupMode) {
    setSetupMode(true);
}

if (setupMode) {
    return (
        <div className=\"p-6 max-w-lg mx-auto bg-white rounded-xl shadow-lg mt-10\">
            < h2 className =\"text-xl font-bold mb-4\">Initialize Monitor</h2>
                < p className =\"mb-4 text-gray-600\">Setup table configuration for {selectedEvent?.customerName}</p>

                    < div className =\"space-y-4\">
                        < div >
                        <label className=\"block text-sm font-medium mb-1\">Number of Tables</label>
                            < input type =\"number\" value={tableCount} onChange={e => setTableCount(Number(e.target.value))} className=\"w-full p-2 border rounded\" />
                    </div >
                    <div>
                        <label className=\"block text-sm font-medium mb-1\">Guests Per Table (Default)</label>
                        <input type=\"number\" value={guestsPerTable} onChange={e => setGuestsPerTable(Number(e.target.value))} className=\"w-full p-2 border rounded\" />
                    </div >
        <div className=\"flex justify-end gap-2 mt-6\">
            < button onClick = {() => setSelectedEventId(null)
} className =\"px-4 py-2 text-gray-600\">Cancel</button>
    < button onClick = { handleInitialize } className =\"px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700\">Start Monitoring</button>
                    </div >
                </div >
            </div >
        );
    }

return (
    <div className=\"h-screen flex flex-col bg-gray-50 overflow-hidden\">
{/* Header */ }
<div className=\"bg-white border-b px-6 py-4 shadow-sm flex justify-between items-center z-10\">
    < div >
    <button onClick={() => setSelectedEventId(null)} className=\"text-sm text-gray-500 hover:text-gray-800 mb-1\">← Back to Events</button>
        < h1 className =\"text-xl font-bold\">{selectedEvent?.customerName} <span className=\"font-normal text-gray-500\">| {selectedEvent?.eventDate}</span></h1>
                </div >
    <div className=\"flex items-center gap-6\">
        < div className =\"text-right\">
            < p className =\"text-xs text-gray-500 uppercase font-semibold\">Progress</p>
                < p className =\"text-lg font-bold\">{servedGuests} / {totalGuests} <span className=\"text-sm font-normal text-gray-500\">Guests Served</span></p>
                    </div >
    <div className=\"w-32 h-2 bg-gray-200 rounded-full overflow-hidden\">
        < div className =\"h-full bg-green-500 transition-all duration-500\" style={{ width: `${progress}%` }}></div>
                    </div >
    <button onClick={() => setShowHandoverModal(true)} className=\"px-4 py-2 bg-gray-800 text-white rounded-lg flex items-center gap-2 hover:bg-gray-700\">
        < FileText size = { 16} /> Handover Report
                    </button >
                </div >
            </div >

    <div className=\"flex-1 flex overflow-hidden\">
{/* Main Grid */ }
<div className=\"flex-1 overflow-y-auto p-6\">
    < div className =\"grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4\">
{
    selectedEvent?.portionMonitor?.tables.map(table => (
        <div key={table.id} className={`bg-white rounded-xl shadow-sm border-2 transition-all p-4 flex flex-col gap-3 ${table.status === 'Served' ? 'border-green-500 bg-green-50' : 'border-transparent hover:border-gray-300'}`}>
            <div className=\"flex justify-between items-start\">
            <h3 className=\"font-bold text-lg\">{table.name}</h3>
                                    {
            table.isLocked && <Lock size={16} className=\"text-green-600\" />}
                                </div>
        <div className=\"text-sm text-gray-600\">{table.assignedGuests} Guests</div>

    < div className =\"mt-auto space-y-2\">
                                    {/* Waiter Selection */ }
        < div className =\"relative\">
    < User size = { 14} className =\"absolute left-2 top-2 text-gray-400\" />
    < select 
                                            disabled = { table.isLocked }
                                            value = { table.assignedWaiterId || '' }
                                            onChange = {(e) => assignWaiterToTable(selectedEventId, table.id, e.target.value)}
className =\"w-full pl-7 pr-2 py-1 text-xs border rounded bg-gray-50 focus:bg-white disabled:opacity-50\"
    >
    <option value=\"\">Assign Waiter</option>
{
    waiters.map(w => (
        <option key={w.id} value={w.id}>{w.firstName} {w.lastName}</option>
    ))
}
                                        </select >
                                    </div >

    <button
        onClick={() => handleServe(table.id)}
        disabled={table.isLocked}
        className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${table.status === 'Served'
            ? 'bg-green-600 text-white cursor-default'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
            }`}
    >
        {table.status === 'Served' ? 'SERVED' : 'SERVE TABLE'}
    </button>
                                </div >
                            </div >
                        ))}
                    </div >
                </div >

    {/* Leftover Sidebar */ }
    < div className =\"w-80 bg-white border-l p-4 overflow-y-auto shadow-xl z-20 hidden lg:block\">
        < h3 className =\"font-bold text-gray-800 mb-4 flex items-center gap-2\"><AlertTriangle size={18} className=\"text-orange-500\"/> Leftover Log</h3>

            < div className =\"space-y-3 mb-6\">
{
    selectedEvent?.portionMonitor?.leftovers.map((l, idx) => (
        <div key={idx} className=\"p-3 bg-orange-50 rounded border border-orange-100 text-sm\">
    < div className =\"font-bold text-gray-800\">{l.name}</div>
    < div className =\"flex justify-between mt-1 text-gray-600\">
    < span > Qty: { l.quantity }</span >
    <span className=\"italic\">{l.reason}</span>
                                </div >
                            </div >
                        ))
}
{
    selectedEvent?.portionMonitor?.leftovers.length === 0 && <p className=\"text-sm text-gray-400 text-center py-4\">No leftovers logged yet.</p>}
                    </div >

        <button onClick={() => setShowLeftoverModal(true)} className=\"w-full py-2 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors font-medium\">
            + Log Leftover Item
                    </button >

        <div className=\"mt-8 border-t pt-4\">
            < h4 className =\"font-bold text-gray-800 mb-2\">Handover Evidence</h4>
                < div className =\"grid grid-cols-2 gap-2 mb-4\">
    {
        selectedEvent?.portionMonitor?.handoverEvidence.map((e, idx) => (
            <div key={idx} className=\"relative group aspect-square bg-gray-100 rounded overflow-hidden\">
        < img src = { e.url } alt =\"Evidence\" className=\"w-full h-full object-cover\" />
                                </div >
                            ))
    }
                        </div >
        <button onClick={() => setShowHandoverModal(true)} className=\"w-full py-2 bg-gray-100 rounded text-gray-700 hover:bg-gray-200\">
            < Camera size = { 16} className =\"inline mr-2\"/> Add Photo
                        </button >
                    </div >
                </div >
            </div >

        {/* MODALS */ }
    {/* Add Leftover Modal */ }
    {
        showLeftoverModal && (
            <div className=\"fixed inset-0 bg-black/50 flex items-center justify-center z-50\">
                < div className =\"bg-white rounded-xl p-6 w-96 shadow-2xl\">
                    < h3 className =\"font-bold text-lg mb-4\">Log Leftover Item</h3>
                        < div className =\"space-y-3\">
                            < select value = { leftoverItem } onChange = { e => setLeftoverItem(e.target.value) } className =\"w-full p-2 border rounded\">
                                < option value =\"\">Select Item...</option>
        {
            selectedEvent?.items.map(i => (
                <option key={i.inventoryItemId} value={i.inventoryItemId}>{i.name}</option>
            ))
        }
                            </select >
            <input type=\"number\" placeholder=\"Quantity\" value={leftoverQty} onChange={e => setLeftoverQty(Number(e.target.value))} className=\"w-full p-2 border rounded\" />
                < select value = { leftoverReason } onChange = { e => setLeftoverReason(e.target.value) } className =\"w-full p-2 border rounded\">
                    < option > Excess Prep</option >
                                <option>Returned by Guest</option>
                                <option>Spoilage</option>
                                <option>Other</option>
                            </select >
                        </div >
            <div className=\"flex justify-end gap-2 mt-6\">
                < button onClick = {() => setShowLeftoverModal(false)
    } className =\"px-4 py-2 text-gray-600\">Cancel</button>
        < button onClick = { submitLeftover } className =\"px-4 py-2 bg-orange-600 text-white rounded\">Log</button>
                        </div >
                    </div >
                </div >
            )
}

{/* Handover Modal */ }
{
    showHandoverModal && (
        <div className=\"fixed inset-0 bg-black/50 flex items-center justify-center z-50\">
            < div className =\"bg-white rounded-xl p-6 w-[500px] shadow-2xl\">
                < div className =\"flex justify-between items-center mb-4\">
                    < h3 className =\"font-bold text-lg\">Service Handover</h3>
                        < button onClick = {() => setShowHandoverModal(false)
}> <X size={20} /></button >
                        </div >

    <div className=\"space-y-4\">
        < div className =\"border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 cursor-pointer relative\">
            < input type =\"file\" accept=\"image/*\" onChange={handleFileUpload} className=\"absolute inset-0 opacity-0 cursor-pointer\" />
{
    evidenceFile ? (
        <div className=\"flex flex-col items-center\">
            < img src = { evidenceFile } alt =\"Preview\" className=\"h-32 object-contain mb-2\" />
                < p className =\"text-green-600 text-sm\">Image captured</p>
                                    </div >
                                ) : (
        <div className=\"flex flex-col items-center text-gray-500\">
            < Camera size = { 32} className =\"mb-2\" />
                < p > Tap to take photo or upload</p >
                                    </div >
                                )
}
                            </div >
    <textarea
        placeholder=\"Add a note about this handover evidence...\" 
value = { evidenceNote }
onChange = { e => setEvidenceNote(e.target.value) }
className =\"w-full p-2 border rounded h-24\"
    />

    <div className=\"flex gap-2\">
        < button onClick = { submitEvidence } disabled = {!evidenceFile} className =\"flex-1 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50\">
                                    Save Evidence
                                </button >
    <button
        onClick={() => {
            if (selectedEvent && selectedEvent.portionMonitor) {
                generateHandoverReport(selectedEvent, selectedEvent.portionMonitor);
            }
        }}
        className=\"flex-1 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 flex items-center justify-center gap-2\"
            >
            <FileText size={16} /> Generate PDF Report
                                </button >
                            </div >
                        </div >
                    </div >
                </div >
            )}
        </div >
    );
};
