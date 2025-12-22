import { GoogleGenAI, Type, Modality } from "@google/genai";
import { db } from "./mockDb";

export const runProjectAnalysis = async (projectId: string): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const project = db.projects.find(p => p.id === projectId);
  if (!project) return { summary: "Project not found." };

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this project status for a ${db.organizationSettings.type} business.
    PROJECT: ${JSON.stringify(project)}
    TEAM: ${JSON.stringify(db.teamMembers)}
    
    Provide:
    1. A concise status summary for management.
    2. Identify any critical bottlenecks or "Red Flags".
    3. Suggest immediate actions for specific team members.
    4. Propose a "Project Vibe" sentiment (Success, Risk, Critical).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
          actions: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT, 
              properties: {
                task: { type: Type.STRING },
                assigneeName: { type: Type.STRING },
                urgency: { type: Type.STRING }
              }
            }
          },
          vibe: { type: Type.STRING, enum: ['Success', 'Risk', 'Critical'] }
        },
        required: ["summary", "redFlags", "vibe"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    return { summary: "Error analyzing project vibes.", redFlags: [], vibe: 'Risk' };
  }
};

export const getIndustrySetup = async (industry: string): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a professional business blueprint for a ${industry} organization. 
    Provide:
    1. A list of 4 core departments.
    2. A list of 5 common staff roles.
    3. A list of 4 bookkeeping categories typical for this industry.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          departments: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          roles: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          financeCategories: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          summary: { type: Type.STRING }
        },
        required: ["departments", "roles", "financeCategories"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    return {
      departments: ["Operations", "Administration", "Sales", "Support"],
      roles: ["Manager", "Associate", "Lead", "Specialist"],
      financeCategories: ["Sales", "Wages", "Rent", "Supplies"]
    };
  }
};

export const runAgenticReasoning = async (input: string, channel: string): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
      USER INPUT: "${input}"
      CHANNEL: ${channel}
      TENANT POLICIES: ${JSON.stringify(db.policyRules)}
      
      You are an autonomous AI Agent for a multi-tenant contact center.
      Analyze the input, determine intent, reason through the applicable policies, and decide on an action.
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          intent: { type: Type.STRING },
          language: { type: Type.STRING },
          sentiment: { type: Type.NUMBER, description: '0 to 1 scale' },
          reasoning: { type: Type.STRING },
          decision: { 
            type: Type.STRING, 
            enum: ['RESPOND', 'ESCALATE', 'UPDATE_CRM', 'CREATE_TICKET'] 
          },
          responseText: { type: Type.STRING },
          policyApplied: { type: Type.STRING }
        },
        required: ["intent", "reasoning", "decision", "responseText"]
      }
    }
  });

  try {
    const result = JSON.parse(response.text);
    db.agenticLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      channel: channel as any,
      customerName: 'Customer',
      intent: result.intent,
      reasoning: result.reasoning,
      actionTaken: result.decision,
      policyApplied: result.policyApplied || 'General Safety',
      outcome: result.decision === 'ESCALATE' ? 'Escalated' : 'Resolved',
      language: result.language || 'English'
    });
    db.save();
    return result;
  } catch (e) {
    return { decision: 'ESCALATE', responseText: 'I encountered an internal processing error. Connecting you to a human.' };
  }
};

export const generateAIResponse = async (prompt: string, context: string = ""): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: context ? `Context: ${context}\n\nUser: ${prompt}` : prompt,
  });
  return response.text || "No response generated.";
};

export const getAIResponseForAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    contents: {
      parts: [
        { inlineData: { data: base64Audio, mimeType } },
        { text: "Listen to this audio and provide a text response based on user request." }
      ]
    }
  });
  return response.text || "I couldn't hear that clearly.";
};

export const textToSpeech = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const runBankingChat = async (history: any[], input: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `HISTORY: ${JSON.stringify(history)}\nUSER INPUT: ${input}\n\nYou are a specialized Banking AI Assistant. Help the user with balance, transfers, and support.`,
  });
  return response.text || "I am currently unable to process your banking request.";
};

export const executeAgentWorkflow = async (id: string, name: string, role: string, context: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `AGENT: ${name} (${role})\nCONTEXT: ${context}\n\nPerform the workflow and log execution steps.`,
  });
  
  const wf = db.workflows.find(w => w.id === id);
  if (wf) {
    wf.lastRun = new Date().toISOString();
    wf.logs.unshift(`[${new Date().toLocaleTimeString()}] Agent ${name} completed task: ${response.text?.slice(0, 50)}...`);
    db.save();
  }
};

export const analyzeDeliveryNote = async (base64: string, mimeType: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType } },
        { text: "Analyze this delivery note and extract items, quantities, and prices." }
      ]
    }
  });
  return response.text;
};

export const fetchMarketPricingWithGrounding = async (itemName: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `What is the current average market price for 1kg of ${itemName} in Nigerian Naira? Provide only the number.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  
  const price = parseFloat(response.text?.replace(/[^0-9.]/g, "") || "0");
  return { price, source: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.[0]?.web?.uri || "" };
};