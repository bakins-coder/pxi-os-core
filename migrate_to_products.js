import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
    console.log('--- Migrating Inventory to Products ---');

    // 1. Fetch valid products from Inventory (the ones we fixed)
    const { data: items, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('type', 'product');

    if (error) {
        console.error('Failed to fetch inventory:', error);
        return;
    }

    console.log(`Found ${items.length} product items in Inventory to migrate.`);

    // 2. Map to Products Schema
    // Products table likely uses: organization_id, name, description, price_cents, category, etc.
    // We update/upsert based on a matching logic (e.g. name + org_id? or just id if shared?)
    // Assuming we want to KEEP the ID if possible, or generate new ones.
    // If we use the same ID, it's safer for relationships.

    const productPayloads = items.map(item => ({
        // id: item.id, // Try to reuse ID?? If tables are 1:1, yes. If products table has different IDs, we might duplicate.
        // Let's reuse ID to maintain potential links? OR let Supabase generate if we want fresh.
        // If we reuse ID, we leverage upsert.
        id: item.id,
        organization_id: item.company_id, // Map company_id -> organization_id
        name: item.name,
        description: item.description,
        price_cents: item.price_cents,
        category: item.category,
        image: item.image,
        // Any other fields?
        is_available: true // Default to true
    }));

    // 3. Upsert into Products
    const { error: upsertError } = await supabase
        .from('products')
        .upsert(productPayloads, { onConflict: 'id' });

    if (upsertError) {
        console.error('Migration Failed:', upsertError);
    } else {
        console.log(`✅ Successfully migrated/upserted ${productPayloads.length} items to 'products' table.`);
    }

    // 4. Verify for Xquisite
    const xquisiteId = '10959119-72e4-4e57-ba54-923e36bba6a6';
    const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('organization_id', xquisiteId);
    console.log(`Total Products for Xquisite now: ${count}`);
}

migrate();
