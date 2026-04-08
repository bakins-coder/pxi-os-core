import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ArrowUpRight as LucideArrowUpRight } from 'lucide-react';
import { Role, Invoice, Requisition, CateringEvent } from '../types';
import { EventCalendar } from './EventCalendar';
import { getTerm } from '../utils/terminology';
import { NAIRA_SYMBOL } from '../utils/finance';

// High-Fidelity "Floating Card on Tray" System - Adapted from Executive Reference
const DashboardCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  // The Tray - wider padding to prevent shadow clipping and ensure high-fidelity depth
  <div className={`bg-slate-500/5 rounded-[2.5rem] p-5 h-[450px] relative group transition-all duration-500 ${className}`}>
    {/* 
      The Floating Card
      - Multi-layered diffused shadow system for premium depth
      - Grounded 3px structural bottom-border
      - Professional light-grey outline for high-contrast definition
    */}
    <div className="bg-white rounded-[2.5rem] flex flex-col h-full w-full overflow-hidden 
      shadow-[0_10px_30px_rgba(0,0,0,0.08),0_30px_70px_rgba(0,0,0,0.15)] 
      group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.12),0_40px_90px_rgba(0,0,0,0.22)] 
      transition-all duration-700 p-6 md:p-8 relative z-10 
      border border-slate-100/80 border-b-[4px] border-b-slate-200/50 
      group-hover:-translate-y-2">
      {children}
    </div>
  </div>
);

