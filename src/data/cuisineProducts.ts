export interface CuisineProduct {
    name: string;
    price: number;
    category: string;
    minPortions?: number;
    unit?: string;
}

export const PREDEFINED_CUISINE_PRODUCTS: CuisineProduct[] = [
    // NIGERIAN CUISINE
    { name: 'Smokey Party Jollof Rice (Bulk)', price: 45000, category: 'Nigerian Cuisine', minPortions: 1, unit: 'Cooler (S)' },
    { name: 'Special Fried Rice', price: 50000, category: 'Nigerian Cuisine', minPortions: 1, unit: 'Cooler (S)' },
    { name: 'Village Native Rice', price: 48000, category: 'Nigerian Cuisine', minPortions: 1, unit: 'Cooler (S)' },
    { name: 'Ofada Rice & Ayamase Sauce', price: 55000, category: 'Nigerian Cuisine', minPortions: 1, unit: 'Cooler (S)' },

    // PROTEINS
    { name: 'Fried Spicy Chicken (Large)', price: 2500, category: 'Proteins', minPortions: 10, unit: 'Pieces' },
    { name: 'Grilled Peppered Fish (Croaker)', price: 4500, category: 'Proteins', minPortions: 5, unit: 'Portions' },
    { name: 'Assorted Meat (Peppered)', price: 3500, category: 'Proteins', minPortions: 10, unit: 'Pieces' },
    { name: 'Gizzard & Dodo (Gizdodo)', price: 15000, category: 'Proteins', minPortions: 1, unit: 'Small Bowl' },

    // STARTERS & SMALL CHOPS
    { name: 'Mixed Small Chops (Standard)', price: 2500, category: 'Starters', minPortions: 20, unit: 'Packs' },
    { name: 'Spring Rolls & Samosas', price: 1800, category: 'Starters', minPortions: 20, unit: 'Pieces' },
    { name: 'Puff Puff (Party Box)', price: 8000, category: 'Starters', minPortions: 1, unit: 'Large Case' },

    // CONTINENTAL & SIDES
    { name: 'Creamy Coleslaw (Bulk)', price: 12000, category: 'Sides', minPortions: 1, unit: 'Medium Bowl' },
    { name: 'Moin Moin (Leaf Wrapped)', price: 1200, category: 'Sides', minPortions: 15, unit: 'Pieces' },
    { name: 'Green Salad with Dressing', price: 15000, category: 'Sides', minPortions: 1, unit: 'Large Bowl' }
];
