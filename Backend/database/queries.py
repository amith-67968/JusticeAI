"""
JusticeAI — Database operations (Supabase).

All queries include user_id for row-level data isolation.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from config import settings
from database import local_store
from database.supabase_client import get_supabase_client


class DatabaseOperationError(RuntimeError):
    """Raised when a database read/write operation fails."""


def _log_local_fallback(operation: str, exc: Exception) -> None:
    print(f"[queries] {operation} failed, using local store fallback: {exc}")


def _merge_rows(
    primary_rows: list[dict],
    secondary_rows: list[dict],
    sort_key: str,
    reverse: bool = True,
) -> list[dict]:
    merged: dict[str, dict] = {}

    for row in secondary_rows:
        row_id = str(row.get("id") or f"secondary-{len(merged)}")
        merged[row_id] = row

    for row in primary_rows:
        row_id = str(row.get("id") or f"primary-{len(merged)}")
        merged[row_id] = row

    rows = list(merged.values())
    rows.sort(key=lambda row: row.get(sort_key, ""), reverse=reverse)
    return rows


# ═══════════════════════════════════════════════════════════════════════════
# Profiles
# ═══════════════════════════════════════════════════════════════════════════

def get_profile(user_id: str) -> dict | None:
    """Fetch a user profile by ID."""
    try:
        client = get_supabase_client()
        response = (
            client.table("profiles")
            .select("*")
            .eq("id", user_id)
            .single()
            .execute()
        )
        return response.data or local_store.get_profile(user_id)
    except Exception as exc:
        _log_local_fallback("get_profile", exc)
        return local_store.get_profile(user_id)


def update_profile(user_id: str, updates: dict) -> dict | None:
    """Update profile fields (full_name, avatar_url, etc.)."""
    try:
        client = get_supabase_client()
        response = (
            client.table("profiles")
            .update(updates)
            .eq("id", user_id)
            .execute()
        )
        row = response.data[0] if response.data else None
        if row:
            return row
    except Exception as exc:
        _log_local_fallback("update_profile", exc)

    return local_store.update_profile(user_id, updates)


# ═══════════════════════════════════════════════════════════════════════════
# Documents
# ═══════════════════════════════════════════════════════════════════════════

def insert_document_record(
    user_id: str,
    filename: str,
    file_path: str,
    file_type: str,
    file_size_bytes: int,
    text: str,
    case_type: str,
    strength: str,
    structured_data: dict | None = None,
) -> dict:
    """Insert a document record linked to a user. Returns the inserted row."""
    payload = {
        "user_id": user_id,
        "filename": filename,
        "file_path": file_path,
        "file_type": file_type,
        "file_size_bytes": file_size_bytes,
        "text": text,
        "case_type": case_type,
        "strength": strength.lower(),
        "structured_data": structured_data or {},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        client = get_supabase_client()
        table = settings.SUPABASE_DOCUMENTS_TABLE
        response = client.table(table).insert(payload).execute()
        if response.data:
            return response.data[0]
        return payload
    except Exception as exc:
        _log_local_fallback("insert_document_record", exc)
        return local_store.insert_document_record(
            user_id=user_id,
            filename=filename,
            file_path=file_path,
            file_type=file_type,
            file_size_bytes=file_size_bytes,
            text=text,
            case_type=case_type,
            strength=strength,
            structured_data=structured_data,
        )


def fetch_user_documents(user_id: str, batch_size: int = 1000) -> list[dict]:
    """Fetch all documents for a specific user, newest first."""
    all_rows: list[dict] = []

    try:
        client = get_supabase_client()
        table = settings.SUPABASE_DOCUMENTS_TABLE
        start = 0
        while True:
            response = (
                client.table(table)
                .select("*")
                .eq("user_id", user_id)
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
        _log_local_fallback("fetch_user_documents", exc)

    local_rows = local_store.fetch_user_documents(user_id)
    return _merge_rows(all_rows, local_rows, sort_key="created_at")


def fetch_document_by_id(user_id: str, document_id: str) -> dict | None:
    """Fetch a single document by ID, ensuring it belongs to the user."""
    try:
        client = get_supabase_client()
        table = settings.SUPABASE_DOCUMENTS_TABLE
        response = (
            client.table(table)
            .select("*")
            .eq("id", document_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        if response.data:
            return response.data
    except Exception as exc:
        _log_local_fallback("fetch_document_by_id", exc)

    return local_store.fetch_document_by_id(user_id, document_id)


def delete_document_record(user_id: str, document_id: str) -> bool:
    """Delete a document record. Returns True if deleted."""
    deleted = False
    try:
        client = get_supabase_client()
        table = settings.SUPABASE_DOCUMENTS_TABLE
        response = (
            client.table(table)
            .delete()
            .eq("id", document_id)
            .eq("user_id", user_id)
            .execute()
        )
        deleted = bool(response.data)
    except Exception as exc:
        _log_local_fallback("delete_document_record", exc)

    return local_store.delete_document_record(user_id, document_id) or deleted


# ═══════════════════════════════════════════════════════════════════════════
# Analysis Results
# ═══════════════════════════════════════════════════════════════════════════

def insert_analysis_result(user_id: str, result: dict) -> dict:
    """Save an analysis result linked to a user (and optionally a document)."""
    payload = {
        "user_id": user_id,
        "document_id": result.get("document_id"),
        "case_strength": result.get("case_strength", ""),
        "case_difficulty": result.get("case_difficulty", ""),
        "confidence_score": result.get("confidence_score", 0),
        "summary": result.get("summary", ""),
        "strong_points": result.get("strong_points", []),
        "weak_points": result.get("weak_points", []),
        "next_steps": result.get("next_steps", []),
        "document_analysis": result.get("document_analysis", []),
        "rule_flags": result.get("rule_flags", []),
        "raw_text": result.get("raw_text", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        client = get_supabase_client()
        response = client.table("analysis_results").insert(payload).execute()
        return response.data[0] if response.data else payload
    except Exception as exc:
        _log_local_fallback("insert_analysis_result", exc)
        return local_store.insert_analysis_result(user_id, result)


def fetch_user_analyses(user_id: str, limit: int = 50) -> list[dict]:
    """Fetch analysis history for a user, newest first."""
    try:
        client = get_supabase_client()
        response = (
            client.table("analysis_results")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        rows = response.data or []
    except Exception as exc:
        _log_local_fallback("fetch_user_analyses", exc)
        rows = []

    local_rows = local_store.fetch_user_analyses(user_id, limit=limit)
    return _merge_rows(rows, local_rows, sort_key="created_at")[:limit]


# ═══════════════════════════════════════════════════════════════════════════
# Chat Sessions & Messages
# ═══════════════════════════════════════════════════════════════════════════

def create_chat_session(user_id: str, title: str = "New Chat") -> dict:
    """Create a new chat session."""
    payload = {
        "user_id": user_id,
        "title": title,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        client = get_supabase_client()
        response = client.table("chat_sessions").insert(payload).execute()
        return response.data[0] if response.data else payload
    except Exception as exc:
        _log_local_fallback("create_chat_session", exc)
        return local_store.create_chat_session(user_id, title=title)


def fetch_user_chat_sessions(user_id: str, limit: int = 50) -> list[dict]:
    """Fetch all chat sessions for a user, most recent first."""
    try:
        client = get_supabase_client()
        response = (
            client.table("chat_sessions")
            .select("*")
            .eq("user_id", user_id)
            .order("updated_at", desc=True)
            .limit(limit)
            .execute()
        )
        rows = response.data or []
    except Exception as exc:
        _log_local_fallback("fetch_user_chat_sessions", exc)
        rows = []

    local_rows = local_store.fetch_user_chat_sessions(user_id, limit=limit)
    return _merge_rows(rows, local_rows, sort_key="updated_at")[:limit]


def insert_chat_message(
    session_id: str,
    user_id: str,
    role: str,
    content: str,
    metadata: dict | None = None,
) -> dict:
    """Insert a chat message into a session."""
    payload = {
        "session_id": session_id,
        "user_id": user_id,
        "role": role,
        "content": content,
        "metadata": metadata or {},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        client = get_supabase_client()
        response = client.table("chat_messages").insert(payload).execute()
        return response.data[0] if response.data else payload
    except Exception as exc:
        _log_local_fallback("insert_chat_message", exc)
        return local_store.insert_chat_message(
            session_id=session_id,
            user_id=user_id,
            role=role,
            content=content,
            metadata=metadata,
        )


def fetch_session_messages(
    session_id: str, user_id: str, limit: int = 100
) -> list[dict]:
    """Fetch all messages in a chat session, in chronological order."""
    try:
        client = get_supabase_client()
        response = (
            client.table("chat_messages")
            .select("*")
            .eq("session_id", session_id)
            .eq("user_id", user_id)
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )
        rows = response.data or []
    except Exception as exc:
        _log_local_fallback("fetch_session_messages", exc)
        rows = []

    local_rows = local_store.fetch_session_messages(
        session_id=session_id,
        user_id=user_id,
        limit=limit,
    )
    return _merge_rows(rows, local_rows, sort_key="created_at", reverse=False)[:limit]


def update_chat_session_title(
    session_id: str, user_id: str, title: str
) -> dict | None:
    """Update the title of a chat session."""
    updated = None
    try:
        client = get_supabase_client()
        response = (
            client.table("chat_sessions")
            .update({"title": title, "updated_at": datetime.now(timezone.utc).isoformat()})
            .eq("id", session_id)
            .eq("user_id", user_id)
            .execute()
        )
        updated = response.data[0] if response.data else None
    except Exception as exc:
        _log_local_fallback("update_chat_session_title", exc)

    local_updated = local_store.update_chat_session_title(
        session_id=session_id,
        user_id=user_id,
        title=title,
    )
    return updated or local_updated


def delete_chat_session(session_id: str, user_id: str) -> bool:
    """Delete a chat session (cascade deletes messages)."""
    deleted = False
    try:
        client = get_supabase_client()
        response = (
            client.table("chat_sessions")
            .delete()
            .eq("id", session_id)
            .eq("user_id", user_id)
            .execute()
        )
        deleted = bool(response.data)
    except Exception as exc:
        _log_local_fallback("delete_chat_session", exc)

    return local_store.delete_chat_session(session_id, user_id) or deleted


# ═══════════════════════════════════════════════════════════════════════════
# Storage (file upload/download to Supabase Storage)
# ═══════════════════════════════════════════════════════════════════════════

STORAGE_BUCKET = "legal-documents"


def upload_file_to_storage(
    user_id: str,
    filename: str,
    file_bytes: bytes,
    content_type: str = "application/octet-stream",
) -> str:
    """Upload a file to Supabase Storage. Returns the storage path."""
    storage_path = f"{user_id}/{filename}"

    try:
        client = get_supabase_client()
        client.storage.from_(STORAGE_BUCKET).upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": content_type},
        )
        return storage_path
    except Exception as exc:
        _log_local_fallback("upload_file_to_storage", exc)
        return local_store.upload_file_to_storage(
            user_id=user_id,
            filename=filename,
            file_bytes=file_bytes,
            content_type=content_type,
        )


def get_file_signed_url(file_path: str, expires_in: int = 3600) -> str:
    """Generate a signed URL for a private file (default 1 hour expiry)."""
    try:
        client = get_supabase_client()
        result = client.storage.from_(STORAGE_BUCKET).create_signed_url(
            path=file_path,
            expires_in=expires_in,
        )
        return result.get("signedURL", "")
    except Exception as exc:
        _log_local_fallback("get_file_signed_url", exc)
        return local_store.get_file_signed_url(file_path, expires_in=expires_in)


def delete_file_from_storage(file_path: str) -> bool:
    """Delete a file from Supabase Storage."""
    deleted = False
    try:
        client = get_supabase_client()
        client.storage.from_(STORAGE_BUCKET).remove([file_path])
        deleted = True
    except Exception as exc:
        _log_local_fallback("delete_file_from_storage", exc)

    return local_store.delete_file_from_storage(file_path) or deleted
