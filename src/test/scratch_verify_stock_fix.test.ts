import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import { Role } from '../types';

// Mock supabase and services
vi.mock('../services/supabase', () => {
    const mockBuilder: any = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn(),
    };

    // Make it thenable
    mockBuilder.then = vi.fn().mockImplementation((fn) => {
        return Promise.resolve(fn({ data: [{ id: 'loc-1' }], error: null }));
    });

    return {
        supabase: mockBuilder,
        postIngredientMovement: vi.fn().mockResolvedValue({}),
        syncTableToCloud: vi.fn().mockResolvedValue({}),
        pullCloudState: vi.fn().mockResolvedValue([]),
        mapIncomingRow: (table: string, row: any) => row,
        pullInventoryViews: vi.fn().mockResolvedValue([]),
    };
});

describe('approveRequisition Release Logic', () => {
    beforeEach(() => {
        useDataStore.getState().reset();
        vi.clearAllMocks();

        // Setup initial state
        useDataStore.setState({
            ingredients: [
                { id: 'ing-1', name: 'Spaghetti', stockLevel: 10, unit: 'pkts', companyId: 'org-1', currentCostCents: 100, lastUpdated: '', unitId: 'unit-1', category: 'Food' }
            ],
            requisitions: [
                { 
                    id: 'req-1', 
                    type: 'Release', 
                    ingredientId: 'ing-1', 
                    quantity: 2, 
                    status: 'Pending', 
                    requestorId: 'user-1', 
                    itemName: 'Release: Spaghetti',
                    category: 'Food',
                    pricePerUnitCents: 100,
                    totalAmountCents: 200,
                    createdAt: new Date().toISOString()
                }
            ],
            bankAccounts: [],
            bankTransactions: [],
            bookkeeping: [],
        });

        useAuthStore.setState({
            user: { id: 'user-1', name: 'Test User', email: 'test@example.com', companyId: 'org-1', role: Role.ADMIN, avatar: '' }
        });
    });

    it('should deduct stock and post movement when approving a release requisition', async () => {
        const { approveRequisition } = useDataStore.getState();

        await approveRequisition('req-1');

        const state = useDataStore.getState();
        const ingredient = state.ingredients.find(i => i.id === 'ing-1');
        const requisition = state.requisitions.find(r => r.id === 'req-1');

        expect(ingredient?.stockLevel).toBe(8);
        expect(requisition?.status).toBe('Issued');

        // Check if postIngredientMovement was called
        const { postIngredientMovement } = await import('../services/supabase');
        expect(postIngredientMovement).toHaveBeenCalled();
        expect(postIngredientMovement).toHaveBeenCalledWith(expect.objectContaining({
            itemId: 'ing-1',
            delta: -2,
            type: 'release'
        }));
    });
});
