import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
    console.log('--- Inspecting Storage & Clearing Assets ---');

    // 1. List Buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) console.error('Bucket Error:', error);
    else console.log('Buckets:', buckets.map(b => b.name));

    // 2. Clear Assets Table (Danger Zone - but user requested "should be empty")
    const { count, error: delError } = await supabase.from('assets').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    if (delError) console.error('Delete Error:', delError);
    else console.log('Assets table cleared. Rows deleted (if returned):', count); // Count might be null depending on return setting

    // Double check count
    const { count: finalCount } = await supabase.from('assets').select('*', { count: 'exact', head: true });
    console.log('Final Assets Count:', finalCount);
}

inspect();
