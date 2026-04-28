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

for model in client.models.list():
    print(model.id)
