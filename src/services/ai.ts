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
        const data = dataStore.invoices
            .filter(i => i.status !== 'Paid' && i.status !== 'Draft')
            .map(i => ({
                invoice_number: i.number,
                customer: i.customerName,
                total_naira: i.totalCents / 100,
                balance_naira: (i.totalCents - i.paidAmountCents) / 100,
                status: i.status,
                due_date: i.dueDate
            }))
            .sort((a, b) => b.balance_naira - a.balance_naira)
            .slice(0, limit);
        return { invoices: data, count: data.length };
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
    get_inventory_status: (args: { query: string }) => {
        const { query } = args;
        const dataStore = useDataStore.getState();
        const data = dataStore.inventory
            .filter(i => i.name.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 10)
            .map(i => ({
                name: i.name,
                stock: i.stockQuantity,
                type: i.type,
                price_naira: i.priceCents / 100,
                category: i.category
            }));
        return { items: data };
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
        description: "Check stock levels and prices for items in the warehouse or products on the menu.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                query: { type: SchemaType.STRING, description: "Name of the item to check" }
            },
            required: ["query"]
        }
    },
    {
        name: "get_staff_directory",
        description: "Get a list of all current employees, their roles, and contact status.",
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
        const candidate = response.candidates[0];

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
        const redundant = toolCallKeys.find(key => calledTools.has(key));
        if (redundant) {
            console.error(`[AI Tools] Loop detected: Redundant call to ${redundant}`);
            throw new Error(`AI entered an infinite loop calling: ${redundant.split(':')[0]}`);
        }
        toolCallKeys.forEach(key => calledTools.add(key));

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

        currentMessages.push({ role: 'function', parts: functionResponses });
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

    const operationalContextSummary = `Finance: Receivables ₦${(totalReceivables / 100).toLocaleString()}. CRM: ${dataStore.contacts.length} contacts. Inventory: ${dataStore.inventory.length} items.`;

    try {
        const response = await callWithRetry(async () => {
            const systemInstructions = `
                Role: You are P-Xi, the intelligent assistant for the Paradigm-Xi platform.
                User Role: ${userRole}.
                
                Data Access: You MUST use the provided tools (get_outstanding_invoices, search_contacts, get_inventory_status, get_staff_directory, search_knowledge_base) to fetch specific information. 
                DO NOT guess data. If the information isn't in your tools, say you don't have access.
                
                For 'how-to' questions or system architecture, ALWAYS call 'search_knowledge_base'.
                
                Operational Summary: ${operationalContextSummary}

                Instructions:
                1. Call Tools: You MUST use tools for any data-related queries (debtors, inventory, staff).
                2. Real Data Only: NEVER use placeholders like "Customer A" or "1000". Use ONLY the records returned by the tools.
                3. **DEBTOR TABLE FORMAT**: When listing debtors, use this EXACT Markdown structure:
                   | Customer | Balance (₦) | Status |
                   | :--- | :--- | :--- |
                   | [Name from tool] | [Balance from tool] | [Status from tool] |
                4. Filtering: If the user asks for "top 3", show exactly 3 rows.
                5. Intent: Map the user's ultimate goal to the 'intent' field.
                
                Return JSON:
                {
                    "response": "Answer to the user...",
                    "intent": "GENERAL_QUERY | ADD_EMPLOYEE | ADD_INVENTORY | ADD_CUSTOMER | ADD_SUPPLIER | ADD_PROJECT | CREATE_EVENT",
                    "payload": { ... }
                }
            `;

            let contentParts: any[] = [];
            if (mode === 'audio') {
                contentParts = [
                    { inlineData: { data: input, mimeType: 'audio/webm' } }
                ];
            } else {
                contentParts = [
                    { text: input }
                ];
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

            const result = await executeToolCalls(ai, 'gemini-2.0-flash-lite-001', currentMessages, generationConfig, systemInstructions);
            return JSON.parse(result.text() || "{}");
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

    const operationalContextSummary = `Finance: Receivables ₦${(totalReceivables / 100).toLocaleString()}. CRM: ${dataStore.contacts.length} contacts. Inventory: ${dataStore.inventory.length} items.`;

    const currentUser = useAuthStore.getState().user;
    const userRole = currentUser?.role || 'Guest';

    const systemInstruction = `
        Role: You are P-Xi, the intelligent assistant for the Paradigm-Xi platform.
        User Role: ${userRole}.
        Operational Summary: ${operationalContextSummary}
        
        Data Access: You MUST use the provided tools to fetch specific information. 
        DO NOT guess data. If the information isn't in your tools, say you don't have access.
        
        Instructions:
        1. Call Tools: Use tools for all specific data queries.
        2. Real Data Only: NEVER use placeholders or fake names. If no data exists, say so.
        3. **DEBTOR TABLE FORMAT**: Use this EXACT Markdown structure:
           | Customer | Balance (₦) | Status |
           | :--- | :--- | :--- |
           | [Name from tool] | [Balance from tool] | [Status from tool] |
        4. Filtering: If the user asks for "top 3", strictly limit the table to 3 rows.
        5. Be direct, professional, and concise.
    `;

    const userParts: any[] = [{ text: prompt }];
    if (attachment) {
        userParts.push({ inlineData: { data: attachment.base64, mimeType: attachment.mimeType } });
    }

    const response = await callWithRetry(async () => {
        const currentMessages = [
            { role: 'user', parts: userParts }
        ];

        const result = await executeToolCalls(ai, 'gemini-2.0-flash-lite-001', currentMessages, {}, systemInstruction);
        return result.text() || "I couldn't retrieve that information right now.";
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