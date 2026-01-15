const fs = require('fs');
const path = require('path');

const sourceDir = 'C:/Users/akinb/.gemini/antigravity/brain/6f89f9ee-4c3c-40f8-ad52-1875b655c8b1';
const destDir = 'c:/Users/akinb/pxi-os-core/public/presentation';

const mappings = {
    'presentation_arch_bg_1768476006888.png': 'arch.png',
    'presentation_chaos_paperwork_1768479185784.png': 'chaos_paperwork.png',
    'presentation_finance_bg_1768476037701.png': 'finance.png',
    'presentation_inventory_bg_1768476022319.png': 'inventory.png',
    'presentation_legacy_tech_1768479202171.png': 'legacy_tech.png',
    'presentation_people_working_1768479234054.png': 'people_working.png',
    'presentation_spreadsheets_1768479218214.png': 'spreadsheets.png',
    'presentation_team_diversity_1768479169506.png': 'team_diversity.png',
    'presentation_title_bg_1768475991305.png': 'title.png'
};

if (!fs.existsSync(destDir)) {
    try {
        fs.mkdirSync(destDir, { recursive: true });
    } catch (e) { console.log("Dir exists or error", e.message); }
}

console.log("Starting copy...");

Object.entries(mappings).forEach(([srcFile, destFile]) => {
    const srcPath = path.join(sourceDir, srcFile);
    const destPath = path.join(destDir, destFile);

    try {
        if (!fs.existsSync(srcPath)) {
            console.error("SOURCE MISSING: " + srcPath);
            return;
        }
        fs.copyFileSync(srcPath, destPath);
        console.log("SUCCESS: " + destFile);
    } catch (err) {
        console.error("FAIL " + srcFile + ": " + err.message);
    }
});
