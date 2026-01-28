
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const originalLog = console.log;
const originalError = console.error;

const log = (...args: any[]) => {
    originalLog(...args);
    const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    try { fs.appendFileSync('sim_login.log', msg + '\n'); } catch (e) { }
};

// Replace console with log
console.log = log;
console.error = log;
try { fs.unlinkSync('sim_login.log'); } catch (e) { }

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
// USE SERVICE KEY TO BYPASS RLS FOR DEBUGGING IF NEEDED, BUT LETS TRY ANON FIRST TO MIMIC CLIENT
const supabaseKey = 'sb_publishable_TPp07l_p9I-77tFRMJJQXg_hXSqs_X7';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseKey);
const adminSupabase = createClient(supabaseUrl, serviceKey);

async function simulate() {
    const EMAIL = 'oreoluwatomiwab@gmail.com';
    const PASSWORD = 'Password123!';
    const STAFF_ID = 'XQ-0006';

    console.log('--- SIMULATING LOGIN FLOW ---');

    // 1. Test RPC Lookup
    console.log(`\n[Step 1] Testing RPC Lookup for ${STAFF_ID}...`);
    const { data: rpcEmail, error: rpcError } = await supabase.rpc('get_email_by_staff_id', { lookup_id: STAFF_ID });
    if (rpcError) console.error('RPC Error:', rpcError);
    else console.log(`RPC Result: ${STAFF_ID} -> ${rpcEmail}`);

    // 2. Test Auth Sign In
    console.log(`\n[Step 2] Signing in with ${EMAIL}...`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: EMAIL,
        password: PASSWORD
    });

    if (authError) {
        console.error('Sign In Failed:', authError.message);
        return;
    }
    const userId = authData.user?.id;
    console.log(`Sign In Success! User ID: ${userId}`);

    // 3. Test Profile Fetch (Mimicking Client)
    console.log(`\n[Step 3] Fetching Profile (User Context)...`);
    // NOTE: Client uses the session from sign in. In Node, supabase client automatically persists? 
    // Usually yes, but let's be explicit and set session if needed, but signInWithPassword handles it.

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id, role, first_name, last_name, is_super_admin')
        .eq('id', userId)
        .single();

    if (profileError) {
        console.error('Profile Fetch Error:', profileError);
    } else {
        console.log('Profile Found:', profile);
    }

    // 4. Test Employee Lookup (Self-Heal Context)
    console.log(`\n[Step 4] Employee Lookup (for Self-Heal)...`);
    const { data: emp, error: empError } = await adminSupabase // Using admin to see if record exists even if RLS hides it
        .from('employees')
        .select('role, organization_id, first_name, last_name, id, staff_id')
        .eq('email', EMAIL)
        .maybeSingle();

    if (empError) console.error('Employee Lookup Error:', empError);
    else console.log('Employee Record:', emp);

    // 5. Check Permissions
    const orgId = profile?.organization_id || emp?.organization_id;
    const role = profile?.role || emp?.role;

    if (orgId && role) {
        console.log(`\n[Step 5] Checking Permissions for ${role} in ${orgId}...`);
        const { data: roleData, error: roleError } = await supabase
            .from('job_roles')
            .select('permissions')
            .eq('organization_id', orgId)
            .eq('title', role)
            .single();

        if (roleError) console.error('Permissions Error:', roleError);
        else console.log('Permissions:', roleData?.permissions?.length || 0, 'tags found');
    } else {
        console.log('\n[Step 5] Skipping Permissions (No Org/Role)');
    }
}

simulate();
