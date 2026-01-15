const fs = require('fs');
const path = require('path');

const targetDir = 'c:/Users/akinb/pxi-os-core/src/assets/presentation';

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

console.log("Renaming files in " + targetDir);

Object.entries(mappings).forEach(([srcFile, destFile]) => {
    const srcPath = path.join(targetDir, srcFile);
    const destPath = path.join(targetDir, destFile);

    try {
        if (fs.existsSync(srcPath)) {
            fs.renameSync(srcPath, destPath);
            console.log(`Renamed ${srcFile} -> ${destFile}`);
        } else {
            // Maybe already renamed or missing?
            if (fs.existsSync(destPath)) {
                console.log(`Already exists: ${destFile}`);
            } else {
                console.warn(`Source missing: ${srcFile}`);
            }
        }
    } catch (err) {
        console.error(`Error renaming ${srcFile}:`, err.message);
    }
});
