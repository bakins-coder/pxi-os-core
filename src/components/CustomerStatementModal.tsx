
import React, { useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Contact, Invoice, BookkeepingEntry, InvoiceStatus } from '../types';
import { X, FileText, TrendingUp, TrendingDown, Printer, Download } from 'lucide-react';

interface CustomerStatementModalProps {
    contact: Contact;
    onClose: () => void;
}

export const CustomerStatementModal = ({ contact, onClose }: CustomerStatementModalProps) => {
    const { invoices, bookkeeping } = useDataStore();
    const { settings: org } = useSettingsStore();

    const statementData = useMemo(() => {
        const customerInvoices = invoices.filter(inv => inv.contactId === contact.id && inv.type === 'Sales');
        const customerPayments = bookkeeping.filter(entry => entry.contactId === contact.id && entry.type === 'Inflow');

        const movements = [
            ...customerInvoices.map(inv => ({
                id: inv.id,
                date: inv.date,
                description: `Invoice #${inv.number}`,
                debitCents: inv.totalCents,
                creditCents: 0,
                type: 'Debit' as const
            })),
            ...customerPayments.map(entry => ({
                id: entry.id,
                date: entry.date,
                description: entry.description,
                debitCents: 0,
                creditCents: entry.amountCents,
                type: 'Credit' as const
            }))
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let runningBalance = 0;
        const movementsWithBalance = movements.map(move => {
            runningBalance += (move.debitCents - move.creditCents);
            return { ...move, balanceCents: runningBalance };
        });

        const totalDebits = customerInvoices.reduce((sum, inv) => sum + inv.totalCents, 0);
        const totalCredits = customerPayments.reduce((sum, entry) => sum + entry.amountCents, 0);
        const currentBalance = totalDebits - totalCredits;

        return {
            movements: movementsWithBalance,
            totalDebits,
            totalCredits,
            currentBalance
        };
    }, [invoices, bookkeeping, contact.id]);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in zoom-in duration-200">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col border border-slate-200 max-h-[90vh]">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        {org.logo && <img src={org.logo} alt="Organization Logo" className="w-12 h-12 rounded-xl object-contain bg-white p-1 shadow-sm" />}
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Customer Statement</h2>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">{contact.name} • {contact.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => window.print()} className="p-3 hover:bg-slate-100 rounded-xl transition-all text-slate-600"><Printer size={20} /></button>
                        <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-xl transition-all"><X size={24} /></button>
                    </div>
                </div>

                <div className="p-10 overflow-y-auto space-y-8 scrollbar-thin">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Debits</p>
                            <p className="text-xl font-black text-slate-900">₦{(statementData.totalDebits / 100).toLocaleString()}</p>
                        </div>
                        <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total Credits</p>
                            <p className="text-xl font-black text-emerald-600">₦{(statementData.totalCredits / 100).toLocaleString()}</p>
                        </div>
                        <div className={`p-6 rounded-3xl border ${statementData.currentBalance > 0 ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${statementData.currentBalance > 0 ? 'text-amber-500' : 'text-blue-500'}`}>Current Balance</p>
                            <p className={`text-xl font-black ${statementData.currentBalance > 0 ? 'text-amber-700' : 'text-blue-700'}`}>₦{(statementData.currentBalance / 100).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4 text-right">Debit (₦)</th>
                                    <th className="px-6 py-4 text-right">Credit (₦)</th>
                                    <th className="px-6 py-4 text-right">Balance (₦)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {statementData.movements.length > 0 ? statementData.movements.map((move) => (
                                    <tr key={move.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="px-6 py-4 text-slate-500 font-bold uppercase text-[10px]">{move.date}</td>
                                        <td className="px-6 py-4">
                                            <p className="font-black text-slate-800 uppercase text-xs">{move.description}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                                            {move.debitCents > 0 ? (move.debitCents / 100).toLocaleString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                            {move.creditCents > 0 ? (move.creditCents / 100).toLocaleString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-slate-900 bg-slate-50/30">
                                            ₦{(move.balanceCents / 100).toLocaleString()}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <FileText size={48} className="mx-auto mb-4 text-slate-100" />
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No financial movements recorded for this contact.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="p-8 border-t border-slate-100 bg-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">System generated financial record</p>
                    </div>
                    <button onClick={onClose} className="px-8 py-3 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 active:scale-95 transition-all">
                        Close Statement
                    </button>
                </div>
            </div>
        </div>
    );
};
