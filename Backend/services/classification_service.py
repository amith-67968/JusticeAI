"""
JusticeAI — InLegalBERT case classifier.

Two implementations live in this file:
  1. Legacy zero-shot (lines ~1-110) — simple HuggingFace pipeline wrapper.
  2. Canonical encoder-based (lines ~115+) — cosine similarity + keyword boosts.

The second definition overrides the first at module level so that
`from services.classification_service import classifier` always uses the
canonical version.
"""

from __future__ import annotations

import threading
from typing import Optional

from config import settings

# ── Shared label set ─────────────────────────────────────────────────────

CASE_LABELS: list[str] = [
    "Consumer Dispute",
    "Civil Dispute",
    "Criminal",
    "Cyber Crime",
    "Others",
]


# ═══════════════════════════════════════════════════════════════════════════
# Implementation 1 — Legacy zero-shot (HuggingFace pipeline)
# ═══════════════════════════════════════════════════════════════════════════

class _LegacyCaseClassifier:
    """Fallback zero-shot classifier using HuggingFace pipeline."""

    def __init__(self):
        self._pipe = None
        self._lock = threading.Lock()
        self._loaded = False

    def load_model(self):
        if self._loaded:
            return
        with self._lock:
            if self._loaded:
                return
            try:
                from transformers import pipeline as hf_pipeline

                self._pipe = hf_pipeline(
                    "zero-shot-classification",
                    model=settings.INLEGALBERT_MODEL,
                )
                print("[classifier/legacy] InLegalBERT zero-shot pipeline loaded")
            except Exception as exc:
                print(f"[classifier/legacy] Could not load model: {exc}")
                self._pipe = None
            self._loaded = True

    def classify(self, text: str) -> str:
        self.load_model()
        if self._pipe is None:
            return "Others"
        try:
            text = text[: settings.CLASSIFICATION_MAX_CHARS]
            result = self._pipe(
                text,
                candidate_labels=CASE_LABELS,
                hypothesis_template="This is a legal case about {}.",
            )
            return result["labels"][0]
        except Exception:
            return "Others"

    def classify_with_scores(self, text: str) -> dict[str, float]:
        self.load_model()
        if self._pipe is None:
            return {label: 0.0 for label in CASE_LABELS}
        try:
            text = text[: settings.CLASSIFICATION_MAX_CHARS]
            result = self._pipe(
                text,
                candidate_labels=CASE_LABELS,
                hypothesis_template="This is a legal case about {}.",
            )
            return dict(zip(result["labels"], result["scores"]))
        except Exception:
            return {label: 0.0 for label in CASE_LABELS}


# First definition (will be overridden below)
classifier = _LegacyCaseClassifier()


# ═══════════════════════════════════════════════════════════════════════════
# Implementation 2 — Canonical encoder-based classifier (overrides above)
# ═══════════════════════════════════════════════════════════════════════════

# ── Prototype descriptions (one per category) ────────────────────────────

PROTOTYPE_DESCRIPTIONS: dict[str, str] = {
    "Consumer Dispute": (
        "A consumer dispute involving defective goods, deficient services, "
        "refund claims, warranty issues, billing disputes, seller liability, "
        "or compensation under consumer protection law."
    ),
    "Civil Dispute": (
        "A civil dispute involving contracts, property, tenancy, leases, "
        "money recovery, injunctions, agreements, specific performance, "
        "or damages."
    ),
    "Criminal": (
        "A criminal matter involving an FIR, police complaint, arrest, "
        "assault, theft, cheating, breach of trust, intimidation, or "
        "another criminal offence."
    ),
    "Cyber Crime": (
        "A cyber crime matter involving online fraud, phishing, hacking, "
        "identity theft, data misuse, OTP scams, digital impersonation, "
        "or social media abuse."
    ),
    "Others": (
        "A legal issue that does not clearly fit consumer, civil, criminal, "
        "or cyber crime categories."
    ),
}

# ── Keyword hints ────────────────────────────────────────────────────────

KEYWORD_HINTS: dict[str, tuple[str, ...]] = {
    "Consumer Dispute": (
        "consumer", "defect", "defective", "refund", "warranty",
        "invoice", "receipt", "seller", "buyer", "service", "compensation",
    ),
    "Civil Dispute": (
        "agreement", "contract", "breach", "property", "tenant",
        "landlord", "lease", "rent", "injunction", "damages",
        "specific performance",
    ),
    "Criminal": (
        "fir", "police", "accused", "arrest", "bail", "cheating",
        "theft", "assault", "criminal", "offence", "offense",
    ),
    "Cyber Crime": (
        "cyber", "online fraud", "phishing", "hacking", "hack",
        "identity theft", "otp", "digital", "email scam",
        "social media", "data breach",
    ),
    "Others": (),
}

# ── Constants ────────────────────────────────────────────────────────────

SIMILARITY_TEMPERATURE = 0.15
LOW_CONFIDENCE_PROBABILITY = 0.45
LOW_CONFIDENCE_SIMILARITY = 0.30


def _keyword_only_scores(text: str) -> dict[str, float]:
    """Lightweight fallback classifier when transformers/torch are unavailable."""
    lower = text.lower()
    raw_scores: dict[str, float] = {}

    for label in CASE_LABELS:
        hits = sum(1 for kw in KEYWORD_HINTS[label] if kw in lower)
        raw_scores[label] = float(hits)

    total = sum(raw_scores.values())
    if total <= 0:
        return {
            "Others": 1.0,
            "Consumer Dispute": 0.0,
            "Civil Dispute": 0.0,
            "Criminal": 0.0,
            "Cyber Crime": 0.0,
        }

    normalized = {
        label: round(score / total, 4)
        for label, score in raw_scores.items()
    }
    return dict(sorted(normalized.items(), key=lambda kv: kv[1], reverse=True))


