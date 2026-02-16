const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const readline = require('readline');

// Load environment variables (mocking dotenv for simplicity in this script scope)
// In a real scenario, use dotenv. Here we expect the user to have these valid or we can read from .env file manually.
// For now, I will read the .env file to get the keys.

const parseEnv = () => {
    try {
        const envConfig = fs.readFileSync('.env', 'utf-8');
        const env = {};
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                env[key.trim()] = value.trim();
            }
        });
        return env;
    } catch (e) {
        console.error("Could not read .env file");
        return {};
    }
};

const env = parseEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY; // Using anon key, make sure RLS allows insert or use service_role if available

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CSV_FILE = 'nutrition.csv';

async function importData() {
    if (!fs.existsSync(CSV_FILE)) {
        console.error(`File ${CSV_FILE} not found! Please place it in the root directory.`);
        return;
    }

    const fileStream = fs.createReadStream(CSV_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let headers = [];
    let count = 0;
    const items = [];

    // Header mapping (adjust based on actual CSV columns from Kaggle)
    // Common Food-101 cols: id, name, nutrition... 
    // We'll try to map dynamically or assume standard columns.
    // Let's assume the user renamed it or it has: 'name', 'calories', 'protein', 'fat', 'carbs'
    // or we map by index if headers are known.

    // For Food-101 Nutritional Info (kaggke), columns are often:
    // index, name, energy (kcal), protein (g), total_fat (g), carbohydrate (g) ...
    // Let's try to detect.

    for await (const line of rl) {
        if (count === 0) {
            headers = line.split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
            console.log("Headers detected:", headers);
            count++;
            continue;
        }

        // Simple CSV parse (handling quotes roughly)
        // This regex splits by comma but ignores commas inside quotes
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        // Fallback or better split
        // const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

        // Actually, a simple split is verified for many Kaggle datasets if no text fields contain commas.
        // Let's use a robust split.
        const row = parseCSVRow(line);

        if (row.length < 2) continue;

        const item = {};

        // Map columns
        // We look for keywords in headers
        const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('food') || h.includes('desc') || h.includes('label'));
        const calIdx = headers.findIndex(h => h.includes('calur') || h.includes('cal') || h.includes('energy')); // 'energy_100g' or 'calories'
        const protIdx = headers.findIndex(h => h.includes('prot'));
        const fatIdx = headers.findIndex(h => h.includes('fat'));
        const carbIdx = headers.findIndex(h => h.includes('carb'));

        if (nameIdx === -1) continue;

        item.food_name = row[nameIdx]?.replace(/"/g, '').trim();
        item.calories = parseFloat(row[calIdx] || 0);
        item.proteins = parseFloat(row[protIdx] || 0);
        item.fats = parseFloat(row[fatIdx] || 0);
        item.carbs = parseFloat(row[carbIdx] || 0);

        if (item.food_name) {
            items.push(item);
        }

        count++;

        // Batch insert every 100 items
        if (items.length >= 100) {
            const { error } = await supabase.from('nutrition_facts').upsert(items, { onConflict: 'food_name', ignoreDuplicates: true });
            if (error) console.error("Insert error:", error.message);
            else console.log(`Imported batch ending at row ${count}`);
            items.length = 0;
        }
    }

    // Final batch
    if (items.length > 0) {
        const { error } = await supabase.from('nutrition_facts').upsert(items, { onConflict: 'food_name', ignoreDuplicates: true });
        if (error) console.error("Insert error:", error.message);
        else console.log(`Imported final batch.`);
    }

    console.log("Import complete!");
}

function parseCSVRow(row) {
    const result = [];
    let start = 0;
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
        if (row[i] === '"') {
            inQuotes = !inQuotes;
        } else if (row[i] === ',' && !inQuotes) {
            result.push(row.substring(start, i));
            start = i + 1;
        }
    }
    result.push(row.substring(start));
    return result;
}

importData();
