import React, { useRef, useEffect, useState } from 'react';
import {
    X, Plus, Minus, Palette, Edit3, Save, Share2,
    Layers, MousePointer2, Trash2, Download, UploadCloud,
    CheckCircle2, AlertCircle, Sparkles, Wand2, ExternalLink
} from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { uploadEntityImage } from '../services/supabase';
import { generateCakeImage } from '../services/ai';

interface Tier {
    id: string;
    width: number;
    height: number;
    color: string;
    shape: 'Round' | 'Square';
    yOffset: number;
}

interface CakeDesignerProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (imageUrl: string) => void;
    initialData?: string; // Optional: load existing design image
}

export const CakeDesigner: React.FC<CakeDesignerProps> = ({
    isOpen,
    onClose,
    onSave,
    initialData
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sketchCanvasRef = useRef<HTMLCanvasElement>(null);
    const org = useSettingsStore(s => s.settings);

    const [tiers, setTiers] = useState<Tier[]>([
        { id: '1', width: 220, height: 100, color: '#ffffff', shape: 'Round', yOffset: 0 },
        { id: '2', width: 160, height: 80, color: '#ffffff', shape: 'Round', yOffset: 0 },
        { id: '3', width: 100, height: 60, color: '#ffffff', shape: 'Round', yOffset: 0 }
    ]);

    const [activeTool, setActiveTool] = useState<'tiers' | 'sketch' | 'style' | 'ai'>('tiers');
    const [sketchColor, setSketchColor] = useState('#ff6b6b');
    const [isDrawing, setIsDrawing] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [aiPrompt, setAiPrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [showAiBackdrop, setShowAiBackdrop] = useState(true);

    // Render 3D Illusion
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Render tiers in order (Base to Top)
        const sortedTiers = [...tiers];
        let currentY = canvas.height - 100;

        sortedTiers.forEach((tier, index) => {
            renderTier(ctx, tier, canvas.width / 2, currentY);
            currentY -= tier.height;
        });

    }, [tiers]);

    const renderTier = (ctx: CanvasRenderingContext2D, tier: Tier, centerX: number, bottomY: number) => {
        const { width, height, color, shape } = tier;
        const rx = width / 2;
        const ry = rx * 0.4; // Perspective ratio

        ctx.save();

        if (shape === 'Round') {
            // Draw Side Area (Gradient for 3D look)
            const sideGrad = ctx.createLinearGradient(centerX - rx, 0, centerX + rx, 0);
            sideGrad.addColorStop(0, darkenColor(color, 20));
            sideGrad.addColorStop(0.3, color);
            sideGrad.addColorStop(0.7, color);
            sideGrad.addColorStop(1, darkenColor(color, 30));

            ctx.fillStyle = sideGrad;
            ctx.beginPath();
            // Bottom front arc
            ctx.ellipse(centerX, bottomY, rx, ry, 0, 0, Math.PI);
            // Left vertical line up
            ctx.lineTo(centerX - rx, bottomY - height);
            // Top front arc (bottom half of top ellipse)
            ctx.ellipse(centerX, bottomY - height, rx, ry, 0, Math.PI, 0, true);
            // Right vertical line down
            ctx.lineTo(centerX + rx, bottomY);
            ctx.fill();

            // Draw Top Face
            ctx.fillStyle = lightenColor(color, 10);
            ctx.beginPath();
            ctx.ellipse(centerX, bottomY - height, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = darkenColor(color, 10);
            ctx.lineWidth = 1;
            ctx.stroke();
        } else {
            // Square logic (isometric box)
            const faceWidth = rx * 1.2;
            const topOffset = ry * 1.5;

            // Draw Left Face
            ctx.fillStyle = darkenColor(color, 15);
            ctx.beginPath();
            ctx.moveTo(centerX, bottomY);
            ctx.lineTo(centerX - faceWidth, bottomY - topOffset / 2);
            ctx.lineTo(centerX - faceWidth, bottomY - height - topOffset / 2);
            ctx.lineTo(centerX, bottomY - height);
            ctx.closePath();
            ctx.fill();

            // Draw Right Face
            ctx.fillStyle = darkenColor(color, 25);
            ctx.beginPath();
            ctx.moveTo(centerX, bottomY);
            ctx.lineTo(centerX + faceWidth, bottomY - topOffset / 2);
            ctx.lineTo(centerX + faceWidth, bottomY - height - topOffset / 2);
            ctx.lineTo(centerX, bottomY - height);
            ctx.closePath();
            ctx.fill();

            // Draw Top Face
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(centerX, bottomY - height);
            ctx.lineTo(centerX - faceWidth, bottomY - height - topOffset / 2);
            ctx.lineTo(centerX, bottomY - height - topOffset);
            ctx.lineTo(centerX + faceWidth, bottomY - height - topOffset / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        ctx.restore();
    };

    const darkenColor = (hex: string, percent: number) => {
        const num = parseInt(hex.replace('#', ''), 16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) - amt,
            G = (num >> 8 & 0x00FF) - amt,
            B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R < 255 ? R < 0 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 0 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 0 ? 0 : B : 255)).toString(16).slice(1);
    };

    const lightenColor = (hex: string, percent: number) => {
        const num = parseInt(hex.replace('#', ''), 16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) + amt,
            G = (num >> 8 & 0x00FF) + amt,
            B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 0 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 0 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 0 ? 0 : B : 255)).toString(16).slice(1);
    };

    const startDrawing = (e: React.MouseEvent) => {
        if (activeTool !== 'sketch') return;
        const canvas = sketchCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing || activeTool !== 'sketch') return;
        const canvas = sketchCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.strokeStyle = sketchColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
    };

    const handleSave = async () => {
        setIsSyncing(true);
        setStatusMessage(null);
        try {
            const canvas = canvasRef.current;
            const sketch = sketchCanvasRef.current;
            if (!canvas || !sketch) return;

            // Combine canvases
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = canvas.width;
            finalCanvas.height = canvas.height;
            const fCtx = finalCanvas.getContext('2d');
            if (!fCtx) return;

            fCtx.fillStyle = '#ffffff';
            fCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

            // Draw AI Backdrop if it exists
            if (generatedImage) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = generatedImage;
                await new Promise((resolve) => {
                    img.onload = () => {
                        fCtx.globalAlpha = 0.4; // Match UI opacity
                        fCtx.drawImage(img, 0, 0, finalCanvas.width, finalCanvas.height);
                        fCtx.globalAlpha = 1.0;
                        resolve(null);
                    };
                    img.onerror = () => resolve(null); // Fallback to no backdrop if load fails
                });
            }

            fCtx.drawImage(canvas, 0, 0);
            fCtx.drawImage(sketch, 0, 0);

            const imageData = finalCanvas.toDataURL('image/jpeg', 0.8);

            // Upload to Supabase
            const { path } = await uploadEntityImage(
                org.id,
                'cake_design',
                crypto.randomUUID(),
                imageData
            );

            const fullUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product_media/${path}`;
            onSave(fullUrl);
            setStatusMessage({ type: 'success', text: 'Design saved successfully!' });
            setTimeout(onClose, 1500);
        } catch (err) {
            console.error('Save failed:', err);
            setStatusMessage({ type: 'error', text: 'Failed to save design.' });
        } finally {
            setIsSyncing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-7xl h-[90vh] rounded-[3rem] shadow-2xl flex overflow-hidden relative">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 z-50 w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all shadow-lg"
                >
                    <X size={24} />
                </button>

                {/* Left Sidebar: Controls */}
                <div className="w-96 bg-slate-50 border-r border-slate-100 flex flex-col p-8 space-y-8 overflow-y-auto">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-white">
                            <Palette size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Cake Designer</h2>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">3D Sketcher</p>
                        </div>
                    </div>

                    {/* Tool Selection */}
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { id: 'tiers', label: 'Tiers', icon: Layers },
                            { id: 'style', label: 'Style', icon: Palette },
                            { id: 'sketch', label: 'Sketch', icon: Edit3 },
                            { id: 'ai', label: 'AI Assistant', icon: Sparkles }
                        ].map(tool => (
                            <button
                                key={tool.id}
                                onClick={() => setActiveTool(tool.id as any)}
                                className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all border ${activeTool === tool.id
                                    ? 'bg-slate-950 text-white border-slate-950 shadow-xl scale-105'
                                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                                    }`}
                            >
                                <tool.icon size={20} className={activeTool === tool.id ? 'animate-pulse text-[#00ff9d]' : ''} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{tool.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 space-y-6">
                        {activeTool === 'tiers' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Stack Management</h3>
                                {tiers.map((tier, idx) => (
                                    <div key={tier.id} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Tier {tiers.length - idx}</span>
                                            <button
                                                onClick={() => setTiers(tiers.filter(t => t.id !== tier.id))}
                                                className="text-slate-300 hover:text-rose-500 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Width: {tier.width}px</label>
                                                <input
                                                    type="range" min="50" max="300" step="10" value={tier.width}
                                                    onChange={e => setTiers(tiers.map(t => t.id === tier.id ? { ...t, width: parseInt(e.target.value) } : t))}
                                                    className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Height: {tier.height}px</label>
                                                <input
                                                    type="range" min="40" max="200" step="10" value={tier.height}
                                                    onChange={e => setTiers(tiers.map(t => t.id === tier.id ? { ...t, height: parseInt(e.target.value) } : t))}
                                                    className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setTiers([{ id: Date.now().toString(), width: 100, height: 60, color: '#ffffff', shape: 'Round', yOffset: 0 }, ...tiers])}
                                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:border-slate-800 hover:text-slate-800 transition-all font-black uppercase text-[10px] tracking-widest"
                                >
                                    <Plus size={16} /> Add Tier
                                </button>
                            </div>
                        )}

                        {activeTool === 'sketch' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Piping & Freehand</h3>
                                <div className="grid grid-cols-6 gap-2">
                                    {['#ff6b6b', '#4ecdc4', '#ffe66d', '#1a535c', '#f7fff7', '#000000'].map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setSketchColor(c)}
                                            style={{ backgroundColor: c }}
                                            className={`w-full aspect-square rounded-lg border-2 ${sketchColor === c ? 'border-slate-900 shadow-lg' : 'border-white'}`}
                                        />
                                    ))}
                                </div>
                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-900 text-[10px] font-medium leading-relaxed">
                                    Draw directly on the preview area to design patterns, lace, or write text for the customer.
                                </div>
                                <button
                                    onClick={() => {
                                        const ctx = sketchCanvasRef.current?.getContext('2d');
                                        if (ctx) ctx.clearRect(0, 0, 600, 800);
                                    }}
                                    className="w-full py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all"
                                >
                                    Clear Sketch
                                </button>
                            </div>
                        )}

                        {activeTool === 'style' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Global Icing Colors</h3>
                                <div className="space-y-3">
                                    {tiers.map((tier, idx) => (
                                        <div key={tier.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tier {tiers.length - idx}</span>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color" value={tier.color}
                                                    onChange={e => setTiers(tiers.map(t => t.id === tier.id ? { ...t, color: e.target.value } : t))}
                                                    className="w-8 h-8 rounded cursor-pointer p-0 border-0 bg-transparent"
                                                />
                                                <select
                                                    value={tier.shape}
                                                    onChange={e => setTiers(tiers.map(t => t.id === tier.id ? { ...t, shape: e.target.value as any } : t))}
                                                    className="text-[10px] font-black uppercase tracking-widest border-0 p-1 bg-slate-50 rounded"
                                                >
                                                    <option>Round</option>
                                                    <option>Square</option>
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTool === 'ai' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                                <div className="space-y-2">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Wand2 size={14} className="text-indigo-500" /> AI Concept Engine
                                    </h3>
                                    <p className="text-[10px] text-slate-600 font-medium leading-relaxed">Describe your dream cake and our AI will generate a high-fidelity visual concept for you.</p>
                                </div>

                                <textarea
                                    value={aiPrompt}
                                    onChange={e => setAiPrompt(e.target.value)}
                                    placeholder="e.g. A 3-tier lavender wedding cake with gold leaf accents and cascading white roses..."
                                    className="w-full p-4 bg-white border-2 border-indigo-100 rounded-2xl text-xs font-bold text-slate-900 focus:border-indigo-500 outline-none min-h-[120px] resize-none placeholder:text-slate-400"
                                />

                                <div className="flex gap-2">
                                    <button
                                        onClick={async () => {
                                            if (!aiPrompt.trim()) return;
                                            setIsGenerating(true);
                                            setImageError(false);
                                            try {
                                                const url = await generateCakeImage(aiPrompt);
                                                setGeneratedImage(url);
                                                setIsImageLoading(true);
                                            } finally {
                                                setIsGenerating(false);
                                            }
                                        }}
                                        disabled={isGenerating || !aiPrompt.trim()}
                                        className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={14} /> {generatedImage ? 'Regenerate' : 'Generate Concept'}
                                            </>
                                        )}
                                    </button>

                                    {generatedImage && (
                                        <button
                                            onClick={() => window.open(generatedImage, '_blank')}
                                            className="p-4 bg-slate-100 text-slate-400 rounded-2xl border border-slate-200 hover:text-indigo-600 hover:bg-white transition-all"
                                            title="Open Original"
                                        >
                                            <ExternalLink size={14} />
                                        </button>
                                    )}
                                </div>

                                {generatedImage && (
                                    <div className="space-y-3 pt-4 border-t border-slate-100">
                                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            <span>AI Concept</span>
                                            <div className="flex items-center gap-2">
                                                <span>Visible</span>
                                                <button
                                                    onClick={() => setShowAiBackdrop(!showAiBackdrop)}
                                                    className={`w-8 h-4 rounded-full relative transition-colors ${showAiBackdrop ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                                >
                                                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${showAiBackdrop ? 'left-4.5' : 'left-0.5'}`} style={{ left: showAiBackdrop ? '1.125rem' : '0.125rem' }}></div>
                                                </button>
                                            </div>
                                        </div>
                                        <div
                                            className="relative rounded-2xl overflow-hidden border-2 border-indigo-100 shadow-sm bg-slate-100 min-h-[220px] flex items-center justify-center group"
                                        >
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-2">
                                                <Sparkles size={32} className={isGenerating ? 'animate-pulse' : ''} />
                                                <span className="text-[8px] font-black uppercase tracking-widest">{isGenerating ? 'Generating...' : 'Concept Gallery'}</span>
                                            </div>

                                            {generatedImage && (
                                                <img
                                                    key={generatedImage}
                                                    src={generatedImage}
                                                    alt="AI Concept"
                                                    className="w-full h-auto relative z-10 transition-opacity duration-700"
                                                    onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                                                    onError={(e) => {
                                                        console.error('AI Image load failed');
                                                        // Attempt fallback if needed
                                                    }}
                                                />
                                            )}

                                            {/* Control Overlay - Always Visible */}
                                            <div className="absolute inset-x-0 bottom-0 p-3 bg-slate-900/60 backdrop-blur-md flex flex-wrap gap-2 items-center justify-center z-20">
                                                <button
                                                    onClick={() => setShowAiBackdrop(true)}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-2 ${showAiBackdrop ? 'bg-[#00ff9d] text-slate-950 border-2 border-[#00ff9d]' : 'bg-white text-slate-900 hover:bg-slate-50'}`}
                                                >
                                                    <Sparkles size={12} />
                                                    {showAiBackdrop ? 'Active' : 'Apply'}
                                                </button>

                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setGeneratedImage(null); }}
                                                    className="p-2 bg-rose-500 text-white rounded-xl shadow-xl hover:bg-rose-600 transition-all flex items-center justify-center"
                                                    title="Remove"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="pt-8 border-t border-slate-100 space-y-3">
                        {statusMessage && (
                            <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in zoom-in-95 ${statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                }`}>
                                {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                <span className="text-[10px] font-black uppercase tracking-widest">{statusMessage.text}</span>
                            </div>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={isSyncing}
                            className={`w-full py-5 bg-slate-950 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 shadow-2xl transition-all ${isSyncing ? 'opacity-50 cursor-wait' : 'hover:scale-[1.02] active:scale-95'
                                }`}
                        >
                            {isSyncing ? <UploadCloud className="animate-bounce" size={18} /> : <Save size={18} />}
                            {isSyncing ? 'Uploading...' : 'Finalize & Attach Design'}
                        </button>
                    </div>
                </div>

                {/* Right Area: Preview Canvas */}
                <div className="flex-1 bg-slate-100 relative overflow-hidden flex flex-col">
                    {/* Floating Info Badge - Pinned to the top left of the view area */}
                    <div className="absolute top-8 left-8 p-4 bg-white/80 backdrop-blur rounded-2xl border border-white/20 shadow-xl z-30">
                        <div className="flex items-center gap-2 text-slate-800">
                            <MousePointer2 size={14} className="animate-pulse" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Preview Mode: {activeTool.toUpperCase()}</span>
                        </div>
                    </div>

                    {/* Scrollable Canvas Container */}
                    <div className="flex-1 overflow-y-auto p-8 md:p-12 scrollbar-thin">
                        <div className="min-h-full flex items-center justify-center relative">
                            {/* Branding Watermark - positioned relative to content */}
                            <div className="absolute bottom-4 right-4 text-slate-300 font-black uppercase tracking-[0.2em] text-[4rem] pointer-events-none select-none opacity-20 z-0">
                                {org.name || 'Smart Platform'}
                            </div>

                            <div className="relative shadow-2xl rounded-[3rem] overflow-hidden bg-slate-50 border-8 border-white shrink-0 z-10" style={{ width: 600, height: 800 }}>
                                {/* AI Backdrop - correctly layered and more visible */}
                                {generatedImage && showAiBackdrop && (
                                    <div className={`absolute inset-0 z-0 transition-opacity duration-1000 flex items-center justify-center bg-slate-50 pointer-events-none ${isImageLoading ? 'opacity-50' : 'opacity-100'}`}>
                                        <img
                                            key={`backdrop-${generatedImage}`}
                                            src={generatedImage}
                                            alt="AI Concept"
                                            className={`w-full h-full object-contain ${imageError ? 'hidden' : 'opacity-90'}`}
                                            onLoad={() => setIsImageLoading(false)}
                                            onError={() => {
                                                setIsImageLoading(false);
                                                setImageError(true);
                                            }}
                                        />
                                        {isImageLoading && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm animate-pulse">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Wand2 size={32} className="text-indigo-400 animate-bounce" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Drafting Concept...</span>
                                                </div>
                                            </div>
                                        )}
                                        {imageError && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 pointer-events-auto z-[25]">
                                                <div className="flex flex-col items-center gap-4 text-slate-400 p-8 text-center">
                                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                                                        <AlertCircle size={24} className="text-slate-300" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold text-slate-600">AI Component Unreachable</p>
                                                        <p className="text-[10px] leading-relaxed">Your network might be blocking the AI provider. Try a reference photo instead?</p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const keywords = aiPrompt.split(' ').slice(0, 3).join(',');
                                                            const fallbackUrl = `https://source.unsplash.com/featured/800x1000/?wedding,cake,${encodeURIComponent(keywords)}`;
                                                            setGeneratedImage(fallbackUrl);
                                                            setImageError(false);
                                                            setIsImageLoading(true);
                                                        }}
                                                        className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                                                    >
                                                        Show Reference Photo
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-white/20 pointer-events-none"></div>
                                    </div>
                                )}

                                {/* 3D Tier Canvas */}
                                <canvas
                                    ref={canvasRef}
                                    width={600} height={800}
                                    className="absolute inset-0 pointer-events-none z-10"
                                />
                                {/* Interactive Sketch Layer */}
                                <canvas
                                    ref={sketchCanvasRef}
                                    width={600} height={800}
                                    className={`absolute inset-0 cursor-crosshair transition-opacity z-20 ${activeTool === 'sketch' ? 'opacity-100' : 'opacity-70 pointer-events-none'}`}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={() => setIsDrawing(false)}
                                    onMouseLeave={() => setIsDrawing(false)}
                                />

                                {/* AI Badge - when using AI assist */}
                                {generatedImage && (
                                    <div className="absolute bottom-8 right-8 z-30 py-2 px-4 bg-indigo-600/90 backdrop-blur-md text-white rounded-full flex items-center gap-2 border border-white/20 shadow-2xl animate-in slide-in-from-bottom-4">
                                        <Sparkles size={14} className="text-[#00ff9d]" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">AI Assisted Concept</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
