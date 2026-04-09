"""
JusticeAI — Rule engine + LLM-powered case analysis.
"""

from __future__ import annotations

import json
from typing import Optional

from config import settings
from utils.llm import (
    create_json_completion_with_fallback,
    extract_json_object,
    extract_response_content,
    get_groq_client,
)
from utils.prompts import ANALYSIS_SYSTEM, ANALYSIS_USER


# ═══════════════════════════════════════════════════════════════════════════
# Phase 1 — Rule Engine
# ═══════════════════════════════════════════════════════════════════════════

def apply_rules(
    structured_data: dict,
    documents: Optional[list[dict]] = None,
) -> dict:
    """Run deterministic rule checks. Returns ``rule_flags`` and
    ``preliminary_score_adjustment``."""

    docs = documents or []
    if not docs and structured_data:
        docs = [structured_data]

    flags: list[str] = []
    score_adj = 0

    for doc in docs:
        missing = [m.lower() for m in doc.get("missing_elements", [])]
        clauses = " ".join(doc.get("key_clauses", [])).lower()
        doc_type = doc.get("document_type", "").lower()
        parties = doc.get("parties", [])
        monetary = doc.get("monetary_values", [])

        # ── Missing elements ─────────────────────────────────────────────
        if "signature" in missing:
            flags.append(
                "MISSING_SIGNATURE: Document lacks signature — "
                "reduces evidentiary value"
            )
            score_adj -= 10

        if "stamp" in missing:
            flags.append(
                "MISSING_STAMP: Document not stamped — "
                "may affect validity"
            )
            score_adj -= 5

        if "date" in missing:
            flags.append(
                "MISSING_DATE: No date found — "
                "timeline difficult to establish"
            )
            score_adj -= 5

        if "witness" in missing:
            flags.append(
                "MISSING_WITNESS: No witness signature — "
                "may weaken enforceability"
            )
            score_adj -= 5

        if any("notari" in m for m in missing):
            flags.append(
                "NOT_NOTARIZED: Document not notarized — "
                "may challenge authenticity"
            )
            score_adj -= 5

        # ── Positive signals ─────────────────────────────────────────────
        if any(kw in clauses for kw in ("payment", "receipt", "transaction")):
            flags.append(
                "PAYMENT_PROOF: Payment/receipt documentation found — "
                "strengthens claim"
            )
            score_adj += 10

        if "fir" in doc_type:
            flags.append(
                "FIR_FILED: FIR filing documented — "
                "strong procedural step"
            )
            score_adj += 10

        if any(kw in doc_type for kw in ("court order", "judgment")):
            flags.append(
                "COURT_ORDER: Court order/judgment present — "
                "very strong evidence"
            )
            score_adj += 15

        if monetary:
            flags.append(
                f"MONETARY_VALUES: {len(monetary)} monetary value(s) identified"
            )

        if any(kw in clauses for kw in ("agreement", "contract")):
            flags.append(
                "AGREEMENT_FOUND: Contractual agreement documented"
            )
            score_adj += 5

        if len(parties) >= 2:
            flags.append(
                "MULTIPLE_PARTIES: Both parties identified — "
                "strengthens record"
            )
            score_adj += 5

        if len(parties) == 0:
            flags.append(
                "NO_PARTIES: No parties identified — "
                "weakens case foundation"
            )
            score_adj -= 10

    # Clamp
    score_adj = max(-30, min(30, score_adj))

    return {
        "rule_flags": flags,
        "preliminary_score_adjustment": score_adj,
    }


# ═══════════════════════════════════════════════════════════════════════════
# Normalisers
# ═══════════════════════════════════════════════════════════════════════════

_STRENGTH_MAP = {
    "weak": "Weak", "moderate": "Moderate", "strong": "Strong",
}

_DIFFICULTY_MAP = {
    "low": "Easy", "easy": "Easy",
    "medium": "Moderate", "moderate": "Moderate",
    "high": "Hard", "hard": "Hard",
}


def _normalize_strength(val: str) -> str:
    return _STRENGTH_MAP.get(val.strip().lower(), "Moderate")


def _normalize_difficulty(val: str) -> str:
    return _DIFFICULTY_MAP.get(val.strip().lower(), "Moderate")


def _strip_json_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


# ═══════════════════════════════════════════════════════════════════════════
# Phase 2 — LLM Analysis
# ═══════════════════════════════════════════════════════════════════════════

async def analyze_case(
    structured_data: dict,
    documents: Optional[list[dict]] = None,
    raw_text: Optional[str] = None,
) -> dict:
    """Full case analysis: rule engine → LLM → merge."""

    # 1. Rule engine
    rule_result = apply_rules(structured_data, documents)
    rule_flags = rule_result["rule_flags"]
    score_adj = rule_result["preliminary_score_adjustment"]

    # 2. Determine case type
    case_type = structured_data.get("case_type", "")
    if not case_type and documents:
        for doc in documents:
            ct = doc.get("case_type", "")
            if ct:
                case_type = ct
                break
    case_type = case_type or "Unknown"

    # 3. LLM call
    try:
        client = get_groq_client()

        prompt = ANALYSIS_USER.format(
            structured_json=json.dumps(structured_data, indent=2, default=str),
            rule_flags=json.dumps(rule_flags),
            case_type=case_type,
        )

        response = await create_json_completion_with_fallback(
            client,
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": ANALYSIS_SYSTEM},
                {"role": "user", "content": prompt},
            ],
            temperature=0.0,
            max_completion_tokens=2000,
        )

        raw = extract_response_content(response)
        analysis = extract_json_object(raw)

    except Exception as exc:
        print(f"[analysis] LLM error: {exc}")
        return _fallback_analysis(rule_flags, score_adj, case_type)

    # 4. Normalise
    analysis["case_strength"] = _normalize_strength(
        analysis.get("case_strength", "Moderate")
    )

    # Accept case_complexity as alias for case_difficulty
    difficulty_raw = analysis.get(
        "case_difficulty",
        analysis.get("case_complexity", "Moderate"),
    )
    analysis["case_difficulty"] = _normalize_difficulty(difficulty_raw)

    for entry in analysis.get("document_analysis", []):
        entry["evidence_strength"] = _normalize_strength(
            entry.get("evidence_strength", "Moderate")
        )

    # 5. Merge rule flags
    analysis["rule_flags"] = rule_flags

    # 6. Adjust confidence
    conf = int(analysis.get("confidence_score", 50))
    conf = max(0, min(100, conf + score_adj))
    analysis["confidence_score"] = conf

    return analysis


def _fallback_analysis(
    rule_flags: list[str],
    score_adj: int,
    case_type: str,
) -> dict:
    """Return a safe default when LLM fails."""
    return {
        "case_strength": "Moderate",
        "case_difficulty": "Moderate",
        "confidence_score": max(0, min(100, 50 + score_adj)),
        "summary": (
            f"Automated analysis could not be completed for this "
            f"{case_type} case. Please review the documents manually "
            f"and consult a qualified advocate."
        ),
        "strong_points": [
            "Documents have been submitted for review",
            "Case type has been identified",
        ],
        "weak_points": [
            "Automated analysis was unavailable — manual review recommended",
            "Some document details may need verification",
        ],
        "next_steps": [
            "Consult a qualified advocate for a professional opinion",
            "Ensure all supporting documents are collected and organised",
        ],
        "document_analysis": [],
        "rule_flags": rule_flags,
    }
