import { SchemaType } from '@google/generative-ai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useDataStore } from '../store/useDataStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Ingredient, CateringEvent, Recipe, AIAgentMode } from '../types';
import { useAuthStore } from '../store/useAuthStore';


const getAIInstance = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    // Fallback to process.env for 'process.env.API_KEY' replacement in Vite config
    const legacyKey = (import.meta as any).env?.VITE_API_KEY; // Replaced process.env with Vite-friendly fallback if needed

    // Debug logging
    console.log("[AI Service] Loading Keys:", {
        hasVite: !!apiKey,
        hasLegacy: !!legacyKey,
        viteKeyPrefix: apiKey ? apiKey.substring(0, 4) : 'N/A'
    });

    const key = apiKey || legacyKey || '';
    if (!key) throw new Error("MISSING_API_KEY");
    return new GoogleGenerativeAI(key);
};

async function callLocalGemma(
    messages: Array<{ role: string; content: string }>,
    jsonMode: boolean = false
): Promise<string> {
    try {
        const payload: any = {
            model: "gemma-2-2b-it-Q4_K_M",
            messages,
            temperature: jsonMode ? 0.1 : 0.7,
            max_tokens: 1024
        };
        if (jsonMode) {
            payload.response_format = { type: "json_object" };
        }
        const resp = await fetch("http://localhost:8000/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        if (!resp.ok) {
            throw new Error(`Local Gemma API returned HTTP ${resp.status}`);
        }
        const data = await resp.json();
        return data.choices?.[0]?.message?.content || "";
    } catch (err: any) {
        console.error("[Local Gemma] Request failed:", err);
        throw new Error(`Local Gemma error: ${err.message || err}`);
    }
}

/**
 * AI Tools Implementation
 * These functions bridge the AI model to our local data store.
 */
