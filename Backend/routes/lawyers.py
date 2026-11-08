"""
JusticeAI — /lawyers routes (Smart Lawyer Recommendations).
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from models.schemas import LawyerRecommendRequest, LawyerRecommendResponse
from services.lawyer_service import get_lawyer_recommendations

router = APIRouter()


@router.post("/recommend", response_model=LawyerRecommendResponse)
async def recommend_lawyers(request: LawyerRecommendRequest):
    """Find nearby lawyers based on the AI response's detected case types."""
    try:
        result = await get_lawyer_recommendations(
            ai_response=request.ai_response,
            city=request.city,
            lat=request.lat,
            lng=request.lng,
        )
        return LawyerRecommendResponse(**result)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Lawyer recommendation failed: {exc}",
        )
