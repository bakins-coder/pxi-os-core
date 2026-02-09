
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDataStore } from '../store/useDataStore';

// Mock the syncWithCloud function to avoid network errors or access checks during tests
(globalThis as any).VITEST = true;

vi.mock('../services/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockReturnThis(),
        })),
    },
    syncTableToCloud: vi.fn().mockResolvedValue({ success: true }),
    pullCloudState: vi.fn().mockResolvedValue([]),
    pullInventoryViews: vi.fn().mockResolvedValue([]),
    postReusableMovement: vi.fn().mockResolvedValue({ success: true }),
    postRentalMovement: vi.fn().mockResolvedValue({ success: true }),
    postIngredientMovement: vi.fn().mockResolvedValue({ success: true }),
    uploadEntityImage: vi.fn().mockResolvedValue({ path: 'test.jpg' }),
    saveEntityMedia: vi.fn().mockResolvedValue({ success: true }),
}));

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
        expect(generatedInvoice.status).toBe('Pro-forma'); // UPDATED EXPECTATION
        expect(generatedInvoice.totalCents).toBe(150 * 250000); // 37,500,000 cents

        console.log(`\n\n[VERIFICATION SUCCESS] Created Event ID: ${createdData.event.id}`);
        console.log(`[VERIFICATION SUCCESS] Linked Invoice ID: ${generatedInvoice.id}`);
        console.log(`[VERIFICATION SUCCESS] Invoice Total: ${generatedInvoice.totalCents / 100}\n`);
    });

    it('should allow finalizing a pro-forma invoice', async () => {
        const { result } = renderHook(() => useDataStore());

        // Arrange: Create an order (which now defaults to PROFORMA)
        const orderDetails = {
            customerName: 'Proforma Test',
            eventDate: '2026-12-25',
            guestCount: 50,
            items: [{ inventoryItemId: 'item-1', name: 'Test Item', quantity: 10, priceCents: 1000, costCents: 500 }],
            banquetDetails: { eventType: 'Test' }
        };

        let createdData: any;
        await act(async () => {
            createdData = await result.current.createCateringOrder(orderDetails);
        });

        const invoiceId = createdData.invoice.id;

        // Verify initial state is PROFORMA
        expect(result.current.invoices.find(i => i.id === invoiceId)?.status).toBe('Pro-forma');

        // Act: Finalize
        await act(async () => {
            await result.current.finalizeProforma(invoiceId);
        });

        // Assert
        const finalizedInvoice = result.current.invoices.find(i => i.id === invoiceId);
        expect(finalizedInvoice?.status).toBe('Unpaid');
        console.log(`[VERIFICATION SUCCESS] Pro-forma Invoice ${invoiceId} finalized to Unpaid.`);
    });

    it('should allow setting line item manual prices and calculating discount', async () => {
        const { result } = renderHook(() => useDataStore());

        // Arrange: Create order with 1 item @ 10,000 unit price
        const orderDetails = {
            customerName: 'Line Item Discount Test',
            eventDate: '2026-12-30',
            guestCount: 1,
            items: [{
                inventoryItemId: 'item-1',
                name: 'Premium Item',
                quantity: 1,
                priceCents: 10000,  // Standard Price
                costCents: 5000
            }],
            banquetDetails: { eventType: 'Test' }
        };

        let createdData: any;
        await act(async () => {
            createdData = await result.current.createCateringOrder(orderDetails);
        });

        const invoiceId = createdData.invoice.id;

        // Act: Apply discount to the line item (Price 10,000 -> 8,000)
        await act(async () => {
            const invoice = result.current.invoices.find(i => i.id === invoiceId);
            if (!invoice) throw new Error("Invoice not found");

            const updatedLines = invoice.lines.map(line => ({
                ...line,
                manualPriceCents: 8000 // Discounted Unit Price
            }));

            await result.current.updateInvoiceLines(invoiceId, updatedLines);
        });

        // Assert
        const updatedInvoice = result.current.invoices.find(i => i.id === invoiceId);

        // 1. Check Subtotals
        expect(updatedInvoice?.subtotalCents).toBe(8000); // 1 * 8000

        // 2. Check Taxes on Discounted Amount
        // SC = 15% of 8000 = 1200
        // VAT = 7.5% of (8000 + 1200) = 690
        // Total = 8000 + 1200 + 690 = 9890
        expect(updatedInvoice?.serviceChargeCents).toBe(1200);
        expect(updatedInvoice?.vatCents).toBe(690);
        expect(updatedInvoice?.totalCents).toBe(9890);

        // 3. Check Standard Totals (Should align with 10,000 price)
        // Std Subtotal = 10000
        // Std SC = 1500
        // Std VAT = 7.5% of 11500 = 862.5 -> 863
        // Std Total = 10000 + 1500 + 863 = 12363
        const expectedStandard = 12363;
        expect(updatedInvoice?.standardTotalCents).toBe(expectedStandard);

        // 4. Check Discount matches expectations
        const expectedDiscount = expectedStandard - 9890; // 2473
        expect(updatedInvoice?.discountCents).toBe(expectedDiscount);

        console.log(`[VERIFICATION SUCCESS] Line Item Discount Applied.`);
        console.log(`[VERIFICATION SUCCESS] Standard: ${expectedStandard / 100}, Actual: ${updatedInvoice?.totalCents / 100}, Discount: ${updatedInvoice?.discountCents / 100}`);
    });
});
