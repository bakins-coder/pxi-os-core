
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useDataStore } from '../store/useDataStore';
import { User, Task, Role, Employee } from '../types';
import { processMeetingAudio } from '../services/ai';
import {
   Phone, Video, Search, Mic, MicOff,
   VideoOff, PhoneOff, Send, Paperclip, MessageSquare,
   Activity, X, Check, Bot, ListTodo, Sparkles, RefreshCw, ClipboardCheck, ArrowRight, ShieldCheck, Zap
} from 'lucide-react';

interface ChatMessage {
   id: string;
   senderId: string;
   text: string;
   timestamp: string;
}

const MeetingReportModal = ({ data, onSync, onClose }: { data: any, onSync: (tasks: any[]) => void, onClose: () => void }) => {
   const { settings } = useSettingsStore();
   const brandColor = settings.brandColor || '#00ff9d';
   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in zoom-in duration-300">
         <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div>
                  <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Meeting Summary</h2>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Automated Intelligence Report</p>
               </div>
               <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-[#00ff9d] shadow-lg animate-pulse"><Bot size={24} /></div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10">
               <section>
                  <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-4">Executive Summary</h3>
                  <p className="text-lg font-bold text-slate-700 leading-relaxed italic">"{data.summary}"</p>
               </section>

               <section>
                  <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-4">Key Decisions</h3>
                  <ul className="space-y-3">
                     {data.decisions.map((d: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                           <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                           <span className="text-sm font-bold text-emerald-900">{d}</span>
                        </li>
                     ))}
                  </ul>
               </section>

               <section>
                  <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] mb-4">Assigned Tasks</h3>
                  <div className="space-y-3">
                     {data.tasks.map((t: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-indigo-200 transition-all">
                           <div className="flex items-center gap-4">
                              <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all"><ListTodo size={16} /></div>
                              <span className="text-sm font-black text-slate-800 uppercase">{t.title}</span>
                           </div>
                           <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${t.priority === 'High' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>{t.priority}</span>
                        </div>
                     ))}
                  </div>
               </section>
            </div>

            <div className="p-10 border-t border-slate-100 bg-slate-50/50 flex gap-4">
               <button onClick={onClose} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 rounded-2xl transition-all">Discard</button>
               <button
                  onClick={() => onSync(data.tasks)}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                  style={{ backgroundColor: brandColor, color: '#020617' }}
               >
                  Authorize & Sync Workspace <ArrowRight size={14} />
               </button>
            </div>
         </div>
      </div>
   );
};

import { useSettingsStore } from '../store/useSettingsStore';

