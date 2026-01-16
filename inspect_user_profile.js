import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
    console.log('--- Inspecting Auth Users ---');

    // List users
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Auth List Error:', error);
        return;
    }

    console.log(`Found ${users.length} users.`);

    // Find likely Xquisite users
    const targets = users.filter(u =>
        (u.email && u.email.toLowerCase().includes('xquisite')) ||
        (u.email && u.email.toLowerCase().includes('akin')) ||
        (u.user_metadata && JSON.stringify(u.user_metadata).toLowerCase().includes('xquisite'))
    );

    for (const u of targets) {
        console.log(`\nUser: ${u.email} (${u.id})`);
        console.log('Metadata:', u.user_metadata);

        // Check Profile
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', u.id).single();
        console.log('Profile:', profile || 'NO PROFILE FOUND');
    }
}

inspect();
