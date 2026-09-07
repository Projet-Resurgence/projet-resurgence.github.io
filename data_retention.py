"""Les durées de conservation, déclarées UNE fois et lues par les deux bouts.

**Pourquoi pas en base, et pas non plus en dur dans la page.** Une durée de
conservation n'est pas une donnée de jeu : c'est une règle. La mettre en base
la rendrait modifiable sans trace, or « qui a raccourci la conservation des
adresses IP, et quand » est précisément ce qu'on veut pouvoir montrer. L'écrire
en dur dans le HTML la ferait diverger du code qui purge — et **une politique
qui promet une durée que le code n'applique pas est pire que pas de politique**,
parce qu'elle transforme un oubli en engagement non tenu.

Elle est donc déclarée ici, en Python, versionnée avec le reste. La page de
confidentialité la RENDS depuis cette table, et la purge la LIT depuis la même.
Les deux ne peuvent plus se contredire : un test le vérifie.

**Ce que ce fichier ne fait pas.** Il ne purge rien. Déclarer une durée et
l'appliquer sont deux travaux ; celui-ci est le premier, et il rend le second
vérifiable. Une entrée dont `enforced` vaut `False` est une intention affichée
comme telle sur la page — pas une promesse déguisée.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Retention:
    """Une catégorie de données, sa durée, et ce qui la justifie."""

    #: Ce que le visiteur reconnaît — pas le nom de la table.
    label: str
    #: Où ça vit réellement, pour que la purge sache quoi viser.
    tables: tuple[str, ...]
    #: En jours. `None` = pas de durée fixe ; `kept_while` dit alors laquelle.
    days: int | None
    #: La finalité, au sens du RGPD : pourquoi on garde ça.
    purpose: str
    #: Ce qui arrive au terme de la durée. « Effacement » supprime la ligne ;
    #: « anonymisation » ne retire QUE ce qui vous désigne et laisse le reste.
    #: La distinction n'est pas cosmétique : `staff_audit_logs` est en
    #: append-only par contrat — on ne peut pas en supprimer une décision
    #: d'arbitrage, mais on peut en retirer l'adresse IP, qui est la seule
    #: partie qui vous concerne.
    mode: str = "effacement"
    #: La purge est-elle EN PLACE ? Tant qu'elle ne l'est pas, la page le dit.
    enforced: bool = False
    #: Obligatoire quand `days` est `None`. « Tant que le compte existe » et
    #: « indéfiniment, mais dissocié de vous » sont deux engagements très
    #: différents ; les confondre sous une formule unique en trahirait un.
    kept_while: str = ""


#: L'ordre de cette table est celui de la page : du plus sensible au moins.
RETENTIONS: tuple[Retention, ...] = (
    Retention(
        label="Adresses IP et navigateur des tentatives de connexion",
        tables=("failed_attempts",),
        enforced=True,
        days=90,
        purpose="Détecter et bloquer les attaques par force brute.",
    ),
    Retention(
        label="Adresse IP attachée à une décision du staff",
        tables=("staff_audit_logs",),
        enforced=True,
        days=365,
        mode="anonymisation",
        purpose="Rendre les décisions d'arbitrage vérifiables et "
                "contestables. Au-delà d'un an, la décision reste consultable "
                "mais l'adresse IP en est retirée : c'est la décision qui doit "
                "pouvoir être relue, pas la personne qui la subissait.",
    ),
    Retention(
        label="Journal d'administration du site",
        tables=("audit_logs",),
        enforced=True,
        days=365,
        purpose="Retrouver l'origine d'une modification administrative.",
    ),
    Retention(
        label="Bannissements d'adresses IP levés ou expirés",
        tables=("ip_bans",),
        enforced=True,
        days=365,
        purpose="Faire respecter une exclusion prononcée par le staff. Un "
                "bannissement toujours en vigueur n'est pas effacé — c'est "
                "sa levée ou son expiration qui déclenche le décompte.",
    ),
    Retention(
        label="Compte de joueur : identifiant Discord, pseudo, adresse e-mail",
        tables=("web_user_accounts",),
        days=None,
        kept_while="Tant que le compte existe",
        purpose="Vous identifier d'une session à l'autre et rattacher vos "
                "actions à votre pays.",
    ),
    Retention(
        label="Journal des actions de jeu",
        tables=("game_events",),
        days=None,
        kept_while="Sans limite, mais dissocié de vous à votre départ",
        purpose="Reconstituer l'économie du monde. Le bilan annuel relit ce "
                "journal : l'effacer fausserait l'histoire de tous les autres "
                "pays. À votre départ, le lien vers vous est coupé — "
                "l'événement reste, il ne vous nomme plus.",
    ),
    Retention(
        label="Messages privés et tickets d'assistance",
        tables=("conversation_messages", "conversations"),
        days=None,
        kept_while="Tant que le compte existe",
        purpose="Vous laisser relire vos échanges, et permettre au staff de "
                "relire un ticket clos.",
    ),
)


def months(days: int | None) -> str:
    """Une durée dite comme un humain la dirait."""
    if days is None:
        raise ValueError("une entrée sans `days` doit fournir `kept_while`")
    if days % 365 == 0:
        years = days // 365
        return "1 an" if years == 1 else f"{years} ans"
    if days % 30 == 0:
        return f"{days // 30} mois"
    return f"{days} jours"


def rows() -> list[dict]:
    """La table telle que la page l'affiche."""
    return [
        {
            "label": r.label,
            "duration": r.kept_while if r.days is None else months(r.days),
            "purpose": r.purpose,
            "mode": r.mode,
            "fixed": r.days is not None,
            "enforced": r.enforced,
            "tables": ", ".join(r.tables),
        }
        for r in RETENTIONS
    ]


def check() -> None:
    """Les invariants de la table, vérifiés par un test — et au démarrage.

    Une entrée sans durée fixe ET sans `kept_while` s'afficherait vide : la
    page annoncerait une conservation dont elle ne dit rien, ce qui est le seul
    résultat pire que d'annoncer une durée fausse.
    """
    for r in RETENTIONS:
        if r.days is None and not r.kept_while:
            raise ValueError(f"{r.label!r} : ni `days` ni `kept_while`")
        if r.days is not None and r.days <= 0:
            raise ValueError(f"{r.label!r} : durée non positive")
        if not r.tables:
            raise ValueError(f"{r.label!r} : aucune table visée")
        if r.mode not in ("effacement", "anonymisation"):
            raise ValueError(f"{r.label!r} : mode inconnu {r.mode!r}")


check()
