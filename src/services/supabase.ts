
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
  catering_events: ['id', 'company_id', 'organization_id', 'customer_name', 'deal_id', 'event_date', 'guest_count', 'status', 'financials', 'cuisine_details'],
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
    if ('customerName' in newItem) { newItem.customer_name = newItem.customerName; delete newItem.customerName; }
    if ('guestCount' in newItem) { newItem.guest_count = newItem.guestCount; delete newItem.guestCount; }
    if ('itemName' in newItem) { newItem.item_name = newItem.itemName; delete newItem.itemName; }
    if ('pricePerUnitCents' in newItem) { newItem.price_per_unit_cents = newItem.pricePerUnitCents; delete newItem.pricePerUnitCents; }
    if ('totalAmountCents' in newItem) { newItem.total_amount_cents = newItem.totalAmountCents; delete newItem.totalAmountCents; }
    if ('requestorId' in newItem) { newItem.requestor_id = newItem.requestorId; delete newItem.requestorId; }
    if ('sourceAccountId' in newItem) { newItem.source_account_id = newItem.sourceAccountId; delete newItem.sourceAccountId; }
    if ('referenceId' in newItem) { newItem.reference_id = newItem.referenceId; delete newItem.referenceId; }
    if ('ingredientId' in newItem) { newItem.ingredient_id = newItem.ingredientId; delete newItem.ingredientId; }

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
      const packedData: any = { ...newItem.financials };

      const fieldsToPack = [
        'items', 'costingSheet', 'orderType', 'banquetDetails', 'cuisineDetails', 'currentPhase',
        'readinessScore', 'tasks', 'hardwareChecklist', 'endDate', 'location',
        'dispatchedAssets', 'logisticsReturns', 'reconciliationStatus', 'portionMonitor',
        'customerName', 'guestCount'
      ];

      fieldsToPack.forEach(field => {
        if (field in newItem && newItem[field] !== undefined && newItem[field] !== null) {
          packedData[field] = newItem[field];
          // delete newItem[field]; // Already mapped to snake_case if in whitelist
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
      if (tableName === 'catering_events') {
        console.log(`[Supabase] Syncing catering_event ${newItem.id}:`, {
          customer_name: newItem.customer_name,
          guest_count: newItem.guest_count,
          financials: !!newItem.financials
        });
      }

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
 * Consistent snake_case to camelCase mapping for incoming Supabase data
 */
export const mapIncomingRow = (tableName: string, item: any) => {
  if (!item) return item;
  const newItem = { ...item };

  // 1. Column Mappings (Snake -> Camel)
  const mappings: Record<string, string> = {
    'company_id': 'companyId',
    'organization_id': 'organizationId',
    'contact_id': 'contactId',
    'customer_id': 'customerId',
    'bank_account_id': 'bankAccountId',
    'reference_id': 'referenceId',
    'project_id': 'projectId',
    'assignee_id': 'assigneeId',
    'ingredient_id': 'ingredientId',
    'supplier_id': 'supplierId',
    'category_id': 'categoryId',
    'unit_id': 'unitId',
    'parent_id': 'parentId',
    'price_cents': 'priceCents',
    'total_cents': 'totalCents',
    'customer_name': 'customerName',
    'guest_count': 'guestCount',
    'event_date': 'eventDate',
    'end_date': 'endDate',
    'item_name': 'itemName',
    'price_per_unit_cents': 'pricePerUnitCents',
    'total_amount_cents': 'totalAmountCents',
    'requestor_id': 'requestorId',
    'source_account_id': 'sourceAccountId',
    'current_phase': 'currentPhase',
    'readiness_score': 'readinessScore',
    'banquet_details': 'banquetDetails',
    'cuisine_details': 'cuisineDetails',
    'hardware_checklist': 'hardwareChecklist',
    'reconciliation_status': 'reconciliationStatus',
    'costing_sheet': 'costingSheet',
    'portion_monitor': 'portionMonitor',
    'order_type': 'orderType',
    'image_url': 'imageUrl',
    'budget_cents': 'budgetCents',
    'client_contact_id': 'clientContactId',
    'ai_alerts': 'aiAlerts',
    'start_date': 'startDate',
    'paid_amount_cents': 'paidAmountCents',
    'due_date': 'dueDate',
    'stock_quantity': 'stockQuantity',
    'stock_level': 'stockQuantity',
    'cost_price_cents': 'costPriceCents',
    'recipe_id': 'recipeId',
    'is_asset': 'isAsset',
    'is_rental': 'isRental',
    'base_portions': 'basePortions',
    'ingredient_name': 'ingredientName',
    'qty_per_portion': 'qtyPerPortion',
    'price_source_query': 'priceSourceQuery',
    'sub_recipe_group': 'subRecipeGroup',
    'balance_cents': 'balanceCents',
    'sender_id': 'senderId',
    'recipient_id': 'recipientId',
    'created_at': 'createdAt',
    'read_at': 'readAt',
    // Employee mappings
    'first_name': 'firstName',
    'last_name': 'lastName',
    'phone_number': 'phoneNumber',
    'salary_cents': 'salaryCents',
    'health_notes': 'healthNotes',
    'date_of_employment': 'dateOfEmployment',
    // Contact mappings
    'customer_type': 'customerType',
    'registration_number': 'registrationNumber',
    'job_title': 'jobTitle',
    // Misc
    'rental_vendor': 'rentalVendor'
  };

  Object.entries(mappings).forEach(([snake, camel]) => {
    if (snake in newItem) {
      if (newItem[snake] !== null || !(camel in newItem)) {
        newItem[camel] = newItem[snake];
      }
      delete newItem[snake];
    }
  });

  // Handle orgId to companyId mapping for consistency across all tables
  if ('organization_id' in item) {
    newItem.companyId = item.organization_id;
  }

  // 2. Catering Special Unpacking
  if (tableName === 'catering_events' && newItem.financials && typeof newItem.financials === 'object') {
    const financials = newItem.financials as any;
    const packedFields = [
      'items', 'costingSheet', 'orderType', 'banquetDetails', 'cuisineDetails', 'currentPhase',
      'readinessScore', 'tasks', 'hardwareChecklist', 'endDate', 'location',
      'dispatchedAssets', 'logisticsReturns', 'reconciliationStatus', 'portionMonitor',
      'customerName', 'guestCount'
    ];

    packedFields.forEach(field => {
      const val = financials[field];
      if (field in financials && val !== null && val !== undefined && val !== 'undefined' && val !== 'null') {
        newItem[field] = val;
      }
    });
  }

  // Final Sanitization: Ensure customerName isn't a literal "undefined"/"null" string
  if (newItem.customerName === 'undefined' || newItem.customerName === 'null') {
    newItem.customerName = '';
  }

  if (tableName === 'messages') {
    newItem.status = newItem.readAt ? 'read' : 'sent';
  }

  if (tableName === 'catering_events') {
    console.log(`[Supabase] Mapped Item ${newItem.id}:`, {
      customerName: newItem.customerName,
      guestCount: newItem.guestCount
    });
  }

  return newItem;
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

  // UUID Validation Regex
  const isUUID = (id?: string) => {
    if (!id) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  // Helper for consistent snake_case to camelCase mapping
  const mapItem = (item: any) => mapIncomingRow(tableName, item);


  let query = supabase.from(tableName).select('*');

  if (effectiveId) {
    const col = useOrgId ? 'organization_id' : 'company_id';
    if (effectiveId === VALID_UUID) {
      const { data: uuidData, error: uuidError } = await supabase.from(tableName).select('*').eq(col, VALID_UUID);
      if (uuidError) throw uuidError;

      try {
        const { data: legacyData, error: legacyError } = await supabase.from(tableName).select('*').eq(col, LEGACY_ID);
        if (!legacyError && legacyData && legacyData.length > 0) {
          return [...(uuidData || []), ...legacyData].map(item => mapItem(item));
        }
      } catch (e) {
        console.warn(`[Supabase] Skipping legacy ID for ${tableName} due to type mismatch.`);
      }
      return (uuidData || []).map(item => mapItem(item));
    } else if (effectiveId) {
      if (isUUID(effectiveId)) {
        query = query.eq(col, effectiveId);
      } else {
        console.warn(`[Supabase] Skipping query for ${tableName} because ${effectiveId} is not a valid UUID for ${col}.`);
        return [];
      }
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(item => mapItem(item));
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

export const uploadEntityDocument = async (
  orgId: string,
  entityType: 'contact' | 'product' | 'ingredient' | 'asset' | 'event',
  entityId: string,
  file: File
) => {
  if (!supabase) throw new Error("Supabase not initialized");

  const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  const bucketName = 'product_media'; // Using existing bucket
  const objectPath = `${entityType}/${orgId}/${entityId}/${filename}`;

  console.log('[Supabase] Uploading document:', objectPath);

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(objectPath, file, {
      contentType: file.type,
      upsert: true
    });

  if (error) {
    console.error('[Supabase] Document Upload Error:', error);
    throw error;
  }

  console.log('[Supabase] Document Upload Success:', data);
  return { bucket: bucketName, path: data.path };
};
