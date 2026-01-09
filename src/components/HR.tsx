import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Employee, Department, EmployeeStatus, PayrollItem, DepartmentMatrix, Role, DepartmentRole, LeaveRequest, LeaveStatus, LeaveType } from '../types';
import { calculatePayrollForEmployee } from '../services/hrUtils';
import { extractInfoFromCV } from '../services/ai';
import {
   Users, Briefcase, Plus, ShieldCheck, Receipt, LayoutGrid, TrendingUp, ChevronRight,
   Activity, AlertTriangle, CheckCircle2, Wallet, Banknote, Landmark, Grid3X3, Layers, DollarSign, Info, X, UserPlus, Mail, Shield, User as UserIcon, ArrowRight, LogOut, ShieldAlert, Phone, Calendar as CalendarIcon, FileText, Upload, Mic, Square, Sparkles, MapPin, Loader2, Image as ImageIcon, Download, Printer, QrCode, Search, GripHorizontal, HeartPulse, Plane, Check, Clock, Globe, Send
} from 'lucide-react';

const DigitalIDCard = ({ employee, onClose }: { employee: Employee, onClose: () => void }) => {
   const { settings: org } = useSettingsStore();
   const handlePrint = () => { window.print(); };

   return (
      <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl animate-in zoom-in duration-300">
         <div className="flex flex-col items-center gap-8 max-w-sm w-full">
            <div id="printable-id-card" className="w-full max-w-[340px] h-[540px] bg-white rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col border border-slate-100 relative print:shadow-none print:border-none print:m-0">
               <div className="absolute top-0 left-0 w-full h-40 bg-slate-900 overflow-hidden">
                  <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[150%] bg-gradient-to-br from-indigo-500/20 to-transparent rotate-12"></div>
               </div>
               <div className="relative z-10 pt-8 px-8 flex flex-col items-center">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center p-2 mb-3">
                     {org.logo ? <img src={org.logo} className="w-full h-full object-contain" alt="logo" /> : <Shield className="text-slate-900" size={24} />}
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white text-center leading-tight">{org.name}</h3>
               </div>
               <div className="relative z-10 mt-10 flex justify-center">
                  <div className="w-36 h-44 rounded-2xl border-4 border-white shadow-2xl overflow-hidden bg-slate-50">
                     <img src={employee.avatar} className="w-full h-full object-cover" alt="profile" />
                  </div>
               </div>
               <div className="flex-1 mt-6 text-center px-8 flex flex-col justify-between pb-10">
                  <div>
                     <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">{employee.firstName}<br />{employee.lastName}</h2>
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-6">{employee.role}</p>
                     <div className="space-y-3">
                        <div className="flex flex-col items-center">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Employee ID</p>
                           <p className="text-xs font-mono font-bold text-slate-700">PXI-{employee.id.slice(-6).toUpperCase()}</p>
                        </div>
                        <div className="flex flex-col items-center">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Issue Date</p>
                           <p className="text-xs font-bold text-slate-700">{employee.idCardIssuedDate || new Date().toISOString().split('T')[0]}</p>
                        </div>
                     </div>
                  </div>
                  <div className="flex flex-col items-center opacity-40 grayscale group-hover:grayscale-0 transition-all">
                     <QrCode size={40} className="text-slate-900 mb-2" />
                     <p className="text-[7px] font-black uppercase tracking-widest text-slate-500">Encrypted Digital Hash Verified</p>
                  </div>
               </div>
               <div className="bg-slate-900 py-3 text-center">
                  <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#00ff9d]">Verified Personnel</p>
               </div>
            </div>
            <div className="flex gap-4 w-full px-4">
               <button onClick={onClose} className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">Dismiss</button>
               <button onClick={handlePrint} className="flex-1 py-4 bg-[#00ff9d] text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all">
                  <Printer size={18} /> Print
               </button>
            </div>
         </div>
      </div>
   );
};

