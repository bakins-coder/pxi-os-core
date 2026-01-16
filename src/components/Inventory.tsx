import React, { useState, useEffect, useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Ingredient, InventoryItem, Recipe, Requisition, InventoryMovement, RentalRecord, ItemCosting } from '../types';
import { performAgenticMarketResearch, getLiveRecipeIngredientPrices } from '../services/ai';
import { calculateItemCosting } from '../utils/costing';
import {
   Package, Plus, RefreshCw, Layers, TrendingUp, Utensils,
   Zap, X, Trash2, Edit3, BookOpen, Info, Truck, Hammer, AlertTriangle, History, Clock, Box, Search, Check, Image as ImageIcon, Sparkles, Loader2,
   CheckCircle2, ShoppingBag, Minus, ArrowRight, Flame, ClipboardList, ShieldAlert, RotateCcw, ChevronDown, ChevronUp, Globe, Calculator, ScanLine, Grid, Maximize2, Minimize2
} from 'lucide-react';
import { DocumentCapture } from './DocumentCapture';
import { parseInventoryList } from '../services/ocrService';

const BOQModal = ({ item, portions, onClose, onPortionChange }: { item: InventoryItem, portions: number, onClose: () => void, onPortionChange: (val: number) => void }) => {
   const [isGrounding, setIsGrounding] = useState(false);
   const [costing, setCosting] = useState<ItemCosting | null>(null);
   const [isMaximized, setIsMaximized] = useState(false);
   const { inventory, recipes, ingredients, updateIngredientPrice } = useDataStore();

   const refreshCosting = () => {
      const data = calculateItemCosting(item.id, portions, inventory, recipes, ingredients);
      setCosting(data);
   };

   useEffect(() => { refreshCosting(); }, [item, portions, inventory, recipes, ingredients]);

   const handleGroundPrices = async () => {
      const recipe = recipes.find(r => r.id === item.recipeId);
      if (!recipe) return;
      setIsGrounding(true);
      try {
         const groundedPriceMap = await getLiveRecipeIngredientPrices(recipe);

         // Bulk update ingredient prices in the store
         Object.entries(groundedPriceMap).forEach(([name, price]) => {
            const ing = ingredients.find(i => i.name.toLowerCase().trim() === name);
            if (ing) {
               updateIngredientPrice(ing.id, price * 100, {
                  marketPriceCents: price * 100,
                  groundedSummary: `AIGrounded: ${price} NGN`,
                  sources: []
               });
            }
         });

         refreshCosting();
      } catch (e) {
         console.error(e);
      } finally {
         setIsGrounding(false);
      }
   };

   return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose}>
         <div
            onClick={e => e.stopPropagation()}
            className={`bg-white shadow-2xl w-full overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in duration-300 ${isMaximized ? 'fixed inset-0 rounded-none h-full max-w-none' : 'max-w-4xl rounded-[3rem] max-h-[90vh]'}`}
         >
            <div className="p-8 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Calculator size={24} /></div>
                  <div>
                     <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Neural BoQ Analysis</h2>
                     <p className="text-[10px] text-slate-500 font-black uppercase mt-1 tracking-widest">{item.name} • Intelligence Node</p>
                  </div>
               </div>
            </div>
            <div className="flex gap-2">
               <button onClick={() => setIsMaximized(!isMaximized)} className="p-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-all shadow-sm">
                  {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
               </button>
               <button onClick={onClose} className="p-3 bg-white border border-slate-200 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm"><X size={24} /></button>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-thin">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 block">Portion Multiplier</label>
                  <div className="flex items-center gap-4 bg-slate-100 p-2 rounded-[2rem] border border-slate-200">
                     <button onClick={() => onPortionChange(Math.max(1, portions - 50))} className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:text-rose-500 transition-all shadow-sm"><Minus size={18} /></button>
                     <input
                        type="number"
                        className="flex-1 bg-transparent text-center text-3xl font-black text-slate-900 outline-none"
                        value={portions}
                        onChange={(e) => onPortionChange(Math.max(1, parseInt(e.target.value) || 0))}
                     />
                     <button onClick={() => onPortionChange(portions + 50)} className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:text-emerald-500 transition-all shadow-sm"><Plus size={18} /></button>
                  </div>
               </div>
               <div className="flex items-end">
                  <button
                     onClick={handleGroundPrices}
                     disabled={isGrounding}
                     className={`w-full py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-widest transition-all flex items-center justify-center gap-3 ${isGrounding ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-[#00ff9d] shadow-xl hover:scale-[1.02] active:scale-95'}`}
                  >
                     {isGrounding ? <Loader2 size={18} className="animate-spin" /> : <Globe size={18} />}
                     {isGrounding ? 'Grounding Neural Data...' : 'Ground Market Prices via AI'}
                  </button>
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border-2 border-indigo-50 shadow-xl overflow-hidden">
               <table className="w-full text-left text-[11px]">
                  <thead className="bg-indigo-600 text-white font-black uppercase text-[9px] tracking-widest">
                     <tr>
                        <th className="px-8 py-5">Ingredient Component</th>
                        <th className="px-8 py-5 text-center">Std. Portion</th>
                        <th className="px-8 py-5">Net Requirement</th>
                        <th className="px-8 py-5 text-right">Unit Rate</th>
                        <th className="px-8 py-5 text-right">Ext. Value (₦)</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-50">
                     {costing?.ingredientBreakdown.map((ing: any, idx: number) => (
                        <tr key={idx} className="hover:bg-indigo-50/30 transition-all">
                           <td className="px-8 py-5">
                              <div className="flex items-center gap-2">
                                 <span className="font-black text-slate-800 uppercase text-xs">{ing.name}</span>
                                 {ing.isGrounded && <span className="p-1 bg-emerald-100 text-emerald-600 rounded-md" title="Gemini Grounded"><Sparkles size={8} /></span>}
                              </div>
                           </td>
                           <td className="px-8 py-5 text-center font-mono text-slate-400 text-[10px]">{ing.qtyPerPortion} {ing.unit}</td>
                           <td className="px-8 py-5 font-bold text-slate-500 text-xs">{ing.qtyRequired.toFixed(2)} {ing.unit}</td>
                           <td className="px-8 py-5 text-right font-mono text-slate-400">₦{(ing.unitCostCents / 100).toLocaleString()}</td>
                           <td className="px-8 py-5 text-right font-black text-slate-900 text-sm">₦{(ing.totalCostCents / 100).toLocaleString()}</td>
                        </tr>
                     ))}
                     <tr className="bg-slate-50 border-t-2 border-slate-100">
                        <td colSpan={4} className="px-8 py-5 font-black text-slate-500 uppercase text-xs text-right tracking-widest">Total Ingredient Cost ({portions} Portions)</td>
                        <td className="px-8 py-5 text-right font-black text-indigo-600 text-base">₦{(costing?.totalIngredientCostCents! / 100).toLocaleString()}</td>
                     </tr>
                  </tbody>
               </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="p-8 bg-slate-950 rounded-[2rem] text-white">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Aggregate Cost</p>
                  <h5 className="text-2xl font-black">₦{(costing?.totalIngredientCostCents! / 100).toLocaleString()}</h5>
               </div>
               <div className="p-8 bg-indigo-50 rounded-[2rem] border border-indigo-100">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Projected Revenue</p>
                  <h5 className="text-2xl font-black text-indigo-900">₦{(costing?.revenueCents! / 100).toLocaleString()}</h5>
               </div>
               <div className="p-8 bg-white border-2 border-slate-100 rounded-[2rem]">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Gross Margin</p>
                  <h5 className={`text-2xl font-black ${costing?.grossMarginPercentage! > 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
                     {costing?.grossMarginPercentage.toFixed(1)}%
                  </h5>
               </div>
            </div>
         </div>

         <div className="p-8 border-t-2 border-slate-100 bg-slate-50/50 flex justify-end">
            <button onClick={onClose} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Close Analysis</button>
         </div>
      </div>

   );
};

const RentalReturnModal = ({ isOpen, onClose, rental }: { isOpen: boolean, onClose: () => void, rental: RentalRecord | null }) => {
   const [status, setStatus] = useState<'Returned' | 'Damaged' | 'Lost'>('Returned');
   const [notes, setNotes] = useState('');
   const [isMaximized, setIsMaximized] = useState(false);
   const returnRental = useDataStore(state => state.returnRental);

   if (!isOpen || !rental) return null;
   const handleReturn = () => { returnRental(rental.id, status, notes); onClose(); };
   return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-in zoom-in duration-300" onClick={onClose}>
         <div
            onClick={e => e.stopPropagation()}
            className={`bg-white shadow-2xl w-full overflow-hidden border border-slate-200 ${isMaximized ? 'fixed inset-0 rounded-none h-full max-w-none flex flex-col' : 'max-w-md rounded-[3rem] flex flex-col'}`}
         >
            <div className="p-8 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h2 className="text-xl font-black text-slate-900 uppercase">Process Rental Return</h2>
               <div className="flex gap-2">
                  <button onClick={() => setIsMaximized(!isMaximized)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                     {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                  <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} /></button>
               </div>
            </div>
            <div className="p-10 space-y-6">
               <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 mb-6"><p className="text-[10px] font-black uppercase text-amber-600 mb-1">Active Liability</p><p className="text-sm font-bold text-amber-900">Est. replacement: ₦{(rental.estimatedReplacementValueCents / 100).toLocaleString()}</p></div>
               <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Return Status</label><select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none" value={status} onChange={e => setStatus(e.target.value as any)}><option value="Returned">Safely Returned</option><option value="Damaged">Damaged / Broken</option><option value="Lost">Lost / Unaccounted</option></select></div>
               <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Discrepancy Notes</label><textarea rows={2} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Explain damages or loss details..." /></div>
            </div>
            <div className="p-8 bg-slate-50 flex gap-4"><button onClick={onClose} className="flex-1 py-4 font-black uppercase text-[10px] text-slate-400">Cancel</button><button onClick={handleReturn} className="flex-1 py-4 bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl">Complete Return Cycle</button></div>
         </div>
      </div>
   );
};

const KitchenReleaseModal = ({ isOpen, onClose, ingredients, events }: { isOpen: boolean, onClose: () => void, ingredients: Ingredient[], events: any[] }) => {
   const [selectedIngId, setSelectedIngId] = useState('');
   const [selectedEventId, setSelectedEventId] = useState('');
   const [qty, setQty] = useState(0);
   const [notes, setNotes] = useState('');
   const [isMaximized, setIsMaximized] = useState(false);
   const addRequisition = useDataStore(state => state.addRequisition);

   if (!isOpen) return null;
   const handleReleaseRequest = () => {
      if (!selectedIngId || qty <= 0) return;
      const ing = ingredients.find(i => i.id === selectedIngId);
      addRequisition({ type: 'Release', category: 'Food', itemName: `Release: ${ing?.name}`, ingredientId: selectedIngId, quantity: qty, pricePerUnitCents: 0, totalAmountCents: 0, referenceId: selectedEventId, notes: notes || `Standard release to kitchen` });
      onClose();
      alert("Release requisition logged for approval.");
   };
   return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-in zoom-in duration-300" onClick={onClose}>
         <div
            onClick={e => e.stopPropagation()}
            className={`bg-white shadow-2xl w-full overflow-hidden border border-slate-200 ${isMaximized ? 'fixed inset-0 rounded-none h-full max-w-none flex flex-col' : 'max-w-md rounded-[3rem] flex flex-col'}`}
         >
            <div className="p-8 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h2 className="text-xl font-black text-slate-900 uppercase">Kitchen Release Request</h2>
               <div className="flex gap-2">
                  <button onClick={() => setIsMaximized(!isMaximized)} className="p-2 hover:bg-rose-50 rounded-xl transition-all">
                     {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                  <button onClick={onClose} className="p-2 hover:bg-rose-50 rounded-xl"><X size={20} /></button>
               </div>
            </div>
            <div className="p-10 space-y-6">
               <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Ingredient Release</label><select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none" value={selectedIngId} onChange={e => setSelectedIngId(e.target.value)}><option value="">Select Ingredient...</option>{ingredients.map(i => <option key={i.id} value={i.id}>{i.name} (Stock: {i.stockLevel} {i.unit})</option>)}</select></div>
               <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Tie to Event/Order</label><select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}><option value="">General / Casual Order</option>{events.map(e => <option key={e.id} value={e.id}>{e.customerName} - {e.eventDate}</option>)}</select></div>
               <div className="grid grid-cols-1 gap-4"><div><label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Release Quantity</label><input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none" value={qty} onChange={e => setQty(parseFloat(e.target.value) || 0)} /></div></div>
               <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Release Notes</label><textarea rows={2} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g., Replacement for spoiled batch..." /></div>
            </div>
            <div className="p-8 bg-slate-50 flex gap-4"><button onClick={onClose} className="flex-1 py-4 font-black uppercase text-[10px] text-slate-400">Cancel</button><button onClick={handleReleaseRequest} className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl">Authorize Release</button></div>
         </div>
      </div>
   );
};

const ReceiveStockModal = ({ isOpen, onClose, ingredients }: { isOpen: boolean, onClose: () => void, ingredients: Ingredient[] }) => {
   const [selectedIngId, setSelectedIngId] = useState('');
   const [qty, setQty] = useState(0);
   const [cost, setCost] = useState(0);
   const [isMaximized, setIsMaximized] = useState(false);
   const receiveFoodStock = useDataStore(state => state.receiveFoodStock);

   if (!isOpen) return null;
   const handleReceive = () => { if (!selectedIngId || qty <= 0) return; receiveFoodStock(selectedIngId, qty, cost * 100); onClose(); };
   return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-in zoom-in duration-300" onClick={onClose}>
         <div
            onClick={e => e.stopPropagation()}
            className={`bg-white shadow-2xl w-full overflow-hidden border border-slate-200 ${isMaximized ? 'fixed inset-0 rounded-none h-full max-w-none flex flex-col' : 'max-w-md rounded-[3rem] flex flex-col'}`}
         >
            <div className="p-8 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h2 className="text-xl font-black text-slate-900 uppercase">Inward Procurement Entry</h2>
               <div className="flex gap-2">
                  <button onClick={() => setIsMaximized(!isMaximized)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                     {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                  <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} /></button>
               </div>
            </div>
            <div className="p-10 space-y-6">
               <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Select Ingredient</label><select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none focus:border-indigo-500" value={selectedIngId} onChange={e => setSelectedIngId(e.target.value)}><option value="">Choose item...</option>{ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}</select></div>
               <div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Quantity Recieved</label><input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none" value={qty} onChange={e => setQty(parseFloat(e.target.value) || 0)} /></div><div><label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Purchase Value (₦)</label><input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none" value={cost} onChange={e => setCost(parseFloat(e.target.value) || 0)} /></div></div>
            </div>
            <div className="p-8 bg-slate-50 flex gap-4"><button onClick={onClose} className="flex-1 py-4 font-black uppercase text-[10px] text-slate-400">Cancel</button><button onClick={handleReceive} className="flex-1 py-4 bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl">Commit to Stock</button></div>
         </div>
      </div>
   );
};

const AssetIssueModal = ({ isOpen, onClose, assets, events }: { isOpen: boolean, onClose: () => void, assets: InventoryItem[], events: any[] }) => {
   const [selectedAssetId, setSelectedAssetId] = useState('');
   const [selectedEventId, setSelectedEventId] = useState('');
   const [qty, setQty] = useState(0);
   const [vendor, setVendor] = useState('In-House');
   const [isMaximized, setIsMaximized] = useState(false);
   const issueRental = useDataStore(state => state.issueRental);

   if (!isOpen) return null;

   const handleIssue = () => {
      if (!selectedAssetId || !selectedEventId || qty <= 0) return;
      issueRental(selectedEventId, selectedAssetId, qty, vendor);
      onClose();
      alert("Assets successfully issued and moved to event liability ledger.");
   };

   return (
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-in zoom-in duration-300" onClick={onClose}>
         <div
            onClick={e => e.stopPropagation()}
            className={`bg-white shadow-2xl w-full overflow-hidden border border-slate-200 ${isMaximized ? 'fixed inset-0 rounded-none h-full max-w-none flex flex-col' : 'max-w-md rounded-[3rem] flex flex-col'}`}
         >
            <div className="p-8 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h2 className="text-xl font-black text-slate-900 uppercase">Dispatch Assets</h2>
               <div className="flex gap-2">
                  <button onClick={() => setIsMaximized(!isMaximized)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                     {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                  <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} /></button>
               </div>
            </div>

            <div className="p-10 space-y-6">
               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Select Asset</label>
                  <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none" value={selectedAssetId} onChange={e => setSelectedAssetId(e.target.value)}>
                     <option value="">Choose equipment...</option>
                     {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.stockQuantity} available)</option>)}
                  </select>
               </div>

               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Assign to Event</label>
                  <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
                     <option value="">Choose active event...</option>
                     {events.map(e => <option key={e.id} value={e.id}>{e.customerName} - {e.eventDate}</option>)}
                  </select>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Quantity Out</label>
                     <input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none" value={qty} onChange={e => setQty(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                     <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Source / Vendor</label>
                     <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none" value={vendor} onChange={e => setVendor(e.target.value)}>
                        <option>In-House</option><option>External Rental</option>
                     </select>
                  </div>
               </div>
            </div>

            <div className="p-8 bg-slate-50 flex gap-4">
               <button onClick={onClose} className="flex-1 py-4 font-black uppercase text-[10px] text-slate-400 hover:bg-slate-100 rounded-2xl transition-all">Cancel</button>
               <button onClick={handleIssue} className="flex-1 py-4 bg-slate-900 text-emerald-400 rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-black transition-all">Confirm Dispatch</button>
            </div>
         </div>
      </div>
   );
};

const InventoryCatalog = ({ assets, title, subtitle }: { assets: InventoryItem[], title: string, subtitle: string }) => {
   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
   const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
   const [showScanModal, setShowScanModal] = useState(false);
   const [isProcessing, setIsProcessing] = useState(false);
   const addInventoryItem = useDataStore(state => state.addInventoryItem);

   const handleScanAssets = async (imageSrc: string) => {
      setIsProcessing(true);
      setShowScanModal(false);
      try {
         const items = await parseInventoryList(imageSrc);
         items.forEach(item => {
            addInventoryItem({
               name: item.name,
               stockQuantity: item.quantity,
               category: (item.category as any) || 'Hardware',
               priceCents: 0,
               type: 'asset', // Explicitly setting type (TODO: Make dynamic based on usage?)
               isAsset: true,
               isRental: false
            });
         });
         alert(`Successfully scanned ${items.length} assets!`);
      } catch (error) {
         console.error('Scan failed', error);
         alert('Failed to scan assets.');
      } finally {
         setIsProcessing(false);
      }
   };

   return (
      <div className="space-y-6 animate-in fade-in">
         <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Layers size={24} /></div>
                  <div><h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">{title}</h2><p className="text-[10px] text-slate-400 font-black uppercase mt-2 tracking-widest">{subtitle}</p></div>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => setShowScanModal(true)} className="bg-white border-2 border-indigo-50 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center gap-2 shadow-sm transition-all">
                     {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <ScanLine size={14} />}
                     {isProcessing ? 'Processing' : 'Scan'}
                  </button>
                  <button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-2">
                     <Plus size={16} /> Log New
                  </button>
                  <button onClick={() => setIsIssueModalOpen(true)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all flex items-center gap-2">
                     <Truck size={16} className="text-emerald-400" /> Dispatch
                  </button>
               </div>
            </div>
            <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[9px] tracking-[0.2em] border-b border-slate-100"><tr><th className="px-6 py-6 text-center">S/N</th><th className="px-10 py-6">Reference Picture</th><th className="px-10 py-6">Item Name</th><th className="px-10 py-6">Classification</th><th className="px-10 py-6">Physical Stock</th><th className="px-10 py-6 text-right">Value (Est)</th></tr></thead><tbody className="divide-y divide-slate-50">
               {assets.map((asset, index) => (
                  <tr key={asset.id} className="hover:bg-indigo-50/10 transition-all group">
                     <td className="px-6 py-6 text-center font-black text-slate-300 text-[10px]">{index + 1}</td>
                     <td className="px-10 py-4"><div className="w-16 h-16 rounded-xl border-2 border-slate-100 overflow-hidden bg-slate-50 shadow-sm transition-transform group-hover:scale-110">{asset.image ? (<img src={asset.image} className="w-full h-full object-cover" alt={asset.name} />) : (<div className="w-full h-full flex items-center justify-center text-slate-200"><ImageIcon size={20} /></div>)}</div></td>
                     <td className="px-10 py-6"><div className="font-black text-slate-800 uppercase text-sm tracking-tight leading-tight">{asset.name}</div></td>
                     <td className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{asset.category}</td>
                     <td className="px-10 py-6"><div className="flex items-center gap-3"><span className="font-black text-slate-900 text-xl tracking-tighter">{asset.stockQuantity}</span><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Units</span></div></td>
                     <td className="px-10 py-6 text-right font-black text-slate-900 tracking-tight">₦{(asset.priceCents * asset.stockQuantity / 100).toLocaleString()}</td>
                  </tr>
               ))}
               {assets.length === 0 && (<tr><td colSpan={6} className="p-20 text-center text-slate-200"><Box size={64} className="mx-auto mb-4 opacity-10" /><p className="font-black uppercase tracking-widest text-xs">No items indexed in ledger</p></td></tr>)}
            </tbody></table></div>
         </div>
      </div>
   );
};

const AddEditIngredientModal = ({ isOpen, onClose, editItem }: { isOpen: boolean, onClose: () => void, editItem: Ingredient | null }) => {
   const [name, setName] = useState(editItem?.name || '');
   const [category, setCategory] = useState(editItem?.category || 'Dry Goods');
   const [unit, setUnit] = useState(editItem?.unit || 'kg');
   const [stock, setStock] = useState(editItem?.stockLevel || 0);
   const [cost, setCost] = useState(editItem?.currentCostCents ? editItem.currentCostCents / 100 : 0);
   const [image, setImage] = useState(editItem?.image || '');

   const [showCamera, setShowCamera] = useState(false);
   const [isMaximized, setIsMaximized] = useState(false);

   const { addIngredient, updateIngredient } = useDataStore();

   const handleSave = () => {
      if (!name) return;
      if (editItem) {
         updateIngredient(editItem.id, { name, category, unit, stockLevel: stock, currentCostCents: cost * 100, image });
      } else {
         addIngredient({ name, category, unit, stockLevel: stock, currentCostCents: cost * 100, image });
      }
      onClose();
   };

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-in zoom-in duration-300" onClick={onClose}>
         <div
            onClick={e => e.stopPropagation()}
            className={`bg-white shadow-2xl w-full overflow-hidden border border-slate-200 flex flex-col ${isMaximized ? 'fixed inset-0 rounded-none h-full max-w-none' : 'max-w-lg rounded-[3rem]'}`}
         >
            <div className="p-8 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h2 className="text-xl font-black text-slate-900 uppercase">{editItem ? 'Edit Ingredient' : 'New Ingredient'}</h2>
               <div className="flex gap-2">
                  <button onClick={() => setIsMaximized(!isMaximized)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                     {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                  <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} /></button>
               </div>
            </div>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Item Name</label>
                  <input type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none focus:border-indigo-500" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Basmati Rice" />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Category</label>
                     <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none" value={category} onChange={e => setCategory(e.target.value)}>
                        <option>Dry Goods</option><option>Produce</option><option>Proteins</option><option>Dairy</option><option>Spices</option><option>Beverages</option>
                     </select>
                  </div>
                  <div>
                     <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Unit</label>
                     <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none" value={unit} onChange={e => setUnit(e.target.value)}>
                        <option>kg</option><option>g</option><option>L</option><option>ml</option><option>pcs</option><option>pack</option><option>tin</option>
                     </select>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Stock Level</label>
                     <input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none" value={stock} onChange={e => setStock(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                     <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Unit Cost (₦)</label>
                     <input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none" value={cost} onChange={e => setCost(parseFloat(e.target.value) || 0)} />
                  </div>
               </div>

               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Product Image</label>
                  <div className="flex gap-4">
                     {image ? (
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden group">
                           <img src={image} className="w-full h-full object-cover" alt="Item" />
                           <button onClick={() => setImage('')} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-all"><Trash2 size={20} /></button>
                        </div>
                     ) : (
                        <div className="w-24 h-24 bg-slate-50 border-2 border-slate-100 border-dashed rounded-2xl flex items-center justify-center text-slate-300">
                           <ImageIcon size={24} />
                        </div>
                     )}

                     <div className="flex-1 flex flex-col gap-2 justify-center">
                        <button
                           onClick={() => setShowCamera(true)}
                           className="py-3 px-4 bg-indigo-50 text-indigo-600 rounded-xl font-black uppercase text-[10px] flex items-center gap-2 hover:bg-indigo-100 transition-all"
                        >
                           <ScanLine size={14} /> Capture / Upload
                        </button>
                        <p className="text-[9px] text-slate-400 font-medium">Take a photo of the product or upload related document.</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="p-8 bg-slate-50 flex gap-4">
               <button onClick={onClose} className="flex-1 py-4 font-black uppercase text-[10px] text-slate-400 hover:bg-slate-100 rounded-2xl transition-all">Cancel</button>
               <button onClick={handleSave} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-indigo-700 transition-all">Save to Inventory</button>
            </div>
         </div>

         {showCamera && (
            <DocumentCapture
               title="Capture Item Image"
               mode="general"
               onCapture={(img) => { setImage(img); setShowCamera(false); }}
               onCancel={() => setShowCamera(false)}
            />
         )}
      </div>
   );
};

export const Inventory = () => {
   const [activeTab, setActiveTab] = useState<'products' | 'ingredients' | 'requisitions' | 'hardware' | 'reusable' | 'rentals' | 'fixtures'>('products');
   const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
   const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
   const [selectedRental, setSelectedRental] = useState<RentalRecord | null>(null);

   // BoQ Specific States
   const [selectedBoQItem, setSelectedBoQItem] = useState<InventoryItem | null>(null);
   const [portionCounts, setPortionCounts] = useState<Record<string, number>>({});

   // Scan Feature State
   const [showScanModal, setShowScanModal] = useState(false);
   const [isProcessingScan, setIsProcessingScan] = useState(false);

   const { settings } = useSettingsStore();
   const isAviation = settings.type === 'Aviation';

   const isCatering = settings.type === 'Catering' || settings.enabledModules?.includes('Catering');

   // Set default tab based on industry
   useEffect(() => {
      if (isAviation && activeTab === 'products') {
         setActiveTab('hardware');
      } else if (!isCatering && ['products', 'ingredients', 'rentals'].includes(activeTab)) {
         setActiveTab('hardware');
      }
   }, [isAviation, isCatering]);

   const { inventory, ingredients: storeIngredients, requisitions, rentalLedger, cateringEvents, approveRequisition, addIngredient, checkOverdueAssets } = useDataStore();

   useEffect(() => {
      checkOverdueAssets();
   }, [rentalLedger, checkOverdueAssets]);

   const handleScanCapture = async (imageSrc: string) => {
      setIsProcessingScan(true);
      setShowScanModal(false);
      try {
         const items = await parseInventoryList(imageSrc);

         // Add items to store with simple mapping
         items.forEach(item => {
            addIngredient({
               name: item.name,
               stockLevel: item.quantity,
               unit: (item.unit as any) || 'pcs',
               category: (item.category as any) || 'Dry Goods',
               currentCostCents: 0
            });
         });

         alert(`Successfully scanned and added ${items.length} items to inventory!`);
      } catch (error) {
         console.error('Scan failed', error);
         alert('Failed to process image. Please try again.');
      } finally {
         setIsProcessingScan(false);
      }
   };

   const products = inventory.filter(i => i.type === 'product');
   const rawMaterials = inventory.filter(i => i.type === 'raw_material');
   const assets = inventory.filter(i => i.type === 'asset');
   const reusableItems = inventory.filter(i => i.type === 'reusable');
   const fixtures = inventory.filter(i => i.type === 'fixture');
   const rentals = rentalLedger; // Kept separate as it joins with Requisitions
   const events = cateringEvents;

   useEffect(() => {
      // Initialize portion counts on load or inventory change
      setPortionCounts(prev => {
         const next = { ...prev };
         products.forEach(p => { if (next[p.id] === undefined) next[p.id] = 100; });
         return next;
      });
   }, [products.length]); // Simple dependency on length to avoid loops

   const handleApproveRelease = (id: string) => approveRequisition(id);
   const totalLiability = rentalLedger.filter(r => r.status === 'Issued').reduce((sum, r) => sum + r.estimatedReplacementValueCents, 0);

   const updatePortions = (id: string, val: number) => {
      setPortionCounts(prev => ({ ...prev, [id]: val }));
   };

   return (
      <div className="space-y-6 animate-in fade-in pb-24">
         <div className="bg-slate-950 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl mb-8">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#00ff9d]/20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-[#00ff9d] rounded-3xl flex items-center justify-center shadow-2xl animate-float"><Package size={36} className="text-slate-950" /></div>
                  <div>
                     <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Stock Intelligence</h1>
                     <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#00ff9d] border border-white/5">Dynamic Matrix Active</span>
                        {isAviation && <span className="flex items-center gap-1.5 bg-sky-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-sky-300 border border-sky-500/30">AeroParts Mode</span>}
                     </div>
                  </div>
               </div>
               <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md overflow-x-auto max-w-full">
                  {[
                     { id: 'products', label: 'Offerings', icon: Utensils, active: isCatering },
                     { id: 'ingredients', label: 'Raw Materials', icon: Box, active: isCatering },
                     { id: 'requisitions', label: 'Spend Ops', icon: ClipboardList, active: true },
                     { id: 'rentals', label: 'Rental Stock', icon: RotateCcw, active: isCatering },
                     { id: 'reusable', label: 'Reusable Items', icon: Layers, active: true },
                     { id: 'hardware', label: 'Fixed Assets', icon: Hammer, active: true },
                     { id: 'fixtures', label: 'Fixtures', icon: Grid, active: true }
                  ].filter(t => t.active).map(tab => (
                     <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'bg-[#00ff9d] text-slate-950 shadow-lg' : 'text-white/50 hover:text-white'}`}><tab.icon size={14} /> {tab.label}</button>
                  ))}
               </div>
            </div>
         </div>

         {activeTab === 'products' && (
            <div className="space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {products.map(p => (
                     <div key={p.id} className="bg-white rounded-[3.5rem] border-2 border-slate-100 shadow-xl overflow-hidden flex flex-col group hover:border-indigo-200 transition-all h-full">
                        <div className="h-56 w-full relative overflow-hidden">
                           <img src={p.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800'} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt={p.name} />
                           <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent"></div>
                           <div className="absolute bottom-6 left-8"><span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-[9px] font-black uppercase text-white border border-white/10 tracking-widest">{p.category}</span></div>
                        </div>

                        <div className="p-8 flex-1 flex flex-col">
                           <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3 leading-tight">{p.name}</h3>
                           <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-8 line-clamp-3 italic">"{p.description}"</p>

                           <div className="mt-auto space-y-6">
                              <div className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                 <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Portion Rate</p><span className="text-lg font-black text-indigo-600">₦{(p.priceCents / 100).toLocaleString()}</span></div>
                                 <div className="flex flex-col items-end">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Set Portions</p>
                                    <div className="flex items-center gap-2">
                                       <button onClick={() => updatePortions(p.id, Math.max(1, (portionCounts[p.id] || 100) - 50))} className="p-1.5 bg-white border border-slate-200 rounded-lg hover:text-rose-500 transition-colors"><Minus size={12} /></button>
                                       <input
                                          type="number"
                                          className="w-16 bg-white border-2 border-slate-200 rounded-lg py-1 text-center text-xs font-black text-slate-950 outline-none focus:border-indigo-500 shadow-inner"
                                          value={portionCounts[p.id] || 100}
                                          onChange={(e) => updatePortions(p.id, Math.max(1, parseInt(e.target.value) || 0))}
                                       />
                                       <button onClick={() => updatePortions(p.id, (portionCounts[p.id] || 100) + 50)} className="p-1.5 bg-white border border-slate-200 rounded-lg hover:text-emerald-500 transition-colors"><Plus size={12} /></button>
                                    </div>
                                 </div>
                              </div>

                              <button
                                 onClick={() => setSelectedBoQItem(p)}
                                 className="w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3 bg-slate-900 text-white hover:bg-slate-800 shadow-lg active:scale-95"
                              >
                                 <RefreshCw size={14} /> Analyze Bill of Quantities
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {selectedBoQItem && (
            <BOQModal
               item={selectedBoQItem}
               portions={portionCounts[selectedBoQItem.id] || 100}
               onClose={() => setSelectedBoQItem(null)}
               onPortionChange={(val) => updatePortions(selectedBoQItem.id, val)}
            />
         )}

         {activeTab === 'rentals' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl">
                     <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Temporary Rental Store</h2>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Non-food items tracked per-event with liability markers</p>
                  </div>
                  <div className="bg-rose-50 p-8 rounded-[3rem] border border-rose-100 shadow-sm flex flex-col justify-center">
                     <div className="flex items-center gap-2 mb-1 text-rose-600"><ShieldAlert size={14} /><span className="text-[10px] font-black uppercase tracking-widest">Active Liability</span></div>
                     <h3 className="text-2xl font-black text-rose-700 leading-none">₦{(totalLiability / 100).toLocaleString()}</h3>
                  </div>
               </div>
               <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest"><tr><th className="px-6 py-6 text-center">S/N</th><th className="p-8">Item & Event Reference</th><th className="p-8">Qty</th><th className="p-8">Est. Liability</th><th className="p-8">Status</th><th className="p-8 text-right">Ops</th></tr></thead><tbody className="divide-y divide-slate-50">{rentals.map((rent, index) => (<tr key={rent.id} className="hover:bg-indigo-50/10 transition-all"><td className="px-6 py-6 text-center font-black text-slate-300 text-[10px]">{index + 1}</td><td className="p-8"><p className="font-black text-slate-800 uppercase text-xs">{rent.itemName}</p><p className="text-[9px] text-indigo-500 font-black uppercase tracking-tighter">Event: {events.find(e => e.id === rent.eventId)?.customerName || 'Project Node'}</p></td><td className="p-8 font-black text-slate-900">{rent.quantity}</td><td className="p-8 font-black text-rose-600">₦{(rent.estimatedReplacementValueCents / 100).toLocaleString()}</td><td className="p-8"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${rent.status === 'Issued' ? 'bg-amber-50 text-amber-700 border-amber-100' : rent.status === 'Returned' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>{rent.status}</span></td><td className="p-8 text-right">{rent.status === 'Issued' && (<button onClick={() => setSelectedRental(rent)} className="p-2.5 bg-slate-900 text-[#00ff9d] rounded-xl hover:scale-110 transition-all shadow-md"><RotateCcw size={16} /></button>)}</td></tr>))}</tbody></table></div></div>
            </div>
         )}

         {activeTab === 'ingredients' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
               <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl"><div><h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Food Ingredient Pipeline</h2><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Movement Inward (Procurement) & Current Inventory Levels</p></div><div className="flex gap-4"><button onClick={() => setIsReleaseModalOpen(true)} className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-xl hover:scale-105 transition-all"><Flame size={18} /> Kitchen Release</button><button onClick={() => setIsReceiveModalOpen(true)} className="px-8 py-4 bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-xl hover:scale-105 transition-all"><ShoppingBag size={18} className="text-[#00ff9d]" /> Inward Stock</button></div></div>
               <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest"><tr><th className="px-6 py-6 text-center font-black">S/N</th><th className="p-8">Ingredient</th><th className="p-8">Current Stock</th><th className="p-8">Base Cost</th><th className="p-8">Market Delta</th><th className="p-8 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-50">{rawMaterials.map((ing, index) => (<tr key={ing.id} className="hover:bg-indigo-50/20 transition-all"><td className="px-6 py-6 text-center font-black text-slate-300 text-[10px]">{index + 1}</td><td className="p-8"><p className="font-black text-slate-800 uppercase text-xs">{ing.name}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{ing.category}</p></td><td className="p-8"><div className="flex items-center gap-3"><span className={`text-lg font-black tracking-tighter ${ing.stockQuantity < 50 ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>{ing.stockQuantity.toLocaleString()}</span><span className="text-[10px] font-bold text-slate-400 uppercase">Input</span></div></td><td className="p-8 font-black text-slate-900 text-xs">₦{(ing.priceCents / 100).toLocaleString()}</td><td className="p-8">{ing.costPriceCents ? <div className="flex items-center gap-2"><span className="font-black text-indigo-600 text-xs">₦{(ing.costPriceCents / 100).toLocaleString()}</span>{ing.costPriceCents > ing.priceCents ? <TrendingUp size={14} className="text-rose-500" /> : <TrendingUp size={14} className="text-emerald-500 rotate-180" />}</div> : <span className="text-[9px] font-black text-slate-300 uppercase">Survey Pending</span>}</td><td className="p-8 text-right"><button className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><Zap size={16} /></button></td></tr>))}</tbody></table></div></div>
            </div>
         )}

         {activeTab === 'requisitions' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
               <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden"><div className="p-8 border-b border-slate-50 flex justify-between items-center"><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Active Requisitions Hub</h3></div><div className="p-8 space-y-6">{requisitions.map(req => (<div key={req.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-all"><div className="flex items-center gap-5"><div className={`w-12 h-12 rounded-xl flex items-center justify-center ${req.type === 'Release' ? 'bg-orange-50 text-orange-600' : req.type === 'Rental' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>{req.type === 'Release' ? <Flame size={20} /> : req.type === 'Rental' ? <RotateCcw size={20} /> : <ShoppingBag size={20} />}</div><div><p className="font-black text-slate-800 uppercase text-xs">{req.itemName}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{req.category} • Qty: {req.quantity} • Ref: {events.find(e => e.id === req.referenceId)?.customerName || req.referenceId || 'General'}</p></div></div><div className="flex items-center gap-6"><div className="text-right"><span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${req.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{req.status}</span></div>{req.status === 'Pending' && (<button onClick={() => handleApproveRelease(req.id)} className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all"><Check size={18} strokeWidth={3} /></button>)}</div></div>))}</div></div>
            </div>
         )}

         {activeTab === 'hardware' && <InventoryCatalog assets={assets} title="Fixed Asset Ledger" subtitle="Capital Equipment & Infrastructure" />}
         {activeTab === 'reusable' && <InventoryCatalog assets={reusableItems} title="Reusable Items Catalog" subtitle="Operational Inventory (Plates, Linens, etc.)" />}
         {activeTab === 'fixtures' && <InventoryCatalog assets={fixtures} title="Fixtures & Fittings" subtitle="Built-in Infrastructure" />}
         <ReceiveStockModal isOpen={isReceiveModalOpen} onClose={() => setIsReceiveModalOpen(false)} ingredients={storeIngredients} />
         <KitchenReleaseModal isOpen={isReleaseModalOpen} onClose={() => setIsReleaseModalOpen(false)} ingredients={storeIngredients} events={events} />
         <RentalReturnModal isOpen={!!selectedRental} onClose={() => setSelectedRental(null)} rental={selectedRental} />

         {showScanModal && (
            <DocumentCapture
               title="Scan Inventory List"
               mode="inventory"
               onCapture={handleScanCapture}
               onCancel={() => setShowScanModal(false)}
            />
         )}
      </div>
   );
};