"""
JusticeAI — RAG-based legal chat service.

Uses FAISS + SentenceTransformers for retrieval and Groq LLM for generation.
"""

from __future__ import annotations

import json
import os
import re
import threading
from typing import Optional

from config import settings
from utils.embeddings import SentenceTransformerEmbeddings
from utils.llm import (
    JSON_OBJECT_RESPONSE_FORMAT,
    extract_response_content,
    get_groq_client,
)
from utils.prompts import CHAT_SYSTEM, CHAT_USER


# ═══════════════════════════════════════════════════════════════════════════
# Greeting / low-context guardrail
# ═══════════════════════════════════════════════════════════════════════════

_GREETING_TOKENS = frozenset({
    "afternoon", "evening", "good", "hello", "help", "hey",
    "hi", "hii", "hiii", "morning", "namaste", "there", "yo",
})

_LOW_CONTEXT_PROMPTS = frozenset({
    "can you help", "help", "help me", "i need help",
    "legal help", "need help", "need legal help",
})

_GREETING_RESPONSE = {
    "answer": (
        "Hello. Tell me your legal issue in 1 or 2 sentences and I will "
        "help you with the relevant laws, explanation, and next steps."
    ),
    "relevant_laws": [],
    "explanation": "",
    "why_applicable": "",
    "next_steps": [
        "Describe the problem, the people involved, and what happened.",
        "Include important dates, money amounts, notices, or documents if you have them.",
    ],
    "sources": [],
}


def _normalise_query(query: str) -> str:
    """Lowercase, strip non-alphanumeric except spaces."""
    return re.sub(r"[^a-z0-9 ]", "", query.lower()).strip()


def _should_skip_rag(query: str) -> bool:
    normalised = _normalise_query(query)
    if normalised in _LOW_CONTEXT_PROMPTS:
        return True
    tokens = normalised.split()
    if all(t in _GREETING_TOKENS for t in tokens) and len(tokens) <= 4:
        return True
    return False


# ═══════════════════════════════════════════════════════════════════════════
# RAG Service
# ═══════════════════════════════════════════════════════════════════════════

