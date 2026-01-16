import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
    console.log('--- Inspecting Profile & Org Links ---');

    // 1. Get Xquisite Org ID
    const { data: orgs } = await supabase.from('organizations').select('id, name').ilike('name', '%Xquisite%');
    const xquisiteId = orgs[0]?.id;
    console.log('Xquisite ID:', xquisiteId);

    // 2. Get All Profiles
    const { data: profiles, error } = await supabase.from('profiles').select('id, email, organization_id');

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    if (!profiles) {
        console.log('No profiles found.');
        return;
    }

    // 3. Find profile for Xquisite
    console.log('Total Profiles:', profiles.length);

    profiles.forEach(p => {
        const isMatch = p.organization_id === xquisiteId;
        console.log(`User: ${p.email} | Org: ${p.organization_id} | Match: ${isMatch}`);
    });
}

inspect();
