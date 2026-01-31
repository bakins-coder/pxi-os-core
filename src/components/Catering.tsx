import React, { useState, useEffect, useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { CateringEvent, InventoryItem, ItemCosting, Invoice, Requisition, Contact, BanquetDetails, InvoiceStatus, DealItem } from '../types';
import { getLiveRecipeIngredientPrices } from '../services/ai';
import {
   ChefHat, CheckCircle2, Truck, X, Plus, RefreshCw, ArrowRight, Trash2, Calculator, Loader2, Globe, Sparkles,
   ArrowDownLeft, ArrowUpRight, ShoppingBag, User, Flame, UtensilsCrossed, Clock, Users, Palette, AlertCircle,
   ShoppingCart, FileText, Grid3X3, Minus, Banknote, Check, Printer, Share2, Mail
} from 'lucide-react';
import { OrderBrochure } from './OrderBrochure';

const ProcurementWizard = ({ event, onClose, onFinalize }: { event: CateringEvent, onClose: () => void, onFinalize: (inv: Invoice) => void }) => {
   const [waiterRatio, setWaiterRatio] = useState<10 | 20>(10);
   const [waiterRate, setWaiterRate] = useState(10000);
   const [vanRate, setVanRate] = useState(30000);
   const [vanCount, setVanCount] = useState(1);
   const [requisitions, setRequisitions] = useState<Partial<Requisition>[]>([]);

   useEffect(() => {
      const initialReqs: Partial<Requisition>[] = [];
      const staffNeeded = Math.ceil(event.guestCount / waiterRatio);
      initialReqs.push({
         type: 'Hiring',
         category: 'Service',
         itemName: `Wait Staff (${staffNeeded} heads)`,
         quantity: staffNeeded,
         pricePerUnitCents: waiterRate * 100,
         totalAmountCents: staffNeeded * waiterRate * 100,
         notes: `Target ratio 1:${waiterRatio} for ${event.guestCount} guests.`
      });
      initialReqs.push({
         type: 'Rental',
         category: 'Hardware',
         itemName: 'Logistics Van & Driver',
         quantity: vanCount,
         pricePerUnitCents: vanRate * 100,
         totalAmountCents: vanCount * vanRate * 100,
      });
      event.items.forEach(item => {
         initialReqs.push({
            type: 'Purchase',
            category: 'Food',
            itemName: item.name,
            quantity: item.quantity,
            pricePerUnitCents: item.priceCents * 0.4,
            totalAmountCents: item.quantity * item.priceCents * 0.4
         });
      });
      setRequisitions(initialReqs);
   }, [event, waiterRatio, waiterRate, vanRate, vanCount]);

   const updateReq = (idx: number, updates: Partial<Requisition>) => {
      const newReqs = [...requisitions];
      newReqs[idx] = { ...newReqs[idx], ...updates };
      if (updates.quantity !== undefined || updates.pricePerUnitCents !== undefined) {
         newReqs[idx].totalAmountCents = (newReqs[idx].quantity || 0) * (newReqs[idx].pricePerUnitCents || 0);
      }
      setRequisitions(newReqs);
   };

   const removeReq = (idx: number) => setRequisitions(requisitions.filter((_, i) => i !== idx));
   const totalEstimate = requisitions.reduce((sum, r) => sum + (r.totalAmountCents || 0), 0);

   const addRequisition = useDataStore(state => state.addRequisition);
   const createProcurementInvoice = useDataStore(state => state.createProcurementInvoice);

   const handleFinalizePlan = async () => {
      // 1. Submit Requisitions as Pending
      requisitions.forEach(r => addRequisition({ ...r, referenceId: event.id, status: 'Pending' }));

      // 2. Notify UI (No Invoice yet)
      alert("Requisitions submitted for Finance Approval.");
      onClose();
   };

   return (
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-2xl animate-in zoom-in duration-300">
         <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[90vh] border border-slate-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Truck size={24} /></div>
                  <div>
                     <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Procurement Engine</h2>
                     <p className="text-[10px] text-slate-500 font-black uppercase mt-1">Project: {event.customerName} • Material Fulfillment Plan</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-4 bg-slate-100 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 space-y-12">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Waiter Ratio</label>
                     <select className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none text-slate-950" value={waiterRatio} onChange={e => setWaiterRatio(parseInt(e.target.value) || 10 as any)}>
                        <option value={10}>1 Waiter : 10 Guests</option>
                        <option value={20}>1 Waiter : 20 Guests</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Waiter Rate (₦)</label>
                     <input type="number" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-950" value={waiterRate} onChange={e => setWaiterRate(parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Van Rental (₦)</label>
                     <input type="number" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-950" value={vanRate} onChange={e => setVanRate(parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Van Count</label>
                     <input type="number" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-950" value={vanCount} onChange={e => setVanCount(parseInt(e.target.value) || 0)} />
                  </div>
               </div>
               <div className="space-y-6">
                  <div className="flex justify-between items-center">
                     <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Requisition Ledger</h3>
                     <button onClick={() => updateReq(requisitions.length, { type: 'Rental', category: 'Hardware', itemName: 'External Item', quantity: 1, pricePerUnitCents: 0, totalAmountCents: 0 })} className="px-5 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg active:scale-95 transition-all"><Plus size={14} /> Add 3rd Party Rental</button>
                  </div>
                  <div className="space-y-4">
                     {requisitions.map((req, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row items-center gap-6 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm group hover:border-indigo-200 transition-all">
                           <div className="flex-1 space-y-1">
                              <input className="w-full bg-transparent font-black text-slate-800 uppercase outline-none focus:text-indigo-600" value={req.itemName} onChange={e => updateReq(idx, { itemName: e.target.value })} />
                              <div className="flex items-center gap-4">
                                 <span className="text-[9px] font-black uppercase text-slate-400">{req.type} • {req.category}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-6">
                              <div className="w-24">
                                 <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Quantity</p>
                                 <input type="number" className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-center text-slate-950" value={req.quantity} onChange={e => updateReq(idx, { quantity: parseInt(e.target.value) || 0 })} />
                              </div>
                              <div className="w-32">
                                 <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Price (₦)</p>
                                 <input type="number" className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-right text-slate-950" value={(req.pricePerUnitCents || 0) / 100} onChange={e => updateReq(idx, { pricePerUnitCents: (parseFloat(e.target.value) || 0) * 100 })} />
                              </div>
                              <div className="w-40 text-right">
                                 <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Total</p>
                                 <p className="text-sm font-black text-slate-900">₦{((req.totalAmountCents || 0) / 100).toLocaleString()}</p>
                              </div>
                              <button onClick={() => removeReq(idx)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
               <div className="bg-slate-950 p-10 rounded-[3rem] text-white flex justify-between items-center shadow-2xl">
                  <div>
                     <p className="text-xs font-black uppercase text-slate-500 tracking-widest mb-1">Total Fulfillment Estimate</p>
                     <h4 className="text-4xl font-black text-white tracking-tighter">₦{(totalEstimate / 100).toLocaleString()}</h4>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-black text-[#00ff9d] uppercase tracking-widest mb-4">Event Revenue: ₦{(event.financials.revenueCents / 100).toLocaleString()}</p>
                     <div className="flex gap-4">
                        <button onClick={onClose} className="px-8 py-4 font-black uppercase text-[10px] text-slate-400">Abort</button>
                        <button onClick={handleFinalizePlan} className="px-12 py-5 bg-[#00ff9d] text-slate-950 rounded-[2rem] font-black uppercase text-[11px] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">Submit for Finance Approval <ArrowRight size={18} /></button>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

const BOQModal = ({ item, portions, onClose, onPortionChange }: { item: InventoryItem, portions: number, onClose: () => void, onPortionChange: (val: number) => void }) => {
   const [isGrounding, setIsGrounding] = useState(false);
   const [costing, setCosting] = useState<ItemCosting | null>(null);

   const calculateItemCosting = useDataStore(state => state.calculateItemCosting);
   const recipes = useDataStore(state => state.recipes);
   const ingredients = useDataStore(state => state.ingredients);

   const updateIngredientPrice = useDataStore(state => state.updateIngredientPrice);

   const refreshCosting = () => {
      const data = calculateItemCosting(item.id, portions);
      setCosting(data);
   };

   useEffect(() => { refreshCosting(); }, [item, portions]);

   const handleGroundPrices = async () => {
      const recipe = recipes.find(r => r.id === item.recipeId);
      if (!recipe) return;
      setIsGrounding(true);
      try {
         const groundedPriceMap = await getLiveRecipeIngredientPrices(recipe);

         // Update store with new findings
         Object.entries(groundedPriceMap).forEach(([ingName, price]) => {
            const ing = ingredients.find(i => i.name.toLowerCase() === ingName.toLowerCase());
            if (ing) {
               updateIngredientPrice(ing.id, price, {
                  marketPriceCents: price,
                  groundedSummary: `Live Market Price via Google Grounding: ₦${(price / 100).toLocaleString()}`,
                  sources: [{ title: 'Google Search Market Data', uri: 'https://google.com' }]
               });
            }
         });

         // Allow store update to propagate then refresh local calculation
         setTimeout(() => refreshCosting(), 100);

      } catch (e) {
         console.error(e);
      } finally {
         setIsGrounding(false);
      }
   };

   return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
         <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in duration-300 max-h-[90vh]">
            <div className="p-8 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Calculator size={24} /></div>
                  <div>
                     <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Neural BoQ Analysis</h2>
                     <p className="text-[10px] text-slate-500 font-black uppercase mt-1 tracking-widest">{item.name} • Intelligence Node</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-3 bg-white border border-slate-200 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm"><X size={24} /></button>
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
                           <th className="px-8 py-5">Net Requirement</th>
                           <th className="px-8 py-5 text-right">Unit Rate</th>
                           <th className="px-8 py-5 text-right">Ext. Value (₦)</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-indigo-50">
                        {(costing?.ingredientBreakdown || []).map((ing: any, idx: number) => (
                           <tr key={idx} className="hover:bg-indigo-50/30 transition-all">
                              <td className="px-8 py-5">
                                 <div className="flex items-center gap-2">
                                    <span className="font-black text-slate-800 uppercase text-xs">{ing.name}</span>
                                    {ing.isGrounded && <span className="p-1 bg-emerald-100 text-emerald-600 rounded-md" title="Gemini Grounded"><Sparkles size={8} /></span>}
                                 </div>
                              </td>
                              <td className="px-8 py-5 font-bold text-slate-500 text-xs">{ing.qtyRequired.toFixed(2)} {ing.unit}</td>
                              <td className="px-8 py-5 text-right font-mono text-slate-400">₦{(ing.unitCostCents / 100).toLocaleString()}</td>
                              <td className="px-8 py-5 text-right font-black text-slate-900 text-sm">₦{(ing.totalCostCents / 100).toLocaleString()}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-8 bg-slate-950 rounded-[2rem] text-white">
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Aggregate Cost</p>
                     <h5 className="text-2xl font-black">₦{((costing?.totalIngredientCostCents || 0) / 100).toLocaleString()}</h5>
                  </div>
                  <div className="p-8 bg-indigo-50 rounded-[2rem] border border-indigo-100">
                     <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Projected Revenue</p>
                     <h5 className="text-2xl font-black text-indigo-900">₦{((costing?.revenueCents || 0) / 100).toLocaleString()}</h5>
                  </div>
                  <div className="p-8 bg-white border-2 border-slate-100 rounded-[2rem]">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Gross Margin</p>
                     <h5 className={`text-2xl font-black ${(costing?.grossMarginPercentage ?? 0) > 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {(costing?.grossMarginPercentage || 0).toFixed(1)}%
                     </h5>
                  </div>
               </div>
            </div>

            <div className="p-8 border-t-2 border-slate-100 bg-slate-50/50 flex justify-end">
               <button onClick={onClose} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Close Analysis</button>
            </div>
         </div>
      </div>
   );
};



const EventNodeSummary = ({ event, onAmend }: { event: CateringEvent, onAmend: (ev: CateringEvent) => void }) => {
   const estimatedCost = event.financials.revenueCents * 0.4;
   const estimatedNet = event.financials.revenueCents - estimatedCost;

   const deductStockFromCooking = useDataStore(state => state.deductStockFromCooking);

   const handleCook = () => {
      if (confirm("Proceed to deduct ingredient stock for this event production?")) {
         deductStockFromCooking(event.id);
      }
   };

   const requisitions = useDataStore(state => state.requisitions);
   const createProcurementInvoice = useDataStore(state => state.createProcurementInvoice);

   const eventRequisitions = requisitions.filter(r => r.referenceId === event.id);
   const procurementStatus = eventRequisitions.length === 0 ? 'None'
      : eventRequisitions.every(r => r.status === 'Approved') ? 'Approved'
         : 'Pending';

   const handleGeneratePO = async () => {
      await createProcurementInvoice(event.id, eventRequisitions);
      alert("Purchase Order Generated. Event moved to Execution.");
   };

   return (
      <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-4 space-y-12">
         <div className="flex justify-between items-start">
            <div className="space-y-4">
               <div className="flex gap-4">
                  <button onClick={() => onAmend(event)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 items-center">
                     <FileText size={14} /> Amend Record
                  </button>
                  <button onClick={handleCook} className="px-6 py-2 bg-rose-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-rose-700 transition-all flex items-center gap-2 items-center">
                     <Flame size={14} /> Production Run
                  </button>
               </div>
               <div>
                  <h3 className="text-4xl font-black text-slate-800 uppercase tracking-tighter leading-none">{event.customerName}</h3>
                  <div className="flex items-center gap-4 mt-4">
                     <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border-2 ${event.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>{event.status}</span>
                     <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{event.eventDate} • {event.location || 'Venue TBD'}</p>
                  </div>
               </div>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Portions Booked</p>
               <p className="text-3xl font-black text-slate-900">{event.guestCount}</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Gross Revenue</p>
               <h4 className="text-2xl font-black text-slate-900">₦{(event.financials.revenueCents / 100).toLocaleString()}</h4>
            </div>
            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Est. Direct Costs</p>
               <h4 className="text-2xl font-black text-rose-600">₦{(estimatedCost / 100).toLocaleString()}</h4>
            </div>
            <div className="p-8 bg-slate-950 rounded-[2.5rem] shadow-xl">
               <p className="text-[10px] font-black text-[#00ff9d] uppercase tracking-widest mb-3">Projected Net</p>
               <h4 className="text-2xl font-black text-white">₦{(estimatedNet / 100).toLocaleString()}</h4>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section>
               <div className="flex items-center gap-4 mb-8">
                  <h4 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Banquet Menu Roster</h4>
                  <div className="h-px flex-1 bg-slate-100"></div>
               </div>
               <div className="grid grid-cols-1 gap-4">
                  {event.items.map((item, idx) => (
                     <div key={idx} className="p-6 bg-white border-2 border-slate-50 rounded-3xl flex justify-between items-center group hover:border-indigo-100 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all"><UtensilsCrossed size={18} /></div>
                           <div>
                              <p className="font-black text-slate-800 uppercase text-sm tracking-tight">{item.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Fixed Portion Multiplier</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="font-black text-lg text-slate-900">{item.quantity}</p>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Qty</p>
                        </div>
                     </div>
                  ))}
               </div>
            </section>

            <section>
               <div className="flex items-center gap-4 mb-8">
                  <h4 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Coordination Intel</h4>
                  <div className="h-px flex-1 bg-slate-100"></div>
               </div>
               <div className="space-y-4">
                  {event.banquetDetails?.eventPlanner && (
                     <div className="p-6 bg-slate-900 border border-[#00ff9d]/20 rounded-3xl shadow-xl">
                        <div className="flex items-center gap-3 mb-2">
                           <User size={14} className="text-[#00ff9d]" />
                           <p className="text-[9px] font-black text-[#00ff9d] uppercase tracking-widest">Lead Planner</p>
                        </div>
                        <p className="text-lg font-black text-white uppercase tracking-tight">{event.banquetDetails.eventPlanner}</p>
                     </div>
                  )}
                  {event.banquetDetails?.notes && (
                     <div className="p-6 bg-white border-2 border-slate-100 rounded-3xl">
                        <div className="flex items-center gap-3 mb-2">
                           <FileText size={14} className="text-indigo-600" />
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Operational Notes</p>
                        </div>
                        <p className="text-sm font-medium text-slate-600 leading-relaxed italic">"{event.banquetDetails.notes}"</p>
                     </div>
                  )}
               </div>
            </section>
         </div>

         <div className="pt-8 border-t border-slate-100 flex flex-wrap gap-4 justify-between items-center">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><Clock size={20} /></div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Workflow Phase</p>
                  <p className="text-lg font-black text-indigo-900 uppercase tracking-tighter">{event.currentPhase}</p>
               </div>
            </div>
            <div className="flex gap-4">
               {event.currentPhase === 'Procurement' && procurementStatus === 'None' && (
                  <button onClick={() => window.dispatchEvent(new CustomEvent('open-procurement'))} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all">
                     <Truck size={18} /> Plan Fulfillment Execution
                  </button>
               )}
               {event.currentPhase === 'Procurement' && procurementStatus === 'Pending' && (
                  <div className="flex items-center gap-3 px-8 py-4 bg-amber-50 text-amber-600 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-amber-100">
                     <Clock size={18} className="animate-pulse" /> Awaiting Finance Approval
                  </div>
               )}
               {event.currentPhase === 'Procurement' && procurementStatus === 'Approved' && (
                  <button onClick={handleGeneratePO} className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all">
                     <CheckCircle2 size={18} /> Generate Purchase Order
                  </button>
               )}
               {event.currentPhase === 'Execution' && (
                  <button onClick={handleCook} className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all">
                     <Flame size={18} /> Confirm Kitchen Production
                  </button>
               )}
            </div>
         </div>
      </div>
   );
};

const WaveInvoiceModal = ({ invoice, onSave, onClose }: { invoice: Invoice, onSave: (inv: Invoice) => void, onClose: () => void }) => {
   const isPurchase = invoice.type === 'Purchase';
   const { settings: org } = useSettingsStore();

   return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in zoom-in duration-200">
         <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-slate-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div className="flex items-center gap-4">
                  {org.logo && <img src={org.logo} alt="Organization Logo" className="w-12 h-12 rounded-xl object-contain bg-white p-1 shadow-sm" />}
                  <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${isPurchase ? 'bg-rose-500' : 'bg-indigo-600'}`}>
                        {isPurchase ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                     </div>
                     <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                           {isPurchase ? 'Expenditure' : 'Sales Invoice'}
                        </h2>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{org.name}</p>
                     </div>
                  </div>
               </div>
               <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-xl transition-all"><X size={24} /></button>
            </div>
            <div className="p-10 space-y-8 overflow-y-auto max-h-[60vh] scrollbar-thin WaveInvoiceContent">
               <div className="flex justify-between items-start">
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Serial Number</p>
                     <p className="text-xl font-black text-slate-900">#{invoice.number}</p>
                     <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase italic">{new Date(invoice.date).toLocaleDateString('en-GB')}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                     <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${isPurchase ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                        {isPurchase ? 'UNPAID SPEND' : invoice.status}
                     </span>
                  </div>
               </div>

               {/* Event Summary Section */}
               <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                  <div className="flex items-center gap-2">
                     <Sparkles size={16} className="text-indigo-600" />
                     <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Event Specification</p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                     <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Reference ID</p>
                        <p className="text-sm font-black text-slate-800 uppercase">{invoice.id}</p>
                     </div>
                     <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Category</p>
                        <p className="text-sm font-black text-slate-800 uppercase">Hospitality Node</p>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-8 text-[10px] py-4 border-y border-slate-50">
                  <div className="space-y-1">
                     <p className="font-black text-slate-400 uppercase tracking-widest">From:</p>
                     <p className="font-black text-slate-800 uppercase">{org.name}</p>
                     <p className="text-slate-500 font-medium leading-relaxed">{org.address}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="font-black text-slate-400 uppercase tracking-widest">Beneficiary:</p>
                     <p className="font-black text-slate-800 uppercase">{invoice.companyId === org.id ? 'Client Node' : org.name}</p>
                     <p className="text-slate-500 font-medium italic">Reference ID: {invoice.id}</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Allocation Breakdown</p>
                  {invoice.lines.map((line, idx) => (
                     <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50">
                        <div>
                           <p className="text-sm font-black text-slate-800 uppercase">{line.description}</p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase">{line.quantity} Unit(s) @ ₦{(line.unitPriceCents / 100).toLocaleString()}</p>
                        </div>
                        <p className="text-sm font-black text-slate-900">₦{((line.quantity * line.unitPriceCents) / 100).toLocaleString()}</p>
                     </div>
                  ))}
               </div>

               <div className="pt-6 flex justify-between items-center bg-slate-50 -mx-10 px-10 py-6 border-y border-slate-100">
                  <p className="text-lg font-black text-slate-900 uppercase tracking-tight">Net Aggregated Value</p>
                  <p className={`text-3xl font-black ${isPurchase ? 'text-rose-600' : 'text-indigo-600'}`}>₦{(invoice.totalCents / 100).toLocaleString()}</p>
               </div>

               {!isPurchase && org.bankInfo && (
                  <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 space-y-4">
                     <div className="flex items-center gap-2">
                        <Banknote size={16} className="text-indigo-600" />
                        <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Settlement Instructions</p>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Bank Entity</p>
                           <p className="text-sm font-black text-slate-900 uppercase">{org.bankInfo.bankName}</p>
                        </div>
                        <div>
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Account Number</p>
                           <p className="text-sm font-black text-slate-900 tracking-widest">{org.bankInfo.accountNumber}</p>
                        </div>
                        <div className="col-span-2">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Account Name</p>
                           <p className="text-sm font-black text-slate-900 uppercase">{org.bankInfo.accountName}</p>
                        </div>
                     </div>
                  </div>
               )}
            </div>
            <div className="p-8 border-t border-slate-100 bg-white flex flex-col gap-4">
               <div className="flex gap-4">
                  <button
                     onClick={() => {
                        const win = window.open('', '_blank');
                        win?.document.write(`<html><head><title>Invoice #${invoice.number}</title><style>body{font-family:sans-serif;padding:40px;}</style></head><body>${document.querySelector('.WaveInvoiceContent')?.innerHTML || ''}</body></html>`);
                        win?.print();
                     }}
                     className="flex-1 py-4 bg-slate-100 text-slate-800 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                     <Printer size={16} /> Print
                  </button>
                  <button
                     onClick={() => window.open(`https://wa.me/?text=Invoice%20${invoice.number}%20Summary:%20₦${(invoice.totalCents / 100).toLocaleString()}`, '_blank')}
                     className="flex-1 py-4 bg-emerald-100 text-emerald-800 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-200 transition-all flex items-center justify-center gap-2"
                  >
                     <Share2 size={16} /> WhatsApp
                  </button>
                  <button
                     onClick={() => window.location.href = `mailto:?subject=Invoice ${invoice.number}&body=Total: ₦${(invoice.totalCents / 100).toLocaleString()}`}
                     className="flex-1 py-4 bg-indigo-100 text-indigo-800 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-200 transition-all flex items-center justify-center gap-2"
                  >
                     <Mail size={16} /> Email
                  </button>
               </div>
               <div className="flex gap-4">
                  <button onClick={onClose} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-200">Amend Items</button>
                  <button onClick={() => onSave(invoice)} className={`flex-[2] py-4 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all ${isPurchase ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-950 hover:bg-slate-800'}`}>
                     Commit to OS Ledger <ArrowRight size={16} />
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
};

const CostingMatrix = () => {
   const [costings, setCostings] = useState<ItemCosting[]>([]);
   const [isProcessing, setIsProcessing] = useState(false);

   const inventory = useDataStore(state => state.inventory);
   const calculateItemCosting = useDataStore(state => state.calculateItemCosting);

   useEffect(() => {
      const items = inventory.filter(i => i.type === 'product');
      const mockCostings = items.map(i => calculateItemCosting(i.id, 100)).filter(Boolean) as ItemCosting[];
      setCostings(mockCostings);
   }, [inventory]);

   return (
      <div className="space-y-8 animate-in fade-in">
         <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
            <div className="flex justify-between items-center mb-10">
               <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Yield & Costing Matrix</h2>
                  <p className="text-[10px] text-slate-400 font-black uppercase mt-2">Institutional benchmark: 40% Food Cost Target</p>
               </div>
               <button
                  onClick={() => {
                     setIsProcessing(true);
                     setTimeout(() => setIsProcessing(false), 1000);
                  }}
                  className="p-3 bg-slate-950 text-[#00ff9d] rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all"
               >
                  <RefreshCw size={20} className={isProcessing ? 'animate-spin' : ''} />
               </button>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[9px] tracking-[0.2em]">
                     <tr>
                        <th className="px-8 py-4">Offering Name</th>
                        <th className="px-8 py-4 text-right">Revenue/100</th>
                        <th className="px-8 py-4 text-right">Est. Cost</th>
                        <th className="px-8 py-4 text-right">Gross Margin</th>
                        <th className="px-8 py-4 text-center">Efficiency</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {costings.map((c, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-all">
                           <td className="px-8 py-5 font-black text-slate-800 uppercase text-xs">{c.name}</td>
                           <td className="px-8 py-5 text-right font-black text-slate-900">₦{(c.revenueCents / 100).toLocaleString()}</td>
                           <td className="px-8 py-5 text-right font-black text-rose-500">₦{(c.totalIngredientCostCents / 100).toLocaleString()}</td>
                           <td className="px-8 py-5 text-right font-black text-emerald-600">₦{(c.grossMarginCents / 100).toLocaleString()}</td>
                           <td className="px-8 py-5">
                              <div className="flex flex-col items-center gap-1">
                                 <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-600" style={{ width: `${c.grossMarginPercentage}%` }}></div>
                                 </div>
                                 <span className="text-[9px] font-black text-slate-500">{c.grossMarginPercentage.toFixed(1)}%</span>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
   );
};

export const Catering = () => {
   const [events, setEvents] = useState<CateringEvent[]>([]);
   const [selectedEvent, setSelectedEvent] = useState<CateringEvent | null>(null);
   const [amendEvent, setAmendEvent] = useState<CateringEvent | null>(null);
   const [showBrochure, setShowBrochure] = useState(false);
   const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null);
   const [activeTab, setActiveTab] = useState<'orders' | 'matrix'>('orders');
   const [showProcurement, setShowProcurement] = useState(false);

   const cateringEvents = useDataStore(state => state.cateringEvents);
   const approveInvoice = useDataStore(state => state.approveInvoice);

   useEffect(() => {
      setEvents(cateringEvents);
      if (selectedEvent) {
         const freshSelected = cateringEvents.find(e => e.id === selectedEvent.id);
         if (freshSelected) setSelectedEvent(freshSelected);
      }
   }, [cateringEvents, selectedEvent]);

   useEffect(() => {
      const handleProcOpen = () => setShowProcurement(true);
      window.addEventListener('open-procurement', handleProcOpen);

      return () => {
         window.removeEventListener('open-procurement', handleProcOpen);
      };
   }, []);

   const handleFinalizePush = (invoice: Invoice) => {
      setGeneratedInvoice(invoice);
   };

   const handleCommitInvoice = (inv: Invoice) => {
      approveInvoice(inv.id);
      setGeneratedInvoice(null);
      // Auto-select the newest event if none is currently viewed
      if (!selectedEvent && cateringEvents.length > 0) {
         setSelectedEvent(cateringEvents[0]);
      }
   };

   return (
      <div className="space-y-8 animate-in fade-in pb-24">
         <div className="bg-slate-950 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff6b6b]/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-[#ff6b6b] rounded-3xl flex items-center justify-center shadow-2xl animate-float"><ChefHat size={36} className="text-white" /></div>
                  <div><h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Catering Operations</h1><p className="text-[10px] text-slate-500 font-black uppercase mt-1 tracking-widest">Banquet Management Node Active</p></div>
               </div>
               <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md gap-2">
                  <button
                     onClick={() => {
                        const url = `${window.location.origin}/#/brochure`;
                        navigator.clipboard.writeText(url);
                        alert('Brochure Link Copied to Clipboard!');
                     }}
                     className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 text-[#00ff9d] hover:bg-white/5"
                  >
                     <Share2 size={14} /> Share Booking Link
                  </button>
                  <div className="w-px bg-white/10 my-2"></div>
                  {[{ id: 'orders', label: 'Banquets', icon: ShoppingBag }, { id: 'matrix', label: 'Costing Matrix', icon: Grid3X3 }].map(tab => (
                     <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-[#ff6b6b] text-white shadow-lg' : 'text-white/50 hover:text-white'}`}><tab.icon size={14} /> {tab.label}</button>
                  ))}
               </div>
            </div>
         </div>

         {activeTab === 'orders' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
               <div className="lg:col-span-1 space-y-6">
                  <div className="flex justify-between items-center px-4"><h2 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em]">Active Banquets</h2><button onClick={() => setShowBrochure(true)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-xl active:scale-95 hover:bg-slate-800 transition-all"><Plus size={16} /> Create Banquet</button></div>
                  {events.map(ev => (
                     <div key={ev.id} onClick={() => setSelectedEvent(ev)} className={`p-8 rounded-[3rem] border-2 transition-all cursor-pointer ${selectedEvent?.id === ev.id ? 'border-[#ff6b6b] bg-white shadow-2xl' : 'border-slate-50 bg-white hover:border-indigo-100'}`}>
                        <div className="flex justify-between items-start mb-4"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${ev.status === 'Confirmed' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-700'}`}>{ev.status}</span><span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{ev.currentPhase}</span></div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none mb-2">{ev.customerName}</h3>
                        <div className="flex justify-between items-center"><p className="text-xs text-slate-500 font-bold uppercase">{ev.guestCount} Guests</p><span className="text-sm font-black text-indigo-600">₦{(ev.financials.revenueCents / 100).toLocaleString()}</span></div>
                     </div>
                  ))}
               </div>
               <div className="lg:col-span-2">
                  {selectedEvent ? (
                     <EventNodeSummary
                        event={selectedEvent}
                        onAmend={(ev) => {
                           setAmendEvent(ev);
                           setShowBrochure(true);
                        }}
                     />
                  ) : (
                     <div className="flex-1 flex flex-col items-center justify-center h-[500px] text-slate-200"><ChefHat size={64} className="opacity-10 animate-float" /><p className="text-lg font-black uppercase tracking-widest opacity-20 mt-4">Select a banquet record</p></div>
                  )}
               </div>
            </div>
         )}
         {activeTab === 'matrix' && <CostingMatrix />}

         {/* UI Overlays */}
         {showBrochure && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
               <OrderBrochure
                  initialEvent={amendEvent || undefined}
                  onComplete={() => {
                     setShowBrochure(false);
                     setAmendEvent(null);
                  }}
                  onFinalize={(inv) => {
                     setShowBrochure(false);
                     setAmendEvent(null);
                     handleFinalizePush(inv);
                  }}
               />
            </div>
         )}

         {generatedInvoice && (
            <WaveInvoiceModal
               invoice={generatedInvoice}
               onSave={handleCommitInvoice}
               onClose={() => setGeneratedInvoice(null)}
            />
         )}

         {showProcurement && selectedEvent && (
            <ProcurementWizard
               event={selectedEvent}
               onClose={() => setShowProcurement(false)}
               onFinalize={handleFinalizePush}
            />
         )}
      </div>
   );
};
