import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
    console.log('--- Checking Employees Table Columns ---');

    // Check for company_id
    const { error: companyError } = await supabase.from('employees').select('company_id').limit(1);
    if (companyError) console.log('company_id check:', companyError.message);
    else console.log('company_id exists.');

    // Check for organization_id
    const { error: orgError } = await supabase.from('employees').select('organization_id').limit(1);
    if (orgError) console.log('organization_id check:', orgError.message);
    else console.log('organization_id exists.');

    // Check row count
    const { count, error: countError } = await supabase.from('employees').select('*', { count: 'exact', head: true });
    if (countError) console.error('Count Error:', countError.message);
    else console.log('Total Employees in DB:', count);
}

inspect();
