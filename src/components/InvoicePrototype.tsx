import React, { useEffect, useState } from 'react';
import { Printer, Download, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDataStore } from '../store/useDataStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Invoice, Contact } from '../types';

export const InvoicePrototype = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { invoices, contacts } = useDataStore();
    const { settings } = useSettingsStore();

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [customer, setCustomer] = useState<Contact | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            const foundInvoice = invoices.find(inv => inv.id === id);
            if (foundInvoice) {
                setInvoice(foundInvoice);
                const foundCustomer = contacts.find(c => c.id === foundInvoice.contactId);
                setCustomer(foundCustomer || null);
            }
            setLoading(false);
        }
    }, [id, invoices, contacts]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="min-h-screen p-8 bg-slate-100 flex flex-col items-center justify-center text-center">
                <h2 className="text-2xl font-black text-slate-800 mb-2">Invoice Not Found</h2>
                <p className="text-slate-500 mb-6">The requested invoice ID could not be located.</p>
                <button
                    onClick={() => navigate('/finance')}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-all"
                >
                    <ArrowLeft size={16} /> Return to Finance
                </button>
            </div>
        );
    }

    // Calculations
    const totalAmount = invoice.totalCents / 100;
    const paidAmount = invoice.paidAmountCents / 100;
    const balanceDue = totalAmount - paidAmount;

    // Fallback Customer Data
    const customerName = customer?.name || 'Valued Customer';
    const customerEmail = customer?.email || '';

    // Organization Data
    const orgName = settings.name || 'Xquisite Celebrations Ltd';
    const orgAddress = settings.address || '';
    const orgPhone = settings.contactPhone;
    const orgTin = settings.firs_tin;
    const logo = settings.logo; // In real app, might want a default logo fallback
    // Use bank settings if available, otherwise fallback (or hide)
    const bankName = settings.bankInfo?.bankName;
    const accName = settings.bankInfo?.accountName;
    const accNum = settings.bankInfo?.accountNumber;

    return (
        <div className="min-h-screen bg-slate-100 p-8 font-sans print:p-0 print:bg-white">
            {/* Control Bar */}
            <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-bold">Back</span>
                </button>
                <div className="flex gap-4">
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2 bg-white rounded-full shadow-sm text-slate-700 font-bold hover:shadow-md transition-all">
                        <Printer size={18} /> Print
                    </button>
                    {/* Placeholder for PDF Download - browser print to PDF is usually sufficient or requires library */}
                    {/* <button className="flex items-center gap-2 px-6 py-2 bg-[#ff6b6b] text-white rounded-full shadow-md font-bold hover:bg-[#ff5252] transition-all">
                        <Download size={18} /> Download PDF
                    </button> */}
                </div>
            </div>

            {/* Invoice Container */}
            <div className="max-w-4xl mx-auto bg-white shadow-2xl overflow-hidden print:shadow-none print:max-w-none print:w-full">

                {/* Header */}
                <div className="p-12 pb-8">
                    <div className="flex justify-between items-start">
                        {/* Logo / Brand Area */}
                        <div>
                            {logo ? (
                                <img src={logo} alt={orgName} className="h-24 object-contain mb-2" />
                            ) : (
                                <div className="h-24 flex items-center mb-2">
                                    <h1 className="text-3xl font-black text-[#ff6b6b] uppercase tracking-tighter">{orgName}</h1>
                                </div>
                            )}
                        </div>

                        {/* Company Address */}
                        <div className="text-right text-xs text-slate-600 leading-relaxed font-medium">
                            <p className="font-bold text-slate-800">{orgName}</p>
                            {/* Simple address formatting - split by comma if desired or just display */}
                            <p className="whitespace-pre-wrap">{orgAddress}</p>
                            {orgPhone && <p className="mt-2 text-slate-900 font-bold">Tel: {orgPhone}</p>}
                            {orgTin && <p>TIN: {orgTin}</p>}
                        </div>
                    </div>
                </div>

                <div className="px-12">
                    <div className="border-t-2 border-[#ff6b6b] mb-1"></div>
                    <div className="border-t border-[#ff6b6b]"></div>
                </div>

                {/* Bill To & Invoice Details */}
                <div className="p-12 grid grid-cols-2 gap-12">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Bill To</h3>
                        <p className="font-bold text-slate-800 text-lg">{customerName}</p>
                        <p className="text-slate-600">{customerName}</p> {/* Contact Person? */}
                        <p className="text-slate-500 text-sm mt-1">{customerEmail}</p>
                        {customer?.address && <p className="text-slate-500 text-sm mt-1">{customer.address}</p>}
                    </div>

                    <div className="flex flex-col items-end">
                        {/* Stamp-like border for "Invoice" */}
                        <div className="border-2 border-[#D32F2F] px-8 py-2 rounded-lg mb-6 transform rotate-[-2deg]">
                            <h2 className="text-3xl font-serif text-[#D32F2F] uppercase tracking-widest">Invoice</h2>
                        </div>

                        <div className="w-full max-w-xs space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-bold text-slate-600">Invoice Number:</span>
                                <span className="font-medium text-slate-900">{invoice.number}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="font-bold text-slate-600">Invoice Date:</span>
                                <span className="font-medium text-slate-900">{new Date(invoice.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="font-bold text-slate-600">Payment Due:</span>
                                <span className="font-medium text-slate-900">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 p-2 rounded print:bg-transparent">
                                <span className="font-bold text-slate-600">Balance Due (NGN):</span>
                                <span className="font-black text-xl text-slate-900">₦{balanceDue.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="p-12 pt-0 w-full overflow-hidden">
                    <table className="w-full table-fixed">
                        <thead>
                            <tr className="border-b-2 border-slate-100">
                                <th className="text-left py-4 text-sm font-bold text-slate-600 uppercase w-3/5">Items</th>
                                <th className="text-center py-4 text-sm font-bold text-slate-600 uppercase w-[10%]">Qty</th>
                                <th className="text-right py-4 text-sm font-bold text-slate-600 uppercase w-[15%]">Price</th>
                                <th className="text-right py-4 text-sm font-bold text-slate-600 uppercase w-[15%]">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {invoice.lines.map((item, index) => {
                                const linePrice = item.unitPriceCents / 100;
                                const lineTotal = (item.quantity * item.unitPriceCents) / 100;
                                return (
                                    <tr key={item.id} className="group hover:bg-slate-50/50">
                                        <td className="py-6 pr-8 align-top break-words">
                                            <p className="text-sm font-medium text-slate-800 leading-relaxed">{item.description}</p>
                                        </td>
                                        <td className="py-6 text-center align-top text-sm font-medium text-slate-600">{item.quantity}</td>
                                        <td className="py-6 text-right align-top text-sm font-medium text-slate-600">
                                            {linePrice ? `₦${linePrice.toLocaleString('en-NG', { minimumFractionDigits: 2 })}` : ''}
                                        </td>
                                        <td className="py-6 text-right align-top text-sm font-bold text-slate-800">
                                            {lineTotal ? `₦${lineTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}` : ''}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={2}></td>
                                <td className="pt-8 text-right font-bold text-slate-600 text-sm">Subtotal:</td>
                                <td className="pt-8 text-right font-bold text-slate-800 text-sm">₦{totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            {/* Service Charge logic can be re-added if stored in Invoice model. Currently standard Invoice doesn't have it explicitly separate from total usually unless calculated. */}
                            <tr>
                                <td colSpan={2}></td>
                                <td className="pt-4 pb-4 border-b border-slate-200 text-right font-black text-slate-800 text-base">Total:</td>
                                <td className="pt-4 pb-4 border-b border-slate-200 text-right font-black text-slate-800 text-base">₦{totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                                <td colSpan={2}></td>
                                <td className="pt-4 text-right font-medium text-slate-500 text-xs">Amount Paid:</td>
                                <td className="pt-4 text-right font-medium text-slate-800 text-xs">₦{paidAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                                <td colSpan={2}></td>
                                <td className="pt-4 text-right font-black text-slate-900 text-lg uppercase">Balance Due:</td>
                                <td className="pt-4 text-right font-black text-slate-900 text-lg">₦{balanceDue.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Footer Section: Notes & Terms */}
                <div className="p-12 pt-4 grid grid-cols-1 gap-8">
                    <div>
                        <h4 className="font-bold text-slate-800 mb-2 text-sm">Payment Information</h4>
                        <div className="text-xs text-slate-600 leading-relaxed">
                            <p className="mb-4">Thank you for your patronage. Please make all payment transfers to:<br />
                                <span className="font-bold text-slate-800 uppercase">{accName || orgName}</span></p>

                            {bankName && accNum ? (
                                <>
                                    <p className="font-bold underline mb-1">Bank Details:-</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-6">
                                        <div className="p-3 bg-slate-50 border border-slate-100 rounded">
                                            <span className="font-bold block text-slate-700">{bankName}</span>
                                            <span className="font-mono">{accNum}</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p className="italic text-slate-400">Please contact us for bank payment details.</p>
                            )}

                            <p className="font-bold mb-1">Terms and Conditions:</p>
                            <p className="mb-4">Initial deposit of 70% is to be paid before the event and balance payable immediately after the event. Cancellation of order will result to only a 70% refund of initial deposit made.</p>

                            <p className="font-bold mb-1">Disclaimer:</p>
                            <p>In the event of cancellation of order, it should be communicated to our contact person 48 hours before the event. Failure to do so will mean that initial deposit made has been forfeited.</p>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="p-4 bg-[#D32F2F] text-white text-center print:hidden">
                    <p className="font-serif italic font-bold text-lg">Bon Apetit. We look forward to serving you again soon.</p>
                </div>
                {/* Print-only footer to ensure color bar appears if background graphics enabled */}
                <div className="hidden print:block p-2 bg-[#D32F2F] text-white text-center text-xs mt-4 -mx-12 -mb-12">
                    {orgName}
                </div>

            </div>
        </div>
    );
};
