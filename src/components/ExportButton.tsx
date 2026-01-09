import React from 'react';
import { Download } from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { exportFinancialDataToExcel, exportComprehensiveReport } from '../utils/exportUtils';

export const ExportButton: React.FC<{ type: 'financial' | 'comprehensive' }> = ({ type }) => {
    const { invoices, bookkeeping, employees, contacts } = useDataStore();

    const handleExport = () => {
        if (type === 'financial') {
            exportFinancialDataToExcel(invoices, bookkeeping, `financial-report-${new Date().toISOString().split('T')[0]}.xlsx`);
        } else {
            exportComprehensiveReport({ invoices, bookkeeping, employees, contacts });
        }
    };

    return (
        <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg"
        >
            <Download size={16} />
            Export Excel
        </button>
    );
};
