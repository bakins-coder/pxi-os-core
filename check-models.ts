
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listModels() {
    const key = process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
    if (!key) {
        fs.writeFileSync('models.log', "No API Key found in .env.local");
        return;
    }

    const genAI = new GoogleGenerativeAI(key);
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();
        let output = "Available Models:\n";
        data.models?.forEach((m: any) => {
            if (m.name.includes('gemini') || m.name.includes('flash')) {
                output += `- ${m.name} (Methods: ${m.supportedGenerationMethods})\n`;
            }
        });
        fs.writeFileSync('models.log', output);
        console.log("Written to models.log");
    } catch (error: any) {
        fs.writeFileSync('models.log', `Error: ${error.message}`);
    }
}

listModels();
