import { InventoryItem, Recipe, Ingredient, ItemCosting } from '../types';

export const calculateItemCosting = (
    id: string,
    qty: number,
    inventory: InventoryItem[],
    recipes: Recipe[],
    ingredients: Ingredient[],
    qtyOverrides?: Record<string, number>
): ItemCosting | null => {
    const item = inventory.find(i => i.id === id);
    if (!item) {
        if (id.startsWith('custom-')) {
            // Handle as custom item with 0 cost
            return {
                inventoryItemId: id,
                name: 'Custom Product', // This will be overwritten by OrderBrochure logic if needed, but here we return a placeholder
                totalIngredientCostCents: 0,
                revenueCents: 0, // Revenue should be handled by the caller or passed in if available
                grossMarginCents: 0,
                grossMarginPercentage: 0,
                ingredientBreakdown: []
            };
        }
        return null;
    }
    let totalCost = 0;
    const recipe = recipes.find(r => r.id === item.recipeId);

    const standardize = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

    // PORTION RULES (Xquisite IP)
    let portionMultiplier = 1;
    let strategy = 'Standard Scaling';

    const lowerName = item.name.toLowerCase();
    if (lowerName.includes('jollof') && !lowerName.includes('menu')) {
        portionMultiplier = 2; // 2-Scoop Rule
        strategy = 'Rice Only (2 Scoops/Head)';
    } else if (lowerName.includes('option a')) {
        portionMultiplier = 1; // 1 Jollof + 1 Fried Rice (already balanced in composite recipe)
        strategy = 'Option A (1+1 Rice Rule)';
    } else if (lowerName.includes('stew') || lowerName.includes('chicken') || lowerName.includes('beef')) {
        portionMultiplier = 2; // 2-Piece Rule
        strategy = 'Protein (2 Pieces/Head)';
    } else if (lowerName.includes('fish')) {
        portionMultiplier = 1; // 1-Piece Rule
        strategy = 'Fish (1 Piece/Head)';
    }

    const totalRequiredPortions = qty * portionMultiplier;

    const breakdown = recipe ? recipe.ingredients.map(ri => {
        const ing = ingredients.find(i =>
            i.name.toLowerCase().trim() === ri.name.toLowerCase().trim() ||
            standardize(i.name) === standardize(ri.name)
        );

        let unitCost = (ing?.marketPriceCents)
            ? ing.marketPriceCents
            : (ing?.currentCostCents || (ing as any)?.priceCents || 50000);

        // NON-LINEAR SCALING (Tier Lookup)
        let totalQtyForTier = 0;
        let tierUsed = 'Standard Calculation';

        const override = qtyOverrides?.[ri.name];

        if (override !== undefined) {
            totalQtyForTier = override * qty; // Direct override refers to the per-guest quantity
            tierUsed = 'Manual Executive Override';
        } else if (ri.scaling_tiers && Object.keys(ri.scaling_tiers).length > 0) {
            const tiers = Object.keys(ri.scaling_tiers).map(Number).sort((a, b) => a - b);
            // Find the closest higher tier, or greatest available
            const tierPortions = tiers.find(t => t >= totalRequiredPortions) || tiers[tiers.length - 1];
            const baseQtyAtTier = ri.scaling_tiers[tierPortions.toString()];

            // Scaled quantity from the specific MD tier
            totalQtyForTier = (baseQtyAtTier / tierPortions) * totalRequiredPortions;
            tierUsed = `MD ${tierPortions}-Portion Standard`;
        } else {
            totalQtyForTier = ri.qtyPerPortion * totalRequiredPortions;
        }

        // Unit Conversion Logic
        let conversionFactor = 1;
        const riUnit = ri.unit.toLowerCase();
        const ingUnit = ing?.unit?.toLowerCase() || '';
        if (riUnit === 'g' && ingUnit === 'kg') conversionFactor = 1 / 1000;
        if (riUnit === 'ml' && ingUnit === 'l') conversionFactor = 1 / 1000;
        if (riUnit === 'cl' && ingUnit === 'l') conversionFactor = 1 / 100;
        if (riUnit === 'kg' && ingUnit === 'g') conversionFactor = 1000;

        const subTotal = totalQtyForTier * conversionFactor * unitCost;
        totalCost += subTotal;

        return {
            name: ri.name,
            qtyRequired: totalQtyForTier,
            qtyPerPortion: totalQtyForTier / qty, // Effective per head
            unit: ri.unit,
            unitCostCents: unitCost,
            totalCostCents: subTotal,
            isGrounded: !!ing?.marketPriceCents,
            hasError: !ing || subTotal > 10000000,
            errorDetail: !ing ? 'Missing from Inventory' : subTotal > 10000000 ? 'Abnormally high cost' : undefined,
            scalingTierUsed: tierUsed,
            portionStrategy: strategy,
            subRecipeGroup: ri.subRecipeGroup
        };
    }) : [];

    const revenue = item.priceCents * qty;
    const grossMarginCents = revenue - totalCost;
    const grossMarginPercentage = revenue > 0 ? (grossMarginCents / revenue) * 100 : 0;

    return {
        inventoryItemId: id,
        name: item.name,
        totalIngredientCostCents: totalCost,
        revenueCents: revenue,
        grossMarginCents,
        grossMarginPercentage,
        ingredientBreakdown: breakdown as any
    };
};
