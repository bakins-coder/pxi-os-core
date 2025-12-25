
import React, { useState, useEffect, useRef } from 'react';
import { nexusStore } from '../services/nexusStore';
import { Ingredient, InventoryMovement, InventoryItem } from '../types';
import { analyzeDeliveryNote, performAgenticMarketResearch } from '../services/ai';
import { 
    Package, Plus, RefreshCw, Bot, 
    Layers, TrendingUp, ShieldCheck, Utensils,
    ArrowUp, ArrowDown, Zap, Globe, ShieldAlert, Brain, Camera, Upload, Loader2, LayoutGrid
} from 'lucide-react';

export const Inventory = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'ingredients' | 'intelligence'>('products');
  const [products, setProducts] = useState<InventoryItem[]>(nexusStore.inventory);
  const [ingredients, setIngredients] = useState<Ingredient[]>(nexusStore.ingredients);
  const [isScanning, setIsScanning] = useState(false);
  const [researchItem, setResearchItem] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = nexusStore.subscribe(() => {
      setProducts([...nexusStore.inventory]);
      setIngredients([...nexusStore.ingredients]);
    });
    return unsubscribe;
  }, []);

  const runNeuralResearch = async (ing: Ingredient) => {
    setResearchItem(ing.name);
    const insight = await performAgenticMarketResearch(ing.name);
    if (insight) {
       nexusStore.ingredients = nexusStore.ingredients.map(i => i.id === ing.id ? { ...ing, marketInsight: insight, lastUpdated: new Date().toISOString() } : i);
       nexusStore.notify();
    }
    setResearchItem(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
       <div className="bg-slate-950 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl mb-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00ff9d]/20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-[#00ff9d] rounded-3xl flex items-center justify-center shadow-2xl animate-float">
                   <Package size={36} className="text-slate-950" />
                </div>
                <div>
                   <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Global Asset Matrix</h1>
                   <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#00ff9d] border border-white/5">
                         <Layers size={12} className="text-[#00ff9d]"/> Stock Sync Stable
                      </span>
                   </div>
                </div>
             </div>

             <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md overflow-x-auto max-w-full">
                {[
                  { id: 'products', label: 'Offerings', icon: LayoutGrid },
                  { id: 'ingredients', label: 'Materials', icon: Utensils },
                  { id: 'intelligence', label: 'Market Pulse', icon: Brain }
                ].map(tab => (
                   <button 
                      key={tab.id} 
                      onClick={() => setActiveTab(tab.id as any)} 
                      className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'bg-[#00ff9d] text-slate-950 shadow-lg' : 'text-white/50 hover:text-white'}`}
                   >
                      <tab.icon size={14}/> {tab.label}
                   </button>
                ))}
             </div>
          </div>
       </div>

       {activeTab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {products.map(p => (
                <div key={p.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden group">
                   <img src={p.image} className="w-full h-48 object-cover -mt-8 -mx-8 mb-8 group-hover:scale-105 transition-transform duration-500" alt={p.name}/>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-4">{p.name}</h3>
                   <div className="bg-slate-50 p-4 rounded-2xl flex justify-between font-black">
                      <span className="text-slate-400 text-xs">PRICE</span>
                      <span className="text-indigo-600">₦{(p.priceCents / 100).toLocaleString()}</span>
                   </div>
                </div>
             ))}
          </div>
       )}

       {activeTab === 'intelligence' && (
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
             <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                   <tr><th className="p-8">Material</th><th className="p-8">Internal</th><th className="p-8">Market Avg</th><th className="p-8 text-right">Research</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {ingredients.map(ing => (
                      <tr key={ing.id} className="hover:bg-indigo-50/20 transition-all">
                         <td className="p-8 font-black text-slate-800 uppercase">{ing.name}</td>
                         <td className="p-8 font-bold text-slate-500">₦{(ing.currentCostCents / 100).toLocaleString()}</td>
                         <td className="p-8 font-black text-indigo-600">₦{((ing.marketInsight?.marketPriceCents || 0) / 100).toLocaleString()}</td>
                         <td className="p-8 text-right">
                            <button onClick={() => runNeuralResearch(ing)} className="p-3 bg-slate-100 rounded-xl hover:bg-[#00ff9d] transition-all">
                               {researchItem === ing.name ? <RefreshCw className="animate-spin" size={16}/> : <Zap size={16}/>}
                            </button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       )}
    </div>
  );
};
