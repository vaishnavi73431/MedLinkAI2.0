const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const readline = require('readline');

// Load environment variables (mocking dotenv)
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
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// We'll look for 'medical.csv' or 'dataset.csv'
const POSSIBLE_FILES = ['medical.csv', 'dataset.csv', 'Symptom-severity.csv', 'archive/dataset.csv'];
let CSV_FILE = 'medical.csv';

async function importMedicalData() {
    // Find the file
    let found = false;
    for (const file of POSSIBLE_FILES) {
        if (fs.existsSync(file)) {
            CSV_FILE = file;
            found = true;
            break;
        }
    }

    if (!found) {
        console.error(`Medical dataset file not found! Please place 'medical.csv' (or 'dataset.csv') in root.`);
        return;
    }

    console.log(`Reading from ${CSV_FILE}...`);

    const fileStream = fs.createReadStream(CSV_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let headers = [];
    let count = 0;
    const items = [];

    // The dataset usually has: Disease, Symptom_1, Symptom_2, ...

    for await (const line of rl) {
        if (count === 0) {
            headers = line.split(',').map(h => h.trim().replace(/"/g, ''));
            count++;
            continue;
        }

        const row = parseCSVRow(line);
        if (row.length < 2) continue;

        // Map Disease
        const disease = row[0]?.trim();
        if (!disease) continue;

        // Collect Symptoms (rest of columns)
        const symptoms = [];
        for (let i = 1; i < row.length; i++) {
            const symptom = row[i]?.trim().replace(/_/g, ' '); // 'skin_rash' -> 'skin rash'
            if (symptom && symptom !== '') {
                symptoms.push(symptom);
            }
        }

        if (symptoms.length > 0) {
            items.push({
                disease: disease,
                symptoms: symptoms // Supabase handles array input for text[] columns
            });
        }

        count++;

        if (items.length >= 100) {
            const { error } = await supabase.from('medical_symptoms').upsert(items, { onConflict: 'disease', ignoreDuplicates: true });
            if (error) console.error("Insert error:", error.message);
            else console.log(`Imported batch ending at row ${count}`);
            items.length = 0;
        }
    }

    if (items.length > 0) {
        const { error } = await supabase.from('medical_symptoms').upsert(items, { onConflict: 'disease', ignoreDuplicates: true });
        if (error) console.error("Insert error:", error.message);
        else console.log(`Imported final batch.`);
    }

    console.log("Medical Data Import complete!");
}

function parseCSVRow(row) {
    // Simple CSV parser handling quotes
    const result = [];
    let cell = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(cell.trim());
            cell = '';
        } else {
            cell += char;
        }
    }
    result.push(cell.trim());
    return result;
}

importMedicalData();
