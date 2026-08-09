"""Le guide des commandes CLEA / MARC : chargement du JSON généré, puis HTML.

Le fichier `data/bot_commands.json` est produit par
`scripts/generate_bot_command_guide.py` à partir des cogs des deux bots, et
commité. Il est rendu par le marqueur `!commands[…]` de `content_markdown.py`,
donc *sur le serveur* : le guide est complet au premier octet, lisible par un
crawler comme par un joueur qui a coupé JavaScript. `styles/command-guide.js`
n'ajoute que la recherche et les filtres.

Deux règles tiennent ce module :

* **Échapper d'abord.** Le JSON vient du dépôt, pas d'un formulaire, mais il
  vient du code de deux bots que plusieurs personnes modifient ; un `brief`
  contenant `<script>` doit ressortir en texte. Même modèle que
  `content_markdown.py` : on échappe, puis on émet un jeu de balises fixe.
* **Un JSON manquant n'est pas une erreur 500.** Une image construite sans le
  fichier (ou un `.gitignore` qui l'a ravalé, cf. règle 16) doit dégrader la
  page en un avertissement, pas la casser.
"""

from __future__ import annotations

import html
import json
import unicodedata
from functools import lru_cache
from pathlib import Path

DATA_FILE = Path(__file__).resolve().parent / "data" / "bot_commands.json"

# Portées acceptées par le marqueur, en plus des clés de bot et de catégorie.
_ALL = "all"


@lru_cache(maxsize=1)
def load() -> dict:
    """Le guide, ou `{"bots": []}` si le fichier n'a pas été livré."""
    try:
        with DATA_FILE.open(encoding="utf-8") as handle:
            data = json.load(handle)
    except (OSError, ValueError):
        return {"version": 0, "bots": []}
    if not isinstance(data, dict) or not isinstance(data.get("bots"), list):
        return {"version": 0, "bots": []}
    return data


def _scopes(raw: str) -> set[str]:
    return {part.strip().lower() for part in raw.split(",") if part.strip()} or {_ALL}


def select(scope: str) -> list[dict]:
    """Les bots/catégories demandés par la portée du marqueur.

    `all` (ou une portée vide) prend tout ; `clea` / `marc` filtrent par bot ;
    toute autre clé filtre par catégorie, sur les deux bots.
    """
    wanted = _scopes(scope)
    if _ALL in wanted:
        return load().get("bots", [])

    bot_keys = {bot["key"] for bot in load().get("bots", [])}
    by_bot = wanted & bot_keys
    by_category = wanted - bot_keys

    out: list[dict] = []
    for bot in load().get("bots", []):
        if by_bot and bot["key"] not in by_bot:
            continue
        categories = [
            category
            for category in bot.get("categories", [])
            if not by_category or category.get("key") in by_category
        ]
        if not categories:
            continue
        out.append(
            {
                **bot,
                "categories": categories,
                "command_count": sum(len(c.get("commands", [])) for c in categories),
            }
        )
    return out


# ── Rendu ───────────────────────────────────────────────────────────────────


def _fold(text: str) -> str:
    """Minuscules sans accents — ce sur quoi la recherche du navigateur porte.

    Un joueur tape « economie », pas « économie » ; c'est le seul endroit où
    cette normalisation peut se faire une fois pour toutes, côté serveur.
    """
    stripped = unicodedata.normalize("NFD", text.lower())
    return "".join(char for char in stripped if unicodedata.category(char) != "Mn")


def _search_terms(command: dict, category: dict, bot: dict) -> str:
    parts = [
        command.get("name", ""),
        *command.get("aliases", []),
        command.get("brief", ""),
        command.get("description", ""),
        category.get("label", ""),
        bot.get("name", ""),
    ]
    return _fold(" ".join(part for part in parts if part))


def _e(text) -> str:
    return html.escape(str(text or ""), quote=True)


def _plural(count: int, singular: str, plural: str) -> str:
    return f"{count} {singular if count <= 1 else plural}"


def _render_arguments(command: dict) -> str:
    arguments = command.get("arguments") or []
    if not arguments:
        return ""
    rows = []
    for argument in arguments:
        kind = argument.get("type") or ""
        rows.append(
            "<li class=\"pr-command__arg\">"
            f'<code>{_e(argument.get("name"))}</code>'
            + (f'<span class="pr-command__type">{_e(kind)}</span>' if kind else "")
            + (
                '<span class="pr-command__required">obligatoire</span>'
                if argument.get("required")
                else '<span class="pr-command__optional">optionnel</span>'
            )
            + (
                f'<span class="pr-command__argtext">{_e(argument.get("description"))}</span>'
                if argument.get("description")
                else ""
            )
            + "</li>"
        )
    return (
        '<div class="pr-command__block"><h5>Arguments</h5>'
        '<ul class="pr-command__args">' + "".join(rows) + "</ul></div>"
    )


