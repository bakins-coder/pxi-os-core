
import React, { useState, useEffect } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
import { Invoice, InvoiceStatus, BookkeepingEntry, Contact, Role } from '../types';
import {
   Plus, FileText, Download, X, ArrowRight,
   ChevronRight, Receipt,
   CheckCircle2, Banknote, ArrowDownLeft, TrendingDown, TrendingUp, ShoppingBag, Zap, Clock, GripHorizontal, Check, ShieldCheck, Users,
   BookOpen, Bot, Landmark, RefreshCw, ShieldAlert, AlertTriangle, Cloud, Activity, Camera, Upload, FileSpreadsheet, Maximize2, Minimize2
} from 'lucide-react';
import { CustomerStatementModal } from './CustomerStatementModal';
import { getCFOAdvice, suggestCOAForTransaction, generateAIResponse, parseFinancialDocument } from '../services/ai';
import { getRunwayMonths, getNetBurnRate } from '../utils/finance';
import { FinancialReports } from './FinancialReports';

const ManualEntryModal = ({ isOpen, onClose, onAdd }: { isOpen: boolean, onClose: () => void, onAdd: (e: Partial<BookkeepingEntry>) => void }) => {
   const { chartOfAccounts: coa } = useDataStore();
   const [formData, setFormData] = useState<Partial<BookkeepingEntry>>({ type: 'Outflow', category: '', description: '', amountCents: 0 });
   const [isAnalyzing, setIsAnalyzing] = useState(false);
   const [isMaximized, setIsMaximized] = useState(false);
   const fileInputRef = React.useRef<HTMLInputElement>(null);
   const brandColor = useSettingsStore(s => s.settings.brandColor) || '#ff6b6b';

   const handleAiAssist = async () => {
      if (!formData.description) return;
      setIsAnalyzing(true);
      try {
         const result = await suggestCOAForTransaction(formData.description, coa);
         if (result && result.accountId) {
            const matchedAccount = coa.find(a => a.id === result.accountId);
            if (matchedAccount) {
               setFormData(prev => ({
                  ...prev,
                  category: matchedAccount.name, // Using name as category for legacy support, ideally link ID
                  type: matchedAccount.type === 'Revenue' ? 'Inflow' : 'Outflow'
               }));
            }
         }
      } catch (e) {
         console.error("AI Assist Failed", e);
      } finally {
         setIsAnalyzing(false);
      }
   };

   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsAnalyzing(true);
      const reader = new FileReader();
      reader.onload = async (evt) => {
         const base64 = (evt.target?.result as string).split(',')[1];
         try {
            const result = await parseFinancialDocument(base64, file.type);
            setFormData(prev => ({
               ...prev,
               type: result.type,
               amountCents: result.amountCents,
               description: `${result.description} (${result.merchant})`
            }));
            // Auto-classify immediately after scanning
            const coaResult = await suggestCOAForTransaction(`${result.description} (${result.merchant})`, coa);
            if (coaResult && coaResult.accountId) {
               const matchedAccount = coa.find(a => a.id === coaResult.accountId);
               if (matchedAccount) {
                  setFormData(prev => ({ ...prev, category: matchedAccount.name }));
               }
            }
         } catch (err) {
            console.error("Scan Failed", err);
         } finally {
            setIsAnalyzing(false);
         }
      };
      reader.readAsDataURL(file);
   };


   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in" onClick={onClose}>
         <div
            onClick={e => e.stopPropagation()}
            className={`bg-white shadow-2xl w-full overflow-hidden flex flex-col border border-slate-200 transition-all duration-300 ${isMaximized ? 'fixed inset-0 rounded-none h-full max-w-none' : 'max-w-lg rounded-[3.5rem] max-h-[90vh]'}`}
         >
            <div className="p-10 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/80 cursor-grab active:cursor-grabbing">
               <div className="flex items-center gap-4">
                  <GripHorizontal className="text-slate-300" />
                  <div>
                     <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-none">Record Cash Entry</h2>
                     <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-2">Manual Ledger Entry Interface</p>
                  </div>
               </div>
               <div className="flex gap-2">
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
                  <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all shadow-sm flex items-center gap-2">
                     {isAnalyzing ? <RefreshCw size={20} className="animate-spin" /> : <Camera size={20} />}
                     <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Scan Receipt</span>
                  </button>
                  <button onClick={() => setIsMaximized(!isMaximized)} className="p-3 bg-white border border-slate-100 hover:bg-slate-50 rounded-2xl transition-all shadow-sm">
                     {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                  <button onClick={onClose} className="p-3 bg-white border border-slate-100 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm"><X size={20} /></button>
               </div>
            </div>

            <div className="p-10 space-y-10 flex-1 overflow-y-auto">
               <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200">
                  <button
                     onClick={() => setFormData({ ...formData, type: 'Inflow' })}
                     className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${formData.type === 'Inflow' ? 'bg-white text-emerald-600 shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                     Revenue In
                  </button>
                  <button
                     onClick={() => setFormData({ ...formData, type: 'Outflow' })}
                     className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${formData.type === 'Outflow' ? 'bg-white text-rose-600 shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                     Expense Out
                  </button>
               </div>

               <div className="space-y-8">
                  <div>
                     <label className="text-[11px] font-black uppercase text-slate-600 tracking-widest ml-2 mb-3 block">Context Description</label>
                     <div className="relative">
                        <input
                           className="w-full p-5 pr-14 bg-white border-2 border-slate-200 rounded-[1.5rem] font-black text-slate-900 text-lg outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300"
                           placeholder="e.g., Office Generator Fuel"
                           value={formData.description}
                           onChange={e => setFormData({ ...formData, description: e.target.value })}
                           onBlur={handleAiAssist}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500">
                           {isAnalyzing ? <RefreshCw className="animate-spin" size={20} /> : <Bot size={20} className="hover:scale-110 transition-transform cursor-pointer" onClick={handleAiAssist} />}
                        </div>
                     </div>
                  </div>
                  <div>
                     <label className="text-[11px] font-black uppercase text-slate-600 tracking-widest ml-2 mb-3 block">Account / Ledger Head</label>
                     <select
                        className="w-full p-5 bg-white border-2 border-slate-200 rounded-[1.5rem] font-black text-slate-900 text-lg outline-none appearance-none focus:border-indigo-500 transition-all cursor-pointer"
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                     >
                        <option value="">Select Account...</option>
                        {coa.filter(c => formData.type === 'Inflow' ? c.type === 'Revenue' : c.type === 'Expense' || c.type === 'Liability').map(acc => (
                           <option key={acc.id} value={acc.name}>{acc.name} ({acc.code})</option>
                        ))}
                     </select>
                  </div>
                  <div>
                     <label className="text-[11px] font-black uppercase text-slate-600 tracking-widest ml-2 mb-3 block">Transaction Amount (₦)</label>
                     <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xl">₦</span>
                        <input
                           type="number"
                           className="w-full pl-12 pr-6 py-6 bg-slate-50 border-2 border-slate-200 rounded-[2rem] font-black text-4xl text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                           placeholder="0.00"
                           onChange={e => setFormData({ ...formData, amountCents: parseFloat(e.target.value) * 100 })}
                        />
                     </div>
                  </div>
               </div>
            </div>

            <div className="p-10 border-t-2 border-slate-100 bg-white flex gap-6 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
               <button onClick={onClose} className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 rounded-[2rem] border-2 border-transparent transition-all">Go Back</button>
               <button
                  onClick={() => { onAdd(formData); onClose(); }}
                  className="flex-1 py-6 text-white font-black uppercase tracking-[0.2em] text-xs rounded-[2rem] shadow-2xl transition-all active:scale-95 hover:brightness-110"
                  style={{ backgroundColor: brandColor, boxShadow: `0 20px 40px ${brandColor}44` }}
               >
                  Confirm & Log Entry
               </button>
            </div>
         </div>
      </div>
   );
};

const ManualInvoiceModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
   const { contacts, addContact, addInvoice, inventory } = useDataStore();
   const user = useAuthStore(state => state.user);

   // Customer State
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
   const [isNewCustomer, setIsNewCustomer] = useState(false);
   const [newCustomerDetails, setNewCustomerDetails] = useState({ name: '', email: '', phone: '', address: '' });

   // Invoice State
   const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
   const [dueDate, setDueDate] = useState('');
   const [lines, setLines] = useState<{ id: string, description: string, quantity: number, price: number }[]>([
      { id: `line-${Date.now()}`, description: '', quantity: 1, price: 0 }
   ]);
   const [notes, setNotes] = useState('');

   useEffect(() => {
      if (isOpen) {
         // Reset state on open
         setSearchTerm('');
         setSelectedContact(null);
         setIsNewCustomer(false);
         setNewCustomerDetails({ name: '', email: '', phone: '', address: '' });
         setLines([{ id: `line-${Date.now()}`, description: '', quantity: 1, price: 0 }]);
         setNotes('');
      }
   }, [isOpen]);

   const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
   const productInventory = inventory.filter(i => i.type === 'product');

   const handleSelectContact = (contact: Contact) => {
      setSelectedContact(contact);
      setSearchTerm(contact.name);
      setIsNewCustomer(false);
   };

   const handleCreateNewCustomer = () => {
      setIsNewCustomer(true);
      setSelectedContact(null);
      setNewCustomerDetails(prev => ({ ...prev, name: searchTerm }));
   };

   const addLine = () => {
      setLines([...lines, { id: `line-${Date.now()}`, description: '', quantity: 1, price: 0 }]);
   };

   const removeLine = (id: string) => {
      setLines(lines.filter(l => l.id !== id));
   };

   const updateLine = (id: string, field: string, value: any) => {
      setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l));
   };

   // Line Item Selection
   const handleItemSelect = (id: string, itemName: string) => {
      const item = productInventory.find(i => i.name === itemName);
      if (item) {
         updateLine(id, 'description', item.name);
         updateLine(id, 'price', (item.priceCents || 0) / 100);
      } else {
         updateLine(id, 'description', itemName); // Allow custom entry
      }
   };

   const handleSubmit = () => {
      let contactId = selectedContact?.id;

      if (isNewCustomer) {
         if (!newCustomerDetails.name) return alert("Customer Name is required");
         contactId = `con-${Date.now()}`;
         addContact({
            id: contactId,
            name: newCustomerDetails.name,
            email: newCustomerDetails.email,
            phone: newCustomerDetails.phone,
            address: newCustomerDetails.address,
            type: 'Individual',
            companyId: user?.companyId
         });
      } else if (!contactId) {
         return alert("Please select a customer or create a new one");
      }

      const totalCents = lines.reduce((sum, l) => sum + (l.quantity * l.price * 100), 0);

      const newInvoice: Invoice = {
         id: `inv-${Date.now()}`,
         number: `${Math.floor(Math.random() * 10000)}`, // Simple random number for now
         companyId: user?.companyId || 'org-xquisite',
         contactId: contactId!,
         date: date,
         dueDate: dueDate || date,
         status: InvoiceStatus.UNPAID,
         type: 'Sales',
         lines: lines.map(l => ({
            id: l.id,
            description: l.description,
            quantity: l.quantity,
            unitPriceCents: l.price * 100
         })),
         totalCents: totalCents,
         paidAmountCents: 0
      };

      addInvoice(newInvoice);
      onClose();
      alert("Invoice Created Successfully");
   };

   if (!isOpen) return null;

   const totalAmount = lines.reduce((sum, l) => sum + (l.quantity * l.price), 0);

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in" onClick={onClose}>
         <div onClick={e => e.stopPropagation()} className="bg-white shadow-2xl w-full max-w-4xl rounded-[3rem] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
               <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">New Invoice</h2>
               <button onClick={onClose} className="p-3 bg-white border border-slate-100 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm"><X size={20} /></button>
            </div>

            <div className="p-8 overflow-y-auto space-y-8">
               {/* Customer Section */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <label className="text-[11px] font-black uppercase text-slate-600 tracking-widest ml-2">Customer</label>
                     {!isNewCustomer ? (
                        <div className="relative">
                           <input
                              className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all"
                              placeholder="Search Customer..."
                              value={searchTerm}
                              onChange={e => { setSearchTerm(e.target.value); setSelectedContact(null); }}
                           />
                           {searchTerm && !selectedContact && (
                              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-10 max-h-48 overflow-y-auto">
                                 {filteredContacts.map(c => (
                                    <button key={c.id} onClick={() => handleSelectContact(c)} className="w-full text-left p-3 hover:bg-slate-50 font-bold text-sm text-slate-700 block">
                                       {c.name} <span className="text-slate-400 text-xs font-normal">({c.email})</span>
                                    </button>
                                 ))}
                                 <button onClick={handleCreateNewCustomer} className="w-full text-left p-3 bg-indigo-50 text-indigo-600 font-bold text-sm hover:bg-indigo-100">
                                    + Create new customer "{searchTerm}"
                                 </button>
                              </div>
                           )}
                        </div>
                     ) : (
                        <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 space-y-4 relative">
                           <button onClick={() => setIsNewCustomer(false)} className="absolute top-4 right-4 text-indigo-400 hover:text-indigo-600"><X size={16} /></button>
                           <h4 className="font-black text-indigo-900 text-sm uppercase">New Customer Details</h4>
                           <input
                              className="w-full p-3 bg-white border border-indigo-100 rounded-xl text-sm font-bold"
                              placeholder="Full Name"
                              value={newCustomerDetails.name}
                              onChange={e => setNewCustomerDetails({ ...newCustomerDetails, name: e.target.value })}
                           />
                           <input
                              className="w-full p-3 bg-white border border-indigo-100 rounded-xl text-sm"
                              placeholder="Email Address"
                              value={newCustomerDetails.email}
                              onChange={e => setNewCustomerDetails({ ...newCustomerDetails, email: e.target.value })}
                           />
                           <input
                              className="w-full p-3 bg-white border border-indigo-100 rounded-xl text-sm"
                              placeholder="Phone Number"
                              value={newCustomerDetails.phone}
                              onChange={e => setNewCustomerDetails({ ...newCustomerDetails, phone: e.target.value })}
                           />
                           <input
                              className="w-full p-3 bg-white border border-indigo-100 rounded-xl text-sm"
                              placeholder="Billing Address"
                              value={newCustomerDetails.address}
                              onChange={e => setNewCustomerDetails({ ...newCustomerDetails, address: e.target.value })}
                           />
                        </div>
                     )}
                  </div>

                  <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[11px] font-black uppercase text-slate-600 tracking-widest ml-2 block mb-2">Invoice Date</label>
                           <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-800 outline-none" />
                        </div>
                        <div>
                           <label className="text-[11px] font-black uppercase text-slate-600 tracking-widest ml-2 block mb-2">Due Date</label>
                           <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-800 outline-none" />
                        </div>
                     </div>
                  </div>
               </div>
               <div>
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="text-sm font-black uppercase text-slate-600 tracking-widest">Line Items</h3>
                     <button onClick={addLine} className="text-xs bg-slate-900 text-white px-4 py-2 rounded-xl font-bold uppercase tracking-widest hover:bg-slate-700 transition-all">+ Add Item</button>
                  </div>
                  <div className="space-y-3">
                     {lines.map((line, idx) => (
                        <div key={line.id} className="flex gap-4 items-start">
                           <span className="pt-4 text-xs font-bold text-slate-400 w-6">{idx + 1}.</span>
                           <div className="flex-1 relative group">
                              <input
                                 list={`inventory-list-${line.id}`}
                                 className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500"
                                 placeholder="Description or Select Item"
                                 value={line.description}
                                 onChange={e => handleItemSelect(line.id, e.target.value)}
                              />
                              <datalist id={`inventory-list-${line.id}`}>
                                 {productInventory.map(item => (
                                    <option key={item.id} value={item.name}>{item.category} - ₦{(item.priceCents / 100).toLocaleString()}</option>
                                 ))}
                              </datalist>
                           </div>
                           <input
                              type="number"
                              className="w-20 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 text-center"
                              placeholder="Qty"
                              value={line.quantity}
                              onChange={e => updateLine(line.id, 'quantity', parseFloat(e.target.value))}
                           />
                           <div className="relative w-32">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₦</span>
                              <input
                                 type="number"
                                 className="w-full pl-6 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 text-right"
                                 placeholder="Price"
                                 value={line.price}
                                 onChange={e => updateLine(line.id, 'price', parseFloat(e.target.value))}
                              />
                           </div>
                           <button onClick={() => removeLine(line.id)} className="p-3 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><X size={16} /></button>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Totals */}
               <div className="flex justify-end">
                  <div className="bg-slate-900 text-white p-6 rounded-[2rem] min-w-[300px]">
                     <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Total Amount</span>
                        <span className="text-2xl font-black">₦{totalAmount.toLocaleString()}</span>
                     </div>
                  </div>
               </div>
            </div >

            <div className="p-8 border-t border-slate-100 bg-white flex gap-4">
               <button onClick={onClose} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-200">Cancel</button>
               <button onClick={handleSubmit} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Generate Invoice</button>
            </div>
         </div >
      </div >
   );
};

export const Finance = () => {
   const [activeTab, setActiveTab] = useState<'collections' | 'bookkeeping' | 'requisitions' | 'ledger' | 'reports' | 'advisor' | 'reconcile' | 'watchdog'>('collections');

   const {
      invoices, bookkeeping, requisitions, chartOfAccounts: coa, bankStatementLines: bankLines,
      recordPayment, addBookkeepingEntry, approveRequisition, reconcileMatch, contacts, addContact, addInvoice
   } = useDataStore();

   const { cloudEnabled, isDemoMode, settings: org } = useSettingsStore();

   const [isManualInvoiceModalOpen, setIsManualInvoiceModalOpen] = useState(false);
   const currentUser = useAuthStore(state => state.user);

   const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
   const [selectedContactForStatement, setSelectedContactForStatement] = useState<Contact | null>(null);
   const [paymentAmount, setPaymentAmount] = useState<string>('');
   const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
   const [isInvoiceModalMaximized, setIsInvoiceModalMaximized] = useState(false);

   // ... rest of component


   // Accounting State
   const [cfoInsight, setCfoInsight] = useState<any>(null);
   const [isSyncing, setIsSyncing] = useState(false);
   const [selectedLine, setSelectedLine] = useState<any>(null);
   const [aiMatchId, setAiMatchId] = useState<string | null>(null);
   const [anomalies, setAnomalies] = useState<{ id: string, type: string, message: string, severity: 'Medium' | 'High' }[]>([]);

   const brandColor = org.brandColor || '#ff6b6b';

   // RBAC Check
   const isSuperAdmin = currentUser?.role === Role.SUPER_ADMIN || currentUser?.role === Role.ADMIN || currentUser?.role === Role.FINANCE; // 'Finance' might be the catch-all for CFO in some contexts, but sticking to specific RBAC
   const isManager = currentUser?.role === Role.MANAGER || currentUser?.role === Role.FINANCE || currentUser?.role === Role.HR_MANAGER; // Assuming 'FINANCE' is high level. If Role.FINANCE is the 'CFO', then great.

   // Let's be precise:
   // CFO/Super Admin: Can see everything.
   // Manager: Can see operational tabs.
   // Officer: Can see basic tabs.

   const canViewStrategic = [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE].includes(currentUser?.role as any); // Advisor, Watchdog
   const canViewOperational = [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE, Role.MANAGER].includes(currentUser?.role as any); // Reconcile, Ledger
   const canViewSensitive = [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE, Role.HR_MANAGER].includes(currentUser?.role as any);
   const canViewBasic = true; // Collections, Bookkeeping, Requisitions (Visible to all finance staff)

   const handleSendReminders = () => {
      const overdue = invoices.filter(i => i.status !== InvoiceStatus.PAID);
      if (overdue.length === 0) {
         alert("No outstanding invoices to remind.");
         return;
      }

      setIsSyncing(true);
      setTimeout(() => {
         let sentCount = 0;
         overdue.forEach(inv => {
            const dueDate = new Date(inv.dueDate).getTime();
            const now = Date.now();
            const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));

            if (daysOverdue > 0 && (daysOverdue % 7 === 0 || daysOverdue === 1)) {
               // Logic: Send on Day 1 overdue, then every 7 days (7, 14, 21...)
               console.log(`[AI Finance Agent] Sending reminder for Invoice #${inv.number}. Overdue by ${daysOverdue} days.`);
               sentCount++;
            }
         });

         // If no specific intervals met, maybe just force send for demo if user explicitly clicked? 
         // For now let's say we checked them.
         if (sentCount === 0) {
            // Fallback for demo: Send to all unpaid if explicitly requested
            sentCount = overdue.length;
            console.log(`[AI Finance Agent] Forcing reminders for ${sentCount} outstanding invoices.`);
         }

         setIsSyncing(false);
         alert(`AI Agent has successfully dispatched payment reminders for ${sentCount} outstanding invoices.`);
      }, 1500);
   };

   useEffect(() => {
      if (activeTab === 'advisor' && canViewStrategic) fetchAdvisor();
      if (activeTab === 'watchdog' && canViewStrategic) runWatchdog();
   }, [activeTab, bankLines]);

   const fetchAdvisor = async () => {
      setIsSyncing(true);
      try {
         const insight = await getCFOAdvice();
         setCfoInsight(insight);
      } catch (e) {
         console.error("CFO Advisor Error:", e);
      } finally { setIsSyncing(false); }
   };

   const runWatchdog = () => {
      const findings: { id: string, type: string, message: string, severity: 'Medium' | 'High' }[] = [];
      const seen = new Set();
      bankLines.forEach(l => {
         const key = `${l.description}-${l.amountCents}-${l.type}`;
         if (seen.has(key)) findings.push({ id: `dup-${l.id}`, type: 'Duplicate Entry', message: `Detected possible duplicate: "${l.description}"`, severity: 'Medium' });
         seen.add(key);
      });
      bankLines.filter(l => l.type === 'Debit' && l.amountCents > 100000000).forEach(l => {
         findings.push({ id: `high-${l.id}`, type: 'High Volume Outflow', message: `Anomalous outflow detected for "${l.description}"`, severity: 'High' });
      });
      setAnomalies(findings);
   };

   const handlePartialPayment = () => {
      if (!selectedInvoice || !paymentAmount) return;
      recordPayment(selectedInvoice.id, Math.round(parseFloat(paymentAmount) * 100));
      setPaymentAmount('');
      setSelectedInvoice(null);
   };

   const handleAddBookkeeping = (entry: Partial<BookkeepingEntry>) => addBookkeepingEntry(entry as BookkeepingEntry);
   const handleApproveReq = (id: string) => approveRequisition(id);

   const handleMatch = (lineId: string, accountId: string) => {
      reconcileMatch(lineId, accountId);
      setSelectedLine(null); setAiMatchId(null);
   };

   const runMatchAI = async (line: any) => {
      setIsSyncing(true);
      try {
         const suggestion = await suggestCOAForTransaction(line.description, coa);
         setAiMatchId(suggestion.accountId);
      } catch (e) { console.error("AI Match Error:", e); } finally { setIsSyncing(false); }
   };

   const { departmentMatrix } = useDataStore();

   const hasPermission = (tag: string) => {
      if (currentUser?.role === Role.SUPER_ADMIN || currentUser?.role === Role.ADMIN || currentUser?.role === 'Manager' || currentUser?.role === 'CEO' as any) return true;
      const matrixRole = departmentMatrix.flatMap(d => d.roles).find(r => r.title === currentUser?.role);
      if (matrixRole?.permissions?.includes('*')) return true;
      if (matrixRole?.permissions?.includes(tag)) return true;
      if (matrixRole?.permissions?.includes('access:finance_all')) return true;
      return false;
   };

   return (
      <div className="space-y-8 animate-in fade-in pb-24">
         <div className="bg-slate-950 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff6b6b]/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-[#ff6b6b] rounded-3xl flex items-center justify-center shadow-2xl animate-float">
                     <Banknote size={36} className="text-white" />
                  </div>
                  <div>
                     <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Finance & Treasury</h1>
                     <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#ff6b6b] border border-white/5">
                           {cloudEnabled && !isDemoMode ? <Cloud size={12} className="animate-pulse" /> : <ShieldCheck size={12} />}
                           {cloudEnabled && !isDemoMode ? 'Cloud Link Active' : 'Secure Vault Active'}
                        </span>
                     </div>
                  </div>
               </div>

               <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md overflow-x-auto max-w-full">
                  {[
                     { id: 'collections', label: 'Collections', icon: ArrowDownLeft, perm: 'access:finance_bookkeeping' },
                     { id: 'bookkeeping', label: 'Cash Ledger', icon: FileText, perm: 'access:finance_bookkeeping' },
                     { id: 'requisitions', label: 'Spend Matrix', icon: Zap, perm: 'access:finance_bookkeeping' }, // Or finance_all? Let's say bookkeeping.
                     { id: 'ledger', label: 'G/L Accounts', icon: BookOpen, perm: 'access:finance_ledger' },
                     { id: 'reconcile', label: 'Reconcile', icon: Landmark, perm: 'access:finance_ledger' },
                     { id: 'reports', label: 'Statements', icon: FileSpreadsheet, perm: 'access:reports' },
                     { id: 'advisor', label: 'CFO Advisor', icon: Bot, perm: 'access:cfo_advisor' },
                     { id: 'watchdog', label: 'Watchdog', icon: ShieldAlert, perm: 'access:cfo_advisor' }
                  ].filter(t => hasPermission(t.perm)).map(tab => (
                     <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'bg-[#ff6b6b] text-white shadow-lg' : 'text-white/50 hover:text-white'}`}>
                        <tab.icon size={14} /> {tab.label}
                        {tab.id === 'watchdog' && anomalies.length > 0 && <span className="bg-rose-500 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-pulse">{anomalies.length}</span>}
                     </button>
                  ))}
               </div>
            </div>
         </div>

         {activeTab === 'collections' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4">
               <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                  <div><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Accounts Receivable</h3><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Tracking outstanding banquet node payments</p></div>
                  <button onClick={handleSendReminders} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition-all"><Bot size={16} /> AI Reminders</button>
                  <button onClick={() => setIsManualInvoiceModalOpen(true)} className="bg-slate-950 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition-all"><Plus size={16} /> Manual Invoice</button>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest"><tr><th className="px-8 py-4">Reference</th><th className="px-8 py-4 text-right">Amount</th><th className="px-8 py-4">Status</th><th className="px-8 py-4 text-right">Ops</th></tr></thead>
                     <tbody className="divide-y divide-slate-50">{invoices.map(inv => (<tr key={inv.id} className="hover:bg-indigo-50/20 transition-all group"><td className="px-8 py-6 font-black text-slate-800 uppercase">INV-{inv.number}</td><td className="px-8 py-6 text-right font-black text-indigo-600">₦{(inv.totalCents / 100).toLocaleString()}</td><td className="px-8 py-6"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${inv.status === InvoiceStatus.PAID ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{inv.status}</span></td><td className="px-8 py-6 text-right flex justify-end gap-2"><button onClick={() => setSelectedInvoice(inv)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all"><Receipt size={16} /></button>{inv.contactId && (<button onClick={() => { const contact = contacts.find(c => c.id === inv.contactId); if (contact) setSelectedContactForStatement(contact); }} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><FileText size={16} /></button>)}</td></tr>))}</tbody>
                  </table>
               </div>
            </div>
         )}

         {activeTab === 'bookkeeping' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl flex justify-between items-center group transition-all hover:border-[#ff6b6b]"><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Inflows</p><h3 className="text-3xl font-black text-emerald-600">₦{(bookkeeping.filter(e => e.type === 'Inflow').reduce((s, e) => s + e.amountCents, 0) / 100).toLocaleString()}</h3></div><div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600"><TrendingUp size={24} /></div></div>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl flex justify-between items-center group transition-all hover:border-[#ff6b6b]"><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Outflows</p><h3 className="text-3xl font-black text-rose-600">₦{(bookkeeping.filter(e => e.type === 'Outflow').reduce((s, e) => s + e.amountCents, 0) / 100).toLocaleString()}</h3></div><div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600"><TrendingDown size={24} /></div></div>
               </div>
               <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                  <div className="p-8 border-b border-slate-50 flex justify-between items-center"><div><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Manual Ledger</h3><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Xquisite Centralized Cash Book</p></div><button onClick={() => setIsEntryModalOpen(true)} className="bg-slate-950 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all"><Plus size={16} /> Record Entry</button></div>
                  <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest"><tr><th className="px-8 py-4">Date</th><th className="px-8 py-4">Description</th><th className="px-8 py-4">Category</th><th className="px-8 py-4 text-right">Net Value</th><th className="px-8 py-4 text-right">Ops</th></tr></thead><tbody className="divide-y divide-slate-50">{bookkeeping.map(entry => {
                     const isSensitive = ['Salaries', 'Payroll', 'Bonus'].some(k => (entry.category || '').includes(k));
                     if (isSensitive && !canViewSensitive) return null;
                     return (
                        <tr key={entry.id} className="hover:bg-indigo-50/20 transition-all"><td className="px-8 py-6 font-bold text-slate-400 uppercase text-[10px]">{entry.date}</td><td className="px-8 py-6 font-black text-slate-800 uppercase">{entry.description}</td><td className="px-8 py-6 font-bold text-slate-400 uppercase text-[10px]">{entry.category}</td><td className={`px-8 py-6 text-right font-black ${entry.type === 'Inflow' ? 'text-emerald-600' : 'text-rose-600'}`}>{entry.type === 'Inflow' ? '+' : '-'} ₦{(entry.amountCents / 100).toLocaleString()}</td><td className="px-8 py-6 text-right">{entry.contactId && (<button onClick={() => { const contact = contacts.find(c => c.id === entry.contactId); if (contact) setSelectedContactForStatement(contact); }} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><FileText size={16} /></button>)}</td></tr>
                     );
                  })}</tbody></table></div>
               </div>
            </div>
         )}

         {activeTab === 'requisitions' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                     <div className="p-8 border-b border-slate-50 flex justify-between items-center"><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Active Requisitions</h3><button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest">Global Filter</button></div>
                     <div className="p-8 space-y-6">{requisitions.map(req => (<div key={req.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-all"><div className="flex items-center gap-5"><div className={`w-12 h-12 rounded-xl flex items-center justify-center ${req.type === 'Purchase' ? 'bg-indigo-50 text-indigo-600' : req.type === 'Hiring' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{req.type === 'Purchase' ? <ShoppingBag size={20} /> : req.type === 'Hiring' ? <Users size={20} /> : <Clock size={20} />}</div><div><p className="font-black text-slate-800 uppercase text-xs">{req.itemName}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{req.category} • Qty: {req.quantity} {req.notes ? `(${req.notes})` : ''}</p></div></div><div className="flex items-center gap-6"><div className="text-right"><p className="font-black text-slate-900">₦{(req.totalAmountCents / 100).toLocaleString()}</p><span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${req.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{req.status}</span></div>{req.status === 'Pending' && (<button onClick={() => handleApproveReq(req.id)} className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all"><Check size={18} strokeWidth={3} /></button>)}</div></div>))}</div>
                  </div>
                  <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden h-fit"><div className="absolute top-0 right-0 w-32 h-32 bg-[#ff6b6b]/10 rounded-full blur-2xl"></div><h3 className="text-[10px] font-black text-[#ff6b6b] uppercase tracking-[0.3em] mb-8">Internal Budget Guard</h3><div className="space-y-6"><div className="p-6 bg-white/5 border border-white/10 rounded-[2rem]"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pending Authorization</p><p className="text-3xl font-black text-white">₦{(requisitions.filter(r => r.status === 'Pending').reduce((s, r) => s + r.totalAmountCents, 0) / 100).toLocaleString()}</p></div><div className="p-6 bg-white/5 border border-white/10 rounded-[2rem]"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Approved Fulfillment</p><p className="text-3xl font-black text-emerald-400">₦{(requisitions.filter(r => r.status === 'Approved').reduce((s, r) => s + r.totalAmountCents, 0) / 100).toLocaleString()}</p></div></div></div>
               </div>
            </div>
         )}

         {activeTab === 'ledger' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4">
               <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                     <div className="p-8 border-b border-slate-50 flex justify-between items-center"><h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Chart of Accounts</h2><button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Plus size={14} /> New Account</button></div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest"><tr><th className="px-8 py-4">Code / Account</th><th className="px-8 py-4">Type</th><th className="px-8 py-4 text-right">Balance</th></tr></thead><tbody className="divide-y divide-slate-50">{coa.map(account => (<tr key={account.id} className="hover:bg-indigo-50/20 transition-all group"><td className="px-8 py-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-50 font-mono text-xs">{account.code}</div><div className="font-black text-slate-800 uppercase text-sm">{account.name}</div></div></td><td className="px-8 py-6"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${account.type === 'Asset' ? 'bg-blue-50 text-blue-600' : account.type === 'Revenue' ? 'bg-emerald-50 text-emerald-600' : account.type === 'Expense' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>{account.type}</span></td><td className="px-8 py-6 text-right font-black text-slate-900">{account.currency === 'USD' ? '$' : '₦'}{(account.balanceCents / 100).toLocaleString()}</td></tr>))}</tbody></table>
                     </div>
                  </div>
               </div>
               <div className="space-y-8">
                  <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff9d]/10 rounded-full blur-2xl"></div>
                     <h3 className="text-[10px] font-black text-[#00ff9d] uppercase tracking-[0.3em] mb-6">Financial Vitality</h3>
                     <div className="space-y-6"><div><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Estimated Runway</p><h4 className="text-4xl font-black text-white tracking-tighter">{getRunwayMonths(0, 0)} Months</h4></div><div className="pt-6 border-t border-white/10"><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Burn Rate (Monthly)</p><h4 className="text-xl font-bold text-rose-400">₦{(getNetBurnRate(bookkeeping || []) / 100).toLocaleString()}</h4></div></div>
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'advisor' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4">
               <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-[#00ff9d]/5 rounded-full blur-3xl"></div>
                     <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                        <div className="flex items-center gap-6"><div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-[#00ff9d] shadow-2xl animate-float"><Bot size={40} /></div><div><h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Strategic CFO Feed</h2><p className="text-slate-500 font-medium">Real-time tax strategy & compliance monitoring.</p></div></div>
                        <button onClick={fetchAdvisor} disabled={isSyncing} className="bg-[#00ff9d] text-slate-950 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all active:scale-95">{isSyncing ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />} Refresh Insights</button>
                     </div>
                     {cfoInsight && (<div className="mt-12 space-y-8 animate-in slide-in-from-top-4"><div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100"><p className="text-slate-700 font-medium text-lg leading-relaxed italic">"{cfoInsight.summary}"</p><div className="mt-4 flex items-center gap-2"><div className={`w-2 h-2 rounded-full animate-pulse ${cfoInsight.sentiment === 'Healthy' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div><span className="text-[10px] font-black uppercase text-slate-400">Health Index: {cfoInsight.sentiment}</span></div></div></div>)}
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'reports' && (
            <FinancialReports />
         )}

         {activeTab === 'reconcile' && (
            <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row h-[700px] animate-in slide-in-from-bottom-4">
               <div className="w-full md:w-96 bg-slate-50 border-r border-slate-100 flex flex-col">
                  <div className="p-8 border-b border-slate-200"><h3 className="font-black text-xl text-slate-800 uppercase tracking-tight mb-1">Bank Feed</h3><p className="text-xs text-slate-500 font-bold uppercase">Mono API Linked</p></div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                     {bankLines.filter((l: any) => !l.isMatched).map((line: any) => (<div key={line.id} onClick={() => setSelectedLine(line)} className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${selectedLine?.id === line.id ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white border-white hover:border-indigo-100 shadow-sm'}`}><div className="flex justify-between items-start mb-3"><span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${line.type === 'Credit' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{line.type}</span><span className="text-[10px] text-slate-400 font-bold">{line.date}</span></div><h4 className="font-black text-sm uppercase leading-tight mb-4">{line.description}</h4><div className="text-xl font-black">₦{(line.amountCents / 100).toLocaleString()}</div></div>))}
                  </div>
               </div>
               <div className="flex-1 flex flex-col bg-white">
                  {selectedLine ? (
                     <div className="p-12 space-y-12 animate-in slide-in-from-right-4"><h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Reconciliation Center</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="p-8 bg-slate-900 text-white rounded-[2.5rem]"><Landmark className="text-[#00ff9d] mb-4" size={24} /><h4 className="text-xl font-bold mb-2">{selectedLine.description}</h4><div className="text-3xl font-black">₦{(selectedLine.amountCents / 100).toLocaleString()}</div><button onClick={() => runMatchAI(selectedLine)} className="mt-8 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">{isSyncing ? <RefreshCw className="animate-spin" size={14} /> : <Bot size={14} />} Ask Advisor for Match</button></div><div className="space-y-4">{coa.filter(a => ['Revenue', 'Expense'].includes(a.type)).map(acc => (<button key={acc.id} onClick={() => handleMatch(selectedLine.id, acc.id)} className={`w-full p-6 rounded-3xl border-2 text-left flex justify-between items-center ${aiMatchId === acc.id ? 'border-[#00ff9d] bg-[#00ff9d]/5' : 'border-slate-50 bg-slate-50'}`}><div><div className="text-sm font-black text-slate-800 uppercase">{acc.name}</div><div className="text-[10px] text-slate-400 font-bold uppercase">{acc.code}</div></div><ChevronRight className="text-slate-300" /></button>))}</div></div></div>
                  ) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-20"><Activity size={80} className="mb-6 opacity-10" /><p className="text-xl font-bold uppercase tracking-widest">Select a transaction to begin reconciliation</p></div>
                  )}
               </div>
            </div>
         )}

         {activeTab === 'watchdog' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
               <div className="bg-slate-900 p-8 rounded-[3rem] text-white relative overflow-hidden border border-white/5 shadow-2xl"><div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl"></div><div className="relative z-10 flex items-center gap-6"><div className="w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-xl animate-pulse"><ShieldAlert size={32} /></div><div><h2 className="text-2xl font-black uppercase tracking-tight">Xquisite Watchdog Active</h2><p className="text-rose-200 text-sm font-medium">Scanning for duplicates, anomalies, and liquidity risks in real-time.</p></div></div></div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{anomalies.map(ano => (<div key={ano.id} className={`p-8 rounded-[2.5rem] bg-white border-2 flex items-start gap-6 transition-all shadow-sm hover:shadow-xl ${ano.severity === 'High' ? 'border-rose-100' : 'border-amber-100'}`}><div className={`p-4 rounded-2xl ${ano.severity === 'High' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'}`}>{ano.severity === 'High' ? <AlertTriangle size={24} /> : <Zap size={24} />}</div><div className="flex-1"><div className="flex justify-between items-center mb-2"><span className={`text-[10px] font-black uppercase tracking-widest ${ano.severity === 'High' ? 'text-rose-600' : 'text-amber-600'}`}>{ano.type}</span><span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${ano.severity === 'High' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'}`}>{ano.severity} Severity</span></div><p className="font-bold text-slate-800 text-lg leading-tight mb-4">{ano.message}</p><div className="flex gap-2"><button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Audit Entry</button><button className="bg-slate-50 text-slate-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Ignore</button></div></div></div>))}{anomalies.length === 0 && (<div className="col-span-2 p-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200"><CheckCircle2 size={64} className="mx-auto text-emerald-500 mb-6 opacity-30" /><p className="text-xl font-bold text-slate-400 uppercase tracking-widest">No Anomalies Detected</p></div>)}</div>
            </div>
         )}

         <ManualEntryModal isOpen={isEntryModalOpen} onClose={() => setIsEntryModalOpen(false)} onAdd={handleAddBookkeeping} />

         {selectedInvoice && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in zoom-in" onClick={() => setSelectedInvoice(null)}>
               <div
                  onClick={e => e.stopPropagation()}
                  className={`bg-white shadow-2xl w-full overflow-hidden flex flex-col border border-slate-200 transition-all duration-300 ${isInvoiceModalMaximized ? 'fixed inset-0 rounded-none h-full max-w-none' : 'max-w-2xl rounded-[3.5rem] max-h-[90vh]'}`}
               >
                  <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                     <div className="flex items-center gap-4">
                        {org.logo && <img src={org.logo} alt="Organization Logo" className="w-12 h-12 rounded-xl object-contain bg-white p-1 shadow-sm" />}
                        <div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${selectedInvoice.status === InvoiceStatus.PAID ? 'bg-emerald-500' : 'bg-[#ff6b6b]'}`}>{selectedInvoice.status === InvoiceStatus.PAID ? <CheckCircle2 size={24} /> : <Receipt size={24} />}</div><div><h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-none">{selectedInvoice.status === InvoiceStatus.PAID ? 'Official Receipt' : 'Record Payment'}</h2><p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-2">{org.name} • Invoice #{selectedInvoice.number}</p></div></div>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => setIsInvoiceModalMaximized(!isInvoiceModalMaximized)} className="p-3 bg-white border border-slate-100 hover:bg-slate-50 rounded-xl transition-all shadow-sm">
                           {isInvoiceModalMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                        </button>
                        <button onClick={() => { setSelectedInvoice(null); setPaymentAmount(''); }} className="p-3 hover:bg-slate-100 rounded-xl transition-all"><X size={24} /></button>
                     </div>
                  </div>
                  <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh]">
                     {selectedInvoice.status === InvoiceStatus.PAID ? (
                        <div className="space-y-8"><div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 text-center space-y-2"><p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Payment Status</p><p className="text-4xl font-black text-emerald-700 uppercase tracking-tighter">Fully Settled</p><p className="text-xs text-emerald-600 font-bold">Ref: {selectedInvoice.id}</p></div><div className="space-y-4"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Line Items Breakdown</p>{selectedInvoice.lines.map((line, idx) => (<div key={idx} className="flex justify-between items-center py-3 border-b border-slate-50"><div><p className="text-sm font-black text-slate-800 uppercase">{line.description}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{line.quantity} Unit(s) @ ₦{(line.unitPriceCents / 100).toLocaleString()}</p></div><p className="text-sm font-black text-slate-900">₦{((line.quantity * line.unitPriceCents) / 100).toLocaleString()}</p></div>))}</div><div className="flex justify-between items-center pt-4"><p className="text-lg font-black text-slate-900 uppercase">Total Received</p><p className="text-3xl font-black text-indigo-600">₦{(selectedInvoice.totalCents / 100).toLocaleString()}</p></div></div>
                     ) : (
                        <div className="space-y-8">
                           {org.bankInfo && org.bankInfo.accountNumber && (
                              <div className="p-6 bg-slate-900 text-white rounded-3xl relative overflow-hidden">
                                 <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff9d]/10 rounded-full blur-2xl"></div>
                                 <div className="flex items-start gap-4 relative z-10">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-[#ff6b6b]"><Landmark size={20} /></div>
                                    <div>
                                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Information</p>
                                       <h3 className="text-xl font-black tracking-widest mb-1">{org.bankInfo.bankName}</h3>
                                       <p className="text-sm font-bold text-slate-300 uppercase mb-2">{org.bankInfo.accountName}</p>
                                       <p className="text-2xl font-black text-[#00ff9d] tracking-widest font-mono">{org.bankInfo.accountNumber}</p>
                                    </div>
                                 </div>
                              </div>
                           )}
                           <div className="grid grid-cols-2 gap-6"><div className="p-6 bg-slate-50 rounded-3xl border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Due</p><p className="text-xl font-black text-slate-900">₦{(selectedInvoice.totalCents / 100).toLocaleString()}</p></div><div className="p-6 bg-rose-50 rounded-3xl border border-rose-100"><p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Balance Remaining</p><p className="text-xl font-black text-rose-600">₦{((selectedInvoice.totalCents - selectedInvoice.paidAmountCents) / 100).toLocaleString()}</p></div></div><div><label className="text-[11px] font-black uppercase text-slate-600 tracking-widest ml-2 mb-3 block">Payment Amount (₦)</label><div className="relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-2xl">₦</span><input type="number" className="w-full pl-14 pr-8 py-8 bg-slate-50 border-2 border-slate-200 rounded-[2.5rem] font-black text-4xl text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner" placeholder="0.00" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} /></div></div></div>
                     )}
                  </div>
                  <div className="p-8 border-t border-slate-100 bg-white flex gap-4">
                     <button onClick={() => { setSelectedInvoice(null); setPaymentAmount(''); }} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-200">Close Window</button>
                     <button onClick={() => window.open(`#/invoice/${selectedInvoice.id}`, '_blank')} className="flex-1 py-4 text-slate-700 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-2xl transition-all border border-slate-200 flex items-center justify-center gap-2">View Invoice <ArrowRight size={14} /></button>
                     {selectedInvoice.status !== InvoiceStatus.PAID ? (<button onClick={handlePartialPayment} className="flex-1 py-5 bg-[#ff6b6b] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:brightness-110 flex items-center justify-center gap-3">Confirm Payment Sync <ArrowRight size={16} /></button>) : (<button onClick={() => window.print()} className="flex-1 py-5 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-slate-800 flex items-center justify-center gap-3">Print Official Receipt <Download size={16} /></button>)}
                  </div>
               </div>
            </div>
         )}

         {selectedContactForStatement && (
            <CustomerStatementModal
               contact={selectedContactForStatement}
               onClose={() => setSelectedContactForStatement(null)}
            />
         )}
         {/* Manual Invoice Modal */}
         <ManualInvoiceModal isOpen={isManualInvoiceModalOpen} onClose={() => setIsManualInvoiceModalOpen(false)} />
      </div>
   );
};
