import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
    console.log('--- Inspecting Categories ---');

    // Try 'product_categories'
    const { data, error } = await supabase.from('product_categories').select('*');

    if (error) {
        console.error('Error fetching product_categories:', error.message);
        // Try 'categories'
        const { data: catData, error: catError } = await supabase.from('categories').select('*');
        if (catError) console.error('Error fetching categories:', catError.message);
        else console.log('Found in categories table:', catData);
    } else {
        console.log('Found in product_categories table:', data);
    }
}

inspect();
