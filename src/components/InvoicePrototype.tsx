import React, { useEffect, useState } from 'react';
import { Printer, Download, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDataStore } from '../store/useDataStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Invoice, Contact } from '../types';


// Brand Colors
// const BRAND_COLOR = '#D32F2F'; // Old Red
const BRAND_COLOR = '#F47C20'; // Xquisite Orange
const ACCENT_COLOR = '#FFB74D'; // Lighter Orange

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
    // Calculations
    let totalAmount = invoice.totalCents / 100;
    let subtotal = invoice.subtotalCents ? invoice.subtotalCents / 100 : 0;
    let serviceCharge = invoice.serviceChargeCents ? invoice.serviceChargeCents / 100 : 0;
    let vat = invoice.vatCents ? invoice.vatCents / 100 : 0;

    // Fallback for legacy invoices (calculate breakdown if missing)
    if (!subtotal && !serviceCharge && !vat) {
        // Calculate based on the stored total or calculate from lines
        // Option A: Treat total as subtotal and calculate taxes on top (User intent: "Show me taxes")

        // Recalculate subtotal from lines to be safe
        const calculatedSubtotal = invoice.lines.reduce((acc, l) => acc + (l.quantity * l.unitPriceCents), 0) / 100;

        subtotal = calculatedSubtotal > 0 ? calculatedSubtotal : totalAmount;
        serviceCharge = subtotal * 0.15;
        vat = (subtotal + serviceCharge) * 0.075;
        totalAmount = subtotal + serviceCharge + vat;
    }
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
    const orgLogo = settings.logo || "/xquisite-logo.png";
    const activeBrandColor = settings.brandColor || BRAND_COLOR;

    // Use bank settings if available, otherwise fallback (or hide)
    const bankName = settings.bankInfo?.bankName;
    const accName = settings.bankInfo?.accountName;
    const accNum = settings.bankInfo?.accountNumber;

    return (
        <div className="min-h-screen bg-slate-100 p-8 font-sans print:p-0 print:bg-white text-slate-900">
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
                            <img src={orgLogo} alt={orgName} className="h-24 object-contain mb-2" />
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
                    <div className="w-full h-0.5" style={{ backgroundColor: ACCENT_COLOR }}></div>
                    <div className="w-full h-px" style={{ backgroundColor: ACCENT_COLOR }}></div>
                </div>

                {/* Bill To & Invoice Details */}
                <div className="p-12 grid grid-cols-2 gap-12">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Bill To</h3>
                        <p className="font-bold text-slate-800 text-lg">{customerName}</p>

                        <p className="text-slate-500 text-sm mt-1">{customerEmail}</p>
                        {customer?.address && <p className="text-slate-500 text-sm mt-1">{customer.address}</p>}
                    </div>

                    <div className="flex flex-col items-end">
                        <div className="border-2 px-8 py-2 rounded-lg mb-6 transform rotate-[-2deg]" style={{ borderColor: activeBrandColor }}>
                            <h2 className="text-3xl font-serif uppercase tracking-widest" style={{ color: activeBrandColor }}>
                                {invoice.status === InvoiceStatus.PROFORMA ? 'Pro-forma Invoice' : 'Invoice'}
                            </h2>
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

                    </table>
                </div>

                {/* Summary Section - Outside table to avoid column width constraints */}
                {/* Summary Section - Outside table to avoid column width constraints */}
                <div className="px-12 pb-8 flex flex-col items-end">
                    <div className="w-1/2 max-w-sm space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-slate-600 uppercase">Subtotal:</span>
                            <span className="font-medium text-slate-900">₦{subtotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-slate-600 uppercase">Service Charge (15%):</span>
                            <span className="font-medium text-slate-900">₦{serviceCharge.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-slate-600 uppercase">VAT (7.5%):</span>
                            <span className="font-medium text-slate-900">₦{vat.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="w-full h-px bg-slate-200 my-2"></div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-slate-600 uppercase">Total Amount:</span>
                            <span className="font-bold text-slate-900 text-lg">₦{(subtotal + serviceCharge + vat).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-medium text-slate-500">Amount Paid:</span>
                            <span className="font-medium text-slate-800">₦{paidAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="pt-4 border-t border-slate-200 flex justify-between items-end">
                            <div className="px-4 py-1 bg-slate-100 rounded text-xs font-bold text-slate-500 uppercase tracking-wider">Balance Due</div>
                            <div className="text-3xl font-black text-slate-900 border-b-2 border-slate-900 pb-1">
                                ₦{balanceDue.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Section: Notes & Terms */}
                <div className="p-12 pt-4 grid grid-cols-1 gap-8">
                    <div>
                        <h4 className="font-bold text-slate-800 mb-2 text-sm">Payment Information</h4>
                        <div className="text-xs text-slate-600 leading-relaxed">
                            <p className="mb-4">Thank you for your patronage. Please make all payment transfers to:<br />
                                <span className="font-bold text-slate-800 uppercase">{accName || orgName}</span></p>

                            <p className="font-bold underline mb-2">Bank Details:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <span className="font-bold block text-slate-800 text-xs uppercase mb-1">Xquisite Cuisine</span>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600 text-xs font-medium">GT Bank</span>
                                        <span className="font-mono font-bold text-slate-900">0210736266</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <span className="font-bold block text-slate-800 text-xs uppercase mb-1">Xquisite Celebrations</span>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600 text-xs font-medium">GT Bank</span>
                                        <span className="font-mono font-bold text-slate-900">0396426845</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <span className="font-bold block text-slate-800 text-xs uppercase mb-1">Xquisite Celebrations</span>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600 text-xs font-medium">Zenith Bank</span>
                                        <span className="font-mono font-bold text-slate-900">1010951007</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <span className="font-bold block text-slate-800 text-xs uppercase mb-1">Xquisite Cuisine</span>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600 text-xs font-medium">First Bank</span>
                                        <span className="font-mono font-bold text-slate-900">2022655945</span>
                                    </div>
                                </div>
                            </div>

                            <p className="font-bold mb-1">Terms and Conditions:</p>
                            <p className="mb-4">Initial deposit of 70% is to be paid before the event and balance payable immediately after the event. Cancellation of order will result to only a 70% refund of initial deposit made.</p>

                            <p className="font-bold mb-1">Disclaimer:</p>
                            <p>In the event of cancellation of order, it should be communicated to our contact person 48 hours before the event. Failure to do so will mean that initial deposit made has been forfeited.</p>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="p-4 text-white text-center print:hidden" style={{ backgroundColor: activeBrandColor }}>
                    <p className="font-serif italic font-bold text-lg">Bon Apetit. We look forward to serving you again soon.</p>
                </div>
                {/* Print-only footer to ensure color bar appears if background graphics enabled */}
                <div className="hidden print:block p-2 text-white text-center text-xs mt-4 -mx-12 -mb-12" style={{ backgroundColor: activeBrandColor }}>
                    {orgName}
                </div>

            </div>
        </div>
    );
};
