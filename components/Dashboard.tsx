
import React, { useState } from 'react';
// Explicitly importing useNavigate from react-router-dom
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, Cell } from 'recharts';
import { db } from '../services/mockDb';
import { Role, EmployeeStatus } from '../types';
import { 
  TrendingUp, AlertCircle, Smile, Plus, Bot, BrainCircuit, Sparkles, Activity, Search, ChevronRight, Building2, User, FileText,
  Clock, CheckSquare, Users, Briefcase, Calendar, PieChart, ArrowUpRight
} from 'lucide-react';

const Card: React.FC<{ title: string; value: string; sub?: string; icon: any; gradient: string }> = ({ title, value, sub, icon: Icon, gradient }) => (
  <div className="bg-white p-7 rounded-[2.5rem] shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1.5 transition-all group overflow-hidden relative">
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-[0.05] rounded-full -mr-16 -mt-16 group-hover:opacity-10 transition-opacity`}></div>
    <div className="flex justify-between items-start mb-8">
      <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-500`}>
        <Icon size={24} />
      </div>
      {sub && (
        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${sub.includes('+') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : sub.includes('-') ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
          {sub.includes('+') && <ArrowUpRight size={12}/>}
          {sub}
        </div>
      )}
    </div>
    <div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1 group-hover:text-indigo-600 transition-colors">{title}</p>
      <h3 className="text-4xl font-black text-slate-900 tracking-tighter group-hover:scale-[1.02] origin-left transition-transform">{value}</h3>
    </div>
  </div>
);

