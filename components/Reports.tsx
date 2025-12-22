import React, { useState, useMemo } from 'react';
import { db } from '../services/mockDb';
import { Role } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area, CartesianGrid, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { 
  TrendingUp, Users, Clock, ThumbsUp, AlertCircle, Phone, 
  MessageSquare, Layout, PenTool, Filter, Download, Save, Table as TableIcon,
  BarChart2, PieChart as PieIcon, Activity, X, ChevronRight, PieChart as PieChartIcon
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
         const agentId = item.assigneeId || item.assignedTo || (item.activityLogs?.[0]?.description.includes('AI') ? 'AI Agent' : 'Unassigned');
         const agent = db.teamMembers.find(u => u.id === agentId);
         key = agent ? agent.name : (agentId === 'AI Agent' ? 'AI Agent' : 'Unassigned');
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
      else if (config.metric === 'avg_score') value = item.sentimentScore || 0;

      grouped[key] = (grouped[key] || 0) + value;
    });

    return Object.keys(grouped).map(key => ({
      name: key,
      value: config.metric === 'avg_score' ? parseFloat((grouped[key] / rawData.filter((i:any) => i.stage === key || i.status === key).length).toFixed(2)) : grouped[key] 
    })).sort((a, b) => config.groupBy === 'month' ? 0 : b.value - a.value); 
  }, [config]);

  const renderChart = () => {
    if (config.chartType === 'table') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-3">Group ({config.groupBy})</th>
                <th className="p-3 text-right">Metric ({config.metric})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-700">{row.name}</td>
                  <td className="p-3 text-right text-slate-600">
                    {config.metric === 'sum_value' ? '₦' : ''}{row.value.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    const CommonAxis = () => (
      <>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
        <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
        <Legend />
      </>
    );

    return (
      <ResponsiveContainer width="100%" height="100%">
        {config.chartType === 'bar' ? (
          <BarChart data={reportData}>
            <CommonAxis />
            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} name={config.metric.replace('_', ' ')} />
          </BarChart>
        ) : config.chartType === 'area' ? (
          <AreaChart data={reportData}>
            <defs>
              <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CommonAxis />
            <Area type="monotone" dataKey="value" stroke="#6366f1" fillOpacity={1} fill="url(#colorVal)" />
          </AreaChart>
        ) : config.chartType === 'line' ? (
          <LineChart data={reportData}>
            <CommonAxis />
            <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} dot={{r:4}} />
          </LineChart>
        ) : (
          <PieChart>
             <Pie data={reportData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={2} dataKey="value">
               {reportData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
             </Pie>
             <Tooltip />
             <Legend />
          </PieChart>
        )}
      </ResponsiveContainer>
    );
  };

  const renderReportBuilder = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-right">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <PenTool className="text-indigo-600" size={20}/>
          <h2 className="font-bold text-slate-800 text-lg">Report Configuration</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">1. Data Source</label>
          <select 
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={config.source}
            onChange={(e) => setConfig({...config, source: e.target.value})}
          >
            <option value="deals">Deals & Pipeline</option>
            <option value="invoices">Finance & Invoices</option>
            <option value="tickets">Support Tickets</option>
            <option value="logs">Communication Logs</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">2. Metric (Y-Axis)</label>
          <select 
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={config.metric}
            onChange={(e) => setConfig({...config, metric: e.target.value})}
          >
            <option value="count">Count (Volume)</option>
            {(config.source === 'deals' || config.source === 'invoices') && (
              <option value="sum_value">Sum of Value/Amount</option>
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">3. Group By (X-Axis)</label>
          <select 
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={config.groupBy}
            onChange={(e) => setConfig({...config, groupBy: e.target.value})}
          >
            <option value="month">Time (Month)</option>
            {config.source === 'deals' && <option value="stage">Deal Stage</option>}
            {(config.source === 'invoices' || config.source === 'tickets') && <option value="status">Status</option>}
            {config.source === 'tickets' && <option value="priority">Priority</option>}
            {config.source === 'logs' && <option value="type">Channel Type</option>}
            <option value="agent">Agent / Assignee</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">4. Visualization</label>
          <div className="grid grid-cols-5 gap-2">
            {[
              { id: 'bar', icon: BarChart2 },
              { id: 'area', icon: Activity },
              { id: 'line', icon: TrendingUp },
              { id: 'pie', icon: PieIcon },
              { id: 'table', icon: TableIcon }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setConfig({...config, chartType: type.id})}
                className={`p-3 rounded-lg flex items-center justify-center transition-colors border ${
                  config.chartType === type.id 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
                title={type.id}
              >
                <type.icon size={20} />
              </button>
            ))}
          </div>
        </div>
        
        <div className="pt-6 border-t border-slate-100 flex gap-3">
           <button className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-bold text-sm shadow-sm hover:bg-indigo-700 flex items-center justify-center gap-2">
             <Save size={16}/> Save Report
           </button>
           <button className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-50">
             <Download size={16}/>
           </button>
        </div>
      </div>

      <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
        <div className="flex justify-between items-center mb-6">
           <div>
             <h2 className="font-bold text-slate-800 text-lg">Preview</h2>
             <p className="text-sm text-slate-400">
               {config.metric === 'count' ? 'Count' : 'Sum'} of {config.source} by {config.groupBy}
             </p>
           </div>
           <div className="flex gap-2">
              <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-mono">Live Data</span>
           </div>
        </div>
        <div className="flex-1 min-h-[400px] w-full">
           {reportData.length > 0 ? renderChart() : (
             <div className="h-full flex items-center justify-center text-slate-400 italic">No data matches this configuration</div>
           )}
        </div>
      </div>
    </div>
  );


  const StandardDashboards = () => {
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
              <Card 
                title="Calls Handled" 
                value="42" 
                sub="+12% vs yesterday" 
                icon={Phone} 
                color="text-blue-600 bg-blue-600" 
                onClick={() => setSelectedAgentMetric('Calls')}
              />
              <Card 
                title="Messages Resolved" 
                value="108" 
                sub="+5% vs yesterday" 
                icon={MessageSquare} 
                color="text-purple-600 bg-purple-600" 
                onClick={() => setSelectedAgentMetric('Messages')}
              />
              <Card 
                title="Avg Handle Time" 
                value="3m 42s" 
                sub="-10s improvement" 
                icon={Clock} 
                color="text-orange-600 bg-orange-600" 
                onClick={() => setSelectedAgentMetric('Handle Time')}
              />
              <Card 
                title="My CSAT" 
                value="4.8/5.0" 
                sub="Top 10%" 
                icon={ThumbsUp} 
                color="text-green-600 bg-green-600" 
                onClick={() => setSelectedAgentMetric('CSAT')}
              />
          </div>

          {selectedAgentMetric && (
             <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 animate-in slide-in-from-top-4 relative">
                <button 
                   onClick={() => setSelectedAgentMetric(null)} 
                   className="absolute top-4 right-4 p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                >
                   <X size={20}/>
                </button>
                <h3 className="font-bold text-slate-800 mb-4 text-lg">{selectedAgentMetric} Details</h3>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                   {selectedAgentMetric === 'Calls' && (
                      <table className="w-full text-left text-sm">
                         <thead className="bg-slate-100">
                            <tr>
                               <th className="px-4 py-3 font-semibold text-slate-600">Time</th>
                               <th className="px-4 py-3 font-semibold text-slate-600">Duration</th>
                               <th className="px-4 py-3 font-semibold text-slate-600">Customer</th>
                               <th className="px-4 py-3 font-semibold text-slate-600">Sentiment</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                            {[1,2,3].map(i => (
                               <tr key={i}>
                                  <td className="px-4 py-3 text-slate-600">10:3{i} AM</td>
                                  <td className="px-4 py-3 font-mono text-slate-600">03:12</td>
                                  <td className="px-4 py-3 font-medium">Unknown Caller</td>
                                  <td className="px-4 py-3"><span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Positive</span></td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   )}
                   {selectedAgentMetric === 'Messages' && (
                      <div className="p-4 text-slate-500 text-center italic">
                         Showing last 10 messages from Chat, WhatsApp and Email.
                         <div className="mt-4 space-y-2 text-left">
                            <div className="p-3 bg-slate-50 rounded border border-slate-100 flex justify-between">
                               <span>Order Inquiry - ticket #123</span>
                               <span className="text-green-600 text-xs font-bold">Resolved</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded border border-slate-100 flex justify-between">
                               <span>Return Request - ticket #129</span>
                               <span className="text-blue-600 text-xs font-bold">In Progress</span>
                            </div>
                         </div>
                      </div>
                   )}
                   {selectedAgentMetric === 'CSAT' && (
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                               <div className="text-yellow-500 flex"><ThumbsUp size={16} fill="currentColor"/></div>
                               <span className="font-bold text-green-800">5.0</span>
                            </div>
                            <p className="text-sm text-green-900">"Agent was extremely helpful and patient!"</p>
                         </div>
                         <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                               <div className="text-yellow-500 flex"><ThumbsUp size={16} fill="currentColor"/></div>
                               <span className="font-bold text-green-800">4.5</span>
                            </div>
                            <p className="text-sm text-green-900">"Quick resolution, thanks."</p>
                         </div>
                      </div>
                   )}
                   {selectedAgentMetric === 'Handle Time' && (
                      <div className="h-48 flex items-center justify-center p-4">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[{name: 'Voice', val: 240}, {name: 'Chat', val: 180}, {name: 'Email', val: 400}]}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                               <XAxis dataKey="name"/>
                               <Tooltip />
                               <Bar dataKey="val" fill="#f97316" radius={[4,4,0,0]} name="Seconds"/>
                            </BarChart>
                         </ResponsiveContainer>
                      </div>
                   )}
                </div>
             </div>
          )}

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <h3 className="font-bold text-slate-800 mb-6">Activity Trend</h3>
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
               <h3 className="font-bold text-slate-800 mb-6">Channel Distribution</h3>
               <div className="h-64 w-full">
                 <ResponsiveContainer>
                   <PieChart>
                      <Pie data={channelData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {channelData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
               <div className="p-6 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800">Agent Leaderboard</h3>
               </div>
               <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50">
                     <tr>
                        <th className="px-6 py-3 font-medium text-slate-500">Agent</th>
                        <th className="px-6 py-3 font-medium text-slate-500">Status</th>
                        <th className="px-6 py-3 font-medium text-slate-500">Calls</th>
                        <th className="px-6 py-3 font-medium text-slate-500">CSAT</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {performance.map(p => {
                        const agent = db.teamMembers.find(u => u.id === p.agentId);
                        return (
                           <tr key={p.id} className="hover:bg-slate-50">
                              <td className="px-6 py-3 flex items-center gap-2">
                                 <img src={agent?.avatar} className="w-6 h-6 rounded-full"/>
                                 <span>{agent?.name}</span>
                              </td>
                              <td className="px-6 py-3">
                                 <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    p.status === 'Available' ? 'bg-green-100 text-green-700' :
                                    p.status === 'Busy' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                 }`}>{p.status}</span>
                              </td>
                              <td className="px-6 py-3">{p.callsHandled}</td>
                              <td className="px-6 py-3 font-bold text-slate-700">{p.csatScore.toFixed(1)}</td>
                           </tr>
                        )
                     })}
                  </tbody>
               </table>
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
            <h3 className="font-bold text-slate-800 mb-6">Revenue vs Expenses</h3>
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

    if (currentUser.role === Role.AGENT) return renderAgentView();
    if (currentUser.role === Role.SUPERVISOR) return renderSupervisorView();
    if (currentUser.role === Role.FINANCE) return renderFinanceView();
    
    return (
       <div className="space-y-12">
          {renderSupervisorView()}
          {renderFinanceView()}
       </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* HERO SECTION - NEXUS STYLE */}
       <div className="bg-slate-950 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl mb-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl animate-float">
                   <BarChart2 size={36} />
                </div>
                <div>
                   <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Reports & Analytics</h1>
                   <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-300 border border-white/5">
                         <Activity size={12} className="text-indigo-400"/> Business Intelligence Synced
                      </span>
                   </div>
                </div>
             </div>

             <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md overflow-x-auto max-w-full">
                {[
                  { id: 'standard', label: 'Standard Dashboards' },
                  { id: 'builder', label: 'Custom Builder' }
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

      {activeTab === 'standard' ? <StandardDashboards /> : renderReportBuilder()}
    </div>
  );
};