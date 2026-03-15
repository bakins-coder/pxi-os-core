
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
// SERVICE KEY
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceReset() {
    const TARGET_EMAIL = 'oreoluwatomiwab@gmail.com';
    const NEW_PASSWORD = 'Password123!';

    console.log(`Searching for users...`);

    // Check for typos in what user might be using
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error("List Error:", error);
        return;
    }

    console.log("Found Users matching 'ore' or 'miwa':");
    users.forEach(u => {
        if (u.email?.includes('ore') || u.email?.includes('miwa')) {
            console.log(` - ${u.email} (ID: ${u.id})`);
        }
    });

    const user = users.find(u => u.email === TARGET_EMAIL);

    if (!user) {
        console.error(`TARGET USER ${TARGET_EMAIL} NOT FOUND!`);
        return;
    }

    console.log(`Updating password for ${user.email}...`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: NEW_PASSWORD }
    );

    if (updateError) {
        console.error("Update Failed:", updateError);
    } else {
        console.log("✅ PASSWORD UPDATED SUCCESSFULLY.");
        console.log(`New Credentials:`);
        console.log(`Email: ${TARGET_EMAIL}`);
        console.log(`Pass:  ${NEW_PASSWORD}`);
    }
}

forceReset();
