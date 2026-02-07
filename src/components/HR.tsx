import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Employee, Department, EmployeeStatus, PayrollItem, DepartmentMatrix, Role, DepartmentRole, LeaveRequest, LeaveStatus, LeaveType } from '../types';
import { calculatePayrollForEmployee, formatSalary } from '../services/hrUtils';
import { extractInfoFromCV } from '../services/ai';
import {
   Users, Briefcase, Plus, ShieldCheck, Receipt, LayoutGrid, TrendingUp, ChevronRight,
   Activity, AlertTriangle, CheckCircle2, Wallet, Banknote, Landmark, Grid3X3, Layers, DollarSign, Info, X, UserPlus, Mail, Shield, User as UserIcon, ArrowRight, LogOut, ShieldAlert, Phone, Calendar as CalendarIcon, FileText, Upload, Mic, Square, Sparkles, MapPin, Loader2, Image as ImageIcon, Download, Printer, QrCode, Search, GripHorizontal, HeartPulse, Plane, Check, Clock, Globe, Send, RefreshCw, Trash2, Maximize2, Minimize2, Lock
} from 'lucide-react';

const generatePayslip = (item: PayrollItem, employee: Employee) => {
   // Placeholder for PDF generation
   alert(`Generating payslip for ${employee?.firstName || 'Employee'}`);
   console.log('Generating Payslip:', item, employee);
};

