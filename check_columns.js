import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumns() {
    console.log('Checking inventory columns...');
    // We can't easily list columns via JS client without RPC or trying to select everything.
    // We'll try to select one valid item and see what we get, or use 'limit(1)'
    const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error selecting *:', error);
    } else if (data.length > 0) {
        console.log('Keys of first item:', Object.keys(data[0]));
    } else {
        // If no data, we can't see keys. 
        // We'll try to INSERT a dummy item with just 'name' (and company_id) and see if it works.
        console.log('Table empty, attempting insert of minimal item...');

        // First get org
        const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
        if (!orgs || !orgs[0]) { console.error('No orgs found'); return; }

        const dummy = {
            company_id: orgs[0].id,
            name: '__temp_schema_check__',
            type: 'product' // Testing if this causes error
        };

        const { error: insertError } = await supabase.from('inventory').insert(dummy);
        if (insertError) {
            console.error('Insert Error:', insertError);
        } else {
            console.log('Insert with "type" succeeded! Column likely exists.');
            // Cleanup
            await supabase.from('inventory').delete().eq('name', '__temp_schema_check__');
        }
    }
}

checkColumns();
