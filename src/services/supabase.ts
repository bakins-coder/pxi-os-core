
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
    if (error && error.code !== 'PGRST116' && error.code !== '42501') {
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
    if (msg.includes('schema') || msg.includes('database error')) return { status: 'Connected', latency: 'Degraded' };
    return { status: 'Error', error: (e as Error).message };
  }
};

// --- Database Schema Whitelists ---
const SCHEMA_WHITELISTS: Record<string, string[]> = {
  catering_events: ['id', 'company_id', 'organization_id', 'customer_name', 'deal_id', 'event_date', 'guest_count', 'status', 'financials', 'cuisine_details'],
  invoices: ['id', 'company_id', 'number', 'contact_id', 'date', 'due_date', 'status', 'type', 'total_cents', 'subtotal_cents', 'service_charge_cents', 'vat_cents', 'paid_amount_cents', 'manual_set_price_cents', 'discount_cents', 'standard_total_cents', 'lines'],
  requisitions: ['id', 'company_id', 'type', 'category', 'item_name', 'ingredient_id', 'quantity', 'price_per_unit_cents', 'total_amount_cents', 'requestor_id', 'requestor_name', 'status', 'reference_id', 'notes', 'source_account_id', 'unit', 'pack_count', 'pack_size', 'pack_type'],
  projects: ['id', 'company_id', 'name', 'client_contact_id', 'status', 'start_date', 'end_date', 'budget_cents', 'progress', 'reference_id', 'ai_alerts'],
  tasks: ['id', 'company_id', 'project_id', 'title', 'description', 'assignee_id', 'assignee_role', 'due_date', 'priority', 'status', 'created_at'],
  contacts: ['id', 'company_id', 'name', 'type', 'email', 'phone', 'address', 'customer_type'],
  employees: ['id', 'organization_id', 'name', 'first_name', 'last_name', 'title', 'role', 'email', 'phone', 'phone_number', 'salary_cents', 'health_notes', 'gender', 'dob', 'date_of_employment', 'staff_id', 'user_id', 'avatar', 'id_card_issued_date', 'kpis'],
  ingredients: ['id', 'organization_id', 'name', 'category', 'unit', 'stock_level', 'current_cost_cents', 'image_url', 'reorder_point', 'shelf_life_days', 'preferred_supplier_id', 'last_pack_count', 'last_pack_size', 'last_pack_type'],
  products: ['id', 'organization_id', 'name', 'description', 'price_cents', 'category_id', 'product_category_id', 'cuisine', 'image_url', 'is_active', 'lead_time_minutes', 'normalized_name', 'created_at'],
  reusable_items: ['id', 'organization_id', 'name', 'description', 'price_cents', 'stock_quantity', 'stock_level', 'category', 'category_id', 'unit_id', 'image', 'image_url'],
  rental_items: ['id', 'organization_id', 'name', 'replacement_cost_cents', 'supplier_id', 'category_id', 'unit_id', 'image_url'],
  assets: ['id', 'organization_id', 'name', 'asset_class', 'acquisition_cost_cents', 'acquisition_date', 'residual_value_cents', 'serial_no', 'location_id', 'category_id', 'image_url', 'normalized_name'],
  bank_transactions: ['id', 'company_id', 'date', 'description', 'amount_cents', 'type', 'category', 'contact_id', 'bank_account_id', 'reference_id', 'created_at'],
  chart_of_accounts: ['id', 'company_id', 'code', 'name', 'type', 'subtype', 'balance_cents', 'created_at'],
  messages: ['id', 'organization_id', 'sender_id', 'recipient_id', 'content', 'type', 'status', 'created_at', 'read_at'],
  interaction_logs: ['id', 'contact_id', 'type', 'summary', 'content', 'created_by', 'created_at'],
  locations: ['id', 'organization_id', 'name', 'type', 'is_active'],
  leads: ['id', 'organization_id', 'name', 'email', 'phone', 'company', 'source', 'status', 'interest_level', 'notes', 'conversation_id', 'created_at', 'updated_at'],
  bank_accounts: ['id', 'company_id', 'name', 'type', 'balance_cents', 'currency', 'account_number', 'institution_name', 'last_updated'],
  ingredient_stock_batches: ['id', 'organization_id', 'ingredient_id', 'location_id', 'quantity', 'unit_id', 'received_at', 'expires_at', 'lot_code', 'status']
};

/**
 * Consistent camelCase to snake_case mapping for outgoing data
 */