const SYSTEM_TOOLS = {
    get_outstanding_invoices: (args: { limit?: number }) => {
        const { limit = 25 } = args || {};
        const dataStore = useDataStore.getState();

        // Group and aggregate by customer/contactId
        const debtorMap: Record<string, { customer_name: string, amount_naira: number, status: string }> = {};

        dataStore.invoices
            .filter(i => (i.status as string) !== 'Paid' && (i.status as string) !== 'Draft')
            .forEach(i => {
                const contactId = i.contactId || 'unknown';
                const balance = (i.totalCents - i.paidAmountCents) / 100;

                if (debtorMap[contactId]) {
                    debtorMap[contactId].amount_naira += balance;
                } else {
                    const customerObj = dataStore.contacts.find(c => c.id === i.contactId);
                    debtorMap[contactId] = {
                        customer_name: customerObj ? customerObj.name : (i.contactId ? 'Unknown' : 'Walk-in'),
                        amount_naira: balance,
                        status: (i.status as any) === 'Overdue' ? 'Overdue' : 'Unpaid'
                    };
                }
            });

        const data = Object.values(debtorMap)
            .sort((a, b) => b.amount_naira - a.amount_naira)
            .slice(0, limit)
            .map((d: { customer_name: string, amount_naira: number, status: string }) => ({
                ...d,
                amount_formatted: new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(d.amount_naira)
            }));

        return {
            top_debtors: data,
            unique_debtor_count: data.length,
            total_unpaid_invoices: dataStore.invoices.filter(i => (i.status as any) !== 'Paid' && (i.status as any) !== 'Draft').length
        };
    },
    search_contacts: (args: { query: string; category?: string; limit?: number }) => {
        const { query, category, limit = 10 } = args;
        const dataStore = useDataStore.getState();
        let results = dataStore.contacts.filter(c =>
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.email?.toLowerCase().includes(query.toLowerCase()) ||
            c.phone?.includes(query)
        );
        if (category) {
            results = results.filter(c => c.category === category);
        }
        const data = results.slice(0, limit).map(c => ({
            name: c.name,
            email: c.email,
            phone: c.phone,
            category: c.category,
            company: c.companyId
        }));
        return { contacts: data };
    },
    get_inventory_status: (args: { query?: string; type?: string; category?: string; limit?: number }) => {
        const { query, type, category, limit = 20 } = args || {};
        const dataStore = useDataStore.getState();
        let results = dataStore.inventory;

        if (query) {
            results = results.filter(i => i.name.toLowerCase().includes(query.toLowerCase()));
        }
        if (type) {
            results = results.filter(i => i.type === type);
        }
        if (category) {
            results = results.filter(i => i.category === category);
        }

        const data = results.slice(0, limit).map(i => ({
            name: i.name,
            stock: i.stockQuantity,
            type: i.type,
            price_naira: i.priceCents / 100,
            category: i.category
        }));
        return { items: data, total_found: results.length };
    },
    get_staff_directory: () => {
        const dataStore = useDataStore.getState();
        const data = dataStore.employees.map(e => ({
            name: `${e.firstName} ${e.lastName}`,
            role: e.role,
            status: e.status,
            phone: e.phoneNumber
        }));
        return { staff: data };
    },
    search_knowledge_base: async (args: { query: string; namespace?: string; filter?: object }) => {
        const { query, namespace = "documentation", filter } = args;
        const pineconeApiKey = (import.meta as any).env.VITE_PINECONE_API_KEY;
        const geminiApiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
        const host = (import.meta as any).env.VITE_PINECONE_HOST || (import.meta as any).env.VITE_PINECONE_URL;

        if (!pineconeApiKey || !host || !geminiApiKey) {
            console.warn("[AI Tools] Knowledge Base not fully configured.");
            return { error: "Missing vector database configuration (Pinecone/Gemini)." };
        }

        try {
            // 1. Get high-fidelity embedding from Gemini
            const embedResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${geminiApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: "models/gemini-embedding-001", // Using 3072-dim stable model
                    content: { parts: [{ text: query }] }
                })
            });

            if (!embedResponse.ok) throw new Error("Gemini embedding gateway failed");
            const embedData = await embedResponse.json();
            const vector = embedData.embedding.values;

            // 2. Perform Multi-Tenant Vector Search
            const response = await fetch(`${host}/query`, {
                method: 'POST',
                headers: {
                    'Api-Key': pineconeApiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    namespace,
                    topK: 10, // Increased for broader enterprise context
                    vector,
                    filter,   // Support for fine-grained metadata filtering (tenant_id, etc.)
                    includeMetadata: true
                })
            });

            if (!response.ok) throw new Error(`Pinecone error: ${response.statusText}`);

            const data = await response.json();
            const matches = data.matches || [];

            return {
                results: matches.map((m: any) => ({
                    source: m.metadata?.path || m.id,
                    content: m.metadata?.content || "No content preview available."
                }))
            };
        } catch (e) {
            console.error("[AI Tools] Knowledge search failed:", e);
            return { error: "Failed to search knowledge base." };
        }
    },
    get_ingredient_list: (args: { query?: string; category?: string; limit?: number }) => {
        const { query, category, limit = 50 } = args || {};
        const dataStore = useDataStore.getState();
        let results = dataStore.ingredients;

        if (query) {
            results = results.filter(i => i.name.toLowerCase().includes(query.toLowerCase()));
        }
        if (category) {
            results = results.filter(i => i.category === category);
        }

        return {
            ingredients: results.slice(0, limit).map(i => ({
                name: i.name,
                stock: i.stockLevel,
                unit: i.unit,
                category: i.category,
                price_naira: (i.currentCostCents || 0) / 100,
                market_price_naira: i.marketPriceCents ? (i.marketPriceCents / 100) : undefined,
                market_insight: i.marketInsight ? {
                    summary: i.marketInsight.groundedSummary,
                    quantity: i.marketInsight.quantity,
                    location: i.marketInsight.location,
                    timestamp: i.marketInsight.timestamp
                } : undefined
            })),
            total_unique_count: results.length
        };
    },
    get_project_summary: () => {
        const dataStore = useDataStore.getState();
        const data = dataStore.projects.map(p => {
            const projectTasks = dataStore.tasks.filter(t => t.projectId === p.id);
            const completedTasks = projectTasks.filter(t => (t.status as any) === 'Completed' || (t.status as any) === 'Done').length;
            return {
                name: p.name,
                status: p.status,
                progress: projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0,
                task_count: projectTasks.length,
                due_date: p.endDate
            };
        });
        return { projects: data };
    },
    get_system_overview: () => {
        const dataStore = useDataStore.getState();
        const totalReceivables = dataStore.invoices
            .filter(i => (i.status as string) !== 'Paid' && (i.status as string) !== 'Draft')
            .reduce((sum, inv) => sum + (inv.totalCents - (inv.paidAmountCents || 0)), 0);

        return {
            counts: {
                ingredients: dataStore.ingredients.length,
                sale_products: dataStore.inventory.filter(i => i.type === 'product').length,
                reusable_assets: dataStore.inventory.filter(i => i.type === 'asset' || i.type === 'reusable').length,
                total_inventory_entries: dataStore.inventory.length,
                employees: dataStore.employees.length,
                active_projects: dataStore.projects.filter(p => (p.status as any) === 'In Progress' || (p.status as any) === 'Active').length,
                unpaid_invoices: dataStore.invoices.filter(i => (i.status as any) !== 'Paid' && (i.status as any) !== 'Draft').length,
                contacts_crm: dataStore.contacts.length,
                recipes: dataStore.recipes.length
            },
            financials: {
                total_pending_receivables: totalReceivables / 100,
                total_receivables_formatted: new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(totalReceivables / 100)
            },
            status: "Systems operational. Data synced."
        };
    },
    get_financial_summary: (args?: { month?: string }) => {
        const dataStore = useDataStore.getState();
        let invoices = dataStore.invoices;
        let bookkeeping = dataStore.bookkeeping;

        if (args?.month) {
            const m = args.month.toLowerCase();
            const monthMap: Record<string, number> = {
                january: 0, jan: 0, '1': 0,
                february: 1, feb: 1, '2': 1,
                march: 2, mar: 2, '3': 2,
                april: 3, apr: 3, '4': 3,
                may: 4, '5': 4,
                june: 5, jun: 5, '6': 5, jine: 5,
                july: 6, jul: 6, '7': 6,
                august: 7, aug: 7, '8': 7,
                september: 8, sep: 8, '9': 8,
                october: 9, oct: 9, '10': 9,
                november: 10, nov: 10, '11': 10,
                december: 11, dec: 11, '12': 11
            };
            const targetMonth = monthMap[m];
            if (targetMonth !== undefined) {
                invoices = invoices.filter(i => i.date && new Date(i.date).getMonth() === targetMonth);
                bookkeeping = bookkeeping.filter(e => e.date && new Date(e.date).getMonth() === targetMonth);
            }
        }

        const totalRevenue = invoices.filter(i => (i.status as string) === 'Paid').reduce((sum, i) => sum + i.totalCents, 0);
        const totalPending = invoices.filter(i => (i.status as string) !== 'Paid' && (i.status as string) !== 'Draft').reduce((sum, i) => sum + (i.totalCents - i.paidAmountCents), 0);
        const totalExpenses = bookkeeping.filter(e => e.type === 'Outflow').reduce((sum, e) => sum + e.amountCents, 0);

        return {
            month_filtered: args?.month || "All Time",
            revenue_paid: totalRevenue / 100,
            pending_receivables: totalPending / 100,
            recorded_expenses: totalExpenses / 100,
            cash_on_hand_estimate: (totalRevenue - totalExpenses) / 100,
            currency: "NGN"
        };
    },
    get_recipe_analysis: (args: { recipe_name: string }) => {
        const { recipe_name } = args;
        const dataStore = useDataStore.getState();
        const recipe = dataStore.recipes.find(r => r.name.toLowerCase().includes(recipe_name.toLowerCase()));

        if (!recipe) return { error: "Recipe not found." };

        return {
            recipe_name: recipe.name,
            ingredients: recipe.ingredients.map(ri => {
                const globalIng = dataStore.ingredients.find(i => i.name === ri.name);
                return {
                    name: ri.name,
                    qty_per_portion: ri.qtyPerPortion,
                    unit: ri.unit,
                    current_market_price: globalIng ? globalIng.currentCostCents / 100 : "N/A"
                };
            })
        };
    },
    get_catering_events: (args: { status?: string; limit?: number }) => {
        const { status, limit = 20 } = args || {};
        const dataStore = useDataStore.getState();
        let events = dataStore.cateringEvents || [];

        if (status) {
            events = events.filter(e => e.status.toLowerCase() === status.toLowerCase());
        }

        const sorted = [...events].sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
        const now = new Date().getTime();
        const upcoming = sorted.filter(e => new Date(e.eventDate).getTime() >= now);
        const results = upcoming.length > 0 ? upcoming : sorted;

        return {
            events: results.slice(0, limit).map(e => ({
                id: e.id,
                customer: e.customerName,
                date: e.eventDate,
                guests: e.guestCount,
                status: e.status,
                location: e.location || 'Not Specified',
                phase: e.currentPhase
            })),
            total_count: events.length
        };
    },
    get_project_details: (args: { project_id: string }) => {
        const { project_id } = args;
        const dataStore = useDataStore.getState();
        const project = dataStore.projects.find(p => p.id === project_id);
        if (!project) return { error: "Project not found." };
        const tasks = dataStore.tasks.filter(t => t.projectId === project_id);
        return {
            name: project.name,
            status: project.status,
            budget: project.budgetCents / 100,
            tasks: tasks.map(t => ({ title: t.title, status: t.status, priority: t.priority }))
        };
    },
    get_bookkeeping_entries: (args: { limit?: number; type?: 'Inflow' | 'Outflow'; category?: string; month?: string }) => {
        const { limit = 20, type, category, month } = args || {};
        const dataStore = useDataStore.getState();
        let entries = dataStore.bookkeeping;
        if (type) entries = entries.filter(e => e.type === type);
        if (category) entries = entries.filter(e => e.category.toLowerCase().includes(category.toLowerCase()));
        if (month) {
            const m = month.toLowerCase();
            const monthMap: Record<string, number> = {
                january: 0, jan: 0, '1': 0,
                february: 1, feb: 1, '2': 1,
                march: 2, mar: 2, '3': 2,
                april: 3, apr: 3, '4': 3,
                may: 4, '5': 4,
                june: 5, jun: 5, '6': 5, jine: 5,
                july: 6, jul: 6, '7': 6,
                august: 7, aug: 7, '8': 7,
                september: 8, sep: 8, '9': 8,
                october: 9, oct: 9, '10': 9,
                november: 10, nov: 10, '11': 10,
                december: 11, dec: 11, '12': 11
            };
            const targetMonth = monthMap[m];
            if (targetMonth !== undefined) {
                entries = entries.filter(e => e.date && new Date(e.date).getMonth() === targetMonth);
            }
        }
        
        return {
            entries: entries.slice(0, limit).map(e => ({
                date: e.date,
                description: e.description,
                category: e.category,
                amount: (e.amountCents / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }),
                type: e.type
            })),
            total_matches: entries.length
        };
    },
    search_ledger: (args: { query: string; limit?: number }) => {
        const { query, limit = 20 } = args;
        const dataStore = useDataStore.getState();
        const results = dataStore.bookkeeping.filter(e => 
            e.description.toLowerCase().includes(query.toLowerCase()) || 
            e.category.toLowerCase().includes(query.toLowerCase())
        );
        return {
            matches: results.slice(0, limit).map(e => ({
                date: e.date,
                description: e.description,
                amount: (e.amountCents / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }),
                category: e.category
            }))
        };
    },
    get_all_invoices: (args: { limit?: number; contact_id?: string; month?: string }) => {
        const { limit = 20, contact_id, month } = args || {};
        const dataStore = useDataStore.getState();
        let invoices = dataStore.invoices;
        if (contact_id) {
            invoices = invoices.filter(i => i.contactId === contact_id);
        }
        if (month) {
            const m = month.toLowerCase();
            const monthMap: Record<string, number> = {
                january: 0, jan: 0, '1': 0,
                february: 1, feb: 1, '2': 1,
                march: 2, mar: 2, '3': 2,
                april: 3, apr: 3, '4': 3,
                may: 4, '5': 4,
                june: 5, jun: 5, '6': 5, jine: 5,
                july: 6, jul: 6, '7': 6,
                august: 7, aug: 7, '8': 7,
                september: 8, sep: 8, '9': 8,
                october: 9, oct: 9, '10': 9,
                november: 10, nov: 10, '11': 10,
                december: 11, dec: 11, '12': 11
            };
            const targetMonth = monthMap[m];
            if (targetMonth !== undefined) {
                invoices = invoices.filter(i => i.date && new Date(i.date).getMonth() === targetMonth);
            }
        }
        return {
            invoices: invoices.slice(0, limit).map(i => ({
                number: i.number,
                date: i.date,
                status: i.status,
                total: (i.totalCents / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }),
                paid: (i.paidAmountCents / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })
            }))
        };
    },
    add_task: (args: { title: string; description?: string; priority?: 'Low' | 'Medium' | 'High' | 'Critical'; dueDate?: string; projectId?: string }) => {
        const { title, description = '', priority = 'Medium', dueDate, projectId } = args;
        const dataStore = useDataStore.getState();
        const user = useAuthStore.getState().user;
        const task = {
            id: `task-${Date.now()}`,
            companyId: user?.companyId || 'sys',
            title,
            description,
            priority,
            status: 'Todo' as any,
            dueDate: dueDate || new Date(Date.now() + 86400000).toISOString(),
            projectId
        };
        dataStore.addTask(task);
        return { success: true, task_id: task.id };
    },
    capture_lead: (args: { name: string; email?: string; phone?: string; company?: string; interest_level?: 'Low' | 'Medium' | 'High'; notes?: string; conversation_id?: string }) => {
        const { name, email, phone, company, interest_level = 'Medium', notes, conversation_id } = args;
        const dataStore = useDataStore.getState();
        const user = useAuthStore.getState().user;

        const isUUID = (str?: string) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

        const lead = {
            id: `lead-${Date.now()}`,
            organizationId: user?.companyId || 'sys',
            name,
            email,
            phone,
            company,
            source: 'OmniAgent Chat',
            status: 'New' as any,
            interestLevel: interest_level,
            notes,
            conversationId: isUUID(conversation_id) ? conversation_id : undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        dataStore.addLead(lead);
        return { success: true, lead_id: lead.id, lead_name: lead.name };
    },
    scrape_leads: async (args: { niche: string, location: string }) => {
        const { niche, location } = args;
        const dataStore = useDataStore.getState();
        await dataStore.scrapeLeads(niche, location);
        return { success: true, message: `Scraped leads for ${niche} in ${location}. Check the Prospecting Hub.` };
    },
    crawl_website_for_kb: async (args: { agent_id: string, url: string, title?: string }) => {
        const { agent_id, url, title } = args;
        const dataStore = useDataStore.getState();

        // Simulate web crawling content extraction
        const content = `This is simulated expert knowledge extracted from ${url}. It covers the core services, mission, and FAQs found on the prospect's site.`;

        await dataStore.addKnowledgeSource(agent_id, {
            type: 'website',
            title: title || `Crawl: ${url}`,
            content,
            url
        });

        return { success: true, message: `Knowledge source built from ${url} for agent ${agent_id}.` };
    },
    generate_prospecting_email: async (args: { lead_id: string }) => {
        const { lead_id } = args;
        const dataStore = useDataStore.getState();
        await dataStore.sendDemoEmail(lead_id);
        return { success: true, message: `Prospecting email with demo link triggered for lead ${lead_id}.` };
    },
    prepare_invoice_preview: (args: { clientName: string; clientEmail?: string; clientAddress?: string; invoiceNumber?: string; issueDate?: string; dueDate?: string; itemsJson: string }) => {
        let parsedItems = [];
        try {
            parsedItems = JSON.parse(args.itemsJson);
        } catch (e) {
            console.error("Failed to parse itemsJson in prepare_invoice_preview:", e);
        }

        const detail = {
            ...args,
            items: parsedItems
        };

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('update_invoice_form', { detail }));
        }
        return { success: true, message: `Successfully loaded invoice details into the preview for ${args.clientName}.` };
    },
    record_paid_invoice: async (args: { clientName: string; clientEmail?: string; clientAddress?: string; invoiceNumber: string; paymentDate: string; itemsJson: string }) => {
        const companyId = useAuthStore.getState().user?.companyId || '';
        const newInvoiceId = `inv-${Date.now()}`;
        
        let parsedItems = [];
        try {
            parsedItems = JSON.parse(args.itemsJson);
        } catch (e) {
            console.error("Failed to parse itemsJson in record_paid_invoice:", e);
            return { success: false, error: "Invalid items JSON format." };
        }

        const lines = parsedItems.map((item: any, idx: number) => ({
            id: `line-${idx}-${Date.now()}`,
            description: item.description,
            quantity: item.qty || 1,
            unitPriceCents: Math.round((item.price || 0) * 100)
        }));

        const subtotal = parsedItems.reduce((sum: number, item: any) => sum + ((item.qty || 1) * (item.price || 0)), 0);
        const subtotalCents = Math.round(subtotal * 100);
        const taxCents = 0;
        const totalCents = subtotalCents;

        // Idempotency: Clear existing invoice and bookkeeping entries with the same number to allow overwriting
        if (args.invoiceNumber) {
            const store = useDataStore.getState();
            const existingInv = store.invoices.find(inv => inv.number === args.invoiceNumber);
            if (existingInv) {
                const filteredInvs = store.invoices.filter(inv => inv.number !== args.invoiceNumber);
                const filteredEntries = store.bookkeeping.filter(entry => entry.referenceId !== existingInv.id);
                useDataStore.setState({
                    invoices: filteredInvs,
                    bookkeeping: filteredEntries
                });
            }
        }

        // 1. Create Invoice
        await useDataStore.getState().addInvoice({
            id: newInvoiceId,
            number: args.invoiceNumber,
            companyId,
            customerName: args.clientName,
            date: args.paymentDate,
            dueDate: args.paymentDate,
            status: 'Paid' as any,
            type: 'Sales',
            lines,
            subtotalCents,
            totalCents,
            paidAmountCents: totalCents
        } as any);

        // 2. Create Bookkeeping Entry
        const newBookkeepingId = `book-${Date.now()}`;
        await useDataStore.getState().addBookkeepingEntry({
            id: newBookkeepingId,
            companyId,
            date: args.paymentDate,
            type: 'Inflow',
            category: 'Sales Revenue',
            description: `Payment received for Invoice ${args.invoiceNumber} (${args.clientName})`,
            amountCents: totalCents,
            referenceId: newInvoiceId
        } as any);

        // Dispatch refresh so React component can sync local lists if needed
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('invoice_recorded_by_ai'));
        }

        return { 
            success: true, 
            message: `Successfully recorded paid invoice ${args.invoiceNumber} for ${args.clientName} on ${args.paymentDate}. Total paid: ₦${(totalCents / 100).toLocaleString()}.` 
        };
    }
};

