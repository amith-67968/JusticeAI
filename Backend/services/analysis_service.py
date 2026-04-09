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
        return _fallback_analysis(
            rule_flags,
            score_adj,
            case_type,
            structured_data=structured_data,
            documents=documents,
        )

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
    structured_data: Optional[dict] = None,
    documents: Optional[list[dict]] = None,
) -> dict:
    """Return a structured fallback when the LLM is unavailable."""
    def describe_count(count: int, singular_label: str, plural_label: str) -> str:
        if count <= 0:
            return ""
        if count == 1:
            return f"1 {singular_label}"
        if count <= 4:
            return f"{count} {plural_label}"
        return f"multiple {plural_label}"

    docs = [doc for doc in (documents or []) if isinstance(doc, dict)]
    if not docs and structured_data:
        docs = [structured_data]

    primary = docs[0] if docs else (structured_data or {})

    parties = primary.get("parties") or []
    dates = primary.get("dates") or []
    money_values = primary.get("monetary_values") or []
    key_clauses = primary.get("key_clauses") or []
    missing_elements = [item.lower() for item in (primary.get("missing_elements") or [])]
    document_type = primary.get("document_type") or "Uploaded Document"
    evidence_strength = _normalize_strength(primary.get("evidence_strength", "Moderate"))
    provided_reason = str(primary.get("reason") or "").strip()

    confidence = 45 + score_adj
    if evidence_strength == "Strong":
        confidence += 20
    elif evidence_strength == "Moderate":
        confidence += 10
    else:
        confidence -= 5

    if len(parties) >= 2:
        confidence += 10
    elif parties:
        confidence += 4
    if dates:
        confidence += 6
    if money_values:
        confidence += 6
    if key_clauses:
        confidence += 8
    if not parties:
        confidence -= 10
    if not dates:
        confidence -= 8
    if not key_clauses:
        confidence -= 8

    confidence = max(20, min(92, confidence))

    if confidence >= 75:
        case_strength = "Strong"
    elif confidence >= 45:
        case_strength = "Moderate"
    else:
        case_strength = "Weak"

    if len(missing_elements) >= 3 or (not parties and not dates):
        case_difficulty = "Hard"
    elif confidence >= 72 and len(missing_elements) <= 1:
        case_difficulty = "Easy"
    else:
        case_difficulty = "Moderate"

    summary_parts: list[str] = []
    if case_type and case_type != "Unknown":
        summary_parts.append(f"This appears to be a {case_type.lower()} matter")
    else:
        summary_parts.append("The uploaded material appears to describe a legal dispute")

    factual_parts: list[str] = []
    if len(parties) >= 2:
        factual_parts.append(describe_count(len(parties), "party", "parties") + " were identified")
    if dates:
        factual_parts.append(
            describe_count(len(dates), "date reference", "date references")
            + " were detected"
        )
    if money_values:
        factual_parts.append(
            describe_count(
                len(money_values),
                "monetary reference",
                "monetary references",
            )
            + " were found"
        )
    if key_clauses:
        factual_parts.append(
            describe_count(
                len(key_clauses),
                "important clause or fact snippet",
                "important clause or fact snippets",
            )
            + " were extracted"
        )

    if factual_parts:
        summary_parts.append(", and " + ", ".join(factual_parts))

    if missing_elements:
        summary_parts.append(
            ". Some important details still need confirmation, especially "
            + ", ".join(missing_elements[:3])
        )

    summary = "".join(summary_parts).strip() + "."

    strong_points = ["Case type has been identified from the uploaded material."]
    if len(parties) >= 2:
        strong_points.append("Both sides or multiple parties appear in the extracted record.")
    if dates:
        strong_points.append("The document includes date references that help support a timeline.")
    if money_values:
        strong_points.append("Monetary amounts were detected, which can help quantify the claim.")
    if key_clauses:
        strong_points.append("Important clauses or factual passages were extracted from the document.")

    weak_points: list[str] = []
    if not parties:
        weak_points.append("Party details are incomplete, which weakens attribution and liability analysis.")
    if not dates:
        weak_points.append("Date references are limited, making the timeline harder to prove.")
    if not key_clauses:
        weak_points.append("Key clauses or factual statements were not extracted cleanly.")
    if not weak_points:
        weak_points.append("Automated review used fallback scoring because the live AI analysis was unavailable.")

    next_steps: list[str] = []
    lowered_case_type = case_type.lower()
    if "consumer" in lowered_case_type:
        next_steps.extend(
            [
                "Keep the invoice, order screenshots, payment proof, and seller communications together.",
                "Send a written complaint or legal notice asking for refund, replacement, or compensation.",
                "If unresolved, prepare for a Consumer Commission complaint with the supporting documents.",
            ]
        )
    elif "criminal" in lowered_case_type:
        next_steps.extend(
            [
                "Preserve the incident evidence, witness details, and any complaint or FIR references.",
                "Write down the full timeline before approaching the police or counsel.",
                "Consult a criminal lawyer promptly if immediate protection or procedure advice is needed.",
            ]
        )
    elif "cyber" in lowered_case_type:
        next_steps.extend(
            [
                "Save screenshots, transaction IDs, device details, and account identifiers.",
                "Report quickly through the appropriate cyber-crime channel or police station.",
                "Document each loss and communication linked to the incident.",
            ]
        )
    else:
        next_steps.extend(
            [
                "Organize the full set of supporting documents, notices, and correspondence.",
                "Prepare a short written timeline covering the parties, dates, and disputed events.",
                "Consult a qualified advocate to review strategy, limitation, and remedy options.",
            ]
        )

    reason_parts: list[str] = []
    if provided_reason:
        reason_parts.append(provided_reason.rstrip("."))
    else:
        if parties:
            reason_parts.append(
                describe_count(len(parties), "party", "parties") + " were detected"
            )
        if dates:
            reason_parts.append(
                describe_count(len(dates), "date", "dates") + " were detected"
            )
        if money_values:
            reason_parts.append(
                describe_count(
                    len(money_values),
                    "monetary reference",
                    "monetary references",
                )
                + " were found"
            )
        if key_clauses:
            reason_parts.append(
                describe_count(
                    len(key_clauses),
                    "key factual snippet",
                    "key factual snippets",
                )
                + " were extracted"
            )

    document_reason = ". ".join(reason_parts).strip()
    if document_reason:
        document_reason += "."
    else:
        document_reason = "Only limited structured details could be extracted from the uploaded material."

    return {
        "case_strength": case_strength,
        "case_difficulty": case_difficulty,
        "confidence_score": confidence,
        "summary": summary,
        "strong_points": strong_points[:4],
        "weak_points": weak_points[:4],
        "next_steps": next_steps[:3],
        "document_analysis": [
            {
                "document_type": document_type,
                "evidence_strength": evidence_strength,
                "reason": document_reason,
            }
        ],
        "rule_flags": rule_flags,
    }
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
