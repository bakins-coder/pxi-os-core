import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
    // 1. Check if "Grilled Salmon Steak" is in products
    const { data: foodInProducts } = await supabase.from('products').select('name').eq('name', 'Grilled Salmon Steak');
    console.log('Is Salmon in Products?', foodInProducts.length > 0);

    // 2. Check if "Side plates" is in products
    const { data: plateInProducts } = await supabase.from('products').select('name').eq('name', 'Side plates');
    console.log('Is Side plates in Products?', plateInProducts.length > 0);

    // 3. Count overlap
    const { data: allProducts } = await supabase.from('products').select('name');
    const productNames = new Set(allProducts.map(p => p.name));

    const { data: allReusable } = await supabase.from('reusable_items').select('name');
    const pollutionCount = allReusable.filter(r => productNames.has(r.name)).length;

    console.log(`Found ${pollutionCount} items in Reusable that are actually Products.`);
}

inspect();