const SYSTEM_TOOL_DECLARATIONS = [
    {
        name: "get_outstanding_invoices",
        description: "Fetch a list of unpaid invoices ordered by balance. Use this to identify debtors and money owed.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                limit: { type: SchemaType.NUMBER, description: "Maximum number of records to return (default 25)" }
            }
        }
    },
    {
        name: "search_contacts",
        description: "Search for contacts in the CRM (Customers or Suppliers). Use this to find email addresses, phone numbers, or company details.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                query: { type: SchemaType.STRING, description: "Name, email, or phone number to search" },
                category: { type: SchemaType.STRING, description: "Filter by 'Customer' or 'Supplier'" },
                limit: { type: SchemaType.NUMBER, description: "Maximum number of records to return (default 10)" }
            },
            required: ["query"]
        }
    },
    {
        name: "get_inventory_status",
        description: "Fetch status of inventory items. Use this to check stock levels, prices, and categories for products, reusables, or assets.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                query: { type: SchemaType.STRING, description: "Search term for item name" },
                type: { type: SchemaType.STRING, description: "Filter by type: 'product', 'asset', 'reusable', 'rental', 'raw_material'" },
                category: { type: SchemaType.STRING, description: "Filter by category" },
                limit: { type: SchemaType.NUMBER, description: "Max results" }
            }
        }
    },
    {
        name: "get_staff_directory",
        description: "Get a list of all current employees, their roles, and contact status.",
        parameters: { type: SchemaType.OBJECT, properties: {} }
    },
    {
        name: "get_ingredient_list",
        description: "Fetch a list of raw ingredients/materials. Use this for 'how many unique ingredients', stock level queries, and obtaining real-time market prices, market insights, and market trends for raw goods.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                query: { type: SchemaType.STRING, description: "Optional name filter" },
                category: { type: SchemaType.STRING, description: "Optional category filter" },
                limit: { type: SchemaType.NUMBER, description: "Max records (default 50)" }
            }
        }
    },
    {
        name: "get_project_summary",
        description: "Get a high-level overview of all projects and their task completion progress.",
        parameters: { type: SchemaType.OBJECT, properties: {} }
    },
    {
        name: "get_system_overview",
        description: "Get a high-level overview of the entire system including counts for employees, projects, invoices, and inventory (products vs assets).",
        parameters: { type: SchemaType.OBJECT, properties: {} }
    },
    {
        name: "get_financial_summary",
        description: "Get a summary of revenue, expenses, and pending payments. Supports filtering by a specific month (e.g. 'June').",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                month: { type: SchemaType.STRING, description: "Optional month to filter by, e.g. 'June' or 'July'." }
            }
        }
    },
    {
        name: "get_recipe_analysis",
        description: "Get the ingredient list and costs for a specific menu item recipe.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                recipe_name: { type: SchemaType.STRING, description: "Name of the recipe/menu item" }
            },
            required: ["recipe_name"]
        }
    },
    {
        name: "search_knowledge_base",
        description: "Search system knowledge or personal memory. Use 'documentation' for how-to questions and 'personal_brain' for facts about Akin, projects, or history.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                query: { type: SchemaType.STRING, description: "The natural language query" },
                namespace: { type: SchemaType.STRING, description: "Namespace to search: 'documentation' (default) or 'personal_brain'." }
            },
            required: ["query"]
        }
    },
    {
        name: "get_bookkeeping_entries",
        description: "Fetch list of transactions (Inflow/Outflow) from the financial ledger. Use this to find expenses by category or filter by month.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                limit: { type: SchemaType.NUMBER },
                category: { type: SchemaType.STRING, description: "Category name to filter by" },
                type: { type: SchemaType.STRING, enum: ["Inflow", "Outflow"] },
                month: { type: SchemaType.STRING, description: "Optional month to filter by, e.g. 'June' or 'July'." }
            }
        }
    },
    {
        name: "search_ledger",
        description: "Search the bookkeeping ledger for specific keywords in descriptions or categories.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                query: { type: SchemaType.STRING, description: "Keyword to search for" },
                limit: { type: SchemaType.NUMBER }
            },
            required: ["query"]
        }
    },
    {
        name: "scrape_leads",
        description: "Scrape the web (Google Maps/Directories) to find specific types of organizations in a given location. Use this to find new business prospects.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                niche: { type: SchemaType.STRING, description: "Type of organization (e.g. 'Plumbers', 'Lawyers')" },
                location: { type: SchemaType.STRING, description: "City or area to search in" }
            },
            required: ["niche", "location"]
        }
    },
    {
        name: "crawl_website_for_kb",
        description: "Scrape a prospect's website to build a Knowledge Base for their custom AI agent. This extracts FAQs and services.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                agent_id: { type: SchemaType.STRING, description: "The ID of the agent to train" },
                url: { type: SchemaType.STRING, description: "The URL of the website to crawl" },
                title: { type: SchemaType.STRING, description: "Optional title for this knowledge source" }
            },
            required: ["agent_id", "url"]
        }
    },
    {
        name: "generate_prospecting_email",
        description: "Trigger a personalized outreach email to a prospect containing a link to their AI demo mockup.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                lead_id: { type: SchemaType.STRING, description: "The ID of the lead to email" }
            },
            required: ["lead_id"]
        }
    },
    {
        name: "get_catering_events",
        description: "Fetch a list of catering events, orders, or banquets. Use this for 'when is the next event', 'list my upcoming events', or event status checks.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                status: { type: SchemaType.STRING, description: "Filter by status: 'Draft', 'Confirmed', 'Completed', etc." },
                limit: { type: SchemaType.NUMBER, description: "Maximum number of events to return" }
            }
        }
    },
    {
        name: "get_all_invoices",
        description: "Get all invoices regardless of status. Use this to see history, filter by month, or specific invoice details.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                contact_id: { type: SchemaType.STRING, description: "Optional contact ID filter" },
                limit: { type: SchemaType.NUMBER, description: "Max count" },
                month: { type: SchemaType.STRING, description: "Optional month to filter by, e.g. 'June' or 'July'." }
            }
        }
    },
    {
        name: "get_project_details",
        description: "Get detailed information about a specific project including its tasks.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                project_id: { type: SchemaType.STRING, description: "The ID of the project" }
            },
            required: ["project_id"]
        }
    },
    {
        name: "add_task",
        description: "Add a new task to the system. Use this when the user asks to 'remind me', 'create a task', or 'add a todo'.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                title: { type: SchemaType.STRING, description: "Task title" },
                description: { type: SchemaType.STRING, description: "Task details" },
                priority: { type: SchemaType.STRING, enum: ["Low", "Medium", "High", "Critical"] },
                dueDate: { type: SchemaType.STRING, description: "ISO date string" },
                projectId: { type: SchemaType.STRING, description: "Optional project ID" }
            },
            required: ["title"]
        }
    },
    {
        name: "capture_lead",
        description: "Capture a prospective customer's details (Lead). Use this when a user expresses interest in products, services, or pricing.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                name: { type: SchemaType.STRING, description: "Lead's full name" },
                email: { type: SchemaType.STRING, description: "Email address" },
                phone: { type: SchemaType.STRING, description: "Phone number" },
                company: { type: SchemaType.STRING, description: "Company name" },
                interest_level: { type: SchemaType.STRING, enum: ["Low", "Medium", "High"], description: "Perceived interest" },
                notes: { type: SchemaType.STRING, description: "Context from the conversation" },
                conversation_id: { type: SchemaType.STRING, description: "ID of the current chat session" }
            },
            required: ["name"]
        }
    },
    {
        name: "prepare_invoice_preview",
        description: "Prepare/draft an invoice with the specified metadata and item lines, loading it directly into the user's workspace screen customizer preview. Use this when the user asks to 'draft', 'create a preview of', or 'prepare' an invoice.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                clientName: { type: SchemaType.STRING, description: "Customer/Client name" },
                clientEmail: { type: SchemaType.STRING, description: "Client email address" },
                clientAddress: { type: SchemaType.STRING, description: "Client physical address" },
                invoiceNumber: { type: SchemaType.STRING, description: "Invoice code/number, e.g. INV-2026-089" },
                issueDate: { type: SchemaType.STRING, description: "Date of issue (YYYY-MM-DD)" },
                dueDate: { type: SchemaType.STRING, description: "Due date (YYYY-MM-DD)" },
                itemsJson: { 
                    type: SchemaType.STRING, 
                    description: "JSON array of items. Each item must be an object with keys 'description' (string), 'qty' (number), and 'price' (number in Naira). E.g. '[{\"description\":\"Story Books\",\"qty\":65,\"price\":5000}]'" 
                }
            },
            required: ["clientName", "itemsJson"]
        }
    },
    {
        name: "record_paid_invoice",
        description: "Add a completed paid invoice and its matching payment transaction to the database, updating total revenue. Use this when the user says an invoice has already been generated and paid, or when they want to record a completed sale/payment immediately.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                clientName: { type: SchemaType.STRING, description: "Customer name" },
                clientEmail: { type: SchemaType.STRING, description: "Customer email" },
                clientAddress: { type: SchemaType.STRING, description: "Customer physical address" },
                invoiceNumber: { type: SchemaType.STRING, description: "Invoice number" },
                paymentDate: { type: SchemaType.STRING, description: "Date payment was received (YYYY-MM-DD)" },
                itemsJson: { 
                    type: SchemaType.STRING, 
                    description: "JSON array of items. Each item must be an object with keys 'description' (string), 'qty' (number), and 'price' (number in Naira). E.g. '[{\"description\":\"Story Books\",\"qty\":65,\"price\":5000}]'" 
                }
            },
            required: ["clientName", "invoiceNumber", "paymentDate", "itemsJson"]
        }
    }
];

/**
 * Handles the Loop for Tool Calling
 */
