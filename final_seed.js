import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
    console.log('--- FINAL SEED: FULL EXECUTION ---');
    console.log('Querying organizations...');
    const { data: orgs, error } = await supabase
        .from('organizations')
        .select('id, name')
        .limit(1);

    if (error || !orgs || orgs.length === 0) {
        console.error('❌ Error finding org or no org found:', error);
        return;
    }
    const orgId = orgs[0].id;
    console.log(`✅ Organization: ${orgs[0].name}`);

    // Read JSON
    const jsonPath = path.resolve('menu_items.json');
    console.log(`Reading items from ${jsonPath}...`);
    const menuItems = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`Loaded ${menuItems.length} items from JSON.`);

    // Delete Old
    console.log('Clearing old products...');
    const { error: delError } = await supabase.from('inventory').delete().eq('company_id', orgId).eq('type', 'product');
    if (delError) console.error('Delete Error:', delError);
    else console.log('✅ Old products cleared.');

    // Prepare Payload
    const itemsToInsert = menuItems.map(item => ({
        ...item,
        company_id: orgId,
        type: 'product',
        stock_quantity: 100000
    }));

    // Insert
    console.log('Inserting items...');
    const { data: insData, error: insError } = await supabase.from('inventory').insert(itemsToInsert).select();

    if (insError) {
        console.error('❌ Insert Error:', insError);
        console.error('Details:', insError.message);
    } else {
        console.log(`✅ Success! Inserted ${insData ? insData.length : 0} items.`);
    }

    // Verify
    const { count } = await supabase.from('inventory').select('*', { count: 'exact', head: true }).eq('type', 'product');
    console.log(`📊 Final Product Count: ${count}`);
}

seed();
