import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Minimize2, Sparkles, Mic, Square, Loader2, ShieldOff, Paperclip, Image as ImageIcon, FileText, Plus, History, Trash2, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useSettingsStore } from '../store/useSettingsStore';
import { useDataStore } from '../store/useDataStore';
import { generateAIResponse, getAIResponseForAudio, textToSpeech, processAgentRequest } from '../services/ai';
import { decodeBase64, decodeRawPcmToAudioBuffer } from '../services/audioUtils';


interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  hasAudio?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export const ChatWidget = () => {
  const strictMode = useSettingsStore(s => s.strictMode);
  const [isOpen, setIsOpen] = useState(false);

  // Session State
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('ai_chat_sessions');
    return saved ? JSON.parse(saved) : [{
      id: 'default',
      title: 'New Chat',
      messages: [{ id: '0', text: 'Hi! I can help you navigate or answer questions about your data.', sender: 'bot' }],
      createdAt: Date.now()
    }];
  });
  const [activeSessionId, setActiveSessionId] = useState<string>('default');
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    localStorage.setItem('ai_chat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachment, setAttachment] = useState<{ file: File; preview: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Derived state for active messages
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession.messages;

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-assistant', handleOpen);
    return () => window.removeEventListener('open-assistant', handleOpen);
  }, []);

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Chat',
      messages: [{ id: '0', text: 'Hi! How can I help you today?', sender: 'bot' }],
      createdAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setShowSidebar(false); // Auto close sidebar on mobile/small views if we implemented that logic
    if (window.innerWidth < 640) setShowSidebar(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    if (newSessions.length === 0) {
      // Always keep one
      setSessions([{
        id: 'default',
        title: 'New Chat',
        messages: [{ id: '0', text: 'Ready for a fresh start.', sender: 'bot' }],
        createdAt: Date.now()
      }]);
      setActiveSessionId('default');
    } else {
      setSessions(newSessions);
      if (activeSessionId === id) {
        setActiveSessionId(newSessions[0].id);
      }
    }
  };

  const updateSessionMessages = (sessionId: string, newMessages: Message[]) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        // Auto-generate title from first user message if still default
        let title = s.title;
        if (s.title === 'New Chat' && newMessages.length > 1) {
          const firstUserMsg = newMessages.find(m => m.sender === 'user');
          if (firstUserMsg) {
            title = firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '');
          }
        }
        return { ...s, messages: newMessages, title };
      }
      return s;
    }));
  };

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioContextRef.current;
  };

  const playRawPcm = async (base64: string) => {
    try {
      const ctx = getAudioContext();
      const pcmData = decodeBase64(base64);
      const audioBuffer = await decodeRawPcmToAudioBuffer(pcmData, ctx, 24000);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
    } catch (e) {
      console.error("Audio Playback Error:", e);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !attachment) return;

    const currentSessionId = activeSessionId;
    const userMsg: Message = { id: Date.now().toString(), text: input, sender: 'user' };

    // Optimistic update
    const updatedMessages = [...messages, userMsg];
    updateSessionMessages(currentSessionId, updatedMessages);

    setIsTyping(true);

    let aiInput = input;
    let aiAttachment = undefined;

    if (attachment) {
      const reader = new FileReader();
      reader.readAsDataURL(attachment.file);
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        aiAttachment = {
          base64: base64String,
          mimeType: attachment.file.type
        };
        // Clear attachment state
        setAttachment(null);
        processAIRequest(currentSessionId, updatedMessages, aiInput, aiAttachment);
      };
      setInput('');
      return;
    }

    setInput('');
    processAIRequest(currentSessionId, updatedMessages, aiInput);
  };

  const processAIRequest = async (sessionId: string, currentMessages: Message[], text: string, attach?: { base64: string, mimeType: string }) => {
    try {
      const response = await processAgentRequest(text, "Global Floating Chat", 'text');

      // Handle Agentic Action
      if (response.intent && response.intent !== 'GENERAL_QUERY') {
        const { intent, payload } = response;
        if (intent === 'ADD_EMPLOYEE') {
          const { EmployeeStatus } = await import('../types');
          useDataStore.getState().addEmployee({
            firstName: payload.firstName || 'Unknown',
            lastName: payload.lastName || 'Staff',
            email: payload.email || `staff-${Date.now()}@xquisite.com`,
            role: payload.role || 'Employee',
            salaryCents: 0,
            status: EmployeeStatus.ACTIVE,
            companyId: 'org-xquisite',
            dob: new Date().toISOString(),
            gender: 'Male',
            dateOfEmployment: new Date().toISOString(),
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${payload.firstName}`,
            kpis: []
          });
          updateSessionMessages(sessionId, [...currentMessages, { id: Date.now().toString(), text: `✅ Actions Performed: Added ${payload.firstName} ${payload.lastName} as ${payload.role}.`, sender: 'bot' }]);
        } else if (intent === 'ADD_INVENTORY') {
          useDataStore.getState().addInventoryItem({
            name: payload.itemName,
            stockQuantity: payload.quantity,
            // unit: payload.unit || 'units', // REMOVED: Not in InventoryItem type
            category: payload.category || 'General',
            type: 'raw_material',
            priceCents: 0,
            companyId: 'org-xquisite',
            id: `inv-${Date.now()}`
          });
          updateSessionMessages(sessionId, [...currentMessages, { id: Date.now().toString(), text: `✅ Actions Performed: Added ${payload.quantity} ${payload.itemName} to inventory.`, sender: 'bot' }]);
        }
      } else {
        // Standard Response
        const botMsg: Message = { id: (Date.now() + 1).toString(), text: response.response, sender: 'bot' };
        updateSessionMessages(sessionId, [...currentMessages, botMsg]);
      }

    } catch (error: any) {
      console.error("AI Error:", error);
      let errorMessage = "Connection error.";
      if (error.message === "MISSING_API_KEY") {
        errorMessage = `MISSING KEY. Debug: VITE=${!!import.meta.env.VITE_GEMINI_API_KEY}`;
      } else {
        errorMessage = `Error: ${error.message}`;
      }
      updateSessionMessages(sessionId, [...currentMessages, { id: Date.now().toString(), text: errorMessage, sender: 'bot' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorder.onstop = handleAudioStop;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microphone hardware link failed.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleAudioStop = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const currentSessionId = activeSessionId;

    // Optimistic voice msg
    const voiceMsg: Message = { id: Date.now().toString(), text: '🎤 Voice Input Recieved', sender: 'user' };
    const updatedMessages = [...messages, voiceMsg];
    updateSessionMessages(currentSessionId, updatedMessages);

    setIsTyping(true);

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      try {
        // Use the unified Agentic Processor for Voice too!
        const response = await processAgentRequest(base64String, "Global Voice Chat", 'audio');

        let replyText = response.response || "Task completed.";
        let hasAction = false;

        if (response.intent && response.intent !== 'GENERAL_QUERY') {
          hasAction = true;
          const { intent, payload } = response;
          if (intent === 'ADD_EMPLOYEE') {
            const { EmployeeStatus } = await import('../types');
            useDataStore.getState().addEmployee({
              firstName: payload.firstName || 'Unknown',
              lastName: payload.lastName || 'Staff',
              email: payload.email || `voice-add-${Date.now()}@xquisite.com`,
              role: payload.role || 'Employee',
              salaryCents: 0,
              status: EmployeeStatus.ACTIVE,
              companyId: 'org-xquisite',
              dob: new Date().toISOString(),
              gender: 'Male',
              dateOfEmployment: new Date().toISOString(),
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${payload.firstName}`,
              kpis: []
            });
            replyText = `✅ Voice Action: Added ${payload.firstName} ${payload.lastName} as ${payload.role}.`;
          } else if (intent === 'ADD_INVENTORY') {
            useDataStore.getState().addInventoryItem({
              name: payload.itemName,
              stockQuantity: payload.quantity,
              category: payload.category || 'General',
              type: 'raw_material',
              priceCents: 0,
              companyId: 'org-xquisite',
              id: `inv-voice-${Date.now()}`
            });
            replyText = `✅ Voice Action: Added ${payload.quantity} ${payload.itemName} to inventory.`;
          }
        }

        const aiAudioBase64 = await textToSpeech(replyText);

        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: replyText,
          sender: 'bot',
          hasAudio: !!aiAudioBase64
        };

        updateSessionMessages(currentSessionId, [...updatedMessages, botMsg]);

        if (aiAudioBase64) {
          playRawPcm(aiAudioBase64);
        }
      } catch (e) {
        updateSessionMessages(currentSessionId, [...updatedMessages, { id: Date.now().toString(), text: "Neural decoding error.", sender: 'bot' }]);
      } finally {
        setIsTyping(false);
      }
    };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File too large. Max 5MB.");
        return;
      }
      const preview = URL.createObjectURL(file);
      setAttachment({ file, preview });
    }
  };

  const handleRemoveAttachment = () => {
    if (attachment) {
      URL.revokeObjectURL(attachment.preview);
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end pointer-events-none">
        <button
          onClick={() => setIsOpen(true)}
          disabled={strictMode}
          className={`pointer-events-auto h-16 w-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 transform hover:scale-110 active:scale-95 ${strictMode ? 'bg-slate-800 border-2 border-white/10 opacity-50 cursor-not-allowed' : 'bg-[#00ff9d] hover:shadow-[#00ff9d]/20'}`}
        >
          {strictMode ? <ShieldOff size={24} className="text-slate-500" /> : <MessageSquare size={28} className="text-slate-950" />}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-[60] flex items-end pointer-events-none gap-4">

      {/* Main Chat Container */}
      <div className="w-full h-[100dvh] sm:w-[450px] sm:h-[650px] bg-slate-50/95 backdrop-blur-xl sm:rounded-[2.5rem] shadow-2xl border-t sm:border border-white/20 flex overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-5 duration-300 relative fixed inset-0 sm:static">

        {/* Sidebar */}
        <div className={`absolute inset-y-0 left-0 w-64 bg-slate-100/90 backdrop-blur-md transform transition-transform duration-300 z-20 border-r border-slate-200 ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 flex flex-col h-full">
            <button
              onClick={createNewSession}
              className="flex items-center gap-2 bg-slate-950 text-white p-3 rounded-xl hover:bg-slate-800 transition-all font-bold text-sm shadow-lg shadow-slate-950/10 mb-6"
            >
              <Plus size={16} /> New Chat
            </button>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Recents</h3>
              {sessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => { setActiveSessionId(session.id); setShowSidebar(false); }}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${activeSessionId === session.id ? 'bg-white border-slate-200 shadow-sm' : 'hover:bg-white/50 border-transparent'}`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <MessageSquare size={14} className={activeSessionId === session.id ? 'text-[#00ff9d]' : 'text-slate-400'} />
                    <span className={`text-sm truncate font-medium ${activeSessionId === session.id ? 'text-slate-900' : 'text-slate-500'}`}>{session.title}</span>
                  </div>
                  <button onClick={(e) => deleteSession(e, session.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col h-full bg-slate-50 relative z-10">

          {/* Header */}
          <div className="bg-slate-950 p-4 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                {showSidebar ? <ChevronRight size={18} /> : <History size={18} />}
              </button>
              <div className="flex flex-col">
                <span className="font-bold text-sm">{activeSession.title}</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-[#00ff9d] rounded-full animate-pulse"></div>
                  <span className="text-[10px] text-slate-400 font-medium">Paradigm OS AI</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-xl transition-all">
              <Minimize2 size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
            {activeSessionId === 'default' && sessions.length === 1 && messages.length === 1 && (
              <div className="flex flex-col items-center justify-center py-10 opacity-50">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                  <Sparkles size={32} className="text-[#00ff9d]" />
                </div>
                <p className="text-slate-400 text-sm font-medium">Go ahead, ask me anything.</p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Speaker Label */}
                <span className={`text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 ${msg.sender === 'user' ? 'mr-1' : 'ml-1'}`}>
                  {msg.sender === 'user' ? 'You' : 'P-Xi'}
                </span>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium shadow-sm leading-relaxed ${msg.sender === 'user'
                  ? 'bg-slate-900 text-white rounded-br-none'
                  : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none'
                  }`}>
                  {msg.sender === 'bot' ? (
                    <div className="prose prose-slate prose-sm max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-p:mb-2 prose-li:mb-1">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : msg.text}
                  {msg.hasAudio && (
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-indigo-500 font-bold uppercase tracking-widest">
                      <Sparkles size={12} /> Audio Response Playing
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-bl-none shadow-sm flex space-x-2">
                  <div className="w-1.5 h-1.5 bg-[#00ff9d] rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-[#00ff9d] rounded-full animate-bounce delay-100"></div>
                  <div className="w-1.5 h-1.5 bg-[#00ff9d] rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white/50 backdrop-blur-sm border-t border-slate-100 shrink-0">
            {attachment && (
              <div className="mb-3 flex items-start animate-in slide-in-from-bottom-2 fade-in duration-300">
                <div className="relative group">
                  {attachment.file.type.startsWith('image/') ? (
                    <img src={attachment.preview} alt="Attachment" className="h-14 w-14 object-cover rounded-xl border border-slate-200 shadow-sm" />
                  ) : (
                    <div className="h-14 w-14 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                      <FileText size={20} className="text-slate-400" />
                    </div>
                  )}
                  <button
                    onClick={handleRemoveAttachment}
                    className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"
                  >
                    <X size={10} />
                  </button>
                </div>
                <div className="ml-3 flex-1 overflow-hidden">
                  <p className="text-xs font-bold text-slate-700 truncate">{attachment.file.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">{(attachment.file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-[1.5rem] px-2 py-2 shadow-sm focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 rounded-full hover:bg-slate-100 transition-colors ${attachment ? 'text-indigo-500' : 'text-slate-400'}`}
              >
                <Paperclip size={18} />
              </button>

              <input
                className="flex-1 bg-transparent text-sm font-medium outline-none text-slate-700 placeholder:text-slate-400 px-2"
                placeholder="Ask Paradigm AI..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />

              <div className="flex items-center gap-1">
                {isRecording ? (
                  <button onClick={stopRecording} className="p-3 bg-rose-50 rounded-full text-rose-500 hover:scale-110 transition-all">
                    <Square size={18} className="fill-current" />
                  </button>
                ) : (
                  <button onClick={startRecording} className="p-3 hover:bg-slate-100 rounded-full text-slate-400 hover:text-[#00ff9d] transition-colors">
                    <Mic size={18} />
                  </button>
                )}

                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && !attachment) || isTyping || isRecording}
                  className="p-3 bg-slate-900 text-white rounded-full hover:bg-[#00ff9d] hover:text-slate-900 disabled:opacity-20 disabled:hover:bg-slate-900 disabled:hover:text-white transition-all active:scale-95 shadow-lg shadow-slate-900/20"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};