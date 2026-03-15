
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, serviceKey);

async function clean() {
    console.log('Fetching all profiles to check for bad data...');

    // Fetch all profiles (assuming small number, pages if needed but let's start simple)
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, organization_id');

    if (error) {
        console.error('Fetch Error:', error);
        return;
    }

    console.log(`Scanned ${profiles.length} profiles.`);
    const BAD_PREFIX = 'org-';

    for (const p of profiles) {
        let needsFix = false;
        let updates: any = {};

        if (p.organization_id && typeof p.organization_id === 'string' && p.organization_id.startsWith(BAD_PREFIX)) {
            console.log(`Found BAD organization_id in ${p.email}: ${p.organization_id}`);
            updates.organization_id = null;
            needsFix = true;
        }

        if (p.company_id && typeof p.company_id === 'string' && p.company_id.startsWith(BAD_PREFIX)) {
            console.log(`Found BAD company_id in ${p.email}: ${p.company_id}`);
            updates.company_id = null;
            needsFix = true;
        }

        if (needsFix) {
            console.log(`Cleaning profile ${p.email}...`);
            const { error: updateError } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', p.id);

            if (updateError) console.error('Update Failed:', updateError);
            else console.log('Fixed!');
        }
    }
    console.log('Done cleaning profiles.');

    console.log('Fetching job_roles...');
    const { data: roles, error: roleError } = await supabase
        .from('job_roles')
        .select('id, organization_id');

    if (roleError) console.error('Roles Error:', roleError);
    else {
        console.log(`Scanned ${roles.length} roles.`);
        for (const r of roles) {
            if (r.organization_id && typeof r.organization_id === 'string' && r.organization_id.startsWith(BAD_PREFIX)) {
                console.log(`Found BAD role ${r.id} with org ${r.organization_id}`);
                await supabase.from('job_roles').delete().eq('id', r.id);
                console.log('Deleted bad role.');
            }
        }
    }
    console.log('Done cleaning roles.');
}

clean();
