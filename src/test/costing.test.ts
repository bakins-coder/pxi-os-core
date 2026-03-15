import { describe, it, expect } from 'vitest';
import { calculateItemCosting } from '../utils/costing';
import { InventoryItem, Recipe, Ingredient } from '../types';

describe('calculateItemCosting', () => {
    const mockInventory: InventoryItem[] = [
        {
            id: 'prod-1',
            name: 'Jollof Rice',
            recipeId: 'rec-1',
            priceCents: 200000, // ₦2,000
            type: 'product',
            category: 'Main Course',
            stockQuantity: 10,
            companyId: 'org-1'
        } as any
    ];

    const mockRecipes: Recipe[] = [
        {
            id: 'rec-1',
            name: 'Jollof Rice',
            ingredients: [
                { name: 'Rice', qtyPerPortion: 0.05, unit: 'kg' },
                { name: 'Salt', qtyPerPortion: 2, unit: 'g' }, // 2g per portion
                { name: 'Water', qtyPerPortion: 100, unit: 'ml' }
            ]
        } as any
    ];

    const mockIngredients: Ingredient[] = [
        {
            id: 'ing-1',
            name: 'Rice',
            unit: 'kg',
            currentCostCents: 150000, // ₦1,500 per kg
            marketPriceCents: 150000,
            stockLevel: 100,
            companyId: 'org-1'
        } as any,
        {
            id: 'ing-2',
            name: 'salt', // test lowercase matching
            unit: 'kg',
            currentCostCents: 50000, // ₦500 per kg
            stockLevel: 10,
            companyId: 'org-1'
        } as any,
        {
            id: 'ing-3',
            name: 'Water',
            unit: 'L', // test L vs ml conversion
            currentCostCents: 10000, // ₦100 per L
            stockLevel: 1000,
            companyId: 'org-1'
        } as any
    ];

    it('should calculate cost with unit conversion (g to kg, ml to L)', () => {
        const portions = 100;
        const result = calculateItemCosting('prod-1', portions, mockInventory, mockRecipes, mockIngredients);

        expect(result).not.toBeNull();
        if (result) {
            // Rice: 0.05kg * 100 * 1500 = 7500 NGN = 750000 cents
            // Salt: 2g * 100 = 200g = 0.2kg. 0.2kg * 500 = 100 NGN = 10000 cents
            // Water: 100ml * 100 = 10000ml = 10L. 10L * 100 = 1000 NGN = 100000 cents
            // Total: 7500 + 100 + 1000 = 8600 NGN = 860000 cents

            expect(result.totalIngredientCostCents).toBe(860000);
            expect(result.ingredientBreakdown).toHaveLength(3);

            const rice = result.ingredientBreakdown.find(i => i.name === 'Rice');
            expect(rice?.totalCostCents).toBe(750000);

            const salt = result.ingredientBreakdown.find(i => i.name === 'Salt');
            expect(salt?.totalCostCents).toBe(10000);

            const water = result.ingredientBreakdown.find(i => i.name === 'Water');
            expect(water?.totalCostCents).toBe(100000);
        }
    });

    it('should handle missing ingredients and use safety default', () => {
        const recipeWithMissing: Recipe[] = [
            {
                id: 'rec-2',
                name: 'Mystery Dish',
                ingredients: [{ name: 'Unicorn Dust', qtyPerPortion: 1, unit: 'kg' }]
            } as any
        ];
        const invWithMissing: InventoryItem[] = [
            { id: 'prod-2', name: 'Mystery Dish', recipeId: 'rec-2', priceCents: 100000 } as any
        ];

        const result = calculateItemCosting('prod-2', 1, invWithMissing, recipeWithMissing, []);

        expect(result?.totalIngredientCostCents).toBe(50000); // safety default
        expect(result?.ingredientBreakdown[0].hasError).toBe(true);
        expect(result?.ingredientBreakdown[0].errorDetail).toBe('Missing from Inventory');
    });

    it('should flag abnormally high costs', () => {
        const expensiveIngredients: Ingredient[] = [
            { name: 'Gold', unit: 'kg', currentCostCents: 1000000000 } as any // 10M NGN
        ];
        const expensiveRecipe: Recipe[] = [
            { id: 'rec-3', name: 'Expensive', ingredients: [{ name: 'Gold', qtyPerPortion: 1, unit: 'kg' }] } as any
        ];
        const expensiveInv: InventoryItem[] = [
            { id: 'prod-3', name: 'Expensive', recipeId: 'rec-3', priceCents: 100 } as any
        ];

        const result = calculateItemCosting('prod-3', 1, expensiveInv, expensiveRecipe, expensiveIngredients);
        expect(result?.ingredientBreakdown[0].hasError).toBe(true);
        expect(result?.ingredientBreakdown[0].errorDetail).toBe('Abnormally high cost');
    });
});
