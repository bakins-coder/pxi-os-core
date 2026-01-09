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

        it('should record payment on an invoice', () => {
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

            act(() => {
                result.current.recordPayment('inv-001', 50000);
            });

            expect(result.current.invoices[0].paidAmountCents).toBe(50000);
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
});
