
import { useDataStore } from '../store/useDataStore';
import { Requisition, BankAccount } from '../types';
import { vi, describe, beforeEach, test, expect } from 'vitest';

// Mock global crypto for randomUUID
Object.defineProperty(global, 'crypto', {
    value: {
        randomUUID: () => Math.random().toString(36).substring(7)
    }
});

// Mock supabase
vi.mock('../services/supabase', () => ({
    supabase: {
        from: () => ({
            update: () => ({ eq: () => Promise.resolve({ error: null }) }),
            insert: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        })
    },
    syncTableToCloud: vi.fn(),
    pullCloudState: vi.fn().mockResolvedValue({}),
}));

describe('Requisition Payment Logic', () => {
    beforeEach(() => {
        useDataStore.setState({
            requisitions: [],
            bankAccounts: [],
            bankTransactions: [],
            bookkeeping: [],
            cashAtHandCents: 100000, // 1000 Initial Cash
        });
    });

    test('approveRequisition with Bank Account deducts balance and creates transaction', () => {
        const store = useDataStore.getState();

        // Setup Bank Account
        const bankId = 'bank-1';
        const initialBankBalance = 50000; // 500
        const bankAccount: BankAccount = {
            id: bankId,
            bankName: 'Test Bank',
            accountNumber: '1234567890',
            currency: 'NGN',
            balanceCents: initialBankBalance,
            isActive: true,
            accountName: 'Test Account',
            companyId: 'comp-1',
            lastUpdated: new Date().toISOString()
        };
        store.addBankAccount(bankAccount);

        // Setup Requisition
        const reqId = 'req-1';
        const reqAmount = 5000; // 50
        const requisition: Requisition = {
            id: reqId,
            itemName: 'Test Item',
            quantity: 1,
            pricePerUnitCents: reqAmount,
            totalAmountCents: reqAmount,
            status: 'Pending',
            category: 'Food',
            requestorId: 'user-1',
            dateCreated: new Date().toISOString(),
            companyId: 'comp-1'
        };
        store.addRequisition(requisition);

        // Act: Approve with Bank Account
        store.approveRequisition(reqId, bankId);

        // Assert
        const updatedStore = useDataStore.getState();
        const updatedBank = updatedStore.bankAccounts.find(a => a.id === bankId);
        const updatedReq = updatedStore.requisitions.find(r => r.id === reqId);
        const bankTx = updatedStore.bankTransactions.find(t => t.referenceId === reqId);
        const bookEntry = updatedStore.bookkeeping.find(e => e.referenceId === reqId);

        expect(updatedBank?.balanceCents).toBe(initialBankBalance - reqAmount);
        expect(updatedReq?.status).toBe('Paid');
        expect(updatedReq?.sourceAccountId).toBe(bankId);

        expect(bankTx).toBeDefined();
        expect(bankTx?.amountCents).toBe(reqAmount);
        expect(bankTx?.type).toBe('Outflow');

        expect(bookEntry).toBeDefined();
        expect(bookEntry?.paymentMethod).toBe('Bank Transfer');
    });

    test('approveRequisition with Cash deducts cashAtHand and creates bookkeeping entry', () => {
        const store = useDataStore.getState();
        const initialCash = store.cashAtHandCents;

        // Setup Requisition
        const reqId = 'req-cash-1';
        const reqAmount = 2000; // 20
        const requisition: Requisition = {
            id: reqId,
            itemName: 'Cash Item',
            quantity: 1,
            pricePerUnitCents: reqAmount,
            totalAmountCents: reqAmount,
            status: 'Pending',
            category: 'Hardware',
            requestorId: 'user-1',
            dateCreated: new Date().toISOString(),
            companyId: 'comp-1'
        };
        store.addRequisition(requisition);

        // Act: Approve with Cash
        store.approveRequisition(reqId, 'cash');

        // Assert
        const updatedStore = useDataStore.getState();
        const updatedReq = updatedStore.requisitions.find(r => r.id === reqId);
        const bookEntry = updatedStore.bookkeeping.find(e => e.referenceId === reqId);

        expect(updatedStore.cashAtHandCents).toBe(initialCash - reqAmount);
        expect(updatedReq?.status).toBe('Paid');
        expect(updatedReq?.sourceAccountId).toBe('cash');

        expect(bookEntry).toBeDefined();
        expect(bookEntry?.paymentMethod).toBe('Cash');
        expect(bookEntry?.type).toBe('Outflow');
    });
});
