"""
JusticeAI — POST /extract-events route.
"""

from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException

from config import settings
from models.schemas import EventExtractionRequest, EventExtractionResponse, EventItem
from utils.extraction import extract_dates_regex
from utils.llm import (
    JSON_OBJECT_RESPONSE_FORMAT,
    extract_response_content,
    get_groq_client,
)
from utils.prompts import EVENT_EXTRACTION_SYSTEM, EVENT_EXTRACTION_USER

router = APIRouter()


@router.post("/", response_model=EventExtractionResponse)
async def extract_events(request: EventExtractionRequest):
    """Extract dates and events from legal text (LLM-first, regex fallback)."""

    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    # ── Try LLM extraction first ─────────────────────────────────────────
    try:
        client = get_groq_client()
        truncated = text[: settings.MAX_EXTRACTION_CHARS]
        prompt = EVENT_EXTRACTION_USER.format(text=truncated)

        response = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": EVENT_EXTRACTION_SYSTEM},
                {"role": "user", "content": prompt},
            ],
            temperature=0.0,
            max_completion_tokens=1500,
            response_format=JSON_OBJECT_RESPONSE_FORMAT,
        )

        raw = extract_response_content(response)
        raw = raw.strip()
        if raw.startswith("```json"):
            raw = raw[7:]
        elif raw.startswith("```"):
            raw = raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]

        parsed = json.loads(raw.strip())
        events = [
            EventItem(date=e.get("date", ""), description=e.get("description", ""))
            for e in parsed.get("events", [])
        ]
        return EventExtractionResponse(events=events)

    except Exception as exc:
        print(f"[events] LLM extraction failed: {exc}. Falling back to regex.")

    # ── Regex fallback ───────────────────────────────────────────────────
    dates = extract_dates_regex(text)
    events = [
        EventItem(date=d, description="Date found in document")
        for d in dates
    ]
    return EventExtractionResponse(events=events)
