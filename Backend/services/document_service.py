"""
JusticeAI — Document processing pipeline.

Steps: extract text → LLM structured extraction → InLegalBERT classify → regex enrich → save to DB + Storage.
"""

from __future__ import annotations

import asyncio
import json
import os
import re
from datetime import datetime, timezone
from typing import Optional

from config import settings
from database.queries import (
    DatabaseOperationError,
    delete_document_record,
    delete_file_from_storage,
    fetch_document_by_id,
    fetch_user_documents,
    get_file_signed_url,
    insert_document_record,
    upload_file_to_storage,
)
from models.schemas import StoredDocument
from services.classification_service import classifier
from utils.extraction import (
    detect_and_extract,
    extract_dates_regex,
    extract_money_regex,
)
from utils.llm import (
    JSON_OBJECT_RESPONSE_FORMAT,
    extract_response_content,
    get_groq_client,
)
from utils.prompts import EXTRACTION_SYSTEM, EXTRACTION_USER


# ═══════════════════════════════════════════════════════════════════════════
# Exceptions
# ═══════════════════════════════════════════════════════════════════════════

class DocumentStorageError(RuntimeError):
    """Raised when saving/fetching a document record fails."""


# ═══════════════════════════════════════════════════════════════════════════
# Legal-document heuristic
# ═══════════════════════════════════════════════════════════════════════════

_LEGAL_KEYWORDS = (
    "accused", "act", "affidavit", "agreement", "appellant", "arbitration",
    "buyer", "case", "cheque", "clause", "complainant", "complaint",
    "consumer", "contract", "court", "damages", "decree", "defendant",
    "dispute", "evidence", "fir", "invoice", "judge", "judgment",
    "landlord", "law", "lease", "legal notice", "liability",
    "money recovery", "notice", "order", "payment", "petition",
    "plaintiff", "police", "receipt", "refund", "respondent", "section",
    "seller", "stamp", "summons", "tenant", "tribunal", "witness",
)


def _looks_like_legal_document(
    raw_text: str,
    case_type: str,
    case_scores: dict[str, float],
) -> bool:
    """Multi-signal legal document detector."""
    normalised = re.sub(r"\s+", " ", raw_text).strip().lower()

    if len(normalised) < 80:
        return False

    keyword_hits = sum(1 for kw in _LEGAL_KEYWORDS if kw in normalised)
    has_dates = bool(extract_dates_regex(raw_text))
    has_money = bool(extract_money_regex(raw_text))

    if keyword_hits >= 2:
        return True
    if keyword_hits >= 1 and (has_dates or has_money):
        return True
    if case_type != "Others" and keyword_hits >= 1:
        top_score = max(case_scores.values()) if case_scores else 0.0
        if top_score >= 0.8:
            return True

    return False


# ═══════════════════════════════════════════════════════════════════════════
# Content-type mapping
# ═══════════════════════════════════════════════════════════════════════════

_CONTENT_TYPES = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
    ".tiff": "image/tiff",
    ".tif": "image/tiff",
    ".txt": "text/plain",
}


# ═══════════════════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════════════════

def _empty_extraction() -> dict:
    return {
        "document_type": "",
        "parties": [],
        "dates": [],
        "monetary_values": [],
        "key_clauses": [],
        "missing_elements": [],
        "evidence_strength": "",
        "reason": "",
        "case_type": "",
    }


def _normalize_strength(value: str) -> str:
    mapping = {"weak": "weak", "moderate": "moderate", "strong": "strong"}
    return mapping.get(value.strip().lower(), "moderate")


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
# Pipeline
# ═══════════════════════════════════════════════════════════════════════════

