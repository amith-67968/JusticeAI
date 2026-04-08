"""
JusticeAI RAG-based legal chat service.

Uses FAISS + sentence-transformers for retrieval when available, and falls
back to keyword search over the bundled legal reference files when the local
embedding model cannot be loaded.
"""

from __future__ import annotations

import json
import os
import re
import threading
from collections import Counter
from typing import Optional

from langchain_core.documents import Document

from config import settings
from utils.embeddings import SentenceTransformerEmbeddings
from utils.llm import (
    JSON_OBJECT_RESPONSE_FORMAT,
    extract_response_content,
    get_groq_client,
)
from utils.prompts import CHAT_SYSTEM, CHAT_USER


_GREETING_TOKENS = frozenset(
    {
        "afternoon",
        "evening",
        "good",
        "hello",
        "help",
        "hey",
        "hi",
        "hii",
        "hiii",
        "morning",
        "namaste",
        "there",
        "yo",
    }
)

_LOW_CONTEXT_PROMPTS = frozenset(
    {
        "can you help",
        "help",
        "help me",
        "i need help",
        "legal help",
        "need help",
        "need legal help",
    }
)

_STOPWORDS = frozenset(
    {
        "a",
        "about",
        "after",
        "all",
        "also",
        "an",
        "and",
        "are",
        "been",
        "before",
        "but",
        "for",
        "from",
        "had",
        "has",
        "have",
        "her",
        "herself",
        "him",
        "himself",
        "his",
        "into",
        "its",
        "just",
        "more",
        "our",
        "out",
        "she",
        "that",
        "the",
        "their",
        "them",
        "then",
        "there",
        "they",
        "this",
        "was",
        "were",
        "what",
        "when",
        "which",
        "who",
        "will",
        "with",
        "would",
        "you",
        "your",
    }
)

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
    """Lowercase and strip non-alphanumeric characters except spaces."""
    return re.sub(r"[^a-z0-9 ]", "", query.lower()).strip()


def _tokenize_text(text: str) -> list[str]:
    """Tokenize text for lightweight keyword matching."""
    return [
        token
        for token in _normalise_query(text).split()
        if len(token) >= 3 and token not in _STOPWORDS
    ]


def _should_skip_rag(query: str) -> bool:
    normalised = _normalise_query(query)
    if normalised in _LOW_CONTEXT_PROMPTS:
        return True

    tokens = normalised.split()
    return bool(tokens) and all(token in _GREETING_TOKENS for token in tokens) and len(tokens) <= 4


