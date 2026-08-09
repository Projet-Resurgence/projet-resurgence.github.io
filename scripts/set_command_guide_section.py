#!/usr/bin/env python3
"""Remplace le corps de la section « Guide des commandes » par le marqueur.

La section listait les commandes à la main : une soixantaine, dont plusieurs
avec des noms qui n'existent pas (`chech_debt`, `check_infrasurcture`), pendant
que les bots en exposent près du double. Ce script y écrit une courte
introduction suivie de `!commands[all]` ; `content_markdown.py` rend alors le
guide depuis `data/bot_commands.json`, généré à partir du code des bots.

Le corps reste une donnée éditable (règle 6b) : l'introduction se retouche
depuis le site comme n'importe quel autre texte, et seul le marqueur est
mécanique.

    docker compose exec resurgence-web python scripts/set_command_guide_section.py
    docker compose exec resurgence-web python scripts/set_command_guide_section.py --write

`--dry-run` est le défaut : l'ancien texte est affiché, rien n'est envoyé tant
que `--write` n'est pas donné.
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import requests  # noqa: E402

from pr_api_service_auth import service_auth_headers  # noqa: E402
from settings import PR_API_URL  # noqa: E402

SPACE = "forum_rp"
# Ce que l'on cherche dans le titre de la section, faute d'un identifiant stable
# entre les bases : le site de production, une base de test et un clone de debug
# ne numérotent pas leurs sections pareil.
TITLE_HINTS = ("guide des commandes", "commandes des bots")

BODY = """\
Toutes les commandes ci-dessous sont **générées automatiquement depuis le code \
des bots** : ce que vous lisez ici est exactement ce que C.L.E.A. et M.A.R.C. \
acceptent. Seules les commandes accessibles aux joueurs sont listées.

Tapez `/` dans un salon du serveur pour les retrouver avec l'auto-complétion \
de Discord ; les préfixes classiques restent acceptés.

!commands[all]"""


def find_section(tree: dict) -> tuple[dict, dict] | None:
    for category in (tree.get("categories") or []):
        for section in (category.get("sections") or []):
            title = (section.get("title") or "").lower()
            if any(hint in title for hint in TITLE_HINTS):
                return category, section
    return None


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--write",
        action="store_true",
        help="envoyer réellement la modification (sinon : simple aperçu)",
    )
    parser.add_argument("--section-id", type=int, help="forcer l'identifiant de section")
    args = parser.parse_args(argv)

    resp = requests.get(f"{PR_API_URL}/site-content/{SPACE}", timeout=15)
    resp.raise_for_status()
    tree = resp.json().get("data") or {}

    if args.section_id:
        found = next(
            (
                (category, section)
                for category in (tree.get("categories") or [])
                for section in (category.get("sections") or [])
                if section.get("id") == args.section_id
            ),
            None,
        )
    else:
        found = find_section(tree)

    if not found:
        print(
            "❌ Section introuvable dans l'espace « forum_rp ». "
            "Passez --section-id si son titre a changé.",
            file=sys.stderr,
        )
        return 1

    category, section = found
    current = section.get("body") or ""

    print(f"Catégorie : {category.get('title')}")
    print(f"Section   : #{section['id']} — {section.get('title')}")
    print(f"Corps actuel : {len(current)} caractères")
    print("─" * 60)
    print(current[:800] + ("…" if len(current) > 800 else ""))
    print("─" * 60)
    print("Nouveau corps :")
    print(BODY)

    if current.strip() == BODY.strip():
        print("\n✅ Déjà à jour, rien à faire.")
        return 0

    if not args.write:
        print("\n(aperçu — relancez avec --write pour appliquer)")
        return 0

    update = requests.put(
        f"{PR_API_URL}/site-content/sections/{section['id']}",
        json={"body": BODY},
        headers=service_auth_headers(),
        timeout=15,
    )
    if update.status_code >= 400:
        print(f"❌ {update.status_code} {update.text[:300]}", file=sys.stderr)
        return 1
    print("\n✅ Section mise à jour. Le guide est rendu par le serveur.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
