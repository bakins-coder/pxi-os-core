
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// Initialize client only if credentials exist
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
