import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
    console.log('--- Debugging Employee Insert ---');

    // 1. Get Xquisite Org ID
    const xquisiteId = '10959119-72e4-4e57-ba54-923e36bba6a6';

    const emp = {
        first_name: 'Tayo',
        last_name: 'Kehinde',
        email: 'tayo.kehinde@example.com',
        role: 'Server', // Ensure this matches enum if exists
        organization_id: xquisiteId,
        status: 'Active',
        salary_cents: 5000000
    };

    console.log('Attempting Insert:', emp);

    const { data, error } = await supabase.from('employees').insert(emp).select();

    if (error) {
        console.error('Insert Failed:', error);
    } else {
        console.log('Insert Success:', data);
        await supabase.from('employees').delete().eq('id', data[0].id);
    }
}

inspect();
