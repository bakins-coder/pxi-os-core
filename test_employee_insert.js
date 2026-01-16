import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
    console.log('--- Testing Employee Insert (Service Key) ---');

    // 1. Get Xquisite Org ID
    const { data: orgs } = await supabase.from('organizations').select('id, name').ilike('name', '%Xquisite%');
    const xquisiteId = orgs[0]?.id;
    console.log('Xquisite ID:', xquisiteId);

    if (!xquisiteId) {
        console.error('Org not found');
        return;
    }

    // 2. Insert Dummy Employee
    const dummy = {
        first_name: 'Test',
        last_name: 'Bot',
        role: 'Tester',
        email: 'test@bot.com',
        salary_cents: 100000,
        status: 'Active',
        company_id: xquisiteId
    };

    const { data, error } = await supabase.from('employees').insert(dummy).select();

    if (error) {
        console.error('Insert Failed:', error);
    } else {
        console.log('Insert Success:', data);
        // Clean up
        await supabase.from('employees').delete().eq('id', data[0].id);
        console.log('Cleaned up dummy.');
    }
}

inspect();
