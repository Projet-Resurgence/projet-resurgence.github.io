"""Site JWT minting and the two route guards built on it.

Extracted from `app.py` so blueprints (the content API) can import the guards
without importing the application module back — `app.py` still re-exports every
name, so existing call sites are unchanged.
"""

from datetime import datetime, timedelta
from functools import wraps

import jwt
from flask import jsonify, request

from settings import JWT_ALGORITHM, JWT_EXPIRATION_HOURS, JWT_SECRET


def generate_jwt_token(payload: dict) -> str:
    token_payload = {
        **payload,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_jwt_token(token: str):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"success": False, "error": "Missing authorization"}), 401
        payload = verify_jwt_token(auth_header.split(" ")[1])
        if not payload:
            return jsonify({"success": False, "error": "Invalid or expired token"}), 401
        request.user = payload
        return f(*args, **kwargs)

    return decorated


def require_admin(f):
    """Pure administrator only — the gate for every game- or content-editing endpoint."""

    @wraps(f)
    @require_auth
    def decorated(*args, **kwargs):
        if not request.user.get("is_admin"):
            return jsonify({"success": False, "error": "Admin access required"}), 403
        return f(*args, **kwargs)

    return decorated


def admin_actor_headers() -> dict:
    """Attribute the PR_API write to the administrator who asked for it.

    Percent-encoded because Discord display names contain Unicode that is not
    valid latin-1, and a raw header value would raise on encode — the same
    reason Game-Dashboard encodes `X-Staff-Name`.
    """
    from urllib.parse import quote

    user = getattr(request, "user", None) or {}
    headers = {"X-Actor-Kind": "staff"}
    if user.get("discord_id"):
        headers["X-Staff-Discord-Id"] = str(user["discord_id"])
    name = user.get("guild_username") or user.get("username")
    if name:
        headers["X-Staff-Name"] = quote(str(name))
    return headers
