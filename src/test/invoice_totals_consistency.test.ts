import { describe, it, expect } from 'vitest';
import { calculateInvoiceTotals, getInvoiceBankDetails, generateInvoicePDF } from '../utils/exportUtils';
import { Invoice, InvoiceStatus } from '../types';

describe('Invoice Totals & Bank Details Consistency', () => {
    const mockCateringInvoice: Invoice = {
        id: 'inv-test-100',
        number: 'INV-100',
        date: '2026-07-27',
        dueDate: '2026-07-27',
        contactId: 'con-1',
        customerName: 'Xquisite Celebrations Limited',
        type: 'Sales',
        status: InvoiceStatus.UNPAID,
        category: 'Catering',
        lines: [
            { id: 'l1', description: 'Nigerian Menu - Option A', quantity: 50, unitPriceCents: 1050000 },
            { id: 'l2', description: 'Nigerian Option E - Amala', quantity: 30, unitPriceCents: 1050000 }
        ],
        totalCents: 0,
        paidAmountCents: 0,
        createdAt: '2026-07-27T00:00:00Z',
        updatedAt: '2026-07-27T00:00:00Z'
    };

    const mockSettings = {
        name: 'Xquisite Celebrations Limited',
        type: 'Catering',
        brandColor: '#F47C20'
    };

    it('calculates service charge (15%), VAT (7.5%), and total amount correctly for catering invoices', () => {
        const totals = calculateInvoiceTotals(mockCateringInvoice, mockSettings);

        // Subtotal = (50 * 10,500) + (30 * 10,500) = 525,000 + 315,000 = 840,000 (84,000,000 cents)
        expect(totals.subtotalCents).toBe(84000000);
        
        // SC = 15% of 840,000 = 126,000 (12,600,000 cents)
        expect(totals.serviceChargeCents).toBe(12600000);

        // VAT = 7.5% of (840,000 + 126,000 = 966,000) = 72,450 (7,245,000 cents)
        expect(totals.vatCents).toBe(7245000);

        // Total = 840,000 + 126,000 + 72,450 = 1,038,450 (103,845,000 cents)
        expect(totals.totalCents).toBe(103845000);
        expect(totals.balanceDueCents).toBe(103845000);
    });

    it('returns consistent default bank details when bankAccounts store is empty', () => {
        const bankDetails = getInvoiceBankDetails([], mockSettings);

        expect(bankDetails).toHaveLength(2);
        expect(bankDetails[0].bank).toBe('GTBank');
        expect(bankDetails[0].acc).toBe('0396426845');
        expect(bankDetails[1].bank).toBe('Zenith Bank');
        expect(bankDetails[1].acc).toBe('1010951007');
    });

    it('returns provided bank accounts when bankAccounts list is present', () => {
        const customAccounts = [
            { accountName: 'Test Org', bankName: 'FirstBank', accountNumber: '999888777' }
        ];
        const bankDetails = getInvoiceBankDetails(customAccounts, mockSettings);

        expect(bankDetails).toHaveLength(1);
        expect(bankDetails[0].bank).toBe('FirstBank');
        expect(bankDetails[0].acc).toBe('999888777');
    });
});
