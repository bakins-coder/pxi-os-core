import { InventoryItem, Recipe, Ingredient, ItemCosting } from '../types';

export const calculateItemCosting = (
    id: string,
    qty: number,
    inventory: InventoryItem[],
    recipes: Recipe[],
    ingredients: Ingredient[]
): ItemCosting | null => {
    const item = inventory.find(i => i.id === id);
    if (!item) return null;
    let totalCost = 0;
    const recipe = recipes.find(r => r.id === item.recipeId);

    const breakdown = recipe ? recipe.ingredients.map(ri => {
        const ing = ingredients.find(i => i.name === ri.name);
        const unitCost = (ing?.marketPriceCents) ? ing.marketPriceCents : (ing?.currentCostCents || 50000);
        const subTotal = ri.qtyPerPortion * qty * unitCost;
        totalCost += subTotal;
        return {
            name: ri.name,
            qtyRequired: ri.qtyPerPortion * qty,
            unit: ri.unit,
            unitCostCents: unitCost,
            totalCostCents: subTotal,
            isGrounded: !!ing?.marketPriceCents
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
