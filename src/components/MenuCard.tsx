import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { CheckCircle2, Info, X, Minus, Plus } from 'lucide-react';

interface MenuCardProps {
    item: InventoryItem;
    qty: number;
    guestCount: number;
    updateQty: (id: string, qty: number) => void;
}

export const MenuCard = ({ item, qty, guestCount, updateQty }: MenuCardProps) => {
    const [showInfo, setShowInfo] = useState(false);
    const isSelected = qty > 0;

    const handleCardClick = (e: React.MouseEvent) => {
        // If viewing info, don't toggle selection
        if (showInfo) return;

        // Default behavior: Toggle selection (0 or max)
        isSelected ? updateQty(item.id, 0) : updateQty(item.id, guestCount);
    };

    return (
        <div
            onClick={handleCardClick}
            className={`
                min-w-[75vw] md:min-w-0 snap-center shrink-0
                group bg-white rounded-[1.5rem] md:rounded-[2.5rem] border-2 transition-all overflow-hidden flex flex-col h-full cursor-pointer relative
                ${isSelected ? 'border-indigo-600 shadow-xl ring-2 ring-indigo-50' : 'border-slate-100 shadow-sm'}
            `}
        >
            {/* Image Area */}
            <div className="h-14 md:h-32 w-full relative overflow-hidden bg-slate-50 shrink-0">
                <img
                    src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800'}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    alt={item.name}
                />

                {/* Selection Indicator */}
                {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 md:w-6 md:h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg animate-in zoom-in z-20">
                        <CheckCircle2 size={12} className="md:w-3 md:h-3" />
                    </div>
                )}

                {/* Info Button - Toggles Overlay */}
                <button
                    onClick={(e) => { e.stopPropagation(); setShowInfo(true); }}
                    className="absolute top-1.5 left-1.5 w-7 h-7 md:w-6 md:h-6 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-indigo-600 hover:bg-white hover:scale-110 transition-all shadow-sm z-20"
                >
                    <Info size={14} className="md:w-3 md:h-3" />
                </button>

                {/* INFO OVERLAY */}
                {showInfo && (
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute inset-0 bg-white/95 backdrop-blur z-[40] p-3 md:p-4 flex flex-col animate-in fade-in slide-in-from-bottom-5"
                    >
                        <div className="flex justify-between items-start mb-1 md:mb-2">
                            <h4 className="text-[10px] md:text-sm font-black uppercase tracking-tight text-slate-900 leading-tight break-words pr-2">{item.name}</h4>
                            <button onClick={() => setShowInfo(false)} className="p-0.5 md:p-1 bg-rose-50 rounded-full text-rose-500 hover:bg-rose-100 shrink-0"><X size={14} className="md:w-3.5 md:h-3.5" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            <p className="text-[10px] md:text-xs text-slate-600 font-medium leading-tight whitespace-pre-wrap">
                                {item.description || 'No detailed description available.'}
                            </p>
                        </div>
                        <div className="pt-1.5 md:pt-2 mt-1 border-t border-slate-100 text-[8px] md:text-[8px] text-slate-400 font-bold uppercase tracking-widest text-center">
                            Close
                        </div>
                    </div>
                )}
            </div>

            {/* Content Body */}
            <div className="p-2 md:p-4 flex-1 flex flex-col min-h-0">
                <h4 className="text-[10px] md:text-sm font-black uppercase tracking-tight text-slate-900 mb-0.5 leading-tight">{item.name}</h4>

                {/* Description helper - Clicking this also opens info */}
                <p
                    onClick={(e) => { e.stopPropagation(); setShowInfo(true); }}
                    className="text-[8px] md:text-[9px] text-slate-500 font-bold uppercase mb-2 leading-tight hover:text-indigo-600 transition-colors whitespace-pre-wrap break-words line-clamp-2 md:line-clamp-none"
                >
                    {item.description}
                </p>

                <div onClick={(e) => e.stopPropagation()} className="mt-auto space-y-1 p-1.5 md:p-3 bg-slate-50 rounded-lg md:rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-0.5 md:mb-0">
                        <p className="text-[10px] md:text-xs font-black text-slate-950">₦{(item.priceCents / 100).toLocaleString()}</p>
                        <input
                            type="number"
                            className="w-10 md:w-16 bg-white border border-slate-200 rounded md:rounded-lg py-0 md:py-0.5 text-center text-[9px] md:text-[10px] font-black text-slate-950 outline-none focus:border-indigo-500 shadow-sm"
                            value={qty}
                            max={999}
                            onChange={(e) => updateQty(item.id, parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <div className="flex items-center gap-1 md:gap-2">
                        <div className="p-1 bg-white border border-slate-200 rounded shadow-sm active:scale-95 transition-transform cursor-pointer" onClick={() => updateQty(item.id, Math.max(0, qty - 5))}>
                            <Minus size={10} className="text-slate-400 md:w-2.5 md:h-2.5 md:text-slate-300" />
                        </div>

                        <input
                            type="range"
                            min="0"
                            max={Math.max(guestCount * 2, 200)}
                            step="5"
                            className="flex-1 accent-indigo-600 h-1 md:h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            value={qty}
                            onChange={(e) => updateQty(item.id, parseInt(e.target.value))}
                        />
                        <div className="p-1 bg-white border border-slate-200 rounded shadow-sm active:scale-95 transition-transform cursor-pointer" onClick={() => updateQty(item.id, qty + 5)}>
                            <Plus size={10} className="text-slate-400 md:w-2.5 md:h-2.5 md:text-slate-300" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
