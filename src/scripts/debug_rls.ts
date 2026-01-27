
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectRLS() {
    console.log("--- Inspecting RLS Policies ---");

    const { data: policies, error } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'invoices');

    let output = "";
    if (error) {
        console.error("Fetch Policies Error:", error);
        output = `Fetch Policies Error: ${JSON.stringify(error)}`;
    } else {
        console.log("Policies found:", policies);
        output = `Policies for 'invoices':\n${JSON.stringify(policies, null, 2)}`;
    }

    fs.writeFileSync('rls_log.txt', output);
}

inspectRLS();
