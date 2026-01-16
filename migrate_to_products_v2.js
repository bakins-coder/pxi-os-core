import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
    console.log('--- robust Migrating Inventory to Products ---');

    // 1. Fetch Existing Categories
    let { data: existingCats } = await supabase.from('product_categories').select('*');
    if (!existingCats) existingCats = [];

    const catMap = {}; // Name -> ID
    existingCats.forEach(c => catMap[c.name.toLowerCase()] = c.id);
    existingCats.forEach(c => catMap[c.slug.toLowerCase()] = c.id); // fuzzy match by slug too

    console.log('Existing Categories:', Object.keys(catMap));

    // 2. Identify Categories from Inventory
    // We fixed types for: "Hors D'Oeuvre", "Starters", "Salads", "Nigerian Cuisine", "Oriental", "Continental", "Hot Plates", "Dessert"
    const { data: items } = await supabase.from('inventory').select('*').eq('type', 'product');

    if (!items || items.length === 0) {
        console.log('No products found in inventory.');
        return;
    }

    const inventoryCategories = [...new Set(items.map(i => i.category).filter(Boolean))];
    console.log('Inventory Categories Needed:', inventoryCategories);

    // 3. Ensure Categories Exist
    const newCatsToCreate = [];
    inventoryCategories.forEach(catName => {
        // Normalization for matching
        let lookup = catName.toLowerCase();
        // Manual Mapping fixes
        if (lookup === "hors d'oeuvre") lookup = "hors d'oeuvres"; // plural diff
        if (lookup === "dessert") lookup = "desserts";

        if (!catMap[lookup]) {
            console.log(`Need to create category: ${catName}`);
            newCatsToCreate.push({
                name: catName,
                slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            });
        }
    });

    if (newCatsToCreate.length > 0) {
        const { data: createdCats, error: createError } = await supabase
            .from('product_categories')
            .insert(newCatsToCreate)
            .select();

        if (createError) console.error('Error creating categories:', createError);
        else {
            createdCats.forEach(c => {
                catMap[c.name.toLowerCase()] = c.id;
                console.log(`Created: ${c.name} -> ${c.id}`);
            });
        }
    }

    // 4. Migrate Products
    const productPayloads = items.map(item => {
        let catName = item.category || '';
        let lookup = catName.toLowerCase();
        if (lookup === "hors d'oeuvre") lookup = "hors d'oeuvres";
        if (lookup === "dessert") lookup = "desserts";

        let catId = catMap[lookup] || null;

        // If no catId found, maybe map to 'Main' or generic? 
        // For now, if null, it stays null (or we could default to 'Main')

        return {
            id: item.id,
            organization_id: item.company_id,
            name: item.name,
            description: item.description,
            price_cents: item.price_cents,
            product_category_id: catId, // THE CORRECT COLUMN
            is_active: true
        };
    });

    const { error: upsertError } = await supabase
        .from('products')
        .upsert(productPayloads, { onConflict: 'id' });

    if (upsertError) {
        console.error('Migration Failed:', upsertError);
    } else {
        console.log(`✅ Successfully migrated/upserted ${productPayloads.length} items to 'products' table.`);
    }
}

migrate();