const DigitalIDCard = ({ employee, onClose }: { employee: Employee, onClose: () => void }) => {
   const { settings: org } = useSettingsStore();
   const handlePrint = () => { window.print(); };

   return (
      <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl animate-in zoom-in duration-300" onClick={onClose}>
         <div className="flex flex-col items-center gap-8 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
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
                     <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">{employee.title ? `${employee.title} ` : ''}{employee.firstName}<br />{employee.lastName}</h2>
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-6">{employee.role}</p>
                     <div className="space-y-4">
                        <div className="flex flex-col items-center">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">System Login ID</p>
                           <p className="text-xl font-mono font-black text-slate-900 tracking-wider bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">{employee.staffId || 'PENDING'}</p>
                        </div>
                        {(employee as any)._tempPassword && (
                           <div className="flex flex-col items-center animate-pulse">
                              <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-1">Initial Password</p>
                              <p className="text-sm font-mono font-black text-slate-900 border-b-2 border-rose-500 pb-1">{(employee as any)._tempPassword}</p>
                           </div>
                        )}
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
   // 1. State Hooks
   const [firstName, setFirstName] = useState('');
   const [lastName, setLastName] = useState('');
   const [title, setTitle] = useState('');
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
   const [hasDraft, setHasDraft] = useState(false);
   const [isMaximized, setIsMaximized] = useState(false);

   // Staff Auth Logic
   const [staffId, setStaffId] = useState('');
   const [defaultPassword, setDefaultPassword] = useState('');

   // 2. Refs & Constants
   const fileInputRef = useRef<HTMLInputElement>(null);
   const DRAFT_KEY = 'hire_staff_form_draft';

   // 3. Store Hooks
   const departmentMatrix = useDataStore(state => state.departmentMatrix);
   const employees = useDataStore(state => state.employees);
   const addEmployee = useDataStore(state => state.addEmployee);
   const updateEmployee = useDataStore(state => state.updateEmployee);

   // 4. Helper Functions
   const generateCredentials = () => {
      // Sequential Generation proposed: Search for the first available XQ-XXXX slot
      let counter = 1;
      let candidateId = '';
      while (true) {
         candidateId = `XQ-${counter.toString().padStart(4, '0')}`;
         // Check if this ID exists in the loaded employees list (checking both camelCase and snake_case properties)
         const exists = employees.some(e =>
            (e as any).staffId === candidateId ||
            (e as any).staff_id === candidateId ||
            (e.email && e.email.toUpperCase().startsWith(candidateId)) // Extra safety: collision with email prefix
         );
         if (!exists) break;
         counter++;
      }

      const newId = candidateId;
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let pass = "";
      for (let i = 0; i < 8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));

      setStaffId(newId);
      setDefaultPassword(pass);
   };

   const clearInputs = () => {
      setFirstName(''); setLastName(''); setTitle(''); setEmail(''); setPhoneNumber(''); setAddress(''); setDob(''); setGender('Male');
      setDateOfEmployment(new Date().toISOString().split('T')[0]); setSelectedRoleTitle(''); setSalaryNGN(0); setAvatar(''); setHealthNotes('');
      setHasDraft(false);
      generateCredentials(); // Regen for next user
   };

   const resetFormFields = () => {
      clearInputs();
      setIdGenerated(null);
   };

   // 5. Effects
   // Listener for CEO Role to set special ID
   useEffect(() => {
      if (selectedRoleTitle === 'Chief Executive Officer') {
         setStaffId('XQ-0001');
      } else if (staffId === 'XQ-0001') {
         // If switching away from CEO, regenerate random ID
         generateCredentials();
      }
   }, [selectedRoleTitle]);

   // ... (Rest of useEffects) ...

   // Load Draft or Edit Data
   useEffect(() => {
      if (editingEmployee) {
         setFirstName(editingEmployee.firstName); setLastName(editingEmployee.lastName); setTitle(editingEmployee.title || ''); setEmail(editingEmployee.email);
         setPhoneNumber(editingEmployee.phoneNumber || ''); setAddress(editingEmployee.address || ''); setDob(editingEmployee.dob);
         setGender(editingEmployee.gender); setDateOfEmployment(editingEmployee.dateOfEmployment); setSelectedRoleTitle(editingEmployee.role);
         setSalaryNGN(editingEmployee.salaryCents / 100); setAvatar(editingEmployee.avatar); setHealthNotes(editingEmployee.healthNotes || '');
         setStaffId(editingEmployee.staffId || ''); // Load existing if present
         setDefaultPassword('Managed by User'); // Don't show real password for edit
      } else if (isOpen) {
         // ... (Draft logic) ...
         if (!staffId) generateCredentials(); // Generate if new
      }
   }, [editingEmployee, isOpen]);

   // Auto-Save Draft
   useEffect(() => {
      if (!isOpen || editingEmployee || isSubmitting) return;
      const formData = { firstName, lastName, email, phoneNumber, address, dob, gender, dateOfEmployment, selectedRoleTitle, salaryNGN, avatar, healthNotes };
      const isEmpty = !firstName && !lastName && !email && !selectedRoleTitle;
      if (!isEmpty) {
         localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
         setHasDraft(true);
      }
   }, [firstName, lastName, email, phoneNumber, address, dob, gender, dateOfEmployment, selectedRoleTitle, salaryNGN, avatar, healthNotes, isOpen, editingEmployee, isSubmitting]);




   const allRoles = useMemo(() => departmentMatrix.flatMap((dept: any) => dept.roles.map((r: any) => ({ ...r, department: dept.name }))), [departmentMatrix]);
   const selectedRole = useMemo(() => allRoles.find(r => r.title === selectedRoleTitle), [selectedRoleTitle, allRoles]);

   if (!isOpen) return null;

   const handleHire = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!firstName || !lastName || !selectedRoleTitle) return;
      setIsSubmitting(true);

      // Gender-aware avatar generation
      let avatarUrl = avatar;
      if (!avatarUrl) {
         const genderParams = gender === 'Female'
            ? '&facialHairProbability=0&head[]=long,longBob,longCurly,longCurvy,longDreads,longFrida,longFro,longFroBand,longMiaWallace,longNotTooLong,longShavedSides,longStraight,longStraight2,longStraightStrand'
            : '&head[]=short,shortDreads1,shortDreads2,shortFrizzle,shortShaggyMullet,shortCurly,shortFlat,shortRound,shortWaved,shortSides,caesar,caesarSidePart';
         avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${firstName}-${lastName}${genderParams}`;
      }

      // If no email provided, generate a system email from Staff ID so they can still log in
      let finalEmail = email;
      if (!finalEmail && staffId) {
         finalEmail = `${staffId.toLowerCase()}@xquisite.local`;
      }

      const employeeData = {
         firstName, lastName, title, email: finalEmail, phoneNumber, address, dob, gender, dateOfEmployment,
         role: selectedRoleTitle as any, salaryCents: salaryNGN * 100, avatar: avatarUrl, healthNotes,
         staffId: staffId // Save the ID
      };

      if (editingEmployee) {
         updateEmployee(editingEmployee.id, employeeData);
         setIsSubmitting(false);
         onClose();
      }
      else {
         try {
            const addedEmployee = await addEmployee(employeeData);
            const created = { ...addedEmployee, _tempPassword: defaultPassword }; // Hack to pass password to ID card
            setIsSubmitting(false);
            setIdGenerated(created);
            // Clear form inputs immediately so they don't persist on next open
            localStorage.removeItem(DRAFT_KEY);
            clearInputs();
         } catch (err: any) {
            console.error("Hiring Failed:", err);
            alert(`Failed to hire staff: ${err.message || err}`);
            setIsSubmitting(false);
         }
      }
   };

   const handleDiscardDraft = () => {
      localStorage.removeItem(DRAFT_KEY);
      resetFormFields();
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
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 md:p-4 bg-slate-950/90 backdrop-blur-2xl animate-in zoom-in duration-300" onClick={onClose}>
         <div
            onClick={e => e.stopPropagation()}
            className={`bg-white shadow-2xl w-full overflow-hidden flex flex-col relative border border-slate-200 transition-all duration-300 ${isMaximized ? 'fixed inset-0 rounded-none h-full max-w-none' : 'md:rounded-[3.5rem] max-w-4xl h-full md:h-[90vh]'}`}
         >
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
                  <div className="min-w-0">
                     <h2 className="text-xl md:text-3xl font-black text-slate-800 uppercase tracking-tighter truncate">{editingEmployee ? 'Update Profile' : 'Hire Staff'}</h2>
                     <div className="flex items-center gap-2">
                        <p className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 truncate">Organizational Registry</p>
                        {hasDraft && !editingEmployee && <span className="text-[9px] font-black uppercase text-amber-500 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 flex items-center gap-1"><RefreshCw size={10} className="animate-spin" /> Draft Restored</span>}
                     </div>
                  </div>
               </div>
               <div className="flex gap-2">
                  {!editingEmployee && (
                     <>
                        {hasDraft && <button onClick={handleDiscardDraft} className="hidden sm:flex items-center gap-2 px-4 py-3 bg-rose-50 border-2 border-rose-100 text-rose-500 rounded-2xl font-black uppercase text-[10px] shadow-sm hover:bg-rose-100 transition-all"><Trash2 size={16} /> Discard</button>}
                        <button onClick={() => fileInputRef.current?.click()} className="hidden sm:flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 rounded-2xl font-black uppercase text-[10px] shadow-sm hover:border-indigo-500 transition-all"><FileText size={16} /> Scan CV</button>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx,image/*" onChange={handleCVUpload} />
                     </>
                  )}
                  <button onClick={onClose} className="p-3 md:p-4 bg-slate-100 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm"><X size={20} /></button>
               </div>
            </div>
            <form id="hire-staff-form" onSubmit={handleHire} className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 overflow-y-auto flex-1 scrollbar-thin">
               <div className="space-y-8 md:space-y-10">
                  <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-3"><h3 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em]">Profile Identity</h3><div className="h-px flex-1 bg-indigo-50"></div></div>
                  <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8 p-6 md:p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-200 border-dashed group hover:border-indigo-200 transition-all">
                     <div className="w-24 h-24 rounded-2xl bg-white border-2 border-slate-200 overflow-hidden shadow-sm shrink-0">{avatar ? <img src={avatar} className="w-full h-full object-cover" alt="preview" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><UserIcon size={40} /></div>}</div>
                     <div className="space-y-3 w-full">
                        <div className="flex gap-4">
                           <div className="w-24 shrink-0">
                              <select className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:border-indigo-500 transition-all text-center appearance-none" value={title} onChange={e => setTitle(e.target.value)}>
                                 <option value="">Title</option>
                                 <option value="Mr">Mr</option>
                                 <option value="Mrs">Mrs</option>
                                 <option value="Miss">Miss</option>
                                 <option value="Dr">Dr</option>
                                 <option value="Chief">Chief</option>
                                 <option value="Engr">Engr</option>
                              </select>
                           </div>
                           <input required className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-900 text-lg shadow-sm outline-none focus:border-indigo-500 transition-all" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} />
                        </div>
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
                        <input type="email" className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-900 font-black outline-none focus:border-indigo-500 transition-all" placeholder="Email (Optional)" value={email} onChange={e => setEmail(e.target.value)} />
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

                  <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-3"><h3 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em]">System Credentials</h3><div className="h-px flex-1 bg-indigo-50"></div></div>
                  <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-indigo-400 tracking-widest ml-2 block">System ID (Login)</label>
                           <div className="relative">
                              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={16} />
                              <input type="text" readOnly className="w-full pl-12 pr-4 py-3 bg-white border-2 border-indigo-100 rounded-xl font-mono font-black text-slate-700 outline-none uppercase tracking-wider" value={staffId} />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-indigo-400 tracking-widest ml-2 block">Initial Password</label>
                           <div className="relative">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={16} />
                              <input type="text" className="w-full pl-12 pr-4 py-3 bg-white border-2 border-indigo-100 rounded-xl font-mono font-black text-slate-700 outline-none tracking-wider" value={defaultPassword} onChange={e => setDefaultPassword(e.target.value)} />
                           </div>
                        </div>
                     </div>
                     <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-tight ml-2 flex items-center gap-1"><Info size={12} /> Share these with the employee for their first login.</p>
                  </div>
                  {selectedRole && (
                     <div className="p-8 md:p-10 bg-slate-950 rounded-[3rem] text-white space-y-6 md:space-y-8 relative overflow-hidden ring-4 ring-slate-100">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-[#00ff9d]/5 rounded-full blur-3xl"></div>
                        <div className="flex justify-between items-center relative z-10 border-b border-white/10 pb-4"><h4 className="text-[9px] md:text-[11px] font-black uppercase text-[#00ff9d] tracking-widest">Salary Band</h4><span className="px-3 py-1 bg-[#00ff9d]/10 border border-[#00ff9d]/20 text-[#00ff9d] rounded-xl text-[9px] font-black uppercase tracking-wider">Band {selectedRole.band}</span></div>
                        <div className="grid grid-cols-3 gap-4 md:gap-8 relative z-10 text-center"><div><p className="text-[8px] text-slate-500 uppercase font-black mb-1">Min</p><p className="text-sm md:text-lg font-black">₦{formatSalary(selectedRole.salaryRange.low)}</p></div><div className="border-x border-white/10"><p className="text-[8px] text-slate-500 uppercase font-black mb-1">Mid</p><p className="text-sm md:text-lg font-black text-indigo-400">₦{formatSalary(selectedRole.salaryRange.mid)}</p></div><div><p className="text-[8px] text-slate-500 uppercase font-black mb-1">Max</p><p className="text-sm md:text-lg font-black">₦{formatSalary(selectedRole.salaryRange.high)}</p></div></div>
                        <div className="space-y-3 relative z-10"><label className="text-[10px] md:text-[11px] font-black uppercase text-slate-400 tracking-widest ml-2 block">Monthly Gross (₦)</label><div className="relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 font-black text-xl md:text-2xl">₦</span><input type="number" required className="w-full pl-12 pr-6 py-5 md:py-6 bg-white/5 border border-white/10 rounded-[2rem] text-white font-black text-2xl md:text-4xl outline-none focus:border-[#00ff9d] transition-all" value={salaryNGN || ''} onChange={e => setSalaryNGN(parseInt(e.target.value) || 0)} /></div></div>
                     </div>
                  )}
               </div>
            </form>
            <div className="p-6 md:p-10 border-t-2 border-slate-100 bg-slate-50 flex gap-4 md:gap-6 shrink-0">
               <button type="button" onClick={onClose} className="flex-1 py-4 md:py-6 rounded-[2rem] font-black uppercase tracking-widest text-[10px] md:text-[11px] text-slate-500 hover:bg-white hover:text-slate-800 border-2 border-transparent hover:border-slate-200 transition-all bg-white shadow-sm">Abort</button>
               <button type="submit" form="hire-staff-form" disabled={isSubmitting} className="flex-2 py-4 md:py-6 bg-slate-950 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] md:text-[11px] shadow-2xl flex items-center justify-center gap-3 transition-all hover:brightness-110 active:scale-95 group shrink-0 min-w-[160px] md:min-w-[240px]">{isSubmitting ? <Activity className="animate-spin" size={20} /> : <ShieldCheck size={20} className="text-[#00ff9d] group-hover:scale-110 transition-transform" />}{isSubmitting ? 'Onboarding...' : editingEmployee ? 'Update' : 'Hire Staff'}</button>
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
   const [isMaximized, setIsMaximized] = useState(false);

   const currentUser = useAuthStore(state => state.user);
   const applyForLeave = useDataStore(state => state.applyForLeave);

   if (!isOpen) return null;

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser) return;

      applyForLeave({
         type,
         startDate,
         endDate,
         reason,
         employeeId: currentUser.id,
         employeeName: currentUser.name || 'Unknown Staff'
      });
      onClose();
      setType(LeaveType.ANNUAL); setStartDate(''); setEndDate(''); setReason('');
   };

   return (
      <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl animate-in zoom-in duration-300" onClick={onClose}>
         <div
            onClick={e => e.stopPropagation()}
            className={`bg-white shadow-2xl w-full overflow-hidden flex flex-col border border-slate-200 transition-all duration-300 ${isMaximized ? 'fixed inset-0 rounded-none h-full max-w-none' : 'max-w-lg rounded-[3.5rem] max-h-[90vh]'}`}
         >
            <div className="p-8 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/80">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-[#00ff9d] shadow-lg"><Plane size={24} /></div>
                  <div><h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Request Absence</h2><p className="text-[10px] text-slate-500 font-black uppercase mt-1">Personnel Node Registry</p></div>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => setIsMaximized(!isMaximized)} className="p-3 bg-white border border-slate-100 hover:bg-slate-50 rounded-2xl transition-all shadow-sm">
                     {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                  <button onClick={onClose} className="p-3 bg-white border border-slate-100 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm"><X size={20} /></button>
               </div>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8 flex-1 overflow-y-auto">
               <div><label className="text-[11px] font-black uppercase text-slate-500 tracking-widest ml-2 mb-2 block">Leave Classification</label>                     <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none text-slate-900" value={type} onChange={e => setType(e.target.value as any)}>{Object.values(LeaveType).map(t => <option key={t} value={t}>{t} Leave</option>)}</select></div>
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
            <div className="flex flex-wrap gap-2">{[1, 2, 3, 4, 5, 6].map(b => (<button key={b} onClick={() => setAdjustingBand(b)} className="bg-slate-900 hover:bg-[#00ff9d] hover:text-slate-950 px-4 md:px-5 py-2.5 md:py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 transition-all shadow-xl whitespace-nowrap shrink-0">Adj. Band {b}</button>))}</div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 pb-20 w-full">
            {matrix.map(dept => (
               <div key={dept.id} className="bg-slate-900/50 border border-white/5 rounded-[3rem] overflow-hidden group transition-all flex flex-col h-full shadow-2xl">
                  <div className="p-8 md:p-10 border-b border-white/5 bg-white/[0.02] flex items-center gap-4 md:gap-5 shrink-0"><div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-600/20 rounded-[1.2rem] flex items-center justify-center text-indigo-400 group-hover:bg-[#00ff9d] group-hover:text-slate-950 transition-all shadow-inner"><Layers size={24} /></div><h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight truncate">{dept.name}</h3></div>
                  <div className="p-8 md:p-10 space-y-6 md:space-y-8 flex-1 overflow-y-auto">
                     {dept.roles.sort((a, b) => b.band - a.band).map((role, idx) => (
                        <div key={idx} className="relative pl-10 group/role"><div className="absolute left-0 top-0 bottom-0 w-px bg-white/10"></div><div className="absolute left-[-5px] top-2 w-2.5 h-2.5 rounded-full bg-slate-800 border-2 border-slate-900 group-hover/role:bg-[#00ff9d] shadow-lg"></div>
                           <div className="flex justify-between items-start mb-2 gap-2"><div><h4 className="text-[13px] font-black text-slate-200 uppercase tracking-tight leading-none mb-1">{role.title}</h4><p className="text-[8px] font-black text-slate-500 uppercase tracking-widest truncate">Career Path Unit</p></div><span className="bg-slate-950 px-2.5 py-1 rounded text-[8px] md:text-[9px] font-black text-[#00ff9d] border border-[#00ff9d]/20 uppercase shrink-0">Band {role.band}</span></div>
                           <div className="space-y-2"><div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5"><div className="h-full bg-indigo-600 opacity-50 shadow-[0_0_10px_rgba(79,70,229,0.5)]" style={{ width: `${(role.band / 6) * 100}%` }}></div></div><div className="flex justify-between text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-tighter gap-1"><span>₦{formatSalary(role.salaryRange.low)}</span><span className="text-indigo-400/80 truncate">₦{formatSalary(role.salaryRange.mid)} Mid</span><span>₦{formatSalary(role.salaryRange.high)}</span></div></div>
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

const LoanRequestModal = ({ isOpen, onClose, employeeId }: { isOpen: boolean, onClose: () => void, employeeId: string }) => {
   const [amount, setAmount] = useState('');
   const [reason, setReason] = useState('');
   const addRequisition = useDataStore(s => s.addRequisition);
   const user = useAuthStore(s => s.user);

   const handleSubmit = () => {
      const cents = parseFloat(amount) * 100;
      if (!cents || !reason) return;

      addRequisition({
         id: `req-${Date.now()}`,
         type: 'Loan',
         category: 'Financial',
         itemName: 'Salary Advance Request',
         quantity: 1,
         pricePerUnitCents: cents,
         totalAmountCents: cents,
         requestorId: employeeId || user?.id || 'unknown',
         status: 'Pending',
         notes: reason
      });
      onClose();
      alert('Loan request submitted for approval.');
   };

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in" onClick={onClose}>
         <div onClick={e => e.stopPropagation()} className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Request Advance</h3>
               <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-rose-500" /></button>
            </div>
            <div>
               <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-2 mb-2 block">Amount Required (₦)</label>
               <input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-2xl text-slate-900 outline-none focus:border-indigo-500" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div>
               <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-2 mb-2 block">Reason / Context</label>
               <textarea className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm text-slate-900 outline-none focus:border-indigo-500 min-h-[100px]" placeholder="Briefly explain the need..." value={reason} onChange={e => setReason(e.target.value)}></textarea>
            </div>
            <button onClick={handleSubmit} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl">Submit Request</button>
         </div>
      </div>
   );
};

export const HR = () => {
   const employees = useDataStore(state => state.employees);
   const departmentMatrix = useDataStore(state => state.departmentMatrix);
   const leaveRequests = useDataStore(state => state.leaveRequests);
   const requisitions = useDataStore(state => state.requisitions);
   const approveLeave = useDataStore(state => state.approveLeave);
   const rejectLeave = useDataStore(state => state.rejectLeave);
   const currentUser = useAuthStore(state => state.user);
   const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);

   // Enrich leave requests with up-to-date employee names
   const enrichedLeaveRequests = useMemo(() => {
      return leaveRequests.map(req => {
         // 1. Priority: If it's the current user, use their fresh session name
         if (currentUser && req.employeeId === currentUser.id && currentUser.name) {
            return { ...req, employeeName: currentUser.name };
         }

         // 2. Lookup from Employee List
         const emp = employees.find(e => e.id === req.employeeId);
         let displayName = req.employeeName || '';

         if (emp) {
            // Check for valid names (not null, not undefined, not string "undefined")
            const validFirst = emp.firstName && emp.firstName.toLowerCase() !== 'undefined' ? emp.firstName : '';
            const validLast = emp.lastName && emp.lastName.toLowerCase() !== 'undefined' ? emp.lastName : '';

            if (validFirst && validLast) {
               displayName = `${validFirst} ${validLast}`;
            } else if (validFirst) {
               displayName = validFirst;
            } else if ((emp as any).name && (emp as any).name.toLowerCase() !== 'undefined') {
               displayName = (emp as any).name;
            }
         }

         // 3. Cleanup Legacy Bad Data
         if (!displayName || displayName.toLowerCase().includes('undefined')) {
            displayName = 'Unknown Staff';
         }

         return { ...req, employeeName: displayName };
      });
   }, [leaveRequests, employees, currentUser]);

   const [activeTab, setActiveTab] = useState<'dashboard' | 'people' | 'payroll' | 'matrix' | 'leave' | 'performance'>('dashboard');
   const [searchQuery, setSearchQuery] = useState('');
   const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
   const [isHireModalOpen, setIsHireModalOpen] = useState(false);
   const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
   const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined);

   const isHRManagerial = useMemo(() => {
      const role = currentUser?.role as string;
      const isFin = role === Role.FINANCE || role === 'CFO';
      const isExec = role === Role.CEO || role === Role.CHAIRMAN || role === 'CEO';
      const isAdminOrHR = role === Role.ADMIN || role === Role.SUPER_ADMIN || role === Role.HR_MANAGER || role === 'HR Manager';
      return isExec || isFin || isAdminOrHR || !!currentUser?.isSuperAdmin;
   }, [currentUser]);

   const isAdmin = isHRManagerial; // Alias for backward compatibility in components

   useEffect(() => {
      // If NOT HR Managerial, restrict available tabs to personal views
      if (!isHRManagerial && ['dashboard', 'people', 'matrix'].includes(activeTab)) {
         setActiveTab('leave');
      }
   }, [isHRManagerial, activeTab]);

   useEffect(() => {
      if (activeTab === 'payroll') {
         let items = employees.map(e => calculatePayrollForEmployee(e));
         // Filter for non-admins to only see their own
         if (!isAdmin) {
            items = items.filter(i => i.employeeId === currentUser?.id);
         }
         setPayrollItems(items);
      }
   }, [activeTab, employees, isAdmin, currentUser]);

   const filteredEmployees = useMemo(() => {
      const query = searchQuery.toLowerCase().trim();
      let roster = employees;

      // Filter roster for non-admins (maybe they can view all, or only themselves?)
      // Requirement said "personal kpis", implies restricted view.
      // Let's restrict People tab to only yourself if not admin/manager
      const isManagerial = [Role.ADMIN, Role.HR_MANAGER, Role.SUPER_ADMIN, Role.CEO, Role.MANAGER].includes(currentUser?.role as any);
      if (!isManagerial) {
         roster = roster.filter(e => e.id === currentUser?.id);
      }

      if (!query) return roster;
      return roster.filter(e => {
         const matchName = `${e.firstName} ${e.lastName}`.toLowerCase().includes(query);
         const matchEmail = e.email.toLowerCase().includes(query);
         const matchRole = e.role.toLowerCase().includes(query);
         const matchHealth = (e.healthNotes || '').toLowerCase().includes(query);
         return matchName || matchEmail || matchRole || matchHealth;
      });
   }, [employees, searchQuery, currentUser]);

   const handleEditEmployee = (emp: Employee) => { setEditingEmployee(emp); setIsHireModalOpen(true); };
   const closeHireModal = () => { setIsHireModalOpen(false); setEditingEmployee(undefined); };

   const handleApproveLeave = (id: string) => approveLeave(id);
   const handleRejectLeave = (id: string) => rejectLeave(id);

   return (
      <div className="space-y-6 md:space-y-10 animate-in fade-in pb-24 w-full">
         <div className="bg-slate-950 p-6 md:p-10 rounded-[3rem] md:rounded-[4rem] text-white relative overflow-hidden shadow-2xl border border-white/5 w-full">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -mr-60 -mt-60 pointer-events-none"></div>
            <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 w-full">
               <div className="flex items-center gap-6 md:gap-8 min-w-0 max-w-full">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[2rem] flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.4)] animate-float shrink-0"><Briefcase size={32} className="text-white md:w-10 md:h-10" /></div>
                  <div className="min-w-0 flex-1"><h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase leading-none mb-3 truncate">Human Resources</h1><div className="flex items-center gap-3 md:gap-4 overflow-x-auto no-scrollbar"><div className="flex items-center gap-2 bg-white/5 px-3 md:px-4 py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[#00ff9d] border border-white/5 whitespace-nowrap"><ShieldCheck size={12} /> Verified</div><div className="flex items-center gap-2 bg-white/5 px-3 md:px-4 py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 border border-white/5 whitespace-nowrap"><Users size={12} /> {employees.length} Staff</div></div></div>
               </div>
               <div className="flex bg-white/5 p-1.5 rounded-[1.8rem] md:rounded-[2rem] border border-white/10 backdrop-blur-xl overflow-x-auto max-w-full hide-scrollbar shrink-0 self-start xl:self-auto">
                  {[
                     { id: 'dashboard', label: 'Briefing', icon: LayoutGrid, visible: isHRManagerial },
                     { id: 'people', label: 'People', icon: Users, visible: isHRManagerial },
                     { id: 'leave', label: 'Absence Node', icon: Plane, visible: true },
                     { id: 'payroll', label: 'Payroll', icon: Banknote, visible: true }, // Filtered for self if not managerial
                     { id: 'matrix', label: 'Role Matrix', icon: Layers, visible: isHRManagerial },
                     { id: 'performance', label: 'Performance', icon: Sparkles, visible: true }
                  ].filter(t => t.visible).map(tab => (
                     <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-5 md:px-8 py-3 rounded-[1.2rem] md:rounded-[1.5rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-2xl' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                        <tab.icon size={14} className="shrink-0" /> <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.label.charAt(0)}</span>
                     </button>
                  ))}
               </div>
            </div>
         </div>

         {activeTab === 'dashboard' && isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 w-full">
               <div className="bg-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl border border-slate-100 group hover:scale-[1.02] transition-all"><p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Total Headcount</p><h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">{employees.length}</h3><div className="mt-6 flex items-center gap-2 text-emerald-600 font-black text-[9px] md:text-[10px] uppercase tracking-widest"><TrendingUp size={14} /> Stable Growth</div></div>
               <div className="bg-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl border border-slate-100 group hover:scale-[1.02] transition-all"><p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Departments</p><h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">{departmentMatrix.length}</h3><div className="mt-6 flex items-center gap-2 text-indigo-600 font-black text-[9px] md:text-[10px] uppercase tracking-widest"><LayoutGrid size={14} /> Matrix Sync</div></div>
               <div className="bg-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl border border-slate-100 group hover:scale-[1.02] transition-all"><p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Active Leave</p><h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">{enrichedLeaveRequests.filter(l => l.status === LeaveStatus.APPROVED).length}</h3><div className="mt-6 flex items-center gap-2 text-amber-600 font-black text-[9px] md:text-[10px] uppercase tracking-widest"><Plane size={14} /> Scheduled</div></div>
               <div className="bg-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl border border-slate-100 group hover:scale-[1.02] transition-all"><p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Pending</p><h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">{enrichedLeaveRequests.filter(l => l.status === LeaveStatus.PENDING).length}</h3><div className="mt-6 flex items-center gap-2 text-indigo-600 font-black text-[9px] md:text-[10px] uppercase tracking-widest"><CheckCircle2 size={14} /> Operational</div></div>
            </div>
         )}

         {activeTab === 'people' && isAdmin && (
            <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 w-full overflow-hidden">
               <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 shadow-xl">
                  <div className="flex-1 w-full relative max-w-md">
                     <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                     <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-6 py-4 text-[11px] md:text-xs font-black uppercase tracking-widest outline-none focus:border-indigo-500 transition-all text-slate-900" placeholder="Search roster..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
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
         {activeTab === 'performance' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 w-full">
               <div className="bg-slate-950 p-8 md:p-10 rounded-[3rem] text-white flex justify-between items-center shadow-2xl relative overflow-hidden border border-white/10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                  <div className="relative z-10">
                     <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">{isAdmin ? 'Performance' : 'My Performance'}</h2>
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2"><Sparkles size={14} className="text-amber-400" /> Quarterly Assessment Cycle</p>
                  </div>
                  {isAdmin && <button className="bg-white text-slate-950 px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl">New Cycle</button>}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Placeholder for Review Cards - To be connected to store.performanceReviews */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl opacity-60">
                     <p className="font-black text-slate-300 uppercase tracking-widest text-xs text-center">No Active Reviews</p>
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
                        {enrichedLeaveRequests.filter(l => isAdmin || l.employeeId === currentUser?.id).map(req => (
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
                        {enrichedLeaveRequests.length === 0 && (
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
               {isAdmin ? (
                  <>
                     {/* Loan Approvals Section */}
                     <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-xl mb-8">
                        <div className="flex items-center gap-4 mb-6">
                           <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600"><AlertTriangle size={24} /></div>
                           <div>
                              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Pending Advances</h3>
                              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Requires Approval</p>
                           </div>
                        </div>
                        {requisitions.filter(r => r.category === 'Financial' && r.status === 'Pending').length > 0 ? (
                           <div className="space-y-4">
                              {requisitions.filter(r => r.category === 'Financial' && r.status === 'Pending').map(req => (
                                 <div key={req.id} className="flex flex-col md:flex-row justify-between items-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100 gap-4">
                                    <div className="flex items-center gap-4 w-full">
                                       <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center font-black text-slate-300 text-xs">IMG</div>
                                       <div>
                                          <p className="font-black text-slate-900 text-sm">{req.itemName}</p>
                                          <p className="text-xs text-slate-500 mt-1">{req.notes}</p>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{new Date().toLocaleDateString()}</p>
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-6 w-full md:w-auto shrink-0">
                                       <div className="font-black text-2xl text-slate-900">₦{(req.totalAmountCents / 100).toLocaleString()}</div>
                                       <div className="flex gap-2">
                                          <button onClick={() => useDataStore.getState().approveRequisition(req.id)} className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200">Approve</button>
                                          <button onClick={() => {/* Reject logic could be added */ }} className="px-6 py-3 bg-slate-200 text-slate-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-300 transition-colors">Reject</button>
                                       </div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        ) : (
                           <div className="p-8 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                              <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No pending salary advances</p>
                           </div>
                        )}
                     </div>

                     <div className="bg-slate-950 p-8 md:p-12 rounded-[3rem] md:rounded-[4rem] text-white flex flex-col md:flex-row justify-between items-center gap-8 md:gap-10 shadow-2xl border border-white/5 w-full">
                        <div className="flex items-center gap-6 md:gap-8 relative z-10 w-full md:w-auto min-w-0"><div className="w-16 h-16 md:w-20 md:h-20 bg-white/5 border border-white/10 rounded-2xl md:rounded-[2rem] flex items-center justify-center backdrop-blur-xl shadow-inner shrink-0"><Wallet size={30} className="text-[#00ff9d] md:w-9 md:h-9" /></div><div className="min-w-0"><h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-1">Salary Management</h2><p className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500 shrink-0" /> NGN ACT 2024 Baseline</p></div></div>
                        <button className="w-full md:w-auto bg-[#00ff9d] text-slate-950 px-8 md:px-12 py-4 md:py-5 rounded-2xl md:rounded-[2rem] font-black uppercase tracking-widest text-[10px] md:text-xs active:scale-95 transition-all flex items-center justify-center gap-3 shrink-0">Trigger Disbursement <ArrowRight size={18} /></button>
                     </div>
                     <div className="bg-white rounded-[3rem] md:rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden w-full">
                        <div className="overflow-x-auto w-full">
                           <table className="w-full text-left text-sm min-w-[950px]">
                              <thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] border-b border-slate-100">
                                 <tr><th className="px-8 md:px-10 py-6 md:py-8">Personnel</th><th className="px-8 md:px-10 py-6 md:py-8">Gross</th><th className="px-8 md:px-10 py-6 md:py-8">PAYE Deductions</th><th className="px-8 md:px-10 py-6 md:py-8">Net Pay</th><th className="px-8 md:px-10 py-6 md:py-8">Sanctions</th><th className="px-8 md:px-10 py-6 md:py-8 text-right">Audit</th></tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                 {payrollItems.map(item => (
                                    <tr key={item.id} className="hover:bg-indigo-50/20 transition-all group">
                                       <td className="px-8 md:px-10 py-6 md:py-8"><div className="font-black text-slate-900 uppercase text-xs md:text-sm tracking-tight truncate">{item.employeeName}</div><p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase mt-1">Ref: {item.employeeId.slice(-4)}</p></td><td className="px-8 md:px-10 py-6 md:py-8 font-black text-slate-700 whitespace-nowrap">₦{(item.grossCents / 100).toLocaleString()}</td><td className="px-8 md:px-10 py-6 md:py-8 font-black text-rose-500 whitespace-nowrap">₦{(item.taxCents / 100).toLocaleString()}</td><td className="px-8 md:px-10 py-6 md:py-8 font-black text-emerald-600 text-base md:text-lg tracking-tighter whitespace-nowrap">₦{(item.netCents / 100).toLocaleString()}</td>

                                       {/* Sanction Control Column */}
                                       <td className="px-8 md:px-10 py-6 md:py-8">
                                          {item.punishmentDeductionCents > 0 ? (
                                             <div className="flex items-center gap-3">
                                                <span className="font-black text-rose-500">₦{(item.punishmentDeductionCents / 100).toLocaleString()}</span>
                                                <button onClick={() => {
                                                   const emp = employees.find(e => e.id === item.employeeId);
                                                   if (emp) {
                                                      const newNotes = (emp.healthNotes || '').replace(/sanction/gi, '').trim();
                                                      useDataStore.getState().updateEmployee(emp.id, { healthNotes: newNotes });
                                                   }
                                                }} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 hover:scale-110 transition-all"><X size={14} /></button>
                                             </div>
                                          ) : (
                                             <button onClick={() => {
                                                const emp = employees.find(e => e.id === item.employeeId);
                                                if (emp) {
                                                   const newNotes = (emp.healthNotes ? emp.healthNotes + ' ' : '') + 'sanction';
                                                   useDataStore.getState().updateEmployee(emp.id, { healthNotes: newNotes });
                                                }
                                             }} className="px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-colors">
                                                Apply Sanction
                                             </button>
                                          )}
                                       </td>

                                       <td className="px-8 md:px-10 py-6 md:py-8 text-right whitespace-nowrap">{item.anomalies.length > 0 ? (<div className="flex items-center gap-2 text-rose-500 justify-end group/tip relative cursor-help bg-rose-50 px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-rose-100 inline-flex"><AlertTriangle size={16} /><span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Anomaly</span></div>) : (<div className="p-2 md:p-3 bg-emerald-50 text-emerald-600 rounded-xl inline-flex shadow-sm"><CheckCircle2 size={18} /></div>)}</td></tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </>
               ) : (
                  <div className="w-full max-w-2xl mx-auto space-y-6">
                     <div className="bg-slate-950 p-8 md:p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden text-center border border-white/5">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col items-center">
                           <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-[#00ff9d] shadow-inner mb-6 backdrop-blur-sm border border-white/10"><Banknote size={32} /></div>
                           <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] mb-2">Monthly Net Pay</p>
                           <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-6">
                              {payrollItems[0] ? `₦${(payrollItems[0].netCents / 100).toLocaleString()}` : '---'}
                           </h2>

                           {/* Download Payslip Button */}
                           <button onClick={() => generatePayslip(payrollItems[0], employees.find(e => e.id === payrollItems[0]?.employeeId)!)} className="mb-8 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/5 transition-all text-white/90 hover:text-white text-[10px] uppercase font-bold tracking-widest backdrop-blur-md">
                              <Download size={14} /> Download Payslip
                           </button>

                           <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                 <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Gross</p>
                                 <p className="text-lg font-black">{payrollItems[0] ? `₦${(payrollItems[0].grossCents / 100).toLocaleString()}` : '-'}</p>
                              </div>
                              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                 <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Tax</p>
                                 <p className="text-lg font-black text-rose-400">{payrollItems[0] ? `₦${(payrollItems[0].taxCents / 100).toLocaleString()}` : '-'}</p>
                              </div>
                           </div>
                        </div>
                     </div>
                     <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Sparkles size={18} /></div>
                           <div>
                              <p className="font-black text-slate-800 uppercase text-xs">Payroll Status</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Cycle</p>
                           </div>
                        </div>
                        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-emerald-100">
                           Active
                        </div>
                     </div>

                     {/* Deductions Breakdown */}
                     <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Deductions Breakdown</h3>
                        <div className="space-y-4">
                           <div className="flex justify-between items-center text-sm">
                              <span className="font-bold text-slate-600">Pension (8%)</span>
                              <span className="font-black text-slate-900">₦{(payrollItems[0]?.pensionEmployeeCents / 100 || 0).toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between items-center text-sm">
                              <span className="font-bold text-slate-600">NHF (2.5%)</span>
                              <span className="font-black text-slate-900">₦{(payrollItems[0]?.nhfCents / 100 || 0).toLocaleString()}</span>
                           </div>

                           {/* Conditional Punishment Deduction */}
                           {payrollItems[0]?.punishmentDeductionCents > 0 && (
                              <div className="flex justify-between items-center text-sm bg-rose-50 p-3 rounded-xl border border-rose-100 mt-2">
                                 <div className="flex items-center gap-2 text-rose-600">
                                    <AlertTriangle size={14} />
                                    <span className="font-black uppercase text-[10px] tracking-widest">Disciplinary Deduction</span>
                                 </div>
                                 <span className="font-black text-rose-700">-₦{(payrollItems[0]?.punishmentDeductionCents / 100).toLocaleString()}</span>
                              </div>
                           )}

                           <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                              <span className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Total Deductions</span>
                              <span className="font-black text-rose-500 text-lg">
                                 -₦{(((payrollItems[0]?.pensionEmployeeCents || 0) + (payrollItems[0]?.nhfCents || 0) + (payrollItems[0]?.taxCents || 0) + (payrollItems[0]?.punishmentDeductionCents || 0)) / 100).toLocaleString()}
                              </span>
                           </div>
                        </div>
                     </div>

                     {/* Loan / Advance Request */}
                     <button onClick={() => setIsLoanModalOpen(true)} className="w-full bg-slate-900 text-white p-6 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white"><Plus size={16} /></div>
                        Request Salary Advance / Loan
                     </button>
                  </div>
               )}
            </div>
         )}
         {activeTab === 'matrix' && <MatrixTab matrix={departmentMatrix} />}
         <HireStaffModal isOpen={isHireModalOpen} onClose={closeHireModal} editingEmployee={editingEmployee} />
         <LeaveModal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} />
         <LoanRequestModal isOpen={isLoanModalOpen} onClose={() => setIsLoanModalOpen(false)} employeeId={payrollItems[0]?.employeeId} />
      </div>
   );
};