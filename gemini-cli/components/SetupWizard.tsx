import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { OrganizationType, CompanySize, AppModule, Role } from '../types';
import { getIndustrySetup } from '../services/ai';
import { 
  Building2, Utensils, ShoppingBag, Wrench, Briefcase, 
  CheckCircle2, ArrowRight, Activity, Users, Truck, Heart, 
  GraduationCap, Factory, Zap, ShieldCheck, PieChart, MousePointer2,
  Mail, Globe, Check, AlertTriangle, Plus, Trash2, LayoutGrid, Plug,
  MessageSquare, CreditCard, Calendar, Package, Sparkles, Loader2, Bot,
  Palette, Image as ImageIcon
} from 'lucide-react';

interface SetupWizardProps {
  onComplete: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isGeneratingBlueprint, setIsGeneratingBlueprint] = useState(false);

  // Step 1: Company Profile State
  const [orgType, setOrgType] = useState<OrganizationType>('General');
  const [orgSize, setOrgSize] = useState<CompanySize>('Small (11-50)');
  const [address, setAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactPersonName, setContactPersonName] = useState(db.currentUser?.name || '');
  const [contactPersonTitle, setContactPersonTitle] = useState('CEO');
  
  // Branding State
  const [brandColor, setBrandColor] = useState('#4f46e5');
  const [logoUrl, setLogoUrl] = useState('');

  // AI Blueprint State
  const [suggestedDepts, setSuggestedDepts] = useState<string[]>([]);
  const [suggestedRoles, setSuggestedRoles] = useState<string[]>([]);

  // Step 2: Modules State
  const [selectedModules, setSelectedModules] = useState<AppModule[]>(['CRM', 'ContactCenter', 'TeamChat', 'Reports']);

  // Step 3: User Invites State
  const [invites, setInvites] = useState<{email: string, role: string}[]>([]);
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [newInviteRole, setNewInviteRole] = useState<string>('Agent');

  // Step 4: Integrations State
  const [activeIntegrations, setActiveIntegrations] = useState<string[]>([]);

  useEffect(() => {
    const fetchBlueprint = async () => {
      setIsGeneratingBlueprint(true);
      const blueprint = await getIndustrySetup(orgType);
      setSuggestedDepts(blueprint.departments || []);
      setSuggestedRoles(blueprint.roles || []);
      setIsGeneratingBlueprint(false);
    };
    fetchBlueprint();
  }, [orgType]);

  const toggleModule = (module: AppModule) => {
    if (module === 'CRM' || module === 'ContactCenter') return; 
    if (selectedModules.includes(module)) {
      setSelectedModules(selectedModules.filter(m => m !== module));
    } else {
      setSelectedModules([...selectedModules, module]);
    }
  };

  const handleFinish = () => {
    setIsConfiguring(true);
    setTimeout(() => {
      db.completeSetup({ 
        type: orgType, 
        size: orgSize,
        brandColor,
        logo: logoUrl,
        address,
        contactPhone,
        contactPerson: {
            name: contactPersonName,
            email: db.currentUser?.email || '',
            jobTitle: contactPersonTitle
        },
        enabledModules: selectedModules,
      }, invites);

      suggestedDepts.forEach(name => db.addDepartment(name));
      activeIntegrations.forEach(id => db.toggleIntegration(id));
      onComplete();
    }, 2500); 
  };

  const industries: { id: OrganizationType; label: string; icon: any }[] = [
    { id: 'General', label: 'General Business', icon: Briefcase },
    { id: 'Catering', label: 'Catering', icon: Utensils },
    { id: 'Retail', label: 'Retail', icon: ShoppingBag },
    { id: 'Service', label: 'Field Service', icon: Wrench },
    { id: 'Banking', label: 'Banking', icon: Building2 },
    { id: 'Logistics', label: 'Logistics', icon: Truck },
    { id: 'Healthcare', label: 'Healthcare', icon: Heart },
    { id: 'Education', label: 'Education', icon: GraduationCap },
    { id: 'Manufacturing', label: 'Manufacturing', icon: Factory },
  ];

  const brandPalettes = [
    { name: 'Unified Indigo', hex: '#4f46e5' },
    { name: 'Financial Blue', hex: '#1e3a8a' },
    { name: 'Healthcare Green', hex: '#10b981' },
    { name: 'Luxury Gold', hex: '#d4af37' },
    { name: 'Deep Crimson', hex: '#991b1b' },
    { name: 'Tech Slate', hex: '#334155' }
  ];

  if (isConfiguring) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-24 h-24 relative mb-8">
          <div className="absolute inset-0 bg-indigo-500 rounded-full opacity-20 animate-ping" style={{ backgroundColor: brandColor }}></div>
          <div className="absolute inset-2 bg-indigo-500 rounded-full opacity-40 animate-pulse" style={{ backgroundColor: brandColor }}></div>
          <div className="absolute inset-4 bg-indigo-600 rounded-full flex items-center justify-center" style={{ backgroundColor: brandColor }}>
            <Zap size={40} className="text-white animate-bounce" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-4 text-center">Establishing Workspace Identity...</h2>
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center gap-3 text-indigo-300 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <CheckCircle2 size={18} /> Syncing {orgType} AI model...
          </div>
          <div className="flex items-center gap-3 text-indigo-300 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
            <CheckCircle2 size={18} /> Injecting corporate brand assets...
          </div>
          <div className="flex items-center gap-3 text-indigo-300 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-500">
            <CheckCircle2 size={18} /> Ready for operations.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto md:min-h-[700px] border border-slate-100">
        <div className="w-full md:w-80 bg-slate-950 text-white p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-12">
              {logoUrl ? (
                 <img src={logoUrl} className="w-10 h-10 rounded-xl object-cover shadow-lg" alt="Logo" />
              ) : (
                 <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg" style={{ backgroundColor: brandColor }}>P</div>
              )}
              <span className="font-black text-lg tracking-tighter uppercase">PXI UNIFIED</span>
            </div>
            <div className="space-y-8">
              {[
                { s: 1, label: 'Company Identity' },
                { s: 2, label: 'Apps & Intelligence' },
                { s: 3, label: 'Access Control' },
                { s: 4, label: 'Global Connect' }
              ].map((item) => (
                <div key={item.s} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black transition-all ${
                    step === item.s ? 'text-white shadow-lg' : 
                    step > item.s ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`} style={step === item.s ? { backgroundColor: brandColor, boxShadow: `0 10px 15px ${brandColor}33` } : {}}>
                    {step > item.s ? <Check size={18} /> : item.s}
                  </div>
                  <span className={`text-xs font-black uppercase tracking-widest ${step === item.s ? 'text-white' : 'text-slate-500'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
             <div className="flex items-center gap-2 mb-1">
                <Bot size={14} className="text-indigo-400"/>
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">AI ORCHESTRATOR</span>
             </div>
             <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Configuring branded {orgType} intelligence.</p>
          </div>
        </div>

        <div className="flex-1 p-10 md:p-14 relative overflow-y-auto bg-white">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right duration-300 space-y-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Define your brand.</h2>
                  <p className="text-slate-500 font-medium mt-1">Establish industry context and visual identity.</p>
                </div>
                {isGeneratingBlueprint && (
                   <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full animate-pulse border border-indigo-100">
                      <Loader2 size={14} className="animate-spin"/>
                      <span className="text-[10px] font-black uppercase tracking-widest">AI Mapping...</span>
                   </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Primary Industry</label>
                  <select 
                    className="w-full border border-slate-200 rounded-2xl p-4 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all"
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value as OrganizationType)}
                  >
                    {industries.map(ind => <option key={ind.id} value={ind.id}>{ind.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Workspace Scale</label>
                  <select 
                    className="w-full border border-slate-200 rounded-2xl p-4 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all"
                    value={orgSize}
                    onChange={(e) => setOrgSize(e.target.value as CompanySize)}
                  >
                    <option>Micro (1-10)</option>
                    <option>Small (11-50)</option>
                    <option>Medium (51-250)</option>
                    <option>Large (250+)</option>
                  </select>
                </div>
              </div>

              {/* Branding Section */}
              <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 space-y-8">
                 <div className="flex items-center gap-2 mb-2">
                    <Palette size={18} className="text-indigo-600" style={{ color: brandColor }}/>
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Brand Aesthetics</span>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Primary Brand Color</label>
                       <div className="flex flex-wrap gap-3 mb-4">
                          {brandPalettes.map(p => (
                             <button 
                                key={p.hex}
                                onClick={() => setBrandColor(p.hex)}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${brandColor === p.hex ? 'border-indigo-600 scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                                style={{ backgroundColor: p.hex }}
                                title={p.name}
                             />
                          ))}
                       </div>
                       <div className="flex items-center gap-3">
                          <input 
                             type="color" 
                             className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent"
                             value={brandColor}
                             onChange={e => setBrandColor(e.target.value)}
                          />
                          <input 
                             className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-mono font-bold"
                             value={brandColor}
                             onChange={e => setBrandColor(e.target.value)}
                          />
                       </div>
                    </div>

                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Corporate Logo URL</label>
                       <div className="flex items-center gap-4">
                          <input 
                             className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500"
                             placeholder="https://company.com/logo.png"
                             value={logoUrl}
                             onChange={e => setLogoUrl(e.target.value)}
                          />
                          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                             {logoUrl ? <img src={logoUrl} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-slate-300"/>}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* AI Blueprint Preview */}
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="flex items-center gap-2 mb-6">
                   <Sparkles size={18} className="text-amber-500"/>
                   <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">AI Structural Preview</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div>
                      <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Suggested Units</h4>
                      <div className="flex flex-wrap gap-2">
                        {suggestedDepts.map(dept => (
                           <span key={dept} className="px-3 py-1.5 bg-white/5 border border-white/10 text-[9px] font-black text-slate-300 rounded-xl uppercase tracking-tight flex items-center gap-1.5">
                              <Building2 size={10} className="text-indigo-400"/> {dept}
                           </span>
                        ))}
                      </div>
                   </div>
                   <div>
                      <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Target Roles</h4>
                      <div className="flex flex-wrap gap-2">
                        {suggestedRoles.map(role => (
                           <span key={role} className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-400 rounded-xl uppercase tracking-tight flex items-center gap-1.5">
                              <Users size={10}/> {role}
                           </span>
                        ))}
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right duration-300 space-y-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Enable capability.</h2>
                <p className="text-slate-500 font-medium">Provision modules based on your {orgType} blueprint.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { id: 'HR' as AppModule, label: 'HR & Payroll', icon: Users, desc: 'Statutory compliance & personnel core.' },
                    { id: 'Finance' as AppModule, label: 'Finance Hub', icon: PieChart, desc: 'Ledger automation & collections.' },
                    { id: 'Inventory' as AppModule, label: 'Asset Matrix', icon: Package, desc: 'Deep stock tracking & costing.' },
                    { id: 'Automation' as AppModule, label: 'AI Studio', icon: Bot, desc: 'Autonomous workflows & marketing.' },
                    { id: 'Catering' as AppModule, label: 'Events Suite', icon: Utensils, desc: 'Specialized banquet & menu automation.' }
                  ].map(mod => {
                    const isSelected = selectedModules.includes(mod.id);
                    return (
                      <button
                        key={mod.id}
                        onClick={() => toggleModule(mod.id)}
                        className={`p-6 rounded-[2.5rem] border-2 text-left transition-all flex items-start gap-4 ${
                          isSelected ? 'bg-white shadow-xl shadow-indigo-100' : 'border-slate-100 bg-slate-50 hover:bg-white'
                        }`}
                        style={isSelected ? { borderColor: brandColor } : {}}
                      >
                        <div className={`p-4 rounded-2xl ${isSelected ? 'text-white' : 'bg-slate-200 text-slate-500'}`} style={isSelected ? { backgroundColor: brandColor } : {}}>
                          <mod.icon size={24} />
                        </div>
                        <div className="flex-1">
                          <div className={`font-black uppercase tracking-tighter text-lg ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>{mod.label}</div>
                          <div className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">{mod.desc}</div>
                        </div>
                        {isSelected && <CheckCircle2 size={24} className="mt-1" style={{ color: brandColor }} />}
                      </button>
                    )
                  })}
                </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right duration-300 space-y-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Invite your team.</h2>
                <p className="text-slate-500 font-medium">Bootstrap access for your core stakeholders.</p>
              </div>
              <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                 <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6">Dispatch Invite</h3>
                 <div className="flex flex-col md:flex-row gap-4">
                    <input 
                       className="flex-1 border border-slate-200 rounded-2xl p-4 bg-white text-slate-900 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                       placeholder="colleague@company.com"
                       value={newInviteEmail}
                       onChange={e => setNewInviteEmail(e.target.value)}
                    />
                    <select 
                       className="md:w-56 border border-slate-200 rounded-2xl p-4 text-sm font-bold bg-white text-slate-900 outline-none"
                       value={newInviteRole}
                       onChange={e => setNewInviteRole(e.target.value)}
                    >
                       {suggestedRoles.map(r => (
                          <option key={r} value={r}>{r}</option>
                       ))}
                       <option value="Admin">Admin</option>
                    </select>
                    <button 
                       onClick={() => { if(newInviteEmail) { setInvites([...invites, { email: newInviteEmail, role: newInviteRole }]); setNewInviteEmail(''); } }}
                       disabled={!newInviteEmail}
                       className="bg-slate-950 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 shadow-xl transition-all disabled:opacity-50 active:scale-95"
                    >
                       Add
                    </button>
                 </div>
              </div>

              <div className="space-y-4">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Workspace Roster</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-3xl border-2 flex items-center justify-between shadow-lg shadow-indigo-50" style={{ borderColor: `${brandColor}33` }}>
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl text-white flex items-center justify-center font-black text-xs" style={{ backgroundColor: brandColor }}>YOU</div>
                          <div>
                             <div className="text-sm font-black text-slate-900 uppercase">{contactPersonName}</div>
                             <div className="text-[10px] font-black tracking-widest uppercase" style={{ color: brandColor }}>Owner / {contactPersonTitle}</div>
                          </div>
                       </div>
                    </div>
                    {invites.map((inv, i) => (
                       <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm animate-in zoom-in duration-300">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center font-black text-sm">
                                {inv.email.charAt(0).toUpperCase()}
                             </div>
                             <div>
                                <div className="text-sm font-black text-slate-800 uppercase">{inv.email.split('@')[0]}</div>
                                <div className="text-[10px] text-slate-400 font-black tracking-widest uppercase">{inv.role}</div>
                             </div>
                          </div>
                          <button onClick={() => setInvites(invites.filter((_, idx) => idx !== i))} className="text-rose-400 hover:bg-rose-50 p-2 rounded-xl transition-all">
                             <Trash2 size={18}/>
                          </button>
                       </div>
                    ))}
                 </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right duration-300 space-y-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Global sync.</h2>
                <p className="text-slate-500 font-medium">Synchronize infrastructure with the PXI gateway.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {[
                   { id: 'int1', name: 'Gmail', icon: Mail },
                   { id: 'int5', name: 'Slack', icon: MessageSquare },
                   { id: 'int4', name: 'Stripe', icon: CreditCard },
                   { id: 'int3', name: 'Calendar', icon: Calendar }
                 ].map(int => {
                    const isActive = activeIntegrations.includes(int.id);
                    return (
                       <div key={int.id} className={`p-6 border-2 rounded-[2.5rem] flex items-center justify-between transition-all ${isActive ? 'bg-indigo-50/20' : 'border-slate-50 bg-slate-50 hover:bg-white shadow-sm'}`} style={isActive ? { borderColor: brandColor } : {}}>
                          <div className="flex items-center gap-4">
                             <div className={`p-4 rounded-2xl ${isActive ? 'text-white' : 'bg-white text-slate-400 shadow-sm'}`} style={isActive ? { backgroundColor: brandColor } : {}}>
                                <int.icon size={28}/>
                             </div>
                             <div>
                                <div className="font-black text-slate-900 uppercase tracking-tighter">{int.name}</div>
                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{isActive ? 'Ready' : 'Pending...'}</div>
                             </div>
                          </div>
                          <button 
                             onClick={() => isActive ? setActiveIntegrations(activeIntegrations.filter(i => i !== int.id)) : setActiveIntegrations([...activeIntegrations, int.id])}
                             className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                isActive ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
                             }`}
                          >
                             {isActive ? 'Syncing' : 'Link'}
                          </button>
                       </div>
                    )
                 })}
              </div>
            </div>
          )}

          <div className="absolute bottom-0 left-0 w-full p-10 bg-white/80 backdrop-blur-md border-t border-slate-50 flex justify-between items-center px-14">
             {step > 1 ? (
                <button onClick={() => setStep(step - 1)} className="text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-indigo-600 transition-colors">Previous</button>
             ) : <div></div>}

             {step < 4 ? (
                <button 
                   onClick={() => setStep(step + 1)}
                   className="text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:opacity-90 transition-all shadow-xl active:scale-95"
                   style={{ backgroundColor: brandColor, boxShadow: `0 10px 25px ${brandColor}44` }}
                >
                   Continue <ArrowRight size={20} />
                </button>
             ) : (
                <button 
                   onClick={handleFinish}
                   className="text-white px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:opacity-90 transition-all shadow-2xl active:scale-95"
                   style={{ backgroundColor: brandColor, boxShadow: `0 10px 25px ${brandColor}44` }}
                >
                   Finalize Workspace <CheckCircle2 size={20} />
                </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};