
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { nexusStore } from '../services/nexusStore';
import { Deal, Contact, Task, Role } from '../types';
import { EventCalendar } from './EventCalendar';
import * as XLSX from 'xlsx';
import { 
  Search, Plus, Phone, Mail, X, Bot, Zap, 
  CheckCircle2, CheckSquare, CalendarDays,
  Users, TrendingUp, MessageSquare, Database, ChevronRight, Briefcase, Hash, MapPin, FileSpreadsheet, Trash2
} from 'lucide-react';

const AddContactModal = ({ isOpen, onClose, onAdd }: { isOpen: boolean, onClose: () => void, onAdd: (c: Partial<Contact>) => void }) => {
  const [segment, setSegment] = useState<'Individual' | 'Company'>('Individual');
  const [formData, setFormData] = useState<Partial<Contact>>({ type: 'Individual' });
  const brandColor = nexusStore.organizationSettings.brandColor || '#4f46e5';

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
                   Individual
                </button>
                <button 
                  type="button"
                  onClick={() => { setSegment('Company'); updateField('type', 'Company'); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${segment === 'Company' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >
                   Company / B2B
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
                         <input className="w-full px-4 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-sm font-bold" placeholder="RC-123456" value={formData.registrationNumber || ''} onChange={e => updateField('registrationNumber', e.target.value)}/>
                      </div>
                      <div>
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Industry Sector</label>
                         <select className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 text-sm font-bold" value={formData.industry || ''} onChange={e => updateField('industry', e.target.value)}>
                            <option value="">Select Sector...</option>
                            <option value="Banking">Banking</option>
                            <option value="FMCG">FMCG</option>
                            <option value="Tech">Technology</option>
                         </select>
                      </div>
                   </>
                ) : (
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Job Designation</label>
                      <input className="w-full px-4 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-sm font-bold" placeholder="e.g. General Manager" value={formData.jobTitle || ''} onChange={e => updateField('jobTitle', e.target.value)}/>
                   </div>
                )}

                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Direct Contact (Phone)</label>
                   <input required className="w-full px-4 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-sm font-bold" placeholder="+234..." value={formData.phone || ''} onChange={e => updateField('phone', e.target.value)}/>
                </div>

                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Digital Correspondence (Email)</label>
                   <input required type="email" className="w-full px-4 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-sm font-bold" placeholder="name@domain.com" value={formData.email || ''} onChange={e => updateField('email', e.target.value)}/>
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
  const [view, setView] = useState<'contacts' | 'deals' | 'tasks' | 'calendar'>('contacts');
  const [deals, setDeals] = useState<Deal[]>(nexusStore.getDeals());
  const [contacts, setContacts] = useState<Contact[]>(nexusStore.contacts);
  const [tasks, setTasks] = useState<Task[]>(nexusStore.tasks);
  const [isAutoPilotOn, setIsAutoPilotOn] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const brandColor = nexusStore.organizationSettings.brandColor || '#4f46e5';

  useEffect(() => {
    const unsubscribe = nexusStore.subscribe(() => {
       setContacts([...nexusStore.contacts]);
       setDeals([...nexusStore.getDeals()]);
       setTasks([...nexusStore.tasks]);
    });
    return unsubscribe;
  }, []);

  const handleAddContact = (c: Partial<Contact>) => {
     nexusStore.addContact(c);
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
        name: row.Name || row.name || 'Unnamed Contact',
        email: row.Email || row.email || '',
        phone: row.Phone || row.phone || '',
        type: row.Type || 'Individual'
      }));

      nexusStore.addContactsBulk(formattedContacts);
      setIsBulkImporting(false);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      <div className="bg-slate-950 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00ff9d]/20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-[#00ff9d] rounded-3xl flex items-center justify-center shadow-2xl animate-float">
                   <Users size={36} className="text-slate-950" />
                </div>
                <div>
                   <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">CRM Command</h1>
                   <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#00ff9d] border border-white/5">
                         <Database size={12} className="text-[#00ff9d]"/> Centralized Ledger Active
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
                      className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${view === tab.id ? 'bg-[#00ff9d] text-slate-950 shadow-lg' : 'text-white/50 hover:text-white'}`}
                   >
                      <tab.icon size={14}/> {tab.label}
                   </button>
                ))}
             </div>
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
                  <button onClick={() => setIsAddModalOpen(true)} className="flex-1 md:flex-none px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
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
                           <th className="px-8 py-6">Sentiment</th>
                           <th className="px-8 py-6 text-right">Ops</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {contacts.map(con => (
                           <tr key={con.id} className="hover:bg-indigo-50/20 transition-all">
                              <td className="px-8 py-6 uppercase font-black text-xs text-slate-800">{con.name}</td>
                              <td className="px-8 py-6 text-slate-500 font-bold text-xs">{con.email}</td>
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                       <div className="h-full bg-[#00ff9d]" style={{ width: `${con.sentimentScore * 100}%` }}></div>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-600">{(con.sentimentScore * 100).toFixed(0)}%</span>
                                 </div>
                              </td>
                              <td className="px-8 py-6 text-right">
                                 <button onClick={() => nexusStore.deleteContact(con.id)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16}/></button>
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

      <AddContactModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={handleAddContact} 
      />
    </div>
  );
};
