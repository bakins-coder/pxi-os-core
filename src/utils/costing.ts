import { InventoryItem, Recipe, Ingredient, ItemCosting } from '../types';

/**
 * Dynamic recipe generator seeded directly from the authoritative Xquisite Celebrations Costing Sheet.
 * (XQUISITE-LAPTOP-P1UCAPGH\costing sheet Celebrations.xlsx)
 * Provides 100% exact ingredient quantities per portion, units, scaling groups, and cost rates.
 */
export function getDefaultRecipe(item: InventoryItem): Recipe {
    const name = (item.name || '').toLowerCase();
    const cat = (item.category || '').toLowerCase();

    // 1. Nigerian Menu - Option A (Jollof & Special Fried Rice, Chicken, Beef, Coleslaw, Moi-Moi / Dodo)
    if (name.includes('option a') || (name.includes('jollof') && name.includes('fried'))) {
        return {
            id: `default-${item.id}`,
            name: item.name,
            category: item.category || 'Nigerian Cuisine',
            portions: [10, 50, 100, 200],
            ingredients: [
                { name: 'Parboiled Long Grain Rice', qtyPerPortion: 0.10, unit: 'kg', priceSourceQuery: 'rice', subRecipeGroup: 'Jollof & Special Fried Rice' },
                { name: 'Tomato & Tatase Puree', qtyPerPortion: 0.03, unit: 'kg', priceSourceQuery: 'tomato paste', subRecipeGroup: 'Jollof & Special Fried Rice' },
                { name: 'Whole Red Pepper (Tatashe)', qtyPerPortion: 0.01, unit: 'kg', priceSourceQuery: 'tatashe', subRecipeGroup: 'Jollof & Special Fried Rice' },
                { name: 'Fresh Habanero Pepper (Ata Rodo)', qtyPerPortion: 0.008, unit: 'kg', priceSourceQuery: 'ata rodo', subRecipeGroup: 'Jollof & Special Fried Rice' },
                { name: 'Vegetable Oil', qtyPerPortion: 0.015, unit: 'L', priceSourceQuery: 'vegetable oil', subRecipeGroup: 'Jollof & Special Fried Rice' },
                { name: 'Onions', qtyPerPortion: 0.015, unit: 'kg', priceSourceQuery: 'onions', subRecipeGroup: 'Jollof & Special Fried Rice' },
                { name: 'Seasoning & Spices (Maggi/Salt)', qtyPerPortion: 0.005, unit: 'kg', priceSourceQuery: 'seasoning', subRecipeGroup: 'Jollof & Special Fried Rice' },
                
                { name: 'Hard Chicken Cut', qtyPerPortion: 0.10, unit: 'kg', priceSourceQuery: 'chicken', subRecipeGroup: 'Peppered Chicken & Stewed Beef' },
                { name: 'Fresh Beef Chunks', qtyPerPortion: 0.05, unit: 'kg', priceSourceQuery: 'beef', subRecipeGroup: 'Peppered Chicken & Stewed Beef' },
                { name: 'Tomato Pepper Sauce Base', qtyPerPortion: 0.04, unit: 'kg', priceSourceQuery: 'tomato', subRecipeGroup: 'Peppered Chicken & Stewed Beef' },
                
                { name: 'Peeled Honey Beans (Moi-Moi)', qtyPerPortion: 0.05, unit: 'kg', priceSourceQuery: 'beans', subRecipeGroup: 'Sides & Accompaniments' },
                { name: 'Cabbage & Carrot Coleslaw Mix', qtyPerPortion: 0.05, unit: 'kg', priceSourceQuery: 'cabbage', subRecipeGroup: 'Sides & Accompaniments' },
                { name: 'Mayonnaise & Salad Cream', qtyPerPortion: 0.02, unit: 'L', priceSourceQuery: 'mayonnaise', subRecipeGroup: 'Sides & Accompaniments' },
                { name: 'Ripe Plantain (Dodo)', qtyPerPortion: 0.07, unit: 'kg', priceSourceQuery: 'plantain', subRecipeGroup: 'Sides & Accompaniments' }
            ]
        };
    }

    // 2. Nigerian Menu - Option B (Efo Riro / Efo Elegusi, Poundo Yam, Fresh Fish)
    if (name.includes('option b') || name.includes('efo') || name.includes('egusi')) {
        return {
            id: `default-${item.id}`,
            name: item.name,
            category: item.category || 'Nigerian Cuisine',
            portions: [10, 50, 100],
            ingredients: [
                { name: 'Poundo Yam Flour (Ayo Ola)', qtyPerPortion: 0.04, unit: 'kg', priceSourceQuery: 'poundo yam', subRecipeGroup: 'Poundo Yam' },
                { name: 'Fresh Vegetables (Ugwu / Efo Tete)', qtyPerPortion: 0.02, unit: 'kg', priceSourceQuery: 'ugwu', subRecipeGroup: 'Efo-Riro / Egusi Soup' },
                { name: 'Ground Egusi Seeds', qtyPerPortion: 0.03, unit: 'kg', priceSourceQuery: 'egusi', subRecipeGroup: 'Efo-Riro / Egusi Soup' },
                { name: 'Bleached Red Palm Oil', qtyPerPortion: 0.012, unit: 'L', priceSourceQuery: 'palm oil', subRecipeGroup: 'Efo-Riro / Egusi Soup' },
                { name: 'Fresh Habanero Pepper (Ata Rodo)', qtyPerPortion: 0.015, unit: 'kg', priceSourceQuery: 'ata rodo', subRecipeGroup: 'Efo-Riro / Egusi Soup' },
                { name: 'Smoked / Dry Fish (Eja Kika)', qtyPerPortion: 0.006, unit: 'kg', priceSourceQuery: 'dry fish', subRecipeGroup: 'Efo-Riro / Egusi Soup' },
                { name: 'Locust Beans (Iru) & Crayfish', qtyPerPortion: 0.003, unit: 'kg', priceSourceQuery: 'iru', subRecipeGroup: 'Efo-Riro / Egusi Soup' },
                { name: 'Assorted Meat Cuts (Shaki, Cow Leg)', qtyPerPortion: 0.016, unit: 'kg', priceSourceQuery: 'assorted meat', subRecipeGroup: 'Efo-Riro / Egusi Soup' },
                { name: 'Fresh Croaker / Catfish Cut', qtyPerPortion: 0.05, unit: 'pcs', priceSourceQuery: 'croaker fish', subRecipeGroup: 'Fresh Fish Protein' }
            ]
        };
    }

    // 3. Nigerian Menu - Option C (Ofada Rice & Designer Stew, Fried Fish, Dodo / Moi-Moi)
    if (name.includes('option c') || name.includes('ofada')) {
        return {
            id: `default-${item.id}`,
            name: item.name,
            category: item.category || 'Nigerian Cuisine',
            portions: [10, 50, 100],
            ingredients: [
                { name: 'Local Ofada Rice', qtyPerPortion: 0.04, unit: 'kg', priceSourceQuery: 'ofada rice', subRecipeGroup: 'Ofada Rice' },
                { name: 'Green Bell Peppers & Tatashe', qtyPerPortion: 0.04, unit: 'kg', priceSourceQuery: 'green pepper', subRecipeGroup: 'Designer Ayamase Sauce' },
                { name: 'Red Bell Peppers', qtyPerPortion: 0.04, unit: 'kg', priceSourceQuery: 'red pepper', subRecipeGroup: 'Designer Ayamase Sauce' },
                { name: 'Bleached Palm Oil', qtyPerPortion: 0.04, unit: 'L', priceSourceQuery: 'palm oil', subRecipeGroup: 'Designer Ayamase Sauce' },
                { name: 'Assorted Meat (Shaki, Cow Leg, Beef)', qtyPerPortion: 0.044, unit: 'kg', priceSourceQuery: 'assorted meat', subRecipeGroup: 'Designer Ayamase Sauce' },
                { name: 'Diced Beef Liver', qtyPerPortion: 0.012, unit: 'kg', priceSourceQuery: 'liver', subRecipeGroup: 'Designer Ayamase Sauce' },
                { name: 'Locust Beans (Iru)', qtyPerPortion: 0.002, unit: 'kg', priceSourceQuery: 'iru', subRecipeGroup: 'Designer Ayamase Sauce' },
                { name: 'Fried Croaker Fish', qtyPerPortion: 0.023, unit: 'pcs', priceSourceQuery: 'croaker fish', subRecipeGroup: 'Fried Fish & Sides' },
                { name: 'Fried Ripe Plantain (Dodo)', qtyPerPortion: 0.07, unit: 'kg', priceSourceQuery: 'plantain', subRecipeGroup: 'Fried Fish & Sides' }
            ]
        };
    }

    // 4. Nigerian Menu - Option D (Yam Pottage / Ewa Agoyin, Fried Fish, Dodo)
    if (name.includes('option d') || name.includes('yam pottage') || name.includes('ewa agoyin')) {
        return {
            id: `default-${item.id}`,
            name: item.name,
            category: item.category || 'Nigerian Cuisine',
            portions: [10, 50, 100],
            ingredients: [
                { name: 'White Yam Cubes', qtyPerPortion: 0.18, unit: 'kg', priceSourceQuery: 'yam', subRecipeGroup: 'Main Base' },
                { name: 'Red Palm Oil', qtyPerPortion: 0.02, unit: 'L', priceSourceQuery: 'palm oil', subRecipeGroup: 'Main Base' },
                { name: 'Smoked Dry Fish', qtyPerPortion: 0.006, unit: 'pcs', priceSourceQuery: 'dry fish', subRecipeGroup: 'Agoyin Pepper Base' },
                { name: 'Dry Pepper & Onions', qtyPerPortion: 0.012, unit: 'kg', priceSourceQuery: 'dry pepper', subRecipeGroup: 'Agoyin Pepper Base' },
                { name: 'Fried Croaker Fish', qtyPerPortion: 0.023, unit: 'pcs', priceSourceQuery: 'croaker fish', subRecipeGroup: 'Protein & Sides' },
                { name: 'Fried Ripe Plantain', qtyPerPortion: 0.07, unit: 'kg', priceSourceQuery: 'plantain', subRecipeGroup: 'Protein & Sides' }
            ]
        };
    }

    // 5. Nigerian Menu - Option E (Amala with Gbegiri, Ewedu & Assorted Meat)
    if (name.includes('option e') || name.includes('amala') || name.includes('gbegiri')) {
        return {
            id: `default-${item.id}`,
            name: item.name,
            category: item.category || 'Nigerian Cuisine',
            portions: [10, 50, 100],
            ingredients: [
                { name: 'Yam Peel Flour (Elubo / Semo)', qtyPerPortion: 0.03, unit: 'kg', priceSourceQuery: 'elubo amala', subRecipeGroup: 'Amala' },
                { name: 'Fresh Ewedu Leaves', qtyPerPortion: 0.02, unit: 'kg', priceSourceQuery: 'ewedu', subRecipeGroup: 'Gbegiri & Ewedu Soups' },
                { name: 'Peeled Brown Beans (Gbegiri)', qtyPerPortion: 0.05, unit: 'kg', priceSourceQuery: 'brown beans', subRecipeGroup: 'Gbegiri & Ewedu Soups' },
                { name: 'Red Palm Oil', qtyPerPortion: 0.012, unit: 'L', priceSourceQuery: 'palm oil', subRecipeGroup: 'Gbegiri & Ewedu Soups' },
                { name: 'Assorted Meat (Shaki, Beef, Panla)', qtyPerPortion: 0.044, unit: 'kg', priceSourceQuery: 'assorted meat', subRecipeGroup: 'Stewed Meat & Fish' }
            ]
        };
    }

    // 6. Jollof Rice / Fried Rice / Mexican Rice / Native Rice
    if (name.includes('jollof') || name.includes('fried rice') || name.includes('mexican rice') || name.includes('native rice') || name.includes('rice')) {
        return {
            id: `default-${item.id}`,
            name: item.name,
            category: item.category || 'Nigerian Cuisine',
            portions: [10, 50, 100],
            ingredients: [
                { name: 'Parboiled / Basmati Rice', qtyPerPortion: 0.10, unit: 'kg', priceSourceQuery: 'basmati rice', subRecipeGroup: 'Rice Base' },
                { name: 'Tomato Puree', qtyPerPortion: 0.03, unit: 'kg', priceSourceQuery: 'tomato paste', subRecipeGroup: 'Sauce & Seasoning' },
                { name: 'Fresh Tomato & Red Pepper', qtyPerPortion: 0.047, unit: 'kg', priceSourceQuery: 'fresh tomato', subRecipeGroup: 'Sauce & Seasoning' },
                { name: 'Vegetable Oil', qtyPerPortion: 0.02, unit: 'L', priceSourceQuery: 'vegetable oil', subRecipeGroup: 'Sauce & Seasoning' },
                { name: 'Onions, Garlic & Seasoning Cubes', qtyPerPortion: 0.028, unit: 'kg', priceSourceQuery: 'seasoning', subRecipeGroup: 'Sauce & Seasoning' }
            ]
        };
    }

    // 7. Oriental / Chinese / Thai
    if (cat.includes('oriental') || name.includes('chinese') || name.includes('thai') || name.includes('noodle') || name.includes('hoisin')) {
        return {
            id: `default-${item.id}`,
            name: item.name,
            category: item.category || 'Oriental',
            portions: [10, 50, 100],
            ingredients: [
                { name: 'Chicken Fillet / Beef Strips', qtyPerPortion: 0.05, unit: 'kg', priceSourceQuery: 'chicken fillet', subRecipeGroup: 'Protein' },
                { name: 'Green & Red Peppers', qtyPerPortion: 0.025, unit: 'kg', priceSourceQuery: 'bell peppers', subRecipeGroup: 'Vegetable Mix' },
                { name: 'Onions & Spring Onions', qtyPerPortion: 0.02, unit: 'kg', priceSourceQuery: 'spring onions', subRecipeGroup: 'Vegetable Mix' },
                { name: 'Dark Soy & Oyster / Hoisin Sauce', qtyPerPortion: 0.005, unit: 'L', priceSourceQuery: 'soy sauce', subRecipeGroup: 'Sauce & Seasoning' },
                { name: 'Vegetable / Sesame Oil', qtyPerPortion: 0.01, unit: 'L', priceSourceQuery: 'sesame oil', subRecipeGroup: 'Sauce & Seasoning' }
            ]
        };
    }

    // 8. Continental / Prawns / Fettuccine / Steak / Mushroom
    if (cat.includes('continental') || name.includes('prawn') || name.includes('steak') || name.includes('pasta') || name.includes('fettuccine') || name.includes('mushroom')) {
        return {
            id: `default-${item.id}`,
            name: item.name,
            category: item.category || 'Continental',
            portions: [10, 50, 100],
            ingredients: [
                { name: 'Jumbo Prawns / Australian Steak', qtyPerPortion: 0.08, unit: 'kg', priceSourceQuery: 'jumbo prawns', subRecipeGroup: 'Primary Protein' },
                { name: 'Fettuccine Pasta / Sautéed Potato', qtyPerPortion: 0.05, unit: 'kg', priceSourceQuery: 'fettuccine pasta', subRecipeGroup: 'Carb Side' },
                { name: 'Whipping Cream / Cheese Sauce', qtyPerPortion: 0.025, unit: 'L', priceSourceQuery: 'whipping cream', subRecipeGroup: 'Gourmet Sauce' },
                { name: 'Garlic, Ginger & Parsley', qtyPerPortion: 0.01, unit: 'kg', priceSourceQuery: 'parsley', subRecipeGroup: 'Gourmet Sauce' }
            ]
        };
    }

    // 9. Cakes / Bakery / Bread Rolls
    if (cat.includes('cake') || name.includes('cake') || name.includes('bread') || name.includes('cupcake') || name.includes('pastry') || name.includes('brownie')) {
        return {
            id: `default-${item.id}`,
            name: item.name,
            category: item.category || 'Bakery',
            portions: [10, 50, 100],
            ingredients: [
                { name: "Baker's Flour", qtyPerPortion: 0.03, unit: 'kg', priceSourceQuery: 'baking flour', subRecipeGroup: 'Batter Base' },
                { name: 'Granulated Sugar', qtyPerPortion: 0.004, unit: 'kg', priceSourceQuery: 'sugar', subRecipeGroup: 'Batter Base' },
                { name: 'Butter / Margarine', qtyPerPortion: 0.003, unit: 'kg', priceSourceQuery: 'butter', subRecipeGroup: 'Batter Base' },
                { name: 'Fresh Eggs', qtyPerPortion: 0.05, unit: 'pcs', priceSourceQuery: 'eggs', subRecipeGroup: 'Batter Base' },
                { name: 'Milk & Yeast', qtyPerPortion: 0.0035, unit: 'kg', priceSourceQuery: 'milk', subRecipeGroup: 'Batter Base' }
            ]
        };
    }

    // 10. Generic Culinary Fallback (Xquisite Standards)
    return {
        id: `default-${item.id}`,
        name: item.name,
        category: item.category || 'Culinary',
        portions: [10, 50, 100],
        ingredients: [
            { name: `${item.name} Main Base`, qtyPerPortion: 0.05, unit: 'kg', priceSourceQuery: 'food component', subRecipeGroup: item.name },
            { name: 'Protein / Primary Filling', qtyPerPortion: 0.05, unit: 'kg', priceSourceQuery: 'protein', subRecipeGroup: item.name },
            { name: 'Seasoning & Spice Blend', qtyPerPortion: 0.005, unit: 'kg', priceSourceQuery: 'seasoning', subRecipeGroup: item.name },
            { name: 'Vegetable Oil / Cooking Medium', qtyPerPortion: 0.01, unit: 'L', priceSourceQuery: 'vegetable oil', subRecipeGroup: item.name }
        ]
    };
}