const mapOutgoingRow = (newItem: any) => {
  const mapped: any = { ...newItem };
  const mappings: Record<string, string> = {
    'companyId': 'company_id',
    'organizationId': 'organization_id',
    'stockLevel': 'stock_level',
    'stockQuantity': 'stock_quantity',
    'currentCostCents': 'current_cost_cents',
    'marketPriceCents': 'market_price_cents',
    'lastPackCount': 'last_pack_count',
    'lastPackSize': 'last_pack_size',
    'lastPackType': 'last_pack_type',
    'reorderPoint': 'reorder_point',
    'shelfLifeDays': 'shelf_life_days',
    'preferredSupplierId': 'preferred_supplier_id',
    'requestorName': 'requestor_name',
    'totalAmountCents': 'total_amount_cents',
    'packedUnits': 'packed_units',
    'costPerUnitCents': 'cost_price_cents',
    'imageUrl': 'image_url',
    'categoryId': 'category_id',
    'unitId': 'unit_id',
    'priceCents': 'price_cents',
    'parentId': 'parent_id',
    'referenceId': 'reference_id',
    'projectId': 'project_id',
    'assigneeId': 'assignee_id',
    'ingredientId': 'ingredient_id',
    'supplierId': 'supplier_id',
    'bankAccountId': 'bank_account_id',
  };

  Object.entries(mappings).forEach(([camel, snake]) => {
    if (camel in mapped && mapped[camel] !== undefined) {
      mapped[snake] = mapped[camel];
    }
  });

  return mapped;
};

/**
 * Syncs a local store table to the cloud
 */
export const syncTableToCloud = async (tableName: string, data: any[]) => {
  if (!supabase) return;
  const whitelist = SCHEMA_WHITELISTS[tableName];
  if (!whitelist) {
    console.warn(`[Supabase] No whitelist for table ${tableName}. Skipping sync.`);
    return;
  }

  const sanitizedData = data.filter(item => {
    if (tableName === 'reusable_items') return item.type === 'reusable';
    if (tableName === 'rental_items') return item.type === 'rental';
    if (tableName === 'products') return item.type === 'product';
    if (tableName === 'assets') return item.type === 'asset' || item.isAsset === true;
    return true;
  }).map(item => {
    const newItem = { ...item };
    const noOrgTables = ['messages', 'notifications', 'audit_logs'];

    // 1. Initial Organization mapping
    if (!noOrgTables.includes(tableName)) {
      // Force organization_id mapping for tables that use it
      const useOrgId = ['reusable_items', 'rental_items', 'ingredients', 'products', 'assets', 'employees', 'catering_events', 'categories', 'ingredient_stock_batches', 'leads'].includes(tableName);
      if (useOrgId) {
        if (!newItem.organization_id) {
          newItem.organization_id = newItem.organizationId || newItem.companyId || newItem.company_id;
        }
      } else {
        if (!newItem.company_id) {
          newItem.company_id = newItem.companyId || newItem.organizationId || newItem.organization_id;
        }
      }
    }

    // 2. Comprehensive Outgoing Mapping (Camel -> Snake)
    const mapped = mapOutgoingRow(newItem);

    // 3. Catering Special Packing Logic
    if (tableName === 'catering_events') {
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
        }
      });
      mapped.financials = packedData;
      if (whitelist.includes('company_id')) mapped.company_id = mapped.organization_id;
    }

    // 4. Final Whitelist Enforcement
    const filteredItem: any = {};
    whitelist.forEach(key => {
      if (key in mapped) {
        filteredItem[key] = mapped[key];
      }
    });

    return filteredItem;
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
    'stock_level': 'stockLevel',
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
    'amount_cents': 'amountCents',
    'sender_id': 'senderId',
    'recipient_id': 'recipientId',
    'created_at': 'createdAt',
    'read_at': 'readAt',
    'first_name': 'firstName',
    'last_name': 'lastName',
    'phone_number': 'phoneNumber',
    'salary_cents': 'salaryCents',
    'health_notes': 'healthNotes',
    'date_of_employment': 'dateOfEmployment',
    'staff_id': 'staffId',
    'user_id': 'userId',
    'id_card_issued_date': 'idCardIssuedDate',
    'customer_type': 'customerType',
    'registration_number': 'registrationNumber',
    'job_title': 'jobTitle',
    'rental_vendor': 'rentalVendor',
    'last_pack_count': 'lastPackCount',
    'last_pack_size': 'lastPackSize',
    'last_pack_type': 'lastPackType',
    'current_cost_cents': 'currentCostCents',
    'interest_level': 'interestLevel',
    'conversation_id': 'conversationId',
    'updated_at': 'updatedAt',
    'pack_count': 'packCount',
    'pack_size': 'packSize',
    'pack_type': 'packType',
    'requestor_name': 'requestorName'
  };

  Object.entries(mappings).forEach(([snake, camel]) => {
    if (snake in newItem) {
      newItem[camel] = newItem[snake];
      delete newItem[snake];
    }
  });

  if ('imageUrl' in newItem) newItem.image = newItem.imageUrl;
  if (tableName === 'bank_accounts') {
    if ('institutionName' in newItem) newItem.bankName = newItem.institutionName;
    if ('name' in newItem) newItem.accountName = newItem.name;
  }
  if ('stock_level' in item || 'stock_quantity' in item) {
    const val = item.stock_level ?? item.stock_quantity ?? 0;
    newItem.stockLevel = val;
    newItem.stockQuantity = val;
  }
  if ('organization_id' in item) newItem.companyId = item.organization_id;

  if (tableName === 'catering_events' && newItem.financials) {
    const financials = newItem.financials as any;
    const packedFields = ['items', 'costingSheet', 'orderType', 'banquetDetails', 'cuisineDetails', 'currentPhase', 'readinessScore', 'tasks', 'hardwareChecklist', 'endDate', 'location', 'dispatchedAssets', 'logisticsReturns', 'reconciliationStatus', 'portionMonitor', 'customerName', 'guestCount'];
    packedFields.forEach(field => {
      if (field in financials) newItem[field] = financials[field];
    });
  }

  return newItem;
};

