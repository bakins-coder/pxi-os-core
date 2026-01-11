
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Missing Supabase Environment Variables (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY)');
}

// Ensure we are NOT using a service role key on the client
if (supabaseAnonKey?.includes('service_role') || supabaseAnonKey?.startsWith('sb_secret')) {
  console.error('CRITICAL SECURITY ALERT: Attempting to use a Service Role or Secret Key on the client. This is forbidden.');
}

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Check connectivity to the Supabase Cloud
 */
export const checkCloudHealth = async () => {
  if (!supabase) return { status: 'Disconnected', error: 'Missing Credentials' };
  try {
    const { error } = await supabase.from('organizations').select('id').limit(1);
    if (error && error.code !== 'PGRST116') throw error;
    return { status: 'Connected', latency: 'Stable' };
  } catch (e) {
    return { status: 'Error', error: (e as Error).message };
  }
};

/**
 * Synchronize local data block to a remote table
 */
export const syncTableToCloud = async (tableName: string, data: any[]) => {
  if (!supabase) return;

  // Ensure data has the correct snake_case keys for the DB if necessary
  // but for now we expect the DB schema to match the types or vice versa.
  // One important key is company_id vs companyId.
  const sanitizedData = data.map(item => {
    const newItem = { ...item };
    if ('companyId' in newItem) {
      newItem.company_id = newItem.companyId;
      delete newItem.companyId;
    }
    return newItem;
  });

  const { error } = await supabase
    .from(tableName)
    .upsert(sanitizedData, { onConflict: 'id' });

  if (error) {
    console.error(`Cloud Sync Failed [${tableName}]:`, error.message);
    throw error;
  }
};

/**
 * Pull cloud state to local storage, filtered by current session company_id if possible
 */
export const pullCloudState = async (tableName: string, companyId?: string) => {
  if (!supabase) return null;

  let query = supabase.from(tableName).select('*');

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Map back snake_case to camelCase
  return data.map((item: any) => {
    const newItem = { ...item };
    if ('company_id' in newItem) {
      newItem.companyId = newItem.company_id;
      delete newItem.company_id;
    }
    return newItem;
  });
};
