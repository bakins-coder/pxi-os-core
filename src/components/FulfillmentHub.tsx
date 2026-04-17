import { useState, useEffect, useMemo, useRef } from 'react';
import React from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { CateringEvent, InventoryItem, ItemCosting, Invoice, InvoiceLine, Requisition, Contact, BanquetDetails, InvoiceStatus, DealItem, Role } from '../types';
import { getLiveRecipeIngredientPrices } from '../services/ai';
import {
   ChefHat, CheckCircle2, Truck, X, Plus, RefreshCw, ArrowRight, Trash2, Calculator, Loader2, Globe, Sparkles,
   Clock, Users, Palette, AlertCircle, Activity, Box, ChevronDown, Download, Link, MessageSquare,
   ShoppingCart, FileText, Grid3X3, Minus, Banknote, Check, Printer, Share2, Mail, Flag, Search,
   ShoppingBag, User, Flame, UtensilsCrossed, ArrowDownLeft, Info, ClipboardList, SkipForward,
   ArrowUpRight as LucideArrowUpRight
} from 'lucide-react';
import { NAIRA_SYMBOL } from '../utils/finance';
import { OrderBrochure } from './OrderBrochure';
import { PortionMonitor } from './PortionMonitor';
import { generateHandoverReport, generateInvoicePDF } from '../utils/exportUtils';
import { ManualInvoiceModal } from './Finance';
import { RequisitionTracker } from './RequisitionTracker';

