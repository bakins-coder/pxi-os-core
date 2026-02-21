import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    InventoryItem, Recipe, CateringEvent, Invoice, InvoiceLine, Contact, Task, Deal,
    BookkeepingEntry, Project, AIAgent, Ingredient, Supplier,
    MarketingPost, Workflow, Ticket, BankTransaction, Employee,
    Requisition, RentalRecord, ChartOfAccount, BankStatementLine, InvoiceStatus,
    LeaveRequest, DepartmentMatrix, SocialInteraction, SocialPost, AgenticLog, PerformanceReview, PerformanceMetric,
    RecipeIngredient, InteractionLog, Message, DispatchedAsset, LogisticsReturn, BankAccount
} from '../types';

import { supabase, syncTableToCloud, pullCloudState, pullInventoryViews, postReusableMovement, postRentalMovement, postIngredientMovement, uploadEntityImage, saveEntityMedia } from '../services/supabase';
import { useAuthStore } from './useAuthStore';
import { useSettingsStore } from './useSettingsStore';

console.error('[DEBUG] useDataStore.ts LOADING...');
import { calculateItemCosting as utilsCalculateCosting } from '../utils/costing';

interface DataState {
    inventory: InventoryItem[];
    recipes: Recipe[];
    cateringEvents: CateringEvent[];
    invoices: Invoice[];
    contacts: Contact[];
    tasks: Task[];
    bookkeeping: BookkeepingEntry[];
    projects: Project[];
    aiAgents: AIAgent[];
    ingredients: Ingredient[];
    suppliers: Supplier[];
    marketingPosts: MarketingPost[];
    workflows: Workflow[];
    tickets: Ticket[];
    employees: Employee[];
    deals: Deal[];
    requisitions: Requisition[];
    rentalLedger: RentalRecord[];
    chartOfAccounts: ChartOfAccount[];
    bankTransactions: BankTransaction[];
    bankStatementLines: BankStatementLine[];
    bankAccounts: BankAccount[];
    leaveRequests: LeaveRequest[];
    departmentMatrix: DepartmentMatrix[];
    calendarEvents: any[];
    socialInteractions: SocialInteraction[];
    agenticLogs: AgenticLog[];
    performanceReviews: PerformanceReview[];
    interactionLogs: InteractionLog[];
    messages: Message[];
    cashAtHandCents: number;
    syncStatus: 'Synced' | 'Syncing' | 'Error' | 'Offline';
    lastSyncError: string | null;
    isSyncing: boolean;
    realtimeStatus: 'Connected' | 'Disconnected' | 'Connecting';
    realtimeChannel: any | null;

    // Actions
    addInventoryItem: (item: Partial<InventoryItem>) => void;
    updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
    addRequisition: (req: Partial<Requisition>) => void;
    addRequisitionsBulk: (reqs: Partial<Requisition>[]) => void;
    updateRequisition: (id: string, updates: Partial<Requisition>) => void;
    approveRequisition: (id: string, sourceAccountId?: string) => void;
    rejectRequisition: (id: string) => void;
    receiveFoodStock: (ingId: string, qty: number, cost: number) => void;
    issueRental: (eventId: string, itemId: string, qty: number, vendor?: string) => void;
    returnRental: (id: string, status: any, notes?: string) => void;
    checkOverdueAssets: () => void;
    addContact: (contact: Partial<Contact>) => void;
    addContactsBulk: (contacts: Partial<Contact>[]) => void;
    updateContact: (id: string, updates: Partial<Contact>) => void;
    deleteContact: (id: string) => void;
    addInteractionLog: (log: Partial<InteractionLog>) => void;
    addInvoice: (invoice: Invoice) => void;
    updateInvoiceStatus: (id: string, status: any) => void;
    addBookkeepingEntry: (entry: BookkeepingEntry) => void;
    addTransaction: (tx: BankTransaction) => void;
    recordPayment: (id: string, amount: number, bankAccountId?: string, statusOverride?: InvoiceStatus) => void;
    reconcileMatch: (lineId: string, accountId: string) => void;

    // Bank Account Actions
    addBankAccount: (account: Partial<BankAccount>) => void;
    updateBankAccount: (id: string, updates: Partial<BankAccount>) => void;
    deleteBankAccount: (id: string) => void;

    // HR Actions
    addEmployee: (emp: Partial<Employee>) => Promise<Employee>;
    updateEmployee: (id: string, updates: Partial<Employee>) => void;
    applyForLeave: (req: Partial<LeaveRequest>) => Promise<LeaveRequest>;
    approveLeave: (id: string) => void;
    rejectLeave: (id: string) => void;
    adjustBandSalary: (band: number, percent: number) => void;
    addPerformanceReview: (review: Partial<PerformanceReview>) => void;
    submitSelfAssessment: (id: string, scores: { [metricIndex: number]: number }) => void;
    submitSupervisorReview: (id: string, scores: { [metricIndex: number]: number }, overrideReason?: string) => void;
    checkPerformanceDue: () => void;

    // Misc Actions
    addMeetingTask: (task: Partial<Task>) => void;
    addIngredient: (ing: Partial<Ingredient>) => void;
    updateIngredient: (id: string, updates: Partial<Ingredient>) => void;
    updateIngredientPrice: (id: string, marketPriceCents: number, insight: any) => void;
    addTask: (task: Partial<Task>) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    addMarketingPost: (post: Partial<MarketingPost>) => MarketingPost;
    addAIAgent: (a: AIAgent) => void;
    addWorkflow: (wf: Workflow) => void;
    addAgenticLog: (log: AgenticLog) => void;
    reverseRequisition: (id: string) => void;
    reapplyRequisitions: (eventId: string) => void;
    addMessage: (message: Partial<Message>) => Promise<void>;
    markMessageRead: (messageId: string) => Promise<void>;
    addProject: (proj: Partial<Project>) => void;
    addRecipe: (recipe: Partial<Recipe>) => void;
    updateRecipe: (id: string, updates: Partial<Recipe>) => void;
    deleteRecipe: (id: string) => void;
    addRecipeIngredient: (recipeId: string, ingredient: RecipeIngredient) => void;
    deleteRecipeIngredient: (recipeId: string, ingredientName: string) => void;

    // Catering Actions
    createCateringOrder: (data: any) => Promise<{ event: CateringEvent, invoice: Invoice }>;
    updateCateringOrder: (eventId: string, updates: any) => Promise<{ event?: CateringEvent, invoice?: Invoice }>;
    updateCateringEvent: (id: string, updates: Partial<CateringEvent>) => void;
    createProcurementInvoice: (eventId: string, reqs: Partial<Requisition>[]) => Promise<Invoice>;
    deductStockFromCooking: (eventId: string) => void;
    completeCateringEvent: (eventId: string) => void;
    calculateItemCosting: (id: string, qty: number) => any;
    finalizeProforma: (invoiceId: string) => Promise<void>;
    updateInvoiceLines: (invoiceId: string, lines: InvoiceLine[], overrideTotalCents?: number, isCuisine?: boolean) => Promise<void>;
    updateInvoicePricing: (invoiceId: string, setPriceCents: number | undefined) => Promise<void>;
    finalizeInvoice: (invoiceId: string, lines: InvoiceLine[], overrideTotalCents?: number) => Promise<void>;
    approveInvoice: (id: string) => void;
    syncWithCloud: () => Promise<void>;
    hydrateFromCloud: () => Promise<void>;
    subscribeToRealtimeUpdates: () => void;
    unsubscribeFromRealtimeUpdates: () => void;
    // Portion Monitor Actions
    initializePortionMonitor: (eventId: string, tableCount: number, guestsPerTable: number) => void;
    addPortionMonitorTable: (eventId: string, guestCapacity: number) => void;
    markTableServed: (eventId: string, tableId: string, itemIds: string[]) => void;
    markSeatServed: (eventId: string, tableId: string, seatId: string, itemId?: string) => void;
    removeSeatServing: (eventId: string, tableId: string, seatId: string, itemId: string) => void;
    updateTableCapacity: (eventId: string, tableId: string, newCount: number) => void;
    assignWaiterToTable: (eventId: string, tableId: string, waiterId: string) => void;
    logLeftover: (eventId: string, itemId: string, quantity: number, reason: string) => void;
    addHandoverEvidence: (eventId: string, url: string, note: string) => void;
    generateWaiterLink: (eventId: string) => void;
    updateProjectTask: (projectId: string, taskId: string, updates: Partial<Task>) => void;
    advanceProjectTask: (projectId: string, taskId: string) => void;
    completeEvent: (eventId: string) => void;

    dispatchAssets: (eventId: string, assets: DispatchedAsset[]) => void;
    finalizeEventLogistics: (eventId: string, returns: LogisticsReturn[]) => void;


    reset: () => void;
    updateCashAtHand: (cents: number) => void;

    isSyncPending: boolean;
}

