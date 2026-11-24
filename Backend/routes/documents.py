"""
JusticeAI — /documents routes.
"""

from __future__ import annotations

import mimetypes
import os
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel

from config import settings
from database.local_store import fetch_user_documents as fetch_local_user_documents
from database.local_store import get_local_document_file_path
from database.supabase_client import get_supabase_client
from services.document_service import (
    DocumentStorageError,
    fetch_all_stored_documents,
    get_document_download_url,
    remove_user_document,
)

router = APIRouter()


class LegacyDocumentMigrationRequest(BaseModel):
    legacy_user_id: str


@router.post("/migrate-local")
def migrate_local_documents(
    body: LegacyDocumentMigrationRequest,
    authorization: Optional[str] = Header(None, alias="Authorization"),
):
    """Copy this local demo user's documents to their authenticated cloud account."""
    if not settings.ENABLE_LOCAL_DATA_MIGRATION:
        raise HTTPException(status_code=404, detail="Not found.")
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="A signed-in Supabase session is required.")

    token = authorization.split(" ", 1)[1].strip()
    try:
        client = get_supabase_client()
        auth_response = client.auth.get_user(token)
        auth_user = getattr(auth_response, "user", None)
        if not auth_user or not auth_user.id:
            raise ValueError("No authenticated user returned.")
    except Exception as exc:
        raise HTTPException(status_code=401, detail="The Supabase session is invalid or expired.") from exc

    legacy_documents = fetch_local_user_documents(body.legacy_user_id)
    migrated = 0
    already_present = 0
    failures = 0
    bucket = "legal-documents"
    table = settings.SUPABASE_DOCUMENTS_TABLE

    for document in legacy_documents:
        document_id = document.get("id")
        try:
            existing = (
                client.table(table)
                .select("id,user_id")
                .eq("id", document_id)
                .limit(1)
                .execute()
            ).data or []
            if existing:
                if existing[0].get("user_id") != auth_user.id:
                    raise ValueError("A document ID is already owned by another account.")
                already_present += 1
                continue

            local_file = get_local_document_file_path(body.legacy_user_id, document_id)
            if not local_file:
                raise FileNotFoundError("The local document file is missing.")

            filename = os.path.basename(document.get("filename") or local_file.name)
            file_path = f"{auth_user.id}/legacy-{document_id}-{filename}"
            content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
            client.storage.from_(bucket).upload(
                path=file_path,
                file=local_file.read_bytes(),
                file_options={"content-type": content_type, "upsert": "true"},
            )

            payload = {
                "id": document_id,
                "user_id": auth_user.id,
                "filename": filename,
                "file_path": file_path,
                "file_type": document.get("file_type", ""),
                "file_size_bytes": document.get("file_size_bytes", local_file.stat().st_size),
                "text": document.get("text", ""),
                "case_type": document.get("case_type", ""),
                "strength": document.get("strength", ""),
                "structured_data": document.get("structured_data") or {},
                "created_at": document.get("created_at"),
            }
            client.table(table).insert(payload).execute()
            migrated += 1
        except Exception as exc:
            failures += 1
            print(f"[documents/migrate-local] Could not migrate document {document_id}: {exc}")

    return {
        "migrated": migrated,
        "already_present": already_present,
        "failed": failures,
        "total": len(legacy_documents),
    }


@router.get("/")
async def list_documents(
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Retrieve all stored documents for a user."""
    if not x_user_id:
        raise HTTPException(
            status_code=401,
            detail="X-User-ID header is required.",
        )

    try:
        docs = await fetch_all_stored_documents(user_id=x_user_id)
        return {
            "documents": [d.model_dump() for d in docs],
            "count": len(docs),
        }
    except DocumentStorageError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{document_id}/download")
async def download_document(
    document_id: str,
    request: Request,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Get a signed download URL for a document's file."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header is required.")

    url = await get_document_download_url(x_user_id, document_id)
    if not url:
        raise HTTPException(status_code=404, detail="Document not found.")

    if url.startswith("local://"):
        url = str(
            request.url_for(
                "download_local_document_file",
                document_id=document_id,
            ).include_query_params(user_id=x_user_id)
        )

    return {"download_url": url}


@router.get("/{document_id}/preview")
async def preview_document(
    document_id: str,
    request: Request,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Get a preview URL for a document's file."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header is required.")

    url = await get_document_download_url(x_user_id, document_id)
    if not url:
        raise HTTPException(status_code=404, detail="Document not found.")

    if url.startswith("local://"):
        url = str(
            request.url_for(
                "preview_local_document_file",
                document_id=document_id,
            ).include_query_params(user_id=x_user_id)
        )

    return {"preview_url": url}


@router.get("/{document_id}/file", name="download_local_document_file")
async def download_local_document_file(
    document_id: str,
    user_id: Optional[str] = None,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Serve a locally stored fallback document file."""
    effective_user_id = x_user_id or user_id

    if not effective_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header is required.")

    file_path = get_local_document_file_path(effective_user_id, document_id)
    if not file_path:
        raise HTTPException(status_code=404, detail="Document not found.")

    return FileResponse(path=file_path, filename=file_path.name)


@router.get("/{document_id}/preview-file", name="preview_local_document_file")
async def preview_local_document_file(
    document_id: str,
    user_id: Optional[str] = None,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Serve a locally stored fallback document file for browser preview."""
    effective_user_id = x_user_id or user_id

    if not effective_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header is required.")

    file_path = get_local_document_file_path(effective_user_id, document_id)
    if not file_path:
        raise HTTPException(status_code=404, detail="Document not found.")

    media_type, _ = mimetypes.guess_type(str(file_path))
    response = FileResponse(
        path=file_path,
        media_type=media_type or "application/octet-stream",
    )
    response.headers["Content-Disposition"] = f'inline; filename="{file_path.name}"'
    return response


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Delete a document (file + DB record)."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header is required.")

    try:
        deleted = await remove_user_document(x_user_id, document_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Document not found.")
        return {"message": "Document deleted successfully."}
    except DocumentStorageError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
