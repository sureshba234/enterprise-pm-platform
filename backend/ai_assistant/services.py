import requests
from django.conf import settings


class AIServiceError(Exception):
    pass


def call_groq(messages, max_tokens=600):
    """Calls the Groq chat completions API (OpenAI-compatible)."""
    if not settings.GROQ_API_KEY:
        raise AIServiceError("GROQ_API_KEY is not configured on the server.")

    response = requests.post(
        'https://api.groq.com/openai/v1/chat/completions',
        headers={
            'Authorization': f'Bearer {settings.GROQ_API_KEY}',
            'Content-Type': 'application/json',
        },
        json={
            'model': settings.GROQ_MODEL,
            'messages': messages,
            'temperature': 0.4,
            'max_tokens': max_tokens,
        },
        timeout=30,
    )

    if response.status_code != 200:
        raise AIServiceError(f"Groq API error ({response.status_code}): {response.text[:300]}")

    data = response.json()
    return data['choices'][0]['message']['content']