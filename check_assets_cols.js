import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
    // Insert a dummy asset to verify columns if empty (it is empty now)
    // Or just try to select and catch error?
    // Selecting non-existent column throws error.
    // Selecting * returns keys.
    // Since table is empty, I'll insert one row then select it?
    // Or just look at metadata if possible?

    // Easier: try to select 'company_id' -> error. try to select 'organization_id' -> success/empty.

    console.log('--- Checking Assets Columns ---');
    const { error: companyError } = await supabase.from('assets').select('company_id').limit(1);
    if (companyError) console.log('company_id check:', companyError.message);
    else console.log('company_id exists.');

    const { error: orgError } = await supabase.from('assets').select('organization_id').limit(1);
    if (orgError) console.log('organization_id check:', orgError.message);
    else console.log('organization_id exists.');
}

inspect();
