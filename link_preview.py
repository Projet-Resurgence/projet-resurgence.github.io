"""Hover previews for the hyperlinks of the editorial pages.

`GET /api/link-preview?url=…` returns the title, description, site name and
banner a page declares about itself (Open Graph, then the plain `<title>` and
`<meta name="description">`). `GET /api/link-preview/image?url=…` and
`GET /api/link-preview/icon?url=…` stream the banner and the favicon of an
*already previewed* page.

Three constraints shape this module, and none of them are optional:

1. **It is a server-side fetcher, so it is an SSRF surface.** This container
   sits on the `backend` network with PR_API, the database and the bots one
   hostname away. Every fetch therefore resolves the host first and refuses any
   address that is not public unicast, re-checking on every redirect hop, with
   a short timeout and a hard read cap.

2. **It must not become an open proxy.** Only hosts that actually appear in the
   published content are previewable. The allow-set is derived from what
   PR_API serves for the three spaces and refreshed on a TTL, so an
   administrator adding a link to the règlement is enough — there is no second
   list to maintain.

3. **The banner is proxied, not hot-linked.** The vhost's CSP allows
   `img-src 'self'` and a handful of named origins, not `https:` at large
   (`docker/nginx/templates/sites.conf.j2`). Serving the bytes ourselves keeps
   the policy tight *and* keeps the reader's IP off third-party servers, which
   a hover on a règlement page has no business leaking.

Nothing here renders HTML. The card is built in the browser from this JSON.
"""

from __future__ import annotations

import ipaddress
import re
import socket
import threading
import time
from html import unescape
from urllib.parse import quote, urljoin, urlsplit

import requests
from flask import Blueprint, Response, jsonify, request

from settings import PR_API_URL

link_preview_bp = Blueprint("link_preview", __name__)

CONTENT_SPACES = ("rules", "context", "forum_rp")

USER_AGENT = "ProjetResurgenceLinkPreview/1.0 (+https://projet-resurgence.fr)"
FETCH_TIMEOUT = 4  # seconds, connect and read alike
MAX_HTML_BYTES = 512 * 1024
MAX_IMAGE_BYTES = 3 * 1024 * 1024
MAX_ICON_BYTES = 256 * 1024
MAX_REDIRECTS = 3

PREVIEW_TTL = 6 * 3600
FAILURE_TTL = 15 * 60
HOSTS_TTL = 600
CACHE_LIMIT = 512

IMAGE_TYPES = {"image/png", "image/jpeg", "image/webp", "image/gif", "image/avif", "image/svg+xml"}
# Banners are served through <img src>, and browsers never execute script
# inside an SVG reached that way (only inline/<object>/navigation do) — so
# this is safe even though the source page is someone else's. Icons keep SVG
# refused, same reason uploads refuse it (content_api.py): a favicon is still
# `.ico` on a great many sites, and there is no page here that needs it.
ICON_TYPES = {"image/png", "image/jpeg", "image/webp", "image/gif", "image/avif", "image/x-icon", "image/vnd.microsoft.icon"}


# ── Caches ──────────────────────────────────────────────────────────────────
#
# Per gunicorn worker and deliberately so: a preview is cheap to rebuild and a
# shared store would be one more thing to run for a hover card.

_lock = threading.Lock()
_previews: dict[str, tuple[float, dict | None]] = {}
_images: dict[str, tuple[float, str, bytes]] = {}
_hosts: tuple[float, frozenset[str]] = (0.0, frozenset())


def _cache_get(store: dict, key: str):
    with _lock:
        entry = store.get(key)
        if not entry or entry[0] < time.time():
            store.pop(key, None)
            return None
        return entry


def _cache_put(store: dict, key: str, value: tuple) -> None:
    with _lock:
        if len(store) >= CACHE_LIMIT:
            store.clear()  # cheap, and a cold cache costs one fetch
        store[key] = value


# ── The allow-set: hosts the published content already links to ─────────────

_URL_IN_TEXT = re.compile(r"https?://[^\s<>\"'()\]]+", re.IGNORECASE)


