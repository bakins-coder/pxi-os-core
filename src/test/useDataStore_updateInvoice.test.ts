
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDataStore } from '../store/useDataStore';
import { InvoiceStatus } from '../types';

describe('useDataStore - updateInvoiceLines', () => {
    beforeEach(() => {
        useDataStore.setState({
            invoices: [
                {
                    id: 'inv-1',
                    number: 'INV-1',
                    companyId: 'co-1',
                    contactId: 'con-1',
                    date: '2026-03-01',
                    dueDate: '2026-03-15',
                    status: InvoiceStatus.UNPAID,
                    type: 'Sales',
                    totalCents: 115000,
                    subtotalCents: 100000,
                    serviceChargeCents: 0,
                    vatCents: 0,
                    paidAmountCents: 0,
                    lines: [
                        { id: 'line-1', description: 'Cuisine Item', quantity: 1, unitPriceCents: 100000 }
                    ]
                }
            ],
            contacts: [{ id: 'con-1', name: 'Test Contact', email: '', phone: '', type: 'Individual' }]
        });
    });

    it('should skip taxes when isCuisine is true', async () => {
        const { result } = renderHook(() => useDataStore());

        const newLines = [
            { id: 'line-1', description: 'Cuisine Item Updated', quantity: 2, unitPriceCents: 100000 }
        ];

        await act(async () => {
            await result.current.updateInvoiceLines('inv-1', newLines as any, undefined, true);
        });

        const invoice = result.current.invoices[0];
        expect(invoice.subtotalCents).toBe(200000);
        expect(invoice.serviceChargeCents).toBe(0);
        expect(invoice.vatCents).toBe(0);
        expect(invoice.totalCents).toBe(200000);
    });

    it('should skip taxes if existing invoice has 0 taxes and is not a banquet', async () => {
        const { result } = renderHook(() => useDataStore());

        const newLines = [
            { id: 'line-1', description: 'Cuisine Item Updated', quantity: 3, unitPriceCents: 100000 }
        ];

        // NOT passing isCuisine here, should be inferred
        await act(async () => {
            await result.current.updateInvoiceLines('inv-1', newLines as any);
        });

        const invoice = result.current.invoices[0];
        expect(invoice.subtotalCents).toBe(300000);
        expect(invoice.serviceChargeCents).toBe(0);
        expect(invoice.vatCents).toBe(0);
        expect(invoice.totalCents).toBe(300000);
    });

    it('should include taxes for banquet-like updates if not flagged as cuisine', async () => {
        const { result } = renderHook(() => useDataStore());

        // Update to a banquet-like structure (includes [SECTION])
        const newLines = [
            { id: 'line-1', description: '[SECTION] Catering Service', quantity: 1, unitPriceCents: 100000 }
        ];

        await act(async () => {
            await result.current.updateInvoiceLines('inv-1', newLines as any);
        });

        const invoice = result.current.invoices[0];
        expect(invoice.subtotalCents).toBe(100000);
        expect(invoice.serviceChargeCents).toBe(15000);
        expect(invoice.vatCents).toBe(Math.round((100000 + 15000) * 0.075));
    });
});
