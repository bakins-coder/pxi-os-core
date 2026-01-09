import React, { useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Package,
    AlertCircle, Activity, ArrowUpRight, ArrowDownRight, Calendar, ShieldAlert, Clock, Filter
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface KPICardProps {
    title: string;
    value: string;
    change: string;
    trend: 'up' | 'down';
    icon: React.ElementType;
    color: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, trend, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl bg-opacity-10`} style={{ backgroundColor: color }}>
                <Icon size={24} style={{ color }} />
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {change}
            </div>
        </div>
        <h3 className="text-2xl font-black text-slate-900">{value}</h3>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">{title}</p>
    </div>
);

export const AnalyticsDashboard: React.FC = () => {
    const { invoices, contacts, employees, inventory, bookkeeping, cateringEvents, agenticLogs } = useDataStore();
    const [dateRange, setDateRange] = React.useState<'7d' | '30d' | '90d' | 'year'>('30d');

    const analytics = useMemo(() => {
        const startDate = new Date();
        if (dateRange === '7d') startDate.setDate(startDate.getDate() - 7);
        else if (dateRange === '30d') startDate.setDate(startDate.getDate() - 30);
        else if (dateRange === '90d') startDate.setDate(startDate.getDate() - 90);
        else startDate.setFullYear(startDate.getFullYear(), 0, 1);

        const filteredInvoices = invoices.filter(i => new Date(i.date) >= startDate);
        const filteredExpenses = bookkeeping.filter(e => e.type === 'Outflow' && new Date(e.date) >= startDate);
        const filteredEvents = cateringEvents.filter(e => new Date(e.eventDate) >= startDate);

        // Revenue calculations
        const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.totalCents, 0) / 100;
        const paidRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.paidAmountCents, 0) / 100;
        const outstandingAR = totalRevenue - paidRevenue;

        // Expense calculations
        const totalExpenses = filteredExpenses.reduce((sum, entry) => sum + entry.amountCents, 0) / 100;

        // Monthly revenue trend (Fixed 6 months for trend context)
        const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - (5 - i));
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            const revenue = invoices
                .filter(inv => inv.date.startsWith(monthKey))
                .reduce((sum, inv) => sum + inv.totalCents, 0) / 100;

            return {
                month: date.toLocaleString('default', { month: 'short' }),
                revenue,
                expenses: bookkeeping
                    .filter(e => e.type === 'Outflow' && e.date.startsWith(monthKey))
                    .reduce((sum, e) => sum + e.amountCents, 0) / 100
            };
        });

        // Customer distribution by type (All time for context)
        const customerTypes = contacts.reduce((acc, contact) => {
            acc[contact.type] = (acc[contact.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const customerDistribution = Object.entries(customerTypes).map(([name, value]) => ({
            name,
            value
        }));

        // Top customers by revenue (Filtered by date)
        const customerRevenue = contacts.map(contact => {
            const revenue = filteredInvoices
                .filter(inv => inv.contactId === contact.id)
                .reduce((sum, inv) => sum + inv.totalCents, 0) / 100;
            return { name: contact.name, revenue };
        }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

        // Event status distribution (Filtered by date)
        const eventStatus = filteredEvents.reduce((acc, event) => {
            acc[event.status] = (acc[event.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const eventDistribution = Object.entries(eventStatus).map(([name, value]) => ({
            name,
            value
        }));

        return {
            totalRevenue,
            paidRevenue,
            outstandingAR,
            totalExpenses,
            netProfit: paidRevenue - totalExpenses,
            monthlyRevenue,
            customerDistribution,
            customerRevenue,
            eventDistribution,
            averageSentiment: contacts.reduce((sum, c) => sum + c.sentimentScore, 0) / contacts.length || 0,
        };
    }, [invoices, contacts, bookkeeping, cateringEvents, dateRange]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-slate-950 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-indigo-500/20 rounded-2xl">
                            <Activity size={32} className="text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tight">Business Intelligence</h1>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
                                Real-time Analytics & Insights
                            </p>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-8 right-8 flex gap-2">
                    {(['7d', '30d', '90d', 'year'] as const).map(range => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dateRange === range
                                ? 'bg-indigo-500 text-white shadow-lg scale-105'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            {range === 'year' ? 'This Year' : `Last ${range.replace('d', ' Days')}`}
                        </button>
                    ))}
                </div>
            </div>



            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Total Revenue"
                    value={`₦${analytics.totalRevenue.toLocaleString()}`}
                    change="+12.5%"
                    trend="up"
                    icon={DollarSign}
                    color="#6366f1"
                />
                <KPICard
                    title="Net Profit"
                    value={`₦${analytics.netProfit.toLocaleString()}`}
                    change="+8.3%"
                    trend="up"
                    icon={TrendingUp}
                    color="#10b981"
                />
                <KPICard
                    title="Outstanding AR"
                    value={`₦${analytics.outstandingAR.toLocaleString()}`}
                    change="-5.2%"
                    trend="down"
                    icon={AlertCircle}
                    color="#f59e0b"
                />
                <KPICard
                    title="Active Customers"
                    value={contacts.length.toString()}
                    change="+15.0%"
                    trend="up"
                    icon={Users}
                    color="#8b5cf6"
                />
            </div>

            {/* Revenue & Expenses Trend */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">
                    Revenue vs Expenses (6 Months)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.monthlyRevenue}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={12} fontWeight="bold" />
                        <YAxis stroke="#64748b" fontSize={12} fontWeight="bold" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1e293b',
                                border: 'none',
                                borderRadius: '12px',
                                color: '#fff',
                                fontWeight: 'bold'
                            }}
                        />
                        <Legend wrapperStyle={{ fontWeight: 'bold', fontSize: '12px' }} />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#6366f1"
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            strokeWidth={2}
                            name="Revenue (₦)"
                        />
                        <Area
                            type="monotone"
                            dataKey="expenses"
                            stroke="#ef4444"
                            fillOpacity={1}
                            fill="url(#colorExpenses)"
                            strokeWidth={2}
                            name="Expenses (₦)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Top Customers & Event Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Customers by Revenue */}
                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">
                        Top Customers
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.customerRevenue} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" stroke="#64748b" fontSize={12} fontWeight="bold" />
                            <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} fontWeight="bold" width={100} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    fontWeight: 'bold'
                                }}
                            />
                            <Bar dataKey="revenue" fill="#6366f1" radius={[0, 8, 8, 0]} name="Revenue (₦)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Event Status Distribution */}
                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">
                        Event Pipeline
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={analytics.eventDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                            >
                                {analytics.eventDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    fontWeight: 'bold'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Insights Summary */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-2xl border border-indigo-100">
                <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tight flex items-center gap-2">
                    <Activity size={24} className="text-indigo-600" />
                    AI-Powered Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-indigo-100">
                        <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">Cash Flow Health</p>
                        <p className="text-2xl font-black text-slate-900">
                            {analytics.netProfit > 0 ? 'Strong' : 'Needs Attention'}
                        </p>
                        <p className="text-xs text-slate-600 mt-2">
                            {analytics.netProfit > 0 ? 'Positive cash flow trend' : 'Consider expense review'}
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-indigo-100">
                        <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">Customer Sentiment</p>
                        <p className="text-2xl font-black text-slate-900">
                            {(analytics.averageSentiment * 100).toFixed(0)}%
                        </p>
                        <p className="text-xs text-slate-600 mt-2">Average satisfaction score</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-indigo-100">
                        <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">Collection Rate</p>
                        <p className="text-2xl font-black text-slate-900">
                            {((analytics.paidRevenue / analytics.totalRevenue) * 100).toFixed(0)}%
                        </p>
                        <p className="text-xs text-slate-600 mt-2">Revenue collected</p>
                    </div>
                </div>
            </div>
            {/* AI Agent Audit Logs */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-500/10 rounded-2xl">
                            <ShieldAlert size={24} className="text-rose-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">AI Agent Audit Log</h3>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
                                Autonomous Decisions & Alerts
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <Activity size={14} className="animate-pulse text-emerald-500" />
                        Live Feed
                    </div>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    {agenticLogs.length > 0 ? (
                        <div className="divide-y divide-slate-50">
                            {agenticLogs.slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20).map(log => (
                                <div key={log.id} className="p-6 hover:bg-slate-50/50 transition-colors flex gap-6 items-start group">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 w-24 pt-1 flex flex-col gap-1">
                                        <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(log.timestamp).toLocaleDateString()}</span>
                                        <span className="flex items-center gap-1"><Clock size={10} /> {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${log.sentiment === 'Negative' ? 'bg-rose-100 text-rose-600' :
                                                log.sentiment === 'Positive' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {log.sentiment}
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{log.agentName}</span>
                                            <span className="text-slate-300 text-[10px] •">•</span>
                                            <span className="text-[10px] font-bold uppercase text-slate-500">{log.action}</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-700 leading-relaxed group-hover:text-slate-900 transition-colors">
                                            {log.details}
                                        </p>
                                    </div>
                                    <div className="w-12 text-right">
                                        <div className="inline-flex flex-col items-center">
                                            <span className="text-[9px] font-black text-slate-300">CONF</span>
                                            <span className="text-xs font-bold text-emerald-500">{(log.confidence * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <ShieldAlert size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">No Activity Logs</h3>
                            <p className="text-slate-400 text-sm mt-1">AI agent actions will appear here properly.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
