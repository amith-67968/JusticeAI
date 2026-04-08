"""
JusticeAI — Database operations (Supabase).

All queries include user_id for row-level data isolation.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from config import settings
from database.supabase_client import get_supabase_client


class DatabaseOperationError(RuntimeError):
    """Raised when a database read/write operation fails."""


# ═══════════════════════════════════════════════════════════════════════════
# Profiles
# ═══════════════════════════════════════════════════════════════════════════

def get_profile(user_id: str) -> dict | None:
    """Fetch a user profile by ID."""
    client = get_supabase_client()
    try:
        response = (
            client.table("profiles")
            .select("*")
            .eq("id", user_id)
            .single()
            .execute()
        )
        return response.data
    except Exception:
        return None


def update_profile(user_id: str, updates: dict) -> dict | None:
    """Update profile fields (full_name, avatar_url, etc.)."""
    client = get_supabase_client()
    try:
        response = (
            client.table("profiles")
            .update(updates)
            .eq("id", user_id)
            .execute()
        )
        return response.data[0] if response.data else None
    except Exception as exc:
        raise DatabaseOperationError(f"Failed to update profile: {exc}") from exc


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
    client = get_supabase_client()
    table = settings.SUPABASE_DOCUMENTS_TABLE

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
        response = client.table(table).insert(payload).execute()
        if response.data:
            return response.data[0]
        return payload
    except Exception as exc:
        raise DatabaseOperationError(
            f"Failed to insert document: {exc}"
        ) from exc


def fetch_user_documents(user_id: str, batch_size: int = 1000) -> list[dict]:
    """Fetch all documents for a specific user, newest first."""
    client = get_supabase_client()
    table = settings.SUPABASE_DOCUMENTS_TABLE
    all_rows: list[dict] = []
    start = 0

    try:
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
        raise DatabaseOperationError(
            f"Failed to fetch documents: {exc}"
        ) from exc

    return all_rows


def fetch_document_by_id(user_id: str, document_id: str) -> dict | None:
    """Fetch a single document by ID, ensuring it belongs to the user."""
    client = get_supabase_client()
    table = settings.SUPABASE_DOCUMENTS_TABLE

    try:
        response = (
            client.table(table)
            .select("*")
            .eq("id", document_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        return response.data
    except Exception:
        return None


def delete_document_record(user_id: str, document_id: str) -> bool:
    """Delete a document record. Returns True if deleted."""
    client = get_supabase_client()
    table = settings.SUPABASE_DOCUMENTS_TABLE

    try:
        response = (
            client.table(table)
            .delete()
            .eq("id", document_id)
            .eq("user_id", user_id)
            .execute()
        )
        return bool(response.data)
    except Exception as exc:
        raise DatabaseOperationError(
            f"Failed to delete document: {exc}"
        ) from exc


# ═══════════════════════════════════════════════════════════════════════════
# Analysis Results
# ═══════════════════════════════════════════════════════════════════════════

def insert_analysis_result(user_id: str, result: dict) -> dict:
    """Save an analysis result linked to a user (and optionally a document)."""
    client = get_supabase_client()

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
        response = client.table("analysis_results").insert(payload).execute()
        return response.data[0] if response.data else payload
    except Exception as exc:
        raise DatabaseOperationError(
            f"Failed to insert analysis: {exc}"
        ) from exc


def fetch_user_analyses(user_id: str, limit: int = 50) -> list[dict]:
    """Fetch analysis history for a user, newest first."""
    client = get_supabase_client()

    try:
        response = (
            client.table("analysis_results")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return response.data or []
    except Exception as exc:
        raise DatabaseOperationError(
            f"Failed to fetch analyses: {exc}"
        ) from exc


# ═══════════════════════════════════════════════════════════════════════════
# Chat Sessions & Messages
# ═══════════════════════════════════════════════════════════════════════════

def create_chat_session(user_id: str, title: str = "New Chat") -> dict:
    """Create a new chat session."""
    client = get_supabase_client()

    payload = {
        "user_id": user_id,
        "title": title,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        response = client.table("chat_sessions").insert(payload).execute()
        return response.data[0] if response.data else payload
    except Exception as exc:
        raise DatabaseOperationError(
            f"Failed to create chat session: {exc}"
        ) from exc


def fetch_user_chat_sessions(user_id: str, limit: int = 50) -> list[dict]:
    """Fetch all chat sessions for a user, most recent first."""
    client = get_supabase_client()

    try:
        response = (
            client.table("chat_sessions")
            .select("*")
            .eq("user_id", user_id)
            .order("updated_at", desc=True)
            .limit(limit)
            .execute()
        )
        return response.data or []
    except Exception as exc:
        raise DatabaseOperationError(
            f"Failed to fetch chat sessions: {exc}"
        ) from exc


def insert_chat_message(
    session_id: str,
    user_id: str,
    role: str,
    content: str,
    metadata: dict | None = None,
) -> dict:
    """Insert a chat message into a session."""
    client = get_supabase_client()

    payload = {
        "session_id": session_id,
        "user_id": user_id,
        "role": role,
        "content": content,
        "metadata": metadata or {},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        response = client.table("chat_messages").insert(payload).execute()
        return response.data[0] if response.data else payload
    except Exception as exc:
        raise DatabaseOperationError(
            f"Failed to insert chat message: {exc}"
        ) from exc


def fetch_session_messages(
    session_id: str, user_id: str, limit: int = 100
) -> list[dict]:
    """Fetch all messages in a chat session, in chronological order."""
    client = get_supabase_client()

    try:
        response = (
            client.table("chat_messages")
            .select("*")
            .eq("session_id", session_id)
            .eq("user_id", user_id)
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )
        return response.data or []
    except Exception as exc:
        raise DatabaseOperationError(
            f"Failed to fetch messages: {exc}"
        ) from exc


def update_chat_session_title(
    session_id: str, user_id: str, title: str
) -> dict | None:
    """Update the title of a chat session."""
    client = get_supabase_client()

    try:
        response = (
            client.table("chat_sessions")
            .update({"title": title, "updated_at": datetime.now(timezone.utc).isoformat()})
            .eq("id", session_id)
            .eq("user_id", user_id)
            .execute()
        )
        return response.data[0] if response.data else None
    except Exception as exc:
        raise DatabaseOperationError(
            f"Failed to update session title: {exc}"
        ) from exc


def delete_chat_session(session_id: str, user_id: str) -> bool:
    """Delete a chat session (cascade deletes messages)."""
    client = get_supabase_client()

    try:
        response = (
            client.table("chat_sessions")
            .delete()
            .eq("id", session_id)
            .eq("user_id", user_id)
            .execute()
        )
        return bool(response.data)
    except Exception as exc:
        raise DatabaseOperationError(
            f"Failed to delete chat session: {exc}"
        ) from exc


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
    client = get_supabase_client()
    storage_path = f"{user_id}/{filename}"

    try:
        client.storage.from_(STORAGE_BUCKET).upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": content_type},
        )
        return storage_path
    except Exception as exc:
        raise DatabaseOperationError(
            f"Failed to upload file: {exc}"
        ) from exc


def get_file_signed_url(file_path: str, expires_in: int = 3600) -> str:
    """Generate a signed URL for a private file (default 1 hour expiry)."""
    client = get_supabase_client()

    try:
        result = client.storage.from_(STORAGE_BUCKET).create_signed_url(
            path=file_path,
            expires_in=expires_in,
        )
        return result.get("signedURL", "")
    except Exception as exc:
        raise DatabaseOperationError(
            f"Failed to generate signed URL: {exc}"
        ) from exc


def delete_file_from_storage(file_path: str) -> bool:
    """Delete a file from Supabase Storage."""
    client = get_supabase_client()

    try:
        client.storage.from_(STORAGE_BUCKET).remove([file_path])
        return True
    except Exception as exc:
        raise DatabaseOperationError(
            f"Failed to delete file: {exc}"
        ) from exc