async def process_document(
    filename: str,
    file_bytes: bytes,
    user_id: Optional[str] = None,
) -> dict:
    """
    End-to-end document processing.
    If user_id is provided, the file is uploaded to Supabase Storage
    and a database record is created linked to the user.
    """

    loop = asyncio.get_running_loop()

    # ── Step 1: Text extraction ──────────────────────────────────────────
    raw_text = await loop.run_in_executor(
        None, detect_and_extract, filename, file_bytes
    )

    if not raw_text or not raw_text.strip():
        return {
            "filename": filename,
            "extracted_text": "",
            "structured_data": _empty_extraction(),
            "documents": [],
            "is_legal_document": False,
            "stored_document": None,
            "message": "Could not extract text from the uploaded file.",
        }

    # ── Step 2: LLM structured extraction ────────────────────────────────
    documents_list: list[dict] = []
    try:
        client = get_groq_client()
        truncated = raw_text[: settings.MAX_EXTRACTION_CHARS]
        prompt = EXTRACTION_USER.format(text=truncated)

        response = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": EXTRACTION_SYSTEM},
                {"role": "user", "content": prompt},
            ],
            temperature=0.0,
            max_completion_tokens=2000,
            response_format=JSON_OBJECT_RESPONSE_FORMAT,
        )

        raw_json = extract_response_content(response)
        parsed = json.loads(_strip_json_fences(raw_json))
        documents_list = parsed.get("documents", [])
    except Exception as exc:
        print(f"[document_service] LLM extraction error: {exc}")
        documents_list = []

    # ── Step 3: InLegalBERT classification ───────────────────────────────
    case_type = await loop.run_in_executor(None, classifier.classify, raw_text)
    case_scores = await loop.run_in_executor(
        None, classifier.classify_with_scores, raw_text
    )

    is_legal = _looks_like_legal_document(raw_text, case_type, case_scores)

    if not is_legal:
        return {
            "filename": filename,
            "extracted_text": raw_text,
            "structured_data": _empty_extraction(),
            "documents": [],
            "is_legal_document": False,
            "stored_document": None,
            "message": (
                "This does not appear to be a legal document. "
                "Please upload a legal document such as an FIR, contract, "
                "complaint, court order, invoice, receipt, notice, or affidavit."
            ),
        }

    # Attach case_type to every document
    for doc in documents_list:
        doc["case_type"] = case_type

    # ── Step 4: Regex enrichment ─────────────────────────────────────────
    regex_dates = extract_dates_regex(raw_text)
    regex_money = extract_money_regex(raw_text)

    for doc in documents_list:
        existing_dates = set(doc.get("dates", []))
        for d in regex_dates:
            if d not in existing_dates:
                doc.setdefault("dates", []).append(d)

        existing_money = set(doc.get("monetary_values", []))
        for m in regex_money:
            if m not in existing_money:
                doc.setdefault("monetary_values", []).append(m)

    # ── Build flat extraction dict ───────────────────────────────────────
    if documents_list:
        first = documents_list[0]
        flat = {
            "document_type": first.get("document_type", ""),
            "parties": first.get("parties", []),
            "dates": first.get("dates", []),
            "monetary_values": first.get("monetary_values", []),
            "key_clauses": first.get("key_clauses", []),
            "missing_elements": first.get("missing_elements", []),
            "evidence_strength": first.get("evidence_strength", ""),
            "reason": first.get("reason", ""),
            "case_type": case_type,
        }
    else:
        flat = _empty_extraction()
        flat["case_type"] = case_type

    # ── Step 5: Save to Supabase (Storage + DB) ─────────────────────────
    strength = _normalize_strength(flat.get("evidence_strength", "moderate"))
    stored = None

    if user_id:
        try:
            stored = await save_user_document(
                user_id=user_id,
                filename=filename,
                file_bytes=file_bytes,
                raw_text=raw_text,
                case_type=case_type,
                strength=strength,
                structured_data=flat,
            )
        except DocumentStorageError as exc:
            print(f"[document_service] Storage warning: {exc}")
    else:
        # No user — still try legacy save if Supabase is configured
        try:
            stored = await save_classified_document(raw_text, case_type, strength)
        except DocumentStorageError as exc:
            print(f"[document_service] Storage warning: {exc}")

    return {
        "filename": filename,
        "extracted_text": raw_text,
        "structured_data": flat,
        "documents": documents_list,
        "is_legal_document": True,
        "stored_document": stored.model_dump() if stored else None,
        "message": (
            f"Document processed successfully. "
            f"Classified as: {case_type}."
        ),
    }


# ═══════════════════════════════════════════════════════════════════════════
# Storage helpers
# ═══════════════════════════════════════════════════════════════════════════

