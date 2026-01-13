import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { EventCalendar } from './EventCalendar';
import {
  TrendingUp, Bot, BrainCircuit, Activity,
  CheckSquare, Users, Calendar, ArrowUpRight, Building2,
  Clock, AlertCircle, ShoppingBag, Receipt, ArrowDownRight, ArrowUpLeft, ChevronRight, UserCheck, LayoutGrid, Plane
} from 'lucide-react';

const SummaryList: React.FC<{ title: string; items: any[]; type: 'receivable' | 'payable' | 'event' | 'complaint' | 'customer' | 'employee' }> = ({ title, items, type }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden h-full">
      <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">{title}</h3>
        <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase">{items.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[350px]">
        {items.length === 0 ? (
          <div className="p-10 text-center text-slate-300 h-full flex flex-col justify-center">
            <Clock size={24} className="mx-auto mb-2 opacity-10" />
            <p className="text-[9px] font-black uppercase tracking-widest">No active entries</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {items.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (type === 'customer') navigate('/crm');
                  else if (type === 'employee') navigate('/hr');
                  else if (type === 'event') navigate('/catering');
                  else if (type === 'complaint') navigate('/contact-center');
                }}
                className="p-5 hover:bg-indigo-50/30 cursor-pointer transition-all flex items-center justify-between"
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
  const { strictMode, settings } = useSettingsStore();

  const calculateNetProfitMargin = () => {
    // 1. Total Revenue (Paid Invoices)
    const totalRevenueCents = invoices
      .filter(inv => inv.status === 'Paid' || inv.status === 'Overdue')
      .reduce((sum, inv) => sum + (inv.paidAmountCents || 0), 0);

    // 2. Total Expenses (Bookkeeping Outflows - Simplified)
    // In a real scenario, this would check 'bookkeeping' or specific expense accounts.
    // For now we will assume 0 expenses if no ledger data, preventing divide by zero.
    const totalExpensesCents = 0;

    if (totalRevenueCents === 0) return '0.0';

    // Placeholder logic until Expense Ledger is fully connected
    const margin = ((totalRevenueCents - totalExpensesCents) / totalRevenueCents) * 100;
    return margin.toFixed(1);
  };

  const dataState = useMemo(() => {
    // Financial Summary Logic
    const salesInvoices = invoices.filter(i => i.type === 'Sales');
    const rev = salesInvoices.reduce((s, i) => s + i.totalCents, 0);
    const cash = salesInvoices.reduce((s, i) => s + i.paidAmountCents, 0);

    return {
      financial: { revenue: rev, cash, receivables: rev - cash },
      receivables: [...invoices].filter(i => i.status !== 'Paid').sort((a, b) => b.totalCents - a.totalCents),
      payables: [...requisitions].filter(r => r.status === 'Pending').sort((a, b) => b.totalAmountCents - a.totalAmountCents),
      upcomingEvents: [...cateringEvents].filter(e => e.status !== 'Completed').sort((a, b) => a.eventDate.localeCompare(b.eventDate)),
      complaints: [...tickets].filter(t => t.status !== 'Resolved'),
      newCustomers: [...contacts].slice(0, 5),
      recentHires: [...employees].slice(0, 5)
    };
  }, [invoices, requisitions, cateringEvents, tickets, contacts, employees]);

  const handleOpenAssistant = () => {
    window.dispatchEvent(new CustomEvent('open-assistant'));
  };

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Platform Header */}
      <div className="col-span-12 flex items-center justify-between mb-2">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
            CONTROL <span className="text-slate-400">CENTER</span>
          </h1>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
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
      <div className="col-span-12 grid grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: `₦${(dataState.financial.revenue / 100).toLocaleString()}`, icon: TrendingUp, color: 'text-indigo-600', trend: '+12.4%' },
          { label: 'Cash at Hand', value: `₦${(dataState.financial.cash / 100).toLocaleString()}`, icon: Activity, color: 'text-emerald-600', trend: 'Healthy' },
          { label: 'Receivables', value: `₦${(dataState.financial.receivables / 100).toLocaleString()}`, icon: Receipt, color: 'text-amber-600', trend: 'Action Needed' },

          { label: 'Net Profit Margin', value: `${calculateNetProfitMargin()}%`, icon: TrendingUp, color: 'text-purple-600', trend: 'Real-time' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="relative z-10">
              <kpi.icon size={20} className={`${kpi.color} mb-4`} />
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{kpi.label}</p>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter">{kpi.value}</h2>
              <span className="text-[8px] font-black uppercase text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">
                {kpi.trend}
              </span>
            </div>
            <div className="absolute -bottom-10 -right-10 opacity-[0.02] group-hover:scale-125 transition-transform duration-700">
              <kpi.icon size={160} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Areas */}
      <div className="col-span-8 space-y-8">
        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm min-h-[450px]">
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
          <EventCalendar events={dataState.upcomingEvents} />
        </div>

        <div className="grid grid-cols-2 gap-8">
          <SummaryList title="Awaiting Payments" items={dataState.receivables} type="receivable" />
          <SummaryList title="Pending Procurement" items={dataState.payables} type="payable" />
        </div>
      </div>

      <div className="col-span-4 space-y-8 h-full">
        <div className="h-1/2">
          {(settings.type === 'Catering') ? (
            <SummaryList title="Upcoming Catering" items={dataState.upcomingEvents} type="event" />
          ) : (
            (settings.type === 'General') ? (
              <SummaryList title="Upcoming Events" items={dataState.upcomingEvents} type="event" />
            ) : (
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-center items-center h-full p-6 text-center">
                <Plane size={32} className="text-slate-300 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Industry Module Active</p>
              </div>
            )
          )}
          )}
        </div>
        <div className="h-1/2">
          <SummaryList title="Recent Hires" items={dataState.recentHires} type="employee" />
        </div>
      </div>
    </div>
  );
};
