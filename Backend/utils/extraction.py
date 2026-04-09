"""
JusticeAI — PDF / Image / Text extraction and regex helpers.
"""

from __future__ import annotations

import io
import re
from typing import Optional

from config import settings


# ═══════════════════════════════════════════════════════════════════════════
# Internal OCR helper
# ═══════════════════════════════════════════════════════════════════════════

def _ocr_image(img) -> str:
    """Run Tesseract OCR on a PIL Image. Returns empty string on failure."""
    try:
        import pytesseract

        if settings.TESSERACT_CMD:
            pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD

        return pytesseract.image_to_string(img, lang="eng").strip()
    except Exception:
        return ""


# ═══════════════════════════════════════════════════════════════════════════
# Text extractors
# ═══════════════════════════════════════════════════════════════════════════

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF using PyMuPDF; falls back to OCR per page."""
    import fitz  # PyMuPDF
    from PIL import Image

    pages: list[str] = []

    doc = fitz.open(stream=file_bytes, filetype="pdf")
    for page in doc:
        text = page.get_text("text").strip()
        if text:
            pages.append(text)
        else:
            # Render at 200 DPI and OCR
            pix = page.get_pixmap(dpi=200)
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            ocr_text = _ocr_image(img)
            if ocr_text:
                pages.append(ocr_text)
    doc.close()

    return "\n\n".join(pages)


def extract_text_from_image(file_bytes: bytes) -> str:
    """Extract text from an image file using Tesseract OCR."""
    from PIL import Image

    img = Image.open(io.BytesIO(file_bytes))
    return _ocr_image(img)


def detect_and_extract(filename: str, file_bytes: bytes) -> str:
    """Auto-detect file type by extension and extract text."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext == "pdf":
        return extract_text_from_pdf(file_bytes)

    if ext in ("png", "jpg", "jpeg", "bmp", "tiff", "tif", "webp"):
        return extract_text_from_image(file_bytes)

    # Plain text or unknown — try UTF-8 first, fallback to PDF extractor
    try:
        return file_bytes.decode("utf-8")
    except (UnicodeDecodeError, AttributeError):
        return extract_text_from_pdf(file_bytes)


_MAX_EXTRACTED_DATES = 12
_MAX_EXTRACTED_MONEY_VALUES = 10


def _normalize_date_value(value: str) -> str:
    value = re.sub(r"\s+", " ", value).strip()
    if re.fullmatch(r"\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4}", value):
        parts = re.split(r"[/\-\.]", value)
        return "/".join(parts)
    return value.title()


def _normalize_money_value(value: str) -> str:
    value = re.sub(r"\s+", " ", value).strip()
    value = value.replace("₹", "Rs. ")
    value = re.sub(r"^Rs\s+", "Rs. ", value, flags=re.IGNORECASE)
    value = re.sub(r"^Rs\.\s*", "Rs. ", value, flags=re.IGNORECASE)
    value = re.sub(r"^INR\s+", "INR ", value, flags=re.IGNORECASE)
    return value


# ═══════════════════════════════════════════════════════════════════════════
# Regex helpers
# ═══════════════════════════════════════════════════════════════════════════

def extract_dates_regex(text: str) -> list[str]:
    """Extract dates from text using multiple regex patterns. Deduplicated, order preserved."""
    patterns = [
        # DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (also MM/DD/YY variants)
        r"\b(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})\b",
        # YYYY-MM-DD
        r"\b(\d{4}-\d{2}-\d{2})\b",
        # 12 Jan 2024 / 12 January 2024
        r"\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b",
        # Jan 12, 2024 / January 12, 2024
        r"\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b",
    ]

    seen: set[str] = set()
    results: list[str] = []

    for pattern in patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            value = _normalize_date_value(match.group(1))
            if value not in seen:
                seen.add(value)
                results.append(value)
                if len(results) >= _MAX_EXTRACTED_DATES:
                    return results

    return results


def extract_money_regex(text: str) -> list[str]:
    """Extract monetary values from text. Deduplicated, order preserved."""
    patterns = [
        # Rs. / INR / ₹ followed by amount, optional lakhs/crores
        r"(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:lakhs?|lacs?|crores?)?",
        # Amount followed by rupees/lakhs/crores
        r"\b([\d,]+(?:\.\d{1,2})?)\s+(?:rupees?|lakhs?|lacs?|crores?)\b",
    ]

    seen: set[str] = set()
    results: list[str] = []

    for pattern in patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            value = _normalize_money_value(match.group(0))
            if value not in seen:
                seen.add(value)
                results.append(value)
                if len(results) >= _MAX_EXTRACTED_MONEY_VALUES:
                    return results

    return results
