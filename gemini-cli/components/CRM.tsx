import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/mockDb';
import { DealStage, Deal, Contact, Task, Role, DealItem } from '../types';
import { EventCalendar } from './EventCalendar';
import * as XLSX from 'xlsx';
import { 
  Search, Plus, Phone, Mail, MoreVertical, X, Sparkles, Bot, Play, Pause, Zap, 
  CheckCircle2, ListFilter, CheckSquare, Calendar, Flag, User, Clock,
  Users, TrendingUp, MessageSquare, Database, ArrowRight, Package, Trash2, Upload, CalendarDays,
  Building2, ChevronRight, Briefcase, Hash, MapPin, Globe, FileSpreadsheet
} from 'lucide-react';

const AddContactModal = ({ isOpen, onClose, onAdd }: { isOpen: boolean, onClose: () => void, onAdd: (c: Partial<Contact>) => void }) => {
  const [segment, setSegment] = useState<'Individual' | 'Company'>('Individual');
  const [formData, setFormData] = useState<Partial<Contact>>({ type: 'Individual' });
  const brandColor = db.organizationSettings.brandColor || '#4f46e5';

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ ...formData, type: segment });
    onClose();
    setFormData({ type: 'Individual' });
  };

  const updateField = (field: keyof Contact, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
       <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center">
             <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Acquisition Input</h2>
                <p className="text-sm text-slate-500 font-medium">Segmenting your lead pipeline into the OS core.</p>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X/></button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8 flex-1 overflow-y-auto max-h-[70vh]">
             <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button 
                  type="button"
                  onClick={() => { setSegment('Individual'); updateField('type', 'Individual'); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${segment === 'Individual' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >
                   <User size={16} style={segment === 'Individual' ? { color: brandColor } : {}}/> Individual
                </button>
                <button 
                  type="button"
                  onClick={() => { setSegment('Company'); updateField('type', 'Company'); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${segment === 'Company' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >
                   <Building2 size={16} style={segment === 'Company' ? { color: brandColor } : {}}/> Company / B2B
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      {segment === 'Individual' ? 'Full Legal Name' : 'Registered Business Name'}
                   </label>
                   <input 
                      required
                      className="w-full border border-slate-200 rounded-2xl p-4 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                      placeholder={segment === 'Individual' ? "e.g. Tunde Enitan" : "e.g. Zenith Global Services"}
                      value={formData.name || ''}
                      onChange={e => updateField('name', e.target.value)}
                   />
                </div>

                {segment === 'Company' ? (
                   <>
                      <div>
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Registration No (RC/BN)</label>
                         <div className="relative">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                            <input className="w-full pl-10 pr-4 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-sm font-bold" placeholder="RC-123456" value={formData.registrationNumber || ''} onChange={e => updateField('registrationNumber', e.target.value)}/>
                         </div>
                      </div>
                      <div>
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Industry Sector</label>
                         <select className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 text-sm font-bold" value={formData.industry || ''} onChange={e => updateField('industry', e.target.value)}>
                            <option value="">Select Sector...</option>
                            <option value="Banking">Banking</option>
                            <option value="FMCG">FMCG</option>
                            <option value="Oil & Gas">Oil & Gas</option>
                            <option value="Tech">Technology</option>
                         </select>
                      </div>
                      <div className="md:col-span-2">
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Primary Contact Person</label>
                         <input className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 text-sm font-bold" placeholder="Who are we dealing with?" value={formData.contactPerson || ''} onChange={e => updateField('contactPerson', e.target.value)}/>
                      </div>
                   </>
                ) : (
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Job Designation</label>
                      <div className="relative">
                         <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                         <input className="w-full pl-10 pr-4 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-sm font-bold" placeholder="e.g. General Manager" value={formData.jobTitle || ''} onChange={e => updateField('jobTitle', e.target.value)}/>
                      </div>
                   </div>
                )}

                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Direct Contact (Phone)</label>
                   <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                      <input required className="w-full pl-10 pr-4 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-sm font-bold" placeholder="+234..." value={formData.phone || ''} onChange={e => updateField('phone', e.target.value)}/>
                   </div>
                </div>

                <div className={segment === 'Individual' ? '' : 'md:col-span-2'}>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Digital Correspondence (Email)</label>
                   <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                      <input required type="email" className="w-full pl-10 pr-4 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-sm font-bold" placeholder="name@domain.com" value={formData.email || ''} onChange={e => updateField('email', e.target.value)}/>
                   </div>
                </div>

                <div className="md:col-span-2">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Physical Address / HQ</label>
                   <div className="relative">
                      <MapPin className="absolute left-4 top-4 text-slate-400" size={14}/>
                      <textarea className="w-full pl-10 pr-4 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-sm font-bold h-24 resize-none" placeholder="Enter full address..." value={formData.address || ''} onChange={e => updateField('address', e.target.value)}/>
                   </div>
                </div>
             </div>
          </form>

          <div className="p-8 border-t border-slate-100 flex gap-4">
             <button type="button" onClick={onClose} className="flex-1 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 rounded-2xl transition-all">Cancel Entry</button>
             <button 
                onClick={handleSubmit}
                className="flex-1 py-4 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl transition-all active:scale-95"
                style={{ backgroundColor: brandColor, boxShadow: `0 10px 20px ${brandColor}33` }}
             >
                Integrate Contact <ChevronRight className="inline-block ml-1" size={14}/>
             </button>
          </div>
       </div>
    </div>
  );
};

export const CRM = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<'contacts' | 'deals' | 'tasks' | 'calendar'>('contacts');
  const [deals, setDeals] = useState<Deal[]>(db.getDeals());
  const [contacts, setContacts] = useState<Contact[]>(db.contacts);
  const [tasks, setTasks] = useState<Task[]>(db.tasks);
  const [isAutoPilotOn, setIsAutoPilotOn] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const brandColor = db.organizationSettings.brandColor || '#4f46e5';

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
       setContacts([...db.contacts]);
       setDeals([...db.deals]);
       setTasks([...db.tasks]);
    });
    return unsubscribe;
  }, []);

  const handleAddContact = (c: Partial<Contact>) => {
     db.addContact(c);
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsBulkImporting(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet) as any[];

      const formattedContacts: Partial<Contact>[] = json.map(row => ({
        name: row.Name || row.name || row['Company Name'] || 'Unnamed Contact',
        email: row.Email || row.email || '',
        phone: row.Phone || row.phone || '',
        type: row.Type || row.type || (row['Company Name'] ? 'Company' : 'Individual'),
        industry: row.Industry || row.industry || '',
        registrationNumber: row.Registration || row['RC Number'] || '',
        contactPerson: row['Contact Person'] || '',
        jobTitle: row['Job Title'] || '',
        address: row.Address || row.address || ''
      }));

      db.addContactsBulk(formattedContacts);
      alert(`Successfully integrated ${formattedContacts.length} contacts into the roster.`);
      setIsBulkImporting(false);
    };
    reader.readAsBinaryString(file);
  };

  const handleDeleteContact = (id: string) => {
     if (confirm("Revoke this contact from the OS?")) {
        db.deleteContact(id);
     }
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      {/* HERO SECTION - NEXUS STYLE */}
      <div className="bg-slate-950 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl animate-float">
                   <Users size={36} />
                </div>
                <div>
                   <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">CRM Command</h1>
                   <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-300 border border-white/5">
                         <Database size={12} className="text-indigo-400"/> Centralized Ledger Active
                      </span>
                   </div>
                </div>
             </div>

             <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md overflow-x-auto max-w-full">
                {[
                  { id: 'contacts', label: 'Roster', icon: Users },
                  { id: 'deals', label: 'Pipeline', icon: TrendingUp },
                  { id: 'calendar', label: 'Events', icon: CalendarDays },
                  { id: 'tasks', label: 'Actions', icon: CheckSquare }
                ].map(tab => (
                   <button 
                      key={tab.id} 
                      onClick={() => setView(tab.id as any)} 
                      className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${view === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
                   >
                      <tab.icon size={14}/> {tab.label}
                   </button>
                ))}
             </div>
          </div>
       </div>

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <p className="text-slate-500 font-medium">Deep customer intelligence and lifecycle orchestration.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
           <button 
             onClick={() => setIsAutoPilotOn(!isAutoPilotOn)}
             className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                isAutoPilotOn 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-500/30' 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
             }`}
           >
             <Bot size={16} className={isAutoPilotOn ? 'animate-pulse' : ''} />
             {isAutoPilotOn ? 'AI Auto-Pilot: Active' : 'Autonomous Sourcing'}
           </button>
        </div>
      </div>

      {view === 'contacts' && (
         <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
               <div className="flex-1 w-full relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                  <input className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" placeholder="Search segmented roster..."/>
               </div>
               <div className="flex gap-3 w-full md:w-auto">
                  <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .csv" onChange={handleBulkUpload}/>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isBulkImporting}
                    className="flex-1 md:flex-none px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-slate-50 transition-all disabled:opacity-50"
                  >
                    <FileSpreadsheet size={16}/> {isBulkImporting ? 'Ingesting...' : 'Import Dataset'}
                  </button>
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex-1 md:flex-none px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                    style={{ backgroundColor: brandColor, boxShadow: `0 10px 15px ${brandColor}33` }}
                  >
                    <Plus size={16}/> New Acquisition
                  </button>
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] border-b border-slate-100">
                        <tr>
                           <th className="px-8 py-6">Customer Segment</th>
                           <th className="px-8 py-6">Identity Details</th>
                           <th className="px-8 py-6">Direct Channels</th>
                           <th className="px-8 py-6">Sentiment</th>
                           <th className="px-8 py-6 text-right">Ops</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {contacts.map(con => (
                           <tr key={con.id} className="hover:bg-indigo-50/20 transition-all group">
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-md transition-all">
                                       {con.type === 'Company' ? <Building2 size={20}/> : <User size={20}/>}
                                    </div>
                                    <div>
                                       <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${con.type === 'Company' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                          {con.type === 'Company' ? 'B2B' : 'B2C'}
                                       </span>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-6">
                                 <div className="font-black text-slate-800 uppercase tracking-tight">{con.name}</div>
                                 <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                                    {con.type === 'Company' ? (
                                       <>
                                          <Briefcase size={10} className="text-indigo-400"/> {con.industry} • {con.registrationNumber}
                                       </>
                                    ) : (
                                       <>
                                          <User size={10} className="text-indigo-400"/> {con.jobTitle || 'Individual Account'}
                                       </>
                                    )}
                                 </div>
                              </td>
                              <td className="px-8 py-6">
                                 <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600"><Mail size={12} className="text-slate-400"/> {con.email}</div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><Phone size={12}/> {con.phone}</div>
                                 </div>
                              </td>
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                       <div className="h-full bg-green-500" style={{ width: `${con.sentimentScore * 100}%` }}></div>
                                    </div>
                                    <span className="text-[10px] font-black text-green-600">{(con.sentimentScore * 100).toFixed(0)}%</span>
                                 </div>
                              </td>
                              <td className="px-8 py-6 text-right">
                                 <div className="flex justify-end gap-2">
                                    <button className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><MessageSquare size={16}/></button>
                                    <button onClick={() => handleDeleteContact(con.id)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      )}

      {view === 'calendar' && <EventCalendar />}
      
      {view === 'deals' && (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {['Lead', 'Proposal', 'Negotiation', 'Won'].map(stage => (
               <div key={stage} className="space-y-4">
                  <div className="flex justify-between items-center px-4">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stage}</h3>
                     <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{deals.filter(d => d.stage === stage).length}</span>
                  </div>
                  <div className="space-y-4 min-h-[500px] p-2 rounded-[2rem] bg-slate-50/50 border border-dashed border-slate-200">
                     {deals.filter(d => d.stage === stage).map(deal => (
                        <div key={deal.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-grab active:cursor-grabbing">
                           <div className="font-black text-slate-800 uppercase text-xs mb-3 truncate">{deal.name}</div>
                           <div className="flex justify-between items-center">
                              <span className="text-lg font-black text-indigo-600">₦{(deal.value / 1000).toFixed(0)}K</span>
                              <div className="flex -space-x-2">
                                 <div className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-indigo-600">AI</div>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            ))}
         </div>
      )}

      <AddContactModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={handleAddContact} 
      />
    </div>
  );
};