import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
    console.log('--- Checking Role Column Type ---');
    // We can check this by trying to insert a random string. 
    // If it's an enum, it will fail with "invalid input value for enum..."

    const dummy = {
        first_name: 'Test',
        last_name: 'Role',
        organization_id: '10959119-72e4-4e57-ba54-923e36bba6a6',
        role: 'RANDOM_STRING_XYZ'
    };

    const { error } = await supabase.from('employees').insert(dummy);
    if (error) {
        console.log('Error:', error.message);
        if (error.message.includes('invalid input value for enum')) {
            console.log('Result: Column is ENUM.');
        } else {
            console.log('Result: Column might be Text (or other constraint).');
        }
    } else {
        console.log('Result: Column is TEXT (Insert succeeded).');
        // Clean up
        await supabase.from('employees').delete().eq('last_name', 'Role');
    }
}

inspect();
