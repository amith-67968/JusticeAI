"""
JusticeAI — Centralized configuration loaded from .env
"""

import os
from dotenv import load_dotenv

_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(_BASE_DIR, ".env"))


class Settings:
    """Single source of truth for every configurable value."""

    # ── LLM ──────────────────────────────────────────────────────────────
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    # ── Google Places (Lawyer Recommendations) ───────────────────────────
    GOOGLE_PLACES_API_KEY: str = os.getenv("GOOGLE_PLACES_API_KEY", "")

    # ── Embeddings ───────────────────────────────────────────────────────
    EMBEDDING_MODEL: str = os.getenv(
        "EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
    )

    # ── InLegalBERT ──────────────────────────────────────────────────────
    INLEGALBERT_MODEL: str = os.getenv("INLEGALBERT_MODEL", "law-ai/InLegalBERT")
    CLASSIFICATION_MAX_CHARS: int = int(
        os.getenv("CLASSIFICATION_MAX_CHARS", "2000")
    )

    # ── RAG ──────────────────────────────────────────────────────────────
    RAG_CHUNK_SIZE: int = int(os.getenv("RAG_CHUNK_SIZE", "1000"))
    RAG_CHUNK_OVERLAP: int = int(os.getenv("RAG_CHUNK_OVERLAP", "200"))
    RAG_TOP_K: int = int(os.getenv("RAG_TOP_K", "4"))

    # ── Document Processing ──────────────────────────────────────────────
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "20"))
    MAX_EXTRACTION_CHARS: int = int(os.getenv("MAX_EXTRACTION_CHARS", "12000"))

    @property
    def MAX_FILE_SIZE_BYTES(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    # ── Server ───────────────────────────────────────────────────────────
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "true").lower() in ("true", "1", "yes")

    # ── Supabase ─────────────────────────────────────────────────────────
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_DOCUMENTS_TABLE: str = os.getenv("SUPABASE_DOCUMENTS_TABLE", "documents")

    # ── Tesseract ────────────────────────────────────────────────────────
    TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", "")

    # ── Paths ────────────────────────────────────────────────────────────
    UPLOAD_DIR: str = os.getenv(
        "UPLOAD_DIR", os.path.join(_BASE_DIR, "uploads")
    )
    DATA_DIR: str = os.getenv(
        "DATA_DIR", os.path.join(_BASE_DIR, "data")
    )
    VECTOR_STORE_DIR: str = os.getenv(
        "VECTOR_STORE_DIR", os.path.join(_BASE_DIR, "vector_store")
    )


# ── Singleton ────────────────────────────────────────────────────────────
settings = Settings()

# ── Auto-create directories ─────────────────────────────────────────────
for _d in (settings.UPLOAD_DIR, settings.DATA_DIR, settings.VECTOR_STORE_DIR):
    os.makedirs(_d, exist_ok=True)
