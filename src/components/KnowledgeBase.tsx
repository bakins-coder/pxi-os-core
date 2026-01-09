
import React, { useState } from 'react';
import {
  BookOpen, Search, ChevronRight, Users, Truck, Banknote,
  ChefHat, Zap, ShieldCheck, PlayCircle, Info, ArrowRight,
  Plus, CheckCircle2, Layout, Settings, MessageSquare, Bot, Clock, HelpCircle, FileText, X
} from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';

interface GuideStep {
  title: string;
  description: string;
}

interface Guide {
  id: string;
  category: 'HR' | 'Procurement' | 'Finance' | 'Leadership' | 'Operations';
  title: string;
  icon: any;
  steps: GuideStep[];
  visualPrompt: string;
}

export const KnowledgeBase = () => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const brandColor = useSettingsStore(s => s.settings.brandColor) || '#00ff9d';

  const categories = ['All', 'HR', 'Procurement', 'Finance', 'Leadership', 'Operations'];

  const guides: Guide[] = [
    {
      id: 'add-employee',
      category: 'HR',
      title: 'Adding New Staff Members',
      icon: Users,
      visualPrompt: 'HR Dashboard > Staff Tab > Add New Member',
      steps: [
        { title: 'Open Personnel List', description: 'Navigate to the Human Resources module and click the "Staff List" tab.' },
        { title: 'Invite Member', description: 'Click the "Invite Team Member" button to start the registration process.' },
        { title: 'Enter Staff Info', description: 'Fill in the legal name, email address, and select their workplace role (Manager, Officer, etc.).' },
        { title: 'Send Registration', description: 'The system will send a secure welcome email allowing them to join the workspace immediately.' }
      ]
    },
    {
      id: 'add-vendor',
      category: 'Procurement',
      title: 'Registering New Suppliers',
      icon: Truck,
      visualPrompt: 'Inventory Hub > Vendors Tab > New Supplier Entry',
      steps: [
        { title: 'Open Vendor List', description: 'Go to the Inventory module and select the "Vendors" view.' },
        { title: 'Create Entry', description: 'Click "Register Supplier" to open the business details form.' },
        { title: 'Link Payment Details', description: 'Add the supplier\'s bank account name and number to ensure automated payments in the future.' },
        { title: 'Associate Items', description: 'Tag specific ingredients or items supplied by this vendor to track price trends automatically.' }
      ]
    },
    {
      id: 'ledger-ai',
      category: 'Finance',
      title: 'Automated Bank Reconciliation',
      icon: Banknote,
      visualPrompt: 'Smart Accounting > Reconcile Tab > Auto-Match',
      steps: [
        { title: 'Connect Bank Account', description: 'The system links directly with your local bank accounts to pull the latest transaction history.' },
        { title: 'Identify Transactions', description: 'Find an unmatched payment or receipt in your feed and click to process it.' },
        { title: 'Use Smart Matching', description: 'Click "Ask Assistant for Match". The system will analyze the entry and suggest the correct account based on historical patterns.' },
        { title: 'Confirm & Post', description: 'Approve the suggestion to update your financial reports in real-time.' }
      ]
    },
    {
      id: 'banquet-sop',
      category: 'Operations',
      title: 'Planning Catering Events',
      icon: ChefHat,
      visualPrompt: 'Catering Ops > Event Planner > Submit to Management',
      steps: [
        { title: 'Create Event Draft', description: 'Start a new event record and enter the customer name, date, and guest count.' },
        { title: 'Calculate Volumes', description: 'The platform uses standard recipes to determine exactly how much food and drink material is needed for the guest list.' },
        { title: 'Review Readiness', description: 'Click "Check Readiness" to see if you have enough staff and stock available for the event date.' },
        { title: 'Finalize & Notify', description: 'Submit the plan to Management to lock in the schedule and alert all departments.' }
      ]
    },
    {
      id: 'agent-training',
      category: 'Leadership',
      title: 'Setting Up Virtual Assistants',
      icon: Bot,
      visualPrompt: 'Command Center > Create New Assistant',
      steps: [
        { title: 'Define Assistant Role', description: 'Select a task for the assistant, such as "Customer Support" or "Sales Outreach".' },
        { title: 'Set Rules & Policies', description: 'Input your company guidelines (e.g., "Always use formal greetings" or "Refer complex pricing to a Manager").' },
        { title: 'Select Channels', description: 'Choose where the assistant should operate, like your business WhatsApp or Telegram account.' },
        { title: 'Monitor Performance', description: 'Review the logs in the Ops Command view to see how assistants are helping your customers.' }
      ]
    }
  ];

  const filteredGuides = guides.filter(g =>
    (activeCategory === 'All' || g.category === activeCategory) &&
    (g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in pb-24">
      {/* Header */}
      <div className="bg-slate-950 p-10 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-16 h-16 bg-[#00ff9d] rounded-3xl flex items-center justify-center text-slate-950 shadow-2xl animate-float">
              <BookOpen size={36} />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">Learning Center</h1>
              <p className="text-slate-500 font-bold uppercase tracking-[0.3em] mt-1 text-[10px]">Operational Training & Support Documentation</p>
            </div>
          </div>

          <div className="relative max-w-2xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-5 text-sm font-bold text-white outline-none focus:border-[#00ff9d] transition-all placeholder:text-slate-700"
              placeholder="Search guides, modules, or department procedures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-64 space-y-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setSelectedGuide(null); }}
              className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white hover:text-slate-700'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {selectedGuide ? (
            <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-right-8 duration-500">
              <div className="p-12 bg-slate-50/50 border-b border-slate-100 flex justify-between items-start">
                <div className="space-y-4">
                  <button
                    onClick={() => setSelectedGuide(null)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase text-indigo-600 mb-4 hover:translate-x-[-4px] transition-all shadow-sm"
                  >
                    <ChevronRight className="rotate-180" size={14} /> Exit to Library
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-white rounded-2xl shadow-sm text-indigo-600">
                      <selectedGuide.icon size={32} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight leading-none">{selectedGuide.title}</h2>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">{selectedGuide.category} Guide</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedGuide(null)}
                  className="p-3 bg-slate-100 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm group"
                >
                  <X size={20} className="group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              <div className="p-12 grid grid-cols-1 lg:grid-cols-2 gap-16">
                <div className="space-y-12">
                  <div className="space-y-8">
                    {selectedGuide.steps.map((step, idx) => (
                      <div key={idx} className="flex gap-6 group">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-slate-900 text-[#00ff9d] flex items-center justify-center font-black text-xs shadow-lg group-hover:scale-110 transition-transform">
                            {idx + 1}
                          </div>
                          {idx < selectedGuide.steps.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 my-2"></div>}
                        </div>
                        <div className="space-y-2 pt-1 pb-4">
                          <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{step.title}</h4>
                          <p className="text-sm text-slate-500 font-medium leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-start gap-4">
                    <Info className="text-indigo-600 shrink-0" size={20} />
                    <p className="text-xs font-bold text-indigo-900 leading-relaxed italic">HELPFUL TIP: Use the "Smart Assistant" button on any screen to get automated help with your current task.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Step-by-Step Walkthrough</h4>
                  <div className="aspect-video bg-slate-950 rounded-[2.5rem] shadow-2xl relative overflow-hidden group flex items-center justify-center p-8 text-center">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200')] opacity-20 bg-cover bg-center grayscale group-hover:grayscale-0 transition-all duration-700"></div>
                    <div className="relative z-10 space-y-4">
                      <div className="w-20 h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center mx-auto text-white group-hover:scale-110 transition-transform cursor-pointer">
                        <PlayCircle size={48} className="fill-white/20" />
                      </div>
                      <div>
                        <p className="text-white font-black uppercase text-xs tracking-widest">{selectedGuide.visualPrompt}</p>
                        <p className="text-slate-400 text-[9px] font-bold uppercase mt-2">Visual Navigation Map</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <h5 className="text-[9px] font-black uppercase text-slate-400 mb-2">Access Level</h5>
                      <p className="text-xs font-bold text-slate-800">Administrator Access Required</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <h5 className="text-[9px] font-black uppercase text-slate-400 mb-2">Completion Time</h5>
                      <p className="text-xs font-bold text-slate-800">Estimated 3-5 Minutes</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setSelectedGuide(null)}
                  className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all"
                >
                  Done Reading
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredGuides.map(guide => (
                <div
                  key={guide.id}
                  onClick={() => setSelectedGuide(guide)}
                  className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl hover:shadow-2xl hover:border-indigo-200 transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="flex items-center gap-5 mb-6">
                    <div className="p-4 bg-slate-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <guide.icon size={24} />
                    </div>
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em]">{guide.category}</span>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mt-1">{guide.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6 line-clamp-2">
                    Learn how to manage {guide.title.toLowerCase()} within the platform.
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-600">
                      Start Walkthrough <ArrowRight size={14} />
                    </span>
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{guide.steps.length} Steps</span>
                  </div>
                </div>
              ))}
              {filteredGuides.length === 0 && (
                <div className="col-span-2 p-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                  <HelpCircle size={64} className="mx-auto text-slate-200 mb-4 opacity-50" />
                  <p className="text-xl font-bold uppercase tracking-widest text-slate-400 leading-relaxed">No search results found.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        {[
          { title: 'Training Matrix', desc: 'Onboarding flows for different departments.', icon: FileText },
          { title: 'Compliance Notes', desc: 'Financial and tax regulation guides.', icon: ShieldCheck },
          { title: 'Standard Procedures', desc: 'Downloadable PDF guides for your team.', icon: PlayCircle }
        ].map((box, i) => (
          <div key={i} className="bg-white/50 backdrop-blur-sm p-8 rounded-[2.5rem] border border-white/80 flex items-start gap-5 hover:bg-white transition-all">
            <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400"><box.icon size={20} /></div>
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase mb-1">{box.title}</h4>
              <p className="text-xs text-slate-500 font-medium">{box.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
