"""
JusticeAI — POST /analyze route.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from database.queries import DatabaseOperationError, insert_analysis_result
from models.schemas import AnalysisResponse
from services.analysis_service import analyze_case

router = APIRouter()


class AnalyzeRequest(BaseModel):
    """Route-level request model (accepts raw dicts from the frontend)."""
    structured_data: dict
    documents: Optional[list[dict]] = None
    raw_text: Optional[str] = None
    document_id: Optional[str] = None  # Link analysis to a specific document


@router.post("/", response_model=AnalysisResponse)
async def analyze(
    request: AnalyzeRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """Analyse case materials (rule engine + LLM). Saves result if user is provided."""
    try:
        result = await analyze_case(
            structured_data=request.structured_data,
            documents=request.documents,
            raw_text=request.raw_text,
        )

        # Save analysis to DB if user is authenticated
        if x_user_id:
            try:
                result["document_id"] = request.document_id
                saved = insert_analysis_result(x_user_id, result)
                result["id"] = saved.get("id")
            except DatabaseOperationError as exc:
                print(f"[analyze] Failed to save analysis: {exc}")

        return AnalysisResponse(**result)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {exc}",
        )
