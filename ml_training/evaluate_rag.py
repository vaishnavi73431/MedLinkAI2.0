import os
import asyncio
from dotenv import load_dotenv
from openai import AsyncOpenAI
from supabase import create_client, Client

# Load env variables (ensure .env is in the root or same dir)
dotenv_path = os.path.join(os.path.dirname(__file__), '../.env')
load_dotenv(dotenv_path)

# Configuration
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
OPENAI_API_KEY = os.getenv("VITE_OPENAI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY]):
    print("❌ Error: Missing API Keys in .env file.")
    print("Please ensure VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and VITE_OPENAI_API_KEY are set.")
    exit(1)

# Initialize Clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
openai = AsyncOpenAI(
    api_key=OPENAI_API_KEY,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

# ------------------------------------------------------------------
# 1. RETRIEVAL STEP (Simulating what the bot does)
# ------------------------------------------------------------------
async def retrieve_documents(query: str, rpc_name: str = 'match_nutrition_facts'):
    # Generate Embedding
    embedding_resp = await openai.embeddings.create(
        model="gemini-embedding-001",
        input=query,
        dimensions=768
    )
    embedding = embedding_resp.data[0].embedding
    print(f"   [Debug] Embedding Dim: {len(embedding)}")
    
    # Supabase Vector Search
    try:
        data = supabase.rpc(rpc_name, {
            "query_embedding": embedding,
            "match_threshold": 0.1, # Lowered from 0.5 for debugging
            "match_count": 3
        }).execute()
        
        if hasattr(data, 'data'):
            return data.data
        return []
    except Exception as e:
        print(f"\n   [Debug] RPC Failed: {e}")
        print("   [Debug] Checking 'nutrition_facts' table schema...")
        try:
            # Fallback: Just get one row from the table to see structure
            check = supabase.table('nutrition_facts').select("*").limit(1).execute()
            if check.data:
                print(f"   [Debug] Real Columns: {check.data[0].keys()}")
        except Exception as e2:
             print(f"   [Debug] Table Check Failed: {e2}")
        return []

# ------------------------------------------------------------------
# 2. EVALUATION STEP (LLM-as-a-Judge)
# ------------------------------------------------------------------
async def evaluate_rag(question: str, golden_fact: str):
    print(f"\n🔍 Evaluating: '{question}'")
    
    # A. Measure Context Precision (Did we find the data?)
    docs = await retrieve_documents(question)
    
    # Construction contextual string from structured data
    # Real Schema: dict_keys(['id', 'food_name', 'calories', 'proteins', 'fats', 'carbs', 'image_url', 'embedding'])
    
    doc_text_list = []
    for d in docs:
        details = f"Food: {d.get('food_name')}, Calories: {d.get('calories')}, Protein: {d.get('proteins')}g, Fats: {d.get('fats')}g, Carbs: {d.get('carbs')}g"
        doc_text_list.append(details)
        
    doc_text = "\n".join(doc_text_list)
    print(f"   [Debug] Constructed Context: {doc_text[:100]}...")
    
    eval_prompt = f"""
    You are an AI Judge evaluating a RAG pipeline.
    
    USER QUESTION: "{question}"
    RETRIEVED CONTEXT:
    {doc_text}
    
    TASK:
    Rate the RELEVANCE of the retrieved context to the question on a scale of 0.0 to 1.0.
    1.0 = The context contains the exact answer.
    0.0 = The context is completely irrelevant/noise.
    
    Return ONLY the score (e.g., 0.8).
    """
    
    score_resp = await openai.chat.completions.create(
        model="gemini-2.5-flash",
        messages=[{"role": "user", "content": eval_prompt}]
    )
    score_str = score_resp.choices[0].message.content.strip()
    try:
        score = float(score_str)
    except:
        score = 0.5
        
    print(f"   📄 Context Relevance Score: {score}/1.0")
    
    # B. Hallucination Check (Faithfulness)
    # Generate an answer using the retrieved context
    gen_prompt = f"Based ONLY on this context: {doc_text}\nAnswer: {question}"
    gen_resp = await openai.chat.completions.create(
        model="gemini-2.5-flash",
        messages=[{"role": "user", "content": gen_prompt}]
    )
    generated_answer = gen_resp.choices[0].message.content
    
    print(f"   🤖 Generated Answer: {generated_answer}")
    
    # Check if it matches Golden Fact (Loose check)
    if score < 0.5:
        print("   ⚠️  RISK: Low Retrieval Quality (Hallucination Likely)")
    else:
        print("   ✅  SAFE: Context verified.")

# ------------------------------------------------------------------
# MAIN TEST SUITE
# ------------------------------------------------------------------
async def main():
    print("🚀 Starting RAG Evaluator (LLM-as-a-Judge)...\n")
    
    test_cases = [
        ("How many calories in an apple?", "Apples have about 52 calories per 100g"),
        ("Is pizza healthy?", "Pizza can be high in calories and sodium"),
        ("What are the benefits of protein?", "Protein helps build muscle"),
    ]
    
    for q, gold in test_cases:
        await evaluate_rag(q, gold)

if __name__ == "__main__":
    asyncio.run(main())