def _collect_hosts(node, out: set[str]) -> None:
    """Walk PR_API's JSON and keep the host of every URL found in its strings."""
    if isinstance(node, str):
        for found in _URL_IN_TEXT.findall(node):
            host = urlsplit(found).hostname
            if host:
                out.add(host.lower())
    elif isinstance(node, dict):
        for value in node.values():
            _collect_hosts(value, out)
    elif isinstance(node, list):
        for value in node:
            _collect_hosts(value, out)


def allowed_hosts(*, force: bool = False) -> frozenset[str]:
    global _hosts
    fresh_until, cached = _hosts
    if not force and fresh_until > time.time():
        return cached

    found: set[str] = set()
    for space in CONTENT_SPACES:
        try:
            resp = requests.get(f"{PR_API_URL}/site-content/{space}", timeout=10)
            if resp.ok:
                _collect_hosts(resp.json(), found)
        except (requests.RequestException, ValueError):
            continue

    if not found and cached:
        # PR_API blinked; keep the previous answer rather than blocking every
        # preview for the next ten minutes.
        _hosts = (time.time() + 60, cached)
        return cached

    _hosts = (time.time() + HOSTS_TTL, frozenset(found))
    return _hosts[1]


# ── SSRF guard ──────────────────────────────────────────────────────────────


def is_public_address(host: str) -> bool:
    """True only if every address `host` resolves to is public unicast.

    Every address, not the first one: a name that answers with one public and
    one loopback address is exactly the shape a DNS-rebinding attempt takes.
    """
    try:
        infos = socket.getaddrinfo(host, None, proto=socket.IPPROTO_TCP)
    except socket.gaierror:
        return False
    if not infos:
        return False
    for info in infos:
        try:
            ip = ipaddress.ip_address(info[4][0])
        except ValueError:
            return False
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_multicast
            or ip.is_reserved
            or ip.is_unspecified
        ):
            return False
    return True


def check_url(raw: str, *, hosts: frozenset[str] | None = None) -> str | None:
    """Return the URL if it may be fetched, else None."""
    if not raw or len(raw) > 2048:
        return None
    parts = urlsplit(raw)
    if parts.scheme not in ("http", "https") or not parts.hostname:
        return None
    if hosts is not None and parts.hostname.lower() not in hosts:
        return None
    if not is_public_address(parts.hostname):
        return None
    return raw


def fetch_guarded(url: str, *, max_bytes: int, hosts: frozenset[str] | None):
    """GET `url`, following redirects by hand so each hop is re-validated.

    Returns `(response, final_url, body)` or None. The body is read in chunks
    and abandoned as soon as it exceeds `max_bytes` — a preview is never worth
    an unbounded read from a host we do not control.
    """
    current = check_url(url, hosts=hosts)
    if not current:
        return None

    session = requests.Session()
    session.trust_env = False  # no ambient proxy, no netrc credentials

    for _ in range(MAX_REDIRECTS + 1):
        try:
            resp = session.get(
                current,
                timeout=FETCH_TIMEOUT,
                allow_redirects=False,
                stream=True,
                headers={"User-Agent": USER_AGENT, "Accept-Language": "fr,en;q=0.8"},
            )
        except requests.RequestException:
            return None

        if resp.is_redirect or resp.is_permanent_redirect:
            location = resp.headers.get("Location", "")
            resp.close()
            if not location:
                return None
            # The address guard follows every hop; the allow-set does not.
            # It is there to stop an attacker aiming this endpoint at a host
            # of their choosing, and a redirect is chosen by a host the
            # administrators already link to — `discord.gg` sends every invite
            # to `discord.com`, and refusing that would preview nothing.
            current = check_url(urljoin(current, location), hosts=None)
            if not current:
                return None
            continue

        if not resp.ok:
            resp.close()
            return None

        body = b""
        try:
            for chunk in resp.iter_content(8192):
                body += chunk
                if len(body) > max_bytes:
                    return None
        except requests.RequestException:
            return None
        finally:
            resp.close()
        return resp, current, body

    return None