export const useDataStore = create<DataState>()(
    persist(
        (set, get) => ({
            inventory: [],
            recipes: [],
            contacts: [],
            cateringEvents: [],
            invoices: [],
            tasks: [],
            bookkeeping: [],
            projects: [],
            aiAgents: [],
            ingredients: [],
            suppliers: [],
            marketingPosts: [],
            workflows: [],
            tickets: [],
            employees: [],

            deals: [],
            requisitions: [],
            rentalLedger: [],
            chartOfAccounts: [],
            bankTransactions: [],
            bankStatementLines: [],
            bankAccounts: [
                { id: 'ba-gt-cuisine', companyId: '10959119-72e4-4e57-ba54-923e36bba6a6', bankName: 'GT Bank', accountName: 'Xquisite Cuisine', accountNumber: '0210736266', currency: 'NGN', balanceCents: 0, isActive: true, lastUpdated: new Date().toISOString() },
                { id: 'ba-gt-celebrations', companyId: '10959119-72e4-4e57-ba54-923e36bba6a6', bankName: 'GT Bank', accountName: 'Xquisite Celebrations', accountNumber: '0396426845', currency: 'NGN', balanceCents: 0, isActive: true, lastUpdated: new Date().toISOString() },
                { id: 'ba-zenith-celebrations', companyId: '10959119-72e4-4e57-ba54-923e36bba6a6', bankName: 'Zenith Bank', accountName: 'Xquisite Celebrations', accountNumber: '1010951007', currency: 'NGN', balanceCents: 0, isActive: true, lastUpdated: new Date().toISOString() },
                { id: 'ba-first-cuisine', companyId: '10959119-72e4-4e57-ba54-923e36bba6a6', bankName: 'First Bank', accountName: 'Xquisite Cuisine', accountNumber: '2022655945', currency: 'NGN', balanceCents: 0, isActive: true, lastUpdated: new Date().toISOString() }
            ],
            leaveRequests: [],
            calendarEvents: [],
            socialInteractions: [],
            agenticLogs: [],
            performanceReviews: [],
            interactionLogs: [],
            messages: [],
            cashAtHandCents: 0,
            syncStatus: 'Synced',
            lastSyncError: null,
            isSyncing: false,
            realtimeStatus: 'Disconnected',
            realtimeChannel: null,
            departmentMatrix: [], // Fetched dynamically from DB
            isSyncPending: false,

            reset: () => {
                set({
                    inventory: [], recipes: [], cateringEvents: [], invoices: [], tasks: [], bookkeeping: [],
                    projects: [], aiAgents: [], ingredients: [], suppliers: [], marketingPosts: [], workflows: [],
                    tickets: [], employees: [], deals: [], requisitions: [], rentalLedger: [], chartOfAccounts: [],
                    bankTransactions: [], bankStatementLines: [], bankAccounts: [], leaveRequests: [], calendarEvents: [],
                    socialInteractions: [], agenticLogs: [], performanceReviews: [], departmentMatrix: [],
                    interactionLogs: [], messages: [], cashAtHandCents: 0,
                    syncStatus: 'Synced', lastSyncError: null, isSyncing: false, realtimeStatus: 'Disconnected', isSyncPending: false
                });
            },

            updateCashAtHand: (cents) => {
                set({ cashAtHandCents: cents });
            },

            addInventoryItem: async (item) => {
                const user = useAuthStore.getState().user;
                const companyId = user?.companyId || '10959119-72e4-4e57-ba54-923e36bba6a6';
                const userId = user?.id || 'sys';

                const newItemId = item.id || crypto.randomUUID();

                // Optimistic Local Update
                const newItem = { ...item, id: newItemId, companyId: companyId };
                set((state) => ({
                    inventory: [newItem as InventoryItem, ...state.inventory]
                }));

                if (!user || !user.companyId) return;

                // Determine entity type for media
                const entityTypeMap: Record<string, 'product' | 'asset' | 'ingredient'> = {
                    'product': 'product',
                    'asset': 'asset',
                    'reusable': 'asset',
                    'raw_material': 'ingredient',
                    'ingredient': 'ingredient'
                };
                const entityType = (item.type && entityTypeMap[item.type]) || 'product';

                // Handle Image Upload if Base64
                let uploadedMedia: { bucket: string, path: string } | null = null;

                if (item.image && item.image.startsWith('data:image')) {
                    try {
                        // Upload
                        const uploadRes = await uploadEntityImage(companyId, entityType, newItemId, item.image);
                        uploadedMedia = uploadRes;

                        // Construct Public URL (Optimistic for DB text column if needed, though View handles it)
                        // Assuming standard Supabase Storage Public URL pattern for now or relying on View
                        // For products, we don't send image_url to 'products' table if moving to entity_media,
                        // BUT if we want to be safe, we can trigger the entity_media insert.
                    } catch (err) {
                        console.error("Image upload failed:", err);
                    }
                }

                // Determine DB Table
                let tableName = '';
                let dbPayload: any = {
                    organization_id: companyId,
                    name: item.name,
                    category: (item.category as any)
                };

                // Add Image URL if available (and valid URL)
                if (uploadedMedia) {
                    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
                    const { bucket, path } = uploadedMedia;
                    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
                    dbPayload.image = publicUrl;
                    dbPayload.image_url = publicUrl;
                } else if (item.image && item.image.startsWith('http')) {
                    dbPayload.image = item.image;
                    dbPayload.image_url = item.image;
                }

                // Type Mapping
                if (item.type === 'product') {
                    tableName = 'products';
                    // Products table schema: name, description, price_cents, category, etc.
                    dbPayload.description = item.description;
                    dbPayload.price_cents = item.priceCents;
                    // Fix: category column in products schema? Yes, from fix_inventory_tables.
                    // But we must check if category is text or ID. The migration said category TEXT in inventory, 
                    dbPayload.category = (item.category as any);
                } else if (item.type === 'asset' || item.type === 'reusable') {
                    tableName = 'reusable_items';
                    dbPayload.type = 'asset';
                    dbPayload.stock_level = item.stockQuantity;
                    dbPayload.price_cents = item.priceCents;
                    dbPayload.category = (item.category as any);
                } else if (item.type === 'rental') {
                    tableName = 'rental_items';
                    dbPayload.replacement_cost_cents = item.priceCents;
                    dbPayload.category = (item.category as any);
                } else if (item.type === 'raw_material' || item.type === 'ingredient') {
                    tableName = 'ingredients';
                    dbPayload.unit = (item as any).unit;
                    dbPayload.current_cost_cents = item.priceCents;
                    dbPayload.stock_level = item.stockQuantity || 0;
                    dbPayload.category = (item.category as any);
                }

                if (tableName && supabase) {
                    try {
                        const { error } = await supabase.from(tableName).upsert({ ...dbPayload, id: newItemId });
                        if (error) {
                            console.error("Failed to update item:", error);
                            return;
                        }
                        const insertedId = newItemId; // If upserting with a generated ID, use that ID for media
                        // 2. Insert Entity Media if uploaded
                        if (uploadedMedia && insertedId) {
                            await saveEntityMedia({
                                entity_type: entityType,
                                entity_id: insertedId,
                                organization_id: companyId,
                                bucket: uploadedMedia.bucket,
                                object_path: uploadedMedia.path,
                                is_primary: true
                            });
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
            },
            updateInventoryItem: async (id, updates) => {
                const user = useAuthStore.getState().user;
                const companyId = user?.companyId || '10959119-72e4-4e57-ba54-923e36bba6a6';
                const userId = user?.id || 'sys';

                // Optimistic Local Update
                set((state) => ({
                    inventory: state.inventory.map(item => item.id === id ? { ...item, ...updates } : item)
                }));

                if (!user || !user.companyId) return;

                // Handle Image Upload if Base64
                let uploadedMedia: { bucket: string, path: string } | null = null;

                if (updates.image && updates.image.startsWith('data:image')) {
                    try {
                        const entityTypeMap: Record<string, 'product' | 'asset' | 'ingredient'> = {
                            'product': 'product',
                            'asset': 'asset',
                            'reusable': 'asset',
                            'raw_material': 'ingredient',
                            'ingredient': 'ingredient'
                        };
                        const entityType = (updates.type && entityTypeMap[updates.type]) || 'product';

                        const uploadRes = await uploadEntityImage(companyId, entityType, id, updates.image);
                        uploadedMedia = uploadRes;

                        // Construct public URL and update the image field
                        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                        if (supabaseUrl && uploadedMedia) {
                            // VITE_SUPABASE_URL already includes https://, so don't add it again
                            updates.image = `${supabaseUrl}/storage/v1/object/public/${uploadedMedia.bucket}/${uploadedMedia.path}`;
                        }
                    } catch (err) {
                        console.error("Image upload failed:", err);
                    }
                }

                // Sync to Cloud
                try {
                    const item = get().inventory.find(i => i.id === id);
                    if (!item) return;

                    const updatedItem = { ...item, ...updates };

                    // Determine DB Table
                    let tableName = '';
                    let dbPayload: any = {
                        organization_id: companyId,
                        name: updatedItem.name,
                        image_url: updatedItem.image, // Use image_url column to match DB schema
                    };

                    if (updatedItem.type === 'product') {
                        tableName = 'products';
                        dbPayload.description = updatedItem.description;
                        dbPayload.price_cents = updatedItem.priceCents;
                        // Note: products table uses category_id (UUID), not category (string)
                        // Category updates need a separate lookup - skipping for now to fix image persistence
                    } else if (updatedItem.type === 'asset' || updatedItem.type === 'reusable') {
                        tableName = 'reusable_items';
                        dbPayload.type = 'asset';
                        dbPayload.category = (updatedItem.category as any);
                    } else if (updatedItem.type === 'rental') {
                        tableName = 'rental_items';
                        dbPayload.replacement_cost_cents = updatedItem.priceCents;
                        dbPayload.category = (updatedItem.category as any);
                    } else if (updatedItem.type === 'ingredient' || updatedItem.type === 'raw_material') {
                        tableName = 'ingredients';
                        dbPayload.unit = (updatedItem as any).unit;
                        dbPayload.current_cost_cents = updatedItem.priceCents;
                        dbPayload.stock_level = updatedItem.stockQuantity;
                        dbPayload.category = (updatedItem.category as any);
                    }

                    if (tableName) {
                        // Use syncTableToCloud helper which handles upsert/mapping? 
                        // Or just update directly?
                        // useDataStore generally used syncTableToCloud for bulk. 
                        // But for single item update, direct update is cleaner.
                        // Let's try direct update.
                        console.log('[updateInventoryItem] Updating DB:', { tableName, id, dbPayload });
                        const { data, error, count } = await (supabase as any)
                            .from(tableName)
                            .update(dbPayload)
                            .eq('id', id)
                            .select();
                        if (error) {
                            console.error('[updateInventoryItem] DB Update Error:', error);
                        } else {
                            console.log('[updateInventoryItem] DB Update Success. Rows:', data?.length, 'Data:', data);
                        }
                    }

                    // Update Entity Media if uploaded
                    if (uploadedMedia) {
                        await saveEntityMedia({
                            entity_type: tableName === 'products' ? 'product' : tableName === 'reusable_items' ? 'asset' : 'ingredient',
                            entity_id: id,
                            organization_id: companyId,
                            bucket: uploadedMedia.bucket,
                            object_path: uploadedMedia.path,
                            is_primary: true
                        });
                    }
                } catch (e) {
                    console.error("Failed to update inventory item:", e);
                }
            },
            addRequisition: (req) => {
                const user = useAuthStore.getState().user;
                set((state) => ({
                    requisitions: [{ ...req, id: req.id || crypto.randomUUID(), companyId: user?.companyId || (req as any).companyId, status: 'Pending', requestorId: 'sys' } as Requisition, ...state.requisitions]
                }));
                get().syncWithCloud();
            },
            addRequisitionsBulk: (reqs) => {
                const user = useAuthStore.getState().user;
                const companyId = user?.companyId || '10959119-72e4-4e57-ba54-923e36bba6a6';
                const newReqs = reqs.map(r => ({
                    ...r,
                    id: r.id || crypto.randomUUID(),
                    companyId: companyId,
                    status: 'Pending',
                    requestorId: 'sys'
                } as Requisition));

                set((state) => ({
                    requisitions: [...newReqs, ...state.requisitions]
                }));
                get().syncWithCloud();
            },
            updateRequisition: (id, updates) => {
                set((state) => ({
                    requisitions: state.requisitions.map(r => r.id === id ? { ...r, ...updates } : r)
                }));
                get().syncWithCloud();
            },
            approveRequisition: (id, sourceAccountId) => {
                const state = get();
                const req = state.requisitions.find(r => r.id === id);
                if (!req) return;

                const isCash = sourceAccountId === 'cash';
                const isBank = !!sourceAccountId && !isCash;
                const newStatus = (isCash || isBank) ? 'Paid' : 'Approved';

                let updatedBankAccounts = state.bankAccounts;
                let updatedBankTransactions = state.bankTransactions;
                let updatedBookkeeping = state.bookkeeping;
                let updatedCashAtHand = state.cashAtHandCents;

                // Handle Bank Deduction & Transaction Logging
                if (isBank) {
                    const account = state.bankAccounts.find(a => a.id === sourceAccountId);
                    if (account) {
                        updatedBankAccounts = state.bankAccounts.map(a =>
                            a.id === sourceAccountId
                                ? { ...a, balanceCents: a.balanceCents - req.totalAmountCents, lastUpdated: new Date().toISOString() }
                                : a
                        );

                        // 1. Create Bank Transaction Record
                        const newBankTx: BankTransaction = {
                            id: crypto.randomUUID(),
                            companyId: '10959119-72e4-4e57-ba54-923e36bba6a6',
                            bankAccountId: sourceAccountId,
                            date: new Date().toISOString().split('T')[0],
                            description: `Requisition Payment: ${req.itemName}`,
                            amountCents: req.totalAmountCents,
                            type: 'Outflow',
                            category: req.category,
                            referenceId: req.id
                        };
                        updatedBankTransactions = [newBankTx, ...state.bankTransactions];

                        // 2. Create Bookkeeping Entry (Central Cash Book)
                        const newBookkeepingEntry: BookkeepingEntry = {
                            id: crypto.randomUUID(),
                            date: new Date().toISOString().split('T')[0],
                            description: `Requisition (Bank): ${req.itemName}`,
                            category: req.category,
                            amountCents: req.totalAmountCents,
                            type: 'Outflow',
                            referenceId: req.id,
                            paymentMethod: 'Bank Transfer'
                        };
                        updatedBookkeeping = [newBookkeepingEntry, ...state.bookkeeping];

                        // Persist Bank Account Update
                        if (supabase) {
                            supabase.from('bank_accounts').update({
                                balance_cents: account.balanceCents - req.totalAmountCents,
                                last_updated: new Date().toISOString()
                            }).eq('id', sourceAccountId).then(({ error }) => {
                                if (error) console.error("Failed to update bank balance:", error);
                            });
                        }
                    }
                } else if (isCash) {
                    // Handle Cash Deduction
                    updatedCashAtHand = state.cashAtHandCents - req.totalAmountCents;

                    // Create Bookkeeping Entry (Cash Ledger)
                    const newBookkeepingEntry: BookkeepingEntry = {
                        id: crypto.randomUUID(),
                        date: new Date().toISOString().split('T')[0],
                        description: `Requisition (Cash): ${req.itemName}`,
                        category: req.category,
                        amountCents: req.totalAmountCents,
                        type: 'Outflow',
                        referenceId: req.id,
                        paymentMethod: 'Cash'
                    };
                    updatedBookkeeping = [newBookkeepingEntry, ...state.bookkeeping];
                }

                set((state) => ({
                    requisitions: state.requisitions.map(r => r.id === id ? { ...r, status: newStatus, sourceAccountId: isCash ? 'cash' : sourceAccountId } : r),
                    bankAccounts: updatedBankAccounts,
                    bankTransactions: updatedBankTransactions,
                    bookkeeping: updatedBookkeeping,
                    cashAtHandCents: updatedCashAtHand
                }));
                get().syncWithCloud();
            },
            rejectRequisition: (id) => {
                set((state) => ({
                    requisitions: state.requisitions.map(r => r.id === id ? { ...r, status: 'Rejected' } : r)
                }));
                get().syncWithCloud();
            },
            reverseRequisition: (id) => {
                const state = get();
                const req = state.requisitions.find(r => r.id === id);
                if (!req) return;

                // 1. Check Phase Restriction
                if (req.referenceId) {
                    const event = state.cateringEvents.find(e => e.id === req.referenceId);
                    if (event && event.currentPhase !== 'Procurement') {
                        console.warn(`Cannot reverse requisition for event in ${event.currentPhase} phase.`);
                        return;
                    }
                }

                let updatedBankAccounts = state.bankAccounts;
                let updatedBankTransactions = state.bankTransactions;
                let updatedBookkeeping = state.bookkeeping;
                let updatedCashAtHand = state.cashAtHandCents;

                // 2. Handle Financial Rollback if 'Paid'
                if (req.status === 'Paid' && req.sourceAccountId) {
                    if (req.sourceAccountId === 'cash') {
                        // Restore cash at hand
                        updatedCashAtHand = state.cashAtHandCents + req.totalAmountCents;
                    } else {
                        const account = state.bankAccounts.find(a => a.id === req.sourceAccountId);
                        if (account) {
                            updatedBankAccounts = state.bankAccounts.map(a =>
                                a.id === req.sourceAccountId
                                    ? { ...a, balanceCents: a.balanceCents + req.totalAmountCents, lastUpdated: new Date().toISOString() }
                                    : a
                            );

                            // Persist Bank Account Restoration
                            if (supabase) {
                                supabase.from('bank_accounts').update({
                                    balance_cents: account.balanceCents + req.totalAmountCents,
                                    last_updated: new Date().toISOString()
                                }).eq('id', req.sourceAccountId).then(({ error }) => {
                                    if (error) console.error("Failed to restore bank balance:", error);
                                });
                            }
                        }
                    }

                    // Remove associated transactions
                    updatedBankTransactions = state.bankTransactions.filter(tx => tx.referenceId !== req.id);
                    updatedBookkeeping = state.bookkeeping.filter(ent => ent.referenceId !== req.id);
                }

                set((state) => ({
                    requisitions: state.requisitions.map(r => r.id === id ? { ...r, status: 'Pending', sourceAccountId: undefined } : r),
                    bankAccounts: updatedBankAccounts,
                    bankTransactions: updatedBankTransactions,
                    bookkeeping: updatedBookkeeping,
                    cashAtHandCents: updatedCashAtHand
                }));
                get().syncWithCloud();
            },
            reapplyRequisitions: (eventId) => {
                set((state) => ({
                    requisitions: state.requisitions.map(r =>
                        (r.referenceId === eventId && r.status === 'Rejected')
                            ? { ...r, status: 'Pending' }
                            : r
                    )
                }));
                get().syncWithCloud();
            },

            receiveFoodStock: async (ingId, qty, cost) => {
                const user = useAuthStore.getState().user;
                if (!user || !user.companyId) {
                    // Fallback for tests if needed
                    if (!(globalThis as any).VITEST) return;
                }
                const companyId = user?.companyId || '10959119-72e4-4e57-ba54-923e36bba6a6';
                const userId = user?.id || 'sys';

                // Optimistic Update
                set((state) => {
                    const existingIng = state.ingredients.find(i => i.id === ingId);
                    const currentTotalQty = existingIng?.stockLevel || 0;
                    const currentAvgCost = existingIng?.currentCostCents || 0;

                    const newTotalQty = currentTotalQty + qty;
                    const newAvgCost = newTotalQty > 0
                        ? Math.round((currentTotalQty * currentAvgCost + cost) / newTotalQty)
                        : cost / qty;

                    const updatedIngredients = state.ingredients.map(i =>
                        i.id === ingId ? { ...i, stockLevel: newTotalQty, currentCostCents: newAvgCost, lastUpdated: new Date().toISOString() } : i
                    );
                    const updatedInventory = state.inventory.map(i =>
                        i.id === ingId ? { ...i, stockQuantity: newTotalQty } : i
                    );
                    return { ingredients: updatedIngredients, inventory: updatedInventory };
                });

                try {
                    // Call RPC
                    // Assuming 'Main Warehouse' is the default for now or we need to find it
                    // For simplicity, we can pass a known ID or fetch it. 
                    // But the RPC requires a location_id. 
                    // We need to fetch location or assume one exists. 
                    // Implementation Plan said: "Cache and reuse Main Warehouse location_id per org for default receipts."
                    // Since I don't have it cached yet, I might need to fetch it or pass a placeholder if allowed (likely not).
                    // I'll assume the view fetch puts location info in the store? No, I only fetched views.
                    // I should probably fetch locations in hydrate or on demand.
                    // For now, I will use a placeholder fetch or just try to pass 'main-warehouse-id' if I can derive it?
                    // Actually, the user prompt said: "Main Warehouse" auto-created per organization.
                    // I should probably fetch locations in hydrate functionality too.

                    // QUICK FIX: I will add a lazy fetch for location if missing in the store. 
                    // But for this step I'll assume we can get it from the view if the item exists there?
                    // The view returns `location_id`. I can grab it from `v_ingredient_inventory` for that item.

                    // Logic: Find existing location for item, or default.

                    /* 
                       Note: In a real robust app we'd manage locations properly. 
                       Here I'll try to find a valid location_id from the loaded stock views or use a fallback.
                    */

                    const state = get();
                    // We don't have stock view data explicitly stored apart from inventory... 
                    // I should have stored `locations` in the store?
                    // Let's add pullCloudState for locations in next step if needed.
                    // For now, I'll allow the action but it might fail if I send null location.
                    // Wait, the prompt said: "Always pass the organization’s Main Warehouse location_id... explicitly."

                    // I'll rely on the user having a location. 
                    // Let's defer the RPC call slightly or fetch location on the fly.
                    const userRef = useAuthStore.getState().user;
                    const companyId = userRef?.companyId || '10959119-72e4-4e57-ba54-923e36bba6a6';
                    const { data: locations } = await supabase!.from('locations').select('id').eq('organization_id', companyId).eq('name', 'Main Warehouse').limit(1);
                    const locationId = locations?.[0]?.id;

                    if (locationId) {
                        await postIngredientMovement({
                            orgId: companyId,
                            itemId: ingId,
                            delta: qty,
                            unitId: 'u-default',
                            type: 'purchase',
                            refType: 'manual_receipt',
                            refId: userRef?.id || 'sys',
                            locationId: locationId,
                            notes: 'Manual Receipt via Frontend',
                            unitCostCents: cost,
                            expiresAt: undefined
                        });
                    } else {
                        console.error("Main Warehouse not found.");
                    }

                } catch (e) {
                    console.error("Failed to post movement", e);
                    // Revert?
                }
            },
            issueRental: async (eventId, itemId, qty, vendor) => {
                const user = useAuthStore.getState().user;
                if (!user || !user.companyId) {
                    if (!(globalThis as any).VITEST) return;
                }
                const companyId = user?.companyId || '10959119-72e4-4e57-ba54-923e36bba6a6';
                const userId = user?.id || 'sys';

                // Optimistic
                set((state) => {
                    // ... maintain legacy ledger logic for UI ...
                    const item = state.inventory.find(i => i.id === itemId);
                    const event = state.cateringEvents.find(e => e.id === eventId);
                    if (!item || !event) return state;

                    const newRental: RentalRecord = {
                        id: crypto.randomUUID(),
                        requisitionId: crypto.randomUUID(),
                        eventId,
                        itemName: item.name,
                        quantity: qty,
                        estimatedReplacementValueCents: (item.priceCents || 0) * qty,
                        rentalVendor: vendor || 'In-House',
                        status: 'Issued',
                        dateIssued: new Date().toISOString(),
                        notes: `Issued for ${event.customerName}`
                    };

                    // Decrement stock
                    return {
                        rentalLedger: [newRental, ...state.rentalLedger],
                        inventory: state.inventory.map(i => i.id === itemId ? { ...i, stockQuantity: i.stockQuantity - qty } : i)
                    };
                });

                // RPC
                try {
                    const { data: locations } = await supabase!.from('locations').select('id').eq('organization_id', companyId).eq('name', 'Main Warehouse').limit(1);
                    const locationId = locations?.[0]?.id;
                    if (locationId) {
                        // Check which type of movement. If item is 'asset' -> postReusableMovement. If 'rental' -> postRentalMovement.
                        // The store item has `type`.
                        const item = get().inventory.find(i => i.id === itemId);
                        if (item?.type === 'asset' || item?.type === 'reusable') {
                            await postReusableMovement({
                                orgId: companyId,
                                itemId: itemId,
                                delta: -qty, // Issue is negative
                                unitId: 'u-default', // TODO: Fetch real unit ID
                                type: 'issue',
                                refType: 'event',
                                refId: eventId,
                                locationId: locationId,
                                notes: `Issued to event`
                            });
                        } else if (item?.type === 'rental') {
                            // Internal rental stock movement
                            await postRentalMovement({
                                orgId: companyId,
                                itemId: itemId,
                                delta: -qty,
                                unitId: 'u-default',
                                type: 'issue',
                                refType: 'event',
                                refId: eventId,
                                locationId: locationId,
                                notes: `Issued to event`
                            });
                        }
                    }
                } catch (e) { console.error(e); }
            },
            returnRental: async (id, status, notes) => {
                const user = useAuthStore.getState().user;
                if (!user || !user.companyId) {
                    if (!(globalThis as any).VITEST) return;
                }
                const companyId = user?.companyId || '10959119-72e4-4e57-ba54-923e36bba6a6';
                const userId = user?.id || 'sys';

                const state = get();
                const rental = state.rentalLedger.find(r => r.id === id);
                if (!rental) return;

                // Optimistic
                set((state) => {
                    let updatedInventory = state.inventory;
                    if (status === 'Returned' && rental.rentalVendor === 'In-House') {
                        // Optimistically find item by name... risky but matches old logic
                        const item = state.inventory.find(i => i.name === rental.itemName);
                        if (item) {
                            updatedInventory = state.inventory.map(i => i.id === item.id ? { ...i, stockQuantity: i.stockQuantity + rental.quantity } : i);
                        }
                    }
                    return {
                        rentalLedger: state.rentalLedger.map(r => r.id === id ? { ...r, status, notes: notes || r.notes, dateReturned: new Date().toISOString() } : r),
                        inventory: updatedInventory
                    };
                });

                // RPC
                try {
                    if (status === 'Returned' && rental.rentalVendor === 'In-House') {
                        const item = state.inventory.find(i => i.name === rental.itemName);
                        if (item) {
                            const { data: locations } = await supabase!.from('locations').select('id').eq('organization_id', companyId).eq('name', 'Main Warehouse').limit(1);
                            const locationId = locations?.[0]?.id;

                            if (locationId) {
                                const params = {
                                    orgId: companyId,
                                    itemId: item.id,
                                    delta: rental.quantity, // Return is positive
                                    unitId: 'u-default', // TODO
                                    type: 'return',
                                    refType: 'event',
                                    refId: rental.eventId,
                                    locationId: locationId,
                                    notes: `Returned from event`
                                };

                                if (item.type === 'asset' || item.type === 'reusable') {
                                    if (supabase) await postReusableMovement(params);
                                } else if (item.type === 'rental') {
                                    if (supabase) await postRentalMovement(params);
                                }
                            }
                        }
                    }
                } catch (e) { console.error(e); }
            },
            checkOverdueAssets: () => set((state) => {
                const now = new Date();
                const overdueRentals = state.rentalLedger.filter(r => {
                    if (r.status !== 'Issued') return false;
                    const event = state.cateringEvents.find(e => e.id === r.eventId);
                    if (!event) return false;
                    const eventEnd = event.endDate ? new Date(event.endDate) : new Date(new Date(event.eventDate).getTime() + 5 * 60 * 60 * 1000);
                    // Check if 24h passed since event end
                    const msSinceEnd = now.getTime() - eventEnd.getTime();
                    return msSinceEnd > (24 * 60 * 60 * 1000);
                });

                if (overdueRentals.length === 0) return state;

                // Create agentic logs for overdue items
                const newLogs = overdueRentals.map(r => ({
                    id: crypto.randomUUID(),
                    timestamp: new Date().toISOString(),
                    agentName: 'Asset Guardian',
                    action: 'Overdue Alert',
                    details: `Asset '${r.itemName}' (${r.quantity} units) from event '${state.cateringEvents.find(e => e.id === r.eventId)?.customerName}' is overdue >24h.`,
                    sentiment: 'Negative' as any,
                    confidence: 0.99
                }));

                // Avoid duplicate logs if possible (simple check)
                const uniqueLogs = newLogs.filter(nl => !state.agenticLogs.some(al => al.details === nl.details));

                if (uniqueLogs.length === 0) return state;

                return { agenticLogs: [...uniqueLogs, ...state.agenticLogs] };
            }),
            addContact: async (contact) => {
                const user = useAuthStore.getState().user;
                const companyId = user?.companyId || '10959119-72e4-4e57-ba54-923e36bba6a6';

                const contactId = contact.id || crypto.randomUUID();

                // Optimistic Local Update
                const newContact = {
                    ...contact,
                    id: contactId,
                    companyId: companyId,
                    preferences: {},
                    documentLinks: []
                } as Contact;

                set((state) => ({
                    contacts: [newContact, ...state.contacts]
                }));

                if (!user || !user.companyId) return;

                // Persistence
                if (supabase) {
                    try {
                        const payload = {
                            id: contactId,
                            organization_id: companyId,
                            name: contact.name,
                            email: contact.email,
                            phone: contact.phone,
                            address: contact.address,
                            type: contact.type || 'Individual',
                            customer_type: (contact as any).customerType || 'Individual',
                            preferences: {},
                            document_links: []
                        };

                        const { error } = await supabase.from('contacts').upsert(payload);
                        if (error) {
                            console.error("Failed to persist contact:", error);
                        }
                    } catch (e: any) {
                        console.error("Contact Persistence Error:", e);
                    }
                }
            },
            updateContact: async (id, updates) => {
                const user = useAuthStore.getState().user;
                const companyId = user?.companyId || '10959119-72e4-4e57-ba54-923e36bba6a6';

                set((state) => ({
                    contacts: state.contacts.map(c => c.id === id ? { ...c, ...updates } : c)
                }));

                if (!user || !user.companyId) return;

                if (supabase) {
                    try {
                        const contact = get().contacts.find(c => c.id === id);
                        if (contact) {
                            const payload = {
                                id: contact.id,
                                organization_id: companyId,
                                name: contact.name,
                                email: contact.email,
                                phone: contact.phone,
                                address: contact.address,
                                type: contact.type,
                                customer_type: contact.customerType,
                                preferences: contact.preferences,
                                document_links: contact.documentLinks
                            };
                            await supabase.from('contacts').upsert(payload);
                        }
                    } catch (e) {
                        console.error("Update Contact Error:", e);
                    }
                }
            },
            addInteractionLog: async (log) => {
                const user = useAuthStore.getState().user;
                const companyId = user?.companyId || '10959119-72e4-4e57-ba54-923e36bba6a6';
                const userId = user?.id || 'sys';

                const logId = log.id || crypto.randomUUID();
                const newLog = {
                    ...log,
                    id: logId,
                    createdAt: new Date().toISOString(),
                    createdBy: userId
                } as unknown as InteractionLog;

                set((state) => ({
                    interactionLogs: [newLog, ...state.interactionLogs]
                }));

                if (!user || !user.companyId) return;

                if (supabase) {
                    try {
                        const payload = {
                            id: logId,
                            contact_id: log.contactId,
                            type: log.type,
                            summary: log.summary,
                            content: log.content,
                            created_at: newLog.createdAt,
                            created_by: userId,
                            organization_id: companyId
                        };
                        await supabase.from('interaction_logs').upsert(payload);
                    } catch (e) {
                        console.error("Add Interaction Log Error:", e);
                    }
                }
            },
            addContactsBulk: (contacts) => set((state) => ({
                contacts: [...contacts.map(c => ({ ...c, id: c.id || crypto.randomUUID(), companyId: c.companyId || '10959119-72e4-4e57-ba54-923e36bba6a6' }) as Contact), ...state.contacts]
            })),
            deleteContact: (id) => set((state) => ({
                contacts: state.contacts.filter(c => c.id !== id)
            })),
            addInvoice: async (invoice) => {
                const user = useAuthStore.getState().user;
                const companyId = user?.companyId || invoice.companyId || '10959119-72e4-4e57-ba54-923e36bba6a6';

                set((state) => ({ invoices: [invoice, ...state.invoices] }));

                if (!supabase || !user || !user.companyId) return;

                // Sync to DB
                try {
                    // 1. Insert Invoice Header (Exclude 'lines' to avoid column error)
                    const { lines, ...invoiceHeader } = invoice;

                    const payload = {
                        id: invoice.id,
                        company_id: companyId,
                        contact_id: invoice.contactId,
                        number: invoice.number,
                        date: invoice.date,
                        due_date: invoice.dueDate,
                        status: invoice.status,
                        type: invoice.type || 'Sales',
                        total_cents: invoice.totalCents || 0,
                        subtotal_cents: invoice.subtotalCents || 0,
                        service_charge_cents: invoice.serviceChargeCents || 0,
                        vat_cents: invoice.vatCents || 0,
                        paid_amount_cents: invoice.paidAmountCents || 0,
                        category: invoice.category,
                        lines: invoice.lines
                    };

                    const { error } = await supabase.from('invoices').upsert(payload);
                    if (error) {
                        console.error("Failed to persist invoice:", error);
                        alert(`Invoice Save Failed: ${error.message}`);
                    }

                } catch (e: any) {
                    console.error("Invoice Persistence Error:", e);
                    alert(`Invoice Persistence Error: ${e.message || e}`);
                }
            },
            updateInvoiceStatus: (id, status) => set((state) => ({
                invoices: state.invoices.map(inv => inv.id === id ? { ...inv, status } : inv)
            })),
            addBookkeepingEntry: (entry) => set((state) => ({
                bookkeeping: [entry, ...state.bookkeeping]
            })),
            addTransaction: (tx) => set((state) => ({
                bankTransactions: [tx, ...state.bankTransactions]
            })),
            recordPayment: (id, amount, bankAccountId, statusOverride) => set((state) => {
                const invoice = state.invoices.find(inv => inv.id === id);
                if (!invoice) return state;

                const isPurchase = invoice.type === 'Purchase';
                const newPaid = (invoice.paidAmountCents || 0) + amount;
                const newStatus = statusOverride || (newPaid >= invoice.totalCents ? InvoiceStatus.PAID : invoice.status);

                const updatedInvoices = state.invoices.map(inv =>
                    inv.id === id ? { ...inv, paidAmountCents: newPaid, status: newStatus } : inv
                );

                let updatedBankAccounts = state.bankAccounts;
                let updatedBankTransactions = state.bankTransactions;

                if (bankAccountId) {
                    const account = state.bankAccounts.find(a => a.id === bankAccountId);
                    if (account) {
                        // If purchase, money goes OUT (decrement balance)
                        const balanceDelta = isPurchase ? -amount : amount;
                        updatedBankAccounts = state.bankAccounts.map(a =>
                            a.id === bankAccountId
                                ? { ...a, balanceCents: a.balanceCents + balanceDelta, lastUpdated: new Date().toISOString() }
                                : a
                        );

                        const newBankTx: BankTransaction = {
                            id: crypto.randomUUID(),
                            companyId: invoice.companyId,
                            bankAccountId: bankAccountId,
                            date: new Date().toISOString().split('T')[0],
                            description: `Payment ${isPurchase ? 'for' : 'from'} Invoice #${invoice.number}`,
                            amountCents: amount,
                            type: isPurchase ? 'Outflow' : 'Inflow',
                            category: isPurchase ? (invoice.category || 'Purchase') : 'Sales',
                            referenceId: id
                        };
                        updatedBankTransactions = [newBankTx, ...state.bankTransactions];

                        // Persist Bank Account Update
                        if (supabase) {
                            supabase.from('bank_accounts').update({
                                balance_cents: account.balanceCents + balanceDelta,
                                last_updated: new Date().toISOString()
                            }).eq('id', bankAccountId).then(({ error }) => {
                                if (error) console.error("Failed to update bank balance:", error);
                            });
                        }
                    }
                }

                const newEntry: BookkeepingEntry = {
                    id: crypto.randomUUID(),
                    date: new Date().toISOString().split('T')[0],
                    type: isPurchase ? 'Outflow' : 'Inflow',
                    category: isPurchase ? (invoice.category || 'Purchase') : 'Sales',
                    description: `Payment ${isPurchase ? 'for' : 'from'} Invoice #${invoice.number}`,
                    amountCents: amount,
                    referenceId: id,
                    contactId: invoice.contactId,
                    paymentMethod: bankAccountId ? 'Bank Transfer' : 'Cash'
                };

                // Sync invoice update to Supabase
                if (supabase) {
                    supabase.from('invoices').update({
                        paid_amount_cents: newPaid,
                        status: newStatus
                    }).eq('id', id).then(({ error }) => {
                        if (error) console.error("Failed to update invoice:", error);
                    });
                }

                return {
                    invoices: updatedInvoices,
                    bookkeeping: [newEntry, ...state.bookkeeping],
                    bankAccounts: updatedBankAccounts,
                    bankTransactions: updatedBankTransactions
                };
            }),
            reconcileMatch: (lineId, accountId) => set((state) => ({
                bankStatementLines: state.bankStatementLines.map(l => l.id === lineId ? { ...l, isMatched: true } : l)
            })),

            addBankAccount: async (account) => {
                const user = useAuthStore.getState().user;
                const companyId = user?.companyId || '10959119-72e4-4e57-ba54-923e36bba6a6';
                const newAccount = {
                    ...account,
                    id: account.id || crypto.randomUUID(),
                    companyId,
                    isActive: true,
                    lastUpdated: new Date().toISOString()
                } as BankAccount;

                set(state => ({ bankAccounts: [newAccount, ...state.bankAccounts] }));

                if (supabase) {
                    try {
                        await supabase.from('bank_accounts').upsert({
                            id: newAccount.id,
                            organization_id: companyId,
                            bank_name: newAccount.bankName,
                            account_name: newAccount.accountName,
                            account_number: newAccount.accountNumber,
                            currency: newAccount.currency,
                            balance_cents: newAccount.balanceCents,
                            is_active: true,
                            last_updated: newAccount.lastUpdated
                        });
                    } catch (e) { console.error("Failed to add bank account", e); }
                }
            },

            updateBankAccount: async (id, updates) => {
                set(state => ({
                    bankAccounts: state.bankAccounts.map(b => b.id === id ? { ...b, ...updates, lastUpdated: new Date().toISOString() } : b)
                }));

                if (supabase) {
                    try {
                        const account = get().bankAccounts.find(b => b.id === id);
                        if (account) {
                            await supabase.from('bank_accounts').upsert({
                                id: account.id,
                                organization_id: account.companyId,
                                bank_name: account.bankName,
                                account_name: account.accountName,
                                account_number: account.accountNumber,
                                currency: account.currency,
                                balance_cents: account.balanceCents,
                                is_active: account.isActive,
                                last_updated: new Date().toISOString()
                            });
                        }
                    } catch (e) { console.error("Failed to update bank account", e); }
                }
            },

            deleteBankAccount: async (id) => {
                set(state => ({ bankAccounts: state.bankAccounts.filter(b => b.id !== id) }));
                if (supabase) {
                    try {
                        await supabase.from('bank_accounts').delete().eq('id', id);
                    } catch (e) { console.error("Failed to delete bank account", e); }
                }
            },

            addEmployee: async (emp) => {
                const user = useAuthStore.getState().user;
                console.log('[HR Debug] Current User:', user);

                if (!supabase) throw new Error("Database connection unavailable");

                const newEmp = {
                    ...emp,
                    id: emp.id || crypto.randomUUID(),
                    // Ensure we use the correct column logic for the DB payload, but local model uses camelCase
                    companyId: user?.companyId || emp.companyId,
                    status: (emp.status as any) || 'Active',
                    kpis: emp.kpis || [],
                    avatar: emp.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.firstName}`
                } as Employee;

                console.log('[HR Debug] New Employee Payload:', newEmp);

                // EXPLICIT DB INSERTION FOR VERIFICATION
                // We construct the DB payload manually to match the schema we just fixed
                const dbPayload = {
                    id: newEmp.id,
                    organization_id: newEmp.companyId, // mapped from companyId
                    first_name: newEmp.firstName,
                    last_name: newEmp.lastName,
                    email: newEmp.email,
                    role: newEmp.role,
                    status: newEmp.status,
                    phone_number: newEmp.phoneNumber,
                    salary_cents: newEmp.salaryCents,
                    date_of_employment: newEmp.dateOfEmployment,
                    dob: newEmp.dob,
                    gender: newEmp.gender,
                    address: newEmp.address,
                    kpis: newEmp.kpis,
                    avatar: newEmp.avatar,
                    health_notes: newEmp.healthNotes,
                    staff_id: (newEmp as any).staffId
                };

                const { error } = await supabase.from('employees').insert([dbPayload]);

                if (error) {
                    console.error("DB Insert Failed:", error);
                    throw new Error(`Database Error: ${error.message}`);
                }

                // If successful, update local state
                set((state) => ({ employees: [newEmp, ...state.employees] }));

                // Trigger full sync just in case, but we know this one is done
                get().syncWithCloud();

                return newEmp;
            },
            updateEmployee: (id, updates) => {
                set((state) => ({
                    employees: state.employees.map(e => e.id === id ? { ...e, ...updates } : e)
                }));
                get().syncWithCloud();
            },
            updateCateringEvent: (id, updates) => {
                set((state) => ({
                    cateringEvents: state.cateringEvents.map(e => e.id === id ? { ...e, ...updates } : e)
                }));
                get().syncWithCloud();
            },
            applyForLeave: async (req) => {
                const user = useAuthStore.getState().user;
                const companyId = user?.companyId || (req as any).companyId || '10959119-72e4-4e57-ba54-923e36bba6a6';

                // Optimistic Update
                const tempId = req.id || crypto.randomUUID();
                const newReq = { ...req, id: tempId, status: 'Pending', appliedDate: new Date().toISOString().split('T')[0] } as LeaveRequest;
                set((state) => ({ leaveRequests: [newReq, ...state.leaveRequests] }));

                if (!user || !user.companyId || !supabase) {
                    return newReq;
                }

                // Prepare Payload
                const payload = {
                    organization_id: companyId,
                    employee_id: req.employeeId,
                    employee_name: req.employeeName,
                    type: req.type,
                    start_date: req.startDate,
                    end_date: req.endDate,
                    reason: req.reason,
                    status: 'Pending',
                    applied_date: new Date().toISOString().split('T')[0]
                };

                // DB Insert
                try {
                    const { data, error } = await supabase.from('leave_requests').insert([payload]).select();
                    if (data && data[0]) {
                        // Replace temp ID with real ID
                        set((state) => ({
                            leaveRequests: state.leaveRequests.map(l => l.id === tempId ? { ...l, id: data[0].id } : l)
                        }));
                    }
                } catch (e) { console.error("Leave Apply Error:", e); }

                return newReq;
            },
            approveLeave: async (id) => {
                set((state) => ({
                    leaveRequests: state.leaveRequests.map(l => l.id === id ? { ...l, status: 'Approved' as any } : l)
                }));
                if (supabase) await supabase.from('leave_requests').update({ status: 'Approved' }).eq('id', id);
            },
            rejectLeave: async (id) => {
                set((state) => ({
                    leaveRequests: state.leaveRequests.map(l => l.id === id ? { ...l, status: 'Rejected' as any } : l)
                }));
                if (supabase) await supabase.from('leave_requests').update({ status: 'Rejected' }).eq('id', id);
            },
            adjustBandSalary: (band, percent) => set((state) => ({
                departmentMatrix: state.departmentMatrix.map(dept => ({
                    ...dept,
                    roles: dept.roles.map(r => r.band === band ? {
                        ...r,
                        salaryRange: {
                            low: r.salaryRange.low * (1 + percent / 100),
                            mid: r.salaryRange.mid * (1 + percent / 100),
                            high: r.salaryRange.high * (1 + percent / 100)
                        }
                    } : r)
                }))
            })),

            addPerformanceReview: async (review) => {
                const user = useAuthStore.getState().user;
                const companyId = user?.companyId || (review as any).companyId || '10959119-72e4-4e57-ba54-923e36bba6a6';

                const newReview = { ...review, id: review.id || `rev-${Date.now()}`, status: 'Draft', totalScore: 0, metrics: review.metrics || [] } as PerformanceReview;

                // Optimistic
                set((state) => ({ performanceReviews: [newReview, ...state.performanceReviews] }));

                if (!supabase || !user || !user.companyId) return;

                // DB Insert
                const payload = {
                    organization_id: companyId,
                    employee_id: newReview.employeeId,
                    year: newReview.year,
                    quarter: newReview.quarter,
                    metrics: newReview.metrics,
                    status: 'Draft',
                    total_score: 0
                };

                const { data, error } = await supabase.from('performance_reviews').insert([payload]).select();
                if (data && data[0]) {
                    set((state) => ({ performanceReviews: state.performanceReviews.map(r => r.id === newReview.id ? { ...r, id: data[0].id } : r) }));
                } else if (error) {
                    console.error("Failed to create review:", error);
                }
            },

            submitSelfAssessment: async (id, scores) => {
                const state = get();
                const review = state.performanceReviews.find(r => r.id === id);
                if (!review) return;

                const newMetrics = review.metrics.map((m, idx) => scores[idx] !== undefined ? { ...m, employeeScore: scores[idx] } : m);

                // Optimistic
                set((state) => ({
                    performanceReviews: state.performanceReviews.map(r => r.id === id ? { ...r, metrics: newMetrics, status: 'Supervisor_Review' } : r)
                }));

                if (supabase) {
                    await supabase.from('performance_reviews').update({
                        metrics: newMetrics,
                        status: 'Supervisor_Review',
                        submitted_date: new Date().toISOString()
                    }).eq('id', id);
                }
            },

            submitSupervisorReview: async (id, scores, overrideReason) => {
                const state = get();
                const review = state.performanceReviews.find(r => r.id === id);
                if (!review) return;

                const newMetrics = review.metrics.map((m, idx) => {
                    const supScore = scores[idx] !== undefined ? scores[idx] : m.supervisorScore;
                    let finalScore = 0;
                    if (m.isSupervisorOnly) {
                        finalScore = supScore;
                    } else {
                        // If employee hasn't submitted a score, use supervisor score as final
                        finalScore = m.employeeScore > 0
                            ? Math.round(((m.employeeScore + supScore) / 2) * 10) / 10
                            : supScore;
                    }

                    return {
                        ...m,
                        supervisorScore: supScore,
                        finalScore: finalScore,
                        managerOverrideReason: overrideReason
                    };
                });

                let totalWeightedScore = 0;
                let totalWeight = 0;
                newMetrics.forEach(m => {
                    totalWeightedScore += (m.finalScore * m.weight);
                    totalWeight += m.weight;
                });
                const finalTotal = totalWeight > 0 ? (totalWeightedScore / totalWeight) : 0;
                const roundedTotal = Math.round(finalTotal * 10) / 10;
                const finalizedDate = new Date().toISOString();

                // Optimistic
                set((state) => ({
                    performanceReviews: state.performanceReviews.map(r => r.id === id ? {
                        ...r, metrics: newMetrics, totalScore: roundedTotal, status: 'Finalized', finalizedDate
                    } : r)
                }));

                if (supabase) {
                    await supabase.from('performance_reviews').update({
                        metrics: newMetrics,
                        total_score: roundedTotal,
                        status: 'Finalized',
                        finalized_date: finalizedDate
                    }).eq('id', id);
                }
            },

            updateRoleKPIs: async (roleTitle: string, kpis: PerformanceMetric[]) => {
                const { departmentMatrix } = get() as any;
                const newMatrix = departmentMatrix.map((dept: any) => ({
                    ...dept,
                    roles: dept.roles.map((role: any) => role.title === roleTitle ? { ...role, kpis } : role)
                }));

                set({ departmentMatrix: newMatrix });

                if (supabase) {
                    await supabase.from('job_roles').update({ kpis }).eq('title', roleTitle);
                }
            },

            checkPerformanceDue: () => {
                set((state) => {
                    const now = new Date();
                    const currentYear = now.getFullYear();
                    // Deadlines: Q1=Mar31, Q2=Jun30, Q3=Sep30, Q4=Dec31
                    const deadlines = {
                        'Q1': new Date(currentYear, 2, 31),
                        'Q2': new Date(currentYear, 5, 30),
                        'Q3': new Date(currentYear, 8, 30),
                        'Q4': new Date(currentYear, 11, 31)
                    };

                    // Determine current or just finished quarter
                    // Simplification: Check all active employees for missing Q reviews near deadline
                    const newTasks: Task[] = [];
                    // Logic to iterate employees and deadlines omitted for brevity in this step, adding a placeholder alert mechanism
                    return state;
                });
            },

            addMeetingTask: (t) => {
                const newTask = { ...t, id: `task-${Date.now()}`, companyId: '10959119-72e4-4e57-ba54-923e36bba6a6', status: t.status || 'Todo', priority: t.priority || 'Medium', createdDate: new Date().toISOString() } as Task;
                set((state) => ({ tasks: [newTask, ...state.tasks] }));
                get().syncWithCloud();
            },

            addTask: (t) => {
                const newTask = { ...t, id: t.id || `task-${Date.now()}`, companyId: useAuthStore.getState().user?.companyId || '10959119-72e4-4e57-ba54-923e36bba6a6', status: t.status || 'Todo', priority: t.priority || 'Medium', createdDate: new Date().toISOString() } as Task;
                set((state) => ({ tasks: [newTask, ...state.tasks] }));
                get().syncWithCloud();
            },

            updateTask: (id, updates) => {
                set((state) => ({
                    tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
                }));
                get().syncWithCloud();
            },

            updateProjectTask: (projectId, taskId, updates) => {
                const state = get();
                const project = state.projects.find(p => p.id === projectId);
                if (!project) return;

                const updatedTasks = project.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);

                // Recalculate progress
                const doneCount = updatedTasks.filter(t => t.status === 'Done' || t.status === 'Completed').length;
                const progress = updatedTasks.length > 0 ? Math.round((doneCount / updatedTasks.length) * 100) : 0;

                const newStatus = progress === 100 ? 'Completed' : project.status;

                set((state) => ({
                    projects: state.projects.map(p => p.id === projectId ? {
                        ...p,
                        tasks: updatedTasks,
                        progress,
                        status: newStatus as any
                    } : p)
                }));
                get().syncWithCloud();
            },

            advanceProjectTask: (projectId, taskId) => {
                const state = get();
                const project = state.projects.find(p => p.id === projectId);
                if (!project) return;

                const task = project.tasks.find(t => t.id === taskId);
                if (!task) return;

                const statusOrder: Task['status'][] = ['Todo', 'In Progress', 'Review', 'Done'];
                const currentIndex = statusOrder.indexOf(task.status as any);

                if (currentIndex !== -1 && currentIndex < statusOrder.length - 1) {
                    const nextStatus = statusOrder[currentIndex + 1];
                    state.updateProjectTask(projectId, taskId, { status: nextStatus as any });
                }
            },

            addProject: (proj) => {
                const newProject = {
                    ...proj,
                    id: proj.id || `proj-${Date.now()}`,
                    companyId: useAuthStore.getState().user?.companyId || proj.companyId || '10959119-72e4-4e57-ba54-923e36bba6a6',
                    status: proj.status || 'Planning',
                    progress: proj.progress || 0,
                    tasks: proj.tasks || [],
                    aiAlerts: proj.aiAlerts || []
                } as Project;
                set((state) => ({ projects: [newProject, ...state.projects] }));
                get().syncWithCloud();
            },

            addIngredient: (ing) => {
                const user = useAuthStore.getState().user;
                const companyId = user?.companyId || '10959119-72e4-4e57-ba54-923e36bba6a6';

                const newIngId = ing.id || `ing-${Date.now()}`;
                const newIng = {
                    ...ing,
                    id: newIngId,
                    companyId,
                    lastUpdated: new Date().toISOString(),
                    stockLevel: ing.stockLevel || 0,
                    currentCostCents: ing.currentCostCents || 0
                } as Ingredient;

                // Also create an InventoryItem representation
                const newInvItem: InventoryItem = {
                    id: newIngId,
                    companyId,
                    name: ing.name || 'Unnamed Ingredient',
                    category: ing.category || 'Dry Goods',
                    type: 'ingredient',
                    priceCents: ing.currentCostCents || 0,
                    stockQuantity: ing.stockLevel || 0,
                    image: ing.image,
                    isActive: true
                };

                set((state) => ({
                    ingredients: [newIng, ...state.ingredients],
                    inventory: [newInvItem, ...state.inventory]
                }));
                get().syncWithCloud();
            },

            updateIngredient: async (id, updates) => {
                const user = useAuthStore.getState().user;
                if (!user || !user.companyId) return;
                const companyId = user.companyId;
                const userId = user.id;

                set((state) => ({
                    ingredients: state.ingredients.map((ing) =>
                        ing.id === id ? { ...ing, ...updates, lastUpdated: new Date().toISOString() } : ing
                    ),
                    // Also update inventory if matched
                    inventory: state.inventory.map(inv => inv.id === id ? { ...inv, ...updates } : inv)
                }));

                // Handle Image Update
                if (updates.image && updates.image.startsWith('data:image')) {
                    try {
                        // Assuming ingredients are 'ingredient' type
                        const uploadRes = await uploadEntityImage(companyId, 'ingredient', id, updates.image);
                        await saveEntityMedia({
                            entity_type: 'ingredient',
                            entity_id: id,
                            organization_id: companyId,
                            bucket: uploadRes.bucket,
                            object_path: uploadRes.path,
                            is_primary: true
                        });
                        // Note: We don't update existing 'image_url' column in 'ingredients' table to avoid duplication/confusion
                        // given the new strategy. But if the old logic relies on it, we might have issues.
                        // Ideally we update the view or the legacy column with the public URL?
                        // For now we stick to the new plan: entity_media is the source of truth.
                    } catch (e) {
                        console.error("Failed to update ingredient image:", e);
                    }
                }

                // Sync other fields
                // ... (existing sync logic or just let syncWithCloud handle generic table updates?)
                // The generic 'syncWithCloud' pulls entire table. We want to push updates.
                // The store has `updateIngredient` which calls `get().syncWithCloud()`.
                // Actually `get().syncWithCloud()` likely does a FULL PULL or PUSH?
                // Let's check `syncWithCloud` implementation. It seems missing here or assumes pull.

                // For safety, let's explicitly update the row if we can.
                try {
                    const { error } = await supabase!.from('ingredients').update({
                        name: updates.name,
                        stock_level: updates.stockLevel,
                        current_cost_cents: updates.currentCostCents
                        // Add other fields if necessary
                    }).eq('id', id);
                    if (error) console.error(error);
                } catch (e) { }

                get().syncWithCloud();
            },

            updateIngredientPrice: (id, marketPriceCents, insight) => {
                set((state) => ({
                    ingredients: state.ingredients.map((ing) =>
                        ing.id === id
                            ? {
                                ...ing,
                                marketPriceCents,
                                marketInsight: insight,
                                lastUpdated: new Date().toISOString(),
                            }
                            : ing
                    ),
                }));
                get().syncWithCloud();
            },


            addMarketingPost: (p) => {
                const post = { ...p, id: `mp-${Date.now()}`, companyId: '10959119-72e4-4e57-ba54-923e36bba6a6', generatedByAI: p.generatedByAI || false } as MarketingPost;
                set((state) => ({ marketingPosts: [post, ...state.marketingPosts] }));
                get().syncWithCloud();
                return post;
            },
            addAIAgent: (a) => {
                const agent = { ...a, id: `a-${Date.now()}`, companyId: '10959119-72e4-4e57-ba54-923e36bba6a6', status: 'Deployed' } as AIAgent;
                set((state) => ({ aiAgents: [agent, ...state.aiAgents] }));
                get().syncWithCloud();
            },
            addWorkflow: (wf) => {
                const workflow = { ...wf, id: `wf-${Date.now()}`, logs: [], status: 'Active' } as Workflow;
                set((state) => ({ workflows: [workflow, ...state.workflows] }));
                get().syncWithCloud();
            },
            addAgenticLog: (log) => {
                const newLog = {
                    ...log,
                    id: log.id || crypto.randomUUID(),
                    timestamp: log.timestamp || new Date().toISOString()
                } as AgenticLog;
                set((state) => ({ agenticLogs: [newLog, ...state.agenticLogs] }));
            },

            addMessage: async (message) => {
                const user = useAuthStore.getState().user;

                // CRITICAL: Database requires a valid UUID for organization_id
                const orgId = message.organizationId || user?.companyId || '10959119-72e4-4e57-ba54-923e36bba6a6';

                // UUID Fix: Primary Key 'id' must be a valid UUID
                // Use the provided ID if it looks like a UUID, otherwise generate a fresh one
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                const msgId = (message.id && uuidRegex.test(message.id)) ? message.id : crypto.randomUUID();

                const newMessage = {
                    ...message,
                    id: msgId,
                    createdAt: message.createdAt || new Date().toISOString(),
                    organizationId: orgId
                } as Message;

                // Optimistic Update
                set((state) => ({
                    messages: [...state.messages, newMessage]
                }));

                // Persist
                if (supabase) {
                    try {
                        const payload = {
                            id: msgId,
                            sender_id: newMessage.senderId,
                            recipient_id: newMessage.recipientId,
                            content: newMessage.content,
                            created_at: newMessage.createdAt,
                            organization_id: orgId
                        };
                        const { error } = await supabase.from('messages').insert(payload);
                        if (error) {
                            console.error("Failed to persist message:", error);
                        }
                    } catch (e) {
                        console.error("Message Persistence Error:", e);
                    }
                }
            },
            markMessageRead: async (messageId) => {
                set((state) => ({
                    messages: state.messages.map(m => m.id === messageId ? { ...m, readAt: new Date().toISOString(), status: 'read' } : m)
                }));

                if (supabase) {
                    const { error } = await supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', messageId);
                    if (error) console.error(error);
                }
            },

            initializePortionMonitor: (eventId, tableCount, guestsPerTable) => set((state) => {
                const eventIndex = state.cateringEvents.findIndex(e => e.id === eventId);
                if (eventIndex === -1) return state;

                const tables: any[] = [];
                for (let i = 1; i <= tableCount; i++) {
                    const seats: any[] = [];
                    for (let s = 1; s <= guestsPerTable; s++) {
                        seats.push({
                            id: `seat-${eventId}-${i}-${s}`,
                            number: s,
                            servingCount: 0,
                            status: 'Empty',
                            servedItems: []
                        });
                    }
                    tables.push({
                        id: `tbl-${eventId}-${i}`,
                        name: `Table ${i}`,
                        assignedGuests: guestsPerTable,
                        status: 'Waiting' as const,
                        servedItems: [],
                        isLocked: false,
                        seats
                    });
                }

                const updatedEvents = [...state.cateringEvents];
                updatedEvents[eventIndex] = {
                    ...updatedEvents[eventIndex],
                    portionMonitor: {
                        eventId,
                        tables,
                        leftovers: [],
                        handoverEvidence: []
                    }
                };

                return { cateringEvents: updatedEvents };
            }),

            addPortionMonitorTable: (eventId: string, guestCapacity: number) => set((state) => {
                const eventIndex = state.cateringEvents.findIndex(e => e.id === eventId);
                if (eventIndex === -1) return state;

                const event = state.cateringEvents[eventIndex];
                if (!event.portionMonitor) return state;

                const currentTableCount = event.portionMonitor.tables.length;
                const newTableId = `tbl-${eventId}-${Date.now()}`;

                // Create seats
                const seats: any[] = [];
                for (let s = 1; s <= guestCapacity; s++) {
                    seats.push({
                        id: `seat-${newTableId}-${s}`,
                        number: s,
                        servingCount: 0,
                        status: 'Empty',
                        servedItems: []
                    });
                }

                const newTable = {
                    id: newTableId,
                    name: `Table ${currentTableCount + 1}`,
                    assignedGuests: guestCapacity,
                    status: 'Waiting' as const,
                    servedItems: [],
                    isLocked: false,
                    seats
                };

                const updatedEvent = {
                    ...event,
                    portionMonitor: {
                        ...event.portionMonitor,
                        tables: [...event.portionMonitor.tables, newTable]
                    }
                };

                const updatedEvents = [...state.cateringEvents];
                updatedEvents[eventIndex] = updatedEvent;

                get().syncWithCloud();
                return { cateringEvents: updatedEvents };
            }),

            markTableServed: (eventId, tableId, itemIds) => set((state) => {
                const eventIndex = state.cateringEvents.findIndex(e => e.id === eventId);
                if (eventIndex === -1) return state;

                const event = state.cateringEvents[eventIndex];
                if (!event.portionMonitor) return state;

                const updatedTables = event.portionMonitor.tables.map((t: any) => {
                    if (t.id === tableId) {
                        // Batch serve (Legacy/Quick Mode) - serves "Unknown" or first item if passed
                        const updatedSeats = t.seats?.map((s: any) => ({
                            ...s,
                            servingCount: s.servingCount + 1,
                            status: 'Occupied'
                        })) || [];

                        return {
                            ...t,
                            status: 'Served' as const,
                            isLocked: false,
                            seats: updatedSeats,
                            servedItems: itemIds.map(id => ({
                                itemId: id,
                                name: event.items.find(i => i.inventoryItemId === id)?.name || 'Unknown Item',
                                quantity: updatedSeats.reduce((sum: number, seat: any) => sum + seat.servingCount, 0),
                                servedAt: new Date().toISOString()
                            }))
                        };
                    }
                    return t;
                });

                const updatedEvent = {
                    ...event,
                    portionMonitor: { ...event.portionMonitor, tables: updatedTables }
                };

                const updatedEvents = [...state.cateringEvents];
                updatedEvents[eventIndex] = updatedEvent;

                get().syncWithCloud();
                return { cateringEvents: updatedEvents };
            }),

            markSeatServed: (eventId: string, tableId: string, seatId: string, itemId?: string) => set((state) => {
                const eventIndex = state.cateringEvents.findIndex(e => e.id === eventId);
                if (eventIndex === -1) return state;

                const event = state.cateringEvents[eventIndex];
                if (!event.portionMonitor) return state;

                const itemToServe = itemId ? event.items.find(i => i.inventoryItemId === itemId) : null;
                const itemName = itemToServe?.name || 'Unknown Item';
                const resolvedItemId = itemId || 'unknown';

                const updatedTables = event.portionMonitor.tables.map((t: any) => {
                    if (t.id === tableId) {
                        const updatedSeats = t.seats.map((s: any) => {
                            if (s.id === seatId) {
                                // Update servedItems list
                                const existingItemIndex = s.servedItems?.findIndex((i: any) => i.itemId === resolvedItemId);
                                let newServedItems = [...(s.servedItems || [])];

                                if (existingItemIndex > -1) {
                                    newServedItems[existingItemIndex] = {
                                        ...newServedItems[existingItemIndex],
                                        quantity: newServedItems[existingItemIndex].quantity + 1
                                    };
                                } else {
                                    newServedItems.push({
                                        itemId: resolvedItemId,
                                        name: itemName,
                                        quantity: 1
                                    });
                                }

                                return {
                                    ...s,
                                    servingCount: s.servingCount + 1,
                                    status: 'Served' as const,
                                    servedItems: newServedItems
                                };
                            }
                            return s;
                        });

                        // Calculate total served for the table (for legacy view/progress)
                        const totalServed = updatedSeats.reduce((sum: number, seat: any) => sum + seat.servingCount, 0);

                        // Determine new status
                        let newStatus: 'Waiting' | 'Partially Served' | 'Served' = 'Waiting';
                        if (totalServed >= t.assignedGuests) {
                            newStatus = 'Served';
                        } else if (totalServed > 0) {
                            newStatus = 'Partially Served';
                        }

                        return {
                            ...t,
                            status: newStatus,
                            seats: updatedSeats,
                            // Update legacy servedItems count for progress tracking
                            servedItems: event.items.map(i => ({
                                itemId: i.inventoryItemId,
                                name: i.name,
                                quantity: totalServed, // Rough approximation for top-level progress
                                servedAt: new Date().toISOString()
                            }))
                        };
                    }
                    return t;
                });

                const updatedEvent = {
                    ...event,
                    portionMonitor: { ...event.portionMonitor, tables: updatedTables }
                };
                const updatedEvents = [...state.cateringEvents];
                updatedEvents[eventIndex] = updatedEvent;

                get().syncWithCloud();
                return { cateringEvents: updatedEvents };
            }),

            removeSeatServing: (eventId: string, tableId: string, seatId: string, itemId: string) => set((state) => {
                const eventIndex = state.cateringEvents.findIndex(e => e.id === eventId);
                if (eventIndex === -1) return state;

                const event = state.cateringEvents[eventIndex];
                if (!event.portionMonitor) return state;

                const updatedTables = event.portionMonitor.tables.map((t: any) => {
                    if (t.id === tableId) {
                        const updatedSeats = t.seats.map((s: any) => {
                            if (s.id === seatId && s.servedItems) {
                                // Find item to remove
                                const existingItemIndex = s.servedItems.findIndex((i: any) => i.itemId === itemId);
                                if (existingItemIndex === -1) return s;

                                let newServedItems = [...s.servedItems];
                                const currentQty = newServedItems[existingItemIndex].quantity;

                                if (currentQty > 1) {
                                    // Decrement quantity
                                    newServedItems[existingItemIndex] = {
                                        ...newServedItems[existingItemIndex],
                                        quantity: currentQty - 1
                                    };
                                } else {
                                    // Remove item entirely
                                    newServedItems.splice(existingItemIndex, 1);
                                }

                                const newServingCount = Math.max(0, s.servingCount - 1);

                                return {
                                    ...s,
                                    servingCount: newServingCount,
                                    status: newServingCount > 0 ? 'Occupied' : 'Empty',
                                    servedItems: newServedItems
                                };
                            }
                            return s;
                        });

                        // Calculate total served for the table
                        const totalServed = updatedSeats.reduce((sum: number, seat: any) => sum + seat.servingCount, 0);

                        // Determine new status
                        let newStatus: 'Waiting' | 'Partially Served' | 'Served' = 'Waiting';
                        if (totalServed >= t.assignedGuests) {
                            newStatus = 'Served';
                        } else if (totalServed > 0) {
                            newStatus = 'Partially Served';
                        }

                        return {
                            ...t,
                            status: newStatus,
                            seats: updatedSeats,
                            // Update legacy servedItems count for progress tracking
                            servedItems: event.items.map(i => ({
                                itemId: i.inventoryItemId,
                                name: i.name,
                                quantity: totalServed,
                                servedAt: new Date().toISOString()
                            }))
                        };
                    }
                    return t;
                });

                const updatedEvent = {
                    ...event,
                    portionMonitor: { ...event.portionMonitor, tables: updatedTables }
                };
                const updatedEvents = [...state.cateringEvents];
                updatedEvents[eventIndex] = updatedEvent;

                get().syncWithCloud();
                return { cateringEvents: updatedEvents };
            }),

            updateTableCapacity: (eventId: string, tableId: string, newCount: number) => set((state) => {
                const eventIndex = state.cateringEvents.findIndex(e => e.id === eventId);
                if (eventIndex === -1) return state;

                const event = state.cateringEvents[eventIndex];
                if (!event.portionMonitor) return state;

                const updatedTables = event.portionMonitor.tables.map((t: any) => {
                    if (t.id === tableId) {
                        let updatedSeats = [...(t.seats || [])];
                        if (newCount > updatedSeats.length) {
                            // Add seats
                            for (let i = updatedSeats.length + 1; i <= newCount; i++) {
                                updatedSeats.push({
                                    id: `seat-${eventId}-${t.id.split('-')[2]}-${i}`,
                                    number: i,
                                    servingCount: 0,
                                    status: 'Empty',
                                    servedItems: []
                                });
                            }
                        } else if (newCount < updatedSeats.length) {
                            // Remove seats from end
                            updatedSeats = updatedSeats.slice(0, newCount);
                        }

                        return {
                            ...t,
                            assignedGuests: newCount,
                            seats: updatedSeats
                        };
                    }
                    return t;
                });

                const updatedEvent = {
                    ...event,
                    portionMonitor: { ...event.portionMonitor, tables: updatedTables }
                };
                const updatedEvents = [...state.cateringEvents];
                updatedEvents[eventIndex] = updatedEvent;
                get().syncWithCloud();
                return { cateringEvents: updatedEvents };
            }),

            assignWaiterToTable: (eventId, tableId, waiterId) => set((state) => {
                const eventIndex = state.cateringEvents.findIndex(e => e.id === eventId);
                if (eventIndex === -1) return state;

                const event = state.cateringEvents[eventIndex];
                if (!event.portionMonitor) return state;

                const updatedTables = event.portionMonitor.tables.map((t: any) =>
                    t.id === tableId ? { ...t, assignedWaiterId: waiterId } : t
                );

                const updatedEvent = {
                    ...event,
                    portionMonitor: { ...event.portionMonitor, tables: updatedTables }
                };
                const updatedEvents = [...state.cateringEvents];
                updatedEvents[eventIndex] = updatedEvent;

                get().syncWithCloud();
                return { cateringEvents: updatedEvents };
            }),

            logLeftover: (eventId, itemId, quantity, reason) => set((state) => {
                const eventIndex = state.cateringEvents.findIndex(e => e.id === eventId);
                if (eventIndex === -1) return state;
                const event = state.cateringEvents[eventIndex];
                if (!event.portionMonitor) return state;

                const itemName = event.items.find(i => i.inventoryItemId === itemId)?.name || 'Unknown';
                const newLeftover = {
                    itemId,
                    name: itemName,
                    quantity,
                    reason,
                    loggedAt: new Date().toISOString()
                };

                const updatedEvent = {
                    ...event,
                    portionMonitor: {
                        ...event.portionMonitor,
                        leftovers: [...event.portionMonitor.leftovers, newLeftover]
                    }
                };

                const updatedEvents = [...state.cateringEvents];
                updatedEvents[eventIndex] = updatedEvent;

                get().syncWithCloud();
                return { cateringEvents: updatedEvents };
            }),

            addHandoverEvidence: (eventId, url, note) => set((state) => {
                const eventIndex = state.cateringEvents.findIndex(e => e.id === eventId);
                if (eventIndex === -1) return state;
                const event = state.cateringEvents[eventIndex];
                if (!event.portionMonitor) return state;

                const newEvidence = {
                    url,
                    note,
                    timestamp: new Date().toISOString()
                };

                const updatedEvent = {
                    ...event,
                    portionMonitor: {
                        ...event.portionMonitor,
                        handoverEvidence: [...event.portionMonitor.handoverEvidence, newEvidence]
                    }
                };
                const updatedEvents = [...state.cateringEvents];
                updatedEvents[eventIndex] = updatedEvent;

                get().syncWithCloud();
                return { cateringEvents: updatedEvents };
            }),

            completeEvent: (eventId) => {
                set((state) => ({
                    cateringEvents: state.cateringEvents.map((e) =>
                        e.id === eventId ? {
                            ...e,
                            status: 'Archived',
                            currentPhase: 'PostEvent',
                            portionMonitor: e.portionMonitor ? { ...e.portionMonitor, completedAt: new Date().toISOString() } : { eventId: e.id, tables: [], leftovers: [], handoverEvidence: [], completedAt: new Date().toISOString() }
                        } : e
                    ),
                }));
                get().syncWithCloud();
            },

            completeCateringEvent: (eventId) => get().completeEvent(eventId),

            dispatchAssets: (eventId, assets) => set((state) => {
                const eventIndex = state.cateringEvents.findIndex(e => e.id === eventId);
                if (eventIndex === -1) return state;

                const updatedInventory = [...state.inventory];

                // Deduct stock
                assets.forEach(asset => {
                    const itemIndex = updatedInventory.findIndex(i => i.id === asset.itemId);
                    if (itemIndex > -1) {
                        const currentQty = updatedInventory[itemIndex].stockQuantity;
                        updatedInventory[itemIndex] = {
                            ...updatedInventory[itemIndex],
                            stockQuantity: Math.max(0, currentQty - asset.quantity)
                        };
                    }
                });

                const updatedEvents = [...state.cateringEvents];
                updatedEvents[eventIndex] = {
                    ...updatedEvents[eventIndex],
                    dispatchedAssets: assets
                };

                get().syncWithCloud();
                return {
                    cateringEvents: updatedEvents,
                    inventory: updatedInventory
                };
            }),

            finalizeEventLogistics: (eventId, returns) => set((state) => {
                const eventIndex = state.cateringEvents.findIndex(e => e.id === eventId);
                if (eventIndex === -1) return state;

                const updatedInventory = [...state.inventory];

                // Return stock
                returns.forEach(ret => {
                    const itemIndex = updatedInventory.findIndex(i => i.id === ret.itemId);
                    if (itemIndex > -1) {
                        const currentQty = updatedInventory[itemIndex].stockQuantity;
                        updatedInventory[itemIndex] = {
                            ...updatedInventory[itemIndex],
                            stockQuantity: currentQty + ret.returnedQty
                        };
                    }
                });

                const updatedEvents = [...state.cateringEvents];
                updatedEvents[eventIndex] = {
                    ...updatedEvents[eventIndex],
                    logisticsReturns: returns,
                    status: 'Archived',
                    currentPhase: 'PostEvent'
                };

                get().syncWithCloud();
                return {
                    cateringEvents: updatedEvents,
                    inventory: updatedInventory
                };
            }),

            generateWaiterLink: (eventId: string) => {
                console.log('[Store] Generating waiter link for event:', eventId);
                // Stub implementation
            },
            createCateringOrder: async (d) => {
                const user = useAuthStore.getState().user;
                const companyId = user?.companyId || '10959119-72e4-4e57-ba54-923e36bba6a6';

                // [CRITICAL] Ensure Contact exists in state before proceeding
                const state = get();
                let validContactId = d.contactId;

                const existingContact = state.contacts.find(c => c.id === validContactId);
                if (!existingContact && d.customerName) {
                    console.log(`[createCateringOrder] Contact ${validContactId} not found in state. Creating now...`);
                    // If no ID was provided, generate one
                    if (!validContactId) validContactId = crypto.randomUUID();

                    const newContact: Contact = {
                        id: validContactId,
                        companyId: useAuthStore.getState().user?.companyId || '10959119-72e4-4e57-ba54-923e36bba6a6',
                        name: d.customerName,
                        email: d.banquetDetails?.contactEmail || '',
                        phone: d.banquetDetails?.contactPhone || '',
                        type: 'Individual',
                        category: 'Customer',
                        contactPerson: d.banquetDetails?.contactPerson || d.customerName,
                        sentimentScore: 0.5,
                    };

                    // Synchronously update state so the subsequent syncWithCloud picks it up
                    set(prev => ({ contacts: [newContact, ...prev.contacts] }));
                }

                const evId = crypto.randomUUID();
                const invoiceId = crypto.randomUUID();
                const totalRev = d.items.reduce((s: number, i: any) => s + (i.priceCents * i.quantity), 0 as number);

                const event: CateringEvent = {
                    id: evId,
                    companyId: useAuthStore.getState().user?.companyId || '10959119-72e4-4e57-ba54-923e36bba6a6',
                    customerName: d.customerName,
                    eventDate: d.eventDate,
                    guestCount: d.guestCount,
                    status: 'Confirmed',
                    currentPhase: 'Procurement',
                    items: d.items,
                    orderType: d.orderType || 'Banquet',
                    banquetDetails: d.banquetDetails,
                    readinessScore: 40,
                    hardwareChecklist: [],
                    tasks: [],
                    financials: {
                        revenueCents: totalRev,
                        directCosts: { foodCents: totalRev * 0.4, labourCents: 0, energyCents: 0, carriageCents: 0 },
                        indirectCosts: { adminCents: 0, marketingCents: 0, waitersCents: 0, logisticsCents: 0 },
                        netProfitMargin: 60,
                        invoiceId: invoiceId
                    }
                };

                const isCuisine = (d.orderType || 'Banquet') === 'Cuisine';
                const serviceChargeCents = isCuisine ? 0 : Math.round(totalRev * 0.15);
                const vatCents = isCuisine ? 0 : Math.round((totalRev + serviceChargeCents) * 0.075);
                const totalCents = totalRev + serviceChargeCents + vatCents;

                const invoice: Invoice = {
                    id: invoiceId,
                    number: `SALES-${Date.now()}`,
                    companyId: companyId,
                    contactId: validContactId,
                    date: new Date().toISOString().split('T')[0],
                    dueDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
                    status: InvoiceStatus.PROFORMA,
                    type: 'Sales',
                    category: d.orderType || 'Banquet',
                    totalCents,
                    subtotalCents: totalRev,
                    serviceChargeCents,
                    vatCents,
                    paidAmountCents: 0,
                    lines: d.items.map((it: any, idx: number) => ({
                        id: `line-${idx}`,
                        description: it.name,
                        quantity: it.quantity,
                        unitPriceCents: it.priceCents,
                        category: it.category
                    }))
                };

                // Calculate dates
                const eventDateObj = new Date(d.eventDate);
                const oneDayBefore = new Date(eventDateObj); oneDayBefore.setDate(eventDateObj.getDate() - 1);
                const oneDayAfter = new Date(eventDateObj); oneDayAfter.setDate(eventDateObj.getDate() + 1);

                const taskList: Task[] = [
                    {
                        id: crypto.randomUUID(), companyId: companyId,
                        title: 'Procurement & Requisitions',
                        description: 'Generate and approve requisitions for all deal items.',
                        dueDate: oneDayBefore.toISOString().split('T')[0], priority: 'High', status: 'Todo'
                    },
                    {
                        id: crypto.randomUUID(), companyId: companyId,
                        title: 'Mise en Place (Food Prep)',
                        description: 'Initial ingredient preparation and marination.',
                        dueDate: oneDayBefore.toISOString().split('T')[0], priority: 'Medium', status: 'Todo'
                    },
                    {
                        id: crypto.randomUUID(), companyId: companyId,
                        title: 'Live Cooking / Final Production',
                        description: 'CRITICAL: Main cooking execution on event day.',
                        dueDate: d.eventDate, priority: 'Critical', status: 'Todo'
                    },
                    {
                        id: crypto.randomUUID(), companyId: companyId,
                        title: 'Asset Checkout & Loading',
                        description: 'Checkout hardware, cutlery, and equipment from store.',
                        dueDate: d.eventDate, priority: 'High', status: 'Todo'
                    },
                    {
                        id: crypto.randomUUID(), companyId: companyId,
                        title: 'Event Setup',
                        description: 'Setup service points, tables, and chaffing dishes.',
                        dueDate: d.eventDate, priority: 'High', status: 'Todo'
                    },
                    {
                        id: crypto.randomUUID(), companyId: companyId,
                        title: 'Service Delivery',
                        description: 'Execute food service and guest management.',
                        dueDate: d.eventDate, priority: 'Critical', status: 'Todo'
                    },
                    {
                        id: crypto.randomUUID(), companyId: companyId,
                        title: 'Asset Return & Reconciliation',
                        description: 'Return all assets to store and log breakages/losses.',
                        dueDate: oneDayAfter.toISOString().split('T')[0], priority: 'Medium', status: 'Todo'
                    }
                ];

                // Conditional Tasks
                // Mock logic: If guest count > 50, assume vehicle hire needed
                if (d.guestCount > 50) {
                    taskList.push({
                        id: `task-veh-${Date.now()}`, companyId: companyId,
                        title: 'Vehicle Hire & Logistics',
                        description: 'Coordinate transport for team and equipment.',
                        dueDate: d.eventDate, priority: 'Medium', status: 'Todo'
                    });
                }

                // If event includes "Rental" items (mock check)
                const hasRentals = d.items.some((i: any) => i.name?.toLowerCase()?.includes('rental'));
                if (hasRentals) {
                    taskList.push(
                        {
                            id: `task-rent-out-${Date.now()}`, companyId: companyId,
                            title: 'Rental Pickup',
                            description: 'Collect rental items from vendors.',
                            dueDate: oneDayBefore.toISOString().split('T')[0], priority: 'Medium', status: 'Todo'
                        },
                        {
                            id: `task-rent-in-${Date.now()}`, companyId: companyId,
                            title: 'Rental Return',
                            description: 'Return items to vendors (Clean/Dirty as agreed).',
                            dueDate: oneDayAfter.toISOString().split('T')[0], priority: 'Medium', status: 'Todo'
                        }
                    );
                }

                const project: Project = {
                    id: crypto.randomUUID(),
                    companyId: useAuthStore.getState().user?.companyId || '10959119-72e4-4e57-ba54-923e36bba6a6',
                    name: `Event: ${d.customerName} (${d.eventDate})`,
                    clientContactId: validContactId,
                    status: 'Planning',
                    startDate: d.eventDate,
                    endDate: oneDayAfter.toISOString().split('T')[0],
                    budgetCents: totalRev,
                    progress: 0,
                    referenceId: evId,
                    tasks: taskList,
                    aiAlerts: []
                };

                const calendarEntry = {
                    id: crypto.randomUUID(),
                    title: `Catering: ${d.customerName} (${d.guestCount} guests)`,
                    start: d.eventDate,
                    type: 'Catering',
                    referenceId: evId
                };

                set((state) => ({
                    cateringEvents: [event, ...state.cateringEvents],
                    invoices: [invoice, ...state.invoices],
                    calendarEvents: [calendarEntry, ...state.calendarEvents],
                    projects: [project, ...state.projects]
                }));

                try {
                    await get().syncWithCloud();
                } catch (err: any) {
                    console.error("FATAL: Sync Failed during Event Creation", err);
                    alert(`Sync Failed: ${err.message}`);
                }
                return { event, invoice };
            },

            updateCateringOrder: async (eventId: string, updates: any) => {
                let finalEvent: CateringEvent | undefined;
                let finalInvoice: Invoice | undefined;

                set((state) => {
                    const eventIndex = state.cateringEvents.findIndex(e => e.id === eventId);
                    if (eventIndex === -1) return state;

                    const updatedEvents = [...state.cateringEvents];
                    const nextEvent = { ...updatedEvents[eventIndex], ...updates } as CateringEvent;
                    updatedEvents[eventIndex] = nextEvent;
                    finalEvent = nextEvent;

                    // Update associated invoice if items changed
                    let updatedInvoices = state.invoices;
                    if (updates.items && nextEvent.financials?.invoiceId) {
                        const totalRev = updates.items.reduce((s: number, i: any) => s + (i.priceCents * i.quantity), 0);
                        updatedInvoices = state.invoices.map(inv => {
                            if (inv.id === nextEvent.financials?.invoiceId) {
                                const isCuisine = nextEvent.orderType === 'Cuisine';
                                const serviceChargeCents = isCuisine ? 0 : Math.round(totalRev * 0.15);
                                const vatCents = isCuisine ? 0 : Math.round((totalRev + serviceChargeCents) * 0.075);
                                const totalCents = totalRev + serviceChargeCents + vatCents;

                                const nextInvoice: Invoice = {
                                    ...inv,
                                    totalCents,
                                    subtotalCents: totalRev,
                                    category: nextEvent.orderType || inv.category || 'Banquet',
                                    serviceChargeCents,
                                    vatCents,
                                    lines: updates.items.map((it: any, idx: number) => ({
                                        id: crypto.randomUUID(),
                                        description: it.name,
                                        quantity: it.quantity,
                                        unitPriceCents: it.priceCents,
                                        category: it.category
                                    }))
                                };
                                finalInvoice = nextInvoice;
                                return nextInvoice;
                            }
                            return inv;
                        });
                    }

                    return {
                        ...state,
                        cateringEvents: updatedEvents,
                        invoices: updatedInvoices
                    };
                });

                try {
                    await get().syncWithCloud();
                } catch (e) {
                    console.error("FATAL: Sync Failed during Event Update", e);
                    alert("Update saved locally but Cloud Sync Failed.");
                }

                return { event: finalEvent, invoice: finalInvoice };
            },

            createProcurementInvoice: async (eventId, reqs) => {
                const user = useAuthStore.getState().user;
                const totalSpend = reqs.reduce((sum: number, r: Partial<Requisition>) => sum + (r.totalAmountCents || 0), 0 as number);
                const invoice: Invoice = {
                    id: crypto.randomUUID(),
                    number: `PURCH-${Date.now()}`,
                    companyId: user?.companyId || '10959119-72e4-4e57-ba54-923e36bba6a6', // Fallback only if no user (shouldn't happen)
                    date: new Date().toISOString().split('T')[0],
                    dueDate: new Date().toISOString().split('T')[0],
                    status: InvoiceStatus.UNPAID,
                    type: 'Purchase',
                    totalCents: totalSpend,
                    paidAmountCents: 0,
                    lines: reqs.map((r, idx) => ({
                        id: crypto.randomUUID(),
                        description: `${r.itemName} [${r.category}]`,
                        quantity: r.quantity || 1,
                        unitPriceCents: r.pricePerUnitCents || 0
                    }))
                };

                set((state) => ({
                    invoices: [invoice, ...state.invoices],
                    cateringEvents: state.cateringEvents.map(e => e.id === eventId ? { ...e, currentPhase: 'Execution' } : e)
                }));

                await get().syncWithCloud();

                return invoice;
            },

            deductStockFromCooking: async (eventId) => {
                // 1. Mark production as confirmed
                set((state) => ({
                    cateringEvents: state.cateringEvents.map(e => {
                        if (e.id === eventId) {
                            return {
                                ...e,
                                banquetDetails: {
                                    ...(e.banquetDetails || {}),
                                    productionConfirmed: true
                                }
                            };
                        }
                        return e;
                    })
                }));

                if (supabase) {
                    try {
                        // Mark as In Production if tracking detailed status
                        // For now we just keep it in 'Execution'
                        console.log("Stock deduction triggered for event", eventId);
                    } catch (e) {
                        console.error("Failed to deduct stock", e);
                    }
                }
            },



            addRecipe: (recipe) => {
                set((state) => ({
                    recipes: [{ id: crypto.randomUUID(), name: '', category: '', portions: [], ingredients: [], ...recipe } as Recipe, ...state.recipes]
                }));
                get().syncWithCloud();
            },

            updateRecipe: (id, updates) => {
                set((state) => ({
                    recipes: state.recipes.map((r) => r.id === id ? { ...r, ...updates } : r)
                }));
                get().syncWithCloud();
            },

            deleteRecipe: (id) => {
                set((state) => ({
                    recipes: state.recipes.filter((r) => r.id !== id)
                }));
                get().syncWithCloud();
            },

            addRecipeIngredient: (recipeId, ingredient) => {
                set((state) => ({
                    recipes: state.recipes.map((r) => r.id === recipeId ? { ...r, ingredients: [...r.ingredients, ingredient] } : r)
                }));
                get().syncWithCloud();
            },

            deleteRecipeIngredient: (recipeId, ingredientName) => {
                set((state) => ({
                    recipes: state.recipes.map((r) => r.id === recipeId ? { ...r, ingredients: r.ingredients.filter(i => i.name !== ingredientName) } : r)
                }));
                get().syncWithCloud();
            },

            calculateItemCosting: (id: string, qty: number) => {
                const state = get();
                return utilsCalculateCosting(id, qty, state.inventory, state.recipes, state.ingredients);
            },

            updateInvoiceLines: async (invoiceId: string, lines: InvoiceLine[], overrideTotalCents?: number, isCuisine?: boolean) => {
                set((state) => {
                    const currentInvoice = state.invoices.find(inv => inv.id === invoiceId);
                    // Explicitly skip taxes if isCuisine is true, OR if existing invoice already had 0 taxes (and it's not a banquet)
                    const skipTaxes = isCuisine || (currentInvoice && currentInvoice.serviceChargeCents === 0 && currentInvoice.vatCents === 0 && !lines.some(l => l.description.startsWith('[SECTION] ')));

                    // 1. Calculate Standard Totals (If no discounts applied)
                    const isBanquet = lines.some(l => l.description.startsWith('[SECTION] '));

                    const standardSubtotal = lines.reduce((acc, l) => {
                        if (isBanquet && !l.description.startsWith('[SECTION] ')) return acc;
                        return acc + (l.quantity * l.unitPriceCents);
                    }, 0);
                    const standardSC = skipTaxes ? 0 : Math.round(standardSubtotal * 0.15);
                    const standardVAT = skipTaxes ? 0 : Math.round((standardSubtotal + standardSC) * 0.075);
                    const standardTotal = standardSubtotal + standardSC + standardVAT;

                    // 2. Calculate Effective Totals (Using manual prices if set)
                    const effectiveSubtotal = lines.reduce((acc, l) => {
                        if (isBanquet && !l.description.startsWith('[SECTION] ')) return acc;
                        const price = (l.manualPriceCents !== undefined && l.manualPriceCents !== null)
                            ? l.manualPriceCents
                            : l.unitPriceCents;
                        return acc + (l.quantity * price);
                    }, 0);

                    const effectiveSC = skipTaxes ? 0 : Math.round(effectiveSubtotal * 0.15);
                    const effectiveVAT = skipTaxes ? 0 : Math.round((effectiveSubtotal + effectiveSC) * 0.075);
                    const effectiveTotal = effectiveSubtotal + effectiveSC + effectiveVAT;

                    // 3. Discount is the difference between what it SHOULD cost vs what it DOES cost
                    const discount = Math.max(0, standardTotal - effectiveTotal);

                    const updatedTotalCents = overrideTotalCents !== undefined ? overrideTotalCents : effectiveTotal;

                    return {
                        invoices: state.invoices.map(inv => inv.id === invoiceId ? {
                            ...inv,
                            lines,
                            subtotalCents: effectiveSubtotal,
                            serviceChargeCents: effectiveSC,
                            vatCents: effectiveVAT,
                            standardTotalCents: standardTotal,
                            discountCents: overrideTotalCents !== undefined ? Math.max(0, standardTotal - overrideTotalCents) : discount,
                            totalCents: updatedTotalCents,
                            manualSetPriceCents: overrideTotalCents
                        } : inv),
                        cateringEvents: state.cateringEvents.map(event => {
                            const eventInvId = event.financials?.invoiceId || (event.financials as any)?.invoice_id;
                            if (eventInvId === invoiceId) {
                                return {
                                    ...event,
                                    financials: {
                                        ...event.financials,
                                        revenueCents: updatedTotalCents
                                    }
                                };
                            }
                            return event;
                        })
                    };
                });
                await get().syncWithCloud();
            },

            updateInvoicePricing: async (invoiceId: string, setPriceCents: number | undefined) => {
                console.warn("updateInvoicePricing is deprecated. Use line-item discounts via updateInvoiceLines instead.");
                // No-op or trigger re-save to clear it
                set((state) => ({
                    invoices: state.invoices.map(i => i.id === invoiceId ? { ...i, manualSetPriceCents: undefined } : i)
                }));
                await get().syncWithCloud();
            },

            finalizeInvoice: async (invoiceId: string, lines: InvoiceLine[], overrideTotalCents?: number) => {
                set((state) => {
                    const isBanquet = lines.some(l => l.description.startsWith('[SECTION] '));

                    const standardSubtotal = lines.reduce((acc, l) => {
                        if (isBanquet && !l.description.startsWith('[SECTION] ')) return acc;
                        return acc + (l.quantity * l.unitPriceCents);
                    }, 0);
                    const standardSC = Math.round(standardSubtotal * 0.15);
                    const standardVAT = Math.round((standardSubtotal + standardSC) * 0.075);
                    const standardTotal = standardSubtotal + standardSC + standardVAT;

                    const effectiveSubtotal = lines.reduce((acc, l) => {
                        if (isBanquet && !l.description.startsWith('[SECTION] ')) return acc;
                        const price = (l.manualPriceCents !== undefined && l.manualPriceCents !== null)
                            ? l.manualPriceCents
                            : l.unitPriceCents;
                        return acc + (l.quantity * price);
                    }, 0);

                    const effectiveSC = Math.round(effectiveSubtotal * 0.15);
                    const effectiveVAT = Math.round((effectiveSubtotal + effectiveSC) * 0.075);
                    const effectiveTotal = effectiveSubtotal + effectiveSC + effectiveVAT;
                    const discount = Math.max(0, standardTotal - effectiveTotal);

                    const updatedTotalCents = overrideTotalCents !== undefined ? overrideTotalCents : effectiveTotal;

                    return {
                        invoices: state.invoices.map(inv => inv.id === invoiceId ? {
                            ...inv,
                            lines,
                            status: InvoiceStatus.UNPAID,
                            subtotalCents: effectiveSubtotal,
                            serviceChargeCents: effectiveSC,
                            vatCents: effectiveVAT,
                            standardTotalCents: standardTotal,
                            discountCents: overrideTotalCents !== undefined ? Math.max(0, standardTotal - overrideTotalCents) : discount,
                            totalCents: updatedTotalCents,
                            manualSetPriceCents: overrideTotalCents
                        } : inv),
                        cateringEvents: state.cateringEvents.map(event => {
                            const eventInvId = event.financials?.invoiceId || (event.financials as any)?.invoice_id;
                            if (eventInvId === invoiceId) {
                                return {
                                    ...event,
                                    financials: {
                                        ...event.financials,
                                        revenueCents: updatedTotalCents
                                    }
                                };
                            }
                            return event;
                        })
                    };
                });
                await get().syncWithCloud();
            },

            finalizeProforma: async (invoiceId: string) => {
                set((state) => ({
                    invoices: state.invoices.map(inv => inv.id === invoiceId ? {
                        ...inv,
                        status: InvoiceStatus.UNPAID
                    } : inv)
                }));
                await get().syncWithCloud();
            },

            approveInvoice: async (id: string) => {
                set((state) => ({
                    invoices: state.invoices.map(inv => inv.id === id ? { ...inv, status: InvoiceStatus.PAID } : inv)
                }));
                await get().syncWithCloud();
            },

            syncWithCloud: async () => {
                if (!supabase) {
                    set({ syncStatus: 'Offline' });
                    return;
                }

                const state = get();
                if (state.isSyncing) {
                    set({ isSyncPending: true });
                    return;
                }

                set({ isSyncing: true, syncStatus: 'Syncing', lastSyncError: null, isSyncPending: false });

                const safeSync = async (table: string, data: any[]) => {
                    try {
                        await syncTableToCloud(table, data);
                    } catch (e: any) {
                        // Enhance error message to include table name
                        throw new Error(`Table '${table}': ${e.message}`);
                    }
                };

                try {
                    // Critical: Sync Contacts FIRST to ensure FK relationships (Invoices -> Contacts)
                    try {
                        await safeSync('contacts', state.contacts);
                    } catch (e) {
                        console.warn("Contacts sync failed, proceeding to others", e);
                    }

                    const freshState = get(); // Get latest state just before sync call

                    await Promise.all([
                        // syncTableToCloud('inventory', state.inventory), // DISABLED
                        // safeSync('contacts', state.contacts), // Moved up
                        safeSync('invoices', freshState.invoices),
                        safeSync('catering_events', freshState.cateringEvents),
                        safeSync('projects', freshState.projects),
                        safeSync('bookkeeping', freshState.bookkeeping),
                        safeSync('tasks', freshState.tasks),
                        safeSync('employees', freshState.employees),
                        safeSync('requisitions', freshState.requisitions),
                        safeSync('chart_of_accounts', freshState.chartOfAccounts),
                        safeSync('bank_transactions', freshState.bankTransactions)
                    ]);
                    set({ isSyncing: false, syncStatus: 'Synced' });

                    // If a sync was requested during this sync, run it again
                    if (get().isSyncPending) {
                        get().syncWithCloud();
                    }
                } catch (e) {
                    const errorMsg = (e as Error).message;
                    set({ isSyncing: false, syncStatus: 'Error', lastSyncError: errorMsg });
                    console.error('Cloud Sync Failed:', e);
                    // Do NOT throw here, so we don't break the caller's flow, but it's logged
                }
            },

            hydrateFromCloud: async () => {
                if (!supabase) return;

                const companyId = useAuthStore.getState().user?.companyId;
                if (!companyId) return;

                set({ isSyncing: true, syncStatus: 'Syncing' });

                try {
                    // Sync Organization Settings Source of Truth
                    const { data: orgData } = await supabase.from('organizations').select('type, enabled_modules, name').eq('id', companyId).single();

                    if (orgData) {
                        useSettingsStore.getState().updateSettings({
                            name: orgData.name,
                            type: orgData.type as any,
                            enabledModules: orgData.enabled_modules as any
                        });
                    }

                    const tables = ['contacts', 'invoices', 'catering_events', 'tasks', 'employees_api', 'requisitions', 'chart_of_accounts', 'bank_transactions', 'leave_requests', 'interaction_logs'];

                    // Safe Pull Helper: Prevents one table failure from crashing the entire app
                    const safePull = async (table: string, cid?: string) => {
                        try {
                            return await pullCloudState(table, cid);
                        } catch (err) {
                            console.error(`[Hydration Error] Failed to fetch ${table}:`, err);
                            return []; // Return empty array so destructuring doesn't fail
                        }
                    };

                    const safeViews = async (view: 'v_reusable_inventory' | 'v_rental_inventory' | 'v_ingredient_inventory', cid: string) => {
                        try {
                            return await pullInventoryViews(view, cid);
                        } catch (err) {
                            console.error(`[Hydration Error] Failed to fetch view ${view}:`, err);
                            return [];
                        }
                    }

                    // Parallel fetching of base tables and inventory views
                    const [
                        // Core Tables
                        contacts, invoices, cateringEvents, projects, tasks, employees, requisitions, chartOfAccounts, bankTransactions, leaveRequests, performanceReviews, interactionLogs, messages,
                        // Inventory Base Tables
                        // Legacy Tables
                        reusableItems, rentalItems, ingredientItems, products,
                        // Inventory Views
                        rentalStock, ingredientStock,
                        // Categories
                        categories,
                        // Fixed Assets
                        fixedAssets,
                        // Recipes (for BOQ)
                        recipesRaw, recipeIngredientsRaw
                    ] = await Promise.all([
                        safePull('contacts', companyId),
                        safePull('invoices', companyId),
                        safePull('catering_events', companyId),
                        safePull('projects', companyId),
                        safePull('tasks', companyId),
                        safePull('employees', companyId),
                        safePull('requisitions', companyId),
                        safePull('chart_of_accounts', companyId),
                        safePull('bank_transactions', companyId),
                        safePull('leave_requests', companyId),
                        safePull('performance_reviews', companyId),
                        safePull('interaction_logs', companyId),
                        safePull('messages', companyId),


                        safePull('reusable_items', companyId),
                        safePull('rental_items', companyId),
                        safePull('ingredients', companyId),
                        safePull('products', companyId),

                        // safePull('reusable_stock', companyId), // REMOVED: Broken view/table without link
                        safePull('rental_stock', companyId),
                        safePull('ingredient_stock_batches', companyId),
                        safePull('categories', companyId), // Correct Table Name
                        safePull('assets', companyId), // Fetch Fixed Assets
                        // BOQ: Recipes
                        safePull('recipes', companyId),
                        safePull('recipe_ingredients', undefined), // No org filter - joins through recipes
                    ]); // End Promise.all

                    // Separate fetch for Department Matrix to keep things clean
                    const [rawDepartments, rawJobRoles] = await Promise.all([
                        safePull('departments', companyId),
                        safePull('job_roles', companyId)
                    ]);

                    if (rawDepartments && rawJobRoles) {
                        const constructedMatrix: DepartmentMatrix[] = rawDepartments.map((d: any) => ({
                            id: d.id,
                            name: d.name,
                            roles: rawJobRoles.filter((r: any) => r.department_id === d.id || r.departmentId === d.id).map((r: any) => ({
                                title: r.title,
                                band: r.band,
                                salaryRange: {
                                    low: r.salary_min || r.salaryMin || 0,
                                    mid: r.salary_mid || r.salaryMid || 0,
                                    high: r.salary_max || r.salaryMax || 0
                                },
                                permissions: r.permissions || [],
                                kpis: r.kpis || []
                            }))
                        }));
                        if (constructedMatrix.length > 0) {
                            set({ departmentMatrix: constructedMatrix });
                        }
                    }
                    if (interactionLogs) set({ interactionLogs });
                    const combinedInventory: InventoryItem[] = [];

                    // 1. Process Split Inventory Data

                    // DEBUG: Log Raw Data to confirm fetch
                    console.log('[Hydration] Reusable Items:', reusableItems?.length, reusableItems?.[0]);

                    // Helper to sum stock
                    const getStock = (itemId: string, stockList: any[], isBatch = false, isRental = false) => {
                        if (!stockList) return 0;
                        // safePull converts to CamelCase: item_id -> itemId, quantity_on_hand -> quantityOnHand
                        const key = isRental ? 'rentalItemId' : (isBatch ? 'ingredientId' : 'itemId');
                        const qtyKey = isBatch ? 'quantity' : 'quantityOnHand';

                        return stockList
                            .filter((s: any) => s[key] === itemId && (isBatch ? s.status === 'available' : true))
                            .reduce((sum: number, s: any) => sum + (Number(s[qtyKey]) || 0), 0);
                    };

                    // Reusable Items (Master List)
                    if (reusableItems) {
                        reusableItems.forEach((item: any) => {
                            // Data Integrity: Skip if no ID
                            if (!item.id) return;

                            const cat = (categories as any[])?.find(c => c.id === item.category_id || c.id === item.categoryId);
                            // Fix: Use base table stock ONLY. reusable_stock is disconnected.
                            const stockCount = item.stockQuantity || 0;

                            // Fallback for missing unit
                            const unit = item.unit || { name: 'Units', key: 'each' }; // Default to 'Units' if null

                            // Fallback for missing image
                            // Check for validity of image string (basic check)
                            let img = item.image || item.imageUrl || item.image_url;
                            const isInvalid = !img || (typeof img === 'string' && (img.length < 5 || img === 'null' || img === 'undefined'));
                            if (isInvalid) {
                                img = 'https://placehold.co/100x100?text=No+Image';
                            }

                            combinedInventory.push({
                                ...item,
                                id: item.id,
                                companyId: item.organizationId || item.companyId,
                                name: item.name,
                                type: 'reusable',
                                category: cat ? cat.name : (item.category || 'General'),
                                stockQuantity: stockCount,
                                priceCents: typeof (item.priceCents) === 'string' ? parseInt(item.priceCents) : (item.priceCents || 0),
                                image: img,
                                unit: unit,
                                recipeId: item.recipeId || item.recipe_id
                            });
                        });
                    }

                    // Products (Menu Items)
                    // Products (Menu Items)
                    if (products) {
                        // DEBUG: Inspect first product to check field names
                        if (products.length > 0) {
                            console.log('[Hydration] First Product Raw:', products[0]);
                            console.log('[Hydration] Categories Sample:', (categories as any[])?.slice(0, 3));
                        }

                        combinedInventory.push(...products.map((item: any) => {
                            // Fix: Ensure we check all possible casing (snake_case from DB vs camelCase from safePull)
                            const catId = item.categoryId || item.category_id || item.product_category_id || item.productCategoryId;

                            const cat = (categories as any[])?.find(c => c.id === catId);

                            // Log failures for the first few items
                            if (!cat && products.indexOf(item) < 3) {
                                console.warn(`[Hydration] Category Lookup Failed for ${item.name}. ID: ${catId}`, { catId, availableCats: (categories as any[])?.length });
                            }

                            return {
                                ...item,
                                id: item.id,
                                companyId: item.organizationId || item.companyId,
                                name: item.name,
                                type: 'product',
                                category: cat ? cat.name : (item.category || 'Finished Goods'),
                                priceCents: typeof (item.priceCents) === 'string' ? parseInt(item.priceCents) : (item.priceCents || 0),
                                image: item.image || item.imageUrl || item.image_url,
                                recipeId: item.recipeId || item.recipe_id  // Map recipe_id for BOQ
                            };
                        }));
                    }

                    // Rental Items
                    if (rentalItems) {
                        rentalItems.forEach((item: any) => {
                            if (!item.id) return;

                            const cat = (categories as any[])?.find(c => c.id === item.category_id || c.id === item.categoryId);
                            const stockCount = getStock(String(item.id), rentalStock || [], false, true);

                            combinedInventory.push({
                                ...item,
                                id: item.id,
                                companyId: item.organizationId || item.companyId,
                                name: item.name,
                                type: 'rental',
                                category: cat ? cat.name : (item.category || 'Rental'),
                                stockQuantity: stockCount,
                                priceCents: typeof (item.replacementCostCents || item.priceCents) === 'string' ? parseInt(item.replacementCostCents || item.priceCents) : (item.replacementCostCents || item.priceCents || 0),
                                image: item.imageUrl || item.image || item.image_url,
                                recipeId: item.recipeId || item.recipe_id
                            });
                        });
                    }

                    // Ingredients
                    if (ingredientItems) {
                        ingredientItems.forEach((item: any) => {
                            if (!item.id) return;

                            const cat = (categories as any[])?.find(c => c.id === item.category_id || c.id === item.categoryId);
                            const stockCount = getStock(String(item.id), ingredientStock || [], true); // isBatch = true

                            combinedInventory.push({
                                ...item,
                                id: item.id,
                                companyId: item.organizationId || item.companyId,
                                name: item.name,
                                type: 'ingredient',
                                category: cat ? cat.name : (item.category || 'Ingredient'),
                                stockQuantity: stockCount,
                                priceCents: typeof (item.priceCents) === 'string' ? parseInt(item.priceCents) : (item.priceCents || 0),
                                image: item.imageUrl || item.image || item.image_url,
                                recipeId: item.recipeId || item.recipe_id
                            });
                        });
                    }

                    // 2. Derive Ingredients State
                    const processedIngredients: Ingredient[] = combinedInventory
                        .filter(i => i.type === 'ingredient' || i.type === 'raw_material')
                        .map(i => ({
                            ...i,
                            stockLevel: i.stockQuantity,
                            // Ensure numeric fields
                            currentCostCents: typeof i.priceCents === 'string' ? parseInt(i.priceCents) : i.priceCents,
                            unit: (i as any).unit,
                            lastUpdated: new Date().toISOString()
                        }));

                    // 3. Process Recipes for BOQ
                    const processedRecipes: Recipe[] = (recipesRaw || []).map((r: any) => ({
                        id: r.id,
                        name: r.name,
                        category: r.category || 'General',
                        portions: [r.basePortions || r.base_portions || 100],
                        ingredients: (recipeIngredientsRaw || [])
                            .filter((ri: any) => ri.recipeId === r.id || ri.recipe_id === r.id)
                            .map((ri: any) => ({
                                name: ri.ingredientName || ri.ingredient_name,
                                qtyPerPortion: ri.qtyPerPortion || ri.qty_per_portion || 0,
                                unit: ri.unit || 'unit',
                                priceSourceQuery: ri.priceSourceQuery || ri.price_source_query || '',
                                scaling_tiers: ri.scalingTiers || ri.scaling_tiers || {},
                                subRecipeGroup: ri.subRecipeGroup || ri.sub_recipe_group || ''
                            }))
                    }));

                    console.log('[Hydration] Recipes loaded:', processedRecipes.length);


                    set({
                        inventory: combinedInventory,
                        ingredients: processedIngredients,
                        recipes: processedRecipes,
                        contacts: contacts || [],
                        invoices: invoices || [],
                        cateringEvents: cateringEvents || [],
                        projects: projects || [],
                        tasks: tasks || [],
                        employees: employees || [],
                        requisitions: requisitions || [],
                        chartOfAccounts: chartOfAccounts || [],
                        bankTransactions: bankTransactions || [],
                        messages: messages || [],
                        leaveRequests: (leaveRequests || []).map((lr: any) => ({
                            ...lr,
                            startDate: lr.start_date,
                            endDate: lr.end_date,
                            appliedDate: lr.applied_date,
                            employeeId: lr.employee_id,
                            employeeName: employees?.find((e: any) => e.id === lr.employee_id)?.firstName + ' ' + employees?.find((e: any) => e.id === lr.employee_id)?.lastName || 'Unknown'
                        })),
                        performanceReviews: (performanceReviews || []).map((pr: any) => ({
                            ...pr,
                            // id, metrics, year, quarter, status match directly
                            totalScore: pr.total_score,
                            employeeId: pr.employee_id,
                            submittedDate: pr.submitted_date,
                            finalizedDate: pr.finalized_date
                        })),
                        isSyncing: false,
                        syncStatus: 'Synced',
                        lastSyncError: null
                    });

                } catch (e) {
                    set({ isSyncing: false, syncStatus: 'Error', lastSyncError: (e as Error).message });
                    console.error('Cloud Hydration Fatal Error:', e);
                }
            },

            subscribeToRealtimeUpdates: () => {
                if (!supabase) return;

                const companyId = useAuthStore.getState().user?.companyId;
                if (!companyId) return;

                // Clean up existing subscription if any
                const existingChannel = get().realtimeChannel;
                if (existingChannel) {
                    supabase.removeChannel(existingChannel);
                }

                set({ realtimeStatus: 'Connecting' });

                const channel = supabase
                    .channel('db-changes')
                    // 1. Catering Events (organization_id)
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'catering_events',
                        filter: `organization_id=eq.${companyId}`
                    }, (payload: any) => {
                        const { eventType, new: newRow, old: oldRow } = payload;
                        set((state) => {
                            if (eventType === 'INSERT') {
                                if (state.cateringEvents.some(e => e.id === newRow.id)) return state;
                                return { cateringEvents: [newRow, ...state.cateringEvents] };
                            } else if (eventType === 'UPDATE') {
                                return { cateringEvents: state.cateringEvents.map(e => e.id === newRow.id ? newRow : e) };
                            } else if (eventType === 'DELETE') {
                                return { cateringEvents: state.cateringEvents.filter(e => e.id !== oldRow.id) };
                            }
                            return state;
                        });
                    })
                    // 2. Projects (company_id)
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'projects',
                        filter: `company_id=eq.${companyId}`
                    }, (payload: any) => {
                        const { eventType, new: newRow, old: oldRow } = payload;
                        set((state) => {
                            if (eventType === 'INSERT') {
                                if (state.projects.some(p => p.id === newRow.id)) return state;
                                return { projects: [newRow, ...state.projects] };
                            } else if (eventType === 'UPDATE') {
                                return { projects: state.projects.map(p => p.id === newRow.id ? newRow : p) };
                            } else if (eventType === 'DELETE') {
                                return { projects: state.projects.filter(p => p.id !== oldRow.id) };
                            }
                            return state;
                        });
                    })
                    // 3. Invoices (company_id)
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'invoices',
                        filter: `company_id=eq.${companyId}`
                    }, (payload: any) => {
                        const { eventType, new: newRow, old: oldRow } = payload;
                        set((state) => {
                            if (eventType === 'INSERT') {
                                if (state.invoices.some(i => i.id === newRow.id)) return state;
                                return { invoices: [newRow, ...state.invoices] };
                            } else if (eventType === 'UPDATE') {
                                return { invoices: state.invoices.map(i => i.id === newRow.id ? newRow : i) };
                            } else if (eventType === 'DELETE') {
                                return { invoices: state.invoices.filter(i => i.id !== oldRow.id) };
                            }
                            return state;
                        });
                    })
                    // 4. Products/Inventory (organization_id)
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'products',
                        filter: `organization_id=eq.${companyId}`
                    }, (payload: any) => {
                        const { eventType, new: newRow, old: oldRow } = payload;
                        const mapItem = (item: any) => ({
                            ...item,
                            type: 'product',
                            category: item.category || 'Finished Goods',
                            stockQuantity: item.stockQuantity || 100000,
                            priceCents: item.price_cents || 0
                        });
                        set((state) => {
                            if (eventType === 'INSERT') {
                                if (state.inventory.some(i => i.id === newRow.id)) return state;
                                return { inventory: [mapItem(newRow), ...state.inventory] };
                            } else if (eventType === 'UPDATE') {
                                return { inventory: state.inventory.map(i => i.id === newRow.id ? mapItem(newRow) : i) };
                            } else if (eventType === 'DELETE') {
                                return { inventory: state.inventory.filter(i => i.id !== oldRow.id) };
                            }
                            return state;
                        });
                    })
                    // 5. Tasks (company_id)
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'tasks',
                        filter: `company_id=eq.${companyId}`
                    }, (payload: any) => {
                        const { eventType, new: newRow, old: oldRow } = payload;
                        set((state) => {
                            if (eventType === 'INSERT') {
                                if (state.tasks.some(t => t.id === newRow.id)) return state;
                                return { tasks: [newRow, ...state.tasks] };
                            } else if (eventType === 'UPDATE') {
                                return { tasks: state.tasks.map(t => t.id === newRow.id ? newRow : t) };
                            } else if (eventType === 'DELETE') {
                                return { tasks: state.tasks.filter(t => t.id !== oldRow.id) };
                            }
                            return state;
                        });
                    })
                    // 6. Employees (organization_id)
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'employees',
                        filter: `organization_id=eq.${companyId}`
                    }, (payload: any) => {
                        const { eventType, new: newRow, old: oldRow } = payload;
                        set((state) => {
                            if (eventType === 'INSERT') {
                                if (state.employees.some(e => e.id === newRow.id)) return state;
                                return { employees: [newRow, ...state.employees] };
                            } else if (eventType === 'UPDATE') {
                                return { employees: state.employees.map(e => e.id === newRow.id ? newRow : e) };
                            } else if (eventType === 'DELETE') {
                                return { employees: state.employees.filter(e => e.id !== oldRow.id) };
                            }
                            return state;
                        });
                    })
                    // 7. Requisitions (company_id)
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'requisitions',
                        filter: `company_id=eq.${companyId}`
                    }, (payload: any) => {
                        const { eventType, new: newRow, old: oldRow } = payload;
                        set((state) => {
                            if (eventType === 'INSERT') {
                                if (state.requisitions.some(r => r.id === newRow.id)) return state;
                                return { requisitions: [newRow, ...state.requisitions] };
                            } else if (eventType === 'UPDATE') {
                                return { requisitions: state.requisitions.map(r => r.id === newRow.id ? newRow : r) };
                            } else if (eventType === 'DELETE') {
                                return { requisitions: state.requisitions.filter(r => r.id !== oldRow.id) };
                            }
                            return state;
                        });
                    })
                    // 8. Performance Reviews (organization_id)
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'performance_reviews',
                        filter: `organization_id=eq.${companyId}`
                    }, (payload: any) => {
                        const { eventType, new: newRow, old: oldRow } = payload;
                        const mapRow = (r: any) => ({
                            ...r,
                            totalScore: r.total_score,
                            employeeId: r.employee_id,
                            submittedDate: r.submitted_date,
                            finalizedDate: r.finalized_date
                        });
                        set((state) => {
                            if (eventType === 'INSERT') {
                                if (state.performanceReviews.some(r => r.id === newRow.id)) return state;
                                return { performanceReviews: [mapRow(newRow), ...state.performanceReviews] };
                            } else if (eventType === 'UPDATE') {
                                return { performanceReviews: state.performanceReviews.map(r => r.id === newRow.id ? mapRow(newRow) : r) };
                            } else if (eventType === 'DELETE') {
                                return { performanceReviews: state.performanceReviews.filter(r => r.id !== oldRow.id) };
                            }
                            return state;
                        });
                    })
                    // 9. Leave Requests (organization_id)
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'leave_requests',
                        filter: `organization_id=eq.${companyId}`
                    }, (payload: any) => {
                        const { eventType, new: newRow, old: oldRow } = payload;
                        const mapRow = (r: any) => {
                            const state = get();
                            const emp = state.employees.find(e => e.id === r.employee_id);
                            return {
                                ...r,
                                startDate: r.start_date,
                                endDate: r.end_date,
                                appliedDate: r.applied_date,
                                employeeId: r.employee_id,
                                employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown'
                            };
                        };
                        set((state) => {
                            if (eventType === 'INSERT') {
                                if (state.leaveRequests.some(l => l.id === newRow.id)) return state;
                                return { leaveRequests: [mapRow(newRow), ...state.leaveRequests] };
                            } else if (eventType === 'UPDATE') {
                                return { leaveRequests: state.leaveRequests.map(l => l.id === newRow.id ? mapRow(newRow) : l) };
                            } else if (eventType === 'DELETE') {
                                return { leaveRequests: state.leaveRequests.filter(l => l.id !== oldRow.id) };
                            }
                            return state;
                        });
                    })
                    // 10. Messages (organization_id)
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'messages',
                        filter: `organization_id=eq.${companyId}`
                    }, (payload: any) => {
                        const { eventType, new: newRow, old: oldRow } = payload;
                        set((state) => {
                            const mapMsg = (m: any) => ({
                                id: m.id,
                                senderId: m.sender_id,
                                recipientId: m.recipient_id,
                                content: m.content,
                                createdAt: m.created_at,
                                readAt: m.read_at,
                                organizationId: m.organization_id,
                                type: m.type || 'text',
                                status: (m.read_at ? 'read' : 'sent') as 'sent' | 'delivered' | 'read'
                            } as Message);
                            if (eventType === 'INSERT') {
                                if (state.messages.some(m => m.id === newRow.id)) return state;
                                return { messages: [...state.messages, mapMsg(newRow)] };
                            } else if (eventType === 'UPDATE') {
                                return { messages: state.messages.map(m => m.id === newRow.id ? mapMsg(newRow) : m) };
                            } else if (eventType === 'DELETE') {
                                return { messages: state.messages.filter(m => m.id !== oldRow.id) };
                            }
                            return state;
                        });
                    })
                    // 11. Bookkeeping (company_id)
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'bookkeeping',
                        filter: `company_id=eq.${companyId}`
                    }, (payload: any) => {
                        const { eventType, new: newRow, old: oldRow } = payload;
                        set((state) => {
                            if (eventType === 'INSERT') {
                                if (state.bookkeeping.some(b => b.id === newRow.id)) return state;
                                return { bookkeeping: [newRow, ...state.bookkeeping] };
                            } else if (eventType === 'UPDATE') {
                                return { bookkeeping: state.bookkeeping.map(b => b.id === newRow.id ? newRow : b) };
                            } else if (eventType === 'DELETE') {
                                return { bookkeeping: state.bookkeeping.filter(b => b.id !== oldRow.id) };
                            }
                            return state;
                        });
                    })
                    // 12. Chart of Accounts (company_id)
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'chart_of_accounts',
                        filter: `company_id=eq.${companyId}`
                    }, (payload: any) => {
                        const { eventType, new: newRow, old: oldRow } = payload;
                        set((state) => {
                            if (eventType === 'INSERT') {
                                if (state.chartOfAccounts.some(a => a.id === newRow.id)) return state;
                                return { chartOfAccounts: [newRow, ...state.chartOfAccounts] };
                            } else if (eventType === 'UPDATE') {
                                return { chartOfAccounts: state.chartOfAccounts.map(a => a.id === newRow.id ? newRow : a) };
                            } else if (eventType === 'DELETE') {
                                return { chartOfAccounts: state.chartOfAccounts.filter(a => a.id !== oldRow.id) };
                            }
                            return state;
                        });
                    })
                    // 13. Bank Transactions (company_id)
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'bank_transactions',
                        filter: `company_id=eq.${companyId}`
                    }, (payload: any) => {
                        const { eventType, new: newRow, old: oldRow } = payload;
                        set((state) => {
                            if (eventType === 'INSERT') {
                                if (state.bankTransactions.some(t => t.id === newRow.id)) return state;
                                return { bankTransactions: [newRow, ...state.bankTransactions] };
                            } else if (eventType === 'UPDATE') {
                                return { bankTransactions: state.bankTransactions.map(t => t.id === newRow.id ? newRow : t) };
                            } else if (eventType === 'DELETE') {
                                return { bankTransactions: state.bankTransactions.filter(t => t.id !== oldRow.id) };
                            }
                            return state;
                        });
                    })
                    .subscribe((status) => {
                        if (status === 'SUBSCRIBED') {
                            set({ realtimeStatus: 'Connected' });
                            console.log('✓ Real-time subscriptions active');
                        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                            set({ realtimeStatus: 'Disconnected' });
                            console.warn('Real-time connection lost');
                        }
                    });

                set({ realtimeChannel: channel });
            },

            unsubscribeFromRealtimeUpdates: () => {
                const channel = get().realtimeChannel;
                if (channel && supabase) {
                    supabase.removeChannel(channel);
                    set({ realtimeChannel: null, realtimeStatus: 'Disconnected' });
                    console.log('Real-time subscriptions stopped');
                }
            }
        }),
        {
            name: 'data-storage-v4', // Unique name for LocalStorage key to force fresh hydration
            partialize: (state) => {
                // Exclude circular references and non-serializable objects
                const { realtimeChannel, ...rest } = state;
                return rest;
            },
            onRehydrateStorage: () => (state) => {
                state?.hydrateFromCloud();
            }
        }
    )
);
