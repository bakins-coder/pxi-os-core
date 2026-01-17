
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkSchema() {
    console.log("Checking columns of 'employees' table...");

    // Try to select organization_id
    const { data: dataOrg, error: errorOrg } = await supabase.from('employees').select('organization_id').limit(1);

    if (errorOrg) {
        console.log("❌ 'organization_id' column check failed:", errorOrg.message);
    } else {
        console.log("✅ 'organization_id' column exists.");
    }

    // Try to select company_id
    const { data: dataComp, error: errorComp } = await supabase.from('employees').select('company_id').limit(1);

    if (errorComp) {
        console.log("❌ 'company_id' column check failed:", errorComp.message);
    } else {
        console.log("✅ 'company_id' column exists.");
    }
}

checkSchema();
