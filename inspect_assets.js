import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
    console.log('--- Inspecting Assets & Reusable Items ---');

    // Check Assets (Fixed)
    const { data: assets, count: assetCount } = await supabase.from('assets').select('*', { count: 'exact' }).limit(5);
    console.log(`Fixed Assets (assets table): ${assetCount} rows.`);
    if (assets && assets.length > 0) {
        console.log('Sample Asset:', assets[0]);
    } else {
        console.log('No fixed assets found.');
    }

    // Check Reusable Items
    const { count: reusableCount } = await supabase.from('reusable_items').select('*', { count: 'exact', head: true });
    console.log(`Reusable Items: ${reusableCount} rows.`);
}

inspect();