export const TeamCommunication = () => {
   const { employees, addMeetingTask } = useDataStore();
   const { user: currentUser } = useAuthStore();

   // Map employees to User objects for the chat UI
   const teamMembers = useMemo((): User[] => {
      return employees.map(emp => ({
         id: emp.id,
         name: `${emp.firstName} ${emp.lastName}`,
         email: emp.email,
         role: emp.role,
         avatar: emp.avatar,
         companyId: emp.companyId
      }));
   }, [employees]);

   const [selectedUser, setSelectedUser] = useState<User | null>(null);
   const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
   const [inputText, setInputText] = useState('');

   const [isCallActive, setIsCallActive] = useState(false);
   const [isScribeActive, setIsScribeActive] = useState(false);
   const [isProcessingScribe, setIsProcessingScribe] = useState(false);
   const [meetingReport, setMeetingReport] = useState<any>(null);
   const [isMuted, setIsMuted] = useState(false);
   const [isCameraOff, setIsCameraOff] = useState(false);

   const localVideoRef = useRef<HTMLVideoElement>(null);
   const streamRef = useRef<MediaStream | null>(null);
   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
   const audioChunksRef = useRef<Blob[]>([]);

   const handleSendMessage = (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!inputText.trim() || !selectedUser) return;
      const newMsg: ChatMessage = { id: Date.now().toString(), senderId: currentUser?.id || 'u1', text: inputText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setMessages(prev => ({ ...prev, [selectedUser.id]: [...(prev[selectedUser.id] || []), newMsg] }));
      setInputText('');
   };

   const startCall = async (type: 'audio' | 'video') => {
      setIsCallActive(true);
      try {
         const stream = await navigator.mediaDevices.getUserMedia({ video: type === 'video', audio: true });
         streamRef.current = stream;
         if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (err) { console.error("Media Error:", err); }
   };

   const endCall = () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      setIsCallActive(false);
      setIsScribeActive(false);
   };

   const toggleScribe = async () => {
      if (isScribeActive) {
         mediaRecorderRef.current?.stop();
         setIsScribeActive(false);
      } else {
         if (!streamRef.current) return;
         audioChunksRef.current = [];
         const recorder = new MediaRecorder(streamRef.current);
         mediaRecorderRef.current = recorder;
         recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
         recorder.onstop = async () => {
            setIsProcessingScribe(true);
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
               const base64Audio = (reader.result as string).split(',')[1];
               try {
                  const report = await processMeetingAudio(base64Audio, 'audio/webm');
                  setMeetingReport(report);
               } catch (e) {
                  console.error("Meeting Analysis Failed", e);
               } finally {
                  setIsProcessingScribe(false);
               }
            };
         };
         recorder.start();
         setIsScribeActive(true);
      }
   };

   const syncTasks = (tasks: any[]) => {
      tasks.forEach(t => {
         addMeetingTask({
            title: `[MEETING] ${t.title}`,
            description: 'Automatically extracted from meeting discussion.',
            priority: t.priority,
            status: 'Todo',
            dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
         });
      });
      setMeetingReport(null);
   };

   return (
      <div className="h-[calc(100vh-140px)] flex bg-[#020617] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl animate-in fade-in">
         {!isCallActive ? (
            <div className="flex-1 flex flex-col md:flex-row">
               <div className="w-full md:w-80 border-r border-white/5 flex flex-col">
                  <div className="p-8 border-b border-white/5">
                     <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">Channels</h2>
                     <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-xs font-bold uppercase tracking-widest text-slate-300 outline-none focus:border-[#00ff9d]" placeholder="Search staff..." />
                     </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                     {teamMembers.map(member => (
                        <button
                           key={member.id}
                           onClick={() => setSelectedUser(member)}
                           className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${selectedUser?.id === member.id ? 'bg-[#00ff9d] text-slate-950 shadow-lg scale-[1.02]' : 'hover:bg-white/5 text-slate-400'}`}
                        >
                           <img src={member.avatar} className="w-10 h-10 rounded-xl bg-slate-800" alt="avatar" />
                           <div className="text-left">
                              <div className="text-xs font-black uppercase tracking-tight">{member.name}</div>
                              <div className={`text-[9px] font-bold uppercase opacity-60`}>{member.role}</div>
                           </div>
                        </button>
                     ))}
                  </div>
               </div>

               <div className="flex-1 flex flex-col bg-[#020617]">
                  {selectedUser ? (
                     <>
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-[#00ff9d] flex items-center justify-center text-slate-950 shadow-lg animate-pulse"><Activity size={24} /></div>
                              <div>
                                 <h3 className="text-lg font-black text-white uppercase tracking-tight">{selectedUser.name}</h3>
                                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Secure Connection</p>
                              </div>
                           </div>
                           <div className="flex gap-2">
                              <button onClick={() => startCall('audio')} className="p-4 bg-white/5 rounded-2xl text-slate-400 hover:bg-[#00ff9d] hover:text-slate-950 transition-all"><Phone size={20} /></button>
                              <button onClick={() => startCall('video')} className="p-4 bg-[#00ff9d] rounded-2xl text-slate-950 shadow-xl active:scale-95 transition-all"><Video size={20} /></button>
                           </div>
                        </div>
                        <div className="flex-1 p-8 overflow-y-auto flex flex-col justify-center items-center text-slate-600 opacity-20">
                           <MessageSquare size={64} className="mb-4" />
                           <p className="font-black uppercase tracking-[0.3em] text-xs">Start Direct Message</p>
                        </div>
                        <form onSubmit={handleSendMessage} className="p-8 border-t border-white/5 flex gap-4 bg-white/[0.01]">
                           <button type="button" className="p-4 text-slate-500 hover:text-white transition-colors"><Paperclip size={20} /></button>
                           <input
                              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-[#00ff9d] transition-all"
                              placeholder="Enter message..."
                              value={inputText}
                              onChange={(e) => setInputText(e.target.value)}
                           />
                           <button type="submit" className="p-4 bg-[#00ff9d] rounded-2xl text-slate-950 shadow-xl active:scale-95 transition-all"><Send size={20} /></button>
                        </form>
                     </>
                  ) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                        <Activity size={80} className="mb-8 opacity-10 animate-pulse" />
                        <p className="font-black uppercase tracking-[0.5em] text-xs">Select a contact</p>
                     </div>
                  )}
               </div>
            </div>
         ) : (
            <div className="flex-1 flex flex-col relative bg-slate-950">
               {isProcessingScribe && (
                  <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex flex-col items-center justify-center text-white">
                     <RefreshCw className="animate-spin text-[#00ff9d] mb-6" size={48} />
                     <h3 className="text-2xl font-black uppercase tracking-tighter">Analyzing Discussion...</h3>
                     <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mt-2">Generating Intelligent Summary</p>
                  </div>
               )}

               <div className="flex-1 flex items-center justify-center p-10 relative">
                  <video ref={localVideoRef} autoPlay playsInline muted={isMuted} className="w-full max-w-4xl h-full max-h-[600px] rounded-[4rem] object-cover border border-white/10 shadow-[0_0_100px_rgba(0,255,157,0.15)]" />

                  {isScribeActive && (
                     <div className="absolute top-20 right-20 bg-indigo-600/90 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-3 text-white border border-indigo-400/30 animate-in slide-in-from-right-4 shadow-2xl">
                        <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Summary Active</span>
                     </div>
                  )}
               </div>

               <div className="p-8 flex justify-center gap-4 absolute bottom-10 left-0 w-full z-20">
                  <button onClick={() => setIsMuted(!isMuted)} className={`p-6 rounded-3xl transition-all shadow-xl ${isMuted ? 'bg-rose-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}><Mic size={24} /></button>
                  <button onClick={() => setIsCameraOff(!isCameraOff)} className={`p-6 rounded-3xl transition-all shadow-xl ${isCameraOff ? 'bg-rose-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}><Video size={24} /></button>

                  <button
                     onClick={toggleScribe}
                     className={`p-6 rounded-3xl transition-all shadow-xl flex items-center gap-3 px-8 ${isScribeActive ? 'bg-indigo-600 text-white ring-4 ring-indigo-600/30' : 'bg-[#00ff9d] text-slate-950 hover:scale-105 active:scale-95'}`}
                  >
                     {isScribeActive ? <RefreshCw className="animate-spin" size={24} /> : <Sparkles size={24} />}
                     <span className="font-black uppercase text-xs tracking-widest">{isScribeActive ? 'Stop Summary' : 'Create Summary'}</span>
                  </button>

                  <button onClick={endCall} className="p-6 bg-rose-600 rounded-3xl text-white shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center gap-3 px-10">
                     <PhoneOff size={24} /> <span className="font-black uppercase text-xs tracking-widest">End Call</span>
                  </button>
               </div>
            </div>
         )}

         {meetingReport && (
            <MeetingReportModal
               data={meetingReport}
               onSync={syncTasks}
               onClose={() => setMeetingReport(null)}
            />
         )}
      </div>
   );
};
