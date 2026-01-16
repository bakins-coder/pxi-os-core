import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
    console.log('--- Checking Employees Table Columns ---');

    // Check for organization_id (New)
    const { error: orgError } = await supabase.from('employees').select('organization_id').limit(1);
    if (orgError) console.log('organization_id check:', orgError.message);
    else console.log('organization_id exists (Migration Applied).');

    // Check for company_id (Old)
    const { error: companyError } = await supabase.from('employees').select('company_id').limit(1);
    if (companyError) console.log('company_id check:', companyError.message);
    else console.log('company_id exists (Old column still present).');

    // Check for Tayo
    const { data: tayo } = await supabase.from('employees').select('*').ilike('first_name', '%Tayo%');
    console.log(`Found ${tayo?.length} matches for 'Tayo'`);
}

inspect();