import { PREDEFINED_CUISINE_PRODUCTS, CuisineProduct } from '../data/cuisineProducts';
import { PREDEFINED_BAKERY_PRODUCTS } from '../data/bakeryProducts';
import { IndustryType } from '../types';
import { getIndustryConfig, INDUSTRY_PROFILES, IndustryProfile } from '../config/industryProfiles';
const ProcurementWizard = ({ event, onClose, onFinish, industryConfig }: { event: CateringEvent, onClose: () => void, onFinish: (inv: Invoice) => void, industryConfig: IndustryProfile }) => {
   const [staffRatio, setStaffRatio] = useState<10 | 20>(10);
   const [staffRate, setStaffRate] = useState(10000);
   const [vanRate, setVanRate] = useState(30000);
   const [vanCount, setVanCount] = useState(1);
   const [requisitions, setRequisitions] = useState<Partial<Requisition>[]>([]);

   const terms = industryConfig.nomenclature.fulfillment;
   const invTerms = industryConfig.nomenclature.inventory;
   const features = industryConfig.features;

   useEffect(() => {
      const initialReqs: Partial<Requisition>[] = [];
      const isStandardFlow = event.orderType === 'Cuisine' || 
                             event.orderType === 'Standard' ||
                             event.orderType === 'Package' ||
                             event.banquetDetails?.eventType?.toUpperCase().includes('CUISINE') ||
                             (industryConfig.type === 'Sports Foundation' && (event.orderType === 'Standard' || event.orderType === 'Package'));

      if (!isStandardFlow && features.showStaffProcurement) {
         const staffNeeded = Math.ceil(event.guestCount / staffRatio);
         initialReqs.push({
            type: 'Hiring',
            category: 'Service',
            itemName: `${terms.staffLabel}(${staffNeeded} heads)`,
            quantity: staffNeeded,
            pricePerUnitCents: staffRate * 100,
            totalAmountCents: staffNeeded * staffRate * 100,
            notes: `Target ratio 1:${staffRatio} for ${event.guestCount} ${(terms.unitsLabel || 'units').toLowerCase()}.`
         });
      }
      initialReqs.push({
         type: 'Rental',
         category: 'Hardware',
         itemName: `${terms.logisticsUnitLabel} & Driver`,
         quantity: vanCount,
         pricePerUnitCents: vanRate * 100,
         totalAmountCents: vanCount * vanRate * 100,
      });
      event.items?.forEach(item => {
         initialReqs.push({
            type: 'Purchase',
            category: invTerms.substanceLabel.plural as any,
            itemName: item.name,
            quantity: item.quantity,
            pricePerUnitCents: item.priceCents * 0.4,
            totalAmountCents: item.quantity * item.priceCents * 0.4
         });
      });
      setRequisitions(initialReqs);
   }, [event, staffRatio, staffRate, vanRate, vanCount, industryConfig]);

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
   const addRequisitionsBulk = useDataStore(state => state.addRequisitionsBulk);
   const createProcurementInvoice = useDataStore(state => state.createProcurementInvoice);

   const handleFinalizePlan = async () => {
      // 1. Submit Requisitions as Pending
      addRequisitionsBulk(requisitions.map(r => ({ ...r, referenceId: event.id, status: 'Pending' })));

      // 2. Notify UI (No Invoice yet)
      alert("Requisitions submitted for Finance Approval.");
      onClose();
   };

   return (
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-2xl animate-in zoom-in duration-300">
         <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-full md:h-[90vh] border border-slate-200">
            <div className="p-5 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg"><Truck size={20} className="md:w-6 md:h-6" /></div>
                  <div>
                     <h2 className="text-xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">Procurement Engine</h2>
                     <p className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase mt-0.5 md:mt-1">Project: {event.customerName} • Material Fulfillment Plan</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-3 md:p-4 bg-slate-100 hover:bg-rose-500 hover:text-white rounded-xl md:rounded-2xl transition-all shadow-sm"><X size={20} className="md:w-6 md:h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 md:p-12 space-y-8 md:space-y-12 pb-32 md:pb-12">
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 bg-slate-50 p-5 md:p-8 rounded-2xl md:rounded-[2rem] border border-slate-100">
                  {features.showStaffProcurement && (
                     <>
                        <div className="space-y-1.5 md:space-y-2">
                           <label className="text-[8px] md:text-[10px] font-black uppercase text-slate-400 block mb-0.5 md:mb-1">{terms.staffLabel} Ratio</label>
                           <select className="w-full p-2.5 md:p-3 bg-white border border-slate-200 rounded-lg md:rounded-xl font-bold outline-none text-slate-950 text-xs md:text-base" value={staffRatio} onChange={e => setStaffRatio(parseInt(e.target.value) as 10 | 20)}>
                              <option value={10}>1 {terms.staffLabel} : 10 {terms.unitsLabel}</option>
                              <option value={20}>1 {terms.staffLabel} : 20 {terms.unitsLabel}</option>
                           </select>
                        </div>
                        <div className="space-y-1.5 md:space-y-2">
                           <label className="text-[8px] md:text-[10px] font-black uppercase text-slate-400 block mb-0.5 md:mb-1">{terms.staffLabel} Rate ({NAIRA_SYMBOL})</label>
                           <input type="number" className="w-full p-2.5 md:p-3 bg-white border border-slate-200 rounded-lg md:rounded-xl font-bold text-slate-950 text-xs md:text-base" value={staffRate} onChange={e => setStaffRate(parseInt(e.target.value) || 0)} />
                        </div>
                     </>
                  )}
                  <div className="space-y-1.5 md:space-y-2">
                     <label className="text-[8px] md:text-[10px] font-black uppercase text-slate-400 block mb-0.5 md:mb-1">{terms.logisticsUnitLabel} Rental ({NAIRA_SYMBOL})</label>
                     <input type="number" className="w-full p-2.5 md:p-3 bg-white border border-slate-200 rounded-lg md:rounded-xl font-bold text-slate-950 text-xs md:text-base" value={vanRate} onChange={e => setVanRate(parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                     <label className="text-[8px] md:text-[10px] font-black uppercase text-slate-400 block mb-0.5 md:mb-1">{terms.logisticsUnitLabel} Count</label>
                     <input type="number" className="w-full p-2.5 md:p-3 bg-white border border-slate-200 rounded-lg md:rounded-xl font-bold text-slate-950 text-xs md:text-base" value={vanCount} onChange={e => setVanCount(parseInt(e.target.value) || 0)} />
                  </div>
               </div>
               <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                     <h3 className="text-lg md:text-lg font-black text-slate-800 uppercase tracking-tight">Requisition Ledger</h3>
                     <button onClick={() => updateReq(requisitions.length, { type: 'Rental', category: 'Hardware', itemName: 'External Item', quantity: 1, pricePerUnitCents: 0, totalAmountCents: 0 })} className="w-full md:w-auto px-5 py-3.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><Plus size={14} /> Add 3rd Party Rental</button>
                  </div>
                  <div className="space-y-4">
                     {requisitions.map((req, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 p-5 md:p-6 bg-white border border-slate-100 rounded-2xl shadow-sm group hover:border-indigo-200 transition-all relative">
                           <div className="flex-1 space-y-1">
                              <input className="w-full bg-transparent font-black text-slate-800 uppercase outline-none focus:text-indigo-600 text-sm md:text-base" value={req.itemName} onChange={e => updateReq(idx, { itemName: e.target.value })} />
                              <div className="flex items-center gap-4">
                                 <span className="text-[8px] md:text-[9px] font-black uppercase text-slate-400">{req.type} • {req.category}</span>
                              </div>
                           </div>
                           <div className="grid grid-cols-2 md:flex md:items-center gap-4 md:gap-6 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-50">
                              <div className="space-y-1">
                                 <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Quantity</p>
                                 <input type="number" className="w-full md:w-20 p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-center text-slate-950" value={req.quantity} onChange={e => updateReq(idx, { quantity: parseInt(e.target.value) || 0 })} />
                              </div>
                              <div className="space-y-1">
                                 <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Price ({NAIRA_SYMBOL})</p>
                                 <input type="number" className="w-full md:w-28 p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-right text-slate-950" value={(req.pricePerUnitCents || 0) / 100} onChange={e => updateReq(idx, { pricePerUnitCents: (parseFloat(e.target.value) || 0) * 100 })} />
                              </div>
                              <div className="col-span-2 md:col-span-1 md:w-32 text-right flex md:block justify-between items-end border-t border-slate-50 pt-3 md:pt-0 md:border-0 mt-2 md:mt-0">
                                 <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Row Total</p>
                                 <p className="text-sm md:text-base font-black text-slate-900">{NAIRA_SYMBOL}{((req.totalAmountCents || 0) / 100).toLocaleString()}</p>
                              </div>
                              <button onClick={() => removeReq(idx)} className="absolute top-2 right-2 md:static p-2.5 bg-rose-50 md:bg-transparent text-rose-500 md:text-slate-300 hover:text-rose-500 md:opacity-0 md:group-hover:opacity-100 rounded-lg transition-all"><Trash2 size={16} /></button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
               <div className="bg-slate-950 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-start md:items-center shadow-2xl gap-6 md:gap-0">
                  <div>
                     <p className="text-[10px] md:text-xs font-black uppercase text-slate-500 tracking-widest mb-1">Total Fulfillment Estimate</p>
                     <h4 className="text-2xl md:text-4xl font-black text-white tracking-tighter">{NAIRA_SYMBOL}{(totalEstimate / 100).toLocaleString()}</h4>
                  </div>
                  <div className="text-left md:text-right w-full md:w-auto">
                     <p className="text-[10px] font-black text-[#00ff9d] uppercase tracking-widest mb-4">Event Revenue: {NAIRA_SYMBOL}{(event.financials.revenueCents / 100).toLocaleString()}</p>
                     <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                        <button onClick={onClose} className="order-2 md:order-1 px-8 py-3.5 md:py-4 font-black uppercase text-[10px] text-slate-400 bg-slate-900 rounded-xl md:bg-transparent text-center">Cancel Plan</button>
                        <button onClick={handleFinalizePlan} className="order-1 md:order-2 px-8 py-4 md:px-12 md:py-5 bg-[#00ff9d] text-slate-950 rounded-xl md:rounded-[2rem] font-black uppercase text-[10px] md:text-[11px] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 w-full md:w-auto">Submit for Approval <ArrowRight size={16} /></button>
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
      (costing.ingredientBreakdown || []).forEach(ing => {
         const groupName = ing.subRecipeGroup || item.name;
         if (!groups[groupName]) groups[groupName] = [];
         groups[groupName].push(ing);
      });
      return groups;
   }, [costing, item.name]);

   const aggregates = useMemo(() => {
      if (!costing) return [];
      const aggs: Record<string, { name: string, qty: number, unit: string, cost: number }> = {};
      (costing.ingredientBreakdown || []).forEach(ing => {
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
         Object.entries(groundedPriceMap || {}).forEach(([ingName, price]) => {
            const ing = ingredients.find(i => i.name.toLowerCase().trim() === ingName.toLowerCase().trim());
            if (ing) {
               updateIngredientPrice(ing.id, price, {
                  marketPriceCents: price,
                  groundedSummary: `Live Market Price via Google Grounding: ${NAIRA_SYMBOL}${(price / 100).toLocaleString()}`,
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
               <button onClick={onClose} className="p-2 md:p-3 bg-white border border-slate-200 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl md:rounded-2xl transition-all shadow-sm"><X size={20} className="md:w-6 md:h-6" /></button>
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
                                    <th className="px-4 py-3 md:px-8 md:py-4 text-right">Value ({NAIRA_SYMBOL})</th>
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
                                       <td className="px-4 py-3 md:px-8 md:py-5 text-right font-mono text-slate-400 text-[10px] md:text-xs hidden md:table-cell">{NAIRA_SYMBOL}{(ing.unitCostCents / 100).toLocaleString()}</td>
                                       <td className="px-4 py-3 md:px-8 md:py-5 text-right font-black text-slate-900 text-xs md:text-sm">{NAIRA_SYMBOL}{(ing.totalCostCents / 100).toLocaleString()}</td>
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
                                 <th className="px-4 py-3 md:px-8 md:py-4 text-right">Cost ({NAIRA_SYMBOL})</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-800">
                              {aggregates.map((agg, idx) => (
                                 <tr key={idx} className="hover:bg-slate-800/30 transition-all border-b border-slate-800/50">
                                    <td className="px-4 py-3 md:px-8 md:py-4 font-black text-slate-200 uppercase">{agg.name}</td>
                                    <td className="px-4 py-3 md:px-8 md:py-4 text-center text-slate-400 font-bold">{agg.qty.toFixed(2)} <span className="text-[9px] opacity-50 uppercase">{agg.unit}</span></td>
                                    <td className="px-4 py-3 md:px-8 md:py-4 text-right font-black text-emerald-400 text-xs md:text-sm">{NAIRA_SYMBOL}{(agg.cost / 100).toLocaleString()}</td>
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
                     <h5 className="text-2xl font-black">{NAIRA_SYMBOL}{((costing?.totalIngredientCostCents || 0) / 100).toLocaleString()}</h5>
                  </div>
                  <div className="p-8 bg-indigo-50 rounded-[2rem] border border-indigo-100">
                     <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Projected Revenue</p>
                     <h5 className="text-2xl font-black text-indigo-900">{NAIRA_SYMBOL}{((costing?.revenueCents || 0) / 100).toLocaleString()}</h5>
                  </div>
                  <div className="p-8 bg-white border-2 border-slate-100 rounded-[2rem]">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Gross Margin</p>
                     <h5 className={`text-2xl font-black ${(costing?.grossMarginPercentage ?? 0) > 50 ? 'text-emerald-600' : 'text-amber-600'} `}>
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

const WaveInvoiceModal = ({ invoice, onSave, onClose, guestCount = 100, isStandardFlow, eventId, industryConfig }: { invoice: Invoice, onSave: (inv: Invoice) => void, onClose: () => void, guestCount?: number, isStandardFlow?: boolean, eventId?: string, industryConfig: IndustryProfile }) => {
   const isPurchase = invoice.type === 'Purchase';
   const { settings: org } = useSettingsStore();
   const { contacts, bankAccounts, finalizeInvoice, updateInvoiceLines, cateringEvents } = useDataStore();
   const contact = contacts.find(c => c.id === invoice.contactId);
   const event = cateringEvents.find(e => e.id === eventId);

   // Helper to title case names (e.g. "mrs debanke aderogba" -> "Mrs Debanke Aderogba")
   const toTitleCase = (str: string) => {
      if (!str) return str;
      return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
   };

   // Resolve the display name: Prioritize the specific host identity associated with this order/event
   // If the order has a specific customerName (e.g. "Mrs. Aderogba"), we use it even if it's linked to a generic contact (e.g. "Temple")
   const rawDisplayName = (event?.customerName && event.customerName !== 'Valued Customer') 
      ? event.customerName 
      : (invoice.customerName || contact?.name || 'Valued Customer');
   
   const displayName = toTitleCase(rawDisplayName);
   
   const displayEmail = (contact?.name === event?.customerName) ? (contact?.email || '') : ''; // Only show email if it matches the current host to prevent data leaks
   const displayAddress = contact?.address || 'Address on file';
    const effectiveIsStandardFlow = (isStandardFlow || invoice.category === 'Cuisine' || event?.orderType === 'Cuisine') && 
       !['Banquet', 'Custom', 'Custom Orders'].includes(invoice.category || '') &&
       !['Banquet', 'Custom', 'Custom Orders'].includes(event?.orderType || '');
   const isBanquetMode = org.type === 'Catering' || org.type === 'Bakery';
   const isCustomFlow = !effectiveIsStandardFlow;
   const taxFeatures = industryConfig.features.taxConfig;

   const [isProformaMode, setIsProformaMode] = useState(invoice.status === InvoiceStatus.PROFORMA);
   const [editableLines, setEditableLines] = useState<InvoiceLine[]>(invoice.lines || []);
   const [isCustomMode, setIsCustomMode] = useState(
      (invoice.lines && (invoice.lines.some(l => l.description.startsWith('[SECTION]')) || (invoice.lines.length > 0 && invoice.lines[0].description.toLowerCase().includes('supply')))) || false
   );
   const [showDiscountCol, setShowDiscountCol] = useState(
      (invoice.lines && invoice.lines.some(l => l.manualPriceCents !== undefined && l.manualPriceCents !== null)) || false
   );

   const [isFinalizing, setIsFinalizing] = useState(false);
   const [manualTotalOverride, setManualTotalOverride] = useState<number | undefined>(invoice.manualSetPriceCents);
   const [editableCustomerName, setEditableCustomerName] = useState(displayName);

   // Helper for currency formatting
   const formatCurrency = (cents: number) => `${NAIRA_SYMBOL}${(cents / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })} `;

   const handlePrint = (capturedContent?: string) => {
      const win = window.open('', '_blank');
      // Ensure the printed document shows "INVOICE" if it's being finalized
      // Prioritize capturedContent (from finalize) over DOM selector (to avoid race conditions)
      const content = capturedContent || document.querySelector('.WaveInvoiceContent')?.innerHTML || '';

      win?.document.write(`
   < html >
            <head>
               <title>Invoice ${invoice.number}</title>
               <base href="${window.location.origin}/" />
               <script src="https://cdn.tailwindcss.com"></script>
               <style>
                  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                  body { font-family: 'Inter', sans-serif; padding: 40px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                  .invoice-box { transform: rotate(-2deg); border: 2px solid #fb923c; color: #f97316; display: inline-block; padding: 5px 15px; font-weight: 900; letter-spacing: 0.1em; }
                  @media print {
                    .no-print { display: none; }
                  }
               </style>
            </head>
            <body>
               ${content}
            </body>
         </html >
   `);
      setTimeout(() => {
         win?.print();
         // Small delay before closure to allow print spooling on some browsers
         // win?.close(); 
      }, 500);
   };

   const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
   const shareMenuRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
            setIsShareMenuOpen(false);
         }
      };
      if (isShareMenuOpen) {
         document.addEventListener('mousedown', handleClickOutside);
      }
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, [isShareMenuOpen]);

   const handleShareLink = async () => {
      const url = `${window.location.origin} /#/invoice / ${invoice.id} `;
      await navigator.clipboard.writeText(url);
      alert("Invoice link copied to clipboard!");
      setIsShareMenuOpen(false);
   };

   const handleDownloadPDF = async () => {
      const { settings } = useSettingsStore.getState();
      const { contacts } = useDataStore.getState();
      const customer = contacts.find(c => c.id === invoice.contactId);

      const pdfInvoice = { ...invoice, category: isStandardFlow ? (industryConfig.nomenclature.fulfillment.standardOrders) : (invoice.category || 'Custom') };
      await generateInvoicePDF(pdfInvoice, customer, settings, { save: true });
      setIsShareMenuOpen(false);
   };

   const handleSharePDF = async () => {
      try {
         const { settings } = useSettingsStore.getState();
         const { contacts } = useDataStore.getState();
         const customer = contacts.find(c => c.id === invoice.contactId);

         const pdfInvoice = { ...invoice, category: isStandardFlow ? 'Standard' : (invoice.category || 'Custom') };
         const doc = await generateInvoicePDF(pdfInvoice, customer, settings, { save: false, returnDoc: true }) as any;
         const pdfBlob = doc.output('blob');
         const file = new File([pdfBlob], `Invoice - ${invoice.number}.pdf`, { type: 'application/pdf' });

         if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
               files: [file],
               title: `Invoice ${invoice.number} `,
               text: `Please find attached invoice ${invoice.number}.`
            });
         } else {
            // Fallback to download if sharing file is not supported
            doc.save(`Invoice - ${invoice.number}.pdf`);
            alert("Direct PDF sharing not supported on this browser. PDF downloaded instead.");
         }
      } catch (err) {
         console.error("PDF Share failed", err);
         if ((err as Error).name !== 'AbortError') {
            alert("Could not share PDF. It has been downloaded instead.");
            handleDownloadPDF();
         }
      }
      setIsShareMenuOpen(false);
   };

   const handleCopyShareText = async () => {
      const { settings } = useSettingsStore.getState();
      const subtotal = editableLines.reduce((acc, l) => {
         if (isCustomFlow && !l.description.startsWith('[SECTION] ')) return acc;
         const price = (l.manualPriceCents !== undefined && l.manualPriceCents !== null) ? l.manualPriceCents : l.unitPriceCents;
         return acc + (l.quantity * price);
      }, 0);

      const isStandard = effectiveIsStandardFlow;
      const sc = isStandard ? 0 : Math.round(subtotal * taxFeatures.serviceChargeRate);
      const vat = isStandard ? 0 : Math.round((subtotal + sc) * taxFeatures.vatRate);
      const total = subtotal + sc + vat;
      const finalTotal = manualTotalOverride ?? total;

      const bankDetailsText = bankAccounts.length > 0 
         ? bankAccounts.map(acc => `${acc.institutionName || acc.bankName}: ${acc.accountNumber}`).join('\n')
         : "Contact Finance for payment details.";

      const summary = `
*INVOICE SUMMARY: ${invoice.number}*
Customer: ${displayName}
Date: ${new Date(invoice.date).toLocaleDateString('en-GB')}
Due: ${new Date(invoice.dueDate || invoice.date).toLocaleDateString('en-GB')}

*FEES:*
Subtotal: ${NAIRA_SYMBOL}${(subtotal / 100).toLocaleString()}
Service Charge: ${NAIRA_SYMBOL}${(sc / 100).toLocaleString()}
VAT: ${NAIRA_SYMBOL}${(vat / 100).toLocaleString()}
*TOTAL DUE: ${NAIRA_SYMBOL}${(finalTotal / 100).toLocaleString()}*

*BANK DETAILS:*
${bankDetailsText}

Link: ${window.location.origin}/#/invoice/${invoice.id}
      `.trim();

      await navigator.clipboard.writeText(summary);
      alert("Professional invoice summary copied to clipboard!");
      setIsShareMenuOpen(false);
   };

   const handleLineChange = (idx: number, field: keyof InvoiceLine, value: any) => {
      const newLines = [...editableLines];
      // Preserve SECTION marker if editing description of a header
      if (field === 'description' && newLines[idx].description.startsWith('[SECTION] ')) {
         newLines[idx] = { ...newLines[idx], [field]: `[SECTION] ${value} ` };
      } else {
         newLines[idx] = { ...newLines[idx], [field]: value };
      }
      setEditableLines(newLines);
   };

   const addLineItem = () => {
      const isActuallyCustom = isCustomMode;
      const desc = isActuallyCustom ? '[SECTION] New Item/Service' : 'New Item';

      setEditableLines([
         ...editableLines,
         { id: `line-${Date.now()}`, description: desc, quantity: 1, unitPriceCents: 0 }
      ]);
   };

   const toggleSection = (idx: number) => {
      const newLines = [...editableLines];
      const current = newLines[idx].description;
      if (current.startsWith('[SECTION] ')) {
         newLines[idx].description = current.replace('[SECTION] ', '');
      } else {
         newLines[idx].description = `[SECTION] ${current} `;
      }
      setEditableLines(newLines);
   };

   const autoStructureCakeOrder = () => {
      const buckets: Record<string, InvoiceLine[]> = {
         'Wedding Cakes': [],
         'Birthday Cakes': [],
         'Custom Cakes': [],
         'Cupcakes & Sweets': [],
         'Toppers & Accessories': [],
         'Delivery & Setup': [],
         'General': []
      };

      // 1. Bucketize existing items
      (editableLines || []).forEach(line => {
         if (line.description.startsWith('[SECTION] ')) return; // Skip existing headers

         const desc = line.description.toLowerCase();
         const cat = line.category; // Use the preserved category if available

         if (cat === 'Wedding Cakes' || desc.includes('wedding') || desc.includes('tiered') || desc.includes('fondant')) {
            buckets['Wedding Cakes'].push(line);
         } else if (cat === 'Birthday Cakes' || desc.includes('birthday') || desc.includes('age') || desc.includes('celebration')) {
            buckets['Birthday Cakes'].push(line);
         } else if (cat === 'Custom Cakes' || desc.includes('custom') || desc.includes('special') || desc.includes('design')) {
            buckets['Custom Cakes'].push(line);
         } else if (cat === 'Cupcakes & Sweets' || desc.includes('cupcake') || desc.includes('muffin') || desc.includes('brownie') || desc.includes('cookie') || desc.includes('donut')) {
            buckets['Cupcakes & Sweets'].push(line);
         } else if (cat === 'Toppers & Accessories' || desc.includes('topper') || desc.includes('candle') || desc.includes('balloon') || desc.includes('card') || desc.includes('ribbon')) {
            buckets['Toppers & Accessories'].push(line);
         } else if (desc.includes('delivery') || desc.includes('setup') || desc.includes('transport') || desc.includes('pickup') || desc.includes('logistics')) {
            buckets['Delivery & Setup'].push(line);
         } else {
            buckets['General'].push(line);
         }
      });

      // 2. Reconstruct Lines with Headers
      const newLines: InvoiceLine[] = [];
      Object.entries(buckets).forEach(([category, items]) => {
         if (items.length > 0) {
            // Special Rule: Delivery don't use quantity multiplier (usually flat rate)
            const isDelivery = category.includes('Delivery');
            const headerQty = isDelivery ? 1 : guestCount;

            // Add Header
            newLines.push({
               id: `header-${category}-${Date.now()}`,
               description: `[SECTION] ${category} `,
               quantity: headerQty,
               unitPriceCents: 0 // User fills this
            });

            // Add Items
            (items || []).forEach(item => newLines.push(item));
         }
      });

      setEditableLines(newLines);
   };

   const toggleCustomMode = () => {
      if (!isCustomMode) {
         // Enable Custom Mode
         // Check if we need to auto-structure (if no sections exist)
         const hasSections = editableLines.some(l => l.description.startsWith('[SECTION]'));
         if (!hasSections) {
            if (editableLines.length > 0 && confirm("Automatically group items into Order Sections (e.g. Cakes, Delivery)?")) {
               autoStructureCakeOrder();
            } else {
               // Fallback to single header legacy behavior if they decline or list empty
               let newLines = [...editableLines];
               if (newLines.length === 0 || !newLines[0].description.toLowerCase().includes('supply')) {
                  const hasSupplyHeader = newLines.length > 0 && newLines[0].description.toLowerCase().includes('supply');
                  if (!hasSupplyHeader) {
                     newLines = [{
                        id: `line-${Date.now()}`,
                        description: '[SECTION] Supply of various cakes and items listed below:',
                        quantity: guestCount,
                        unitPriceCents: 0
                     }, ...newLines];
                  }
               }
               setEditableLines(newLines);
            }
         }
         setIsCustomMode(true);
      } else {
         setIsCustomMode(false);
      }
   };

   const removeLineItem = (idx: number) => {
      setEditableLines(editableLines.filter((_, i) => i !== idx));
   };

   const handleFinalize = async () => {
      setIsFinalizing(true);
      try {
         await finalizeInvoice(invoice.id, editableLines, manualTotalOverride, eventId, editableCustomerName);
         setIsFinalizing(false);

         // Help the UI reflect the change before the print snapshot
         setIsProformaMode(false);

         // CRITICAL: Capture the content while the modal is STILL mounted.
         // Calling handlePrint inside a setTimeout after onSave (unmounting) is a race condition.
         const capturedContent = document.querySelector('.WaveInvoiceContent')?.innerHTML || '';

         // Trigger print/PDF generation automatically
         setTimeout(() => handlePrint(capturedContent), 300);

         onSave({ ...invoice, lines: editableLines, status: InvoiceStatus.UNPAID });
      } catch (err) {
         console.error("Failed to finalize proforma", err);
         alert("Could not finalize invoice. Please check your internet connection and try again.");
      } finally {
         setIsFinalizing(false);
      }
   };

   const handleSaveEdits = async () => {
      try {
         await updateInvoiceLines(invoice.id, editableLines, manualTotalOverride, effectiveIsStandardFlow, eventId, editableCustomerName);
         onClose();
      } catch (err) {
         console.error("Failed to save edits", err);
      }
   };

   return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-0 md:p-4 bg-slate-950/98 backdrop-blur-md animate-in zoom-in duration-200">
         <div className="bg-white rounded-none md:rounded-lg shadow-2xl w-full max-w-3xl flex flex-col h-full md:h-[90vh] overflow-hidden relative">
            <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-white/80 backdrop-blur-sm border border-slate-200 hover:bg-rose-500 hover:text-white text-slate-400 rounded-lg transition-all shadow-lg"><X size={20} /></button>

            {/* INVOICE DOCUMENT SCROLLABLE AREA */}
            <div className="flex-1 overflow-y-auto scrollbar-thin bg-white WaveInvoiceContent p-4 md:p-12 relative">

               {/* 1. Header */}
               <div className="flex justify-between items-start mb-6">
                  {/* Logo Area */}

                  <div className="w-48">
                     {org.logo ? (
                        <img src={org.logo} alt={org.name} className="w-full object-contain max-h-20" />
                     ) : (
                        <h1 className="text-2xl font-black tracking-tighter text-slate-900 italic">{org.name || 'PX-I'}</h1>
                     )}
                  </div>
                  <div className="text-right">
                     <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">{org.name || 'Organization'}</h2>
                     <p className="text-[10px] text-slate-400 font-medium">Official Invoice</p>
                  </div>
               </div>

               {/* Orange Divider */}
               <div className="h-1 w-full bg-orange-400 mb-10"></div>

               {/* 2. Info Section (Bill To & Invoice Details) */}
               <div className="flex flex-col md:flex-row justify-between items-start gap-6 md:gap-10 mb-8 md:mb-12">

                  {/* Bill To */}
                  <div className="flex-1">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">BILL TO</p>
                     <div className="space-y-1">
                        <input 
                           type="text"
                           className="text-xl font-bold text-slate-900 bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-100 p-1 w-full -ml-1 cursor-text"
                           value={editableCustomerName}
                           onChange={(e) => setEditableCustomerName(e.target.value)}
                           placeholder="Customer Name"
                        />
                        <p className="text-sm text-slate-500">{displayEmail}</p>
                        <p className="text-sm text-slate-500 max-w-[200px]">{displayAddress}</p>
                     </div>
                  </div>

                  {/* Invoice Meta */}
                  <div className="w-full md:flex-[0.8] flex flex-col items-center md:items-end">
                     {/* Orange Invoice Box */}
                     <div className="border-2 border-orange-400 px-4 md:px-6 py-2 rounded-lg mb-4 md:mb-6 transform md:-rotate-2">
                        <span className="text-xl md:text-2xl font-black text-orange-500 uppercase tracking-widest text-opacity-80">
                           {isProformaMode ? 'PRO-FORMA' : 'INVOICE'}
                        </span>
                     </div>

                     {/* Details Grid */}
                     <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-right">
                        <span className="text-xs font-bold text-slate-500">Invoice Number:</span>
                        <span className="text-xs font-bold text-slate-900">{invoice.number}</span>

                        <span className="text-xs font-bold text-slate-500">Invoice Date:</span>
                        <span className="text-xs font-bold text-slate-900">{invoice.date ? new Date(invoice.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</span>

                        <span className="text-xs font-bold text-slate-500">Payment Due:</span>
                        <span className="text-xs font-bold text-slate-900">
                           {invoice.date ? new Date(invoice.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'On Receipt'}
                        </span>
                     </div>
                  </div>
               </div>

               {/* 3. Items Table */}
               <div className="mb-12">
                  <div className={`hidden md:grid ${showDiscountCol ? 'grid-cols-[2.8fr_0.5fr_1fr_1.2fr_1.5fr]' : 'grid-cols-[3.5fr_1fr_1.2fr_1.3fr]'} gap-10 border-b-2 border-slate-200 pb-2 mb-4`}>
                     <span className="text-[10px] font-black text-slate-400 uppercase">ITEMS</span>
                     <span className="text-[10px] font-black text-slate-400 uppercase text-center">QTY</span>
                     <span className="text-[10px] font-black text-slate-400 uppercase text-right">UNIT PRICE</span>
                     {showDiscountCol && <span className="text-[10px] font-black text-slate-400 uppercase text-right text-orange-500">DISCOUNT PRICE</span>}
                     <span className="text-[10px] font-black text-slate-400 uppercase text-right">AMOUNT</span>
                  </div>
                  {/* Mobile Header (Table Style) */}
                  <div className="md:hidden flex justify-between border-b-2 border-slate-100 pb-2 mb-4">
                     <span className="text-[10px] font-black text-slate-400 uppercase">ITEM DETAILS</span>
                     <span className="text-[10px] font-black text-slate-400 uppercase text-right">TOTAL</span>
                  </div>

                  <div className="space-y-4">
                     {editableLines.length === 0 ? (
                        <p className="text-center text-sm text-slate-300 italic py-4">No items billed.</p>
                     ) : (
                        editableLines.map((line, idx) => {
                           // Custom Cake Logic:
                           const isHeader = line.description.startsWith('[SECTION] ');

                           // Show Pricing IF: Not Custom Cake Mode OR It *IS* a Header row
                           const showPricing = !isCustomFlow || isHeader;
                           return (
                              <div key={idx} className={`flex flex-col md:grid ${showDiscountCol ? 'grid-cols-[2.8fr_0.5fr_1fr_1.2fr_1.5fr]' : 'grid-cols-[3.5fr_1fr_1.2fr_1.3fr]'} items-start text-xs group relative gap-3 md:gap-10 border-slate-50 ${isHeader ? 'bg-orange-50/50 -mx-4 px-4 py-3 md:py-2 mb-2 mt-2 rounded-lg border border-orange-100' : ''} `}>
                                 {isProformaMode ? (
                                    <>
                                       {/* Description (Top on Mobile, First Col on Desktop) */}
                                       <div className="flex items-center gap-2 pr-4 flex-1 w-full">
                                          <button
                                             onClick={() => removeLineItem(idx)}
                                             className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-all md:opacity-0 md:group-hover:opacity-100 flex-shrink-0"
                                          >
                                             <Trash2 size={12} />
                                          </button>
                                          {isCustomFlow && (
                                             <button
                                                onClick={() => toggleSection(idx)}
                                                className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase transition-all flex-shrink-0 ${isHeader ? 'bg-orange-400 text-white shadow-sm' : 'bg-slate-100 text-slate-400 border border-slate-200 hover:text-slate-600'} `}
                                                title={isHeader ? "Currently Section Header" : "Currently Itemized (No Price)"}
                                             >
                                                {isHeader ? 'Section' : 'Itemized'}
                                             </button>
                                          )}
                                          <textarea
                                             rows={isHeader ? 1 : 2}
                                             className={`flex-1 bg-slate-50 border-none focus:ring-1 focus:ring-orange-400 rounded px-2 py-1.5 text-slate-800 font-medium whitespace-normal break-words resize-none ${isHeader ? 'font-black uppercase tracking-wide bg-transparent text-lg overflow-hidden' : isCustomFlow ? 'text-xs' : ''} `}
                                             placeholder="Item description"
                                             value={isHeader ? line.description.replace('[SECTION] ', '') : line.description}
                                             onChange={e => handleLineChange(idx, 'description', e.target.value)}
                                          />
                                       </div>

                                       {/* Mobile Details Row / Desktop Columns */}
                                       <div className="grid grid-cols-2 md:contents w-full gap-2">
                                          <div className="flex flex-col md:block">
                                             <label className="md:hidden text-[8px] font-black text-slate-400 uppercase mb-1">{isHeader ? 'Qty/Guests' : 'Quantity'}</label>
                                             <input
                                                type="number"
                                                className="w-full bg-slate-50 border-none focus:ring-1 focus:ring-orange-400 rounded px-2 py-1 text-slate-600 text-center ${isHeader ? 'font-black text-slate-900' : ''}"
                                                value={line.quantity}
                                                onFocus={e => e.target.select()}
                                                onChange={e => handleLineChange(idx, 'quantity', parseInt(e.target.value) || 0)}
                                             />
                                          </div>

                                          <div className="flex flex-col md:block">
                                             <label className="md:hidden text-[8px] font-black text-slate-400 uppercase mb-1">Unit Price</label>
                                             {showPricing ? (
                                                <div className="flex items-center bg-slate-50 rounded px-2 py-1 md:ml-auto">
                                                   <span className="text-[10px] text-slate-400 mr-1">{NAIRA_SYMBOL}</span>
                                                   <input
                                                      type="number"
                                                      className="w-full md:w-20 bg-transparent border-none focus:ring-0 p-0 text-right ${line.manualPriceCents ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-600'} ${isHeader ? 'font-black text-slate-900' : ''}"
                                                      value={line.unitPriceCents / 100}
                                                      onFocus={e => e.target.select()}
                                                      onChange={e => handleLineChange(idx, 'unitPriceCents', Math.round((parseFloat(e.target.value) || 0) * 100))}
                                                   />
                                                </div>
                                             ) : <div className="hidden md:block"></div>}
                                          </div>

                                          {showDiscountCol && (
                                             <div className="flex flex-col md:block">
                                                <label className="md:hidden text-[8px] font-black text-orange-400 uppercase mb-1">Discount Price</label>
                                                {showPricing ? (
                                                   <div className="flex items-center bg-orange-50/50 rounded px-2 py-1 md:ml-auto border border-orange-100 focus-within:ring-1 focus-within:ring-orange-400">
                                                      <span className="text-[10px] text-orange-300 mr-1">{NAIRA_SYMBOL}</span>
                                                      <input
                                                         type="number"
                                                         className="w-full md:w-20 bg-transparent border-none focus:ring-0 p-0 text-orange-600 font-bold text-right placeholder:text-orange-200/50"
                                                         placeholder="-"
                                                         value={line.manualPriceCents ? line.manualPriceCents / 100 : ''}
                                                         onChange={e => {
                                                            const val = parseFloat(e.target.value);
                                                            handleLineChange(idx, 'manualPriceCents', isNaN(val) ? undefined : Math.round(val * 100));
                                                         }}
                                                      />
                                                   </div>
                                                ) : <div className="hidden md:block"></div>}
                                             </div>
                                          )}

                                          <div className="flex flex-col md:block items-end md:items-stretch">
                                             <label className="md:hidden text-[8px] font-black text-slate-400 uppercase mb-1">Total</label>
                                             {showPricing && (
                                                <span className={`text-slate-900 font-bold text-right py-1 block ${isHeader ? 'text-lg text-emerald-600' : ''} `}>
                                                   {formatCurrency(line.quantity * (line.manualPriceCents ?? line.unitPriceCents))}
                                                </span>
                                             )}
                                          </div>
                                       </div>
                                    </>
                                 ) : (
                                    <>
                                       {/* View Mode (Non-Editable) */}
                                       <div className="w-full md:pr-4">
                                          {isHeader && <span className="inline-block px-2 py-0.5 bg-orange-400 text-white rounded text-[9px] uppercase font-black tracking-widest mr-2 mb-1 shadow-sm">Section</span>}
                                          <span className={`text-slate-800 font-medium block whitespace-normal break-words leading-relaxed ${isHeader ? 'font-black uppercase tracking-wide text-lg' : isCustomFlow ? 'text-xs md:ml-12 text-slate-600' : ''} `}>
                                             {isHeader ? line.description.replace('[SECTION] ', '') : line.description}
                                          </span>
                                       </div>
                                       <div className="grid grid-cols-2 md:contents w-full gap-2">
                                          <div className="flex flex-col md:block">
                                             <label className="md:hidden text-[8px] font-black text-slate-400 uppercase whitespace-nowrap">Qty</label>
                                             <span className={`text-slate-600 md:text-center block ${isHeader ? 'font-black' : ''} `}>{line.quantity}</span>
                                          </div>
                                          <div className="flex flex-col md:block">
                                             <label className="md:hidden text-[8px] font-black text-slate-400 uppercase">Unit</label>
                                             {showPricing && (
                                                <span className={`block md: text-right text-xs ${line.manualPriceCents ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-600'} `}>
                                                   {formatCurrency(line.unitPriceCents)}
                                                </span>
                                             )}
                                          </div>
                                          {showDiscountCol && (
                                             <div className="flex flex-col md:block">
                                                <label className="md:hidden text-[8px] font-black text-orange-400 uppercase">Discount</label>
                                                {showPricing && (
                                                   <span className="block md:text-right font-bold text-orange-600 text-xs">
                                                      {line.manualPriceCents ? formatCurrency(line.manualPriceCents) : '-'}
                                                   </span>
                                                )}
                                             </div>
                                          )}
                                          <div className="flex flex-col md:block items-end md:items-stretch">
                                             <label className="md:hidden text-[8px] font-black text-slate-400 uppercase">Total</label>
                                             {showPricing && (
                                                <span className="text-slate-900 font-bold text-right block text-xs">
                                                   {formatCurrency(line.quantity * (line.manualPriceCents ?? line.unitPriceCents))}
                                                </span>
                                             )}
                                          </div>
                                       </div>
                                    </>
                                 )}
                              </div>
                           );
                        })
                     )}


                     {isProformaMode && (
                        <button
                           onClick={addLineItem}
                           className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 hover:border-orange-400 hover:text-orange-400 transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider mt-4"
                        >
                           <Plus size={14} /> Add Line Item
                        </button>
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

                           <p className="text-xs text-slate-500 mb-4">Thank you for your patronage. Please make all payment transfers to: <br /><span className="font-black text-slate-900">{(org.name || 'The Organization').toUpperCase()}</span></p>
                                                  {bankAccounts && bankAccounts.length > 0 ? (
                              <>
                                 <p className="text-xs font-bold text-slate-900 underline mb-3">Bank Details:</p>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {bankAccounts.map((acc, bidx) => (
                                       <div key={bidx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                          <p className="text-[10px] font-black text-slate-800 uppercase">{acc.accountName || org.name}</p>
                                          <div className="flex justify-between items-center mt-1">
                                             <span className="text-xs text-slate-500">{acc.bankName}</span>
                                             <span className="text-xs font-bold text-slate-900 font-mono">{acc.accountNumber}</span>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </>
                           ) : (
                              <>
                                 <div className="flex justify-between items-center mb-3">
                                    <p className="text-xs font-bold text-slate-900 underline">Bank Details:</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">TIN: 15313371-0001</p>
                                 </div>
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                       <p className="text-[9px] font-black text-slate-800 uppercase">GTB A/C</p>
                                       <div className="flex flex-col mt-1">
                                          <span className="text-[10px] font-bold text-slate-900 font-mono">0396426845</span>
                                       </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                       <p className="text-[9px] font-black text-slate-800 uppercase">UBA A/C</p>
                                       <div className="flex flex-col mt-1">
                                          <span className="text-[10px] font-bold text-slate-900 font-mono">1021135344</span>
                                       </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                       <p className="text-[9px] font-black text-slate-800 uppercase">Zenith A/C</p>
                                       <div className="flex flex-col mt-1">
                                          <span className="text-[10px] font-bold text-slate-900 font-mono">1010951007</span>
                                       </div>
                                    </div>
                                 </div>
                              </>
                           )}
                        </div>
 
                        {/* Terms & Disclaimer */}
                        <div className="space-y-4 print:break-inside-avoid">
                           <div>
                              <h4 className="font-bold text-slate-900 text-xs mb-1">Terms and Conditions:</h4>
                              <p className="text-[10px] text-slate-500 leading-relaxed">
                                 Initial deposit of 90% is to be paid before the {industryConfig.nomenclature.fulfillment.fulfillmentTerm} and balance payable immediately after the {industryConfig.nomenclature.fulfillment.fulfillmentTerm}.
                                 Cancellation of {industryConfig.nomenclature.fulfillment.fulfillmentTerm} will result to only a 70% refund of initial deposit made.
                              </p>
                           </div>
                           <div>
                              <h4 className="font-bold text-slate-900 text-xs mb-1">Disclaimer:</h4>
                              <p className="text-[10px] text-slate-500 leading-relaxed">
                                 In the event of cancellation of {industryConfig.nomenclature.fulfillment.fulfillmentTerm}, it should be communicated to our contact person 48 hours before the {industryConfig.nomenclature.fulfillment.fulfillmentTerm}. Failure to do so will mean that initial deposit made has been forfeited.
                              </p>
                           </div>
                        </div>

                     </div>

                     {/* Right Side: Totals */}
                     <div className="w-full md:w-1/3 space-y-2">
                        {(() => {
                           const isExcludedFromTax = (desc: string) => {
                              if (!desc) return false;
                              const ldesc = desc.toLowerCase();
                              return ldesc.includes('transport') ||
                                 ldesc.includes('logistic') ||
                                 ldesc.includes('delivery') ||
                                 ldesc.includes('menu card') ||
                                 ldesc.includes('truck') ||
                                 ldesc.includes('service') ||
                                 ldesc.includes('rental');
                           };

                           const hasSections = editableLines.some(l => l.description.startsWith('[SECTION] '));

                           // 1. Calculate Standard Totals
                           const standardSubtotal = editableLines.reduce((acc, l) => {
                              if (hasSections && !l.description.startsWith('[SECTION] ')) return acc;
                              return acc + (l.quantity * l.unitPriceCents);
                           }, 0);

                           const standardTaxableSubtotal = editableLines.reduce((acc, l) => {
                              if (hasSections && !l.description.startsWith('[SECTION] ')) return acc;
                              if (isExcludedFromTax(l.description)) return acc;
                              return acc + (l.quantity * l.unitPriceCents);
                           }, 0);

                           const standardSC = effectiveIsStandardFlow ? 0 : Math.round(standardTaxableSubtotal * taxFeatures.serviceChargeRate);
                           const standardVAT = effectiveIsStandardFlow ? 0 : Math.round((standardTaxableSubtotal + standardSC) * taxFeatures.vatRate);
                           const standardTotal = standardSubtotal + standardSC + standardVAT;

                           // 2. Calculate Effective Totals (Using Manual Prices)
                           const effectiveSubtotal = editableLines.reduce((acc, l) => {
                              if (hasSections && !l.description.startsWith('[SECTION] ')) return acc;
                              const price = (l.manualPriceCents !== undefined && l.manualPriceCents !== null)
                                 ? l.manualPriceCents
                                 : l.unitPriceCents;
                              return acc + (l.quantity * price);
                           }, 0);

                           const effectiveTaxableSubtotal = editableLines.reduce((acc, l) => {
                              if (hasSections && !l.description.startsWith('[SECTION] ')) return acc;
                              if (isExcludedFromTax(l.description)) return acc;
                              const price = (l.manualPriceCents !== undefined && l.manualPriceCents !== null)
                                 ? l.manualPriceCents
                                 : l.unitPriceCents;
                              return acc + (l.quantity * price);
                           }, 0);

                           const effectiveSC = effectiveIsStandardFlow ? 0 : Math.round(effectiveTaxableSubtotal * taxFeatures.serviceChargeRate);
                           const effectiveVAT = effectiveIsStandardFlow ? 0 : Math.round((effectiveTaxableSubtotal + effectiveSC) * taxFeatures.vatRate);
                           const finalTotal = manualTotalOverride ?? (effectiveSubtotal + effectiveSC + effectiveVAT);

                           const discount = Math.max(0, standardTotal - finalTotal);
                           const discountPercent = standardTotal > 0 ? (discount / standardTotal) * 100 : 0;
                           const hasDiscount = discount > 0;

                           return (
                              <>
                                 <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                                    <span className="uppercase tracking-widest text-[10px] font-bold">Subtotal</span>
                                    <span>{formatCurrency(effectiveSubtotal)}</span>
                                 </div>
                                 <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                                    <span className="uppercase tracking-widest text-[10px] font-bold">Service Charge ({effectiveIsStandardFlow ? '0%' : `${Math.round(taxFeatures.serviceChargeRate * 100)}%`})</span>
                                    <span>{formatCurrency(effectiveSC)}</span>
                                 </div>
                                 <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                                    <span className="uppercase tracking-widest text-[10px] font-bold">VAT ({effectiveIsStandardFlow ? '0%' : `${(taxFeatures.vatRate * 100).toFixed(1)}%`})</span>
                                    <span>{formatCurrency(effectiveVAT)}</span>
                                 </div>

                                 {hasDiscount && (
                                    <div className="pt-2 border-t border-slate-100 mt-2 space-y-1">
                                       <div className="flex justify-between items-center text-xs font-medium text-slate-400">
                                          <span className="uppercase tracking-widest text-[10px] font-bold">Standard Total</span>
                                          <span className="line-through decoration-slate-300">{formatCurrency(standardTotal)}</span>
                                       </div>
                                       <div className="flex justify-between items-center text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                          <span className="uppercase tracking-widest text-[10px] font-bold">Total Discount ({discountPercent.toFixed(1)}%)</span>
                                          <span>-{formatCurrency(discount)}</span>
                                       </div>
                                    </div>
                                 )}

                                 {isProformaMode && showDiscountCol && (
                                    <div className="flex justify-between items-center text-[10px] font-bold text-orange-500 bg-orange-50/50 p-2 rounded-lg border border-orange-100 mb-2 mt-4">
                                       <span className="uppercase tracking-widest pl-2 font-black">Override Overall Total</span>
                                       <div className="flex items-center bg-white px-3 py-1 rounded border border-orange-200 shadow-sm">
                                          <span className="mr-1 text-orange-300">{NAIRA_SYMBOL}</span>
                                          <input
                                             type="number"
                                             className="w-40 bg-transparent border-none text-right font-black focus:ring-0 p-0 text-xs text-orange-600"
                                             placeholder="Set Final Amount"
                                             value={manualTotalOverride ? manualTotalOverride / 100 : ''}
                                             onChange={e => {
                                                const val = parseFloat(e.target.value);
                                                setManualTotalOverride(isNaN(val) ? undefined : Math.round(val * 100));
                                             }}
                                          />
                                       </div>
                                    </div>
                                 )}

                                 <div className="bg-slate-50 p-6 rounded-xl flex flex-col gap-2 items-end text-right border border-slate-100 mt-2">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Amount Due</p>
                                    <p className={`text-3xl font-black ${isPurchase ? 'text-rose-600' : 'text-slate-900'} `}>
                                       {formatCurrency(finalTotal)}
                                    </p>
                                    {hasDiscount && (
                                       <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest">
                                          You Save {formatCurrency(discount)}
                                       </p>
                                    )}
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
                     {industryConfig.nomenclature.fulfillment.portalSlogan || "Excellence in every delivery."}
                  </p>
               </div>

               <div className="h-16"></div>
            </div>

            {/* ACTION BAR (Not Printed) */}
            <div className="bg-slate-100 p-4 md:p-6 flex flex-col md:flex-row gap-4 border-t border-slate-200 shrink-0 z-[165]">
               <div className="flex flex-wrap gap-2 flex-1 items-center justify-between md:justify-start">
                  <div className="flex gap-2 items-center">
                     <button
                        onClick={() => toggleCustomMode()}
                        className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${isCustomMode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'} `}
                     >
                        {isCustomMode ? 'Custom Mode ON' : 'Custom Mode OFF'}
                     </button>
                     {isCustomMode && (
                        <button
                           onClick={() => setShowDiscountCol(!showDiscountCol)}
                           className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${showDiscountCol ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'} `}
                        >
                           {showDiscountCol ? 'Discount ON' : 'Discount OFF'}
                        </button>
                     )}
                  </div>

                  <div className="h-6 w-px bg-slate-200 mx-1 hidden min-[400px]:block"></div>

                  <div className="flex gap-2 flex-1 md:flex-none">
                     <button
                        onClick={() => handlePrint()}
                        className="flex-1 md:flex-none md:min-w-[100px] py-3 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center justify-center gap-2"
                     >
                        <Printer size={16} /> Print
                     </button>
                     <div className="relative flex-1 md:flex-none md:min-w-[100px]" ref={shareMenuRef}>
                        <button
                           onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
                           className={`w-full py-3 border rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isShareMenuOpen ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'} `}
                        >
                           <Share2 size={16} /> Share
                        </button>

                        {isShareMenuOpen && (
                           <div className="absolute bottom-full md:left-0 right-0 w-64 mb-3 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-200 animate-in slide-in-from-bottom-2 duration-200 z-[170]">
                              <div className="overflow-hidden rounded-2xl">
                                 <button onClick={handleShareLink} className="w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100 group">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"><Link size={18} /></div>
                                    <div className="text-left">
                                       <p className="text-[11px] font-black uppercase text-slate-900 tracking-tight">Copy Share Link</p>
                                       <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Public Web Invoice</p>
                                    </div>
                                 </button>
                                 <button onClick={handleDownloadPDF} className="w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100 group">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm"><Download size={18} /></div>
                                    <div className="text-left">
                                       <p className="text-[11px] font-black uppercase text-slate-900 tracking-tight">Download PDF</p>
                                       <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Save to this device</p>
                                    </div>
                                 </button>
                                 <button onClick={handleCopyShareText} className="w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100 group">
                                    <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-all shadow-sm"><MessageSquare size={18} /></div>
                                    <div className="text-left">
                                       <p className="text-[11px] font-black uppercase text-slate-900 tracking-tight">Copy Text Summary</p>
                                       <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Perfect for WhatsApp/SMS</p>
                                    </div>
                                 </button>
                                 <button onClick={handleSharePDF} className="w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors group">
                                    <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm"><Share2 size={18} /></div>
                                    <div className="text-left">
                                       <p className="text-[11px] font-black uppercase text-slate-900 tracking-tight">Share PDF File</p>
                                       <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">WhatsApp / Email</p>
                                    </div>
                                 </button>
                              </div>
                              {/* Arrow pointer */}
                              <div className="absolute top-full md:left-10 right-10 -mt-1 w-3 h-3 bg-white border-r border-b border-slate-200 rotate-45"></div>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
               <div className="flex flex-col md:flex-row gap-2 flex-[1.5]">
                  <button onClick={onClose} className="w-full md:w-auto px-6 py-3 text-slate-500 font-bold uppercase text-xs tracking-widest hover:text-slate-800">Close</button>
                  {isProformaMode ? (
                     <button
                        onClick={handleFinalize}
                        disabled={isFinalizing}
                        className="flex-1 py-3 bg-orange-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-orange-600 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                     >
                        {isFinalizing ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                        Finalize & Generate Invoice
                     </button>
                  ) : (
                     <button
                        onClick={async () => {
                           await handleSaveEdits();
                           onSave({ ...invoice, lines: editableLines, manualSetPriceCents: manualTotalOverride, customerName: editableCustomerName });
                        }}
                        className="flex-1 py-3 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-800 flex items-center justify-center gap-2 shadow-lg"
                     >
                        Verified & Correct <ArrowRight size={16} />
                     </button>
                  )}
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

   const updateQty = (index: number, newQty: number) => {
      const newItems = [...cart];
      newItems[index].quantity = Math.max(1, newQty);
      setCart(newItems);
   };

   const handleDispatch = () => {
      if (cart.length === 0) return;
      const dispatchedAt = new Date().toISOString();
      const assets = cart.map(c => ({ ...c, dispatchedAt }));

      if (confirm(`Dispatcher Confirmation: \n\nYou are about to move ${cart.reduce((a, b) => a + b.quantity, 0)} items from Main Inventory to Event Location.\n\nProceed ? `)) {
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
                     <h2 className="text-lg font-black text-orange-600 uppercase">Asset Dispatch</h2>
                     <p className="text-[10px] text-slate-500 font-bold uppercase">Select items leaving the warehouse</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-2 bg-white border border-slate-100 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all shadow-sm"><X size={20} /></button>
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
                  <div className="flex gap-4">
                     <button onClick={onClose} className="px-6 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                     <button onClick={handleDispatch} disabled={cart.length === 0} className="flex-1 py-4 bg-orange-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl active:scale-95 transition-all">
                        Confirm Dispatch
                     </button>
                  </div>
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
               <button onClick={onClose} className="p-2 bg-white border border-slate-100 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all shadow-sm"><X size={20} /></button>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           {rentals?.map(req => (
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

const getEventFinancials = (ev: CateringEvent, invoices: Invoice[]) => {
   // 1. Strict ID Link (Primary Source of Truth)
   const evInvoiceId = ev.financials?.invoiceId || (ev.financials as any)?.invoice_id;
   let evInvoice = invoices.find(inv => inv.id === evInvoiceId);

   // 2. Fallback to Contact-based Lookup (Only if no direct invoiceId link exists OR if that link is broken/empty)
   // This handles legacy events or those created before strict ID-mapping was fully enforced.
   if (!evInvoice || Number(evInvoice.totalCents) === 0) {
      const candidates = invoices.filter(inv => {
         // MUST match the contactId and MUST be a non-zero sales invoice
         if (Number(inv.totalCents) <= 0) return false;
         if (inv.type !== 'Sales') return false;
         
         // Direct Contact ID match + Name Match is the only acceptable fallback for data integrity
         return ev.contactId && inv.contactId === ev.contactId && (inv.customerName === ev.customerName || !inv.customerName);
      });

      if (candidates.length > 0) {
         // If multiple invoices exist for the same contact, we take the largest one as a heuristic 
         // but log a warning as this indicates a potentially messy contact history.
         evInvoice = candidates.sort((a, b) => Number(b.totalCents) - Number(a.totalCents))[0];
         console.warn(`[DATA INTEGRITY] No direct invoiceId link for event ${ev.id}. Found contact-based fallback invoice: ${evInvoice.id}`);
      }
   }

      const isCuisine = ev.orderType === 'Cuisine' || ev.orderType === 'Standard' || ev.orderType === 'Package' ||
      evInvoice?.category === 'Cuisine' ||
      ev.banquetDetails?.notes?.toUpperCase().includes('CUISINE') ||
      ev.banquetDetails?.eventType?.toUpperCase().includes('CUISINE') ||
      (ev as any).cuisineDetails?.notes?.toUpperCase().includes('CUISINE') ||
      // Sports Foundation alignment: treat program allocations as standard orders
      (settings.type === 'Sports Foundation' && (ev.orderType === 'Standard' || ev.orderType === 'Package'));

   let revenue = Number(evInvoice?.totalCents ?? (ev.financials?.revenueCents || 0));

   // Logic Sync: Cuisine orders never have SC/VAT. 
   if (evInvoice && isCuisine) {
      const subtotal = evInvoice.subtotalCents || evInvoice.lines?.reduce((acc, l) => {
         const price = (l.manualPriceCents !== undefined && l.manualPriceCents !== null) ? l.manualPriceCents : l.unitPriceCents;
         return acc + (l.quantity * price);
      }, 0) || 0;

      revenue = subtotal;
   }

   const isPaid = evInvoice?.status === 'Paid' || (evInvoice?.status as any) === InvoiceStatus.PAID;

   return {
      revenue,
      salesInvoice: evInvoice,
      isPaid,
      estimatedCost: revenue * 0.4,
      estimatedNet: revenue * 0.6
   };
};

const EventNodeSummary = ({ event, onAmend, onViewInvoice, onClose, onOpenDispatch, onOpenLogistics, onOpenRequisitions, onOpenMonitor }: {
   event: CateringEvent,
   onAmend: (ev: CateringEvent) => void,
   onViewInvoice: (inv: Invoice) => void,
   onClose?: () => void,
   onOpenDispatch: (event: CateringEvent) => void,
   onOpenLogistics: (event: CateringEvent) => void,
   onOpenRequisitions: (event: CateringEvent) => void,
   onOpenMonitor: (eventId: string) => void
}) => {
   const { settings } = useSettingsStore();
   const industryConfig = getIndustryConfig(settings.type);
   const terms = industryConfig.nomenclature.fulfillment;

   const invoices = useDataStore(state => state.invoices);
   const financials = useMemo(() => getEventFinancials(event, invoices), [event, invoices]);
   const { revenue, salesInvoice, estimatedCost, estimatedNet } = financials;

   const deductStockFromCooking = useDataStore(state => state.deductStockFromCooking);
   const currentUser = useAuthStore(state => state.user);
   const isAdminOrMD = currentUser && (currentUser.role === Role.ADMIN || currentUser.role === Role.CEO || currentUser.role === Role.SUPER_ADMIN);

   const completeEvent = useDataStore(state => state.completeCateringEvent);
   const updateCateringEvent = useDataStore(state => state.updateCateringEvent);

   const handleBypass = () => {
      if (confirm(`Manual Bypass: Move this order to ${terms.productionLabel} phase?\n\nUse this only if procurement is complete but state hasn't updated automatically.`)) {
         updateCateringEvent(event.id, { currentPhase: 'Execution' });
      }
   };

   const handleCook = () => {
      if (confirm(`Confirm ${terms.productionLabel} Phase?\n\nThis will assume production is in progress. You can then launch the ${terms.fulfillmentHub} Monitor.`)) {
         deductStockFromCooking(event.id);
         alert("Production Confirmed. Launch Monitor to track status.");
      }
   };

   const handleComplete = () => {
      if (confirm("Are you sure you want to close this order? This will archive it as 'Completed'.")) {
         completeEvent(event.id);
      }
   };

   const handleCancelOrder = () => {
      if (confirm("Are you sure you want to CANCEL this order?\n\nThis will mark the event as Cancelled and cannot be undone.")) {
         updateCateringEvent(event.id, { status: 'Cancelled' });
         if (onClose) onClose();
      }
   };

   const requisitions = useDataStore(state => state.requisitions);
   const createProcurementInvoice = useDataStore(state => state.createProcurementInvoice);

   const reapplyRequisitions = useDataStore(state => state.reapplyRequisitions);

   const eventRequisitions = requisitions.filter(r => r.referenceId === event.id);
   const hasRejections = eventRequisitions.some(r => r.status === 'Rejected');
   const procurementStatus = eventRequisitions.length === 0 ? 'None'
      : hasRejections ? 'Rejected'
         : eventRequisitions.every(r => r.status === 'Approved' || r.status === 'Paid' || r.status === 'Issued') ? 'Approved'
            : 'Pending';

   const handleGeneratePO = async () => {
      await createProcurementInvoice(event.id, eventRequisitions);
      alert("Purchase Order Generated. Event moved to Execution.");
   };

   return (
      <div className="bg-white p-6 md:p-12 pb-24 md:pb-12 rounded-[2rem] md:rounded-[3.5rem] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-4 space-y-8 md:space-y-12 relative overflow-x-hidden">
         {onClose && (
            <button
               onClick={onClose}
               className="absolute top-4 right-4 md:top-6 md:right-6 p-2 md:p-3 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all z-10"
               title="Close Details"
            >
               <X size={18} />
            </button>
         )}

         <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-100 pb-8">
            <div className="space-y-6 w-full max-w-2xl">
               <div className="flex flex-wrap gap-3">
                  <button onClick={() => onAmend(event)} className="px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2">

                     <FileText size={12} /> <span className="hidden sm:inline">Amend Record</span><span className="sm:hidden">Amend</span>
                  </button>
                  <button onClick={() => onOpenRequisitions(event)} className="px-4 md:px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-indigo-100 transition-all flex items-center gap-2">
                     <FileText size={12} /> <span className="hidden sm:inline">Track Requisitions</span><span className="sm:hidden">Reqs</span>
                  </button>
                  {salesInvoice && (
                     <button onClick={() => onViewInvoice(salesInvoice)} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 scale-110 md:scale-100 origin-left">
                        <Printer size={14} /> <span className="hidden sm:inline">View Invoice</span><span className="sm:hidden">Invoice</span>
                     </button>
                  )}
                  {event.currentPhase === 'Execution' && (
                     <button onClick={() => onOpenDispatch(event)} className="px-5 py-2.5 bg-orange-50 text-orange-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-100 transition-all flex items-center gap-2">
                        <Truck size={14} /> <span className="hidden sm:inline">Dispatch Assets</span><span className="sm:hidden">Dispatch</span>
                     </button>
                  )}
               </div>
               <div>
                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-800 uppercase tracking-tighter leading-tight break-words mb-4 line-clamp-2">{event.customerName}</h3>
                  <div className="flex flex-wrap items-center gap-3">
                     <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border transform -translate-y-0.5 ${event.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'} `}>{event.status}</span>
                     <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-widest">
                        {event.eventDate} • {event.orderType === 'Cuisine' ? (event.cuisineDetails?.deliveryLocation || 'Delivery Address TBD') : (event.location || 'Venue TBD')}
                     </p>
                  </div>
               </div>
            </div>
            <div className="text-right shrink-0 bg-slate-50 px-5 flex flex-col justify-center gap-1 min-w-[120px] h-20 md:h-24 rounded-xl border border-slate-100">
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Quantity/Units</p>
               <p className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-none">{event.guestCount}</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="p-5 md:p-6 bg-white rounded-2xl md:rounded-[2rem] border-2 border-slate-50 shadow-sm hover:border-slate-100 transition-all flex flex-col justify-center gap-1">
               <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">Gross Revenue</p>
               <h4 className="text-sm md:text-base font-black text-slate-900 tracking-tighter">{NAIRA_SYMBOL}{(revenue / 100).toLocaleString()}</h4>
            </div>
            <div className="p-5 md:p-6 bg-white rounded-2xl md:rounded-[2rem] border-2 border-slate-50 shadow-sm hover:border-rose-100 transition-all flex flex-col justify-center gap-1">
               <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">Est. Direct Costs</p>
               <h4 className="text-sm md:text-base font-black text-rose-600 tracking-tighter">{NAIRA_SYMBOL}{(estimatedCost / 100).toLocaleString()}</h4>
            </div>
            <div className="p-5 md:p-6 bg-slate-900 rounded-2xl md:rounded-[2rem] shadow-xl ring-4 ring-slate-50 flex flex-col justify-center gap-1">
               <p className="text-[8px] md:text-[9px] font-black text-[#00ff9d] uppercase tracking-widest">Projected Net</p>
               <h4 className="text-sm md:text-base font-black text-white tracking-tighter">{NAIRA_SYMBOL}{(estimatedNet / 100).toLocaleString()}</h4>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
            <section className="min-w-0">
               <div className="flex items-center gap-4 mb-8">
                  <h4 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">{event.orderType === 'Cuisine' ? terms.standardOrders : terms.customOrders} Details</h4>
                  <div className="h-px flex-1 bg-slate-100"></div>
               </div>
               <div className="grid grid-cols-1 gap-4">
                  {event.items?.map((item, idx) => (
                     <div key={idx} className="p-4 md:p-5 bg-white border-2 border-slate-50 rounded-2xl flex justify-between items-center group hover:border-indigo-100 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all"><industryConfig.ui.fulfillmentIcon size={16} /></div>
                           <div>
                              <p className="font-black text-slate-800 uppercase text-xs md:text-sm tracking-tight truncate">{item.name}</p>
                              <p className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-widest">{terms.unitLabel} Multiplier</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="font-black text-base md:text-lg text-slate-900 leading-none">{item.quantity}</p>
                           <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Qty</p>
                        </div>
                     </div>
                  ))}
               </div>
            </section>

            <section className="min-w-0">
               <div className="flex items-center gap-4 mb-8">
                  <h4 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Coordination Intel</h4>
                  <div className="h-px flex-1 bg-slate-100"></div>
               </div>
               <div className="space-y-4">
                  {event.orderType === 'Cuisine' && event.cuisineDetails?.packaging && (
                     <div className="p-5 md:p-6 bg-indigo-50 border border-indigo-100 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2">
                           <Box size={12} className="text-indigo-600" />
                           <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Packaging Choice</p>
                        </div>
                        <p className="text-base font-black text-indigo-900 uppercase tracking-tight">{event.cuisineDetails.packaging}</p>
                     </div>
                  )}
                  {event.banquetDetails?.eventPlanner && event.orderType !== 'Cuisine' && (
                     <div className="p-5 md:p-6 bg-slate-900 border border-[#00ff9d]/20 rounded-2xl shadow-xl">
                        <div className="flex items-center gap-3 mb-2">
                           <User size={12} className="text-[#00ff9d]" />
                           <p className="text-[8px] font-black text-[#00ff9d] uppercase tracking-widest">Lead Co-ordinator</p>
                        </div>
                        <p className="text-base md:text-lg font-black text-white uppercase tracking-tight">{event.banquetDetails.eventPlanner}</p>
                     </div>
                  )}
                  {(event.cuisineDetails?.notes || event.banquetDetails?.notes) && (
                     <div className="p-5 md:p-6 bg-white border-2 border-slate-100 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2">
                           <FileText size={12} className="text-indigo-600" />
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Operational Notes</p>
                        </div>
                        <p className="text-xs md:text-sm font-medium text-slate-600 leading-relaxed italic line-clamp-4">"{event.cuisineDetails?.notes || event.banquetDetails?.notes}"</p>
                     </div>
                  )}
               </div>
            </section>
         </div>

         <div className="pt-8 pb-4 border-t border-slate-100 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            <div className="flex items-center gap-4 shrink-0">
               <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><Clock size={20} /></div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Workflow Phase</p>
                  <p className="text-lg font-black text-indigo-900 uppercase tracking-tighter">{event.currentPhase}</p>
               </div>
            </div>
            <div className="w-full md:w-auto flex flex-col md:flex-row flex-wrap gap-3 md:gap-4 justify-end items-stretch md:items-center">
               {event.currentPhase === 'Procurement' && procurementStatus === 'None' && (
                  <button onClick={() => window.dispatchEvent(new CustomEvent('open-procurement'))} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg flex items-center gap-2 active:scale-95 transition-all">
                     <Truck size={18} /> Plan Fulfillment Execution
                  </button>
               )}
               {event.currentPhase === 'Procurement' && procurementStatus === 'Pending' && (
                  <div className="flex items-center gap-3 px-8 py-4 bg-amber-50 text-amber-600 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-amber-100">
                     <Clock size={18} className="animate-pulse" /> Awaiting Finance Approval
                  </div>
               )}
               {event.currentPhase === 'Procurement' && procurementStatus === 'Rejected' && (
                  <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                     <div className="flex items-center justify-center gap-3 px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-rose-100">
                        <AlertCircle size={18} className="animate-pulse" /> Needs Attention
                     </div>
                     <button onClick={() => onOpenRequisitions(event)} className="bg-rose-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg flex items-center gap-2 active:scale-95 transition-all w-full md:w-auto">
                        <ClipboardList size={18} /> Manage Requisitions
                     </button>
                  </div>
               )}
               {event.currentPhase === 'Procurement' && (procurementStatus === 'Pending' || procurementStatus === 'Approved') && (
                  <button onClick={() => onOpenRequisitions(event)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg flex items-center gap-2 active:scale-95 transition-all">
                     <ClipboardList size={18} /> Track Requisitions
                  </button>
               )}
               {event.currentPhase === 'Procurement' && procurementStatus === 'Approved' && (
                  <button onClick={handleGeneratePO} className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg flex items-center gap-2 active:scale-95 transition-all">
                     <CheckCircle2 size={18} /> Generate Purchase Order
                  </button>
               )}
               {event.currentPhase === 'Execution' && event.status !== 'Completed' && (
                  <>
                     <button onClick={() => onOpenMonitor(event.id)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg flex items-center gap-2 active:scale-95 transition-all">
                        <Activity size={18} /> Launch Live Monitor
                     </button>
                     {event.banquetDetails?.productionConfirmed ? (
                        <div className="bg-orange-50 text-orange-600 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-orange-100 flex items-center gap-3">
                           <Flame size={18} className="animate-pulse" /> {terms.productionLabel} In Progress
                        </div>
                     ) : (
                        <button onClick={handleCook} className="bg-orange-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg flex items-center gap-2 active:scale-95 transition-all">
                           <Flame size={18} /> Confirm {terms.productionLabel}
                        </button>
                     )}
                  </>
               )}
               {(event.currentPhase === 'PostEvent' || event.status === 'Completed' || event.status === 'Archived') && (
                  <>
                     <button
                        onClick={() => event.portionMonitor && generateHandoverReport(event, event.portionMonitor)}
                        className="bg-slate-900 text-[#00ff9d] px-6 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg flex items-center gap-2 active:scale-95 transition-all"
                     >
                        <FileText size={18} /> View Handover Report
                     </button>
                     {event.status !== 'Archived' && (
                        <button
                           onClick={() => onOpenLogistics(event)}
                           className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg flex items-center gap-2 active:scale-95 transition-all"
                        >
                           <Truck size={18} /> Logistics Return
                        </button>
                     )}
                     {event.status === 'Archived' && (
                        <div className="bg-slate-50 text-slate-400 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-slate-100 flex items-center gap-3">
                           <CheckCircle2 size={18} /> Order Closed
                        </div>
                     )}
                  </>
               )}
               {event.currentPhase === 'Procurement' && isAdminOrMD && (
                  <button onClick={handleBypass} className="bg-slate-100 text-slate-400 px-6 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest border border-slate-200 shadow-sm flex items-center gap-2 active:scale-95 transition-all opacity-60 hover:opacity-100">
                     <SkipForward size={18} /> Bypass to Execution
                  </button>
               )}
               <button onClick={handleCancelOrder} className="px-8 py-4 text-rose-400 font-black uppercase text-[10px] tracking-widest hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">Cancel Order</button>
               <button onClick={onClose} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-all">Close Order</button>
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
                  <p className="text-[10px] text-slate-400 font-black uppercase mt-2">Institutional benchmark: Performance Target Optimization</p>
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
                           <td className="px-8 py-5 text-right font-black text-slate-900">{NAIRA_SYMBOL}{(c.revenueCents / 100).toLocaleString()}</td>
                           <td className="px-8 py-5 text-right font-black text-rose-500">{NAIRA_SYMBOL}{(c.totalIngredientCostCents / 100).toLocaleString()}</td>
                           <td className="px-8 py-5 text-right font-black text-emerald-600">{NAIRA_SYMBOL}{(c.grossMarginCents / 100).toLocaleString()}</td>
                           <td className="px-8 py-5">
                              <div className="flex flex-col items-center gap-1">
                                 <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-600" style={{ width: `${c.grossMarginPercentage}% ` }}></div>
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

const StandardOrderModal = ({ onClose, onFinalize, vertical, industryConfig }: { onClose: () => void, onFinalize: (inv: Invoice) => void, vertical: IndustryType, industryConfig: IndustryProfile }) => {
   const { settings } = useSettingsStore();
   const terms = industryConfig.nomenclature.fulfillment;

   const [items, setItems] = useState<{ id: string, name: string, quantity: number, priceCents: number, category: string, discountCents?: number }[]>([]);
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
   const [customerName, setCustomerName] = useState(''); // Fallback or new customer
   const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
   const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
   const [searchQuery, setSearchQuery] = useState('');
   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
   const dropdownRef = useRef<HTMLDivElement>(null);

   const [deliveryLocation, setDeliveryLocation] = useState('');
   const [packaging, setPackaging] = useState(vertical === 'Bakery' ? 'Pastry Box' : (vertical === 'Catering' ? 'Chafing Dish / Foil Tray' : 'Standard Packaging'));

   const [customProductName, setCustomProductName] = useState('');
   const [customProductPrice, setCustomProductPrice] = useState(0);
   const [customProductQuantity, setCustomProductQuantity] = useState(10);
   const [customProductCategory, setCustomProductCategory] = useState('Others');


   const { createCateringOrder, contacts } = useDataStore();

   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsDropdownOpen(false);
         }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);

   useEffect(() => {
      const draftKey = `fulfillment_${vertical.toLowerCase()}_standard_draft`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
         try {
            const draft = JSON.parse(savedDraft);
            if (window.confirm("Found an unfinished Standard Order draft. Restore it?")) {
               setSearchTerm(draft.customerName || '');
               setCustomerName(draft.customerName || '');
               setEventDate(draft.eventDate || new Date().toISOString().split('T')[0]);
               setInvoiceDate(draft.invoiceDate || new Date().toISOString().split('T')[0]);
               setItems(draft.items || []);
            } else {
               localStorage.removeItem(`fulfillment_${vertical.toLowerCase()}_standard_draft`);
            }
         } catch (e) {
            console.error(e);
         }
      }
   }, []);

   // [AUTO-SAVE DRAFT]
   useEffect(() => {
      const timer = setTimeout(() => {
         const hasData = customerName || items.length > 0;
         if (hasData) {
            const draft = {
               customerName: selectedContact ? selectedContact.name : customerName,
               contactId: selectedContact?.id,
               eventDate,
               invoiceDate,
               items,
               timestamp: Date.now()
            };
            localStorage.setItem(`fulfillment_${vertical.toLowerCase()}_standard_draft`, JSON.stringify(draft));
            console.log(`[FulfillmentHub] ${vertical} Draft auto-saved.`);
         }
      }, 2000);

      return () => clearTimeout(timer);
   }, [customerName, selectedContact, eventDate, invoiceDate, items]);

   const currentProducts = vertical === 'Bakery' ? PREDEFINED_BAKERY_PRODUCTS : PREDEFINED_CUISINE_PRODUCTS;

   const filteredProducts = useMemo(() => {
      if (!searchQuery) return currentProducts;
      return currentProducts.filter(p =>
         p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
   }, [searchQuery, currentProducts]);

   const filteredContacts = useMemo(() => {
      if (!searchTerm) return [];
      return contacts.filter(c =>
         c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
      ).slice(0, 5);
   }, [contacts, searchTerm]);


   const addItem = (p: CuisineProduct) => {
      const existing = items.find(i => i.name === p.name);
      const minQty = p.minPortions || 10;
      if (existing) {
         setItems(items.map(i => i.name === p.name ? { ...i, quantity: i.quantity + 1 } : i));
      } else {
         setItems([...items, {
            id: `cuisine-${Date.now()}`,
            name: p.name,
            quantity: minQty,
            priceCents: Math.round(p.price * 100),
            category: p.category
         }]);
      }
   };


   const addCustomItem = () => {
      if (!customProductName || customProductPrice <= 0 || customProductQuantity <= 0) return;
      setItems([...items, {
         id: `custom-${Date.now()}`,
         name: customProductName,
         quantity: customProductQuantity,
         priceCents: Math.round(customProductPrice * 100),
         category: customProductCategory
      }]);
      setCustomProductName('');
      setCustomProductPrice(0);
      setCustomProductQuantity(10);
   };




   const updateName = (index: number, newName: string) => {
      const newItems = [...items];
      newItems[index].name = newName;
      setItems(newItems);
   };

   const updateQty = (index: number, newQty: number) => {
      const newItems = [...items];
      newItems[index].quantity = Math.max(1, newQty);
      setItems(newItems);
   };

   const updatePrice = (index: number, newPriceCents: number) => {
      const newItems = [...items];
      newItems[index].priceCents = Math.max(0, newPriceCents);
      setItems(newItems);
   };

   const updateDiscount = (index: number, newDiscountCents: number) => {
      const newItems = [...items];
      newItems[index].discountCents = Math.max(0, newDiscountCents);
      setItems(newItems);
   };

   const removeItem = (index: number) => {
      const newItems = [...items];
      newItems.splice(index, 1);
      setItems(newItems);
   };

   const addNewLineItem = () => {
      setItems([...items, {
         id: `manual-${Date.now()}`,
         name: '',
         quantity: 1,
         priceCents: 0,
         category: 'Custom',
         discountCents: 0
      }]);
   };

   const totalCents = items.reduce((sum, item) => sum + (item.priceCents * item.quantity) - (item.discountCents || 0), 0);

   const handleCreate = async () => {
      if (!customerName || items.length === 0) {
         alert("Please provide customer name and at least one item.");
         return;
      }

      const payload = {
         customerName: selectedContact ? selectedContact.name : customerName,
         contactId: selectedContact?.id,
         eventDate,
         invoiceDate,
         guestCount: items.reduce((a, b) => a + b.quantity, 0),
         items: items.map(i => ({
            inventoryItemId: i.id,
            name: i.name,
            quantity: i.quantity,
            priceCents: i.priceCents,
            costCents: i.priceCents * 0.4 // Default cost estimate
         })),
         orderType: 'Standard',
         banquetDetails: {
            notes: 'Standard Order',
            eventType: 'Standard Order',
            location: deliveryLocation,
            contactPerson: packaging // Using contactPerson as proxy for packaging in legacy field
         }
      };

      try {
         const { invoice } = await createCateringOrder(payload);
         localStorage.removeItem(`fulfillment_${vertical.toLowerCase()}_standard_draft`);
         onFinalize(invoice);
         onClose();
      } catch (err) {
         console.error(err);

         const draft = {
            customerName: selectedContact ? selectedContact.name : customerName,
            contactId: selectedContact?.id,
            eventDate,
            invoiceDate,
            items,
            timestamp: Date.now()
         };
         localStorage.setItem(`fulfillment_${vertical.toLowerCase()}_standard_draft`, JSON.stringify(draft));

         alert("Failed to create standard order. Your data has been saved as a draft. Reload to restore.");
      }
   };

   const handleCancel = () => {
      if (confirm("Are you sure you want to cancel? Any unsaved changes will be lost.")) {
         localStorage.removeItem(`fulfillment_${vertical.toLowerCase()}_standard_draft`);
         onClose();
      }
   };

   return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 md:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
         <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-7xl overflow-hidden flex flex-col h-[90vh] max-h-[850px] border border-slate-200">
            <div className="p-4 md:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20"><UtensilsCrossed size={20} /></div>
                  <div>
                     <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                        {terms.standardOrders} Portal
                     </h2>
                     <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Select products for immediate fulfillment</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-4 bg-slate-100 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm"><X size={24} /></button>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden overflow-y-auto">
               {/* LEFT PANE (66%): DATA ENTRY (Customer, Custom Item, Line Items, Search) */}
               <div className="w-full lg:w-2/3 flex flex-col bg-white border-b lg:border-b-0 lg:border-r border-slate-100 lg:overflow-hidden relative z-10">
                  <div className="flex-1 flex flex-col min-h-0 lg:overflow-y-auto scrollbar-thin">
                     <div className="p-6 space-y-6">
                        {/* 1. Customer Selection */}
                        <div className="space-y-2 relative z-50">
                           <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Customer / Contact</label>
                           <div className="relative group/search">
                              <input
                                 type="text"
                                 className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                 value={searchTerm}
                                 onChange={e => {
                                    setSearchTerm(e.target.value);
                                    setCustomerName(e.target.value);
                                    if (selectedContact) setSelectedContact(null);
                                 }}
                                 placeholder="Search or Enter Name"
                              />
                              <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />

                              {searchTerm && !selectedContact && filteredContacts.length > 0 && (
                                 <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto overflow-x-hidden p-2 space-y-1 animate-in slide-in-from-top-2">
                                    {filteredContacts.map(c => (
                                       <button
                                          key={c.id}
                                          onClick={() => {
                                             setSelectedContact(c);
                                             setSearchTerm(c.name);
                                             setCustomerName(c.name);
                                          }}
                                          className="w-full text-left p-3 hover:bg-emerald-50 rounded-xl transition-all group/item"
                                       >
                                          <p className="font-bold text-slate-800 text-sm group-hover/item:text-emerald-700">{c.name}</p>
                                          <p className="text-[10px] text-slate-400 font-bold">{c.email || 'No email'}</p>
                                       </button>
                                    ))}
                                 </div>
                              )}
                           </div>
                        </div>

                        {/* Delivery Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Delivery Address</label>
                              <input
                                 type="text"
                                 className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                                 value={deliveryLocation}
                                 onChange={e => setDeliveryLocation(e.target.value)}
                                 placeholder="e.g. 123 Lagos St"
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Packaging Info</label>
                              <select
                                 className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                                 value={packaging}
                                 onChange={e => setPackaging(e.target.value)}
                              >
                                 {vertical === 'Bakery' ? (
                                    <>
                                       <option>Pastry Box (Standard)</option>
                                       <option>Individual Cake Box</option>
                                       <option>Tiered Cake Carrier</option>
                                       <option>Gift Packaging</option>
                                    </>
                                 ) : vertical === 'Catering' ? (
                                    <>
                                       <option>Chafing Dish / Foil Tray</option>
                                       <option>Cooler Bag / Thermal Box</option>
                                       <option>Plastic Disposable Tray</option>
                                       <option>Buffet Setup Provided</option>
                                    </>
                                 ) : (
                                    <>
                                       <option>Standard Packaging</option>
                                       <option>Eco-Friendly Wrap</option>
                                       <option>Premium Box</option>
                                    </>
                                 )}
                                 <option>Custom Packaging</option>
                              </select>
                           </div>
                        </div>

                        {/* 4. Quick Product Search (Moved to Top) */}
                        <div className="relative group/search z-40 mb-6" ref={dropdownRef}>
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block">Quick Product Search</label>
                           <div className="relative">
                              <input
                                 type="text"
                                 placeholder="Search products to add..."
                                 className="w-full pl-12 pr-12 py-3 bg-slate-50/50 border border-slate-100 rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/50 text-slate-900 transition-all hover:bg-white"
                                 value={searchQuery}
                                 onChange={e => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
                                 onFocus={() => setIsDropdownOpen(true)}
                              />
                              <Grid3X3 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                              <button
                                 onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                 className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors"
                              >
                                 <ChevronDown size={18} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''} `} />
                              </button>
                           </div>

                           {isDropdownOpen && (
                              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[100] max-h-[300px] overflow-y-auto overflow-x-hidden p-2 space-y-1 animate-in slide-in-from-top-2">
                                 {filteredProducts.map(product => (
                                    <button
                                       key={product.name}
                                       onClick={() => {
                                          addItem(product);
                                          setSearchQuery('');
                                          setIsDropdownOpen(false);
                                       }}
                                       className="w-full text-left p-3 hover:bg-emerald-50 rounded-xl transition-all group/item flex justify-between items-center"
                                    >
                                       <div className="flex-1 mr-4">
                                          <p className="font-bold text-slate-800 text-sm group-hover/item:text-emerald-700">{product.name}</p>
                                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                             {NAIRA_SYMBOL}{product.price.toLocaleString()}
                                          </p>
                                       </div>
                                       <span className="text-[8px] font-black uppercase text-slate-300 group-hover/item:text-emerald-500 bg-slate-50 px-2 py-1 rounded-md transition-all group-hover/item:bg-emerald-100">{product.category}</span>
                                    </button>
                                 ))}
                              </div>
                           )}
                        </div>

                        {/* 2. Add Custom Product (Manual Entry) */}
                        <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4 relative overflow-visible">
                           <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 opacity-50 pointer-events-none"></div>
                           <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest relative z-10">Add Custom Product</p>
                           <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative z-10">
                              <input
                                 type="text"
                                 placeholder="Product Name"
                                 className="md:col-span-2 w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-all text-slate-900 shadow-sm"
                                 value={customProductName}
                                 onChange={e => setCustomProductName(e.target.value)}
                              />
                              <div className="relative md:col-span-1">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-xs font-bold">{NAIRA_SYMBOL}</span>
                                 <input
                                    type="number"
                                    placeholder="Price"
                                    className="w-full p-3 pl-7 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-all text-slate-900 shadow-sm"
                                    value={customProductPrice || ''}
                                    onChange={e => setCustomProductPrice(parseInt(e.target.value) || 0)}
                                 />
                              </div>
                              <div className="relative md:col-span-1 flex gap-2">
                                 <div className="relative flex-1">
                                    <input
                                       type="number"
                                       placeholder="Qty"
                                       className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-all text-slate-900 shadow-sm"
                                       value={customProductQuantity || ''}
                                       onChange={e => setCustomProductQuantity(parseInt(e.target.value) || 0)}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-700 font-black uppercase">Qty</span>
                                 </div>
                                 <button
                                    onClick={addCustomItem}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 flex items-center justify-center shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                                 >
                                    <Plus size={16} />
                                 </button>
                              </div>
                           </div>
                        </div>

                        {/* 3. Line Items Table */}
                        <div className="bg-white rounded-xl">
                           <div className="flex justify-between items-center mb-4">
                              <h3 className="text-sm font-bold uppercase text-slate-600 tracking-widest px-1">Line Items</h3>
                              <button
                                 onClick={addNewLineItem}
                                 className="bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-[10px] font-bold px-4 py-2 transition-colors flex items-center gap-2 uppercase tracking-wider"
                              >
                                 <Plus size={12} /> Add Row
                              </button>
                           </div>

                           <div className="space-y-4 lg:space-y-2">
                              {items.length === 0 && (
                                 <div className="py-12 flex flex-col items-center justify-center text-slate-300 opacity-50 space-y-4 border-2 border-dashed border-slate-100 rounded-2xl">
                                    <ShoppingBag size={48} strokeWidth={1} />
                                    <p className="text-sm font-bold uppercase tracking-widest">No items added</p>
                                 </div>
                              )}
                              {items.map((item, idx) => (
                                 <div key={idx} className="flex flex-col lg:flex-row lg:items-center gap-3 py-4 lg:py-2 border-b border-slate-100 lg:border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors rounded-lg px-2 group relative">
                                    <div className="flex items-center justify-between lg:justify-start gap-3">
                                       <span className="text-slate-400 font-bold text-sm w-6 shrink-0">{idx + 1}.</span>
                                       <div className="flex-1 lg:flex-initial">
                                          <input
                                             type="text"
                                             className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all"
                                             placeholder="Description or Select Item"
                                             value={item.name}
                                             onChange={e => updateName(idx, e.target.value)}
                                          />
                                       </div>
                                       {/* Mobile Trash Button */}
                                       <button
                                          onClick={() => removeItem(idx)}
                                          className="lg:hidden p-2 text-rose-400 hover:text-rose-600 bg-rose-50 rounded-lg"
                                       >
                                          <Trash2 size={16} />
                                       </button>
                                    </div>

                                    <div className="flex items-center gap-2 lg:contents">
                                       <div className="flex-1 lg:w-20 lg:shrink-0 text-center">
                                          <div className="relative">
                                             <input
                                                type="number"
                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-2 text-center text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none"
                                                value={item.quantity}
                                                onChange={e => updateQty(idx, parseInt(e.target.value) || 0)}
                                             />
                                             <span className="lg:hidden absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-black uppercase">Qty</span>
                                          </div>
                                       </div>

                                       <div className="flex-1 lg:w-28 lg:shrink-0 relative">
                                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₦</span>
                                          <input
                                             type="number"
                                             className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-7 pr-3 py-2 text-right text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none"
                                             value={item.priceCents / 100}
                                             onChange={e => updatePrice(idx, Math.round((parseFloat(e.target.value) || 0) * 100))}
                                          />
                                       </div>

                                       <div className="flex-1 lg:w-28 lg:shrink-0 relative">
                                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400 text-[10px] font-bold">₦</span>
                                          <input
                                             type="number"
                                             className="w-full bg-orange-50 border border-orange-100 rounded-lg pl-6 pr-3 py-2 text-right text-sm font-bold text-orange-600 placeholder-orange-300 focus:border-orange-300 outline-none"
                                             placeholder="Discount"
                                             value={item.discountCents ? item.discountCents / 100 : ''}
                                             onChange={e => updateDiscount(idx, Math.round((parseFloat(e.target.value) || 0) * 100))}
                                          />
                                       </div>
                                    </div>

                                    <button
                                       onClick={() => removeItem(idx)}
                                       className="hidden lg:block p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                    >
                                       <X size={16} />
                                    </button>
                                 </div>
                              ))}
                           </div>
                        </div>


                     </div>
                  </div>
               </div>

               {/* RIGHT PANE (33%): SUMMARY & DATES */}
               <div className="w-full lg:w-1/3 flex flex-col bg-slate-50/50 lg:h-full border-t lg:border-t-0 lg:border-l border-slate-100 lg:overflow-hidden">
                  {/* DATES SECTION (CONSTANT) */}
                  <div className="p-6 bg-white border-b border-slate-100 space-y-4 z-20">
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Invoice Date</label>
                           <input
                              type="date"
                              className="w-full p-4 bg-slate-50/50 border border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm transition-all"
                              value={invoiceDate}
                              onChange={e => setInvoiceDate(e.target.value)}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Fulfillment Date</label>
                           <input
                              type="date"
                              className="w-full p-4 bg-slate-50/50 border border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm transition-all"
                              value={eventDate}
                              onChange={e => setEventDate(e.target.value)}
                           />
                        </div>
                     </div>
                  </div>

                  {/* FINANCIALS & ACTIONS - PINNED FOOTER PATTERN */}
                  <div className="lg:flex-1 flex flex-col p-6 overflow-hidden">
                     <div className="flex-1 overflow-y-auto pr-1 space-y-8 lg:scrollbar-thin">
                        {/* Financials */}
                        <div className="bg-slate-950 rounded-[2rem] p-6 shadow-xl shadow-slate-900/10 text-center space-y-1 relative overflow-hidden group">
                           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50"></div>
                           <p className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">Total Amount</p>
                           <div className="flex items-baseline justify-center gap-1">
                              <span className="text-xl font-bold text-slate-600">{NAIRA_SYMBOL}</span>
                              <span className="text-3xl md:text-4xl font-black text-white tracking-tight">{(totalCents / 100).toLocaleString()}</span>
                           </div>
                        </div>
                     </div>

                     {/* FIXED ACTIONS AT BOTTOM */}
                     <div className="pt-6 space-y-3 shrink-0 border-t border-slate-100 mt-2">
                        <button
                           onClick={handleCreate}
                           className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm py-4 uppercase tracking-widest shadow-xl shadow-indigo-200 hover:shadow-indigo-300 active:scale-95 transition-all"
                        >
                           Generate Invoice
                        </button>
                        <button
                           onClick={handleCancel}
                           className="w-full py-3 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                        >
                           Cancel
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export const FulfillmentHub = ({ vertical }: { vertical?: IndustryType }) => {
   const { settings } = useSettingsStore();
   const activeVertical = vertical || (settings.type as IndustryType);
   const industryConfig = getIndustryConfig(activeVertical);
   const terms = industryConfig.nomenclature?.fulfillment || (INDUSTRY_PROFILES.Catering.nomenclature.fulfillment);
   const features = industryConfig.features;

   const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

   const [amendEventId, setAmendEventId] = useState<string | null>(null);
   const [showBrochure, setShowBrochure] = useState(false);
   const [showStandardOrder, setShowStandardOrder] = useState(false);
   const [showCuisineOrder, setShowCuisineOrder] = useState(false);
   const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null);
   const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
   const [activeTab, setActiveTab] = useState<'orders' | 'fulfillment' | 'matrix' | 'cuisine'>(features.showBOQ ? 'fulfillment' : 'orders');
   const [showProcurement, setShowProcurement] = useState(false);
   const [isManualInvoiceModalOpen, setIsManualInvoiceModalOpen] = useState(false);
   const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
   const [searchParams] = useSearchParams();

   // New states for portalized modals
   const [portionMonitorEventId, setPortionMonitorEventId] = useState<string | null>(null);
   const [assetDispatchEvent, setAssetDispatchEvent] = useState<CateringEvent | null>(null);
   const [logisticsReturnEvent, setLogisticsReturnEvent] = useState<CateringEvent | null>(null);
   const [requisitionTrackerEvent, setRequisitionTrackerEvent] = useState<CateringEvent | null>(null);
   const [procurementWizardEvent, setProcurementWizardEvent] = useState<CateringEvent | null>(null);
   const [orderBrochureEvent, setOrderBrochureEvent] = useState<CateringEvent | null>(null);


   useEffect(() => {
      const id = searchParams.get('id');
      if (id) {
         setSelectedEventId(id);
         console.log('[Catering] Deep-linked Event ID:', id);
      }
   }, [searchParams]);

   const cateringEvents = useDataStore(state => state.cateringEvents);
   const { user } = useAuthStore();
   const isBakery = activeVertical === 'Bakery' || settings.name?.toLowerCase().includes('wembley');
   const isCatering = (activeVertical === 'Catering' || settings.name?.toLowerCase().includes('xquisite')) && !isBakery;
   const syncStatus = useDataStore(state => state.syncStatus);
   const invoices = useDataStore(state => state.invoices);
   const finalizeProforma = useDataStore(state => state.finalizeProforma);

   const filteredEvents = useMemo(() => {
      // Filter out Cancelled events entirely from the dashboard as per user request ("remove totally")
      let base = cateringEvents.filter(e => e.status !== 'Cancelled');
      
      // Vertical filtering: each route shows only its own orders.
      // Untagged events (no vertical set) are treated as belonging to Catering (the primary vertical).
      // The Bakery route only shows events explicitly tagged as 'Bakery'.
      if (vertical === 'Bakery') {
         base = base.filter(e => e.vertical === 'Bakery');
      } else if (vertical === 'Catering') {
         base = base.filter(e => e.vertical === 'Catering' || !e.vertical);
      }
      // For any other vertical (or no vertical prop), show all unfiltered

      return base.filter(ev => {
         // Robust derivation of Cuisine status for filtering
         // STRICT ID-BASED MAPPING: Only link if invoice ID matches exactly.
         const matchingInvoice = invoices.find(inv => {
            const evInvId = ev.financials?.invoiceId || (ev.financials as any)?.invoice_id;
            return evInvId && inv.id === evInvId;
         });

         // Derivation of standard vs custom orders for filtering
         const isStandard = ev.orderType === 'Cuisine' || ev.orderType === 'Standard' || ev.orderType === 'Package' ||
            matchingInvoice?.category === 'Cuisine' ||
            matchingInvoice?.category === 'Standard' ||
            (settings.type === 'Sports Foundation' && (ev.orderType === 'Standard' || ev.orderType === 'Package'));

         if (activeTab === 'orders') {
            if (isStandard) return false;
            // Orders tab excludes standard items
            if (viewMode === 'active') return ev.status !== 'Archived';
            return ev.status === 'Archived';
         } else if (activeTab === 'cuisine') {
            if (!isStandard) return false;
            if (viewMode === 'active') return ev.status !== 'Archived';
            return ev.status === 'Archived';
         }

         return true;
      });
   }, [cateringEvents, invoices, viewMode, activeTab, vertical]);

   const selectedEvent = useMemo(() => selectedEventId ? (cateringEvents.find(e => e.id === selectedEventId) || null) : null, [cateringEvents, selectedEventId]);

   const amendEvent = useMemo(() => amendEventId ? (cateringEvents.find(e => e.id === amendEventId) || null) : null, [cateringEvents, amendEventId]);



   useEffect(() => {
      const handleProcOpen = (e: CustomEvent<CateringEvent>) => {
         setProcurementWizardEvent(e.detail);
      };
      // Listen for custom event to open procurement wizard from EventNodeSummary
      window.addEventListener('open-procurement', handleProcOpen as EventListener);

      return () => {
         window.removeEventListener('open-procurement', handleProcOpen as EventListener);
      };
   }, []);

   const handleFinalizePush = (invoice: Invoice) => {
      setGeneratedInvoice(invoice);
   };

   const handleCommitInvoice = (inv: Invoice) => {
      // Data already finalized in WaveInvoiceModal via finalizeInvoice
      setGeneratedInvoice(null);
      // Auto-select the newest event if none is currently viewed
      if (!selectedEventId && cateringEvents.length > 0) {
         setSelectedEventId(cateringEvents[0].id);
      }
   };

   return (
      <div className="space-y-8 animate-in fade-in pb-24">
         <div className="bg-slate-950 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff6b6b]/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
               <div className="flex items-center gap-6">

                  <div className="w-16 h-16 bg-[#ff6b6b] rounded-3xl flex items-center justify-center shadow-2xl animate-float">
                     <industryConfig.ui.fulfillmentIcon size={36} className="text-white" />
                  </div>
                  <div>
                     <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">
                        {terms.fulfillmentHub}
                     </h1>
                     <p className="text-[10px] text-slate-500 font-black uppercase mt-1 tracking-widest">
                        {industryConfig.label} Fulfillment & Operations Active
                     </p>
                  </div>
               </div>
               <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md gap-2 overflow-x-auto no-scrollbar max-w-full">
                  <button
                     onClick={() => {
                        const url = `${window.location.origin} /#/brochure`;
                        navigator.clipboard.writeText(url);
                        alert('Brochure Link Copied to Clipboard!');
                     }}
                     className="whitespace-nowrap px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 text-[#00ff9d] hover:bg-white/5"
                  >
                     <Share2 size={14} /> <span className="hidden md:inline">Share Booking Link</span><span className="md:hidden">Share</span>
                  </button>
                  <div className="w-px bg-white/10 my-2 shrink-0"></div>

                  {[
                     { id: 'cuisine', label: terms.standardOrdersLabel, icon: industryConfig.ui.standardIcon || UtensilsCrossed },
                     { id: 'orders', label: terms.customOrdersLabel, icon: industryConfig.ui.customIcon || ShoppingBag },
                     { id: 'matrix', label: 'Matrix', icon: Grid3X3 }
                  ].map(tab => (
                     <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id as any); setSelectedEventId(null); }}
                        className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-[#ff6b6b] text-white shadow-lg' : 'text-white/50 hover:text-white'} `}
                     >
                        <tab.icon size={14} /> {tab.label}
                     </button>
                  ))}
               </div>
            </div>
         </div>

         {(activeTab === 'orders' || activeTab === 'cuisine') && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">

               <div className={`${selectedEvent ? 'lg:col-span-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-auto max-h-none overflow-visible lg:block lg:space-y-3 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-1' : 'lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'} `}>
                  <div className={`flex flex-col gap-4 px-4 ${selectedEvent ? 'lg:px-0' : 'lg:col-span-3 xl:col-span-4'} `}>
                     <div className="flex flex-col md:flex-row justify-between md:items-center items-start gap-4">
                        <h2 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em]">
                           {viewMode} {activeTab === 'orders' ? terms.customOrders : terms.standardOrders} ({filteredEvents.length})
                        </h2>
                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                           {activeTab === 'orders' ? (
                              <button onClick={() => setOrderBrochureEvent({} as CateringEvent)} className="flex-1 md:flex-none px-4 md:px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-xl active:scale-95 hover:bg-slate-800 transition-all"><Plus size={16} /> New {terms.customOrders}</button>
                           ) : (
                              <button onClick={() => setShowCuisineOrder(true)} className="flex-1 md:flex-none px-4 md:px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all"><FileText size={16} /> New {terms.standardOrders}</button>
                           )}
                        </div>
                     </div>
                     <div className="flex bg-slate-100 p-1 rounded-xl">
                        {['active', 'archived'].map((mode) => (
                           <button
                              key={mode}
                              onClick={() => {
                                 setViewMode(mode as any);
                                 setSelectedEventId(null);
                              }}
                              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === mode ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'} `}
                           >
                              {mode}
                           </button>
                        ))}
                     </div>
                  </div>

                  {filteredEvents.length === 0 && (
                     <div className={`p-8 text-center border-2 border-dashed border-slate-100 rounded-[2rem] ${selectedEvent ? '' : 'lg:col-span-3 xl:col-span-4'} `}>
                        <p className="text-xs font-black uppercase text-slate-300 tracking-widest">No {viewMode} records found</p>
                     </div>
                  )}

                  {filteredEvents?.map(ev => {
                     const { revenue: displayRevenue } = getEventFinancials(ev, invoices);
                     const isSelected = selectedEventId === ev.id;

                     return (
                        <div
                           key={ev.id}
                           onClick={() => {
                              console.log('CLICKED CARD:', ev.id);
                              setSelectedEventId(ev.id);
                           }}
                           className={`rounded-[3rem] p-6 border-2 transition-all cursor-pointer shadow-sm hover:shadow-md h-full flex flex-col justify-between overflow-hidden ${isSelected
                              ? 'bg-slate-900 border-blue-600 ring-4 ring-blue-500/20 text-white'
                              : 'bg-white border-slate-100 hover:border-blue-400 text-slate-800'
                              } `}
                        >
                           <div className="flex justify-between items-start mb-4 gap-2">
                              <h3 className={`font-black text-sm md:text-base uppercase break-words tracking-tighter leading-tight flex-1 ${isSelected ? 'text-white' : 'text-slate-900'} `}>
                                 {ev.customerName || 'No Name'}
                              </h3>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider shrink-0 whitespace-nowrap ${ev.status === 'Confirmed'
                                 ? (isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600')
                                 : (isSelected ? 'bg-green-500/20 text-green-400' : 'bg-green-50 text-green-600')
                                 } `}>
                                 {ev.status}
                              </span>
                           </div>

                           <div className="flex justify-between items-end mt-auto">
                              <div className="flex flex-col gap-1">
                                 <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Guests</p>
                                 <p className={`text-lg font-black ${isSelected ? 'text-white' : 'text-slate-800'} `}>{ev.guestCount || 0}</p>
                              </div>
                              <div className="text-right flex flex-col gap-1">
                                 <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Revenue</p>
                                 <p className={`text-lg font-black ${displayRevenue > 0
                                    ? 'text-emerald-500'
                                    : (isSelected ? 'text-slate-500' : 'text-rose-400')
                                    } `}>
                                    <span className="opacity-70 mr-0.5">{NAIRA_SYMBOL}</span>{(displayRevenue / 100).toLocaleString()}
                                 </p>
                              </div>
                           </div>
                        </div>
                     );
                  })}
               </div>

               {
                  selectedEvent && (
                     <div className="fixed inset-0 z-[160] lg:relative lg:inset-auto lg:z-0 lg:block lg:col-span-2 bg-slate-900/60 backdrop-blur-sm p-4 lg:p-0 overflow-y-auto">
                        <EventNodeSummary
                           event={selectedEvent}
                           onAmend={(ev) => {
                              setAmendEventId(ev.id);
                              setOrderBrochureEvent(ev);
                           }}
                           onViewInvoice={(inv) => setViewingInvoice(inv)}
                           onClose={() => setSelectedEventId(null)}
                           onOpenDispatch={(ev) => setAssetDispatchEvent(ev)}
                           onOpenLogistics={(ev) => setLogisticsReturnEvent(ev)}
                           onOpenRequisitions={(ev) => setRequisitionTrackerEvent(ev)}
                           onOpenMonitor={(eventId) => setPortionMonitorEventId(eventId)}
                        />
                     </div>
                  )
               }
            </div >
         )
         }
         {activeTab === 'matrix' && <CostingMatrix />}

         {/* UI Overlays */}
         {
            orderBrochureEvent && createPortal(
               <OrderBrochure
                  initialEvent={orderBrochureEvent || undefined}
                  vertical={activeVertical}
                  onComplete={() => {
                     setOrderBrochureEvent(null);
                     setAmendEventId(null);
                  }}
                  onFinalize={(inv) => {
                     setOrderBrochureEvent(null);
                     setAmendEventId(null);
                     handleFinalizePush(inv);
                  }}
               />,
               document.body
            )
         }

         {
            showCuisineOrder && createPortal(
               <StandardOrderModal
                  onClose={() => setShowCuisineOrder(false)}
                  onFinalize={handleFinalizePush}
                  vertical={activeVertical}
                  industryConfig={industryConfig}
               />,
               document.body
            )
         }

         {(generatedInvoice || viewingInvoice) && createPortal(
            <WaveInvoiceModal
               invoice={generatedInvoice || viewingInvoice!}
               onSave={(inv) => {
                  if (generatedInvoice) handleCommitInvoice(inv);
                  setViewingInvoice(null);
               }}
               onClose={() => {
                  setGeneratedInvoice(null);
                  setViewingInvoice(null);
               }}
               guestCount={selectedEvent?.guestCount}
               isStandardFlow={(activeTab === 'cuisine' || generatedInvoice?.category === 'Cuisine' || viewingInvoice?.category === 'Cuisine') && 
                   !['Banquet', 'Custom', 'Banquet Orders', 'Custom Orders'].includes(viewingInvoice?.category || generatedInvoice?.category || '')}
               eventId={selectedEvent?.id}
               industryConfig={industryConfig}
            />,
            document.body
         )}

         {
            procurementWizardEvent && createPortal(
               <ProcurementWizard
                  event={procurementWizardEvent}
                  onClose={() => setProcurementWizardEvent(null)}
                  onFinish={handleFinalizePush}
                  industryConfig={industryConfig}
               />,
               document.body
            )
         }

         {
            assetDispatchEvent && createPortal(
               <AssetDispatchModal
                  event={assetDispatchEvent}
                  onClose={() => setAssetDispatchEvent(null)}
               />,
               document.body
            )
         }

         {
            logisticsReturnEvent && createPortal(
               <LogisticsReturnModal
                  event={logisticsReturnEvent}
                  onClose={() => setLogisticsReturnEvent(null)}
                  onComplete={() => {
                     setLogisticsReturnEvent(null);
                     setSelectedEventId(null); // Close event summary after logistics complete
                  }}
               />,
               document.body
            )
         }

         {
            requisitionTrackerEvent && createPortal(
               <div className="fixed inset-0 z-[250] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Procurement Status</h3>
                        <button onClick={() => setRequisitionTrackerEvent(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                           <X size={20} className="text-slate-500" />
                        </button>
                     </div>
                     <RequisitionTracker eventId={requisitionTrackerEvent.id} />
                  </div>
               </div>,
               document.body
            )
         }

         {
            portionMonitorEventId && createPortal(
               <div className="fixed inset-0 z-[200] bg-white">
                  <PortionMonitor initialEventId={portionMonitorEventId} onClose={() => setPortionMonitorEventId(null)} />
               </div>,
               document.body
            )
         }

         {
            isManualInvoiceModalOpen && createPortal(
               <ManualInvoiceModal
                  isOpen={isManualInvoiceModalOpen}
                  onClose={() => setIsManualInvoiceModalOpen(false)}
               />,
               document.body
            )
         }


      </div >
   );
};

