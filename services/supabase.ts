
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase credentials from your project settings
// These are injected by Vite via the define config or process.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
