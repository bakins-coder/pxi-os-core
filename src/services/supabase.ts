
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
    // 42501 = Permission Denied (Means DB is reachable but blocked by RLS) -> Healthy
    // PGRST116 = No Rows -> Healthy
    if (error && error.code !== 'PGRST116' && error.code !== '42501') {
      // Ignore UUID casting errors (caused by bad metadata RLS) - Treat as healthy/blocked
      if (error.message?.includes('input syntax for type uuid')) {
        console.warn('[Cloud] RLS UUID Mismatch detected (Harmless for health check)');
        return { status: 'Connected', latency: 'Stable' };
      }
      throw error;
    }
    return { status: 'Connected', latency: 'Stable' };
  } catch (e) {
    const msg = (e as Error).message.toLowerCase();
    if (msg.includes('input syntax for type uuid')) {
      return { status: 'Connected', latency: 'Stable' };
    }
    // Case insensitive check for schema error (usually "DATABASE ERROR QUERYING SCHEMA")
    if (msg.includes('schema') || msg.includes('database error')) return { status: 'Connected', latency: 'Degraded' };
    return { status: 'Error', error: (e as Error).message };
  }
};

/**
 * Synchronize local data block to a remote table
 */
export const syncTableToCloud = async (tableName: string, data: any[]) => {
  if (!supabase) return;

  // Tables that use 'organization_id' instead of 'company_id'
  const useOrgId = [
    'reusable_items', 'rental_items', 'ingredients', 'products', 'assets',
    'employees', 'catering_events', 'leave_requests', 'categories',
    'rental_stock', 'ingredient_stock_batches', 'performance_reviews'
  ].includes(tableName);

  // Ensure data has the correct snake_case keys for the DB
  const sanitizedData = data.filter(item => {
    // STRICT FILTER: reusable_items should ONLY contain assets
    if (tableName === 'reusable_items') {
      return item.type === 'asset' || item.isAsset === true || item.is_asset === true;
    }
    return true;
  }).map(item => {
    const newItem = { ...item };

    const VALID_UUID = '10959119-72e4-4e57-ba54-923e36bba6a6';

    if (useOrgId) {
      // Map camelCase companyId if present
      if ('companyId' in newItem) {
        if (newItem.companyId === 'org-xquisite') newItem.companyId = VALID_UUID;
        newItem.organization_id = newItem.companyId;
        delete newItem.companyId;
      }
      // Safety: If company_id (snake_case) is present, move it to organization_id or just ensure it's removed
      if ('company_id' in newItem) {
        if (newItem.company_id === 'org-xquisite') newItem.company_id = VALID_UUID;
        if (!newItem.organization_id) newItem.organization_id = newItem.company_id;
        delete newItem.company_id;
      }
    } else {
      // Standard tables: ensure company_id is set from companyId
      if ('companyId' in newItem) {
        if (newItem.companyId === 'org-xquisite') newItem.companyId = VALID_UUID;
        newItem.company_id = newItem.companyId;
        delete newItem.companyId;
      }
    }

    // Inventory Reverse Mappings
    if ('stockQuantity' in newItem) {
      newItem.stock_quantity = newItem.stockQuantity;
      // Some tables (ingredients, maybe others) use stock_level
      if (tableName === 'ingredients' || tableName === 'reusable_items') {
        newItem.stock_level = newItem.stockQuantity;
      }
      delete newItem.stockQuantity;
    }
    if ('priceCents' in newItem) { newItem.price_cents = newItem.priceCents; delete newItem.priceCents; }
    if ('costPriceCents' in newItem) { newItem.cost_price_cents = newItem.costPriceCents; delete newItem.costPriceCents; }
    if ('recipeId' in newItem) { newItem.recipe_id = newItem.recipeId; delete newItem.recipeId; }
    if ('isAsset' in newItem) { newItem.is_asset = newItem.isAsset; delete newItem.isAsset; }
    if ('isRental' in newItem) { newItem.is_rental = newItem.isRental; delete newItem.isRental; }
    if ('rentalVendor' in newItem) { newItem.rental_vendor = newItem.rentalVendor; delete newItem.rentalVendor; }
    if ('subRecipeGroup' in newItem) { newItem.sub_recipe_group = newItem.subRecipeGroup; delete newItem.subRecipeGroup; }

    // Contact Reverse Mappings
    if ('customerType' in newItem) { newItem.customer_type = newItem.customerType; delete newItem.customerType; }
    if ('registrationNumber' in newItem) { newItem.registration_number = newItem.registrationNumber; delete newItem.registrationNumber; }
    if ('jobTitle' in newItem) { newItem.job_title = newItem.jobTitle; delete newItem.jobTitle; }
    // Industry is 'industry' in both, but usually safe to leave or explicitly map if needed (it matches snake_case logic if it's single word).

    // Ledger Reverse Mappings
    if ('balanceCents' in newItem) { newItem.balance_cents = newItem.balanceCents; delete newItem.balanceCents; }

    // Invoice/General Reverse Mappings
    if ('contactId' in newItem) { newItem.contact_id = newItem.contactId; delete newItem.contactId; }
    if ('totalCents' in newItem) { newItem.total_cents = newItem.totalCents; delete newItem.totalCents; }
    if ('paidAmountCents' in newItem) { newItem.paid_amount_cents = newItem.paidAmountCents; delete newItem.paidAmountCents; }
    if ('unitPriceCents' in newItem) { newItem.unit_price_cents = newItem.unitPriceCents; delete newItem.unitPriceCents; }
    if ('dueDate' in newItem) { newItem.due_date = newItem.dueDate; delete newItem.dueDate; }

    // Project Mappings
    if ('budgetCents' in newItem) { newItem.budget_cents = newItem.budgetCents; delete newItem.budgetCents; }
    if ('clientContactId' in newItem) { newItem.client_contact_id = newItem.clientContactId; delete newItem.clientContactId; }
    if ('referenceId' in newItem) { newItem.reference_id = newItem.referenceId; delete newItem.referenceId; }
    if ('aiAlerts' in newItem) { newItem.ai_alerts = newItem.aiAlerts; delete newItem.aiAlerts; }
    if ('startDate' in newItem) { newItem.start_date = newItem.startDate; delete newItem.startDate; }

    // Task Mappings
    if ('projectId' in newItem) { newItem.project_id = newItem.projectId; delete newItem.projectId; }
    if ('assigneeId' in newItem) { newItem.assignee_id = newItem.assigneeId; delete newItem.assigneeId; }
    if ('assigneeRole' in newItem) { newItem.assignee_role = newItem.assigneeRole; delete newItem.assigneeRole; }
    if ('createdDate' in newItem) { newItem.created_at = newItem.createdDate; delete newItem.createdDate; }

    // Contact/General Mappings
    if ('sentimentScore' in newItem) { newItem.sentiment_score = newItem.sentimentScore; delete newItem.sentimentScore; }
    // Employee Reverse Mappings
    if ('phoneNumber' in newItem) { newItem.phone_number = newItem.phoneNumber; delete newItem.phoneNumber; }
    if ('salaryCents' in newItem) { newItem.salary_cents = newItem.salaryCents; delete newItem.salaryCents; }
    if ('healthNotes' in newItem) { newItem.health_notes = newItem.healthNotes; delete newItem.healthNotes; }
    if ('dateOfEmployment' in newItem) { newItem.date_of_employment = newItem.dateOfEmployment; delete newItem.dateOfEmployment; }

    // Name Mapping Logic
    // Name Mapping Logic
    // Name Mapping Logic
    if ('firstName' in newItem || 'lastName' in newItem) {
      if (tableName === 'contacts') {
        // Contacts table only has 'name'
        if (!newItem.name) {
          const f = newItem.firstName || '';
          const l = newItem.lastName || '';
          newItem.name = `${f} ${l}`.trim();
        }
      } else if (tableName === 'employees') {
        // Employees use snake_case
        if (newItem.firstName) newItem.first_name = newItem.firstName;
        if (newItem.lastName) newItem.last_name = newItem.lastName;
      }

      // ALWAYS delete the camelCase versions to prevent DB errors
      delete newItem.firstName;
      delete newItem.lastName;
    }

    // Catering Event Mappings
    if ('customerName' in newItem) { newItem.customer_name = newItem.customerName; delete newItem.customerName; }
    if ('eventDate' in newItem) { newItem.event_date = newItem.eventDate; delete newItem.eventDate; }
    if ('endDate' in newItem) { newItem.end_date = newItem.endDate; delete newItem.endDate; }
    if ('guestCount' in newItem) { newItem.guest_count = newItem.guestCount; delete newItem.guestCount; }
    if ('currentPhase' in newItem) { newItem.current_phase = newItem.currentPhase; delete newItem.currentPhase; }
    if ('readinessScore' in newItem) { newItem.readiness_score = newItem.readinessScore; delete newItem.readinessScore; }
    if ('banquetDetails' in newItem) { newItem.banquet_details = newItem.banquetDetails; delete newItem.banquetDetails; }
    if ('hardwareChecklist' in newItem) { newItem.hardware_checklist = newItem.hardwareChecklist; delete newItem.hardwareChecklist; }
    if ('reconciliationStatus' in newItem) { newItem.reconciliation_status = newItem.reconciliationStatus; delete newItem.reconciliationStatus; }
    if ('costingSheet' in newItem) { newItem.costing_sheet = newItem.costingSheet; delete newItem.costingSheet; }

    if ('portionMonitor' in newItem) { newItem.portion_monitor = newItem.portionMonitor; delete newItem.portionMonitor; }

    // Image Mapping (General)
    if ('image' in newItem) {
      // If it is NOT a URL (e.g. base64), remove it so we don't spam the DB text column.
      // If it IS a URL, leave it alone as 'image' because the DB expects 'image'.
      if (!newItem.image || typeof newItem.image !== 'string' || !newItem.image.startsWith('http')) {
        delete newItem.image;
      }
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

  // Tables that use 'organization_id' instead of 'company_id'
  const useOrgId = [
    'reusable_items', 'rental_items', 'ingredients', 'products', 'assets',
    'employees', 'catering_events', 'job_roles', 'departments',
    'leave_requests', 'categories', 'rental_stock', 'ingredient_stock_batches',
    'performance_reviews', 'recipes'
  ].includes(tableName);

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
    if ('stock_level' in newItem) { newItem.stockQuantity = newItem.stock_level; delete newItem.stock_level; }
    if ('price_cents' in newItem) { newItem.priceCents = newItem.price_cents; delete newItem.price_cents; }
    if ('cost_price_cents' in newItem) { newItem.costPriceCents = newItem.cost_price_cents; delete newItem.cost_price_cents; }
    if ('recipe_id' in newItem) { newItem.recipeId = newItem.recipe_id; delete newItem.recipe_id; }
    if ('is_asset' in newItem) { newItem.isAsset = newItem.is_asset; delete newItem.is_asset; }
    if ('is_rental' in newItem) { newItem.isRental = newItem.is_rental; delete newItem.is_rental; }
    if ('rental_vendor' in newItem) { newItem.rentalVendor = newItem.rental_vendor; delete newItem.rental_vendor; }
    if ('category_id' in newItem) { newItem.categoryId = newItem.category_id; delete newItem.category_id; }
    if ('product_category_id' in newItem) { newItem.productCategoryId = newItem.product_category_id; delete newItem.product_category_id; }

    // Recipe Mappings
    if ('base_portions' in newItem) { newItem.basePortions = newItem.base_portions; delete newItem.base_portions; }
    if ('ingredient_name' in newItem) { newItem.ingredientName = newItem.ingredient_name; delete newItem.ingredient_name; }
    if ('qty_per_portion' in newItem) { newItem.qtyPerPortion = newItem.qty_per_portion; delete newItem.qty_per_portion; }
    if ('price_source_query' in newItem) { newItem.priceSourceQuery = newItem.price_source_query; delete newItem.price_source_query; }
    if ('sub_recipe_group' in newItem) { newItem.subRecipeGroup = newItem.sub_recipe_group; delete newItem.sub_recipe_group; }

    // Contact Mappings
    if ('customer_type' in newItem) { newItem.customerType = newItem.customer_type; delete newItem.customer_type; }
    if ('registration_number' in newItem) { newItem.registrationNumber = newItem.registration_number; delete newItem.registration_number; }
    if ('job_title' in newItem) { newItem.jobTitle = newItem.job_title; delete newItem.job_title; }


    // Ledger Mappings
    if ('balance_cents' in newItem) { newItem.balanceCents = newItem.balance_cents; delete newItem.balance_cents; }

    // Employee Mappings
    if ('first_name' in newItem) { newItem.firstName = newItem.first_name; delete newItem.first_name; }
    if ('last_name' in newItem) { newItem.lastName = newItem.last_name; delete newItem.last_name; }

    // Legacy Name Support: If firstName is missing but 'name' exists, map it
    if (!newItem.firstName && 'name' in newItem) {
      newItem.firstName = newItem.name;
    }

    if ('phone_number' in newItem) { newItem.phoneNumber = newItem.phone_number; delete newItem.phone_number; }
    if ('salary_cents' in newItem) { newItem.salaryCents = newItem.salary_cents; delete newItem.salary_cents; }
    if ('health_notes' in newItem) { newItem.healthNotes = newItem.health_notes; delete newItem.health_notes; }
    if ('date_of_employment' in newItem) { newItem.dateOfEmployment = newItem.date_of_employment; delete newItem.date_of_employment; }

    // Invoice / General Detail Mappings
    if ('contact_id' in newItem) { newItem.contactId = newItem.contact_id; delete newItem.contact_id; }
    if ('total_cents' in newItem) { newItem.totalCents = newItem.total_cents; delete newItem.total_cents; }
    if ('paid_amount_cents' in newItem) { newItem.paidAmountCents = newItem.paid_amount_cents; delete newItem.paid_amount_cents; }
    if ('unit_price_cents' in newItem) { newItem.unitPriceCents = newItem.unit_price_cents; delete newItem.unit_price_cents; }

    // Catering Event Mappings
    if ('customer_name' in newItem) { newItem.customerName = newItem.customer_name; delete newItem.customer_name; }
    if ('event_date' in newItem) { newItem.eventDate = newItem.event_date; delete newItem.event_date; }
    if ('end_date' in newItem) { newItem.endDate = newItem.end_date; delete newItem.end_date; }
    if ('guest_count' in newItem) { newItem.guestCount = newItem.guest_count; delete newItem.guest_count; }
    if ('current_phase' in newItem) { newItem.currentPhase = newItem.current_phase; delete newItem.current_phase; }
    if ('readiness_score' in newItem) { newItem.readinessScore = newItem.readiness_score; delete newItem.readiness_score; }
    if ('banquet_details' in newItem) { newItem.banquetDetails = newItem.banquet_details; delete newItem.banquet_details; }
    if ('hardware_checklist' in newItem) { newItem.hardwareChecklist = newItem.hardware_checklist; delete newItem.hardware_checklist; }
    if ('reconciliation_status' in newItem) { newItem.reconciliationStatus = newItem.reconciliation_status; delete newItem.reconciliation_status; }
    if ('costing_sheet' in newItem) { newItem.costingSheet = newItem.costing_sheet; delete newItem.costing_sheet; }
    if ('portion_monitor' in newItem) { newItem.portionMonitor = newItem.portion_monitor; delete newItem.portion_monitor; }

    // Image Mapping (General)
    if ('image_url' in newItem) { newItem.imageUrl = newItem.image_url; delete newItem.image_url; }
    if ('primary_image_url' in newItem) { newItem.primaryImageUrl = newItem.primary_image_url; delete newItem.primary_image_url; }
    // Fallback for stock_level if stock_quantity is missing (common schema variance)
    if (!('stockQuantity' in newItem) && 'stock_level' in newItem) {
      newItem.stockQuantity = newItem.stock_level;
      delete newItem.stock_level;
    }


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
  console.log('[Supabase] uploadEntityImage called');
  if (!supabase) throw new Error("Supabase not initialized");

  // distinct path: product/{org_id}/{product_id}/{timestamp}.jpg
  const filename = `${Date.now()}.jpg`;
  const bucketName = 'product_media';
  const objectPath = `${entityType}/${orgId}/${entityId}/${filename}`;

  console.log('[Supabase] Converting base64...');

  // Robust Base64 to Blob conversion
  const base64Clean = base64Data.split(',')[1] || base64Data;
  const binaryStr = atob(base64Clean);
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'image/jpeg' });

  console.log('[Supabase] Uploading to bucket:', bucketName, 'Path:', objectPath);

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(objectPath, blob, {
      contentType: 'image/jpeg',
      upsert: true
    });

  if (error) {
    console.error('[Supabase] Upload Error:', error);
    throw error;
  }

  console.log('[Supabase] Upload Success:', data);
  return { bucket: bucketName, path: data.path };
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
