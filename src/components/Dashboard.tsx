import React, { useEffect, useMemo, useState } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import {
  TrendingUp,
  Activity,
  Receipt,
  Calendar,
  AlertCircle,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  Plane,
  BrainCircuit
} from 'lucide-react';
import { Role } from '../types';
import { EventCalendar } from './EventCalendar';
import { EventDetailCard } from './EventDetailCard';

const SummaryList = ({ title, items, type, onEventClick }: { title: string; items: any[]; type: string; onEventClick?: (item: any) => void }) => {
  return (
    <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col h-full border-b-[6px] border-b-slate-100">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">{title}</h4>
        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{items.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar max-h-[400px]">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-slate-300">
            <Activity size={32} className="mb-2 opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-tighter">System Idle</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={idx}
                onClick={() => type === 'event' && onEventClick?.(item)}
                className={`flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all cursor-pointer group`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${type === 'receivable' ? 'bg-emerald-50 text-emerald-600' :
                    type === 'payable' ? 'bg-rose-50 text-rose-600' :
                      type === 'complaint' ? 'bg-amber-50 text-amber-600' :
                        type === 'employee' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'
                    }`}>
                    {type === 'receivable' ? <ArrowUpRight size={14} /> :
                      type === 'payable' ? <ArrowDownRight size={14} /> :
                        type === 'complaint' ? <AlertCircle size={14} /> :
                          type === 'employee' ? <UserCheck size={14} /> : <ChevronRight size={14} />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-800 leading-none mb-1 truncate max-w-[120px]">
                      {item.firstName ? `${item.firstName} ${item.lastName}` : (item.title || item.name || item.customerName || 'Standard Entry')}
                    </p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase">{item.date || item.eventDate || item.email || item.role || 'Pending cycle'}</p>
                  </div>
                </div>
                {(item.totalCents || item.amountCents || item.totalAmountCents) && (
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900">₦{((item.totalCents || item.amountCents || item.totalAmountCents) / 100).toLocaleString()}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const { invoices, requisitions, cateringEvents, tickets, contacts, employees } = useDataStore();
  const { user } = useAuthStore();
  const { strictMode, settings, fetchSettings } = useSettingsStore();
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  // [SYNC ENFORCEMENT] Ensure Settings are always fresh on Dashboard load
  useEffect(() => {
    const orgId = user?.companyId || '10959119-72e4-4e57-ba54-923e36bba6a6';
    if (orgId && (settings.name === 'My New Workspace' || !settings.id)) {
      console.log('[Dashboard] Forcing settings sync for:', orgId);
      fetchSettings(orgId);
    }
  }, [user, settings.name, fetchSettings]);

  const calculateNetProfitMargin = () => {
    // 1. Total Revenue (Paid Invoices)
    const totalRevenueCents = invoices
      .filter(inv => inv.status === 'Paid' || inv.status === 'Overdue')
      .reduce((sum, inv) => sum + (inv.paidAmountCents || 0), 0);

    const totalExpensesCents = 0;
    if (totalRevenueCents === 0) return '0.0';
    const margin = ((totalRevenueCents - totalExpensesCents) / totalRevenueCents) * 100;
    return margin.toFixed(1);
  };

  const dataState = useMemo(() => {
    const salesInvoices = invoices.filter(i => i.type === 'Sales');
    const rev = salesInvoices.reduce((s, i) => s + i.totalCents, 0);
    const cash = salesInvoices.reduce((s, i) => s + i.paidAmountCents, 0);

    return {
      financial: { revenue: rev, cash, receivables: rev - cash },
      receivables: [...invoices].filter(i => i.status !== 'Paid').sort((a, b) => b.totalCents - a.totalCents),
      payables: [...requisitions].filter(r => r.status === 'Pending').sort((a, b) => b.totalAmountCents - a.totalAmountCents),
      upcomingEvents: [...cateringEvents].filter(e => e.status !== 'Completed').sort((a, b) => (a.eventDate || '').localeCompare(b.eventDate || '')),
      complaints: [...tickets].filter(t => t.status !== 'Resolved'),
      newCustomers: [...contacts].slice(0, 5),
      recentHires: [...employees].slice(0, 20)
    };
  }, [invoices, requisitions, cateringEvents, tickets, contacts, employees]);

  // [AUTH] Financial Data Guard (KPIs)
  const isFinancialAuthorized = useMemo(() => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;

    const role = user.role as string;
    const authorizedRoles = [
      Role.SUPER_ADMIN as string,
      Role.ADMIN as string,
      Role.CEO as string,
      Role.CHAIRMAN as string,
      Role.FINANCE as string,
      'CFO',
      'Operations',
      'Finance Manager',
      'Operations Manager'
    ];

    if (authorizedRoles.includes(role)) return true;
    if (user.permissionTags?.includes('access:finance')) return true;
    if (user.permissionTags?.includes('access:reports')) return true;

    return false;
  }, [user]);

  // [AUTH] Operational Financial Detail Guard (Awaiting Payments / Procurement)
  const isOpsFinAuthorized = useMemo(() => {
    if (isFinancialAuthorized) return true;
    const role = user?.role as string;
    return role === Role.BANQUET_MANAGER || role === Role.EVENT_COORDINATOR || role === Role.EVENT_MANAGER;
  }, [user, isFinancialAuthorized]);

  const handleOpenAssistant = () => {
    window.dispatchEvent(new CustomEvent('open-assistant'));
  };

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Platform Header */}
      <div className="col-span-12 flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-4xl font-black text-slate-900 tracking-tight leading-none mb-1 md:mb-2">
            CONTROL <span className="text-slate-400">CENTER</span>
          </h1>
          <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
            Operational Intelligence / {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {!strictMode && (
          <button
            onClick={handleOpenAssistant}
            className="group flex items-center gap-3 bg-slate-900 text-white pl-6 pr-2 py-2 rounded-full hover:bg-slate-800 transition-all hover:scale-[1.02]"
          >
            <span className="text-[10px] font-black uppercase tracking-widest">Intelligent Assistant</span>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-full group-hover:rotate-12 transition-transform shadow-lg">
              <BrainCircuit size={18} className="text-white" />
            </div>
          </button>
        )}
      </div>

      {/* KPI Ribbons */}
      {isFinancialAuthorized && (
        <div className="col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {[
            { label: 'Total Revenue', value: `₦${(dataState.financial.revenue / 100).toLocaleString()}`, icon: TrendingUp, color: 'text-indigo-600', trend: '+12.4%' },
            { label: 'Cash at Hand', value: `₦${(dataState.financial.cash / 100).toLocaleString()}`, icon: Activity, color: 'text-emerald-600', trend: 'Healthy' },
            { label: 'Receivables', value: `₦${(dataState.financial.receivables / 100).toLocaleString()}`, icon: Receipt, color: 'text-amber-600', trend: 'Action Needed' },
            { label: 'Net Profit Margin', value: `${calculateNetProfitMargin()}%`, icon: TrendingUp, color: 'text-purple-600', trend: 'Real-time' },
          ].map((kpi, idx) => (
            <div key={idx} className="bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
              <div className="relative z-10">
                <kpi.icon size={20} className={`${kpi.color} mb-4`} />
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{kpi.label}</p>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter">{kpi.value}</h2>
                <span className="text-[7px] md:text-[8px] font-black uppercase text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">
                  {kpi.trend}
                </span>
              </div>
              <div className="absolute -bottom-10 -right-10 opacity-[0.02] group-hover:scale-125 transition-transform duration-700">
                <kpi.icon size={160} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Areas */}
      <div className="col-span-12 lg:col-span-8 space-y-6 md:space-y-8">
        <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-slate-100 shadow-sm min-h-[350px] md:min-h-[450px]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {(settings.type === 'Catering' || settings.type === 'General') ? 'Event Pipeline' : 'Project Timeline'}
              </h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time scheduling \ 30 Days Forecast</p>
            </div>
            <button className="bg-slate-50 p-3 rounded-2xl hover:bg-slate-100 transition-colors">
              <Calendar size={18} className="text-slate-600" />
            </button>
          </div>
          <EventCalendar events={dataState.upcomingEvents} className="shadow-none border-0 h-full min-h-[500px]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {isOpsFinAuthorized && (
            <>
              <SummaryList title="Awaiting Payments" items={dataState.receivables} type="receivable" />
              <SummaryList title="Pending Procurement" items={dataState.payables} type="payable" />
            </>
          )}
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4 space-y-8 h-full">
        <div className="h-1/2">
          {(settings.type === 'Catering') ? (
            <SummaryList title="Upcoming Catering" items={dataState.upcomingEvents} type="event" onEventClick={(ev) => setSelectedEvent(ev)} />
          ) : (
            (settings.type === 'General') ? (
              <SummaryList title="Upcoming Events" items={dataState.upcomingEvents} type="event" onEventClick={(ev) => setSelectedEvent(ev)} />
            ) : (
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-center items-center h-full p-6 text-center">
                <Plane size={32} className="text-slate-300 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Industry Module Active</p>
              </div>
            )
          )}
        </div>
        {!['Logistics Officer', 'Logistics Manager', 'Event Coordinator', 'Banquet Manager'].includes(user?.role as string) && (
          <div className="h-1/2">
            <SummaryList title="Recent Hires" items={dataState.recentHires} type="employee" />
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventDetailCard
          item={{ type: 'event', data: selectedEvent }}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};
