
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDataStore } from '../store/useDataStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { CustomerAgentStandalone } from './CustomerAgentStandalone';
import { 
  AlertCircle, ExternalLink, ShieldCheck, 
  Sparkles, MousePointer2, Smartphone, Monitor,
  Info
} from 'lucide-react';

export const MockupPreview: React.FC = () => {
    const { leadId } = useParams();
    const { leads } = useDataStore();
    const { settings } = useSettingsStore();
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [iframeLoaded, setIframeLoaded] = useState(false);
    
    const lead = leads.find(l => l.id === leadId);

    if (!lead) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#0a0a0b] text-white">
                <div className="text-center space-y-4">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                    <h2 className="text-2xl font-bold">Prototype Logic Error</h2>
                    <p className="text-gray-400">The requested lead profile or mockup instance was not found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-[#0a0a0b] overflow-hidden">
            {/* Control Bar */}
            <div className="bg-[#121217] border-b border-[#1d1d21] p-4 flex justify-between items-center px-8">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#00ff9d] rounded-xl flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-black" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-white">Live AI Prototype: {lead.company}</h1>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <ShieldCheck className="w-3 h-3 text-[#00ff9d]" />
                            <span>Powered by {settings.name || 'Platform'} OmniAgent Intelligence</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex bg-[#0a0a0b] border border-[#2d2d33] rounded-xl p-1">
                        <button 
                            onClick={() => setViewMode('desktop')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'desktop' ? 'bg-[#1d1d21] text-[#00ff9d]' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Monitor className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setViewMode('mobile')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'mobile' ? 'bg-[#1d1d21] text-[#00ff9d]' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Smartphone className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="h-8 w-[1px] bg-[#2d2d33]" />

                    <div className="flex items-center gap-3 bg-[#00ff9d]/5 border border-[#00ff9d]/20 px-4 py-2 rounded-xl text-sm text-[#00ff9d]">
                        <Info className="w-4 h-4" />
                        <span>Interactive Demo: Talk to the agent below</span>
                    </div>

                    <a 
                        href={lead.websiteUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-all"
                    >
                        Original Site <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 relative bg-[#1d1d21] flex justify-center p-8 overflow-hidden">
                <div className={`relative bg-white shadow-2xl transition-all duration-700 ease-in-out origin-top ${viewMode === 'desktop' ? 'w-full h-full rounded-t-xl' : 'w-[400px] h-full rounded-3xl border-[8px] border-black scale-95'}`}>
                    {/* The Website Iframe */}
                    <iframe 
                        src={lead.websiteUrl} 
                        title="Mockup Site"
                        className="w-full h-full border-none rounded-t-xl"
                        onLoad={() => setIframeLoaded(true)}
                    />
                    
                    {!iframeLoaded && (
                        <div className="absolute inset-0 bg-[#0a0a0b] flex flex-col items-center justify-center text-white space-y-4">
                            <Sparkles className="w-12 h-12 text-[#00ff9d] animate-pulse" />
                            <p className="text-gray-400 font-medium italic">Forging Neural Connection to {lead.company}...</p>
                        </div>
                    )}

                    {/* The OmniAgent Overlaid Widget */}
                    <div className="absolute bottom-6 right-6 w-[400px] max-h-[600px] pointer-events-auto">
                        <div className="shadow-2xl rounded-3xl overflow-hidden border border-[#1d1d21]">
                           <CustomerAgentStandalone />
                        </div>
                    </div>

                    {/* Cursor Simulation Overlay */}
                    <div className="absolute top-1/4 left-1/4 pointer-events-none opacity-50">
                        <div className="relative">
                            <MousePointer2 className="w-6 h-6 text-white drop-shadow-lg" />
                            <div className="absolute top-0 left-0 w-full h-full bg-[#00ff9d] rounded-full animate-ping opacity-20" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Insight Bar */}
            <div className="bg-[#0a0a0b] border-t border-[#1d1d21] p-3 text-center">
                <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">
                    Internal Sales Preview Mode • Do not distribute without authorization • IP-Locked Environment
                </p>
            </div>
        </div>
    );
};
