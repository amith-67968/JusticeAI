"""
JusticeAI — /chat routes.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Header, HTTPException

from database.queries import (
    DatabaseOperationError,
    create_chat_session,
    delete_chat_session,
    fetch_session_messages,
    fetch_user_chat_sessions,
    insert_chat_message,
    update_chat_session_title,
)
from models.schemas import ChatRequest, ChatResponse
from services.rag_service import rag

router = APIRouter()


# ── Main chat endpoint ──────────────────────────────────────────────────

@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """RAG-powered legal chat endpoint. Persists messages if user + session provided."""
    try:
        user_id = request.user_id or x_user_id
        session_id = request.session_id

        # Auto-create session if user is authenticated but no session
        if user_id and not session_id:
            try:
                session = create_chat_session(user_id)
                session_id = session.get("id")
            except DatabaseOperationError:
                pass

        # Save user message
        if user_id and session_id:
            try:
                insert_chat_message(
                    session_id=session_id,
                    user_id=user_id,
                    role="user",
                    content=request.user_query,
                )
            except DatabaseOperationError:
                pass

        # Get RAG response
        result = await rag.chat(request.user_query)

        # Save assistant response
        if user_id and session_id:
            try:
                insert_chat_message(
                    session_id=session_id,
                    user_id=user_id,
                    role="assistant",
                    content=result.get("answer", ""),
                    metadata={
                        "relevant_laws": result.get("relevant_laws", []),
                        "sources": result.get("sources", []),
                    },
                )

                # Auto-title session from first query
                if not request.session_id:
                    title = request.user_query[:80]
                    try:
                        update_chat_session_title(session_id, user_id, title)
                    except DatabaseOperationError:
                        pass
            except DatabaseOperationError:
                pass

        return ChatResponse(**result, session_id=session_id)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Chat failed: {exc}",
        )


# ── Chat sessions CRUD ──────────────────────────────────────────────────

@router.get("/sessions")
async def list_sessions(
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """List all chat sessions for a user."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header is required.")

    try:
        sessions = fetch_user_chat_sessions(x_user_id)
        return {"sessions": sessions, "count": len(sessions)}
    except DatabaseOperationError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/sessions/{session_id}/messages")
async def get_messages(
    session_id: str,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Get all messages in a chat session."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header is required.")

    try:
        messages = fetch_session_messages(session_id, x_user_id)
        return {"messages": messages, "count": len(messages)}
    except DatabaseOperationError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/sessions/{session_id}")
async def remove_session(
    session_id: str,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Delete a chat session and all its messages."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header is required.")

    try:
        deleted = delete_chat_session(session_id, x_user_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Session not found.")
        return {"message": "Session deleted successfully."}
    except DatabaseOperationError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