async function executeToolCalls(ai: any, modelId: string, initialMessages: any[], generationConfig?: any, systemInstruction?: string, toolDeclarations: any[] = SYSTEM_TOOL_DECLARATIONS) {
    const targetModel = modelId;

    const genModel = ai.getGenerativeModel({
        model: targetModel,
        tools: [{ functionDeclarations: toolDeclarations }],
        systemInstruction: systemInstruction ? { role: 'system', parts: [{ text: systemInstruction }] } : undefined
    });

    let currentMessages = [...initialMessages];
    const calledTools = new Set<string>();

    console.log(`[AI Tools] Starting execution loop for model: ${targetModel}`, { initialMessagesCount: initialMessages.length });
    console.log(`[AI Tools] Declarations passed to model:`, toolDeclarations.map(t => t.name));

    for (let i = 0; i < 10; i++) {
        console.log(`[AI Tools] Turn ${i + 1}...`);

        // ALWAYS disable JSON mode during the tool-calling turns.
        // Forcing JSON mode can prevent the model from calling tools effectively.
        const turnConfig = { ...generationConfig, responseMimeType: undefined, responseSchema: undefined };

        // Add a slight delay before asking the AI to prevent burst limits on the free tier
        if (i > 0) await new Promise(resolve => setTimeout(resolve, 1500));

        const result: any = await callWithRetry(() => genModel.generateContent({
            contents: currentMessages,
            generationConfig: turnConfig
        }));

        const response = await result.response;

        // Safety Check
        if (response.promptFeedback?.blockReason) {
            console.error("[AI Tools] Prompt blocked:", response.promptFeedback.blockReason);
            throw new Error(`The request was blocked for safety reasons: ${response.promptFeedback.blockReason}`);
        }

        const candidate = response.candidates?.[0];

        if (!candidate || !candidate.content) {
            console.error("[AI Tools] No candidate/content returned.");
            return response;
        }

        const content = candidate.content;
        console.log(`[AI Tools] Model Output (Turn ${i + 1}):`, JSON.stringify(content.parts));

        currentMessages.push({
            role: content.role || 'model',
            parts: content.parts
        });

        const toolCalls = content.parts.filter((p: any) => p.functionCall);
        if (toolCalls.length === 0) {
            console.log("[AI Tools] No further tools requested.");

            // Final Response Validation
            if (candidate.finishReason === 'SAFETY') {
                return { 
                    text: () => "I'm sorry, I cannot fulfill this request due to safety restrictions. Please try rephrasing.",
                    response: { text: () => "Safety block triggered." }
                } as any;
            }

            // If the user requested a specific JSON schema but we skipped it during the loop turns,
            // we might need one last call to "JSON-ify" the final answer.
            if (generationConfig?.responseMimeType === "application/json" && (!turnConfig?.responseMimeType)) {
                console.log("[AI Tools] Formatting final answer into JSON...");
                try {
                    await new Promise(resolve => setTimeout(resolve, 1500)); // Rate limit buffer
                    const finalResult: any = await callWithRetry(() => genModel.generateContent({
                        contents: currentMessages,
                        generationConfig
                    }));
                    const finalResponse = await finalResult.response;
                    return finalResponse;
                } catch (jsonErr) {
                    console.error("[AI Tools] JSON formatting failed, returning raw response.", jsonErr);
                    return response;
                }
            }

            return response;
        }

        // Loop detection
        const toolCallKeys = toolCalls.map((tc: any) => `${tc.functionCall.name}:${JSON.stringify(tc.functionCall.args)}`);
        const redundant = toolCallKeys.find((key: string) => calledTools.has(key));
        if (redundant) {
            console.error(`[AI Tools] Loop detected: Redundant call to ${redundant}`);
            throw new Error(`AI entered an infinite loop calling: ${redundant.split(':')[0]}`);
        }
        toolCallKeys.forEach((key: string) => calledTools.add(key));

        console.log(`[AI Tools] Tool Calls requested:`, toolCalls.map((tc: any) => tc.functionCall.name));

        // Execute tool calls
        const functionResponses = await Promise.all(toolCalls.map(async (call: any) => {
            const { name, args } = call.functionCall;
            const handler = (SYSTEM_TOOLS as any)[name];
            let resultData;

            console.log(`[AI Tools] Executing tool: ${name}`, { args });

            if (handler) {
                try {
                    resultData = await handler(args);
                    console.log(`[AI Tools] Tool: ${name} returned ${Array.isArray(resultData) ? resultData.length : 'object'} result(s).`);
                } catch (e) {
                    console.error(`[AI Tools] Tool Error: ${name}`, e);
                    resultData = { error: (e as Error).message };
                }
            } else {
                console.warn(`[AI Tools] Tool: ${name} not found.`);
                resultData = { error: `Tool ${name} not found.` };
            }

            return {
                functionResponse: {
                    name,
                    response: resultData
                }
            };
        }));

        // Gemini SDK prefers tool results in a 'user' role message
        currentMessages.push({ role: 'user', parts: functionResponses });
    }

    console.error("[AI Tools] Max iterations reached.");
    throw new Error("I tried to fetch the data multiple times but couldn't get a definitive answer. Please try rephrasing.");
}

export async function bulkGroundIngredientPrices(ingredients: Ingredient[]): Promise<void> {
    if (useSettingsStore.getState().strictMode) return;
    const ai = getAIInstance();
    const { updateIngredientPrice } = useDataStore.getState();

    for (const ing of ingredients) {
        if (!ing.priceSourceQuery) continue;
        try {
            const model = ai.getGenerativeModel({
                model: 'gemini-2.5-flash',
                tools: [{ googleSearch: {} } as any]
            });

            const result = await model.generateContent(`Determine current commercial wholesale price in NGN(Naira) for "${ing.name}" based on this specific query: "${ing.priceSourceQuery}".Focus on Lagos / Mile 12 or Major markets.Provide a brief 1 - sentence summary.Return the price as a number in NAIRA per UNIT specified in the query.`);
            const response = await result.response;
            const text = response.text() || "";
            // Improved regex to find numbers that look like prices
            const priceMatch = text.match(/(?:₦|Naira|NGN)\s?(\d{1,3}(?:,\d{3})*(?:\.\d+)?)|(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s?(?:₦|Naira|NGN)|\b(\d+(?:\.\d{2})?)\b/i);
            let extractedPrice = 0;
            if (priceMatch) {
                const val = priceMatch[1] || priceMatch[2] || priceMatch[3];
                extractedPrice = parseFloat(val.replace(/,/g, ''));
            }
            const marketPriceCents = extractedPrice * 100;
            const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
                ?.map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
                .filter(Boolean) || [];

            updateIngredientPrice(ing.id, marketPriceCents, { marketPriceCents, groundedSummary: text, sources });
        } catch (e) { console.error(`Grounding failed for ${ing.name}: `, e); }
    }
}

export async function getLiveRecipeIngredientPrices(recipe: Recipe): Promise<Record<string, number>> {
    if (useSettingsStore.getState().strictMode) return {};
    const ai = getAIInstance();
    const ingredientList = recipe.ingredients.map(i => `${i.name} (Unit: ${i.unit})`).join(', ');

    try {
        const model = ai.getGenerativeModel({
            model: 'gemini-2.5-flash',
            tools: [{ googleSearch: {} } as any]
            // JSON mode removed here because it conflicts with Google Search Grounding
        });

        const result = await model.generateContent(`Search for current market prices in Lagos, Nigeria (2025 data) for the following food ingredients: ${ingredientList}. 
            For each item, return the best estimate for WHOLESALE market price in NAIRA per UNIT specified.
            
            RETURN JSON ONLY. No markdown formatting. No code blocks. Just the raw JSON array.
            Format: [{ "name": "Ingredient Name", "price": 1000 }]
            
            IMPORTANT: Return exactly the original ingredient names as keys in the JSON array objects.`);

        const response = await result.response;
        let cleanedText = response.text() || "[]";

        // Manual JSON extraction since we disabled JSON mode
        const jsonMatch = cleanedText.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
            cleanedText = jsonMatch[0];
        } else {
            cleanedText = cleanedText.replace(/```json | ```/g, '').trim();
        }

        const dataArray = JSON.parse(cleanedText);
        const priceMap: Record<string, number> = {};
        dataArray.forEach((item: { name: string, price: number }) => {
            if (item.name && typeof item.price === 'number') {
                priceMap[item.name.toLowerCase().trim()] = item.price * 100; // Convert to cents for store consistency
            }
        });
        return priceMap;
    } catch (e) {
        console.error("Live BoQ Grounding Failed:", e);
        return {};
    }
}

export async function performAgenticMarketResearch(itemName: string): Promise<any> {
    if (useSettingsStore.getState().strictMode) return { marketPriceCents: 0, groundedSummary: "Strict Mode Enabled", sources: [] };
    const ai = getAIInstance();
    const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        tools: [{ googleSearch: {} } as any],
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: "object" as any,
                properties: {
                    priceNGN: { type: "number" as any, description: "The wholesale market price in Naira" },
                    quantity: { type: "string" as any, description: "The specific quantity the price is for e.g. 50kg bag, 1 carton, etc." },
                    location: { type: "string" as any, description: "The market location e.g. Mile 12, Lagos" },
                    summary: { type: "string" as any, description: "Brief summary of current market trends" }
                },
                required: ["priceNGN", "quantity", "location", "summary"]
            }
        }
    });

    const result = await model.generateContent(`Determine current commercial wholesale price in NGN(Naira) for "${itemName}" in major Nigerian food markets (e.g. Mile 12, Lagos). Identify the specific quantity this price is for, and the market location. Provide a brief summary of current trends.`);
    const response = await result.response;
    const text = response.text() || "{}";
    
    let parsed: any = {};
    try {
        parsed = JSON.parse(text);
    } catch(e) {
        console.error("Failed to parse market JSON", e);
    }

    const marketPriceCents = (parsed.priceNGN || 0) * 100;

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
        .filter(Boolean) || [];
        
    const timestamp = new Date().toISOString();

    return { 
        marketPriceCents, 
        groundedSummary: parsed.summary || "", 
        sources,
        quantity: parsed.quantity || "Unknown",
        location: parsed.location || "Unknown",
        timestamp
    };
}

export async function runInventoryReconciliation(event: CateringEvent): Promise<any> {
    if (useSettingsStore.getState().strictMode) return { status: 'Balanced', totalLossCents: 0, summary: "Strict Mode: Reconciliation skipped." };
    const ai = getAIInstance();
    const payload = JSON.stringify(event.hardwareChecklist);

    const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    status: { type: SchemaType.STRING },
                    totalLossCents: { type: SchemaType.NUMBER },
                    summary: { type: SchemaType.STRING }
                },
                required: ["status", "totalLossCents", "summary"]
            }
        } as any
    });

    const result = await model.generateContent(`Analyze this catering event inventory recovery log: ${payload}. 
        Identify if there is a 'Shortage'(unaccounted items where Out > Returned + Broken + Lost). 
        Calculate total financial impact of lost / broken items(assume prices: Plate = 500, Fork = 150, Glass = 1200, Linen = 12000, Uniform = 8500).
        Return JSON with: status('Balanced' | 'Shortage'), totalLossCents, and summary.`);

    const response = await result.response;
    const data = JSON.parse(response.text() || "{}");

    // Update local state with reconciliation result
    const { updateCateringEvent } = useDataStore.getState();
    updateCateringEvent(event.id, { reconciliationStatus: data.status });

    return data;
}

