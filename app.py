"""Projet Résurgence — official website (projet-resurgence.fr).

The site itself is still plain static HTML/CSS/JS; this app serves those files
with the exact cache headers the old nginx image applied, and adds the two
things a static file server cannot do:

  * WebAuth SSO login (same flow as calc./catalog./play.), so the header shows
    who you are across every subdomain, and
  * the game-calendar API used by /calendrier — public reads for everyone,
    plus the admin writes that let a pure administrator edit the game calendar
    without going through the VPN-only admin panel.
"""

import os
from functools import wraps
from urllib.parse import urlencode

import jwt
import requests
from flask import (
    Flask,
    jsonify,
    redirect,
    request,
    send_from_directory,
)

from settings import (
    BASE_DIR,
    JWT_ALGORITHM,
    JWT_EXPIRATION_HOURS,
    JWT_SECRET,
    PR_API_URL,
    PUBLIC_URL,
    SECRET_KEY,
    SSO_COOKIE_NAME,
    WEBAUTH_PUBLIC_URL,
    WEBAUTH_URL,
)
from pr_api_service_auth import service_auth_headers

app = Flask(__name__, static_folder=None)
app.config["SECRET_KEY"] = SECRET_KEY

# Source files that live in the repo but must never be served over HTTP.
_PRIVATE_FILES = {
    "app.py",
    "settings.py",
    "pr_api_service_auth.py",
    "requirements.txt",
    "Dockerfile",
    "CLAUDE.md",
    "README.md",
    "LICENSE",
    "CNAME",
    "verify-seo.sh",
    "analytics-report.txt",
}
_PRIVATE_DIRS = ("scripts/", "rules/", "test-scripts/", "test-results/", "__pycache__/")


# ── HTTP helpers ────────────────────────────────────────────────────────────


def api_get(endpoint: str, **kwargs) -> requests.Response:
    return requests.get(f"{PR_API_URL}{endpoint}", timeout=10, **kwargs)


def api_put(endpoint: str, json_data: dict = None, **kwargs) -> requests.Response:
    return requests.put(f"{PR_API_URL}{endpoint}", json=json_data, timeout=10, **kwargs)


def api_post(endpoint: str, json_data: dict = None, **kwargs) -> requests.Response:
    return requests.post(f"{PR_API_URL}{endpoint}", json=json_data, timeout=15, **kwargs)


def webauth_post(endpoint: str, json_data: dict = None, **kwargs) -> requests.Response:
    return requests.post(
        f"{WEBAUTH_URL}{endpoint}", json=json_data, timeout=10, **kwargs
    )


# ── Auth ────────────────────────────────────────────────────────────────────


def _build_user_payload(account: dict) -> dict:
    return {
        "discord_id": account.get("discord_id"),
        "username": account.get("discord_username") or account.get("username"),
        "guild_username": account.get("guild_nickname")
        or account.get("discord_username")
        or account.get("username"),
        "country_id": account.get("country_id"),
        "country_name": account.get("country_name"),
        "is_admin": bool(account.get("is_admin")),
        "is_staff": bool(account.get("is_staff")),
    }


def _resolve_sso_account(token: str | None):
    if not token:
        return None
    try:
        resp = webauth_post("/api/sso/session", json_data={"token": token})
        if resp.status_code != 200:
            return None
        data = resp.json()
        if not data.get("success"):
            return None
        return data.get("account")
    except Exception:
        return None


def generate_jwt_token(payload: dict) -> str:
    from datetime import datetime, timedelta

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
    """Pure administrator only — the gate for every game-editing endpoint."""

    @wraps(f)
    @require_auth
    def decorated(*args, **kwargs):
        if not request.user.get("is_admin"):
            return jsonify({"success": False, "error": "Admin access required"}), 403
        return f(*args, **kwargs)

    return decorated


@app.route("/api/auth/discord/url")
def get_auth_url():
    # `next` is where the user lands once logged in; site-relative only, so it
    # can never be turned into an open redirect.
    next_path = request.args.get("next") or "/"
    if not next_path.startswith("/") or next_path.startswith("//"):
        next_path = "/"
    callback_url = f"{PUBLIC_URL}/callback?{urlencode({'return_to': next_path})}"
    sso_url = f"{WEBAUTH_PUBLIC_URL}/sso/login?{urlencode({'return_to': callback_url})}"
    return jsonify({"url": sso_url})


