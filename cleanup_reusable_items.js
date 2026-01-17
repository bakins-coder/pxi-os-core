import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmhudHZqcWNpYXJka2pwZnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE3NDcxNCwiZXhwIjoyMDgxNzUwNzE0fQ.G02TaPK-IfNljTB7haxMV4vGCExzj47zT9jZCGVccAY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanup() {
    console.log("Starting Cleanup...");

    // 1. Fetch valid Product Names to identify pollution
    const { data: products } = await supabase.from('products').select('name');
    if (!products) {
        console.error("Failed to fetch products");
        return;
    }
    const productNames = new Set(products.map(p => p.name));
    console.log(`Loaded ${productNames.size} product names.`);

    // 2. Fetch all Reusable Items
    const { data: reusables, error } = await supabase.from('reusable_items').select('id, name');
    if (error) {
        console.error("Failed to fetch reusables:", error);
        return;
    }

    const itemsToDelete = [];
    const pollutionIds = [];
    const knownNames = new Set();
    const duplicateIds = [];

    // 3. Identify Pollution and Duplicates
    for (const item of reusables) {
        // Check Pollution
        if (productNames.has(item.name)) {
            pollutionIds.push(item.id);
            continue; // Don't check duplicates for pollution, just nuke it
        }

        // Check Duplicates (Keep First)
        if (knownNames.has(item.name)) {
            duplicateIds.push(item.id);
        } else {
            knownNames.add(item.name);
        }
    }

    // 4. Execute Deletion
    const totalToDelete = [...pollutionIds, ...duplicateIds];

    console.log(`Found ${pollutionIds.length} polluted items (food).`);
    console.log(`Found ${duplicateIds.length} duplicate items.`);
    console.log(`Total to delete: ${totalToDelete.length}`);

    if (totalToDelete.length > 0) {
        const { error } = await supabase.from('reusable_items').delete().in('id', totalToDelete);
        if (error) {
            console.error("Deletion failed:", error);
        } else {
            console.log("Cleanup SUCCESS. Deleted bad records.");
        }
    } else {
        console.log("No items to clean.");
    }
}

cleanup();
