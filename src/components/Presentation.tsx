import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Disc, Network, Box, DollarSign, Bot, X, FileWarning, MonitorX, Grid3X3, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Import Assets directly from src/assets to avoid public folder issues
import chaosImg from '../assets/presentation/chaos_paperwork.png';
import legacyImg from '../assets/presentation/legacy_tech.png';
import spreadsheetsImg from '../assets/presentation/spreadsheets.png';
import titleImg from '../assets/presentation/title.png';
import archImg from '../assets/presentation/arch.png';
import inventoryImg from '../assets/presentation/inventory.png';
import financeImg from '../assets/presentation/finance.png';
import teamImg from '../assets/presentation/team_diversity.png';

const slides = [
    {
        id: 'chaos',
        title: "The Old Way",
        subtitle: "Manual Operations & Paper Chaos",
        content: "Buried under mountains of paperwork. Critical information lost in stacks of invoices. The stress of manual tracking is holding your organization back.",
        image: chaosImg,
        icon: <FileWarning size={64} className="text-rose-500" />,
        color: "from-rose-500/20"
    },
    {
        id: 'legacy',
        title: "Legacy Systems",
        subtitle: "Outdated & Disconnected",
        content: "Fighting with slow, clunky desktop software from a bygone era. Systems that don't talk to each other create silos of trapped data.",
        image: legacyImg,
        icon: <MonitorX size={64} className="text-amber-500" />,
        color: "from-amber-500/20"
    },
    {
        id: 'spreadsheets',
        title: "Excel Hell",
        subtitle: "Data Paralysis",
        content: "Running a modern enterprise on fragile spreadsheets. One broken formula can cause financial disaster. It's time to stop the copy-paste madness.",
        image: spreadsheetsImg,
        icon: <Grid3X3 size={64} className="text-red-500" />,
        color: "from-red-600/20"
    },
    {
        id: 'title',
        title: "Enter PXI-OS",
        subtitle: "The AI-Native Solution",
        content: "A unified, intelligent operating system designed to bring order to chaos. Real-time. Agentic. Future-ready.",
        image: chaosImg, // Re-using chaos temporarily? NO, Wait! I need titleImg.
        // I made a mistake in previous code, let me fix it in THIS block.
        // Wait, chaosImg is WRONG for 'Enter PXI-OS'. I must use titleImg.
        // Correcting below:
        image: titleImg,
        icon: <Disc size={64} className="text-[#00ff9d]" />,
        color: "from-emerald-500/20"
    },
    {
        id: 'arch',
        title: "Core Architecture",
        subtitle: "Cloud-First & Offline-Ready",
        content: "Built on Supabase with optimistic state management. Work anywhere, sync everywhere. Secure data flow for the modern distributed workforce.",
        image: archImg,
        icon: <Network size={64} className="text-cyan-400" />,
        color: "from-cyan-500/20"
    },
    {
        id: 'inventory',
        title: "Inventory Intelligence",
        subtitle: "Dynamic Taxonomy & Neural BoQ",
        content: "The 'Brain' of physical assets. Automating cost calculations, breaking down products into ingredients, and connecting to real-time market data.",
        image: inventoryImg,
        icon: <Box size={64} className="text-amber-400" />,
        color: "from-amber-500/20"
    },
    {
        id: 'finance',
        title: "Operational Finance",
        subtitle: "Live Gross Margin Tracking",
        content: "Real-time P&L on every event. Requisition workflows prevent pilferage. Automated invoicing converts operational events directly into financial records.",
        image: financeImg,
        icon: <DollarSign size={64} className="text-violet-400" />,
        color: "from-violet-500/20"
    },
    {
        id: 'agents',
        title: "AI & Human Synergy",
        subtitle: "Empowering Diverse Teams",
        content: "AI Agents don't replace humans; they supercharge them. Empowering a diverse, global workforce to focus on creativity while AI handles the drudgery.",
        image: teamImg,
        icon: <Users size={64} className="text-indigo-400" />,
        color: "from-indigo-500/20"
    }
];

export const Presentation = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const navigate = useNavigate();

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'Space') {
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                prevSlide();
            } else if (e.key === 'Escape') {
                navigate('/');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSlide]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    const slide = slides[currentSlide];

    return (
        <div className="fixed inset-0 bg-black text-white font-sans overflow-hidden z-[100]">

            {/* Background Image Layer with Transitions */}
            {slides.map((s, index) => (
                <div
                    key={s.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                >
                    <div className="absolute inset-0 bg-black/60 z-10" /> {/* Overlay */}
                    <img
                        src={s.image}
                        alt={s.title}
                        className="w-full h-full object-cover transform scale-105 animate-pulse-slow"
                        style={{ animationDuration: '20s' }}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-r ${s.color} to-transparent mix-blend-overlay z-20`} />
                </div>
            ))}

            <div className="absolute top-8 right-8 z-50">
                <button onClick={() => navigate('/')} className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all">
                    <X size={24} />
                </button>
            </div>

            {/* Content Content */}
            <div className="relative z-30 h-full flex flex-col justify-center px-24 max-w-7xl mx-auto">
                <div key={currentSlide} className="animate-in slide-in-from-bottom-10 fade-in duration-700">
                    <div className="flex items-center gap-6 mb-8">
                        <div className="p-6 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                            {slide.icon}
                        </div>
                        <h3 className="text-xl font-bold uppercase tracking-[0.3em] text-white/50">{slide.subtitle}</h3>
                    </div>

                    <h1 className="text-8xl font-black uppercase tracking-tight mb-12 leading-[0.9] text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 drop-shadow-2xl">
                        {slide.title}
                    </h1>

                    <p className="text-3xl font-light text-slate-200 max-w-3xl leading-relaxed border-l-4 border-[#00ff9d] pl-8">
                        {slide.content}
                    </p>
                </div>
            </div>

            {/* Progress Bar & Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-12 z-30 flex justify-between items-end">
                <div className="flex gap-2">
                    {slides.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentSlide ? 'w-16 bg-[#00ff9d]' : 'w-4 bg-white/20'}`}
                        />
                    ))}
                </div>

                <div className="flex gap-4">
                    <button onClick={prevSlide} className="p-4 rounded-full border border-white/10 hover:bg-white/10 transition-all text-white/50 hover:text-white">
                        <ChevronLeft size={32} />
                    </button>
                    <button onClick={nextSlide} className="p-4 rounded-full bg-[#00ff9d] text-black hover:bg-[#00cc7d] transition-all hover:scale-110 active:scale-95">
                        <ChevronRight size={32} />
                    </button>
                </div>
            </div>

            <div className="absolute top-8 left-10 z-30 opacity-30">
                <div className="text-[10px] font-black uppercase tracking-widest">PXI-OS System Overview</div>
            </div>

        </div>
    );
};
