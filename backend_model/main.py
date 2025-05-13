from fastapi import FastAPI
from llama_cpp import Llama
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
import re
from typing import List, Dict
import logging
import json
from pathlib import Path
from sentence_transformers import SentenceTransformer, util
import time
from urllib.parse import urlparse

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()


class PromptRequest(BaseModel):
    prompt: str
    language: str = "ru"


llm = None
embedder = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

# База знаний по периодам мировой истории
HISTORY_KNOWLEDGE = {
    "ancient": [
        "Древний Египет существовал примерно с 3100 г. до н.э. до 332 г. до н.э.",
        "Древняя Греция заложила основы западной философии, демократии и науки.",
        "Римская империя доминировала в Средиземноморье с 27 г. до н.э. до 476 г. н.э."
    ],
    "medieval": [
        "Средние века (V-XV века) характеризовались феодализмом и доминированием церкви.",
        "Византийская империя сохранила римские традиции до 1453 года.",
        "Арабский халифат был центром науки и культуры в VII-XIII веках."
    ],
    "modern": [
        "Эпоха Возрождения (XIV-XVII века) возродила интерес к античному наследию.",
        "Великие географические открытия (XV-XVII века) расширили представления о мире.",
        "Реформация (XVI век) разделила христианскую Европу."
    ],
    "contemporary": [
        "Промышленная революция (XVIII-XIX века) изменила экономику и общество.",
        "Две мировые войны (XX век) кардинально изменили мировую политику.",
        "Холодная война (1947-1991) определила вторую половину XX века."
    ]
}

# источники по мировой истории
WORLD_HISTORY_SOURCES = [
    # Общие исторические ресурсы
    {'type': 'website', 'value': 'https://www.history.com', 'category': 'general', 'reliability': 0.85},
    {'type': 'website', 'value': 'https://www.britannica.com', 'category': 'general', 'reliability': 0.9},
    {'type': 'website', 'value': 'https://www.ancient.eu', 'category': 'ancient', 'reliability': 0.88},
    {'type': 'website', 'value': 'https://www.medievalists.net', 'category': 'medieval', 'reliability': 0.82},

    # Альтернативная история
    {'type': 'website', 'value': 'https://www.alternatehistory.com', 'category': 'alternative', 'reliability': 0.8},
    # {'type': 'website', 'value': 'https://www.reddit.com/r/HistoricalWhatIf/', 'category': 'alternative',
    # 'reliability': 0.75},

    # Научные ресурсы (открытый доступ)
    {'type': 'website', 'value': 'https://www.jstor.org', 'category': 'academic', 'reliability': 0.95},
    {'type': 'website', 'value': 'https://www.academia.edu', 'category': 'academic', 'reliability': 0.92},

    # Российские/советские источники
    {'type': 'website', 'value': 'https://www.rbth.com', 'category': 'russian', 'reliability': 0.85},
    {'type': 'website', 'value': 'https://histrf.ru', 'category': 'russian', 'reliability': 0.87},
    {'type': 'website', 'value': 'https://historyrussia.org', 'category': 'russian', 'reliability': 0.87}
]


@app.on_event("startup")
async def load_model():
    global llm
    try:
        llm = Llama(
            model_path="C:/Users/user/Desktop/Hack/models/mistral-7b-instruct-v0.2.Q4_K_M.gguf",
            n_ctx=4096,
            n_gpu_layers=45,
            n_threads=8,
            n_batch=512,
            verbose=True
        )
        logger.info("Модель успешно загружена")
    except Exception as e:
        logger.error(f"Ошибка загрузки модели: {str(e)}")
        raise


def determine_historical_period(query: str) -> str:
    """Определяем исторический период по запросу с улучшенной логикой для альтернативной истории"""
    query_lower = query.lower()

    # Сначала проверяем современные гипотетические вопросы (не альтернативная история)
    modern_keywords = ['илон маск', 'тесла', 'twitter', 'социальные сети', 'современные технологии']
    if any(word in query_lower for word in modern_keywords):
        return "modern_hypothetical"  # Специальная категория для современных гипотетических вопросов

    # Затем проверяем настоящие альтернативно-исторические вопросы
    if any(word in query_lower for word in ['что если', 'альтернативн', 'если бы']):
        # Определяем период для альтернативной истории
        if any(word in query_lower for word in ['древн', 'античн', 'египет', 'греци', 'рим']):
            return "ancient"
        elif any(word in query_lower for word in ['средн', 'меди', 'феодал', 'визант']):
            return "medieval"
        elif any(word in query_lower for word in ['новое время', 'возрожден', 'реформац']):
            return "modern"
        elif any(word in query_lower for word in ['новейш', 'мировая война', 'холодная']):
            return "contemporary"
        elif any(word in query_lower for word in ['ссср', 'советск', 'росси']):
            return "russian"
        return "alternative"  # Общая альтернативная история

    # Обычные исторические вопросы
    if any(word in query_lower for word in ['древн', 'античн', 'египет', 'греци', 'рим']):
        return "ancient"
    elif any(word in query_lower for word in ['средн', 'меди', 'феодал', 'визант']):
        return "medieval"
    elif any(word in query_lower for word in ['новое время', 'возрожден', 'реформац']):
        return "modern"
    elif any(word in query_lower for word in ['новейш', 'мировая война', 'холодная']):
        return "contemporary"
    elif any(word in query_lower for word in ['ссср', 'советск', 'росси']):
        return "russian"
    return "general"


