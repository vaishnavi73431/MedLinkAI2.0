# Chef Nourish Fine-tuning Guide

This directory contains the complete pipeline for training your custom nutrition bot using OpenAI's fine-tuning API.

## 📋 Prerequisites

1. **OpenAI API Key** with fine-tuning access
2. **Python 3.8+** installed
3. **~$10-20** in OpenAI credits for fine-tuning

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd ml_training
pip install -r requirements.txt
```

### Step 2: Set Your API Key

Add to your `.env` file in the project root:
```
OPENAI_API_KEY=sk-your-key-here
```

### Step 3: Generate Training Data

```bash
python generate_nutrition_data.py
```

This will:
- Generate 75+ nutrition Q&A pairs across 15 topics
- Use GPT-4 to create high-quality training examples
- Save as `nutrition_training.jsonl`
- Takes ~5-10 minutes

### Step 4: Start Fine-tuning

```bash
python train_nutrition_bot.py
```

This will:
- Upload training data to OpenAI
- Start fine-tuning GPT-3.5-turbo
- Monitor progress (10-60 minutes)
- Save your custom model ID
- Test the model automatically

### Step 5: Use Your Model

After training completes, you'll get a model ID like:
```
ft:gpt-3.5-turbo:your-org:nutrition:abc123
```

Update your app to use it!

## 📊 What Gets Created

```
ml_training/
├── nutrition_training.jsonl      # Training data (75+ examples)
├── nutrition_model_id.txt        # Your fine-tuned model ID
├── generate_nutrition_data.py    # Data generation script
├── train_nutrition_bot.py        # Fine-tuning script
└── README.md                     # This file
```

## 💰 Cost Estimate

- **Data Generation**: ~$0.50 (using GPT-4)
- **Fine-tuning**: ~$8-15 (depends on data size)
- **Total**: ~$10-20

## 🎯 Training Topics Covered

1. Calorie counting
2. Macronutrients (protein, carbs, fats)
3. Vitamins and minerals
4. Meal planning
5. Healthy snacks
6. Weight loss nutrition
7. Muscle building diet
8. Food allergies
9. Hydration
10. Portion control
11. Nutrition labels
12. Superfoods
13. Meal timing
14. Vegetarian/vegan nutrition
15. Sports nutrition

## 🔧 Customization

### Add More Topics

Edit `generate_nutrition_data.py`:
```python
TOPICS = [
    "your new topic here",
    # ... existing topics
]
```

### Adjust Training Parameters

Edit `train_nutrition_bot.py`:
```python
hyperparameters={
    "n_epochs": 3  # Increase for more training
}
```

## 📝 For Your Submission

Include these files in your project documentation:

1. **`nutrition_training.jsonl`** - Shows your training data
2. **`nutrition_model_id.txt`** - Proves you trained a model
3. **Training logs** - Screenshot the terminal output
4. **Before/After comparison** - Test responses from base vs fine-tuned model

## 🐛 Troubleshooting

### "File not found" error
Run `generate_nutrition_data.py` first!

### "Insufficient quota" error
Add credits to your OpenAI account

### Fine-tuning takes too long
Normal! Can take 30-60 minutes for 75 examples

## 📚 Learn More

- [OpenAI Fine-tuning Guide](https://platform.openai.com/docs/guides/fine-tuning)
- [Best Practices](https://platform.openai.com/docs/guides/fine-tuning/preparing-your-dataset)
