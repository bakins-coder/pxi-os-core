
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function listColumns() {
    console.log("Fetching sample row to deduce columns...");

    // Attempt to fetch one row
    const { data, error } = await supabase.from('employees').select('*').limit(1);

    if (error) {
        console.error("Error fetching employees:", error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log("Existing Columns in 'employees' table based on data:");
        console.log(Object.keys(data[0]));
    } else {
        console.log("Table is empty. Cannot deduce columns from data via API.");
        // Since we can't query information_schema easily with anon key usually, 
        // we might have to rely on the user's screenshot if this fails or returns empty.
        // But the user screenshot showed columns: id, organization_id, name.
        console.log("Based on user screenshot, columns likely are: id, organization_id, name.");
    }
}

listColumns();
