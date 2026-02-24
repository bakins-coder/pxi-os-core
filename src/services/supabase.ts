
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

// --- Database Schema Whitelists ---
// These MUST match the columns in src/types/supabase.ts to prevent sync failures.
const SCHEMA_WHITELISTS: Record<string, string[]> = {
  catering_events: ['id', 'company_id', 'organization_id', 'customer_name', 'deal_id', 'event_date', 'guest_count', 'status', 'financials'],
  invoices: ['id', 'company_id', 'number', 'contact_id', 'date', 'due_date', 'status', 'type', 'total_cents', 'subtotal_cents', 'service_charge_cents', 'vat_cents', 'paid_amount_cents', 'manual_set_price_cents', 'discount_cents', 'standard_total_cents', 'lines'],
  requisitions: ['id', 'company_id', 'type', 'category', 'item_name', 'ingredient_id', 'quantity', 'price_per_unit_cents', 'total_amount_cents', 'requestor_id', 'status', 'reference_id', 'notes', 'source_account_id'],
  projects: ['id', 'company_id', 'name', 'client_contact_id', 'status', 'start_date', 'end_date', 'budget_cents', 'progress', 'reference_id', 'ai_alerts'],
  tasks: ['id', 'company_id', 'project_id', 'title', 'description', 'assignee_id', 'assignee_role', 'due_date', 'priority', 'status', 'created_at'],
  contacts: ['id', 'company_id', 'name', 'type', 'email', 'phone', 'address', 'customer_type'],
  employees: ['id', 'organization_id', 'name', 'first_name', 'last_name', 'role', 'email', 'phone', 'phone_number', 'salary_cents', 'health_notes', 'gender', 'dob', 'date_of_employment', 'staff_id', 'user_id', 'avatar', 'id_card_issued_date', 'kpis'],
  ingredients: ['id', 'organization_id', 'name', 'category_id', 'unit_id', 'image_url', 'reorder_point', 'shelf_life_days', 'preferred_supplier_id'],
  products: ['id', 'organization_id', 'name', 'description', 'price_cents', 'category_id', 'product_category_id', 'cuisine', 'image_url', 'is_active', 'lead_time_minutes', 'normalized_name', 'created_at'],
  reusable_items: ['id', 'organization_id', 'name', 'description', 'price_cents', 'stock_quantity', 'stock_level', 'category', 'category_id', 'unit_id', 'image', 'image_url'],
  rental_items: ['id', 'organization_id', 'name', 'replacement_cost_cents', 'supplier_id', 'category_id', 'unit_id', 'image_url'],
  assets: ['id', 'organization_id', 'name', 'asset_class', 'acquisition_cost_cents', 'acquisition_date', 'residual_value_cents', 'serial_no', 'location_id', 'category_id', 'image_url', 'normalized_name'],
  bank_transactions: ['id', 'company_id', 'date', 'description', 'amount_cents', 'type', 'category', 'contact_id', 'bank_account_id', 'reference_id', 'created_at'],
  chart_of_accounts: ['id', 'company_id', 'code', 'name', 'type', 'subtype', 'balance_cents', 'created_at'],
  messages: ['id', 'organization_id', 'sender_id', 'recipient_id', 'content', 'type', 'status', 'created_at', 'read_at'],
  interaction_logs: ['id', 'contact_id', 'type', 'summary', 'content', 'created_by', 'created_at']
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

  const sanitizedData = data.filter(item => {
    if (tableName === 'reusable_items') {
      return item.type === 'asset' || item.type === 'reusable' || item.isAsset === true || item.is_asset === true;
    }
    return true;
  }).map(item => {
    const newItem = { ...item };
    const VALID_UUID = '10959119-72e4-4e57-ba54-923e36bba6a6';

    // 1. Initial ID Mapping
    if (useOrgId) {
      if (newItem.companyId === 'org-xquisite') newItem.companyId = VALID_UUID;
      if ('companyId' in newItem) { newItem.organization_id = newItem.companyId; delete newItem.companyId; }
      if ('company_id' in newItem) {
        if (newItem.company_id === 'org-xquisite') newItem.company_id = VALID_UUID;
        if (!newItem.organization_id) newItem.organization_id = newItem.company_id;
        delete newItem.company_id;
      }
    } else {
      if (newItem.companyId === 'org-xquisite') newItem.companyId = VALID_UUID;
      if ('companyId' in newItem) { newItem.company_id = newItem.companyId; delete newItem.companyId; }
    }

    // 2. Comprehensive Field Conversion (camelCase -> snake_case)
    // Common mappings
    if ('contactId' in newItem) { newItem.contact_id = newItem.contactId; delete newItem.contactId; }
    if ('organizationId' in newItem) { newItem.organization_id = newItem.organizationId; delete newItem.organizationId; }
    if ('totalCents' in newItem) { newItem.total_cents = newItem.totalCents; delete newItem.totalCents; }
    if ('createdAt' in newItem) { newItem.created_at = newItem.createdAt; delete newItem.createdAt; }

    // Inventory/Product
    if ('priceCents' in newItem) { newItem.price_cents = newItem.priceCents; delete newItem.priceCents; }
    if ('stockQuantity' in newItem) {
      newItem.stock_quantity = newItem.stockQuantity;
      newItem.stock_level = newItem.stockQuantity;
      delete newItem.stockQuantity;
    }
    if ('imageUrl' in newItem) { newItem.image_url = newItem.imageUrl; delete newItem.imageUrl; }

    // Catering Special Packing Logic
    if (tableName === 'catering_events') {
      // Pack all fields NOT in the whitelist into the 'financials' object
      // This preserves full frontend state (items, costingSheet, etc.) in a JSONB column
      const whitelist = SCHEMA_WHITELISTS.catering_events || [];
      const packedData: any = { ...newItem.financials };

      const fieldsToPack = [
        'items', 'costingSheet', 'orderType', 'banquetDetails', 'currentPhase',
        'readinessScore', 'tasks', 'hardwareChecklist', 'endDate', 'location',
        'dispatchedAssets', 'logisticsReturns', 'reconciliationStatus', 'portionMonitor'
      ];

      fieldsToPack.forEach(field => {
        if (field in newItem) {
          packedData[field] = newItem[field];
          delete newItem[field];
        }
      });

      newItem.financials = packedData;
      // Ensure company_id is set (catering_events uses both)
      newItem.company_id = newItem.organization_id;
    }

    // 3. Final Whitelist Enforcement
    const whitelist = SCHEMA_WHITELISTS[tableName];
    if (whitelist) {
      const filteredItem: any = {};
      whitelist.forEach(key => {
        if (key in newItem) filteredItem[key] = newItem[key];
      });
      return filteredItem;
    }

    return newItem;
  });

  // Batch items to avoid payload limits
  const BATCH_SIZE = 50;
  for (let i = 0; i < sanitizedData.length; i += BATCH_SIZE) {
    const batch = sanitizedData.slice(i, i + BATCH_SIZE);
    if (batch.length === 0) continue;

    const { error } = await supabase
      .from(tableName)
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`Cloud Sync Failed [${tableName}] (Batch ${i}-${i + BATCH_SIZE}):`, error.message);
      throw error;
    }
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
    'performance_reviews', 'recipes', 'messages'
  ].includes(tableName);

  const VALID_UUID = '10959119-72e4-4e57-ba54-923e36bba6a6';
  const LEGACY_ID = 'org-xquisite';
  const effectiveId = companyId === 'org-xquisite' ? VALID_UUID : companyId;

  // Helper for consistent snake_case to camelCase mapping
  const mapItem = (item: any) => {
    const newItem = { ...item };

    // Org/Company Mappings
    if ('company_id' in newItem) { newItem.companyId = newItem.company_id; delete newItem.company_id; }
    if ('organization_id' in newItem) {
      const orgId = newItem.organization_id;
      newItem.companyId = orgId;
      newItem.organizationId = orgId;
      delete newItem.organization_id;
    }

    // Generic ID Mappings (Shared across many tables)
    if ('contact_id' in newItem) { newItem.contactId = newItem.contact_id; delete newItem.contact_id; }
    if ('reference_id' in newItem) { newItem.referenceId = newItem.reference_id; delete newItem.reference_id; }
    if ('project_id' in newItem) { newItem.projectId = newItem.project_id; delete newItem.project_id; }
    if ('assignee_id' in newItem) { newItem.assigneeId = newItem.assignee_id; delete newItem.assignee_id; }
    if ('ingredient_id' in newItem) { newItem.ingredientId = newItem.ingredient_id; delete newItem.ingredient_id; }
    if ('supplier_id' in newItem) { newItem.supplierId = newItem.supplier_id; delete newItem.supplier_id; }
    if ('category_id' in newItem) { newItem.categoryId = newItem.category_id; delete newItem.category_id; }
    if ('unit_id' in newItem) { newItem.unitId = newItem.unit_id; delete newItem.unit_id; }
    if ('parent_id' in newItem) { newItem.parentId = newItem.parent_id; delete newItem.parent_id; }

    // Generic Field Mappings
    if ('image_url' in newItem) { newItem.imageUrl = newItem.image_url; delete newItem.image_url; }
    if ('budget_cents' in newItem) { newItem.budgetCents = newItem.budget_cents; delete newItem.budget_cents; }
    if ('client_contact_id' in newItem) { newItem.clientContactId = newItem.client_contact_id; delete newItem.client_contact_id; }
    if ('ai_alerts' in newItem) { newItem.aiAlerts = newItem.ai_alerts; delete newItem.ai_alerts; }
    if ('start_date' in newItem) { newItem.startDate = newItem.start_date; delete newItem.start_date; }

    // Catering Mappings & Unpacking
    if (tableName === 'catering_events' && newItem.financials && typeof newItem.financials === 'object') {
      // Unpack fields from 'financials' blob back to top level
      const packedFields = [
        'items', 'costingSheet', 'orderType', 'banquetDetails', 'currentPhase',
        'readinessScore', 'tasks', 'hardwareChecklist', 'endDate', 'location',
        'dispatchedAssets', 'logisticsReturns', 'reconciliationStatus', 'portionMonitor'
      ];

      const financials = newItem.financials;
      packedFields.forEach(field => {
        if (field in financials) {
          newItem[field] = financials[field];
          // We don't delete from financials yet, as it also contains revenue/costs etc.
        }
      });
    }

    if ('order_type' in newItem) { newItem.orderType = newItem.order_type; delete newItem.order_type; }
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

    // Financial Mappings
    if ('paid_amount_cents' in newItem) { newItem.paidAmountCents = newItem.paid_amount_cents; delete newItem.paid_amount_cents; }
    if ('total_cents' in newItem) { newItem.totalCents = newItem.total_cents; delete newItem.total_cents; }
    if ('due_date' in newItem) { newItem.dueDate = newItem.due_date; delete newItem.due_date; }

    // Inventory Mappings
    if ('stock_quantity' in newItem) { newItem.stockQuantity = newItem.stock_quantity; delete newItem.stock_quantity; }
    if ('stock_level' in newItem) { newItem.stockQuantity = newItem.stock_level; delete newItem.stock_level; }
    if ('price_cents' in newItem) { newItem.priceCents = newItem.price_cents; delete newItem.price_cents; }
    if ('cost_price_cents' in newItem) { newItem.costPriceCents = newItem.cost_price_cents; delete newItem.cost_price_cents; }
    if ('recipe_id' in newItem) { newItem.recipeId = newItem.recipe_id; delete newItem.recipe_id; }
    if ('is_asset' in newItem) { newItem.isAsset = newItem.is_asset; delete newItem.is_asset; }
    if ('is_rental' in newItem) { newItem.isRental = newItem.is_rental; delete newItem.is_rental; }
    if ('rental_vendor' in newItem) { newItem.rentalVendor = newItem.rental_vendor; delete newItem.rental_vendor; }

    // Contact Mappings
    if ('customer_type' in newItem) { newItem.customerType = newItem.customer_type; delete newItem.customer_type; }
    if ('registration_number' in newItem) { newItem.registrationNumber = newItem.registration_number; delete newItem.registration_number; }
    if ('job_title' in newItem) { newItem.jobTitle = newItem.job_title; delete newItem.job_title; }

    // Employee Mappings
    if ('first_name' in newItem) { newItem.firstName = newItem.first_name; delete newItem.first_name; }
    if ('last_name' in newItem) { newItem.lastName = newItem.last_name; delete newItem.last_name; }
    if ('phone_number' in newItem) { newItem.phoneNumber = newItem.phone_number; delete newItem.phone_number; }
    if ('salary_cents' in newItem) { newItem.salaryCents = newItem.salary_cents; delete newItem.salary_cents; }
    if ('health_notes' in newItem) { newItem.healthNotes = newItem.health_notes; delete newItem.health_notes; }
    if ('date_of_employment' in newItem) { newItem.dateOfEmployment = newItem.date_of_employment; delete newItem.date_of_employment; }

    // Recipe Mappings
    if ('base_portions' in newItem) { newItem.basePortions = newItem.base_portions; delete newItem.base_portions; }
    if ('ingredient_name' in newItem) { newItem.ingredientName = newItem.ingredient_name; delete newItem.ingredient_name; }
    if ('qty_per_portion' in newItem) { newItem.qtyPerPortion = newItem.qty_per_portion; delete newItem.qty_per_portion; }
    if ('price_source_query' in newItem) { newItem.priceSourceQuery = newItem.price_source_query; delete newItem.price_source_query; }
    if ('sub_recipe_group' in newItem) { newItem.subRecipeGroup = newItem.sub_recipe_group; delete newItem.sub_recipe_group; }

    // Ledger Mappings
    if ('balance_cents' in newItem) { newItem.balanceCents = newItem.balance_cents; delete newItem.balance_cents; }

    // Message Mappings
    if ('sender_id' in newItem) { newItem.senderId = newItem.sender_id; delete newItem.sender_id; }
    if ('recipient_id' in newItem) { newItem.recipientId = newItem.recipient_id; delete newItem.recipient_id; }
    if ('created_at' in newItem) { newItem.createdAt = newItem.created_at; delete newItem.created_at; }
    if ('read_at' in newItem) { newItem.readAt = newItem.read_at; delete newItem.read_at; }

    if (tableName === 'messages') {
      newItem.status = newItem.readAt ? 'read' : 'sent';
    }

    return newItem;
  };

  let query = supabase.from(tableName).select('*');

  if (effectiveId) {
    const col = useOrgId ? 'organization_id' : 'company_id';
    if (effectiveId === VALID_UUID) {
      // Defensive: Query by UUID first
      const { data: uuidData, error: uuidError } = await supabase.from(tableName).select('*').eq(col, VALID_UUID);
      if (uuidError) throw uuidError;

      // Attempt legacy query separately to avoid invalid UUID syntax errors in .or() logic
      try {
        const { data: legacyData, error: legacyError } = await supabase.from(tableName).select('*').eq(col, LEGACY_ID);
        if (!legacyError && legacyData && legacyData.length > 0) {
          return [...(uuidData || []), ...legacyData].map(mapItem);
        }
      } catch (e) {
        console.warn(`[Supabase] Skipping legacy ID for ${tableName} due to type mismatch.`);
      }
      return (uuidData || []).map(mapItem);
    } else {
      query = query.eq(col, effectiveId);
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return data.map(mapItem);
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
