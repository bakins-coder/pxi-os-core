import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanup() {
    console.log('--- Cleaning Up Reusable Items ---');

    // 1. Fetch Products to identify Food
    const { data: products } = await supabase.from('products').select('name');
    const productNames = new Set(products.map(p => p.name.trim().toLowerCase()));

    // 2. Fetch all Reusable Items
    // Limit is 1000 by default, need loop or higher limit?
    // Let's assume < 2000 for now.
    const { data: allItems, error } = await supabase.from('reusable_items').select('id, name').range(0, 1999);
    if (error) { console.error(error); return; }

    console.log(`Analyzing ${allItems.length} items...`);

    const idsToDelete = [];
    const keptNames = new Set();
    let foodCount = 0;
    let duplicateCount = 0;

    allItems.forEach(item => {
        const name = item.name.trim().toLowerCase();

        // A. Is it Food? (In products list)
        if (productNames.has(name)) {
            idsToDelete.push(item.id);
            foodCount++;
            return; // Deleted
        }

        // B. Is it a Duplicate?
        if (keptNames.has(name)) {
            idsToDelete.push(item.id);
            duplicateCount++;
        } else {
            keptNames.add(name); // Keep this one
        }
    });

    console.log(`Found ${foodCount} Food Items to remove.`);
    console.log(`Found ${duplicateCount} Duplicates to remove.`);
    console.log(`Total to Delete: ${idsToDelete.length}`);
    console.log(`Remaining Unique Reusables: ${keptNames.size}`);

    // 3. Execute Deletion
    if (idsToDelete.length > 0) {
        // Chunk deletion to avoid URL length limits
        const chunkSize = 100;
        for (let i = 0; i < idsToDelete.length; i += chunkSize) {
            const chunk = idsToDelete.slice(i, i + chunkSize);
            const { error: delError } = await supabase.from('reusable_items').delete().in('id', chunk);
            if (delError) console.error('Delete Error:', delError);
            else console.log(`Deleted chunk ${i / chunkSize + 1}`);
        }
        console.log('Deletion Complete');
    }
}

cleanup();