export const pullCloudState = async (tableName: string, companyId?: string) => {
  if (!supabase) return null;
  const useOrgId = ['reusable_items', 'rental_items', 'ingredients', 'products', 'assets', 'employees', 'catering_events', 'job_roles', 'departments', 'leave_requests', 'categories', 'rental_stock', 'ingredient_stock_batches', 'performance_reviews', 'recipes', 'messages', 'leads'].includes(tableName);
  const effectiveId = companyId;

  if (!effectiveId) {
    console.warn(`[Supabase] pullCloudState called without companyId for table ${tableName}. This may leak data or return empty results.`);
    return [];
  }

  const mapItem = (item: any) => mapIncomingRow(tableName, item);
  let query = supabase.from(tableName).select('*');
  const col = useOrgId ? 'organization_id' : 'company_id';
  query = query.eq(col, effectiveId);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(item => mapItem(item));
};

export const postReusableMovement = async (params: any) => {
  if (!supabase) throw new Error("Supabase not initialized");
  const { data, error } = await supabase.rpc('post_reusable_movement', { p_org: params.orgId, p_item: params.itemId, p_delta: params.delta, p_unit: params.unitId, p_type: params.type, p_ref_type: params.refType, p_ref_id: params.refId, p_location: params.locationId, p_notes: params.notes });
  if (error) throw error;
  return data;
};

export const postRentalMovement = async (params: any) => {
  if (!supabase) throw new Error("Supabase not initialized");
  const { data, error } = await supabase.rpc('post_rental_movement', { p_org: params.orgId, p_item: params.itemId, p_delta: params.delta, p_unit: params.unitId, p_type: params.type, p_ref_type: params.refType, p_ref_id: params.refId, p_location: params.locationId, p_notes: params.notes });
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
    p_type: params.type === 'release' ? 'production_issue' : params.type,
    p_ref_type: params.refType,
    p_ref_id: params.refId,
    p_location: params.locationId,
    p_notes: params.notes,
    p_unit_cost_cents: params.unitCostCents || 0,
    p_expires_at: params.expiresAt || null
  });
  if (error) throw error;
  return data;
};

export const pullInventoryViews = async (viewName: any, orgId: string) => {
  if (!supabase) return [];
  const { data, error } = await supabase.from(viewName).select('*').eq('organization_id', orgId);
  return data || [];
};

export const uploadEntityImage = async (orgId: string, entityType: string, entityId: string, base64Data: string) => {
  if (!supabase) throw new Error("Supabase not initialized");
  const filename = `${Date.now()}.jpg`;
  const objectPath = `${entityType}/${orgId}/${entityId}/${filename}`;
  const base64Clean = base64Data.split(',')[1] || base64Data;
  const binaryStr = atob(base64Clean);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
  const { data, error } = await supabase.storage.from('product_media').upload(objectPath, new Blob([bytes], { type: 'image/jpeg' }), { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  return { bucket: 'product_media', path: data.path };
};

export const saveEntityMedia = async (mediaData: any) => {
  if (!supabase) throw new Error("Supabase not initialized");
  const { error } = await supabase.from('entity_media').insert([mediaData]);
  if (error) throw error;
};

export const uploadEntityDocument = async (orgId: string, entityType: string, entityId: string, file: File) => {
  if (!supabase) throw new Error("Supabase not initialized");
  const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  const objectPath = `${entityType}/${orgId}/${entityId}/${filename}`;
  const { data, error } = await supabase.storage.from('product_media').upload(objectPath, file, { contentType: file.type, upsert: true });
  if (error) throw error;
  return { bucket: 'product_media', path: data.path };
};
