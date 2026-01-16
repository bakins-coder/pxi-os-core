import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
    console.log('--- Inspecting Reusable Items Anomalies ---');

    // 1. Fetch all reusable names
    const { data: allItems, error } = await supabase.from('reusable_items').select('id, name');
    if (error) { console.error(error); return; }

    console.log(`Total Rows: ${allItems.length}`);

    // 2. Check for Duplicates
    const nameMap = {};
    allItems.forEach(item => {
        const name = item.name.trim().toLowerCase();
        if (!nameMap[name]) nameMap[name] = 0;
        nameMap[name]++;
    });

    const duplicates = Object.entries(nameMap).filter(([k, v]) => v > 1);
    console.log(`Unique Names: ${Object.keys(nameMap).length}`);
    console.log(`Names with duplicates: ${duplicates.length}`);
    if (duplicates.length > 0) {
        console.log('Sample Duplicates:', duplicates.slice(0, 5));
    }

    // 3. Check for Food Items (Cross-reference with Products?)
    // Or just look at names commonly associated with food
    const sampleFoodKeywords = ['rice', 'soup', 'chicken', 'beef', 'salad', 'moi', 'yam'];
    const potentialFood = allItems.filter(i => sampleFoodKeywords.some(kw => i.name.toLowerCase().includes(kw)));
    console.log(`Potential Food Items detected in Reusable Items: ${potentialFood.length}`);
    if (potentialFood.length > 0) {
        console.log('Sample Food Items:', potentialFood.slice(0, 5).map(i => i.name));
    }
}

inspect();
