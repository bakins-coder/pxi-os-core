
import React, { useState, useEffect, useRef } from 'react';
import { Bot, Sparkles, Loader2, AlertCircle, Mic, Square, CheckCircle2 } from 'lucide-react';
import { getFormGuidance, processVoiceCommand } from '../services/ai';
import { useSettingsStore } from '../store/useSettingsStore';

interface FormAssistantProps {
  formName: string;
  activeField: string;
  value: string;
  formData: any;
  onVoiceEntry?: (text: string) => void;
}

export const FormAssistant: React.FC<FormAssistantProps> = ({ formName, activeField, value, formData, onVoiceEntry }) => {
  const strictMode = useSettingsStore(s => s.strictMode);
  const [guidance, setGuidance] = useState<{ tip: string; error?: string; status: 'helpful' | 'warning' | 'error' } | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const isFieldEmpty = !value || value.toString().trim() === '';

  useEffect(() => {
    if (!activeField || !isFieldEmpty) {
      setGuidance(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsThinking(true);
      try {
        const result = await getFormGuidance(formName, activeField, value, formData);
        setGuidance(result);
      } catch (e) {
        console.error("Guidance failed", e);
      } finally {
        setIsThinking(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [activeField, value, isFieldEmpty]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = handleStop;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      alert("Mic permission denied.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
  };

  const handleStop = async () => {
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setIsProcessingVoice(true);
      const result = await processVoiceCommand(base64, 'audio/webm', `Form: ${formName}, Field: ${activeField}`);
      if (result.transcription && onVoiceEntry) onVoiceEntry(result.transcription);
      setIsProcessingVoice(false);
    };
  };

  if (!activeField || !isFieldEmpty || strictMode) return null;

  return (
    <div className="fixed bottom-10 left-10 z-40 max-w-xs w-full animate-in slide-in-from-left-10 pointer-events-none">
      <div className={`relative p-6 rounded-[2rem] shadow-2xl backdrop-blur-xl border transition-all duration-500 pointer-events-auto ${isRecording ? 'bg-rose-500/20 border-rose-500/40' :
          guidance?.status === 'error' ? 'bg-rose-500/10 border-rose-500/30' :
            'bg-slate-900/95 border-white/10'
        }`}>
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform ${isThinking || isProcessingVoice ? 'animate-pulse scale-110' : ''}`}
              style={{ backgroundColor: isRecording ? '#ef4444' : '#00ff9d' }}>
              {isThinking || isProcessingVoice ? <Loader2 size={24} className="animate-spin text-slate-950" /> : isRecording ? <Square size={20} className="fill-white" /> : <Bot size={24} className="text-slate-950" />}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Neural Guide</h4>
              {onVoiceEntry && !isProcessingVoice && (
                <button onClick={isRecording ? stopRecording : startRecording} className={`p-1.5 rounded-lg transition-all ${isRecording ? 'bg-rose-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
                  <Mic size={14} />
                </button>
              )}
            </div>
            <div className="text-sm font-bold text-white leading-relaxed">
              {isRecording ? <span className="text-rose-400 animate-pulse">Recording...</span> : isProcessingVoice ? <span className="opacity-50 italic">Processing...</span> : isThinking ? <span className="opacity-50 italic">Thinking...</span> : guidance?.tip || "Required field."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
