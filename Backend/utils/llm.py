"""
JusticeAI — Shared async Groq client (lazy singleton).
"""

from __future__ import annotations

import json
import sys
from typing import Any

from config import settings

# ── Constants ────────────────────────────────────────────────────────────
JSON_OBJECT_RESPONSE_FORMAT: dict[str, str] = {"type": "json_object"}

# ── Singleton ────────────────────────────────────────────────────────────
_client = None


def get_groq_client():
    """Return a shared AsyncGroq client. Created on first call."""
    global _client
    if _client is not None:
        return _client

    try:
        from groq import AsyncGroq
    except ImportError:
        raise RuntimeError(
            "The 'groq' package is required. Install it with: pip install groq"
        )

    if not settings.GROQ_API_KEY:
        raise RuntimeError(
            "GROQ_API_KEY is not set. Add it to your .env file."
        )

    _client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    return _client


def extract_response_content(response: Any) -> str:
    """Extract text content from a Groq chat-completion response."""
    if not response or not response.choices:
        raise RuntimeError("Empty or missing response from Groq API")

    content = response.choices[0].message.content

    if content is None:
        raise RuntimeError("Response content is None")

    # Handle list-type content (some models return list of content blocks)
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif hasattr(block, "text"):
                parts.append(block.text)
        text = "".join(parts)
    elif isinstance(content, str):
        text = content
    else:
        raise RuntimeError(f"Unexpected response content type: {type(content)}")

    if not text.strip():
        raise RuntimeError("Response content is empty")

    return text


def strip_code_fences(text: str) -> str:
    """Remove optional markdown code fences around model output."""
    text = text.strip()

    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]

    if text.endswith("```"):
        text = text[:-3]

    return text.strip()


def extract_json_object(text: str) -> dict[str, Any]:
    """Parse a JSON object from model output with small formatting tolerance."""
    cleaned = strip_code_fences(text)

    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    start_index = cleaned.find("{")
    if start_index == -1:
        raise ValueError("No JSON object found in model output.")

    depth = 0
    in_string = False
    escaped = False

    for index in range(start_index, len(cleaned)):
        char = cleaned[index]

        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue

        if char == '"':
            in_string = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                candidate = cleaned[start_index : index + 1]
                parsed = json.loads(candidate)
                if isinstance(parsed, dict):
                    return parsed
                break

    raise ValueError("Unable to parse JSON object from model output.")


async def create_json_completion_with_fallback(
    client: Any,
    *,
    model: str,
    messages: list[dict[str, str]],
    temperature: float,
    max_completion_tokens: int,
):
    """Request a JSON completion, retrying without strict JSON mode if needed."""
    try:
        return await client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_completion_tokens=max_completion_tokens,
            response_format=JSON_OBJECT_RESPONSE_FORMAT,
        )
    except Exception as structured_exc:
        print(
            "[llm] Structured JSON response failed; retrying without "
            f"response_format: {type(structured_exc).__name__}: {structured_exc}"
        )
        return await client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_completion_tokens=max_completion_tokens,
        )
