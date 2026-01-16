
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

  // Tables that use 'organization_id' instead of 'company_id'
  const useOrgId = ['reusable_items', 'rental_items', 'ingredients', 'products', 'assets'].includes(tableName);

  // Ensure data has the correct snake_case keys for the DB
  const sanitizedData = data.map(item => {
    const newItem = { ...item };

    if (useOrgId) {
      // Map camelCase companyId if present
      if ('companyId' in newItem) {
        newItem.organization_id = newItem.companyId;
        delete newItem.companyId;
      }
      // Safety: If company_id (snake_case) is present, move it to organization_id or just ensure it's removed
      if ('company_id' in newItem) {
        if (!newItem.organization_id) newItem.organization_id = newItem.company_id;
        delete newItem.company_id;
      }
    } else {
      // Standard tables: ensure company_id is set from companyId
      if ('companyId' in newItem) {
        newItem.company_id = newItem.companyId;
        delete newItem.companyId;
      }
    }

    // Inventory Reverse Mappings
    if ('stockQuantity' in newItem) { newItem.stock_quantity = newItem.stockQuantity; delete newItem.stockQuantity; }
    if ('priceCents' in newItem) { newItem.price_cents = newItem.priceCents; delete newItem.priceCents; }
    if ('costPriceCents' in newItem) { newItem.cost_price_cents = newItem.costPriceCents; delete newItem.costPriceCents; }
    if ('recipeId' in newItem) { newItem.recipe_id = newItem.recipeId; delete newItem.recipeId; }
    if ('isAsset' in newItem) { newItem.is_asset = newItem.isAsset; delete newItem.isAsset; }
    if ('isRental' in newItem) { newItem.is_rental = newItem.isRental; delete newItem.isRental; }
    if ('rentalVendor' in newItem) { newItem.rental_vendor = newItem.rentalVendor; delete newItem.rentalVendor; }

    // Contact Reverse Mappings
    if ('customerType' in newItem) { newItem.customer_type = newItem.customerType; delete newItem.customerType; }

    // Ledger Reverse Mappings
    if ('balanceCents' in newItem) { newItem.balance_cents = newItem.balanceCents; delete newItem.balanceCents; }

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

  // Tables that use 'organization_id' instead of 'company_id'
  const useOrgId = ['reusable_items', 'rental_items', 'ingredients', 'products', 'assets'].includes(tableName);
  console.log(`[Sync Debug] Table: ${tableName}, useOrgId: ${useOrgId}, companyId: ${companyId}`);

  let query = supabase.from(tableName).select('*');

  if (companyId) {
    if (useOrgId) {
      query = query.eq('organization_id', companyId);
    } else {
      query = query.eq('company_id', companyId);
    }
  }

  const { data, error } = await query;

  if (error) throw error;

  // Map back snake_case to camelCase
  return data.map((item: any) => {
    const newItem = { ...item };

    // Explicit mappings for known fields
    if ('company_id' in newItem) { newItem.companyId = newItem.company_id; delete newItem.company_id; }
    if ('organization_id' in newItem) { newItem.companyId = newItem.organization_id; delete newItem.organization_id; }

    // Inventory Mappings
    if ('stock_quantity' in newItem) { newItem.stockQuantity = newItem.stock_quantity; delete newItem.stock_quantity; }
    if ('price_cents' in newItem) { newItem.priceCents = newItem.price_cents; delete newItem.price_cents; }
    if ('cost_price_cents' in newItem) { newItem.costPriceCents = newItem.cost_price_cents; delete newItem.cost_price_cents; }
    if ('recipe_id' in newItem) { newItem.recipeId = newItem.recipe_id; delete newItem.recipe_id; }
    if ('is_asset' in newItem) { newItem.isAsset = newItem.is_asset; delete newItem.is_asset; }
    if ('is_rental' in newItem) { newItem.isRental = newItem.is_rental; delete newItem.is_rental; }
    if ('rental_vendor' in newItem) { newItem.rentalVendor = newItem.rental_vendor; delete newItem.rental_vendor; }

    // Contact Mappings
    if ('customer_type' in newItem) { newItem.customerType = newItem.customer_type; delete newItem.customer_type; }


    // Ledger Mappings
    if ('balance_cents' in newItem) { newItem.balanceCents = newItem.balance_cents; delete newItem.balance_cents; }

    return newItem;
  });
};

// --- RPC Helpers ---

export const postReusableMovement = async (params: any) => {
  if (!supabase) throw new Error("Supabase not initialized");
  const { data, error } = await supabase.rpc('post_reusable_movement', {
    p_org: params.orgId,
    p_item: params.itemId,
    p_delta: params.delta,
    p_unit: params.unitId,
    p_type: params.type,
    p_ref_type: params.refType,
    p_ref_id: params.refId,
    p_location: params.locationId,
    p_notes: params.notes
  });
  if (error) throw error;
  return data;
};

export const postRentalMovement = async (params: any) => {
  if (!supabase) throw new Error("Supabase not initialized");
  const { data, error } = await supabase.rpc('post_rental_movement', {
    p_org: params.orgId,
    p_item: params.itemId,
    p_delta: params.delta,
    p_unit: params.unitId,
    p_type: params.type,
    p_ref_type: params.refType,
    p_ref_id: params.refId,
    p_location: params.locationId,
    p_notes: params.notes
  });
  if (error) throw error;
  return data;
};

export const postIngredientMovement = async (params: any) => {
  if (!supabase) throw new Error("Supabase not initialized");
  const { data, error } = await supabase.rpc('post_ingredient_movement', {
    p_org: params.orgId,
    p_ingredient: params.itemId,
    p_delta: params.delta,
    p_unit: params.unitId,
    p_type: params.type,
    p_ref_type: params.refType,
    p_ref_id: params.refId,
    p_location: params.locationId,
    p_notes: params.notes,
    p_unit_cost_cents: params.unitCostCents,
    p_expires_at: params.expiresAt
  });
  if (error) throw error;
  return data;
};

export const pullInventoryViews = async (viewName: 'v_reusable_inventory' | 'v_rental_inventory' | 'v_ingredient_inventory', orgId: string) => {
  if (!supabase) return [];
  const { data, error } = await supabase.from(viewName).select('*').eq('organization_id', orgId);
  if (error) {
    console.error(`Failed to pull view ${viewName}:`, error);
    return [];
  }
  return data;
};

// --- Media Helpers ---

export const uploadEntityImage = async (
  orgId: string,
  entityType: 'product' | 'ingredient' | 'asset',
  entityId: string,
  base64Data: string
) => {
  if (!supabase) throw new Error("Supabase not initialized");

  // distinct path: product/{org_id}/{product_id}/{timestamp}.jpg
  const filename = `${Date.now()}.jpg`;
  const bucketName = 'product_media'; // As per optimisation plan
  const objectPath = `${entityType}/${orgId}/${entityId}/${filename}`;

  // Convert Base64 to Blob
  const res = await fetch(base64Data);
  const blob = await res.blob();

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(objectPath, blob, {
      contentType: 'image/jpeg',
      upsert: true
    });

  if (error) throw error;

  return { bucket: bucketName, path: objectPath };
};

export const saveEntityMedia = async (
  mediaData: {
    entity_type: string;
    entity_id: string;
    organization_id: string;
    bucket: string;
    object_path: string;
    is_primary: boolean;
  }
) => {
  if (!supabase) throw new Error("Supabase not initialized");

  const { error } = await supabase
    .from('entity_media')
    .insert([mediaData]);

  if (error) throw error;
};
