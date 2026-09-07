"""Qui édite le site, et qui l'héberge — les deux que la loi exige de nommer.

La LCEN (article 6-III) rend les mentions légales obligatoires pour tout site
français, et leur absence est la seule de ces obligations qui soit directement
sanctionnée. Elle demande deux identités distinctes, et on oublie
systématiquement la seconde : celle de l'HÉBERGEUR, avec son adresse et son
téléphone.

**Un éditeur non professionnel n'a pas à publier son identité civile.**
L'article 6-III-2 lui permet de ne mentionner que le nom de son hébergeur, à
condition d'avoir communiqué son identité complète à celui-ci — ce qu'un compte
OVH fait par construction. C'est le régime retenu ici : le domicile d'un
particulier n'a pas à être sur une page publique pour qu'un jeu de rôle
associatif soit en règle. Ce que la page doit malgré tout offrir, c'est un
**moyen de contact qui aboutit** : sans lui, le régime protecteur ne s'applique
plus, et il n'y a plus personne à qui signaler un contenu illicite.

`LEGAL_PUBLISHER_STATUS` choisit le régime. En `particulier`, un pseudonyme et
une adresse de contact suffisent à rendre la page complète. En `professionnel`,
la dispense tombe : il faut alors le nom, l'adresse et, le cas échéant, le
numéro RCS — et `complete` reste faux tant qu'ils manquent, parce qu'une
mention légale incomplète doit être un défaut visible, pas un blanc discret.
"""

from __future__ import annotations

import os

#: L'hébergeur. Ces coordonnées sont publiques et fixées par OVH ; les mettre
#: en dur évite qu'un déploiement mal configuré publie une page sans hébergeur,
#: ce qui est précisément l'infraction.
HOST = {
    "name": "OVH SAS",
    "address": "2 rue Kellermann, 59100 Roubaix, France",
    "phone": "1007",
    "site": "https://www.ovhcloud.com",
}


#: Le contact de repli. Une page sans aucun moyen de signalement est le seul
#: état vraiment fautif ; cette adresse existe déjà et est servie par le site,
#: donc mieux vaut la publier que laisser un blanc en attendant une variable.
FALLBACK_CONTACT = "contact@projet-resurgence.fr"


def publisher() -> dict:
    """L'éditeur, et ce qui manquerait pour que la page soit en règle."""
    status = os.getenv("LEGAL_PUBLISHER_STATUS", "particulier").strip().lower()
    name = os.getenv("LEGAL_PUBLISHER_NAME", "").strip()
    contact = os.getenv("LEGAL_PUBLISHER_CONTACT", "").strip() or FALLBACK_CONTACT
    address = os.getenv("LEGAL_PUBLISHER_ADDRESS", "").strip()
    registration = os.getenv("LEGAL_PUBLISHER_REGISTRATION", "").strip()

    individual = status != "professionnel"
    missing = []
    if not name:
        missing.append("LEGAL_PUBLISHER_NAME")
    if not individual and not address:
        # La dispense d'adresse ne vaut que pour un éditeur non professionnel.
        missing.append("LEGAL_PUBLISHER_ADDRESS")

    return {
        "name": name or "À RENSEIGNER — définissez LEGAL_PUBLISHER_NAME",
        "contact": contact,
        "address": address,
        "registration": registration,
        "status": status,
        "individual": individual,
        "missing": missing,
        "complete": not missing,
    }


#: Les tiers à qui des données transitent, que le RGPD demande de nommer.
PROCESSORS = (
    {
        "name": "Discord",
        "role": "Authentification et salons de jeu",
        "note": "Votre identifiant Discord est la clé de votre compte. "
                "Discord applique sa propre politique.",
    },
    {
        "name": "Cloudflare",
        "role": "Protection et acheminement du trafic",
        "note": "Les requêtes transitent par son réseau avant d'atteindre le "
                "serveur. Un cookie technique `__cf_bm` peut être déposé : il "
                "sert à distinguer un humain d'un robot, et rien d'autre.",
    },
    {
        "name": "OVHcloud",
        "role": "Hébergement",
        "note": "Le serveur et la base de données sont en France.",
    },
)
