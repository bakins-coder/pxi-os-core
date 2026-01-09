
import React, { useMemo, useState } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import {
    Users, TrendingUp, Building2, User, Search, Filter,
    Plus, Mail, Phone, MapPin, MoreHorizontal, FileText,
    PieChart, ArrowUpRight, ArrowDownRight, Download, Share2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const FinancialReports = () => {
    const {
        chartOfAccounts: coa,
        bookkeeping,
        invoices,
        requisitions
    } = useDataStore();
    const { settings } = useSettingsStore();
    const [reportType, setReportType] = useState<'balance-sheet' | 'income-statement' | 'cash-flow'>('balance-sheet');

    const generateReport = useMemo(() => {
        // --- 1. BALANCE SHEET ---
        // Assets = Liabilities + Equity
        const assets = coa.filter(a => a.type === 'Asset');
        const liabilities = coa.filter(a => a.type === 'Liability');
        const equity = coa.filter(a => a.type === 'Equity');

        const totalAssets = assets.reduce((sum, a) => sum + a.balanceCents, 0);
        const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balanceCents, 0);
        const totalEquity = equity.reduce((sum, a) => sum + a.balanceCents, 0);

        // --- 2. INCOME STATEMENT (P&L) ---
        // Revenue - Expenses = Net Income
        const revenue = coa.filter(a => a.type === 'Revenue');
        const expenses = coa.filter(a => a.type === 'Expense');

        const totalRevenue = revenue.reduce((sum, a) => sum + a.balanceCents, 0);
        const totalExpenses = expenses.reduce((sum, a) => sum + a.balanceCents, 0);
        const netIncome = totalRevenue - totalExpenses;

        // --- 3. CASH FLOW (Direct Method Approximation) ---
        // Operating, Investing, Financing
        // Using bookkeeping 'type' and 'category' to approximate
        const operatingIn = bookkeeping.filter(e => e.type === 'Inflow' && ['Sales', 'Service'].includes(e.category)).reduce((s, e) => s + e.amountCents, 0);
        const operatingOut = bookkeeping.filter(e => e.type === 'Outflow' && !['Capital', 'Loan'].includes(e.category)).reduce((s, e) => s + e.amountCents, 0);
        const netOperating = operatingIn - operatingOut;

        const investingIn = 0; // Placeholder: Asset sales
        const investingOut = bookkeeping.filter(e => e.category === 'Capital').reduce((s, e) => s + e.amountCents, 0);
        const netInvesting = investingIn - investingOut;

        const financingIn = bookkeeping.filter(e => e.category === 'Loan' || e.category === 'Equity').reduce((s, e) => s + e.amountCents, 0);
        const financingOut = 0; // Placeholder: Loan repayments
        const netFinancing = financingIn - financingOut;

        return {
            balanceSheet: {
                assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity
            },
            incomeStatement: {
                revenue, expenses, totalRevenue, totalExpenses, netIncome
            },
            cashFlow: {
                netOperating, netInvesting, netFinancing,
                netChange: netOperating + netInvesting + netFinancing
            }
        };
    }, [coa, bookkeeping]);

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text(`${settings.name || 'Organization'} - Financial Report`, 14, 20);
        doc.setFontSize(12);
        doc.text(reportType.toUpperCase().replace('-', ' '), 14, 30);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 36);

        let data: any[] = [];
        let headers: string[] = [];

        if (reportType === 'balance-sheet') {
            headers = ['Account', 'Subtype', 'Balance'];
            data = [
                ['ASSETS', '', ''],
                ...generateReport.balanceSheet.assets.map(a => [a.name, a.subtype, `N${(a.balanceCents / 100).toLocaleString()}`]),
                ['TOTAL ASSETS', '', `N${(generateReport.balanceSheet.totalAssets / 100).toLocaleString()}`],
                ['', '', ''],
                ['LIABILITIES', '', ''],
                ...generateReport.balanceSheet.liabilities.map(a => [a.name, a.subtype, `N${(a.balanceCents / 100).toLocaleString()}`]),
                ['TOTAL LIABILITIES', '', `N${(generateReport.balanceSheet.totalLiabilities / 100).toLocaleString()}`],
                ['', '', ''],
                ['EQUITY', '', ''],
                ...generateReport.balanceSheet.equity.map(a => [a.name, a.subtype, `N${(a.balanceCents / 100).toLocaleString()}`]),
                ['TOTAL EQUITY', '', `N${(generateReport.balanceSheet.totalEquity / 100).toLocaleString()}`],
            ];
        } else if (reportType === 'income-statement') {
            headers = ['Account', 'Type', 'Amount'];
            data = [
                ['REVENUE', '', ''],
                ...generateReport.incomeStatement.revenue.map(a => [a.name, a.subtype, `N${(a.balanceCents / 100).toLocaleString()}`]),
                ['TOTAL REVENUE', '', `N${(generateReport.incomeStatement.totalRevenue / 100).toLocaleString()}`],
                ['', '', ''],
                ['EXPENSES', '', ''],
                ...generateReport.incomeStatement.expenses.map(a => [a.name, a.subtype, `(N${(a.balanceCents / 100).toLocaleString()})`]),
                ['TOTAL EXPENSES', '', `(N${(generateReport.incomeStatement.totalExpenses / 100).toLocaleString()})`],
                ['', '', ''],
                ['NET INCOME', '', `N${(generateReport.incomeStatement.netIncome / 100).toLocaleString()}`],
            ];
        }

        autoTable(doc, {
            startY: 45,
            head: [headers],
            body: data,
            theme: 'striped',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [41, 128, 185] }
        });

        doc.save(`${reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setReportType('balance-sheet')}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${reportType === 'balance-sheet' ? 'bg-white shadow-md text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Balance Sheet
                    </button>
                    <button
                        onClick={() => setReportType('income-statement')}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${reportType === 'income-statement' ? 'bg-white shadow-md text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        P&L Statement
                    </button>
                    <button
                        onClick={() => setReportType('cash-flow')}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${reportType === 'cash-flow' ? 'bg-white shadow-md text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Cash Flow
                    </button>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExportPDF} className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all">
                        <Download size={14} /> Export PDF
                    </button>
                    <button className="bg-emerald-50 text-emerald-600 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-100 transition-all">
                        <Share2 size={14} /> Share Report
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl min-h-[600px] relative overflow-hidden">
                {/* Watermark */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.03] select-none">
                    <PieChart size={400} />
                </div>

                {reportType === 'balance-sheet' && (
                    <div className="max-w-4xl mx-auto space-y-10 relative z-10">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Statement of Financial Position</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase mt-2">As of {new Date().toLocaleDateString()}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-20">
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-2 mb-4">Assets</h3>
                                {generateReport.balanceSheet.assets.map(a => (
                                    <div key={a.id} className="flex justify-between items-center text-sm group">
                                        <span className="font-medium text-slate-600 group-hover:text-indigo-600 transition-colors">{a.name}</span>
                                        <span className="font-bold text-slate-900">₦{(a.balanceCents / 100).toLocaleString()}</span>
                                    </div>
                                ))}
                                <div className="pt-4 border-t-2 border-slate-100 flex justify-between items-center text-lg">
                                    <span className="font-black text-slate-800 uppercase">Total Assets</span>
                                    <span className="font-black text-indigo-600">₦{(generateReport.balanceSheet.totalAssets / 100).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="space-y-12">
                                <div className="space-y-6">
                                    <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest border-b border-rose-100 pb-2 mb-4">Liabilities</h3>
                                    {generateReport.balanceSheet.liabilities.map(a => (
                                        <div key={a.id} className="flex justify-between items-center text-sm group">
                                            <span className="font-medium text-slate-600 group-hover:text-rose-500 transition-colors">{a.name}</span>
                                            <span className="font-bold text-slate-900">₦{(a.balanceCents / 100).toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <div className="pt-4 border-t-2 border-slate-100 flex justify-between items-center">
                                        <span className="font-black text-slate-800 uppercase text-xs">Total Liabilities</span>
                                        <span className="font-black text-rose-600">₦{(generateReport.balanceSheet.totalLiabilities / 100).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-sm font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-100 pb-2 mb-4">Equity</h3>
                                    {generateReport.balanceSheet.equity.map(a => (
                                        <div key={a.id} className="flex justify-between items-center text-sm group">
                                            <span className="font-medium text-slate-600 group-hover:text-emerald-600 transition-colors">{a.name}</span>
                                            <span className="font-bold text-slate-900">₦{(a.balanceCents / 100).toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <div className="pt-4 border-t-2 border-slate-100 flex justify-between items-center">
                                        <span className="font-black text-slate-800 uppercase text-xs">Total Equity</span>
                                        <span className="font-black text-emerald-600">₦{(generateReport.balanceSheet.totalEquity / 100).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-xl flex justify-between items-center border border-slate-200">
                                    <span className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Total Liabilities & Equity</span>
                                    <span className="font-black text-slate-900">₦{((generateReport.balanceSheet.totalLiabilities + generateReport.balanceSheet.totalEquity) / 100).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {reportType === 'income-statement' && (
                    <div className="max-w-3xl mx-auto space-y-10 relative z-10">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Statement of Profit or Loss</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase mt-2">FY {new Date().getFullYear()}</p>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4">Operating Revenue</h3>
                                {generateReport.incomeStatement.revenue.map(a => (
                                    <div key={a.id} className="flex justify-between items-center py-2 border-b border-slate-50 text-sm">
                                        <span className="font-medium text-slate-700">{a.name}</span>
                                        <span className="font-bold text-slate-900">₦{(a.balanceCents / 100).toLocaleString()}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center py-4 text-lg">
                                    <span className="font-black text-emerald-700 uppercase">Total Revenue</span>
                                    <span className="font-black text-emerald-700">₦{(generateReport.incomeStatement.totalRevenue / 100).toLocaleString()}</span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-4">Operating Expenses</h3>
                                {generateReport.incomeStatement.expenses.map(a => (
                                    <div key={a.id} className="flex justify-between items-center py-2 border-b border-slate-50 text-sm">
                                        <span className="font-medium text-slate-700">{a.name}</span>
                                        <span className="font-bold text-slate-900">(₦{(a.balanceCents / 100).toLocaleString()})</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center py-4 text-lg">
                                    <span className="font-black text-rose-600 uppercase">Total Expenses</span>
                                    <span className="font-black text-rose-600">(₦{(generateReport.incomeStatement.totalExpenses / 100).toLocaleString()})</span>
                                </div>
                            </div>

                            <div className="mt-8 p-8 bg-slate-900 text-white rounded-[2rem] flex justify-between items-center shadow-xl">
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Net Income</p>
                                    <h2 className={`text-4xl font-black ${generateReport.incomeStatement.netIncome >= 0 ? 'text-[#00ff9d]' : 'text-rose-400'}`}>
                                        ₦{(generateReport.incomeStatement.netIncome / 100).toLocaleString()}
                                    </h2>
                                </div>
                                <div className={`p-4 rounded-full ${generateReport.incomeStatement.netIncome >= 0 ? 'bg-[#00ff9d]/10 text-[#00ff9d]' : 'bg-rose-500/10 text-rose-500'}`}>
                                    {generateReport.incomeStatement.netIncome >= 0 ? <TrendingUp size={32} /> : <ArrowDownRight size={32} />}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {reportType === 'cash-flow' && (
                    <div className="max-w-3xl mx-auto space-y-10 relative z-10 text-center">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Statement of Cash Flows</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase mt-2">Indirect Method (Approximation)</p>
                        </div>
                        <div className="space-y-6">
                            <div className="p-6 bg-slate-50 rounded-2xl flex justify-between items-center">
                                <span className="font-bold text-slate-700 uppercase text-xs tracking-widest">Net Cash from Operating Activities</span>
                                <span className={`font-black text-xl ${generateReport.cashFlow.netOperating >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    ₦{(generateReport.cashFlow.netOperating / 100).toLocaleString()}
                                </span>
                            </div>
                            <div className="p-6 bg-slate-50 rounded-2xl flex justify-between items-center">
                                <span className="font-bold text-slate-700 uppercase text-xs tracking-widest">Net Cash from Investing Activities</span>
                                <span className={`font-black text-xl ${generateReport.cashFlow.netInvesting >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    ₦{(generateReport.cashFlow.netInvesting / 100).toLocaleString()}
                                </span>
                            </div>
                            <div className="p-6 bg-slate-50 rounded-2xl flex justify-between items-center">
                                <span className="font-bold text-slate-700 uppercase text-xs tracking-widest">Net Cash from Financing Activities</span>
                                <span className={`font-black text-xl ${generateReport.cashFlow.netFinancing >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    ₦{(generateReport.cashFlow.netFinancing / 100).toLocaleString()}
                                </span>
                            </div>
                            <div className="mt-8 pt-8 border-t border-slate-200 flex justify-between items-center">
                                <span className="font-black text-slate-900 uppercase">Net Increase / (Decrease) in Cash</span>
                                <span className={`font-black text-3xl ${generateReport.cashFlow.netChange >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                                    ₦{(generateReport.cashFlow.netChange / 100).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
