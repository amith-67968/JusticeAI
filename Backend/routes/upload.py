"""
JusticeAI — POST /upload route.
"""

from __future__ import annotations

import os
from typing import Optional

from fastapi import APIRouter, File, Header, HTTPException, UploadFile

from config import settings
from services.document_service import process_document

router = APIRouter()

_ALLOWED_EXTENSIONS = {
    ".pdf", ".png", ".jpg", ".jpeg", ".bmp",
    ".tiff", ".tif", ".webp", ".txt",
}


@router.post("/")
async def upload_document(
    file: UploadFile = File(...),
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """
    Upload a legal document for extraction + classification.
    Pass X-User-ID header to link the document to a user and store in Supabase.
    """

    # ── Validate filename ────────────────────────────────────────────────
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in _ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"File type '{ext}' is not supported. "
                f"Allowed: {', '.join(sorted(_ALLOWED_EXTENSIONS))}"
            ),
        )

    # ── Read bytes ───────────────────────────────────────────────────────
    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if len(file_bytes) > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"File exceeds the {settings.MAX_FILE_SIZE_MB} MB limit "
                f"({len(file_bytes) / (1024 * 1024):.1f} MB)."
            ),
        )

    # ── Process ──────────────────────────────────────────────────────────
    try:
        result = await process_document(
            file.filename,
            file_bytes,
            user_id=x_user_id,
        )
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Document processing failed: {exc}",
        )
