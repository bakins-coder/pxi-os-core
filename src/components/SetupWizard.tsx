
import React, { useState, useEffect, useRef } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
import { OrganizationType, CompanySize, AppModule, Role } from '../types';
import { FormAssistant } from './FormAssistant';
import {
   Building2, Utensils, ShoppingBag, Briefcase,
   CheckCircle2, ArrowRight, Truck, Factory, Zap, Check, Plus, Trash2, Box, Bot, Image as ImageIcon, User, MapPin, Phone, Award, Sparkles, UserCircle, Palette, Grid,
   Users, ChefHat, Package, BarChart2, Banknote, RefreshCw, Activity, ShieldCheck, X, LayoutGrid, Mail
} from 'lucide-react';

interface SetupWizardProps {
   onComplete: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
   const { partialSetupData, updatePartialSetup, completeSetup } = useSettingsStore();
   const { user: currentUser } = useAuthStore();
   const partialData = partialSetupData || {};

   const [step, setStep] = useState<number>(partialData.step || 1);
   const [isConfiguring, setIsConfiguring] = useState(false);
   const [activeField, setActiveField] = useState<string>('');
   const [showRestoreToast, setShowRestoreToast] = useState(!!partialSetupData);
   const fileInputRef = useRef<HTMLInputElement>(null);

   // Refined personal data states
   const [repTitle, setRepTitle] = useState(partialData.repTitle || 'Mr');
   const [firstName, setFirstName] = useState(partialData.firstName || '');
   const [middleName, setMiddleName] = useState(partialData.middleName || '');
   const [lastName, setLastName] = useState(partialData.lastName || '');
   const [gender, setGender] = useState<'Male' | 'Female'>(partialData.gender || 'Male');

   const [repJobTitle, setRepJobTitle] = useState(partialData.repJobTitle || 'Administrator');
   const [repPhone, setRepPhone] = useState(partialData.repPhone || '');
   const [orgName, setOrgName] = useState(partialData.orgName || '');
   const [orgType, setOrgType] = useState<OrganizationType>(partialData.orgType || 'General');
   const [orgSize, setOrgSize] = useState<CompanySize>(partialData.orgSize || 'Small (11-50)');
   const [address, setAddress] = useState(partialData.address || '');
   const [taxId, setTaxId] = useState(partialData.taxId || '');
   const [brandColor, setBrandColor] = useState(partialData.brandColor || '#00ff9d');
   const [logo, setLogo] = useState(partialData.logo || '');
   const [selectedModules, setSelectedModules] = useState<AppModule[]>(partialData.selectedModules || ['CRM', 'Reports']);
   const [invites, setInvites] = useState<{ email: string; role: Role }[]>(partialData.invites || []);

   const fullDisplayName = `${repTitle} ${firstName} ${lastName}`.trim();

   const formData = {
      repTitle,
      firstName,
      middleName,
      lastName,
      gender,
      repJobTitle,
      repPhone,
      orgName,
      orgType,
      orgSize,
      address,
      taxId,
      logo
   };

   // Persist partial state on every change
   useEffect(() => {
      updatePartialSetup({
         ...formData,
         step,
         brandColor,
         selectedModules,
         invites
      });
   }, [repTitle, firstName, middleName, lastName, gender, repJobTitle, repPhone, orgName, orgType, orgSize, address, taxId, step, brandColor, logo, selectedModules, invites]);

   useEffect(() => {
      if (showRestoreToast) {
         const timer = setTimeout(() => setShowRestoreToast(false), 5000);
         return () => clearTimeout(timer);
      }
   }, [showRestoreToast]);

