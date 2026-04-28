import os
from openai import OpenAI
from pathlib import Path
from dotenv import load_dotenv

env_path = Path('.env')
load_dotenv(dotenv_path=env_path)

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

response = client.embeddings.create(
    model="gemini-embedding-001",
    input="Test text"
)

embedding = response.data[0].embedding
print(f"Dimension length: {len(embedding)}")
