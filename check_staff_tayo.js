import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
    console.log('--- Checking for Staff "Tayo" ---');

    // Check 'employees' table first
    const { data, error } = await supabase.from('employees').select('*').ilike('first_name', '%Tayo%');

    if (error) {
        console.error('Error querying employees:', error.message);
    } else {
        console.log(`Found ${data.length} employees matching 'Tayo'`);
        if (data.length > 0) console.log(data);
    }

    // Check 'employees_api' table if it exists (previous conversation mentioned it)
    const { data: apiData, error: apiError } = await supabase.from('employees_api').select('*').ilike('first_name', '%Tayo%');

    if (apiError) {
        // Table might not exist
        // console.log('employees_api error (might not exist):', apiError.message);
    } else {
        console.log(`Found ${apiData.length} employees_api matches for 'Tayo'`);
        if (apiData.length > 0) console.log(apiData);
    }
}

inspect();