const ExecutiveBriefing = ({ hasFinanceAccess }: { hasFinanceAccess: boolean }) => {
  const financial = db.getFinancialSummary();
  const tasks = db.tasks.filter(t => t.status !== 'Completed').length;
  const currentUser = db.currentUser;

  return (
    <div className="bg-slate-950 rounded-[3rem] p-10 md:p-14 text-white relative overflow-hidden mb-12 shadow-2xl shadow-indigo-950/40 border border-white/10 group">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-indigo-600/40 via-purple-600/30 to-transparent rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none opacity-50 group-hover:opacity-70 transition-opacity duration-1000"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-pink-600/20 to-transparent rounded-full blur-[100px] -ml-40 -mb-40 pointer-events-none opacity-30"></div>
      
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
        <div className="max-w-2xl">
          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 btn-vibrant rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/50 animate-float">
              <BrainCircuit size={36} className="text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-black tracking-tighter leading-none mb-3">Intelligence Hub</h2>
              <div className="flex items-center gap-2">
                 <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                 <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.3em]">Operational Live Feed: {currentUser?.name}</p>
              </div>
            </div>
          </div>
          <p className="text-slate-300 text-xl md:text-2xl leading-relaxed font-medium tracking-tight">
            {hasFinanceAccess 
              ? `Strategic focus: Revenue is tracking 12% above targets. Maintain agility; current cash liquidity is ₦${(financial.cash / 1000000).toFixed(1)}M.`
              : `Focus alert: You have ${tasks} active tasks. Highest throughput achieved during morning shifts. Keep up the momentum.`
            }
          </p>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col gap-5">
           <button className="bg-white text-slate-950 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(255,255,255,0.15)] hover:scale-105 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3">
              <Bot size={20} className="text-indigo-600"/> Ask AI Copilot
           </button>
           <button className="bg-indigo-600/20 border border-white/10 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600/30 active:scale-95 transition-all flex items-center justify-center">
              Detailed Analytics
           </button>
        </div>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const currentUser = db.currentUser;
  const financial = db.getFinancialSummary();
  const nps = db.getNPS();
  const tasksCount = db.tasks.filter(t => t.status !== 'Completed').length;
  const employeeCount = db.employees.length;
  
  const hasFinanceAccess = [Role.ADMIN, Role.MANAGER, Role.FINANCE].includes(currentUser?.role as Role);
  const hasPartialSalesAccess = currentUser?.role === Role.SALES;
  const isHR = [Role.HR, Role.HR_MANAGER].includes(currentUser?.role as Role);

  const data = [
    { name: 'Mon', revenue: 400000, nps: 40, tasks: 12 },
    { name: 'Tue', revenue: 300000, nps: 45, tasks: 15 },
    { name: 'Wed', revenue: 200000, nps: 30, tasks: 10 },
    { name: 'Thu', revenue: 278000, nps: 60, tasks: 8 },
    { name: 'Fri', revenue: 189000, nps: 75, tasks: 20 },
    { name: 'Sat', revenue: 239000, nps: 70, tasks: 5 },
    { name: 'Sun', revenue: 349000, nps: 80, tasks: 2 },
  ];

  return (
    <div className="space-y-10 animate-in fade-in pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-5xl font-black text-slate-950 tracking-tighter mb-3 leading-none">Welcome.</h1>
          <p className="text-slate-500 font-bold flex items-center gap-2">
             <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
             Your centralized <span className="text-indigo-600 uppercase tracking-widest text-[10px] bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{currentUser?.role}</span> operations hub.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white/50 backdrop-blur-md px-6 py-3 rounded-3xl shadow-sm border border-white/80">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">Sync: 0ms delay</span>
          </div>
          <span className="w-px h-5 bg-slate-200"></span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      <ExecutiveBriefing hasFinanceAccess={hasFinanceAccess} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {hasFinanceAccess || hasPartialSalesAccess ? (
          <Card title="Revenue Flow" value={`₦${(financial.revenue / 1000000).toFixed(1)}M`} sub="+12.5% vs LW" icon={TrendingUp} gradient="from-indigo-600 to-indigo-800" />
        ) : (
          <Card title="Pending Tasks" value={tasksCount.toString()} sub="Action Required" icon={CheckSquare} gradient="from-indigo-600 to-indigo-800" />
        )}

        {hasFinanceAccess ? (
          <Card title="Cash Liquidity" value={`₦${(financial.cash / 1000000).toFixed(1)}M`} sub="Live Balance" icon={Activity} gradient="from-emerald-500 to-teal-700" />
        ) : isHR ? (
          <Card title="Headcount" value={employeeCount.toString()} sub="Active Staff" icon={Users} gradient="from-emerald-500 to-teal-700" />
        ) : (
          <Card title="Events Active" value={db.cateringEvents.filter(e => e.status === 'Confirmed').length.toString()} sub="In Pipeline" icon={Calendar} gradient="from-emerald-500 to-teal-700" />
        )}

        <Card title="Sentiment Index" value={nps.toString()} sub="+5 pts Up" icon={Smile} gradient="from-fuchsia-600 to-pink-700" />
        
        <Card title="System Node" value="99.9%" sub="Latency Stable" icon={Activity} gradient="from-orange-500 to-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-10">
        <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] shadow-[0_10px_50px_rgba(0,0,0,0.02)] border border-white/60 flex flex-col group hover:border-indigo-200 transition-all duration-500">
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform"><TrendingUp size={24}/></div>
                 <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase tracking-[0.1em]">
                    {hasFinanceAccess ? 'Capital Dynamics' : 'Velocity Curve'}
                 </h3>
              </div>
              <button className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-white hover:shadow-md transition-all active:scale-95">7 Day Interval</button>
            </div>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 800}} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 800}} />
                  <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: 900, background: '#fff', padding: '15px'}} />
                  <Area type="monotone" dataKey={hasFinanceAccess ? "revenue" : "tasks"} stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#colorMain)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] shadow-[0_10px_50px_rgba(0,0,0,0.02)] border border-white/60 flex flex-col group hover:border-pink-200 transition-all duration-500">
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-600 group-hover:scale-110 transition-transform"><Smile size={24}/></div>
                 <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase tracking-[0.1em]">Experience Pulse</h3>
              </div>
              <div className="flex gap-2">
                 <div className="w-3 h-3 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/40"></div>
                 <div className="w-3 h-3 bg-pink-500 rounded-full shadow-lg shadow-pink-500/40"></div>
              </div>
            </div>
            <div className="h-[320px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} barGap={12}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 800}} dy={15} />
                  <Tooltip cursor={{fill: 'rgba(241, 245, 249, 0.5)'}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: 900, background: '#fff', padding: '15px'}} />
                  <Bar dataKey="nps" fill="url(#pinkGradient)" radius={[12, 12, 0, 0]} barSize={40}>
                     <Cell fill="url(#pinkGradient)" />
                  </Bar>
                  <defs>
                    <linearGradient id="pinkGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#db2777" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};