def get_relevant_sources(period: str, is_alternative: bool = False) -> List[Dict]:
    """Выбираем релевантные источники для периода с учетом modern_hypothetical"""
    if period == "modern_hypothetical":
        return []  # Не используем источники для современных гипотетических вопросов

    if is_alternative and period != "modern_hypothetical":
        return [s for s in WORLD_HISTORY_SOURCES if s['category'] == 'alternative']

    return [s for s in WORLD_HISTORY_SOURCES
            if s['category'] in [period, 'general'] or
            (period == 'russian' and s['category'] == 'russian')]


def extract_content_from_html(html: str, url: str) -> str:
    """Извлекаем контент с учетом специфики разных сайтов"""
    soup = BeautifulSoup(html, 'html.parser')
    domain = urlparse(url).netloc

    # Специфичные правила для разных сайтов
    if 'history.com' in domain:
        content = soup.find('article') or soup.select_one('.article-content')
    elif 'britannica.com' in domain:
        content = soup.find('div', class_='article-body')
    elif 'ancient.eu' in domain:
        content = soup.find('div', class_='text-content')
    else:  # Общий случай
        content = soup.find(['article', 'main']) or soup.body

    return clean_text(content.get_text()) if content else ""


def clean_text(text: str) -> str:
    """Очистка текста"""
    text = re.sub(r'\[\d+\]', '', text)
    text = re.sub(r'\n+', '\n', text)
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'(Read also|Share|Comments|Navigation|©|All rights reserved)', '', text, flags=re.IGNORECASE)
    return text.strip()


async def get_historical_context(query: str) -> str:
    """Получаем контекст для исторического запроса"""
    # тип запроса
    is_alternative = any(word in query.lower() for word in ['что если', 'альтернативн', 'если бы'])
    period = determine_historical_period(query)

    # подходящие источники
    sources = get_relevant_sources(period, is_alternative)

    # базовые знания
    context_parts = []
    if period in HISTORY_KNOWLEDGE:
        context_parts.append({
            'source': 'База знаний: ' + period,
            'content': ' '.join(HISTORY_KNOWLEDGE[period]),
            'reliability': 0.8
        })

    for source in sources[:3]:  # Ограничиваем число запросов
        try:
            if source['type'] == 'website':
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html'
                }
                response = requests.get(source['value'], headers=headers, timeout=10)
                if response.status_code == 200:
                    content = extract_content_from_html(response.text, source['value'])
                    if content:
                        context_parts.append({
                            'source': source['value'],
                            'content': content[:1500],  # Ограничение длины
                            'reliability': source['reliability']
                        })
        except Exception as e:
            logger.warning(f"Ошибка при обработке {source['value']}: {str(e)}")

    if not context_parts:
        return "Не удалось получить информацию из доступных источников."

    # Сортируем по надежности
    context_parts.sort(key=lambda x: x['reliability'], reverse=True)

    # Формируем контекст
    return "\n\n".join(
        f"Источник: {c['source']} (Надежность: {c['reliability']:.1f})\n"
        f"{c['content'][:800]}..."  # Дополнительное ограничение
        for c in context_parts[:2]  # Берем 2 лучших источника
    )


def build_history_prompt(query: str, context: str, language: str = "ru") -> str:
    """Строим промпт с разными шаблонами для разных типов вопросов"""
    period = determine_historical_period(query)

    if period == "modern_hypothetical":
        if language == "ru":
            return f"""Вы — эксперт по анализу гипотетических сценариев. Дайте краткий анализ (3-5 предложений) на вопрос:

Вопрос: {query}

Ответ должен:
1. Быть логически обоснованным
2. Учитывать текущие технологические и социальные тренды
3. Быть написан понятным языком
4. Объём: до 100 слов.

Ответ:"""
        else:
            return f"""You are a hypothetical scenario analyst. Provide a brief analysis (3-5 sentences) for the question:

Question: {query}

The answer should:
1. Be logically sound
2. Consider current technological and social trends
3. Use clear language
4. Volume: up to 100 words

Answer:"""
    else:
        if language == "ru":
            return f"""Вы — эксперт по мировой истории. Дайте краткий ответ (3-5 предложений) на вопрос, 
            используя предоставленные данные.

Контекст:
{context[:1200]}

Вопрос: {query}

Ответ должен:
1. Быть исторически точным
2. Учитывать разные точки зрения
3. Указать источники информации
4. Быть написан понятным языком
5. Главное последствие 
6. Ключевой исторический факт
7. Альтернативный сценарий (если уместно)
8. Объём: до 100 слов.

Ответ:"""
        else:
            return f"""You are a world history expert. Provide a detailed answer using the given context.

Context:
{context[:1200]}

Question: {query}

The answer should:
1. Be historically accurate
2. Consider different perspectives
3. Cite sources
4. Use clear language
5. Volume: up to 100 words

Answer:"""


@app.post("/generate")
async def generate_response(request: PromptRequest):
    try:
        # Получаем исторический контекст
        context = await get_historical_context(request.prompt)
        logger.info(f"Получен контекст длиной {len(context)} символов")

        # Строим промпт
        prompt = build_history_prompt(request.prompt, context, request.language)
        logger.info(f"Длина промпта: {len(prompt)}")

        # Генерируем ответ
        response = llm.create_completion(
            prompt=prompt,
            max_tokens=512,
            temperature=0.3,
            top_p=0.9,
            repeat_penalty=1.1,
            stream=False
        )

        result = response['choices'][0]['text'].strip()
        return {"response": result}

    except Exception as e:
        logger.error(f"Ошибка генерации: {str(e)}")
        return {"response": "Не удалось сгенерировать ответ. Пожалуйста, попробуйте переформулировать вопрос."}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8008)
