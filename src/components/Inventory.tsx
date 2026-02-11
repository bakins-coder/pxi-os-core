import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
import { supabase, syncTableToCloud, pullCloudState, pullInventoryViews, postReusableMovement, postRentalMovement, postIngredientMovement, uploadEntityImage } from '../services/supabase';
import { Ingredient, InventoryItem, Recipe, Requisition, InventoryMovement, RentalRecord, ItemCosting } from '../types';
import { performAgenticMarketResearch, getLiveRecipeIngredientPrices } from '../services/ai';
import { calculateItemCosting } from '../utils/costing';
import {
   Package, Plus, RefreshCw, Layers, TrendingUp, Utensils,
   Zap, X, Trash2, Edit3, BookOpen, Info, Truck, Hammer, AlertTriangle, History, Clock, Box, Search, Check, Image as ImageIcon, Sparkles, Loader2,
   CheckCircle2, ShoppingBag, Minus, ArrowRight, Flame, ClipboardList, ShieldAlert, RotateCcw, ChevronDown, ChevronUp, Globe, Calculator, ScanLine, Grid, Maximize2, Minimize2, Upload, Coffee
} from 'lucide-react';
import { DocumentCapture } from './DocumentCapture';
import { parseInventoryList } from '../services/ocrService';

const BOQModal = ({ item, portions, onClose, onPortionChange }: { item: InventoryItem, portions: number, onClose: () => void, onPortionChange: (val: number) => void }) => {
   const [isGrounding, setIsGrounding] = useState(false);
   const [costing, setCosting] = useState<ItemCosting | null>(null);
   const [qtyOverrides, setQtyOverrides] = useState<Record<string, number>>({});
   const [isMaximized, setIsMaximized] = useState(false);
   const [showAddIngredient, setShowAddIngredient] = useState<string | null>(null); // group name or 'unassigned'
   const [newIng, setNewIng] = useState({ name: '', qty: 0, unit: 'kg', group: '' });

   const { inventory, recipes, ingredients, updateIngredientPrice, deleteRecipeIngredient, addRecipeIngredient, updateRecipe } = useDataStore();

   const matchedRecipe = recipes.find(r => r.id === item.recipeId);

   const refreshCosting = () => {
      const data = calculateItemCosting(item.id, portions, inventory, recipes, ingredients, qtyOverrides);
      setCosting(data);
   };

   useEffect(() => { refreshCosting(); }, [item, portions, inventory, recipes, ingredients, qtyOverrides]);

   const handleQtyOverride = (name: string, value: string) => {
      const val = parseFloat(value);
      if (isNaN(val)) return;
      setQtyOverrides(prev => ({ ...prev, [name]: val }));
   };

   // Grouping Logic
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
      const agg: Record<string, { name: string, qty: number, unit: string, cost: number }> = {};
      costing.ingredientBreakdown.forEach(ing => {
         if (!agg[ing.name]) {
            agg[ing.name] = { name: ing.name, qty: 0, unit: ing.unit, cost: 0 };
         }
         agg[ing.name].qty += ing.qtyRequired;
         agg[ing.name].cost += ing.totalCostCents;
      });
      return Object.values(agg);
   }, [costing]);

   const addIngredientToRecipe = (group: string) => {
      if (!matchedRecipe || !newIng.name) return;
      addRecipeIngredient(matchedRecipe.id, {
         name: newIng.name,
         qtyPerPortion: newIng.qty,
         unit: newIng.unit,
         subRecipeGroup: group === item.name ? '' : group,
         priceSourceQuery: ''
      });
      setNewIng({ name: '', qty: 0, unit: 'kg', group: '' });
      setShowAddIngredient(null);
   };

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
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose}>
         <div
            onClick={e => e.stopPropagation()}
            className={`bg-white shadow-2xl w-full overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in duration-300 ${isMaximized ? 'fixed inset-0 rounded-none h-full max-w-none' : 'max-w-4xl rounded-t-[2rem] md:rounded-[3rem] h-full md:max-h-[90vh]'}`}
         >
            <div className="p-5 md:p-8 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-20">
               <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg"><Calculator size={20} className="md:w-6 md:h-6" /></div>
                  <div>
                     <h2 className="text-lg md:text-2xl font-black text-slate-900 uppercase tracking-tighter">Neural BoQ Analysis</h2>
                     <p className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase mt-0.5 tracking-widest">{item.name} • Intelligence Node</p>
                  </div>
               </div>

               <div className="flex gap-2">
                  <button onClick={() => setIsMaximized(!isMaximized)} className="hidden md:block p-2 md:p-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl md:rounded-2xl transition-all shadow-sm">
                     {isMaximized ? <Minimize2 size={18} className="md:w-5 md:h-5" /> : <Maximize2 size={18} className="md:w-5 md:h-5" />}
                  </button>
                  <button onClick={onClose} className="p-2 md:p-3 bg-white border border-slate-200 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl md:rounded-2xl transition-all shadow-sm"><X size={20} className="md:w-6 md:h-6" /></button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 md:p-10 space-y-6 md:space-y-10 scrollbar-thin pb-32 md:pb-10">
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

               <div className="bg-white rounded-2xl md:rounded-[2.5rem] border-2 border-indigo-50 shadow-xl overflow-hidden">
                  <div className="overflow-x-auto no-scrollbar">
                     <table className="w-full text-left text-[11px] min-w-full">
                        <thead className="bg-indigo-600 text-white font-black uppercase text-[8px] md:text-[9px] tracking-widest">
                           <tr>
                              <th className="px-4 py-3 md:px-8 md:py-5">Ingredient</th>
                              <th className="px-4 py-3 md:px-8 md:py-5 text-center hidden md:table-cell">MD Scaling</th>
                              <th className="px-4 py-3 md:px-8 md:py-5 text-center">Net Req.</th>
                              <th className="px-4 py-3 md:px-8 md:py-5 text-right hidden md:table-cell">Unit Rate</th>
                              <th className="px-4 py-3 md:px-8 md:py-5 text-right">Value (₦)</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-50">
                           {Object.entries(groupedBreakdown).map(([groupName, ings]) => (
                              <React.Fragment key={groupName}>
                                 <tr className="bg-slate-50/50">
                                    <td colSpan={5} className="px-8 py-3">
                                       <div className="flex justify-between items-center">
                                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{groupName}</span>
                                          <button
                                             onClick={() => setShowAddIngredient(groupName)}
                                             className="text-[9px] font-black text-indigo-600 uppercase hover:text-indigo-800 flex items-center gap-1"
                                          >
                                             <Plus size={10} /> Add to Group
                                          </button>
                                       </div>
                                    </td>
                                 </tr>
                                 {ings.map((ing: any, idx: number) => (
                                    <tr key={`${groupName}-${idx}`} className={`hover:bg-indigo-50/30 transition-all border-b border-indigo-50 last:border-0 ${ing.hasError ? 'bg-rose-50/50' : ''}`}>
                                       <td className="px-4 py-3 md:px-8 md:py-5">
                                          <div className="flex items-center justify-between">
                                             <div className="flex items-center gap-1.5 md:gap-2">
                                                <span className={`font-black uppercase text-[10px] md:text-xs leading-tight ${ing.hasError ? 'text-rose-600' : 'text-slate-800'}`}>{ing.name}</span>
                                                {ing.isGrounded && <span className="p-1 bg-emerald-100 text-emerald-600 rounded-md" title="Gemini Grounded"><Sparkles size={8} /></span>}
                                                {ing.hasError && (
                                                   <div className="flex items-center gap-1 text-[7px] md:text-[8px] font-black text-rose-500 uppercase tracking-tighter bg-rose-100 px-1.5 py-0.5 rounded-full">
                                                      <AlertTriangle size={8} /> ERROR
                                                   </div>
                                                )}
                                             </div>
                                             <button
                                                onClick={() => matchedRecipe && deleteRecipeIngredient(matchedRecipe.id, ing.name)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 transition-all"
                                             >
                                                <Trash2 size={12} />
                                             </button>
                                          </div>
                                       </td>
                                       <td className="px-4 py-3 md:px-8 md:py-5 text-center font-mono hidden md:table-cell">
                                          <div className="flex items-center justify-center gap-2">
                                             <input
                                                type="number"
                                                step="0.0001"
                                                className="w-20 md:w-24 bg-indigo-50/50 border-2 border-indigo-100 rounded-lg md:rounded-xl text-center font-black text-indigo-600 outline-none focus:border-indigo-400 focus:bg-white transition-all text-[10px] md:text-[11px] py-1 shadow-inner"
                                                value={ing.qtyPerPortion}
                                                onChange={(e) => handleQtyOverride(ing.name, e.target.value)}
                                             />
                                             <span className="text-[8px] md:text-[9px] text-slate-400 font-black uppercase tracking-tighter">{ing.unit}</span>
                                          </div>
                                       </td>
                                       <td className="px-4 py-3 md:px-8 md:py-5 font-bold text-slate-500 text-[10px] md:text-xs text-center whitespace-nowrap">
                                          <span className="bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                                             {ing.qtyRequired.toFixed(2)} <span className="text-[8px] md:text-[10px] opacity-50">{ing.unit}</span>
                                          </span>
                                       </td>
                                       <td className="px-4 py-3 md:px-8 md:py-5 text-right font-mono text-slate-400 text-[10px] md:text-xs hidden md:table-cell">₦{(ing.unitCostCents / 100).toLocaleString()}</td>
                                       <td className="px-4 py-3 md:px-8 md:py-5 text-right font-black text-xs md:text-sm">
                                          <span className={ing.hasError ? 'text-rose-600' : 'text-slate-900'}>
                                             ₦{(ing.totalCostCents / 100).toLocaleString()}
                                          </span>
                                       </td>
                                    </tr>
                                 ))}
                                 {showAddIngredient === groupName && (
                                    <tr className="bg-indigo-50/20">
                                       <td className="px-8 py-4">
                                          <input
                                             placeholder="Ingredient Name..."
                                             className="w-full bg-white border border-indigo-100 rounded-lg p-2 text-xs font-bold outline-none"
                                             value={newIng.name}
                                             onChange={e => setNewIng({ ...newIng, name: e.target.value })}
                                          />
                                       </td>
                                       <td className="px-8 py-4">
                                          <div className="flex gap-2">
                                             <input
                                                type="number"
                                                placeholder="Qty..."
                                                className="w-20 bg-white border border-indigo-100 rounded-lg p-2 text-xs font-bold outline-none"
                                                value={newIng.qty}
                                                onChange={e => setNewIng({ ...newIng, qty: parseFloat(e.target.value) || 0 })}
                                             />
                                             <select
                                                className="bg-white border border-indigo-100 rounded-lg p-2 text-[10px] font-bold"
                                                value={newIng.unit}
                                                onChange={e => setNewIng({ ...newIng, unit: e.target.value })}
                                             >
                                                <option>kg</option><option>g</option><option>litre</option><option>ml</option><option>pcs</option>
                                             </select>
                                          </div>
                                       </td>
                                       <td colSpan={3} className="px-8 py-4 text-right">
                                          <div className="flex justify-end gap-2">
                                             <button onClick={() => setShowAddIngredient(null)} className="px-3 py-1.5 text-[9px] font-black uppercase text-slate-400">Cancel</button>
                                             <button onClick={() => addIngredientToRecipe(groupName)} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg">Confirm Add</button>
                                          </div>
                                       </td>
                                    </tr>
                                 )}
                              </React.Fragment>
                           ))}
                           {costing?.ingredientBreakdown.some((ing: any) => ing.hasError) && (
                              <tr className="bg-rose-500 text-white">
                                 <td colSpan={5} className="px-8 py-3 text-[9px] font-black uppercase tracking-widest text-center">
                                    ⚠️ Warning: Some costs are estimated or involve data quality issues.
                                 </td>
                              </tr>
                           )}
                           <tr className="bg-slate-50 border-t-2 border-slate-100">
                              <td colSpan={4} className="px-8 py-5 font-black text-slate-500 uppercase text-xs text-right tracking-widest">Total Ingredient Cost ({portions} Portions)</td>
                              <td className="px-8 py-5 text-right font-black text-indigo-600 text-base">₦{(costing?.totalIngredientCostCents! / 100).toLocaleString()}</td>
                           </tr>
                        </tbody>
                     </table>
                  </div>
               </div>

               <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden">
                  <div className="px-8 py-4 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center">
                     <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Ingredient Aggregate Summary</span>
                     <span className="text-[9px] text-slate-500 font-bold">Consolidated Procurement View</span>
                  </div>
                  <table className="w-full text-left text-[11px]">
                     <thead className="bg-slate-800 text-slate-400 font-black uppercase text-[8px] tracking-widest">
                        <tr>
                           <th className="px-8 py-4">Total Component</th>
                           <th className="px-8 py-4 text-center">Combined Guest Need</th>
                           <th className="px-8 py-4 text-right">Aggregate Cost (₦)</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-800">
                        {aggregates.map((agg, idx) => (
                           <tr key={idx} className="hover:bg-slate-800/30 transition-all border-b border-slate-800/50">
                              <td className="px-8 py-4 font-black text-slate-200 uppercase">{agg.name}</td>
                              <td className="px-8 py-4 text-center text-slate-400 font-bold">{agg.qty.toFixed(2)} {agg.unit}</td>
                              <td className="px-8 py-4 text-right font-black text-emerald-400">₦{(agg.cost / 100).toLocaleString()}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 bg-indigo-50 rounded-[2rem] border border-indigo-100 flex justify-between items-center">
                     <div>
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Projected Revenue</p>
                        <h5 className="text-2xl font-black text-indigo-900">₦{(costing?.revenueCents! / 100).toLocaleString()}</h5>
                     </div>
                     <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Gross Margin</p>
                        <h5 className={`text-2xl font-black ${costing?.grossMarginPercentage! > 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
                           {costing?.grossMarginPercentage.toFixed(1)}%
                        </h5>
                     </div>
                  </div>
                  <div className="p-8 bg-slate-950 rounded-[2rem] text-white flex justify-between items-center">
                     <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Aggregate Cost</p>
                        <h5 className="text-2xl font-black">₦{(costing?.totalIngredientCostCents! / 100).toLocaleString()}</h5>
                     </div>
                     <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center"><TrendingUp size={24} className={costing?.grossMarginPercentage! > 50 ? 'text-emerald-400' : 'text-amber-400'} /></div>
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
            className={`bg-white shadow-2xl w-full overflow-hidden border border-slate-200 flex flex-col ${isMaximized ? 'fixed inset-0 rounded-none h-full max-w-none' : 'max-w-md rounded-[2.5rem] max-h-[85vh]'}`}
         >
            <div className="p-8 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h2 className="text-xl font-black text-slate-900 uppercase">Process Rental Return</h2>
               <div className="flex gap-2">
                  <button onClick={() => setIsMaximized(!isMaximized)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                     {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                  <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all shadow-sm"><X size={20} /></button>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
               <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 mb-6"><p className="text-[10px] font-black uppercase text-amber-600 mb-1">Active Liability</p><p className="text-sm font-bold text-amber-900">Est. replacement: ₦{(rental.estimatedReplacementValueCents / 100).toLocaleString()}</p></div>
               <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Return Status</label><select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none text-slate-900" value={status} onChange={e => setStatus(e.target.value as any)}><option value="Returned">Safely Returned</option><option value="Damaged">Damaged / Broken</option><option value="Lost">Lost / Unaccounted</option></select></div>
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
            className={`bg-white shadow-2xl w-full overflow-hidden border border-slate-200 flex flex-col ${isMaximized ? 'fixed inset-0 rounded-none h-full max-w-none' : 'max-w-md rounded-[2.5rem] max-h-[85vh]'}`}
         >
            <div className="p-8 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h2 className="text-xl font-black text-slate-900 uppercase">Kitchen Release Request</h2>
               <div className="flex gap-2">
                  <button onClick={() => setIsMaximized(!isMaximized)} className="p-2 hover:bg-rose-50 rounded-xl transition-all">
                     {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                  <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all shadow-sm"><X size={20} /></button>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
               <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Ingredient Release</label><select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none text-slate-900" value={selectedIngId} onChange={e => setSelectedIngId(e.target.value)}><option value="">Select Ingredient...</option>{ingredients.map(i => <option key={i.id} value={i.id}>{i.name} (Stock: {i.stockLevel} {i.unit})</option>)}</select></div>
               <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Tie to Event/Order</label><select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none text-slate-900" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}><option value="">General / Casual Order</option>{events.map(e => <option key={e.id} value={e.id}>{e.customerName} - {e.eventDate}</option>)}</select></div>
               <div className="grid grid-cols-1 gap-4"><div><label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Release Quantity</label><input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none text-slate-900" value={qty} onChange={e => setQty(parseFloat(e.target.value) || 0)} /></div></div>
               <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Release Notes</label><textarea rows={2} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g., Replacement for spoiled batch..." /></div>
            </div>
            <div className="p-8 bg-slate-50 flex gap-4"><button onClick={onClose} className="flex-1 py-4 font-black uppercase text-[10px] text-slate-400">Cancel</button><button onClick={handleReleaseRequest} className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl">Authorize Release</button></div>
         </div>
      </div>
   );
};

const PurchaseRequestModal = ({ isOpen, onClose, ingredients }: { isOpen: boolean, onClose: () => void, ingredients: Ingredient[] }) => {
   const [selectedIngId, setSelectedIngId] = useState('');
   const [isManualInput, setIsManualInput] = useState(false);
   const [newItemName, setNewItemName] = useState('');
   const [newItemUnit, setNewItemUnit] = useState('kg');
   const [qty, setQty] = useState(0);
   const [estimatedCost, setEstimatedCost] = useState(0);
   const [notes, setNotes] = useState('');
   const [isMaximized, setIsMaximized] = useState(false);
   const addRequisition = useDataStore(state => state.addRequisition);
   const { user } = useAuthStore();

   // Auto-set estimated cost when ingredient selected
   useEffect(() => {
      const ing = ingredients.find(i => i.id === selectedIngId);
      if (ing && ing.currentCostCents) {
         setEstimatedCost((ing.currentCostCents / 100) * qty); // Use stored cost as baseline
      }
   }, [selectedIngId, qty, ingredients]);

   if (!isOpen) return null;

   const handleSubmit = () => {
      if (!selectedIngId || qty <= 0) return;
      const ing = ingredients.find(i => i.id === selectedIngId);

      addRequisition({
         type: 'Purchase',
         category: 'Food',
         itemName: ing?.name || 'Unknown Item',
         ingredientId: selectedIngId,
         quantity: qty,
         pricePerUnitCents: (estimatedCost / qty) * 100, // Derived unit cost
         totalAmountCents: estimatedCost * 100,
         notes: notes || 'Stock replenishment request',
         status: 'Pending',
         requestorId: user?.id
      });

      onClose();
      alert("Purchase Request Submitted for Approval");
   };

   return (
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-in zoom-in duration-300" onClick={onClose}>
         <div
            onClick={e => e.stopPropagation()}
            className={`bg-white shadow-2xl w-full overflow-hidden border border-slate-200 flex flex-col ${isMaximized ? 'fixed inset-0 rounded-none h-full max-w-none' : 'max-w-md rounded-[2.5rem] max-h-[85vh]'}`}
         >
            <div className="p-8 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h2 className="text-xl font-black text-slate-900 uppercase">New Purchase Request</h2>
               <div className="flex gap-2">
                  <button onClick={() => setIsMaximized(!isMaximized)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                     {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                  <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all shadow-sm"><X size={20} /></button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
               <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl mb-2">
                  <p className="text-[10px] font-black uppercase text-indigo-500 mb-1">Process Info</p>
                  <p className="text-xs text-indigo-900 font-medium">Requests are sent to the MD/Admin for approval. Once approved, stock can be received against the request.</p>
               </div>

               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Select Item</label>
                  <select
                     className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none focus:border-indigo-500 text-slate-900"
                     value={selectedIngId}
                     onChange={e => setSelectedIngId(e.target.value)}
                  >
                     <option value="">Choose Raw Material...</option>
                     {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} (Current: {i.stockLevel} {i.unit})</option>)}
                  </select>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Quantity Needed</label>
                     <input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none text-slate-900" value={qty} onChange={e => setQty(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                     <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Est. Total Cost (₦)</label>
                     <input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none text-slate-900" value={estimatedCost} onChange={e => setEstimatedCost(parseFloat(e.target.value) || 0)} />
                  </div>
               </div>

               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Justification / Notes</label>
                  <textarea rows={2} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason for purchase..." />
               </div>
            </div>

            <div className="p-8 bg-slate-50 flex gap-4">
               <button onClick={onClose} className="flex-1 py-4 font-black uppercase text-[10px] text-slate-400">Cancel</button>
               <button onClick={handleSubmit} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-indigo-700">Submit Request</button>
            </div>
         </div>
      </div>
   );
};

const ReceiveStockModal = ({ isOpen, onClose, ingredients }: { isOpen: boolean, onClose: () => void, ingredients: Ingredient[] }) => {
   const [mode, setMode] = useState<'Direct' | 'FromRequest'>('Direct');
   const [selectedIngId, setSelectedIngId] = useState('');
   const [selectedReqId, setSelectedReqId] = useState('');
   const [qty, setQty] = useState(0);
   const [cost, setCost] = useState(0);
   const [isMaximized, setIsMaximized] = useState(false);
   const [isManualInput, setIsManualInput] = useState(false);
   const [newItemName, setNewItemName] = useState('');
   const [newItemUnit, setNewItemUnit] = useState('kg');

   const { receiveFoodStock, addIngredient, requisitions, updateRequisition } = useDataStore();

   // Filter for approved purchase requests
   const approvedRequests = useMemo(() => requisitions.filter(r => r.type === 'Purchase' && r.status === 'Approved'), [requisitions]);

   useEffect(() => {
      if (mode === 'FromRequest' && selectedReqId) {
         const req = approvedRequests.find(r => r.id === selectedReqId);
         if (req) {
            setSelectedIngId(req.ingredientId || '');
            setQty(req.quantity);
            setCost(req.totalAmountCents / 100);
         }
      }
   }, [selectedReqId, mode, approvedRequests]);

   if (!isOpen) return null;

   const handleReceive = () => {
      if (isManualInput && mode === 'Direct') {
         if (!newItemName || qty <= 0) return;
         const newIngId = `ing-manual-${Date.now()}`;
         addIngredient({
            id: newIngId,
            name: newItemName,
            unit: newItemUnit as any,
            stockLevel: 0,
            currentCostCents: cost > 0 && qty > 0 ? (cost * 100) / qty : 0,
            category: 'Dry Goods' // Default category
         });
         receiveFoodStock(newIngId, qty, cost * 100);
      } else {
         if (!selectedIngId || qty <= 0) return;
         receiveFoodStock(selectedIngId, qty, cost * 100);

         if (mode === 'FromRequest' && selectedReqId) {
            updateRequisition(selectedReqId, { status: 'Paid' });
         }
      }
      onClose();
   };

   return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-in zoom-in duration-300" onClick={onClose}>
         <div
            onClick={e => e.stopPropagation()}
            className={`bg-white shadow-2xl w-full overflow-hidden border border-slate-200 flex flex-col ${isMaximized ? 'fixed inset-0 rounded-none h-full max-w-none' : 'max-w-md rounded-[2.5rem] max-h-[85vh]'}`}
         >
            <div className="p-8 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase">Inward Procurement Entry</h2>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Inventory Stock Receipt</p>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => setIsMaximized(!isMaximized)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                     {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                  <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all shadow-sm"><X size={20} /></button>
               </div>
            </div>

            <div className="px-8 py-4 bg-slate-50 border-b border-slate-100 flex gap-2">
               <button onClick={() => setMode('FromRequest')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'FromRequest' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-200'}`}>From Approved Request</button>
               <button onClick={() => setMode('Direct')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'Direct' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-200'}`}>Direct Entry</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
               {mode === 'FromRequest' ? (
                  <div>
                     <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Select Approved Request</label>
                     {approvedRequests.length > 0 ? (
                        <select className="w-full p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl font-black outline-none text-emerald-900" value={selectedReqId} onChange={e => setSelectedReqId(e.target.value)}>
                           <option value="">Select an approved order...</option>
                           {approvedRequests.map(r => <option key={r.id} value={r.id}>{r.itemName} - {r.quantity} units (₦{(r.totalAmountCents / 100).toLocaleString()})</option>)}
                        </select>
                     ) : (
                        <div className="p-4 bg-slate-100 rounded-2xl text-center text-xs text-slate-500 font-bold">No approved requests found.</div>
                     )}
                  </div>
               ) : (
                  <>
                     <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-black uppercase text-slate-500">Manual Entry Mode</span>
                        <button
                           onClick={() => setIsManualInput(!isManualInput)}
                           className={`w-12 h-6 rounded-full transition-all relative ${isManualInput ? 'bg-indigo-600' : 'bg-slate-300'}`}
                        >
                           <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isManualInput ? 'left-7' : 'left-1'}`} />
                        </button>
                     </div>

                     {isManualInput ? (
                        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                           <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">New Item Name</label>
                              <input
                                 type="text"
                                 className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none focus:border-indigo-500 text-slate-900"
                                 value={newItemName}
                                 onChange={e => setNewItemName(e.target.value)}
                                 placeholder="e.g. Fresh Saffron"
                              />
                           </div>
                           <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Unit of Measure</label>
                              <select
                                 className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none text-slate-900"
                                 value={newItemUnit}
                                 onChange={e => setNewItemUnit(e.target.value)}
                              >
                                 <option>kg</option><option>g</option><option>L</option><option>ml</option><option>pcs</option><option>pack</option>
                              </select>
                           </div>
                        </div>
                     ) : (
                        <div>
                           <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Select Ingredient</label>
                           <select
                              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none focus:border-indigo-500 text-slate-900"
                              value={selectedIngId}
                              onChange={e => setSelectedIngId(e.target.value)}
                           >
                              <option value="">Choose item...</option>
                              {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                           </select>
                        </div>
                     )}
                  </>
               )}

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Quantity {isManualInput && mode === 'Direct' ? `(${newItemUnit})` : ''}</label>
                     <input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none text-slate-900" value={qty} onChange={e => setQty(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                     <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Purchase Value (₦)</label>
                     <input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none text-slate-900" value={cost} onChange={e => setCost(parseFloat(e.target.value) || 0)} />
                  </div>
               </div>
            </div>

            <div className="p-8 bg-slate-50 flex gap-4">
               <button onClick={onClose} className="flex-1 py-4 font-black uppercase text-[10px] text-slate-400">Cancel</button>
               <button
                  onClick={handleReceive}
                  disabled={(mode === 'FromRequest' && !selectedReqId) || (mode === 'Direct' && !isManualInput && !selectedIngId)}
                  className="flex-1 py-4 bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-black transition-all disabled:opacity-50"
               >
                  Commit to Stock
               </button>
            </div>
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
            className={`bg-white shadow-2xl w-full overflow-hidden border border-slate-200 flex flex-col ${isMaximized ? 'fixed inset-0 rounded-none h-full max-w-none' : 'max-w-md rounded-[2.5rem] max-h-[85vh]'}`}
         >
            <div className="p-8 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h2 className="text-xl font-black text-slate-900 uppercase">Dispatch Assets</h2>
               <div className="flex gap-2">
                  <button onClick={() => setIsMaximized(!isMaximized)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                     {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                  <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all shadow-sm"><X size={20} /></button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Select Asset</label>
                  <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none text-slate-900" value={selectedAssetId} onChange={e => setSelectedAssetId(e.target.value)}>
                     <option value="">Choose equipment...</option>
                     {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.stockQuantity} available)</option>)}
                  </select>
               </div>

               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Assign to Event</label>
                  <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none text-slate-900" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
                     <option value="">Choose active event...</option>
                     {events.map(e => <option key={e.id} value={e.id}>{e.customerName} - {e.eventDate}</option>)}
                  </select>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Quantity Out</label>
                     <input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none text-slate-900" value={qty} onChange={e => setQty(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                     <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Source / Vendor</label>
                     <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none text-slate-900" value={vendor} onChange={e => setVendor(e.target.value)}>
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
   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
   const [selectedEditItem, setSelectedEditItem] = useState<InventoryItem | null>(null);
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
      <>
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
               <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[9px] tracking-[0.2em] border-b border-slate-100"><tr><th className="px-6 py-6 text-center">S/N</th><th className="px-10 py-6">Reference Picture</th><th className="px-10 py-6">Item Name</th><th className="px-10 py-6">Classification</th><th className="px-10 py-6">Physical Stock</th><th className="px-10 py-6 text-right">Value (Est)</th><th className="px-10 py-6 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-50">
                  {assets.map((asset, index) => (
                     <tr key={asset.id} className="hover:bg-indigo-50/10 transition-all group">
                        <td className="px-6 py-6 text-center font-black text-slate-300 text-[10px]">{index + 1}</td>
                        <td className="px-10 py-4"><div className="w-16 h-16 rounded-xl border-2 border-slate-100 overflow-hidden bg-slate-50 shadow-sm transition-transform group-hover:scale-110">{asset.image ? (<img src={asset.image} className="w-full h-full object-cover" alt={asset.name} />) : (<div className="w-full h-full flex items-center justify-center text-slate-200"><ImageIcon size={20} /></div>)}</div></td>
                        <td className="px-10 py-6"><div className="font-black text-slate-800 uppercase text-sm tracking-tight leading-tight">{asset.name}</div></td>
                        <td className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{asset.category}</td>
                        <td className="px-10 py-6"><div className="flex items-center gap-3"><span className="font-black text-slate-900 text-xl tracking-tighter">{asset.stockQuantity}</span><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Units</span></div></td>
                        <td className="px-10 py-6 text-right font-black text-slate-900 tracking-tight">₦{(asset.priceCents * asset.stockQuantity / 100).toLocaleString()}</td>
                        <td className="px-10 py-6 text-right"><button onClick={() => { setSelectedEditItem(asset); setIsEditModalOpen(true); }} className="p-2.5 bg-indigo-600 text-white rounded-xl hover:scale-110 transition-all shadow-md"><Edit3 size={16} /></button></td>
                     </tr>
                  ))}
                  {assets.length === 0 && (<tr><td colSpan={7} className="p-20 text-center text-slate-200"><Box size={64} className="mx-auto mb-4 opacity-10" /><p className="font-black uppercase tracking-widest text-xs">No items indexed in ledger</p></td></tr>)}
               </tbody></table></div>
            </div>
         </div>

         <AddEditInventoryModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} editItem={null} />
         <AddEditInventoryModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} editItem={selectedEditItem} />
      </>
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
   const [uploadStatus, setUploadStatus] = useState('');

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
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-0 md:p-4 bg-slate-900/90 backdrop-blur-xl animate-in zoom-in duration-300" onClick={onClose}>
         <div
            onClick={e => e.stopPropagation()}
            className={`bg-white shadow-2xl w-full overflow-hidden border border-slate-200 flex flex-col ${isMaximized ? 'fixed inset-0 rounded-none h-full max-w-none' : 'max-w-lg rounded-t-[2rem] md:rounded-[3rem] h-full md:h-auto md:max-h-[90vh]'}`}
         >
            <div className="p-6 md:p-8 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-20">
               <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tighter">{editItem ? 'Refine Substance' : 'Ingest Substance'}</h2>
               <div className="flex gap-2">
                  <button onClick={() => setIsMaximized(!isMaximized)} className="hidden md:block p-2 hover:bg-slate-100 rounded-xl transition-all">
                     {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                  <button onClick={onClose} className="p-2 md:p-3 bg-white border border-slate-200 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl md:rounded-2xl transition-all shadow-sm"><X size={20} /></button>
               </div>
            </div>

            <div className="p-6 md:p-10 space-y-6 md:space-y-8 flex-1 overflow-y-auto pb-32 md:pb-10">
               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Item Name</label>
                  <input type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none focus:border-indigo-500 text-slate-900" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Basmati Rice" />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Category</label>
                     <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none text-slate-900" value={category} onChange={e => setCategory(e.target.value)}>
                        <option>Dry Goods</option><option>Produce</option><option>Proteins</option><option>Dairy</option><option>Spices</option><option>Beverages</option>
                     </select>
                  </div>
                  <div>
                     <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Unit</label>
                     <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none text-slate-900" value={unit} onChange={e => setUnit(e.target.value)}>
                        <option>kg</option><option>g</option><option>L</option><option>ml</option><option>pcs</option><option>pack</option><option>tin</option>
                     </select>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Stock Level</label>
                     <input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none text-slate-900" value={stock} onChange={e => setStock(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                     <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Unit Cost (₦)</label>
                     <input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none text-slate-900" value={cost} onChange={e => setCost(parseFloat(e.target.value) || 0)} />
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
                        {uploadStatus && <p className={`text-[10px] font-bold ${uploadStatus.includes('Success') ? 'text-emerald-500' : 'text-rose-500'}`}>{uploadStatus}</p>}
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

const AddEditInventoryModal = ({ isOpen, onClose, editItem }: { isOpen: boolean, onClose: () => void, editItem: InventoryItem | null }) => {
   const [name, setName] = useState(editItem?.name || '');
   const [category, setCategory] = useState(editItem?.category || 'Appetizer');
   const [type, setType] = useState(editItem?.type || 'product');
   const [price, setPrice] = useState(editItem?.priceCents ? editItem.priceCents / 100 : 0);
   const [stock, setStock] = useState(editItem?.stockQuantity || 0);
   const [description, setDescription] = useState(editItem?.description || '');
   const [image, setImage] = useState(editItem?.image || '');
   const [isUploading, setIsUploading] = useState(false);

   const [uploadStatus, setUploadStatus] = useState<string>('');
   const fileInputRef = useRef<HTMLInputElement>(null);

   const { user } = useAuthStore();

   // Direct file upload handler - bypasses DocumentCapture
   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log('[AddEditInventoryModal] handleFileUpload triggered');
      const file = e.target.files?.[0];
      if (!file) {
         console.warn('[AddEditInventoryModal] No file selected');
         return;
      }
      console.log('[AddEditInventoryModal] File:', file.name, file.type, file.size);

      // Read file as base64
      const reader = new FileReader();
      reader.onerror = () => console.error('[AddEditInventoryModal] FileReader error');
      reader.onloadend = async () => {
         const base64Data = reader.result as string;
         console.log('[AddEditInventoryModal] File read, length:', base64Data?.length);
         // Use the same upload flow as camera capture
         await handleImageCapture(base64Data);
      };
      reader.readAsDataURL(file);

      // Reset the input so the same file can be selected again
      if (e.target) e.target.value = '';
   };

   const handleImageCapture = async (imgData: string) => {
      setUploadStatus('Processing...');
      if (!user?.companyId) {
         setUploadStatus('Error: Missing Organization ID');
         return;
      }
      setIsUploading(true);
      setShowCamera(false);
      try {
         const tempId = editItem?.id || `new-${Date.now()}`;
         const entityType = type === 'raw_material' ? 'ingredient' : 'product';
         setUploadStatus('Uploading to Cloud...');

         const { bucket, path } = await uploadEntityImage(user.companyId, entityType, tempId, imgData);

         const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
         const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;

         setImage(publicUrl);
         setUploadStatus('✅ Upload Successful!');
         setTimeout(() => setUploadStatus(''), 3000);
      } catch (error) {
         console.error("[Inventory] Upload FATAL:", error);
         setUploadStatus(`❌ Upload Failed: ${(error as Error).message}`);
      } finally {
         setIsUploading(false);
      }
   };

   // Keep legacy logger for debug if needed, but we use handleImageCapture now
   const setImageWithLog = (newImage: string) => {
      console.log('Setting image in modal:', newImage.substring(0, 50));
      setImage(newImage);
   };

   const [showCamera, setShowCamera] = useState(false);
   const [isMaximized, setIsMaximized] = useState(false);

   const { addInventoryItem, updateInventoryItem } = useDataStore();

   const handleSave = () => {
      if (!name) return;
      console.log('Saving product with image:', image ? image.substring(0, 50) : 'no image');
      if (editItem) {
         updateInventoryItem(editItem.id, { name, category, type: type as any, priceCents: price * 100, stockQuantity: stock, description, image });
      } else {
         addInventoryItem({ name, category, type: type as any, priceCents: price * 100, stockQuantity: stock, description, image });
      }
      onClose();
   };

   useEffect(() => {
      if (editItem) {
         setName(editItem.name);
         setCategory(editItem.category);
         setType(editItem.type);
         setPrice(editItem.priceCents / 100);
         setStock(editItem.stockQuantity);
         setDescription(editItem.description || '');
         setImage(editItem.image || '');
      } else {
         setName('');
         setCategory('Appetizer');
         setType('product');
         setPrice(0);
         setStock(0);
         setDescription('');
         setImage('');
      }
   }, [editItem]);

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-0 md:p-4 bg-slate-900/90 backdrop-blur-xl animate-in zoom-in duration-300" onClick={() => { if (!showCamera) onClose(); }}>
         <div
            onClick={e => e.stopPropagation()}
            className={`bg-white shadow-2xl w-full overflow-hidden border border-slate-200 flex flex-col ${isMaximized ? 'fixed inset-0 rounded-none h-full max-w-none' : 'max-w-lg rounded-t-[2rem] md:rounded-[3rem] h-full md:h-auto md:max-h-[90vh]'}`}
         >
            <div className="p-6 md:p-8 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-20">
               <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tighter">{editItem ? 'Refine Logic' : 'Provision Entity'}</h2>
               <div className="flex gap-2">
                  <button onClick={() => setIsMaximized(!isMaximized)} className="hidden md:block p-2 hover:bg-slate-100 rounded-xl transition-all">
                     {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                  <button onClick={onClose} className="p-2 md:p-3 bg-white border border-slate-200 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl md:rounded-2xl transition-all shadow-sm"><X size={20} /></button>
               </div>
            </div>

            <div className="p-6 md:p-10 space-y-6 md:space-y-8 flex-1 overflow-y-auto pb-32 md:pb-10">
               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Product Name</label>
                  <input type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none focus:border-indigo-500 text-slate-900" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Grilled Chicken" />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Category</label>
                     <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none text-slate-900" value={category} onChange={e => setCategory(e.target.value)}>
                        <option>Hors D'Oeuvres</option><option>Starters</option><option>Salads</option><option>Nigerian Cuisine</option><option>Oriental</option><option>Continental</option><option>Hot Plates</option><option>Desserts</option>
                     </select>
                  </div>
                  <div>
                     <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Type</label>
                     <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none text-slate-900" value={type} onChange={e => setType(e.target.value as any)}>
                        <option value="product">Product</option><option value="raw_material">Raw Material</option>
                     </select>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Price (₦)</label>
                     <input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none text-slate-900" value={price} onChange={e => setPrice(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                     <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Stock Quantity</label>
                     <input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none text-slate-900" value={stock} onChange={e => setStock(parseInt(e.target.value) || 0)} />
                  </div>
               </div>

               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Description</label>
                  <textarea className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none focus:border-indigo-500 text-slate-900" value={description} onChange={e => setDescription(e.target.value)} placeholder="Product description" rows={3} />
               </div>

               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Product Image</label>
                  <div className="flex gap-4">
                     {image ? (
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden group">
                           <img src={image} className="w-full h-full object-cover" alt="Product" />
                           <button onClick={() => setImage('')} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-all"><Trash2 size={20} /></button>
                           {isUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-white" /></div>}
                        </div>
                     ) : (
                        <div className="w-24 h-24 bg-slate-50 border-2 border-slate-100 border-dashed rounded-2xl flex items-center justify-center text-slate-300 relative">
                           {isUploading ? <Loader2 size={24} className="animate-spin text-indigo-500" /> : <ImageIcon size={24} />}
                        </div>
                     )}

                     <div className="flex-1 flex flex-col gap-2 justify-center">
                        <button
                           onClick={() => { console.log('Opening camera for inventory'); setShowCamera(true); }}
                           className="py-3 px-4 bg-indigo-50 text-indigo-600 rounded-xl font-black uppercase text-[10px] flex items-center gap-2 hover:bg-indigo-100 transition-all"
                        >
                           <ScanLine size={14} /> Camera
                        </button>
                        <label
                           className="py-3 px-4 bg-emerald-50 text-emerald-600 rounded-xl font-black uppercase text-[10px] flex items-center gap-2 hover:bg-emerald-100 transition-all cursor-pointer"
                        >
                           <Upload size={14} /> Upload File
                           <input
                              type="file"
                              onChange={handleFileUpload}
                              accept="image/*"
                              className="hidden"
                           />
                        </label>
                        <p className="text-[9px] text-slate-400 font-medium">Take a photo or upload an image.</p>
                        {uploadStatus && <p className="text-[10px] font-bold text-indigo-600">{uploadStatus}</p>}
                     </div>
                  </div>
               </div>
            </div>

            <div className="p-8 bg-slate-50 flex gap-4">
               <button onClick={onClose} className="flex-1 py-4 font-black uppercase text-[10px] text-slate-400 hover:bg-slate-100 rounded-2xl transition-all">Cancel</button>
               <button onClick={handleSave} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-indigo-700 transition-all">Save Product</button>
            </div>
         </div>

         {showCamera && (
            <DocumentCapture
               title="Capture Product Image"
               mode="general"
               onCapture={(img) => { handleImageCapture(img); }}
               onCancel={() => setShowCamera(false)}
            />
         )}
      </div>
   );
};

export const Inventory = () => {
   const [activeTab, setActiveTab] = useState<'products' | 'ingredients' | 'requisitions' | 'hardware' | 'reusable' | 'rentals' | 'fixtures' | 'recipes'>('products');
   const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
   const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
   const [isPurchaseRequestModalOpen, setIsPurchaseRequestModalOpen] = useState(false);
   const [selectedRental, setSelectedRental] = useState<RentalRecord | null>(null);
   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
   const [selectedEditItem, setSelectedEditItem] = useState<InventoryItem | null>(null);
   const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

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

   const { inventory, ingredients: storeIngredients, requisitions, rentalLedger, cateringEvents: events, recipes, approveRequisition, addIngredient, checkOverdueAssets, addRecipe, updateRecipe, deleteRecipe, deleteRecipeIngredient } = useDataStore();

   const rawMaterials = storeIngredients;
   const products = useMemo(() => inventory.filter(i => i.type === 'product'), [inventory]);
   const assets = useMemo(() => inventory.filter(i => i.type === 'asset'), [inventory]);
   const fixtures = useMemo(() => inventory.filter(i => i.type === 'fixture'), [inventory]);
   const reusableItems = useMemo(() => inventory.filter(i => i.type === 'reusable'), [inventory]);
   const rentals = rentalLedger;

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




   useEffect(() => {
      // Initialize portion counts on load or inventory change
      setPortionCounts(prev => {
         const next = { ...prev };
         products.forEach(p => { if (next[p.id] === undefined) next[p.id] = 100; });
         recipes.forEach(r => { if (next[r.id] === undefined) next[r.id] = 100; });
         return next;
      });
   }, [products.length, recipes.length]); // Updated to include recipes

   const groupedRequisitions = useMemo(() => {
      const groups: Record<string, Requisition[]> = {};
      requisitions.forEach(req => {
         const refId = req.referenceId || 'general';
         if (!groups[refId]) groups[refId] = [];
         groups[refId].push(req);
      });
      return Object.entries(groups).map(([refId, items]) => ({
         refId,
         items,
         customerName: events.find(e => e.id === refId)?.customerName || 'General Project',
      })).sort((a, b) => a.customerName.localeCompare(b.customerName));
   }, [requisitions, events]);

   const handleApproveRelease = (id: string) => approveRequisition(id);
   const totalLiability = rentalLedger.filter(r => r.status === 'Issued').reduce((sum, r) => sum + r.estimatedReplacementValueCents, 0);

   const updatePortions = (id: string, val: number) => {
      setPortionCounts(prev => ({ ...prev, [id]: val }));
   };

   const { user: currentUser } = useAuthStore();
   const { departmentMatrix } = useDataStore();

   const hasPermission = (tag: string) => {
      // 1. Super Admin / Admin Bypass
      if (currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin' || currentUser?.role === 'Manager' || currentUser?.role === 'CEO' as any) return true;

      // 2. Matrix Check
      const matrixRole = departmentMatrix.flatMap(d => d.roles).find(r => r.title === currentUser?.role);
      if (matrixRole?.permissions?.includes('*')) return true;
      if (matrixRole?.permissions?.includes(tag)) return true;
      if (matrixRole?.permissions?.includes('access:inventory_all')) return true;

      return false;
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
                     { id: 'products', label: 'Offerings', icon: Utensils, active: true, perm: 'access:inventory_offerings' },
                     { id: 'ingredients', label: 'Raw Materials', icon: Box, active: isCatering, perm: 'access:inventory_ingredients' },
                     { id: 'requisitions', label: 'Spend Ops', icon: ClipboardList, active: true, perm: 'access:inventory_all' }, // Or generic?
                     { id: 'rentals', label: 'Rental Stock', icon: RotateCcw, active: isCatering, perm: 'access:inventory_rentals' },
                     { id: 'recipes', label: 'Neural Recipes', icon: Coffee, active: isCatering, perm: 'access:inventory_offerings' },
                     { id: 'reusable', label: 'Reusable Items', icon: Layers, active: true, perm: 'access:inventory_reusables' },
                     { id: 'hardware', label: 'Fixed Assets', icon: Hammer, active: true, perm: 'access:inventory_fixed_assets' },
                     { id: 'fixtures', label: 'Fixtures', icon: Grid, active: true, perm: 'access:inventory_fixtures' }
                  ].filter(t => t.active && hasPermission(t.perm)).map(tab => (
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
                           <div className="absolute top-4 right-4"><button onClick={() => { setSelectedEditItem(p); setIsEditModalOpen(true); }} className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg"><Edit3 size={16} /></button></div>
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
               <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl">
                  <div>
                     <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Food Ingredient Pipeline</h2>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Movement Inward (Procurement) & Current Inventory Levels</p>
                  </div>
                  <div className="flex gap-4">
                     <button onClick={() => setIsReleaseModalOpen(true)} className="px-6 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl hover:scale-105 transition-all"><Flame size={16} /> Release</button>
                     <button onClick={() => setIsPurchaseRequestModalOpen(true)} className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl hover:scale-105 transition-all"><ClipboardList size={16} /> Request Purchase</button>
                     <button onClick={() => setIsReceiveModalOpen(true)} className="px-6 py-4 bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl hover:scale-105 transition-all"><ShoppingBag size={16} className="text-[#00ff9d]" /> Inward Stock</button>
                  </div>
               </div>
               <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest"><tr><th className="px-6 py-6 text-center font-black">S/N</th><th className="p-8">Ingredient</th><th className="p-8">Current Stock</th><th className="p-8">Base Cost</th><th className="p-8">Market Delta</th><th className="p-8 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-50">{rawMaterials.map((ing, index) => (<tr key={ing.id} className="hover:bg-indigo-50/20 transition-all"><td className="px-6 py-6 text-center font-black text-slate-300 text-[10px]">{index + 1}</td><td className="p-8"><p className="font-black text-slate-800 uppercase text-xs">{ing.name}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{ing.category}</p></td><td className="p-8"><div className="flex items-center gap-3"><span className={`text-lg font-black tracking-tighter ${ing.stockLevel < 50 ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>{ing.stockLevel.toLocaleString()}</span><span className="text-[10px] font-bold text-slate-400 uppercase">Input</span></div></td><td className="p-8 font-black text-slate-900 text-xs">₦{(ing.currentCostCents / 100).toLocaleString()}</td><td className="p-8">{ing.marketPriceCents ? <div className="flex items-center gap-2"><span className="font-black text-indigo-600 text-xs">₦{(ing.marketPriceCents / 100).toLocaleString()}</span>{ing.marketPriceCents > ing.currentCostCents ? <TrendingUp size={14} className="text-rose-500" /> : <TrendingUp size={14} className="text-emerald-500 rotate-180" />}</div> : <span className="text-[9px] font-black text-slate-300 uppercase">Survey Pending</span>}</td><td className="p-8 text-right"><button className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><Zap size={16} /></button></td></tr>))}</tbody></table></div></div>
            </div>
         )}

         {activeTab === 'requisitions' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
               <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
                  <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                     <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Active Requisitions Hub</h3>
                     <div className="flex items-center gap-4">
                        <button
                           onClick={() => {
                              const allExpanded = groupedRequisitions.reduce((acc, curr) => ({ ...acc, [curr.refId]: true }), {});
                              setExpandedGroups(allExpanded);
                           }}
                           className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                        >
                           Expand All
                        </button>
                        <button
                           onClick={() => setExpandedGroups({})}
                           className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-600 transition-colors"
                        >
                           Collapse All
                        </button>
                     </div>
                  </div>
                  <div className="p-8 space-y-4">
                     {groupedRequisitions.map(group => {
                        const isExpanded = expandedGroups[group.refId];
                        return (
                           <div key={group.refId} className="space-y-3">
                              <div
                                 onClick={() => setExpandedGroups(prev => ({ ...prev, [group.refId]: !prev[group.refId] }))}
                                 className="p-5 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-all group"
                              >
                                 <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                                       <Users size={20} />
                                    </div>
                                    <div>
                                       <p className="font-black text-slate-800 uppercase text-sm">{group.customerName}</p>
                                       <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{group.items.length} Pending Requisitions</p>
                                    </div>
                                 </div>
                                 <div className={`p-2 rounded-full border border-slate-200 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                    <ChevronRight size={18} />
                                 </div>
                              </div>

                              {isExpanded && (
                                 <div className="pl-16 space-y-3 animate-in fade-in slide-in-from-top-2">
                                    {group.items.map(req => (
                                       <div key={req.id} className="p-6 bg-white rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-all">
                                          <div className="flex items-center gap-5">
                                             <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${req.type === 'Release' ? 'bg-orange-50 text-orange-600' : req.type === 'Rental' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                {req.type === 'Release' ? <Flame size={20} /> : req.type === 'Rental' ? <RotateCcw size={20} /> : <ShoppingBag size={20} />}
                                             </div>
                                             <div>
                                                <p className="font-black text-slate-800 uppercase text-xs">{req.itemName}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{req.category} • Qty: {req.quantity}</p>
                                             </div>
                                          </div>
                                          <div className="flex items-center gap-6">
                                             <div className="text-right">
                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${req.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{req.status}</span>
                                             </div>
                                             {req.status === 'Pending' && (
                                                <button onClick={() => handleApproveRelease(req.id)} className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all">
                                                   <Check size={18} strokeWidth={3} />
                                                </button>
                                             )}
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              )}
                           </div>
                        );
                     })}
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'hardware' && <InventoryCatalog assets={assets} title="Fixed Asset Ledger" subtitle="Capital Equipment & Infrastructure" />}
         {activeTab === 'reusable' && <InventoryCatalog assets={reusableItems} title="Reusable Items Catalog" subtitle="Operational Inventory (Plates, Linens, etc.)" />}

         {activeTab === 'recipes' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
               <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl">
                  <div>
                     <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Recipe Matrix Hub</h2>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Central sanitation for ingredients and scaling definitions</p>
                  </div>
                  <button onClick={() => addRecipe({ name: 'New Recipe' })} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 transition-all">Add New Recipe</button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {recipes.map(recipe => (
                     <div key={recipe.id} className="bg-white rounded-[2.5rem] border-2 border-slate-50 shadow-xl overflow-hidden hover:border-indigo-200 transition-all flex flex-col">
                        <div className="p-8 border-b border-slate-50 bg-slate-50/30 space-y-4">
                           <input
                              className="bg-transparent text-lg font-black text-slate-800 uppercase outline-none focus:text-indigo-600 w-full"
                              value={recipe.name}
                              onChange={e => updateRecipe(recipe.id, { name: e.target.value })}
                           />

                           <div className="flex justify-between items-center p-4 bg-white/50 rounded-2xl border border-slate-100">
                              <div>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Scaling Mode</p>
                                 <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tight">{recipe.ingredients.length} Components</p>
                              </div>
                              <div className="flex flex-col items-end shrink-0">
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Portions</p>
                                 <div className="flex items-center gap-2">
                                    <button onClick={() => updatePortions(recipe.id, Math.max(1, (portionCounts[recipe.id] || 100) - 50))} className="p-1.5 bg-white border border-slate-200 rounded-lg hover:text-rose-500 transition-colors"><Minus size={12} /></button>
                                    <input
                                       type="number"
                                       className="w-16 bg-white border-2 border-slate-200 rounded-lg py-1 text-center text-xs font-black text-slate-950 outline-none focus:border-indigo-500 shadow-inner"
                                       value={portionCounts[recipe.id] || 100}
                                       onChange={(e) => updatePortions(recipe.id, Math.max(1, parseInt(e.target.value) || 0))}
                                    />
                                    <button onClick={() => updatePortions(recipe.id, (portionCounts[recipe.id] || 100) + 50)} className="p-1.5 bg-white border border-slate-200 rounded-lg hover:text-emerald-500 transition-colors"><Plus size={12} /></button>
                                 </div>
                              </div>
                           </div>
                        </div>
                        <div className="p-8 flex-1 space-y-4 max-h-64 overflow-y-auto scrollbar-thin">
                           {recipe.ingredients.map((ing, idx) => (
                              <div key={idx} className="flex justify-between items-center group">
                                 <div>
                                    <p className="text-xs font-black text-slate-700 uppercase">{ing.name}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                                       {((ing.qtyPerPortion || 0) * (portionCounts[recipe.id] || 100)).toLocaleString()} {ing.unit} {ing.subRecipeGroup ? `• ${ing.subRecipeGroup}` : ''}
                                    </p>
                                 </div>
                                 <button onClick={() => deleteRecipeIngredient(recipe.id, ing.name)} className="opacity-0 group-hover:opacity-100 text-rose-300 hover:text-rose-600 transition-all"><X size={12} /></button>
                              </div>
                           ))}
                        </div>
                        <div className="p-6 bg-slate-50/50 border-t border-slate-50 mt-auto flex gap-2">
                           <button onClick={() => deleteRecipe(recipe.id)} className="flex-1 py-3 text-[9px] font-black uppercase text-rose-400 hover:bg-rose-50 rounded-xl transition-all">Delete</button>
                           <button onClick={() => setSelectedBoQItem(inventory.find(i => i.recipeId === recipe.id) || null)} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg">View BOQ</button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}
         {activeTab === 'fixtures' && <InventoryCatalog assets={fixtures} title="Fixtures & Fittings" subtitle="Built-in Infrastructure" />}
         <ReceiveStockModal isOpen={isReceiveModalOpen} onClose={() => setIsReceiveModalOpen(false)} ingredients={storeIngredients} />
         <PurchaseRequestModal isOpen={isPurchaseRequestModalOpen} onClose={() => setIsPurchaseRequestModalOpen(false)} ingredients={storeIngredients} />
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

         <AddEditInventoryModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} editItem={selectedEditItem} />
      </div>
   );
};