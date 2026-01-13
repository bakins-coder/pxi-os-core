import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Minimize2, Sparkles, Mic, Square, Loader2, ShieldOff, Paperclip, Image as ImageIcon, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useSettingsStore } from '../store/useSettingsStore';
import { generateAIResponse, getAIResponseForAudio, textToSpeech } from '../services/ai';
import { decodeBase64, decodeRawPcmToAudioBuffer } from '../services/audioUtils';


interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  hasAudio?: boolean;
}

export const ChatWidget = () => {
  const strictMode = useSettingsStore(s => s.strictMode);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', text: 'Hi! I can help you navigate or answer questions about your data.', sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachment, setAttachment] = useState<{ file: File; preview: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

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
      const audioBuffer = await decodeRawPcmToAudioBuffer(pcmData, ctx);
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

    const userMsg: Message = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    let aiInput = input;
    let aiAttachment = undefined;

    if (attachment) {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(attachment.file);
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        aiAttachment = {
          base64: base64String,
          mimeType: attachment.file.type
        };

        processAIRequest(aiInput, aiAttachment);
      };
      // Clear attachment from UI immediately to avoid double send
      setAttachment(null);
      setInput('');
      return;
    }

    setInput('');
    processAIRequest(aiInput);
  };

  const processAIRequest = async (text: string, attach?: { base64: string, mimeType: string }) => {
    try {
      const response = await generateAIResponse(text, "Global Floating Chat", attach);
      const botMsg: Message = { id: (Date.now() + 1).toString(), text: response, sender: 'bot' };
      setMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      console.error("AI Error:", error);
      let errorMessage = "Connection error.";

      if (error.message === "MISSING_API_KEY") {
        errorMessage = `MISSING KEY. Debug: VITE=${!!import.meta.env.VITE_GEMINI_API_KEY}`;
      } else {
        errorMessage = `Error: ${error.message}`;
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), text: errorMessage, sender: 'bot' }]);
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

    setMessages(prev => [...prev, { id: Date.now().toString(), text: '🎤 Voice Input Recieved', sender: 'user' }]);
    setIsTyping(true);

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      try {
        const aiText = await getAIResponseForAudio(base64String, 'audio/webm');
        const aiAudioBase64 = await textToSpeech(aiText);

        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: aiText,
          sender: 'bot',
          hasAudio: !!aiAudioBase64
        };
        setMessages(prev => [...prev, botMsg]);
        if (aiAudioBase64) {
          playRawPcm(aiAudioBase64);
        }
      } catch (e) {
        setMessages(prev => [...prev, { id: Date.now().toString(), text: "Neural decoding error.", sender: 'bot' }]);
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

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end pointer-events-none">
      {isOpen && (
        <div className="mb-4 w-[380px] h-[550px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-950 p-6 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#00ff9d] rounded-xl flex items-center justify-center text-slate-950 shadow-lg animate-pulse">
                <Sparkles size={16} />
              </div>
              <div>
                <span className="font-black text-xs uppercase tracking-widest text-[#00ff9d] block">Neural Assistant</span>
                <span className="text-[10px] text-rose-500 font-bold bg-white/10 px-1 rounded">DEBUG: ATTACHMENT VERSION</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-xl transition-all">
              <Minimize2 size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 scrollbar-thin">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[90%] p-4 rounded-2xl text-sm font-medium shadow-sm leading-relaxed ${msg.sender === 'user'
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

          <div className="p-4 bg-white border-t border-slate-100">
            {attachment && (
              <div className="mb-3 flex items-start">
                <div className="relative group">
                  {attachment.file.type.startsWith('image/') ? (
                    <img src={attachment.preview} alt="Attachment" className="h-16 w-16 object-cover rounded-lg border border-slate-200 shadow-sm" />
                  ) : (
                    <div className="h-16 w-16 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                      <FileText size={24} className="text-slate-400" />
                    </div>
                  )}
                  <button
                    onClick={handleRemoveAttachment}
                    className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"
                  >
                    <X size={12} />
                  </button>
                </div>
                <div className="ml-3 flex-1 overflow-hidden">
                  <p className="text-xs font-bold text-slate-700 truncate">{attachment.file.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">{(attachment.file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-[1.5rem] px-4 py-3 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
              {isRecording ? (
                <div className="flex-1 flex items-center gap-3">
                  <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></div>
                  <span className="text-[10px] text-rose-600 font-black uppercase tracking-widest">Listening...</span>
                </div>
              ) : (
                <input
                  className="flex-1 bg-transparent text-sm font-bold outline-none text-slate-700 placeholder:text-slate-400"
                  placeholder="Ask anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
              )}

              <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                {isRecording ? (
                  <button onClick={stopRecording} className="text-rose-500 hover:scale-110 p-2 transition-transform">
                    <Square size={18} className="fill-current" />
                  </button>
                ) : (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*,application/pdf"
                      onChange={handleFileSelect}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-2 transition-colors ${attachment ? 'text-indigo-500' : 'text-slate-400 hover:text-[#00ff9d]'}`}
                    >
                      <Paperclip size={18} />
                    </button>
                    <button onClick={startRecording} className="text-slate-400 hover:text-[#00ff9d] p-2 transition-colors">
                      <Mic size={18} />
                    </button>
                  </>
                )}
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && !attachment) || isTyping || isRecording}
                  className="text-slate-900 hover:text-indigo-600 disabled:opacity-20 p-2 transition-all active:scale-90"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={strictMode}
        className={`pointer-events-auto h-16 w-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 transform hover:scale-110 active:scale-95 ${strictMode ? 'bg-slate-800 border-2 border-white/10 opacity-50 cursor-not-allowed' :
          isOpen ? 'bg-slate-950 rotate-90' : 'bg-[#00ff9d] hover:shadow-[#00ff9d]/20'
          }`}
      >
        {strictMode ? <ShieldOff size={24} className="text-slate-500" /> :
          isOpen ? <X size={28} className="text-white" /> : <MessageSquare size={28} className="text-slate-950" />}
      </button>
    </div>
  );
};