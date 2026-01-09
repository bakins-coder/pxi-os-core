
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../store/useDataStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Deal, Contact, Task, Role } from '../types';
import { EventCalendar } from './EventCalendar';
import { FormAssistant } from './FormAssistant';
import * as XLSX from 'xlsx';
import {
   Search, Plus, Phone, Mail, X, Bot, Zap,
   CheckCircle2, CheckSquare, CalendarDays, FileText,
   Users, TrendingUp, MessageSquare, Database, ChevronRight, Briefcase, Hash, MapPin, FileSpreadsheet, Trash2, MessageCircle, Send as TelegramIcon, GripHorizontal
} from 'lucide-react';
import { CustomerStatementModal } from './CustomerStatementModal';
import { CustomerEventsModal } from './CustomerEventsModal';

const AddContactModal = ({ isOpen, onClose, onAdd }: { isOpen: boolean, onClose: () => void, onAdd: (c: Partial<Contact>) => void }) => {
   const [segment, setSegment] = useState<'Individual' | 'Company'>('Individual');
   const [formData, setFormData] = useState<Partial<Contact>>({ type: 'Individual' });
   const [activeField, setActiveField] = useState('');
   const brandColor = useSettingsStore(s => s.settings.brandColor) || '#4f46e5';

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

   const handleVoiceEntry = (text: string) => {
      if (activeField) {
         const fieldKey = activeField.replace(/\s+/g, '').toLowerCase() as keyof Contact;
         updateField(fieldKey, text);
      }
   };

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
         <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-slate-200 h-[85vh]">
            <div className="p-8 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/80 cursor-grab active:cursor-grabbing">
               <div className="flex items-center gap-4">
                  <GripHorizontal className="text-slate-300" />
                  <div>
                     <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Acquisition Input</h2>
                     <p className="text-[10px] text-slate-500 font-black uppercase mt-1 tracking-widest">Segmenting your lead pipeline into the OS core.</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-3 bg-white border border-slate-100 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-10 flex-1 overflow-y-auto scrollbar-thin">
               <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200">
                  <button
                     type="button"
                     onClick={() => { setSegment('Individual'); updateField('type', 'Individual'); }}
                     className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all ${segment === 'Individual' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                     Individual
                  </button>
                  <button
                     type="button"
                     onClick={() => { setSegment('Company'); updateField('type', 'Company'); }}
                     className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all ${segment === 'Company' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                     Company / B2B
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2">
                     <label className="block text-[11px] font-black text-slate-600 uppercase tracking-widest mb-3 ml-2">
                        {segment === 'Individual' ? 'Full Legal Name *' : 'Registered Business Name *'}
                     </label>
                     <input
                        required
                        onFocus={() => setActiveField('Name')}
                        className="w-full border-2 border-slate-200 rounded-[1.5rem] p-5 bg-white text-slate-900 text-lg font-black shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all placeholder:text-slate-300"
                        placeholder={segment === 'Individual' ? "Enter full name (e.g., Tunde Enitan)" : "Enter registered entity name (e.g., Zenith Global Services)"}
                        value={formData.name || ''}
                        onChange={e => updateField('name', e.target.value)}
                     />
                  </div>

                  {segment === 'Company' ? (
                     <>
                        <div>
                           <label className="block text-[11px] font-black text-slate-600 uppercase tracking-widest mb-3 ml-2">Registration No (RC/BN)</label>
                           <input onFocus={() => setActiveField('RegistrationNumber')} className="w-full p-5 border-2 border-slate-200 rounded-[1.5rem] bg-white text-slate-900 font-black text-lg focus:border-indigo-500 outline-none transition-all" placeholder="RC-123456" value={formData.registrationNumber || ''} onChange={e => updateField('registrationNumber', e.target.value)} />
                        </div>
                        <div>
                           <label className="block text-[11px] font-black text-slate-600 uppercase tracking-widest mb-3 ml-2">Industry Sector</label>
                           <select onFocus={() => setActiveField('Industry')} className="w-full p-5 border-2 border-slate-200 rounded-[1.5rem] bg-white text-slate-900 font-black text-lg focus:border-indigo-500 outline-none cursor-pointer" value={formData.industry || ''} onChange={e => updateField('industry', e.target.value)}>
                              <option value="">Choose industry...</option>
                              <option value="Banking">Banking & Finance</option>
                              <option value="FMCG">FMCG / Retail</option>
                              <option value="Tech">Technology / Software</option>
                              <option value="Hospitality">Hospitality / Catering</option>
                           </select>
                        </div>
                     </>
                  ) : (
                     <div className="md:col-span-2">
                        <label className="block text-[11px] font-black text-slate-600 uppercase tracking-widest mb-3 ml-2">Job Designation</label>
                        <input onFocus={() => setActiveField('JobTitle')} className="w-full p-5 border-2 border-slate-200 rounded-[1.5rem] bg-white text-slate-900 font-black text-lg focus:border-indigo-500 outline-none transition-all" placeholder="e.g., General Manager" value={formData.jobTitle || ''} onChange={e => updateField('jobTitle', e.target.value)} />
                     </div>
                  )}

                  <div>
                     <label className="block text-[11px] font-black text-slate-600 uppercase tracking-widest mb-3 ml-2">Direct Contact (Phone) *</label>
                     <input required onFocus={() => setActiveField('Phone')} className="w-full p-5 border-2 border-slate-200 rounded-[1.5rem] bg-white text-slate-900 font-black text-lg focus:border-indigo-500 outline-none transition-all" placeholder="+234 80..." value={formData.phone || ''} onChange={e => updateField('phone', e.target.value)} />
                  </div>

                  <div>
                     <label className="block text-[11px] font-black text-slate-600 uppercase tracking-widest mb-3 ml-2">Digital Correspondence (Email) *</label>
                     <input required onFocus={() => setActiveField('Email')} type="email" className="w-full p-5 border-2 border-slate-200 rounded-[1.5rem] bg-white text-slate-900 font-black text-lg focus:border-indigo-500 outline-none transition-all" placeholder="name@domain.com" value={formData.email || ''} onChange={e => updateField('email', e.target.value)} />
                  </div>
               </div>
            </form>

            <div className="p-10 border-t-2 border-slate-100 bg-slate-50 flex gap-6 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
               <button type="button" onClick={onClose} className="flex-1 py-5 text-slate-500 font-black uppercase tracking-widest text-[11px] hover:bg-white hover:text-slate-800 border-2 border-transparent hover:border-slate-200 rounded-[2rem] transition-all">Cancel Entry</button>
               <button
                  onClick={handleSubmit}
                  className="flex-1 py-5 text-white font-black uppercase tracking-widest text-[11px] rounded-[2rem] shadow-2xl transition-all active:scale-95 hover:brightness-110"
                  style={{ backgroundColor: brandColor, boxShadow: `0 20px 40px ${brandColor}33` }}
               >
                  Integrate Contact <ChevronRight className="inline-block ml-2" size={16} />
               </button>
            </div>
         </div>

         <FormAssistant
            formName="CRM Acquisition"
            activeField={activeField}
            value={activeField ? (formData as any)[activeField.replace(/\s+/g, '').toLowerCase()] || '' : ''}
            formData={formData}
            onVoiceEntry={handleVoiceEntry}
         />
      </div>
   );
};

export const CRM = () => {
   const [view, setView] = useState<'contacts' | 'deals' | 'tasks' | 'calendar'>('contacts');
   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
   const [selectedContactForStatement, setSelectedContactForStatement] = useState<Contact | null>(null);
   const [selectedContactForEvents, setSelectedContactForEvents] = useState<Contact | null>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);

   const { contacts, deals, tasks, addContact, addContactsBulk, deleteContact } = useDataStore();
   const brandColor = useSettingsStore(s => s.settings.brandColor) || '#4f46e5';

   const handleAddContact = (c: Partial<Contact>) => {
      addContact(c);
   };

   const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
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

         addContactsBulk(formattedContacts);
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
                           <Database size={12} className="text-[#00ff9d]" /> Centralized Ledger Active
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
                        <tab.icon size={14} /> {tab.label}
                     </button>
                  ))}
               </div>
            </div>
         </div>

         {view === 'contacts' && (
            <div className="space-y-6">
               <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                  <div className="flex-1 w-full relative">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                     <input className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" placeholder="Search segmented roster..." />
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                     <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .csv" onChange={handleBulkUpload} />
                     <button onClick={() => setIsAddModalOpen(true)} className="flex-1 md:flex-none px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
                        <Plus size={16} /> New Acquisition
                     </button>
                  </div>
               </div>

               <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] border-b border-slate-100">
                           <tr>
                              <th className="px-8 py-6">Customer Segment</th>
                              <th className="px-8 py-6">Link Channels</th>
                              <th className="px-8 py-6">Sentiment</th>
                              <th className="px-8 py-6 text-right">Ops</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {contacts.map(con => (
                              <tr key={con.id} className="hover:bg-indigo-50/20 transition-all">
                                 <td className="px-8 py-6">
                                    <p className="uppercase font-black text-xs text-slate-800">{con.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{con.email}</p>
                                 </td>
                                 <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                       <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><MessageCircle size={14} /></div>
                                       <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><TelegramIcon size={14} /></div>
                                       <div className="p-2 bg-slate-50 text-slate-400 rounded-lg"><Mail size={14} /></div>
                                    </div>
                                 </td>
                                 <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                       <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                          <div className="h-full bg-[#00ff9d]" style={{ width: `${con.sentimentScore * 100}%` }}></div>
                                       </div>
                                       <span className="text-[10px] font-black text-slate-600">{(con.sentimentScore * 100).toFixed(0)}%</span>
                                    </div>
                                 </td>
                                 <td className="px-8 py-6 text-right flex justify-end gap-2">
                                    <button onClick={() => setSelectedContactForStatement(con)} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all" title="View Statement"><FileText size={16} /></button>
                                    <button onClick={() => setSelectedContactForEvents(con)} className="p-2.5 bg-sky-50 text-sky-600 rounded-xl hover:bg-sky-600 hover:text-white transition-all" title="Event History"><CalendarDays size={16} /></button>
                                    <button onClick={() => deleteContact(con.id)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16} /></button>
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

         {selectedContactForStatement && (
            <CustomerStatementModal
               contact={selectedContactForStatement}
               onClose={() => setSelectedContactForStatement(null)}
            />
         )}
         {selectedContactForStatement && (
            <CustomerStatementModal
               contact={selectedContactForStatement}
               onClose={() => setSelectedContactForStatement(null)}
            />
         )}

         {selectedContactForEvents && (
            <CustomerEventsModal
               contact={selectedContactForEvents}
               onClose={() => setSelectedContactForEvents(null)}
            />
         )}
      </div>
   );
};
