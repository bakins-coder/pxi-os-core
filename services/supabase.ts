
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase credentials from your project settings
// These are injected by Vite via the define config or process.env
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * PRODUCTION HELPER: Auth & Session
 */
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};

/**
 * PRODUCTION HELPER: Organization Data Fetching
 */
export const fetchOrgData = async (table: string, orgId: string) => {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('organization_id', orgId);
  
  if (error) throw error;
  return data;
};
