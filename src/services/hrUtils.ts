
import { Employee, PayrollItem } from '../types';

export const calculatePayrollForEmployee = (employee: Employee): PayrollItem => {
    const grossCents = employee.salaryCents;

    // Standard breakdown (approximate for Nigerian payroll context usually)
    // Basic: 50%, Housing: 25%, Transport: 15%, Other: 10%
    const basicCents = Math.round(grossCents * 0.5);
    const housingCents = Math.round(grossCents * 0.25);
    const transportCents = Math.round(grossCents * 0.15);

    // Statutory Deductions
    // Pension: 8% of (Basic + Housing + Transport)
    const pensionEmployeeCents = Math.round((basicCents + housingCents + transportCents) * 0.08);
    const pensionEmployerCents = Math.round((basicCents + housingCents + transportCents) * 0.10); // Employer usually 10%

    // NHF: 2.5% of Basic
    const nhfCents = Math.round(basicCents * 0.025);

    // Tax (PAYE) - Simplified progressive tax or flat estimate for now to fix build
    // Assuming effective tax rate of approx 15% after reliefs for testing
    const taxableIncome = grossCents - pensionEmployeeCents - nhfCents;
    const taxCents = Math.round(taxableIncome * 0.15);

    const totalDeductions = pensionEmployeeCents + nhfCents + taxCents;
    const netCents = grossCents - totalDeductions;

    const anomalies: string[] = [];
    if (netCents < 0) {
        anomalies.push('Negative Net Pay');
    }

    return {
        id: `pay-${employee.id}-${new Date().getMonth()}`,
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        grossCents,
        basicCents,
        housingCents,
        transportCents,
        pensionEmployeeCents,
        pensionEmployerCents,
        taxCents,
        nhfCents,
        netCents,
        anomalies
    };
};

export const formatSalary = (cents: number): string => {
    // Convert cents to Naira
    const naira = cents / 100;

    // If >= 1,000,000, format as Millions (M)
    if (naira >= 1000000) {
        // e.g. 5,000,000 -> 5M
        // e.g. 7,500,000 -> 7.5M
        const millions = naira / 1000000;
        // Check if integer to avoid .0
        return Number.isInteger(millions) ? `${millions}M` : `${millions.toFixed(1)}M`;
    }

    // Otherwise format as Thousands (k)
    // e.g. 150,000 -> 150k
    return `${(naira / 1000).toLocaleString()}k`;
};
