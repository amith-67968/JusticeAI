"""
JusticeAI — Runtime-safe fallback classifier.

Provides the same interface as classification_service.py but is safe to import
even when InLegalBERT cannot be downloaded (e.g. air-gapped environments).

At the bottom, it re-exports from the canonical module so callers can import
from either file and get the same objects.
"""

from services.classification_service import CASE_LABELS, CaseClassifier, classifier

__all__ = ["CASE_LABELS", "CaseClassifier", "classifier"]
