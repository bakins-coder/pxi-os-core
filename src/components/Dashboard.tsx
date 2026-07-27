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
import { Role } from '../types';
import { EventCalendar } from './EventCalendar';
import { getTerm, getIndustryTerminology } from '../utils/terminology';
import { NAIRA_SYMBOL } from '../utils/finance';

// High-Fidelity "Floating Card on Tray" System - Adapted from Executive Reference
const DashboardCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  // The Tray - wider padding to prevent shadow clipping and ensure high-fidelity depth
  <div className={`bg-slate-500/5 rounded-2xl md:rounded-[2.5rem] p-3 md:p-5 h-[360px] md:h-[450px] relative group transition-all duration-500 ${className}`}>
    {/* 
      The Floating Card
      - Multi-layered diffused shadow system for premium depth
      - Grounded 3px structural bottom-border
      - Professional light-grey outline for high-contrast definition
    */}
    <div className="bg-white rounded-2xl md:rounded-[2.5rem] flex flex-col h-full w-full overflow-hidden 
      shadow-[0_10px_30px_rgba(0,0,0,0.08),0_30px_70px_rgba(0,0,0,0.15)] 
      group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.12),0_40px_90px_rgba(0,0,0,0.22)] 
      transition-all duration-700 p-4 md:p-8 relative z-10 
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
      {title && (
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{title}</h4>
          <div className="flex items-center gap-2">
             <span className="text-[8px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg">{items.length} TOTAL</span>
          </div>
        </div>
      )}
      {/* 
        Professional Scrollable Content
        - Custom-styled, ultra-subtle light-grey scrollbar for a seamless logistical look
      */}
      <div className="flex-1 overflow-y-auto pr-2 max-h-[300px] md:max-h-[400px] 
        scrollbar-custom">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-slate-300">
            <Activity size={32} className="mb-2 opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-tighter">System Idle</p>
          </div>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                onClick={() => onItemClick?.(item)}
                className={`flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-[1.5rem] border border-transparent hover:border-slate-100 hover:bg-slate-50/80 transition-all cursor-pointer group/item`}
              >
                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                  <div className={`p-2 md:p-2.5 rounded-xl shrink-0 shadow-sm ${type === 'receivable' ? 'bg-emerald-50 text-emerald-600' :
                    type === 'payable' ? 'bg-rose-50 text-rose-600' :
                      type === 'complaint' ? 'bg-amber-50 text-amber-600' :
                        type === 'employee' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                    {type === 'receivable' ? <LucideArrowUpRight size={14} /> :
                      type === 'payable' ? <ArrowDownRight size={14} /> :
                        type === 'complaint' ? <AlertCircle size={14} /> :
                          type === 'employee' ? <UserCheck size={14} /> : <ChevronRight size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] md:text-[11px] font-black uppercase text-slate-800 leading-tight mb-0.5 md:mb-1 group-hover/item:text-indigo-600 transition-colors truncate">
                      {type === 'receivable' ? (item.customerName || 'Valued Customer') :
                        type === 'payable' ? (item.itemName || 'Material Request') :
                          item.firstName ? `${item.firstName} ${item.lastName}` :
                            (item.title || item.name || item.customerName || 'Standard Entry')}
                    </p>
                    <p className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-tight truncate">
                      {type === 'receivable' ? `${item.number || 'INV'} • ${item.date || 'Today'}` :
                        type === 'payable' ? `${item.category || 'Procurement'} ${item.customerName ? `• ${item.customerName}` : ''} • ${item.notes || 'Pending Approval'}` :
                          (item.date || item.eventDate || item.email || item.role || 'Pending cycle')}
                    </p>
                  </div>
                </div>
                {(item.totalCents !== undefined || item.amountCents !== undefined || item.totalAmountCents !== undefined) && (
                  <div className="text-right shrink-0 ml-2 md:ml-4">
                    <p className="text-[10px] md:text-[11px] font-black text-slate-900 whitespace-nowrap">
                      <span className="text-[9px] md:text-[10px] text-slate-400 mr-0.5 font-bold">{NAIRA_SYMBOL}</span>{
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
  const navigate = useNavigate();
  const { invoices, requisitions, cateringEvents, tickets, contacts, employees, updateInvoiceStatus, updateRequisition } = useDataStore();
  const { settings, strictMode, fetchSettings } = useSettingsStore();
  const user = useAuthStore((state) => state.user);
  const [selectedItem, setSelectedItem] = useState<{ type: string; data: any } | null>(null);

  // IDE layout collapsible state
  const [pipelineExpanded, setPipelineExpanded] = useState(true);
  const [sectionsExpanded, setSectionsExpanded] = useState({
    receivables: true,
    payables: true,
    accountsPayable: false,
  });

  useEffect(() => {
    const orgId = user?.companyId;
    if (orgId && (settings.name === 'Smart Platform' || !settings.id)) {
      fetchSettings(orgId);
    }
  }, [user, settings.name, fetchSettings]);

  const calculateNetProfitMargin = () => {
    const rev = invoices.filter(i => i.status === 'Paid' && i.type === 'Sales').reduce((sum, i) => sum + (i.totalCents || 0), 0);
    const cost = invoices.filter(i => i.status === 'Paid' && i.type === 'Purchase').reduce((sum, i) => sum + (i.totalCents || 0), 0);
    if (rev === 0) return '0.00';
    return (((rev - cost) / rev) * 100).toFixed(2);
  };

  const dataState = useMemo(() => {
    const rev = invoices.filter(i => i.type === 'Sales').reduce((sum, i) => sum + (i.totalCents || 0), 0);
    const cash = invoices.filter(i => i.status === 'Paid' && i.type === 'Sales').reduce((sum, i) => sum + (i.totalCents || 0), 0);
    return {
      financial: { revenue: rev, cash, receivables: rev - cash },
      receivables: [...invoices].filter(i => i.status !== 'Paid' && i.type === 'Sales').map(inv => ({
        ...inv,
        customerName: contacts.find(c => c.id === inv.contactId)?.name || 'Walk-in Client'
      })),
      payables: [...requisitions].filter(r => r.status === 'Pending').map(req => ({
        ...req,
        customerName: cateringEvents.find(e => e.id === req.referenceId)?.customerName
      })),
      accountsPayable: [...invoices].filter(i => i.status !== 'Paid' && i.type === 'Purchase').map(inv => ({
        ...inv,
        customerName: contacts.find(c => c.id === inv.contactId)?.name || 'Standard Vendor'
      })),
      upcomingEvents: cateringEvents.slice(0, 5)
    };
  }, [invoices, requisitions, cateringEvents, tickets, contacts, employees]);

  const isFinancialAuthorized = useMemo(() => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    const role = user.role as string;
    const authorizedRoles = [Role.SUPER_ADMIN, Role.ADMIN, Role.CEO, Role.CHAIRMAN, Role.FINANCE, Role.FINANCE_OFFICER, 'Finance Manager', 'Operations Manager'];
    return authorizedRoles.includes(role as Role) || user.permissionTags?.includes('access:finance_all');
  }, [user]);

  const isOpsFinAuthorized = useMemo(() => {
    if (isFinancialAuthorized) return true;
    const role = user?.role as string;
    return role === Role.BANQUET_MANAGER || role === Role.EVENT_COORDINATOR || role === Role.EVENT_MANAGER;
  }, [user, isFinancialAuthorized]);

  const handleOpenAssistant = () => window.dispatchEvent(new CustomEvent('open-assistant'));
  const activeProfile = getIndustryTerminology(settings.type);
  const isFoundation = activeProfile.type === 'Sports Foundation';

  return (
    <div className="grid grid-cols-12 gap-3 md:gap-4 py-1 md:py-2 px-2 md:px-4">
      {/* Platform Header */}
      <div className="col-span-12 flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1 md:mb-2">
        <div>
          <h1 className="text-base md:text-xl font-black text-white tracking-tight leading-none mb-1 uppercase">
            CONTROL <span className="text-slate-400">CENTER</span>
          </h1>
          <p className="text-[7px] md:text-[9px] font-black uppercase text-slate-500 tracking-[0.15em]">
            Operational Intelligence System / {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {!strictMode && (
          <button onClick={handleOpenAssistant} className="group flex items-center justify-between md:justify-start gap-2 bg-slate-900 border border-white/5 text-white pl-3 pr-1.5 py-1 rounded-full hover:bg-slate-800 transition-all hover:scale-[1.03] self-start md:self-auto">
            <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest">System Assistant</span>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 rounded-full shadow-xl shadow-indigo-500/20">
              <BrainCircuit size={12} className="text-white" />
            </div>
          </button>
        )}
      </div>

      {/* KPI Ribbons */}
      {isFinancialAuthorized && (
        <div className="col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
          {[
            { label: isFoundation ? 'Grants & Endowments' : 'Total Revenue', value: formatCurrency(dataState.financial.revenue), icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+12.4%' },
            { label: isFoundation ? 'Reserved Grants' : 'Cash at Hand', value: formatCurrency(dataState.financial.cash), icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Healthy' },
            { label: isFoundation ? 'Allocations' : 'Receivables', value: formatCurrency(dataState.financial.receivables), icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-50', trend: 'Action Needed' },
            { label: isFoundation ? 'Program Surplus' : 'Net Profit Margin', value: `${calculateNetProfitMargin()}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', trend: 'Real-time' },
          ].map((kpi, idx) => (
            <div key={idx} className="bg-white p-2.5 md:p-3 rounded-xl md:rounded-[1.25rem] border-0 shadow-[0_6px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] flex flex-col justify-between items-center text-center hover:scale-[1.02] transition-all h-[68px] md:h-[76px] relative overflow-hidden group">
              <div className="flex items-center justify-between w-full relative z-10 shrink-0">
                <div className={`${kpi.bg} ${kpi.color} w-5 h-5 md:w-6 md:h-6 rounded-md md:rounded-lg flex items-center justify-center shrink-0`}>
                  <kpi.icon size={10} className="md:w-3 md:h-3" />
                </div>
                <span className="text-[6px] md:text-[7px] font-black uppercase text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full tracking-widest">{kpi.trend}</span>
              </div>
              <div className="my-auto relative z-10 min-w-0 flex flex-col items-center justify-center w-full">
                <p className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.05em] text-slate-400 mb-0.5 truncate text-center w-full">{kpi.label}</p>
                <div className="flex items-center justify-center gap-0.5 truncate w-full">
                  {kpi.label !== 'Net Profit Margin' && <span className="text-[9px] md:text-[10px] font-black text-slate-400 leading-none">{NAIRA_SYMBOL}</span>}
                  <h2 className="text-xs md:text-sm font-black text-slate-900 tracking-tighter leading-none truncate text-center">{kpi.value}</h2>
                </div>
              </div>
              <div className="absolute -bottom-3 -right-3 opacity-[0.04] group-hover:scale-150 transition-transform duration-700 pointer-events-none group-hover:rotate-12">
                <kpi.icon size={60} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Areas */}
      <div className="col-span-12 flex flex-col lg:flex-row gap-4 h-auto lg:h-[calc(100vh-175px)] lg:min-h-[480px] overflow-hidden">
        {/* Left Area: Operational Pipeline */}
        <div className={`flex flex-col bg-white rounded-2xl md:rounded-3xl border border-slate-100 shadow-[0_10px_35px_rgba(0,0,0,0.05)] transition-all duration-300 ${pipelineExpanded ? 'flex-[2]' : 'w-12 lg:w-12 flex-none'} overflow-hidden h-full`}>
          {/* Header */}
          <div className="flex items-center justify-between p-2.5 md:p-3 bg-slate-50/50 border-b border-slate-100 cursor-pointer shrink-0" onClick={() => setPipelineExpanded(!pipelineExpanded)}>
            <div className={`flex items-center gap-2 ${!pipelineExpanded ? 'lg:flex-col lg:py-4 lg:mx-auto' : ''}`}>
              <span className="text-slate-400">
                {pipelineExpanded ? <ChevronRight className="rotate-90 transition-transform" size={14} /> : <ChevronRight size={14} />}
              </span>
              <h3 className={`text-[9px] md:text-[10px] font-black text-slate-800 uppercase tracking-widest ${!pipelineExpanded ? 'lg:[writing-mode:vertical-lr] lg:rotate-180 lg:my-4' : ''}`}>
                {getTerm(settings.type, 'event_pipeline', 'OPERATIONAL PIPELINE')}
              </h3>
            </div>
            {pipelineExpanded && (
              <span className="text-[7px] md:text-[8px] font-black text-slate-400 bg-white px-2 py-0.5 rounded-lg border border-slate-100 uppercase tracking-wider">
                {dataState.upcomingEvents.length} Events
              </span>
            )}
          </div>
          {/* Calendar Body */}
          {pipelineExpanded && (
            <div className="flex-1 overflow-hidden p-2 md:p-3 min-h-[350px] lg:min-h-0">
              <EventCalendar events={dataState.upcomingEvents} className="shadow-none border-0 h-full" />
            </div>
          )}
        </div>

        {/* Right Area: Collapsible lists sidebar (like IDE files explorer) */}
        <div className="flex flex-col flex-1 bg-white rounded-3xl border border-slate-100 shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden h-full">
          {/* Awaiting Payments */}
          <div className={`flex flex-col overflow-hidden transition-all duration-300 ${sectionsExpanded.receivables ? 'flex-1 min-h-[150px]' : 'flex-none h-12'}`}>
            <div 
              className="flex items-center justify-between p-4 bg-slate-50/50 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors shrink-0"
              onClick={() => setSectionsExpanded(prev => ({ ...prev, receivables: !prev.receivables }))}
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-400">
                  {sectionsExpanded.receivables ? <ChevronRight className="rotate-90 transition-transform" size={16} /> : <ChevronRight size={16} />}
                </span>
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                  {getTerm(settings.type, 'order_title_plural', 'Awaiting Payments')}
                </h3>
              </div>
              <span className="text-[8px] font-black text-slate-400 bg-white px-2 py-0.5 rounded-lg border border-slate-100">
                {dataState.receivables.length}
              </span>
            </div>
            {sectionsExpanded.receivables && (
              <div className="flex-1 overflow-y-auto p-4 scrollbar-custom">
                <SummaryList items={dataState.receivables} type="receivable" title="" onItemClick={(inv) => setSelectedItem({ type: 'receivable', data: inv })} />
              </div>
            )}
          </div>

          {/* Pending Procurement */}
          <div className={`flex flex-col overflow-hidden border-t border-slate-100 transition-all duration-300 ${sectionsExpanded.payables ? 'flex-1 min-h-[150px]' : 'flex-none h-12'}`}>
            <div 
              className="flex items-center justify-between p-4 bg-slate-50/50 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors shrink-0"
              onClick={() => setSectionsExpanded(prev => ({ ...prev, payables: !prev.payables }))}
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-400">
                  {sectionsExpanded.payables ? <ChevronRight className="rotate-90 transition-transform" size={16} /> : <ChevronRight size={16} />}
                </span>
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                  {getTerm(settings.type, 'procurement', 'Pending Procurement')}
                </h3>
              </div>
              <span className="text-[8px] font-black text-slate-400 bg-white px-2 py-0.5 rounded-lg border border-slate-100">
                {dataState.payables.length}
              </span>
            </div>
            {sectionsExpanded.payables && (
              <div className="flex-1 overflow-y-auto p-4 scrollbar-custom">
                <SummaryList items={dataState.payables} type="payable" title="" onItemClick={(req) => setSelectedItem({ type: 'payable', data: req })} />
              </div>
            )}
          </div>

          {/* Accounts Payable (if authorized) */}
          {isOpsFinAuthorized && (
            <div className={`flex flex-col overflow-hidden border-t border-slate-100 transition-all duration-300 ${sectionsExpanded.accountsPayable ? 'flex-1 min-h-[150px]' : 'flex-none h-12'}`}>
              <div 
                className="flex items-center justify-between p-4 bg-slate-50/50 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors shrink-0"
                onClick={() => setSectionsExpanded(prev => ({ ...prev, accountsPayable: !prev.accountsPayable }))}
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">
                    {sectionsExpanded.accountsPayable ? <ChevronRight className="rotate-90 transition-transform" size={16} /> : <ChevronRight size={16} />}
                  </span>
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                    Accounts Payable
                  </h3>
                </div>
                <span className="text-[8px] font-black text-slate-400 bg-white px-2 py-0.5 rounded-lg border border-slate-100">
                  {dataState.accountsPayable.length}
                </span>
              </div>
              {sectionsExpanded.accountsPayable && (
                <div className="flex-1 overflow-y-auto p-4 scrollbar-custom">
                  <SummaryList items={dataState.accountsPayable} type="payable" title="" onItemClick={(inv) => setSelectedItem({ type: 'payable-invoice', data: inv })} />
                </div>
              )}
            </div>
          )}
        </div>
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
