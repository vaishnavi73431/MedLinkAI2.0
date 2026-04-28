import requests
import os
from dotenv import load_dotenv
load_dotenv('.env')

headers = {
    "Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}",
    "Content-Type": "application/json"
}

payload = {
    "model": "gemini-2.5-flash",
    "messages": [
        {"role": "user", "content": "What are the latest fitness trends? Search the web."}
    ],
    "tools": [
        {
            "type": "function",
            "function": {
                "name": "search_web_for_context",
                "description": "Fetches real-time information",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": { "type": "string" }
                    },
                    "required": ["query"]
                }
            }
        }
    ],
    "tool_choice": "auto"
}

resp1 = requests.post("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", json=payload, headers=headers)
print("Response 1:", resp1.status_code)
data1 = resp1.json()
print(data1)

message = data1['choices'][0]['message']
payload["messages"].append(message)
payload["messages"].append({
    "role": "tool",
    "tool_call_id": message['tool_calls'][0]['id'],
    "name": message['tool_calls'][0]['function']['name'],
    "content": "Fitness trends include VR workouts and AI trainers."
})

resp2 = requests.post("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", json=payload, headers=headers)
print("Response 2:", resp2.status_code)
print(resp2.json())
