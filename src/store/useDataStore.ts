import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    InventoryItem, Recipe, CateringEvent, Invoice, Contact, Task, Deal,
    BookkeepingEntry, Project, AIAgent, Ingredient, Supplier,
    MarketingPost, Workflow, Ticket, BankTransaction, Employee,
    Requisition, RentalRecord, ChartOfAccount, BankStatementLine, InvoiceStatus,
    LeaveRequest, DepartmentMatrix, SocialInteraction, SocialPost, AgenticLog, PerformanceReview
} from '../types';

import { supabase, syncTableToCloud, pullCloudState } from '../services/supabase';
import { useAuthStore } from './useAuthStore';

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
    leaveRequests: LeaveRequest[];
    departmentMatrix: DepartmentMatrix[];
    calendarEvents: any[];
    socialInteractions: SocialInteraction[];
    agenticLogs: AgenticLog[];
    performanceReviews: PerformanceReview[];
    syncStatus: 'Synced' | 'Syncing' | 'Error' | 'Offline';
    lastSyncError: string | null;
    isSyncing: boolean;
    realtimeStatus: 'Connected' | 'Disconnected' | 'Connecting';
    realtimeChannel: any | null;

    // Actions
    addInventoryItem: (item: Partial<InventoryItem>) => void;
    addRequisition: (req: Partial<Requisition>) => void;
    approveRequisition: (id: string) => void;
    receiveFoodStock: (ingId: string, qty: number, cost: number) => void;
    issueRental: (eventId: string, itemId: string, qty: number, vendor?: string) => void;
    returnRental: (id: string, status: any, notes?: string) => void;
    checkOverdueAssets: () => void;
    addContact: (contact: Partial<Contact>) => void;
    addContactsBulk: (contacts: Partial<Contact>[]) => void;
    deleteContact: (id: string) => void;
    addInvoice: (invoice: Invoice) => void;
    updateInvoiceStatus: (id: string, status: any) => void;
    addBookkeepingEntry: (entry: BookkeepingEntry) => void;
    addTransaction: (tx: BankTransaction) => void;
    recordPayment: (id: string, amount: number) => void;
    reconcileMatch: (lineId: string, accountId: string) => void;

    // HR Actions
    addEmployee: (emp: Partial<Employee>) => Employee;
    updateEmployee: (id: string, updates: Partial<Employee>) => void;
    applyForLeave: (req: Partial<LeaveRequest>) => LeaveRequest;
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
    addMarketingPost: (post: Partial<MarketingPost>) => MarketingPost;
    addAIAgent: (agent: Partial<AIAgent>) => void;
    addWorkflow: (wf: Partial<Workflow>) => void;

    // Catering Actions
    createCateringOrder: (data: any) => Promise<{ event: CateringEvent, invoice: Invoice }>;
    updateCateringOrder: (eventId: string, updates: any) => void;
    updateCateringEvent: (id: string, updates: Partial<CateringEvent>) => void;
    createProcurementInvoice: (eventId: string, reqs: Partial<Requisition>[]) => Promise<Invoice>;
    deductStockFromCooking: (eventId: string) => void;
    calculateItemCosting: (id: string, qty: number) => any;
    approveInvoice: (id: string) => void;
    syncWithCloud: () => Promise<void>;
    hydrateFromCloud: () => Promise<void>;
    subscribeToRealtimeUpdates: () => void;
    unsubscribeFromRealtimeUpdates: () => void;
    addAgenticLog: (log: Partial<AgenticLog>) => void;

    // Portion Monitor Actions
    initializePortionMonitor: (eventId: string, tableCount: number, guestsPerTable: number) => void;
    markTableServed: (eventId: string, tableId: string, itemIds: string[]) => void;
    assignWaiterToTable: (eventId: string, tableId: string, waiterId: string) => void;
    logLeftover: (eventId: string, itemId: string, quantity: number, reason: string) => void;
    addHandoverEvidence: (eventId: string, url: string, note: string) => void;
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
            leaveRequests: [],
            calendarEvents: [],
            socialInteractions: [],
            agenticLogs: [],
            performanceReviews: [],
            syncStatus: 'Synced',
            lastSyncError: null,
            isSyncing: false,
            realtimeStatus: 'Disconnected',
            realtimeChannel: null,
            departmentMatrix: [
                {
                    id: 'dept-kitchen', name: 'Kitchen', roles: [
                        { title: "Executive Chef", band: 5, salaryRange: { low: 500000, mid: 600000, high: 700000 } },
                        { title: "Kitchen Manager", band: 4, salaryRange: { low: 350000, mid: 400000, high: 450000 } },
                        { title: "Sous Chef", band: 4, salaryRange: { low: 300000, mid: 350000, high: 400000 } },
                        { title: "Chef", band: 3, salaryRange: { low: 200000, mid: 250000, high: 300000 } },
                        { title: "Line Cook", band: 2, salaryRange: { low: 130000, mid: 150000, high: 170000 } },
                        { title: "Kitchen Assistant", band: 1, salaryRange: { low: 80000, mid: 100000, high: 120000 } }
                    ]
                },
                {
                    id: 'dept-service', name: 'Service', roles: [
                        { title: "Banquet Manager", band: 5, salaryRange: { low: 500000, mid: 600000, high: 700000 } },
                        { title: "Event Coordinator", band: 4, salaryRange: { low: 300000, mid: 350000, high: 400000 } },
                        { title: "Head Waiter", band: 3, salaryRange: { low: 200000, mid: 230000, high: 260000 } },
                        { title: "Waiter/Server", band: 2, salaryRange: { low: 130000, mid: 150000, high: 170000 } },
                        { title: "Cleaner", band: 1, salaryRange: { low: 70000, mid: 85000, high: 100000 } },
                        { title: "Runner/Busser", band: 1, salaryRange: { low: 80000, mid: 100000, high: 120000 } }
                    ]
                },
                {
                    id: 'dept-logistics', name: 'Logistics', roles: [
                        { title: "Logistics Manager", band: 4, salaryRange: { low: 300000, mid: 350000, high: 400000 } },
                        { title: "Logistics Officer", band: 3, salaryRange: { low: 200000, mid: 250000, high: 300000 } },
                        { title: "Stock Keeper", band: 3, salaryRange: { low: 180000, mid: 220000, high: 260000 } },
                        { title: "Driver", band: 2, salaryRange: { low: 100000, mid: 120000, high: 140000 } }
                    ]
                }
            ],
            // ... (other state initialized)

            addInventoryItem: (item) => {
                set((state) => ({
                    inventory: [{ ...item, id: item.id || `inv-${Date.now()}`, companyId: item.companyId || 'org-xquisite' } as InventoryItem, ...state.inventory]
                }));
                get().syncWithCloud();
            },
            addRequisition: (req) => set((state) => ({
                requisitions: [{ ...req, id: req.id || `req-${Date.now()}`, status: 'Pending', requestorId: 'sys' } as Requisition, ...state.requisitions]
            })),
            approveRequisition: (id) => set((state) => ({
                requisitions: state.requisitions.map(r => r.id === id ? { ...r, status: 'Approved' } : r)
            })),
            receiveFoodStock: (ingId, qty, cost) => set((state) => {
                const updatedIngredients = state.ingredients.map(i =>
                    i.id === ingId ? { ...i, stockLevel: i.stockLevel + qty, currentCostCents: cost / qty } : i
                );
                return { ingredients: updatedIngredients };
            }),
            issueRental: (eventId, itemId, qty, vendor) => set((state) => {
                const item = state.inventory.find(i => i.id === itemId);
                const event = state.cateringEvents.find(e => e.id === eventId);
                if (!item || !event) return state;

                const newRental: RentalRecord = {
                    id: `rent-${Date.now()}`,
                    requisitionId: `req-rent-${Date.now()}`,
                    eventId,
                    itemName: item.name,
                    quantity: qty,
                    estimatedReplacementValueCents: (item.priceCents || 0) * qty,
                    rentalVendor: vendor || 'In-House',
                    status: 'Issued',
                    dateIssued: new Date().toISOString(),
                    notes: `Issued for ${event.customerName}`
                };

                // Deduct from physical stock if in-house
                let updatedInventory = state.inventory;
                if (!vendor || vendor === 'In-House') {
                    updatedInventory = state.inventory.map(i => i.id === itemId ? { ...i, stockQuantity: i.stockQuantity - qty } : i);
                }

                return {
                    rentalLedger: [newRental, ...state.rentalLedger],
                    inventory: updatedInventory
                };
            }),
            returnRental: (id, status, notes) => set((state) => {
                // If returned to stock, increment inventory
                const rental = state.rentalLedger.find(r => r.id === id);
                let updatedInventory = state.inventory;

                if (rental && status === 'Returned' && rental.rentalVendor === 'In-House') {
                    const item = state.inventory.find(i => i.name === rental.itemName); // Matching by name is risky but simple for now
                    if (item) {
                        updatedInventory = state.inventory.map(i => i.id === item.id ? { ...i, stockQuantity: i.stockQuantity + rental.quantity } : i);
                    }
                }

                return {
                    rentalLedger: state.rentalLedger.map(r => r.id === id ? { ...r, status, notes: notes || r.notes, dateReturned: new Date().toISOString() } : r),
                    inventory: updatedInventory
                };
            }),
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
                    id: `log-${Date.now()}-${r.id}`,
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
            addContact: (contact) => {
                set((state) => ({
                    contacts: [{ ...contact, id: contact.id || `con-${Date.now()}`, companyId: contact.companyId || 'org-xquisite' } as Contact, ...state.contacts]
                }));
                get().syncWithCloud();
            },
            addContactsBulk: (contacts) => set((state) => ({
                contacts: [...contacts.map(c => ({ ...c, id: c.id || `c-${Math.random()}`, companyId: c.companyId || 'org-xquisite' }) as Contact), ...state.contacts]
            })),
            deleteContact: (id) => set((state) => ({
                contacts: state.contacts.filter(c => c.id !== id)
            })),
            addInvoice: (invoice) => set((state) => ({ invoices: [invoice, ...state.invoices] })),
            updateInvoiceStatus: (id, status) => set((state) => ({
                invoices: state.invoices.map(inv => inv.id === id ? { ...inv, status } : inv)
            })),
            addBookkeepingEntry: (entry) => set((state) => ({
                bookkeeping: [entry, ...state.bookkeeping]
            })),
            addTransaction: (tx) => set((state) => ({
                bankTransactions: [tx, ...state.bankTransactions]
            })),
            recordPayment: (id, amount) => set((state) => {
                const invoice = state.invoices.find(inv => inv.id === id);
                if (!invoice) return state;

                const newPaid = invoice.paidAmountCents + amount;
                const newStatus = newPaid >= invoice.totalCents ? InvoiceStatus.PAID : invoice.status;

                const updatedInvoices = state.invoices.map(inv =>
                    inv.id === id ? { ...inv, paidAmountCents: newPaid, status: newStatus } : inv
                );

                const newEntry: BookkeepingEntry = {
                    id: `bk-${Date.now()}`,
                    date: new Date().toISOString().split('T')[0],
                    type: 'Inflow',
                    category: 'Sales',
                    description: `Payment for Invoice #${invoice.number}`,
                    amountCents: amount,
                    referenceId: id,
                    contactId: invoice.contactId
                };

                return {
                    invoices: updatedInvoices,
                    bookkeeping: [newEntry, ...state.bookkeeping]
                };
            }),
            reconcileMatch: (lineId, accountId) => set((state) => ({
                bankStatementLines: state.bankStatementLines.map(l => l.id === lineId ? { ...l, isMatched: true } : l)
            })),

            addEmployee: (emp) => {
                const newEmp = {
                    ...emp,
                    id: emp.id || `emp-${Date.now()}`,
                    companyId: emp.companyId || 'org-xquisite',
                    status: (emp.status as any) || 'Active',
                    kpis: emp.kpis || [],
                    avatar: emp.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.firstName}`
                } as Employee;
                set((state) => ({ employees: [newEmp, ...state.employees] }));
                return newEmp;
            },
            updateEmployee: (id, updates) => set((state) => ({
                employees: state.employees.map(e => e.id === id ? { ...e, ...updates } : e)
            })),
            applyForLeave: (req) => {
                const newReq = {
                    ...req,
                    id: `lv-${Date.now()}`,
                    status: 'Pending',
                    appliedDate: new Date().toISOString().split('T')[0],
                    calendarSynced: false
                } as LeaveRequest;
                set((state) => ({ leaveRequests: [newReq, ...state.leaveRequests] }));
                return newReq;
            },
            approveLeave: (id) => set((state) => ({
                leaveRequests: state.leaveRequests.map(l => l.id === id ? { ...l, status: 'Approved' as any } : l)
            })),
            rejectLeave: (id) => set((state) => ({
                leaveRequests: state.leaveRequests.map(l => l.id === id ? { ...l, status: 'Rejected' as any } : l)
            })),
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

            addPerformanceReview: (review) => {
                const newReview = { ...review, id: review.id || `rev-${Date.now()}`, status: 'Draft', totalScore: 0, metrics: review.metrics || [] } as PerformanceReview;
                set((state) => ({ performanceReviews: [newReview, ...state.performanceReviews] }));
                get().syncWithCloud();
            },

            submitSelfAssessment: (id, scores) => {
                set((state) => ({
                    performanceReviews: state.performanceReviews.map(r => {
                        if (r.id !== id) return r;
                        const newMetrics = r.metrics.map((m, idx) => scores[idx] !== undefined ? { ...m, employeeScore: scores[idx] } : m);
                        return { ...r, metrics: newMetrics, status: 'Supervisor_Review' };
                    })
                }));
                get().syncWithCloud();
            },

            submitSupervisorReview: (id, scores, overrideReason) => {
                set((state) => ({
                    performanceReviews: state.performanceReviews.map(r => {
                        if (r.id !== id) return r;
                        const newMetrics = r.metrics.map((m, idx) => {
                            const supScore = scores[idx] !== undefined ? scores[idx] : m.supervisorScore;
                            // Average of Emp + Sup
                            return {
                                ...m,
                                supervisorScore: supScore,
                                finalScore: Math.round(((m.employeeScore + supScore) / 2) * 10) / 10,
                                managerOverrideReason: overrideReason
                            };
                        });

                        // Calculate Total Weighted Score (0-4 scale normalized to percentage if needed, but keeping raw 0-4 for simplicity or weighted sum)
                        // Simple weighted average: (Sum(Score * Weight) / Sum(Weight))
                        let totalWeightedScore = 0;
                        let totalWeight = 0;
                        newMetrics.forEach(m => {
                            totalWeightedScore += (m.finalScore * m.weight);
                            totalWeight += m.weight;
                        });
                        const finalTotal = totalWeight > 0 ? (totalWeightedScore / totalWeight) : 0;

                        return { ...r, metrics: newMetrics, totalScore: Math.round(finalTotal * 10) / 10, status: 'Finalized', finalizedDate: new Date().toISOString() };
                    })
                }));
                get().syncWithCloud();
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
                const newTask = { ...t, id: `task-${Date.now()}`, companyId: 'org-xquisite', status: t.status || 'Todo', priority: t.priority || 'Medium', createdDate: new Date().toISOString() } as Task;
                set((state) => ({ tasks: [newTask, ...state.tasks] }));
                get().syncWithCloud();
            },

            addIngredient: (ing) => {
                const newIng = {
                    ...ing,
                    id: ing.id || `ing-${Date.now()}`,
                    companyId: 'org-xquisite',
                    lastUpdated: new Date().toISOString(),
                    stockLevel: ing.stockLevel || 0,
                    currentCostCents: ing.currentCostCents || 0
                } as Ingredient;
                set((state) => ({ ingredients: [newIng, ...state.ingredients] }));
                get().syncWithCloud();
            },

            updateIngredient: (id, updates) => {
                set((state) => ({
                    ingredients: state.ingredients.map((ing) =>
                        ing.id === id ? { ...ing, ...updates, lastUpdated: new Date().toISOString() } : ing
                    ),
                }));
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

            updateCateringEvent: (id, updates) => {
                set((state) => ({
                    cateringEvents: state.cateringEvents.map((ev) =>
                        ev.id === id ? { ...ev, ...updates } : ev
                    ),
                }));
                get().syncWithCloud();
            },
            addMarketingPost: (p) => {
                const post = { ...p, id: `mp-${Date.now()}`, companyId: 'org-xquisite', generatedByAI: p.generatedByAI || false } as MarketingPost;
                set((state) => ({ marketingPosts: [post, ...state.marketingPosts] }));
                get().syncWithCloud();
                return post;
            },
            addAIAgent: (a) => {
                const agent = { ...a, id: `a-${Date.now()}`, companyId: 'org-xquisite', status: 'Deployed' } as AIAgent;
                set((state) => ({ aiAgents: [agent, ...state.aiAgents] }));
                get().syncWithCloud();
            },
            addWorkflow: (wf) => {
                const workflow = { ...wf, id: `wf-${Date.now()}`, logs: [], status: 'Active' } as Workflow;
                set((state) => ({ workflows: [workflow, ...state.workflows] }));
                set((state) => ({ workflows: [workflow, ...state.workflows] }));
                get().syncWithCloud();
            },
            addAgenticLog: (log) => {
                const newLog = {
                    ...log,
                    id: log.id || `log-${Date.now()}`,
                    timestamp: log.timestamp || new Date().toISOString()
                } as AgenticLog;
                set((state) => ({ agenticLogs: [newLog, ...state.agenticLogs] }));
            },

            initializePortionMonitor: (eventId, tableCount, guestsPerTable) => set((state) => {
                const eventIndex = state.cateringEvents.findIndex(e => e.id === eventId);
                if (eventIndex === -1) return state;

                const tables: any[] = [];
                for (let i = 1; i <= tableCount; i++) {
                    tables.push({
                        id: `tbl-${eventId}-${i}`,
                        name: `Table ${i}`,
                        assignedGuests: guestsPerTable,
                        status: 'Waiting',
                        servedItems: [],
                        isLocked: false
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

            markTableServed: (eventId, tableId, itemIds) => set((state) => {
                const eventIndex = state.cateringEvents.findIndex(e => e.id === eventId);
                if (eventIndex === -1) return state;

                const event = state.cateringEvents[eventIndex];
                if (!event.portionMonitor) return state;

                const updatedTables = event.portionMonitor.tables.map((t: any) => {
                    if (t.id === tableId && !t.isLocked) {
                        // In a real app, we'd look up item names from inventory/recipes.
                        // For this simplified logic, we assume served all items in the event deal
                        const served = itemIds.map(id => ({
                            itemId: id,
                            name: event.items.find(i => i.inventoryItemId === id)?.name || 'Unknown Item',
                            quantity: 1, // Assumption: 1 portion per guest per item
                            servedAt: new Date().toISOString()
                        }));

                        return {
                            ...t,
                            status: 'Served',
                            isLocked: true,
                            servedItems: served
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

            createCateringOrder: async (d) => {
                const evId = `ev-${Date.now()}`;
                const invoiceId = `inv-${Date.now()}`;
                const totalRev = d.items.reduce((s: number, i: any) => s + (i.priceCents * i.quantity), 0 as number);

                const event: CateringEvent = {
                    id: evId,
                    companyId: 'org-xquisite',
                    customerName: d.customerName,
                    eventDate: d.eventDate,
                    guestCount: d.guestCount,
                    status: 'Confirmed',
                    currentPhase: 'Procurement',
                    items: d.items,
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

                const invoice: Invoice = {
                    id: invoiceId,
                    number: `SALES-${Date.now()}`,
                    companyId: 'org-xquisite',
                    contactId: d.contactId,
                    date: new Date().toISOString().split('T')[0],
                    dueDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
                    status: InvoiceStatus.UNPAID,
                    type: 'Sales',
                    totalCents: totalRev,
                    paidAmountCents: 0,
                    lines: d.items.map((it: any, idx: number) => ({
                        id: `line-${idx}`,
                        description: it.name,
                        quantity: it.quantity,
                        unitPriceCents: it.priceCents
                    }))
                };

                // Calculate dates
                const eventDateObj = new Date(d.eventDate);
                const oneDayBefore = new Date(eventDateObj); oneDayBefore.setDate(eventDateObj.getDate() - 1);
                const oneDayAfter = new Date(eventDateObj); oneDayAfter.setDate(eventDateObj.getDate() + 1);

                const taskList: Task[] = [
                    {
                        id: `task-proc-${Date.now()}`, companyId: 'org-xquisite',
                        title: 'Procurement & Requisitions',
                        description: 'Generate and approve requisitions for all deal items.',
                        dueDate: oneDayBefore.toISOString().split('T')[0], priority: 'High', status: 'Todo'
                    },
                    {
                        id: `task-prep-${Date.now()}`, companyId: 'org-xquisite',
                        title: 'Mise en Place (Food Prep)',
                        description: 'Initial ingredient preparation and marination.',
                        dueDate: oneDayBefore.toISOString().split('T')[0], priority: 'Medium', status: 'Todo'
                    },
                    {
                        id: `task-cook-${Date.now()}`, companyId: 'org-xquisite',
                        title: 'Live Cooking / Final Production',
                        description: 'CRITICAL: Main cooking execution on event day.',
                        dueDate: d.eventDate, priority: 'Critical', status: 'Todo'
                    },
                    {
                        id: `task-asset-out-${Date.now()}`, companyId: 'org-xquisite',
                        title: 'Asset Checkout & Loading',
                        description: 'Checkout hardware, cutlery, and equipment from store.',
                        dueDate: d.eventDate, priority: 'High', status: 'Todo'
                    },
                    {
                        id: `task-setup-${Date.now()}`, companyId: 'org-xquisite',
                        title: 'Event Setup',
                        description: 'Setup service points, tables, and chaffing dishes.',
                        dueDate: d.eventDate, priority: 'High', status: 'Todo'
                    },
                    {
                        id: `task-service-${Date.now()}`, companyId: 'org-xquisite',
                        title: 'Service Delivery',
                        description: 'Execute food service and guest management.',
                        dueDate: d.eventDate, priority: 'Critical', status: 'Todo'
                    },
                    {
                        id: `task-asset-in-${Date.now()}`, companyId: 'org-xquisite',
                        title: 'Asset Return & Reconciliation',
                        description: 'Return all assets to store and log breakages/losses.',
                        dueDate: oneDayAfter.toISOString().split('T')[0], priority: 'Medium', status: 'Todo'
                    }
                ];

                // Conditional Tasks
                // Mock logic: If guest count > 50, assume vehicle hire needed
                if (d.guestCount > 50) {
                    taskList.push({
                        id: `task-veh-${Date.now()}`, companyId: 'org-xquisite',
                        title: 'Vehicle Hire & Logistics',
                        description: 'Coordinate transport for team and equipment.',
                        dueDate: d.eventDate, priority: 'Medium', status: 'Todo'
                    });
                }

                // If event includes "Rental" items (mock check)
                const hasRentals = d.items.some((i: any) => i.name.toLowerCase().includes('rental'));
                if (hasRentals) {
                    taskList.push(
                        {
                            id: `task-rent-out-${Date.now()}`, companyId: 'org-xquisite',
                            title: 'Rental Pickup',
                            description: 'Collect rental items from vendors.',
                            dueDate: oneDayBefore.toISOString().split('T')[0], priority: 'Medium', status: 'Todo'
                        },
                        {
                            id: `task-rent-in-${Date.now()}`, companyId: 'org-xquisite',
                            title: 'Rental Return',
                            description: 'Return items to vendors (Clean/Dirty as agreed).',
                            dueDate: oneDayAfter.toISOString().split('T')[0], priority: 'Medium', status: 'Todo'
                        }
                    );
                }

                const project: Project = {
                    id: `proj-${Date.now()}`,
                    companyId: 'org-xquisite',
                    name: `${evId.toUpperCase()} - ${d.customerName} - Event Project`,
                    clientContactId: d.contactId || '',
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
                    id: `cal-${Date.now()}`,
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

                get().syncWithCloud();
                return { event, invoice };
            },

            updateCateringOrder: (eventId: string, updates: any) => set((state) => {
                const eventIndex = state.cateringEvents.findIndex(e => e.id === eventId);
                if (eventIndex === -1) return state;

                const updatedEvents = [...state.cateringEvents];
                const oldEvent = updatedEvents[eventIndex];
                const newEvent = { ...oldEvent, ...updates };
                updatedEvents[eventIndex] = newEvent;

                // Update associated invoice if items changed
                let updatedInvoices = state.invoices;
                if (updates.items && newEvent.financials?.invoiceId) {
                    const totalRev = updates.items.reduce((s: number, i: any) => s + (i.priceCents * i.quantity), 0);
                    updatedInvoices = state.invoices.map(inv => {
                        if (inv.id === newEvent.financials.invoiceId) {
                            return {
                                ...inv,
                                totalCents: totalRev,
                                lines: updates.items.map((it: any, idx: number) => ({
                                    id: `line-${idx}`,
                                    description: it.name,
                                    quantity: it.quantity,
                                    unitPriceCents: it.priceCents
                                }))
                            };
                        }
                        return inv;
                    });
                }

                return {
                    ...state,
                    cateringEvents: updatedEvents,
                    invoices: updatedInvoices
                };
            }),

            createProcurementInvoice: async (eventId, reqs) => {
                const totalSpend = reqs.reduce((sum: number, r: Partial<Requisition>) => sum + (r.totalAmountCents || 0), 0 as number);
                const invoice: Invoice = {
                    id: `pinv-${Date.now()}`,
                    number: `PURCH-${Date.now()}`,
                    companyId: 'org-xquisite',
                    date: new Date().toISOString().split('T')[0],
                    dueDate: new Date().toISOString().split('T')[0],
                    status: InvoiceStatus.UNPAID,
                    type: 'Purchase',
                    totalCents: totalSpend,
                    paidAmountCents: 0,
                    lines: reqs.map((r, idx) => ({
                        id: `pline-${idx}`,
                        description: `${r.itemName} [${r.category}]`,
                        quantity: r.quantity || 1,
                        unitPriceCents: r.pricePerUnitCents || 0
                    }))
                };

                set((state) => ({
                    invoices: [invoice, ...state.invoices],
                    cateringEvents: state.cateringEvents.map(e => e.id === eventId ? { ...e, currentPhase: 'Execution' } : e)
                }));

                return invoice;
            },

            deductStockFromCooking: (eventId) => {
                // Simplified stock deduction logic
                set((state) => {
                    const event = state.cateringEvents.find(e => e.id === eventId);
                    if (!event) return state;
                    // Logic would iterate through ingredients in recipes... omitting for conciseness or implementing generic decrement
                    return { ...state };
                });
            },

            calculateItemCosting: (id: string, qty: number) => {
                const state = get();
                const item = state.inventory.find(i => i.id === id);
                if (!item) return null;
                let totalCost = 0;
                const recipe = state.recipes.find(r => r.id === item.recipeId);

                const breakdown = recipe ? recipe.ingredients.map((ri: any) => {
                    const ing = state.ingredients.find(i => i.name === ri.name);
                    const unitCost = (ing?.marketPriceCents) ? ing.marketPriceCents : (ing?.currentCostCents || 50000);
                    const subTotal = ri.qtyPerPortion * qty * unitCost;
                    totalCost += subTotal;
                    return {
                        name: ri.name,
                        qtyRequired: ri.qtyPerPortion * qty,
                        unit: ri.unit,
                        unitCostCents: unitCost,
                        totalCostCents: subTotal,
                        isGrounded: !!ing?.marketPriceCents
                    };
                }) : [];

                const revenue = item.priceCents * qty;
                const grossMarginCents = revenue - totalCost;
                const grossMarginPercentage = revenue > 0 ? (grossMarginCents / revenue) * 100 : 0;

                return {
                    inventoryItemId: id,
                    name: item.name,
                    totalIngredientCostCents: totalCost,
                    revenueCents: revenue,
                    grossMarginCents,
                    grossMarginPercentage,
                    ingredientBreakdown: breakdown
                };
            },

            approveInvoice: (id: string) => set((state) => ({
                invoices: state.invoices.map(inv => inv.id === id ? { ...inv, status: InvoiceStatus.PAID } : inv)
            })),

            syncWithCloud: async () => {
                if (!supabase) {
                    set({ syncStatus: 'Offline' });
                    return;
                }

                const state = get();
                if (state.isSyncing) return;

                set({ isSyncing: true, syncStatus: 'Syncing', lastSyncError: null });

                try {
                    await Promise.all([
                        syncTableToCloud('inventory', state.inventory),
                        syncTableToCloud('contacts', state.contacts),
                        syncTableToCloud('invoices', state.invoices),
                        syncTableToCloud('catering_events', state.cateringEvents),
                        syncTableToCloud('projects', state.projects),
                        syncTableToCloud('bookkeeping', state.bookkeeping),
                        syncTableToCloud('tasks', state.tasks),
                        syncTableToCloud('employees', state.employees),
                        syncTableToCloud('requisitions', state.requisitions),
                        syncTableToCloud('chart_of_accounts', state.chartOfAccounts),
                        syncTableToCloud('bank_transactions', state.bankTransactions)
                    ]);
                    set({ isSyncing: false, syncStatus: 'Synced' });
                } catch (e) {
                    const errorMsg = (e as Error).message;
                    set({ isSyncing: false, syncStatus: 'Error', lastSyncError: errorMsg });
                    console.error('Cloud Sync Failed:', e);
                }
            },

            hydrateFromCloud: async () => {
                if (!supabase) return;

                const companyId = useAuthStore.getState().user?.companyId;
                if (!companyId) return;

                set({ isSyncing: true, syncStatus: 'Syncing' });

                try {
                    const [inv, contacts, invoices, events, tasks, employees, requisitions, accounts, transactions] = await Promise.all([
                        pullCloudState('inventory', companyId),
                        pullCloudState('contacts', companyId),
                        pullCloudState('invoices', companyId),
                        pullCloudState('catering_events', companyId),
                        pullCloudState('tasks', companyId),
                        pullCloudState('employees', companyId),
                        pullCloudState('requisitions', companyId),
                        pullCloudState('chart_of_accounts', companyId),
                        pullCloudState('bank_transactions', companyId)
                    ]);

                    const updates: Partial<DataState> = {};
                    if (inv) updates.inventory = inv;
                    if (contacts) updates.contacts = contacts;
                    if (invoices) updates.invoices = invoices;
                    if (events) updates.cateringEvents = events;
                    if (tasks) updates.tasks = tasks;
                    if (employees) updates.employees = employees;
                    if (requisitions) updates.requisitions = requisitions;
                    if (accounts) updates.chartOfAccounts = accounts;
                    if (transactions) updates.bankTransactions = transactions;

                    set({ ...updates, isSyncing: false, syncStatus: 'Synced' });
                } catch (e) {
                    set({ isSyncing: false, syncStatus: 'Error', lastSyncError: (e as Error).message });
                    console.error('Cloud Hydration Failed:', e);
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
                    // Invoices
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'invoices',
                        filter: `company_id=eq.${companyId}`
                    }, (payload: any) => {
                        const { eventType, new: newRow, old: oldRow } = payload;
                        set((state) => {
                            if (eventType === 'INSERT') {
                                return { invoices: [newRow, ...state.invoices] };
                            } else if (eventType === 'UPDATE') {
                                return { invoices: state.invoices.map(i => i.id === newRow.id ? newRow : i) };
                            } else if (eventType === 'DELETE') {
                                return { invoices: state.invoices.filter(i => i.id !== oldRow.id) };
                            }
                            return state;
                        });
                    })
                    // Contacts
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'contacts',
                        filter: `company_id=eq.${companyId}`
                    }, (payload: any) => {
                        const { eventType, new: newRow, old: oldRow } = payload;
                        set((state) => {
                            if (eventType === 'INSERT') {
                                return { contacts: [newRow, ...state.contacts] };
                            } else if (eventType === 'UPDATE') {
                                return { contacts: state.contacts.map(c => c.id === newRow.id ? newRow : c) };
                            } else if (eventType === 'DELETE') {
                                return { contacts: state.contacts.filter(c => c.id !== oldRow.id) };
                            }
                            return state;
                        });
                    })
                    // Inventory
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'inventory',
                        filter: `company_id=eq.${companyId}`
                    }, (payload: any) => {
                        const { eventType, new: newRow, old: oldRow } = payload;
                        set((state) => {
                            if (eventType === 'INSERT') {
                                return { inventory: [newRow, ...state.inventory] };
                            } else if (eventType === 'UPDATE') {
                                return { inventory: state.inventory.map(i => i.id === newRow.id ? newRow : i) };
                            } else if (eventType === 'DELETE') {
                                return { inventory: state.inventory.filter(i => i.id !== oldRow.id) };
                            }
                            return state;
                        });
                    })
                    // Catering Events
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'catering_events',
                        filter: `company_id=eq.${companyId}`
                    }, (payload: any) => {
                        const { eventType, new: newRow, old: oldRow } = payload;
                        set((state) => {
                            if (eventType === 'INSERT') {
                                return { cateringEvents: [newRow, ...state.cateringEvents] };
                            } else if (eventType === 'UPDATE') {
                                return { cateringEvents: state.cateringEvents.map(e => e.id === newRow.id ? newRow : e) };
                            } else if (eventType === 'DELETE') {
                                return { cateringEvents: state.cateringEvents.filter(e => e.id !== oldRow.id) };
                            }
                            return state;
                        });
                    })
                    // Employees
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'employees',
                        filter: `company_id=eq.${companyId}`
                    }, (payload: any) => {
                        const { eventType, new: newRow, old: oldRow } = payload;
                        set((state) => {
                            if (eventType === 'INSERT') {
                                return { employees: [newRow, ...state.employees] };
                            } else if (eventType === 'UPDATE') {
                                return { employees: state.employees.map(e => e.id === newRow.id ? newRow : e) };
                            } else if (eventType === 'DELETE') {
                                return { employees: state.employees.filter(e => e.id !== oldRow.id) };
                            }
                            return state;
                        });
                    })
                    // Tasks
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'tasks',
                        filter: `company_id=eq.${companyId}`
                    }, (payload: any) => {
                        const { eventType, new: newRow, old: oldRow } = payload;
                        set((state) => {
                            if (eventType === 'INSERT') {
                                return { tasks: [newRow, ...state.tasks] };
                            } else if (eventType === 'UPDATE') {
                                return { tasks: state.tasks.map(t => t.id === newRow.id ? newRow : t) };
                            } else if (eventType === 'DELETE') {
                                return { tasks: state.tasks.filter(t => t.id !== oldRow.id) };
                            }
                            return state;
                        });
                    })
                    // Bookkeeping
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'bookkeeping',
                        filter: `company_id=eq.${companyId}`
                    }, (payload: any) => {
                        const { eventType, new: newRow, old: oldRow } = payload;
                        set((state) => {
                            if (eventType === 'INSERT') {
                                return { bookkeeping: [newRow, ...state.bookkeeping] };
                            } else if (eventType === 'UPDATE') {
                                return { bookkeeping: state.bookkeeping.map(b => b.id === newRow.id ? newRow : b) };
                            } else if (eventType === 'DELETE') {
                                return { bookkeeping: state.bookkeeping.filter(b => b.id !== oldRow.id) };
                            }
                            return state;
                        });
                    })
                    // Requisitions
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'requisitions',
                        filter: `company_id=eq.${companyId}`
                    }, (payload: any) => {
                        const { eventType, new: newRow, old: oldRow } = payload;
                        set((state) => {
                            if (eventType === 'INSERT') {
                                return { requisitions: [newRow, ...state.requisitions] };
                            } else if (eventType === 'UPDATE') {
                                return { requisitions: state.requisitions.map(r => r.id === newRow.id ? newRow : r) };
                            } else if (eventType === 'DELETE') {
                                return { requisitions: state.requisitions.filter(r => r.id !== oldRow.id) };
                            }
                            return state;
                        });
                    })
                    // Chart of Accounts
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'chart_of_accounts',
                        filter: `company_id=eq.${companyId}`
                    }, (payload: any) => {
                        const { eventType, new: newRow, old: oldRow } = payload;
                        set((state) => {
                            if (eventType === 'INSERT') {
                                return { chartOfAccounts: [newRow, ...state.chartOfAccounts] };
                            } else if (eventType === 'UPDATE') {
                                return { chartOfAccounts: state.chartOfAccounts.map(a => a.id === newRow.id ? newRow : a) };
                            } else if (eventType === 'DELETE') {
                                return { chartOfAccounts: state.chartOfAccounts.filter(a => a.id !== oldRow.id) };
                            }
                            return state;
                        });
                    })
                    // Bank Transactions
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'bank_transactions',
                        filter: `company_id=eq.${companyId}`
                    }, (payload: any) => {
                        const { eventType, new: newRow, old: oldRow } = payload;
                        set((state) => {
                            if (eventType === 'INSERT') {
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
            name: 'data-storage',
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