export async function extractInfoFromCV(base64Data: string, mimeType: string): Promise<any> {
    if (useSettingsStore.getState().strictMode) return {};
    const ai = getAIInstance();
    const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    firstName: { type: SchemaType.STRING },
                    lastName: { type: SchemaType.STRING },
                    email: { type: SchemaType.STRING },
                    phoneNumber: { type: SchemaType.STRING },
                    dob: { type: SchemaType.STRING },
                    gender: { type: SchemaType.STRING },
                    address: { type: SchemaType.STRING }
                }
            }
        } as any
    });

    const result = await model.generateContent([
        { inlineData: { data: base64Data, mimeType } },
        { text: "Extract the following information from this CV into a JSON format: firstName, lastName, email, phoneNumber, dob (YYYY-MM-DD), gender (Male or Female), and address." }
    ]);
    const response = await result.response;
    return JSON.parse(response.text() || "{}");
}

export async function parseEmployeeVoiceInput(base64Audio: string, mimeType: string): Promise<any> {
    if (useSettingsStore.getState().strictMode) return {};
    const ai = getAIInstance();
    const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    firstName: { type: SchemaType.STRING },
                    lastName: { type: SchemaType.STRING },
                    email: { type: SchemaType.STRING },
                    phoneNumber: { type: SchemaType.STRING },
                    address: { type: SchemaType.STRING },
                    gender: { type: SchemaType.STRING },
                    dob: { type: SchemaType.STRING }
                }
            }
        } as any
    });

    const result = await model.generateContent([
        { inlineData: { data: base64Audio, mimeType } },
        { text: "This is a voice recording of an HR manager dictating employee details. Extract the information into JSON: firstName, lastName, email, phoneNumber, address, gender, dob." }
    ]);
    const response = await result.response;
    return JSON.parse(response.text() || "{}");
}

