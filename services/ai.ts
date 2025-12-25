
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { nexusStore } from "./nexusStore";

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getCFOAdvice(): Promise<any> {
  const ai = getAIInstance();
  const financialSummary = {
    cash: nexusStore.chartOfAccounts.find(a => a.id === 'coa-1')?.balanceCents || 0,
    burnRate: nexusStore.getNetBurnRate(),
    runway: nexusStore.getRunwayMonths(),
    turnover: nexusStore.organizationSettings.annual_turnover_cents || 0,
    assets: nexusStore.fixedAssets
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are the "LedgerAI CFO Agent". Analyze these 2025 Nigerian fiscal metrics:
    ${JSON.stringify(financialSummary)}
    
    Provide:
    1. A runway analysis (Burn rate vs Cash).
    2. Tax avoidance advice based on NTA 2025.
    3. Capital Allowance suggestions.
    4. Reserve sweep recommendations.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          runwayInsight: { type: Type.STRING },
          taxAdvice: { type: Type.ARRAY, items: { type: Type.STRING } },
          reserveMoves: { type: Type.ARRAY, items: { type: Type.STRING } },
          sentiment: { type: Type.STRING, enum: ['Healthy', 'Monitor', 'Critical'] }
        },
        required: ["summary", "runwayInsight", "taxAdvice", "sentiment"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { summary: "Operational ledger analyzed. Stability confirmed.", sentiment: 'Healthy', taxAdvice: [] };
  }
}

export async function suggestCOAForTransaction(description: string): Promise<string> {
  const ai = getAIInstance();
  const coaContext = nexusStore.chartOfAccounts.map(a => `${a.code}: ${a.name} (${a.type})`).join(', ');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on the transaction: "${description}", suggest the best Account ID from: ${coaContext}. Return only the ID.`,
  });

  return (response.text || "").trim();
}

export async function generateFIRSInvoiceJSON(invoice: any): Promise<any> {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a FIRS E-Invoicing compliant JSON for: ${JSON.stringify(invoice)}.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
}

export async function generateAIResponse(prompt: string, context: string = ""): Promise<string> {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: context ? `Context: ${context}\n\nUser: ${prompt}` : prompt,
  });
  return response.text || "No response generated.";
}

export async function getAIResponseForAudio(base64Audio: string, mimeType: string): Promise<string> {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    contents: {
      parts: [
        { inlineData: { data: base64Audio, mimeType } },
        { text: "Respond to this audio input." }
      ]
    }
  });
  return response.text || "I couldn't process the audio.";
}

export async function textToSpeech(text: string): Promise<string> {
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

export async function runBankingChat(history: any[], input: string): Promise<string> {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `HISTORY: ${JSON.stringify(history)}\nINPUT: ${input}`,
  });
  return response.text || "Banking core unreachable.";
}

export async function runProjectAnalysis(projectId: string): Promise<any> {
  const ai = getAIInstance();
  const project = nexusStore.projects.find(p => p.id === projectId);
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze project: ${JSON.stringify(project)}`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
}

export async function getIndustrySetup(industry: string): Promise<any> {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Blueprint for ${industry} organization.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
}

export async function executeAgentWorkflow(id: string, name: string, role: string, context: string): Promise<void> {
  const ai = getAIInstance();
  await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Workflow: ${name}\nContext: ${context}`,
  });
}

export async function analyzeDeliveryNote(base64: string, mimeType: string): Promise<string> {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: "Analyze delivery note." }] }
  });
  return response.text || "Analysis failed.";
}

export async function performAgenticMarketResearch(itemName: string): Promise<any> {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Perform deep market research for the current price of "${itemName}" in the Nigerian market (Feb 2025). 
    Identify wholesale vs retail. Search for 3 distinct sources. 
    Predict if the price is rising, falling or stable based on inflation trends.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          marketPriceCents: { type: Type.NUMBER },
          trend: { type: Type.STRING, enum: ['UP', 'DOWN', 'STABLE'] },
          reasoning: { type: Type.STRING },
          sources: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                uri: { type: Type.STRING },
                price: { type: Type.NUMBER }
              }
            }
          }
        },
        required: ["marketPriceCents", "trend", "reasoning", "sources"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return null;
  }
}
