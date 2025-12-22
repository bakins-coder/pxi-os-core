import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/mockDb';
import { Employee, Role, LeaveRequest, Department, SalaryBand, EmployeeStatus, PayrollItem } from '../types';
import { calculatePayrollForEmployee } from '../services/hrUtils';
import * as XLSX from 'xlsx';
import { 
  Users, UserPlus, CreditCard, Calendar, Briefcase, 
  Search, Plus, CheckCircle2, FileText, Download, 
  Bot, AlertTriangle, ChevronRight, X, User, Edit2,
  Trash2, LayoutGrid, Star, History, ShieldCheck, Clock, PlaneTakeoff,
  Camera, Upload, Building, TrendingUp, DollarSign, Calculator, Receipt, FileSpreadsheet
} from 'lucide-react';

export const HR = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'people' | 'payroll' | 'departments' | 'salary' | 'leave'>('dashboard');
  const [employees, setEmployees] = useState<Employee[]>(db.employees);
  const [departments, setDepartments] = useState<Department[]>(db.departments);
  const [salaryBands, setSalaryBands] = useState<SalaryBand[]>(db.salaryBands);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);

  const currentUser = db.currentUser || db.teamMembers[0];

  useEffect(() => {
    setEmployees([...db.employees]);
    setDepartments([...db.departments]);
    setSalaryBands([...db.salaryBands]);
    if (activeTab === 'payroll') {
      const items = db.employees.map(e => calculatePayrollForEmployee(e));
      setPayrollItems(items);
    }
  }, [activeTab]);

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmployeeModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleBulkStaffUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      const formattedStaff = json.map(row => ({
        firstName: row['First Name'] || row.firstName || row.Name?.split(' ')[0] || 'New',
        lastName: row['Last Name'] || row.lastName || row.Name?.split(' ')[1] || 'Staff',
        email: row.Email || row.email || '',
        role: row.Role || row.role || 'Employee',
        salary: row.Salary || row.salary || 70000,
        departmentId: row.Department || row.dept || 'd1',
        phone: row.Phone || row.phone || ''
      }));

      db.addEmployeesBulk(formattedStaff);
      alert(`Personnel data synced. ${formattedStaff.length} employees onboarded.`);
      setEmployees([...db.employees]);
      setIsBulkImporting(false);
    };
    reader.readAsBinaryString(file);
  };

  const StatusBadge = ({ status }: { status: EmployeeStatus }) => {
    const styles = {
      [EmployeeStatus.ACTIVE]: 'bg-green-100 text-green-700',
      [EmployeeStatus.PROBATION]: 'bg-amber-100 text-amber-700',
      [EmployeeStatus.LEFT]: 'bg-slate-100 text-slate-500',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      {/* HERO SECTION - NEXUS STYLE */}
      <div className="bg-slate-950 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl mb-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl animate-float">
                   <Briefcase size={36} />
                </div>
                <div>
                   <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Human Resources</h1>
                   <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-300 border border-white/5">
                         <ShieldCheck size={12} className="text-indigo-400"/> Personnel Data Verified
                      </span>
                   </div>
                </div>
             </div>

             <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md overflow-x-auto max-w-full">
                {[
                  { id: 'dashboard', label: 'Overview', icon: LayoutGrid },
                  { id: 'people', label: 'Workforce', icon: Users },
                  { id: 'payroll', label: 'Payroll', icon: Receipt },
                  { id: 'departments', label: 'Units', icon: Building },
                  { id: 'salary', label: 'Tiers', icon: CreditCard },
                  { id: 'leave', label: 'Leave', icon: Clock }
                ].map(tab => (
                   <button 
                      key={tab.id} 
                      onClick={() => setActiveTab(tab.id as any)} 
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
                   >
                      <tab.icon size={14}/> {tab.label}
                   </button>
                ))}
             </div>
          </div>
       </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
        {activeTab === 'dashboard' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start justify-between group hover:border-indigo-200 transition-all">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Headcount</p>
                    <h3 className="text-3xl font-black text-slate-800">{employees.length}</h3>
                    <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1"><TrendingUp size={12}/> +2 this week</p>
                 </div>
                 <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Users size={24}/></div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start justify-between group hover:border-rose-200 transition-all">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">On Leave</p>
                    <h3 className="text-3xl font-black text-slate-800">2</h3>
                    <p className="text-xs text-rose-500 font-bold mt-2">Active Absences</p>
                 </div>
                 <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl"><PlaneTakeoff size={24}/></div>
              </div>
              <div className="lg:col-span-2 bg-slate-900 p-6 rounded-3xl shadow-xl flex items-start justify-between relative overflow-hidden">
                 <div className="absolute -bottom-4 -right-4 opacity-10"><Bot size={80}/></div>
                 <div className="relative z-10">
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">AI HR Signal</p>
                    <h3 className="text-xl font-bold text-white leading-tight">Monthly Payroll analysis complete.<br/>Estimated Disbursement: ₦{(payrollItems.reduce((acc, i) => acc + i.net, 0)).toLocaleString()}</h3>
                    <button onClick={() => setActiveTab('payroll')} className="text-[10px] font-black text-white bg-indigo-500 px-4 py-2 rounded-full mt-4 uppercase tracking-widest hover:bg-indigo-400 transition-all">Review Payroll</button>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'payroll' && (
           <div className="space-y-6 animate-in fade-in">
              <div className="bg-indigo-900 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                 <div className="relative z-10">
                    <h2 className="text-3xl font-black tracking-tight mb-2 uppercase">Payroll Master Cycle</h2>
                    <p className="text-indigo-200 text-sm font-bold uppercase tracking-[0.2em]">November 2024 • Statutorily Compliant (Nigeria)</p>
                 </div>
                 <div className="flex gap-4 relative z-10">
                    <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-bold text-sm border border-white/10 transition-all flex items-center gap-2"><Download size={18}/> Export Bank File</button>
                    <button className="bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl transition-all active:scale-95">Disburse All</button>
                 </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-100">
                       <tr>
                          <th className="p-6">Employee</th>
                          <th className="p-6 text-right">Gross (Monthly)</th>
                          <th className="p-6 text-right">Tax (PAYE)</th>
                          <th className="p-6 text-right">Pension (8%)</th>
                          <th className="p-6 text-right">Net Pay</th>
                          <th className="p-6">AI Status</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {payrollItems.map(item => (
                          <tr key={item.id} className="hover:bg-indigo-50/20 transition-all">
                             <td className="p-6 font-black text-slate-800 uppercase">{item.employeeName}</td>
                             <td className="p-6 text-right font-bold text-slate-500">₦{item.gross.toLocaleString()}</td>
                             <td className="p-6 text-right font-bold text-red-500">₦{item.tax.toLocaleString()}</td>
                             <td className="p-6 text-right font-bold text-slate-400">₦{item.pensionEmployee.toLocaleString()}</td>
                             <td className="p-6 text-right font-black text-indigo-600 text-lg">₦{item.net.toLocaleString()}</td>
                             <td className="p-6">
                                {item.anomalies.length > 0 ? (
                                   <span className="flex items-center gap-1 text-amber-600 font-bold text-[10px] bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
                                      <AlertTriangle size={12}/> AI FLAG
                                   </span>
                                ) : (
                                   <span className="flex items-center gap-1 text-green-600 font-bold text-[10px] bg-green-50 px-2 py-1 rounded-full border border-green-100">
                                      <CheckCircle2 size={12}/> AUDITED
                                   </span>
                                )}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {activeTab === 'people' && (
           <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-end gap-3 px-2">
                 <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .csv" onChange={handleBulkStaffUpload}/>
                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   disabled={isBulkImporting}
                   className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-slate-50 transition-all disabled:opacity-50"
                 >
                    <FileSpreadsheet size={16}/> {isBulkImporting ? 'Processing...' : 'Bulk Import Staff'}
                 </button>
                 <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-lg shadow-indigo-100">
                    <Plus size={16}/> New Hire
                 </button>
              </div>
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                       <tr>
                          <th className="p-6">Profile</th>
                          <th className="p-6">Unit</th>
                          <th className="p-6">Status</th>
                          <th className="p-6">Salary</th>
                          <th className="p-6 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {employees.map(emp => (
                          <tr key={emp.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedEmployee(emp)}>
                             <td className="p-6">
                                <div className="flex items-center gap-3">
                                   <img src={emp.avatar} className="w-10 h-10 rounded-xl bg-slate-100"/>
                                   <div className="font-black text-slate-800">{emp.firstName} {emp.lastName}</div>
                                </div>
                             </td>
                             <td className="p-6 uppercase text-xs font-bold text-slate-500">{departments.find(d => d.id === emp.departmentId)?.name || 'N/A'}</td>
                             <td className="p-6"><StatusBadge status={emp.status}/></td>
                             <td className="p-6 font-bold text-indigo-600">₦{emp.salary.toLocaleString()}</td>
                             <td className="p-6 text-right"><ChevronRight className="text-slate-300 ml-auto"/></td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};