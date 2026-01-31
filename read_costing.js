// Script to extract recipes from costing sheet and generate SQL
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '2018 costing sheet Celebrations.xlsx');
const workbook = XLSX.readFile(filePath);
workbook.SheetNames.forEach(s => console.log('Sheet:', s));

const ORG_ID = '10959119-72e4-4e57-ba54-923e36bba6a6';

// Skip these sheets - they're not product recipes
const skippedSheets = ['Menu Page', 'Price Watch', 'Price Watch ', 'Sheet1'];

// Map sheet names to cleaner product names
const productNameMap = {
    'cost analysis Jollof Rice Scoop': 'Jollof Rice',
    'Chinese Fried Rice (Scoops)': 'Chinese Fried Rice',
    'Prawn & Calamari': 'Prawn & Calamari',
    'Sweet & Sour Chicken': 'Sweet & Sour Chicken',
    'Efor Riro': 'Efor Riro',
    'Vegetable Salad': 'Vegetable Salad',
    'Curry Chicken': 'Curry Chicken',
    'Assorted Sauce': 'Assorted Sauce',
    'Xquisite Salad': 'Xquisite Salad',
    'Moi-Moi (wraps)': 'Moi-Moi',
    'Yam Porridge': 'Yam Porridge',
    'Ofada Sauce': 'Ofada Sauce',
    'Sea Food': 'Seafood Platter',
    'Roasted Potato': 'Roasted Potato',
    'Chicken Stew': 'Chicken Stew',
    'Beef In Stew': 'Beef Stew',
    'Fried Fish': 'Fried Fish',
    'Semo': 'Semolina (Semo)',
    'Wheat': 'Wheat Meal',
    'Shredded Beef': 'Shredded Beef',
    'Fettuccine Pasta': 'Fettuccine Pasta',
    'Grilled Prawns': 'Grilled Prawns',
    'Efo Elegusi': 'Egusi Soup',
    'Bean Porrigde': 'Bean Porridge',
    'White Bean': 'White Beans',
    'Poundo Yam': 'Poundo Yam'
};

// Categorize products
const categoryMap = {
    'Jollof Rice': 'Main Course',
    'Chinese Fried Rice': 'Main Course',
    'Prawn & Calamari': 'Appetizer',
    'Sweet & Sour Chicken': 'Main Course',
    'Efor Riro': 'Soup',
    'Vegetable Salad': 'Salad',
    'Curry Chicken': 'Main Course',
    'Assorted Sauce': 'Side Dish',
    'Xquisite Salad': 'Salad',
    'Moi-Moi': 'Side Dish',
    'Yam Porridge': 'Main Course',
    'Ofada Sauce': 'Sauce',
    'Seafood Platter': 'Main Course',
    'Roasted Potato': 'Side Dish',
    'Chicken Stew': 'Stew',
    'Beef Stew': 'Stew',
    'Fried Fish': 'Main Course',
    'Semolina (Semo)': 'Swallow',
    'Wheat Meal': 'Swallow',
    'Shredded Beef': 'Side Dish',
    'Fettuccine Pasta': 'Main Course',
    'Grilled Prawns': 'Appetizer',
    'Egusi Soup': 'Soup',
    'Bean Porridge': 'Side Dish',
    'White Beans': 'Side Dish',
    'Poundo Yam': 'Swallow'
};

