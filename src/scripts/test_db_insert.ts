
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log("Attempting direct insert into 'employees'...");

    const testId = crypto.randomUUID();
    // Default organization_id from the user's profile is needed for RLS.
    // However, with service_role we bypass RLS, but here we use ANON KEY.
    // So we must insert with an org_id that matches the authenticated user?
    // Wait, the script runs as ANON but *without* a session?
    // If table has RLS, this insert will FAIL if I'm not logged in as a user who owns the org.
    // This is a tricky part of testing RLS protected tables with scripts.

    // I need to sign in a user first? Or just disable RLS for a moment? I can't disable RLS.
    // Use the stored credentials from `useAuthStore`? No access to browser storage here.

    // Let's try to fetch a public table or see if I can get a session.
    // Alternatively, I can rely on the fact that if RLS is on, this WILL fail with a specific error "new row violates row-level security policy".
    // That error would confirm RLS is active and potentially blocking the app if the app user isn't correctly authenticated or org mismatch.

    // BUT the APP has a logged in user.

    // Let's try to insert with a hardcoded org-xquisite (if that's what the seed uses) and see the error.

    const payload = {
        id: testId,
        organization_id: '10959119-72e4-4e57-ba54-923e36bba6a6', // Existing seed org
        first_name: 'Test',
        last_name: 'Bot',
        role: 'Tester',
        email: `test-${Date.now()}@example.com`,
        status: 'Active'
    };

    const { data, error } = await supabase.from('employees').insert([payload]).select();

    if (error) {
        console.error("Insert Failed:", error);
    } else {
        console.log("Insert Success:", data);
        // Clean up
        await supabase.from('employees').delete().eq('id', testId);
    }
}

testInsert();
