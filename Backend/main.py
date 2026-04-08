"""
JusticeAI — FastAPI application entry point.
"""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from models.schemas import HealthResponse


# ═══════════════════════════════════════════════════════════════════════════
# Lifespan — pre-warm models at startup
# ═══════════════════════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Pre-warm heavy models in background threads so the first request is fast."""
    loop = asyncio.get_running_loop()

    # 1. Supabase client
    try:
        from database.supabase_client import get_supabase_client

        await loop.run_in_executor(None, get_supabase_client)
        print("[startup] Supabase client initialised")
    except Exception as exc:
        print(f"[startup] Supabase init skipped: {exc}")

    # 2. InLegalBERT classifier
    try:
        from services.classification_service import classifier

        await loop.run_in_executor(None, classifier.load_model)
        print("[startup] InLegalBERT classifier loaded")
    except Exception as exc:
        print(f"[startup] Classifier init skipped: {exc}")

    # 3. RAG vector store
    try:
        from services.rag_service import rag

        await loop.run_in_executor(None, rag.initialize)
        print("[startup] RAG vector store initialised")
    except Exception as exc:
        print(f"[startup] RAG init skipped: {exc}")

    print("[startup] JusticeAI backend ready")
    yield
    print("[shutdown] JusticeAI backend shutting down")


# ═══════════════════════════════════════════════════════════════════════════
# FastAPI app
# ═══════════════════════════════════════════════════════════════════════════

app = FastAPI(
    title="JusticeAI",
    description="AI-Powered Legal Assistance Platform (India-focused)",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────
from routes.chat import router as chat_router
from routes.upload import router as upload_router
from routes.analyze import router as analyze_router
from routes.documents import router as documents_router
from routes.events import router as events_router

app.include_router(chat_router, prefix="/chat", tags=["Chat"])
app.include_router(upload_router, prefix="/upload", tags=["Upload"])
app.include_router(analyze_router, prefix="/analyze", tags=["Analysis"])
app.include_router(documents_router, prefix="/documents", tags=["Documents"])
app.include_router(events_router, prefix="/extract-events", tags=["Events"])


# ── Health ───────────────────────────────────────────────────────────────
@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health():
    return HealthResponse(status="ok", version="1.0.0")


# ═══════════════════════════════════════════════════════════════════════════
# Dev entry point
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
