"""
JusticeAI — SentenceTransformer ↔ LangChain Embeddings adapter.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Optional

from langchain.embeddings.base import Embeddings

from config import settings


@lru_cache(maxsize=4)
def _load_model(model_name: str):
    """Load and cache a SentenceTransformer model."""
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(model_name)


class SentenceTransformerEmbeddings(Embeddings):
    """LangChain-compatible wrapper around sentence-transformers."""

    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or settings.EMBEDDING_MODEL
        self._model = _load_model(self.model_name)

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        embeddings = self._model.encode(
            texts,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return embeddings.tolist()

    def embed_query(self, text: str) -> list[float]:
        embedding = self._model.encode(
            text,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return embedding.tolist()