   // AUTO-RECOVERY: Check if user is already linked to an org (Stale Session Fix)
   useEffect(() => {
      const checkExistingOrg = async () => {
         if (!currentUser?.id) return;
         try {
            const { supabase } = await import('../services/supabase');
            if (!supabase) return;

            // 1. Check Profile for Organization Link
            const { data: profile } = await supabase
               .from('profiles')
               .select('organization_id, role')
               .eq('id', currentUser.id)
               .single();

            if (profile?.organization_id) {
               console.log('Found existing organization link:', profile.organization_id);

               // 2. Fetch Organization Details
               const { data: org } = await supabase
                  .from('organizations')
                  .select('*')
                  .eq('id', profile.organization_id)
                  .single();

               if (org) {
                  // 3. Force Update Local State
                  useAuthStore.getState().setUser({
                     ...currentUser,
                     companyId: org.id,
                     role: profile.role as Role || currentUser.role
                  });

                  completeSetup({
                     id: org.id,
                     name: org.name,
                     type: org.type as any,
                     size: org.size as any,
                     brandColor: org.brand_color,
                     logo: org.logo,
                     address: org.address,
                     firs_tin: org.firs_tin,
                     contactPhone: org.contact_phone
                  });

                  // 4. Redirect
                  onComplete();
               }
            }
         } catch (err) {
            console.error('Auto-recovery failed:', err);
         }
      };

      checkExistingOrg();
   }, [currentUser?.id]);

   const handleLogout = () => {
      useAuthStore.getState().logout();
      window.location.reload();
   };

   const handleFinish = async () => {
      setIsConfiguring(true);

      try {
         // 1. Create Workspace in Backend
         // 1. Create Workspace (Organization) directly in DB
         const { supabase } = await import('../services/supabase');
         if (!supabase) throw new Error('System Offline');

         // Map local state to DB columns
         const orgPayload = {
            name: orgName,
            type: orgType,
            size: orgSize,
            brand_color: brandColor,
            logo: logo,
            address: address,
            firs_tin: taxId,
            contact_phone: repPhone,
            setup_complete: true,
            enabled_modules: selectedModules,
            contact_person: {
               name: fullDisplayName,
               email: currentUser?.email || '',
               jobTitle: repJobTitle,
               title: repTitle
            }
         };

         const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .insert(orgPayload)
            .select('id')
            .single();

         if (orgError) throw new Error(orgError.message || 'Failed to create organization record');
         const newCompanyId = orgData.id;

         // 2. Link User to Organization (Update public.users)
         if (currentUser?.id) {
            const userPayload = {
               id: currentUser.id,
               company_id: newCompanyId,
               name: fullDisplayName,
               email: currentUser.email || '',
               role: Role.ADMIN
            };

            const { error: userError } = await supabase
               .from('users')
               .upsert(userPayload);

            if (userError) console.warn('Failed to link user profile:', userError);
         }

         // 3. Update Local User State with new Company ID
         useAuthStore.getState().setUser({
            ...currentUser!,
            companyId: newCompanyId
         });

         // 3. Persist Settings
         completeSetup({
            id: newCompanyId, // Use the real ID
            name: orgName,
            type: orgType,
            size: orgSize,
            brandColor,
            logo,
            address,
            firs_tin: taxId,
            contactPhone: repPhone,
            contactPerson: {
               name: fullDisplayName,
               firstName,
               middleName,
               lastName,
               title: repTitle,
               gender,
               email: currentUser?.email || '',
               jobTitle: repJobTitle
            },
            enabledModules: selectedModules as any
         });

         setTimeout(() => {
            setIsConfiguring(false);
            onComplete();
         }, 1000);

      } catch (error: any) {
         console.error('Setup failed:', error);
         setIsConfiguring(false);
         alert(`Setup Failed: ${error.message}`);
      }
   };

   const nextStep = () => setStep(s => Math.min(6, s + 1));
   const prevStep = () => setStep(s => Math.max(1, s - 1));

