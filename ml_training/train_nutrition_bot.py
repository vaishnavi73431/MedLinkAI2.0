"""
Fine-tune GPT-3.5-turbo on Nutrition Data
Creates a custom Chef Nourish model
"""

import os
import time
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

# Load .env from parent directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def upload_training_file(file_path):
    """Upload training data to OpenAI"""
    
    print(f"Uploading training file: {file_path}")
    
    with open(file_path, 'rb') as f:
        response = client.files.create(
            file=f,
            purpose='fine-tune'
        )
    
    file_id = response.id
    print(f"✓ File uploaded successfully!")
    print(f"  File ID: {file_id}")
    
    return file_id

def start_fine_tuning(file_id):
    """Start the fine-tuning job"""
    
    print(f"\nStarting fine-tuning job...")
    
    response = client.fine_tuning.jobs.create(
        training_file=file_id,
        model="gpt-3.5-turbo",
        hyperparameters={
            "n_epochs": 3  # Adjust based on your data size
        }
    )
    
    job_id = response.id
    print(f"✓ Fine-tuning job created!")
    print(f"  Job ID: {job_id}")
    print(f"  Status: {response.status}")
    
    return job_id

def monitor_fine_tuning(job_id):
    """Monitor the fine-tuning progress"""
    
    print(f"\nMonitoring fine-tuning job: {job_id}")
    print("This may take 10-60 minutes depending on data size...")
    print("-" * 60)
    
    while True:
        response = client.fine_tuning.jobs.retrieve(job_id)
        status = response.status
        
        print(f"Status: {status}")
        
        if status == "succeeded":
            print("\n✓ Fine-tuning completed successfully!")
            print(f"  Fine-tuned model: {response.fine_tuned_model}")
            
            # Save model ID to file
            with open("nutrition_model_id.txt", 'w') as f:
                f.write(response.fine_tuned_model)
            
            print(f"\n✓ Model ID saved to: nutrition_model_id.txt")
            return response.fine_tuned_model
        
        elif status == "failed":
            print(f"\n✗ Fine-tuning failed!")
            print(f"  Error: {response.error}")
            return None
        
        # Wait before checking again
        time.sleep(30)

def test_model(model_id):
    """Test the fine-tuned model"""
    
    print(f"\n{'='*60}")
    print("Testing Fine-tuned Model")
    print('='*60)
    
    test_questions = [
        "How many calories should I eat per day?",
        "What are good sources of protein?",
        "How much water should I drink daily?",
    ]
    
    for question in test_questions:
        print(f"\nQ: {question}")
        
        response = client.chat.completions.create(
            model=model_id,
            messages=[
                {"role": "system", "content": "You are Chef Nourish, a nutrition expert."},
                {"role": "user", "content": question}
            ]
        )
        
        answer = response.choices[0].message.content
        print(f"A: {answer}")
        print("-" * 60)

def main():
    """Main training pipeline"""
    
    print("="*60)
    print("Chef Nourish Fine-tuning Pipeline")
    print("="*60)
    
    # Check for training file
    training_file = "nutrition_training.jsonl"
    
    if not os.path.exists(training_file):
        print(f"\n✗ Training file not found: {training_file}")
        print("Run 'python generate_nutrition_data.py' first!")
        return
    
    # Step 1: Upload training file
    file_id = upload_training_file(training_file)
    
    # Step 2: Start fine-tuning
    job_id = start_fine_tuning(file_id)
    
    # Step 3: Monitor progress
    model_id = monitor_fine_tuning(job_id)
    
    if model_id:
        # Step 4: Test the model
        test_model(model_id)
        
        print("\n" + "="*60)
        print("✓ Training Complete!")
        print("="*60)
        print(f"\nYour fine-tuned model ID: {model_id}")
        print("\nNext steps:")
        print("1. Update your .env file with the model ID")
        print("2. Update NutritionChat.tsx to use the fine-tuned model")
        print("3. Test in your app!")

if __name__ == "__main__":
    main()