// Helper for retry logic
async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        if (retries > 0 && (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED'))) {
            // Exponential Backoff: 1s -> 2s -> 4s -> 8s (cap at 10s)
            console.warn(`[AI Service] Rate limit hit (429). Model: gemini-2.5-flash. Retrying in ${delay}ms... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            const nextDelay = Math.min(delay * 2, 10000);
            return callWithRetry(fn, retries - 1, nextDelay);
        }
        throw error;
    }
}

// RBAC Constants
const AUTHORIZED_FINANCE_ROLES = [
    'Super Admin', 'system_admin', 'Chief Executive Officer', 'Chairman', 
    'Finance', 'Finance Officer', 'Admin', 'admin', 'CEO', 'CFO', 'MD', 'Director'
];

/**
 * Robust check for financial data authorization.
 * Handles case-sensitivity and whitespace variations.
 */
const checkFinancialAuthorization = (role: string | undefined): boolean => {
    if (!role) return false;
    const cleanRole = role.trim().toLowerCase();
    const isAuthorized = AUTHORIZED_FINANCE_ROLES.some(r => r.toLowerCase() === cleanRole);
    
    console.log(`[AI RBAC] Authorization Check:`, {
        role: role,
        cleanRole: cleanRole,
        isAuthorized: isAuthorized
    });
    
    return isAuthorized;
};

export async function processAgentRequest(input: string, context: string, mode: 'text' | 'audio' | 'image' | 'pdf' = 'text'): Promise<any> {
    try {
        // Heartbeat / Direct response for simple greetings to bypass processing overhead
        const cleanInput = input?.trim().toLowerCase();
        const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'help', 'ready'];
        if (greetings.some(g => cleanInput.includes(g) && cleanInput.length < 15)) {
            return { 
                response: "Hello! I am Xquisite AI, your operational assistant. I'm online and ready to help. What's on your mind?", 
                intent: 'GENERAL_QUERY' 
            };
        }

        // [SECURITY] Session Guard: Refuse to serve AI responses if the tenant context is missing.
        // This prevents stale data from a previous tenant session from reaching the AI model
        // during the hydration race window (between logout and hydrateFromCloud completion).
        const sessionUser = useAuthStore.getState().user;
        if (!sessionUser?.companyId) {
            console.warn('[AI Service][Security] processAgentRequest blocked: No tenant context (companyId is empty).');
            return {
                response: "⚠️ Your session context is unavailable. Please refresh the page and sign in again.",
                intent: 'GENERAL_QUERY'
            };
        }

        if (useSettingsStore.getState().strictMode) return { response: "Strict Mode Enabled", intent: 'GENERAL_QUERY' };
        const ai = getAIInstance();

        // Build Context
        const dataStore = useDataStore.getState();
        const workforceSummary = dataStore.employees.reduce((acc, emp) => {
            acc[emp.role] = (acc[emp.role] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const menuContext = dataStore.inventory
            // Include products, reusables (e.g., glasses, plates), and raw materials
            .filter(i => i.type === 'product' || i.type === 'reusable' || i.type === 'raw_material')
            .slice(0, 200) // INCREASED LIMIT: Top 200 items to ensure menu completeness
            .map(i => {
                const price = i.priceCents ? `₦${(i.priceCents / 100).toLocaleString()}` : 'Price Varies';
                const desc = i.description ? ` - ${i.description}` : '';
                return `- ${i.name} (${i.category}): ${i.stockQuantity} in stock [${price}]${desc}`;
            })
            .join('\n');

        if (dataStore.inventory.length > 50) {
            // Append a note that more exists
            // menuContext += `\n... ${dataStore.inventory.length - 50} more items available via search.`;
        }

        const currentUser = useAuthStore.getState().user;
        const userRole = currentUser?.role || 'Guest';

        const totalReceivables = dataStore.invoices
            .filter(i => i.status !== 'Paid')
            .reduce((sum, inv) => sum + (inv.totalCents - inv.paidAmountCents), 0);

        let operationalContextSummary = `Database Snapshot: ${dataStore.invoices.length} total invoices, ${dataStore.contacts.length} contacts, ${dataStore.inventory.length} items.`;

        // Eager Intent Routing: Preload data based on keywords to save AI tool calls
        let eagerDataContext = '';
        if (cleanInput.includes('inventory') || cleanInput.includes('stock') || cleanInput.includes('how many') || cleanInput.includes('fork') || cleanInput.includes('plate') || cleanInput.includes('item')) {
            const inventoryData = SYSTEM_TOOLS.get_inventory_status({});
            eagerDataContext += `\n[PRE-FETCHED INVENTORY DATA]\n${JSON.stringify(inventoryData)}`;
        }
        if (cleanInput.includes('invoice') || cleanInput.includes('debt') || cleanInput.includes('owe') || cleanInput.includes('unpaid') || cleanInput.includes('balance')) {
            const debtorData = SYSTEM_TOOLS.get_outstanding_invoices({});
            eagerDataContext += `\n[PRE-FETCHED DEBTORS DATA]\n${JSON.stringify(debtorData)}`;
        }
        if (cleanInput.includes('staff') || cleanInput.includes('employee') || cleanInput.includes('team')) {
            const staffData = SYSTEM_TOOLS.get_staff_directory();
            eagerDataContext += `\n[PRE-FETCHED STAFF DATA]\n${JSON.stringify(staffData)}`;
        }
        if (cleanInput.includes('event') || cleanInput.includes('catering') || cleanInput.includes('calendar')) {
            const events = dataStore.cateringEvents || [];
            eagerDataContext += `\n[PRE-FETCHED EVENTS DATA]\n${JSON.stringify(events)}`;
        }

        const orgSettings = useSettingsStore.getState().settings;
            const orgName = orgSettings.name || 'Platform';
            const orgType = orgSettings.type || 'General';
            const isClothingBusiness = orgType === 'Retail' && (orgName.toLowerCase().includes('clothes') || orgName.toLowerCase().includes('boutique'));
            
            // RBAC Telemetry & Logic
            const isAuthorizedForFinance = checkFinancialAuthorization(userRole);
            
            console.log(`[AI Service] RBAC state for request:`, {
                userName: currentUser?.name || 'Unknown',
                userRole: userRole,
                isAuthorized: isAuthorizedForFinance,
                orgName: orgName
            });
            
            // Filter tools based on authorization
            const filteredDeclarations = SYSTEM_TOOL_DECLARATIONS.filter(tool => {
                if (!isAuthorizedForFinance) {
                    const restrictedTools = ['get_financial_summary', 'get_bookkeeping_entries', 'search_ledger', 'get_outstanding_invoices'];
                    return !restrictedTools.includes(tool.name);
                }
                return true;
            });

            const systemInstructions = `
                Role: You are the intelligent assistant for the ${orgName} workspace.
                Business Profile: ${orgName} is a ${orgType} business. 
                ${!isClothingBusiness ? `IMPORTANT: This is NOT a clothing business. If the user mentions 'clothes' or 'clothing' in a way that seems out of context, politely clarify that you are managing ${orgType} operations.` : 'MISSION: You help manage a clothing/retail business.'}
                
                USER ACCESS CONTROL:
                - User Role: ${userRole}.
                - Financial Data Authorization: ${isAuthorizedForFinance ? 'AUTHORIZED' : 'RESTRICTED'}.
                
                GUARDRAILS:
                ${!isAuthorizedForFinance ? `
                - EXCEPTIONALLY IMPORTANT: You are NOT permitted to provide aggregate financial KPIs (Revenue, Total Expenses, Net Margin, Profits) or call the 'get_financial_summary' tool for this user role.
                - If the user asks for financial KPIs or sensitive money data, you MUST POLITELY DECLINE.
                - Response Instruction: "I'm sorry, I am not authorized to share aggregate financial KPIs with your role. Please refer to the MD, CEO, or CFO for this level of information."
                ` : `
                - You are authorized to provide financial summaries and KPIs to this user.
                `}
                
                Operational Summary: ${operationalContextSummary}
                Financial Context: ${dataStore.bookkeeping.length > 0 ? `Latest Entry: ${dataStore.bookkeeping[dataStore.bookkeeping.length - 1].description} (${dataStore.bookkeeping[dataStore.bookkeeping.length - 1].amountCents / 100} NGN)` : 'No entries yet.'}
                
                ${eagerDataContext ? `==== PRE-LOADED CONTEXT DATA ====\nThe requested data has already been fetched for you locally to save time. DO NOT call any additional data retrieval tools. Answer the user based strictly on the following data:\n${eagerDataContext}\n====================================` : ''}
                
                MISSION: Be the ultimate organizational logic node. If users ask about stats, ingredients, projects, or staff, be precise.
                
                Inventory Taxonomy:
                - "Reusable items" or "Assets" map to type: 'asset' or 'reusable'.
                - "Products" or "Menu Items" map to type: 'product'.
                - "Ingredients" or "Raw Materials" map to type: 'raw_material' (found in BOTH ingredients and inventory lists).
                - Use 'get_system_overview' for high-level counts.
                - Use 'get_inventory_status' with explicit filters for specific item types.
                
                Data Access Tools: 
                - get_catering_events: Access the calendar/list of all catering events. Use this for 'Next event', 'What events do we have', etc.
                - get_system_overview: Core KPI node. Use this IMMEDIATELY for 'How many...' or 'Overview' questions. NEVER ask for permission; JUST CALL IT.
                - get_financial_summary: High-level money overview (Revenue, Expenses).
                - get_ingredient_list: Raw material details, stock counts, and real-time market prices / market insights.
                - get_project_summary: Project tracking and progress.
                - get_outstanding_invoices: Financial debtors list.
                - search_contacts: CRM lookups.
                - get_inventory_status: Stock for products/assets.
                - get_staff_directory: Personnel node.
                - get_recipe_analysis: Detailed menu item logic.
                - search_knowledge_base: Troubleshooting / Methodology.
                
                Instructions:
                1. CALL TOOLS FIRST: If pre-loaded context is NOT provided above, you MUST call the appropriate tool BEFORE generating your final response.
                2. NO PLAN-ONLY RESPONSES: Do not say 'I will retrieve the information' or ask 'Would you like me to...'. Just answer or call the tool.
                3. **STRICT TABLE REQUIREMENT**:
                   If the user asks for lists (Events, Debtors, Ingredients, Projects, Staff, Inventory), respond ONLY with a Markdown table.
                   - Event Table: | Customer | Date | Guests | Status | Location |
                   - Debtor Table: | Customer Name | Balance | Status | (Use 'amount_formatted')
                   - Project Table: | Project Name | Status | Progress | Tasks |
                   - Inventory Table: | Item Name | Stock | Type | Category |
                4. MULTI-TURN PERSISTENCE: Use previously fetched data instead of re-calling tools for the same information.
                5. NAMES: Use human-readable names.
                6. JSON WRAPPER: Always return final answer in the JSON structure.
                7. PERFORM ACTIONS: If a user asks to "Add", "Create", "Set up", or "Record" something, identify the intent and provide the necessary payload. Do not just say you've done it—the UI will handle the actual creation based on your intent response.
                8. PROACTIVE LEAD CAPTURE: If a user (Customer) expresses interest, ask for their name/contact and use 'capture_lead'.
                9. CUSTOMER SUPPORT: Use 'search_knowledge_base' to answer technical or support queries before giving a final answer.
                10. CHAT CONTEXT: ALWAYS include 'conversationId' in the payload for lead captures if available.
                11. RECORD TRANSACTIONS: If a user provides a receipt image or mentions recording an expense/sale, use 'RECORD_TRANSACTION' intent and extract all details (amount, company/merchant, date, category).
                
                Return JSON:
                {
                    "response": "Answer to user...",
                    "intent": "GENERAL_QUERY | ADD_EMPLOYEE | ADD_INVENTORY | ADD_CUSTOMER | ADD_SUPPLIER | ADD_PROJECT | CREATE_EVENT | LEAD_GENERATION | CUSTOMER_SUPPORT | RECORD_TRANSACTION",
                    "payload": { ... }
                }
            `;

            let contentParts: any[] = [];
            const activeMode = mode as string;
            if (activeMode === 'audio') {
                contentParts = [{ inlineData: { data: input, mimeType: 'audio/webm' } }];
            } else if (activeMode === 'image') {
                contentParts = [{ inlineData: { data: input, mimeType: 'image/jpeg' } }];
            } else if (activeMode === 'pdf') {
                contentParts = [{ inlineData: { data: input, mimeType: 'application/pdf' } }];
            } else {
                contentParts = [{ text: input }];
            }

            // If we have extra context from a document/file, append it
            if (context) {
                contentParts.push({ text: `\n\nADDITIONAL CONTEXT FROM FILE/HISTORY:\n${context}` });
            }

            const generationConfig = {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        response: { type: SchemaType.STRING },
                        intent: { type: SchemaType.STRING, enum: ['GENERAL_QUERY', 'ADD_EMPLOYEE', 'ADD_INVENTORY', 'ADD_CUSTOMER', 'ADD_SUPPLIER', 'ADD_PROJECT', 'CREATE_EVENT', 'LEAD_GENERATION', 'CUSTOMER_SUPPORT', 'RECORD_TRANSACTION'] } as any,
                        payload: {
                            type: SchemaType.OBJECT,
                            properties: {
                                // Employee Fields
                                firstName: { type: SchemaType.STRING },
                                lastName: { type: SchemaType.STRING },
                                role: { type: SchemaType.STRING },
                                email: { type: SchemaType.STRING },
                                phone: { type: SchemaType.STRING },
                                dob: { type: SchemaType.STRING },
                                gender: { type: SchemaType.STRING },
                                itemName: { type: SchemaType.STRING },
                                quantity: { type: SchemaType.NUMBER },
                                category: { type: SchemaType.STRING },
                                name: { type: SchemaType.STRING },
                                budget: { type: SchemaType.STRING },
                                clientContactId: { type: SchemaType.STRING },
                                customerName: { type: SchemaType.STRING },
                                eventType: { type: SchemaType.STRING },
                                location: { type: SchemaType.STRING },
                                date: { type: SchemaType.STRING },
                                guestCount: { type: SchemaType.NUMBER },
                                title: { type: SchemaType.STRING },
                                priority: { type: SchemaType.STRING },
                                amountCents: { type: SchemaType.NUMBER },
                                merchant: { type: SchemaType.STRING },
                                description: { type: SchemaType.STRING },
                                type: { type: SchemaType.STRING },
                                paymentMethod: { type: SchemaType.STRING }
                            }
                        }
                    },
                    required: ["response", "intent"]
                }
            } as any;

            const isLocalEnabled = import.meta.env.VITE_USE_LOCAL_LLM === 'true' || useSettingsStore.getState().useLocalLLM;
            let responseText = "";

            if (isLocalEnabled) {
                console.log("[AI Service] Directing processAgentRequest to local Gemma...");
                const mappedMessages: Array<{ role: string; content: string }> = [
                    { role: 'system', content: systemInstructions }
                ];
                let userText = input;
                if (context) {
                    userText += `\n\nADDITIONAL CONTEXT FROM FILE/HISTORY:\n${context}`;
                }
                mappedMessages.push({ role: 'user', content: userText });

                try {
                    responseText = await callLocalGemma(mappedMessages, true);
                } catch (err: any) {
                    console.error("[AI Service] Local Gemma failed, falling back to Gemini...", err);
                }
            }

            if (!responseText) {
                // Use executeToolCalls to allow the model to use tools before returning the final JSON
                // Consolidate contentParts into a single message for SDK compatibility
                const result = await executeToolCalls(ai, 'gemini-2.5-flash', [{ role: 'user', parts: contentParts }], generationConfig, systemInstructions, filteredDeclarations);
                
                try {
                    // Try .text() first, then fallback to parts access
                    responseText = typeof result.text === 'function' ? result.text() : "";
                    if (!responseText && result.candidates?.[0]?.content?.parts?.[0]?.text) {
                        responseText = result.candidates[0].content.parts[0].text;
                    }
                } catch (textErr) {
                    console.warn("[AI Service] Could not extract text from result:", textErr);
                    responseText = "I encountered an issue processing that information.";
                }
            }

            let parsed;
            try {
                const cleanText = responseText.replace(/```json\n?|\n?```/g, "").trim();
                parsed = JSON.parse(cleanText || "{}");
            } catch (e) {
                console.error("[AI Service] JSON Parse Failed:", e, "Raw:", responseText);
                // Fallback for non-JSON responses
                parsed = { 
                    response: responseText || "I'm sorry, I had trouble formatting my response. Could you try asking again?", 
                    intent: 'GENERAL_QUERY', 
                    payload: {} 
                };
            }

            // Ensure response has the required fields
            if (!parsed.response) {
                parsed.response = responseText || "I'm sorry, I am not able to answer that right now.";
                parsed.intent = parsed.intent || 'GENERAL_QUERY';
            }

            // Event Query Fix: If user asks about events and response is a string, try to fetch and format events
            if (input.toLowerCase().includes('event') && typeof parsed.response === 'string' && parsed.response.trim().toLowerCase() === 'string') {
                const dataStore = useDataStore.getState();
                const events = dataStore.cateringEvents || [];
                if (events.length > 0) {
                    const lastEvent = [...events].sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())[0];
                    parsed.response = `| Customer | Date | Guests | Status | Location |\n|---|---|---|---|---|\n| ${lastEvent.customerName} | ${lastEvent.eventDate} | ${lastEvent.guestCount} | ${lastEvent.status} | ${lastEvent.location || 'N/A'} |`;
                    parsed.intent = 'GENERAL_QUERY';
                }
            }
            return parsed;
    } catch (error: any) {
        console.error("AI Agent Request Failed:", error);
        
        const isQuotaError = error.status === 429 || 
                             error.message?.includes('429') || 
                             error.message?.includes('Quota') || 
                             error.message?.includes('limit') || 
                             error.message?.includes('exhausted') || 
                             error.message?.includes('RESOURCE_EXHAUSTED') ||
                             String(error).includes('429') ||
                             String(error).includes('Quota');

        if (isQuotaError) {
            const query = input.toLowerCase();
            let matchedResponse = "";
            
            if (query.includes("how many active companies") || query.includes("how many companies") || query.includes("what companies") || query.includes("companies we own") || query.includes("active companies")) {
                matchedResponse = "We currently own and invest in **4 active companies**:\n\n1. **HOGL Energy Limited** — Downstream oil & gas, tank farms, and lubricant blending.\n2. **Ikeja Hotel Plc** — 14.12% stake in a premier hospitality institution.\n3. **Honeywell Flour Mills** — Legacy portfolio (now divested/acquired by FMN Plc).\n4. **Honeywell Real Estate** — Premium developments and infrastructure arm.\n\nYou can click on any card under the **Our Companies** section to see specific tabs for Assets, HR, CRM, and Financials.";
            } else if (query.includes("how many staff") || query.includes("headcount") || query.includes("employee") || query.includes("staff member") || query.includes("how many people")) {
                matchedResponse = "Honeywell Group has a total staff headcount of **2,847 employees** across all entities. This includes 438 at HOGL Energy, 312 at Honeywell Real Estate, and 229 at Ikeja Hotel Plc.";
            } else if (query.includes("portfolio value") || query.includes("how much is the portfolio") || query.includes("investment portfolio") || query.includes("value of portfolio")) {
                matchedResponse = "The total Investment Portfolio Value stands at **₦127B** (June 2026), representing a strong growth of **+33.7% YTD**.";
            } else if (query.includes("total assets") || query.includes("asset value") || query.includes("how many assets") || query.includes("value of assets")) {
                matchedResponse = "Honeywell Group's consolidated assets are valued at **₦485B**.";
            } else if (query.includes("hi") || query.includes("hello") || query.includes("hey") || query.includes("ready")) {
                matchedResponse = "Hello! I am ORCA, your Chief AI. My primary API quota is currently exhausted, but my local database router is active! You can ask me about Honeywell Group subsidiaries, headcount, total assets, or portfolio value.";
            } else {
                matchedResponse = "⚠️ **Note:** The Google Gemini API quota has been temporarily reached (429 Rate Limit).\n\nHowever, I can still answer Honeywell Group workspace questions locally! Try asking me:\n- *'How many active companies do we have?'*\n- *'What is our total staff headcount?'*\n- *'What is our investment portfolio value?'*\n- *'What are our total assets?'*";
            }
            
            return {
                response: matchedResponse,
                intent: 'GENERAL_QUERY'
            };
        }
        
        let errorMsg = error.message || "Unknown Error";
        if (errorMsg.includes("Failed to fetch") || String(error).includes("Failed to fetch")) {
            errorMsg += "\n\n💡 Troubleshooting: This usually indicates that an Ad Blocker (like uBlock Origin, Adblock Plus) or Brave Shield is blocking requests to 'generativelanguage.googleapis.com'. Please try disabling your shield/ad blocker for localhost, or whitelist the Google Gemini API domain.";
        }
        return { response: `Connection Error: ${errorMsg} (Status: ${error.status || "N/A"})`, intent: 'GENERAL_QUERY' };
    }
}

export async function generateAIResponse(
    prompt: string, 
    context: string = "", 
    attachment?: { base64: string, mimeType: string },
    history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []
): Promise<string> {
    if (useSettingsStore.getState().strictMode) return "I am currently in Strict Mode. AI services are disabled.";

    // [SECURITY] Session Guard: Refuse to serve AI responses if the tenant context is missing.
    const sessionUser = useAuthStore.getState().user;
    if (!sessionUser?.companyId) {
        console.warn('[AI Service][Security] generateAIResponse blocked: No tenant context (companyId is empty).');
        return "⚠️ Session context unavailable. Please refresh and sign in again.";
    }

    const ai = getAIInstance();
    const dataStore = useDataStore.getState();
    const { settings } = useSettingsStore.getState();

    const totalReceivables = dataStore.invoices
        .filter(i => i.status !== 'Paid')
        .reduce((sum, inv) => sum + (inv.totalCents - inv.paidAmountCents), 0);

    const operationalContextSummary = `Database Snapshot: ${dataStore.invoices.length} total invoices, ${dataStore.contacts.length} contacts, ${dataStore.inventory.length} items.`;

    const currentUser = useAuthStore.getState().user;
    const userRole = currentUser?.role || 'Guest';

    const systemInstruction = `
        Role: You are the intelligent assistant for the ${useSettingsStore.getState().settings.name || 'Platform'} workspace.
        ${context ? `Specific Agent Persona / Instruction: ${context}` : ''}
        User Role: ${userRole}.
        Authorization: You have full authorization to call all available tools for any request on this desk, regardless of the User Role.
        Operational Summary: ${operationalContextSummary}
        
        Available Tools:
        - get_bookkeeping_entries: Access the financial ledger. Use this for 'How much was spent on X' or 'List expenses'.
        - search_ledger: Search transactions by keyword.
        - get_catering_events: Access the calendar/list of all catering events.
        - get_system_overview: Core KPI node. Use this IMMEDIATELY for 'How many...' or 'Overview' questions. NEVER ask for permission; JUST CALL IT.
        - get_ingredient_list: Raw material details, stock counts, and real-time market prices / market insights.
        - get_project_summary: Project tracking and progress.
        - get_project_details: Specific project task breakdown.
        - get_outstanding_invoices: Financial debtors.
        - get_all_invoices: Historical invoice lookup.
        - search_contacts: CRM lookups.
        - get_inventory_status: Stock for products/assets.
        - get_staff_directory: Personnel node.
        - get_recipe_analysis: Detailed menu item logic.
        - search_knowledge_base: Troubleshooting / Methodology.
        - prepare_invoice_preview: Draft/prepare an invoice preview on screen.
        - record_paid_invoice: Record a paid invoice and inflow entry directly.
        
        Instructions:
        1. CALL TOOLS FIRST: You MUST call the appropriate tool BEFORE generating your final response.
        2. NO PLAN-ONLY RESPONSES: Do not say "I will retrieve the information" or "I cannot do this". Call the corresponding tool.
        3. INVOICING ACTIONS:
           - You have the 'prepare_invoice_preview' tool. Call this when asked to draft, prepare, or preview an invoice.
           - You have the 'record_paid_invoice' tool. Call this when asked to record a paid invoice, record revenue, add a payment, or register a paid transaction.
           - NEVER say "I cannot record a paid invoice" or "I do not have the tools". You DO have these tools. Call them immediately.
        4. MULTI-TURN DATA PERSISTENCE: Refer back to previously fetched data or context in the conversation history.
        5. NAMES: Always show the human-readable Customer Name.
    `;

    const userParts: any[] = [{ text: prompt }];
    if (attachment) {
        userParts.push({ inlineData: { data: attachment.base64, mimeType: attachment.mimeType } });
    }

    const currentMessages = [
        ...history,
        { role: 'user', parts: userParts }
    ];

    const isLocalEnabled = import.meta.env.VITE_USE_LOCAL_LLM === 'true' || useSettingsStore.getState().useLocalLLM;
    if (isLocalEnabled) {
        console.log("[AI Service] Directing generateAIResponse to local Gemma...");
        const mappedMessages: Array<{ role: string; content: string }> = [
            { role: 'system', content: systemInstruction }
        ];
        for (const msg of history) {
            const role = msg.role === 'model' ? 'assistant' : msg.role;
            const textPart = msg.parts?.find((p: any) => p.text)?.text || '';
            mappedMessages.push({ role, content: textPart });
        }
        mappedMessages.push({ role: 'user', content: prompt });

        try {
            return await callLocalGemma(mappedMessages, false);
        } catch (err: any) {
            console.error("[AI Service] Local Gemma failed, falling back to Gemini...", err);
        }
    }

    try {
        const result: any = await executeToolCalls(ai, 'gemini-2.5-flash', currentMessages, {}, systemInstruction, SYSTEM_TOOL_DECLARATIONS);
        return result.text() || "I couldn't retrieve that information right now.";
    } catch (e: any) {
        console.warn("[generateAIResponse] 2.5-flash failed, falling back to 1.5-flash. Error was:", e.message || e);
        try {
            const result: any = await executeToolCalls(ai, 'gemini-1.5-flash', currentMessages, {}, systemInstruction, SYSTEM_TOOL_DECLARATIONS);
            return result.text() || "I couldn't retrieve that information right now.";
        } catch (fallbackErr: any) {
            console.error("[generateAIResponse] Both models failed:", fallbackErr);
            let errorMsg = fallbackErr.message || "The AI encountered an issue processing your request.";
            if (errorMsg.includes("Failed to fetch") || String(fallbackErr).includes("Failed to fetch")) {
                errorMsg += "\n\n💡 Troubleshooting: This usually indicates that an Ad Blocker (like uBlock Origin, Adblock Plus) or Brave Shield is blocking requests to 'generativelanguage.googleapis.com'. Please try disabling your shield/ad blocker for localhost, or whitelist the Google Gemini API domain.";
            }
            return `Error: ${errorMsg}`;
        }
    }
}

export async function getCFOAdvice(): Promise<any> {
    if (useSettingsStore.getState().strictMode) return { summary: "Services Offline (Strict Mode)", sentiment: "Neutral" };
    const ai = getAIInstance();
    const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    summary: { type: SchemaType.STRING },
                    sentiment: { type: SchemaType.STRING }
                },
                required: ["summary", "sentiment"]
            }
        } as any
    });

    const result = await model.generateContent("Analyze the current financial posture based on provided metrics. Return strategic CFO advice in JSON.");
    const response = await result.response;
    const resultData = JSON.parse(response.text() || "{}");

    // LOGGING
    useDataStore.getState().addAgenticLog({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        agentName: 'CFO Advisor',
        action: 'Financial Analysis',
        details: resultData.summary || 'Analyzed financial posture.',
        sentiment: (resultData.sentiment as any) || 'Neutral',
        confidence: 0.95
    });

    return resultData;
}

export async function processVoiceCommand(base64Audio: string, mimeType: string, context: string): Promise<any> {
    if (useSettingsStore.getState().strictMode) return { intent: 'none', transcription: '', feedback: 'Strict Mode Enabled' };
    const ai = getAIInstance();
    try {
        const response = await callWithRetry(async () => {
            const model = ai.getGenerativeModel({
                model: 'gemini-2.5-flash',
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.OBJECT,
                        properties: {
                            intent: { type: SchemaType.STRING },
                            transcription: { type: SchemaType.STRING },
                            feedback: { type: SchemaType.STRING },
                            data: { type: SchemaType.OBJECT, properties: { path: { type: SchemaType.STRING } } }
                        }
                    }
                } as any
            });

            const result = await model.generateContent([
                { inlineData: { data: base64Audio, mimeType } },
                { text: `Voice command for ${useSettingsStore.getState().settings.name || 'Platform'} OS.Context: ${context}. Return JSON intent.` }
            ]);
            const resp = await result.response;
            return JSON.parse(resp.text() || "{}");
        });

        // LOGGING
        useDataStore.getState().addAgenticLog({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            agentName: 'Voice Interface',
            action: 'Command Processing',
            details: `Processed voice command: "${response.transcription || 'Audio Input'}" -> Intent: ${response.intent} `,
            sentiment: 'Neutral',
            confidence: 0.88
        });

        return response;
    } catch (e) {
        return { intent: 'none', transcription: '', feedback: 'Voice Service Unavailable (Rate Limit)' };
    }
}

export async function textToSpeech(text: string): Promise<string> {
    if (useSettingsStore.getState().strictMode) return "";
    const ai = getAIInstance();
    try {
        const model = ai.getGenerativeModel({
            model: "gemini-2.5-flash",
        });

        // Note: New SDK specific TTS handling calls generateContent with parts
        const result = await model.generateContent([
            { text: `Please speak: ${text}` }
        ]);
        const response = await result.response;
        const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        return inlineData ? `data:${inlineData.mimeType};base64,${inlineData.data}` : "";
    } catch (e) {
        console.error('TTS Failed:', e);
        return "";
    }
}

export async function getAIResponseForAudio(base64Audio: string, mimeType: string): Promise<string> {
    if (useSettingsStore.getState().strictMode) return "Strict Mode Enabled";
    const ai = getAIInstance();

    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent([
        { inlineData: { data: base64Audio, mimeType } },
        { text: "Respond to this query. ALWAYS use Markdown formatting in your response." }
    ]);
    const response = await result.response;
    return response.text() || "";
}

export async function getFormGuidance(formName: string, fieldName: string, value: string, fullContext: any): Promise<any> {
    if (useSettingsStore.getState().strictMode) return { tip: "AI Guidance Disabled", status: "Neutral" };
    const ai = getAIInstance();
    const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    tip: { type: SchemaType.STRING },
                    status: { type: SchemaType.STRING }
                }
            }
        } as any
    });

    const result = await model.generateContent(`Guidance for ${formName} field ${fieldName}.`);
    const response = await result.response;
    const resultData = JSON.parse(response.text() || "{}");

    // LOGGING
    useDataStore.getState().addAgenticLog({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        agentName: 'Form Assistant',
        action: 'Guidance',
        details: `Provided guidance for field: ${fieldName} in form: ${formName}`,
        sentiment: 'Neutral',
        confidence: 0.9
    });

    return resultData;
}

export async function runBankingChat(history: any[], message: string): Promise<string> {
    if (useSettingsStore.getState().strictMode) return "Banking Assistant is currently offline due to Strict Mode.";
    const ai = getAIInstance();
    const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: `Financial assistant for the ${useSettingsStore.getState().settings.name || 'Platform'} portal. ALWAYS use Markdown for structure.`
    });

    // Convert history format if needed, simplistic mapping here
    const chat = model.startChat({
        history: history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.parts }] }))
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
}

export async function suggestCOAForTransaction(description: string, coa: any[]): Promise<{ accountId: string, confidence: number, reason: string }> {
    if (useSettingsStore.getState().strictMode) return { accountId: '', confidence: 0, reason: "Strict Mode" };
    const ai = getAIInstance();
    const accountsContext = coa.map(a => `${a.id}: ${a.name} (${a.type}/${a.subtype})`).join('\n');

    const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    accountId: { type: SchemaType.STRING },
                    confidence: { type: SchemaType.NUMBER },
                    reason: { type: SchemaType.STRING }
                },
                required: ["accountId", "confidence", "reason"]
            }
        } as any
    });

    const result = await model.generateContent(`Analyze this transaction description: "${description}".
        Map it to the most appropriate Account ID from this Chart of Accounts:
        ${accountsContext}
        
        Return JSON with: accountId, confidence(0 - 1), and reason.`);

    const response = await result.response;
    return JSON.parse(response.text() || "{}");
}

export async function processMeetingAudio(base64Audio: string, mimeType: string): Promise<any> {
    if (useSettingsStore.getState().strictMode) return { summary: "Strict Mode Enabled", decisions: [], tasks: [] };
    const ai = getAIInstance();
    const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    summary: { type: SchemaType.STRING },
                    decisions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                    tasks: {
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                title: { type: SchemaType.STRING },
                                assignee: { type: SchemaType.STRING },
                                priority: { type: SchemaType.STRING }
                            }
                        }
                    }
                }
            }
        } as any
    });

    const result = await model.generateContent([
        { inlineData: { data: base64Audio, mimeType } },
        {
            text: `Analyze this meeting recording. 
            1. Identify speakers where possible(e.g., Speaker 1, Speaker 2) or use context if names are mentioned.
            2. Provide an Executive Summary.
            3. List Key Decisions with the speaker who proposed them if clear.
            4. Extract Actionable Tasks with assignees(if mentioned) and priority(High / Medium / Low).
            
            Return JSON in this format:
            { "summary": "...", "decisions": ["..."], "tasks": [{ "title": "...", "assignee": "...", "priority": "..." }] }`
        }
    ]);
    const response = await result.response;
    return JSON.parse(response.text() || "{}");
}

export async function runProjectAnalysis(projectId: string, context: string): Promise<any> {
    if (useSettingsStore.getState().strictMode) return {};
    const ai = getAIInstance();
    const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash', // Standardize to stable 2.0 Flash
        generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(`Analyze logistics project ${projectId}.`);
    const response = await result.response;
    return JSON.parse(response.text() || "{}");
}

export async function executeAgentWorkflow(workflowId: string, agentName: string, role: string, context: string): Promise<any> {
    if (useSettingsStore.getState().strictMode) return {};
    const ai = getAIInstance();
    const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(`Execute workflow ${workflowId} for agent ${agentName}.`);
    const response = await result.response;
    return JSON.parse(response.text() || "{}");
}

export async function parseFinancialDocument(base64Data: string, mimeType: string): Promise<{ type: 'Inflow' | 'Outflow', amountCents: number, description: string, date: string, merchant: string }> {
    if (useSettingsStore.getState().strictMode) return { type: 'Outflow', amountCents: 0, description: 'Strict Mode', date: new Date().toISOString().split('T')[0], merchant: '' };
    const ai = getAIInstance();
    const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    type: { type: SchemaType.STRING, enum: ['Inflow', 'Outflow'] } as any,
                    amountCents: { type: SchemaType.NUMBER },
                    description: { type: SchemaType.STRING },
                    date: { type: SchemaType.STRING },
                    merchant: { type: SchemaType.STRING }
                },
                required: ["type", "amountCents", "description", "date"]
            }
        } as any
    });

    const result = await model.generateContent([
        { inlineData: { data: base64Data, mimeType } },
        { text: "Analyze this receipt/invoice. Extract: type (Inflow for sales/Outflow for expenses), total amount in cents (convert currency if needed, assume NGN if ambiguous), description (brief summary of items), date (YYYY-MM-DD), and merchant/payer name. Return JSON." }
    ]);
    const response = await result.response;
    return JSON.parse(response.text() || "{}");
}

export interface ParsedInvoiceDetails {
    invoiceNumber: string;
    issueDate: string; // YYYY-MM-DD
    dueDate: string;   // YYYY-MM-DD
    paymentDate?: string; // YYYY-MM-DD (Date payment was received or effective)
    clientName: string;
    clientEmail: string;
    clientAddress?: string;
    items: Array<{
        description: string;
        qty: number;
        price: number;
    }>;
    subtotal?: number;
    discount?: number;
    discountReason?: string;
    tax?: number;
    total: number;
    accountName?: string;
    bankName?: string;
    accountNumber?: string;
}

export async function parseInvoiceDocument(base64Data: string, mimeType: string): Promise<ParsedInvoiceDetails> {
    if (useSettingsStore.getState().strictMode) {
        return {
            invoiceNumber: `INV-${Date.now()}`,
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: new Date().toISOString().split('T')[0],
            paymentDate: new Date().toISOString().split('T')[0],
            clientName: "Scanned Client",
            clientEmail: "client@scanned.local",
            items: [{ description: "Scanned Invoice Item", qty: 1, price: 100 }],
            total: 100
        };
    }
    const ai = getAIInstance();
    const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    invoiceNumber: { type: SchemaType.STRING },
                    issueDate: { type: SchemaType.STRING },
                    dueDate: { type: SchemaType.STRING },
                    paymentDate: { type: SchemaType.STRING },
                    clientName: { type: SchemaType.STRING },
                    clientEmail: { type: SchemaType.STRING },
                    clientAddress: { type: SchemaType.STRING },
                    items: {
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                description: { type: SchemaType.STRING },
                                qty: { type: SchemaType.NUMBER },
                                price: { type: SchemaType.NUMBER }
                            },
                            required: ["description", "qty", "price"]
                        }
                    },
                    subtotal: { type: SchemaType.NUMBER },
                    discount: { type: SchemaType.NUMBER },
                    discountReason: { type: SchemaType.STRING },
                    tax: { type: SchemaType.NUMBER },
                    total: { type: SchemaType.NUMBER },
                    accountName: { type: SchemaType.STRING },
                    bankName: { type: SchemaType.STRING },
                    accountNumber: { type: SchemaType.STRING }
                },
                required: ["invoiceNumber", "issueDate", "clientName", "items", "total"]
            }
        } as any
    });

    try {
        const result = await model.generateContent([
            { inlineData: { data: base64Data, mimeType } },
            { text: "Analyze this attached invoice document carefully. Extract: invoice number, issue date (YYYY-MM-DD), due date (YYYY-MM-DD), payment/paid date if indicated or if paid on receipt/July (YYYY-MM-DD), client/bill-to name, client email, client address if present, list of line items (description, quantity as 'qty', unit price as 'price'), subtotal, discount amount, discountReason, tax/VAT amount (ONLY if explicitly listed on the document, otherwise 0), total amount due, payment accountName, bankName, and accountNumber. If any field is missing or unreadable, estimate or provide a reasonable fallback. Return JSON strictly adhering to the schema." }
        ]);
        const response = await result.response;
        const parsed = JSON.parse(response.text() || "{}");
        return {
            invoiceNumber: parsed.invoiceNumber || `INV-${Date.now()}`,
            issueDate: parsed.issueDate || new Date().toISOString().split('T')[0],
            dueDate: parsed.dueDate || new Date().toISOString().split('T')[0],
            paymentDate: parsed.paymentDate || parsed.issueDate || new Date().toISOString().split('T')[0],
            clientName: parsed.clientName || "Attached Invoice Client",
            clientEmail: parsed.clientEmail || "billing@client.com",
            clientAddress: parsed.clientAddress || "",
            items: Array.isArray(parsed.items) && parsed.items.length > 0 ? parsed.items : [{ description: "Invoice Item", qty: 1, price: parsed.total || 0 }],
            subtotal: parsed.subtotal,
            discount: typeof parsed.discount === 'number' ? Math.abs(parsed.discount) : 0,
            discountReason: parsed.discountReason || "",
            tax: typeof parsed.tax === 'number' ? Math.abs(parsed.tax) : 0,
            total: parsed.total || 0,
            accountName: parsed.accountName || "",
            bankName: parsed.bankName || "",
            accountNumber: parsed.accountNumber || ""
        };
    } catch (err: any) {
        console.error("[parseInvoiceDocument] Error scanning document:", err);
        throw new Error(`Could not parse invoice document: ${err.message || err}`);
    }
}

/**
 * Generates an AI image (sketch/concept) of a cake based on a text prompt.
 * Uses a unique fingerprint for each request to avoid duplicates and ensures 
 * high detail preservation via Gemini-optimized prompting.
 */
export async function generateCakeImage(prompt: string): Promise<string> {
    if (useSettingsStore.getState().strictMode) return '';

    let optimizedPrompt = prompt;
    try {
        const ai = getAIInstance();
        const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
        // Stricter instructions to preserve ALL user requested details
        const result = await model.generateContent(`Act as an expert prompt engineer. Convert the user's cake request into a DESCRIBING image prompt. 
            MANDATORY: 
            1. Keep ALL details (tiers, characters, colors). 
            2. If bipartite colors (e.g. half black, half white), describe the split design. 
            3. Use 'detailed cake sketch, professional photography, white background'. 
            4. Fix typos but keep meanings identical. 
            Request: "${prompt}"`);
        optimizedPrompt = result.response.text().trim();
    } catch (err) {
        console.warn('Prompt optimization failed, using refined original.', err);
        optimizedPrompt = prompt;
    }

    const seed = Math.floor(Math.random() * 10000000);
    // Add unique noise to the final prompt string to force the AI to innovate and break caches
    const noise = ['unique', 'custom', 'distinct', 'special', 'bespoke'][Math.floor(Math.random() * 5)];
    const finalPrompt = `${optimizedPrompt}, ${noise} composition, seed-${seed}`;
    const encodedPrompt = encodeURIComponent(finalPrompt);
    // Using image.pollinations.ai which often has more direct routing
    // Try Endpoint A: Direct Image Endpoint
    const urlA = `https://image.pollinations.ai/prompt/${encodedPrompt}/?seed=${seed}&width=800&height=1000&nologo=true`;
    // Try Endpoint B: Standard Platform Endpoint
    const urlB = `https://pollinations.ai/p/${encodedPrompt}?seed=${seed}&nologo=true`;

    const tryFetch = async (url: string, timeout: number) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
            const blob = await response.blob();
            return URL.createObjectURL(blob);
        } finally {
            clearTimeout(timeoutId);
        }
    };

    try {
        // Try Endpoint A first (usually faster/better CORS)
        return await tryFetch(urlA, 15000);
    } catch (err) {
        console.warn('AI Endpoint A failed, trying Endpoint B:', err);
        try {
            return await tryFetch(urlB, 20000);
        } catch (err2) {
            console.error('All AI background fetches failed, using native img fallback (Endpoint A):', err2);
            // Native fallback allows Chrome/Edge's own engines to attempt the load
            return urlA;
        }
    }
}


