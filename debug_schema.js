import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugSchema() {
    console.log('--- Debugging Schema ---');

    // 1. Explicitly select 'name'
    console.log('1. Selecting "name" column...');
    const { data: nameData, error: nameError } = await supabase
        .from('inventory')
        .select('name')
        .limit(1);

    if (nameError) {
        console.error('❌ Error selecting name:', nameError);
    } else {
        console.log('✅ Name column access success. Data:', nameData);
    }

    // 2. Explicitly select 'id'
    console.log('2. Selecting "id" column...');
    const { data: idData, error: idError } = await supabase
        .from('inventory')
        .select('id')
        .limit(1);

    if (idError) {
        console.error('❌ Error selecting id:', idError);
    } else {
        console.log('✅ ID column access success. Data:', idData);
    }

    // 3. Attempt insert minimal
    console.log('3. Attempting minimal insert ({ type: "product" })...');
    const { data: insertData, error: insertError } = await supabase
        .from('inventory')
        .insert([{ type: 'product' }]) // Just type
        .select();

    if (insertError) {
        console.error('❌ Insert Error:', insertError);
    } else {
        console.log('✅ Insert Success:', insertData);
        // Cleanup
        if (insertData && insertData[0]) {
            await supabase.from('inventory').delete().eq('id', insertData[0].id); // assuming ID exists/returned
        }
    }
}

debugSchema();
