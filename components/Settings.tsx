
import React, { useState, useEffect } from 'react';
import { nexusStore } from '../services/nexusStore';
import { Role, User } from '../types';
import { checkCloudHealth } from '../services/supabase';
import { 
  Users, Mail, Shield, Plus, X, Building, LayoutGrid, Globe, Key, AlertTriangle, Cpu, CloudLightning, Loader2, Signal
} from 'lucide-react';

export const Settings = () => {
  const [activeTab, setActiveTab] = useState<'team' | 'system' | 'general'>('team');
  const [team, setTeam] = useState<User[]>(nexusStore.getTeamMembers());
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>(Role.AGENT);
  const [cloudStatus, setCloudStatus] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const unsubscribe = nexusStore.subscribe(() => setTeam(nexusStore.getTeamMembers()));
    if (activeTab === 'system') verifyCloud();
    return unsubscribe;
  }, [activeTab]);

  const verifyCloud = async () => {
    setIsVerifying(true);
    const health = await checkCloudHealth();
    setCloudStatus(health);
    setIsVerifying(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-8">Settings</h1>
      <div className="flex bg-slate-900 border border-white/5 p-1 rounded-2xl w-fit mb-10">
         {['team', 'system', 'general'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === tab ? 'bg-[#00ff9d] text-slate-950 shadow-lg' : 'text-slate-500'}`}>
               {tab}
            </button>
         ))}
      </div>

      <div className="bg-slate-950 rounded-[3rem] border border-white/5 p-10 min-h-[600px] text-white">
         {activeTab === 'team' && (
            <div className="space-y-10">
               <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black uppercase tracking-tight">Personnel Access</h2>
                  <button onClick={() => nexusStore.inviteUser(prompt('Email?') || '', Role.AGENT)} className="bg-[#00ff9d] text-slate-950 px-6 py-3 rounded-2xl font-black text-[10px] uppercase">New Access Token</button>
               </div>
               <div className="space-y-4">
                  {team.map(user => (
                     <div key={user.id} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5">
                        <div className="flex items-center gap-4">
                           <img src={user.avatar} className="w-12 h-12 rounded-2xl bg-slate-800" alt="avatar"/>
                           <div><div className="font-black uppercase">{user.name}</div><div className="text-[10px] text-slate-500">{user.email}</div></div>
                        </div>
                        <span className="text-[10px] font-black text-[#00ff9d] uppercase bg-[#00ff9d]/10 px-3 py-1 rounded-full border border-[#00ff9d]/20">{user.role}</span>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {activeTab === 'system' && (
            <div className="space-y-10 animate-in slide-in-from-bottom-4">
               <h2 className="text-3xl font-black uppercase tracking-tight">System Operations</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 bg-white/5 rounded-[3rem] border border-white/10 flex flex-col justify-between">
                     <div>
                        <div className="flex justify-between items-start mb-8">
                           <Signal className={cloudStatus?.status === 'Connected' ? 'text-[#00ff9d]' : 'text-rose-500'}/>
                           <span className="text-[10px] font-black uppercase">{cloudStatus?.status || 'Offline'}</span>
                        </div>
                        <h3 className="text-xl font-black mb-4">Cloud Nexus Link</h3>
                        <p className="text-slate-500 text-sm mb-10 font-medium">Provision live synchronization between this node and the global ledger.</p>
                     </div>
                     <button onClick={verifyCloud} className="bg-[#00ff9d] text-slate-950 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">Verify Connection</button>
                  </div>
                  <div className="p-8 bg-rose-500/10 rounded-[3rem] border border-rose-500/20">
                     <AlertTriangle className="text-rose-500 mb-6" size={32}/>
                     <h3 className="text-xl font-black mb-4">Neural Flush</h3>
                     <p className="text-rose-200/50 text-sm mb-10">Wipe all local data and reset node identity. This is permanent.</p>
                     <button onClick={() => nexusStore.resetInstance()} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase">Trigger Reset</button>
                  </div>
               </div>
            </div>
         )}
      </div>
    </div>
  );
};
