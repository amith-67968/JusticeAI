"""
JusticeAI — /documents routes.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Header, HTTPException

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
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Get a signed download URL for a document's file."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header is required.")

    url = await get_document_download_url(x_user_id, document_id)
    if not url:
        raise HTTPException(status_code=404, detail="Document not found.")

    return {"download_url": url}


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