class CaseClassifier:
    """Encoder-based classifier using InLegalBERT embeddings, cosine similarity,
    keyword boosts, and a low-confidence fallback to 'Others'."""

    def __init__(self):
        self._tokenizer = None
        self._model = None
        self._label_embeddings = None
        self._lock = threading.Lock()
        self._loaded = False

    # ── Model loading ────────────────────────────────────────────────────

    def load_model(self):
        if self._loaded:
            return
        with self._lock:
            if self._loaded:
                return
            try:
                import torch
                from transformers import AutoModel, AutoTokenizer

                model_name = settings.INLEGALBERT_MODEL

                # Try local first, then download
                try:
                    self._tokenizer = AutoTokenizer.from_pretrained(
                        model_name, local_files_only=True
                    )
                    self._model = AutoModel.from_pretrained(
                        model_name, local_files_only=True
                    )
                    print(f"[classifier] Loaded InLegalBERT from local cache")
                except Exception:
                    self._tokenizer = AutoTokenizer.from_pretrained(model_name)
                    self._model = AutoModel.from_pretrained(model_name)
                    print(f"[classifier] Downloaded InLegalBERT: {model_name}")

                self._model.eval()

                # Pre-compute label embeddings from prototype descriptions
                descriptions = [
                    PROTOTYPE_DESCRIPTIONS[label] for label in CASE_LABELS
                ]
                self._label_embeddings = self._encode_texts(
                    descriptions, max_length=256
                )
                print(
                    f"[classifier] Label embeddings computed "
                    f"({self._label_embeddings.shape})"
                )

            except Exception as exc:
                print(f"[classifier] Failed to load model: {exc}")
                self._tokenizer = None
                self._model = None
                self._label_embeddings = None

            self._loaded = True

    # ── Encoding ─────────────────────────────────────────────────────────

    def _encode_texts(self, texts: list[str], max_length: int = 512):
        import torch

        tokens = self._tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=max_length,
            return_tensors="pt",
        )

        with torch.no_grad():
            output = self._model(**tokens)

        # Mean pooling over token embeddings, respecting attention mask
        hidden = output.last_hidden_state                   # (B, T, D)
        mask = tokens["attention_mask"].unsqueeze(-1).float()  # (B, T, 1)
        summed = (hidden * mask).sum(dim=1)
        counts = mask.sum(dim=1).clamp(min=1e-9)
        mean_pooled = summed / counts                       # (B, D)

        # L2 normalise
        return torch.nn.functional.normalize(mean_pooled, p=2, dim=1)

    # ── Keyword boost ────────────────────────────────────────────────────

    def _keyword_boosts(self, text: str):
        import torch

        lower = text.lower()
        boosts = []
        for label in CASE_LABELS:
            hits = sum(1 for kw in KEYWORD_HINTS[label] if kw in lower)
            boosts.append(min(0.40, hits * 0.08))
        return torch.tensor(boosts)

    # ── Prepare text ─────────────────────────────────────────────────────

    @staticmethod
    def _prepare_text(text: str) -> str:
        import re

        text = re.sub(r"\s+", " ", text).strip()
        return f"Legal case summary: {text}"

    # ── classify_with_scores ─────────────────────────────────────────────

    def classify_with_scores(self, text: str) -> dict[str, float]:
        self.load_model()

        if self._model is None or self._label_embeddings is None:
            return _keyword_only_scores(text)

        import torch

        try:
            text = self._prepare_text(text[: settings.CLASSIFICATION_MAX_CHARS])

            # 1. Encode
            text_emb = self._encode_texts([text], max_length=512)  # (1, D)

            # 2. Cosine similarities
            sims = torch.matmul(text_emb, self._label_embeddings.T).squeeze(0)

            # 3. Keyword boosts
            boosts = self._keyword_boosts(text)
            sims = sims + boosts

            # 4. Temperature scaling + softmax
            probs = torch.softmax(sims / SIMILARITY_TEMPERATURE, dim=0)

            # 5. Low-confidence fallback
            top_idx = probs.argmax().item()
            top_label = CASE_LABELS[top_idx]
            others_idx = CASE_LABELS.index("Others")

            if (
                top_label != "Others"
                and probs[top_idx].item() < LOW_CONFIDENCE_PROBABILITY
                and sims[top_idx].item() < LOW_CONFIDENCE_SIMILARITY
                and boosts[top_idx].item() == 0.0
            ):
                # Demote: set Others at least as high
                probs[others_idx] = probs[top_idx]

            # Build sorted dict (descending)
            scored = {
                CASE_LABELS[i]: round(probs[i].item(), 4)
                for i in range(len(CASE_LABELS))
            }
            return dict(
                sorted(scored.items(), key=lambda kv: kv[1], reverse=True)
            )

        except Exception as exc:
            print(f"[classifier] classify_with_scores error: {exc}")
            return _keyword_only_scores(text)

    # ── classify ─────────────────────────────────────────────────────────

    def classify(self, text: str) -> str:
        scores = self.classify_with_scores(text)
        if not scores:
            return "Others"
        top_label = max(scores, key=scores.get)
        if scores.get(top_label, 0.0) <= 0:
            return "Others"
        return top_label


# ── Override the legacy definition ───────────────────────────────────────
classifier = CaseClassifier()
