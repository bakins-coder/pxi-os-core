import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Invoice, InvoiceStatus, Deal, Contact, Task, Supplier, Requisition, BookkeepingEntry, Role } from '../types';
import { 
    Plus, Check, FileText, Download, AlertTriangle, Clock, X, Trash2, 
    Phone, Bot, Mail, ShieldAlert, PieChart, ChevronRight, User, 
    Building2, MessageSquare, Send, Calendar, Receipt, DollarSign,
    Package, Truck, ArrowRight, CheckCircle2, Layout, PenTool, Award, Globe, ShieldCheck, Banknote
} from 'lucide-react';

export const Finance = () => {
  const [activeTab, setActiveTab] = useState<'collections' | 'bookkeeping' | 'requisitions' | 'suppliers'>('collections');
  const [invoices, setInvoices] = useState(db.invoices);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCompanyDetails, setShowCompanyDetails] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');

  const [bookkeeping, setBookkeeping] = useState<BookkeepingEntry[]>(db.bookkeeping);
  const [newEntry, setNewEntry] = useState<Partial<BookkeepingEntry>>({ type: 'Inflow', category: 'Sales', description: '' });

  const [requisitions, setRequisitions] = useState<Requisition[]>(db.requisitions);
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [newReq, setNewReq] = useState<Partial<Requisition>>({ type: 'Purchase', category: 'Food', quantity: 1 });

  const currentUser = db.currentUser;
  const org = db.organizationSettings;

  useEffect(() => {
    setInvoices(db.invoices);
    setBookkeeping(db.bookkeeping);
    setRequisitions(db.requisitions);
  }, [selectedInvoice, activeTab]);

  const handlePartialPayment = () => {
    if (!selectedInvoice || !paymentAmount) return;
    db.recordPayment(selectedInvoice.id, parseFloat(paymentAmount));
    setPaymentAmount('');
    setSelectedInvoice(null);
  };

  const handleManualAction = (type: 'call' | 'email' | 'whatsapp') => {
    alert(`Initiating manual ${type} for customer... Follow-up task will be created.`);
    db.addTask({
      title: `Follow-up ${type} for Inv #${selectedInvoice?.number}`,
      description: `Manual communication performed by ${currentUser?.name}.`,
      assigneeId: currentUser?.id,
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      priority: 'Medium'
    });
  };

  const handleCreateRequisition = (e: React.FormEvent) => {
    e.preventDefault();
    const inventoryItem = [...db.inventory, ...db.ingredients].find(i => i.id === newReq.itemId);
    const price = newReq.pricePerUnit || (inventoryItem as any)?.costPrice || 0;
    
    db.submitRequisition({
      type: newReq.type as any,
      category: newReq.category as any,
      itemId: newReq.itemId,
      itemName: inventoryItem?.name || 'Manual Item',
      quantity: newReq.quantity || 1,
      supplierId: newReq.supplierId,
      pricePerUnit: price,
      totalAmount: (newReq.quantity || 1) * price,
      eventId: newReq.eventId,
      requestorId: currentUser?.id || 'u1'
    });
    setIsReqModalOpen(false);
    setNewReq({ type: 'Purchase', category: 'Food', quantity: 1 });
    setActiveTab('requisitions');
  };

  const handleApproveReq = (id: string) => {
    db.approveRequisition(id, currentUser?.id || 'u1');
    setRequisitions([...db.requisitions]);
  };

  const renderInvoiceDetail = () => {
    if (!selectedInvoice) return null;
    const company = db.companies.find(c => c.id === selectedInvoice.companyId);
    const contact = db.contacts.find(c => c.companyId === company?.id);
    const deal = db.deals.find(d => d.id === selectedInvoice.id);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
          <div className="flex-1 p-12 overflow-y-auto bg-white">
             <div className="flex justify-between items-start mb-12">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                       <Award size={32}/>
                    </div>
                    <div>
                       <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">{org.name}</h1>
                       <div className="flex items-center gap-1.5 mt-1">
                          <Globe size={10} className="text-indigo-500"/>
                          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Verified Merchant</span>
                       </div>
                    </div>
                </div>
                <div className="text-right">
                   <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-1">INVOICE</h2>
                   <p className="text-slate-400 text-xs font-bold font-mono tracking-tighter uppercase">XC-{selectedInvoice.number}</p>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-10 mb-12 border-y border-slate-50 py-10">
                <div>
                   <span className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] block mb-4">Client Information</span>
                   <p className="text-lg font-black text-slate-800 mb-1">{company?.name}</p>
                   <p className="text-sm text-slate-500 flex items-center gap-2">
                      <User size={14} className="text-indigo-400"/>
                      {contact?.name}
                   </p>
                </div>
                <div className="text-right">
                   <span className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] block mb-4">Issue Details</span>
                   <p className="text-sm font-bold text-slate-800">Date: {selectedInvoice.date}</p>
                   <p className="text-sm font-bold text-red-600 mt-1">Due: {selectedInvoice.dueDate}</p>
                </div>
             </div>

             <div className="space-y-4 mb-12">
                <table className="w-full text-sm">
                   <thead>
                      <tr className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] border-b border-slate-100">
                         <th className="text-left pb-4">Description</th>
                         <th className="text-center pb-4">Qty</th>
                         <th className="text-right pb-4">Rate</th>
                         <th className="text-right pb-4">Total</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {selectedInvoice.lines.map(line => (
                         <tr key={line.id}>
                            <td className="py-5 font-bold text-slate-700">{line.description}</td>
                            <td className="py-5 text-center text-slate-500">{line.quantity}</td>
                            <td className="py-5 text-right text-slate-400 font-mono">₦{line.unitPrice.toLocaleString()}</td>
                            <td className="py-5 text-right font-black text-slate-800">₦{(line.unitPrice * line.quantity).toLocaleString()}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>

             <div className="bg-slate-50 p-8 rounded-3xl space-y-3">
                <div className="flex justify-between text-sm font-bold text-slate-500">
                   <span>Subtotal</span>
                   <span>₦{selectedInvoice.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-green-600">
                   <span>Amount Received</span>
                   <span>₦{selectedInvoice.paidAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-slate-200">
                   <span className="text-lg font-black text-slate-900 uppercase tracking-tighter">Balance Remaining</span>
                   <span className="text-2xl font-black text-indigo-600">₦{(selectedInvoice.total - selectedInvoice.paidAmount).toLocaleString()}</span>
                </div>
             </div>
          </div>

          <div className="w-full md:w-96 bg-slate-900 p-10 flex flex-col text-white relative">
             <button onClick={() => setSelectedInvoice(null)} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all">
                <X size={20}/>
             </button>

             <div className="mb-10 mt-6">
                <div className="flex items-center gap-2 mb-4 text-indigo-400">
                   <ShieldCheck size={20}/>
                   <span className="text-[10px] font-black uppercase tracking-[0.2em]">Transaction Center</span>
                </div>
                <h3 className="text-xl font-bold tracking-tight">Record Collection</h3>
             </div>

             <div className="space-y-6 flex-1">
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Remittance Amount</label>
                   <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">₦</span>
                      <input 
                         type="number" 
                         placeholder="0.00" 
                         className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-10 text-xl font-black text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                         value={paymentAmount}
                         onChange={e => setPaymentAmount(e.target.value)}
                      />
                   </div>
                </div>

                <button 
                   onClick={handlePartialPayment}
                   className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-900/40 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                   <CheckCircle2 size={18}/> Post Payment
                </button>

                <div className="pt-8 border-t border-white/5">
                   <span className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] block mb-4">Direct Communication</span>
                   <div className="grid grid-cols-3 gap-3">
                      <button onClick={() => handleManualAction('call')} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-indigo-600 transition-all flex flex-col items-center gap-2 group">
                         <Phone size={18} className="text-slate-400 group-hover:text-white"/>
                         <span className="text-[9px] font-bold text-slate-500 group-hover:text-white">CALL</span>
                      </button>
                      <button onClick={() => handleManualAction('email')} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-indigo-600 transition-all flex flex-col items-center gap-2 group">
                         <Mail size={18} className="text-slate-400 group-hover:text-white"/>
                         <span className="text-[9px] font-bold text-slate-500 group-hover:text-white">EMAIL</span>
                      </button>
                      <button onClick={() => handleManualAction('whatsapp')} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-indigo-600 transition-all flex flex-col items-center gap-2 group">
                         <MessageSquare size={18} className="text-slate-400 group-hover:text-white"/>
                         <span className="text-[9px] font-bold text-slate-500 group-hover:text-white">CHAT</span>
                      </button>
                   </div>
                </div>
             </div>

             <div className="mt-10 p-6 bg-white/5 rounded-3xl border border-white/5">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Bot size={20}/>
                   </div>
                   <div>
                      <p className="text-xs font-black text-indigo-400 tracking-tight">AI COLLECTOR SIGNAL</p>
                      <p className="text-[10px] text-slate-400 leading-tight mt-1 italic">
                         "Customer typically remits via transfer. DSO has increased by 10% this cycle."
                      </p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBookkeeping = () => (
    <div className="space-y-6 animate-in fade-in">
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800"><PenTool size={20} className="text-indigo-600"/> Human Bookkeeping Entries</h2>
          <form onSubmit={(e) => {
             e.preventDefault();
             db.addBookkeeping(newEntry as any);
             setBookkeeping([...db.bookkeeping]);
             setNewEntry({ type: 'Inflow', category: 'Sales', description: '' });
          }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <select className="p-2 border rounded-lg bg-white" value={newEntry.type} onChange={e => setNewEntry({...newEntry, type: e.target.value as any})}>
                <option value="Inflow">Monies Received (Inflow)</option>
                <option value="Outflow">Monies Paid Out (Outflow)</option>
             </select>
             <input required type="number" placeholder="Amount (₦)" className="p-2 border rounded-lg" value={newEntry.amount || ''} onChange={e => setNewEntry({...newEntry, amount: parseFloat(e.target.value)})}/>
             <input required placeholder="Description" className="p-2 border rounded-lg" value={newEntry.description} onChange={e => setNewEntry({...newEntry, description: e.target.value})}/>
             <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-indigo-700">
                <Plus size={18}/> Post Entry
             </button>
          </form>
       </div>

       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
             <thead className="bg-slate-50 text-slate-500">
                <tr>
                   <th className="p-4">Date</th>
                   <th className="p-4">Type</th>
                   <th className="p-4">Description</th>
                   <th className="p-4">Reference</th>
                   <th className="p-4 text-right">Amount</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {bookkeeping.map(entry => (
                   <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="p-4 text-slate-400">{new Date(entry.date).toLocaleDateString()}</td>
                      <td className="p-4">
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${entry.type === 'Inflow' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {entry.type}
                         </span>
                      </td>
                      <td className="p-4 text-slate-700">{entry.description}</td>
                      <td className="p-4 font-mono text-slate-400">{entry.referenceId || '-'}</td>
                      <td className={`p-4 text-right font-bold ${entry.type === 'Inflow' ? 'text-green-600' : 'text-slate-800'}`}>
                         ₦{entry.amount.toLocaleString()}
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderRequisitions = () => (
    <div className="space-y-6 animate-in fade-in">
       <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
          <div>
             <h2 className="font-bold text-slate-800">Purchase & Stock Requisitions</h2>
             <p className="text-sm text-slate-500">Submit requests for inventory, hiring, or rentals.</p>
          </div>
          <button onClick={() => setIsReqModalOpen(true)} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
             <Plus size={18}/> New Requisition
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requisitions.map(req => (
             <div key={req.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer">
                <div>
                   <div className="flex justify-between items-start mb-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                         req.type === 'Purchase' ? 'bg-blue-100 text-blue-700' :
                         req.type === 'Hiring' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                      }`}>{req.type}</span>
                      <span className={`text-[10px] font-bold uppercase ${
                         req.status === 'Approved' ? 'text-green-600' : 
                         req.status === 'Paid' ? 'text-indigo-600' : 'text-orange-500'
                      }`}>{req.status}</span>
                   </div>
                   <h3 className="font-bold text-slate-800 mb-1">{req.itemName}</h3>
                   <p className="text-sm text-slate-500">Qty: {req.quantity} • {req.category}</p>
                   {req.eventId && <div className="mt-2 bg-slate-50 px-2 py-1 rounded text-[10px] text-slate-400 font-mono">Linked to Event: #{req.eventId.slice(-6)}</div>}
                </div>
                <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-end">
                   <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Estimated Cost</p>
                      <p className="text-lg font-bold text-slate-800">₦{req.totalAmount.toLocaleString()}</p>
                   </div>
                   {req.status === 'Pending' && currentUser?.role === Role.ADMIN && (
                      <button onClick={() => handleApproveReq(req.id)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700">Approve</button>
                   )}
                </div>
             </div>
          ))}
       </div>

       {isReqModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
             <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="font-bold text-lg text-slate-800">New Requisition</h3>
                   <button onClick={() => setIsReqModalOpen(false)}><X/></button>
                </div>
                <form onSubmit={handleCreateRequisition} className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                         <select className="w-full p-2 border rounded-lg" value={newReq.type} onChange={e => setNewReq({...newReq, type: e.target.value as any})}>
                            <option value="Purchase">Stock Purchase</option>
                            <option value="Release">Stock Release</option>
                            <option value="Rental">Rental Item</option>
                            <option value="Hiring">Personnel Hire</option>
                         </select>
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                         <select className="w-full p-2 border rounded-lg" value={newReq.category} onChange={e => setNewReq({...newReq, category: e.target.value as any})}>
                            <option value="Food">Food Raw Material</option>
                            <option value="Hardware">Hardware/Utensils</option>
                            <option value="Service">Personnel/Other</option>
                         </select>
                      </div>
                   </div>

                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Item</label>
                      <select className="w-full p-2 border rounded-lg" value={newReq.itemId} onChange={e => setNewReq({...newReq, itemId: e.target.value})}>
                         <option value="">Choose item from inventory...</option>
                         {[...db.inventory, ...db.ingredients].map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantity</label>
                         <input type="number" className="w-full p-2 border rounded-lg" value={newReq.quantity} onChange={e => setNewReq({...newReq, quantity: parseFloat(e.target.value)})}/>
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Supplier</label>
                         <select className="w-full p-2 border rounded-lg" value={newReq.supplierId} onChange={e => setNewReq({...newReq, supplierId: e.target.value})}>
                            <option value="">Select Supplier...</option>
                            {db.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                         </select>
                      </div>
                   </div>

                   <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 flex items-center gap-3">
                      <Bot size={20} className="text-indigo-600"/>
                      <div className="text-xs">
                         <p className="font-bold text-indigo-700 uppercase">AI Purchase Agent</p>
                         <p className="text-indigo-600">Current Market Analysis: Average price for this item is ₦{([...db.inventory, ...db.ingredients].find(i => i.id === newReq.itemId) as any)?.costPrice || 0}.</p>
                      </div>
                   </div>

                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Event ID (Optional)</label>
                      <select className="w-full p-2 border rounded-lg" value={newReq.eventId} onChange={e => setNewReq({...newReq, eventId: e.target.value})}>
                         <option value="">Not for specific event</option>
                         {db.cateringEvents.map(ev => <option key={ev.id} value={ev.id}>{ev.customerName} - {ev.eventDate}</option>)}
                      </select>
                   </div>

                   <button type="submit" className="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold mt-4 shadow-lg">Submit for Approval</button>
                </form>
             </div>
          </div>
       )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* HERO SECTION - NEXUS STYLE */}
      <div className="bg-slate-950 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl mb-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl animate-float">
                   <Banknote size={36} />
                </div>
                <div>
                   <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Finance & Collections</h1>
                   <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-300 border border-white/5">
                         <ShieldCheck size={12} className="text-indigo-400"/> Operational Ledger Secure
                      </span>
                   </div>
                </div>
             </div>

             <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md overflow-x-auto max-w-full">
                {[
                  { id: 'collections', label: 'Receivables' },
                  { id: 'bookkeeping', label: 'Bookkeeping' },
                  { id: 'requisitions', label: 'Requisitions' },
                  { id: 'suppliers', label: 'Suppliers' }
                ].map(tab => (
                   <button 
                      key={tab.id} 
                      onClick={() => setActiveTab(tab.id as any)} 
                      className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
                   >
                      {tab.label}
                   </button>
                ))}
             </div>
          </div>
       </div>

      {activeTab === 'collections' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {invoices.map(inv => (
                <div key={inv.id} onClick={() => setSelectedInvoice(inv)} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-500 cursor-pointer transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h4 className="font-bold text-slate-800 group-hover:text-indigo-600">Inv #{inv.number}</h4>
                            <p className="text-xs text-slate-400">{db.companies.find(c => c.id === inv.companyId)?.name}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${inv.status === InvoiceStatus.PAID ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{inv.status}</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800 mb-2">₦{inv.total.toLocaleString()}</div>
                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full" style={{ width: `${(inv.paidAmount / inv.total) * 100}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Due {inv.dueDate}</span>
                        <ChevronRight className="text-slate-200 group-hover:text-indigo-400"/>
                    </div>
                </div>
            ))}
        </div>
      )}

      {activeTab === 'bookkeeping' && renderBookkeeping()}
      {activeTab === 'requisitions' && renderRequisitions()}
      {activeTab === 'suppliers' && (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
            {db.suppliers.map(s => (
                <div key={s.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-xl">{s.name.charAt(0)}</div>
                        <div>
                            <h4 className="font-bold text-slate-800">{s.name}</h4>
                            <p className="text-xs text-slate-400">{s.category} Supplier</p>
                        </div>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2"><Mail size={14}/> {s.email}</div>
                        <div className="flex items-center gap-2"><Phone size={14}/> {s.phone}</div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Bank Account</p>
                            <p className="font-bold text-slate-700">{s.bankName}</p>
                            <p className="font-mono text-xs">{s.accountNumber}</p>
                        </div>
                    </div>
                </div>
            ))}
         </div>
      )}

      {renderInvoiceDetail()}
    </div>
  );
};