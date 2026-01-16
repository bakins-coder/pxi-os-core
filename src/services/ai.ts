import { GoogleGenAI, Type, Modality } from '@google/genai';
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
    return new GoogleGenAI({ apiKey: key });
};

export async function bulkGroundIngredientPrices(ingredients: Ingredient[]): Promise<void> {
    if (useSettingsStore.getState().strictMode) return;
    const ai = getAIInstance();
    const { updateIngredientPrice } = useDataStore.getState();

    for (const ing of ingredients) {
        if (!ing.priceSourceQuery) continue;
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: `Determine current commercial wholesale price in NGN(Naira) for "${ing.name}" based on this specific query: "${ing.priceSourceQuery}".Focus on Lagos / Mile 12 or Major markets.Provide a brief 1 - sentence summary.Return the price as a number in NAIRA per UNIT specified in the query.`,
                config: { tools: [{ googleSearch: {} }] }
            });
            const text = response.text || "";
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
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Search for current market prices in Lagos, Nigeria (2025 data) for the following food ingredients: ${ingredientList}. 
            For each item, return the best estimate for WHOLESALE market price in NAIRA per UNIT specified.
            
            RETURN JSON ONLY. No markdown formatting. No code blocks. Just the raw JSON array.
            Format: [{ "name": "Ingredient Name", "price": 1000 }]
            
            IMPORTANT: Return exactly the original ingredient names as keys in the JSON array objects.`,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING, description: "The exact name of the ingredient from the provided list." },
                            price: { type: Type.NUMBER, description: "Wholesale market price in Naira." }
                        },
                        required: ["name", "price"]
                    }
                }
            }
        });

        let cleanedText = response.text || "[]";
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
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Determine current commercial wholesale price in NGN(Naira) for "${itemName}" in major Nigerian food markets(e.g.Mile 12, Lagos, or Abuja Wuse).Provide a brief summary of current trends.Return the market price(as a number representing Naira) and a summary.`,
        config: { tools: [{ googleSearch: {} }] }
    });
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
        .filter(Boolean) || [];
    const text = response.text || "";
    const priceMatch = text.match(/(\d+[,.]?\d*)/);
    const marketPriceCents = priceMatch ? parseFloat(priceMatch[0].replace(',', '')) * 100 : 0;
    return { marketPriceCents, groundedSummary: text, sources };
}

export async function runInventoryReconciliation(event: CateringEvent): Promise<any> {
    if (useSettingsStore.getState().strictMode) return { status: 'Balanced', totalLossCents: 0, summary: "Strict Mode: Reconciliation skipped." };
    const ai = getAIInstance();
    const payload = JSON.stringify(event.hardwareChecklist);
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this catering event inventory recovery log: ${payload}. 
        Identify if there is a 'Shortage'(unaccounted items where Out > Returned + Broken + Lost). 
        Calculate total financial impact of lost / broken items(assume prices: Plate = 500, Fork = 150, Glass = 1200, Linen = 12000, Uniform = 8500).
        Return JSON with: status('Balanced' | 'Shortage'), totalLossCents, and summary.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    status: { type: Type.STRING },
                    totalLossCents: { type: Type.NUMBER },
                    summary: { type: Type.STRING }
                },
                required: ["status", "totalLossCents", "summary"]
            }
        }
    });
    const result = JSON.parse(response.text || "{}");

    // Update local state with reconciliation result
    const { updateCateringEvent } = useDataStore.getState();
    updateCateringEvent(event.id, { reconciliationStatus: result.status });

    return result;
}

export async function extractInfoFromCV(base64Data: string, mimeType: string): Promise<any> {
    if (useSettingsStore.getState().strictMode) return {};
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                { inlineData: { data: base64Data, mimeType } },
                { text: "Extract the following information from this CV into a JSON format: firstName, lastName, email, phoneNumber, dob (YYYY-MM-DD), gender (Male or Female), and address." }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    firstName: { type: Type.STRING },
                    lastName: { type: Type.STRING },
                    email: { type: Type.STRING },
                    phoneNumber: { type: Type.STRING },
                    dob: { type: Type.STRING },
                    gender: { type: Type.STRING },
                    address: { type: Type.STRING }
                }
            }
        }
    });
    return JSON.parse(response.text || "{}");
}

