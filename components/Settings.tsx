import React, { useState } from 'react';
import { db } from '../services/mockDb';
import { Role, User, AppModule, Integration } from '../types';
import { 
  Users, Mail, Shield, Trash2, Plus, Search, Check, X, Building, CreditCard,
  LayoutGrid, BarChart2, MessageSquare, Phone, Package, Utensils, Zap, ToggleLeft, ToggleRight,
  Globe, Key, Copy, CheckCircle, AlertTriangle, RefreshCw, Briefcase, Github, Terminal, Info, ExternalLink, Play, Monitor, Apple
} from 'lucide-react';

export const Settings = () => {
  const [activeTab, setActiveTab] = useState<'team' | 'general' | 'modules' | 'integrations' | 'github'>('team');
  const [osType, setOsType] = useState<'windows' | 'mac'>('windows');
  const [team, setTeam] = useState<User[]>(db.getTeamMembers());
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>(Role.AGENT);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [enabledModules, setEnabledModules] = useState<AppModule[]>(db.organizationSettings.enabledModules || []);
  const [integrations, setIntegrations] = useState<Integration[]>(db.organizationSettings.integrations || []);
  const [apiKeys, setApiKeys] = useState(db.organizationSettings.apiKeys || []);
  
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const org = db.organizationSettings;
  const REPO_URL = "https://github.com/bakins-coder/pxi-os-core.git";

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    db.inviteUser(inviteEmail, inviteRole);
    setTeam(db.getTeamMembers());
    setInviteEmail('');
    setIsInviteOpen(false);
  };

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(cmd);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const renderGithubRepair = () => (
    <div className="space-y-8 animate-in slide-in-from-right duration-500">
      <div className="bg-slate-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl animate-float">
                  <Github size={36}/>
               </div>
               <div>
                  <h2 className="text-3xl font-black tracking-tight uppercase leading-none">Identity Sync</h2>
                  <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mt-2 border-l-2 border-indigo-500/50 pl-3">Repository Resolution Center</p>
               </div>
            </div>
            
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
               <button 
                  onClick={() => setOsType('windows')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${osType === 'windows' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
               >
                  <Monitor size={14}/> Windows
               </button>
               <button 
                  onClick={() => setOsType('mac')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${osType === 'mac' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
               >
                  <Apple size={14}/> Mac/Linux
               </button>
            </div>
         </div>
         
         <div className="bg-indigo-600/10 border border-indigo-600/20 p-8 rounded-3xl mb-10 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md">
            <div className="flex items-start gap-4">
               <Play className="text-indigo-400 mt-1 flex-shrink-0" size={24}/>
               <div>
                  <h4 className="font-bold text-indigo-100">Run Automated Repair Script</h4>
                  <p className="text-sm text-indigo-200/70 mt-1">
                     {osType === 'windows' 
                        ? 'Run the .bat file in your Command Prompt to fix the repository link.' 
                        : 'Run the .sh file in your terminal to fix the repository link.'}
                  </p>
               </div>
            </div>
            <button 
               onClick={() => copyCommand(osType === 'windows' ? "SYNC_REPO.bat" : "bash SYNC_REPO.sh")}
               className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 active:scale-95 shadow-xl transition-all flex items-center gap-2 whitespace-nowrap"
            >
               {copiedCommand === (osType === 'windows' ? "SYNC_REPO.bat" : "bash SYNC_REPO.sh") ? <Check size={14}/> : <Terminal size={14}/>}
               {osType === 'windows' ? 'Copy: SYNC_REPO.bat' : 'Copy: bash SYNC_REPO.sh'}
            </button>
         </div>

         <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Manual Command Sequence ({osType === 'windows' ? 'CMD' : 'Bash'})</h3>
            
            <div className="grid grid-cols-1 gap-4">
               {[
                  { step: 1, label: 'Sever Old Link', cmd: 'git remote remove origin' },
                  { step: 2, label: 'Reset Git State', cmd: 'git init' },
                  { step: 3, label: 'Stage All Files', cmd: 'git add .' },
                  { step: 4, label: 'Identity Commit', cmd: 'git commit -m "chore: align repository identity to pxi-os-core"' },
                  { step: 5, label: 'Establish Link', cmd: `git remote add origin ${REPO_URL}` },
                  { step: 6, label: 'Push & Sync', cmd: 'git push -u origin main' },
               ].map(item => (
                  <div key={item.step} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-white/10 transition-all border-l-4 border-l-indigo-600/30">
                     <div className="flex items-center gap-4 flex-1">
                        <span className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 text-[10px] font-black flex items-center justify-center border border-indigo-500/30">{item.step}</span>
                        <div className="flex-1">
                           <div className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">{item.label}</div>
                           <code className="text-xs font-mono text-slate-300 mt-1 block bg-black/20 p-2 rounded-lg">{item.cmd}</code>
                        </div>
                     </div>
                     <button 
                        onClick={() => copyCommand(item.cmd)}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${copiedCommand === item.cmd ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-indigo-50 active:scale-95'}`}
                     >
                        {copiedCommand === item.cmd ? <Check size={14}/> : 'Copy'}
                     </button>
                  </div>
               ))}
            </div>
         </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center shadow-inner">
               <Info size={32}/>
            </div>
            <div>
               <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Windows User Notice</h4>
               <p className="text-sm text-slate-500 font-medium">If you are using standard CMD, use the **Windows** tab above. If you are using Git Bash, use the **Mac/Linux** tab.</p>
            </div>
         </div>
         <div className="flex gap-4">
            <a href={REPO_URL} target="_blank" className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 active:scale-95 shadow-xl">
               View Repository <ExternalLink size={14}/>
            </a>
         </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Settings</h1>
        <div className="flex bg-white border border-slate-100 p-1.5 rounded-2xl shadow-sm overflow-x-auto max-w-full">
           {[
             { id: 'team', label: 'Team', icon: Users },
             { id: 'modules', label: 'Apps', icon: LayoutGrid },
             { id: 'integrations', label: 'Nodes', icon: Globe },
             { id: 'github', label: 'GitHub Sync', icon: Github },
             { id: 'general', label: 'Org', icon: Building }
           ].map(tab => (
             <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
             >
               <tab.icon size={14}/> {tab.label}
             </button>
           ))}
        </div>
      </div>

      {activeTab === 'github' ? renderGithubRepair() : (
        <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden min-h-[600px]">
           {activeTab === 'team' && (
             <div className="p-10">
                <div className="flex justify-between items-center mb-10">
                   <div>
                      <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Personnel Access</h2>
                      <p className="text-sm text-slate-500 font-medium">Manage cross-functional roles for the NEXUS OS.</p>
                   </div>
                   <button onClick={() => setIsInviteOpen(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-3 active:scale-95 transition-all">
                      <Plus size={18}/> New Access Token
                   </button>
                </div>
                <div className="overflow-x-auto rounded-3xl border border-slate-100">
                   <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-100">
                         <tr>
                            <th className="px-8 py-6">Identity</th>
                            <th className="px-8 py-6">Privilege</th>
                            <th className="px-8 py-6">Node Status</th>
                            <th className="px-8 py-6 text-right">Ops</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {team.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                               <td className="px-8 py-6">
                                  <div className="flex items-center gap-4">
                                     <img src={user.avatar} className="w-12 h-12 rounded-2xl bg-slate-100 shadow-sm" />
                                     <div>
                                        <div className="font-black text-slate-800 uppercase tracking-tight text-sm">{user.name}</div>
                                        <div className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{user.email}</div>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-8 py-6">
                                  <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">{user.role}</span>
                               </td>
                               <td className="px-8 py-6"><span className="px-3 py-1 bg-green-50 text-green-600 text-[9px] font-black uppercase rounded-full border border-green-100 flex items-center gap-2 w-fit"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> Active Node</span></td>
                               <td className="px-8 py-6 text-right"><button className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18}/></button></td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
           )}

           {activeTab === 'modules' && (
              <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {db.organizationSettings.enabledModules.map(m => (
                    <div key={m} className="p-8 rounded-[2.5rem] border-2 border-indigo-50 bg-indigo-50/20 flex flex-col justify-between hover:border-indigo-200 transition-all group">
                       <div className="flex justify-between items-start mb-8">
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-lg border border-white group-hover:scale-110 transition-transform">
                             <Zap size={28}/>
                          </div>
                          <ToggleRight size={36} className="text-indigo-600" fill="currentColor"/>
                       </div>
                       <div>
                          <h3 className="font-black text-slate-800 uppercase tracking-tight text-lg">{m}</h3>
                          <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">System module provisioned and synced to core ledger.</p>
                       </div>
                    </div>
                 ))}
                 <button className="p-8 rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all">
                    <Plus size={32}/>
                    <span className="text-[10px] font-black uppercase tracking-widest">Provision New App</span>
                 </button>
              </div>
           )}

           {activeTab === 'general' && (
              <div className="p-12 space-y-12">
                 <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-8">Organization Profile</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                       <div className="space-y-8">
                          <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Nexus Workspace Name</label>
                             <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" defaultValue={org.name}/>
                          </div>
                          <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Primary Industry</label>
                             <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" defaultValue={org.type}/>
                          </div>
                       </div>
                       <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between">
                          <div className="absolute bottom-0 right-0 w-48 h-48 bg-indigo-600/20 rounded-full blur-[60px] -mr-16 -mb-16"></div>
                          <div className="relative z-10">
                             <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em] mb-4">Subscription Status</h4>
                             <p className="text-4xl font-black tracking-tighter">PRO PLAN</p>
                             <div className="flex items-center gap-2 mt-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Verified Workspace</p>
                             </div>
                          </div>
                          <button className="relative z-10 mt-10 bg-white text-slate-950 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl active:scale-95">Manage Billing</button>
                       </div>
                    </div>
                 </div>
              </div>
           )}
        </div>
      )}
    </div>
  );
};