def _render_list(title: str, items: list[str], css: str) -> str:
    if not items:
        return ""
    entries = "".join(f"<li>{_e(item)}</li>" for item in items)
    return (
        f'<div class="pr-command__block"><h5>{_e(title)}</h5>'
        f'<ul class="{css}">{entries}</ul></div>'
    )


def _render_examples(command: dict) -> str:
    examples = command.get("examples") or []
    if not examples:
        return ""
    rows = []
    for example in examples:
        text = example.get("command") or ""
        if not text:
            continue
        rows.append(
            '<li class="pr-command__example">'
            f'<code data-copy="/{_e(text)}">/{_e(text)}</code>'
            + (
                f'<span>{_e(example.get("effect"))}</span>'
                if example.get("effect")
                else ""
            )
            + "</li>"
        )
    if not rows:
        return ""
    return (
        '<div class="pr-command__block"><h5>Exemples</h5>'
        '<ul class="pr-command__examples">' + "".join(rows) + "</ul></div>"
    )


def _render_notes(command: dict) -> str:
    out = []
    for note in command.get("notes") or []:
        out.append(_render_list(note.get("title", ""), note.get("items") or [], "pr-command__notes"))
    return "".join(out)


def _render_command(command: dict, category: dict, bot: dict) -> str:
    name = command.get("name", "")
    summary = command.get("brief") or command.get("description") or ""
    aliases = command.get("aliases") or []
    usage = command.get("usage") or ""

    head = (
        "<summary>"
        f'<code class="pr-command__name">/{_e(name)}</code>'
        + (
            f'<span class="pr-command__brief">{_e(summary)}</span>'
            if summary
            else '<span class="pr-command__brief pr-command__brief--todo">'
            "Pas encore documentée dans le code du bot.</span>"
        )
        + "</summary>"
    )

    body = [
        f'<p class="pr-command__usage"><code>/{_e(usage or name)}</code></p>'
    ]
    # `brief`, `description` et l'introduction du `help` disent souvent la même
    # chose en trois formulations : les cogs les remplissent séparément. On ne
    # garde que ce qui apporte quelque chose de plus que le résumé déjà affiché.
    seen = {_fold(summary)}
    for text in (command.get("description"), command.get("details")):
        key = _fold(text or "")
        if not key or key in seen:
            continue
        seen.add(key)
        body.append(f'<p class="pr-command__desc">{_e(text)}</p>')
    if aliases:
        body.append(
            '<p class="pr-command__aliases">Alias : '
            + ", ".join(f"<code>/{_e(alias)}</code>" for alias in aliases)
            + "</p>"
        )
    body.append(_render_list("Ce que fait la commande", command.get("features") or [],
                             "pr-command__features"))
    body.append(_render_arguments(command))
    body.append(_render_examples(command))
    body.append(_render_notes(command))

    return (
        f'<details class="pr-command" data-bot="{_e(bot.get("key"))}" '
        f'data-cat="{_e(category.get("key"))}" '
        f'data-search="{_e(_search_terms(command, category, bot))}">'
        + head
        + '<div class="pr-command__body">'
        + "".join(body)
        + "</div></details>"
    )


def render(scope: str) -> str:
    """Le HTML du guide pour une portée. Jamais d'exception : au pire, un mot."""
    bots = select(scope)
    if not bots:
        return (
            '<p class="pr-commands__empty">Le guide des commandes est '
            "momentanément indisponible.</p>"
        )

    total = sum(bot.get("command_count", 0) for bot in bots)
    parts = [
        f'<section class="pr-commands" data-command-guide data-total="{total}">',
        '<div class="pr-commands__tools" data-command-tools></div>',
    ]

    for bot in bots:
        parts.append(
            f'<section class="pr-commands__bot" data-bot="{_e(bot.get("key"))}">'
            f'<h3 class="pr-commands__botname">{_e(bot.get("name"))}'
            f'<span class="pr-commands__count">'
            f'{_plural(bot.get("command_count", 0), "commande", "commandes")}</span></h3>'
            + (
                f'<p class="pr-commands__role">{_e(bot.get("role"))}</p>'
                if bot.get("role")
                else ""
            )
        )
        for category in bot.get("categories", []):
            parts.append(
                f'<div class="pr-commands__cat" data-cat="{_e(category.get("key"))}">'
                f'<h4 class="pr-commands__catname">{_e(category.get("label"))}</h4>'
            )
            for command in category.get("commands", []):
                parts.append(_render_command(command, category, bot))
            parts.append("</div>")
        parts.append("</section>")

    parts.append(
        '<p class="pr-commands__footnote">Ce guide est généré depuis le code des '
        "bots : il ne peut pas se désynchroniser de ce qu'ils acceptent "
        "réellement.</p>"
    )
    parts.append("</section>")
    return "".join(parts)
