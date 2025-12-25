
import React, { useState, useEffect } from 'react';
import { nexusStore } from '../services/nexusStore';
import { Invoice, InvoiceStatus, Requisition, BookkeepingEntry } from '../types';
import { 
    Plus, FileText, Download, X, 
    ChevronRight, Receipt, 
    CheckCircle2, Banknote, Search, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';

export const Finance = () => {
  const [activeTab, setActiveTab] = useState<'collections' | 'bookkeeping' | 'requisitions'>('collections');
  const [invoices, setInvoices] = useState(nexusStore.invoices);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');

  const [bookkeeping, setBookkeeping] = useState<BookkeepingEntry[]>(nexusStore.bookkeeping);
  const [newEntry, setNewEntry] = useState<Partial<BookkeepingEntry>>({ type: 'Inflow', category: 'Sales', description: '' });

  const [requisitions, setRequisitions] = useState<Requisition[]>(nexusStore.requisitions);

  useEffect(() => {
    const unsubscribe = nexusStore.subscribe(() => {
      setInvoices([...nexusStore.invoices]);
      setBookkeeping([...nexusStore.bookkeeping]);
      setRequisitions([...nexusStore.requisitions]);
    });
    return unsubscribe;
  }, []);

  const handlePartialPayment = () => {
    if (!selectedInvoice || !paymentAmount) return;
    nexusStore.recordPayment(selectedInvoice.id, Math.round(parseFloat(paymentAmount) * 100));
    setPaymentAmount('');
    setSelectedInvoice(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-24">
       <div className="bg-slate-950 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00ff9d]/20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-[#00ff9d] rounded-3xl flex items-center justify-center shadow-2xl animate-float">
                   <Receipt size={36} className="text-slate-950" />
                </div>
                <div>
                   <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Finance & Treasury</h1>
                   <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#00ff9d] border border-white/5">
                         <CheckCircle2 size={12} className="text-[#00ff9d]"/> Liquidity Optimized
                      </span>
                   </div>
                </div>
             </div>

             <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md overflow-x-auto max-w-full">
                {[
                  { id: 'collections', label: 'Collections', icon: ArrowDownLeft },
                  { id: 'bookkeeping', label: 'Cash Book', icon: FileText },
                  { id: 'requisitions', label: 'Spend Management', icon: ArrowUpRight }
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

       {activeTab === 'collections' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
             <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Receivables Node</h3>
                <button className="bg-slate-950 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Plus size={14}/> New Invoice</button>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                      <tr>
                         <th className="px-8 py-4">Invoice #</th>
                         <th className="px-8 py-4 text-right">Amount</th>
                         <th className="px-8 py-4">Status</th>
                         <th className="px-8 py-4 text-right">Ops</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {invoices.map(inv => (
                         <tr key={inv.id} className="hover:bg-indigo-50/20 transition-all">
                            <td className="px-8 py-6 font-black text-slate-800 uppercase">INV-{inv.number}</td>
                            <td className="px-8 py-6 text-right font-black text-indigo-600">₦{(inv.totalCents / 100).toLocaleString()}</td>
                            <td className="px-8 py-6">
                               <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${inv.status === InvoiceStatus.PAID ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{inv.status}</span>
                            </td>
                            <td className="px-8 py-6 text-right">
                               <button onClick={() => setSelectedInvoice(inv)} className="p-2 text-slate-400 hover:text-indigo-600 transition-all"><ChevronRight/></button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
       )}

       {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
             <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md p-10">
                <div className="flex justify-between items-center mb-8">
                   <h2 className="text-xl font-black uppercase tracking-tight">Record Receipt</h2>
                   <button onClick={() => setSelectedInvoice(null)} className="p-2 hover:bg-slate-100 rounded-full"><X/></button>
                </div>
                <div className="space-y-6">
                   <input type="number" className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-2xl" placeholder="Amount (₦)" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}/>
                   <button onClick={handlePartialPayment} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Confirm Payment</button>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};
