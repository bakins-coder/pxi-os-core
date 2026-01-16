import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
    console.log('--- Deep Dive Inspection ---');

    // 1. Check Assets Table Content (User claims it should be empty)
    const { data: assets, error: assetError } = await supabase.from('assets').select('id, name, image_url, asset_class').limit(20);
    if (assetError) console.error('Asset Error:', assetError);
    console.log('--- Assets Table Content (Sample) ---');
    console.table(assets);

    // 2. Check Reusable Items Table Columns (User says images missing in UI)
    const { data: reusable, error: reusableError } = await supabase.from('reusable_items').select('*').limit(1);
    if (reusableError) console.error('Reusable Error:', reusableError);
    console.log('--- Reusable Items Structure ---');
    if (reusable && reusable.length > 0) {
        console.log('Keys:', Object.keys(reusable[0]));
        console.log('Sample:', reusable[0]);
    }

    // 3. Check combined count to see if we have duplicates
    // This is just a script, can't check store state directly, but can infer from DB.
}

inspect();
