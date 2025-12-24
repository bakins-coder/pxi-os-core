
import React, { useState, useRef, useEffect } from 'react';
import { db, BankTransaction } from '../services/mockDb';
import { Ticket, Attachment } from '../types';
import { 
    Phone, Clock, CheckCircle2, AlertCircle, Plus, MessageSquare, Send, X, 
    Paperclip, CreditCard, Wallet, ArrowUpRight, ArrowDownLeft, Receipt, 
    MoreHorizontal, Mic, ShieldCheck, ChevronRight, Image as ImageIcon, Film, UploadCloud, Trash2
} from 'lucide-react';
import { runBankingChat, textToSpeech } from '../services/ai';

export const CustomerPortal = () => {
  const currentUser = db.currentUser;
  
  // Banking State
  const [balance, setBalance] = useState(db.getCustomerBalance());
  const [transactions, setTransactions] = useState<BankTransaction[]>(db.getCustomerTransactions());
  
  // Support State
  const [myTickets, setMyTickets] = useState(db.tickets.filter(t => t.contactId === currentUser.id));
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState<{subject: string; description: string; priority: 'Low'|'Medium'|'High'|'Critical'; attachments: Attachment[]}>({
     subject: '',
     description: '',
     priority: 'Medium',
     attachments: []
  });

  // AI Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'model', parts: {text: string, inlineData?: {mimeType: string, data: string}}[]}[]>([
      {role: 'model', parts: [{text: 'Welcome to Unified Bank! I am your AI concierge. I can help you check balances, transfer funds, or solve issues. How can I help?'}]}
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatAttachments, setChatAttachments] = useState<Attachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Refs
  const ticketFileInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'ticket' | 'chat') => {
    if (e.target.files && e.target.files.length > 0) {
       Array.from(e.target.files).forEach((file: File) => {
          const reader = new FileReader();
          reader.onload = (event) => {
             const base64 = event.target?.result as string;
             const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document';
             const attachment: Attachment = {
                id: `att-${Date.now()}-${Math.random()}`,
                type: type,
                url: base64,
                name: file.name
             };
             
             if (target === 'ticket') {
                setNewTicket(prev => ({ ...prev, attachments: [...prev.attachments, attachment] }));
             } else {
                setChatAttachments(prev => [...prev, attachment]);
             }
          };
          reader.readAsDataURL(file);
       });
    }
  };

  const createTicket = (e: React.FormEvent) => {
     e.preventDefault();
     db.createNewTicket(newTicket.subject, newTicket.description, newTicket.attachments);
     setMyTickets(db.tickets.filter(t => t.contactId === currentUser.id));
     setIsTicketModalOpen(false);
     setNewTicket({ subject: '', description: '', priority: 'Medium', attachments: [] });
  };

  // Handle AI Message
  const handleSendMessage = async () => {
      if (!chatInput.trim() && chatAttachments.length === 0) return;
      
      const userParts: {text: string, inlineData?: {mimeType: string, data: string}}[] = [{ text: chatInput }];
      
      // Add attachments to message for display (and potentially model consumption)
      chatAttachments.forEach(att => {
         // Extract base64 content
         const base64Content = att.url.split(',')[1];
         // For demo, we are just storing it in the chat history state
         // In a real app, we would pass this to the model if it supports vision
         // Adding a text representation for the mock AI
         userParts.push({ text: `[Attached ${att.type}: ${att.name}]` });
      });

      const userMsg = { role: 'user' as const, parts: userParts };
      setChatMessages(prev => [...prev, userMsg]);
      setChatInput('');
      setChatAttachments([]);
      setIsProcessing(true);
      
      try {
         // Use the specialized Banking Agent function
         const aiResponseText = await runBankingChat(chatMessages.map(m => ({ role: m.role, parts: m.parts.map(p => ({text: p.text})) })), chatInput);
         
         const modelMsg = { role: 'model' as const, parts: [{ text: aiResponseText }] };
         setChatMessages(prev => [...prev, modelMsg]);

         // Update UI Data (in case AI performed actions like Transfer)
         setBalance(db.getCustomerBalance());
         setTransactions([...db.getCustomerTransactions()]);
         setMyTickets(db.tickets.filter(t => t.contactId === currentUser.id));

      } catch(e) {
         setChatMessages(prev => [...prev, {role: 'model', parts: [{text: "I'm sorry, I'm having trouble connecting to the banking core right now."}]}]);
      } finally {
         setIsProcessing(false);
      }
  };

  const QuickAction = ({ icon: Icon, label, onClick, color }: any) => (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105 active:scale-95 ${color}`}>
            <Icon size={24} />
        </div>
        <span className="text-xs font-semibold text-slate-600">{label}</span>
    </button>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-20 relative font-sans">
       
       {/* Top Banking Header */}
       <div className="bg-slate-900 text-white p-6 pt-8 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
          <div className="relative z-10">
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                   <img src={currentUser.avatar} className="w-10 h-10 rounded-full border-2 border-white/20"/>
                   <div>
                      <p className="text-indigo-200 text-xs uppercase tracking-wider font-bold">Good Morning</p>
                      <h2 className="text-lg font-bold">{currentUser.name.split(' ')[0]}</h2>
                   </div>
                </div>
                <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                   <MessageSquare size={20} className="text-white"/>
                </button>
             </div>

             {/* Balance Card */}
             <div className="text-center mb-6">
                 <p className="text-indigo-300 text-sm mb-1">Total Available Balance</p>
                 <h1 className="text-4xl font-bold tracking-tight">₦{balance.toLocaleString()}</h1>
             </div>

             {/* Action Grid */}
             <div className="flex justify-between px-4 pb-2">
                 <div className="text-center">
                    <div className="bg-indigo-500/30 p-3 rounded-full mb-2 mx-auto w-12 h-12 flex items-center justify-center backdrop-blur-sm border border-white/10">
                        <ArrowUpRight size={20}/>
                    </div>
                    <span className="text-xs text-indigo-100">Send</span>
                 </div>
                 <div className="text-center">
                    <div className="bg-indigo-500/30 p-3 rounded-full mb-2 mx-auto w-12 h-12 flex items-center justify-center backdrop-blur-sm border border-white/10">
                        <Receipt size={20}/>
                    </div>
                    <span className="text-xs text-indigo-100">Pay</span>
                 </div>
                 <div className="text-center">
                    <div className="bg-indigo-500/30 p-3 rounded-full mb-2 mx-auto w-12 h-12 flex items-center justify-center backdrop-blur-sm border border-white/10">
                        <ArrowDownLeft size={20}/>
                    </div>
                    <span className="text-xs text-indigo-100">Top-up</span>
                 </div>
                 <div className="text-center">
                    <div className="bg-indigo-500/30 p-3 rounded-full mb-2 mx-auto w-12 h-12 flex items-center justify-center backdrop-blur-sm border border-white/10">
                        <MoreHorizontal size={20}/>
                    </div>
                    <span className="text-xs text-indigo-100">More</span>
                 </div>
             </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-indigo-600/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-20px] left-[-20px] w-48 h-48 bg-purple-600/20 rounded-full blur-2xl"></div>
       </div>

       {/* Floating AI Agent Button */}
       <div className="px-6 -mt-6 relative z-20">
          <button 
             onClick={() => setIsChatOpen(true)}
             className="w-full bg-white p-4 rounded-2xl shadow-lg border border-slate-100 flex items-center justify-between group hover:shadow-xl transition-all"
          >
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                   <Mic size={24} />
                </div>
                <div className="text-left">
                   <h3 className="font-bold text-slate-800">Banking Assistant</h3>
                   <p className="text-xs text-slate-500">Tap to speak or type...</p>
                </div>
             </div>
             <ChevronRight className="text-slate-300"/>
          </button>
       </div>

       {/* Transactions List */}
       <div className="px-6 py-6">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-slate-800">Recent Transactions</h3>
             <button className="text-xs text-indigo-600 font-bold">View All</button>
          </div>
          
          <div className="space-y-4">
             {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                   <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.category === 'Transfer' ? 'bg-orange-100 text-orange-600' :
                          tx.category === 'Deposit' ? 'bg-green-100 text-green-600' :
                          'bg-blue-100 text-blue-600'
                      }`}>
                          {tx.category === 'Transfer' ? <ArrowUpRight size={18}/> : 
                           tx.category === 'Deposit' ? <ArrowDownLeft size={18}/> :
                           <Receipt size={18}/>}
                      </div>
                      <div>
                         <h4 className="font-bold text-sm text-slate-800">{tx.description}</h4>
                         <p className="text-xs text-slate-400">{tx.category} • {tx.date}</p>
                      </div>
                   </div>
                   <div className={`font-bold text-sm ${tx.type === 'Credit' ? 'text-green-600' : 'text-slate-800'}`}>
                      {tx.type === 'Credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                   </div>
                </div>
             ))}
          </div>
       </div>

       {/* Active Support Tickets */}
       <div className="px-6 pb-6">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-slate-800">Support Tickets</h3>
             <button 
               onClick={() => setIsTicketModalOpen(true)}
               className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-lg transition-colors"
             >
                <Plus size={18}/>
             </button>
          </div>
          <div className="space-y-3">
             {myTickets.length === 0 ? (
                <div className="text-center p-6 bg-white rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
                   No active issues. Need help? 
                   <button onClick={() => setIsTicketModalOpen(true)} className="text-indigo-600 font-bold ml-1 hover:underline">Create a Ticket</button>
                </div>
             ) : (
                myTickets.map(ticket => (
                   <div key={ticket.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                         <span className="font-bold text-xs text-indigo-600">{ticket.ticketNumber}</span>
                         <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                             ticket.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                         }`}>{ticket.status}</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 mb-1">{ticket.subject}</h4>
                      {ticket.attachments && ticket.attachments.length > 0 && (
                         <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                             <Paperclip size={12}/> {ticket.attachments.length} attachment(s)
                         </div>
                      )}
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
                         <div className="h-full bg-indigo-500" style={{ width: `${ticket.progress}%` }}></div>
                      </div>
                   </div>
                ))
             )}
          </div>
       </div>

       {/* --- Create Ticket Modal --- */}
       {isTicketModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
             <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                   <h3 className="font-bold text-slate-800">Contact Support</h3>
                   <button onClick={() => setIsTicketModalOpen(false)}><X size={20} className="text-slate-400"/></button>
                </div>
                
                <form onSubmit={createTicket} className="p-6 overflow-y-auto space-y-4">
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                      <input 
                         required
                         className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                         placeholder="e.g. Transaction failed..."
                         value={newTicket.subject}
                         onChange={e => setNewTicket({...newTicket, subject: e.target.value})}
                      />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                         <select 
                            className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white"
                            value={newTicket.priority}
                            onChange={e => setNewTicket({...newTicket, priority: e.target.value as any})}
                         >
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                            <option>Critical</option>
                         </select>
                      </div>
                   </div>

                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                      <textarea 
                         className="w-full border border-slate-200 rounded-lg p-2.5 text-sm h-24 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                         placeholder="Describe your issue..."
                         value={newTicket.description}
                         onChange={e => setNewTicket({...newTicket, description: e.target.value})}
                      />
                   </div>

                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Attachments (Photo/Video)</label>
                      
                      <div className="flex gap-2 mb-3 flex-wrap">
                         {newTicket.attachments.map((att, i) => (
                            <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 group">
                               {att.type === 'image' ? (
                                  <img src={att.url} className="w-full h-full object-cover"/>
                               ) : (
                                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-500"><Film size={20}/></div>
                               )}
                               <button 
                                  type="button"
                                  onClick={() => setNewTicket(prev => ({...prev, attachments: prev.attachments.filter((_, idx) => idx !== i)}))}
                                  className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                               >
                                  <X size={12}/>
                               </button>
                            </div>
                         ))}
                         
                         <button 
                            type="button"
                            onClick={() => ticketFileInputRef.current?.click()}
                            className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
                         >
                            <UploadCloud size={20}/>
                            <span className="text-[9px] mt-1">Upload</span>
                         </button>
                         <input 
                            type="file" 
                            ref={ticketFileInputRef} 
                            className="hidden" 
                            accept="image/*,video/*" 
                            multiple 
                            onChange={(e) => handleFileUpload(e, 'ticket')}
                         />
                      </div>
                   </div>

                   <button 
                      type="submit"
                      className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                   >
                      Submit Ticket
                   </button>
                </form>
             </div>
          </div>
       )}

       {/* --- AI Chat Interface Modal --- */}
       {isChatOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex flex-col animate-in slide-in-from-bottom duration-300">
             
             {/* Chat Header */}
             <div className="bg-white p-4 pt-12 pb-4 shadow-sm flex justify-between items-center">
                 <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                         <Mic size={20} />
                     </div>
                     <div>
                         <h3 className="font-bold text-slate-800">Banking Assistant</h3>
                         <div className="flex items-center gap-1.5">
                             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                             <span className="text-xs text-slate-500">Secure & Online</span>
                         </div>
                     </div>
                 </div>
                 <button onClick={() => setIsChatOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                     <X size={20}/>
                 </button>
             </div>

             {/* Chat Messages */}
             <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-6">
                 {chatMessages.map((msg, idx) => (
                     <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                         <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                             msg.role === 'user' 
                                 ? 'bg-indigo-600 text-white rounded-br-none' 
                                 : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                         }`}>
                             {msg.parts.map((part, pIdx) => (
                                 <div key={pIdx}>
                                     {part.text}
                                     {/* This is a visual representation for demo purposes */}
                                     {part.text.startsWith('[Attached') && <Paperclip size={14} className="inline ml-1"/>}
                                 </div>
                             ))}
                         </div>
                     </div>
                 ))}
                 {isProcessing && (
                     <div className="flex justify-start">
                         <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-bl-none shadow-sm flex gap-1">
                             <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                             <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                             <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                         </div>
                     </div>
                 )}
                 <div ref={chatEndRef} />
             </div>

             {/* Chat Input & File Upload */}
             <div className="p-4 bg-white border-t border-slate-100 pb-8">
                 {chatAttachments.length > 0 && (
                    <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                       {chatAttachments.map((att, i) => (
                          <div key={i} className="relative w-12 h-12 rounded overflow-hidden border border-slate-200 flex-shrink-0">
                             {att.type === 'image' ? (
                                <img src={att.url} className="w-full h-full object-cover"/>
                             ) : (
                                <div className="w-full h-full bg-slate-100 flex items-center justify-center"><Film size={16} className="text-slate-400"/></div>
                             )}
                             <button 
                                onClick={() => setChatAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                className="absolute top-0 right-0 bg-black/50 text-white p-0.5"
                             >
                                <X size={10}/>
                             </button>
                          </div>
                       ))}
                    </div>
                 )}

                 <div className="bg-slate-50 border border-slate-200 rounded-2xl px-2 py-2 flex items-center gap-2 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                     <button 
                        onClick={() => chatFileInputRef.current?.click()}
                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                     >
                         <Paperclip size={20}/>
                     </button>
                     <input 
                        type="file"
                        ref={chatFileInputRef}
                        className="hidden"
                        accept="image/*,video/*"
                        multiple
                        onChange={(e) => handleFileUpload(e, 'chat')}
                     />
                     
                     <input 
                         className="flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
                         placeholder="Type or upload..."
                         value={chatInput}
                         onChange={e => setChatInput(e.target.value)}
                         onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                         autoFocus
                     />
                     <button 
                        onClick={handleSendMessage}
                        disabled={(!chatInput.trim() && chatAttachments.length === 0) || isProcessing}
                        className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:shadow-none"
                     >
                         <Send size={18}/>
                     </button>
                 </div>
                 <p className="text-center text-[10px] text-slate-400 mt-3 flex items-center justify-center gap-1">
                     <ShieldCheck size={12}/> 
                     Unified AI Banking is end-to-end encrypted.
                 </p>
             </div>
          </div>
       )}

    </div>
  );
};
