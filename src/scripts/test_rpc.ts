
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbfhntvjqciardkjpfpy.supabase.co';
const supabaseKey = 'sb_publishable_TPp07l_p9I-77tFRMJJQXg_hXSqs_X7';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpc() {
    console.log('Testing RPC get_email_by_staff_id...');
    const start = Date.now();
    const { data, error } = await supabase
        .rpc('get_email_by_staff_id', { lookup_id: 'oreoluwator' });

    console.log(`Time: ${Date.now() - start}ms`);
    console.log('Result:', data);
    console.log('Error:', error);
}

testRpc();
