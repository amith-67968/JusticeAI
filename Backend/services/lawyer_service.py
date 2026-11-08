"""
JusticeAI — Smart Lawyer Recommendation Service.

Extracts case types from the AI response, queries Google Places API for
nearby lawyers, and generates a LinkedIn search URL.
"""

from __future__ import annotations

import re
import urllib.parse
from typing import Optional

from config import settings


# ═══════════════════════════════════════════════════════════════════════════
# Case-type keyword map
# ═══════════════════════════════════════════════════════════════════════════

_CASE_TYPE_KEYWORDS: dict[str, list[str]] = {
    "cybercrime": [
        "cyber", "cybercrime", "hacking", "phishing", "online fraud",
        "data breach", "identity theft", "it act", "information technology act",
        "computer", "internet", "digital",
    ],
    "criminal": [
        "criminal", "ipc", "indian penal code", "bharatiya nyaya sanhita",
        "murder", "assault", "theft", "robbery", "kidnapping", "extortion",
        "cheating", "fraud", "forgery", "intimidation", "crpc",
        "criminal intimidation", "fir", "bail",
    ],
    "family": [
        "family", "divorce", "custody", "maintenance", "alimony",
        "domestic violence", "dowry", "marriage", "hindu marriage act",
        "guardianship", "adoption", "matrimonial",
    ],
    "consumer": [
        "consumer", "consumer protection", "deficiency", "defective",
        "unfair trade", "consumer forum", "product liability",
        "consumer rights", "consumer court",
    ],
    "property": [
        "property", "land", "real estate", "landlord", "tenant",
        "rent", "eviction", "registration", "transfer of property",
        "trespass", "encroachment", "possession",
    ],
    "labour": [
        "labour", "labor", "employment", "workplace", "harassment",
        "termination", "salary", "wages", "industrial dispute",
        "sexual harassment", "posh", "wrongful termination",
    ],
    "corporate": [
        "corporate", "company", "companies act", "shareholder",
        "director", "insolvency", "bankruptcy", "nclt", "merger",
        "acquisition", "compliance",
    ],
    "constitutional": [
        "constitutional", "fundamental rights", "article 14", "article 19",
        "article 21", "writ", "habeas corpus", "pil",
        "public interest litigation",
    ],
    "tax": [
        "tax", "income tax", "gst", "goods and services tax",
        "customs", "taxation", "itat", "tax evasion",
    ],
    "intellectual_property": [
        "intellectual property", "patent", "trademark", "copyright",
        "trade secret", "infringement", "ip rights",
    ],
}

# Map case types → Google-searchable lawyer specialties
_SPECIALTY_MAP: dict[str, str] = {
    "cybercrime": "cyber crime lawyer",
    "criminal": "criminal lawyer",
    "family": "family lawyer",
    "consumer": "consumer court lawyer",
    "property": "property lawyer",
    "labour": "labour lawyer",
    "corporate": "corporate lawyer",
    "constitutional": "constitutional lawyer",
    "tax": "tax lawyer",
    "intellectual_property": "intellectual property lawyer",
}


# ═══════════════════════════════════════════════════════════════════════════
# Step 1 — Extract case types from AI response
# ═══════════════════════════════════════════════════════════════════════════

def extract_case_types(ai_response: dict) -> list[str]:
    """Scan the AI response text and relevant_laws for case-type keywords."""

    # Build a single searchable blob from all relevant fields
    parts = [
        ai_response.get("answer", ""),
        ai_response.get("explanation", ""),
        ai_response.get("why_applicable", ""),
        " ".join(ai_response.get("relevant_laws", [])),
        " ".join(ai_response.get("next_steps", [])),
    ]
    blob = " ".join(parts).lower()

    matched: list[str] = []
    for case_type, keywords in _CASE_TYPE_KEYWORDS.items():
        for kw in keywords:
            if kw in blob:
                matched.append(case_type)
                break  # one match per category is enough

    # Fallback — if nothing matched, use "general"
    return matched or ["general"]


# ═══════════════════════════════════════════════════════════════════════════
# Step 2 — Map case types to lawyer specialties
# ═══════════════════════════════════════════════════════════════════════════