class RAGService:
    """Singleton RAG pipeline with a keyword-search fallback."""

    def __init__(self):
        self._vectorstore = None
        self._lock = threading.Lock()
        self._initialized = False
        self._fallback_chunks: list[Document] = []
        self._init_mode = "uninitialized"
        self._init_error: str | None = None

    def initialize(self):
        if self._initialized:
            return

        with self._lock:
            if self._initialized:
                return

            try:
                self._build_vectorstore()
                self._init_mode = "vector"
                self._init_error = None
                print("[rag] Vector retrieval ready")
            except Exception as exc:
                self._vectorstore = None
                self._init_mode = "keyword"
                self._init_error = f"{type(exc).__name__}: {exc}"
                print(f"[rag] Vector init failed, falling back to keyword search: {self._init_error}")

                try:
                    self._build_keyword_fallback()
                except Exception as fallback_exc:
                    self._fallback_chunks = []
                    self._init_mode = "empty"
                    self._init_error = (
                        f"{self._init_error} | keyword fallback failed: "
                        f"{type(fallback_exc).__name__}: {fallback_exc}"
                    )
                    print(f"[rag] Keyword fallback failed: {fallback_exc}")

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

        if os.path.exists(index_path):
            meta_ok = False
            if os.path.exists(meta_path):
                try:
                    with open(meta_path, "r", encoding="utf-8") as file:
                        saved_meta = json.load(file)
                    meta_ok = saved_meta == expected_meta
                    if not meta_ok:
                        print(
                            "[rag] Embedding model changed: "
                            f"{saved_meta.get('model')} -> {embeddings.model_name}. Rebuilding vector store."
                        )
                except Exception:
                    meta_ok = False

            if meta_ok:
                try:
                    self._vectorstore = FAISS.load_local(
                        settings.VECTOR_STORE_DIR,
                        embeddings,
                        allow_dangerous_deserialization=True,
                    )
                    print("[rag] Loaded FAISS index from disk")
                    return
                except Exception as exc:
                    print(f"[rag] Failed to load index: {exc}. Rebuilding.")

        self._rebuild_index(embeddings, expected_meta, meta_path)

    def _load_reference_documents(self) -> list[Document]:
        docs: list[Document] = []
        data_dir = settings.DATA_DIR

        if os.path.isdir(data_dir):
            for filename in sorted(os.listdir(data_dir)):
                if not filename.endswith((".txt", ".md")):
                    continue

                file_path = os.path.join(data_dir, filename)
                try:
                    with open(file_path, "r", encoding="utf-8") as file:
                        content = file.read().strip()
                except Exception as exc:
                    print(f"[rag] Error reading {filename}: {exc}")
                    continue

                if content:
                    docs.append(
                        Document(
                            page_content=content,
                            metadata={"source": filename},
                        )
                    )

        if docs:
            return docs

        print("[rag] No data files found, writing sample legal data")
        return self._create_sample_data()

    def _split_documents(self, docs: list[Document]) -> list[Document]:
        from langchain_text_splitters import RecursiveCharacterTextSplitter

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.RAG_CHUNK_SIZE,
            chunk_overlap=settings.RAG_CHUNK_OVERLAP,
            separators=["\n\n", "\n", ". ", " "],
        )
        return splitter.split_documents(docs)

    def _build_keyword_fallback(self):
        docs = self._load_reference_documents()
        chunks = self._split_documents(docs)
        self._fallback_chunks = chunks or docs
        print(f"[rag] Keyword fallback ready with {len(self._fallback_chunks)} chunks")

    def _rebuild_index(self, embeddings, expected_meta: dict, meta_path: str):
        from langchain_community.vectorstores import FAISS

        docs = self._load_reference_documents()
        chunks = self._split_documents(docs)
        print(f"[rag] Created {len(chunks)} chunks from {len(docs)} documents")

        self._vectorstore = FAISS.from_documents(chunks, embeddings)
        self._vectorstore.save_local(settings.VECTOR_STORE_DIR)

        with open(meta_path, "w", encoding="utf-8") as file:
            json.dump(expected_meta, file)

        print("[rag] FAISS index built and saved")

    @staticmethod
    def _create_sample_data() -> list[Document]:
        """Write sample legal reference files and return Document objects."""
        sample = {
            "sample_legal_reference.txt": (
                "Consumer Protection Act, 2019\n\n"
                "Section 2(7) defines a consumer as any person who buys goods "
                "or hires services for consideration.\n\n"
                "Section 35 provides that the District Commission shall have "
                "jurisdiction to entertain complaints where the value of goods "
                "or services does not exceed one crore rupees.\n\n"
                "A complaint must be filed within 2 years from the date on "
                "which the cause of action arises."
            ),
        }

        docs: list[Document] = []
        for filename, content in sample.items():
            file_path = os.path.join(settings.DATA_DIR, filename)
            try:
                with open(file_path, "w", encoding="utf-8") as file:
                    file.write(content)
            except Exception:
                pass

            docs.append(
                Document(
                    page_content=content,
                    metadata={"source": filename},
                )
            )

        return docs

    def _keyword_search(self, query: str, k: int) -> list[tuple[Document, float]]:
        if not self._fallback_chunks:
            self._build_keyword_fallback()

        query_tokens = _tokenize_text(query)
        if not query_tokens:
            return []

        query_counter = Counter(query_tokens)
        normalised_query = _normalise_query(query)
        results: list[tuple[Document, float]] = []

        for doc in self._fallback_chunks:
            source = str(doc.metadata.get("source", "unknown"))
            doc_counter = Counter(_tokenize_text(f"{source} {doc.page_content}"))

            if not doc_counter:
                continue

            overlap = sum(
                min(count, doc_counter.get(token, 0))
                for token, count in query_counter.items()
            )
            unique_overlap = sum(
                1 for token in query_counter if doc_counter.get(token, 0) > 0
            )
            phrase_bonus = 3 if normalised_query and normalised_query in _normalise_query(doc.page_content) else 0
            source_bonus = 1 if any(token in _normalise_query(source) for token in query_counter) else 0
            score = float((overlap * 2) + unique_overlap + phrase_bonus + source_bonus)

            if score > 0:
                results.append((doc, score))

        results.sort(key=lambda item: item[1], reverse=True)
        return results[:k]

    def _retrieve(self, query: str, k: int) -> list[tuple[Document, float]]:
        if not self._initialized:
            self.initialize()

        if self._vectorstore is not None:
            try:
                return self._vectorstore.similarity_search_with_score(query, k=k)
            except Exception as exc:
                print(f"[rag] Vector search error: {exc}. Falling back to keyword search.")

        return self._keyword_search(query, k)

    async def chat(self, query: str) -> dict:
        """RAG chat: greeting guard -> retrieval -> LLM."""
        if _should_skip_rag(query):
            return dict(_GREETING_RESPONSE)

        results = self._retrieve(query, settings.RAG_TOP_K)

        context_parts = []
        sources: list[str] = []
        for doc, _score in results:
            source = doc.metadata.get("source", "unknown")
            context_parts.append(f"[Source: {source}]\n{doc.page_content}")
            if source not in sources:
                sources.append(source)

        context = (
            "\n\n---\n\n".join(context_parts)
            if context_parts
            else "No relevant context found."
        )

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

            raw = extract_response_content(response).strip()
            if raw.startswith("```json"):
                raw = raw[7:]
            elif raw.startswith("```"):
                raw = raw[3:]
            if raw.endswith("```"):
                raw = raw[:-3]

            result = json.loads(raw.strip())
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

    def search(self, query: str, k: Optional[int] = None) -> list[dict]:
        """Pure retrieval without the LLM."""
        results = self._retrieve(query, k or settings.RAG_TOP_K)
        return [
            {
                "content": doc.page_content,
                "source": doc.metadata.get("source", "unknown"),
                "score": float(score),
            }
            for doc, score in results
        ]


rag = RAGService()
