"""Discord-flavoured markdown → HTML, for the editorial content of the site.

There is exactly **one** renderer and it lives here, in Python. The pages are
server-rendered so a crawler sees the full règlement on first paint, and the
editor's live preview POSTs to `/api/content/preview` rather than shipping a
second implementation in JavaScript — two renderers would drift, and the one
in the browser would be the one nobody audits.

Security model: the input is escaped **first**, then a fixed set of tags is
emitted from parsed structure. No stored string ever reaches the page as
markup, so a body written by an administrator (or by anyone who ever gets hold
of an admin session) cannot inject script. URLs are filtered to http/https and
site-relative `/uploads/…`; anything else renders as plain text.

Supported syntax (the subset Discord users already type):

    **gras**  *italique*  _italique_  __souligné__  ~~barré~~  ||spoiler||
    `code`    ```bloc de code```
    # Titre   ## Titre    ### Titre
    - liste   1. liste ordonnée
    > citation
    ---       (séparateur)
    [libellé](https://…)
    ![texte alternatif](/uploads/xxx.png)      image
    !video[titre](https://youtube.com/watch?v=…)   lecteur intégré
    !embed[titre](https://…)                       carte de lien
    !commands[all]                                 guide des commandes des bots
"""

import html
import re
from urllib.parse import parse_qs, urlparse

import bot_commands

# Hosts we are willing to put inside an <iframe>. Everything else that is asked
# for as a video degrades to a link card — embedding an arbitrary origin in an
# iframe on our own page is not something an editor should be able to do.
_VIDEO_PROVIDERS = {
    "youtube.com": "youtube",
    "www.youtube.com": "youtube",
    "m.youtube.com": "youtube",
    "youtu.be": "youtube",
    "youtube-nocookie.com": "youtube",
    "www.youtube-nocookie.com": "youtube",
    "vimeo.com": "vimeo",
    "www.vimeo.com": "vimeo",
    "player.vimeo.com": "vimeo",
    "dailymotion.com": "dailymotion",
    "www.dailymotion.com": "dailymotion",
    "dai.ly": "dailymotion",
}

_SAFE_SCHEMES = ("http://", "https://")

_BLOCK_MEDIA = re.compile(
    r"^\s*!(?P<kind>video|embed)\[(?P<title>[^\]]*)\]\((?P<url>[^)\s]+)\)\s*$"
)
_BLOCK_IMAGE = re.compile(r"^\s*!\[(?P<alt>[^\]]*)\]\((?P<url>[^)\s]+)\)\s*$")
# Le guide des commandes des bots. Le corps de section reste une donnée éditable
# (règle 6b) : l'administrateur écrit son introduction, puis pose ce marqueur là
# où la liste doit apparaître. La liste, elle, est générée depuis le code des
# bots — cf. `bot_commands.py`.
# `re.M` pour que `plain_text()` puisse le retirer d'un corps entier : sans lui,
# le résumé d'une section afficherait « !commands[all] » en méta-description.
_BLOCK_COMMANDS = re.compile(
    r"^[ \t]*!commands\[(?P<scope>[a-z0-9_,\- ]*)\][ \t]*$", re.M
)
_HEADING = re.compile(r"^(?P<level>#{1,3})\s+(?P<text>.+)$")
_UNORDERED = re.compile(r"^\s*[-*]\s+(?P<text>.+)$")
_ORDERED = re.compile(r"^\s*(?P<number>\d+)[.)]\s+(?P<text>.+)$")
_QUOTE = re.compile(r"^\s*>\s?(?P<text>.*)$")
_RULE = re.compile(r"^\s*(?:-{3,}|_{3,}|\*{3,})\s*$")

