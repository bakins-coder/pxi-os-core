export interface CuisineProduct {
    name: string;
    price: number;
    category: string;
    minPortions?: number;
    unit?: string;
}

export const PREDEFINED_CUISINE_PRODUCTS: CuisineProduct[] = [
    // WEDDING CAKES
    { name: '3-Tier Luxury Wedding Cake', price: 150000, category: 'Wedding Cakes', minPortions: 1 },
    { name: '2-Tier Classic Wedding Cake', price: 85000, category: 'Wedding Cakes', minPortions: 1 },
    { name: 'Traditional Engagement Cake', price: 65000, category: 'Wedding Cakes', minPortions: 1 },
    { name: 'Pillar Wedding Cake', price: 120000, category: 'Wedding Cakes', minPortions: 1 },
    { name: 'Lustre Design Wedding Cake', price: 95000, category: 'Wedding Cakes', minPortions: 1 },

    // BIRTHDAY CAKES
    { name: 'Character Theme Cake (7")', price: 45000, category: 'Birthday Cakes', minPortions: 1 },
    { name: 'Whipped Cream Celebration Cake', price: 25000, category: 'Birthday Cakes', minPortions: 1 },
    { name: 'Luxury Fondant Birthday Cake', price: 55000, category: 'Birthday Cakes', minPortions: 1 },
    { name: 'Drip Cake with Toppers', price: 35000, category: 'Birthday Cakes', minPortions: 1 },
    { name: 'Number Cake (Single)', price: 30000, category: 'Birthday Cakes', minPortions: 1 },
    { name: 'Chocolate Ganache Birthday Cake', price: 45000, category: 'Birthday Cakes', minPortions: 1 },

    // CUPCAKES & SWEETS
    { name: 'Box of 12 Gourmet Cupcakes', price: 18000, category: 'Cupcakes & Sweets', minPortions: 1 },
    { name: 'Box of 6 Celebration Cupcakes', price: 10000, category: 'Cupcakes & Sweets', minPortions: 1 },
    { name: 'Red Velvet Cupcake Box (12)', price: 20000, category: 'Cupcakes & Sweets', minPortions: 1 },
    { name: 'Assorted Brownies Box (9pcs)', price: 15000, category: 'Cupcakes & Sweets', minPortions: 1 },
    { name: 'Giant Chocolate Chip Cookie', price: 8000, category: 'Cupcakes & Sweets', minPortions: 1 },
    { name: 'Mini Tartlet Box (12pcs)', price: 12000, category: 'Cupcakes & Sweets', minPortions: 1 },

    // SPECIALS
    { name: 'Fruit Cake Loaf (Premium)', price: 15000, category: 'Specials', minPortions: 1 },
    { name: 'Sponge Cake Bundle', price: 12000, category: 'Specials', minPortions: 1 },
    { name: 'Cake Tasting Box', price: 10000, category: 'Specials', minPortions: 1 },
    { name: 'Custom Cake Topper (Gold/Silver)', price: 3500, category: 'Specials', minPortions: 1 },
    { name: 'Personalized Message Card', price: 1500, category: 'Specials', minPortions: 1 },
];
