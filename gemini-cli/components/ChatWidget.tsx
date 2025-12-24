
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Minimize2, Sparkles, Mic, Square, Play, Pause, Loader2 } from 'lucide-react';
import { generateAIResponse, getAIResponseForAudio, textToSpeech } from '../services/ai';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  audioUrl?: string;
}

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', text: 'Hi! I can help you navigate or answer questions about your data.', sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
        const response = await generateAIResponse(input, "User is interacting via the global floating chat widget. They might be on any page (Dashboard, CRM, Finance).");
        
        const botMsg: Message = { id: (Date.now() + 1).toString(), text: response, sender: 'bot' };
        setMessages(prev => [...prev, botMsg]);
    } catch (error) {
        setMessages(prev => [...prev, { id: Date.now().toString(), text: "Sorry, I encountered an error.", sender: 'bot' }]);
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

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = handleAudioStop;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleAudioStop = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // 1. Add User Audio Message
    const userMsg: Message = { 
        id: Date.now().toString(), 
        text: '🎤 Voice Message', 
        sender: 'user',
        audioUrl 
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // 2. Process Audio with AI
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        
        try {
            // Get Text Transcript/Response
            const aiText = await getAIResponseForAudio(base64String, 'audio/webm');
            
            // Get Voice Response
            const aiAudioBase64 = await textToSpeech(aiText);
            
            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: aiText,
                sender: 'bot',
                audioUrl: aiAudioBase64 ? `data:audio/wav;base64,${aiAudioBase64}` : undefined
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { id: Date.now().toString(), text: "Error processing voice message.", sender: 'bot' }]);
        } finally {
            setIsTyping(false);
        }
    };
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-indigo-600 p-4 flex justify-between items-center text-white shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-200" />
              <span className="font-semibold text-sm tracking-wide">AI Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-700 p-1 rounded transition-colors text-indigo-100 hover:text-white">
              <Minimize2 size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scroll-smooth">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
                }`}>
                  {msg.text}
                  {msg.audioUrl && (
                     <div className="mt-2 pt-2 border-t border-white/20">
                        <audio controls src={msg.audioUrl} className="w-full h-8 max-w-[200px]" />
                     </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
               <div className="flex justify-start">
                 <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none shadow-sm flex space-x-1">
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-slate-100">
             <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
               {isRecording ? (
                  <div className="flex-1 flex items-center gap-3">
                     <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                     <span className="text-sm text-red-600 font-medium animate-pulse">Recording...</span>
                  </div>
               ) : (
                  <input 
                    className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder:text-slate-400"
                    placeholder="Type or record..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    autoFocus
                  />
               )}
               
               {/* Controls */}
               {isRecording ? (
                  <button 
                    onClick={stopRecording}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors"
                  >
                    <Square size={18} fill="currentColor" />
                  </button>
               ) : (
                  <>
                     {!input.trim() ? (
                        <button 
                           onClick={startRecording}
                           className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-full transition-colors"
                        >
                           <Mic size={18} />
                        </button>
                     ) : (
                        <button 
                           onClick={handleSend}
                           disabled={!input.trim() || isTyping}
                           className="text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-1"
                        >
                           <Send size={18} />
                        </button>
                     )}
                  </>
               )}
             </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`pointer-events-auto h-14 w-14 rounded-full shadow-lg shadow-indigo-600/20 flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 ${
          isOpen ? 'bg-slate-700 rotate-90' : 'bg-indigo-600 hover:bg-indigo-700'
        } text-white`}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};