# Inline patterns, applied to already-escaped text in this exact order —
# `__x__` must beat `_x_`, and `**x**` must beat `*x*`.
_INLINE_LINK = re.compile(r"\[([^\]]+)\]\(([^)\s]+)\)")
_INLINE_IMAGE = re.compile(r"!\[([^\]]*)\]\(([^)\s]+)\)")
_INLINE_RULES = (
    (re.compile(r"\*\*\*(.+?)\*\*\*", re.S), r"<strong><em>\1</em></strong>"),
    (re.compile(r"\*\*(.+?)\*\*", re.S), r"<strong>\1</strong>"),
    (re.compile(r"__(.+?)__", re.S), r"<u>\1</u>"),
    (re.compile(r"~~(.+?)~~", re.S), r"<s>\1</s>"),
    (re.compile(r"\|\|(.+?)\|\|", re.S), r'<span class="pr-spoiler">\1</span>'),
    (re.compile(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", re.S), r"<em>\1</em>"),
    (re.compile(r"(?<![\w_])_(?!\s)(.+?)(?<!\s)_(?![\w_])", re.S), r"<em>\1</em>"),
)


# ── URL handling ────────────────────────────────────────────────────────────


def safe_url(raw: str) -> str | None:
    """`None` for anything we are not willing to emit as an href/src.

    Accepts absolute http(s) and site-relative paths. Rejects `javascript:`,
    `data:`, protocol-relative `//host` (which silently changes origin) and
    every other scheme.
    """
    if not raw:
        return None
    url = raw.strip()
    if not url or url.startswith("//"):
        return None
    lowered = url.lower()
    if lowered.startswith(_SAFE_SCHEMES):
        return url
    if url.startswith("/") and not url.startswith("//"):
        return url
    return None


def _video_embed_url(url: str) -> str | None:
    """Provider watch URL → its privacy-friendly player URL, or None."""
    parsed = urlparse(url)
    provider = _VIDEO_PROVIDERS.get(parsed.netloc.lower())
    if not provider:
        return None

    if provider == "youtube":
        if parsed.netloc.lower() == "youtu.be":
            video_id = parsed.path.lstrip("/").split("/")[0]
        elif parsed.path.startswith("/embed/"):
            video_id = parsed.path[len("/embed/") :].split("/")[0]
        elif parsed.path.startswith("/shorts/"):
            video_id = parsed.path[len("/shorts/") :].split("/")[0]
        else:
            video_id = (parse_qs(parsed.query).get("v") or [""])[0]
        if not re.fullmatch(r"[\w-]{6,20}", video_id or ""):
            return None
        return f"https://www.youtube-nocookie.com/embed/{video_id}"

    if provider == "vimeo":
        video_id = parsed.path.strip("/").split("/")[-1]
        if not video_id.isdigit():
            return None
        return f"https://player.vimeo.com/video/{video_id}"

    # dailymotion
    if parsed.netloc.lower() == "dai.ly":
        video_id = parsed.path.strip("/")
    else:
        video_id = parsed.path.replace("/video/", "").strip("/").split("_")[0]
    if not re.fullmatch(r"[a-zA-Z0-9]{5,20}", video_id or ""):
        return None
    return f"https://www.dailymotion.com/embed/video/{video_id}"


def _domain_of(url: str) -> str:
    netloc = urlparse(url).netloc
    return netloc[4:] if netloc.startswith("www.") else (netloc or "lien")


# ── Inline rendering ────────────────────────────────────────────────────────


def _render_inline(text: str) -> str:
    """Escaped text → inline HTML. Never receives raw user input unescaped."""
    out = html.escape(text, quote=False)

    # Inline code first: its contents must not be re-processed for emphasis.
    placeholders: list[str] = []

    def _stash_code(match):
        placeholders.append(f"<code>{match.group(1)}</code>")
        return f"\x00{len(placeholders) - 1}\x00"

    out = re.sub(r"`([^`\n]+)`", _stash_code, out)

    def _image(match):
        url = safe_url(html.unescape(match.group(2)))
        alt = match.group(1)
        if not url:
            return match.group(0)
        return (
            f'<img class="pr-content-inline-image" src="{html.escape(url, quote=True)}" '
            f'alt="{html.escape(alt, quote=True)}" loading="lazy" decoding="async">'
        )

    out = _INLINE_IMAGE.sub(_image, out)

    def _link(match):
        url = safe_url(html.unescape(match.group(2)))
        if not url:
            return match.group(0)
        external = url.lower().startswith(_SAFE_SCHEMES)
        rel = ' target="_blank" rel="noopener noreferrer"' if external else ""
        return (
            f'<a href="{html.escape(url, quote=True)}"{rel}>{match.group(1)}</a>'
        )

    out = _INLINE_LINK.sub(_link, out)

    for pattern, replacement in _INLINE_RULES:
        out = pattern.sub(replacement, out)

    for index, code in enumerate(placeholders):
        out = out.replace(f"\x00{index}\x00", code)
    return out


# ── Block rendering ─────────────────────────────────────────────────────────


def _render_image_block(alt: str, raw_url: str) -> str:
    url = safe_url(raw_url)
    if not url:
        return f"<p>{_render_inline(f'![{alt}]({raw_url})')}</p>"
    caption = (
        f'<figcaption>{_render_inline(alt)}</figcaption>' if alt.strip() else ""
    )
    return (
        '<figure class="pr-content-figure">'
        f'<img src="{html.escape(url, quote=True)}" '
        f'alt="{html.escape(alt, quote=True)}" loading="lazy" decoding="async">'
        f"{caption}</figure>"
    )


def _render_link_card(title: str, url: str) -> str:
    label = title.strip() or url
    return (
        '<a class="pr-content-embed-card" '
        f'href="{html.escape(url, quote=True)}" target="_blank" rel="noopener noreferrer">'
        f'<span class="pr-content-embed-domain">{html.escape(_domain_of(url))}</span>'
        f'<span class="pr-content-embed-title">{html.escape(label)}</span>'
        '<span class="pr-content-embed-go" aria-hidden="true">↗</span>'
        "</a>"
    )


def _render_media_block(kind: str, title: str, raw_url: str) -> str:
    url = safe_url(raw_url)
    if not url:
        return f"<p>{_render_inline(f'!{kind}[{title}]({raw_url})')}</p>"

    if kind == "video":
        embed = _video_embed_url(url)
        if embed:
            label = title.strip() or "Vidéo intégrée"
            return (
                '<figure class="pr-content-video">'
                f'<iframe src="{html.escape(embed, quote=True)}" '
                f'title="{html.escape(label, quote=True)}" loading="lazy" '
                'allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture" '
                'allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>'
                + (
                    f"<figcaption>{_render_inline(title)}</figcaption>"
                    if title.strip()
                    else ""
                )
                + "</figure>"
            )
    # `!embed`, and any video host we do not iframe, render as a link card.
    return _render_link_card(title, url)


def _close_list(state: dict, out: list) -> None:
    if state["list"]:
        out.append(f'</{state["list"]}>')
        state["list"] = None


def _close_quote(state: dict, out: list) -> None:
    if state["quote"]:
        out.append("</blockquote>")
        state["quote"] = False


def render(markdown: str) -> str:
    """Render one section body. Returns HTML safe to insert as-is."""
    if not markdown:
        return ""

    out: list[str] = []
    state = {"list": None, "quote": False}
    lines = markdown.replace("\r\n", "\n").replace("\r", "\n").split("\n")

    i = 0
    while i < len(lines):
        line = lines[i]

        # Fenced code block — consumed verbatim, no inline processing at all.
        if line.strip().startswith("```"):
            _close_list(state, out)
            _close_quote(state, out)
            language = line.strip()[3:].strip()
            body: list[str] = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("```"):
                body.append(lines[i])
                i += 1
            i += 1
            css = f' class="language-{html.escape(language, quote=True)}"' if language else ""
            out.append(
                f"<pre class=\"pr-content-code\"><code{css}>"
                + html.escape("\n".join(body), quote=False)
                + "</code></pre>"
            )
            continue

        if not line.strip():
            _close_list(state, out)
            _close_quote(state, out)
            i += 1
            continue

        commands = _BLOCK_COMMANDS.match(line)
        if commands:
            _close_list(state, out)
            _close_quote(state, out)
            out.append(bot_commands.render(commands.group("scope")))
            i += 1
            continue

        media = _BLOCK_MEDIA.match(line)
        if media:
            _close_list(state, out)
            _close_quote(state, out)
            out.append(
                _render_media_block(
                    media.group("kind"), media.group("title"), media.group("url")
                )
            )
            i += 1
            continue

        image = _BLOCK_IMAGE.match(line)
        if image:
            _close_list(state, out)
            _close_quote(state, out)
            out.append(_render_image_block(image.group("alt"), image.group("url")))
            i += 1
            continue

        if _RULE.match(line):
            _close_list(state, out)
            _close_quote(state, out)
            out.append('<hr class="pr-content-rule">')
            i += 1
            continue

        heading = _HEADING.match(line)
        if heading:
            _close_list(state, out)
            _close_quote(state, out)
            # Bodies live *inside* a section that already owns an <h2>, so a
            # single `#` starts at <h3> rather than competing with the page's
            # heading outline.
            level = len(heading.group("level")) + 2
            out.append(
                f'<h{level} class="pr-content-h{level}">'
                f'{_render_inline(heading.group("text"))}</h{level}>'
            )
            i += 1
            continue

        quote = _QUOTE.match(line)
        if quote:
            _close_list(state, out)
            if not state["quote"]:
                out.append('<blockquote class="pr-content-quote">')
                state["quote"] = True
            out.append(f'<p>{_render_inline(quote.group("text"))}</p>')
            i += 1
            continue
        _close_quote(state, out)

        ordered = _ORDERED.match(line)
        unordered = _UNORDERED.match(line)
        if ordered or unordered:
            wanted = "ol" if ordered else "ul"
            if state["list"] != wanted:
                _close_list(state, out)
                out.append(f'<{wanted} class="pr-content-list">')
                state["list"] = wanted
            text = (ordered or unordered).group("text")
            out.append(f"<li>{_render_inline(text)}</li>")
            i += 1
            continue
        _close_list(state, out)

        out.append(f'<p>{_render_inline(line)}</p>')
        i += 1

    _close_list(state, out)
    _close_quote(state, out)
    return "".join(out)


def plain_text(markdown: str, limit: int = 300) -> str:
    """Strip formatting for meta descriptions and search indexes."""
    if not markdown:
        return ""
    text = _BLOCK_COMMANDS.sub("", markdown, count=0)
    text = re.sub(r"!?(?:video|embed)?\[([^\]]*)\]\([^)\s]*\)", r"\1", text)
    text = re.sub(r"[`*_~>#|-]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[: limit - 1] + "…" if len(text) > limit else text
