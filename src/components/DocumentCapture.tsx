import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Check, RefreshCw, Image as ImageIcon, FileText, ScanLine } from 'lucide-react';
import Webcam from 'react-webcam';

interface DocumentCaptureProps {
    onCapture: (imageResult: string) => void;
    onCancel: () => void;
    mode?: 'inventory' | 'receipt' | 'general';
    title?: string;
}

export const DocumentCapture: React.FC<DocumentCaptureProps> = ({
    onCapture,
    onCancel,
    mode = 'general',
    title = 'Capture Document'
}) => {
    const [capturing, setCapturing] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const webcamRef = useRef<Webcam>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setPreview(imageSrc);
            setCapturing(false);
        }
    }, [webcamRef]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleConfirm = () => {
        if (preview) {
            onCapture(preview);
        }
    };

    const handleRetake = () => {
        setPreview(null);
        setCapturing(true);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-slate-200 max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                            <ScanLine size={20} className="text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">{title}</h2>
                            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                                {mode === 'inventory' ? 'AI Inventory Parser' : mode === 'receipt' ? 'Receipt Scanner' : 'Document Scanner'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2.5 bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 rounded-xl transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-6 bg-slate-100/50 flex-1 overflow-y-auto min-h-[400px] flex flex-col items-center justify-center relative">

                    {!capturing && !preview && (
                        <div className="text-center w-full max-w-md space-y-6">
                            <div className="w-24 h-24 bg-indigo-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 transform rotate-3">
                                <ScanLine size={40} className="text-indigo-600" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setCapturing(true)}
                                    className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group"
                                >
                                    <div className="p-4 bg-indigo-50 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                                        <Camera size={32} className="text-indigo-600" />
                                    </div>
                                    <span className="font-bold text-slate-700">Use Camera</span>
                                    <span className="text-xs text-slate-400 mt-1">Take a photo</span>
                                </button>

                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group"
                                >
                                    <div className="p-4 bg-emerald-50 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                                        <Upload size={32} className="text-emerald-600" />
                                    </div>
                                    <span className="font-bold text-slate-700">Upload File</span>
                                    <span className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP</span>
                                </button>
                            </div>

                            <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto leading-relaxed">
                                Take a clear photo of your {mode === 'inventory' ? 'handwritten inventory list' : 'document'} and our AI will extract the data automatically.
                            </p>
                        </div>
                    )}

                    {capturing && (
                        <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden flex items-center justify-center">
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                className="w-full h-full object-cover"
                                videoConstraints={{ facingMode: "environment" }}
                            />
                            <button
                                onClick={capture}
                                className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full border-4 border-indigo-500 flex items-center justify-center shadow-2xl hover:scale-105 transition-transform"
                            >
                                <div className="w-12 h-12 bg-indigo-600 rounded-full"></div>
                            </button>
                        </div>
                    )}

                    {preview && (
                        <div className="w-full h-full flex flex-col">
                            <div className="relative flex-1 bg-slate-900 rounded-2xl overflow-hidden mb-6 shadow-xl border border-white/10 group">
                                <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button onClick={handleRetake} className="px-6 py-2 bg-white/20 backdrop-blur text-white rounded-full font-bold hover:bg-white/30 transition-colors">
                                        Click to Retake
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleRetake}
                                    className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
                                >
                                    Retake Photo
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <Check size={16} /> Process Document
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
            />
        </div>
    );
};
