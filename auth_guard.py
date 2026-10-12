"""Site JWT minting and the two route guards built on it.

Extracted from `app.py` so blueprints (the content API) can import the guards
without importing the application module back — `app.py` still re-exports every
name, so existing call sites are unchanged.
"""

from datetime import datetime, timedelta
from functools import wraps

import jwt
import requests
from flask import jsonify, request

from settings import JWT_ALGORITHM, JWT_EXPIRATION_HOURS, JWT_SECRET, WEBAUTH_URL


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


class AuthorityUnavailable(Exception):
    """WebAuth n'a pas pu dire qui est le porteur maintenant."""


def load_current_account(user: dict):
    """Transport seul : le compte tel que WebAuth le reconstruit maintenant.

    Rend None quand le compte n'existe plus ou est désactivé (404) ; lève
    AuthorityUnavailable pour tout le reste, que la décision refuse aussi.
    """
    account_id = str(user.get("account_id") or "")
    discord_id = str(user.get("discord_id") or "")
    if account_id.isdigit():
        path = f"/api/accounts/{account_id}"
    elif discord_id.isdigit():
        path = f"/api/accounts/discord/{discord_id}"
    else:
        return None
    try:
        response = requests.get(f"{WEBAUTH_URL}{path}", timeout=5)
    except requests.RequestException as exc:
        raise AuthorityUnavailable(str(exc)) from exc
    if response.status_code == 404:
        return None
    try:
        payload = response.json()
    except ValueError as exc:
        raise AuthorityUnavailable("réponse illisible") from exc
    if response.status_code != 200 or not isinstance(payload, dict) or not payload.get("success"):
        raise AuthorityUnavailable(f"HTTP {response.status_code}")
    account = payload.get("account")
    return account if isinstance(account, dict) else None


def require_admin(f):
    """Pure administrator only — the gate for every game- or content-editing endpoint.

    Le jeton du site vit 24 h : son `is_admin` dit ce qu'était le porteur à la
    connexion. Une action d'administration se décide sur l'autorité actuelle,
    relue auprès de WebAuth, et se refuse quand elle est illisible.
    """

    @wraps(f)
    @require_auth
    def decorated(*args, **kwargs):
        if not request.user.get("is_admin"):
            return jsonify({"success": False, "error": "Admin access required"}), 403
        try:
            account = load_current_account(request.user)
        except AuthorityUnavailable:
            return jsonify({
                "success": False,
                "error": "authority_unavailable",
                "message": "Vos droits n'ont pas pu être vérifiés. Réessayez.",
            }), 503
        token_discord = str(request.user.get("discord_id") or "")
        same_person = not token_discord or str((account or {}).get("discord_id") or "") == token_discord
        if not account or not account.get("is_admin") or not same_person:
            return jsonify({
                "success": False,
                "error": "Admin access required",
                "message": "Vos droits ont changé. Reconnectez-vous.",
            }), 403
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
