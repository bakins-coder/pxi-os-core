
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseKey = 'sb_publishable_TPp07l_p9I-77tFRMJJQXg_hXSqs_X7';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEventSave() {
    console.log('--- Starting Event Save Debug ---');

    // 1. Check Auth / Organization
    // We'll try to find the organization 'org-xquisite' (default in store)
    const orgId = '10959119-72e4-4e57-ba54-923e36bba6a6'; // Valid ID
    console.log(`Checking organization: ${orgId}`);

    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', orgId)
        .single();

    if (orgError) {
        console.error('Organization check failed:', orgError);
        // If this fails, inserts will definitely fail due to FK constraints
    } else {
        console.log('Organization found:', org);
    }

    // 2. Prepare Mock Event Payload (Snake Case, matching DB)
    const eventId = `ev-debug-${Date.now()}`;
    const payload = {
        id: eventId,
        organization_id: orgId, // Mapped from companyId
        customer_name: 'Debug Customer',
        event_date: new Date().toISOString().split('T')[0],
        guest_count: 50,
        status: 'Draft',
        current_phase: 'Planning',
        readiness_score: 0,
        items: [], // JSONB
        financials: {
            revenueCents: 100000,
            directCosts: { foodCents: 0, labourCents: 0, energyCents: 0, carriageCents: 0 },
            indirectCosts: { adminCents: 0, marketingCents: 0, waitersCents: 0, logisticsCents: 0 },
            netProfitMargin: 0
        }
    };

    console.log('Attempting insert with payload:', JSON.stringify(payload, null, 2));

    // 3. Attempt Insert
    const { data, error } = await supabase
        .from('catering_events')
        .insert([payload])
        .select();

    if (error) {
        console.error('INSERT FAILED:', error);
        if (error.code === '42501') {
            console.error('RLS VIOLATION: The current user (anon/public) might not have permission.');
        }
    } else {
        console.log('INSERT SUCCESS:', data);

        // Cleanup
        console.log('Cleaning up debug record...');
        const { error: delError } = await supabase
            .from('catering_events')
            .delete()
            .eq('id', eventId);

        if (delError) console.error('Cleanup failed:', delError);
        else console.log('Cleanup success');
    }
}

testEventSave();
