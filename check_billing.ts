
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;

async function checkBillingStatus() {
    const genAI = new GoogleGenerativeAI(apiKey!);
    // Using a standard model that usually requires decent quota
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    console.log("Checking Billing/Quota Status...");
    let successfulRequests = 0;

    // Try 5 rapid requests. Free tier often chokes on bursts or specific models.
    const start = Date.now();
    for (let i = 0; i < 5; i++) {
        try {
            await model.generateContent(`Ping ${i}`);
            successfulRequests++;
            process.stdout.write(".");
        } catch (e: any) {
            console.log(`\n[Request ${i + 1} Failed]: ${e.message.split(' ')[0]}`);
            if (e.message.includes('429')) {
                console.log("\nRESULT: 429 Error detected. Billing likely NOT active/linked or Free Tier limits still apply.");
                return;
            }
            if (e.message.includes('404')) {
                console.log("\nRESULT: 404 - Model not found. This might mean the standard 'paid' model alias is not accessible.");
                // Fallback check on the working model
                await checkWorkingModel();
                return;
            }
        }
    }

    console.log("\n\nRESULT: 5/5 Rapid Requests Succeeded!");
    console.log("This strongly suggests you have either a very fresh Free Tier or Billing is ACTIVE.");
}

async function checkWorkingModel() {
    const genAI = new GoogleGenerativeAI(apiKey!);
    // Check the one we know works
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite-001' });
    console.log("\nDouble checking on 'gemini-2.0-flash-lite-001'...");
    try {
        await model.generateContent("Ping");
        console.log("Basic connectivity verified.");
    } catch (e: any) {
        console.log("Even the lite model failed: " + e.message);
    }
}

checkBillingStatus();
