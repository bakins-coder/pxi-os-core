import { BookkeepingEntry } from '../types';

export const getNetBurnRate = (entries: BookkeepingEntry[]): number => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter for expense entries in the current month
    const monthlyExpenses = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return (
            entry.type === 'Outflow' &&
            entryDate.getMonth() === currentMonth &&
            entryDate.getFullYear() === currentYear
        );
    });

    return monthlyExpenses.reduce((sum, entry) => sum + entry.amountCents, 0);
};

export const getRunwayMonths = (currentBalanceCents: number, monthlyBurnRateCents: number): number => {
    if (monthlyBurnRateCents <= 0) return 0;
    return Math.round((currentBalanceCents / monthlyBurnRateCents) * 10) / 10;
};