# ── Open Graph parsing ──────────────────────────────────────────────────────

# A `>` is legal inside a quoted attribute value, so the tag cannot simply
# end at the first one: quoted runs are consumed whole.
_META = re.compile(
    r"""<meta\s+((?:[^>"']|"[^"]*"|'[^']*')*?)/?>""", re.IGNORECASE | re.DOTALL
)
_ATTR = re.compile(
    r"""([a-zA-Z:_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))""", re.DOTALL
)
_LINK = re.compile(
    r"""<link\s+((?:[^>"']|"[^"]*"|'[^']*')*?)/?>""", re.IGNORECASE | re.DOTALL
)
_TITLE = re.compile(r"<title[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)
_TAGS = re.compile(r"<[^>]+>")
_CHARSET = re.compile(rb'charset=["\']?([a-zA-Z0-9_-]{2,20})', re.IGNORECASE)


def _decode(body: bytes) -> str:
    match = _CHARSET.search(body[:4096])
    if match:
        try:
            return body.decode(match.group(1).decode("ascii"), errors="replace")
        except (LookupError, UnicodeDecodeError):
            pass
    return body.decode("utf-8", errors="replace")


def _clean(value: str, limit: int) -> str:
    text = _TAGS.sub(" ", unescape(value or ""))
    text = " ".join(text.split())
    return text[:limit].rstrip() if len(text) > limit else text


def _attributes(raw: str) -> dict[str, str]:
    attrs = {}
    for name, dq, sq, bare in _ATTR.findall(raw):
        attrs[name.lower()] = dq or sq or bare
    return attrs


# Best first. `rel` is a space-separated set, so it is matched token by token.
_ICON_RELS = ("icon", "shortcut icon", "apple-touch-icon", "apple-touch-icon-precomposed")


def _find_icon(html_text: str) -> str:
    """The favicon a page declares, or "" — the caller falls back to /favicon.ico."""
    found: dict[str, str] = {}
    for raw_attrs in _LINK.findall(html_text):
        attrs = _attributes(raw_attrs)
        href = (attrs.get("href") or "").strip()
        if not href:
            continue
        rels = {token.lower() for token in (attrs.get("rel") or "").split()}
        for rel in _ICON_RELS:
            if set(rel.split()) <= rels and rel not in found:
                found[rel] = href
    for rel in _ICON_RELS:
        if rel in found:
            return found[rel]
    return ""


def parse_metadata(html_text: str, base_url: str) -> dict:
    """Extract what a link card shows. Values are plain text, never markup."""
    meta: dict[str, str] = {}
    for raw_attrs in _META.findall(html_text):
        attrs = _attributes(raw_attrs)
        key = (attrs.get("property") or attrs.get("name") or "").lower()
        content = attrs.get("content")
        if key and content and key not in meta:
            meta[key] = content

    title = meta.get("og:title") or meta.get("twitter:title") or ""
    if not title:
        found = _TITLE.search(html_text)
        title = found.group(1) if found else ""

    description = (
        meta.get("og:description")
        or meta.get("twitter:description")
        or meta.get("description")
        or ""
    )
    image = meta.get("og:image") or meta.get("og:image:url") or meta.get("twitter:image") or ""
    # Declared or not, every site is asked for /favicon.ico — that is where the
    # browser itself would look, and the route 404s cleanly when it is absent.
    icon = _find_icon(html_text) or "/favicon.ico"

    return {
        "title": _clean(title, 140),
        "description": _clean(description, 280),
        "site_name": _clean(meta.get("og:site_name") or "", 60),
        "image": urljoin(base_url, image.strip()) if image.strip() else "",
        "icon": urljoin(base_url, unescape(icon).strip()),
    }


# ── Routes ──────────────────────────────────────────────────────────────────


def build_preview(url: str) -> dict | None:
    """Fetch `url` and describe it. `image_src` and `icon_src` are the
    third-party addresses and stay server-side; the browser is only ever given
    our own proxy routes."""
    fetched = fetch_guarded(url, max_bytes=MAX_HTML_BYTES, hosts=allowed_hosts())
    if not fetched:
        return None
    resp, final_url, body = fetched
    if "html" not in (resp.headers.get("Content-Type") or "").lower():
        return None

    data = parse_metadata(_decode(body), final_url)
    host = urlsplit(final_url).hostname or ""
    data["image_src"] = data.pop("image")
    data["icon_src"] = data.pop("icon")
    data["host"] = host
    data["site_name"] = data["site_name"] or host.removeprefix("www.")
    data["title"] = data["title"] or data["site_name"]
    key = quote(url, safe="")
    data["image"] = "/api/link-preview/image?url=" + key if data["image_src"] else ""
    data["icon"] = "/api/link-preview/icon?url=" + key if data["icon_src"] else ""
    return data


_PRIVATE_FIELDS = ("image_src", "icon_src")


def _public(data: dict) -> dict:
    return {key: value for key, value in data.items() if key not in _PRIVATE_FIELDS}


def cached_preview(url: str) -> dict | None:
    """The preview for `url`, from the cache or freshly fetched. Failures are
    cached too, or a page linking to a dead host would refetch on every hover."""
    entry = _cache_get(_previews, url)
    if entry is not None:
        return entry[1]
    data = build_preview(url)
    _cache_put(_previews, url, (time.time() + (PREVIEW_TTL if data else FAILURE_TTL), data))
    return data


@link_preview_bp.get("/api/link-preview")
def link_preview():
    url = (request.args.get("url") or "").strip()
    if not check_url(url, hosts=allowed_hosts()):
        return jsonify({"success": False, "error": "URL not previewable"}), 400

    data = cached_preview(url)
    if data is None:
        return jsonify({"success": False, "error": "Preview unavailable"}), 404
    return jsonify({"success": True, "data": _public(data)})


def _serve_declared_image(field: str, *, max_bytes: int, types: set[str]):
    """Stream an image a page we have already previewed declared about itself.

    Keyed by the *page* URL, not the image URL: the only images reachable
    through these routes are the ones a previewable page pointed at, so they can
    never be aimed at an arbitrary target.
    """
    url = (request.args.get("url") or "").strip()
    if not check_url(url, hosts=allowed_hosts()):
        return jsonify({"success": False, "error": "URL not previewable"}), 400

    cache_key = f"{field}\n{url}"
    cached = _cache_get(_images, cache_key)
    if cached is not None:
        return Response(
            cached[2],
            mimetype=cached[1],
            headers={"Cache-Control": "public, max-age=21600"},
        )

    preview = cached_preview(url)
    if not preview or not preview.get(field):
        return jsonify({"success": False, "error": "No image"}), 404

    # `hosts=None`: a banner is routinely served from a CDN the page itself
    # never links to. The address checks still apply — only the allow-set,
    # which exists to stop this being an open *page* fetcher, does not.
    got = fetch_guarded(preview[field], max_bytes=max_bytes, hosts=None)
    if not got:
        return jsonify({"success": False, "error": "No image"}), 404
    resp, _, image_bytes = got
    content_type = (resp.headers.get("Content-Type") or "").split(";")[0].strip().lower()
    if content_type not in types:
        return jsonify({"success": False, "error": "No image"}), 404

    _cache_put(_images, cache_key, (time.time() + PREVIEW_TTL, content_type, image_bytes))
    return Response(
        image_bytes,
        mimetype=content_type,
        headers={"Cache-Control": "public, max-age=21600"},
    )


@link_preview_bp.get("/api/link-preview/image")
def link_preview_image():
    """The banner of a previewed page."""
    return _serve_declared_image("image_src", max_bytes=MAX_IMAGE_BYTES, types=IMAGE_TYPES)


@link_preview_bp.get("/api/link-preview/icon")
def link_preview_icon():
    """The favicon of a previewed page, shown beside the site name."""
    return _serve_declared_image("icon_src", max_bytes=MAX_ICON_BYTES, types=ICON_TYPES)
