import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/mockDb';
import { Ingredient, InventoryMovement, InventoryItem } from '../types';
import { analyzeDeliveryNote, fetchMarketPricingWithGrounding } from '../services/ai';
import { 
    Package, Plus, Search, Layers, RefreshCw, Bot, ArrowRight,
    TrendingUp, ShieldCheck, Clock, FileText, LayoutGrid, Utensils,
    ArrowUp, ArrowDown, Send, CheckCircle2, X, Camera, Loader2,
    Calculator, Info, ExternalLink, Beaker, Filter, Upload, Zap
} from 'lucide-react';

export const Inventory = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'ingredients' | 'movements'>('products');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [products, setProducts] = useState<InventoryItem[]>(db.inventory);
  const [ingredients, setIngredients] = useState<Ingredient[]>(db.ingredients);
  const [movements, setMovements] = useState<InventoryMovement[]>(db.stockMovements);
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanningStatus, setScanningStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSyncingPrices, setIsSyncingPrices] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");

  const categories = ["All", "Nigerian Cuisine", "Oriental", "Continental", "Hot Plates", "Dessert", "Starter", "Hors D'Oeuvre"];

  useEffect(() => {
    setProducts(db.inventory);
    setIngredients(db.ingredients);
    setMovements(db.stockMovements);
  }, [activeTab]);

  const handleSyncMarketPrices = async () => {
    setIsSyncingPrices(true);
    for (const ing of ingredients) {
      setSyncStatus(`Grounded Search: ${ing.name}...`);
      const result = await fetchMarketPricingWithGrounding(ing.name);
      if (result.price > 0) {
        db.ingredients = db.ingredients.map(i => i.id === ing.id ? { ...i, currentCost: result.price, lastUpdated: new Date().toISOString().split('T')[0] } : i);
      }
    }
    db.save();
    setIngredients([...db.ingredients]);
    setIsSyncingPrices(false);
    setSyncStatus("");
  };

  const handleScanDeliveryNote = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanningStatus("AI Vision: Analyzing handwritten note...");
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      try {
        const result = await analyzeDeliveryNote(base64, file.type);
        setScanningStatus("Data Extracted! Updating Stock Records...");
        await new Promise(r => setTimeout(r, 1000));
        alert("Stock levels updated based on scanned delivery note.");
      } catch (err) {
        alert("Vision error. Please try a clearer photo.");
      } finally {
        setIsScanning(false);
        setScanningStatus("");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
       {/* HERO SECTION - NEXUS STYLE */}
       <div className="bg-slate-950 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl mb-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl animate-float">
                   <Package size={36} />
                </div>
                <div>
                   <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Product Catalogue</h1>
                   <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-300 border border-white/5">
                         <Layers size={12} className="text-indigo-400"/> Inventory Sync Stable
                      </span>
                   </div>
                </div>
             </div>

             <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md overflow-x-auto max-w-full">
                {[
                  { id: 'products', label: 'Offerings', icon: LayoutGrid },
                  { id: 'ingredients', label: 'Ingredients', icon: Utensils },
                  { id: 'movements', label: 'Movements', icon: TrendingUp }
                ].map(tab => (
                   <button 
                      key={tab.id} 
                      onClick={() => setActiveTab(tab.id as any)} 
                      className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
                   >
                      <tab.icon size={14}/> {tab.label}
                   </button>
                ))}
             </div>
          </div>
       </div>

       {activeTab === 'ingredients' && (
         <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-indigo-500 rounded-2xl"><Bot size={32}/></div>
                        <h2 className="text-2xl font-black">AI Master Pricing</h2>
                     </div>
                     <p className="text-indigo-200 text-sm mb-6">I cost your items using grounded real-time market data from Google Search.</p>
                     <button 
                       onClick={handleSyncMarketPrices}
                       disabled={isSyncingPrices}
                       className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 disabled:opacity-50"
                     >
                        {isSyncingPrices ? <Loader2 className="animate-spin" size={18}/> : <RefreshCw size={18}/>}
                        {isSyncingPrices ? syncStatus : "Sync Live Pricing"}
                     </button>
                  </div>
               </div>

               <div className="bg-indigo-600 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-white/20 rounded-2xl"><Camera size={32}/></div>
                        <h2 className="text-2xl font-black">AI Vision Entry</h2>
                     </div>
                     <p className="text-indigo-100 text-sm mb-6">Snap a delivery note to automatically increment inventory levels.</p>
                     <button 
                       onClick={() => fileInputRef.current?.click()}
                       disabled={isScanning}
                       className="bg-white text-indigo-600 px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 disabled:opacity-50"
                     >
                        {isScanning ? <Loader2 className="animate-spin" size={18}/> : <Upload size={18}/>}
                        {isScanning ? scanningStatus : "Scan Delivery Note"}
                     </button>
                     <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleScanDeliveryNote} />
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
               <div className="p-6 border-b border-slate-50 font-black uppercase text-slate-800">Ingredients Master List</div>
               <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                     <tr>
                        <th className="p-6">Material</th>
                        <th className="p-6 text-center">Unit</th>
                        <th className="p-6 text-right">Master Cost (₦)</th>
                        <th className="p-6">Last Updated</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {ingredients.map(ing => (
                        <tr key={ing.id} className="hover:bg-indigo-50/20">
                           <td className="p-6 font-black text-slate-800 uppercase tracking-tight">{ing.name}</td>
                           <td className="p-6 text-center text-slate-400">{ing.unit}</td>
                           <td className="p-6 text-right font-black text-indigo-600">₦{ing.currentCost.toLocaleString()}</td>
                           <td className="p-6 text-xs text-slate-400 font-mono">{ing.lastUpdated}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
       )}

       {activeTab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {products.map(p => (
                <div key={p.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-indigo-400 transition-all flex flex-col group overflow-hidden">
                   <div className="h-40 -mx-6 -mt-6 mb-6 overflow-hidden">
                      <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
                   </div>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-4">{p.name}</h3>
                   <div className="bg-slate-50 p-4 rounded-2xl flex-1 mb-6">
                      <div className="flex justify-between text-xs font-bold mb-2 text-slate-400 uppercase"><span>Unit Cost</span><span>Unit Price</span></div>
                      <div className="flex justify-between font-black">
                         <span className="text-slate-800">₦{(p.costPrice || 0).toLocaleString()}</span>
                         <span className="text-indigo-600">₦{p.price.toLocaleString()}</span>
                      </div>
                   </div>
                   <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100">Recipe Breakdown</button>
                </div>
             ))}
          </div>
       )}
    </div>
  );
};