class RAGService:
    """Singleton RAG pipeline: vector search → LLM chat."""

    def __init__(self):
        self._vectorstore = None
        self._lock = threading.Lock()
        self._initialized = False

    # ── Initialisation ───────────────────────────────────────────────────

    def initialize(self):
        if self._initialized:
            return
        with self._lock:
            if self._initialized:
                return
            self._build_vectorstore()
            self._initialized = True

    def _build_vectorstore(self):
        from langchain_community.vectorstores import FAISS

        embeddings = SentenceTransformerEmbeddings()
        index_path = os.path.join(settings.VECTOR_STORE_DIR, "index.faiss")
        meta_path = os.path.join(settings.VECTOR_STORE_DIR, "embedding_metadata.json")

        expected_meta = {
            "provider": "sentence-transformers",
            "model": embeddings.model_name,
        }

        # ── Try loading existing index ───────────────────────────────────
        if os.path.exists(index_path):
            meta_ok = False
            if os.path.exists(meta_path):
                try:
                    with open(meta_path, "r") as f:
                        saved_meta = json.load(f)
                    meta_ok = (saved_meta == expected_meta)
                    if not meta_ok:
                        print(
                            f"[rag] Embedding model changed: "
                            f"{saved_meta.get('model')} → {embeddings.model_name}. "
                            f"Rebuilding vector store."
                        )
                except Exception:
                    pass

            if meta_ok:
                try:
                    self._vectorstore = FAISS.load_local(
                        settings.VECTOR_STORE_DIR,
                        embeddings,
                        allow_dangerous_deserialization=True,
                    )
                    print(f"[rag] Loaded FAISS index from disk")
                    return
                except Exception as exc:
                    print(f"[rag] Failed to load index: {exc}. Rebuilding.")

        # ── Build from documents ─────────────────────────────────────────
        self._rebuild_index(embeddings, expected_meta, meta_path)

    def _rebuild_index(self, embeddings, expected_meta: dict, meta_path: str):
        from langchain_core.documents import Document
        from langchain_community.vectorstores import FAISS
        from langchain_text_splitters import RecursiveCharacterTextSplitter

        # Load text files
        docs: list[Document] = []
        data_dir = settings.DATA_DIR

        if os.path.isdir(data_dir):
            for fname in os.listdir(data_dir):
                if fname.endswith((".txt", ".md")):
                    fpath = os.path.join(data_dir, fname)
                    try:
                        with open(fpath, "r", encoding="utf-8") as f:
                            content = f.read().strip()
                        if content:
                            docs.append(
                                Document(
                                    page_content=content,
                                    metadata={"source": fname},
                                )
                            )
                    except Exception as exc:
                        print(f"[rag] Error reading {fname}: {exc}")

        if not docs:
            print("[rag] No data files found – writing sample legal data")
            docs = self._create_sample_data()

        # Split
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.RAG_CHUNK_SIZE,
            chunk_overlap=settings.RAG_CHUNK_OVERLAP,
            separators=["\n\n", "\n", ". ", " "],
        )
        chunks = splitter.split_documents(docs)
        print(f"[rag] Created {len(chunks)} chunks from {len(docs)} documents")

        # Build FAISS
        self._vectorstore = FAISS.from_documents(chunks, embeddings)
        self._vectorstore.save_local(settings.VECTOR_STORE_DIR)

        with open(meta_path, "w") as f:
            json.dump(expected_meta, f)

        print(f"[rag] FAISS index built and saved")

    @staticmethod
    def _create_sample_data():
        """Write sample legal reference files and return Document objects."""
        from langchain_core.documents import Document

        # (The real data files are created separately — this is a last resort)
        sample = {
            "sample_legal_reference.txt": (
                "Consumer Protection Act, 2019\n\n"
                "Section 2(7) defines 'consumer' as any person who buys goods "
                "or hires services for consideration.\n\n"
                "Section 35 provides that the District Commission shall have "
                "jurisdiction to entertain complaints where the value of goods "
                "or services does not exceed one crore rupees.\n\n"
                "A complaint must be filed within 2 years from the date on "
                "which the cause of action arises."
            ),
        }

        docs = []
        for fname, content in sample.items():
            fpath = os.path.join(settings.DATA_DIR, fname)
            try:
                with open(fpath, "w", encoding="utf-8") as f:
                    f.write(content)
            except Exception:
                pass
            docs.append(
                Document(page_content=content, metadata={"source": fname})
            )
        return docs

    # ── Chat ─────────────────────────────────────────────────────────────

    async def chat(self, query: str) -> dict:
        """RAG chat: greeting guard → vector search → LLM."""

        if _should_skip_rag(query):
            return dict(_GREETING_RESPONSE)

        if not self._initialized:
            self.initialize()

        # Vector search
        try:
            results = self._vectorstore.similarity_search_with_score(
                query, k=settings.RAG_TOP_K
            )
        except Exception as exc:
            print(f"[rag] Vector search error: {exc}")
            results = []

        # Build context
        context_parts = []
        sources = []
        for doc, score in results:
            src = doc.metadata.get("source", "unknown")
            context_parts.append(f"[Source: {src}]\n{doc.page_content}")
            if src not in sources:
                sources.append(src)

        context = "\n\n---\n\n".join(context_parts) if context_parts else "No relevant context found."

        # LLM call
        try:
            client = get_groq_client()
            prompt = CHAT_USER.format(query=query, context=context)

            response = await client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": CHAT_SYSTEM},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                max_completion_tokens=2000,
                response_format=JSON_OBJECT_RESPONSE_FORMAT,
            )

            raw = extract_response_content(response)
            raw = raw.strip()
            if raw.startswith("```json"):
                raw = raw[7:]
            elif raw.startswith("```"):
                raw = raw[3:]
            if raw.endswith("```"):
                raw = raw[:-3]

            result = json.loads(raw.strip())

            # Back-fill sources if LLM didn't include them
            if not result.get("sources"):
                result["sources"] = sources

            return result

        except Exception as exc:
            print(f"[rag] LLM error: {exc}")
            return {
                "answer": (
                    "I encountered an error processing your question. "
                    "Please try again or rephrase your query."
                ),
                "relevant_laws": [],
                "explanation": "",
                "why_applicable": "",
                "next_steps": [
                    "Try rephrasing your question with more details.",
                    "Consult a qualified advocate for urgent matters.",
                ],
                "sources": sources,
            }

    # ── Search (raw) ─────────────────────────────────────────────────────

    def search(self, query: str, k: Optional[int] = None) -> list[dict]:
        """Pure vector search — no LLM. Returns list of dicts."""
        if not self._initialized:
            self.initialize()

        k = k or settings.RAG_TOP_K

        try:
            results = self._vectorstore.similarity_search_with_score(query, k=k)
            return [
                {
                    "content": doc.page_content,
                    "source": doc.metadata.get("source", "unknown"),
                    "score": float(score),
                }
                for doc, score in results
            ]
        except Exception as exc:
            print(f"[rag] Search error: {exc}")
            return []


# ── Module-level singleton ───────────────────────────────────────────────
rag = RAGService()
