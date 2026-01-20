
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;

const models = [
    'gemini-flash-latest',
    'gemini-2.5-flash',
    'gemini-2.0-flash-exp'
];

async function testModels() {
    const genAI = new GoogleGenerativeAI(apiKey!);

    for (const modelName of models) {
        console.log(`\nTesting ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hi");
            console.log(`[SUCCESS] ${modelName} responded: ${result.response.text().slice(0, 20)}...`);
            return; // Exit on first success
        } catch (e: any) {
            console.log(`[FAILED] ${modelName}: ${e.message.split(' ')[0]} ${e.message.includes('429') ? '(Rate Limit)' : ''}`);
        }
    }
    console.log("\nAll tested models failed.");
}
testModels();