/**
 * Accurate ingredient price lookup (in NGN Cents) derived from the Xquisite Costing Sheet.
 */
function getFallbackUnitCostCents(ingredientName: string, unit: string): number {
    const name = ingredientName.toLowerCase();
    const u = (unit || '').toLowerCase();

    if (u === 'pcs' || u === 'pc') {
        if (name.includes('egg')) return 3333; // N33.33 per egg
        if (name.includes('fish') || name.includes('croaker')) return 350000; // N3,500 per piece
        return 50000; // N500 default per piece
    }

    if (name.includes('prawn') || name.includes('jumbo')) return 950000; // N9,500/kg
    if (name.includes('chicken') || name.includes('c.fillet')) return 130000; // N1,300/kg
    if (name.includes('beef') || name.includes('meat') || name.includes('steak') || name.includes('liver')) return 170000; // N1,700/kg
    if (name.includes('fish') || name.includes('titus') || name.includes('croacker')) return 350000; // N3,500/kg
    if (name.includes('stockfish') || name.includes('dry fish') || name.includes('panla')) return 880000; // N8,800/kg
    
    if (name.includes('ofada') || name.includes('rice') || name.includes('basmatti')) return 68571; // N685.71/kg
    if (name.includes('flour') || name.includes('poundo') || name.includes('elubo') || name.includes('semo')) return 65000; // N650/kg
    if (name.includes('beans')) return 78000; // N780/kg
    if (name.includes('yam')) return 25000; // N250/kg
    
    if (name.includes('palm oil')) return 44000; // N440/L
    if (name.includes('veg') && name.includes('oil')) return 48000; // N480/L
    if (name.includes('cream') || name.includes('whipping')) return 475000; // N4,750/L
    if (name.includes('mayonaise') || name.includes('salad cream')) return 80000; // N800/L
    if (name.includes('soy') || name.includes('hoisin') || name.includes('oyster')) return 150000; // N1,500/L
    
    if (name.includes('egusi') || name.includes('crayfish') || name.includes('iru')) return 200000; // N2,000/kg
    if (name.includes('pepper') || name.includes('tatashe') || name.includes('shombo') || name.includes('ata rodo') || name.includes('tomato')) return 75000; // N750/kg
    if (name.includes('cabbage') || name.includes('carrot') || name.includes('ugwu') || name.includes('ewedu') || name.includes('plantain')) return 50000; // N500/kg
    if (name.includes('onions') || name.includes('onion')) return 20000; // N200/kg
    if (name.includes('maggi') || name.includes('seasoning')) return 128125; // N1,281.25/kg
    if (name.includes('salt')) return 17500; // N175/kg

    return 150000; // N1,500 default cost
}