@app.route("/callback")
def auth_callback():
    sso_token = request.cookies.get(SSO_COOKIE_NAME) or request.args.get("sso_token")
    account = _resolve_sso_account(sso_token)
    return_to = request.args.get("return_to") or "/"
    if not return_to.startswith("/") or return_to.startswith("//"):
        return_to = "/"
    if not account:
        return redirect(f"{return_to}?error=sso_session_missing")

    token = generate_jwt_token(_build_user_payload(account))
    sep = "&" if "?" in return_to else "?"
    response = redirect(f"{return_to}{sep}token={token}")
    if request.args.get("sso_token") and not request.cookies.get(SSO_COOKIE_NAME):
        response.set_cookie(
            SSO_COOKIE_NAME, sso_token, httponly=True, samesite="Lax", path="/"
        )
    return response


@app.route("/api/auth/sso/bootstrap", methods=["POST"])
def sso_bootstrap():
    """Pick up an SSO session established on another subdomain, cookie-only."""
    account = _resolve_sso_account(request.cookies.get(SSO_COOKIE_NAME))
    if not account:
        return jsonify({"success": False, "valid": False, "error": "No SSO session"}), 401
    payload = _build_user_payload(account)
    token = generate_jwt_token(payload)
    return jsonify({"success": True, "valid": True, "token": token, "user": payload})


@app.route("/api/auth/verify", methods=["POST"])
def verify_token():
    data = request.get_json(silent=True) or {}
    token = data.get("token")
    if not token:
        return jsonify({"valid": False}), 400
    payload = verify_jwt_token(token)
    if not payload:
        return jsonify({"valid": False}), 401
    return jsonify({"valid": True, "user": payload})


@app.route("/api/auth/logout")
def auth_logout():
    logout_url = (
        f"{WEBAUTH_PUBLIC_URL}/sso/logout?{urlencode({'return_to': PUBLIC_URL + '/'})}"
    )
    response = redirect(logout_url)
    response.delete_cookie(SSO_COOKIE_NAME, path="/")
    return response


@app.route("/api/me/header")
@require_auth
def get_my_header_data():
    """Flag for the shared site header, only if the user belongs to a country."""
    country_id = request.user.get("country_id")
    if not country_id:
        return jsonify({"success": True, "flag_url": None})
    flag_url = None
    try:
        resp = api_get(f"/countries/{country_id}")
        if resp.status_code == 200:
            data = resp.json()
            data = data.get("data", data) if isinstance(data, dict) else {}
            flag_url = data.get("country_flag_image_url")
    except Exception:
        pass
    return jsonify({"success": True, "flag_url": flag_url})


# ── Game calendar: public reads ─────────────────────────────────────────────


@app.route("/api/calendar")
def calendar_dates():
    """All game dates + the playdays-per-month config the calendar renders from."""
    try:
        resp = api_get("/game/dates")
        if resp.status_code == 200:
            data = resp.json()
            if data.get("success"):
                return jsonify({"success": True, "data": data.get("data", {})})
        return jsonify({"success": False, "error": "Failed to fetch calendar"}), 502
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/pause-schedule")
def pause_schedule():
    """Pause status + planned resume date (public on the PR_API side)."""
    try:
        resp = api_get("/game/pause/schedule")
        if resp.status_code == 200:
            data = resp.json()
            if data.get("success"):
                return jsonify({"success": True, "data": data.get("data", {})})
        return jsonify({"success": False, "error": "Failed to fetch pause schedule"}), 502
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/game-date")
def game_date():
    """Current game date (year, month, playday, max_playdays)."""
    try:
        resp = api_get("/game/date")
        if resp.status_code == 200:
            data = resp.json()
            if data.get("success"):
                return jsonify({"success": True, "data": data.get("data", {})})
        return jsonify({"success": False, "error": "Failed to fetch game date"}), 502
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/playdays-per-month")
def playdays_per_month():
    try:
        resp = api_get("/game/playdays-per-month")
        if resp.status_code == 200:
            data = resp.json()
            if data.get("success"):
                return jsonify({"success": True, "data": data.get("data", {})})
        return jsonify({"success": False, "error": "Failed to fetch playdays"}), 502
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ── Game calendar: administrator writes ─────────────────────────────────────


