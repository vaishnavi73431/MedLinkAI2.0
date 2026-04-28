"""
Generate Nutrition Training Data for Fine-tuning
Uses OpenAI API to create high-quality nutrition Q&A pairs
"""

import os
import json
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

# Load .env from parent directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

# Initialize OpenAI client
client = OpenAI(
    api_key=os.getenv('OPENAI_API_KEY'),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

# Nutrition topics to cover
TOPICS = [
    "calorie counting and daily intake",
    "macronutrients (protein, carbs, fats)",
    "vitamins and minerals",
    "meal planning and prep",
    "healthy snacks and alternatives",
    "weight loss nutrition",
    "muscle building diet",
    "food allergies and intolerances",
    "hydration and water intake",
    "portion control",
    "reading nutrition labels",
    "superfoods and their benefits",
    "meal timing and frequency",
    "vegetarian and vegan nutrition",
    "sports nutrition",
]

def generate_qa_pairs(topic, num_pairs=5):
    """Generate Q&A pairs for a specific nutrition topic"""
    
    prompt = f"""Generate {num_pairs} realistic question-answer pairs about {topic}.
    
    Format each as:
    Q: [user question]
    A: [Chef Nourish's helpful, friendly response with specific details]
    
    Make Chef Nourish sound warm, knowledgeable, and encouraging. Include specific numbers, examples, and practical tips.
    """
    
    response = client.chat.completions.create(
        model="gemini-2.5-flash",  # Changed from gpt-4o-mini
        messages=[
            {"role": "system", "content": "You are creating training data for a nutrition chatbot named Chef Nourish."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.8
    )
    
    return response.choices[0].message.content

def parse_qa_pairs(text):
    """Parse Q&A pairs from generated text"""
    pairs = []
    lines = text.strip().split('\n')
    
    current_q = None
    current_a = []
    
    for line in lines:
        line = line.strip()
        if line.startswith('Q:'):
            if current_q and current_a:
                pairs.append({
                    "question": current_q,
                    "answer": ' '.join(current_a)
                })
            current_q = line[2:].strip()
            current_a = []
        elif line.startswith('A:'):
            current_a.append(line[2:].strip())
        elif current_a and line:
            current_a.append(line)
    
    # Add last pair
    if current_q and current_a:
        pairs.append({
            "question": current_q,
            "answer": ' '.join(current_a)
        })
    
    return pairs

def create_training_data():
    """Generate complete training dataset"""
    
    all_pairs = []
    
    print("Generating nutrition training data...")
    print(f"Topics to cover: {len(TOPICS)}")
    
    for i, topic in enumerate(TOPICS, 1):
        print(f"\n[{i}/{len(TOPICS)}] Generating Q&A for: {topic}")
        
        try:
            qa_text = generate_qa_pairs(topic, num_pairs=5)
            pairs = parse_qa_pairs(qa_text)
            all_pairs.extend(pairs)
            print(f"  ✓ Generated {len(pairs)} pairs")
        except Exception as e:
            print(f"  ✗ Error: {e}")
    
    print(f"\n✓ Total Q&A pairs generated: {len(all_pairs)}")
    
    # Convert to OpenAI fine-tuning format
    training_data = []
    system_message = "You are Chef Nourish, a warm and knowledgeable nutrition expert who helps users make healthy food choices. You provide specific, practical advice with encouragement."
    
    for pair in all_pairs:
        training_data.append({
            "messages": [
                {"role": "system", "content": system_message},
                {"role": "user", "content": pair["question"]},
                {"role": "assistant", "content": pair["answer"]}
            ]
        })
    
    # Save as JSONL
    output_file = "nutrition_training.jsonl"
    with open(output_file, 'w') as f:
        for item in training_data:
            f.write(json.dumps(item) + '\n')
    
    print(f"\n✓ Training data saved to: {output_file}")
    print(f"  Total examples: {len(training_data)}")
    print(f"\nNext step: Run 'python train_nutrition_bot.py' to start fine-tuning!")
    
    return output_file

if __name__ == "__main__":
    create_training_data()
