import React, { useState, useEffect, useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { CateringEvent, InventoryItem, ItemCosting, Invoice, Requisition, Contact, BanquetDetails, InvoiceStatus, DealItem } from '../types';
import { getLiveRecipeIngredientPrices } from '../services/ai';
import {
   ChefHat, CheckCircle2, Truck, X, Plus, RefreshCw, ArrowRight, Trash2, Calculator, Loader2, Globe, Sparkles,
   Clock, Users, Palette, AlertCircle, Activity, Box,
   ShoppingCart, FileText, Grid3X3, Minus, Banknote, Check, Printer, Share2, Mail, Flag,
   ShoppingBag, User, Flame, UtensilsCrossed, ArrowDownLeft, ArrowUpRight, Info
} from 'lucide-react';
import { OrderBrochure } from './OrderBrochure';
import { PortionMonitor } from './PortionMonitor';
import { generateHandoverReport } from '../utils/exportUtils';
import { ManualInvoiceModal } from './Finance';

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
               <div className="bg-slate-950 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-start md:items-center shadow-2xl gap-6 md:gap-0">
                  <div>
                     <p className="text-[10px] md:text-xs font-black uppercase text-slate-500 tracking-widest mb-1">Total Fulfillment Estimate</p>
                     <h4 className="text-3xl md:text-4xl font-black text-white tracking-tighter">₦{(totalEstimate / 100).toLocaleString()}</h4>
                  </div>
                  <div className="text-left md:text-right w-full md:w-auto">
                     <p className="text-[10px] font-black text-[#00ff9d] uppercase tracking-widest mb-4">Event Revenue: ₦{(event.financials.revenueCents / 100).toLocaleString()}</p>
                     <div className="flex flex-col md:flex-row gap-4">
                        <button onClick={onClose} className="px-8 py-4 font-black uppercase text-[10px] text-slate-400 bg-slate-900 rounded-xl md:bg-transparent text-center">Abort</button>
                        <button onClick={handleFinalizePlan} className="px-8 py-4 md:px-12 md:py-5 bg-[#00ff9d] text-slate-950 rounded-xl md:rounded-[2rem] font-black uppercase text-[10px] md:text-[11px] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 w-full md:w-auto">Submit for Finance <ArrowRight size={16} /></button>
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

   const groupedBreakdown = useMemo(() => {
      if (!costing) return {};
      const groups: Record<string, any[]> = {};
      costing.ingredientBreakdown.forEach(ing => {
         const groupName = ing.subRecipeGroup || item.name;
         if (!groups[groupName]) groups[groupName] = [];
         groups[groupName].push(ing);
      });
      return groups;
   }, [costing, item.name]);

   const aggregates = useMemo(() => {
      if (!costing) return [];
      const aggs: Record<string, { name: string, qty: number, unit: string, cost: number }> = {};
      costing.ingredientBreakdown.forEach(ing => {
         const key = `${ing.name}-${ing.unit}`;
         if (!aggs[key]) aggs[key] = { name: ing.name, qty: 0, unit: ing.unit, cost: 0 };
         aggs[key].qty += ing.qtyRequired;
         aggs[key].cost += ing.totalCostCents;
      });
      return Object.values(aggs).sort((a, b) => b.cost - a.cost);
   }, [costing]);

   const handleGroundPrices = async () => {
      const recipe = recipes.find(r => r.id === item.recipeId);
      if (!recipe) return;
      setIsGrounding(true);
      try {
         const groundedPriceMap = await getLiveRecipeIngredientPrices(recipe);

         // Update store with new findings
         Object.entries(groundedPriceMap).forEach(([ingName, price]) => {
            const ing = ingredients.find(i => i.name.toLowerCase().trim() === ingName.toLowerCase().trim());
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
            <div className="p-4 md:p-8 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div className="flex items-center gap-2 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg"><Calculator size={20} className="md:w-6 md:h-6" /></div>
                  <div>
                     <h2 className="text-lg md:text-2xl font-black text-slate-900 uppercase tracking-tighter">Neural BoQ Analysis</h2>
                     <p className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase mt-0.5 tracking-widest">{item.name} • Intelligence Node</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-2 md:p-3 bg-white border border-slate-200 hover:bg-rose-500 hover:text-white rounded-xl md:rounded-2xl transition-all shadow-sm"><X size={20} className="md:w-6 md:h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-6 md:space-y-10 scrollbar-thin">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                  <div className="space-y-3 md:space-y-4">
                     <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 block">Portion Multiplier</label>
                     <div className="flex items-center gap-2 md:gap-4 bg-slate-100 p-1.5 md:p-2 rounded-xl md:rounded-[2rem] border border-slate-200">
                        <button onClick={() => onPortionChange(Math.max(1, portions - 50))} className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-lg md:rounded-full flex items-center justify-center hover:text-rose-500 transition-all shadow-sm"><Minus size={16} /></button>
                        <input
                           type="number"
                           className="flex-1 bg-transparent text-center text-xl md:text-3xl font-black text-slate-900 outline-none"
                           value={portions}
                           onChange={(e) => onPortionChange(Math.max(1, parseInt(e.target.value) || 0))}
                        />
                        <button onClick={() => onPortionChange(portions + 50)} className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-lg md:rounded-full flex items-center justify-center hover:text-emerald-500 transition-all shadow-sm"><Plus size={16} /></button>
                     </div>
                  </div>
                  <div className="flex items-end">
                     <button
                        onClick={handleGroundPrices}
                        disabled={isGrounding}
                        className={`w-full py-3.5 md:py-5 rounded-xl md:rounded-[2rem] font-black uppercase text-[10px] md:text-[11px] tracking-widest transition-all flex items-center justify-center gap-2 md:gap-3 ${isGrounding ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-[#00ff9d] shadow-xl hover:scale-[1.02] active:scale-95'}`}
                     >
                        {isGrounding ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
                        {isGrounding ? 'Grounding...' : 'Ground Market Prices via AI'}
                     </button>
                  </div>
               </div>

               <div className="space-y-8">
                  {Object.entries(groupedBreakdown).map(([groupName, items], gIdx) => (
                     <div key={gIdx} className="bg-white rounded-[2.5rem] border-2 border-indigo-50 shadow-xl overflow-hidden">
                        <div className="px-6 py-4 md:px-8 bg-indigo-50/50 border-b border-indigo-100 flex justify-between items-center">
                           <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">{groupName}</span>
                           <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{items.length} Ingredients</span>
                        </div>
                        <div className="overflow-x-auto no-scrollbar">
                           <table className="w-full text-left text-[11px] min-w-full">
                              <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[8px] tracking-widest">
                                 <tr>
                                    <th className="px-4 py-3 md:px-8 md:py-4">Ingredient</th>
                                    <th className="px-4 py-3 md:px-8 md:py-4 text-center">Net Req.</th>
                                    <th className="px-4 py-3 md:px-8 md:py-4 text-right hidden md:table-cell">Unit Rate</th>
                                    <th className="px-4 py-3 md:px-8 md:py-4 text-right">Value (₦)</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                 {items.map((ing, idx) => (
                                    <tr key={idx} className="hover:bg-indigo-50/30 transition-all border-b border-slate-50 last:border-0">
                                       <td className="px-4 py-3 md:px-8 md:py-5">
                                          <div className="flex items-center gap-1.5 md:gap-2">
                                             <span className="font-black text-slate-800 uppercase text-[10px] md:text-xs leading-tight">{ing.name}</span>
                                             {ing.isGrounded && <span className="p-1 bg-emerald-100 text-emerald-600 rounded-md" title="Gemini Grounded"><Sparkles size={8} /></span>}
                                          </div>
                                          {ing.scalingTierUsed && <p className="text-[7px] md:text-[8px] text-indigo-400 font-bold uppercase mt-0.5">{ing.scalingTierUsed}</p>}
                                       </td>
                                       <td className="px-4 py-3 md:px-8 md:py-5 font-bold text-slate-500 text-[10px] md:text-xs text-center whitespace-nowrap">
                                          <span className="bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                                             {ing.qtyRequired.toFixed(2)} <span className="text-[8px] md:text-[10px] opacity-50">{ing.unit}</span>
                                          </span>
                                       </td>
                                       <td className="px-4 py-3 md:px-8 md:py-5 text-right font-mono text-slate-400 text-[10px] md:text-xs hidden md:table-cell">₦{(ing.unitCostCents / 100).toLocaleString()}</td>
                                       <td className="px-4 py-3 md:px-8 md:py-5 text-right font-black text-slate-900 text-xs md:text-sm">₦{(ing.totalCostCents / 100).toLocaleString()}</td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  ))}

                  <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden mt-12">
                     <div className="px-6 py-4 md:px-8 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Ingredient Aggregate Summary</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Consolidated</span>
                     </div>
                     <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-[11px] min-w-full">
                           <thead className="bg-slate-800 text-slate-400 font-black uppercase text-[8px] tracking-widest">
                              <tr>
                                 <th className="px-4 py-3 md:px-8 md:py-4">Component</th>
                                 <th className="px-4 py-3 md:px-8 md:py-4 text-center">Net Requirement</th>
                                 <th className="px-4 py-3 md:px-8 md:py-4 text-right">Cost (₦)</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-800">
                              {aggregates.map((agg, idx) => (
                                 <tr key={idx} className="hover:bg-slate-800/30 transition-all border-b border-slate-800/50">
                                    <td className="px-4 py-3 md:px-8 md:py-4 font-black text-slate-200 uppercase">{agg.name}</td>
                                    <td className="px-4 py-3 md:px-8 md:py-4 text-center text-slate-400 font-bold">{agg.qty.toFixed(2)} <span className="text-[9px] opacity-50 uppercase">{agg.unit}</span></td>
                                    <td className="px-4 py-3 md:px-8 md:py-4 text-right font-black text-emerald-400 text-xs md:text-sm">₦{(agg.cost / 100).toLocaleString()}</td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
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

            <div className="p-4 md:p-8 border-t-2 border-slate-100 bg-slate-50/50 flex justify-end">
               <button onClick={onClose} className="w-full md:w-auto px-10 py-3.5 md:py-4 bg-slate-900 text-white rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Close Analysis</button>
            </div>
         </div>
      </div>
   );
};



const WaveInvoiceModal = ({ invoice, onSave, onClose }: { invoice: Invoice, onSave: (inv: Invoice) => void, onClose: () => void }) => {
   const isPurchase = invoice.type === 'Purchase';
   const { settings: org } = useSettingsStore();
   const contacts = useDataStore(state => state.contacts);
   const contact = contacts.find(c => c.id === invoice.contactId);

   // Helper for currency formatting
   const formatCurrency = (cents: number) => `₦${(cents / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

   return (
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in zoom-in duration-200">
         <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl flex flex-col h-[90vh] overflow-hidden">

            {/* INVOICE DOCUMENT SCROLLABLE AREA */}
            <div className="flex-1 overflow-y-auto scrollbar-thin bg-white WaveInvoiceContent p-8 md:p-12 relative">

               {/* 1. Header */}
               <div className="flex justify-between items-start mb-6">
                  {/* Logo Area */}
                  <div className="w-64">
                     {/* Explicitly using the new uploaded branding asset */}
                     <img src="/xquisite-logo-full.png" alt="Xquisite Celebrations" className="w-full object-contain" />
                  </div>
                  {/* Company Name */}
                  <div className="text-right">
                     <h2 className="text-sm font-bold text-slate-900">{org.name || 'Xquisite Celebrations Limited'}</h2>
                  </div>
               </div>

               {/* Orange Divider */}
               <div className="h-1 w-full bg-orange-400 mb-10"></div>

               {/* 2. Info Section (Bill To & Invoice Details) */}
               <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-12">

                  {/* Bill To */}
                  <div className="flex-1">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">BILL TO</p>
                     <div className="space-y-1">
                        <h3 className="text-xl font-bold text-slate-900">{contact?.name || invoice.contactId || 'Valued Customer'}</h3>
                        <p className="text-sm text-slate-500">{contact?.email}</p>
                        <p className="text-sm text-slate-500 max-w-[200px]">{contact?.address || 'Address on file'}</p>
                     </div>
                  </div>

                  {/* Invoice Meta */}
                  <div className="flex-[0.8] flex flex-col items-end">
                     {/* Orange Invoice Box */}
                     <div className="border-2 border-orange-400 px-6 py-2 rounded-lg mb-6 transform -rotate-2">
                        <span className="text-xl md:text-2xl font-black text-orange-500 uppercase tracking-widest text-opacity-80">INVOICE</span>
                     </div>

                     {/* Details Grid */}
                     <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-right">
                        <span className="text-xs font-bold text-slate-500">Invoice Number:</span>
                        <span className="text-xs font-bold text-slate-900">{invoice.number}</span>

                        <span className="text-xs font-bold text-slate-500">Invoice Date:</span>
                        <span className="text-xs font-bold text-slate-900">{new Date(invoice.date).toLocaleDateString('en-US')}</span>

                        <span className="text-xs font-bold text-slate-500">Payment Due:</span>
                        <span className="text-xs font-bold text-slate-900">{new Date(invoice.dueDate).toLocaleDateString('en-US') || 'On Receipt'}</span>
                     </div>
                  </div>
               </div>

               {/* 3. Items Table */}
               <div className="mb-12">
                  <div className="grid grid-cols-[3fr_1fr_1fr_1fr] border-b-2 border-slate-100 pb-2 mb-4">
                     <span className="text-[10px] font-black text-slate-400 uppercase">ITEMS</span>
                     <span className="text-[10px] font-black text-slate-400 uppercase text-center">QTY</span>
                     <span className="text-[10px] font-black text-slate-400 uppercase text-right">PRICE</span>
                     <span className="text-[10px] font-black text-slate-400 uppercase text-right">AMOUNT</span>
                  </div>

                  <div className="space-y-4">
                     {(!invoice.lines || invoice.lines.length === 0) ? (
                        <p className="text-center text-sm text-slate-300 italic py-4">No items billed.</p>
                     ) : (
                        invoice.lines.map((line, idx) => (
                           <div key={idx} className="grid grid-cols-[3fr_1fr_1fr_1fr] items-start text-sm">
                              <span className="text-slate-800 font-medium pr-4">{line.description}</span>
                              <span className="text-slate-600 text-center">{line.quantity}</span>
                              <span className="text-slate-600 text-right">{formatCurrency(line.unitPriceCents)}</span>
                              <span className="text-slate-900 font-bold text-right">{formatCurrency(line.quantity * line.unitPriceCents)}</span>
                           </div>
                        ))
                     )}
                  </div>
               </div>

               {/* 4. Payment Information & Terms (Footer) */}
               <div className="border-t-2 border-orange-400 pt-8 mt-8">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-12">
                     {/* Left Side: Payment Details & Terms */}
                     <div className="flex-1 space-y-8">

                        {/* Payment Section */}
                        <div>
                           <h3 className="font-bold text-slate-900 mb-2">Payment Information</h3>
                           <p className="text-xs text-slate-500 mb-4">Thank you for your patronage. Please make all payment transfers to: <br /><span className="font-black text-slate-900">XQUISITE CELEBRATIONS LIMITED</span></p>

                           <p className="text-xs font-bold text-slate-900 underline mb-3">Bank Details:</p>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                 <p className="text-[10px] font-black text-slate-800 uppercase">XQUISITE CUISINE</p>
                                 <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-slate-500">GT Bank</span>
                                    <span className="text-xs font-bold text-slate-900 font-mono">0210736266</span>
                                 </div>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                 <p className="text-[10px] font-black text-slate-800 uppercase">XQUISITE CELEBRATIONS</p>
                                 <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-slate-500">GT Bank</span>
                                    <span className="text-xs font-bold text-slate-900 font-mono">0396426845</span>
                                 </div>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                 <p className="text-[10px] font-black text-slate-800 uppercase">XQUISITE CELEBRATIONS</p>
                                 <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-slate-500">Zenith Bank</span>
                                    <span className="text-xs font-bold text-slate-900 font-mono">1010951007</span>
                                 </div>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                 <p className="text-[10px] font-black text-slate-800 uppercase">XQUISITE CUISINE</p>
                                 <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-slate-500">First Bank</span>
                                    <span className="text-xs font-bold text-slate-900 font-mono">2022655945</span>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Terms & Disclaimer */}
                        <div className="space-y-4">
                           <div>
                              <h4 className="font-bold text-slate-900 text-xs mb-1">Terms and Conditions:</h4>
                              <p className="text-[10px] text-slate-500 leading-relaxed">
                                 Initial deposit of 70% is to be paid before the event and balance payable immediately after the event.
                                 Cancellation of order will result to only a 70% refund of initial deposit made.
                              </p>
                           </div>
                           <div>
                              <h4 className="font-bold text-slate-900 text-xs mb-1">Disclaimer:</h4>
                              <p className="text-[10px] text-slate-500 leading-relaxed">
                                 In the event of cancellation of order, it should be communicated to our contact person 48 hours before the event. Failure to do so will mean that initial deposit made has been forfeited.
                              </p>
                           </div>
                        </div>

                     </div>

                     {/* Right Side: Totals */}
                     <div className="w-full md:w-1/3 space-y-2">
                        {/* Dynamic Calculation Logic inside render for immediate feedback */}
                        {(() => {
                           // 1. Calculate values from lines (Source of Truth)
                           const calculatedSubtotal = invoice.lines.reduce((acc, l) => acc + (l.quantity * l.unitPriceCents), 0);

                           // 2. Determine which values to use
                           // If we have stored subtotal (new invoice), use it. otherwise use calculated.
                           const displaySubtotal = invoice.subtotalCents || calculatedSubtotal;

                           // If we have stored tax (new invoice), use it.
                           // If NOT, we assume the user WANTS to see taxes on this view (as per request),
                           // so we force calculate them based on the subtotal.
                           const displaySC = invoice.serviceChargeCents ?? Math.round(displaySubtotal * 0.15);
                           const displayVAT = invoice.vatCents ?? Math.round((displaySubtotal + displaySC) * 0.075);
                           const displayTotal = displaySubtotal + displaySC + displayVAT;

                           // Check if the stored total matches the calculated total (roughly)
                           // If stored total is significantly different (e.g. it was just subtotal), we might want to warn or just show the new total.
                           // For this user request, we will show the TAX BREAKDOWN definitively.

                           return (
                              <>
                                 <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                                    <span className="uppercase tracking-widest text-[10px] font-bold">Subtotal</span>
                                    <span>{formatCurrency(displaySubtotal)}</span>
                                 </div>
                                 <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                                    <span className="uppercase tracking-widest text-[10px] font-bold">Service Charge (15%)</span>
                                    <span>{formatCurrency(displaySC)}</span>
                                 </div>
                                 <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                                    <span className="uppercase tracking-widest text-[10px] font-bold">VAT (7.5%)</span>
                                    <span>{formatCurrency(displayVAT)}</span>
                                 </div>
                                 <div className="h-px bg-slate-200 my-2"></div>
                                 <div className="bg-slate-50 p-6 rounded-xl flex flex-col gap-2 items-end text-right border border-slate-100">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Amount</p>
                                    <p className={`text-3xl font-black ${isPurchase ? 'text-rose-600' : 'text-slate-900'}`}>
                                       {formatCurrency(displayTotal)}
                                    </p>
                                 </div>
                              </>
                           );
                        })()}
                     </div>
                  </div>
               </div>

               {/* 5. Orange Footer Brand Message */}
               <div className="bg-orange-500 py-4 px-8 -mx-8 md:-mx-12 mt-12 mb-[-3rem] md:mb-[-4rem]">
                  <p className="text-white font-bold italic text-center text-sm md:text-base font-serif">
                     Bon Apetit. We look forward to serving you again soon.
                  </p>
               </div>

               <div className="h-16"></div>
            </div>

            {/* ACTION BAR (Not Printed) */}
            <div className="bg-slate-100 p-4 md:p-6 flex flex-col md:flex-row gap-4 border-t border-slate-200 shrink-0">
               <div className="flex gap-2 flex-1">
                  <button
                     onClick={() => {
                        const win = window.open('', '_blank');
                        // Inject simplified styles for print
                        win?.document.write(`
                           <html>
                              <head>
                                 <title>Invoice ${invoice.number}</title>
                                 <base href="${window.location.origin}/" />
                                 <script src="https://cdn.tailwindcss.com"></script>
                                 <style>
                                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                                    body { font-family: 'Inter', sans-serif; padding: 40px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                                    .invoice-box { transform: rotate(-2deg); border: 2px solid #fb923c; color: #f97316; display: inline-block; padding: 5px 15px; font-weight: 900; letter-spacing: 0.1em; }
                                 </style>
                              </head>
                              <body>
                                 ${document.querySelector('.WaveInvoiceContent')?.innerHTML || ''}
                              </body>
                           </html>
                        `);
                        setTimeout(() => win?.print(), 500);
                     }}
                     className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center justify-center gap-2"
                  >
                     <Printer size={16} /> Print
                  </button>
                  <button className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center justify-center gap-2">
                     <Share2 size={16} /> Share
                  </button>
               </div>
               <div className="flex gap-2 flex-[1.5]">
                  <button onClick={onClose} className="px-6 py-3 text-slate-500 font-bold uppercase text-xs tracking-widest hover:text-slate-800">Close</button>
                  <button onClick={() => onSave(invoice)} className="flex-1 py-3 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-800 flex items-center justify-center gap-2 shadow-lg">
                     Verified & Correct <ArrowRight size={16} />
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
};

const AssetDispatchModal = ({ event, onClose }: { event: CateringEvent, onClose: () => void }) => {
   const inventory = useDataStore(state => state.inventory);
   const dispatchAssets = useDataStore(state => state.dispatchAssets);
   const [search, setSearch] = useState('');
   const [cart, setCart] = useState<{ itemId: string, name: string, quantity: number }[]>([]);

   const filteredDetails = inventory.filter(i =>
      (i.type === 'asset' || i.type === 'reusable' || i.category === 'Hardware') &&
      i.name.toLowerCase().includes(search.toLowerCase())
   );

   const addToCart = (item: InventoryItem) => {
      if (cart.find(c => c.itemId === item.id)) return;
      setCart([...cart, { itemId: item.id, name: item.name, quantity: 1 }]);
   };

   const updateQty = (idx: number, qty: number) => {
      const newCart = [...cart];
      newCart[idx].quantity = qty;
      setCart(newCart);
   };

   const handleDispatch = () => {
      if (cart.length === 0) return;
      const dispatchedAt = new Date().toISOString();
      const assets = cart.map(c => ({ ...c, dispatchedAt }));

      if (confirm(`Dispatcher Confirmation:\n\nYou are about to move ${cart.reduce((a, b) => a + b.quantity, 0)} items from Main Inventory to Event Location.\n\nProceed?`)) {
         dispatchAssets(event.id, assets);
         alert("Assets Dispatched Successfully.");
         onClose();
      }
   };

   return (
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md animate-in zoom-in duration-200">
         <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[85vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Truck size={20} /></div>
                  <div>
                     <h2 className="text-xl font-black text-orange-600 uppercase">Asset Dispatch</h2>
                     <p className="text-[10px] text-slate-500 font-bold uppercase">Select items leaving the warehouse</p>
                  </div>
               </div>
               <button onClick={onClose}><X size={24} className="text-slate-400 hover:text-rose-500" /></button>
            </div>

            <div className="flex-1 flex overflow-hidden">
               {/* Item Selector */}
               <div className="w-1/2 border-r border-slate-100 flex flex-col p-4 bg-slate-50/50">
                  <input
                     type="text"
                     placeholder="Search assets (Plates, Glassware...)"
                     className="w-full p-3 bg-white border border-slate-200 rounded-xl mb-4 font-bold text-sm outline-none focus:border-indigo-500 text-slate-900"
                     value={search}
                     onChange={e => setSearch(e.target.value)}
                  />
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                     {filteredDetails.map(item => (
                        <div key={item.id} onClick={() => addToCart(item)} className="p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-300 cursor-pointer flex justify-between items-center group transition-all">
                           <div>
                              <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Stock: {item.stockQuantity}</p>
                           </div>
                           <Plus size={16} className="text-slate-300 group-hover:text-indigo-600" />
                        </div>
                     ))}
                  </div>
               </div>

               {/* Dispatch Cart */}
               <div className="w-1/2 flex flex-col p-6 bg-white">
                  <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-4">Dispatch Manifest</h3>
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                     {cart.length === 0 && <p className="text-slate-400 text-center text-sm italic mt-10">No items selected.</p>}
                     {cart.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                           <span className="font-bold text-slate-700 text-sm truncate flex-1">{item.name}</span>
                           <div className="flex items-center gap-2">
                              <input
                                 type="number"
                                 className="w-16 p-1 bg-white border border-slate-200 rounded text-center text-sm font-bold outline-none focus:border-indigo-500 text-slate-900"
                                 value={item.quantity}
                                 onChange={e => updateQty(idx, parseInt(e.target.value) || 0)}
                              />
                              <button onClick={() => setCart(cart.filter((_, i) => i !== idx))}><Trash2 size={14} className="text-rose-400 hover:text-rose-600" /></button>
                           </div>
                        </div>
                     ))}
                  </div>
                  <button onClick={handleDispatch} disabled={cart.length === 0} className="w-full py-4 bg-orange-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl active:scale-95 transition-all">
                     Confirm Dispatch
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
};

const LogisticsReturnModal = ({ event, onClose, onComplete }: { event: CateringEvent, onClose: () => void, onComplete?: () => void }) => {
   const finalizeEventLogistics = useDataStore(state => state.finalizeEventLogistics);
   const requisitions = useDataStore(state => state.requisitions);

   // State for Assets
   const [assetReturns, setAssetReturns] = useState<{ itemId: string, returnedQty: number }[]>([]);

   // State for Rentals
   const rentals = requisitions.filter(r => r.referenceId === event.id && r.type === 'Rental');
   const [rentalsReturned, setRentalsReturned] = useState<Record<string, boolean>>({});

   const handleAssetReturnChange = (itemId: string, val: number) => {
      const existing = assetReturns.filter(a => a.itemId !== itemId);
      existing.push({ itemId, returnedQty: val });
      setAssetReturns(existing);
   };

   const getReturnQty = (itemId: string) => assetReturns.find(a => a.itemId === itemId)?.returnedQty || 0;

   const handleFinalize = () => {
      // 1. Verify Rentals
      const allRentalsReturned = rentals.every(r => rentalsReturned[r.id]);
      if (rentals.length > 0 && !allRentalsReturned) {
         if (!confirm("Warning: Not all external rentals are marked as Returned to Vendor.\n\nProceed anyway?")) return;
      }

      // 2. Prepare Data
      const logisticsData = (event.dispatchedAssets || []).map(dispatched => {
         const returned = getReturnQty(dispatched.itemId);
         return {
            itemId: dispatched.itemId,
            name: dispatched.name,
            dispatchedQty: dispatched.quantity,
            returnedQty: returned,
            missingQty: Math.max(0, dispatched.quantity - returned),
            brokenQty: 0 // Simplification: Assuming missing = broken/lost for now
         };
      });

      if (confirm("Finalize Logistics & Archive Event?\n\nThis will return good items to inventory and close the event record.")) {
         finalizeEventLogistics(event.id, logisticsData);
         if (onComplete) onComplete();
         onClose();
      }
   };

   return (
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md animate-in zoom-in duration-200">
         <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[90vh]">
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
               <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Logistics Reconciliation</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Post-Event Asset Recovery & Returns</p>
               </div>
               <button onClick={onClose}><X size={24} className="text-slate-400 hover:text-slate-900" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 space-y-12">
               {/* Section 1: Rentals */}
               {rentals.length > 0 && (
                  <section>
                     <div className="flex items-center gap-4 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center"><Truck size={16} /></div>
                        <h3 className="text-sm font-black uppercase text-slate-900 tracking-widest">External Rentals</h3>
                     </div>
                     <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-6">
                        <p className="text-[10px] font-black uppercase text-orange-400 mb-4 tracking-widest">Confirm Return to Vendor</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {rentals.map(req => (
                              <label key={req.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-orange-100 cursor-pointer hover:border-orange-300 transition-all select-none">
                                 <input
                                    type="checkbox"
                                    className="w-5 h-5 accent-orange-600 rounded"
                                    checked={rentalsReturned[req.id] || false}
                                    onChange={e => setRentalsReturned({ ...rentalsReturned, [req.id]: e.target.checked })}
                                 />
                                 <div>
                                    <p className="font-bold text-slate-800 text-sm">{req.itemName}</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase">Qty: {req.quantity}</p>
                                 </div>
                              </label>
                           ))}
                        </div>
                     </div>
                  </section>
               )}

               {/* Section 2: Internal Assets */}
               <section>
                  <div className="flex items-center gap-4 mb-6">
                     <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center"><Box size={16} /></div>
                     <h3 className="text-sm font-black uppercase text-slate-900 tracking-widest">Internal Asset Recovery</h3>
                  </div>

                  {(!event.dispatchedAssets || event.dispatchedAssets.length === 0) ? (
                     <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                        <p className="text-slate-400 font-bold text-sm">No internal assets were formally dispatched for this event.</p>
                     </div>
                  ) : (
                     <div className="overflow-hidden rounded-2xl border border-slate-200">
                        <table className="w-full text-left text-sm">
                           <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                 <th className="p-4 font-black text-slate-500 uppercase text-[10px] tracking-widest">Item Name</th>
                                 <th className="p-4 font-black text-slate-500 uppercase text-[10px] tracking-widest text-center">Dispatched</th>
                                 <th className="p-4 font-black text-slate-500 uppercase text-[10px] tracking-widest text-center w-32">Returned (Good)</th>
                                 <th className="p-4 font-black text-slate-500 uppercase text-[10px] tracking-widest text-center">Variance (Lost/Broken)</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {event.dispatchedAssets.map((item, idx) => {
                                 const returned = getReturnQty(item.itemId);
                                 const variance = item.quantity - returned;
                                 return (
                                    <tr key={idx} className="bg-white">
                                       <td className="p-4 font-bold text-slate-800">{item.name}</td>
                                       <td className="p-4 font-bold text-slate-600 text-center">{item.quantity}</td>
                                       <td className="p-4 text-center">
                                          <input
                                             type="number"
                                             className="w-20 p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:border-indigo-500"
                                             value={getReturnQty(item.itemId) || ''}
                                             placeholder="0"
                                             onChange={e => handleAssetReturnChange(item.itemId, parseInt(e.target.value) || 0)}
                                             max={item.quantity}
                                          />
                                       </td>
                                       <td className="p-4 text-center">
                                          {variance > 0 ? (
                                             <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-black">{variance} Missing</span>
                                          ) : (
                                             <span className="text-emerald-500 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1"><Check size={12} /> All Good</span>
                                          )}
                                       </td>
                                    </tr>
                                 );
                              })}
                           </tbody>
                        </table>
                     </div>
                  )}
               </section>
            </div>

            <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-4">
               <button onClick={onClose} className="px-8 py-4 text-slate-500 font-bold uppercase text-[10px] tracking-widest hover:text-slate-800">Cancel</button>
               <button onClick={handleFinalize} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-slate-800 flex items-center gap-3 active:scale-95 transition-all">
                  <CheckCircle2 size={18} /> Finalize & Close Event
               </button>
            </div>
         </div>
      </div>
   );
};

const EventNodeSummary = ({ event, onAmend, onClose }: { event: CateringEvent, onAmend: (ev: CateringEvent) => void, onClose?: () => void }) => {
   const estimatedCost = event.financials.revenueCents * 0.4;
   const estimatedNet = event.financials.revenueCents - estimatedCost;

   const deductStockFromCooking = useDataStore(state => state.deductStockFromCooking);

   const completeEvent = useDataStore(state => state.completeCateringEvent);

   const handleCook = () => {
      if (confirm("Confirm Kitchen Production Phase?\n\nThis will assume cooking is in progress. You can then launch the Portion Monitor.")) {
         deductStockFromCooking(event.id);
         alert("Production Confirmed. Launch Portion Monitor to track service.");
      }
   };

   const handleComplete = () => {
      if (confirm("Are you sure you want to close this event? This will archive it as 'Completed'.")) {
         completeEvent(event.id);
         // Do not navigate away yet, let them do logistics if needed. Or maybe do? 
         // User asked for "Finalize and Close" button in Logistics modal to navigate away.
         // This button is "Finalize Event" which just marks it Completed.
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

   // INVOICE LOGIC
   const invoices = useDataStore(state => state.invoices);
   const salesInvoice = useMemo(() => invoices.find(inv => inv.id === event.financials.invoiceId), [invoices, event.financials.invoiceId]);
   const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
   const [showMonitor, setShowMonitor] = useState(false);
   const [showDispatch, setShowDispatch] = useState(false);
   const [showLogistics, setShowLogistics] = useState(false);

   if (showMonitor) {
      return (
         <div className="fixed inset-0 z-[200] bg-white animate-in slide-in-from-right">
            <PortionMonitor initialEventId={event.id} onClose={() => setShowMonitor(false)} />
         </div>
      );
   }

   return (
      <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-4 space-y-12 relative">
         {onClose && (
            <button
               onClick={onClose}
               className="absolute top-6 right-6 p-3 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all z-10"
               title="Close Details"
            >
               <X size={20} />
            </button>
         )}
         {viewingInvoice && <WaveInvoiceModal invoice={viewingInvoice} onSave={() => { }} onClose={() => setViewingInvoice(null)} />}

         {/* LOGISTICS MODALS */}
         {showDispatch && <AssetDispatchModal event={event} onClose={() => setShowDispatch(false)} />}
         {showLogistics && <LogisticsReturnModal event={event} onClose={() => setShowLogistics(false)} onComplete={onClose} />}

         <div className="flex justify-between items-start">
            <div className="space-y-4">
               <div className="flex gap-4">
                  <button onClick={() => onAmend(event)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 items-center">
                     <FileText size={14} /> Amend Record
                  </button>
                  {/* ... other top buttons ... */}
                  {salesInvoice && (
                     <button onClick={() => setViewingInvoice(salesInvoice)} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 items-center">
                        <Printer size={14} /> View Invoice
                     </button>
                  )}
                  {event.currentPhase === 'Execution' && (
                     <button onClick={() => setShowDispatch(true)} className="px-6 py-2 bg-orange-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-orange-700 transition-all flex items-center gap-2 items-center">
                        <Truck size={14} /> Dispatch Assets
                     </button>
                  )}
                  {/* ... */}
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
                  {/* ... (Banquet Details) ... */}
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
               {event.currentPhase === 'Execution' && event.status !== 'Completed' && (
                  <>
                     <button onClick={() => setShowMonitor(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all">
                        <Activity size={18} /> Launch Live Monitor
                     </button>
                     <button onClick={handleCook} className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all">
                        <Flame size={18} /> Confirm Kitchen Production
                     </button>
                  </>
               )}
               {(event.currentPhase === 'PostEvent' || event.status === 'Completed' || event.status === 'Archived') && (
                  <>
                     <button
                        onClick={() => event.portionMonitor && generateHandoverReport(event, event.portionMonitor)}
                        className="bg-slate-900 text-[#00ff9d] px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all"
                     >
                        <FileText size={18} /> View Handover Report
                     </button>
                     {event.status !== 'Archived' && (
                        <button
                           onClick={() => setShowLogistics(true)}
                           className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all"
                        >
                           <Truck size={18} /> Logistics Return
                        </button>
                     )}
                     {event.status === 'Archived' && (
                        <div className="bg-slate-50 text-slate-400 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-slate-100 flex items-center gap-3">
                           <CheckCircle2 size={18} /> Event Closed
                        </div>
                     )}
                  </>
               )}
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

import { EventDetailCard } from './EventDetailCard';

export const Catering = () => {
   const [events, setEvents] = useState<CateringEvent[]>([]);
   const [selectedEvent, setSelectedEvent] = useState<CateringEvent | null>(null);
   const [richDetailEvent, setRichDetailEvent] = useState<CateringEvent | null>(null);
   const [amendEvent, setAmendEvent] = useState<CateringEvent | null>(null);
   const [showBrochure, setShowBrochure] = useState(false);
   const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null);
   const [activeTab, setActiveTab] = useState<'orders' | 'matrix'>('orders');
   const [showProcurement, setShowProcurement] = useState(false);
   const [isManualInvoiceModalOpen, setIsManualInvoiceModalOpen] = useState(false);
   const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');

   const cateringEvents = useDataStore(state => state.cateringEvents);
   const approveInvoice = useDataStore(state => state.approveInvoice);

   const filteredEvents = useMemo(() => {
      if (viewMode === 'active') {
         return events.filter(e => e.status !== 'Archived');
      }
      return events.filter(e => e.status === 'Archived');
   }, [events, viewMode]);

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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
               <div className={`transition-all duration-300 ${selectedEvent ? 'lg:col-span-1 space-y-3 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1' : 'lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'}`}>
                  <div className={`flex flex-col gap-4 px-4 ${selectedEvent ? '' : 'lg:col-span-3 xl:col-span-4'}`}>
                     <div className="flex flex-col md:flex-row justify-between md:items-center items-start gap-4">
                        <h2 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em]">{viewMode} Banquets</h2>
                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                           <button onClick={() => setIsManualInvoiceModalOpen(true)} className="flex-1 md:flex-none px-4 md:px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all"><FileText size={16} /> Create Invoice</button>
                           <button onClick={() => setShowBrochure(true)} className="flex-1 md:flex-none px-4 md:px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-xl active:scale-95 hover:bg-slate-800 transition-all"><Plus size={16} /> Create Banquet</button>
                        </div>
                     </div>
                     <div className="flex bg-slate-100 p-1 rounded-xl">
                        {['active', 'archived'].map((mode) => (
                           <button
                              key={mode}
                              onClick={() => {
                                 setViewMode(mode as any);
                                 setSelectedEvent(null);
                              }}
                              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === mode ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                           >
                              {mode}
                           </button>
                        ))}
                     </div>
                  </div>

                  {filteredEvents.length === 0 && (
                     <div className={`p-8 text-center border-2 border-dashed border-slate-100 rounded-[3rem] ${selectedEvent ? '' : 'lg:col-span-3 xl:col-span-4'}`}>
                        <p className="text-xs font-black uppercase text-slate-300 tracking-widest">No {viewMode} records found</p>
                     </div>
                  )}

                  {filteredEvents.map(ev => (
                     <div key={ev.id} onClick={() => setSelectedEvent(ev)} className={`rounded-2xl border transition-all cursor-pointer relative group ${selectedEvent ? 'p-4' : 'p-5 h-full'} ${selectedEvent?.id === ev.id ? 'border-[#ff6b6b] bg-white shadow-xl ring-2 ring-[#ff6b6b]/10' : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md'}`}>
                        <button
                           onClick={(e) => { e.stopPropagation(); setRichDetailEvent(ev); }}
                           className="absolute top-2 right-2 w-6 h-6 bg-slate-100 text-slate-400 hover:text-white hover:bg-slate-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
                        >
                           <Activity size={10} />
                        </button>
                        <div className="flex justify-between items-center mb-3">
                           <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none truncate pr-2">{ev.customerName}</h3>
                           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${ev.status === 'Confirmed' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>{ev.status}</span>
                        </div>
                        <div className="flex justify-between items-end">
                           <div className="space-y-0.5">
                              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Guests</p>
                              <p className="text-sm font-black text-slate-700 leading-none">{ev.guestCount}</p>
                           </div>
                           <div className="space-y-0.5 text-right">
                              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Revenue</p>
                              <p className="text-sm font-black text-[#ff6b6b] leading-none">₦{(ev.financials.revenueCents / 100).toLocaleString()}</p>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>

               {selectedEvent && (
                  <div className="lg:col-span-2">
                     <EventNodeSummary
                        event={selectedEvent}
                        onAmend={(ev) => {
                           setAmendEvent(ev);
                           setShowBrochure(true);
                        }}
                        onClose={() => setSelectedEvent(null)}
                     />
                  </div>
               )}
            </div>
         )}
         {activeTab === 'matrix' && <CostingMatrix />}

         {/* UI Overlays */}
         {
            showBrochure && (
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
            )
         }

         {
            generatedInvoice && (
               <WaveInvoiceModal
                  invoice={generatedInvoice}
                  onSave={handleCommitInvoice}
                  onClose={() => setGeneratedInvoice(null)}
               />
            )
         }

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

         {isManualInvoiceModalOpen && (
            <ManualInvoiceModal
               isOpen={isManualInvoiceModalOpen}
               onClose={() => setIsManualInvoiceModalOpen(false)}
            />
         )}

         {richDetailEvent && (
            <EventDetailCard
               item={{ type: 'event', data: richDetailEvent }}
               onClose={() => setRichDetailEvent(null)}
            />
         )}
      </div>
   );
};
