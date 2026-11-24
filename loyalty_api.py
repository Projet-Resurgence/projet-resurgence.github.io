"""Programme de fidélité : pages /avent et /collection, et leur relais vers PR_API.

**Le site relaie, il ne décide rien.** Le compte crédité est celui du jeton du
site (`account_id`, posé par WebAuth à la connexion) — jamais un champ du corps
ni de l'URL. PR_API ne connaît le joueur que par `X-Loyalty-Account-Id`, qu'il
n'accepte que d'un service titulaire de `loyalty.player.relay` (règle 1b).
L'heure, l'ouverture d'une case, l'unicité d'une réclamation : PR_API.

**Un seul moteur markdown** (règle 6b) : le corps d'une case ouverte arrive en
markdown et repart en HTML rendu ici par `content_markdown.render`. Le
navigateur ne reçoit jamais de markdown à interpréter.

**Embargo** : rien de ce que PR_API ne publie pas ne passe par ici. Les pages
sont rendues côté serveur avec la seule projection PUBLIQUE (accroches des
cases verrouillées) ; l'état personnel arrive après, par `/api/loyalty/*`, en
`no-store`.
"""

import os
import re

import requests
from flask import Blueprint, Response, jsonify, render_template, request, stream_with_context

from auth_guard import require_auth, verify_jwt_token
from content_markdown import render as render_markdown
from pr_api_service_auth import invalidate_service_token, service_auth_headers
from settings import PR_API_URL, PUBLIC_URL

loyalty_bp = Blueprint("loyalty", __name__)

#: L'événement que /avent présente. Une autre année = une autre clé, réglable
#: sans code par `LOYALTY_ADVENT_EVENT` dans l'environnement.
ADVENT_EVENT = os.getenv("LOYALTY_ADVENT_EVENT", "avent-2026")

_EVENT_KEY = re.compile(r"^[a-z0-9][a-z0-9-]{1,59}$")
_MEDIA_KEY = re.compile(r"^[A-Za-z0-9_-]{8,40}$")
RELAY_CLIENT_TAG = "resurgence-web"


# ── Plomberie ────────────────────────────────────────────────────────────────

def _account_id():
    raw = str((getattr(request, "user", None) or {}).get("account_id") or "")
    return int(raw) if raw.isdigit() and int(raw) > 0 else None


def _optional_user():
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    return verify_jwt_token(header.split(" ", 1)[1])


def _relay_call(method, endpoint, account_id, **kwargs):
    """Appel au nom du joueur. Un 401/403 du service = jeton de service périmé
    (scope ajouté depuis son émission) : on le renouvelle une fois."""
    for attempt in (0, 1):
        headers = {**service_auth_headers(), "X-Loyalty-Account-Id": str(account_id),
                   "X-Loyalty-Actor": RELAY_CLIENT_TAG}
        resp = requests.request(method, f"{PR_API_URL}{endpoint}", headers=headers, timeout=15, **kwargs)
        if resp.status_code in (401, 403) and attempt == 0 and _is_relay_refusal(resp):
            invalidate_service_token()
            continue
        return resp
    return resp


def _is_relay_refusal(resp) -> bool:
    """Le refus vient-il du relais (scope) et non d'une règle métier (case fermée…) ?"""
    try:
        body = resp.json()
    except ValueError:
        return True
    return not body.get("code")


def _json(resp):
    try:
        payload = resp.json()
    except ValueError:
        return {"success": False, "error": "Réponse illisible de PR_API"}, 502
    return payload, resp.status_code


def _no_store(payload, status):
    response = jsonify(payload)
    response.status_code = status
    response.headers["Cache-Control"] = "no-store, private"
    return response


def _with_rendered_bodies(event: dict) -> dict:
    """`body_md` → `body_html`, par LE moteur du site. Le markdown ne sort pas."""
    for slot in event.get("slots") or []:
        md = slot.pop("body_md", None)
        if md is not None:
            slot["body_html"] = render_markdown(md)
    for goal in (event.get("community") or {}).get("goals") or []:
        for tier in goal.get("tiers") or []:
            if tier.get("description"):
                tier["description_html"] = render_markdown(tier.pop("description"))
    if event.get("description"):
        event["description_html"] = render_markdown(event.pop("description"))
    return event


def fetch_public_event(key: str) -> dict | None:
    """Projection publique, pour le rendu serveur. Ne lève jamais."""
    try:
        resp = requests.get(f"{PR_API_URL}/loyalty/events/{key}", timeout=8)
        community = requests.get(f"{PR_API_URL}/loyalty/events/{key}/community", timeout=8)
        if resp.status_code != 200:
            return None
        event = resp.json().get("data") or {}
        if community.status_code == 200:
            event["community"] = community.json().get("data") or {}
        return _with_rendered_bodies(event)
    except (requests.RequestException, ValueError):
        return None


def fetch_config() -> dict:
    try:
        resp = requests.get(f"{PR_API_URL}/loyalty/config", timeout=5)
        return (resp.json() or {}).get("data") or {} if resp.status_code == 200 else {}
    except (requests.RequestException, ValueError):
        return {}


# ── Pages ────────────────────────────────────────────────────────────────────

@loyalty_bp.route("/avent")
@loyalty_bp.route("/avent/")
def page_advent():
    event = fetch_public_event(ADVENT_EVENT)
    config = fetch_config()
    currency = (config.get("currency") or {}).get("name") or "Éclats"
    page = {
        "meta_title": "Calendrier de l'Avent 2026 — Le Signal · Projet Résurgence",
        "meta_description": "Chaque jour de décembre, une nouvelle transmission. "
                            "Accordez la radio, captez le signal, gagnez des "
                            f"{currency} et des objets de collection.",
        "nav_page": "advent",
        "og_image": "/images/banners/avent.png",
    }
    response = Response(render_template("avent.html", page=page, slug="avent", event=event,
                                        currency=currency, public_url=PUBLIC_URL, event_key=ADVENT_EVENT))
    # La page porte l'heure du serveur et l'état des cases : jamais en cache partagé.
    response.headers["Cache-Control"] = "no-store"
    return response