@app.route("/api/admin/pause-schedule", methods=["PUT"])
@require_admin
def set_pause_schedule():
    """Set or clear the announced resume date."""
    data = request.get_json(silent=True) or {}
    if "planned_resume_date" not in data:
        return (
            jsonify({"success": False, "error": "planned_resume_date is required"}),
            400,
        )
    try:
        resp = api_put(
            "/game/pause/schedule",
            json_data={"planned_resume_date": data.get("planned_resume_date")},
            headers=service_auth_headers(),
        )
        payload = resp.json()
        if resp.status_code == 200 and payload.get("success"):
            return jsonify({"success": True, "data": payload.get("data", {})})
        return (
            jsonify(
                {"success": False, "error": payload.get("error", "Failed to update")}
            ),
            resp.status_code,
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/admin/pause", methods=["POST"])
@require_admin
def toggle_pause():
    """Flip the RP pause flag."""
    try:
        resp = api_post("/game/pause", headers=service_auth_headers())
        payload = resp.json()
        if resp.status_code == 200 and payload.get("success"):
            return jsonify({"success": True, "data": payload.get("data", {})})
        return (
            jsonify(
                {"success": False, "error": payload.get("error", "Failed to toggle")}
            ),
            resp.status_code,
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/admin/playdays-per-month", methods=["PUT"])
@require_admin
def update_playdays_per_month():
    """Rewrite the per-month playday quotas. Body: {"1": 30, "2": 28, ...}."""
    data = request.get_json(silent=True) or {}
    if not data:
        return jsonify({"success": False, "error": "Missing data"}), 400
    cleaned = {}
    for month, playdays in data.items():
        try:
            month_i, playdays_i = int(month), int(playdays)
        except (TypeError, ValueError):
            return jsonify({"success": False, "error": f"Invalid entry: {month}"}), 400
        if not 1 <= month_i <= 12 or playdays_i < 0:
            return jsonify({"success": False, "error": f"Invalid entry: {month}"}), 400
        cleaned[str(month_i)] = playdays_i
    try:
        resp = api_put(
            "/game/playdays-per-month",
            json_data=cleaned,
            headers=service_auth_headers(),
        )
        payload = resp.json()
        if resp.status_code == 200 and payload.get("success"):
            return jsonify({"success": True, "data": cleaned})
        return (
            jsonify(
                {"success": False, "error": payload.get("error", "Failed to update")}
            ),
            resp.status_code,
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/admin/game-date/advance", methods=["POST"])
@require_admin
def force_advance_game_date():
    """Force the playday forward by one, ignoring the pause + duplicate checks."""
    try:
        resp = api_post(
            "/game/date/force-advance",
            json_data={"skip_checks": True},
            headers=service_auth_headers(),
        )
        payload = resp.json()
        if resp.status_code == 200 and payload.get("success"):
            return jsonify({"success": True, "data": payload.get("data", {})})
        return (
            jsonify(
                {"success": False, "error": payload.get("error", "Failed to advance")}
            ),
            resp.status_code,
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ── Static site ─────────────────────────────────────────────────────────────


def _is_private(rel_path: str) -> bool:
    return rel_path in _PRIVATE_FILES or rel_path.startswith(_PRIVATE_DIRS)


def _send(rel_path: str):
    return send_from_directory(BASE_DIR, rel_path)


@app.route("/health")
def health():
    return jsonify({"status": "ok", "service": "resurgence-web"})


@app.route("/")
def home():
    return _send("index.html")


@app.route("/<path:filename>")
def site_file(filename):
    if _is_private(filename):
        return not_found(None)
    candidate = (BASE_DIR / filename).resolve()
    try:
        candidate.relative_to(BASE_DIR)
    except ValueError:
        return not_found(None)
    if candidate.is_file():
        return _send(filename)
    # Pretty URLs: /calendrier -> calendrier.html
    if "." not in os.path.basename(filename) and (
        BASE_DIR / f"{filename}.html"
    ).is_file():
        return _send(f"{filename}.html")
    return not_found(None)


@app.errorhandler(404)
def not_found(_e):
    return _send("404.html"), 404


@app.after_request
def cache_headers(response):
    """Mirror the cache policy the previous nginx image baked in."""
    path = request.path
    if response.status_code >= 400:
        # Never let a 404 for a missing asset be cached for a year.
        response.headers["Cache-Control"] = "no-store"
    elif path == "/sw.js" or path.endswith(".html") or path == "/":
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
    elif path.startswith("/components/"):
        response.headers["Cache-Control"] = "no-cache, must-revalidate"
    elif path.startswith("/api/") or path == "/callback":
        response.headers["Cache-Control"] = "no-store"
    elif path.rsplit(".", 1)[-1] in (
        "js", "css", "png", "jpg", "jpeg", "gif", "ico", "svg",
        "woff", "woff2", "ttf", "eot", "webp", "avif", "otf",
    ):
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    return response


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)
