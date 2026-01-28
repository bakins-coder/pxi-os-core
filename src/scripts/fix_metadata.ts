
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, serviceKey);

async function fixMetadata() {
    const EMAIL = 'oreoluwatomiwab@gmail.com';
    console.log(`Checking metadata for ${EMAIL}...`);

    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === EMAIL);

    if (!user) {
        console.error('User not found!');
        return;
    }

    console.log('User Found:', user.id);
    console.log('User Metadata:', user.user_metadata);
    console.log('App Metadata:', user.app_metadata);

    const updates: any = {};
    if (user.user_metadata?.company_id?.startsWith('org-')) {
        console.log('Found BAD company_id in user_metadata!');
        updates.user_metadata = { ...user.user_metadata, company_id: null, organization_id: null };
    }

    // Check app_metadata too (if editable via admin)
    if (user.app_metadata?.company_id?.startsWith('org-')) {
        console.log('Found BAD company_id in app_metadata!');
        updates.app_metadata = { ...user.app_metadata, company_id: null, organization_id: null };
    }

    if (Object.keys(updates).length > 0) {
        console.log('Updating user...');
        const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, updates);
        if (updateError) console.error('Update Failed:', updateError);
        else console.log('Metadata Cleaned!');
    } else {
        console.log('Metadata looks clean (or mismatching check).');
        // Force clean anyway just in case
        console.log('Force cleaning company_id just in case...');
        await supabase.auth.admin.updateUserById(user.id, {
            user_metadata: { ...user.user_metadata, company_id: null, organization_id: null }
        });
        console.log('Force clean done.');
    }
}

fixMetadata();
