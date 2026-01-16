import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
    console.log('--- Table Inspection ---');

    const tables = ['inventory', 'products', 'reusable_items', 'rental_items', 'assets'];

    for (const t of tables) {
        const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
        if (error) console.log(`Table '${t}': Error/Non-existent (${error.message})`);
        else console.log(`Table '${t}': ${count} rows`);
    }

    // Check specific columns of inventory items that SHOULD be products
    const { data: invProducts } = await supabase.from('inventory').select('*').eq('type', 'product').limit(1);
    if (invProducts && invProducts.length > 0) {
        console.log('Sample Inventory Product:', invProducts[0]);
    }
}

inspect();
