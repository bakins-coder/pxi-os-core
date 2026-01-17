import dotenv from 'dotenv';
import fs from 'fs';

try {
    const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} catch (e) { console.log('No .env.local'); }

const key = process.env.VITE_GEMINI_API_KEY;

if (!key) {
    console.error('SKIP: No Key found.');
    process.exit(1);
}

async function listModels() {
    console.log('--- Listing Available Models (v1beta) ---');
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            const names = data.models
                .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
                .map(m => m.name)
                .join('\n');

            fs.writeFileSync('models_log.txt', names);
            console.log('Wrote models to models_log.txt');
        } else {
            console.log('API Error/Unexpected:', JSON.stringify(data));
        }

    } catch (e) {
        console.error('Fetch FAILED:', e);
    }
}

listModels();
