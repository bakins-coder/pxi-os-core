import React, { useState, useMemo } from 'react';
import { db } from '../services/mockDb';
import { Role } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area, CartesianGrid, PieChart as RePieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { 
  TrendingUp, Users, Clock, ThumbsUp, AlertCircle, Phone, 
  MessageSquare, PenTool, Filter, Download, Save, Table as TableIcon,
  BarChart2, PieChart as PieIcon, Activity, X, ChevronRight
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
  const financial = db.getFinancialSummary();
  const performance = db.getAgentPerformance();
  const [selectedAgentMetric, setSelectedAgentMetric] = useState<string | null>(null);

  const weeklyData = [
    { name: 'Mon', calls: 120, msgs: 340, csat: 4.2 },
    { name: 'Tue', calls: 132, msgs: 320, csat: 4.5 },
    { name: 'Wed', calls: 101, msgs: 450, csat: 3.8 },
    { name: 'Thu', calls: 134, msgs: 390, csat: 4.8 },
    { name: 'Fri', calls: 90, msgs: 210, csat: 4.9 },
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
            <Card title="Calls Handled" value="42" sub="+12% vs yesterday" icon={Phone} color="text-blue-600 bg-blue-600" onClick={() => setSelectedAgentMetric('Calls')}/>
            <Card title="Messages Resolved" value="108" sub="+5% vs yesterday" icon={MessageSquare} color="text-purple-600 bg-purple-600" onClick={() => setSelectedAgentMetric('Messages')}/>
            <Card title="Avg Handle Time" value="3m 42s" sub="-10s improvement" icon={Clock} color="text-orange-600 bg-orange-600" onClick={() => setSelectedAgentMetric('Handle Time')}/>
            <Card title="My CSAT" value="4.8/5.0" sub="Top 10%" icon={ThumbsUp} color="text-green-600 bg-green-600" onClick={() => setSelectedAgentMetric('CSAT')}/>
        </div>

        {selectedAgentMetric && (
           <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 animate-in slide-in-from-top-4 relative">
              <button onClick={() => setSelectedAgentMetric(null)} className="absolute top-4 right-4 p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X size={20}/></button>
              <h3 className="font-bold text-slate-800 mb-4 text-lg">{selectedAgentMetric} Details</h3>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                 <div className="p-8 text-center text-slate-400 italic font-medium">Detailed metrics for {selectedAgentMetric} filtered from cloud logs...</div>
              </div>
           </div>
        )}

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <h3 className="font-bold text-slate-800 mb-6 uppercase text-xs tracking-widest">Activity Trend</h3>
           <div className="h-64 w-full">
             <ResponsiveContainer>
               <BarChart data={weeklyData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis dataKey="name" />
                 <Tooltip />
                 <Bar dataKey="calls" fill="#6366f1" radius={[4, 4, 0, 0]} name="Calls" />
                 <Bar dataKey="msgs" fill="#c084fc" radius={[4, 4, 0, 0]} name="Messages" />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
    </div>
  );

  const renderSupervisorView = () => (
    <div className="space-y-6 animate-in fade-in">
       <h2 className="text-xl font-bold text-slate-800">Team Performance</h2>
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <Card title="Active Agents" value={performance.filter(p => p.status !== 'Offline').length.toString()} sub={`${performance.filter(p => p.status === 'Busy').length} Busy`} icon={Users} color="text-indigo-600 bg-indigo-600" />
           <Card title="Queue Volume" value="14" sub="2 Critical Wait Times" icon={Users} color="text-red-600 bg-red-600" />
           <Card title="Team CSAT" value="4.5" sub="+0.2 this week" icon={ThumbsUp} color="text-green-600 bg-green-600" />
           <Card title="SLA Breach" value="2%" sub="Target < 5%" icon={AlertCircle} color="text-orange-600 bg-orange-600" />
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
             <BarChart2 size={48} className="opacity-10 mb-4"/>
             <p className="font-bold uppercase tracking-widest">Team Leaderboard Feed Locked</p>
          </div>
       </div>
    </div>
  );

  const renderFinanceView = () => (
     <div className="space-y-6 animate-in fade-in">
        <h2 className="text-xl font-bold text-slate-800">Financial Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card title="Total Revenue" value={`₦${(financial.revenue / 1000000).toFixed(1)}M`} sub="+12.5% vs last month" icon={TrendingUp} color="text-indigo-600 bg-indigo-600" />
           <Card title="Cash on Hand" value={`₦${(financial.cash / 1000000).toFixed(1)}M`} sub="Runway: 12 months" icon={TrendingUp} color="text-emerald-600 bg-emerald-600" />
           <Card title="Outstanding AR" value={`₦${(financial.receivables / 1000000).toFixed(1)}M`} sub="DSO: 45 days" icon={AlertCircle} color="text-purple-600 bg-purple-600" />
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6 uppercase text-xs tracking-widest">Revenue Analytics</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="calls" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
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
  const currentUser = db.currentUser;
  const [activeTab, setActiveTab] = useState<'standard' | 'builder'>('standard');

  const [config, setConfig] = useState({
    source: 'deals', 
    metric: 'count', 
    groupBy: 'stage', 
    chartType: 'bar', 
    title: 'Pipeline Distribution'
  });

  const reportData = useMemo(() => {
    let rawData: any[] = [];
    switch(config.source) {
      case 'deals': rawData = db.getDeals(); break;
      case 'invoices': rawData = db.invoices; break;
      case 'tickets': rawData = db.tickets; break;
      case 'logs': rawData = db.channelLogs; break;
      default: rawData = [];
    }

    const grouped: Record<string, number> = {};
    rawData.forEach((item: any) => {
      let key = 'Unknown';
      if (config.groupBy === 'stage') key = item.stage || 'Unknown';
      else if (config.groupBy === 'status') key = item.status || 'Unknown';
      else if (config.groupBy === 'priority') key = item.priority || 'Unknown';
      else if (config.groupBy === 'type') key = item.type || 'Unknown';
      else if (config.groupBy === 'agent') {
         const agentId = item.assigneeId || item.assignedTo || 'Unassigned';
         const agent = db.teamMembers.find(u => u.id === agentId);
         key = agent ? agent.name : 'Unassigned';
      } 
      else if (config.groupBy === 'month') {
        const dateStr = item.createdDate || item.date || item.timestamp || item.expectedCloseDate;
        if (dateStr) {
          const date = new Date(dateStr);
          key = date.toLocaleString('default', { month: 'short' });
        }
      }

      let value = 0;
      if (config.metric === 'count') value = 1;
      else if (config.metric === 'sum_value') value = item.value || item.total || 0;
      grouped[key] = (grouped[key] || 0) + value;
    });

    return Object.keys(grouped).map(key => ({
      name: key,
      value: grouped[key]
    })).sort((a, b) => config.groupBy === 'month' ? 0 : b.value - a.value); 
  }, [config]);

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
                         <Activity size={12} className="text-indigo-400"/> Intelligence Synced
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
                      {tab.id === 'builder' && <PenTool size={14}/>}
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
           <PenTool size={48} className="mx-auto mb-4 opacity-10"/>
           <p className="font-black uppercase tracking-widest">Custom Report Builder Ready</p>
        </div>
      )}
    </div>
  );
};