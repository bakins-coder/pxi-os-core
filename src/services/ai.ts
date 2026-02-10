import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { useDataStore } from '../store/useDataStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Ingredient, CateringEvent, Recipe, AIAgentMode } from '../types';
import { useAuthStore } from '../store/useAuthStore';


const getAIInstance = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    // Fallback to process.env for 'process.env.API_KEY' replacement in Vite config
    const legacyKey = process.env.API_KEY;

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
    search_knowledge_base: async (args: { query: string }) => {
        const { query } = args;
        const apiKey = (import.meta as any).env.VITE_PINECONE_API_KEY;
        const host = (import.meta as any).env.VITE_PINECONE_HOST;

        if (!apiKey || !host) {
            console.warn("[AI Tools] Pinecone Knowledge Base not configured (Missing VITE_PINECONE_API_KEY or VITE_PINECONE_HOST).");
            return { error: "Knowledge base keys missing. Please configure VITE_PINECONE_API_KEY and VITE_PINECONE_HOST." };
        }

        try {
            // Pinecone Integrated Inference Search (POST /query)
            const response = await fetch(`${host}/query`, {
                method: 'POST',
                headers: {
                    'Api-Key': apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    namespace: "documentation",
                    topK: 3,
                    inputs: [{ text: query }]
                })
            });

            if (!response.ok) throw new Error(`Pinecone error: ${response.statusText}`);

            const data = await response.json();
            const hits = data.result?.hits || [];

            return {
                results: hits.map((h: any) => ({
                    source: h.fields?.path || h._id,
                    content: h.fields?.content?.substring(0, 500) + "..." // Snip for brevity
                }))
            };
        } catch (e) {
            console.error("[AI Tools] Pinecone search failed:", e);
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
                price_naira: (i.currentCostCents || 0) / 100
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
    get_financial_summary: () => {
        const dataStore = useDataStore.getState();
        const invoices = dataStore.invoices;
        const totalRevenue = invoices.filter(i => (i.status as string) === 'Paid').reduce((sum, i) => sum + i.totalCents, 0);
        const totalPending = invoices.filter(i => (i.status as string) !== 'Paid' && (i.status as string) !== 'Draft').reduce((sum, i) => sum + (i.totalCents - i.paidAmountCents), 0);
        const totalExpenses = dataStore.bookkeeping.filter(e => e.type === 'Outflow').reduce((sum, e) => sum + e.amountCents, 0);

        return {
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
    get_all_invoices: (args: { limit?: number; contact_id?: string }) => {
        const { limit = 20, contact_id } = args || {};
        const dataStore = useDataStore.getState();
        let invoices = dataStore.invoices;
        if (contact_id) {
            invoices = invoices.filter(i => i.contactId === contact_id);
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
        description: "Fetch a list of raw ingredients/materials. Use this for 'how many unique ingredients' or stock level queries for raw goods.",
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
        description: "Get a summary of revenue, expenses, and pending payments.",
        parameters: { type: SchemaType.OBJECT, properties: {} }
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
        description: "Search the system documentation and guides. Use this to answer 'how-to' questions, technical queries about system architecture, or operational procedures.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                query: { type: SchemaType.STRING, description: "The specific question or topic to search for" }
            },
            required: ["query"]
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
        description: "Get all invoices regardless of status. Use this to see history or specific invoice details.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                contact_id: { type: SchemaType.STRING, description: "Optional contact ID filter" },
                limit: { type: SchemaType.NUMBER, description: "Max count" }
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
    }
];

/**
 * Handles the Loop for Tool Calling
 */
async function executeToolCalls(ai: any, modelId: string, initialMessages: any[], generationConfig?: any, systemInstruction?: string) {
    const targetModel = modelId;

    const genModel = ai.getGenerativeModel({
        model: targetModel,
        tools: [{ functionDeclarations: SYSTEM_TOOL_DECLARATIONS }],
        systemInstruction: systemInstruction ? { role: 'system', parts: [{ text: systemInstruction }] } : undefined
    });

    let currentMessages = [...initialMessages];
    const calledTools = new Set<string>();

    console.log(`[AI Tools] Starting execution loop for model: ${targetModel}`, { initialMessagesCount: initialMessages.length });

    for (let i = 0; i < 10; i++) {
        console.log(`[AI Tools] Turn ${i + 1}...`);

        // ALWAYS disable JSON mode during the tool-calling turns.
        // Forcing JSON mode can prevent the model from calling tools effectively.
        const turnConfig = { ...generationConfig, responseMimeType: undefined, responseSchema: undefined };

        const result = await genModel.generateContent({
            contents: currentMessages,
            generationConfig: turnConfig
        });

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
                throw new Error("Response was flagged by safety filters.");
            }

            // If the user requested a specific JSON schema but we skipped it during the loop turns,
            // we might need one last call to "JSON-ify" the final answer.
            if (generationConfig?.responseMimeType === "application/json" && (!turnConfig?.responseMimeType)) {
                console.log("[AI Tools] Formatting final answer into JSON...");
                const finalResult = await genModel.generateContent({
                    contents: currentMessages,
                    generationConfig
                });
                return await finalResult.response;
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
                model: 'gemini-2.0-flash',
                tools: [{ googleSearch: {} } as any]
            });

            const result = await model.generateContent(`Determine current commercial wholesale price in NGN(Naira) for "${ing.name}" based on this specific query: "${ing.priceSourceQuery}".Focus on Lagos / Mile 12 or Major markets.Provide a brief 1 - sentence summary.Return the price as a number in NAIRA per UNIT specified in the query.`);
            const response = await result.response;
            const text = response.text() || "";
            const priceMatch = text.match(/(\d+[,.]?\d*)/);
            let extractedPrice = priceMatch ? parseFloat(priceMatch[0].replace(',', '')) : 0;
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
            model: 'gemini-2.0-flash',
            tools: [{ googleSearch: {} } as any],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            name: { type: SchemaType.STRING, description: "The exact name of the ingredient from the provided list." },
                            price: { type: SchemaType.NUMBER, description: "Wholesale market price in Naira." }
                        },
                        required: ["name", "price"]
                    }
                }
            }
        });

        const result = await model.generateContent(`Search for current market prices in Lagos, Nigeria (2025 data) for the following food ingredients: ${ingredientList}. 
            For each item, return the best estimate for WHOLESALE market price in NAIRA per UNIT specified.
            
            RETURN JSON ONLY. No markdown formatting. No code blocks. Just the raw JSON array.
            Format: [{ "name": "Ingredient Name", "price": 1000 }]
            
            IMPORTANT: Return exactly the original ingredient names as keys in the JSON array objects.`);

        const response = await result.response;
        let cleanedText = response.text() || "[]";
        cleanedText = cleanedText.replace(/```json | ```/g, '');

        const dataArray = JSON.parse(cleanedText);
        const priceMap: Record<string, number> = {};
        dataArray.forEach((item: { name: string, price: number }) => {
            priceMap[item.name.toLowerCase().trim()] = item.price;
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
        model: 'gemini-2.0-flash',
        tools: [{ googleSearch: {} } as any]
    });

    const result = await model.generateContent(`Determine current commercial wholesale price in NGN(Naira) for "${itemName}" in major Nigerian food markets(e.g.Mile 12, Lagos, or Abuja Wuse).Provide a brief summary of current trends.Return the market price(as a number representing Naira) and a summary.`);
    const response = await result.response;
    const text = response.text() || "";
    const priceMatch = text.match(/(\d+[,.]?\d*)/);
    const marketPriceCents = priceMatch ? parseFloat(priceMatch[0].replace(',', '')) * 100 : 0;

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
        .filter(Boolean) || [];

    return { marketPriceCents, groundedSummary: text, sources };
}

