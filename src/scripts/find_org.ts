import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const log = (...args: any[]) => {
    console.log(...args);
    const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    try { fs.appendFileSync('restore.log', msg + '\n'); } catch (e) { }
};

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
// SERVICE KEY FROM final_seed.js
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

if (!supabaseUrl || !supabaseKey) {
    log("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreAccess() {
    const EMAIL = 'oreoluwatomiwab@gmail.com';
    const ORG_NAME = 'Xquisite Celebrations';

    log(`--- RESTORING ACCESS FOR ${EMAIL} ---`);

    // 1. Find User ID via Admin API
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        log("❌ Failed to list users:", listError);
        return;
    }

    const authUser = users.find(u => u.email === EMAIL);
    if (!authUser) {
        log("❌ User not found in Auth system! (Are they actually signed up?)");
        return;
    }
    log(`✅ Found Auth User: ${authUser.id}`);

    // Check Profile
    const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

    if (!existingProfile) {
        log("⚠️ Profile missing. Creating it...");
        const { error: insertError } = await supabase.from('profiles').insert([{
            id: authUser.id,
            email: EMAIL,
            first_name: 'Ore',
            last_name: 'Braithwaite',
            role: 'Admin'
        }]);
        if (insertError) {
            log("❌ Failed to create profile:", insertError);
            return;
        }
        log("✅ Profile created.");
    }

    const userId = authUser.id;

    // 2. Find Organization
    let orgId = null;
    const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')
        .ilike('name', `%${ORG_NAME}%`);

    if (orgs && orgs.length > 0) {
        orgId = orgs[0].id;
        log(`✅ Found Existing Organization: ${orgs[0].name} (${orgId})`);
    } else {
        log(`⚠️ Organization '${ORG_NAME}' not found. Creating it...`);
        const { data: newOrg, error: createError } = await supabase
            .from('organizations')
            .insert([{ name: ORG_NAME, slug: 'xquisite', type: 'Event Management' }]) // Minimal fields
            .select()
            .single();

        if (createError) {
            log("❌ Failed to create org:", createError);
            return;
        }
        orgId = newOrg.id;
        log(`✅ Created Organization: ${orgId}`);
    }

    // 3. Update Profile
    log(`Linking User ${EMAIL} to Org ${orgId}...`);
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            organization_id: orgId,
            role: 'Admin' // Ensure they are admin
        })
        .eq('id', userId);

    if (updateError) {
        log("❌ Failed to update profile:", updateError);
    } else {
        log("✅ SUCCESS! User access restored.");
    }
}

restoreAccess();
