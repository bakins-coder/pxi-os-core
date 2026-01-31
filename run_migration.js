import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    const sql = fs.readFileSync('supabase/migrations/20260129110000_import_actual_recipes.sql', 'utf8');

    // Supabase JS SDK doesn't have a direct raw SQL execute for arbitrary blocks easily
    // except through an RPC or a specialized internal tool.
    // HOWEVER, we can use the 'postgres' endpoint if we had the connection string.

    // Since we want to use the MCP server if possible, let's try one more thing:
    // Using the Supabase Management API if the MCP server is indeed that.

    console.log('Attempting to execute SQL block...');

    // Use the internal postgres execution via REST if possible, 
    // or just notify the user that I'm ready to run it if they can provide the tool name.

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error('Migration failed:', error);
        if (error.message.includes('function "exec_sql" does not exist')) {
            console.log('Note: exec_sql RPC not found. This is expected if not manually added.');
        }
    } else {
        console.log('Migration successful:', data);
    }
}

runMigration();
