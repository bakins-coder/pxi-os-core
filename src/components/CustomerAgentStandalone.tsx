
import React, { useState, useRef, useEffect } from 'react';
import { useDataStore } from '../store/useDataStore';
import { processAgentRequest } from '../services/ai';
import { 
   MessageCircle, Send, X, Bot, Sparkles, User, 
   ShieldCheck, ChevronRight, Mic, Globe, Info, 
   CheckCircle2, Clock
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
   id: string;
   text: string;
   sender: 'customer' | 'agent';
   timestamp: number;
}

export const CustomerAgentStandalone = ({ organizationName = "Xquisite Catering" }) => {
   const [messages, setMessages] = useState<Message[]>([
      { 
         id: '1', 
         text: `Hello! Welcome to ${organizationName}. I'm your digital concierge. How can I assist you today?`, 
         sender: 'agent',
         timestamp: Date.now()
      }
   ]);
   const [input, setInput] = useState('');
   const [isTyping, setIsTyping] = useState(false);
   const messagesEndRef = useRef<HTMLDivElement>(null);

   const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
   };

   useEffect(() => {
      scrollToBottom();
   }, [messages, isTyping]);

   const handleSend = async () => {
      if (!input.trim()) return;

      const userMsg: Message = {
         id: Date.now().toString(),
         text: input,
         sender: 'customer',
         timestamp: Date.now()
      };

      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setIsTyping(true);

      try {
         // Use the AI service with customer-facing context
         const context = `User is a customer of ${organizationName}. Focus on support and lead generation.`;
         const response = await processAgentRequest(input, context, 'text');

         const agentMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: response.response,
            sender: 'agent',
            timestamp: Date.now()
         };

         setMessages(prev => [...prev, agentMsg]);
      } catch (error) {
         console.error("AI Error:", error);
         const errorMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: "I'm having a bit of trouble connecting to my service. Please try again in a moment.",
            sender: 'agent',
            timestamp: Date.now()
         };
         setMessages(prev => [...prev, errorMsg]);
      } finally {
         setIsTyping(false);
      }
   };

   return (
      <div className="flex flex-col h-full bg-slate-50 font-sans text-slate-900 border border-slate-200 overflow-hidden shadow-2xl rounded-[2.5rem] max-w-2xl mx-auto border-t-0 sm:border-t">
         {/* Premium Header */}
         <div className="bg-slate-950 p-6 text-white flex justify-between items-center relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff9d]/10 rounded-full blur-[60px] -mr-16 -mt-16"></div>
            <div className="flex items-center gap-4 relative z-10">
               <div className="w-12 h-12 bg-[#00ff9d] rounded-2xl flex items-center justify-center shadow-lg shadow-[#00ff9d]/20 animate-float">
                  <Bot size={28} className="text-slate-950" />
               </div>
               <div>
                  <h1 className="text-xl font-black tracking-tight leading-none mb-1 uppercase">{organizationName}</h1>
                  <div className="flex items-center gap-2">
                     <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Concierge Online</span>
                  </div>
               </div>
            </div>
            <div className="flex gap-2 relative z-10">
               <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5"><Globe size={18} /></button>
               <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5"><Mic size={18} /></button>
            </div>
         </div>

         {/* Chat Timeline */}
         <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin">
            {messages.map((msg, idx) => (
               <div key={msg.id} className={`flex flex-col ${msg.sender === 'customer' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-5 duration-500`}>
                  <div className={`flex items-center gap-2 mb-2 ${msg.sender === 'customer' ? 'flex-row-reverse' : ''}`}>
                     <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${msg.sender === 'customer' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                        {msg.sender === 'customer' ? <User size={12} /> : <Bot size={12} />}
                     </div>
                     <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        {msg.sender === 'customer' ? 'Guest' : 'Agent'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </span>
                  </div>
                  
                  <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm font-medium shadow-sm leading-relaxed border transition-all ${
                     msg.sender === 'customer' 
                        ? 'bg-slate-900 text-white rounded-tr-none border-slate-800' 
                        : 'bg-white text-slate-700 rounded-tl-none border-slate-100'
                  }`}>
                     {msg.sender === 'agent' ? (
                        <div className="prose prose-slate prose-sm max-w-none prose-p:mb-0">
                           <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                        </div>
                     ) : msg.text}
                  </div>
               </div>
            ))}
            {isTyping && (
               <div className="flex justify-start animate-in fade-in duration-300">
                  <div className="bg-white border border-slate-100 p-5 rounded-[2rem] rounded-tl-none shadow-sm flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-[#00ff9d] rounded-full animate-bounce"></span>
                     <span className="w-1.5 h-1.5 bg-[#00ff9d] rounded-full animate-bounce delay-100"></span>
                     <span className="w-1.5 h-1.5 bg-[#00ff9d] rounded-full animate-bounce delay-200"></span>
                  </div>
               </div>
            )}
            <div ref={messagesEndRef} />
         </div>

         {/* Context Cards (Lead Generation Nudges) */}
         <div className="px-8 flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            <button className="shrink-0 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-100 transition-all">Book Consultation</button>
            <button className="shrink-0 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-black uppercase text-emerald-600 hover:bg-emerald-100 transition-all">Download Brochure</button>
            <button className="shrink-0 px-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-[10px] font-black uppercase text-slate-600 hover:bg-slate-200 transition-all">Support Docs</button>
         </div>

         {/* Premium Input */}
         <div className="p-8 bg-white border-t border-slate-100 shrink-0">
            <div className="relative group">
               <input
                  className="w-full pl-6 pr-16 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.8rem] text-sm font-bold outline-none focus:border-[#00ff9d] focus:bg-white transition-all shadow-inner"
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
               />
               <button 
                  onClick={handleSend}
                  className="absolute right-2 top-2 bottom-2 w-12 bg-slate-950 text-[#00ff9d] rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-all hover:brightness-110"
               >
                  <Send size={18} />
               </button>
            </div>
            <div className="mt-4 flex justify-center items-center gap-2 opacity-30">
               <ShieldCheck size={12} />
               <p className="text-[9px] font-black uppercase tracking-widest">Secured by Paradigm-Xi Neural Guardrails</p>
            </div>
         </div>
      </div>
   );
};
