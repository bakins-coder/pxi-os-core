import { GoogleGenAI } from "@google/genai";
import { useDataStore } from "../store/useDataStore";

// Initialize AI instance (reusing the same API key logic)
const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export interface ExtractedInventoryItem {
    name: string;
    quantity: number;
    unit: string;
    category: string;
    confidence: number;
}

export interface ExtractedReceipt {
    merchantName: string;
    date: string;
    totalAmount: number;
    currency: string;
    items: {
        description: string;
        amount: number;
    }[];
}

/**
 * processDocument
 * Generic function to process an image with a specific prompt and schema
 */
async function processDocument<T>(
    base64Image: string,
    prompt: string,
    responseSchema?: any
): Promise<T> {
    const ai = getAIInstance();

    // Remove data URL prefix if present for the API call
    const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: 'image/jpeg',
                                data: base64Data
                            }
                        }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        const text = typeof response.text === 'function' ? response.text() : response.text;
        if (!text) throw new Error("No response from AI");

        return JSON.parse(text) as T;
    } catch (error) {
        console.error("OCR Processing Error:", error);
        throw error;
    }
}

/**
 * Parse handwritten or printed inventory lists
 */
export async function parseInventoryList(base64Image: string): Promise<ExtractedInventoryItem[]> {
    const prompt = `
    Analyze this image of an inventory list (handwritten or printed).
    Extract all items listed with their quantities and units.
    Infer the category for each item (e.g., Produce, Dairy, Meat, Dry Goods, Beverages).
    If no unit is specified, infer a sensible default (e.g., 'pcs', 'kg', 'pack').
    Return a CONFIDENCE score (0-1) for each extraction.
  `;

    const schema = {
        type: "ARRAY",
        items: {
            type: "OBJECT",
            properties: {
                name: { type: "STRING" },
                quantity: { type: "NUMBER" },
                unit: { type: "STRING" },
                category: { type: "STRING" },
                confidence: { type: "NUMBER" },
            },
            required: ["name", "quantity", "unit", "category", "confidence"],
        },
    };

    return processDocument<ExtractedInventoryItem[]>(base64Image, prompt, schema);
}

/**
 * Parse receipts and invoices
 */
export async function parseReceipt(base64Image: string): Promise<ExtractedReceipt> {
    const prompt = `
    Analyze this receipt/invoice.
    Extract the merchant name, date, total amount, currency, and line items.
    Ensure numeric values are parsed correctly.
  `;

    const schema = {
        type: "OBJECT",
        properties: {
            merchantName: { type: "STRING" },
            date: { type: "STRING" },
            totalAmount: { type: "NUMBER" },
            currency: { type: "STRING" },
            items: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        description: { type: "STRING" },
                        amount: { type: "NUMBER" }
                    }
                }
            }
        },
        required: ["merchantName", "date", "totalAmount", "currency", "items"],
    };

    return processDocument<ExtractedReceipt>(base64Image, prompt, schema);
}
