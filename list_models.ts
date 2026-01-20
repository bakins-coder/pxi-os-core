
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;

async function listModels() {
    if (!apiKey) { console.error('No Key'); return; }
    try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await resp.json();
        if (data.models) {
            console.log('--- ALL MODELS ---');
            data.models.forEach((m: any) => console.log(m.name.replace('models/', '')));
            console.log('--- END ---');
        } else {
            console.log('ERROR: ' + JSON.stringify(data));
        }
    } catch (e) { console.error(e); }
}
listModels();