function extractRecipe(sheetName) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return null;

    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    const portionRow = data[7] || [];
    // Identify all portion columns (numeric headers in Row 8)
    const tierMapping = [];
    portionRow.forEach((val, idx) => {
        if (typeof val === 'number' && val > 0) {
            tierMapping.push({ portions: val, colIndex: idx });
        }
    });

    // Find the column index for 100 portions as the default "qtyPerPortion" base
    const col100 = tierMapping.find(t => t.portions === 100) || tierMapping[Math.floor(tierMapping.length / 2)];
    const col100Index = col100 ? col100.colIndex : 6;

    // Find ingredient rows (starting around row 11)
    const ingredients = [];
    const seenIngredients = new Set();

    for (let i = 10; i < Math.min(data.length, 40); i++) {
        const row = data[i];
        if (!row || !row[0]) continue;

        const ingredientName = String(row[0]).trim();

        // Stop at COST TABLE section
        if (ingredientName.includes('COST TABLE') || ingredientName.includes('CODE')) break;

        // Skip headers and empty/section rows
        if (!ingredientName ||
            ingredientName === 'Item' ||
            ingredientName === 'ITEM' ||
            ingredientName.includes('descriptions') ||
            ingredientName.includes('portion') ||
            ingredientName === '') continue;

        // Skip duplicates
        if (seenIngredients.has(ingredientName.toLowerCase())) continue;
        seenIngredients.add(ingredientName.toLowerCase());

        // Extract all tiers for this ingredient
        const scalingTiers = {};
        tierMapping.forEach(tier => {
            const val = row[tier.colIndex];
            if (typeof val === 'number') {
                scalingTiers[tier.portions] = Math.round(val * 10000) / 10000;
            }
        });

        // Get default qty from the 100-portion column
        let qty100 = row[col100Index];
        if (typeof qty100 !== 'number' || qty100 <= 0) {
            // If No 100 portion value, use the first available tier scaled to 100
            const firstTier = Object.keys(scalingTiers)[0];
            if (firstTier) {
                qty100 = (scalingTiers[firstTier] / parseFloat(firstTier)) * 100;
            } else continue;
        }

        const qtyPerPortion = qty100 / 100;

        // Determine unit based on ingredient name
        let unit = 'kg';
        const lowerName = ingredientName.toLowerCase();
        if (lowerName.includes('oil') || lowerName.includes('puree')) {
            unit = 'litre';
        } else if (lowerName.includes('egg')) {
            unit = 'pcs';
        } else if (lowerName.includes('maggi') || lowerName.includes('knorr')) {
            unit = 'cubes';
        }

        ingredients.push({
            name: ingredientName,
            qtyPerPortion: Math.round(qtyPerPortion * 10000) / 10000,
            unit: unit,
            scalingTiers: scalingTiers
        });
    }

    return {
        name: productNameMap[sheetName] || sheetName,
        category: categoryMap[productNameMap[sheetName] || sheetName] || 'General',
        basePortions: 100,
        ingredients: ingredients
    };
}

// Extract all recipes
let recipes = [];
for (const sheetName of workbook.SheetNames) {
    if (skippedSheets.includes(sheetName)) continue;

    const recipe = extractRecipe(sheetName);
    if (recipe && recipe.ingredients.length > 0) {
        recipes.push(recipe);
    }
}

// CREATE COMPOSITE RECIPES
const jollof = recipes.find(r => r.name === 'Jollof Rice');
const friedRice = recipes.find(r => r.name === 'Chinese Fried Rice');
const chicken = recipes.find(r => r.name === 'Chicken Stew');
const beef = recipes.find(r => r.name === 'Beef Stew');
const salad = recipes.find(r => r.name === 'Vegetable Salad');
const moimoi = recipes.find(r => r.name === 'Moi-Moi');

if (jollof && friedRice && chicken && beef && salad && moimoi) {
    const ingredientMap = {};

    const addComponent = (recipe, factor = 1.0) => {
        recipe.ingredients.forEach(ing => {
            const key = ing.name.toLowerCase().trim();
            if (ingredientMap[key]) {
                ingredientMap[key].qtyPerPortion += ing.qtyPerPortion * factor;
                // Combine tiers
                Object.keys(ing.scalingTiers).forEach(tier => {
                    ingredientMap[key].scalingTiers[tier] = (ingredientMap[key].scalingTiers[tier] || 0) + (ing.scalingTiers[tier] * factor);
                });
            } else {
                const scaledTiers = {};
                Object.keys(ing.scalingTiers).forEach(tier => {
                    scaledTiers[tier] = ing.scalingTiers[tier] * factor;
                });
                ingredientMap[key] = {
                    ...ing,
                    qtyPerPortion: ing.qtyPerPortion * factor,
                    scalingTiers: scaledTiers
                };
            }
        });
    };

    addComponent(jollof, 0.5);
    addComponent(friedRice, 0.5);
    addComponent(chicken, 1.0);
    addComponent(beef, 1.0);
    addComponent(salad, 1.0);
    addComponent(moimoi, 1.0);

    const optionARecipe = {
        name: 'Nigerian Menu - Option A',
        category: 'Package',
        basePortions: 100,
        ingredients: Object.values(ingredientMap).map(ing => ({
            ...ing,
            qtyPerPortion: Math.round(ing.qtyPerPortion * 10000) / 10000,
            scalingTiers: Object.fromEntries(Object.entries(ing.scalingTiers).map(([k, v]) => [k, Math.round(v * 10000) / 10000]))
        }))
    };

    recipes.push(optionARecipe);
    console.log('Created Composite Recipe: Nigerian Menu - Option A (Tiered)');
}