export async function runInventoryReconciliation(event: CateringEvent): Promise<any> {
    if (useSettingsStore.getState().strictMode) return { status: 'Balanced', totalLossCents: 0, summary: "Strict Mode: Reconciliation skipped." };
    const ai = getAIInstance();
    const payload = JSON.stringify(event.hardwareChecklist);

    const model = ai.getGenerativeModel({
        model: 'gemini-2.0-flash',
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
        }
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
        model: 'gemini-2.0-flash',
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
        }
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
        model: 'gemini-2.0-flash',
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
        }
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
            console.warn(`[AI Service] Rate limit hit (429). Model: gemini-2.0-flash. Retrying in ${delay}ms... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            const nextDelay = Math.min(delay * 2, 10000);
            return callWithRetry(fn, retries - 1, nextDelay);
        }
        throw error;
    }
}

export async function processAgentRequest(input: string, context: string, mode: 'text' | 'audio' | 'image' | 'pdf' = 'text'): Promise<any> {
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

    const operationalContextSummary = `Database Snapshot: ${dataStore.invoices.length} total invoices, ${dataStore.contacts.length} contacts, ${dataStore.inventory.length} items.`;

    try {
        const response = await callWithRetry(async () => {
            const systemInstructions = `
                Role: You are P-Xi, the intelligent assistant for the Paradigm-Xi platform.
                User Role: ${userRole}.
                Operational Summary: ${operationalContextSummary}
                
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
                - get_ingredient_list: Raw material details and counts.
                - get_project_summary: Project tracking and progress.
                - get_outstanding_invoices: Financial debtors list.
                - search_contacts: CRM lookups.
                - get_inventory_status: Stock for products/assets.
                - get_staff_directory: Personnel node.
                - get_recipe_analysis: Detailed menu item logic.
                - search_knowledge_base: Troubleshooting / Methodology.
                
                Instructions:
                1. CALL TOOLS FIRST: You MUST call the appropriate tool BEFORE generating your final response. If the user asks a question that requires data (counts, lists, details), your first turn MUST be a tool call.
                2. NO PLAN-ONLY RESPONSES: Do not say 'I will retrieve the information' or ask 'Would you like me to...'. Just call the tool.
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
                
                Return JSON:
                {
                    "response": "Detailed answer confirming the data or action...",
                    "intent": "GENERAL_QUERY | ADD_EMPLOYEE | ADD_INVENTORY | ADD_CUSTOMER | ADD_SUPPLIER | ADD_PROJECT | CREATE_EVENT",
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
                        intent: { type: SchemaType.STRING, enum: ['GENERAL_QUERY', 'ADD_EMPLOYEE', 'ADD_INVENTORY', 'ADD_CUSTOMER', 'ADD_SUPPLIER', 'ADD_PROJECT', 'CREATE_EVENT'] } as any,
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
                                address: { type: SchemaType.STRING },
                                dateOfEmployment: { type: SchemaType.STRING },
                                healthNotes: { type: SchemaType.STRING },
                                stats: { type: SchemaType.STRING },

                                // Inventory Fields
                                itemName: { type: SchemaType.STRING },
                                quantity: { type: SchemaType.NUMBER },
                                category: { type: SchemaType.STRING },

                                // CRM / Event Fields
                                name: { type: SchemaType.STRING },
                                customerName: { type: SchemaType.STRING },
                                date: { type: SchemaType.STRING },
                                guestCount: { type: SchemaType.NUMBER },
                                location: { type: SchemaType.STRING },
                                eventType: { type: SchemaType.STRING },
                                budget: { type: SchemaType.STRING },
                                clientContactId: { type: SchemaType.STRING },

                                // Common/Other
                                unit: { type: SchemaType.STRING }
                            }
                        }
                    },
                    required: ["response", "intent"]
                }
            };

            // USE ENHANCED TOOL CALLING LOOP
            const currentMessages = [
                { role: 'user', parts: contentParts }
            ];

            const result = await executeToolCalls(ai, 'gemini-2.0-flash', currentMessages, generationConfig, systemInstructions);

            try {
                const textOutput = result.text();
                if (!textOutput) return { response: "I couldn't generate a clear response. Please try again.", intent: 'GENERAL_QUERY' };

                // Cleanup common model artifacts like markdown code blocks
                const cleanedJson = textOutput.replace(/```json\n?|\n?```/g, '').trim();
                return JSON.parse(cleanedJson);
            } catch (pE) {
                console.error("[AI Service] JSON Parse Failed. Raw Output:", result.text());
                return {
                    response: result.text() || "I apologize, but I had trouble formatting that data. Please try again.",
                    intent: 'GENERAL_QUERY'
                };
            }
        });

        return response;
    } catch (error: any) {
        console.error("AI Agent Request Failed:", error);
        if (error.status === 429 || error.message?.includes('429')) {
            return {
                response: "⚠️ I'm receiving too many requests right now. Please wait a moment and try again.",
                intent: 'GENERAL_QUERY'
            };
        }
        return { response: `Connection Error: ${error.message || "Unknown Error"} (Status: ${error.status || "N/A"})`, intent: 'GENERAL_QUERY' };
    }
}

