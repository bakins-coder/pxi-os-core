
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Finance } from '../components/Finance';
import { useAuthStore } from '../store/useAuthStore';
import { useDataStore } from '../store/useDataStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Role } from '../types';
import React from 'react';

// Set VITEST flag
(globalThis as any).VITEST = true;

// Mock Supabase/Sync
vi.mock('../services/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
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
}));

// Mock AI
vi.mock('../services/ai', () => ({
    getCFOAdvice: vi.fn().mockResolvedValue({ summary: 'Test', sentiment: 'Healthy' }),
    suggestCOAForTransaction: vi.fn()
}));

// Mock icons
vi.mock('lucide-react', () => ({
    Banknote: () => <div />, ArrowDownLeft: () => <div />, FileText: () => <div />, Zap: () => <div />,
    BookOpen: () => <div />, Landmark: () => <div />, FileSpreadsheet: () => <div />, Bot: () => <div />,
    ShieldAlert: () => <div />, Cloud: () => <div />, ShieldCheck: () => <div />, Eye: () => <div />,
    Receipt: () => <div />, TrendingUp: () => <div />, TrendingDown: () => <div />, ShoppingBag: () => <div />,
    Users: () => <div />, Clock: () => <div />, Check: () => <div />, AlertTriangle: () => <div />,
    X: () => <div />, Plus: () => <div />, Minimize2: () => <div />, Maximize2: () => <div />,
    ArrowRight: () => <div />, Download: () => <div />, Activity: () => <div />, CheckCircle2: () => <div />,
    ChevronRight: () => <div />, RefreshCw: () => <div />
}));

// Mock sub-components
vi.mock('./FinancialReports', () => ({ FinancialReports: () => <div data-testid="reports">FinancialReports</div> }));
vi.mock('./ManualEntryModal', () => ({ ManualEntryModal: () => <div data-testid="entry-modal">ManualEntryModal</div> }));
vi.mock('./ManualInvoiceModal', () => ({ ManualInvoiceModal: () => <div data-testid="invoice-modal">ManualInvoiceModal</div> }));
vi.mock('./CustomerStatementModal', () => ({ CustomerStatementModal: () => <div data-testid="statement-modal">CustomerStatementModal</div> }));

describe('Requisition Approval Security Verification', () => {
    const mockRequisition = {
        id: 'req-test-1',
        itemName: 'Verification Item',
        quantity: 5,
        pricePerUnitCents: 50000,
        totalAmountCents: 250000,
        status: 'Pending',
        type: 'Purchase',
        category: 'Equipment'
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Use setState with act to ensure stability
        act(() => {
            useDataStore.setState({
                invoices: [],
                bookkeeping: [],
                requisitions: [mockRequisition],
                chartOfAccounts: [],
                bankStatementLines: [],
                departmentMatrix: [],
                contacts: [],
                syncWithCloud: vi.fn(),
                approveRequisition: vi.fn(),
                updateRequisition: vi.fn()
            });

            useSettingsStore.setState({
                settings: {
                    brandColor: '#ff6b6b',
                    name: 'Test Org'
                } as any,
                cloudEnabled: true,
                isDemoMode: false
            });
        });
    });

    it('should permit CEO to view and trigger requisition approval', async () => {
        act(() => {
            useAuthStore.setState({
                user: {
                    id: 'ceo-1',
                    role: Role.CEO,
                    companyId: 'org-123',
                    name: 'CEO User',
                    email: 'ceo@test.com',
                    permissionTags: ['*']
                } as any
            });
        });

        render(<Finance />);

        // Search for tab button
        // The tab buttons should be visible for CEO because of Role bypass in hasPermission
        const tabs = screen.getAllByRole('button');
        const reqTab = tabs.find(t => t.textContent?.includes('Spend Matrix'));

        if (!reqTab) {
            console.log('CEO Tabs:', tabs.map(t => t.textContent).join(', '));
            throw new Error('Spend Matrix tab not found for CEO');
        }

        fireEvent.click(reqTab);

        // Verify "Approve" button is visible for CEO
        expect(screen.getByTestId('approve-btn-req-test-1')).toBeDefined();

        // Click to open modal
        const reqItem = screen.getByText(/Verification Item/i);
        fireEvent.click(reqItem);

        // Verify Modal "Approve & Log" is visible
        expect(screen.getByTestId('modal-approve-btn')).toBeDefined();
    });

    it('should block non-finance MANAGER from accessing requisition approval', async () => {
        act(() => {
            useAuthStore.setState({
                user: {
                    id: 'mgr-1',
                    role: Role.MANAGER,
                    companyId: 'org-123',
                    name: 'Mgr User',
                    email: 'mgr@test.com',
                    permissionTags: []
                } as any
            });
        });

        render(<Finance />);

        // Find tab
        const tabs = screen.getAllByRole('button');
        const reqTab = tabs.find(t => t.textContent?.includes('Spend Matrix'));

        // If Manager doesn't even have access to the tab, that's also correct (even better security)
        if (reqTab) {
            fireEvent.click(reqTab);
            // Verify "Approve" button is HIDDEN
            expect(screen.queryByTestId('approve-btn-req-test-1')).toBeNull();

            // Click to open modal
            const reqItem = screen.getByText(/Verification Item/i);
            fireEvent.click(reqItem);
            expect(screen.queryByTestId('modal-approve-btn')).toBeNull();
        } else {
            console.log('Manager has no access to Requisitions tab (Correct)');
        }
    });

    it('should permit FINANCE role to access requisition approval', async () => {
        act(() => {
            useAuthStore.setState({
                user: {
                    id: 'fin-1',
                    role: Role.FINANCE,
                    companyId: 'org-123',
                    name: 'Fin User',
                    email: 'fin@test.com',
                    permissionTags: ['access:finance_bookkeeping']
                } as any
            });
        });

        render(<Finance />);

        const tabs = screen.getAllByRole('button');
        const reqTab = tabs.find(t => t.textContent?.includes('Spend Matrix'));

        if (!reqTab) {
            console.log('Finance Tabs:', tabs.map(t => t.textContent).join(', '));
            throw new Error('Spend Matrix tab not found for Finance');
        }

        fireEvent.click(reqTab);

        // Verify visibility for Finance
        expect(screen.getByTestId('approve-btn-req-test-1')).toBeDefined();
    });
});
