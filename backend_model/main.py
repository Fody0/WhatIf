from fastapi import FastAPI
from llama_cpp import Llama
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
import re
from typing import List, Dict
import logging
import time

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()


class PromptRequest(BaseModel):
    prompt: str


# Initialize model
llm = None


@app.on_event("startup")
async def load_model():
    global llm
    llm = Llama(
        model_path="C:/Users/user/Desktop/Hack/models/mistral-7b-instruct-v0.2.Q4_K_M.gguf",
        n_ctx=4096,
        n_gpu_layers=45,
        n_threads=6,
        n_batch=512,
        offload_kqv=True,
        main_gpu=0,
        tensor_split=[1],
        mul_mat_q=True,
        flash_attn=False,
        low_vram=True,
        lock_alloc=False
    )


def clean_text(text: str) -> str:
    """Clean text by removing excessive newlines, references, and unwanted characters."""
    text = re.sub(r'\[\d+\]', '', text)  # Remove [1], [2], etc.
    text = re.sub(r'\n+', '\n', text)  # Replace multiple newlines with one
    text = re.sub(r'\s+', ' ', text)  # Replace multiple spaces with one
    return text.strip()


def scrape_website(url: str, max_chars: int = 1500) -> str:
    """Scrape text content from a website."""
    try:
        headers = {'User-Agent': 'MyLLMApp/1.0 (your.email@example.com)'}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        # Extract text from relevant tags (e.g., <p>, <div>, <article>)
        content = ''
        for tag in soup.find_all(['p', 'div', 'article']):
            text = tag.get_text(strip=True)
            if text:
                content += text + ' '

        content = clean_text(content)

        # Truncate to fit context length
        if len(content) > max_chars:
            content = content[:max_chars] + "..."
        logger.info(f"Scraped content from {url}: {len(content)} characters")
        return content
    except Exception as e:
        logger.error(f"Error scraping {url}: {str(e)}")
        return f"Error scraping {url}: {str(e)}"


def get_context(query: str, sources: List[Dict[str, str]], max_chars_per_source: int = 1500) -> str:
    """Retrieve context from specified sources only."""
    context = ""
    used_sources = []
    for source in sources:
        source_type = source.get('type')
        source_value = source.get('value')
        used_sources.append(source_value)

        if source_type == 'website':
            content = scrape_website(source_value, max_chars_per_source)
        elif source_type == 'file':
            try:
                with open(source_value, 'r', encoding='utf-8') as f:
                    content = clean_text(f.read())
                    if len(content) > max_chars_per_source:
                        content = content[:max_chars_per_source] + "..."
                logger.info(f"Read content from file {source_value}: {len(content)} characters")
            except Exception as e:
                logger.error(f"Error reading file {source_value}: {str(e)}")
                content = f"Error reading file {source_value}: {str(e)}"
        else:
            logger.warning(f"Unknown source type: {source_type}")
            content = f"Unknown source type: {source_type}"

        context += f"\n\nSource: {source_value}\n{content}"

    # Log used sources
    logger.info(f"Sources used for query '{query}': {', '.join(used_sources)}")

    # Ensure total context fits within model constraints
    if len(context) > 1800:
        context = context[:1800] + "..."
        logger.info(f"Context truncated to {len(context)} characters")
    return context


def build_rag_prompt(user_query: str, context: str) -> str:
    """Build a prompt that strictly instructs the model to use only the provided context."""
    prompt = f"""
Вы - ИИ-ассистент, который обязан отвечать на вопросы, используя ТОЛЬКО информацию из предоставленного контекста. 
Категорически запрещено использовать любые внутренние знания модели, 
предобученные данные или любые другие источники, кроме указанного контекста. 
Если в контексте недостаточно информации для ответа, четко укажите: 
"Недостаточно информации в предоставленном контексте." 
Ответ должен быть точным, без выдумывания или дополнения фактов.

**Контекст**:
{context}

**Вопрос**:
{user_query}

**Ответ**:
"""
    return prompt


@app.post("/generate")
async def generate_text(request: PromptRequest):
    start = time.time()
    # Define sources (expandable list)
    sources = [
        {'type': 'website', 'value': 'https://historyrussia.org/'},
        {'type': 'website', 'value': 'https://cyberleninka.ru/'},
        {'type': 'website', 'value': 'https://www.elibrary.ru/'},
        {'type': 'website', 'value': 'https://scholar.archive.org/'},
        {'type': 'website', 'value': 'https://historyrussia.org/'}# Primary source
        # Add more sources here, e.g.:
        # {'type': 'website', 'value': 'https://example.com'},
        # {'type': 'file', 'value': 'path/to/document.txt'},
    ]

    # Get context from sources
    context = get_context(request.prompt, sources)

    # Build RAG prompt
    rag_prompt = build_rag_prompt(request.prompt, context)

    # Generate response
    response = llm.create_completion(
        prompt=rag_prompt,
        max_tokens=512,
        temperature=0.7,  # Lower temperature for stricter adherence to context
        top_k=20,  # Narrower token selection
        top_p=0.8,  # More deterministic outputs
        repeat_penalty=1.15,
        frequency_penalty=0.25,
        stream=False,
        seed=12345
    )
    logger.info(f"Generated response for query '{request.prompt}': {response['choices'][0]['text']}")
    end = time.time()
    logger.info(end - start)
    return {"response": response["choices"][0]["text"]}


def query_llama(prompt: str):
    response = requests.post(
        "http://localhost:8008/generate",
        json={"prompt": prompt}
    )
    return response.json()


if __name__ == "__main__":
    while True:
        user_input = input("You: ")
        if user_input.lower() in ["exit", "quit"]:
            break
        result = query_llama(user_input)
        print(f"AI: {result['response']}")