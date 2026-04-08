"""
JusticeAI — /documents routes.
"""

from __future__ import annotations

import mimetypes
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Request
from fastapi.responses import FileResponse

from database.local_store import get_local_document_file_path
from services.document_service import (
    DocumentStorageError,
    fetch_all_stored_documents,
    get_document_download_url,
    remove_user_document,
)

router = APIRouter()


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
