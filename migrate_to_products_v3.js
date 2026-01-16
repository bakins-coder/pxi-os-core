import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
    console.log('--- Migration V3: Handling Collisions ---');

    // 1. Fetch Categories & Ensure they exist
    let { data: existingCats } = await supabase.from('product_categories').select('*');
    if (!existingCats) existingCats = [];
    const catMap = {};
    existingCats.forEach(c => catMap[c.name.toLowerCase()] = c.id);
    existingCats.forEach(c => catMap[c.slug.toLowerCase()] = c.id);

    // Fetch Inventory
    const { data: invItems } = await supabase.from('inventory').select('*').eq('type', 'product');
    const invCats = [...new Set(invItems.map(i => i.category).filter(Boolean))];
    const newCats = [];

    invCats.forEach(catName => {
        let lookup = catName.toLowerCase();
        if (lookup === "hors d'oeuvre") lookup = "hors d'oeuvres";
        if (lookup === "dessert") lookup = "desserts";
        if (!catMap[lookup]) {
            newCats.push({ name: catName, slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-') });
        }
    });

    if (newCats.length > 0) {
        console.log('Creating categories:', newCats.map(c => c.name));
        const { data: created, error } = await supabase.from('product_categories').insert(newCats).select();
        if (created) created.forEach(c => catMap[c.name.toLowerCase()] = c.id);
    }

    // 2. Fetch Existing Products to Check Names
    const xquisiteId = '10959119-72e4-4e57-ba54-923e36bba6a6';
    // We filter by org because unique constraint is scoped to org usually
    const { data: existingProducts } = await supabase.from('products').select('id, name').eq('organization_id', xquisiteId);

    const nameToIdMap = {};
    existingProducts?.forEach(p => {
        nameToIdMap[p.name.toLowerCase()] = p.id;
    });

    // 3. Prepare Payloads
    const productPayloads = invItems.map(item => {
        let catName = item.category || '';
        let catLookup = catName.toLowerCase();
        if (catLookup === "hors d'oeuvre") catLookup = "hors d'oeuvres";
        if (catLookup === "dessert") catLookup = "desserts";

        const existingId = nameToIdMap[item.name.toLowerCase()];

        // If existingId found, use IT (Update). If not, use Inventory ID (Insert).
        const targetId = existingId || item.id;

        return {
            id: targetId,
            organization_id: item.company_id,
            name: item.name,
            description: item.description,
            price_cents: item.price_cents,
            product_category_id: catMap[catLookup] || null,
            is_active: true
        };
    });

    console.log(`Prepared ${productPayloads.length} items for upsert.`);

    // 4. Upsert
    const { error: upsertError } = await supabase
        .from('products')
        .upsert(productPayloads, { onConflict: 'id' });

    if (upsertError) console.error('Upsert Error:', upsertError);
    else console.log('✅ Migration V3 Success.');
}

migrate();
