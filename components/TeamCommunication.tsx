
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/mockDb';
import { User, Task } from '../types';
import { generateAIResponse } from '../services/ai';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { 
  Phone, Video, MoreVertical, Search, Mic, MicOff, 
  VideoOff, PhoneOff, Send, Paperclip, Smile, MessageSquare,
  MonitorUp, PenTool, BarChart2, Users, LayoutGrid, X, Check, Trash2, Plus,
  UserPlus, Link2, Copy, Bot, FileText, Calendar, ListTodo, Activity
} from 'lucide-react';

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

interface Poll {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  status: 'active' | 'closed';
  totalVotes: number;
}

interface BreakoutRoom {
  id: string;
  name: string;
  participants: User[];
}

// --- Audio Utilities ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export const TeamCommunication = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(db.teamMembers[0] || null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [inputText, setInputText] = useState('');
  
  // --- Call State ---
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('video');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  
  // --- AI Note Taker State ---
  const [isAiScribeActive, setIsAiScribeActive] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [isProcessingNotes, setIsProcessingNotes] = useState(false);
  const [meetingSummary, setMeetingSummary] = useState<{ summary: string; decisions: string[]; tasks: Partial<Task>[] } | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  
  // --- Collaboration State ---
  const [activeView, setActiveView] = useState<'video' | 'screen' | 'whiteboard'>('video');
  const [sidebarView, setSidebarView] = useState<'none' | 'chat' | 'polls' | 'rooms' | 'notes'>('none');
  const [polls, setPolls] = useState<Poll[]>([]);
  const [newPollQ, setNewPollQ] = useState('');
  const [newPollOpts, setNewPollOpts] = useState(['Yes', 'No']);
  const [rooms, setRooms] = useState<BreakoutRoom[]>([
    { id: 'main', name: 'Main Room', participants: db.teamMembers },
    { id: 'r1', name: 'Breakout 1', participants: [] },
    { id: 'r2', name: 'Breakout 2', participants: [] }
  ]);

  // --- Invite State ---
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteLink] = useState(`https://meet.unified.app/${Math.random().toString(36).slice(2, 7)}`);
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  // Media Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  
  // Audio Processing Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Whiteboard Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  
  // Simulation Timer
  const simIntervalRef = useRef<number | null>(null);

  // Initialize messages
  useEffect(() => {
    if (db.teamMembers.length > 0 && Object.keys(messages).length === 0) {
      const initialMsgs: Record<string, ChatMessage[]> = {};
      db.teamMembers.forEach(user => {
        initialMsgs[user.id] = [
          { id: '1', senderId: user.id, text: `Hey, ready for the design review?`, timestamp: '09:00 AM' },
          { id: '2', senderId: 'u1', text: `Yes, joining in a minute.`, timestamp: '09:05 AM' }
        ];
      });
      setMessages(initialMsgs);
    }
  }, []);

  // Scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, sidebarView]);

  // --- Invite Logic ---
  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    alert(`Invite sent to ${inviteEmail}`);
    setInviteEmail('');
    setIsInviteModalOpen(false);
  };

  // --- Chat Logic ---
  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !selectedUser) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'u1',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => ({
      ...prev,
      [selectedUser.id]: [...(prev[selectedUser.id] || []), newMsg]
    }));
    setInputText('');
  };

  // --- Call Logic ---
  const startCall = async (type: 'audio' | 'video') => {
    setCallType(type);
    setIsCallActive(true);
    setIsMuted(false);
    setIsCameraOff(false);
    setActiveView(type === 'video' ? 'video' : 'video'); 
    setMeetingSummary(null);
    setTranscripts([]);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: type === 'video', 
        audio: true 
      });
      streamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Media Error:", err);
      alert("Could not access devices.");
    }
  };

  const endCall = () => {
    // Stop media streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    // Stop AI Scribe if active
    if (isAiScribeActive) {
      stopAiScribe();
      // If we have transcripts, proceed to post-meeting flow
      if (transcripts.length > 0) {
        setIsProcessingNotes(true);
        generateMeetingMinutes();
      }
    }

    setIsCallActive(false);
    setActiveView('video');
    setSidebarView('none');
  };

  // --- AI Note Taker Logic ---
  const startAiScribe = async () => {
    try {
      if (!process.env.API_KEY) {
        alert("API Key missing");
        return;
      }
      setIsAiScribeActive(true);
      setSidebarView('notes'); // Auto open notes view
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
             setIsLiveConnected(true);
             // Start simulating remote participants once connected
             startRemoteSimulation();
          },
          onmessage: (msg: LiveServerMessage) => {
             if (msg.serverContent?.inputTranscription) {
               const text = msg.serverContent.inputTranscription.text;
               setTranscripts(prev => [...prev, `You: ${text}`]);
             }
          },
          onclose: () => setIsLiveConnected(false),
          onerror: (e) => console.error(e)
        }
      });

      // Connect existing stream if available
      if (streamRef.current) {
        const source = audioCtx.createMediaStreamSource(streamRef.current);
        sourceRef.current = source;
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmBlob = createBlob(inputData);
          sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
        };

        source.connect(processor);
        processor.connect(audioCtx.destination);
      }

    } catch (e) {
      console.error("AI Scribe Error", e);
      setIsAiScribeActive(false);
    }
  };

  const stopAiScribe = () => {
    sourceRef.current?.disconnect();
    processorRef.current?.disconnect();
    audioContextRef.current?.close();
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    setIsAiScribeActive(false);
    setIsLiveConnected(false);
  };

  const startRemoteSimulation = () => {
    const remotePhrases = [
       { speaker: "Sarah Connor", text: "I agree with that timeline. The Q3 budget should cover it." },
       { speaker: "Kyle Reese", text: "I'll take the action to update the security protocols by Friday." },
       { speaker: "Dr. Silberman", text: "Are we sure about the psychological impact of this feature?" },
       { speaker: "Sarah Connor", text: "Let's schedule a follow-up for next Tuesday." },
       { speaker: "Kyle Reese", text: "Can you send me the documentation for the API?" }
    ];

    simIntervalRef.current = window.setInterval(() => {
       const phrase = remotePhrases[Math.floor(Math.random() * remotePhrases.length)];
       setTranscripts(prev => [...prev, `${phrase.speaker}: ${phrase.text}`]);
    }, 8000); // Simulate remote speech every 8 seconds
  };

  const generateMeetingMinutes = async () => {
    const fullTranscript = transcripts.join('\n');
    const prompt = `
      You are an expert Meeting Scribe. Analyze the following meeting transcript.
      Extract:
      1. A concise summary.
      2. Key decisions made.
      3. Action items with assignees (match names to Sarah Connor, Kyle Reese, Dr. Silberman, or Admin) and due dates (assume 3 days from now if not specified).
      
      Transcript:
      ${fullTranscript}

      Return valid JSON in this format:
      {
        "summary": "...",
        "decisions": ["..."],
        "tasks": [
          { "title": "...", "assigneeId": "u2", "dueDate": "YYYY-MM-DD" }
        ]
      }
      Note: Map 'Sarah Connor' to 'u2', 'Kyle Reese' to 'u3', 'Dr. Silberman' to 'u4', 'You'/'Admin' to 'u1'.
    `;

    try {
      // Use the generic AI service wrapper
      const response = await generateAIResponse(prompt);
      // Clean up markdown code blocks if present
      const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      setMeetingSummary(parsed);
    } catch (e) {
      console.error("Failed to generate minutes", e);
      setMeetingSummary({
        summary: "Could not auto-generate summary. Please review transcript.",
        decisions: [],
        tasks: []
      });
    } finally {
      setIsProcessingNotes(false);
    }
  };

  const saveMeetingToDb = () => {
    if (!meetingSummary) return;
    
    db.saveMeeting({
      id: Date.now().toString(),
      title: "Team Sync & Design Review",
      date: new Date().toISOString(),
      attendees: db.teamMembers.map(u => u.name),
      transcript: transcripts.join('\n'),
      summary: meetingSummary.summary,
      decisions: meetingSummary.decisions,
      actionItems: meetingSummary.tasks.map((t, i) => ({
        id: `mtg-task-${Date.now()}-${i}`,
        title: t.title || "Untitled Task",
        description: `Generated from meeting on ${new Date().toLocaleDateString()}`,
        assigneeId: t.assigneeId || 'u1',
        dueDate: t.dueDate || new Date().toISOString().split('T')[0],
        status: 'Pending',
        priority: 'Medium',
        createdDate: new Date().toISOString()
      }))
    });
    setMeetingSummary(null);
    alert("Meeting saved to Calendar and Action Items assigned!");
  };

  // --- Screen Share Logic ---
  const toggleScreenShare = async () => {
    if (activeView === 'screen') {
      // Stop sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      setActiveView('video');
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        setActiveView('screen');
        // Handle stream stop via browser UI
        stream.getVideoTracks()[0].onended = () => {
           setActiveView('video');
           screenStreamRef.current = null;
        };
      } catch (err) {
        console.error("Screen Share Error:", err);
      }
    }
  };
  
  // Effect to attach screen stream when view changes
  useEffect(() => {
    if (activeView === 'screen' && screenVideoRef.current && screenStreamRef.current) {
      screenVideoRef.current.srcObject = screenStreamRef.current;
    }
  }, [activeView]);

  // --- Whiteboard Logic ---
  useEffect(() => {
    if (activeView === 'whiteboard' && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = canvas.parentElement?.clientHeight || 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 3;
        ctxRef.current = ctx;
      }
    }
  }, [activeView]);

  const startDrawing = ({ nativeEvent }: React.MouseEvent) => {
    if (!ctxRef.current) return;
    const { offsetX, offsetY } = nativeEvent;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }: React.MouseEvent) => {
    if (!isDrawing || !ctxRef.current) return;
    const { offsetX, offsetY } = nativeEvent;
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
  };

  const stopDrawing = () => {
    if (!ctxRef.current) return;
    ctxRef.current.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current || !ctxRef.current) return;
    ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  // --- Polling Logic ---
  const createPoll = () => {
    if (!newPollQ.trim()) return;
    const poll: Poll = {
      id: Date.now().toString(),
      question: newPollQ,
      options: newPollOpts.map((opt, i) => ({ id: `${i}`, text: opt, votes: 0 })),
      status: 'active',
      totalVotes: 0
    };
    setPolls([...polls, poll]);
    setNewPollQ('');
    setNewPollOpts(['Yes', 'No']);
  };

  const votePoll = (pollId: string, optionId: string) => {
    setPolls(polls.map(p => {
      if (p.id !== pollId) return p;
      return {
        ...p,
        totalVotes: p.totalVotes + 1,
        options: p.options.map(o => o.id === optionId ? { ...o, votes: o.votes + 1 } : o)
      };
    }));
  };

  return (
    <div className="h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-slate-100 flex overflow-hidden relative">
      
      {/* Sidebar List (Visible when not in full-screen call) */}
      {!isCallActive && (
        <div className="w-80 border-r border-slate-100 flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">Team</h2>
              <button 
                onClick={() => setIsInviteModalOpen(true)} 
                className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors" 
                title="Invite Guest"
              >
                <UserPlus size={18} />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" 
                placeholder="Search team..."
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {db.teamMembers.map(user => (
              <div 
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${selectedUser?.id === user.id ? 'bg-indigo-50 border-r-2 border-indigo-600' : 'hover:bg-slate-50'}`}
              >
                <div className="relative">
                  <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-semibold truncate ${selectedUser?.id === user.id ? 'text-indigo-900' : 'text-slate-800'}`}>{user.name}</h4>
                  <p className="text-xs text-slate-500 truncate">{user.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content / Chat Area (Hidden if call is active and full screen) */}
      {!isCallActive && (
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30">
          {selectedUser ? (
            <>
              {/* Header */}
              <div className="bg-white p-4 border-b border-slate-100 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-3">
                   <img src={selectedUser.avatar} alt={selectedUser.name} className="w-10 h-10 rounded-full bg-slate-200" />
                   <div>
                     <h3 className="font-bold text-slate-800">{selectedUser.name}</h3>
                     <span className="text-xs text-green-600 flex items-center gap-1">
                       <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span> Online
                     </span>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <button onClick={() => startCall('audio')} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                     <Phone size={20} />
                   </button>
                   <button onClick={() => startCall('video')} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                     <Video size={20} />
                   </button>
                   <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                     <MoreVertical size={20} />
                   </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                 {messages[selectedUser.id]?.map(msg => (
                   <div key={msg.id} className={`flex ${msg.senderId === 'u1' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[70%] ${msg.senderId === 'u1' ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${
                          msg.senderId === 'u1' 
                            ? 'bg-indigo-600 text-white rounded-br-none' 
                            : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
                        }`}>
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                     </div>
                   </div>
                 ))}
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100">
                 <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-2 py-2">
                   <button type="button" className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg"><Paperclip size={20} /></button>
                   <input 
                     className="flex-1 bg-transparent border-none outline-none text-slate-700 text-sm placeholder:text-slate-400"
                     placeholder="Type your message..."
                     value={inputText}
                     onChange={e => setInputText(e.target.value)}
                   />
                   <button type="button" className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg"><Smile size={20} /></button>
                   <button type="submit" disabled={!inputText.trim()} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
                     <Send size={18} />
                   </button>
                 </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageSquare size={48} className="mb-4 opacity-20" />
              <p>Select a team member to start chatting</p>
            </div>
          )}
        </div>
      )}

      {/* --- COLLABORATIVE CALL OVERLAY --- */}
      {isCallActive && (
        <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col animate-in fade-in duration-300">
           
           {/* Top Bar */}
           <div className="h-16 bg-slate-800 border-b border-slate-700 flex justify-between items-center px-6">
             <div className="flex items-center gap-4 text-white">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                 <span className="font-mono text-sm">00:04:23</span>
               </div>
               <span className="text-slate-400">|</span>
               <span className="font-medium">{selectedUser?.name}</span>
             </div>
             <div className="flex items-center gap-2">
                <button 
                  onClick={() => isAiScribeActive ? stopAiScribe() : startAiScribe()}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 mr-2 transition-all ${
                    isAiScribeActive 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30' 
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                  title="AI Note Taker"
                >
                    <Bot size={16} />
                    <span className="hidden sm:inline">{isAiScribeActive ? 'AI Scribe Active' : 'Enable AI Scribe'}</span>
                    {isAiScribeActive && isLiveConnected && <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>}
                </button>

                <button 
                    onClick={() => setIsInviteModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 mr-2 transition-colors"
                >
                    <UserPlus size={16} />
                    <span className="hidden sm:inline">Invite</span>
                </button>
                <button 
                  onClick={() => setActiveView('whiteboard')}
                  className={`p-2 rounded-lg transition-colors ${activeView === 'whiteboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                  title="Whiteboard"
                >
                  <PenTool size={20} />
                </button>
                <button 
                  onClick={toggleScreenShare}
                  className={`p-2 rounded-lg transition-colors ${activeView === 'screen' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                  title="Screen Share"
                >
                  <MonitorUp size={20} />
                </button>
                <button 
                  onClick={() => { setActiveView('video'); setSidebarView('none'); }}
                  className={`p-2 rounded-lg transition-colors ${activeView === 'video' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                  title="Video Grid"
                >
                  <LayoutGrid size={20} />
                </button>
             </div>
           </div>

           {/* Main Stage */}
           <div className="flex-1 flex overflow-hidden">
             
             {/* Center Stage Content */}
             <div className="flex-1 bg-black relative flex items-center justify-center p-4">
               
               {/* Video View */}
               {activeView === 'video' && (
                  <div className="w-full h-full grid grid-cols-2 gap-4">
                     {/* Remote User (Simulated) */}
                     <div className="relative bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center border border-slate-700">
                        <img src={selectedUser?.avatar} className="w-24 h-24 rounded-full mb-4 border-4 border-indigo-500" />
                        <div className="absolute bottom-4 left-4 text-white bg-black/50 px-2 py-1 rounded text-sm">
                          {selectedUser?.name}
                        </div>
                     </div>
                     {/* Local User */}
                     <div className="relative bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center border border-slate-700">
                        <video ref={localVideoRef} autoPlay muted playsInline className={`w-full h-full object-cover transform scale-x-[-1] ${isCameraOff ? 'hidden' : ''}`} />
                        {isCameraOff && <div className="text-slate-500">Camera Off</div>}
                        <div className="absolute bottom-4 left-4 text-white bg-black/50 px-2 py-1 rounded text-sm">You</div>
                     </div>
                  </div>
               )}

               {/* Screen Share View */}
               {activeView === 'screen' && (
                  <video ref={screenVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
               )}

               {/* Whiteboard View */}
               {activeView === 'whiteboard' && (
                 <div className="w-full h-full bg-white rounded-xl overflow-hidden relative cursor-crosshair">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      className="w-full h-full"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 shadow-lg rounded-lg p-2 flex gap-2 border border-slate-200">
                      <span className="text-xs font-bold text-indigo-600 px-2 flex items-center">Whiteboard</span>
                      <button onClick={clearCanvas} className="p-1 hover:bg-red-50 text-red-500 rounded" title="Clear">
                        <Trash2 size={16} />
                      </button>
                    </div>
                 </div>
               )}
             </div>

             {/* Right Sidebar (Collapsible) */}
             {sidebarView !== 'none' && (
               <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col animate-in slide-in-from-right duration-200">
                 <div className="p-4 border-b border-slate-700 flex justify-between items-center text-white">
                   <h3 className="font-semibold capitalize flex items-center gap-2">
                     {sidebarView === 'notes' && <Bot size={16}/>}
                     {sidebarView}
                   </h3>
                   <button onClick={() => setSidebarView('none')} className="text-slate-400 hover:text-white"><X size={18} /></button>
                 </div>
                 
                 {/* AI Live Notes Content */}
                 {sidebarView === 'notes' && (
                    <div className="flex-1 overflow-hidden flex flex-col">
                      <div className="p-4 bg-slate-700/50 text-xs text-slate-300">
                        <p>AI Scribe is listening and transcribing...</p>
                        <div className="mt-2 flex items-center gap-2">
                           <Activity size={12} className="text-green-400 animate-pulse"/>
                           <span>Live Transcription</span>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm">
                         {transcripts.map((t, i) => {
                            const [speaker, ...text] = t.split(':');
                            const isMe = speaker.trim() === 'You';
                            return (
                               <div key={i} className="flex flex-col gap-1">
                                 <span className={`text-xs font-bold ${isMe ? 'text-indigo-400' : 'text-orange-400'}`}>
                                    {speaker}
                                 </span>
                                 <p className="text-slate-200 leading-relaxed bg-slate-700/30 p-2 rounded">
                                    {text.join(':')}
                                 </p>
                               </div>
                            )
                         })}
                         <div ref={transcriptEndRef}></div>
                      </div>
                    </div>
                 )}

                 {/* Polls Content */}
                 {sidebarView === 'polls' && (
                   <div className="flex-1 overflow-y-auto p-4 space-y-6">
                     {/* Create Poll */}
                     <div className="bg-slate-700/50 p-4 rounded-xl space-y-3">
                       <h4 className="text-sm font-medium text-slate-300">Create Poll</h4>
                       <input 
                         className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" 
                         placeholder="Question..."
                         value={newPollQ}
                         onChange={e => setNewPollQ(e.target.value)}
                       />
                       <div className="space-y-2">
                         {newPollOpts.map((opt, i) => (
                           <input 
                             key={i}
                             className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-xs text-white"
                             value={opt}
                             onChange={e => {
                               const newOpts = [...newPollOpts];
                               newOpts[i] = e.target.value;
                               setNewPollOpts(newOpts);
                             }}
                           />
                         ))}
                       </div>
                       <button onClick={createPoll} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 rounded font-medium">Launch Poll</button>
                     </div>

                     {/* Active Polls */}
                     <div className="space-y-4">
                       {polls.map(poll => (
                         <div key={poll.id} className="bg-slate-700 p-4 rounded-xl">
                           <h4 className="text-white font-medium text-sm mb-3">{poll.question}</h4>
                           <div className="space-y-2">
                             {poll.options.map(opt => {
                               const percentage = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                               return (
                                 <button 
                                   key={opt.id}
                                   onClick={() => votePoll(poll.id, opt.id)}
                                   className="w-full relative bg-slate-800 rounded-lg overflow-hidden p-2 text-left hover:bg-slate-600 transition-colors group"
                                 >
                                   <div className="absolute left-0 top-0 bottom-0 bg-indigo-500/20 transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                                   <div className="relative flex justify-between items-center text-xs text-slate-200">
                                     <span>{opt.text}</span>
                                     <span className="font-mono">{percentage}%</span>
                                   </div>
                                 </button>
                               );
                             })}
                           </div>
                           <div className="mt-2 text-right text-xs text-slate-400">{poll.totalVotes} votes</div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 {/* Breakout Rooms Content */}
                 {sidebarView === 'rooms' && (
                   <div className="flex-1 overflow-y-auto p-4 space-y-4">
                     {rooms.map(room => (
                       <div key={room.id} className="bg-slate-700 rounded-xl p-3">
                         <div className="flex justify-between items-center mb-2">
                           <h4 className="text-white text-sm font-medium">{room.name}</h4>
                           <button className="text-xs bg-indigo-600 text-white px-2 py-1 rounded">Join</button>
                         </div>
                         <div className="space-y-1">
                           {room.participants.length > 0 ? (
                             room.participants.map(p => (
                               <div key={p.id} className="flex items-center gap-2 text-slate-300 text-xs pl-2">
                                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                 {p.name}
                               </div>
                             ))
                           ) : (
                             <p className="text-slate-500 text-xs pl-2 italic">Empty</p>
                           )}
                         </div>
                       </div>
                     ))}
                     <button className="w-full border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 py-2 rounded-xl text-sm flex items-center justify-center gap-2">
                       <Plus size={16} /> Add Room
                     </button>
                   </div>
                 )}
               </div>
             )}
           </div>

           {/* Bottom Control Bar */}
           <div className="h-20 bg-slate-900 flex justify-center items-center gap-4">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
              
              <button 
                onClick={() => setIsCameraOff(!isCameraOff)}
                className={`p-4 rounded-full transition-all ${isCameraOff ? 'bg-red-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
              >
                {isCameraOff ? <VideoOff size={24} /> : <Video size={24} />}
              </button>
              
              <button 
                onClick={endCall}
                className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all px-8"
              >
                <PhoneOff size={24} />
              </button>

              <div className="w-px h-8 bg-slate-700 mx-2"></div>

              <button 
                onClick={() => setSidebarView(sidebarView === 'polls' ? 'none' : 'polls')}
                className={`p-4 rounded-full transition-all ${sidebarView === 'polls' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                title="Polls"
              >
                <BarChart2 size={24} />
              </button>

              <button 
                onClick={() => setSidebarView(sidebarView === 'rooms' ? 'none' : 'rooms')}
                className={`p-4 rounded-full transition-all ${sidebarView === 'rooms' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                title="Breakout Rooms"
              >
                <LayoutGrid size={24} />
              </button>
           </div>
        </div>
      )}
    </div>
  );
};
