
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDataStore } from '../store/useDataStore';

// Mock the syncWithCloud function to avoid network errors or access checks during tests
(globalThis as any).VITEST = true;
vi.mock('../store/useDataStore', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual as any,
        useDataStore: (actual as any).useDataStore, // Keep the store logic
    };
});

describe('Invoice Generation Verification', () => {
    beforeEach(() => {
        useDataStore.setState({
            inventory: [],
            contacts: [],
            invoices: [],
            cateringEvents: [],
            tasks: [],
            employees: [],
        });

        // Mock the user in auth store if needed, or just rely on default empty state handling in store
        // The store checks useAuthStore.getState().user?.companyId. 
        // We can mock the return value of useAuthStore or just let it be undefined/mocked if the store handles it.
        // Looking at the code: "useAuthStore.getState().user?.companyId || 'org-xquisite'"
        // It has a fallback, so we don't strictly need to mock auth store for this specific test to pass.
    });

    it('should automatically generate an invoice when a catering order is created', async () => {
        const { result } = renderHook(() => useDataStore());

        // Arrange
        const orderDetails = {
            customerName: 'Verification Host',
            eventDate: '2026-12-25',
            guestCount: 150,
            contactId: 'con-test-123',
            items: [
                {
                    inventoryItemId: 'item-1',
                    name: 'Jollof Rice',
                    quantity: 150,
                    priceCents: 250000, // 2,500.00
                    costCents: 100000
                }
            ],
            banquetDetails: {
                eventType: 'Wedding',
                location: 'Grand Hall'
            }
        };

        // Act
        let createdData: any;
        await act(async () => {
            // createCateringOrder is async
            createdData = await result.current.createCateringOrder(orderDetails);
        });

        // Assert
        // 1. Check Event Status
        expect(createdData.event.status).toBe('Confirmed');
        expect(createdData.event.financials.invoiceId).toBeDefined();

        // 2. Check Invoice Existence
        const invoices = result.current.invoices;
        expect(invoices).toHaveLength(1);

        const generatedInvoice = invoices[0];
        expect(generatedInvoice.id).toBe(createdData.event.financials.invoiceId);
        expect(generatedInvoice.type).toBe('Sales');
        expect(generatedInvoice.status).toBe('Unpaid');
        expect(generatedInvoice.totalCents).toBe(150 * 250000); // 37,500,000 cents

        console.log(`\n\n[VERIFICATION SUCCESS] Created Event ID: ${createdData.event.id}`);
        console.log(`[VERIFICATION SUCCESS] Linked Invoice ID: ${generatedInvoice.id}`);
        console.log(`[VERIFICATION SUCCESS] Invoice Total: ${generatedInvoice.totalCents / 100}\n`);
    });
});
