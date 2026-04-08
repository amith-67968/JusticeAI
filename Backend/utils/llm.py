"""
JusticeAI — Shared async Groq client (lazy singleton).
"""

from __future__ import annotations

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