async def save_user_document(
    user_id: str,
    filename: str,
    file_bytes: bytes,
    raw_text: str,
    case_type: str,
    strength: str,
    structured_data: dict | None = None,
) -> StoredDocument:
    """Upload file to Storage + insert metadata row in DB."""
    loop = asyncio.get_running_loop()

    ext = os.path.splitext(filename)[1].lower()
    content_type = _CONTENT_TYPES.get(ext, "application/octet-stream")

    # Upload to Supabase Storage
    try:
        file_path = await loop.run_in_executor(
            None,
            upload_file_to_storage,
            user_id, filename, file_bytes, content_type,
        )
    except Exception as exc:
        raise DocumentStorageError(f"File upload failed: {exc}") from exc

    # Insert DB record
    try:
        row = await loop.run_in_executor(
            None,
            insert_document_record,
            user_id, filename, file_path, ext.lstrip("."),
            len(file_bytes), raw_text, case_type, strength,
            structured_data,
        )
        return StoredDocument(
            id=row.get("id"),
            user_id=user_id,
            filename=filename,
            file_path=file_path,
            text=row.get("text", raw_text),
            case_type=row.get("case_type", case_type),
            strength=row.get("strength", strength),
            created_at=row.get("created_at", datetime.now(timezone.utc)),
        )
    except Exception as exc:
        raise DocumentStorageError(f"DB insert failed: {exc}") from exc


async def save_classified_document(
    text: str, case_type: str, strength: str
) -> StoredDocument:
    """Legacy save (no user_id). For backward compatibility."""
    loop = asyncio.get_running_loop()
    try:
        row = await loop.run_in_executor(
            None,
            insert_document_record,
            "", "", "", "", 0, text, case_type, strength, None,
        )
        return StoredDocument(
            id=row.get("id"),
            text=row.get("text", text),
            case_type=row.get("case_type", case_type),
            strength=row.get("strength", strength),
            created_at=row.get("created_at", datetime.now(timezone.utc)),
        )
    except Exception as exc:
        raise DocumentStorageError(f"Failed to save document: {exc}") from exc


async def fetch_all_stored_documents(
    user_id: Optional[str] = None,
) -> list[StoredDocument]:
    """Fetch stored documents — filtered by user if provided."""
    loop = asyncio.get_running_loop()
    try:
        if user_id:
            rows = await loop.run_in_executor(
                None, fetch_user_documents, user_id
            )
        else:
            # Fallback: this won't work well without user_id
            rows = []

        return [
            StoredDocument(
                id=r.get("id"),
                user_id=r.get("user_id", ""),
                filename=r.get("filename", ""),
                file_path=r.get("file_path", ""),
                text=r.get("text", ""),
                case_type=r.get("case_type", ""),
                strength=r.get("strength", ""),
                created_at=r.get("created_at", datetime.now(timezone.utc)),
            )
            for r in rows
        ]
    except Exception as exc:
        raise DocumentStorageError(
            f"Failed to fetch documents: {exc}"
        ) from exc


async def get_document_download_url(
    user_id: str, document_id: str
) -> str | None:
    """Get a signed download URL for a document's file."""
    loop = asyncio.get_running_loop()

    doc = await loop.run_in_executor(
        None, fetch_document_by_id, user_id, document_id
    )
    if not doc or not doc.get("file_path"):
        return None

    try:
        url = await loop.run_in_executor(
            None, get_file_signed_url, doc["file_path"]
        )
        return url
    except Exception:
        return None


async def remove_user_document(user_id: str, document_id: str) -> bool:
    """Delete a document's file from Storage and its DB record."""
    loop = asyncio.get_running_loop()

    doc = await loop.run_in_executor(
        None, fetch_document_by_id, user_id, document_id
    )
    if not doc:
        return False

    # Delete file from storage
    if doc.get("file_path"):
        try:
            await loop.run_in_executor(
                None, delete_file_from_storage, doc["file_path"]
            )
        except Exception as exc:
            print(f"[document_service] Storage delete warning: {exc}")

    # Delete DB record
    deleted = await loop.run_in_executor(
        None, delete_document_record, user_id, document_id
    )
    return deleted
