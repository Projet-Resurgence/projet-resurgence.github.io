#!/usr/bin/env python3
"""Seed the editorial content of the site from the markdown still in the repo.

`/regles` is server-rendered from PR_API now, so a fresh database means an
empty règlement. This imports `rules/*.md` — the same files the old
`build-rules.mjs` pasted into the static page — into the `rules` space, one
category per file and one section per `## N. Titre` heading.

It is **idempotent by refusal**: a space that already has categories is left
alone. Re-seeding an edited règlement would silently discard the edits, so the
script makes you say so.

Usage (inside the container, so it inherits the service credentials):

    docker compose exec resurgence-web python scripts/seed_content.py
    docker compose exec resurgence-web python scripts/seed_content.py --force
"""

import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import requests  # noqa: E402

from pr_api_service_auth import service_auth_headers  # noqa: E402
from settings import BASE_DIR, PR_API_URL  # noqa: E402

CATEGORIES = [
    ("hrp", "hrp.md", "HRP (Hors Roleplay)", "💬",
     "Règles pour les discussions hors roleplay et la modération"),
    ("rp", "rp.md", "Roleplay", "🎭",
     "Directives pour le roleplay, création de nations et interactions RP"),
    ("economique", "economique.md", "Économique", "💰",
     "Mécaniques économiques, PIB, inflation et commerce"),
    ("technologique", "technologique.md", "Technologique", "⚙️",
     "Système de recherche, brevets et développement technologique"),
    ("militaire", "militaire.md", "Militaire & Conflits", "⚔️",
     "Règles concernant les guerres, batailles et opérations militaires"),
    ("territorial", "territorial.md", "Territorial", "🗺️",
     "Gestion des territoires, frontières et expansions géographiques"),
]

_SECTION_HEADING = re.compile(r"^##\s+(?P<title>.+?)\s*$", re.M)


def parse_sections(markdown: str):
    """`## N. Titre` starts a section; everything under it is its body.

    The `### N.N` subheadings stay inside the body — content_markdown.py
    renders them as the section's own subheadings, which is exactly how the
    old static page looked.
    """
    matches = list(_SECTION_HEADING.finditer(markdown))
    sections = []
    for index, match in enumerate(matches):
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(markdown)
        title = match.group("title")
        # Drop the leading "1. " — the page numbers chapters itself.
        title = re.sub(r"^\d+[.)]\s*", "", title)
        sections.append({"title": title, "body": markdown[start:end].strip()})
    return sections


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--force",
        action="store_true",
        help="seed even if the space already has categories (does NOT delete them)",
    )
    args = parser.parse_args()

    existing = requests.get(f"{PR_API_URL}/site-content/rules", timeout=15)
    existing.raise_for_status()
    categories = (existing.json().get("data") or {}).get("categories") or []
    if categories and not args.force:
        print(f"⚠️  L'espace « rules » contient déjà {len(categories)} catégorie(s).")
        print("   Rien n'a été fait. Relancez avec --force pour ajouter par-dessus.")
        return 0

    headers = service_auth_headers()
    rules_dir = Path(BASE_DIR) / "rules"
    created_categories = created_sections = 0

    for slug, filename, title, icon, description in CATEGORIES:
        source = rules_dir / filename
        if not source.is_file():
            print(f"   … {filename} absent, ignoré")
            continue

        resp = requests.post(
            f"{PR_API_URL}/site-content/rules/categories",
            json={
                "slug": slug,
                "title": title,
                "icon": icon,
                "description": description,
            },
            headers=headers,
            timeout=15,
        )
        if resp.status_code >= 400:
            print(f"❌ {title}: {resp.status_code} {resp.text[:200]}")
            continue
        category_id = resp.json()["data"]["id"]
        created_categories += 1

        for section in parse_sections(source.read_text(encoding="utf-8")):
            section_resp = requests.post(
                f"{PR_API_URL}/site-content/categories/{category_id}/sections",
                json=section,
                headers=headers,
                timeout=15,
            )
            if section_resp.status_code >= 400:
                print(f"   ❌ {section['title']}: {section_resp.status_code}")
                continue
            created_sections += 1

        print(f"✅ {title} — {len(parse_sections(source.read_text(encoding='utf-8')))} sections")

    print(f"\n{created_categories} catégories, {created_sections} sections importées.")
    print("Les autres espaces (« context », « forum_rp ») se remplissent depuis le site.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
