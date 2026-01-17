
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmployee() {
    console.log("Checking for 'Olaboye' in employees table...");

    // We'll search by first name or last name loosely
    const { data, error } = await supabase
        .from('employees')
        .select('*')
        .or('first_name.ilike.%Olaboye%,last_name.ilike.%Olaboye%');

    if (error) {
        console.error("Error querying database:", error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log("✅ Employee Found:");
        data.forEach(emp => {
            console.log(`- ${emp.first_name} ${emp.last_name} (Role: ${emp.role}, ID: ${emp.id})`);
        });
    } else {
        console.log("❌ Employee 'Olaboye' NOT found in the database.");
    }
}

checkEmployee();
