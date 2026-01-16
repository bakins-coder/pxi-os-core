import React from 'react';
import { Printer, Download, Mail, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const InvoicePrototype = () => {
    const navigate = useNavigate();

    // Mock Data based on the PDF
    const invoiceData = {
        number: "166",
        date: "April 27, 2019",
        paymentDue: "April 27, 2019",
        status: "Overdue",
        amountDue: 214000.00,
        customer: {
            name: "Finess event",
            email: "finess.event@yahoo.com"
        },
        items: [
            {
                description: "Nigerian & Chinese Cuisine\nXquisite Jollof rice, Xquisite4 special fried rice served with roast chicken in peppered sauce, stewed beef, moimoi, plantain or vegetable salad",
                quantity: 100,
                price: 3500.00,
                amount: 350000.00
            },
            {
                description: "Locally grown ofada rice served with designer stew, fried fish, plantain or moimoi",
                quantity: "",
                price: "",
                amount: ""
            },
            {
                description: "Poundo/Efo/Egusi/Assorted",
                quantity: "",
                price: "",
                amount: ""
            },
            {
                description: "Seafood okro served with poundo yam",
                quantity: "",
                price: "",
                amount: ""
            },
            {
                description: "Amala served with gbegiri and ewedu with assorted meat",
                quantity: "",
                price: "",
                amount: ""
            },
            {
                description: "Xquisite special Fried rice served with singa poren noodles/chill prawn/lamb spare ribs/ vegetables",
                quantity: "",
                price: "",
                amount: ""
            },
            {
                description: "Panla",
                quantity: "",
                price: "",
                amount: ""
            }
        ],
        subtotal: 350000.00,
        serviceCharge: 52500.00,
        total: 402500.00,
        paid: 188500.00,
        balance: 214000.00
    };

    return (
        <div className="min-h-screen bg-slate-100 p-8 font-sans">
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
                    <button className="flex items-center gap-2 px-6 py-2 bg-[#ff6b6b] text-white rounded-full shadow-md font-bold hover:bg-[#ff5252] transition-all">
                        <Download size={18} /> Download PDF
                    </button>
                </div>
            </div>

            {/* Invoice Container */}
            <div className="max-w-4xl mx-auto bg-white shadow-2xl overflow-hidden print:shadow-none print:max-w-none">

                {/* Header */}
                <div className="p-12 pb-8">
                    <div className="flex justify-between items-start">
                        {/* Logo / Brand Area */}
                        <div>
                            <div className="flex items-center gap-2">
                                {/* Simulated Logo Icon based on "Xquisite" shapes */}
                                <div className="relative w-16 h-12">
                                    <div className="absolute top-0 left-0 w-full h-full">
                                        <svg viewBox="0 0 100 60" className="w-full h-full text-[#ff6b6b] fill-current">
                                            <path d="M10,10 Q50,0 90,10 L80,20 Q50,15 20,20 Z" fill="#FFA000" />
                                            <path d="M10,25 Q50,15 90,25 L80,35 Q50,30 20,35 Z" fill="#ff6b6b" />
                                            <circle cx="25" cy="30" r="8" fill="#D32F2F" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-4xl font-serif text-[#e65100] tracking-tight">XQUISITE</h1>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 italic mt-1 ml-1">For the discerning taste buds</p>
                        </div>

                        {/* Company Address */}
                        <div className="text-right text-xs text-slate-600 leading-relaxed font-medium">
                            <p className="font-bold text-slate-800">Xquisite Celebrations Ltd</p>
                            <p>23 Primrose Drive,</p>
                            <p>Pinnock Beach Est,</p>
                            <p>Lekki, Lagos</p>
                            <p>Nigeria</p>
                            <p className="mt-2">Phone: 0814 990 6777</p>
                            <p>Mobile: 0802 802 5333</p>
                            <p className="text-[#ff6b6b]">www.xquisitegroup.com</p>
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
                        <p className="font-bold text-slate-800 text-lg">{invoiceData.customer.name}</p>
                        <p className="text-slate-600">{invoiceData.customer.name}</p>
                        <p className="text-slate-500 text-sm mt-1">{invoiceData.customer.email}</p>
                    </div>

                    <div className="flex flex-col items-end">
                        {/* Stamp-like border for "Invoice" */}
                        <div className="border-2 border-[#D32F2F] px-8 py-2 rounded-lg mb-6 transform rotate-[-2deg]">
                            <h2 className="text-3xl font-serif text-[#D32F2F] uppercase tracking-widest">Invoice</h2>
                        </div>

                        <div className="w-full max-w-xs space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-bold text-slate-600">Invoice Number:</span>
                                <span className="font-medium text-slate-900">{invoiceData.number}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="font-bold text-slate-600">Invoice Date:</span>
                                <span className="font-medium text-slate-900">{invoiceData.date}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="font-bold text-slate-600">Payment Due:</span>
                                <span className="font-medium text-slate-900">{invoiceData.paymentDue}</span>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 p-2 rounded">
                                <span className="font-bold text-slate-600">Amount Due (NGN):</span>
                                <span className="font-black text-xl text-slate-900">₦{invoiceData.balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="p-12 pt-0">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-slate-100">
                                <th className="text-left py-4 text-sm font-bold text-slate-600 uppercase w-3/5">Items</th>
                                <th className="text-center py-4 text-sm font-bold text-slate-600 uppercase">Quantity</th>
                                <th className="text-right py-4 text-sm font-bold text-slate-600 uppercase">Price</th>
                                <th className="text-right py-4 text-sm font-bold text-slate-600 uppercase">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {invoiceData.items.map((item, index) => (
                                <tr key={index} className="group hover:bg-slate-50/50">
                                    <td className="py-6 pr-8 align-top">
                                        <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap leading-relaxed">{item.description}</p>
                                    </td>
                                    <td className="py-6 text-center align-top text-sm font-medium text-slate-600">{item.quantity}</td>
                                    <td className="py-6 text-right align-top text-sm font-medium text-slate-600">
                                        {item.price ? `₦${item.price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}` : ''}
                                    </td>
                                    <td className="py-6 text-right align-top text-sm font-bold text-slate-800">
                                        {item.amount ? `₦${item.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}` : ''}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={2}></td>
                                <td className="pt-8 text-right font-bold text-slate-600 text-sm">Subtotal:</td>
                                <td className="pt-8 text-right font-bold text-slate-800 text-sm">₦{invoiceData.subtotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                                <td colSpan={2}></td>
                                <td className="pt-2 text-right font-bold text-slate-600 text-sm">Serv Ch 15%:</td>
                                <td className="pt-2 text-right font-bold text-slate-800 text-sm">₦{invoiceData.serviceCharge.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                                <td colSpan={2}></td>
                                <td className="pt-4 pb-4 border-b border-slate-200 text-right font-black text-slate-800 text-base">Total:</td>
                                <td className="pt-4 pb-4 border-b border-slate-200 text-right font-black text-slate-800 text-base">₦{invoiceData.total.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                                <td colSpan={2}></td>
                                <td className="pt-4 text-right font-medium text-slate-500 text-xs">Payment on April 29, 2019 using a bank payment:</td>
                                <td className="pt-4 text-right font-medium text-slate-800 text-xs">₦{invoiceData.paid.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                                <td colSpan={2}></td>
                                <td className="pt-4 text-right font-black text-slate-900 text-lg uppercase">Amount Due (NGN):</td>
                                <td className="pt-4 text-right font-black text-slate-900 text-lg">₦{invoiceData.balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Footer Section: Notes & Terms */}
                <div className="p-12 pt-4 grid grid-cols-1 gap-8">
                    <div>
                        <h4 className="font-bold text-slate-800 mb-2 text-sm">Notes / Terms</h4>
                        <div className="text-xs text-slate-600 leading-relaxed">
                            <p className="mb-4">Thank you for your patronage. Please make all payment transfers to:<br />
                                <span className="font-bold text-slate-800">Xquisite Celebrations Ltd.</span></p>

                            <p className="font-bold underline mb-1">Banks:-</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-6">
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded">
                                    <span className="font-bold block text-slate-700">GTB</span>
                                    <span className="font-mono">0396426845</span>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded">
                                    <span className="font-bold block text-slate-700">UBA</span>
                                    <span className="font-mono">1021135344</span>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded">
                                    <span className="font-bold block text-slate-700">Zenith</span>
                                    <span className="font-mono">1010951007</span>
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
                <div className="p-4 bg-[#D32F2F] text-white text-center">
                    <p className="font-serif italic font-bold text-lg">Bon Apetit. We look forward to serving you again soon.</p>
                </div>

            </div>
        </div>
    );
};