def map_case_to_specialties(case_types: list[str]) -> list[str]:
    """Convert internal case type labels to Google-searchable terms."""
    specialties = []
    for ct in case_types:
        specialty = _SPECIALTY_MAP.get(ct)
        if specialty and specialty not in specialties:
            specialties.append(specialty)
    return specialties or ["lawyer"]


# ═══════════════════════════════════════════════════════════════════════════
# Step 3 — Google Places API
# ═══════════════════════════════════════════════════════════════════════════

async def fetch_nearby_lawyers(
    specialties: list[str],
    city: str,
    lat: float = 0.0,
    lng: float = 0.0,
    limit: int = 5,
) -> list[dict]:
    """Query Google Places Text Search for each specialty, merge & dedupe."""

    api_key = settings.GOOGLE_PLACES_API_KEY
    if not api_key:
        print("[lawyers] GOOGLE_PLACES_API_KEY not set — skipping Places lookup")
        return []

    import httpx

    all_lawyers: list[dict] = []
    seen_names: set[str] = set()

    for specialty in specialties:
        query = f"{specialty} in {city}" if city else specialty
        params: dict = {
            "query": query,
            "key": api_key,
            "type": "lawyer",
        }

        # Bias results toward user location if available
        if lat and lng:
            params["location"] = f"{lat},{lng}"
            params["radius"] = "20000"  # 20 km

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    "https://maps.googleapis.com/maps/api/place/textsearch/json",
                    params=params,
                )
                data = resp.json()

            for place in data.get("results", [])[:limit]:
                name = place.get("name", "")
                if name in seen_names:
                    continue
                seen_names.add(name)

                place_lat = place.get("geometry", {}).get("location", {}).get("lat", 0)
                place_lng = place.get("geometry", {}).get("location", {}).get("lng", 0)

                # Calculate rough distance if user location is available
                distance = ""
                if lat and lng and place_lat and place_lng:
                    distance = _calc_distance_km(lat, lng, place_lat, place_lng)

                # Build Google Maps link
                place_id = place.get("place_id", "")
                maps_url = (
                    f"https://www.google.com/maps/place/?q=place_id:{place_id}"
                    if place_id
                    else f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote(name + ' ' + city)}"
                )

                all_lawyers.append({
                    "name": name,
                    "rating": place.get("rating", 0.0),
                    "address": place.get("formatted_address", ""),
                    "distance": distance,
                    "maps_url": maps_url,
                    "phone": "",  # Not available in Text Search; requires Place Details
                })

        except Exception as exc:
            print(f"[lawyers] Places API error for '{specialty}': {exc}")

    # Sort by rating descending, keep top `limit`
    all_lawyers.sort(key=lambda x: x.get("rating", 0), reverse=True)
    return all_lawyers[:limit]


def _calc_distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> str:
    """Rough Haversine distance formatted as a string."""
    import math

    R = 6371  # Earth radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    km = R * c
    return f"{km:.1f} km"


# ═══════════════════════════════════════════════════════════════════════════
# Step 4 — LinkedIn Search URL
# ═══════════════════════════════════════════════════════════════════════════

def build_linkedin_url(case_types: list[str], city: str) -> str:
    """Generate a LinkedIn people-search URL. Never scrapes."""
    specialties = map_case_to_specialties(case_types)
    keyword_parts = specialties[:2]  # Keep URL reasonable
    if city:
        keyword_parts.append(f"in {city}")
    keywords = " ".join(keyword_parts)
    encoded = urllib.parse.quote(keywords)
    return f"https://www.linkedin.com/search/results/people/?keywords={encoded}"


# ═══════════════════════════════════════════════════════════════════════════
# Public entry point
# ═══════════════════════════════════════════════════════════════════════════

async def get_lawyer_recommendations(
    ai_response: dict,
    city: str = "",
    lat: float = 0.0,
    lng: float = 0.0,
) -> dict:
    """Full pipeline: extract → map → fetch → build LinkedIn URL."""

    case_types = extract_case_types(ai_response)
    specialties = map_case_to_specialties(case_types)
    lawyers = await fetch_nearby_lawyers(specialties, city, lat, lng)
    linkedin_url = build_linkedin_url(case_types, city)

    return {
        "lawyers": lawyers,
        "linkedin_url": linkedin_url,
        "case_types": case_types,
    }