// Generate SQL
let sql = `-- Migration: Import actual recipes with scaling tiers
-- This uses JSONB to preserve MD's granular scaling measurements

UPDATE products SET recipe_id = NULL WHERE organization_id = '${ORG_ID}';
DELETE FROM recipe_ingredients WHERE recipe_id IN (SELECT id FROM recipes WHERE organization_id = '${ORG_ID}');
DELETE FROM recipes WHERE organization_id = '${ORG_ID}';

DO $$
DECLARE
    org_id UUID := '${ORG_ID}';
`;

recipes.forEach((recipe, i) => { sql += `    recipe_${i} UUID;\n`; });

sql += `BEGIN\n`;

recipes.forEach((recipe, i) => {
    const varName = `recipe_${i}`;
    const escapedName = recipe.name.replace(/'/g, "''");

    sql += `
    -- ${recipe.name}
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, '${escapedName}', '${recipe.category}', ${recipe.basePortions})
    RETURNING id INTO ${varName};
`;

    if (recipe.ingredients.length > 0) {
        sql += `
    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES\n`;

        recipe.ingredients.forEach((ing, j) => {
            const escapedIngName = ing.name.replace(/'/g, "''");
            const priceQuery = `${escapedIngName} price per ${ing.unit} Lagos wholesale`;
            const tiersJson = JSON.stringify(ing.scalingTiers);
            const comma = j < recipe.ingredients.length - 1 ? ',' : ';';
            sql += `    (${varName}, '${escapedIngName}', ${ing.qtyPerPortion}, '${ing.unit}', '${priceQuery}', '${tiersJson}'::jsonb)${comma}\n`;
        });
    }
});

sql += `
    -- Link recipes to products
`;

recipes.forEach((recipe, i) => {
    const varName = `recipe_${i}`;
    const escapedName = recipe.name.replace(/'/g, "''").toLowerCase();
    const words = escapedName.split(' ').filter(w => w.length > 3);

    if (words.length > 0) {
        sql += `    UPDATE products SET recipe_id = ${varName} WHERE organization_id = org_id AND recipe_id IS NULL AND (`;
        sql += words.map(w => `LOWER(name) LIKE '%${w}%'`).join(' AND ');
        sql += `);\n`;
    }
});

sql += `
    -- Manual Overrides
    UPDATE products SET recipe_id = (SELECT id FROM recipes WHERE name = 'Nigerian Menu - Option A' LIMIT 1) WHERE organization_id = org_id AND (LOWER(name) LIKE '%nigerian%menu%option%a%' OR LOWER(name) LIKE '%option%a%');
    UPDATE products SET recipe_id = (SELECT id FROM recipes WHERE name = 'Jollof Rice' LIMIT 1) WHERE organization_id = org_id AND LOWER(name) LIKE '%jollof%' AND recipe_id IS NULL;
    UPDATE products SET recipe_id = (SELECT id FROM recipes WHERE name = 'Chinese Fried Rice' LIMIT 1) WHERE organization_id = org_id AND (LOWER(name) LIKE '%chinese%fried%rice%' OR LOWER(name) LIKE '%chinese%menu%') AND recipe_id IS NULL;
    
    RAISE NOTICE 'Imported ${recipes.length} recipes with full scaling tiers';
END $$;
`;

fs.writeFileSync('supabase/migrations/20260129110000_import_actual_recipes.sql', sql);
console.log(`Generated SQL with ${recipes.length} recipes and scaling tiers`);