@loyalty_bp.route("/collection")
@loyalty_bp.route("/collection/")
def page_collection():
    config = fetch_config()
    currency = (config.get("currency") or {}).get("name") or "Éclats"
    page = {
        "meta_title": "Ma collection — Projet Résurgence",
        "meta_description": f"Vos {currency}, vos objets de collection, votre historique.",
        "nav_page": "collection",
        "noindex": True,
    }
    response = Response(render_template("collection.html", page=page, slug="collection",
                                        currency=currency, public_url=PUBLIC_URL))
    response.headers["Cache-Control"] = "no-store"
    return response


# ── API du navigateur ────────────────────────────────────────────────────────

@loyalty_bp.route("/api/loyalty/event/<key>")
def api_event(key):
    if not _EVENT_KEY.match(key):
        return _no_store({"success": False, "error": "Événement introuvable."}, 404)
    user = _optional_user()
    account_id = None
    if user:
        raw = str(user.get("account_id") or "")
        account_id = int(raw) if raw.isdigit() else None
    try:
        if account_id:
            payload, status = _json(_relay_call("GET", f"/loyalty/me/events/{key}", account_id))
        else:
            payload, status = _json(requests.get(f"{PR_API_URL}/loyalty/events/{key}", timeout=8))
            if status == 200:
                community = requests.get(f"{PR_API_URL}/loyalty/events/{key}/community", timeout=8)
                if community.status_code == 200:
                    payload["data"]["community"] = community.json().get("data")
    except requests.RequestException:
        return _no_store({"success": False, "error": "Service momentanément indisponible."}, 502)
    if status == 200 and isinstance(payload.get("data"), dict):
        payload["data"] = _with_rendered_bodies(payload["data"])
        payload["data"]["signed_in"] = bool(account_id)
    return _no_store(payload, status)


def _player_post(endpoint):
    account_id = _account_id()
    if not account_id:
        return _no_store({"success": False, "code": "account_required",
                          "error": "Reconnectez-vous pour participer."}, 401)
    try:
        payload, status = _json(_relay_call("POST", endpoint, account_id))
    except requests.RequestException:
        return _no_store({"success": False, "error": "Service momentanément indisponible."}, 502)
    return _no_store(payload, status)


@loyalty_bp.route("/api/loyalty/event/<key>/slots/<int:position>/claim", methods=["POST"])
@require_auth
def api_claim_slot(key, position):
    if not _EVENT_KEY.match(key) or not 1 <= position <= 99:
        return _no_store({"success": False, "error": "Case introuvable."}, 404)
    return _player_post(f"/loyalty/me/events/{key}/slots/{position}/claim")


@loyalty_bp.route("/api/loyalty/daily/claim", methods=["POST"])
@require_auth
def api_claim_daily():
    return _player_post("/loyalty/me/daily/claim")


@loyalty_bp.route("/api/loyalty/tiers/<int:tier_id>/claim", methods=["POST"])
@require_auth
def api_claim_tier(tier_id):
    return _player_post(f"/loyalty/me/community/tiers/{tier_id}/claim")


def _player_get(endpoint, **params):
    account_id = _account_id()
    if not account_id:
        return _no_store({"success": False, "code": "account_required",
                          "error": "Reconnectez-vous."}, 401)
    try:
        payload, status = _json(_relay_call("GET", endpoint, account_id, params=params or None))
    except requests.RequestException:
        return _no_store({"success": False, "error": "Service momentanément indisponible."}, 502)
    return _no_store(payload, status)


@loyalty_bp.route("/api/loyalty/me")
@require_auth
def api_me():
    return _player_get("/loyalty/me")


@loyalty_bp.route("/api/loyalty/inventory")
@require_auth
def api_inventory():
    return _player_get("/loyalty/me/inventory")


@loyalty_bp.route("/api/loyalty/ledger")
@require_auth
def api_ledger():
    before = request.args.get("before_id", type=int)
    return _player_get("/loyalty/me/ledger", **({"before_id": before} if before else {}))


@loyalty_bp.route("/api/loyalty/media/<key>")
def api_media(key):
    """Le média, tel que PR_API le publie — `Range` transmis (Safari l'exige)."""
    if not _MEDIA_KEY.match(key):
        return _no_store({"success": False, "error": "Média introuvable."}, 404)
    headers = {}
    if request.headers.get("Range"):
        headers["Range"] = request.headers["Range"]
    if request.headers.get("If-None-Match"):
        headers["If-None-Match"] = request.headers["If-None-Match"]
    try:
        upstream = requests.get(f"{PR_API_URL}/loyalty/media/{key}", headers=headers, stream=True, timeout=15)
    except requests.RequestException:
        return _no_store({"success": False, "error": "Service momentanément indisponible."}, 502)
    if upstream.status_code not in (200, 206, 304):
        upstream.close()
        return _no_store({"success": False, "error": "Média introuvable."}, 404)
    passthrough = {k: v for k, v in upstream.headers.items()
                   if k.lower() in ("content-type", "content-length", "content-range", "accept-ranges",
                                    "etag", "last-modified", "cache-control")}
    passthrough["X-Content-Type-Options"] = "nosniff"
    return Response(stream_with_context(upstream.iter_content(64 * 1024)), status=upstream.status_code,
                    headers=passthrough, direct_passthrough=True)
