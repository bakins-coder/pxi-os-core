export interface CuisineProduct {
    name: string;
    price: number;
    category: string;
    minPortions?: number;
    unit?: string;
}

export const PREDEFINED_CUISINE_PRODUCTS: CuisineProduct[] = [
    // PROTEINS
    { name: 'Grilled jumbo prawns', price: 9000, category: 'Proteins', minPortions: 10 },
    { name: 'Stewed Chicken', price: 2500, category: 'Proteins', minPortions: 10 },
    { name: 'Stewed Beef', price: 1800, category: 'Proteins', minPortions: 10 },
    { name: 'Honey-Soy Grilled Chicken', price: 3000, category: 'Proteins', minPortions: 10 },
    { name: 'Peppered Goat meat', price: 3800, category: 'Proteins', minPortions: 10 },
    { name: 'Peppered Snail (Medium)', price: 6500, category: 'Proteins', unit: 'piece', minPortions: 10 },
    { name: 'Peppered Snail (Jumbo)', price: 9000, category: 'Proteins', unit: 'piece', minPortions: 10 },
    { name: 'Fried croaker fish', price: 4000, category: 'Proteins', unit: 'piece', minPortions: 10 },
    { name: 'Tilapia Fresh Fish', price: 9500, category: 'Proteins', unit: 'piece', minPortions: 10 },
    { name: 'Eja Osan', price: 12000, category: 'Proteins', unit: 'piece', minPortions: 10 },
    { name: 'Peppered Turkey', price: 4500, category: 'Proteins', minPortions: 10 },
    { name: 'Local Chicken (8pcs)', price: 30000, category: 'Proteins', unit: 'set', minPortions: 1 },
    { name: 'Mongolian beef', price: 4500, category: 'Proteins', minPortions: 10 },

    // MAIN DISHES (10 portions base)
    { name: 'Mexican (Basmati) rice', price: 35000, category: 'Main Dishes', minPortions: 10 },
    { name: 'Xquisite Special Fried Rice', price: 65000, category: 'Main Dishes', minPortions: 10 },
    { name: 'Xquisite fried rice', price: 45000, category: 'Main Dishes', minPortions: 10 },
    { name: 'Local Jollof rice', price: 25000, category: 'Main Dishes', minPortions: 10 },
    { name: 'Ofada rice', price: 20000, category: 'Main Dishes', minPortions: 10 },
    { name: 'Coconut fried rice', price: 45000, category: 'Main Dishes', minPortions: 10 },
    { name: 'Veggie Stir fried noodles', price: 45000, category: 'Main Dishes', minPortions: 10 },
    { name: 'Mixed stir fry noodles', price: 55000, category: 'Main Dishes', minPortions: 10 },
    { name: 'Fettuccine pasta', price: 75000, category: 'Main Dishes', minPortions: 10 },
    { name: 'Porridge yam', price: 45000, category: 'Main Dishes', minPortions: 10 },
    { name: 'Ewa Agoyin', price: 30000, category: 'Main Dishes', minPortions: 10 },
    { name: 'Extra sauce', price: 5000, category: 'Main Dishes', minPortions: 1 },

    // MOI MOI
    { name: 'Moi moi (Plain)', price: 1000, category: 'Sides', minPortions: 10 },
    { name: 'Moi moi (Fish)', price: 1200, category: 'Sides', minPortions: 10 },
    { name: 'Moi moi (Egg)', price: 1200, category: 'Sides', minPortions: 10 },
    { name: 'Moi moi (Fish & Egg)', price: 1500, category: 'Sides', minPortions: 10 },
    { name: 'Moi moi (Corned Beef)', price: 1800, category: 'Sides', minPortions: 10 },

    // SIDES
    { name: 'Fried plantain', price: 1200, category: 'Sides', minPortions: 10 },
    { name: 'Eba', price: 600, category: 'Sides', minPortions: 10 },
    { name: 'Pounded yam', price: 1200, category: 'Sides', minPortions: 10 },
    { name: 'Amala', price: 600, category: 'Sides', minPortions: 10 },

    // SOUPS AND STEWS (3liters)
    { name: 'Assorted meat stew (3L)', price: 45000, category: 'Soups & Stews', minPortions: 1 },
    { name: 'Efo riro (3L)', price: 50000, category: 'Soups & Stews', minPortions: 1 },
    { name: 'Afang (3L)', price: 45000, category: 'Soups & Stews', minPortions: 1 },
    { name: 'Edikinkong (3L)', price: 40000, category: 'Soups & Stews', minPortions: 1 },
    { name: 'Egusi (3L)', price: 40000, category: 'Soups & Stews', minPortions: 1 },
    { name: 'Seafood Okro (with pounded yam)', price: 18000, category: 'Soups & Stews', minPortions: 1 },
    { name: 'Assorted Okro (3L)', price: 45000, category: 'Soups & Stews', minPortions: 1 },
    { name: 'Normal Okro (3L)', price: 25000, category: 'Soups & Stews', minPortions: 1 },
    { name: 'Ewedu (3L)', price: 18000, category: 'Soups & Stews', minPortions: 1 },
    { name: 'Gbegiri (3L)', price: 15000, category: 'Soups & Stews', minPortions: 1 },
    { name: 'Designer sauce (portion)', price: 5500, category: 'Soups & Stews', minPortions: 1 },

    // SALADS (10 PORTIONS)
    { name: 'Ceaser Salad', price: 55000, category: 'Salads', minPortions: 10 },
    { name: 'Chicken Salad', price: 45000, category: 'Salads', minPortions: 10 },
    { name: 'Vegetable Salad with iceberg Lettuce', price: 70000, category: 'Salads', minPortions: 10 },
    { name: 'Coleslaw', price: 20000, category: 'Salads', minPortions: 10 },
    { name: 'Prawn and calamari salad', price: 85000, category: 'Salads', minPortions: 10 },
];