const HireStaffModal = ({ isOpen, onClose, editingEmployee }: { isOpen: boolean, onClose: () => void, editingEmployee?: Employee }) => {
   const [firstName, setFirstName] = useState('');
   const [lastName, setLastName] = useState('');
   const [email, setEmail] = useState('');
   const [phoneNumber, setPhoneNumber] = useState('');
   const [address, setAddress] = useState('');
   const [dob, setDob] = useState('');
   const [gender, setGender] = useState<'Male' | 'Female'>('Male');
   const [dateOfEmployment, setDateOfEmployment] = useState(new Date().toISOString().split('T')[0]);
   const [selectedRoleTitle, setSelectedRoleTitle] = useState('');
   const [salaryNGN, setSalaryNGN] = useState<number>(0);
   const [avatar, setAvatar] = useState('');
   const [healthNotes, setHealthNotes] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [isExtracting, setIsExtracting] = useState(false);
   const [idGenerated, setIdGenerated] = useState<Employee | null>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);

   const resetFormFields = () => {
      setFirstName(''); setLastName(''); setEmail(''); setPhoneNumber(''); setAddress(''); setDob(''); setGender('Male');
      setDateOfEmployment(new Date().toISOString().split('T')[0]); setSelectedRoleTitle(''); setSalaryNGN(0); setAvatar(''); setHealthNotes(''); setIdGenerated(null);
   };

   useEffect(() => {
      if (editingEmployee) {
         setFirstName(editingEmployee.firstName); setLastName(editingEmployee.lastName); setEmail(editingEmployee.email);
         setPhoneNumber(editingEmployee.phoneNumber || ''); setAddress(editingEmployee.address || ''); setDob(editingEmployee.dob);
         setGender(editingEmployee.gender); setDateOfEmployment(editingEmployee.dateOfEmployment); setSelectedRoleTitle(editingEmployee.role);
         setSalaryNGN(editingEmployee.salaryCents / 100); setAvatar(editingEmployee.avatar); setHealthNotes(editingEmployee.healthNotes || '');
      } else if (isOpen) { resetFormFields(); }
   }, [editingEmployee, isOpen]);

   const departmentMatrix = useDataStore(state => state.departmentMatrix);
   const addEmployee = useDataStore(state => state.addEmployee);
   const updateEmployee = useDataStore(state => state.updateEmployee);

   const allRoles = useMemo(() => departmentMatrix.flatMap((dept: any) => dept.roles.map((r: any) => ({ ...r, department: dept.name }))), [departmentMatrix]);
   const selectedRole = useMemo(() => allRoles.find(r => r.title === selectedRoleTitle), [selectedRoleTitle, allRoles]);

   if (!isOpen) return null;

   const handleHire = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!firstName || !lastName || !email || !selectedRoleTitle) return;
      setIsSubmitting(true);
      const employeeData = { firstName, lastName, email, phoneNumber, address, dob, gender, dateOfEmployment, role: selectedRoleTitle as any, salaryCents: salaryNGN * 100, avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}`, healthNotes };
      if (editingEmployee) {
         updateEmployee(editingEmployee.id, employeeData);
         setIsSubmitting(false);
         onClose();
      }
      else {
         const created = addEmployee(employeeData);
         setIsSubmitting(false);
         setIdGenerated(created);
      }
   };

   const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file) return;
      setIsExtracting(true); const reader = new FileReader();
      reader.onloadend = async () => {
         const base64 = (reader.result as string).split(',')[1];
         try {
            const data = await extractInfoFromCV(base64, file.type);
            if (data.firstName) setFirstName(data.firstName); if (data.lastName) setLastName(data.lastName);
            if (data.email) setEmail(data.email); if (data.phoneNumber) setPhoneNumber(data.phoneNumber);
            if (data.address) setAddress(data.address); if (data.dob) setDob(data.dob);
            if (data.gender) setGender(data.gender === 'Female' ? 'Female' : 'Male');
         } catch (err) { console.error(err); } finally { setIsExtracting(false); }
      };
      reader.readAsDataURL(file);
   };

   if (idGenerated) { return <DigitalIDCard employee={idGenerated} onClose={() => { resetFormFields(); onClose(); }} />; }

   return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 md:p-4 bg-slate-950/90 backdrop-blur-2xl animate-in zoom-in duration-300">
         <div className="bg-white md:rounded-[3.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col relative border border-slate-200 h-full md:h-[90vh]">
            {isExtracting && (
               <div className="absolute inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 text-center">
                  <div className="relative w-20 h-20 mb-8 mx-auto">
                     <div className="absolute inset-0 rounded-full border-2 border-white/5"></div>
                     <div className="absolute inset-0 rounded-full border-2 border-t-[#00ff9d] animate-spin"></div>
                     <div className="absolute inset-4 flex items-center justify-center"><Sparkles size={24} className="text-[#00ff9d] animate-pulse" /></div>
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Extracting CV Data...</h3>
               </div>
            )}
            <div className="p-6 md:p-10 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/80 shrink-0">
               <div className="flex items-center gap-3 md:gap-6 min-w-0">
                  <div className="hidden sm:block"><GripHorizontal className="text-slate-300" /></div>
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-[#00ff9d] shadow-lg shrink-0">{editingEmployee ? <UserIcon size={24} /> : <UserPlus size={24} />}</div>
                  <div className="min-w-0"><h2 className="text-xl md:text-3xl font-black text-slate-800 uppercase tracking-tighter truncate">{editingEmployee ? 'Update Profile' : 'Hire Staff'}</h2><p className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 truncate">Organizational Registry</p></div>
               </div>
               <div className="flex gap-2">
                  {!editingEmployee && (
                     <><button onClick={() => fileInputRef.current?.click()} className="hidden sm:flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 rounded-2xl font-black uppercase text-[10px] shadow-sm hover:border-indigo-500 transition-all"><FileText size={16} /> Scan CV</button><input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx,image/*" onChange={handleCVUpload} /></>
                  )}
                  <button onClick={onClose} className="p-3 md:p-4 bg-slate-100 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm"><X size={20} /></button>
               </div>
            </div>
            <form onSubmit={handleHire} className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 overflow-y-auto flex-1 scrollbar-thin">
               <div className="space-y-8 md:space-y-10">
                  <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-3"><h3 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em]">Profile Identity</h3><div className="h-px flex-1 bg-indigo-50"></div></div>
                  <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8 p-6 md:p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-200 border-dashed group hover:border-indigo-200 transition-all">
                     <div className="w-24 h-24 rounded-2xl bg-white border-2 border-slate-200 overflow-hidden shadow-sm shrink-0">{avatar ? <img src={avatar} className="w-full h-full object-cover" alt="preview" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><UserIcon size={40} /></div>}</div>
                     <div className="space-y-3 w-full">
                        <input required className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-900 text-lg shadow-sm outline-none focus:border-indigo-500 transition-all" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} />
                        <input required className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-900 text-lg shadow-sm outline-none focus:border-indigo-500 transition-all" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} />
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-3"><label className="text-[10px] md:text-[11px] font-black uppercase text-slate-500 tracking-widest ml-2 mb-1 block">Gender</label><div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border-2 border-slate-200"><button type="button" onClick={() => setGender('Male')} className={`flex-1 py-3 md:py-4 rounded-xl text-[10px] md:text-[11px] font-black uppercase transition-all shadow-sm ${gender === 'Male' ? 'bg-slate-950 text-white' : 'bg-white text-slate-400'}`}>Male</button><button type="button" onClick={() => setGender('Female')} className={`flex-1 py-3 md:py-4 rounded-xl text-[10px] md:text-[11px] font-black uppercase transition-all shadow-sm ${gender === 'Female' ? 'bg-slate-950 text-white' : 'bg-white text-slate-400'}`}>Female</button></div></div>
                     <div className="space-y-3"><label className="text-[10px] md:text-[11px] font-black uppercase text-slate-500 tracking-widest ml-2 mb-1 block">Date of Birth</label><div className="relative"><CalendarIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} /><input required type="date" className="w-full pl-14 pr-6 py-4 md:py-5 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:border-indigo-500 transition-all" value={dob} onChange={e => setDob(e.target.value)} /></div></div>
                  </div>
                  <div className="space-y-3"><label className="text-[10px] md:text-[11px] font-black uppercase text-slate-500 tracking-widest ml-2 mb-1 block">Address</label><textarea required rows={2} className="w-full p-5 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:border-indigo-500 transition-all resize-none placeholder:text-slate-300" placeholder="Primary residence..." value={address} onChange={e => setAddress(e.target.value)} /></div>
                  <div className="space-y-3"><label className="text-[10px] md:text-[11px] font-black uppercase text-slate-500 tracking-widest ml-2 mb-1 block">Email & Phone</label>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input required type="email" className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-900 font-black outline-none focus:border-indigo-500 transition-all" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                        <input required type="tel" className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300" placeholder="Phone" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                     </div>
                  </div>
               </div>
               <div className="space-y-8 md:space-y-10">
                  <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-3"><h3 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em]">Employment Record</h3><div className="h-px flex-1 bg-indigo-50"></div></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-3"><label className="text-[10px] md:text-[11px] font-black uppercase text-slate-500 tracking-widest ml-2 mb-1 block">Role</label><select required className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-xs uppercase outline-none text-slate-900 cursor-pointer focus:border-indigo-500 transition-all shadow-sm" value={selectedRoleTitle} onChange={e => setSelectedRoleTitle(e.target.value)}><option value="">Select Role...</option>{departmentMatrix.map((dept: any) => (<optgroup key={dept.id} label={dept.name}>{dept.roles.map((r: any, idx: number) => (<option key={idx} value={r.title}>{r.title} (Band {r.band})</option>))}</optgroup>))}</select></div>
                     <div className="space-y-3"><label className="text-[10px] md:text-[11px] font-black uppercase text-slate-500 tracking-widest ml-2 mb-1 block">Hire Date</label><input required type="date" className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:border-indigo-500 transition-all" value={dateOfEmployment} onChange={e => setDateOfEmployment(e.target.value)} /></div>
                  </div>
                  {selectedRole && (
                     <div className="p-8 md:p-10 bg-slate-950 rounded-[3rem] text-white space-y-6 md:space-y-8 relative overflow-hidden ring-4 ring-slate-100">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-[#00ff9d]/5 rounded-full blur-3xl"></div>
                        <div className="flex justify-between items-center relative z-10 border-b border-white/10 pb-4"><h4 className="text-[9px] md:text-[11px] font-black uppercase text-[#00ff9d] tracking-widest">Salary Band</h4><span className="px-3 py-1 bg-[#00ff9d]/10 border border-[#00ff9d]/20 text-[#00ff9d] rounded-xl text-[9px] font-black uppercase tracking-wider">Band {selectedRole.band}</span></div>
                        <div className="grid grid-cols-3 gap-4 md:gap-8 relative z-10 text-center"><div><p className="text-[8px] text-slate-500 uppercase font-black mb-1">Min</p><p className="text-sm md:text-lg font-black">₦{(selectedRole.salaryRange.low / 1000).toLocaleString()}k</p></div><div className="border-x border-white/10"><p className="text-[8px] text-slate-500 uppercase font-black mb-1">Mid</p><p className="text-sm md:text-lg font-black text-indigo-400">₦{(selectedRole.salaryRange.mid / 1000).toLocaleString()}k</p></div><div><p className="text-[8px] text-slate-500 uppercase font-black mb-1">Max</p><p className="text-sm md:text-lg font-black">₦{(selectedRole.salaryRange.high / 1000).toLocaleString()}k</p></div></div>
                        <div className="space-y-3 relative z-10"><label className="text-[10px] md:text-[11px] font-black uppercase text-slate-400 tracking-widest ml-2 block">Monthly Gross (₦)</label><div className="relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 font-black text-xl md:text-2xl">₦</span><input type="number" required className="w-full pl-12 pr-6 py-5 md:py-6 bg-white/5 border border-white/10 rounded-[2rem] text-white font-black text-2xl md:text-4xl outline-none focus:border-[#00ff9d] transition-all" value={salaryNGN || ''} onChange={e => setSalaryNGN(parseInt(e.target.value) || 0)} /></div></div>
                     </div>
                  )}
               </div>
            </form>
            <div className="p-6 md:p-10 border-t-2 border-slate-100 bg-slate-50 flex gap-4 md:gap-6 shrink-0">
               <button type="button" onClick={onClose} className="flex-1 py-4 md:py-6 rounded-[2rem] font-black uppercase tracking-widest text-[10px] md:text-[11px] text-slate-500 hover:bg-white hover:text-slate-800 border-2 border-transparent hover:border-slate-200 transition-all bg-white shadow-sm">Abort</button>
               <button type="submit" onClick={handleHire} disabled={isSubmitting} className="flex-2 py-4 md:py-6 bg-slate-950 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] md:text-[11px] shadow-2xl flex items-center justify-center gap-3 transition-all hover:brightness-110 active:scale-95 group shrink-0 min-w-[160px] md:min-w-[240px]">{isSubmitting ? <Activity className="animate-spin" size={20} /> : <ShieldCheck size={20} className="text-[#00ff9d] group-hover:scale-110 transition-transform" />}{isSubmitting ? 'Onboarding...' : editingEmployee ? 'Update' : 'Hire Staff'}</button>
            </div>
         </div>
      </div>
   );
};

const LeaveModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
   const [type, setType] = useState<LeaveType>(LeaveType.ANNUAL);
   const [startDate, setStartDate] = useState('');
   const [endDate, setEndDate] = useState('');
   const [reason, setReason] = useState('');

   if (!isOpen) return null;

   const applyForLeave = useDataStore(state => state.applyForLeave);

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      applyForLeave({ type, startDate, endDate, reason });
      onClose();
      setType(LeaveType.ANNUAL); setStartDate(''); setEndDate(''); setReason('');
   };

   return (
      <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl animate-in zoom-in duration-300">
         <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-200">
            <div className="p-8 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/80">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-[#00ff9d] shadow-lg"><Plane size={24} /></div>
                  <div><h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Request Absence</h2><p className="text-[10px] text-slate-500 font-black uppercase mt-1">Personnel Node Registry</p></div>
               </div>
               <button onClick={onClose} className="p-3 bg-white border border-slate-100 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8 flex-1 overflow-y-auto">
               <div><label className="text-[11px] font-black uppercase text-slate-500 tracking-widest ml-2 mb-2 block">Leave Classification</label><select className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:border-indigo-500" value={type} onChange={e => setType(e.target.value as LeaveType)}>{Object.values(LeaveType).map(t => <option key={t} value={t}>{t} Leave</option>)}</select></div>
               <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[11px] font-black uppercase text-slate-500 tracking-widest ml-2 mb-2 block">Commencement</label><input type="date" required className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:border-indigo-500" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                  <div><label className="text-[11px] font-black uppercase text-slate-500 tracking-widest ml-2 mb-2 block">Resumption</label><input type="date" required className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:border-indigo-500" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
               </div>
               <div><label className="text-[11px] font-black uppercase text-slate-500 tracking-widest ml-2 mb-2 block">Justification</label><textarea required rows={3} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:border-indigo-500 transition-all resize-none placeholder:text-slate-300" placeholder="Context..." value={reason} onChange={e => setReason(e.target.value)} /></div>
            </form>
            <div className="p-10 border-t-2 border-slate-100 bg-slate-50 flex gap-4">
               <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] text-slate-400 hover:text-slate-800 transition-all">Abort</button>
               <button type="submit" onClick={handleSubmit} className="flex-2 py-5 bg-slate-950 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all">Submit Application</button>
            </div>
         </div>
      </div>
   );
};

const MatrixTab = ({ matrix }: { matrix: DepartmentMatrix[] }) => {
   const adjustBandSalary = useDataStore(state => state.adjustBandSalary);
   const [adjustingBand, setAdjustingBand] = useState<number | null>(null);
   const [percentChange, setPercentChange] = useState<number>(0);
   const handleAdjust = () => { if (adjustingBand !== null) { adjustBandSalary(adjustingBand, percentChange); setAdjustingBand(null); setPercentChange(0); } };
   return (
      <div className="space-y-8 animate-in slide-in-from-bottom-4 w-full">
         <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 bg-white/5 p-6 md:p-8 rounded-[2.5rem] border border-white/5">
            <div><h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">Departmental Matrix</h2><p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Hierarchical Progression & Pay Units</p></div>
            <div className="flex flex-wrap gap-2">{[1, 2, 3, 4, 5].map(b => (<button key={b} onClick={() => setAdjustingBand(b)} className="bg-slate-900 hover:bg-[#00ff9d] hover:text-slate-950 px-4 md:px-5 py-2.5 md:py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 transition-all shadow-xl whitespace-nowrap shrink-0">Adj. Band {b}</button>))}</div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 pb-20 w-full">
            {matrix.map(dept => (
               <div key={dept.id} className="bg-slate-900/50 border border-white/5 rounded-[3rem] overflow-hidden group transition-all flex flex-col h-full shadow-2xl">
                  <div className="p-8 md:p-10 border-b border-white/5 bg-white/[0.02] flex items-center gap-4 md:gap-5 shrink-0"><div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-600/20 rounded-[1.2rem] flex items-center justify-center text-indigo-400 group-hover:bg-[#00ff9d] group-hover:text-slate-950 transition-all shadow-inner"><Layers size={24} /></div><h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight truncate">{dept.name}</h3></div>
                  <div className="p-8 md:p-10 space-y-6 md:space-y-8 flex-1 overflow-y-auto">
                     {dept.roles.sort((a, b) => b.band - a.band).map((role, idx) => (
                        <div key={idx} className="relative pl-10 group/role"><div className="absolute left-0 top-0 bottom-0 w-px bg-white/10"></div><div className="absolute left-[-5px] top-2 w-2.5 h-2.5 rounded-full bg-slate-800 border-2 border-slate-900 group-hover/role:bg-[#00ff9d] shadow-lg"></div>
                           <div className="flex justify-between items-start mb-2 gap-2"><div><h4 className="text-[13px] font-black text-slate-200 uppercase tracking-tight leading-none mb-1">{role.title}</h4><p className="text-[8px] font-black text-slate-500 uppercase tracking-widest truncate">Career Path Unit</p></div><span className="bg-slate-950 px-2.5 py-1 rounded text-[8px] md:text-[9px] font-black text-[#00ff9d] border border-[#00ff9d]/20 uppercase shrink-0">Band {role.band}</span></div>
                           <div className="space-y-2"><div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5"><div className="h-full bg-indigo-600 opacity-50 shadow-[0_0_10px_rgba(79,70,229,0.5)]" style={{ width: `${(role.band / 5) * 100}%` }}></div></div><div className="flex justify-between text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-tighter gap-1"><span>₦{(role.salaryRange.low / 1000).toLocaleString()}k</span><span className="text-indigo-400/80 truncate">₦{(role.salaryRange.mid / 1000).toLocaleString()}k Mid</span><span>₦{(role.salaryRange.high / 1000).toLocaleString()}k</span></div></div>
                        </div>
                     ))}
                  </div>
               </div>
            ))}
         </div>
         {adjustingBand && (
            <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl animate-in zoom-in duration-300">
               <div className="bg-white rounded-[3.5rem] p-10 md:p-12 max-w-sm w-full shadow-2xl border border-slate-100">
                  <div className="flex justify-between items-start mb-8"><div><h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Adjust Band {adjustingBand}</h3></div><button onClick={() => setAdjustingBand(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X size={20} /></button></div>
                  <div className="space-y-8"><div><label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-3 block">Percentage Multiplier (%)</label><div className="relative"><input type="number" className="w-full p-6 bg-slate-50 border-2 border-slate-200 rounded-[2rem] font-black text-4xl text-slate-900 outline-none text-center" value={percentChange} onChange={e => setPercentChange(parseFloat(e.target.value) || 0)} /><span className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 font-black text-2xl">%</span></div></div>
                     <div className="p-6 bg-amber-50 rounded-2xl flex items-start gap-4 border border-amber-100 shadow-sm"><Info className="text-amber-600 shrink-0 mt-1" size={20} /><p className="text-[10px] font-bold text-amber-900 leading-relaxed uppercase">Strategic Impact: Updating all roles in this tier.</p></div>
                     <div className="grid grid-cols-1 gap-4"><button onClick={handleAdjust} className="w-full py-5 md:py-6 bg-slate-950 text-[#00ff9d] rounded-[2rem] font-black uppercase text-[10px] md:text-xs tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"><ShieldCheck size={20} /> Authorize Sync</button></div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export const HR = () => {
   const employees = useDataStore(state => state.employees);
   const departmentMatrix = useDataStore(state => state.departmentMatrix);
   const leaveRequests = useDataStore(state => state.leaveRequests);
   const approveLeave = useDataStore(state => state.approveLeave);
   const rejectLeave = useDataStore(state => state.rejectLeave);
   const currentUser = useAuthStore(state => state.user);

   const [activeTab, setActiveTab] = useState<'dashboard' | 'people' | 'payroll' | 'matrix' | 'leave'>('dashboard');
   const [searchQuery, setSearchQuery] = useState('');
   const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
   const [isHireModalOpen, setIsHireModalOpen] = useState(false);
   const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
   const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined);

   const isAdmin = currentUser?.role === Role.ADMIN || currentUser?.role === Role.HR_MANAGER;

   useEffect(() => {
      if (activeTab === 'payroll') {
         setPayrollItems(employees.map(e => calculatePayrollForEmployee(e)));
      }
   }, [activeTab, employees]);

   const filteredEmployees = useMemo(() => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return employees;
      return employees.filter(e => {
         const matchName = `${e.firstName} ${e.lastName}`.toLowerCase().includes(query);
         const matchEmail = e.email.toLowerCase().includes(query);
         const matchRole = e.role.toLowerCase().includes(query);
         const matchHealth = (e.healthNotes || '').toLowerCase().includes(query);
         return matchName || matchEmail || matchRole || matchHealth;
      });
   }, [employees, searchQuery]);

   const handleEditEmployee = (emp: Employee) => { setEditingEmployee(emp); setIsHireModalOpen(true); };
   const closeHireModal = () => { setIsHireModalOpen(false); setEditingEmployee(undefined); };

   const handleApproveLeave = (id: string) => approveLeave(id);
   const handleRejectLeave = (id: string) => rejectLeave(id);

   return (
      <div className="space-y-6 md:space-y-10 animate-in fade-in pb-24 w-full">
         <div className="bg-slate-950 p-6 md:p-10 rounded-[3rem] md:rounded-[4rem] text-white relative overflow-hidden shadow-2xl border border-white/5 w-full">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -mr-60 -mt-60 pointer-events-none"></div>
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 md:gap-10 w-full">
               <div className="flex items-center gap-6 md:gap-8 min-w-0">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[2rem] flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.4)] animate-float shrink-0"><Briefcase size={32} className="text-white md:w-10 md:h-10" /></div>
                  <div className="min-w-0"><h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase leading-none mb-3 truncate">Human Resources</h1><div className="flex items-center gap-3 md:gap-4 overflow-x-auto no-scrollbar"><div className="flex items-center gap-2 bg-white/5 px-3 md:px-4 py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[#00ff9d] border border-white/5 whitespace-nowrap"><ShieldCheck size={12} /> Verified</div><div className="flex items-center gap-2 bg-white/5 px-3 md:px-4 py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 border border-white/5 whitespace-nowrap"><Users size={12} /> {employees.length} Staff</div></div></div>
               </div>
               <div className="flex bg-white/5 p-1.5 rounded-[1.8rem] md:rounded-[2rem] border border-white/10 backdrop-blur-xl overflow-x-auto max-w-full hide-scrollbar shrink-0">
                  {[
                     { id: 'dashboard', label: 'Briefing', icon: LayoutGrid },
                     { id: 'people', label: 'People', icon: Users },
                     { id: 'leave', label: 'Absence Node', icon: Plane },
                     { id: 'payroll', label: 'Payroll', icon: Banknote },
                     { id: 'matrix', label: 'Role Matrix', icon: Layers }
                  ].map(tab => (
                     <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-5 md:px-8 py-3 rounded-[1.2rem] md:rounded-[1.5rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-2xl' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                        <tab.icon size={14} className="shrink-0" /> <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.label.charAt(0)}</span>
                     </button>
                  ))}
               </div>
            </div>
         </div>

         {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 w-full">
               <div className="bg-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl border border-slate-100 group hover:scale-[1.02] transition-all"><p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Total Headcount</p><h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">{employees.length}</h3><div className="mt-6 flex items-center gap-2 text-emerald-600 font-black text-[9px] md:text-[10px] uppercase tracking-widest"><TrendingUp size={14} /> Stable Growth</div></div>
               <div className="bg-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl border border-slate-100 group hover:scale-[1.02] transition-all"><p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Departments</p><h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">{departmentMatrix.length}</h3><div className="mt-6 flex items-center gap-2 text-indigo-600 font-black text-[9px] md:text-[10px] uppercase tracking-widest"><LayoutGrid size={14} /> Matrix Sync</div></div>
               <div className="bg-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl border border-slate-100 group hover:scale-[1.02] transition-all"><p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Active Leave</p><h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">{leaveRequests.filter(l => l.status === LeaveStatus.APPROVED).length}</h3><div className="mt-6 flex items-center gap-2 text-amber-600 font-black text-[9px] md:text-[10px] uppercase tracking-widest"><Plane size={14} /> Scheduled</div></div>
               <div className="bg-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl border border-slate-100 group hover:scale-[1.02] transition-all"><p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Pending</p><h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">{leaveRequests.filter(l => l.status === LeaveStatus.PENDING).length}</h3><div className="mt-6 flex items-center gap-2 text-indigo-600 font-black text-[9px] md:text-[10px] uppercase tracking-widest"><CheckCircle2 size={14} /> Operational</div></div>
            </div>
         )}

         {activeTab === 'people' && (
            <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 w-full overflow-hidden">
               <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 shadow-xl">
                  <div className="flex-1 w-full relative max-w-md">
                     <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                     <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-6 py-4 text-[11px] md:text-xs font-black uppercase tracking-widest outline-none focus:border-indigo-500 transition-all" placeholder="Search roster..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </div>
                  <button onClick={() => { setEditingEmployee(undefined); setIsHireModalOpen(true); }} className="w-full md:w-auto bg-slate-950 text-white px-8 md:px-10 py-4 md:py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] md:text-xs flex items-center justify-center gap-3 transition-all active:scale-95 group shrink-0"><UserPlus size={18} className="text-[#00ff9d] group-hover:scale-110 transition-transform" /> Hire Staff</button>
               </div>
               <div className="bg-white rounded-[3rem] md:rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden w-full">
                  <div className="overflow-x-auto w-full">
                     <table className="w-full text-left text-sm min-w-[800px]">
                        <thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] border-b border-slate-100 shrink-0">
                           <tr><th className="px-8 md:px-10 py-6 md:py-8">Employee</th><th className="px-8 md:px-10 py-6 md:py-8">Role & Gross</th><th className="px-8 md:px-10 py-6 md:py-8">Medical Context</th><th className="px-8 md:px-10 py-6 md:py-8">Status</th><th className="px-8 md:px-10 py-6 md:py-8 text-right">Ops</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 overflow-y-auto">
                           {filteredEmployees.map(emp => (
                              <tr key={emp.id} onClick={() => handleEditEmployee(emp)} className="hover:bg-indigo-50/20 transition-all group cursor-pointer">
                                 <td className="px-8 md:px-10 py-6 md:py-8">
                                    <div className="flex items-center gap-4 md:gap-6 min-w-0">
                                       <div className="relative shrink-0">
                                          <img src={emp.avatar} className="w-12 h-12 md:w-14 md:h-14 rounded-[1rem] md:rounded-[1.2rem] bg-slate-100 border border-slate-200 shadow-sm object-cover" alt="avatar" />
                                          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-4 border-white rounded-full"></div>
                                       </div>
                                       <div className="min-w-0">
                                          <p className="font-black text-slate-900 uppercase text-xs md:text-sm tracking-tight truncate">{emp.firstName} {emp.lastName}</p>
                                          <div className="flex flex-col gap-0.5 mt-1">
                                             <div className="flex items-center gap-2 text-[9px] md:text-[10px] text-slate-400 font-bold tracking-tight truncate"><Mail size={10} /> {emp.email}</div>
                                             <div className="flex items-center gap-2 text-[9px] md:text-[10px] text-slate-400 font-bold tracking-tight truncate"><MapPin size={10} /> {emp.address || 'N/A'}</div>
                                          </div>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-8 md:px-10 py-6 md:py-8 shrink-0">
                                    <div className="flex flex-col min-w-[140px]">
                                       <span className="font-black text-slate-800 uppercase text-[10px] md:text-[11px] truncate">{emp.role}</span>
                                       <div className="flex items-center gap-2 mt-1">
                                          <span className="text-[10px] font-black text-indigo-600 uppercase">₦{(emp.salaryCents / 100).toLocaleString()}</span>
                                          <span className="text-[8px] font-bold text-slate-300 uppercase">/ Month</span>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-8 md:px-10 py-6 md:py-8 shrink-0">
                                    {emp.healthNotes ? (
                                       <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-3 py-1 rounded-xl border border-rose-100 inline-flex whitespace-nowrap">
                                          <HeartPulse size={12} />
                                          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-tight truncate">{emp.healthNotes}</span>
                                       </div>
                                    ) : (
                                       <span className="text-[10px] font-black text-slate-300 uppercase italic whitespace-nowrap">Clear</span>
                                    )}
                                 </td>
                                 <td className="px-8 md:px-10 py-6 md:py-8"><span className="bg-emerald-50 text-emerald-700 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase border border-emerald-100 whitespace-nowrap">Active</span></td>
                                 <td className="px-8 md:px-10 py-6 md:py-8 text-right"><button className="p-3 md:p-4 bg-white border border-slate-100 text-slate-400 rounded-xl md:rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"><ChevronRight size={18} /></button></td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'leave' && (
            <div className="space-y-8 md:space-y-10 animate-in slide-in-from-bottom-4 w-full">
               <div className="bg-slate-900 p-8 md:p-10 rounded-[3rem] md:rounded-[3.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-8 md:gap-10 shadow-2xl relative overflow-hidden border border-white/10 w-full">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff9d]/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="flex items-center gap-6 md:gap-8 relative z-10 w-full md:w-auto">
                     <div className="w-14 h-14 md:w-16 md:h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-[#00ff9d] shadow-inner shrink-0"><Plane size={28} className="md:w-8 md:h-8" /></div>
                     <div className="min-w-0"><h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-none truncate">Absence Registry</h2><p className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2 truncate"><Globe size={14} className="text-emerald-500 shrink-0" /> G-Calendar Active</p></div>
                  </div>
                  <button onClick={() => setIsLeaveModalOpen(true)} className="w-full md:w-auto bg-[#00ff9d] text-slate-950 px-8 md:px-10 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[9px] md:text-[10px] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 shrink-0"><Plus size={18} /> Apply Now</button>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10 w-full">
                  <div className="lg:col-span-2 space-y-6 w-full">
                     <div className="px-4"><h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.4em]">{isAdmin ? 'Request Feed' : 'My History'}</h3></div>
                     <div className="space-y-5 md:space-y-6">
                        {leaveRequests.filter(l => isAdmin || l.employeeId === currentUser?.id).map(req => (
                           <div key={req.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 shadow-xl flex flex-col sm:flex-row items-center justify-between group hover:border-indigo-100 transition-all gap-6">
                              <div className="flex items-center gap-5 md:gap-6 flex-1 min-w-0">
                                 <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${req.status === LeaveStatus.APPROVED ? 'bg-emerald-50 text-emerald-600' :
                                    req.status === LeaveStatus.REJECTED ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                                    }`}>
                                    {req.status === LeaveStatus.APPROVED ? <CheckCircle2 size={20} /> :
                                       req.status === LeaveStatus.REJECTED ? <AlertTriangle size={20} /> : <Clock size={20} />}
                                 </div>
                                 <div className="min-w-0">
                                    <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                                       <h4 className="text-base md:text-lg font-black text-slate-800 uppercase tracking-tight leading-none truncate">{req.employeeName}</h4>
                                       <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black uppercase rounded shrink-0">{req.type}</span>
                                    </div>
                                    <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 truncate">{req.startDate} — {req.endDate}</p>
                                    <p className="text-[9px] md:text-[10px] text-slate-500 italic mt-1 line-clamp-1">"{req.reason}"</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-3 md:gap-4 shrink-0">
                                 {isAdmin && req.status === LeaveStatus.PENDING ? (
                                    <div className="flex gap-2">
                                       <button onClick={() => handleRejectLeave(req.id)} className="p-3 bg-white border border-rose-100 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"><X size={16} /></button>
                                       <button onClick={() => handleApproveLeave(req.id)} className="p-3 bg-emerald-500 text-white rounded-xl shadow-xl hover:scale-110 active:scale-95 transition-all"><Check size={16} strokeWidth={3} /></button>
                                    </div>
                                 ) : (
                                    <div className="text-right">
                                       <span className={`px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[8px] md:text-[9px] font-black uppercase border whitespace-nowrap ${req.status === LeaveStatus.APPROVED ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                          req.status === LeaveStatus.REJECTED ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                                          }`}>{req.status}</span>
                                       {req.calendarSynced && (
                                          <div className="mt-2 flex items-center justify-end gap-1.5 text-[8px] font-black text-emerald-600 uppercase whitespace-nowrap">
                                             <Globe size={10} /> Sync OK
                                          </div>
                                       )}
                                    </div>
                                 )}
                              </div>
                           </div>
                        ))}
                        {leaveRequests.length === 0 && (
                           <div className="text-center py-20 text-slate-200">
                              <Plane size={64} className="mx-auto mb-4 opacity-10 animate-float" />
                              <p className="font-black uppercase tracking-[0.4em] text-xs">No Absence Entries</p>
                           </div>
                        )}
                     </div>
                  </div>
                  <div className="space-y-6 md:space-y-8 w-full shrink-0">
                     <div className="bg-slate-950 p-8 md:p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-white/10 h-fit">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
                        <h3 className="text-[10px] font-black text-[#00ff9d] uppercase tracking-[0.3em] mb-8">Roster Insight</h3>
                        <div className="space-y-6">
                           <div className="p-5 md:p-6 bg-white/5 border border-white/10 rounded-[2rem]">
                              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sync Status</p>
                              <div className="flex items-center gap-3">
                                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0"></div>
                                 <p className="text-base md:text-lg font-black text-white uppercase tracking-tighter truncate">Operational</p>
                              </div>
                           </div>
                           <div className="p-5 md:p-6 bg-white/5 border border-white/10 rounded-[2rem]">
                              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Absence Rate</p>
                              <p className="text-2xl md:text-3xl font-black text-indigo-400">4.2%</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'payroll' && (
            <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 w-full">
               <div className="bg-slate-950 p-8 md:p-12 rounded-[3rem] md:rounded-[4rem] text-white flex flex-col md:flex-row justify-between items-center gap-8 md:gap-10 shadow-2xl border border-white/5 w-full">
                  <div className="flex items-center gap-6 md:gap-8 relative z-10 w-full md:w-auto min-w-0"><div className="w-16 h-16 md:w-20 md:h-20 bg-white/5 border border-white/10 rounded-2xl md:rounded-[2rem] flex items-center justify-center backdrop-blur-xl shadow-inner shrink-0"><Wallet size={30} className="text-[#00ff9d] md:w-9 md:h-9" /></div><div className="min-w-0"><h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-1 truncate">Compliance Core</h2><p className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2 truncate"><ShieldCheck size={14} className="text-emerald-500 shrink-0" /> NGN ACT 2024 Baseline</p></div></div>
                  <button className="w-full md:w-auto bg-[#00ff9d] text-slate-950 px-8 md:px-12 py-4 md:py-5 rounded-2xl md:rounded-[2rem] font-black uppercase tracking-widest text-[10px] md:text-xs active:scale-95 transition-all flex items-center justify-center gap-3 shrink-0">Trigger Disbursement <ArrowRight size={18} /></button>
               </div>
               <div className="bg-white rounded-[3rem] md:rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden w-full">
                  <div className="overflow-x-auto w-full">
                     <table className="w-full text-left text-sm min-w-[900px]">
                        <thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] border-b border-slate-100">
                           <tr><th className="px-8 md:px-10 py-6 md:py-8">Personnel</th><th className="px-8 md:px-10 py-6 md:py-8">Gross</th><th className="px-8 md:px-10 py-6 md:py-8">PAYE Deductions</th><th className="px-8 md:px-10 py-6 md:py-8">Net Pay</th><th className="px-8 md:px-10 py-6 md:py-8 text-right">Audit</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {payrollItems.map(item => (
                              <tr key={item.id} className="hover:bg-indigo-50/20 transition-all group"><td className="px-8 md:px-10 py-6 md:py-8"><div className="font-black text-slate-900 uppercase text-xs md:text-sm tracking-tight truncate">{item.employeeName}</div><p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase mt-1">Ref: {item.employeeId.slice(-4)}</p></td><td className="px-8 md:px-10 py-6 md:py-8 font-black text-slate-700 whitespace-nowrap">₦{(item.grossCents / 100).toLocaleString()}</td><td className="px-8 md:px-10 py-6 md:py-8 font-black text-rose-500 whitespace-nowrap">₦{(item.taxCents / 100).toLocaleString()}</td><td className="px-8 md:px-10 py-6 md:py-8 font-black text-emerald-600 text-base md:text-lg tracking-tighter whitespace-nowrap">₦{(item.netCents / 100).toLocaleString()}</td><td className="px-8 md:px-10 py-6 md:py-8 text-right whitespace-nowrap">{item.anomalies.length > 0 ? (<div className="flex items-center gap-2 text-rose-500 justify-end group/tip relative cursor-help bg-rose-50 px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-rose-100 inline-flex"><AlertTriangle size={16} /><span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Anomaly</span></div>) : (<div className="p-2 md:p-3 bg-emerald-50 text-emerald-600 rounded-xl inline-flex shadow-sm"><CheckCircle2 size={18} /></div>)}</td></tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         )}
         {activeTab === 'matrix' && <MatrixTab matrix={departmentMatrix} />}
         <HireStaffModal isOpen={isHireModalOpen} onClose={closeHireModal} editingEmployee={editingEmployee} />
         <LeaveModal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} />
      </div>
   );
};