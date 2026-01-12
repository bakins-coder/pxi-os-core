import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
    console.log('🚀 Starting Seed Process (Using JSON source)...');

    // Read JSON
    const jsonPath = path.resolve('menu_items.json');
    console.log(`Reading menu items from ${jsonPath}...`);
    const menuItems = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`Loaded ${menuItems.length} items from JSON.`);

    // 1. Get Organization ID
    console.log('Querying organizations...');
    const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')
        .limit(1);

    if (orgError) {
        console.error('❌ Failed to find any organization (Error):', orgError);
        return;
    }
    const orgId = orgs[0].id;
    console.log(`✅ Found Target Organization: ${orgs[0].name} (${orgId})`);

    // 2. Clear existing products
    console.log('🧹 Clearing existing products...');
    await supabase.from('inventory').delete().eq('company_id', orgId).eq('type', 'product');

    // 3. Prepare Data
    const itemsToInsert = menuItems.map(item => ({
        ...item,
        company_id: orgId,
        type: 'product',
        stock_quantity: 100000
    }));

    // 4. Insert
    console.log('👉 Inserting items...');
    const { data: insertResult, error } = await supabase
        .from('inventory')
        .insert(itemsToInsert)
        .select();

    if (error) {
        console.error('❌ Error Inserting Data:', error);
    } else {
        console.log(`✅ Successfully seeded ${insertResult ? insertResult.length : 0} items!`);
    }

    // 5. Verification Count
    const { count } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'product');

    console.log(`📊 Total Products in Database Now: ${count}`);
}

seed();
