
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars manually since we are running via ts-node
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log("Inspecting 'invoices' table schema...");

    // We can't easily list columns via API without admin privileges or RPC.
    // But we can try to select a single row and see what returns, 
    // OR try to insert a dummy row with all keys and see which one fails.

    // Attempt 1: Select distinct
    const { data, error } = await supabase.from('invoices').select('*').limit(1);

    if (error) {
        console.error("Select Error:", error);
    } else {
        console.log("Select Success. Columns found in returned data:", data && data.length > 0 ? Object.keys(data[0]) : "No rows found to inspect.");
        if (data && data.length > 0) {
            console.log("Example Row:", JSON.stringify(data[0], null, 2));
        }
    }

    // Attempt 2: Check specifically for 'lines' column (failing loudly)
    const { error: linesError } = await supabase.from('invoices').select('lines').limit(1);
    if (linesError) {
        console.error("Lines Column Check Error:", linesError.message);
    } else {
        console.log("Lines column exists.");
    }

    // Attempt 3: Check invoice_lines table
    const { error: invLinesError } = await supabase.from('invoice_lines').select('*').limit(1);
    if (invLinesError) {
        console.log("invoice_lines table check:", invLinesError.message);
    } else {
        console.log("invoice_lines table exists.");
    }
}

inspectSchema();
