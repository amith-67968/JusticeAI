"""
JusticeAI — All Pydantic request / response schemas.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ═══════════════════════════════════════════════════════════════════════════
# Chat
# ═══════════════════════════════════════════════════════════════════════════

class ChatRequest(BaseModel):
    user_query: str = Field(..., min_length=1)
    session_id: Optional[str] = None
    user_id: Optional[str] = None  # Links chat to a user


class ChatResponse(BaseModel):
    answer: str
    relevant_laws: list[str] = []
    explanation: str = ""
    why_applicable: str = ""
    next_steps: list[str] = []
    sources: list[str] = []
    session_id: Optional[str] = None


class ChatSession(BaseModel):
    id: str
    user_id: str
    title: str = "New Chat"
    created_at: datetime
    updated_at: datetime


class ChatMessage(BaseModel):
    id: Optional[str] = None
    session_id: str
    user_id: str
    role: str  # "user" or "assistant"
    content: str
    metadata: dict = {}
    created_at: Optional[datetime] = None


# ═══════════════════════════════════════════════════════════════════════════
# User Profile
# ═══════════════════════════════════════════════════════════════════════════

class UserProfile(BaseModel):
    id: str
    full_name: str = ""
    email: str = ""
    avatar_url: str = ""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════
# Document Upload
# ═══════════════════════════════════════════════════════════════════════════

class ExtractedParty(BaseModel):
    name: str
    role: str  # complainant, respondent, witness, etc.


class StructuredExtraction(BaseModel):
    document_type: str = ""
    parties: list[ExtractedParty] = []
    dates: list[str] = []
    monetary_values: list[str] = []
    key_clauses: list[str] = []
    missing_elements: list[str] = []
    evidence_strength: str = ""  # Weak / Moderate / Strong
    reason: str = ""
    case_type: str = ""  # Filled by InLegalBERT


class StoredDocument(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    filename: str = ""
    file_path: str = ""
    file_type: str = ""
    file_size_bytes: int = 0
    text: str = ""
    case_type: str = ""
    strength: str = ""
    structured_data: dict = {}
    created_at: Optional[datetime] = None


class UploadResponse(BaseModel):
    filename: str
    extracted_text: str
    structured_data: StructuredExtraction
    documents: list[dict] = []
    is_legal_document: bool = True
    stored_document: Optional[StoredDocument] = None
    message: str = ""


class StoredDocumentsResponse(BaseModel):
    documents: list[StoredDocument]
    count: int


# ═══════════════════════════════════════════════════════════════════════════
# Case Analysis
# ═══════════════════════════════════════════════════════════════════════════

class DocumentEvidence(BaseModel):
    document_type: str
    evidence_strength: str
    reason: str


class AnalysisRequest(BaseModel):
    structured_data: StructuredExtraction
    raw_text: Optional[str] = None
    documents: Optional[list[StructuredExtraction]] = None
    user_id: Optional[str] = None
    document_id: Optional[str] = None  # Link analysis to a document


class AnalysisResponse(BaseModel):
    id: Optional[str] = None
    case_strength: str  # Weak / Moderate / Strong
    case_difficulty: str  # Easy / Moderate / Hard
    confidence_score: int = Field(ge=0, le=100)
    summary: str
    strong_points: list[str] = []
    weak_points: list[str] = []
    next_steps: list[str] = []
    document_analysis: list[DocumentEvidence] = []
    rule_flags: list[str] = []


# ═══════════════════════════════════════════════════════════════════════════
# Events
# ═══════════════════════════════════════════════════════════════════════════

class EventItem(BaseModel):
    date: str
    description: str


class EventExtractionRequest(BaseModel):
    text: str = Field(..., min_length=1)


class EventExtractionResponse(BaseModel):
    events: list[EventItem] = []


# ═══════════════════════════════════════════════════════════════════════════
# Health
# ═══════════════════════════════════════════════════════════════════════════

class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"