export async function parseEmployeeVoiceInput(base64Audio: string, mimeType: string): Promise<any> {
    if (useSettingsStore.getState().strictMode) return {};
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                { inlineData: { data: base64Audio, mimeType } },
                { text: "This is a voice recording of an HR manager dictating employee details. Extract the information into JSON: firstName, lastName, email, phoneNumber, address, gender, dob." }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    firstName: { type: Type.STRING },
                    lastName: { type: Type.STRING },
                    email: { type: Type.STRING },
                    phoneNumber: { type: Type.STRING },
                    address: { type: Type.STRING },
                    gender: { type: Type.STRING },
                    dob: { type: Type.STRING }
                }
            }
        }
    });
    return JSON.parse(response.text || "{}");
}

// Helper for retry logic
async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        if (retries > 0 && (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED'))) {
            // Simplified Retry: Wait 4s, try once more, then fail.
            // Aggressive backoff is not helping if quota is zero.
            const delayMs = 4000;
            console.warn(`[AI Service] Rate limit hit. Retrying in ${delayMs}ms... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            return callWithRetry(fn, retries - 1, delayMs);
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
        .filter(i => i.type === 'product')
        .filter(i => i.type === 'product')
        .slice(0, 15) // AGGRESSIVE LIMIT: Top 150 items only.
        .map(i => `- ${i.name} (${i.category}): ₦${(i.priceCents / 100).toLocaleString()}`)
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

    const operationalContext = JSON.stringify({
        financials: {
            totalOutstandingReceivables: `₦${(totalReceivables / 100).toLocaleString()}`,
            outstandingInvoiceCount: outstandingInvoices.length,
            recentTransactions: recentTransactions,
            accountBalances: keyAccounts.length > 0 ? keyAccounts : "No active account balances found."
        },
        events: dataStore.cateringEvents.map(e => ({
            customer: e.customerName,
            revenue: e.financials.revenueCents,
            grossMargin: e.costingSheet?.aggregateGrossMarginPercentage
        })).slice(0, 3),
        personnel: {
            totalStaff: dataStore.employees.length,
            departmentRoles: workforceSummary,
            staffDirectory: dataStore.employees.slice(0, 50).map(e => ({ // LIMIT CONTEXT: Top 50 staff
                name: `${e.firstName} ${e.lastName} `,
                role: e.role,
                status: e.status,
                salary: `₦${(e.salaryCents / 100).toLocaleString()}`
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
                
                Instructions:
                1. Analyze the input (Audio or Text).
                2. Identify Intent: 'GENERAL_QUERY' (default), 'ADD_EMPLOYEE', 'ADD_INVENTORY'.
                3. If Action, extract payload.
                4. If Query, answer it using the provided "Data Access".
                5. BREVITY RULE: Keep response to 2-3 sentences.
                
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

            return await ai.models.generateContent({
                model: 'gemini-1.5-flash', // OPTIMIZATION: Use 1.5-flash for speed/latency
                contents: { parts: contentParts },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            response: { type: Type.STRING },
                            intent: { type: Type.STRING, enum: ['GENERAL_QUERY', 'ADD_EMPLOYEE', 'ADD_INVENTORY'] },
                            payload: {
                                type: Type.OBJECT,
                                properties: {
                                    // Employee Fields
                                    firstName: { type: Type.STRING },
                                    lastName: { type: Type.STRING },
                                    role: { type: Type.STRING },
                                    email: { type: Type.STRING },
                                    // Inventory Fields
                                    itemName: { type: Type.STRING },
                                    quantity: { type: Type.NUMBER },
                                    category: { type: Type.STRING },
                                    // Common/Other
                                    unit: { type: Type.STRING }
                                }
                            }
                        },
                        required: ["response", "intent"]
                    }
                }
            });
        });

        return JSON.parse(response.text || "{}");
    } catch (error: any) {
        console.error("AI Agent Request Failed:", error);
        if (error.status === 429 || error.message?.includes('429')) {
            return {
                response: "⚠️ I'm receiving too many requests right now. Please wait a moment and try again.",
                intent: 'GENERAL_QUERY'
            };
        }
        return { response: "I'm having trouble connecting to the AI service.", intent: 'GENERAL_QUERY' };
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

    const operationalContext = JSON.stringify({
        events: dataStore.cateringEvents.map(e => ({
            customer: e.customerName,
            revenue: e.financials.revenueCents,
            grossMargin: e.costingSheet?.aggregateGrossMarginPercentage
        })).slice(0, 3),
        personnel: {
            totalStaff: dataStore.employees.length,
            departmentRoles: workforceSummary,
            staffDirectory: dataStore.employees.map(e => ({
                name: `${e.firstName} ${e.lastName} `,
                role: e.role,
                status: e.status
            }))
        },
        menuSample: menuContext ? "Refer to System Prompt for full menu." : "No menu data available."
    });

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
        return await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: contents,
        });
    });
    return response.text || "";
}

export async function getCFOAdvice(): Promise<any> {
    if (useSettingsStore.getState().strictMode) return { summary: "Services Offline (Strict Mode)", sentiment: "Neutral" };
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Analyze the current financial posture based on provided metrics. Return strategic CFO advice in JSON.",
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    sentiment: { type: Type.STRING }
                },
                required: ["summary", "sentiment"]
            }
        }
    });
    const result = JSON.parse(response.text || "{}");

    // LOGGING
    useDataStore.getState().addAgenticLog({
        agentName: 'CFO Advisor',
        action: 'Financial Analysis',
        details: result.summary || 'Analyzed financial posture.',
        sentiment: (result.sentiment as any) || 'Neutral',
        confidence: 0.95
    });

    return result;
}

export async function processVoiceCommand(base64Audio: string, mimeType: string, context: string): Promise<any> {
    if (useSettingsStore.getState().strictMode) return { intent: 'none', transcription: '', feedback: 'Strict Mode Enabled' };
    const ai = getAIInstance();
    try {
        const response = await callWithRetry(async () => {
            return await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: {
                    parts: [
                        { inlineData: { data: base64Audio, mimeType } },
                        { text: `Voice command for Xquisite OS.Context: ${context}. Return JSON intent.` }
                    ]
                },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            intent: { type: Type.STRING },
                            transcription: { type: Type.STRING },
                            feedback: { type: Type.STRING },
                            data: { type: Type.OBJECT, properties: { path: { type: Type.STRING } } }
                        }
                    }
                }
            });
        });
        const result = JSON.parse(response.text || "{}");

        // LOGGING
        useDataStore.getState().addAgenticLog({
            agentName: 'Voice Interface',
            action: 'Command Processing',
            details: `Processed voice command: "${result.transcription || 'Audio Input'}" -> Intent: ${result.intent} `,
            sentiment: 'Neutral',
            confidence: 0.88
        });

        return result;
    } catch (e) {
        return { intent: 'none', transcription: '', feedback: 'Voice Service Unavailable (Rate Limit)' };
    }
}

export async function textToSpeech(text: string): Promise<string> {
    if (useSettingsStore.getState().strictMode) return "";
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
}

export async function getAIResponseForAudio(base64Audio: string, mimeType: string): Promise<string> {
    if (useSettingsStore.getState().strictMode) return "Strict Mode Enabled";
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                { inlineData: { data: base64Audio, mimeType } },
                { text: "Respond to this query. ALWAYS use Markdown formatting in your response." }
            ]
        }
    });
    return response.text || "";
}

export async function getFormGuidance(formName: string, fieldName: string, value: string, fullContext: any): Promise<any> {
    if (useSettingsStore.getState().strictMode) return { tip: "AI Guidance Disabled", status: "Neutral" };
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Guidance for ${formName} field ${fieldName}.`,
        config: {
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
    const result = JSON.parse(response.text || "{}");

    // LOGGING
    useDataStore.getState().addAgenticLog({
        agentName: 'Form Assistant',
        action: 'Guidance',
        details: `Provided guidance for field: ${fieldName} in form: ${formName}`,
        sentiment: 'Neutral',
        confidence: 0.9
    });

    return result;
}

export async function runBankingChat(history: any[], message: string): Promise<string> {
    if (useSettingsStore.getState().strictMode) return "Banking Assistant is currently offline due to Strict Mode.";
    const ai = getAIInstance();
    const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: { systemInstruction: "Financial assistant for Xquisite portal. ALWAYS use Markdown for structure." }
    });
    const response = await chat.sendMessage({ message });
    return response.text || "";
}

export async function suggestCOAForTransaction(description: string, coa: any[]): Promise<{ accountId: string, confidence: number, reason: string }> {
    if (useSettingsStore.getState().strictMode) return { accountId: '', confidence: 0, reason: "Strict Mode" };
    const ai = getAIInstance();
    const accountsContext = coa.map(a => `${a.id}: ${a.name} (${a.type}/${a.subtype})`).join('\n');

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this transaction description: "${description}".
        Map it to the most appropriate Account ID from this Chart of Accounts:
        ${accountsContext}
        
        Return JSON with: accountId, confidence(0 - 1), and reason.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    accountId: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                    reason: { type: Type.STRING }
                }
            }
        }
    });

    return JSON.parse(response.text || "{}");
}

