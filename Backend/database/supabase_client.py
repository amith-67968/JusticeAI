"""
JusticeAI — Supabase client initialisation with JWT validation.
"""

from __future__ import annotations

import base64
import json
from functools import lru_cache

from config import settings


class SupabaseConfigurationError(RuntimeError):
    """Raised when Supabase credentials are missing or invalid."""


@lru_cache(maxsize=1)
def get_supabase_client():
    """Return a validated, cached Supabase client (service-role only)."""

    url = settings.SUPABASE_URL
    key = settings.SUPABASE_SERVICE_ROLE_KEY

    # ── Validate URL ─────────────────────────────────────────────────────
    if not url:
        raise SupabaseConfigurationError(
            "SUPABASE_URL is not set. Add it to your .env file."
        )

    # ── Validate key exists ──────────────────────────────────────────────
    if not key:
        raise SupabaseConfigurationError(
            "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to your .env file."
        )

    # ── Reject publishable keys ──────────────────────────────────────────
    if key.startswith("sb_publishable_"):
        raise SupabaseConfigurationError(
            "SUPABASE_SERVICE_ROLE_KEY appears to be a publishable key. "
            "Use the service_role key from Supabase → Settings → API."
        )

    # ── JWT role check ───────────────────────────────────────────────────
    parts = key.split(".")
    if len(parts) == 3:
        try:
            payload_b64 = parts[1]
            # Add padding
            payload_b64 += "=" * (4 - len(payload_b64) % 4)
            payload = json.loads(base64.urlsafe_b64decode(payload_b64))
            role = payload.get("role", "")
            if role == "anon":
                raise SupabaseConfigurationError(
                    "SUPABASE_SERVICE_ROLE_KEY has role='anon'. "
                    "You must use the service_role key, not the anon key. "
                    "Find it in Supabase → Settings → API → service_role."
                )
            if role and role != "service_role":
                print(
                    f"[supabase] Warning: JWT role is '{role}', "
                    f"expected 'service_role'."
                )
        except (json.JSONDecodeError, UnicodeDecodeError, ValueError):
            # Not a standard JWT — allow it (could be a custom key format)
            pass

    # ── Create client ────────────────────────────────────────────────────
    from supabase import create_client

    return create_client(url, key)
