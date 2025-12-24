import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { generateAIResponse } from '../services/ai';
import { InventoryItem, CateringEvent, DealItem, Ingredient, EventTask, BanquetFormDetails } from '../types';
import { 
  ChefHat, Calendar, Plus, ShoppingCart, CheckCircle2, 
  ClipboardList, Utensils, Zap, FileText, ArrowRight,
  Users, Bot, Package, DollarSign, RefreshCw, Layers, TrendingUp, X,
  Clock, AlertTriangle, Truck, PenTool, Trash2, Share2, MapPin, Sparkles, User, Phone, Palette, Star,
  ShieldCheck, FileSpreadsheet, Send, Briefcase, Award, Globe, Building2 as BuildingIcon, Calculator
} from 'lucide-react';

const RecipeMatrixCard: React.FC<{ item: InventoryItem, ingredients: Ingredient[] }> = ({ item, ingredients }) => {
  const [multiplier, setMultiplier] = useState(1);
  
  const unitCost = item.recipe ? item.recipe.reduce((sum, comp) => {
     const ing = ingredients.find(i => i.id === comp.ingredientId);
     return sum + (ing ? ing.currentCost * comp.quantity : 0);
  }, 0) : item.costPrice || 0;

  const totalCost = unitCost * multiplier;
  const marginPercent = item.price > 0 ? (((item.price - unitCost) / item.price) * 100).toFixed(1) : '0.0';

  return (
     <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col hover:border-indigo-400 transition-all group overflow-hidden relative">
        <div className="h-40 overflow-hidden relative">
           <img 
              src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop'} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              alt={item.name} 
           />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
           <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-white/10">
              {item.category}
           </div>
           <div className="absolute bottom-3 right-3 w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Sparkles size={18}/>
           </div>
        </div>

        <div className="p-8 flex flex-col flex-1">
           <div className="mb-6">
              <h3 className="font-black text-2xl text-slate-800 leading-tight uppercase tracking-tight">{item.name}</h3>
           </div>

           <div className="mb-6 bg-slate-900 rounded-2xl p-4 flex items-center justify-between text-white border border-indigo-500/30">
              <div className="flex flex-col">
                 <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Simulate Guests</span>
                 <div className="flex items-center gap-2">
                    <Calculator size={14} className="text-indigo-500"/>
                    <input 
                      type="number" 
                      className="bg-transparent border-none outline-none font-black text-lg w-20"
                      value={multiplier}
                      onChange={(e) => setMultiplier(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                 </div>
              </div>
              <div className="text-right">
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Batch Cost</span>
                 <p className="text-xl font-black text-indigo-300">₦{totalCost.toLocaleString()}</p>
              </div>
           </div>

           <div className="bg-slate-50 p-6 rounded-3xl mb-8 flex-1">
              <div className="flex justify-between items-center mb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 <span>Unit Profitability</span>
                 <span className="text-indigo-500">Margin Breakdown</span>
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between font-bold text-sm"><span className="text-slate-500">Unit Recipe Cost</span><span className="text-slate-800">₦{unitCost.toLocaleString()}</span></div>
                 <div className="flex justify-between font-bold text-sm"><span className="text-slate-500">Unit Sale Price</span><span className="text-indigo-600">₦{item.price.toLocaleString()}</span></div>
                 <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-slate-400">Unit Margin</span>
                    <span className={`text-xl font-black ${Number(marginPercent) > 30 ? 'text-green-600' : 'text-amber-500'}`}>{marginPercent}%</span>
                 </div>
              </div>
           </div>
           
           <div className="flex gap-4">
              <button className="flex-1 bg-slate-50 text-slate-700 py-3 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all border border-slate-100">Recipe Card</button>
              <button className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Update Specs</button>
           </div>
        </div>
     </div>
  );
};

export const Catering = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'workflow' | 'menu' | 'ingredients' | 'banquet_form'>('orders');
  
  const [events, setEvents] = useState<CateringEvent[]>(db.cateringEvents);
  const [selectedEvent, setSelectedEvent] = useState<CateringEvent | null>(null);
  const [aiReport, setAiReport] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showFinSheet, setShowFinSheet] = useState(false);

  const [menuItems, setMenuItems] = useState<InventoryItem[]>(db.inventory.filter(i => i.isMenuItem));
  const [ingredients, setIngredients] = useState<Ingredient[]>(db.ingredients);
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);
  const [newIngredient, setNewIngredient] = useState<Partial<Ingredient>>({
     name: '', unit: 'kg', currentCost: 0, category: 'General'
  });

  const [banquetForm, setBanquetForm] = useState({
    customerDetails: '',
    location: '',
    contactPerson: '',
    phone: '',
    occasion: 'Wedding',
    colorTheme: '',
    eventDate: '',
    guestCount: 50,
    selectedItems: [] as { itemId: string; qty: number }[]
  });
  
  const [menuTab, setMenuTab] = useState<string>("Nigerian Cuisine");
  const [formStep, setFormStep] = useState<'input' | 'processing' | 'success'>('input');
  const [aiProcessingStatus, setAiProcessingStatus] = useState<string>('');
  const [finalOutput, setFinalOutput] = useState<CateringEvent | null>(null);

  const occasions = ["Wedding", "Birthday", "Corporate Gala", "Anniversary", "Cocktail Party", "Funeral Service", "Other"];
  const categories = ["Nigerian Cuisine", "Starter", "Oriental", "Continental", "Hot Plates", "Dessert", "Hors D'Oeuvre"];

  useEffect(() => {
     setIngredients(db.ingredients);
     setMenuItems(db.inventory.filter(i => i.isMenuItem));
     setEvents(db.cateringEvents);
  }, [activeTab]);

  const handleConfirmOrder = (event: CateringEvent) => {
     db.confirmCateringEvent(event);
     setEvents([...db.cateringEvents]);
     alert(`Order Confirmed! Financial entries posted to General Ledger and Operations Workflow generated.`);
  };

  const updateTaskStatus = (taskId: string, status: EventTask['status']) => {
    db.updateEventTaskStatus(taskId, status);
    setEvents([...db.cateringEvents]);
    if(selectedEvent) {
       const updated = db.cateringEvents.find(e => e.id === selectedEvent.id);
       if(updated) setSelectedEvent(updated);
    }
  };

  const handleAddIngredient = (e: React.FormEvent) => {
     e.preventDefault();
     if (!newIngredient.name) return;
     db.addIngredient({
        name: newIngredient.name,
        unit: newIngredient.unit || 'kg',
        currentCost: newIngredient.currentCost || 0,
        category: newIngredient.category || 'General',
        lastUpdated: new Date().toISOString().split('T')[0]
     });
     setIngredients([...db.ingredients]);
     setIsAddIngredientOpen(false);
     setNewIngredient({ name: '', unit: 'kg', currentCost: 0, category: 'General' });
  };

  const handleBanquetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStep('processing');
    
    setAiProcessingStatus('Syncing with CRM...');
    await new Promise(r => setTimeout(r, 1000));
    
    setAiProcessingStatus('Updating Financial Ledger & Procurements...');
    await new Promise(r => setTimeout(r, 1500));
    
    setAiProcessingStatus('Generating Exquisite Menu Card & Invoice...');
    await new Promise(r => setTimeout(r, 1500));

    const items: DealItem[] = banquetForm.selectedItems.map(sel => {
        const inv = db.inventory.find(i => i.id === sel.itemId);
        return {
            inventoryItemId: inv!.id,
            name: inv!.name,
            quantity: sel.qty,
            price: inv!.price,
            cost: (inv as any).costPrice || (inv!.price * 0.4)
        };
    });

    const event = db.createBanquetDeal(banquetForm, items);
    setEvents([...db.cateringEvents]);
    setFinalOutput(event);
    setFormStep('success');
  };

  const addItemToBanquet = (itemId: string) => {
     setBanquetForm(prev => {
        const existing = prev.selectedItems.find(s => s.itemId === itemId);
        if (existing) {
           return { ...prev, selectedItems: prev.selectedItems.filter(s => s.itemId !== itemId) };
        } else {
           return {
              ...prev,
              selectedItems: [...prev.selectedItems, { itemId, qty: prev.guestCount }]
           };
        }
     });
  };

  const updateItemQty = (itemId: string, newQty: number) => {
     setBanquetForm(prev => ({
        ...prev,
        selectedItems: prev.selectedItems.map(s => s.itemId === itemId ? { ...s, qty: Math.max(1, newQty) } : s)
     }));
  };

  const handleGuestChange = (val: number) => {
    const newGuestCount = Math.max(1, val);
    setBanquetForm(prev => ({
       ...prev,
       guestCount: newGuestCount,
       selectedItems: prev.selectedItems.map(s => ({ ...s, qty: newGuestCount }))
    }));
  };

  const shareBanquetLink = () => {
    const url = `https://unified.app/banquet-form?ref=${db.organizationSettings.id}`;
    navigator.clipboard.writeText(url);
    alert("Shareable Banquet Form link copied to clipboard!");
  };

  const runAiAnalysis = async (event: CateringEvent) => {
    setIsAnalyzing(true);
    const financials = event.financials;
    if (!financials) return;

    const prompt = `Analyze this event financials for management: 
    - Event: ${event.customerName} (${event.banquetDetails?.occasion})
    - Revenue: ₦${financials.revenue.toLocaleString()}
    - Total Costs: ₦${(financials.directCosts.food + financials.directCosts.labour + financials.indirectCosts.logistics).toLocaleString()}
    - Margin: ${financials.netProfitMargin}%
    
    Calculate true net profit/loss. Suggest one high-level strategy for the CEO to increase the margin for similar events. Return as a briefing for authorized persons.`;
    
    const report = await generateAIResponse(prompt);
    setAiReport(report);
    setIsAnalyzing(false);
  };

  const EventFinancialSheet = ({ event }: { event: CateringEvent }) => {
     const fin = event.financials;
     if (!fin) return null;
     
     const totalDirect = fin.directCosts.food + fin.directCosts.labour + fin.directCosts.energy + fin.directCosts.carriage;
     const totalIndirect = fin.indirectCosts.admin + fin.indirectCosts.marketing + fin.indirectCosts.waiters + fin.indirectCosts.logistics;
     const totalCost = totalDirect + totalIndirect;
     const netResult = fin.revenue - totalCost;

     return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in zoom-in duration-300">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[85vh]">
              <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/40">
                       <FileSpreadsheet size={28}/>
                    </div>
                    <div>
                       <h2 className="text-2xl font-black tracking-tight uppercase">Event Financial Analysis</h2>
                       <p className="text-indigo-300 text-[10px] font-bold tracking-[0.2em] uppercase">Authorized Personnel Eyes Only</p>
                    </div>
                 </div>
                 <button onClick={() => setShowFinSheet(false)} className="p-3 hover:bg-white/10 rounded-full transition-all"><X/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 bg-[#fafbfc]">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                       <section>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 pb-2 border-b border-slate-100 flex justify-between">
                             <span>Inflow / Revenue</span>
                             <span className="text-indigo-600 font-bold">₦{fin.revenue.toLocaleString()}</span>
                          </h4>
                          <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center">
                             <div>
                                <p className="text-sm font-bold text-slate-800">Banquet Contract Sum</p>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">{event.guestCount} Guests @ Standard Package</p>
                             </div>
                             <span className="text-xl font-black text-indigo-600">₦{fin.revenue.toLocaleString()}</span>
                          </div>
                       </section>

                       <section>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 pb-2 border-b border-slate-100">Direct Expenditure</h4>
                          <div className="space-y-4">
                             <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-50 shadow-sm">
                                <div className="flex items-center gap-3"><Utensils size={18} className="text-slate-400"/><span className="text-sm font-bold text-slate-700">Raw Food Materials</span></div>
                                <span className="font-bold text-red-500">₦{fin.directCosts.food.toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-50 shadow-sm">
                                <div className="flex items-center gap-3"><Users size={18} className="text-slate-400"/><span className="text-sm font-bold text-slate-700">Skilled Kitchen Labour</span></div>
                                <span className="font-bold text-red-500">₦{fin.directCosts.labour.toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-50 shadow-sm">
                                <div className="flex items-center gap-3"><Truck size={18} className="text-slate-400"/><span className="text-sm font-bold text-slate-700">Carriage & Handling</span></div>
                                <span className="font-bold text-red-500">₦{fin.directCosts.carriage.toLocaleString()}</span>
                             </div>
                          </div>
                       </section>
                    </div>

                    <div className="space-y-8">
                       <section>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 pb-2 border-b border-slate-100">Indirect / Logistics</h4>
                          <div className="space-y-4">
                             <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-50 shadow-sm">
                                <div className="flex items-center gap-3"><ShieldCheck size={18} className="text-slate-400"/><span className="text-sm font-bold text-slate-700">Support Staff / Waiters</span></div>
                                <span className="font-bold text-red-500">₦{fin.indirectCosts.waiters.toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-50 shadow-sm">
                                <div className="flex items-center gap-3"><Package size={18} className="text-slate-400"/><span className="text-sm font-bold text-slate-700">Third-Party Logistics</span></div>
                                <span className="font-bold text-red-500">₦{fin.indirectCosts.logistics.toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-50 shadow-sm">
                                <div className="flex items-center gap-3"><Briefcase size={18} className="text-slate-400"/><span className="text-sm font-bold text-slate-700">Administrative Overheads</span></div>
                                <span className="font-bold text-red-500">₦{fin.indirectCosts.admin.toLocaleString()}</span>
                             </div>
                          </div>
                       </section>

                       <section className={`p-8 rounded-[2.5rem] border shadow-2xl flex flex-col items-center justify-center text-center ${netResult >= 0 ? 'bg-green-600 border-green-400 text-white' : 'bg-red-600 border-red-400 text-white'}`}>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-80">{netResult >= 0 ? 'Net Profit' : 'Net Operational Loss'}</p>
                          <h3 className="text-5xl font-black mb-4 tracking-tighter">₦{Math.abs(netResult).toLocaleString()}</h3>
                          <div className="flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm">
                             <TrendingUp size={14}/> {fin.netProfitMargin}% Margin realized
                          </div>
                       </section>
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-white border-t border-slate-100 flex justify-between items-center">
                 <div className="flex gap-2">
                    <button className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition-all flex items-center gap-2"><FileText size={18}/> Print Sheet</button>
                    <button className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition-all flex items-center gap-2"><Send size={18}/> Email to CEO</button>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="text-right">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Audit Status</p>
                       <p className="text-xs font-black text-green-600">VERIFIED BY AI</p>
                    </div>
                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                       <CheckCircle2 size={24}/>
                    </div>
                 </div>
              </div>
           </div>
        </div>
     );
  };

  const renderBanquetForm = () => (
    <div className="max-w-6xl mx-auto space-y-6">
       {formStep === 'input' && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col lg:flex-row min-h-[750px] animate-in slide-in-from-bottom-4 duration-500">
             <div className="flex-1 p-8 bg-slate-50 border-r border-slate-200 overflow-y-auto max-h-[85vh]">
                <div className="flex justify-between items-start mb-8">
                   <div>
                      <h2 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                         <Utensils className="text-indigo-600" size={32}/> Select Banquet Menu
                      </h2>
                      <p className="text-slate-500 mt-1">Pick your items. Portions are automatically synced to guest count.</p>
                   </div>
                   <button onClick={shareBanquetLink} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all active:scale-95">
                      <Share2 size={16}/> Copy Form Link
                   </button>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-4 mb-6 hide-scrollbar">
                   {categories.map(cat => (
                      <button key={cat} onClick={() => setMenuTab(cat)} className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${menuTab === cat ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>{cat}</button>
                   ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {menuItems.filter(item => item.category === menuTab).map(item => {
                      const selected = banquetForm.selectedItems.find(s => s.itemId === item.id);
                      return (
                         <div key={item.id} 
                              onClick={() => addItemToBanquet(item.id)}
                              className={`bg-white p-5 rounded-2xl border-2 transition-all cursor-pointer group ${selected ? 'border-indigo-500 bg-indigo-50/30' : 'border-white hover:border-indigo-200 shadow-sm'}`}>
                            <div className="flex justify-between items-start mb-3">
                               <div>
                                  <h4 className="font-bold text-slate-800 group-hover:text-indigo-600">{item.name}</h4>
                                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{item.portionSize}</span>
                               </div>
                               <div className="text-right">
                                  <span className="text-xs text-slate-400 font-bold">UNIT</span>
                                  <div className="font-bold text-slate-900">₦{item.price.toLocaleString()}</div>
                               </div>
                            </div>
                            
                            {selected && (
                               <div className="mt-4 pt-4 border-t border-indigo-100 flex justify-between items-center bg-indigo-50/50 -mx-5 -mb-5 p-4 rounded-b-2xl">
                                  <div className="text-[10px] font-bold text-indigo-700 uppercase">Subtotal ({banquetForm.guestCount} guests)</div>
                                  <div className="text-lg font-black text-indigo-600">₦{(item.price * banquetForm.guestCount).toLocaleString()}</div>
                               </div>
                            )}
                            
                            {!selected && (
                               <div className="mt-2 text-xs font-bold text-slate-300 flex items-center gap-1 group-hover:text-indigo-400">
                                  <Plus size={14}/> Add to selection
                               </div>
                            )}
                         </div>
                      )
                   })}
                </div>
             </div>

             <div className="w-full lg:w-[420px] bg-white p-8 flex flex-col shadow-2xl relative z-10">
                <div className="mb-8">
                   <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <Sparkles size={20} className="text-yellow-500"/> Event Specifications
                   </h3>
                   
                   <div className="space-y-5">
                      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-3">
                         <Users className="text-amber-600 flex-shrink-0" size={20}/>
                         <div className="text-xs text-amber-900 leading-relaxed">
                            <span className="font-bold block mb-1">Guest Guidance:</span>
                            A baseline of 50 guests is set. Use the controls below to adjust your expected headcount. 
                            Menu NY quantities will sync automatically.
                         </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                         <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3 text-center tracking-widest">Expected Guests</label>
                         <div className="flex items-center justify-between gap-4">
                            <button onClick={() => handleGuestChange(banquetForm.guestCount - 10)} className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-red-50 hover:text-red-600 hover:border-red-200 shadow-sm transition-all active:scale-90 font-bold text-xl">-</button>
                            <input 
                               type="number" 
                               className="flex-1 text-center text-3xl font-black text-slate-800 bg-transparent outline-none w-20"
                               value={banquetForm.guestCount}
                               onChange={(e) => handleGuestChange(parseInt(e.target.value) || 0)}
                            />
                            <button onClick={() => handleGuestChange(banquetForm.guestCount + 10)} className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-green-50 hover:text-green-600 hover:border-green-200 shadow-sm transition-all active:scale-90 font-bold text-xl">+</button>
                         </div>
                      </div>

                      <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><Plus size={14}/> Occasion</label>
                         <select 
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                           value={banquetForm.occasion}
                           onChange={e => setBanquetForm({...banquetForm, occasion: e.target.value})}
                         >
                            {occasions.map(o => <option key={o} value={o}>{o}</option>)}
                         </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><Palette size={14}/> Color Theme</label>
                            <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Ivory & Gold" value={banquetForm.colorTheme} onChange={e => setBanquetForm({...banquetForm, colorTheme: e.target.value})}/>
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><Calendar size={14}/> Event Date</label>
                            <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={banquetForm.eventDate} onChange={e => setBanquetForm({...banquetForm, eventDate: e.target.value})}/>
                         </div>
                      </div>

                      <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><MapPin size={14}/> Location</label>
                         <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Venue Address" value={banquetForm.location} onChange={e => setBanquetForm({...banquetForm, location: e.target.value})}/>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><User size={14}/> Contact Name</label>
                            <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={banquetForm.contactPerson} onChange={e => setBanquetForm({...banquetForm, contactPerson: e.target.value})}/>
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><Phone size={14}/> Phone Number</label>
                            <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={banquetForm.phone} onChange={e => setBanquetForm({...banquetForm, phone: e.target.value})}/>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-100">
                   <div className="flex justify-between items-center mb-6">
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Estimated Grand Total</span>
                      <span className="text-2xl font-black text-indigo-600">
                         ₦{banquetForm.selectedItems.reduce((acc, sel) => {
                            const item = menuItems.find(m => m.id === sel.itemId);
                            return acc + (item ? item.price * sel.qty : 0);
                         }, 0).toLocaleString()}
                      </span>
                   </div>
                   <button 
                      onClick={handleBanquetSubmit}
                      disabled={!banquetForm.contactPerson || !banquetForm.eventDate || banquetForm.selectedItems.length === 0}
                      className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98]"
                   >
                      Submit Banquet Selection <ArrowRight size={20}/>
                   </button>
                </div>
             </div>
          </div>
       )}

       {formStep === 'processing' && (
          <div className="bg-white rounded-3xl p-16 text-center flex flex-col items-center justify-center min-h-[500px] shadow-xl">
             <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center mb-8 relative">
                <Bot size={64} className="text-indigo-600 animate-pulse"/>
                <div className="absolute top-0 right-0 w-8 h-8 bg-green-500 rounded-full border-4 border-white animate-bounce"></div>
             </div>
             <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">AI Coordination In Progress</h3>
             <p className="text-slate-500 max-w-sm mb-10 text-lg leading-relaxed">{aiProcessingStatus}</p>
             <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden max-w-md mx-auto">
                <div className="h-full bg-indigo-600 animate-progress origin-left w-full"></div>
             </div>
          </div>
       )}

       {formStep === 'success' && finalOutput && (
          <div className="animate-in fade-in zoom-in duration-500 space-y-8">
             <div className="bg-green-600 text-white p-6 rounded-3xl flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <CheckCircle2 size={28}/>
                   </div>
                   <div>
                      <h3 className="text-xl font-bold">Banquet Confirmed!</h3>
                      <p className="text-green-100 text-sm opacity-90">CRM Deal WON • Invoices Sent • Operations Team Notified.</p>
                   </div>
                </div>
                <button 
                  onClick={() => setFormStep('input')}
                  className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-bold border border-white/20 transition-all"
                >
                   Close Output
                </button>
             </div>

             <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                <div className="bg-[#fdfbf7] p-12 rounded-[3.5rem] shadow-2xl border border-[#ece4d8] flex flex-col items-center relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-[#d4af37] via-[#f1c40f] to-[#d4af37]"></div>
                   <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#d4af37]/5 rounded-full blur-3xl"></div>
                   
                   <div className="w-20 h-20 bg-white border border-[#ece4d8] rounded-full flex items-center justify-center mb-8 shadow-sm">
                      <ChefHat className="text-[#d4af37]" size={40}/>
                   </div>
                   
                   <h2 className="text-5xl font-serif text-[#4a3b2b] mb-4 tracking-tight italic">Banquet Menu</h2>
                   
                   <div className="flex items-center gap-4 mb-14">
                      <div className="h-px w-12 bg-[#d4af37]/30"></div>
                      <span className="text-[#d4af37] font-black text-xs uppercase tracking-[0.4em]">Exquisite Selections</span>
                      <div className="h-px w-12 bg-[#d4af37]/30"></div>
                   </div>

                   <div className="w-full space-y-10 text-center">
                      {finalOutput.items.map((item, i) => (
                         <div key={i} className="group cursor-default">
                            <h4 className="text-2xl font-bold text-[#4a3b2b] tracking-wide uppercase transition-colors group-hover:text-[#d4af37]">{item.name}</h4>
                            <p className="text-[#8c7e6c] text-sm italic mt-2 max-w-xs mx-auto opacity-80">{item.name} prepared to perfection for our distinguished guests.</p>
                         </div>
                      ))}
                   </div>

                   <div className="mt-20 pt-10 border-t border-[#ece4d8] w-full text-center relative">
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#fdfbf7] px-4">
                         <Award className="text-[#d4af37]" size={24}/>
                      </div>
                      <p className="text-[#4a3b2b] font-serif text-2xl italic">“Exquisitely. For the discerning taste buds!”</p>
                      <div className="mt-8 flex justify-center gap-3 text-[#d4af37]">
                         {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="currentColor"/>)}
                      </div>
                   </div>
                   
                   <div className="mt-12 flex items-center gap-8 text-[10px] text-[#8c7e6c] font-bold uppercase tracking-[0.2em]">
                      <span>{finalOutput.banquetDetails?.occasion}</span>
                      <span className="w-1.5 h-1.5 bg-[#d4af37] rounded-full"></span>
                      <span>{finalOutput.eventDate}</span>
                   </div>
                </div>

                <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden relative">
                   <div className="h-2 w-full bg-indigo-600"></div>
                   
                   <div className="p-12">
                      <div className="flex justify-between items-start mb-16">
                         <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3 hover:rotate-0 transition-transform">
                               <Award size={32}/>
                            </div>
                            <div>
                               <h1 className="text-2xl font-black text-slate-900 tracking-tighter">XQUISITE<br/>CELEBRATIONS</h1>
                               <div className="flex items-center gap-1.5 mt-1">
                                  <Globe size={10} className="text-indigo-500"/>
                                  <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Global Excellence</span>
                               </div>
                            </div>
                         </div>
                         <div className="text-right">
                            <div className="inline-block bg-indigo-50 px-4 py-1.5 rounded-full mb-3">
                               <span className="text-indigo-700 font-black text-xs uppercase tracking-widest">Pro-forma Invoice</span>
                            </div>
                            <p className="text-slate-400 text-xs font-bold font-mono tracking-tighter uppercase">Document ID: XC-{finalOutput.id.slice(-6).toUpperCase()}</p>
                            <p className="text-slate-500 text-sm mt-1">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-10 mb-14">
                         <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
                            <span className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] block mb-4">Contract Party</span>
                            <p className="text-lg font-black text-slate-800 mb-1">{finalOutput.customerName}</p>
                            <p className="text-sm text-slate-500 flex items-start gap-2 mb-2">
                               <MapPin size={14} className="mt-1 flex-shrink-0 text-indigo-400"/>
                               {finalOutput.banquetDetails?.location}
                            </p>
                            <p className="text-sm text-indigo-600 font-bold flex items-center gap-2">
                               <Phone size={14} className="text-indigo-400"/>
                               {finalOutput.banquetDetails?.phone}
                            </p>
                         </div>
                         <div className="p-8 border border-slate-100 rounded-3xl flex flex-col justify-center">
                            <div className="flex justify-between items-center mb-4">
                               <span className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">Service Date</span>
                               <span className="text-sm font-black text-slate-800">{finalOutput.eventDate}</span>
                            </div>
                            <div className="flex justify-between items-center mb-4">
                               <span className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">Guest Count</span>
                               <span className="text-sm font-black text-indigo-600">{finalOutput.guestCount} Guests</span>
                            </div>
                            <div className="flex justify-between items-center">
                               <span className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">Theme Color</span>
                               <span className="text-sm font-black text-slate-800">{finalOutput.banquetDetails?.colorTheme}</span>
                            </div>
                         </div>
                      </div>

                      <div className="overflow-x-auto mb-10">
                         <table className="w-full text-sm">
                            <thead>
                               <tr className="border-b-2 border-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">
                                  <th className="text-left pb-6">Service Specification</th>
                                  <th className="text-center pb-6">Portions</th>
                                  <th className="text-right pb-6">Unit Rate</th>
                                  <th className="text-right pb-6">Total Amount</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                               {finalOutput.items.map((item, i) => (
                                  <tr key={i} className="group">
                                     <td className="py-6 font-black text-slate-700 uppercase tracking-tight">{item.name}</td>
                                     <td className="py-6 text-center font-bold text-slate-500">{item.quantity}</td>
                                     <td className="py-6 text-right text-slate-400 font-mono">₦{item.price.toLocaleString()}</td>
                                     <td className="py-6 text-right font-black text-slate-800 text-lg">₦{(item.price * item.quantity).toLocaleString()}</td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>

                      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                         <div>
                            <div className="flex items-center gap-2 mb-2 text-indigo-400">
                               <ShieldCheck size={18}/>
                               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Financial Summary</span>
                            </div>
                            <h2 className="text-sm font-bold text-slate-400 mb-1">AGGREGATE CONTRACT TOTAL</h2>
                            <p className="text-4xl font-black tracking-tighter">₦{(finalOutput.items.reduce((s, i) => s + (i.price * i.quantity), 0) * 1.05).toLocaleString()}</p>
                            <p className="text-[10px] text-indigo-300 font-bold mt-2 uppercase tracking-widest italic">Includes statutory 5% professional service VAT</p>
                         </div>
                         <div className="w-px h-16 bg-white/10 hidden md:block"></div>
                         <div className="text-right">
                            <div className="w-32 h-16 border-b border-white/20 mb-2 ml-auto flex items-end justify-center italic text-xs text-slate-500 font-serif">Executive Approval</div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Authorized Officer Signature</p>
                            <p className="text-[10px] font-bold text-indigo-400 mt-1 uppercase">Unified Suite Certified</p>
                         </div>
                      </div>

                      <div className="mt-12 text-center">
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-relaxed max-w-md mx-auto">
                            Thank you for selecting Xquisite Celebrations for your event. To finalize your reservation, kindly remit payment to the verified corporate accounts within 48 hours.
                         </p>
                         <div className="mt-8 flex justify-center gap-8 grayscale opacity-50">
                            <div className="flex items-center gap-2">
                               <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center"><Send size={14} className="text-slate-400"/></div>
                               <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Instant Booking</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center"><CheckCircle2 size={14} className="text-slate-400"/></div>
                               <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Secure Payment</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
       )}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
       {/* HERO SECTION - NEXUS STYLE */}
       <div className="bg-slate-950 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl mb-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl animate-float">
                   <ChefHat size={36} />
                </div>
                <div>
                   <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Catering Manager</h1>
                   <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-300 border border-white/5">
                         <Star size={12} className="text-indigo-400"/> Elite Ops Ready
                      </span>
                   </div>
                </div>
             </div>

             <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md overflow-x-auto max-w-full">
                {[
                  { id: 'orders', label: 'Orders' },
                  { id: 'workflow', label: 'Operations' },
                  { id: 'menu', label: 'Recipe Matrix' },
                  { id: 'ingredients', label: 'Market Pricing' },
                  { id: 'banquet_form', label: 'Banquet Form' }
                ].map(tab => (
                   <button 
                      key={tab.id} 
                      onClick={() => setActiveTab(tab.id as any)} 
                      className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
                   >
                      {tab.id === 'banquet_form' && <Sparkles size={14}/>}
                      {tab.label}
                   </button>
                ))}
             </div>
          </div>
       </div>

       {activeTab === 'orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 space-y-4">
                {events.length === 0 && (
                   <div className="bg-white p-12 rounded-[2rem] border border-dashed border-slate-200 text-center text-slate-400">
                      <ClipboardList size={48} className="mx-auto mb-4 opacity-20"/>
                      No orders yet. Fill the "Banquet Form" to start a new event flow.
                   </div>
                )}
                {events.slice().reverse().map(event => (
                   <div 
                     key={event.id} 
                     onClick={() => { setSelectedEvent(event); setAiReport(''); }}
                     className={`bg-white p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${selectedEvent?.id === event.id ? 'border-indigo-600 shadow-xl ring-4 ring-indigo-500/5 translate-x-2' : 'border-slate-100 hover:border-indigo-300 shadow-sm'}`}
                   >
                      <div className="flex justify-between items-start mb-4">
                         <div>
                            <div className="flex items-center gap-2 mb-1">
                               <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">Event Confirmed</span>
                               <span className="text-[10px] font-bold text-slate-400 font-mono">#{event.id.slice(-6)}</span>
                            </div>
                            <h3 className="font-black text-xl text-slate-800">{event.customerName}</h3>
                            <div className="text-sm text-slate-500 flex items-center gap-4 mt-2">
                               <span className="flex items-center gap-1"><Calendar size={14}/> {event.eventDate}</span>
                               <span className="flex items-center gap-1"><Users size={14}/> {event.guestCount} Guests</span>
                               <span className="flex items-center gap-1 text-indigo-600 font-bold"><Zap size={14}/> {event.banquetDetails?.occasion}</span>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Order Value</p>
                            <div className="text-2xl font-black text-slate-900">₦{event.financials?.revenue.toLocaleString() || '0'}</div>
                         </div>
                      </div>
                   </div>
                ))}
             </div>

             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 h-fit sticky top-6 shadow-xl">
                {selectedEvent ? (
                   <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="flex justify-between items-center pb-6 border-b border-slate-50">
                         <h3 className="font-black text-2xl text-slate-800 tracking-tight">Event Insight</h3>
                         <button onClick={() => setShowFinSheet(true)} className="text-indigo-600 hover:text-indigo-800 font-bold text-xs underline underline-offset-4 flex items-center gap-1"><FileSpreadsheet size={12}/> Analysis Sheet</button>
                      </div>
                      
                      <div className="space-y-6">
                         <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                            <div className="flex justify-between items-center mb-4">
                               <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Banquet Specs</span>
                               <PenTool size={16} className="text-indigo-400"/>
                            </div>
                            <div className="space-y-3 text-sm">
                               <div className="flex justify-between"><span className="text-slate-500">Occasion</span><span className="font-bold text-slate-800">{selectedEvent.banquetDetails?.occasion}</span></div>
                               <div className="flex justify-between"><span className="text-slate-500">Location</span><span className="font-bold text-slate-800 truncate max-w-[150px]">{selectedEvent.banquetDetails?.location}</span></div>
                               <div className="flex justify-between"><span className="text-slate-500">Theme</span><span className="font-bold text-indigo-600">{selectedEvent.banquetDetails?.colorTheme}</span></div>
                            </div>
                         </div>

                         {selectedEvent.financials && (
                            <div className="space-y-4">
                               <div className="flex justify-between items-center"><span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Financial Summary</span></div>
                               <div className="space-y-2 text-sm">
                                  <div className="flex justify-between p-3 bg-indigo-50/50 rounded-xl"><span className="text-indigo-900 font-bold">Projected Revenue</span><span className="font-black text-indigo-700">₦{selectedEvent.financials.revenue.toLocaleString()}</span></div>
                                  <div className="flex justify-between px-3"><span className="text-slate-500">Direct Costs</span><span className="text-red-500">-₦{(selectedEvent.financials.directCosts.food + selectedEvent.financials.directCosts.labour).toLocaleString()}</span></div>
                               </div>
                               <div className="p-5 bg-emerald-50 rounded-3xl border border-emerald-100 flex justify-between items-center">
                                  <div>
                                     <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Realized Margin</p>
                                     <p className="text-2xl font-black text-emerald-700">{selectedEvent.financials.netProfitMargin}%</p>
                                  </div>
                                  <TrendingUp className="text-emerald-500" size={32}/>
                               </div>
                            </div>
                         )}

                         <button onClick={() => runAiAnalysis(selectedEvent)} disabled={isAnalyzing} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                            <Bot size={20} className="text-indigo-400"/> {isAnalyzing ? 'Analyzing Financials...' : 'Generate Management Briefing'}
                         </button>

                         {aiReport && (
                            <div className="bg-indigo-900 text-indigo-100 p-6 rounded-3xl text-sm leading-relaxed border-t-4 border-indigo-500 animate-in fade-in">
                               <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-[0.2em] text-indigo-300 mb-3"><Bot size={14}/> Authorized Personnel Briefing</div>
                               <div className="italic whitespace-pre-wrap">“{aiReport}”</div>
                            </div>
                         )}
                      </div>
                   </div>
                ) : (
                   <div className="text-center py-20 flex flex-col items-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200">
                         <Layers size={32}/>
                      </div>
                      <p className="text-slate-400 font-medium">Select an order for insight</p>
                   </div>
                )}
             </div>
          </div>
       )}

       {activeTab === 'workflow' && (
          <div className="space-y-6">
             {events.filter(e => e.status === 'Confirmed').length === 0 && (
                <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-100 text-center text-slate-300">
                   Operational workflows will appear here once a banquet is confirmed.
                </div>
             )}

             {events.filter(e => e.status === 'Confirmed').map(event => (
                <div key={event.id} className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                   <div className="bg-slate-900 p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div>
                         <h3 className="font-black text-3xl tracking-tight mb-2">
                            {event.customerName}
                         </h3>
                         <div className="flex items-center gap-6 text-indigo-200 font-bold uppercase text-xs tracking-widest">
                            <span className="flex items-center gap-2"><MapPin size={14}/> {event.banquetDetails?.location}</span>
                            <span className="flex items-center gap-2"><Users size={14}/> {event.guestCount} GUESTS</span>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-6 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                         <div className="text-right">
                            <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.2em] mb-1">READINESS SCORE</div>
                            <div className="text-4xl font-black">{event.readinessScore || 0}%</div>
                         </div>
                         <div className="w-20 h-20 rounded-full border-[6px] border-indigo-500/20 flex items-center justify-center relative shadow-inner">
                            <svg className="absolute top-0 left-0 w-full h-full -rotate-90 p-[-3px]" viewBox="0 0 36 36">
                               <path className="text-indigo-500 transition-all duration-1000 ease-out" strokeDasharray={`${event.readinessScore || 0}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                            </svg>
                            <Zap size={24} className="text-indigo-400 animate-pulse"/>
                         </div>
                      </div>
                   </div>

                   <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50/30">
                      {event.tasks?.map(task => (
                         <div key={task.id} className={`p-6 rounded-3xl border-2 flex flex-col justify-between h-full transition-all hover:scale-[1.02] ${
                            task.status === 'Completed' ? 'bg-green-50/50 border-green-200' : 
                            task.status === 'In Progress' ? 'bg-white border-indigo-300 shadow-xl' :
                            'bg-white border-slate-100'
                         }`}>
                            <div>
                               <div className="flex justify-between items-start mb-4">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{task.phase}</span>
                                  <span className={`w-3 h-3 rounded-full shadow-sm ${
                                     task.status === 'Completed' ? 'bg-green-500' :
                                     task.status === 'In Progress' ? 'bg-indigo-500 animate-pulse' :
                                     'bg-slate-200'
                                  }`}></span>
                               </div>
                               <h4 className="font-black text-slate-800 mb-2 leading-tight uppercase tracking-tight">{task.name}</h4>
                               <p className="text-xs text-slate-500 font-bold mb-4 flex items-center gap-1"><User size={12}/> {task.ownerRole}</p>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                               <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                  <Clock size={12}/> {task.dueDate}
                               </div>
                               {task.status !== 'Completed' && (
                                  <button onClick={() => updateTaskStatus(task.id, 'Completed')} className="text-[10px] bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-black uppercase tracking-widest hover:bg-indigo-700 transition-all">Done</button>
                               )}
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             ))}
          </div>
       )}

       {activeTab === 'ingredients' && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col overflow-hidden h-[calc(100vh-220px)] animate-in fade-in">
             <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                <div>
                   <h3 className="font-black text-2xl text-slate-800 tracking-tight uppercase">Ingredients Master List</h3>
                   <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Automated Market Costing Matrix</p>
                </div>
                <div className="flex gap-3">
                   <button onClick={() => setIsAddIngredientOpen(true)} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"><Plus size={18}/> New Ingredient</button>
                </div>
             </div>
             
             <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50/80 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] sticky top-0 z-10 backdrop-blur-md">
                      <tr>
                         <th className="p-6">Material</th>
                         <th className="p-6 text-center">Unit</th>
                         <th className="p-6 text-right">Current Cost</th>
                         <th className="p-6 text-right">Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {ingredients.map(ing => (
                         <tr key={ing.id} className="hover:bg-indigo-50/20 transition-colors">
                            <td className="p-6">
                               <div className="font-black text-slate-800 uppercase tracking-tight">{ing.name}</div>
                               <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-1">{ing.category}</div>
                            </td>
                            <td className="p-6 text-center font-bold text-slate-400">{ing.unit}</td>
                            <td className="p-6 text-right font-black text-slate-900">₦{ing.currentCost.toLocaleString()}</td>
                            <td className="p-6 text-right">
                               <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full uppercase">Stable</span>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
       )}

       {activeTab === 'menu' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-6 duration-500">
             {menuItems.map(item => (
                <RecipeMatrixCard key={item.id} item={item} ingredients={ingredients} />
             ))}
          </div>
       )}

       {activeTab === 'banquet_form' && renderBanquetForm()}

       {isAddIngredientOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
             <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg p-10">
                <h3 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">New Ingredient</h3>
                <p className="text-slate-500 mb-8 font-medium">Add a raw material to the master costing book.</p>
                <form onSubmit={handleAddIngredient} className="space-y-6">
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Item Designation</label>
                      <input required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={newIngredient.name} onChange={e => setNewIngredient({...newIngredient, name: e.target.value})} placeholder="e.g. Premium Basmati Rice"/>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                         <input className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={newIngredient.category} onChange={e => setNewIngredient({...newIngredient, category: e.target.value})} placeholder="Grains"/>
                      </div>
                      <div>
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Standard Unit</label>
                         <input className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={newIngredient.unit} onChange={e => setNewIngredient({...newIngredient, unit: e.target.value})} placeholder="kg"/>
                      </div>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Market Price (₦)</label>
                      <input type="number" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black text-2xl text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={newIngredient.currentCost} onChange={e => setNewIngredient({...newIngredient, currentCost: parseFloat(e.target.value)})}/>
                   </div>
                   <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setIsAddIngredientOpen(false)} className="flex-1 bg-slate-50 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all">Cancel</button>
                      <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Save Master Entry</button>
                   </div>
                </form>
             </div>
          </div>
       )}

       {showFinSheet && selectedEvent && <EventFinancialSheet event={selectedEvent} />}
    </div>
  );
};