
import React, { useState, useRef, useEffect } from 'react';
import { nexusStore } from '../services/nexusStore';
import { Ticket, Attachment, BankTransaction } from '../types';
import { 
    MessageSquare, Send, X, 
    Paperclip, ArrowUpRight, ArrowDownLeft, Receipt, 
    MoreHorizontal, Mic, ShieldCheck, ChevronRight, Image as ImageIcon, Film, UploadCloud
} from 'lucide-react';
import { runBankingChat } from '../services/ai';

export const CustomerPortal = () => {
  const currentUser = nexusStore.currentUser;
  const [balance, setBalance] = useState(nexusStore.getCustomerBalance());
  const [transactions, setTransactions] = useState<BankTransaction[]>(nexusStore.getCustomerTransactions());
  const [myTickets, setMyTickets] = useState(nexusStore.tickets.filter(t => t.contactId === currentUser?.id));
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'model', parts: {text: string}[]}[]>([
      {role: 'model', parts: [{text: 'Welcome! I am your AI concierge. How can I assist you today?'}]}
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const unsubscribe = nexusStore.subscribe(() => {
       setBalance(nexusStore.getCustomerBalance());
       setTransactions([...nexusStore.getCustomerTransactions()]);
       setMyTickets(nexusStore.tickets.filter(t => t.contactId === currentUser?.id));
    });
    return unsubscribe;
  }, []);

  const handleSendMessage = async () => {
      if (!chatInput.trim()) return;
      const userMsg = { role: 'user' as const, parts: [{ text: chatInput }] };
      setChatMessages(prev => [...prev, userMsg]);
      setChatInput('');
      setIsProcessing(true);
      
      try {
         const response = await runBankingChat(chatMessages.map(m => ({ role: m.role, parts: m.parts })), chatInput);
         setChatMessages(prev => [...prev, { role: 'model', parts: [{ text: response }] }]);
      } catch(e) {
         setChatMessages(prev => [...prev, {role: 'model', parts: [{text: "Connection failure to neural bridge."}]}]);
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
                   <img src={currentUser.avatar} className="w-10 h-10 rounded-full border-2 border-white/20" alt="avatar"/>
                   <div>
                      <p className="text-indigo-200 text-xs uppercase tracking-wider font-bold">Session Active</p>
                      <h2 className="text-lg font-bold">{currentUser.name}</h2>
                   </div>
                </div>
             </div>

             <div className="text-center mb-6">
                 <p className="text-indigo-300 text-sm mb-1">Total Available Balance</p>
                 <h1 className="text-4xl font-bold tracking-tight">₦{balance.toLocaleString()}</h1>
             </div>

             <div className="flex justify-between px-4 pb-2">
                 <div className="text-center">
                    <div className="bg-indigo-500/30 p-3 rounded-full mb-2 mx-auto w-12 h-12 flex items-center justify-center backdrop-blur-sm border border-white/10"><ArrowUpRight size={20}/></div>
                    <span className="text-xs text-indigo-100">Send</span>
                 </div>
                 <div className="text-center">
                    <div className="bg-indigo-500/30 p-3 rounded-full mb-2 mx-auto w-12 h-12 flex items-center justify-center backdrop-blur-sm border border-white/10"><Receipt size={20}/></div>
                    <span className="text-xs text-indigo-100">Pay</span>
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
             <ChevronRight className="text-slate-300"/>
          </button>
       </div>

       <div className="px-6 py-6">
          <h3 className="font-bold text-slate-800 mb-4">Transaction History</h3>
          <div className="space-y-4">
             {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><Receipt size={18}/></div>
                      <div><h4 className="font-bold text-sm text-slate-800">{tx.description}</h4><p className="text-xs text-slate-400">{tx.date}</p></div>
                   </div>
                   <div className={`font-bold text-sm ${tx.type === 'Credit' ? 'text-green-600' : 'text-slate-800'}`}>₦{(tx.amountCents / 100).toLocaleString()}</div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};
