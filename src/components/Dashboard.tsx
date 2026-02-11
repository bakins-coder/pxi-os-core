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
  BrainCircuit,
  X,
  Receipt as ReceiptIcon,
  Box,
  Calendar as CalendarIcon,
  User,
  Tag,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Role, Invoice, Requisition, CateringEvent } from '../types';
import { EventCalendar } from './EventCalendar';
import { EventDetailCard } from './EventDetailCard';

const SummaryList = ({ title, items, type, onItemClick }: { title: string; items: any[]; type: string; onItemClick?: (item: any) => void }) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{title}</h4>
        <span className="text-[9px] font-black text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded-lg">{items.length}</span>
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
                onClick={() => onItemClick?.(item)}
                className={`flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all cursor-pointer group`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-xl shrink-0 ${type === 'receivable' ? 'bg-emerald-50 text-emerald-600' :
                    type === 'payable' ? 'bg-rose-50 text-rose-600' :
                      type === 'complaint' ? 'bg-amber-50 text-amber-600' :
                        type === 'employee' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'
                    }`}>
                    {type === 'receivable' ? <ArrowUpRight size={14} /> :
                      type === 'payable' ? <ArrowDownRight size={14} /> :
                        type === 'complaint' ? <AlertCircle size={14} /> :
                          type === 'employee' ? <UserCheck size={14} /> : <ChevronRight size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase text-slate-800 leading-tight mb-1">
                      {type === 'receivable' ? (item.customerName || 'Valued Customer') :
                        type === 'payable' ? (item.itemName || 'Material Request') :
                          item.firstName ? `${item.firstName} ${item.lastName}` :
                            (item.title || item.name || item.customerName || 'Standard Entry')}
                    </p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase">
                      {type === 'receivable' ? `${item.number || 'INV'} • ${item.date || 'Today'}` :
                        type === 'payable' ? `${item.category || 'Procurement'} ${item.customerName ? `• ${item.customerName}` : ''} • ${item.notes || 'Pending Approval'}` :
                          (item.date || item.eventDate || item.email || item.role || 'Pending cycle')}
                    </p>
                  </div>
                </div>
                {(item.totalCents !== undefined || item.amountCents !== undefined || item.totalAmountCents !== undefined) && (
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-[11px] font-black text-slate-800 whitespace-nowrap">
                      <span className="text-[9px] text-slate-400 mr-0.5 font-bold">₦</span>{((
                        (type === 'receivable' && item.totalCents !== undefined && item.paidAmountCents !== undefined)
                          ? (item.totalCents - item.paidAmountCents)
                          : (item.totalCents || item.amountCents || item.totalAmountCents || 0)
                      ) / 100).toLocaleString()}
                    </p>
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
  const { invoices, requisitions, cateringEvents, tickets, contacts, employees, updateInvoiceStatus, updateRequisition } = useDataStore();
  const { user } = useAuthStore();
  const { strictMode, settings, fetchSettings } = useSettingsStore();
  const [selectedItem, setSelectedItem] = useState<{ type: string; data: any } | null>(null);

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
      receivables: [...invoices]
        .filter(i => i.status !== 'Paid' && i.type === 'Sales')
        .map(inv => ({
          ...inv,
          customerName: contacts.find(c => c.id === inv.contactId)?.name || 'Valued Customer'
        }))
        .sort((a, b) => b.totalCents - a.totalCents),
      accountsPayable: [...invoices]
        .filter(i => i.status !== 'Paid' && i.type === 'Purchase')
        .map(inv => ({
          ...inv,
          customerName: contacts.find(c => c.id === inv.contactId)?.name || 'Standard Vendor'
        }))
        .sort((a, b) => b.totalCents - a.totalCents),
      payables: [...requisitions]
        .filter(r => r.status === 'Pending')
        .map(req => ({
          ...req,
          customerName: cateringEvents.find(e => e.id === req.referenceId)?.customerName
        }))
        .sort((a, b) => b.totalAmountCents - a.totalAmountCents),
      upcomingEvents: [...cateringEvents].filter(e => e.status !== 'Completed').sort((a, b) => (a.eventDate || '').localeCompare(b.eventDate || '')),
      complaints: [...tickets].filter(t => t.status !== 'Resolved'),
      newCustomers: [...contacts].slice(0, 5),
      recentHires: employees.slice(0, 20)
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
        <div className="py-4">
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-none mb-1.5">
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
        <div className="col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: (dataState.financial.revenue / 100).toLocaleString(), icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+12.4%' },
            { label: 'Cash at Hand', value: (dataState.financial.cash / 100).toLocaleString(), icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Healthy' },
            { label: 'Receivables', value: (dataState.financial.receivables / 100).toLocaleString(), icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-50', trend: 'Action Needed' },
            { label: 'Net Profit Margin', value: `${calculateNetProfitMargin()}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', trend: 'Real-time' },
          ].map((kpi, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all flex flex-col justify-between h-full">
              <div className="relative z-10">
                <div className={`${kpi.bg} ${kpi.color} w-8 h-8 rounded-lg flex items-center justify-center mb-4`}>
                  <kpi.icon size={16} />
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{kpi.label}</p>
                <div className="flex items-baseline gap-1">
                  {kpi.label !== 'Net Profit Margin' && <span className="text-sm font-black text-slate-400">₦</span>}
                  <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tighter leading-none">{kpi.value}</h2>
                </div>
              </div>
              <div className="relative z-10 mt-4">
                <span className="text-[8px] font-black uppercase text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                  {kpi.trend}
                </span>
              </div>
              <div className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <kpi.icon size={100} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Areas */}
      <div className="col-span-12 lg:col-span-8 space-y-6">
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm min-h-[350px] md:min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none">
                {(settings.type === 'Catering' || settings.type === 'General') ? 'EVENT PIPELINE' : 'PROJECT TIMELINE'}
              </h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time scheduling \ 30 Days Forecast</p>
            </div>
            <button className="bg-slate-50 p-3 rounded-2xl hover:bg-slate-100 transition-colors">
              <Calendar size={18} className="text-slate-600" />
            </button>
          </div>
          <EventCalendar events={dataState.upcomingEvents} className="shadow-none border-0 h-full min-h-[500px]" />
        </div>

        {isOpsFinAuthorized && (
          <div className="space-y-6">
            <SummaryList title="Awaiting Payments" items={dataState.receivables} type="receivable" onItemClick={(inv) => setSelectedItem({ type: 'receivable', data: inv })} />
            <SummaryList title="Accounts Payable" items={dataState.accountsPayable} type="payable" onItemClick={(inv) => setSelectedItem({ type: 'payable-invoice', data: inv })} />
            <SummaryList title="Pending Procurement" items={dataState.payables} type="payable" onItemClick={(req) => setSelectedItem({ type: 'payable', data: req })} />
          </div>
        )}
      </div>

      <div className="col-span-12 lg:col-span-4 space-y-6">
        <div className="min-h-[300px]">
          {(settings.type === 'Catering') ? (
            <SummaryList title="Upcoming Catering" items={dataState.upcomingEvents} type="event" onItemClick={(ev) => setSelectedItem({ type: 'event', data: ev })} />
          ) : (
            (settings.type === 'General') ? (
              <SummaryList title="Upcoming Events" items={dataState.upcomingEvents} type="event" onItemClick={(ev) => setSelectedItem({ type: 'event', data: ev })} />
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center h-full p-6 text-center">
                <Plane size={32} className="text-slate-300 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Industry Module Active</p>
              </div>
            )
          )}
        </div>
      </div>

      {selectedItem?.type === 'event' && (
        <EventDetailCard
          item={{ type: 'event', data: selectedItem.data }}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {selectedItem && selectedItem.type !== 'event' && (
        <GenericDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={async (updates) => {
            if (selectedItem.type === 'payable') {
              await updateRequisition(selectedItem.data.id, updates);
            }
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
};

const GenericDetailModal = ({ item, onClose, onUpdate }: { item: { type: string; data: any }; onClose: () => void; onUpdate: (updates: any) => Promise<void> }) => {
  const { type, data } = item;
  const isInvoice = type === 'receivable' || type === 'payable-invoice';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in duration-300">
        <div className={`p-8 text-white ${isInvoice ? 'bg-gradient-to-br from-emerald-600 to-teal-700' : 'bg-gradient-to-br from-rose-600 to-orange-700'}`}>
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              {isInvoice ? <ReceiptIcon size={24} /> : <Box size={24} />}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
              <X size={20} />
            </button>
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-2 text-white">
            {isInvoice ? (data.customerName || 'Standard Entry') : (data.itemName || 'Material Request')}
          </h3>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
            {isInvoice ? `Invoice ${data.number || '---'}` : `Requisition ${data.id.slice(0, 8)}`}
          </p>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${data.status === 'Paid' || data.status === 'Approved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <p className="text-xs font-black text-slate-700 uppercase">{data.status || 'Pending'}</p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount</p>
              <p className="text-sm font-black text-slate-900">₦{((data.totalCents || data.totalAmountCents || 0) / 100).toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-slate-600">
              <CalendarIcon size={16} className="text-slate-400 shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">Date</p>
                <p className="text-xs font-bold">{data.date || data.createdAt || 'Standard Entry'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-600">
              <Tag size={16} className="text-slate-400 shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">{isInvoice ? 'Reference' : 'Category'}</p>
                <p className="text-xs font-bold">{isInvoice ? (data.id.slice(0, 12)) : data.category}</p>
              </div>
            </div>

            {data.notes && (
              <div className="flex items-start gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                <Clock size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-[11px] font-medium text-slate-600 leading-relaxed italic">
                  "{data.notes}"
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-all shadow-sm"
          >
            Dismiss
          </button>
          {!isInvoice && data.status === 'Pending' && (
            <button
              onClick={() => onUpdate({ status: 'Approved' })}
              className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              Approve Request <CheckCircle2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
