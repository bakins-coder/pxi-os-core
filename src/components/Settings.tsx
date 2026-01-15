
import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import { Role, User, OrganizationSettings } from '../types';
import { checkCloudHealth } from '../services/supabase';
import {
   Users, Mail, Shield, Plus, X, Building, LayoutGrid, Globe, Key, AlertTriangle, Cpu, CloudLightning, Loader2, Signal, Save, Phone, MapPin, Hash, RefreshCw
} from 'lucide-react';

export const Settings = () => {
   const [activeTab, setActiveTab] = useState<'team' | 'system' | 'general' | 'security'>('team');
   const { settings, updateSettings, cloudEnabled, isDemoMode, strictMode } = useSettingsStore();
   const { employees, addEmployee } = useDataStore();
   const { user: currentUser } = useAuthStore();
   const [cloudStatus, setCloudStatus] = useState<any>(null);
   const [isVerifying, setIsVerifying] = useState(false);

   // Local profile state for the form
   const [profile, setProfile] = useState({
      name: settings.name,
      address: settings.address || '',
      phone: settings.contactPhone || '',
      tin: settings.firs_tin || '',
      bankName: settings.bankInfo?.bankName || '',
      accountName: settings.bankInfo?.accountName || '',
      accountNumber: settings.bankInfo?.accountNumber || ''
   });

   useEffect(() => {
      setProfile({
         name: settings.name,
         address: settings.address || '',
         phone: settings.contactPhone || '',
         tin: settings.firs_tin || '',
         bankName: settings.bankInfo?.bankName || '',
         accountName: settings.bankInfo?.accountName || '',
         accountNumber: settings.bankInfo?.accountNumber || ''
      });
   }, [settings]);

   useEffect(() => {
      if (activeTab === 'system') verifyCloud();
   }, [activeTab]);

   const verifyCloud = async () => {
      setIsVerifying(true);
      const health = await checkCloudHealth();
      setCloudStatus(health);
      setIsVerifying(false);
   };

   const handleUpdateProfile = (e: React.FormEvent) => {
      e.preventDefault();
      updateSettings({
         name: profile.name,
         address: profile.address,
         contactPhone: profile.phone,
         firs_tin: profile.tin,
         bankInfo: {
            bankName: profile.bankName,
            accountName: profile.accountName,
            accountNumber: profile.accountNumber
         }
      });
      alert('Business Profile Updated.');
   };

   const handleInvite = () => {
      const email = prompt('Enter team member email:');
      if (email) {
         // In a real system, this sends an invitation.
         // Here we'll mock it by adding an employee or a user record.
         addEmployee({
            email,
            firstName: email.split('@')[0],
            lastName: 'Invite',
            id: `inv-${Date.now()}`,
            status: 'ACTIVE' as any,
            role: Role.AGENT
         } as any);
         alert(`Invitation sent to ${email}`);
      }
   };

   return (
      <div className="space-y-6 animate-in fade-in pb-20">
         <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-8">Settings</h1>
         <div className="flex bg-slate-900 border border-white/5 p-1 rounded-2xl w-fit mb-10">
            {[
               { id: 'team', label: 'Team Members' },
               { id: 'system', label: 'Platform Management' },
               { id: 'general', label: 'Business Profile' },
               { id: 'security', label: 'Security & Access' }
            ].map(tab => (
               <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === tab.id ? 'bg-[#00ff9d] text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                  {tab.label}
               </button>
            ))}
         </div>

         <div className="bg-slate-950 rounded-[3rem] border border-white/5 p-10 min-h-[600px] text-white">
            {activeTab === 'team' && (
               <div className="space-y-10">
                  <div className="flex justify-between items-center">
                     <h2 className="text-2xl font-black uppercase tracking-tight">Access Control</h2>
                     <button onClick={handleInvite} className="bg-[#00ff9d] text-slate-950 px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl hover:scale-105 transition-all">Invite Team Member</button>
                  </div>
                  <div className="space-y-4">
                     {employees.map(emp => (
                        <div key={emp.id} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5">
                           <div className="flex items-center gap-4">
                              <img src={emp.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.email}`} className="w-12 h-12 rounded-2xl bg-slate-800" alt="avatar" />
                              <div>
                                 <div className="font-black uppercase text-sm">{emp.firstName} {emp.lastName}</div>
                                 <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{emp.email}</div>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <span className="text-[10px] font-black text-[#00ff9d] uppercase bg-[#00ff9d]/10 px-3 py-1 rounded-full border border-[#00ff9d]/20">{emp.role}</span>
                              <button className="p-2 text-slate-600 hover:text-rose-500 transition-colors"><X size={16} /></button>
                           </div>
                        </div>
                     ))}
                     {employees.length === 0 && (
                        <div className="p-20 text-center text-slate-500 border-2 border-dashed border-white/5 rounded-[2.5rem]">
                           <Users size={48} className="mx-auto mb-4 opacity-10" />
                           <p className="font-black uppercase tracking-widest text-xs">No active team nodes detected</p>
                        </div>
                     )}
                  </div>
               </div>
            )}

            {activeTab === 'system' && (
               <div className="space-y-10 max-w-2xl">
                  <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-10"><CloudLightning size={100} /></div>
                     <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Cloud Infrastructure</h2>
                     <p className="text-xs text-slate-400 font-bold mb-8">Live Synchronization & Database Integrity</p>

                     <div className="space-y-6">
                        <div className="flex items-center justify-between p-6 bg-slate-900 rounded-3xl border border-white/5">
                           <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-2xl ${cloudEnabled ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}><Globe size={20} /></div>
                              <div>
                                 <p className="font-black uppercase text-xs">Supabase Persistence</p>
                                 <p className="text-[10px] text-slate-500 font-bold uppercase">{cloudEnabled ? 'Linked & Active' : 'Offline Mode'}</p>
                              </div>
                           </div>
                           <button
                              onClick={verifyCloud}
                              disabled={isVerifying}
                              className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all"
                           >
                              {isVerifying ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                           </button>
                        </div>

                        {cloudStatus && (
                           <div className={`p-6 rounded-3xl border ${cloudStatus.healthy ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                              <div className="flex items-center gap-3 font-black uppercase text-[10px] tracking-widest mb-2">
                                 <Signal size={14} /> Telemetry Report
                              </div>
                              <p className="text-xs font-bold">{cloudStatus.message}</p>
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5">
                        <Cpu className="text-indigo-400 mb-4" />
                        <h3 className="font-black uppercase text-xs mb-1">Agent Strict Mode</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-4">{strictMode ? 'Enforced' : 'Relaxed'}</p>
                        <button
                           onClick={() => updateSettings({ strictMode: !strictMode } as any)}
                           className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase transition-all ${strictMode ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'}`}
                        >
                           {strictMode ? 'Disable Override' : 'Activate Strict'}
                        </button>
                     </div>
                     <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5">
                        <AlertTriangle className="text-amber-400 mb-4" />
                        <h3 className="font-black uppercase text-xs mb-1">Factory Reset</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-4">Wipe Local Instance</p>
                        <button
                           onClick={() => { if (confirm('Wipe everything?')) { localStorage.clear(); window.location.reload(); } }}
                           className="px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl font-black text-[9px] uppercase hover:bg-rose-500 hover:text-white transition-all"
                        >
                           Wipe Memory
                        </button>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'general' && (
               <form onSubmit={handleUpdateProfile} className="max-w-2xl space-y-10">
                  <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/5">
                     <h2 className="text-2xl font-black uppercase tracking-tight mb-8">Entity Identity</h2>
                     <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Legal Name</label>
                              <div className="relative">
                                 <Building className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                                 <input
                                    className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 pl-14 pr-6 font-black text-sm text-white focus:border-[#00ff9d] outline-none transition-all"
                                    value={profile.name}
                                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                                 />
                              </div>
                           </div>
                           <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Tax ID (TIN/VAT)</label>
                              <div className="relative">
                                 <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                                 <input
                                    className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 pl-14 pr-6 font-black text-sm text-white focus:border-[#00ff9d] outline-none transition-all"
                                    value={profile.tin}
                                    onChange={e => setProfile({ ...profile, tin: e.target.value })}
                                 />
                              </div>
                           </div>
                        </div>

                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Corporate Headquarters</label>
                           <div className="relative">
                              <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                              <input
                                 className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 pl-14 pr-6 font-black text-sm text-white focus:border-[#00ff9d] outline-none transition-all"
                                 value={profile.address}
                                 onChange={e => setProfile({ ...profile, address: e.target.value })}
                              />
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Main Contact Phone</label>
                              <div className="relative">
                                 <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                                 <input
                                    className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 pl-14 pr-6 font-black text-sm text-white focus:border-[#00ff9d] outline-none transition-all"
                                    value={profile.phone}
                                    onChange={e => setProfile({ ...profile, phone: e.target.value })}
                                 />
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/5">
                     <h2 className="text-2xl font-black uppercase tracking-tight mb-8">Financial Coordinates</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Bank Name</label>
                           <input
                              className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 px-6 font-black text-sm text-white focus:border-[#00ff9d] outline-none transition-all placeholder:text-slate-600"
                              placeholder="e.g. Access Bank"
                              value={profile.bankName}
                              onChange={e => setProfile({ ...profile, bankName: e.target.value })}
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Account Number</label>
                           <input
                              className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 px-6 font-black text-sm text-white focus:border-[#00ff9d] outline-none transition-all placeholder:text-slate-600"
                              placeholder="0123456789"
                              value={profile.accountNumber}
                              onChange={e => setProfile({ ...profile, accountNumber: e.target.value })}
                           />
                        </div>
                        <div className="space-y-3 md:col-span-2">
                           <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Account Name</label>
                           <input
                              className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 px-6 font-black text-sm text-white focus:border-[#00ff9d] outline-none transition-all placeholder:text-slate-600"
                              placeholder="e.g. Xquisite Celebrations Ltd"
                              value={profile.accountName}
                              onChange={e => setProfile({ ...profile, accountName: e.target.value })}
                           />
                        </div>
                     </div>
                  </div>

                  <div className="flex justify-end pr-4">
                     <button type="submit" className="flex items-center gap-3 bg-[#00ff9d] text-slate-950 px-10 py-5 rounded-[2rem] font-black uppercase text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all">
                        <Save size={18} /> Commit Configuration
                     </button>
                  </div>
               </form>
            )}

            {activeTab === 'security' && <SecuritySettings />}
         </div>
      </div >
   );
};

const SecuritySettings = () => {
   const { updatePassword, user } = useAuthStore();
   const [password, setPassword] = useState('');
   const [confirm, setConfirm] = useState('');
   const [isLoading, setIsLoading] = useState(false);

   const handleUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (password !== confirm) return alert('Passwords do not match');
      if (password.length < 6) return alert('Password too short');

      setIsLoading(true);
      try {
         await updatePassword(password);
         alert('Password updated successfully');
         setPassword('');
         setConfirm('');
      } catch (err: any) {
         alert('Failed to update: ' + err.message);
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <div className="max-w-xl animate-in fade-in">
         <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/5 mb-8">
            <div className="flex items-center gap-4 mb-6">
               <div className="p-4 bg-indigo-500/20 text-indigo-400 rounded-2xl"><Key size={24} /></div>
               <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Credentials</h2>
                  <p className="text-xs text-slate-400 font-bold">Update your access keys</p>
               </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-6">
               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">New Password</label>
                  <input
                     type="password"
                     required
                     className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 px-6 font-black text-sm text-white focus:border-[#00ff9d] outline-none transition-all"
                     placeholder="••••••••"
                     value={password}
                     onChange={e => setPassword(e.target.value)}
                  />
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Confirm Password</label>
                  <input
                     type="password"
                     required
                     className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 px-6 font-black text-sm text-white focus:border-[#00ff9d] outline-none transition-all"
                     placeholder="••••••••"
                     value={confirm}
                     onChange={e => setConfirm(e.target.value)}
                  />
               </div>

               <div className="pt-4">
                  <button disabled={isLoading} className="w-full bg-[#00ff9d] text-slate-950 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all">
                     {isLoading ? 'Updating...' : 'Update Password'}
                  </button>
               </div>
            </form>
         </div>

         <div className="bg-rose-500/5 p-8 rounded-[2.5rem] border border-rose-500/10">
            <h3 className="font-black text-rose-500 uppercase text-xs mb-2">Session Control</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-4">Current Session ID: {user?.id?.slice(0, 8)}...</p>
         </div>
      </div>
   );
};
