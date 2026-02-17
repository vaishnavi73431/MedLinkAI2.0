
import os
import time
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv
from supabase import create_client, Client

# Load .env variables
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

# Initialize OpenAI
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Initialize Supabase
url: str = os.getenv('VITE_SUPABASE_URL')
key: str = os.getenv('VITE_SUPABASE_ANON_KEY')
supabase: Client = create_client(url, key)

# Nutrition Facts Knowledge Base (Simulated Articles)
facts = [
    {
        "content": "Calorie Needs: Adult women typically need 1,600–2,400 calories per day, and adult men need 2,000–3,000 calories per day. However, this varies based on age, size, height, lifestyle, overall health, and activity level.",
        "category": "Calories"
    },
    {
        "content": "Macronutrients: A balanced diet should consist of 45–65% carbohydrates, 20–35% fats, and 10–35% proteins. Protein is essential for muscle repair, fats for hormone production, and carbs for energy.",
        "category": "Macronutrients"
    },
    {
        "content": "Protein Sources: Good sources of protein include lean meats (chicken, turkey), fish (salmon, tuna), eggs, dairy products (greek yogurt, cottage cheese), and plant-based options like tofu, lentils, chickpeas, and quinoa.",
        "category": "Protein"
    },
    {
        "content": "Hydration: The U.S. National Academies of Sciences, Engineering, and Medicine determined that an adequate daily fluid intake is: About 15.5 cups (3.7 liters) of fluids a day for men. About 11.5 cups (2.7 liters) of fluids a day for women.",
        "category": "Hydration"
    },
    {
        "content": "Pre-Workout Nutrition: Eat a meal 2-3 hours before working out containing carbs and protein. Examples: Oatmeal with protein powder, chicken with rice, or a banana with peanut butter.",
        "category": "Sports Nutrition"
    },
    {
        "content": "Post-Workout Nutrition: Consuming protein within 30-60 minutes after a workout aids muscle recovery. Pairing it with carbohydrates helps replenish glycogen stores.",
        "category": "Sports Nutrition"
    },
    {
        "content": "Weight Loss: To lose weight, you generally need to consume fewer calories than you burn (caloric deficit). A safe rate of weight loss is 1-2 pounds per week.",
        "category": "Weight Loss"
    },
    {
        "content": "Fiber Importance: Fiber helps maintain bowel health, lowers cholesterol levels, and helps control blood sugar levels. Women should aim for 21-25 grams of fiber a day, while men should aim for 30-38 grams.",
        "category": "Fiber"
    },
    {
        "content": "Healthy Fats: Unsaturated fats are 'good' fats. Sources include avocados, olive oil, nuts, seeds, and fatty fish. Limit saturated fats and avoid trans fats.",
        "category": "Fats"
    },
    {
        "content": "Sugar Intake: The American Heart Association suggests a stricter added-sugar limit of no more than 100 calories per day (about 6 teaspoons or 24 grams of sugar) for most women and no more than 150 calories per day (about 9 teaspoons or 36 grams of sugar) for most men.",
        "category": "Sugar"
    }
]

def generate_embedding(text):
    """Generate embedding for text using OpenAI"""
    response = client.embeddings.create(
        input=text,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

def main():
    print("============================================================")
    print("Chef Nourish RAG Importer")
    print("============================================================")
    
    # 1. Generate Embeddings first
    embeddings = []
    contents = []
    metadatas = []
    
    print(f"Found {len(facts)} facts to vectorise...")
    
    for i, fact in enumerate(facts):
        print(f"[{i+1}/{len(facts)}] Embedding: {fact['category']}...")
        
        # Generator
        embedding = generate_embedding(fact['content'])
        
        # Prepare for bulk insert (if supported) or sequential
        data = {
            "content": fact['content'],
            "metadata": {"category": fact['category']},
            "embedding": embedding
        }
        
        try:
            supabase.table("nutrition_facts").insert(data).execute()
        except Exception as e:
            print(f"  Error inserting: {e}")
            
        time.sleep(0.5) # Avoid rate limits
        
    print("\n✓ RAG Database Populated Successfully!")

if __name__ == "__main__":
    main()
