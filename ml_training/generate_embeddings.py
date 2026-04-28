
import os
import asyncio
from openai import AsyncOpenAI
from supabase import create_client, Client
from dotenv import load_dotenv

from pathlib import Path

# Load env from parent directory reliably
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_ANON_KEY')
OPENAI_API_KEY = os.getenv('VITE_OPENAI_API_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing Supabase credentials in .env")
    exit(1)

# Initialize Clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
client = AsyncOpenAI(
    api_key=OPENAI_API_KEY,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

async def generate_embedding(text: str):
    response = await client.embeddings.create(
        model="gemini-embedding-001",
        input=text,
        dimensions=768
    )
    return response.data[0].embedding

async def main():
    print("🚀 Starting Embedding Generation...")
    
    # 1. Fetch rows with missing embeddings (or all rows if you want to regenerate)
    # Note: 'is' operator for NULL check in PostgREST is 'is.null'
    try:
        response = supabase.table('nutrition_facts').select('*').execute()
        rows = response.data
    except Exception as e:
        print(f"Error fetching rows: {e}")
        return

    print(f"Found {len(rows)} rows. Checking for missing embeddings...")
    
    updated_count = 0
    
    for row in rows:
        # Check if embedding is missing or empty
        # We also check if data is missing now
        
        print(f"Processing: {row['food_name']}...")
        
        # Check if nutrition data is missing
        if row.get('calories') is None:
             print(f"   ⚠️  Missing Data. Generating nutrition info...")
             try:
                 # Ask LLM for data
                 prompt = f"Return strictly JSON for 100g of {row['food_name']}: {{'calories': int, 'proteins': float, 'fats': float, 'carbs': float}}"
                 chat_completion = await client.chat.completions.create(
                     model="gemini-2.5-flash",
                     messages=[{"role": "user", "content": prompt}],
                     response_format={"type": "json_object"}
                 )
                 import json
                 data = json.loads(chat_completion.choices[0].message.content)
                 
                 # Construct text for embedding
                 content_text = f"{row['food_name']}: {data['calories']} calories, {data['proteins']}g protein, {data['fats']}g fat, {data['carbs']}g carbs"
                 
                 # Prepare Update payload (Embedding + Data)
                 vector = await generate_embedding(content_text)
                 payload = {
                     'embedding': vector,
                     'calories': data['calories'],
                     'proteins': data['proteins'],
                     'fats': data['fats'],
                     'carbs': data['carbs']
                 }
                 
                 response = supabase.table('nutrition_facts').update(payload).eq('id', row['id']).execute()
                 if response.data:
                     updated_count += 1
                     print(f"   ✅ Updated with Data & Vector.")
                     # Rate Limit protection (3 RPM limit observed)
                     print("   ⏳ Sleeping 20s to avoid Rate Limit...")
                     await asyncio.sleep(20)
                 else:
                     print(f"   ⚠️  FAILED Update.")
                     
             except Exception as e:
                 print(f"   ❌ Generation Failed: {e}")
                 continue
        else:
            # Data exists, just vector missing (Unlikely now, but good fallback)
            content_text = f"{row['food_name']}: {row['calories']} calories, {row['proteins']}g protein, {row['fats']}g fat, {row['carbs']}g carbs"
            try:
                vector = await generate_embedding(content_text)
                response = supabase.table('nutrition_facts').update({'embedding': vector}).eq('id', row['id']).execute()
                if response.data:
                    updated_count += 1
                    print(f"   ✅ Updated Vector Only.")
            except Exception as e:
                print(f"   ❌ Vector Update Failed: {e}")
            
    print(f"\n🎉 Done! Generated embeddings for {updated_count} rows.")

if __name__ == "__main__":
    asyncio.run(main())
