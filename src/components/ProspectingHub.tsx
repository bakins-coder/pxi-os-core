
import React, { useState } from 'react';
import { 
   Search, Target, Globe, Mail, Eye, Sparkles, 
   ArrowRight, Zap, RefreshCw, Layers, Shield,
   MapPin, Briefcase, BarChart3, Filter
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { Lead } from '../types';

export const ProspectingHub: React.FC = () => {
    const { leads, aiAgents, scrapeLeads, generateMockup, sendDemoEmail } = useDataStore();
    const [niche, setNiche] = useState('');
    const [location, setLocation] = useState('');
    const [isScraping, setIsScraping] = useState(false);
    const [filter, setFilter] = useState<'All' | 'New' | 'Ready' | 'Sent'>('All');

    const handleScrape = async () => {
        if (!niche || !location) return;
        setIsScraping(true);
        await scrapeLeads(niche, location);
        setIsScraping(false);
        setNiche('');
        setLocation('');
    };

    const filteredLeads = leads.filter(l => {
        if (filter === 'All') return true;
        if (filter === 'New') return l.status === 'New';
        if (filter === 'Ready') return l.demoStatus === 'Ready';
        if (filter === 'Sent') return l.demoStatus === 'Sent';
        return true;
    });

    const stats = {
        total: leads.length,
        potential: leads.filter(l => l.interestLevel === 'High').length,
        ready: leads.filter(l => l.demoStatus === 'Ready').length,
        sent: leads.filter(l => l.demoStatus === 'Sent').length
    };

    return (
        <div className="p-8 space-y-8 bg-[#0a0a0b] min-h-screen text-white">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                        Prospecting Intelligence
                    </h1>
                    <p className="text-gray-400 text-lg">Autonomous lead generation & prototype engine</p>
                </div>
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 px-6 py-3 bg-[#1d1d21] border border-[#2d2d33] rounded-xl hover:border-[#00ff9d] transition-all text-sm font-medium">
                        <BarChart3 className="w-4 h-4 text-[#00ff9d]" />
                        Funnel Analytics
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Prospects', value: stats.total, icon: Target, color: '#00ff9d' },
                    { label: 'High Intent', value: stats.potential, icon: Sparkles, color: '#a855f7' },
                    { label: 'Prototypes Ready', value: stats.ready, icon: Globe, color: '#3b82f6' },
                    { label: 'Demos Sent', value: stats.sent, icon: Mail, color: '#f59e0b' },
                ].map((stat, i) => (
                    <div key={i} className="bg-[#121217] border border-[#1d1d21] p-6 rounded-2xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                            <h3 className="text-3xl font-bold">{stat.value}</h3>
                        </div>
                        <stat.icon 
                            className="absolute -right-4 -bottom-4 w-24 h-24 opacity-5 group-hover:opacity-10 transition-all" 
                            style={{ color: stat.color }}
                        />
                    </div>
                ))}
            </div>

            {/* Search Controls */}
            <div className="bg-[#121217] border border-[#1d1d21] p-8 rounded-3xl space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-5 h-5 text-[#00ff9d]" />
                    <h2 className="text-xl font-semibold">Initiate Autonomous Discovery</h2>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input 
                            value={niche}
                            onChange={(e) => setNiche(e.target.value)}
                            placeholder="Industry niche (e.g. Real Estate, Law Firms)"
                            className="w-full bg-[#0a0a0b] border border-[#2d2d33] rounded-2xl py-4 pl-12 pr-4 focus:border-[#00ff9d] focus:ring-1 focus:ring-[#00ff9d] outline-none transition-all placeholder:text-gray-600"
                        />
                    </div>
                    <div className="flex-1 relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input 
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Location (e.g. New York, Lagos)"
                            className="w-full bg-[#0a0a0b] border border-[#2d2d33] rounded-2xl py-4 pl-12 pr-4 focus:border-[#00ff9d] focus:ring-1 focus:ring-[#00ff9d] outline-none transition-all placeholder:text-gray-600"
                        />
                    </div>
                    <button 
                        onClick={handleScrape}
                        disabled={isScraping || !niche || !location}
                        className="px-8 bg-[#00ff9d] text-black font-bold rounded-2xl hover:bg-[#00cc7d] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 min-w-[200px]"
                    >
                        {isScraping ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Layers className="w-5 h-5" />}
                        {isScraping ? 'Scraping...' : 'Crawl Leads'}
                    </button>
                </div>
            </div>

            {/* Lead Table */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        {['All', 'New', 'Ready', 'Sent'].map((f) => (
                            <button 
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === f ? 'bg-[#00ff9d] text-black' : 'bg-[#121217] text-gray-400 hover:bg-[#1d1d21]'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Filter className="w-4 h-4" />
                        Sort by: High Intent
                    </div>
                </div>

                <div className="grid gap-4">
                    {filteredLeads.map((lead) => (
                        <div key={lead.id} className="bg-[#121217] border border-[#1d1d21] p-6 rounded-2xl flex items-center justify-between group hover:border-gray-700 transition-all">
                            <div className="flex gap-6 items-center">
                                <div className="w-12 h-12 bg-[#1d1d21] rounded-xl flex items-center justify-center">
                                    <Globe className="w-6 h-6 text-gray-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">{lead.company}</h4>
                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Target className="w-3 h-3" /> {lead.industry}
                                        </span>
                                        <span className="w-1 h-1 bg-gray-700 rounded-full" />
                                        <span>{lead.websiteUrl}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                {lead.demoStatus === 'Ready' ? (
                                    <>
                                        <button 
                                            onClick={() => window.open(lead.demoUrl, '_blank')}
                                            className="p-3 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-all"
                                            title="View Prototype Mockup"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => sendDemoEmail(lead.id)}
                                            className="px-6 py-3 bg-[#00ff9d] text-black font-bold rounded-xl hover:bg-[#00cc7d] transition-all flex items-center gap-2"
                                        >
                                            <Mail className="w-4 h-4" /> Deliver Demo
                                        </button>
                                    </>
                                ) : (
                                    <button 
                                        onClick={() => generateMockup(lead.id)}
                                        disabled={lead.demoStatus === 'Generating'}
                                        className="px-6 py-3 border border-[#2d2d33] text-gray-300 rounded-xl hover:border-white hover:text-white transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {lead.demoStatus === 'Generating' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        {lead.demoStatus === 'Generating' ? 'Building KB...' : 'Forge AI Prototype'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredLeads.length === 0 && (
                        <div className="text-center py-20 bg-[#121217] rounded-3xl border border-dashed border-[#1d1d21]">
                            <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500">No prospects found. Initiate discovery to start hunting.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
