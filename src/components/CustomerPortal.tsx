
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useDataStore } from '../store/useDataStore';
import { Ticket, Attachment, BankTransaction, InvoiceStatus } from '../types';
import ReactMarkdown from 'react-markdown';
import {
   MessageSquare, Send, X,
   Paperclip, ArrowUpRight, ArrowDownLeft, Receipt,
   MoreHorizontal, Mic, ShieldCheck, ChevronRight, Image as ImageIcon, Film, UploadCloud, CalendarDays
} from 'lucide-react';
import { runBankingChat } from '../services/ai';

export const CustomerPortal = () => {
   const { user: currentUser } = useAuthStore();
   const { tickets, bankTransactions, invoices } = useDataStore();

   const customerBalance = useMemo(() => {
      if (!currentUser) return 0;
      // Calculate from unpaid invoices
      const unpaidAmt = invoices
         .filter(inv => inv.contactId === currentUser.id && inv.type === 'Sales')
         .reduce((sum, inv) => sum + (inv.totalCents - inv.paidAmountCents), 0);
      return unpaidAmt / 100;
   }, [invoices, currentUser]);

   const customerTransactions = useMemo(() => {
      if (!currentUser) return [];
      return bankTransactions.filter(tx => tx.contactId === currentUser.id);
   }, [bankTransactions, currentUser]);

   const myTickets = useMemo(() => {
      if (!currentUser) return [];
      return tickets.filter(t => t.contactId === currentUser.id);
   }, [tickets, currentUser]);

   const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
   const [isChatOpen, setIsChatOpen] = useState(false);
   const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
      { role: 'model', text: 'Welcome! I am your AI concierge. How can I assist you today?' }
   ]);
   const [chatInput, setChatInput] = useState('');
   const [isProcessing, setIsProcessing] = useState(false);
   const scrollRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      if (isChatOpen) {
         scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
   }, [chatMessages, isChatOpen]);

   const handleSendMessage = async () => {
      if (!chatInput.trim()) return;
      const userMsg = { role: 'user' as const, text: chatInput };
      setChatMessages(prev => [...prev, userMsg]);
      setChatInput('');
      setIsProcessing(true);

      try {
         const response = await runBankingChat(chatMessages.map(m => ({ role: m.role, parts: [{ text: m.text }] })), chatInput);
         setChatMessages(prev => [...prev, { role: 'model', text: response }]);
      } catch (e) {
         setChatMessages(prev => [...prev, { role: 'model', text: "Connection failure to neural bridge." }]);
      } finally {
         setIsProcessing(false);
      }
   };

   if (!currentUser) return null;

   return (
      <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-20 relative font-sans">
         <div className="bg-slate-900 text-white p-6 pt-8 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
            <div className="relative z-10">
               <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                     <img src={currentUser.avatar} className="w-10 h-10 rounded-full border-2 border-white/20" alt="avatar" />
                     <div>
                        <p className="text-indigo-200 text-xs uppercase tracking-wider font-bold">Session Active</p>
                        <h2 className="text-lg font-bold">{currentUser.name}</h2>
                     </div>
                  </div>
               </div>

               <div className="text-center mb-6">
                  <p className="text-indigo-300 text-sm mb-1">Outstanding Balance</p>
                  <h1 className="text-4xl font-bold tracking-tight">₦{customerBalance.toLocaleString()}</h1>
               </div>

               <div className="flex justify-between px-4 pb-2">
                  <div className="text-center">
                     <div className="bg-indigo-500/30 p-3 rounded-full mb-2 mx-auto w-12 h-12 flex items-center justify-center backdrop-blur-sm border border-white/10"><ArrowUpRight size={20} /></div>
                     <span className="text-xs text-indigo-100">Send</span>
                  </div>
                  <div className="text-center">
                     <div className="bg-indigo-500/30 p-3 rounded-full mb-2 mx-auto w-12 h-12 flex items-center justify-center backdrop-blur-sm border border-white/10"><Receipt size={20} /></div>
                     <span className="text-xs text-indigo-100">Pay</span>
                  </div>
                  <div onClick={() => window.location.hash = '/brochure'} className="text-center cursor-pointer hover:scale-105 transition-transform">
                     <div className="bg-amber-500/30 p-3 rounded-full mb-2 mx-auto w-12 h-12 flex items-center justify-center backdrop-blur-sm border border-white/10"><CalendarDays size={20} className="text-amber-200" /></div>
                     <span className="text-xs text-indigo-100">Plan</span>
                  </div>
               </div>
            </div>
         </div>

         <div className="px-6 -mt-6 relative z-20">
            <button onClick={() => setIsChatOpen(true)} className="w-full bg-white p-4 rounded-2xl shadow-lg border border-slate-100 flex items-center justify-between group hover:shadow-xl transition-all">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#00ff9d] rounded-xl flex items-center justify-center text-slate-950 shadow-md transition-transform group-hover:scale-110"><Mic size={24} /></div>
                  <div className="text-left"><h3 className="font-bold text-slate-800">AI Concierge</h3><p className="text-xs text-slate-500">Secure link established...</p></div>
               </div>
               <ChevronRight className="text-slate-300" />
            </button>
         </div>

         <div className="px-6 py-6">
            <h3 className="font-bold text-slate-800 mb-4">Transaction History</h3>
            <div className="space-y-4">
               {customerTransactions.length > 0 ? customerTransactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><Receipt size={18} /></div>
                        <div><h4 className="font-bold text-sm text-slate-800">{tx.description}</h4><p className="text-xs text-slate-400">{tx.date}</p></div>
                     </div>
                     <div className={`font-bold text-sm ${tx.type === 'Credit' ? 'text-green-600' : 'text-slate-800'}`}>₦{(tx.amountCents / 100).toLocaleString()}</div>
                  </div>
               )) : (
                  <p className="text-xs text-slate-400 text-center py-10 italic">No recent transactions found.</p>
               )}
            </div>
         </div>

         {isChatOpen && (
            <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom-5">
               <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-[#00ff9d] rounded-xl flex items-center justify-center text-slate-950 shadow-lg">
                        <ShieldCheck size={24} />
                     </div>
                     <div>
                        <h3 className="font-bold">AI Concierge</h3>
                        <p className="text-[10px] uppercase font-black tracking-widest text-[#00ff9d]">Secure Neural Link</p>
                     </div>
                  </div>
                  <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                     <X size={24} />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                  {chatMessages.map((msg, i) => (
                     <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-br-none' : 'bg-white text-slate-700 rounded-bl-none border border-slate-100'}`}>
                           {msg.role === 'model' ? (
                              <div className="prose prose-slate prose-sm max-w-none">
                                 <ReactMarkdown>{msg.text}</ReactMarkdown>
                              </div>
                           ) : msg.text}
                        </div>
                     </div>
                  ))}
                  {isProcessing && (
                     <div className="flex justify-start">
                        <div className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-2">
                           <div className="w-1.5 h-1.5 bg-[#00ff9d] rounded-full animate-bounce"></div>
                           <div className="w-1.5 h-1.5 bg-[#00ff9d] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                           <div className="w-1.5 h-1.5 bg-[#00ff9d] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                     </div>
                  )}
                  <div ref={scrollRef} />
               </div>

               <div className="p-6 border-t border-slate-100 bg-white">
                  <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
                     <input
                        className="flex-1 bg-transparent font-bold text-slate-700 outline-none"
                        placeholder="Enter instruction..."
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                     />
                     <button onClick={handleSendMessage} className="text-slate-950 hover:text-indigo-600 transition-colors">
                        <Send size={20} />
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};