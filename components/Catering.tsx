
import React, { useState, useEffect } from 'react';
import { nexusStore } from '../services/nexusStore';
import { generateAIResponse } from '../services/ai';
import { InventoryItem, CateringEvent, DealItem, Ingredient, EventTask } from '../types';
import { 
  ChefHat, Calendar, Plus, CheckCircle2, 
  Utensils, Zap, FileText, ArrowRight,
  Bot, RefreshCw, X, Sparkles, User, Phone, Palette, Award, FileSpreadsheet, Send
} from 'lucide-react';

export const Catering = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'workflow' | 'banquet_form'>('orders');
  const [events, setEvents] = useState<CateringEvent[]>(nexusStore.cateringEvents);
  const [selectedEvent, setSelectedEvent] = useState<CateringEvent | null>(null);
  const [formStep, setFormStep] = useState<'input' | 'processing' | 'success'>('input');
  const [banquetForm, setBanquetForm] = useState({
    customerDetails: '', location: '', contactPerson: '', phone: '', occasion: 'Wedding', colorTheme: '', eventDate: '', guestCount: 50, selectedItems: [] as { itemId: string; qty: number }[]
  });

  useEffect(() => {
    const unsubscribe = nexusStore.subscribe(() => setEvents([...nexusStore.cateringEvents]));
    return unsubscribe;
  }, []);

  const handleBanquetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStep('processing');
    await new Promise(r => setTimeout(r, 2000));
    
    const items: DealItem[] = banquetForm.selectedItems.map(sel => {
        const inv = nexusStore.inventory.find(i => i.id === sel.itemId);
        return { inventoryItemId: inv?.id || '', name: inv?.name || '', quantity: sel.qty, priceCents: inv?.priceCents || 0, costCents: (inv as any)?.costPriceCents || 0 };
    });

    nexusStore.createBanquetDeal(banquetForm, items);
    setFormStep('success');
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
       <div className="bg-slate-950 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl mb-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00ff9d]/20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-[#00ff9d] rounded-3xl flex items-center justify-center shadow-2xl animate-float">
                   <ChefHat size={36} className="text-slate-950" />
                </div>
                <div>
                   <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Catering Hub</h1>
                   <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#00ff9d] border border-white/5">
                         Elite Ops Synchronized
                      </span>
                   </div>
                </div>
             </div>

             <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md overflow-x-auto max-w-full">
                {['orders', 'workflow', 'banquet_form'].map(tab => (
                   <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-[#00ff9d] text-slate-950 shadow-lg' : 'text-white/50'}`}>
                      {tab.replace('_', ' ')}
                   </button>
                ))}
             </div>
          </div>
       </div>

       {activeTab === 'orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 space-y-4">
                {events.map(event => (
                   <div key={event.id} onClick={() => setSelectedEvent(event)} className={`bg-white p-8 rounded-[3rem] border-2 cursor-pointer transition-all ${selectedEvent?.id === event.id ? 'border-indigo-600 shadow-2xl' : 'border-slate-50'}`}>
                      <h3 className="text-xl font-black text-slate-800 uppercase">{event.customerName}</h3>
                      <p className="text-slate-400 font-bold text-xs mt-2 uppercase">{event.eventDate} • {event.guestCount} Guests</p>
                   </div>
                ))}
             </div>
          </div>
       )}
    </div>
  );
};
