
import React, { useState, useMemo, useEffect } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import { Role } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TrendingUp, Users, Clock, ThumbsUp, AlertCircle, Phone,
  MessageSquare, PenTool, BarChart2, Activity, X
} from 'lucide-react';

const Card: React.FC<{ title: string; value: string; sub?: string; icon: any; color: string; onClick?: () => void }> = ({ title, value, sub, icon: Icon, color, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-all ${onClick ? 'cursor-pointer hover:ring-2 ring-indigo-500/20 group' : ''}`}
  >
    <div>
      <p className="text-slate-500 text-sm font-medium mb-1 group-hover:text-indigo-600 transition-colors">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      {sub && <p className={`text-xs mt-2 ${sub.includes('+') ? 'text-green-600' : sub.includes('-') ? 'text-red-500' : 'text-slate-400'}`}>{sub}</p>}
    </div>
    <div className={`p-3 rounded-xl ${color} bg-opacity-10 group-hover:bg-opacity-20 transition-all`}>
      <Icon className={color.replace('bg-', 'text-')} size={24} />
    </div>
  </div>
);

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const StandardDashboards = ({ currentUser }: { currentUser: any }) => {
  const { invoices, employees } = useDataStore();

  const data = useMemo(() => {
    // Financial Summary Logic
    const salesInvoices = invoices.filter(i => i.type === 'Sales');
    const rev = salesInvoices.reduce((s, i) => s + i.totalCents, 0);
    const cash = salesInvoices.reduce((s, i) => s + i.paidAmountCents, 0);

    return {
      financial: { revenue: rev, cash, receivables: rev - cash },
      performance: [], // Placeholder for agent performance
      teamMembersCount: employees.length
    };
  }, [invoices, employees]);

  const [selectedAgentMetric, setSelectedAgentMetric] = useState<string | null>(null);

  const weeklyData = [
    { name: 'Mon', calls: 10, msgs: 20, csat: 4.2 },
    { name: 'Tue', calls: 15, msgs: 25, csat: 4.5 },
    { name: 'Wed', calls: 8, msgs: 18, csat: 3.8 },
    { name: 'Thu', calls: 12, msgs: 30, csat: 4.8 },
    { name: 'Fri', calls: 20, msgs: 40, csat: 4.9 },
  ];

  const channelData = [
    { name: 'Voice', value: 35 },
    { name: 'Email', value: 25 },
    { name: 'WhatsApp', value: 30 },
    { name: 'SMS', value: 10 },
  ];

  const renderAgentView = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-end">
        <h2 className="text-xl font-bold text-slate-800">My Performance</h2>
        {!selectedAgentMetric && <p className="text-sm text-slate-500">Select a card for details</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Calls Handled" value="0" sub="No activity" icon={Phone} color="text-blue-600 bg-blue-600" onClick={() => setSelectedAgentMetric('Calls')} />
        <Card title="Messages Resolved" value="0" sub="No activity" icon={MessageSquare} color="text-purple-600 bg-purple-600" onClick={() => setSelectedAgentMetric('Messages')} />
        <Card title="Avg Handle Time" value="0s" sub="N/A" icon={Clock} color="text-orange-600 bg-orange-600" onClick={() => setSelectedAgentMetric('Handle Time')} />
        <Card title="My CSAT" value="0/5.0" sub="New profile" icon={ThumbsUp} color="text-green-600 bg-green-600" onClick={() => setSelectedAgentMetric('CSAT')} />
      </div>

      {selectedAgentMetric && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 animate-in slide-in-from-top-4 relative">
          <button onClick={() => setSelectedAgentMetric(null)} className="absolute top-4 right-4 p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X size={20} /></button>
          <h3 className="font-bold text-slate-800 mb-4 text-lg">{selectedAgentMetric} Details</h3>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 text-center text-slate-400 italic font-medium">No telemetry data found for your node instance yet.</div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSupervisorView = () => (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-xl font-bold text-slate-800">Team Performance</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Active Agents" value={data.teamMembersCount.toString()} sub="Instance Personnel" icon={Users} color="text-indigo-600 bg-indigo-600" />
        <Card title="Queue Volume" value="0" sub="Clean Pipe" icon={Users} color="text-red-600 bg-red-600" />
        <Card title="Team CSAT" value="5.0" sub="Perfect score" icon={ThumbsUp} color="text-green-600 bg-green-600" />
        <Card title="SLA Breach" value="0%" sub="Ideal latency" icon={AlertCircle} color="text-orange-600 bg-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6 uppercase text-xs tracking-widest">Channel Distribution</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <RePieChart>
                <Pie data={channelData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {channelData.map((_entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col items-center justify-center p-12 text-center text-slate-400">
          <BarChart2 size={48} className="opacity-10 mb-4" />
          <p className="font-bold uppercase tracking-widest">Real-time Telemetry Processing...</p>
        </div>
      </div>
    </div>
  );

  const renderFinanceView = () => (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-xl font-bold text-slate-800">Financial Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Total Revenue" value={`₦${(data.financial.revenue / 1000000).toFixed(1)}M`} sub="Current Ledger" icon={TrendingUp} color="text-indigo-600 bg-indigo-600" />
        <Card title="Cash on Hand" value={`₦${(data.financial.cash / 1000000).toFixed(1)}M`} sub="Liquidity Status" icon={TrendingUp} color="text-emerald-600 bg-emerald-600" />
        <Card title="Outstanding AR" value={`₦${(data.financial.receivables / 1000000).toFixed(1)}M`} sub="Receivables" icon={AlertCircle} color="text-purple-600 bg-purple-600" />
      </div>
    </div>
  );

  if (currentUser?.role === Role.AGENT) return renderAgentView();
  if (currentUser?.role === Role.SUPERVISOR) return renderSupervisorView();
  if (currentUser?.role === Role.FINANCE) return renderFinanceView();

  return (
    <div className="space-y-12">
      {renderSupervisorView()}
      {renderFinanceView()}
    </div>
  );
};

export const Reports = () => {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'standard' | 'builder'>('standard');

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl mb-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl animate-float">
              <BarChart2 size={36} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Reports Hub</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-300 border border-white/5">
                  <Activity size={12} className="text-indigo-400" /> Intelligence Synced
                </span>
              </div>
            </div>
          </div>

          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md overflow-x-auto max-w-full">
            {[
              { id: 'standard', label: 'Dashboard' },
              { id: 'builder', label: 'Builder' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
              >
                {tab.id === 'builder' && <PenTool size={14} />}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'standard' ? (
        <StandardDashboards currentUser={currentUser} />
      ) : (
        <div className="p-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-300">
          <PenTool size={48} className="mx-auto mb-4 opacity-10" />
          <p className="font-black uppercase tracking-widest">Custom Report Builder Ready</p>
        </div>
      )}
    </div>
  );
};