export async function generateAIResponse(prompt: string, context: string = "", attachment?: { base64: string, mimeType: string }): Promise<string> {
    if (useSettingsStore.getState().strictMode) return "I am currently in Strict Mode. AI services are disabled.";
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
        Role: You are P-Xi, the intelligent assistant for the Paradigm-Xi platform.
        User Role: ${userRole}.
        Operational Summary: ${operationalContextSummary}
        
        Data Access Tools: 
        - get_catering_events: Access the calendar/list of all catering events. Use this for 'Next event', 'What events do we have', etc.
        - get_system_overview: Core KPI node. Use this IMMEDIATELY for 'How many...' or 'Overview' questions. NEVER ask for permission; JUST CALL IT.
        - get_ingredient_list: Raw material details and counts.
        - get_project_summary: Project tracking and progress.
        - get_project_details: Specific project task breakdown.
        - get_outstanding_invoices: Financial debtors.
        - get_all_invoices: Historical invoice lookup.
        - search_contacts: CRM lookups.
        - get_inventory_status: Stock for products/assets.
        - get_staff_directory: Personnel node.
        - get_recipe_analysis: Detailed menu item logic.
        - search_knowledge_base: Troubleshooting / Methodology.
        
        Instructions:
        1. CALL TOOLS FIRST: You MUST call the appropriate tool BEFORE generating your final response.
        2. NO PLAN-ONLY RESPONSES: Do not say "I will retrieve the information." Just call the tool and then provide the data.
        3. **STRICT TABLE REQUIREMENT**:
           If the user asks for lists (Events, Debtors, Ingredients, Projects, Staff, Inventory), respond ONLY with a Markdown table.
           - Event Table: | Customer | Date | Guests | Status | Location |
           - Debtor Table: | Customer Name | Balance | Status | (Use 'amount_formatted')
           - Project Table: | Project Name | Status | Progress | Tasks |
        4. MULTI-TURN DATA PERSISTENCE: Refer back to previously fetched data.
        5. NAMES: Always show the human-readable Customer Name.
        6. ACTIONS: If the user asks to "Add", "Create", "Remind", or "Task", use the appropriate tools like 'add_task'.
    `;

    const userParts: any[] = [{ text: prompt }];
    if (attachment) {
        userParts.push({ inlineData: { data: attachment.base64, mimeType: attachment.mimeType } });
    }

    const response = await callWithRetry(async () => {
        const currentMessages = [
            { role: 'user', parts: userParts }
        ];

        try {
            const result = await executeToolCalls(ai, 'gemini-2.0-flash', currentMessages, {}, systemInstruction);
            return result.text() || "I couldn't retrieve that information right now.";
        } catch (e: any) {
            console.error("[generateAIResponse] execution failed:", e);
            return `Error: ${e.message || "The AI encountered an issue processing your request."}`;
        }
    });
    return response || "I'm sorry, I couldn't complete that request.";
}

export async function getCFOAdvice(): Promise<any> {
    if (useSettingsStore.getState().strictMode) return { summary: "Services Offline (Strict Mode)", sentiment: "Neutral" };
    const ai = getAIInstance();
    const model = ai.getGenerativeModel({
        model: 'gemini-2.0-flash',
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
        }
    });

    const result = await model.generateContent("Analyze the current financial posture based on provided metrics. Return strategic CFO advice in JSON.");
    const response = await result.response;
    const resultData = JSON.parse(response.text() || "{}");

    // LOGGING
    useDataStore.getState().addAgenticLog({
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
                model: 'gemini-2.0-flash',
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
                }
            });

            const result = await model.generateContent([
                { inlineData: { data: base64Audio, mimeType } },
                { text: `Voice command for Xquisite OS.Context: ${context}. Return JSON intent.` }
            ]);
            const resp = await result.response;
            return JSON.parse(resp.text() || "{}");
        });

        // LOGGING
        useDataStore.getState().addAgenticLog({
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
            model: "gemini-2.0-flash",
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

    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-lite-001' });
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
        model: 'gemini-2.0-flash-lite-001',
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    tip: { type: SchemaType.STRING },
                    status: { type: SchemaType.STRING }
                }
            }
        }
    });

    const result = await model.generateContent(`Guidance for ${formName} field ${fieldName}.`);
    const response = await result.response;
    const resultData = JSON.parse(response.text() || "{}");

    // LOGGING
    useDataStore.getState().addAgenticLog({
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
        model: 'gemini-2.0-flash-lite-001',
        systemInstruction: "Financial assistant for Xquisite portal. ALWAYS use Markdown for structure."
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
        model: 'gemini-2.0-flash-lite-001',
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
        }
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
        model: 'gemini-2.0-flash-lite-001',
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
        }
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
        model: 'gemini-2.0-flash-lite-001', // Standardize to stable 2.0 Flash
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
        model: 'gemini-2.0-flash-lite-001',
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
        model: 'gemini-2.0-flash-lite-001',
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
        }
    });

    const result = await model.generateContent([
        { inlineData: { data: base64Data, mimeType } },
        { text: "Analyze this receipt/invoice. Extract: type (Inflow for sales/Outflow for expenses), total amount in cents (convert currency if needed, assume NGN if ambiguous), description (brief summary of items), date (YYYY-MM-DD), and merchant/payer name. Return JSON." }
    ]);
    const response = await result.response;
    return JSON.parse(response.text() || "{}");
}