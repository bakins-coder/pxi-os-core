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
                min-w-[85vw] md:min-w-0 snap-center shrink-0
                group bg-white rounded-[1.5rem] md:rounded-[2.5rem] border-2 transition-all overflow-hidden flex flex-col h-full cursor-pointer relative
                ${isSelected ? 'border-indigo-600 shadow-xl ring-2 ring-indigo-50' : 'border-slate-100 shadow-sm'}
            `}
        >
            {/* Image Area */}
            <div className="h-40 md:h-32 w-full relative overflow-hidden bg-slate-50 shrink-0">
                <img
                    src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800'}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    alt={item.name}
                />

                {/* Selection Indicator */}
                {isSelected && (
                    <div className="absolute top-3 right-3 w-8 h-8 md:w-6 md:h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg animate-in zoom-in z-10">
                        <CheckCircle2 size={16} className="md:w-3 md:h-3" />
                    </div>
                )}

                {/* Info Button - Toggles Overlay */}
                <button
                    onClick={(e) => { e.stopPropagation(); setShowInfo(true); }}
                    className="absolute top-3 left-3 w-10 h-10 md:w-6 md:h-6 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-indigo-600 hover:bg-white hover:scale-110 transition-all shadow-sm z-10"
                >
                    <Info size={20} className="md:w-3 md:h-3" />
                </button>

                {/* INFO OVERLAY */}
                {showInfo && (
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute inset-0 bg-white/95 backdrop-blur z-30 p-6 md:p-4 flex flex-col animate-in fade-in slide-in-from-bottom-5"
                    >
                        <div className="flex justify-between items-start mb-4 md:mb-2">
                            <h4 className="text-lg md:text-sm font-black uppercase tracking-tight text-slate-900 leading-tight">{item.name}</h4>
                            <button onClick={() => setShowInfo(false)} className="p-2 md:p-1 bg-rose-50 rounded-full text-rose-500 hover:bg-rose-100"><X size={20} className="md:w-3.5 md:h-3.5" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            <p className="text-sm md:text-xs text-slate-600 font-medium leading-relaxed">
                                {item.description || 'No detailed description available for this item.'}
                            </p>
                        </div>
                        <div className="pt-4 md:pt-2 mt-2 border-t border-slate-100 text-[10px] md:text-[8px] text-slate-400 font-bold uppercase tracking-widest text-center">
                            Close to Add to Order
                        </div>
                    </div>
                )}
            </div>

            {/* Content Body */}
            <div className="p-5 md:p-4 flex-1 flex flex-col">
                <h4 className="text-sm md:text-sm font-black uppercase tracking-tight text-slate-900 mb-2 leading-tight">{item.name}</h4>

                {/* Description helper - Clicking this also opens info */}
                <p
                    onClick={(e) => { e.stopPropagation(); setShowInfo(true); }}
                    className="text-[10px] md:text-[9px] text-slate-500 font-bold uppercase mb-4 leading-relaxed hover:text-indigo-600 transition-colors line-clamp-2"
                >
                    {item.description}
                </p>

                <div onClick={(e) => e.stopPropagation()} className="mt-auto space-y-1 p-2 md:p-3 bg-slate-50 rounded-xl md:rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-2 md:mb-0">
                        <p className="text-sm md:text-xs font-black text-slate-950">₦{(item.priceCents / 100).toLocaleString()}</p>
                        <input
                            type="number"
                            className="w-16 md:w-16 bg-white border border-slate-200 rounded-lg md:rounded-lg py-1 md:py-0.5 text-center text-xs md:text-[10px] font-black text-slate-950 outline-none focus:border-indigo-500 shadow-sm"
                            value={qty}
                            max={guestCount}
                            onChange={(e) => updateQty(item.id, parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <div className="flex items-center gap-2 md:gap-2">
                        <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm active:scale-95 transition-transform" onClick={() => updateQty(item.id, Math.max(0, qty - 5))}>
                            <Minus size={16} className="text-slate-400 md:w-2.5 md:h-2.5 md:text-slate-300" />
                        </div>

                        <input
                            type="range"
                            min="0"
                            max={guestCount}
                            step="5"
                            className="flex-1 accent-indigo-600 h-2 md:h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            value={qty}
                            onChange={(e) => updateQty(item.id, parseInt(e.target.value))}
                        />
                        <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm active:scale-95 transition-transform" onClick={() => updateQty(item.id, Math.min(guestCount, qty + 5))}>
                            <Plus size={16} className="text-slate-400 md:w-2.5 md:h-2.5 md:text-slate-300" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
