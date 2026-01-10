
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrderBrochure } from './OrderBrochure';
import { Invoice, Role } from '../types';
import { ChevronLeft, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }
    componentDidCatch(error: any, errorInfo: any) {
        console.error("Uncaught error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 text-center">
                    <h2 className="text-xl font-bold text-rose-600 mb-2">Something went wrong</h2>
                    <pre className="text-xs bg-slate-100 p-4 rounded text-left overflow-auto max-w-lg mx-auto">{this.state.error?.toString()}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

export const PublicBrochure = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [successInvoice, setSuccessInvoice] = useState<Invoice | null>(null);

    const handleBack = () => {
        if (user) {
            if (user.role === Role.CUSTOMER) navigate('/customer-portal');
            else navigate('/');
        } else {
            navigate('/login');
        }
    };

    const handleFinalize = (invoice: Invoice) => {
        setSuccessInvoice(invoice);
    };

    if (successInvoice) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-2xl max-w-lg text-center space-y-6">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-in zoom-in">
                        <CheckCircle size={40} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Request Received!</h2>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                            We have received your banquet request. <br />
                            Reference: <span className="text-indigo-600 font-mono">{successInvoice.number}</span>
                        </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-left space-y-2">
                        <p className="font-bold text-slate-600 uppercase">Next Steps:</p>
                        <ul className="list-disc list-inside text-slate-500 font-medium">
                            <li>Our team will review availability.</li>
                            <li>You will receive a formal quote via email.</li>
                            <li>A dedicated event planner will contact you.</li>
                        </ul>
                    </div>
                    <button onClick={handleBack} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg">
                        Return to Hub
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex flex-col">
            <div className="max-w-7xl mx-auto w-full mb-6 flex items-center gap-4">
                <button onClick={handleBack} className="p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-slate-600 hover:text-slate-900">
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Event Studio</h1>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Guest Access Mode</p>
                </div>
            </div>

            <div className="flex-1 flex justify-center">
                <ErrorBoundary>
                    <OrderBrochure
                        onComplete={handleBack}
                        onFinalize={handleFinalize}
                    />
                </ErrorBoundary>
            </div>
        </div>
    );
};
