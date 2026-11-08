"""
JusticeAI — Integration test script.

Tests the live API at http://localhost:8000.
Run with:  python test_api.py
"""

from __future__ import annotations

import io
import json
import sys

# Force UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

import requests

BASE = "http://localhost:8000"

_GREEN = "\033[92m"
_RED = "\033[91m"
_CYAN = "\033[96m"
_YELLOW = "\033[93m"
_RESET = "\033[0m"


def _header(title: str):
    print(f"\n{_CYAN}{'═' * 60}")
    print(f"  {title}")
    print(f"{'═' * 60}{_RESET}")


def _pass(msg: str):
    print(f"  {_GREEN}✓ PASS{_RESET} — {msg}")


def _fail(msg: str):
    print(f"  {_RED}✗ FAIL{_RESET} — {msg}")


def _info(msg: str):
    print(f"  {_YELLOW}ℹ{_RESET} {msg}")


# ═══════════════════════════════════════════════════════════════════════════
# 1. Health Check
# ═══════════════════════════════════════════════════════════════════════════

def test_health():
    _header("1. Health Check — GET /health")
    try:
        r = requests.get(f"{BASE}/health", timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data["status"] == "ok"
        _pass(f"status={data['status']}, version={data.get('version')}")
    except Exception as e:
        _fail(str(e))
        raise


# ═══════════════════════════════════════════════════════════════════════════
# 2. Chat — Greeting guardrail
# ═══════════════════════════════════════════════════════════════════════════

def test_chat_greeting():
    _header("2. Chat Greeting Guardrail — POST /chat")
    payload = {"user_query": "hi"}
    r = requests.post(f"{BASE}/chat/", json=payload, timeout=30)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    data = r.json()

    assert "legal issue" in data["answer"].lower(), (
        f"Expected greeting to mention 'legal issue', got: {data['answer'][:80]}"
    )
    assert data["relevant_laws"] == [], (
        f"Expected empty relevant_laws for greeting, got: {data['relevant_laws']}"
    )
    assert data["sources"] == [], (
        f"Expected empty sources for greeting, got: {data['sources']}"
    )
    _pass("Greeting correctly intercepted (no RAG)")


# ═══════════════════════════════════════════════════════════════════════════
# 3. Chat — Legal question
# ═══════════════════════════════════════════════════════════════════════════

def test_chat_legal():
    _header("3. Chat Legal Question — POST /chat")
    payload = {
        "user_query": (
            "My landlord is refusing to return my security deposit of "
            "Rs. 50,000 even though I vacated the flat 3 months ago. "
            "What are my legal options?"
        )
    }
    r = requests.post(f"{BASE}/chat/", json=payload, timeout=60)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    data = r.json()
    _pass(f"Got answer ({len(data['answer'])} chars)")
    _info(f"Laws cited: {data.get('relevant_laws', [])}")
    _info(f"Sources: {data.get('sources', [])}")


# ═══════════════════════════════════════════════════════════════════════════
# 4. Upload — Text document
# ═══════════════════════════════════════════════════════════════════════════

def test_upload():
    _header("4. Upload Text File — POST /upload")

    consumer_complaint = (
        "CONSUMER COMPLAINT\n\n"
        "Complainant: Rajesh Kumar, S/o Mohan Kumar, R/o 45 MG Road, "
        "Bengaluru, Karnataka 560001\n\n"
        "Respondent: SuperGadgets Pvt. Ltd., 12 Electronic City, "
        "Bengaluru, Karnataka 560100\n\n"
        "Date of Purchase: 15/03/2024\n"
        "Invoice No: INV-2024-789456\n"
        "Amount Paid: Rs. 45,000 (Forty-Five Thousand Rupees)\n\n"
        "FACTS OF THE CASE:\n"
        "1. The complainant purchased a laptop (Model: XPro-500) from the "
        "respondent on 15/03/2024 for Rs. 45,000.\n"
        "2. Within 10 days of purchase, the laptop screen started flickering "
        "and the battery stopped charging.\n"
        "3. The complainant approached the respondent on 25/03/2024 for "
        "repair under warranty.\n"
        "4. The respondent refused to honour the warranty, claiming "
        "'physical damage' without evidence.\n"
        "5. A legal notice was sent on 10/04/2024 demanding replacement or "
        "refund within 15 days.\n"
        "6. No response was received from the respondent.\n\n"
        "RELIEF SOUGHT:\n"
        "- Refund of Rs. 45,000 with interest at 12% per annum\n"
        "- Compensation of Rs. 10,000 for mental agony and harassment\n"
        "- Cost of litigation\n\n"
        "Date: 30/04/2024\n"
        "Place: Bengaluru\n"
        "Signature: [Signed]\n"
    )

    files = {"file": ("consumer_complaint.txt", consumer_complaint.encode(), "text/plain")}
    r = requests.post(f"{BASE}/upload/", files=files, timeout=120)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    data = r.json()

    _pass(f"filename={data.get('filename')}")
    _info(f"case_type={data.get('structured_data', {}).get('case_type', 'N/A')}")
    _info(f"evidence_strength={data.get('structured_data', {}).get('evidence_strength', 'N/A')}")
    _info(f"is_legal_document={data.get('is_legal_document')}")
    _info(f"message={data.get('message', '')[:100]}")
    return data


# ═══════════════════════════════════════════════════════════════════════════
# 5. Analyze
# ═══════════════════════════════════════════════════════════════════════════

def test_analyze(upload_data: dict):
    _header("5. Analyze Case — POST /analyze")

    payload = {
        "structured_data": upload_data.get("structured_data", {}),
        "documents": upload_data.get("documents", []),
        "raw_text": upload_data.get("extracted_text", ""),
    }
    r = requests.post(f"{BASE}/analyze/", json=payload, timeout=120)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    data = r.json()

    valid_strengths = {"Weak", "Moderate", "Strong"}
    valid_difficulties = {"Easy", "Moderate", "Hard"}

    assert data["case_strength"] in valid_strengths, (
        f"Invalid case_strength: {data['case_strength']}"
    )
    assert data["case_difficulty"] in valid_difficulties, (
        f"Invalid case_difficulty: {data['case_difficulty']}"
    )

    for entry in data.get("document_analysis", []):
        es = entry.get("evidence_strength", "")
        assert es in valid_strengths, f"Invalid evidence_strength: {es}"

    _pass(f"case_strength={data['case_strength']}, difficulty={data['case_difficulty']}")
    _info(f"confidence_score={data.get('confidence_score')}")
    _info(f"rule_flags ({len(data.get('rule_flags', []))}): {data.get('rule_flags', [])[:3]}")
    _info(f"summary: {data.get('summary', '')[:120]}...")


# ═══════════════════════════════════════════════════════════════════════════
# 6. Extract Events
# ═══════════════════════════════════════════════════════════════════════════

def test_extract_events():
    _header("6. Extract Events — POST /extract-events")

    text = (
        "Timeline of Events:\n"
        "1. Agreement signed on 15/01/2024 between Rajesh and SuperGadgets.\n"
        "2. First installment of Rs. 20,000 paid on 01/02/2024.\n"
        "3. Legal notice sent on 10/04/2024 demanding resolution.\n"
        "4. Hearing scheduled at District Consumer Forum on 15/06/2024.\n"
        "5. Limitation period expires on 14/01/2026.\n"
    )

    r = requests.post(f"{BASE}/extract-events/", json={"text": text}, timeout=60)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    data = r.json()
    events = data.get("events", [])

    _pass(f"Extracted {len(events)} events")
    for ev in events:
        _info(f"  {ev['date']} — {ev['description']}")


# ═══════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print(f"\n{_CYAN}JusticeAI — Integration Tests{_RESET}")
    print(f"Target: {BASE}\n")

    try:
        test_health()
        test_chat_greeting()
        test_chat_legal()
        upload_data = test_upload()
        test_analyze(upload_data)
        test_extract_events()

        print(f"\n{_GREEN}{'═' * 60}")
        print(f"  ALL TESTS PASSED")
        print(f"{'═' * 60}{_RESET}\n")

    except Exception as e:
        print(f"\n{_RED}{'═' * 60}")
        print(f"  TEST FAILED: {e}")
        print(f"{'═' * 60}{_RESET}\n")
        sys.exit(1)