   const toggleModule = (mod: AppModule) => {
      setSelectedModules(prev => prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]);
   };

   const addInvite = () => {
      const email = prompt('Enter team member email:');
      if (email) setInvites([...invites, { email, role: Role.AGENT }]);
   };

   const removeInvite = (email: string) => setInvites(invites.filter(i => i.email !== email));

   const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         const reader = new FileReader();
         reader.onloadend = () => setLogo(reader.result as string);
         reader.readAsDataURL(file);
      }
   };

   if (isConfiguring) {
      return (
         <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-8 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-[#00ff9d]/5 animate-pulse"></div>
            <div className="relative z-10 space-y-12 text-center max-w-xl">
               <div className="flex justify-center flex-wrap gap-4 mb-20">
                  {[Briefcase, ShoppingBag, Utensils, Users, Bot, Activity, ShieldCheck].map((Icon, i) => (
                     <div key={i} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center animate-float" style={{ animationDelay: `${i * 0.2}s` }}>
                        <Icon className="text-white/20" size={24} />
                     </div>
                  ))}
               </div>

               <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/30 text-[10px] font-black uppercase tracking-widest animate-bounce">
                     <Zap size={14} className="fill-current" /> Neural Configuration in Progress
                  </div>
                  <h2 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">Instantiating<br /><span className="text-[#00ff9d]">{orgName}</span></h2>
                  <p className="text-slate-400 font-medium text-lg leading-relaxed px-10">We are currently synthesizing your business logic, indexing modules, and establishing secure cloud nodes. Please remain connected.</p>
               </div>

               <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-[#00ff9d] animate-progress"></div>
               </div>

               <div className="grid grid-cols-3 gap-6 pt-10">
                  <div className="text-center"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">State</p><p className="text-xs font-bold text-white uppercase">Encrypted</p></div>
                  <div className="text-center"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Sync</p><p className="text-xs font-bold text-white uppercase">Neural</p></div>
                  <div className="text-center"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Latency</p><p className="text-xs font-bold text-white uppercase">14ms</p></div>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-700 relative overflow-hidden">
         {/* Background blobs */}
         <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
         <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#00ff9d]/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2"></div>

         {showRestoreToast && (
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-8 duration-500">
               <div className="bg-indigo-600/90 backdrop-blur-md px-8 py-4 rounded-[2rem] border border-white/20 shadow-2xl flex items-center gap-4">
                  <div className="bg-white/20 p-2 rounded-xl"><Sparkles size={18} className="text-[#00ff9d]" /></div>
                  <p className="text-white font-black text-xs uppercase tracking-widest">Instance session restored from local cache</p>
                  <button onClick={() => setShowRestoreToast(false)} className="text-white/50 hover:text-white"><X size={16} /></button>
               </div>
            </div>
         )}

         <div className="absolute top-8 right-8 z-50">
            <button
               onClick={handleLogout}
               className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/50 rounded-2xl transition-all group backdrop-blur-md"
            >
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-rose-400">Sign Out</span>
            </button>
         </div>

         <div className="w-full max-w-5xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10 border border-slate-100 min-h-[700px]">
            {/* Sidebar */}
            <div className="w-full md:w-80 bg-slate-950 p-10 flex flex-col justify-between border-r border-slate-800">
               <div>
                  <div className="w-16 h-16 bg-[#00ff9d] rounded-3xl flex items-center justify-center mb-12 shadow-2xl rotate-3"><Zap className="text-slate-950" size={32} /></div>
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-tight mb-2">Platform<br />Instantiation</h2>
                  <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em] mb-12">Core Setup Sequence v4.0</p>

                  <div className="space-y-6">
                     {[
                        { s: 1, label: 'Legal Contact', icon: UserCircle },
                        { s: 2, label: 'Identity', icon: Building2 },
                        { s: 3, label: 'Entity Profile', icon: Grid },
                        { s: 4, label: 'Branding', icon: Palette },
                        { s: 5, label: 'Modules', icon: LayoutGrid },
                        { s: 6, label: 'Personnel', icon: Users }
                     ].map(item => (
                        <div key={item.s} className={`flex items-center gap-4 transition-all duration-500 ${step === item.s ? 'translate-x-3' : 'opacity-80'}`}>
                           <div className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 ${step === item.s ? 'bg-[#00ff9d] border-[#00ff9d] text-slate-950 shadow-[0_0_20px_rgba(0,255,157,0.3)]' : 'border-white/20 text-white/40'}`}>
                              <item.icon size={14} strokeWidth={3} />
                           </div>
                           <span className={`text-[10px] font-black uppercase tracking-widest ${step === item.s ? 'text-white' : 'text-white/40'}`}>{item.label}</span>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="pt-10">
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
                     <p className="text-[10px] font-bold text-[#00ff9d] uppercase flex items-center gap-2 tracking-tighter">
                        <div className="w-2 h-2 rounded-full bg-[#00ff9d] animate-pulse"></div>
                        Initializing Node {Math.round((step / 6) * 100)}%
                     </p>
                  </div>
               </div>
            </div>

            {/* Form Area */}
            <div className="flex-1 flex flex-col p-8 md:p-16 relative">
               <FormAssistant
                  formName="Setup Wizard"
                  activeField={activeField}
                  value={(formData as any)[activeField] || ''}
                  formData={formData}
                  onVoiceEntry={(text) => {
                     if (activeField === 'orgName') setOrgName(text);
                     if (activeField === 'firstName') setFirstName(text);
                     if (activeField === 'lastName') setLastName(text);
                     // etc...
                  }}
               />

               <div className="flex-1 overflow-y-auto pr-4 scrollbar-thin">
                  {step === 1 && (
                     <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
                        <div>
                           <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-none">Who is the<br />Signatory?</h3>
                           <p className="text-slate-500 font-medium text-lg leading-relaxed">Enter the primary administrator or legal representative.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-6 gap-8 pt-6">
                           <div className="md:col-span-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 mb-3 block">Honorific</label>
                              <select
                                 className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-black outline-none focus:border-indigo-500 appearance-none transition-all cursor-pointer text-slate-900"
                                 value={repTitle}
                                 onChange={e => setRepTitle(e.target.value)}
                                 onFocus={() => setActiveField('repTitle')}
                              >
                                 <option>Mr</option><option>Mrs</option><option>Ms</option><option>Dr</option><option>Engr</option><option>Arc</option><option>Barr</option><option>Mallam</option><option>Alhaji</option><option>Chief</option>
                              </select>
                           </div>
                           <div className="md:col-span-4">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 mb-3 block">First Name</label>
                              <input
                                 className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-black outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400 text-slate-900"
                                 placeholder="e.g. Akinwale"
                                 value={firstName}
                                 onChange={e => setFirstName(e.target.value)}
                                 onFocus={() => setActiveField('firstName')}
                              />
                           </div>
                           <div className="md:col-span-3">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 mb-3 block">Middle Name (Optional)</label>
                              <input
                                 className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-black outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400 text-slate-900"
                                 placeholder="e.g. Babatunde"
                                 value={middleName}
                                 onChange={e => setMiddleName(e.target.value)}
                                 onFocus={() => setActiveField('middleName')}
                              />
                           </div>
                           <div className="md:col-span-3">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 mb-3 block">Last Name</label>
                              <input
                                 className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-black outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400 text-slate-900"
                                 placeholder="e.g. Akinbiyi"
                                 value={lastName}
                                 onChange={e => setLastName(e.target.value)}
                                 onFocus={() => setActiveField('lastName')}
                              />
                           </div>
                           <div className="md:col-span-3">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 mb-3 block">Gender Identification</label>
                              <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200">
                                 {['Male', 'Female'].map(g => (
                                    <button
                                       key={g}
                                       onClick={() => setGender(g as any)}
                                       className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${gender === g ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500'}`}
                                    >
                                       {g}
                                    </button>
                                 ))}
                              </div>
                           </div>
                           <div className="md:col-span-3">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 mb-3 block">Job Title</label>
                              <input
                                 className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-black outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400 text-slate-900"
                                 placeholder="e.g. Managing Director"
                                 value={repJobTitle}
                                 onChange={e => setRepJobTitle(e.target.value)}
                                 onFocus={() => setActiveField('repJobTitle')}
                              />
                           </div>
                        </div>
                     </div>
                  )}

                  {step === 2 && (
                     <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
                        <div>
                           <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-none">Entity Identity</h3>
                           <p className="text-slate-500 font-medium text-lg leading-relaxed">Establish the official legal name and contact node.</p>
                        </div>

                        <div className="space-y-10 pt-6">
                           <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 mb-3 block">Legal Organization Name</label>
                              <div className="relative">
                                 <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 border-r-2 border-slate-100 pr-6"><Building2 size={24} /></div>
                                 <input
                                    className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black outline-none focus:border-indigo-500 transition-all pl-24 text-2xl truncate shadow-inner focus:bg-white text-slate-900 placeholder:text-slate-400"
                                    placeholder="e.g. Xquisite Celebrations Ltd"
                                    value={orgName}
                                    onChange={e => setOrgName(e.target.value)}
                                    onFocus={() => setActiveField('orgName')}
                                 />
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div>
                                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 mb-3 block">Primary Contact Phone</label>
                                 <div className="relative">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 border-r-2 border-slate-100 pr-4"><Phone size={18} /></div>
                                    <input
                                       className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-black outline-none focus:border-indigo-500 transition-all pl-20 text-slate-900 placeholder:text-slate-400"
                                       placeholder="080 123 4567"
                                       value={repPhone}
                                       onChange={e => setRepPhone(e.target.value)}
                                       onFocus={() => setActiveField('repPhone')}
                                    />
                                 </div>
                              </div>
                              <div>
                                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 mb-3 block">Business Classification</label>
                                 <select
                                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-black outline-none focus:border-indigo-500 appearance-none transition-all cursor-pointer text-slate-900"
                                    value={orgType}
                                    onChange={e => setOrgType(e.target.value as any)}
                                    onFocus={() => setActiveField('orgType')}
                                 >
                                    <option value="Catering">Banquet & Catering</option>
                                    <option value="Logistics">Supply Chain & Logistics</option>
                                    <option value="Retail">Commercial Retail</option>
                                    <option value="Services">Professional Services</option>
                                    <option value="General">Multi-Industry Conglomerate</option>
                                 </select>
                              </div>
                           </div>
                        </div>
                     </div>
                  )}

                  {step === 3 && (
                     <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
                        <div>
                           <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-none">Entity Profile</h3>
                           <p className="text-slate-500 font-medium text-lg leading-relaxed">Specify physical coordinates and fiscal identifiers.</p>
                        </div>

                        <div className="space-y-10 pt-6">
                           <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 mb-3 block">Headquarters Address</label>
                              <div className="relative">
                                 <div className="absolute left-6 top-8 text-slate-300"><MapPin size={24} /></div>
                                 <textarea
                                    rows={2}
                                    className="w-full p-6 pt-7 pl-20 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] font-black outline-none focus:border-indigo-500 transition-all shadow-inner focus:bg-white resize-none text-slate-900 placeholder:text-slate-400"
                                    placeholder="Building Number, Street, LGA, State, Country"
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    onFocus={() => setActiveField('address')}
                                 />
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div>
                                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 mb-3 block">FIRS T.I.N (Corporate)</label>
                                 <input
                                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-black outline-none focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
                                    placeholder="12345678-0001"
                                    value={taxId}
                                    onChange={e => setTaxId(e.target.value)}
                                    onFocus={() => setActiveField('taxId')}
                                 />
                              </div>
                              <div>
                                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 mb-3 block">Operational Scale</label>
                                 <select
                                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-black outline-none focus:border-indigo-500 appearance-none transition-all cursor-pointer text-slate-900"
                                    value={orgSize}
                                    onChange={e => setOrgSize(e.target.value as any)}
                                    onFocus={() => setActiveField('orgSize')}
                                 >
                                    <option>Solo (1)</option>
                                    <option>Small (2-10)</option>
                                    <option>Medium (11-50)</option>
                                    <option>Enterprise (50+)</option>
                                 </select>
                              </div>
                           </div>
                        </div>
                     </div>
                  )}

                  {step === 4 && (
                     <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
                        <div>
                           <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-none">Neural Branding</h3>
                           <p className="text-slate-500 font-medium text-lg leading-relaxed">Customize the platform's visual frequency.</p>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-16 pt-6">
                           <div className="flex-1 space-y-10">
                              <div>
                                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 mb-4 block">Primary Brand Frequency</label>
                                 <div className="flex flex-wrap gap-4">
                                    {['#00ff9d', '#6366f1', '#f43f5e', '#f59e0b', '#06b6d4', '#8b5cf6'].map(c => (
                                       <button
                                          key={c}
                                          onClick={() => setBrandColor(c)}
                                          className={`w-14 h-14 rounded-2xl transition-all shadow-lg hover:scale-110 ${brandColor === c ? 'ring-4 ring-indigo-500/20 scale-110' : ''}`}
                                          style={{ backgroundColor: c }}
                                       >
                                          {brandColor === c && <Check size={24} className="mx-auto text-white drop-shadow-md" />}
                                       </button>
                                    ))}
                                    <div className="relative group">
                                       <input
                                          type="color"
                                          value={brandColor}
                                          onChange={e => setBrandColor(e.target.value)}
                                          className="w-14 h-14 opacity-0 absolute cursor-pointer"
                                       />
                                       <div className="w-14 h-14 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 group-hover:bg-slate-50 transition-all"><Plus size={20} /></div>
                                    </div>
                                 </div>
                              </div>

                              <div className="space-y-4">
                                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 block">Logo Asset</label>
                                 <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all group"
                                 >
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                    {logo ? (
                                       <img src={logo} className="h-24 w-auto object-contain mb-4 animate-in zoom-in" />
                                    ) : (
                                       <div className="text-slate-300 group-hover:text-indigo-400 transition-colors"><ImageIcon size={48} className="mb-4" /><p className="font-black text-[10px] uppercase tracking-widest">DRAG & DROP LOGO</p></div>
                                    )}
                                 </div>
                              </div>
                           </div>

                           <div className="w-full lg:w-72">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 mb-4 block">UI Component Preview</label>
                              <div className="p-8 bg-slate-900 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                                 <div className="absolute top-0 right-0 w-32 h-32 opacity-20 blur-[40px] rounded-full -mr-10 -mt-10 transition-colors duration-1000" style={{ backgroundColor: brandColor }}></div>
                                 <div className="w-10 h-10 rounded-xl mb-6 flex items-center justify-center text-white rotate-3 shadow-lg transition-colors duration-1000 shadow-[0_10px_30px_rgba(0,0,0,0.5)]" style={{ backgroundColor: brandColor }}><Zap size={18} /></div>
                                 <div className="space-y-3 mb-8">
                                    <div className="h-3 w-2/3 bg-white/10 rounded-full"></div>
                                    <div className="h-3 w-full bg-white/5 rounded-full"></div>
                                 </div>
                                 <button className="w-full py-4 rounded-xl text-[9px] font-black text-slate-950 uppercase tracking-[0.2em] transition-all duration-1000 shadow-xl" style={{ backgroundColor: brandColor }}>Action Trigger</button>
                              </div>
                           </div>
                        </div>
                     </div>
                  )}

                  {step === 5 && (
                     <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
                        <div>
                           <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-none">Modular Matrix</h3>
                           <p className="text-slate-500 font-medium text-lg leading-relaxed">Choose the functional layers to activate for your instance.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
                           {[
                              { id: 'CRM', label: 'CRM & SALES', icon: Users, desc: 'Contact graph & pipelines' },
                              { id: 'Catering', label: 'BANQUETING', icon: ChefHat, desc: 'Event engine & menu matrix' },
                              { id: 'Logistics', label: 'LOGISTICS', icon: Truck, desc: 'Distribution & rentals' },
                              { id: 'Inventory', label: 'STOCK IQ', icon: Package, desc: 'Global asset tracking' },
                              { id: 'Reports', label: 'INTELLIGENCE', icon: BarChart2, desc: 'Neural reporting hub' },
                              { id: 'Finance', label: 'FINANCE OPS', icon: Banknote, desc: 'Invoicing & ledger flow' }
                           ].map(mod => (
                              <button
                                 key={mod.id}
                                 onClick={() => toggleModule(mod.id as any)}
                                 className={`p-8 rounded-[2.5rem] border-2 flex flex-col items-start text-left transition-all duration-300 relative overflow-hidden group ${selectedModules.includes(mod.id as any) ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-[1.02]' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                              >
                                 <div className={`p-4 rounded-2xl mb-6 transition-all ${selectedModules.includes(mod.id as any) ? 'bg-white/20' : 'bg-slate-50'}`}>
                                    <mod.icon size={28} className={selectedModules.includes(mod.id as any) ? 'text-white' : 'text-slate-400'} />
                                 </div>
                                 <h4 className="font-black text-sm uppercase tracking-tight mb-2">{mod.label}</h4>
                                 <p className={`text-[10px] font-bold leading-tight ${selectedModules.includes(mod.id as any) ? 'text-white/60' : 'text-slate-400'}`}>{mod.desc}</p>
                                 {selectedModules.includes(mod.id as any) && <div className="absolute top-6 right-6 text-white/40"><CheckCircle2 size={24} /></div>}
                              </button>
                           ))}
                        </div>
                     </div>
                  )}

                  {step === 6 && (
                     <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
                        <div className="flex justify-between items-start">
                           <div>
                              <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-none">Assemble Team</h3>
                              <p className="text-slate-500 font-medium text-lg leading-relaxed">Broadcast invitations to initialize the human node network.</p>
                           </div>
                           <button onClick={addInvite} className="bg-slate-950 text-white p-5 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all"><Plus size={24} /></button>
                        </div>

                        <div className="space-y-4 pt-6">
                           {invites.map(invite => (
                              <div key={invite.email} className="p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] flex items-center justify-between group hover:border-indigo-200 transition-all">
                                 <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm"><Mail size={20} /></div>
                                    <div>
                                       <p className="font-black text-slate-900 text-sm">{invite.email}</p>
                                       <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{invite.role}</p>
                                    </div>
                                 </div>
                                 <button onClick={() => removeInvite(invite.email)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={20} /></button>
                              </div>
                           ))}

                           {invites.length === 0 && (
                              <div className="p-20 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] text-slate-300">
                                 <Bot size={56} className="mx-auto mb-6 opacity-10" />
                                 <p className="font-black uppercase tracking-widest text-xs">No personnel queued for deployment</p>
                              </div>
                           )}
                        </div>
                     </div>
                  )}
               </div>

               <div className="pt-10 flex justify-between items-center bg-white">
                  <button
                     onClick={prevStep}
                     className={`px-8 py-5 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-slate-900 transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
                  >
                     Go Back
                  </button>
                  <button
                     onClick={step === 6 ? handleFinish : nextStep}
                     disabled={isConfiguring}
                     className="px-12 py-5 bg-slate-950 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group"
                  >
                     {step === 6 ? 'Finalize Instantiation' : 'Continue Step'}
                     <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
};