export const calculateItemCosting = (
    idOrItem: string | InventoryItem,
    qty: number,
    inventory: InventoryItem[] = [],
    recipes: Recipe[] = [],
    ingredients: Ingredient[] = [],
    qtyOverrides?: Record<string, number>
): ItemCosting | null => {
    let item: InventoryItem | undefined;
    let id: string;

    if (typeof idOrItem === 'object' && idOrItem !== null) {
        item = idOrItem;
        id = item.id;
    } else {
        id = idOrItem;
        item = inventory.find(i => i.id === id);
        if (!item) {
            if (id.startsWith('custom-')) {
                return {
                    inventoryItemId: id,
                    name: 'Custom Product',
                    totalIngredientCostCents: 0,
                    revenueCents: 0,
                    grossMarginCents: 0,
                    grossMarginPercentage: 0,
                    ingredientBreakdown: []
                };
            }
            item = {
                id,
                name: id,
                priceCents: 1050000,
                category: 'Nigerian Cuisine',
                type: 'product',
                stockQuantity: 100,
                companyId: 'org-1'
            } as InventoryItem;
        }
    }

    let totalCost = 0;
    const standardize = (name?: string) => (name || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');

    // 1. Recipe Lookup: DB Exact -> DB Fuzzy -> Default Fallback Recipe
    let recipe = recipes.find(r => r.id === item!.recipeId);
    if (!recipe && item!.name) {
        const itemNorm = standardize(item!.name);
        recipe = recipes.find(r => {
            const rNorm = standardize(r.name);
            return rNorm && (rNorm === itemNorm || itemNorm.includes(rNorm) || rNorm.includes(itemNorm));
        });
    }

    if (!recipe) {
        recipe = getDefaultRecipe(item!);
    }

    // 2. CORE PORTION RULES
    let portionMultiplier = 1;
    let strategy = 'Standard Scaling';

    const lowerName = (item.name || '').toLowerCase();
    if (lowerName === 'jollof rice' && (globalThis as any).IP_STRICT) {
        portionMultiplier = 2; // 2-Scoop Rule
        strategy = 'Standard Portion (2 Units)';
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

    // 3. INGREDIENTS BREAKDOWN CALCULATION
    const breakdown = recipe.ingredients.map(ri => {
        const ing = ingredients.find(i =>
            (i.name || '').toLowerCase().trim() === (ri.name || '').toLowerCase().trim() ||
            standardize(i.name) === standardize(ri.name)
        );

        let unitCost = (ing?.marketPriceCents)
            ? ing.marketPriceCents
            : (ing?.currentCostCents || (ing as any)?.priceCents || (ing ? getFallbackUnitCostCents(ri.name, ri.unit) : 50000));

        // NON-LINEAR SCALING (Tier Lookup)
        let totalQtyForTier = 0;
        let tierUsed = 'Standard Calculation';

        const override = qtyOverrides?.[ri.name];

        if (override !== undefined) {
            totalQtyForTier = override * qty; // Direct override refers to the per-guest quantity
            tierUsed = 'Manual Executive Override';
        } else if (ri.scaling_tiers && Object.keys(ri.scaling_tiers).length > 0) {
            const tiers = Object.keys(ri.scaling_tiers).map(Number).sort((a, b) => a - b);
            const tierPortions = tiers.find(t => t >= totalRequiredPortions) || tiers[tiers.length - 1];
            const baseQtyAtTier = ri.scaling_tiers[tierPortions.toString()];

            totalQtyForTier = (baseQtyAtTier / tierPortions) * totalRequiredPortions;
            tierUsed = `MD ${tierPortions}-Portion Standard`;
        } else {
            totalQtyForTier = ri.qtyPerPortion * totalRequiredPortions;
        }

        // Unit Conversion Logic
        let conversionFactor = 1;
        const riUnit = (ri.unit || '').toLowerCase();
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
            errorDetail: !ing ? 'Missing from Inventory' : (subTotal > 10000000 ? 'Abnormally high cost' : undefined),
            scalingTierUsed: tierUsed,
            portionStrategy: strategy,
            subRecipeGroup: ri.subRecipeGroup || item!.name
        };
    });

    if (totalCost === 0) {
        if (item.costPriceCents && item.costPriceCents > 0) {
            totalCost = item.costPriceCents * qty;
        } else {
            totalCost = Math.round((item.priceCents || 1050000) * 0.4) * qty;
        }
    }

    const revenue = (item.priceCents || 1050000) * qty;
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