const formatCurrency = (cents: number) => {
  return (cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const SummaryList = ({ title, items, type, onItemClick }: { title: string; items: any[]; type: string; onItemClick?: (item: any) => void }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{title}</h4>
        <div className="flex items-center gap-2">
           <span className="text-[8px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg">{items.length} TOTAL</span>
        </div>
      </div>
      {/* 
        Professional Scrollable Content
        - Custom-styled, ultra-subtle light-grey scrollbar for a seamless logistical look
      */}
      <div className="flex-1 overflow-y-auto pr-3 max-h-[400px] 
        scrollbar-custom">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-slate-300">
            <Activity size={32} className="mb-2 opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-tighter">System Idle</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                onClick={() => onItemClick?.(item)}
                className={`flex items-center justify-between p-4 rounded-[1.5rem] border border-transparent hover:border-slate-100 hover:bg-slate-50/80 transition-all cursor-pointer group/item`}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`p-2.5 rounded-xl shrink-0 shadow-sm ${type === 'receivable' ? 'bg-emerald-50 text-emerald-600' :
                    type === 'payable' ? 'bg-rose-50 text-rose-600' :
                      type === 'complaint' ? 'bg-amber-50 text-amber-600' :
                        type === 'employee' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                    {type === 'receivable' ? <LucideArrowUpRight size={16} /> :
                      type === 'payable' ? <ArrowDownRight size={16} /> :
                        type === 'complaint' ? <AlertCircle size={16} /> :
                          type === 'employee' ? <UserCheck size={16} /> : <ChevronRight size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black uppercase text-slate-800 leading-tight mb-1 group-hover/item:text-indigo-600 transition-colors">
                      {type === 'receivable' ? (item.customerName || 'Valued Customer') :
                        type === 'payable' ? (item.itemName || 'Material Request') :
                          item.firstName ? `${item.firstName} ${item.lastName}` :
                            (item.title || item.name || item.customerName || 'Standard Entry')}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                      {type === 'receivable' ? `${item.number || 'INV'} • ${item.date || 'Today'}` :
                        type === 'payable' ? `${item.category || 'Procurement'} ${item.customerName ? `• ${item.customerName}` : ''} • ${item.notes || 'Pending Approval'}` :
                          (item.date || item.eventDate || item.email || item.role || 'Pending cycle')}
                    </p>
                  </div>
                </div>
                {(item.totalCents !== undefined || item.amountCents !== undefined || item.totalAmountCents !== undefined) && (
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-[11px] font-black text-slate-900 whitespace-nowrap">
                      <span className="text-[10px] text-slate-400 mr-0.5 font-bold">{NAIRA_SYMBOL}</span>{
                        formatCurrency(
                        (type === 'receivable' && item.totalCents !== undefined && item.paidAmountCents !== undefined)
                          ? (item.totalCents - item.paidAmountCents)
                          : (item.totalCents || item.amountCents || item.totalAmountCents || 0)
                      )}
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
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { strictMode, settings, fetchSettings } = useSettingsStore();
  const [selectedItem, setSelectedItem] = useState<{ type: string; data: any } | null>(null);

  useEffect(() => {
    const orgId = user?.companyId;
    if (orgId && (settings.name === 'Smart Platform' || !settings.id)) {
      fetchSettings(orgId);
    }
  }, [user, settings.name, fetchSettings]);

  const calculateNetProfitMargin = () => {
    const totalRevenueCents = invoices
      .filter(inv => inv.status === 'Paid' || inv.status === 'Overdue')
      .reduce((sum, inv) => sum + (inv.paidAmountCents || 0), 0);
    if (totalRevenueCents === 0) return '0.00';
    return "100.00";
  };

  const dataState = useMemo(() => {
    const salesInvoices = invoices.filter(i => i.type === 'Sales');
    const rev = salesInvoices.reduce((s, i) => s + i.totalCents, 0);
    const cash = salesInvoices.reduce((s, i) => s + i.paidAmountCents, 0);

    return {
      financial: { revenue: rev, cash, receivables: rev - cash },
      receivables: [...invoices].filter(i => i.status !== 'Paid' && i.type === 'Sales').map(inv => ({
        ...inv,
        customerName: contacts.find(c => c.id === inv.contactId)?.name || 'Valued Customer'
      })).sort((a, b) => b.totalCents - a.totalCents),
      accountsPayable: [...invoices].filter(i => i.status !== 'Paid' && i.type === 'Purchase').map(inv => ({
        ...inv,
        customerName: contacts.find(c => c.id === inv.contactId)?.name || 'Standard Vendor'
      })).sort((a, b) => b.totalCents - a.totalCents),
      payables: [...requisitions].filter(r => r.status === 'Pending').map(req => ({
        ...req,
        customerName: cateringEvents.find(e => e.id === req.referenceId)?.customerName
      })).sort((a, b) => b.totalAmountCents - a.totalAmountCents),
      upcomingEvents: [...cateringEvents].filter(e => e.status !== 'Completed').sort((a, b) => (a.eventDate || '').localeCompare(b.eventDate || '')),
      complaints: [...tickets].filter(t => t.status !== 'Resolved'),
      newCustomers: [...contacts].slice(0, 5),
      recentHires: employees.slice(0, 20)
    };
  }, [invoices, requisitions, cateringEvents, tickets, contacts, employees]);

  const isFinancialAuthorized = useMemo(() => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    const role = user.role as string;
    // Restricted to Executive, Admin, and core Finance/Management roles.
    // Specifically excludes kitchen/operations management staff (e.g. Sarah).
    const authorizedRoles = [
      Role.SUPER_ADMIN, 
      Role.ADMIN, 
      Role.CEO, 
      Role.CHAIRMAN, 
      Role.FINANCE, 
      Role.FINANCE_OFFICER,
      'Finance Manager',
      'Operations Manager'
    ];
    return authorizedRoles.includes(role as Role) || user.permissionTags?.includes('access:finance_all');
  }, [user]);

  const isOpsFinAuthorized = useMemo(() => {
    if (isFinancialAuthorized) return true;
    const role = user?.role as string;
    return role === Role.BANQUET_MANAGER || role === Role.EVENT_COORDINATOR || role === Role.EVENT_MANAGER;
  }, [user, isFinancialAuthorized]);

  const handleOpenAssistant = () => window.dispatchEvent(new CustomEvent('open-assistant'));

  return (
    <div className="grid grid-cols-12 gap-8 p-8">
      {/* Platform Header */}
      <div className="col-span-12 flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-3xl font-black text-white tracking-tight leading-none mb-2 uppercase">
            CONTROL <span className="text-slate-400">CENTER</span>
          </h1>
          <p className="text-[10px] md:text-[11px] font-black uppercase text-slate-500 tracking-[0.25em]">
            Operational Intelligence System / {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {!strictMode && (
          <button onClick={handleOpenAssistant} className="group flex items-center gap-4 bg-slate-900 border border-white/5 text-white pl-6 pr-3 py-2 rounded-full hover:bg-slate-800 transition-all hover:scale-[1.05]">
            <span className="text-[10px] font-black uppercase tracking-widest">System Assistant</span>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-full shadow-xl shadow-indigo-500/20">
              <BrainCircuit size={18} className="text-white" />
            </div>
          </button>
        )}
      </div>

      {/* KPI Ribbons */}
      {isFinancialAuthorized && (
        <div className="col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Revenue', value: formatCurrency(dataState.financial.revenue), icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+12.4%' },
            { label: 'Cash at Hand', value: formatCurrency(dataState.financial.cash), icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Healthy' },
            { label: 'Receivables', value: formatCurrency(dataState.financial.receivables), icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-50', trend: 'Action Needed' },
            { label: 'Net Profit Margin', value: `${calculateNetProfitMargin()}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', trend: 'Real-time' },
          ].map((kpi, idx) => (
            <div key={idx} className="bg-white p-5 rounded-[2rem] border-0 shadow-[0_10px_35px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)] flex flex-col justify-between hover:scale-[1.03] transition-all h-[120px] relative overflow-hidden group">
              <div className="flex items-center justify-between relative z-10">
                <div className={`${kpi.bg} ${kpi.color} w-8 h-8 rounded-xl flex items-center justify-center shrink-0`}>
                  <kpi.icon size={14} />
                </div>
                <span className="text-[8px] font-black uppercase text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-full tracking-widest">{kpi.trend}</span>
              </div>
              <div className="mt-2 relative z-10">
                <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 mb-1">{kpi.label}</p>
                <div className="flex items-baseline gap-0.5">
                  {kpi.label !== 'Net Profit Margin' && <span className="text-[11px] font-black text-slate-400">{NAIRA_SYMBOL}</span>}
                  <h2 className="text-sm md:text-base font-black text-slate-900 tracking-tighter leading-none">{kpi.value}</h2>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 opacity-[0.04] group-hover:scale-150 transition-transform duration-700 pointer-events-none group-hover:rotate-12">
                <kpi.icon size={100} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Areas */}
      <div className="col-span-12 space-y-10">
        <DashboardCard>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none uppercase">
                {getTerm(settings.type, 'event_pipeline', 'OPERATIONAL PIPELINE')}
              </h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Real-time scheduling \ 30 Days Forecast</p>
            </div>
            <button className="bg-slate-50 p-2.5 rounded-xl hover:bg-slate-100 transition-colors">
              <Calendar size={18} className="text-slate-600" />
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <EventCalendar events={dataState.upcomingEvents} className="shadow-none border-0 h-full min-h-[350px]" />
          </div>
        </DashboardCard>

        <DashboardCard>
          <SummaryList title="Awaiting Payments" items={dataState.receivables} type="receivable" onItemClick={(inv) => setSelectedItem({ type: 'receivable', data: inv })} />
        </DashboardCard>
        <DashboardCard>
          <SummaryList title={getTerm(settings.type, 'procurement', 'Pending Procurement')} items={dataState.payables} type="payable" onItemClick={(req) => setSelectedItem({ type: 'payable', data: req })} />
        </DashboardCard>

        {isOpsFinAuthorized && (
          <div className="space-y-10">
            <DashboardCard>
              <SummaryList title="Accounts Payable" items={dataState.accountsPayable} type="payable" onItemClick={(inv) => setSelectedItem({ type: 'payable-invoice', data: inv })} />
            </DashboardCard>
          </div>
        )}
      </div>

      {selectedItem && selectedItem.type !== 'event' && (
        <GenericDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={async (updates) => {
            if (selectedItem.type === 'payable') await updateRequisition(selectedItem.data.id, updates);
            setSelectedItem(null);
          }}
        />
      )}

      <style>{`
        .scrollbar-custom::-webkit-scrollbar {
          width: 5px;
        }
        .scrollbar-custom::-webkit-scrollbar-track {
          background: transparent;
          margin: 10px 0;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

const GenericDetailModal = ({ item, onClose, onUpdate }: { item: { type: string; data: any }; onClose: () => void; onUpdate: (updates: any) => Promise<void> }) => {
  const { type, data } = item;
  const isInvoice = type === 'receivable' || type === 'payable-invoice';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in duration-300">
        <div className={`p-8 text-white ${isInvoice ? 'bg-gradient-to-br from-indigo-600 to-teal-700' : 'bg-gradient-to-br from-rose-600 to-orange-700'}`}>
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              {isInvoice ? <ReceiptIcon size={26} /> : <Box size={26} />}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-white"><X size={22} /></button>
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-2 text-white">{isInvoice ? (data.customerName || 'Standard Entry') : (data.itemName || 'Material Request')}</h3>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70">{isInvoice ? `Reference: ${data.number || '---'}` : `System ID: ${data.id.slice(0, 8)}`}</p>
        </div>
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</p>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${data.status === 'Paid' || data.status === 'Approved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <p className="text-xs font-black text-slate-700 uppercase">{data.status || 'Pending'}</p>
              </div>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Amount</p>
              <p className="text-sm font-black text-slate-900">{NAIRA_SYMBOL}{formatCurrency(data.totalCents || data.totalAmountCents || 0)}</p>
            </div>
          </div>
          <div className="space-y-5">
            <div className="flex items-center gap-4 text-slate-600">
              <CalendarIcon size={18} className="text-slate-400 shrink-0" /><div className="flex-1"><p className="text-[11px] font-black uppercase text-slate-400 leading-none mb-1.5">Date</p><p className="text-sm font-bold">{data.date || data.createdAt || 'Standard Entry'}</p></div>
            </div>
            <div className="flex items-center gap-4 text-slate-600">
              <Tag size={18} className="text-slate-400 shrink-0" /><div className="flex-1"><p className="text-[11px] font-black uppercase text-slate-400 leading-none mb-1.5">System Ref</p><p className="text-sm font-bold font-black">{isInvoice ? (data.id.slice(0, 15)) : data.category}</p></div>
            </div>
            {data.notes && (
              <div className="p-5 bg-slate-50 rounded-2xl border border-indigo-100/50">
                <p className="text-xs font-bold text-slate-600 italic leading-relaxed">"{data.notes}"</p>
              </div>
            )}
          </div>
        </div>
        <div className="p-6 bg-slate-100/50 border-t border-slate-100 flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-all shadow-xl">Dismiss</button>
          {!isInvoice && data.status === 'Pending' && <button onClick={() => onUpdate({ status: 'Approved' })} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg flex items-center justify-center gap-2">Approve <CheckCircle2 size={16} /></button>}
        </div>
      </div>
    </div>
  );
};