export async function processMeetingAudio(base64Audio: string, mimeType: string): Promise<any> {
    if (useSettingsStore.getState().strictMode) return { summary: "Strict Mode Enabled", decisions: [], tasks: [] };
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                { inlineData: { data: base64Audio, mimeType } },
                {
                    text: `Analyze this meeting recording. 
                1. Identify speakers where possible(e.g., Speaker 1, Speaker 2) or use context if names are mentioned.
                2. Provide an Executive Summary.
                3. List Key Decisions with the speaker who proposed them if clear.
                4. Extract Actionable Tasks with assignees(if mentioned) and priority(High / Medium / Low).
                
                Return JSON in this format:
{
    "summary": "...",
        "decisions": ["..."],
            "tasks": [{ "title": "...", "assignee": "...", "priority": "..." }]
} ` }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    decisions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    tasks: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                assignee: { type: Type.STRING },
                                priority: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
        }
    });
    return JSON.parse(response.text || "{}");
}

export async function runProjectAnalysis(projectId: string, context: string): Promise<any> {
    if (useSettingsStore.getState().strictMode) return {};
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analyze logistics project ${projectId}.`,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
}

export async function executeAgentWorkflow(workflowId: string, agentName: string, role: string, context: string): Promise<any> {
    if (useSettingsStore.getState().strictMode) return {};
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Execute workflow ${workflowId} for agent ${agentName}.`,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
}

export async function parseFinancialDocument(base64Data: string, mimeType: string): Promise<{ type: 'Inflow' | 'Outflow', amountCents: number, description: string, date: string, merchant: string }> {
    if (useSettingsStore.getState().strictMode) return { type: 'Outflow', amountCents: 0, description: 'Strict Mode', date: new Date().toISOString().split('T')[0], merchant: '' };
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                { inlineData: { data: base64Data, mimeType } },
                { text: "Analyze this receipt/invoice. Extract: type (Inflow for sales/Outflow for expenses), total amount in cents (convert currency if needed, assume NGN if ambiguous), description (brief summary of items), date (YYYY-MM-DD), and merchant/payer name. Return JSON." }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, enum: ['Inflow', 'Outflow'] },
                    amountCents: { type: Type.NUMBER },
                    description: { type: Type.STRING },
                    date: { type: Type.STRING },
                    merchant: { type: Type.STRING }
                },
                required: ["type", "amountCents", "description", "date"]
            }
        }
    });
    return JSON.parse(response.text || "{}");
}