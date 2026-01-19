import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { useDataStore } from '../store/useDataStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Ingredient, CateringEvent, Recipe, AIAgentMode } from '../types';
import { useAuthStore } from '../store/useAuthStore';

// Map 'Type' from old SDK to 'SchemaType'
const Type = SchemaType;

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

export async function bulkGroundIngredientPrices(ingredients: Ingredient[]): Promise<void> {
    if (useSettingsStore.getState().strictMode) return;
    const ai = getAIInstance();
    const { updateIngredientPrice } = useDataStore.getState();

    for (const ing of ingredients) {
        if (!ing.priceSourceQuery) continue;
        try {
            const model = ai.getGenerativeModel({
                model: 'gemini-2.0-flash-lite-001',
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
            model: 'gemini-2.0-flash-lite-001',
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
        model: 'gemini-2.0-flash-lite-001',
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
        model: 'gemini-2.0-flash-lite-001',
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
        model: 'gemini-2.0-flash-lite-001',
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
        model: 'gemini-2.0-flash-lite-001',
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
            console.warn(`[AI Service] Rate limit hit (429). Model: gemini-2.0-flash-lite-001. Retrying in ${delay}ms... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            const nextDelay = Math.min(delay * 2, 10000);
            return callWithRetry(fn, retries - 1, nextDelay);
        }
        throw error;
    }
}

export async function processAgentRequest(input: string, context: string, mode: 'text' | 'audio'): Promise<any> {
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
        .slice(0, 30) // REDUCED LIMIT: Top 30 items to save tokens
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

    // Financial Context (CFO Capabilities)
    const outstandingInvoices = dataStore.invoices.filter(i => i.status !== 'Paid');
    const totalReceivables = outstandingInvoices.reduce((sum, inv) => sum + (inv.totalCents - inv.paidAmountCents), 0);

    const recentTransactions = dataStore.bankTransactions
        .slice(0, 5) // Last 5 transactions
        .map(t => `${t.date}: ${t.description} (${t.type}) - ₦${(t.amountCents / 100).toLocaleString()}`);

    const keyAccounts = dataStore.chartOfAccounts
        .filter(a => a.balanceCents > 0)
        .map(a => `${a.name}: ₦${(a.balanceCents / 100).toLocaleString()}`);

    // CRM Context
    const customers = dataStore.contacts.filter(c => c.category === 'Customer').slice(0, 10)
        .map(c => `${c.name} (${c.email || 'No email'}) - ${c.companyId}`);
    const suppliers = dataStore.contacts.filter(c => c.category === 'Supplier').slice(0, 20)
        .map(s => `${s.name} (${s.email || 'No email'})`);

    // Projects Context
    const projects = dataStore.projects.slice(0, 20)
        .map(p => `${p.name} [${p.status}] - ${p.progress}%`);

    const operationalContext = JSON.stringify({
        financials: {
            totalOutstandingReceivables: `₦${(totalReceivables / 100).toLocaleString()}`,
            outstandingInvoiceCount: outstandingInvoices.length,
            recentTransactions: recentTransactions,
            accountBalances: keyAccounts.length > 0 ? keyAccounts : "No active account balances found."
        },
        events: dataStore.cateringEvents.map(e => ({
            customer: e.customerName,
            date: e.eventDate,
            status: e.status,
            revenue: `₦${(e.financials.revenueCents / 100).toLocaleString()}`,
            grossMargin: e.costingSheet?.aggregateGrossMarginPercentage
        })).slice(0, 10), // Expanded to top 10
        crm: {
            totalCustomers: dataStore.contacts.filter(c => c.category === 'Customer').length,
            customerList: customers,
            supplierList: suppliers
        },
        recipes: dataStore.recipes.slice(0, 10).map(r => ({
            name: r.name,
            ingredients: r.ingredients.map(i => `${i.qtyPerPortion} ${i.unit} ${i.name}`).join(', ')
        })),
        tasks: dataStore.tasks.filter(t => t.status !== 'Done').slice(0, 10).map(t => `${t.title} [${t.priority}] - Due: ${t.dueDate}`),
        support: {
            openTickets: dataStore.tickets.filter(t => t.status !== 'Resolved').length,
            recentTickets: dataStore.tickets.slice(0, 5).map(t => `${t.subject} (${t.status})`)
        },
        projects: {
            activeCount: dataStore.projects.filter(p => p.status === 'Active').length,
            list: projects
        },
        personnel: {
            totalStaff: dataStore.employees.length,
            departmentRoles: workforceSummary,
            staffDirectory: dataStore.employees.slice(0, 10).map(e => ({ // LIMIT CONTEXT: Top 10 staff
                name: `${e.firstName} ${e.lastName} `,
                role: e.role,
                status: e.status,
                salary: `₦${(e.salaryCents / 100).toLocaleString()}`,
                dob: e.dob,
                startDate: e.dateOfEmployment
            }))
        },
        menuSample: menuContext ? "Refer to System Prompt for full menu." : "No menu data available."
    });

    try {
        const response = await callWithRetry(async () => {
            const systemInstructions = `
                Role: You are P-Xi, the intelligent assistant for the Paradigm-Xi platform.
                User Role: ${userRole}.
                
                Data Access:
                1. Menu/Products:
                ${menuContext || "No specific menu items loaded."}
                
                2. Operational Data:
                ${operationalContext}
                
                Additional Context: ${context}.
                
                instructions:
                1. **ANALYZE CONTEXT**: Verify if "Recent History" shows a pending question from you (e.g., "What is the email?"). If the User's current input is an answer, MERGE it with the previous intent/data.
                2. Identify Intent: 'GENERAL_QUERY' (default), 'ADD_EMPLOYEE', 'ADD_INVENTORY', 'ADD_CUSTOMER', 'ADD_SUPPLIER', 'ADD_PROJECT', 'CREATE_EVENT'.
                3. If Action, extract payload.
                4. If Query, answer it using the provided "Data Access".
                5. **DATA COMPLETENESS & CLARIFICATION**: 
                   - **ADD_EMPLOYEE**: Mandatory: Name, Role. Recommended: DOB, Start Date.
                   - **ADD_CUSTOMER/SUPPLIER**: Mandatory: Name. Recommended: Email, Phone.
                   - **ADD_PROJECT**: Mandatory: Name. Recommended: Client, Budget.
                   - **CREATE_EVENT**: Mandatory: Customer Name, Event Type, Date, Guest Count.
                   - **Behavior**: If the user provides the Mandatory fields but misses Recommended ones, return 'GENERAL_QUERY' and ask: "I have the name and role. To complete the profile, could you also provide their DOB, Address, and Phone number?" 
                   - **Exception**: If the user says "That's all" or "Skip details", ONLY THEN return the 'ADD_EMPLOYEE' intent with the data you have.
                7. **DATA FORMATTING RULES**:
                   - **DATES**: ALL dates in 'payload' MUST be ISO 8601 (YYYY-MM-DD). Example: Convert "13th March 1974" -> "1974-03-13".
                   - **CURRENCY**: Convert all money references to integers (Cents/Kobo). e.g., "500k" -> 500000.
                8. **ANTI-HALLUCINATION RULE**: You CANNOT update the database yourself. You can ONLY trigger an update by returning the correct 'intent' and 'payload'. NEVER say "I have recorded this" or "Profile created" in your text response unless you are returning an Action Intent. If you return 'GENERAL_QUERY', do NOT say you performed an action.
                9. BREVITY RULE: Keep response to 2-3 sentences.
                
                Return JSON:
                {
                    "response": "...",
                    "intent": "...",
                    "payload": { ... }
                }
            `;

            let contentParts: any[] = [];

            if (mode === 'audio') {
                contentParts = [
                    { inlineData: { data: input, mimeType: 'audio/webm' } },
                    { text: systemInstructions }
                ];
            } else {
                contentParts = [
                    { text: `User Input: "${input}". \n${systemInstructions}` }
                ];
            }

            const model = ai.getGenerativeModel({
                model: 'gemini-2.0-flash-lite-001', // Standardize to stable 1.5 Flash
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.OBJECT,
                        properties: {
                            response: { type: SchemaType.STRING },
                            intent: { type: SchemaType.STRING, enum: ['GENERAL_QUERY', 'ADD_EMPLOYEE', 'ADD_INVENTORY'] } as any,
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
                                    // Common/Other
                                    unit: { type: SchemaType.STRING }
                                }
                            }
                        },
                        required: ["response", "intent"]
                    }
                }
            });

            const result = await model.generateContent(contentParts);
            const response = await result.response;
            return JSON.parse(response.text() || "{}");
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

    const workforceSummary = dataStore.employees.reduce((acc, emp) => {
        acc[emp.role] = (acc[emp.role] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const menuContext = dataStore.inventory
        .filter(i => i.type === 'product')
        .map(i => `- ${i.name} (${i.category}): ₦${(i.priceCents / 100).toLocaleString()}`)
        .join('\n');

    const currentUser = useAuthStore.getState().user;
    const userRole = currentUser?.role || 'Guest';

    // --- Comprehensive Data Aggregation ---
    const { InvoiceStatus } = await import('../types');

    const companyData = {
        // 1. Financial Heartbeat
        finance: {
            bankBalance: dataStore.bankTransactions.reduce((sum, t) => sum + t.amountCents, 0) / 100, // Simple aggregate
            chartOfAccounts: dataStore.chartOfAccounts.map(c => `${c.code} - ${c.name} (${c.type})`).join(', '),
            unpaidInvoices: dataStore.invoices.filter(i => i.status !== InvoiceStatus.PAID).length,
            outstandingRevenue: dataStore.invoices.filter(i => i.status !== InvoiceStatus.PAID).reduce((s, i) => s + i.totalCents, 0) / 100,
            recentTransactions: dataStore.bankTransactions.slice(0, 5).map(t => `${t.date}: ${t.description} (${t.amountCents / 100})`)
        },
        // 2. Operational Inventory & Assets
        assets: {
            totalItems: dataStore.inventory.length,
            lowStock: dataStore.inventory.filter(i => i.stockQuantity < 5).map(i => i.name),
            equipment: dataStore.inventory.filter(i => i.isAsset).map(i => `${i.name} (Qty: ${i.stockQuantity})`),
            // SMART CONTEXT: Group by Category (Filtered to exclude ingredients to save tokens)
            inventorySummary: dataStore.inventory
                .filter(i => i.type !== 'ingredient') // Remove ingredients to reduce payload size
                .reduce((acc, item) => {
                    const cat = item.category || 'General';
                    if (!acc[cat]) acc[cat] = [];
                    if (acc[cat].length < 20) { // Limit to 20 items per category
                        acc[cat].push(`${item.name} (${item.stockQuantity})`);
                    }
                    return acc;
                }, {} as Record<string, string[]>)
        },
        // 3. CRM (Customers & Suppliers)
        crm: {
            totalContacts: dataStore.contacts.length,
            suppliers: dataStore.contacts.filter(c => c.category === 'Supplier').map(c => c.name),
            recentClients: dataStore.cateringEvents.slice(0, 5).map(e => e.customerName)
        },
        // 4. Personnel (Enhanced)
        personnel: {
            headcount: dataStore.employees.length,
            roles: workforceSummary,
            directory: dataStore.employees.map(e => ({
                name: `${e.firstName} ${e.lastName}`,
                role: e.role,
                status: e.status,
                joined: e.dateOfEmployment,
                phone: e.phoneNumber
            }))
        },
        // 5. Taxation & Compliance (Computed)
        taxation: {
            taxPayableEstimate: (dataStore.invoices.reduce((s, i) => s + i.totalCents, 0) * 0.075) / 100, // 7.5% VAT estimate
            filingStatus: "Pending (Advisory)"
        },
        // 6. Active Events
        operations: dataStore.cateringEvents.map(e => ({
            id: e.id,
            client: e.customerName,
            date: e.eventDate,
            revenue: e.financials.revenueCents / 100,
            status: e.status
        })).slice(0, 5)
    };

    const operationalContext = JSON.stringify(companyData, null, 2);

    const systemPrompt = `
    Role: You are P-Xi, the intelligent assistant for the Paradigm-Xi platform.
    User Context: The user is a ${userRole}. Ensure your answers are appropriate for this authority level.
    
    Data Access:
    1. Menu/Products:
    ${menuContext || "No specific menu items loaded."}
    
    2. Operational Data:
    ${operationalContext}
    
    Instructions:
    - Answer the User Question based strictly on the provided Data Access.
    - **BREVITY RULE**: Limit your response to a few sentences. Do NOT provide an entire explanation of what exists unless asked.
    - Directness: Address the user's request immediately.
    - If asked about "Amala" or other food items, check the 'Menu/Products' section above.
    - Use bold headers and bullet points only for lists.
    - **CRITICAL**: Do NOT include a signature, footer, or self-introduction.

    User Question: ${prompt}`;

    let contents: any = systemPrompt;

    // If there is an attachment, we need to switch to the "parts" format
    if (attachment) {
        contents = {
            parts: [
                { text: systemPrompt },
                { inlineData: { data: attachment.base64, mimeType: attachment.mimeType } }
            ]
        };
    }

    const response = await callWithRetry(async () => {
        const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-lite-001' });
        const result = await model.generateContent(contents);
        const response = await result.response;
        return response.text();
    });
    return response || "";
}

export async function getCFOAdvice(): Promise<any> {
    if (useSettingsStore.getState().strictMode) return { summary: "Services Offline (Strict Mode)", sentiment: "Neutral" };
    const ai = getAIInstance();
    const model = ai.getGenerativeModel({
        model: 'gemini-2.0-flash-lite-001',
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
                model: 'gemini-2.0-flash-lite-001',
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
            model: "gemini-2.0-flash-lite-001",
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
                type: Type.OBJECT,
                properties: {
                    tip: { type: Type.STRING },
                    status: { type: Type.STRING }
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