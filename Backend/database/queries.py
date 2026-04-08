"""
JusticeAI — Database insert / fetch operations.
"""

from __future__ import annotations

from datetime import datetime, timezone

from config import settings
from database.supabase_client import get_supabase_client


class DatabaseOperationError(RuntimeError):
    """Raised when a database read/write operation fails."""


# ═══════════════════════════════════════════════════════════════════════════
# Insert
# ═══════════════════════════════════════════════════════════════════════════

def insert_document_record(
    text: str,
    case_type: str,
    strength: str,
) -> dict:
    """Insert a single document row. Returns the inserted record."""
    table = settings.SUPABASE_DOCUMENTS_TABLE
    client = get_supabase_client()

    payload = {
        "text": text,
        "case_type": case_type,
        "strength": strength.lower(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        response = client.table(table).insert(payload).execute()
        if response.data:
            return response.data[0]
        return payload
    except Exception as exc:
        raise DatabaseOperationError(
            f"Failed to insert document: {exc}"
        ) from exc


# ═══════════════════════════════════════════════════════════════════════════
# Fetch
# ═══════════════════════════════════════════════════════════════════════════

def fetch_all_document_records(batch_size: int = 1000) -> list[dict]:
    """Paginated fetch of all documents, newest first."""
    table = settings.SUPABASE_DOCUMENTS_TABLE
    client = get_supabase_client()

    all_rows: list[dict] = []
    start = 0

    try:
        while True:
            response = (
                client.table(table)
                .select("id, text, case_type, strength, created_at")
                .order("created_at", desc=True)
                .range(start, start + batch_size - 1)
                .execute()
            )

            rows = response.data or []
            all_rows.extend(rows)

            if len(rows) < batch_size:
                break

            start += batch_size

    except Exception as exc:
        raise DatabaseOperationError(
            f"Failed to fetch documents: {exc}"
        ) from exc

    return all_rows
