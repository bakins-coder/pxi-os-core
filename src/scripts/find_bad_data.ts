
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, serviceKey);

async function findBadData() {
    const BAD_ID = 'org-1768096603711';
    console.log(`Searching for ${BAD_ID}...`);

    // Check Organizations (likely text id?)
    const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', BAD_ID); // If UUID, this will throw.

    if (orgError) console.log('Orgs Error (Expected if UUID):', orgError.message);
    else console.log('Found in Orgs:', orgs?.length);

    // Check Profiles
    // Profiles might have it in organization_id (if text) or company_id (text)
    const { data: pros, error: proError } = await supabase
        .from('profiles')
        .select('id, email, organization_id, company_id')
        .or(`organization_id.eq.${BAD_ID},company_id.eq.${BAD_ID}`);

    if (proError) console.log('Profiles Check Error:', proError.message);
    else console.log('Found in Profiles:', pros);

    // Check Job Roles
    const { data: roles, error: roleError } = await supabase
        .from('job_roles')
        .select('*')
        .eq('organization_id', BAD_ID);

    if (roleError) console.log('Roles Check Error:', roleError.message);
    else console.log('Found in Roles:', roles);

    // If found in Profiles, let's fix it
    if (pros && pros.length > 0) {
        console.log('Fixing Profiles...');
        for (const p of pros) {
            await supabase.from('profiles').update({ organization_id: null, company_id: null }).eq('id', p.id);
            console.log(`Cleared profile ${p.email}`);
        }
    }
}

findBadData();
