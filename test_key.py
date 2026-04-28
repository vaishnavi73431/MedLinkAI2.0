import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path('ml_training').parent / '.env'
load_dotenv(dotenv_path=env_path)

key = os.getenv('VITE_OPENAI_API_KEY')
if key:
    print(f"Key loaded. Length: {len(key)}")
    print(f"Starts with: {key[:5]}")
    print(f"Ends with: {key[-5:]}")
    print("Raw format test:")
    print(repr(key))
else:
    print("NO KEY FOUND")
