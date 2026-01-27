
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectLatest() {
    console.log("--- Inspecting Latest Invoice & Contact ---");

    const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (invError) {
        console.error("Invoice fetch error:", invError.message);
        return;
    }

    const inv = invoices[0];
    if (!inv) {
        console.log("No invoices found.");
        return;
    }

    console.log("Latest Invoice:", {
        id: inv.id,
        number: inv.number,
        contact_id: inv.contact_id,
        total_cents: inv.total_cents
    });

    const { data: contacts, error: conError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', inv.contact_id);

    if (conError) {
        console.error("Contact fetch error:", conError.message);
    } else {
        console.log("Associated Contact:", contacts[0] || "NOT FOUND");
    }
}

inspectLatest();
