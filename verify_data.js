
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env.local');

let supabaseUrl = '';
let supabaseKey = '';

try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    const lines = envFile.split('\n');
    for (const line of lines) {
        if (line.startsWith('VITE_SUPABASE_URL=')) {
            supabaseUrl = line.split('=')[1].trim();
        }
        if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
            supabaseKey = line.split('=')[1].trim();
        }
    }
} catch (err) {
    console.error('Error reading .env.local:', err.message);
    process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);


async function verify() {
    console.log('--- Verification Start ---');

    // 1. Check Organizations
    const { data: orgs, error: orgError } = await supabase.from('organizations').select('id, name');
    if (orgError) {
        console.error('Error fetching organizations:', orgError.message);
        if (orgError.code === '42501') console.error('  -> (RLS Permission Denied)');
    } else {
        console.log(`Organizations found: ${orgs.length}`);
        orgs.forEach(o => console.log(`  - [${o.id}] ${o.name}`));
    }

    // 2. Check Inventory (General)
    const { count: inventoryCount, error: invError } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true });

    if (invError) {
        console.error('Error checking inventory count:', invError.message);
    } else {
        console.log(`Total Inventory Items (Visible): ${inventoryCount}`);
    }

    // 3. Check Specific Items
    const { data, error } = await supabase
        .from('inventory')
        .select('name, category, price_cents, company_id')
        .in('name', ['Spanish Ham & Smoked Salmon Platter', 'Nigerian Menu - Option A', 'Apple Pie'])
        .eq('type', 'product');

    if (error) {
        console.error('Error querying specific items:', error.message);
    } else {
        console.log(`Found ${data.length} specific brochure items:`);
        data.forEach(item => {
            console.log(`- ${item.name} (${item.category}): ${(item.price_cents / 100).toFixed(2)} [Company: ${item.company_id}]`);
        });
    }
    console.log('--- Verification End ---');
}

verify();
