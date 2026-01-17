import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateRole() {
    console.log('--- Updating Elizabeth to Cook ---');

    // Find Elizabeth
    const { data: emp, error: findError } = await supabase
        .from('employees')
        .select('id')
        .ilike('first_name', 'Elizabeth')
        .ilike('last_name', 'Oke')
        .single();

    if (findError) {
        console.error('Find Error:', findError);
        return;
    }

    if (!emp) {
        console.log('Elizabeth not found.');
        return;
    }

    // Update Role
    const { data, error } = await supabase
        .from('employees')
        .update({ role: 'Cook' })
        .eq('id', emp.id)
        .select();

    if (error) console.error('Update Failed:', error);
    else console.log('Update Success:', data);
}

updateRole();
