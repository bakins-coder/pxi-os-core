import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDataStore } from '../store/useDataStore';

describe('useDataStore', () => {
    beforeEach(() => {
        // Reset store before each test
        useDataStore.setState({
            inventory: [],
            contacts: [],
            invoices: [],
            cateringEvents: [],
            tasks: [],
            employees: [],
            syncStatus: 'Synced',
            isSyncing: false,
            lastSyncError: null,
            realtimeStatus: 'Disconnected',
            realtimeChannel: null,
        });
    });

    describe('Contact Management', () => {
        it('should add a new contact', () => {
            const { result } = renderHook(() => useDataStore());

            act(() => {
                result.current.addContact({
                    name: 'Test Customer',
                    type: 'Company',
                    email: 'test@example.com',
                    phone: '+1234567890',
                    sentimentScore: 0.5,
                });
            });

            expect(result.current.contacts).toHaveLength(1);
            expect(result.current.contacts[0].name).toBe('Test Customer');
            expect(result.current.contacts[0].email).toBe('test@example.com');
        });

        it('should delete a contact', () => {
            const { result } = renderHook(() => useDataStore());

            // Add a contact first
            act(() => {
                result.current.addContact({
                    id: 'test-id',
                    name: 'Test Customer',
                    type: 'Individual',
                    email: 'test@example.com',
                });
            });

            expect(result.current.contacts).toHaveLength(1);

            // Delete the contact
            act(() => {
                result.current.deleteContact('test-id');
            });

            expect(result.current.contacts).toHaveLength(0);
        });
    });

    describe('Invoice Management', () => {
        it('should add a new in invoice', () => {
            const { result } = renderHook(() => useDataStore());

            const testInvoice = {
                id: 'inv-001',
                number: 'INV-001',
                companyId: 'org-test',
                date: '2026-01-09',
                dueDate: '2026-02-09',
                status: 'Unpaid' as any,
                type: 'Sales' as any,
                lines: [],
                totalCents: 100000,
                paidAmountCents: 0,
            };

            act(() => {
                result.current.addInvoice(testInvoice);
            });

            expect(result.current.invoices).toHaveLength(1);
            expect(result.current.invoices[0].number).toBe('INV-001');
            expect(result.current.invoices[0].totalCents).toBe(100000);
        });

        it('should record payment on an invoice and update bank balance', () => {
            const { result } = renderHook(() => useDataStore());

            const bankAccountId = 'ba-test';
            const testInvoice = {
                id: 'inv-001',
                number: 'INV-001',
                companyId: 'org-test',
                date: '2026-01-09',
                dueDate: '2026-02-09',
                status: 'Unpaid' as any,
                type: 'Sales' as any,
                lines: [],
                totalCents: 100000,
                paidAmountCents: 0,
            };

            act(() => {
                useDataStore.setState({
                    invoices: [testInvoice],
                    bankAccounts: [{
                        id: bankAccountId,
                        companyId: 'org-test',
                        bankName: 'Test Bank',
                        accountName: 'Test Account',
                        accountNumber: '123',
                        currency: 'NGN',
                        balanceCents: 10000,
                        isActive: true,
                        lastUpdated: new Date().toISOString()
                    } as any],
                    bankTransactions: []
                });
            });

            act(() => {
                result.current.recordPayment('inv-001', 50000, bankAccountId);
            });

            expect(result.current.invoices[0].paidAmountCents).toBe(50000);
            expect(result.current.bankAccounts[0].balanceCents).toBe(60000); // 10000 + 50000
            expect(result.current.bankTransactions).toHaveLength(1);
            expect(result.current.bankTransactions[0].amountCents).toBe(50000);
        });
    });

    describe('Sync Status', () => {
        it('should initialize with Synced status', () => {
            const { result } = renderHook(() => useDataStore());
            expect(result.current.syncStatus).toBe('Synced');
            expect(result.current.isSyncing).toBe(false);
        });
    });

    describe('Real-time Status', () => {
        it('should initialize with Disconnected realtime status', () => {
            const { result } = renderHook(() => useDataStore());
            expect(result.current.realtimeStatus).toBe('Disconnected');
            expect(result.current.realtimeChannel).toBe(null);
        });
    });

    describe('Rental Management', () => {
        it('should issue a rental item and decrement stock', () => {
            const { result } = renderHook(() => useDataStore());

            // Setup
            const itemId = 'item-rental-1';
            const eventId = 'evt-1';

            act(() => {
                // Seed Inventory
                useDataStore.setState({
                    inventory: [{
                        id: itemId,
                        name: 'Chair',
                        type: 'reusable',
                        category: 'Furniture',
                        stockQuantity: 100,
                        priceCents: 5000,
                        companyId: 'org-1'
                    } as any],
                    cateringEvents: [{
                        id: eventId,
                        customerName: 'Test Event',
                        eventDate: '2026-02-01',
                        guestCount: 50,
                        status: 'Confirmed'
                    } as any]
                });
            });

            // Action
            act(() => {
                result.current.issueRental(eventId, itemId, 10, 'In-House');
            });

            // Assert
            expect(result.current.inventory[0].stockQuantity).toBe(90); // 100 - 10
            expect(result.current.rentalLedger).toHaveLength(1);
            expect(result.current.rentalLedger[0].status).toBe('Issued');
            expect(result.current.rentalLedger[0].quantity).toBe(10);
        });

        it('should return a rental item and increment stock', () => {
            const { result } = renderHook(() => useDataStore());
            const itemId = 'item-rental-1';
            const eventId = 'evt-1';
            const rentalId = 'rent-1';

            act(() => {
                useDataStore.setState({
                    inventory: [{
                        id: itemId,
                        name: 'Chair',
                        type: 'reusable',
                        stockQuantity: 90,
                        priceCents: 5000,
                        companyId: 'org-1'
                    } as any],
                    rentalLedger: [{
                        id: rentalId,
                        requisitionId: 'req-1',
                        eventId: eventId,
                        itemName: 'Chair',
                        quantity: 10,
                        estimatedReplacementValueCents: 50000,
                        rentalVendor: 'In-House',
                        status: 'Issued',
                        dateIssued: new Date().toISOString()
                    }]
                });
            });

            // Action
            act(() => {
                result.current.returnRental(rentalId, 'Returned');
            });

            // Assert
            expect(result.current.inventory[0].stockQuantity).toBe(100); // 90 + 10
            expect(result.current.rentalLedger[0].status).toBe('Returned');
        });
    });

    describe('Stock Management', () => {
        it('should receive food stock and average the cost', () => {
            const { result } = renderHook(() => useDataStore());
            const ingId = 'ing-1';

            act(() => {
                useDataStore.setState({
                    ingredients: [{
                        id: ingId,
                        name: 'Rice',
                        unit: 'kg',
                        currentCostCents: 1000, // Old cost
                        stockLevel: 10,
                        category: 'Grains',
                        lastUpdated: '2026-01-01',
                        companyId: 'org-1'
                    }] as any,
                    inventory: [{
                        id: ingId,
                        name: 'Rice',
                        type: 'ingredient',
                        stockQuantity: 10, // Synced with stockLevel
                        priceCents: 1000,
                        category: 'Grains',
                        companyId: 'org-1'
                    } as any]
                });
            });

            // Action: Buy 10kg at 2000 cents/kg
            // Weighted Average: (10*1000 + 10*2000) / 20 = 30000 / 20 = 1500
            act(() => {
                result.current.receiveFoodStock(ingId, 10, 20000); // 10 qty, 20000 total cost
            });

            // Assert
            const updatedIng = result.current.ingredients.find(i => i.id === ingId);
            const updatedInv = result.current.inventory.find(i => i.id === ingId);

            expect(updatedIng?.stockLevel).toBe(20);
            expect(updatedIng?.currentCostCents).toBe(1500); // Averaged
            expect(updatedInv?.stockQuantity).toBe(20);
        });
    });
});
