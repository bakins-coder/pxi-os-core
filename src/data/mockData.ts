import { InventoryItem, Recipe, Contact, ChartOfAccount } from '../types';

export const brochureMenu = [
    // HORS D'OEUVRE
    { id: 'hd-span-ham', cat: "Hors D'Oeuvre", name: "Spanish Ham Selection", price: 4500, desc: "Spanish ham with olives & oranges on toast bread, smoked salmon on a bed of cucumber cup, tuna laced with peppers topping on garlic bread.", img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800' },
    { id: 'hd-shrimp-cocktail', cat: "Hors D'Oeuvre", name: "Shrimp Cocktail Royale", price: 5000, desc: "Classic chilled shrimp cocktail served with house signature dipping sauce.", img: 'https://images.unsplash.com/photo-1551135020-39e4ca508d9b?q=80&w=800' },
    { id: 'hd-noodle-prawn', cat: "Hors D'Oeuvre", name: "Wrapped Noodle Prawn", price: 5500, desc: "Crispy jumbo prawns wrapped in delicate golden noodles.", img: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?q=80&w=800' },
    { id: 'hd-executive-chops', cat: "Hors D'Oeuvre", name: "Executive Small Chops", price: 6500, desc: "Barbecue chicken wings, Money bags, samosa, Prawn roll, spring rolls, vegetable spring rolls.", img: 'https://images.unsplash.com/photo-1541529086526-db283c563270?q=80&w=800' },
    { id: 'hd-snails', cat: "Hors D'Oeuvre", name: "Sauteed Snails", price: 6000, desc: "Spiced African land snails, slow cooked in a rich pepper base.", img: 'https://images.unsplash.com/photo-1547928576-a4a33237bec3?q=80&w=800' },
    { id: 'hd-balls-medley', cat: "Hors D'Oeuvre", name: "Meat & Seafood Balls", price: 2500, desc: "Mixed seafood and meat balls with kebabs, served on skewers.", img: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?q=80&w=800' },

    // STARTERS
    { id: 'st-pepper-soup', cat: "Starters", name: "Xquisite Pepper Soup", price: 6500, desc: "Choice of Goat meat, Fish, or Chicken in rich medicinal broth.", img: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800' },
    { id: 'st-thai-shrimp', cat: "Starters", name: "Thai Spicy Shrimp Soup", price: 7500, desc: "Zesty Thai-style spicy soup with tender shrimps and aromatics.", img: 'https://images.unsplash.com/photo-1548946522-4a313e8972a4?q=80&w=800' },

    // SALADS
    { id: 'sl-caesar', cat: "Salads", name: "Classic Caesar Salad", price: 5500, desc: "Fresh romaine lettuce, parmesan cheese, and garlic croutons.", img: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=800' },
    { id: 'sl-calamari', cat: "Salads", name: "Prawns & Calamari Salad", price: 9500, desc: "Premium seafood selection on a bed of garden fresh greens.", img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800' },
    { id: 'sl-greek', cat: "Salads", name: "Garden Fresh Greek Salad", price: 5500, desc: "Crisp lettuce, feta cheese, kalamata olives, and house vinaigrette.", img: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=800' },

    // NIGERIAN CUISINE
    { id: 'ng-party-classic', cat: "Nigerian Cuisine", name: "Option A: Party Classic", price: 11500, recipeId: 'rec-jollof', desc: "Jollof rice & Special Fried Rice Served with Chicken in Peppered Sauce, Stewed Beef, Coleslaw, Moi-moi or Plantain.", img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800' },
    { id: 'ng-native-feast', cat: "Nigerian Cuisine", name: "Option B: Native Feast", price: 11500, desc: "Efo-Riro/Efo-Elegusi Served with Poundo Yam & Fresh Fish.", img: 'https://images.unsplash.com/photo-1604328723020-2a452136b8a1?q=80&w=800' },
    { id: 'ng-ofada-heritage', cat: "Nigerian Cuisine", name: "Option C: Ofada Heritage", price: 11500, desc: "Ofada Rice Served with Designer Stew, Fried Fish & Plantain or Moi-moi.", img: 'https://images.unsplash.com/photo-1512058560366-cd2429ff5c7c?q=80&w=800' },
    { id: 'ng-roots-beans', cat: "Nigerian Cuisine", name: "Option D: Roots & Beans", price: 11500, desc: "Yam pottage with palm fried fish dry fish sauce OR Ewa agoyin with fried fish & plantain.", img: 'https://images.unsplash.com/photo-1589118949245-7d38baf380d6?q=80&w=800' },
    { id: 'ng-amala-trad', cat: "Nigerian Cuisine", name: "Option E: Amala Traditional", price: 11500, desc: "Amala served with gbegiri, ewedu and assorted meat stew laced with panla & Fresh Fish.", img: 'https://images.unsplash.com/photo-1628294895950-9833222f2991?q=80&w=800' },

    // ORIENTAL
    { id: 'or-chinese-fry', cat: "Oriental", name: "Chinese Fried Rice Medley", price: 12500, desc: "Prawns, lamb fillet, chicken & vegetables stir-fry.", img: 'https://images.unsplash.com/photo-1512058560366-cd2429ff5c7c?q=80&w=800' },
    { id: 'or-stir-fry-noodles', cat: "Oriental", name: "Oriental Stir-fry Noodles", price: 12500, desc: "Stir fry noodles (vegetable and chicken fillet) with signature oyster sauce.", img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=800' },
    { id: 'or-thai-curry', cat: "Oriental", name: "Thai Chicken Curry", price: 12500, desc: "Served with cashew nuts and mixed peppers with steamed basmati.", img: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?q=80&w=800' },
    { id: 'or-goat-ribs', cat: "Oriental", name: "Sticky Rice & Goat Ribs", price: 12500, desc: "Sticky rice served with sticky spicy goat spare ribs and glazed carrots.", img: 'https://images.unsplash.com/photo-1544124499-58912cbddaad?q=80&w=800' },

    // CONTINENTAL
    { id: 'cn-fettuccine', cat: "Continental", name: "Basil Prawn Fettuccine", price: 18500, desc: "Grilled spicy prawns served with fettuccine pasta wrapped in a creamy basil cheese sauce.", img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800' },
    { id: 'cn-mushroom-chicken', cat: "Continental", name: "Chicken in Mushroom Sauce", price: 12500, desc: "Chicken in mushroom sauce served with roast potatoes and steamed vegetables.", img: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=800' },
    { id: 'cn-lamb-steak', cat: "Continental", name: "Roasted Nigerian Lamb", price: 18000, desc: "Slow roasted lamb steak in brown mint sauce with grilled jumbo prawns.", img: 'https://images.unsplash.com/photo-1514516348921-f239abff20cd?q=80&w=800' },
    { id: 'cn-salmon', cat: "Continental", name: "Garlic Salmon Steak", price: 50000, desc: "Grilled salmon steak in a creamy garlic white sauce with special fried rice or mash.", img: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=800' },
    { id: 'cn-oxtail', cat: "Continental", name: "Braised Succulent Oxtail", price: 35000, desc: "Imported tenderized oxtail in Xquisite special brown sauce.", img: 'https://images.unsplash.com/photo-1544124499-58912cbddaad?q=80&w=800' },
    { id: 'cn-batter-medley', cat: "Continental", name: "Seafood Batter Medley", price: 18500, desc: "Fish, prawns and calamari in batter with onion rings, fries and tartar sauce.", img: 'https://images.unsplash.com/photo-1551248429-4223d4474c19?q=80&w=800' },

    // HOT PLATES
    { id: 'hp-prawn-steak', cat: "Hot Plates", name: "Sizzling Prawn & Steak", price: 55000, desc: "Prawn & Imported steak served with special fried rice and steamed vegetables.", img: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800' },
    // Simplified list...
];

export const scannedAssets = [
    { id: 'hw-scan-1', name: "MD's white round plates", qty: 122, cat: 'Crockery', img: 'https://images.unsplash.com/photo-1594913785162-e6786195c8c4?q=80&w=300' },
    { id: 'hw-scan-12', name: "Fettuccine pasta plate (small)", qty: 105, cat: 'Crockery', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=300' }
];

export const initialRecipes: Recipe[] = [
    {
        id: 'rec-jollof',
        name: 'Option A: Party Classic (Jollof Comp)',
        category: 'Main Course',
        portions: [50, 100, 200, 500],
        ingredients: [
            { name: 'Parboiled Rice', qtyPerPortion: 0.25, unit: 'kg', priceSourceQuery: 'Wholesale long grain parboiled rice price Mile 12 Lagos' },
            { name: 'Vegetable Oil', qtyPerPortion: 0.05, unit: 'liters', priceSourceQuery: '25L Vegetable oil price wholesale Lagos' },
            { name: 'Whole Chicken', qtyPerPortion: 0.2, unit: 'kg', priceSourceQuery: 'Frozen chicken wholesale price Lagos per kg' },
            { name: 'Fresh Tomatoes', qtyPerPortion: 0.1, unit: 'kg', priceSourceQuery: 'Fresh tomato basket price Mile 12' },
            { name: 'Onions', qtyPerPortion: 0.05, unit: 'kg', priceSourceQuery: 'Onion bag price wholesale Nigeria' }
        ]
    }
];

export const initialContacts: Contact[] = [
    { id: 'con-1', name: 'Nigerian Breweries', type: 'Company', companyId: 'org-xquisite', email: 'procurement@nbplc.com', phone: '0802 345 6789', sentimentScore: 0.9, contactPerson: 'John Doe' },
    { id: 'con-2', name: 'GTBank HQ', type: 'Company', companyId: 'org-xquisite', email: 'events@gtbank.com', phone: '0803 111 2222', sentimentScore: 0.8, contactPerson: 'Jane Smith' }
];

export const initialChartOfAccounts: ChartOfAccount[] = [
    // ASSETS (1000-1999)
    // Current Assets
    { id: 'coa-1001', code: '1001', name: 'Cash on Hand', type: 'Asset', subtype: 'Current', balanceCents: 5000000, currency: 'NGN' },
    { id: 'coa-1002', code: '1002', name: 'Petty Cash', type: 'Asset', subtype: 'Current', balanceCents: 15000000, currency: 'NGN' },
    { id: 'coa-1003', code: '1003', name: 'GTBank Corporate', type: 'Asset', subtype: 'Current', balanceCents: 2500000000, currency: 'NGN' },
    { id: 'coa-1004', code: '1004', name: 'Zenith Bank Operations', type: 'Asset', subtype: 'Current', balanceCents: 1200000000, currency: 'NGN' },
    { id: 'coa-1005', code: '1005', name: 'Accounts Receivable', type: 'Asset', subtype: 'Current', balanceCents: 0, currency: 'NGN' },
    { id: 'coa-1006', code: '1006', name: 'Inventory Asset', type: 'Asset', subtype: 'Current', balanceCents: 0, currency: 'NGN' },

    // Fixed Assets & Investments
    { id: 'coa-1501', code: '1501', name: 'Vehicles', type: 'Asset', subtype: 'Fixed', balanceCents: 4500000000, currency: 'NGN' },
    { id: 'coa-1502', code: '1502', name: 'Furniture & Fittings', type: 'Asset', subtype: 'Fixed', balanceCents: 1200000000, currency: 'NGN' },
    { id: 'coa-1503', code: '1503', name: 'Kitchen Equipment', type: 'Asset', subtype: 'Fixed', balanceCents: 3500000000, currency: 'NGN' },
    { id: 'coa-1504', code: '1504', name: 'Investments', type: 'Asset', subtype: 'Non-Current', balanceCents: 1000000000, currency: 'NGN' },

    // LIABILITIES (2000-2999)
    { id: 'coa-2001', code: '2001', name: 'Accounts Payable', type: 'Liability', subtype: 'Current', balanceCents: 0, currency: 'NGN' },
    { id: 'coa-2002', code: '2002', name: 'VAT Payable', type: 'Liability', subtype: 'Current', balanceCents: 0, currency: 'NGN' },
    { id: 'coa-2003', code: '2003', name: 'Salaries Payable', type: 'Liability', subtype: 'Current', balanceCents: 0, currency: 'NGN' },
    { id: 'coa-2501', code: '2501', name: 'Bank Loans', type: 'Liability', subtype: 'Long Term', balanceCents: 0, currency: 'NGN' },

    // EQUITY (3000-3999)
    { id: 'coa-3001', code: '3001', name: 'Share Capital', type: 'Equity', subtype: 'Equity', balanceCents: 5000000000, currency: 'NGN' },
    { id: 'coa-3002', code: '3002', name: 'Retained Earnings', type: 'Equity', subtype: 'Equity', balanceCents: 0, currency: 'NGN' },
    { id: 'coa-3003', code: '3003', name: 'General Reserves', type: 'Equity', subtype: 'Equity', balanceCents: 2000000000, currency: 'NGN' },

    // REVENUE (4000-4999)
    { id: 'coa-4001', code: '4001', name: 'Catering Sales', type: 'Revenue', subtype: 'Operating', balanceCents: 0, currency: 'NGN' },
    { id: 'coa-4002', code: '4002', name: 'Banquet Hall Rentals', type: 'Revenue', subtype: 'Operating', balanceCents: 0, currency: 'NGN' },
    { id: 'coa-4003', code: '4003', name: 'Equipment Rentals', type: 'Revenue', subtype: 'Operating', balanceCents: 0, currency: 'NGN' },
    { id: 'coa-4004', code: '4004', name: 'Logistics Services', type: 'Revenue', subtype: 'Operating', balanceCents: 0, currency: 'NGN' },

    // EXPENSES (5000-5999)
    { id: 'coa-5001', code: '5001', name: 'Cost of Goods Sold', type: 'Expense', subtype: 'COGS', balanceCents: 0, currency: 'NGN' },
    { id: 'coa-5002', code: '5002', name: 'Salaries & Wages', type: 'Expense', subtype: 'Operating', balanceCents: 0, currency: 'NGN' },
    { id: 'coa-5003', code: '5003', name: 'Rent & Rates', type: 'Expense', subtype: 'Operating', balanceCents: 0, currency: 'NGN' },
    { id: 'coa-5004', code: '5004', name: 'Electricity & Power', type: 'Expense', subtype: 'Operating', balanceCents: 0, currency: 'NGN' },
    { id: 'coa-5005', code: '5005', name: 'Diesel / Generator Fuel', type: 'Expense', subtype: 'Operating', balanceCents: 0, currency: 'NGN' },
    { id: 'coa-5006', code: '5006', name: 'Marketing & Ads', type: 'Expense', subtype: 'Operating', balanceCents: 0, currency: 'NGN' },
    { id: 'coa-5007', code: '5007', name: 'Transport & Logistics', type: 'Expense', subtype: 'Operating', balanceCents: 0, currency: 'NGN' },
    { id: 'coa-5008', code: '5008', name: 'Repairs & Maintenance', type: 'Expense', subtype: 'Operating', balanceCents: 0, currency: 'NGN' },
    { id: 'coa-5009', code: '5009', name: 'Office Supplies', type: 'Expense', subtype: 'Operating', balanceCents: 0, currency: 'NGN' },
    { id: 'coa-5010', code: '5010', name: 'Legal & Professional Fees', type: 'Expense', subtype: 'Operating', balanceCents: 0, currency: 'NGN' },
    { id: 'coa-5011', code: '5011', name: 'Internet & Telephone', type: 'Expense', subtype: 'Operating', balanceCents: 0, currency: 'NGN' },
    { id: 'coa-5900', code: '5900', name: 'Depreciation', type: 'Expense', subtype: 'Non-Cash', balanceCents: 0, currency: 'NGN' }
];

export const getInitialInventory = () => {
    const inv: InventoryItem[] = [];
    const orgId = 'org-xquisite';

    // Convert brochure menu
    brochureMenu.forEach(item => {
        inv.push({
            id: item.id,
            companyId: orgId,
            name: item.name,
            category: item.cat,
            priceCents: item.price * 100,
            recipeId: (item as any).recipeId || '',
            stockQuantity: 1000,
            isAsset: false,
            isRental: false,
            description: item.desc,
            image: item.img
        } as InventoryItem);
    });

    // Convert scanned assets
    scannedAssets.forEach(asset => {
        inv.push({
            id: asset.id,
            companyId: orgId,
            name: asset.name,
            category: asset.cat,
            priceCents: 150000,
            stockQuantity: asset.qty,
            isAsset: true,
            isRental: false,
            image: asset.img
        } as InventoryItem);
    });

    return inv;
};

export const standardKPIs: Partial<import('../types').PerformanceMetric>[] = [
    { name: 'Customer Satisfaction Score', type: 'KPI', description: 'Average rating from customer feedback', weight: 20 },
    { name: 'Sales Target Achievement', type: 'KPI', description: 'Percentage of monthly sales quota met', weight: 30 },
    { name: 'Code Quality', type: 'KPI', description: 'Bug rate and code review pass rate', weight: 25 },
    { name: 'Team Collaboration', type: 'KPA', description: 'Participation in team meetings and knowledge sharing', weight: 15 },
    { name: 'Punctuality & Attendance', type: 'KPA', description: 'Adherence to work schedule', weight: 10 },
    { name: 'Project Delivery Timeline', type: 'KPI', description: 'Meeting project deadlines', weight: 25 },
    { name: 'Upselling Success Rate', type: 'KPI', description: 'Percentage of deals with upsells', weight: 20 }
];

export const initialPerformanceReviews: import('../types').PerformanceReview[] = [
    {
        id: 'rev-001',
        employeeId: 'emp-101', // Assuming this matches an employee ID
        year: 2025,
        quarter: 'Q1',
        status: 'Draft',
        totalScore: 0,
        metrics: [
            { name: 'Customer Satisfaction Score', type: 'KPI', weight: 50, target: '4.5/5', actual: '', employeeScore: 0, supervisorScore: 0, finalScore: 0, comments: '' },
            { name: 'Team Collaboration', type: 'KPA', weight: 50, target: 'Active Participation', actual: '', employeeScore: 0, supervisorScore: 0, finalScore: 0, comments: '' }
        ]
    }
];
