"""Cached PR_API service token, used only for the game-calendar admin writes.

Every other resurgence-web -> PR_API call is anonymous by design (PR_API's
game-date reads are public). The pause toggle and the planned-resume-date
write are scope-protected on the PR_API side, so they need a service token.
"""

import time

import requests

from settings import PR_API_CLIENT_ID, PR_API_CLIENT_SECRET, PR_API_URL

_token = None
_token_expiry = 0.0


def _fetch_token() -> tuple[str, int]:
    resp = requests.post(
        f"{PR_API_URL}/auth/service-token",
        json={
            "client_id": PR_API_CLIENT_ID,
            "client_secret": PR_API_CLIENT_SECRET,
        },
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()
    token = data.get("access_token") or data.get("data", {}).get("access_token")
    expires_in = data.get("expires_in", 900)
    return token, expires_in


def service_auth_headers() -> dict:
    """Bearer header for the PR_API service token, auto-refreshed 30s before expiry."""
    global _token, _token_expiry
    now = time.time()
    if not _token or now >= _token_expiry - 30:
        _token, expires_in = _fetch_token()
        _token_expiry = now + expires_in
    return {"Authorization": f"Bearer {_token}"}
