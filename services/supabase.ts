
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
    const { data, error } = await supabase.from('_health').select('*').limit(1);
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
  const { error } = await supabase
    .from(tableName)
    .upsert(data, { onConflict: 'id' });
  
  if (error) {
    console.error(`Cloud Sync Failed [${tableName}]:`, error.message);
    throw error;
  }
};

/**
 * Pull cloud state to local storage
 */
export const pullCloudState = async (tableName: string) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(tableName)
    .select('*');
  
  if (error) throw error;
  return data;
};
