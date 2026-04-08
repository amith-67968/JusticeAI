"""
Local JSON-backed fallback store for development and demo flows.

This lets the frontend work end-to-end even when Supabase auth/storage
is not configured or the provided user IDs do not exist in auth.users.
"""

from __future__ import annotations

import json
import re
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from threading import RLock
from typing import Optional
from uuid import uuid4

from config import settings

_LOCK = RLock()
_LOCAL_UPLOAD_ROOT = Path(settings.UPLOAD_DIR) / "local"
_STORE_PATH = Path(settings.UPLOAD_DIR) / "local_store.json"

_EMPTY_STATE = {
    "profiles": [],
    "documents": [],
    "analyses": [],
    "chat_sessions": [],
    "chat_messages": [],
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _safe_filename(filename: str) -> str:
    safe = re.sub(r"[^A-Za-z0-9._ -]", "_", Path(filename).name).strip()
    return safe or f"file-{uuid4().hex}"


def _ensure_store_exists() -> None:
    _LOCAL_UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
    _STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not _STORE_PATH.exists():
        _STORE_PATH.write_text(
            json.dumps(_EMPTY_STATE, indent=2),
            encoding="utf-8",
        )


def _load_state() -> dict:
    with _LOCK:
        _ensure_store_exists()
        try:
            data = json.loads(_STORE_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            data = deepcopy(_EMPTY_STATE)

        state = deepcopy(_EMPTY_STATE)
        for key, default_value in _EMPTY_STATE.items():
            state[key] = data.get(key, deepcopy(default_value))
        return state


def _save_state(state: dict) -> None:
    with _LOCK:
        _ensure_store_exists()
        temp_path = _STORE_PATH.with_suffix(".tmp")
        temp_path.write_text(
            json.dumps(state, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        temp_path.replace(_STORE_PATH)


def _merge_row(defaults: dict, payload: dict) -> dict:
    row = deepcopy(defaults)
    row.update(payload)
    return row


def get_profile(user_id: str) -> dict | None:
    state = _load_state()
    for profile in state["profiles"]:
        if profile.get("id") == user_id:
            return deepcopy(profile)
    return None


def update_profile(user_id: str, updates: dict) -> dict | None:
    state = _load_state()
    now = _now_iso()

    for index, profile in enumerate(state["profiles"]):
        if profile.get("id") == user_id:
            profile.update(updates)
            profile["updated_at"] = now
            state["profiles"][index] = profile
            _save_state(state)
            return deepcopy(profile)

    created = {
        "id": user_id,
        "full_name": updates.get("full_name", ""),
        "email": updates.get("email", ""),
        "avatar_url": updates.get("avatar_url", ""),
        "created_at": now,
        "updated_at": now,
    }
    state["profiles"].append(created)
    _save_state(state)
    return deepcopy(created)


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
    state = _load_state()
    row = {
        "id": str(uuid4()),
        "user_id": user_id,
        "filename": filename,
        "file_path": file_path,
        "file_type": file_type,
        "file_size_bytes": file_size_bytes,
        "text": text,
        "case_type": case_type,
        "strength": strength.lower(),
        "structured_data": structured_data or {},
        "created_at": _now_iso(),
    }
    state["documents"].append(row)
    _save_state(state)
    return deepcopy(row)


def fetch_user_documents(user_id: str) -> list[dict]:
    state = _load_state()
    rows = [
        deepcopy(row)
        for row in state["documents"]
        if row.get("user_id") == user_id
    ]
    rows.sort(key=lambda row: row.get("created_at", ""), reverse=True)
    return rows


def fetch_document_by_id(user_id: str, document_id: str) -> dict | None:
    state = _load_state()
    for row in state["documents"]:
        if row.get("id") == document_id and row.get("user_id") == user_id:
            return deepcopy(row)
    return None


def delete_document_record(user_id: str, document_id: str) -> bool:
    state = _load_state()
    original_count = len(state["documents"])
    state["documents"] = [
        row
        for row in state["documents"]
        if not (
            row.get("id") == document_id
            and row.get("user_id") == user_id
        )
    ]
    changed = len(state["documents"]) != original_count
    if changed:
        _save_state(state)
    return changed


def insert_analysis_result(user_id: str, result: dict) -> dict:
    state = _load_state()
    row = {
        "id": str(uuid4()),
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
        "created_at": _now_iso(),
    }
    state["analyses"].append(row)
    _save_state(state)
    return deepcopy(row)


def fetch_user_analyses(user_id: str, limit: int = 50) -> list[dict]:
    state = _load_state()
    rows = [
        deepcopy(row)
        for row in state["analyses"]
        if row.get("user_id") == user_id
    ]
    rows.sort(key=lambda row: row.get("created_at", ""), reverse=True)
    return rows[:limit]


def create_chat_session(user_id: str, title: str = "New Chat") -> dict:
    state = _load_state()
    now = _now_iso()
    row = {
        "id": str(uuid4()),
        "user_id": user_id,
        "title": title,
        "created_at": now,
        "updated_at": now,
    }
    state["chat_sessions"].append(row)
    _save_state(state)
    return deepcopy(row)


def fetch_user_chat_sessions(user_id: str, limit: int = 50) -> list[dict]:
    state = _load_state()
    rows = [
        deepcopy(row)
        for row in state["chat_sessions"]
        if row.get("user_id") == user_id
    ]
    rows.sort(key=lambda row: row.get("updated_at", ""), reverse=True)
    return rows[:limit]


def insert_chat_message(
    session_id: str,
    user_id: str,
    role: str,
    content: str,
    metadata: dict | None = None,
) -> dict:
    state = _load_state()
    now = _now_iso()
    row = {
        "id": str(uuid4()),
        "session_id": session_id,
        "user_id": user_id,
        "role": role,
        "content": content,
        "metadata": metadata or {},
        "created_at": now,
    }
    state["chat_messages"].append(row)

    for session in state["chat_sessions"]:
        if session.get("id") == session_id and session.get("user_id") == user_id:
            session["updated_at"] = now
            break

    _save_state(state)
    return deepcopy(row)


def fetch_session_messages(
    session_id: str,
    user_id: str,
    limit: int = 100,
) -> list[dict]:
    state = _load_state()
    rows = [
        deepcopy(row)
        for row in state["chat_messages"]
        if row.get("session_id") == session_id and row.get("user_id") == user_id
    ]
    rows.sort(key=lambda row: row.get("created_at", ""))
    return rows[:limit]


def update_chat_session_title(
    session_id: str,
    user_id: str,
    title: str,
) -> dict | None:
    state = _load_state()
    for index, session in enumerate(state["chat_sessions"]):
        if session.get("id") == session_id and session.get("user_id") == user_id:
            session["title"] = title
            session["updated_at"] = _now_iso()
            state["chat_sessions"][index] = session
            _save_state(state)
            return deepcopy(session)
    return None


def delete_chat_session(session_id: str, user_id: str) -> bool:
    state = _load_state()
    original_session_count = len(state["chat_sessions"])
    state["chat_sessions"] = [
        row
        for row in state["chat_sessions"]
        if not (
            row.get("id") == session_id
            and row.get("user_id") == user_id
        )
    ]
    session_deleted = len(state["chat_sessions"]) != original_session_count
    if not session_deleted:
        return False

    state["chat_messages"] = [
        row
        for row in state["chat_messages"]
        if not (
            row.get("session_id") == session_id
            and row.get("user_id") == user_id
        )
    ]
    _save_state(state)
    return True


def upload_file_to_storage(
    user_id: str,
    filename: str,
    file_bytes: bytes,
    content_type: str = "application/octet-stream",
) -> str:
    del content_type

    safe_name = _safe_filename(filename)
    stored_name = f"{uuid4().hex}-{safe_name}"
    relative_path = Path("local") / user_id / stored_name
    absolute_path = Path(settings.UPLOAD_DIR) / relative_path
    absolute_path.parent.mkdir(parents=True, exist_ok=True)
    absolute_path.write_bytes(file_bytes)
    return relative_path.as_posix()


def resolve_file_path(file_path: str) -> Optional[Path]:
    if not file_path.startswith("local/"):
        return None

    absolute_path = Path(settings.UPLOAD_DIR) / Path(file_path)
    if absolute_path.exists():
        return absolute_path
    return None


def get_file_signed_url(file_path: str, expires_in: int = 3600) -> str:
    del expires_in
    if file_path.startswith("local/"):
        return f"local://{file_path}"
    return ""


def delete_file_from_storage(file_path: str) -> bool:
    absolute_path = resolve_file_path(file_path)
    if not absolute_path:
        return False

    if absolute_path.exists():
        absolute_path.unlink()
    return True


def get_local_document_file_path(
    user_id: str,
    document_id: str,
) -> Optional[Path]:
    document = fetch_document_by_id(user_id, document_id)
    if not document:
        return None
    return resolve_file_path(document.get("file_path", ""))
