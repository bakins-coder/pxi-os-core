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

    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=1200,height=800');
        if (!printWindow) {
            alert("Pop-up blocked! Please allow pop-ups to export the presentation.");
            return;
        }

        // Helper to ensure image paths are absolute (Vite dev paths like /src/assets/... need origin)
        const getAbsUrl = (url: string) => {
            if (url.startsWith('data:') || url.startsWith('http')) return url;
            return window.location.origin + (url.startsWith('/') ? '' : '/') + url;
        };

        const slidesHTML = slides.map(s => `
            <div class="slide">
                <img src="${getAbsUrl(s.image as unknown as string)}" class="bg" onload="this.setAttribute('loaded', 'true')" />
                <div class="overlay"></div>
                <div class="content">
                    <div class="subtitle">${s.subtitle}</div>
                    <div class="title">${s.title}</div>
                    <div class="text">${s.content}</div>
                </div>
                <div class="footer">PXI-OS Presentation Deck — ${s.title}</div>
            </div>
        `).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>PXI-OS Presentation Deck</title>
                    <base href="${window.location.origin}/">
                    <style>
                        @page { size: landscape; margin: 0; }
                        body { margin: 0; padding: 0; background: #fff; font-family: sans-serif; overflow-x: hidden; }
                        .slide {
                            position: relative;
                            width: 100vw;
                            height: 100vh;
                            overflow: hidden;
                            background: #000;
                            page-break-after: always;
                            break-after: page;
                        }
                        .bg {
                            position: absolute;
                            inset: 0;
                            width: 100%;
                            height: 100%;
                            object-fit: cover;
                            opacity: 0.8; /* Slightly dimmed for print clarity */
                        }
                        .overlay {
                            position: absolute;
                            inset: 0;
                            background: linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 100%);
                            z-index: 1;
                        }
                        .content {
                            position: relative;
                            z-index: 2;
                            height: 100%;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            padding: 0 10%;
                            color: white;
                        }
                        .title {
                            font-size: 60pt;
                            font-weight: 900;
                            text-transform: uppercase;
                            margin: 10pt 0 20pt 0;
                            line-height: 1;
                            font-family: Arial, sans-serif;
                            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                        }
                        .subtitle {
                            font-size: 20pt;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 0.2em;
                            margin: 0;
                            color: #00ff9d;
                            font-family: Arial, sans-serif;
                        }
                        .text {
                            font-size: 24pt;
                            line-height: 1.3;
                            max-width: 80%;
                            border-left: 6pt solid #00ff9d;
                            padding-left: 25pt;
                            font-family: Arial, sans-serif;
                        }
                        .footer {
                            position: absolute;
                            bottom: 30px;
                            right: 40px;
                            color: rgba(255,255,255,0.6);
                            font-size: 10pt;
                            z-index: 3;
                            text-transform: uppercase;
                            font-weight: bold;
                            letter-spacing: 0.1em;
                        }
                    </style>
                </head>
                <body>
                    ${slidesHTML}
                    <script>
                        // Wait for images to load before printing
                        window.onload = () => {
                            const imgs = Array.from(document.querySelectorAll('img'));
                            const checkLoaded = () => {
                                const allLoaded = imgs.every(img => img.complete && img.naturalHeight !== 0);
                                if (allLoaded) {
                                    setTimeout(() => {
                                        window.print();
                                        // Optional: window.close(); 
                                    }, 500);
                                } else {
                                    setTimeout(checkLoaded, 500);
                                }
                            };
                            checkLoaded();
                        };
                        // Safe fallback
                        setTimeout(() => window.print(), 5000);
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const slide = slides[currentSlide];

    return (
        <div className="fixed inset-0 bg-black text-white font-sans overflow-hidden z-[100]">
            <style>{`
                @media print {
                    header, aside, .Layout_header, .Layout_aside { display: none !important; }
                }
            `}</style>

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

            <div className="absolute top-8 right-8 z-50 flex gap-4">
                {/* Print/Download Button */}
                <button onClick={handlePrint} className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all group" title="Download / Print">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white group-hover:text-[#00ff9d]"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                </button>
                <button onClick={() => navigate('/')} className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all text-white hover:text-rose-500">
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

        </div >
    );
};
