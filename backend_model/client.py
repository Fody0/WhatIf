import requests

def query_llama(prompt: str):
    # Add Russian language enforcement
    processed_prompt = f"Анализируй исторические последствия: {prompt}"
    response = requests.post(
        "http://localhost:8008/generate",
        json={"prompt": processed_prompt}
    )
    return response.json()

if __name__ == "__main__":
    while True:
        user_input = input("You: ")
        if user_input.lower() in ["exit", "quit"]:
            break
        result = query_llama(user_input)
        print(f"AI: {result['response']}")