
import React, { useState, useEffect } from 'react';
import { nexusStore } from '../services/nexusStore';
import { Employee, Department, EmployeeStatus, PayrollItem } from '../types';
import { calculatePayrollForEmployee } from '../services/hrUtils';
import { 
  Users, Briefcase, Plus, ShieldCheck, Receipt, LayoutGrid, TrendingUp, ChevronRight
} from 'lucide-react';

export const HR = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'people' | 'payroll'>('dashboard');
  const [employees, setEmployees] = useState<Employee[]>(nexusStore.employees);
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);

  useEffect(() => {
    const unsubscribe = nexusStore.subscribe(() => {
       setEmployees([...nexusStore.employees]);
       if (activeTab === 'payroll') {
         setPayrollItems(nexusStore.employees.map(e => calculatePayrollForEmployee(e)));
       }
    });
    return unsubscribe;
  }, [activeTab]);

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      <div className="bg-slate-950 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl mb-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00ff9d]/20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-[#4f46e5] rounded-3xl flex items-center justify-center shadow-2xl animate-float">
                   <Briefcase size={36} className="text-white" />
                </div>
                <div>
                   <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Human Resources</h1>
                   <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#00ff9d] border border-white/5">
                         <ShieldCheck size={12} className="text-[#00ff9d]"/> Personnel Data Verified
                      </span>
                   </div>
                </div>
             </div>

             <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
                {['dashboard', 'people', 'payroll'].map(tab => (
                   <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-white/50'}`}>
                      {tab}
                   </button>
                ))}
             </div>
          </div>
       </div>

       {activeTab === 'people' && (
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
             <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                   <tr><th className="p-6">Employee</th><th className="p-6">Role</th><th className="p-6">Status</th><th className="p-6 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {employees.map(emp => (
                      <tr key={emp.id} className="hover:bg-indigo-50/20 transition-all">
                         <td className="p-6 font-black text-slate-800 uppercase">{emp.firstName} {emp.lastName}</td>
                         <td className="p-6 font-bold text-slate-500 uppercase text-xs">{emp.role}</td>
                         <td className="p-6"><span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-[9px] font-black uppercase border border-green-100">{emp.status}</span></td>
                         <td className="p-6 text-right"><ChevronRight className="text-slate-300 ml-auto"/></td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       )}
    </div>
  );
};
