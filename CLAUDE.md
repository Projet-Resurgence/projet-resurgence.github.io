# resurgence-web – CLAUDE.md

Official website for Projet Résurgence Discord RP server. Static HTML/CSS/JS site at `projet-resurgence.fr`.

## Quick Facts

- **Type:** Static pages (no build step, no framework) served by a thin Flask app,
  plus three **server-rendered** editorial pages (`/regles`, `/univers`, `/forum-rp`)
- **Deployed via:** python:3.12-slim + gunicorn, listening on **port 80** (`Dockerfile` at root)
- **URL:** `https://projet-resurgence.fr`
- **Language:** French
- **Default theme:** Dark

## Directory Structure

```
resurgence-web/
├── app.py                      # Flask: serves the static pages + WebAuth SSO + calendar API
├── settings.py                 # Env config (WebAuth URLs, JWT secret, PR_API URL, service client)
│                               # NOTE: not config.py — .gitignore has `*config*`
├── pr_api_service_auth.py      # Cached PR_API service token (calendar admin writes only)
├── requirements.txt            # Flask, PyJWT, requests, gunicorn
├── auth_guard.py               # Site JWT + @require_auth / @require_admin (imported by app + blueprints)
├── content_api.py              # Editorial content blueprint: PR_API proxy + image uploads
├── content_markdown.py         # Discord-flavoured markdown -> HTML. THE renderer. See below.
├── index.html                  # Home page — « Atlas » layout, the world map is the page
├── calendrier.html             # Game calendar (moved here from Game-Dashboard) + admin editing
├── mecaniques.html             # Game systems/mechanics showcase (differentiation page)
├── guide.html                  # Player guide — five numbered steps
├── ressources.html             # Resources/tools page — dense table of the six tools
├── rp-geopolitique.html        # Geopolitical RP page
├── templates/                  # Jinja templates for the three editorial pages
│   ├── _vitrine_base.html      # <head>, analytics, header/footer shell
│   ├── _doc_layout.html        # THE documentation layout — règlement AND forum RP
│   ├── regles.html             # one line: extends _doc_layout.html
│   ├── forum-rp.html           # one line: extends _doc_layout.html
│   └── univers.html            # chronicle layout, same data shape
├── uploads/                    # (container only) the content_uploads volume mount
├── 404.html                    # Custom branded 404 page (served via nginx error_page)
├── sw.js                       # Service Worker (v1.8.0)
├── manifest.json               # PWA manifest
├── sitemap.xml                 # XML sitemap (9 URLs)
├── robots.txt                  # Robots directives
├── CNAME                       # GitHub Pages domain mapping
├── Dockerfile                  # python:3.12-slim + gunicorn on port 80
├── components/
│   ├── components.js           # ComponentManager loader (dynamic imports)
│   ├── auth.js                 # WebAuth SSO client (window.PRAuth) + header login wiring
│   ├── header-component.js     # <resurgence-header> web component
│   └── footer-component.js     # <resurgence-footer> web component
├── styles/
│   ├── theme.css               # CSS variables, breakpoints, typography, base styles
│   ├── critical.css            # Above-the-fold CSS (preloaded)
│   ├── main.css                # Main stylesheet
│   ├── main.js                 # ResurgenceWebsite class (analytics, animations, tracking)
│   ├── index.js                # IndexPage class (SW registration, IntersectionObserver)
│   ├── guide.css               # Guide page styles
│   ├── rules.css               # Rules page styles
│   ├── mecaniques.css          # Mécaniques page styles
│   ├── ressources.css          # Resources page styles
│   ├── calendar.css            # Calendrier page styles
│   ├── calendar.js             # Calendrier page logic (ES module, imports components/auth.js)
│   ├── vitrine.css             # « Atlas » design system (Archivo + IBM Plex) + .pr-content
│   ├── content-doc.js          # Documentation pages: search, TOC, scrollspy (enhancement only)
│   ├── content-admin.js        # Administrator editing layer (renders only for is_admin)
│   ├── content-draft.js        # Pure module: staged draft, diff, publish plan (tests/unit/js)
│   ├── stats-loader.js         # Fetches live counts from PR_API into [data-stat] elements
│   ├── seo-optimizer.js        # SEO utilities
│   ├── performance-optimizer.js # Performance utilities
│   └── universe-carousel.js    # Universe page carousel
├── scripts/
│   ├── build-rules.mjs         # Legacy authoring tool (the rules are in PR_API now)
│   └── seed_content.py         # Imports rules/*.md into the `rules` space on a fresh DB
├── images/                     # Logos, banners (png/webp/avif)
├── fonts/
│   └── pressgothic.otf         # Custom title font
├── favicon/                    # favicons, apple-touch-icon, web-app-manifest icons
├── rules/                      # Rule markdown source files
└── context_datas/              # Context data files
```

## Architecture

### Loading Order (index.html)

1. **SW version check** (inline script) – compares `localStorage['sw-version']` to `v1.7.0`, clears caches + unregisters SW if mismatch
2. **Google Tag Manager** – `GTM-PKRZXV9B`
3. **Axeptio consent** – `clientId: "68963e315d089c7b7334b5d1"`, Google Consent Mode enabled
4. **Google Analytics** – `G-5B3PEQ65HX`
5. **critical.css** – preloaded, async-loaded
6. **main.css** – includes theme.css variables
7. **Web components** – `<resurgence-header current-page="home">`, `<resurgence-footer>`
8. **Script load order:**
   - `components/components.js` (module, dynamic imports header/footer)
   - `styles/main.js` (ResurgenceWebsite class)
   - `styles/index.js` (IndexPage class, SW registration)
   - `styles/seo-optimizer.js`
   - `styles/performance-optimizer.js`

### Web Components

**`<resurgence-header current-page="...">`** – Shadow DOM, fixed header with navigation + theme toggle
- Observed attribute: `current-page` (values: `home`, `universe`, `rules`, `forum-rp`, `guide`, `rp-geopolitique`, `mecaniques`, `resources`, `calendar`, `join`)
- **Nav has one dropdown, « Documentation »**, holding Univers / Règlement / Forum RP —
  the three administrator-editable pages. The toggle itself reads as active when the
  current page is one of its items.
- **The dropdown menu is `position: fixed`, placed from JavaScript.** `<pr-site-header>`
  makes the slotted nav row `overflow-x: auto` so tabs scroll rather than wrap — that
  row clips on *both* axes, so an absolutely positioned menu inside it is cut off at the
  header's bottom edge and looks as if it slid under the page. Taking it out of flow is
  the only fix; `setupDropdowns()` writes its coordinates from the toggle's
  `getBoundingClientRect()` and re-writes them on scroll and resize. Pinned by
  `tests/regression/test_site_header_nav.py`.
- **« Rejoindre » is the Discord invite** (`https://discord.projet-resurgence.fr`), not an
  anchor on the home page. There is no « Le Serveur » tab — it only jumped to the home
  page's own hero.
- Public API: `setActivePage(page)`, `setTheme(theme)`, `getCurrentTheme()`
- No burger: `<pr-site-header>` scrolls the tab row horizontally when it overflows
- Theme persistence: `localStorage['resurgence-theme']`
- Dispatches `theme-changed` event (bubbles + composed) and `global-theme-change` on window

**`<resurgence-footer>`** – Shadow DOM, 4-column grid (project, quick links, support, community)
- Listens for `theme-changed` event
- Tracks footer link clicks via gtag

**ComponentManager** (`components.js`) – Global singleton `window.ResurgenceComponents`
- Registers custom elements, handles theme propagation
- `updatePageContext()` derives current page from `window.location.pathname`
- Theme utilities: `getCurrentTheme()`, `setTheme(theme)`

### Auth & backend (`app.py`)

The pages are still plain HTML; `app.py` only adds what a file server cannot do.

**WebAuth SSO** — same flow as calc./catalog./play.:

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/discord/url?next=/path` | GET | Builds the `auth.projet-resurgence.fr/sso/login` URL. `next` is site-relative only |
| `/callback` | GET | Resolves `sso_token` (query or `pr_sso_token` cookie) → site JWT → redirects to `next?token=` |
| `/api/auth/sso/bootstrap` | POST | Cookie-only: picks up a session started on another subdomain |
| `/api/auth/verify` | POST | Validates a site JWT |
| `/api/auth/logout` | GET | Clears the cookie, redirects to WebAuth `/sso/logout` |
| `/api/me/header` | GET | Country flag for the header cog (auth required) |

**Game calendar** — public reads, administrator writes:

| Route | Method | Auth | PR_API |
|---|---|---|---|
| `/api/calendar` | GET | public | `GET /game/dates` |
| `/api/pause-schedule` | GET | public | `GET /game/pause/schedule` |
| `/api/game-date` | GET | public | `GET /game/date` |
| `/api/playdays-per-month` | GET | public | `GET /game/playdays-per-month` |
| `/api/admin/pause-schedule` | PUT | **admin** | `PUT /game/pause/schedule` (service token) |
| `/api/admin/pause` | POST | **admin** | `POST /game/pause` (service token) |
| `/api/admin/playdays-per-month` | PUT | **admin** | `PUT /game/playdays-per-month` (service token) |
| `/api/admin/game-date/advance` | POST | **admin** | `POST /game/date/force-advance` (service token) |

`@require_admin` = valid site JWT **and** `is_admin` (which comes from the
WebAuth account payload: any `admin.*` scope). The client-side `isAdmin()` only
decides whether to render the panel — never trust it alone.

**Client side:** `components/auth.js` exports `ready/getUser/isAdmin/apiFetch/login/logout`
and also publishes them as `window.PRAuth`. `header-component.js` calls
`attachHeaderAuth(this)` so the Connexion button and the cog identity work on
every page. Token lives in `localStorage['pr_web_token']`.

**Environment (root `.env`):** `RESURGENCE_WEB_PUBLIC_URL`,
`RESURGENCE_WEB_WEBAUTH_URL` (internal `http://webauth:5002`),
`RESURGENCE_WEB_WEBAUTH_PUBLIC_URL`, `RESURGENCE_WEB_PR_API_URL` (internal
`http://pr-api:5000`), `RESURGENCE_WEB_JWT_SECRET`, `RESURGENCE_WEB_SECRET_KEY`,
`RESURGENCE_WEB_PR_API_CLIENT_ID` / `_SECRET`. Create the service client with
`docker compose exec pr-api python add_resurgence_web_client.py` — it holds
`admin.game.pause_schedule`, `admin.game.pause_resume`,
`admin.game.advance_time`, `admin.game.change_settings`,
`admin.content.manage` and nothing else. Re-run that script after adding a
scope: it converges an existing client's scope list and leaves the secret alone.

### Editorial content: règlement, univers, forum RP

The three pages an administrator can write are **not files**. Their text lives
in PR_API (`site_content_categories` / `site_content_sections`, three *spaces*)
and is rendered here, server-side, on every request.

| Page | Space | Template | Layout |
|---|---|---|---|
| `/regles` | `rules` | `templates/regles.html` | `_doc_layout.html` |
| `/forum-rp` | `forum_rp` | `templates/forum-rp.html` | `_doc_layout.html` (**the same file**) |
| `/univers` | `context` | `templates/univers.html` | chronicle layout, same data |

**The forum RP and the règlement share one template on purpose.** The
requirement was that the forum RP's presentation follow the règlement's
exactly; the only way to keep that true through future edits is for neither
page to own a layout. Both `templates/regles.html` and `templates/forum-rp.html`
are a single `{% extends "_doc_layout.html" %}` line, and
`tests/regression/test_site_content_invariants.py` fails if either grows a
`{% block content %}`.

**Server-rendered, deliberately.** The old `regles.html` pasted every rule in as
static HTML so crawlers and no-JS readers saw the whole règlement on first
paint. That guarantee is kept — the source moved, the rendering point did not.
`content-doc.js` (search, summary, scrollspy) and `content-admin.js` (editing)
are both pure enhancement.

| Route | Method | Auth | PR_API |
|---|---|---|---|
| `/api/content/<space>` | GET | public | `GET /site-content/<space>` |
| `/api/content/media` | GET | public | `GET /site-content/media` |
| `/uploads/<filename>` | GET | public | — (the volume) |
| `/api/content/preview` | POST | **admin** | — (renders locally) |
| `/api/admin/content/<space>/categories` | POST | **admin** | create a category |
| `/api/admin/content/categories/<id>` | PUT / DELETE | **admin** | edit / delete |
| `/api/admin/content/<space>/categories/reorder` | POST | **admin** | reorder |
| `/api/admin/content/categories/<id>/sections` | POST | **admin** | create a section |
| `/api/admin/content/sections/<id>` | PUT / DELETE | **admin** | edit / delete |
| `/api/admin/content/categories/<id>/sections/reorder` | POST | **admin** | reorder |
| `/api/admin/content/media` | POST | **admin** | upload + register |
| `/api/admin/content/media/<id>` | DELETE | **admin** | unregister + unlink |

#### Editing is staged, never on-the-fly

« Mode édition » turns the page itself into the editor: every `[data-field]`
element becomes an editor for that exact column — a text field becomes a
`contenteditable`, a markdown field (`summary`, `body`, `callout_body`) becomes
a textarea driven by `rp-text-block`. There is no per-field « modifier » step.

**Nothing is written while you type.** Each edit is staged in
`localStorage['pr_content_draft:<space>']` by `content-draft.js`, so a closed
tab, a crash or a reload loses nothing, and `beforeunload` warns on a real
close. A value that comes back to its published text un-stages itself, so the
counter only ever shows real changes. « Publier… » first shows a GitHub-style
diff of every staged field (`diffLines` + `collapse`), and only then walks
`plan(draft)` — fields first, reordering last — sending **one partial PUT per
changed field set**, which is why a concurrent edit to another column survives.
« Annuler » drops the draft.

Create and delete stay immediate: they mint or destroy an id, which a draft of
values cannot represent. Creation therefore asks for a title only — everything
else is typed into the page.

`content-draft.js` is pure (no DOM, no network) and is tested in JavaScript by
`tests/unit/js/content_draft.test.mjs`, hung off pytest by
`tests/unit/test_content_draft_js.py`. The test image installs node for it.

Reordering is drag-and-drop in the navigation column, armed by the grip left of
each name, and staged like everything else. On `/univers` the featured
chronicle is not in the rail, so edit mode completes the rail with every
missing chapter — otherwise the first chronicle could never be moved.

#### `content_markdown.py` is the only renderer

Bodies are stored as Discord-flavoured markdown and rendered **in Python, in
one place**. The editor's live preview POSTs to `/api/content/preview` rather
than shipping a second implementation in JavaScript — two renderers drift, and
the one in the browser is the one nobody audits.

Its security model: escape the input **first**, then emit a fixed set of tags
from parsed structure. No stored string ever reaches the page as markup, so a
body written by an administrator — or by anyone who ever gets hold of an admin
session — cannot inject script. URLs are filtered to `http(s)` and
site-relative; `javascript:`, `data:` and protocol-relative `//host` all
degrade to inert text.

Syntax: `**gras**`, `*ital*`, `__souligné__`, `~~barré~~`, `||spoiler||`,
`` `code` ``, ``` ```blocs``` ```, `#`/`##`/`###` (rendered as `h3`/`h4`/`h5` —
the section already owns the `h3` above them), `-`/`1.` lists, `>` citations,
`---`, `[texte](url)`, plus three media markers:

```
![texte alternatif](/uploads/xxx.png)          image
!video[titre](https://youtube.com/watch?v=…)   lecteur intégré
!embed[titre](https://…)                       carte de lien
!commands[all]                                 guide des commandes des bots
```

Les trois marqueurs média acceptent une **taille facultative** en fin de
parenthèse — `(url =640)` fixe la largeur affichée, `(url =640x360)` fixe en
plus le rapport d'un lecteur vidéo (l'iframe porte `aspect-ratio: 16/9` par
défaut, donc le rapport va sur elle, pas sur la figure). Un suffixe qui ne
s'analyse pas laisse la ligne en texte brut plutôt que de mettre `x.png =gros`
dans un attribut `src`. Les dialogues « image / vidéo / lien » de
`rp-text-block` exposent les champs correspondants.

`!video` et `!embed` posés **au milieu d'une phrase** (et non sur leur propre
ligne) deviennent un simple lien : un lecteur intégré n'a pas de sens en plein
paragraphe. Sans cette règle, `_INLINE_LINK` attrapait le `[titre](url)` et
laissait `!embed` en toutes lettres devant le lien — ce qui est arrivé en
production sur le règlement.

**Only YouTube, Vimeo and Dailymotion are ever put in an `<iframe>`.** Any other
host asked for as a video renders as a link card instead — an editor must not be
able to frame an arbitrary origin into this site's own page. The nginx
`frame-src` allow-list and the renderer's provider list are checked against each
other by a regression test.

#### Le guide des commandes est généré depuis le code des bots

La section « Guide des commandes des bots C.L.E.A. et M.A.R.C. » du forum RP
était écrite à la main : une soixantaine d'entrées, dont plusieurs sous des noms
qui n'existent pas (`chech_debt`, `check_infrasurcture`), pendant que les deux
bots en exposent 170. Une page de référence qui ment est pire qu'absente.

Le guide est maintenant **généré** :

```bash
python3 scripts/generate_bot_command_guide.py          # écrit le JSON
python3 scripts/generate_bot_command_guide.py --check   # dérive ? (le test)
```

Le script lit les cogs de `bots/CLEA/src/cogs`, `bots/MARC/src/cogs` et
`bots/commons/cogs` **par AST, sans jamais les importer** — un import exigerait
`discord`, les venvs des bots et une base, donc le générateur ne tournerait ni
en CI ni dans l'image de test. Il en tire `data/bot_commands.json`, commité, que
`bot_commands.py` charge et rend là où un corps de section contient
`!commands[…]`. La portée vaut `all`, une clé de bot (`clea`, `marc`) ou des
clés de catégorie.

Trois choses ne se négocient pas :

* **Commandes joueur uniquement.** Est classée staff — donc jamais publiée —
  toute commande portant `has_permissions`, appelant `is_authorized` /
  `is_military_expert` / `is_admin` / `is_staff`, préfixée `admin_`, venant du
  cog `admin_utilities`, comparant `ctx.author.id` à un identifiant en dur, ou
  se disant « owner only ». Cette dernière règle existe parce que `execute_cmd`
  — qui fait un `exec()` du message — a figuré dans le premier JSON généré.
* **Un cog sans libellé français fait échouer la génération.** Sinon une
  nouvelle catégorie arriverait sur le site public sous son nom de fichier.
* **Le corps de section reste une donnée éditable** (règle 6b) : l'administrateur
  écrit son introduction autour du marqueur depuis le site. Seule la liste est
  mécanique.

Le fichier JSON est un **input de build invisible** : le `.gitignore` de ce
service contient un `*json` nu, d'où la négation `!data/bot_commands.json` et le
garde-fou dans `tests/regression/test_build_inputs.py` (règle 16 du CLAUDE.md
racine, quatrième occurrence de ce piège). `tests/unit/test_bot_command_guide_is_current.py`
échoue si le JSON ne correspond plus aux cogs — relancez le générateur après
avoir touché une commande.

`styles/command-guide.js` n'ajoute que la recherche, les filtres par bot et la
copie d'un exemple : chaque commande est un `<details>` natif, donc le guide est
complet et repliable JavaScript coupé. Installer le marqueur dans la vraie
section :

```bash
docker compose exec resurgence-web python scripts/set_command_guide_section.py          # aperçu
docker compose exec resurgence-web python scripts/set_command_guide_section.py --write
```

#### Image uploads

The bytes go to `UPLOADS_DIR` (the `content_uploads` **volume**, `/app/uploads`
in the container) and PR_API only stores a registry row. The stored name is
generated here (`<32 hex>-<slug>.<ext>`); the client's filename never decides
where anything lands, and `/uploads/<name>` refuses to serve anything that does
not match that shape.

The declared content-type is a hint — **the magic bytes decide**. PNG, JPEG,
WebP, GIF and AVIF only. SVG is refused: it is an XML document that can carry
script, and it would be served from this site's own origin. If the registry
call fails, the file is deleted rather than left as an orphan.

#### Seeding a fresh database

`/regles` starts empty. `rules/*.md` is kept in the repo as the seed source:

```bash
docker compose exec resurgence-web python scripts/seed_content.py
```

It refuses to run against a space that already has categories (`--force` to
override) — re-seeding an edited règlement would silently discard the edits.

#### Aperçu au survol d'un hyperlien (`link_preview.py` + `styles/link-preview.js`)

Hovering a link inside `.pr-content` shows a card with the target's title,
description and banner. Internal anchors are described from the page itself
with no network call; external links go through two routes:

| Route | Answers |
|---|---|
| `GET /api/link-preview?url=` | `{ title, description, site_name, host, image, icon }` |
| `GET /api/link-preview/image?url=` | the banner bytes, keyed by the **page** URL |
| `GET /api/link-preview/icon?url=` | the favicon bytes, same key, same guards |

This is the only place resurgence-web fetches a URL somebody else chose, so it
is the site's SSRF surface — this container reaches PR_API, the database and
the bots by hostname. Four things hold it shut, and none are decorative:

- **Address guard.** http/https only; the host is resolved and *every* address
  it answers with must be public unicast (a split public/loopback answer is
  refused — that is DNS rebinding). Re-checked on each redirect hop, max 3
  hops, 4 s timeout, 512 KB read cap, `trust_env = False`.
- **Allow-set.** Only hosts that the published content already links to may be
  previewed, derived from PR_API's three spaces on a 10-minute TTL. An
  administrator adding a link is enough; there is no second list.
- **The banner and the favicon are proxied, never hot-linked.** The vhost CSP is
  `img-src 'self' …` with no blanket `https:`, and hot-linking would hand every
  reader's IP to the linked site. The third-party image address stays
  server-side (`image_src`); the browser only ever sees our own path. The image
  routes are keyed by the *page* URL, so they cannot be pointed at an arbitrary
  target, and the content-type must really be an image. **The banner route
  accepts `image/svg+xml`** (unlike uploads, `content_api.py`) — every page's
  `og:image` is one of the `images/banners/*.svg` line-art files, and a
  browser never executes script inside an SVG reached via `<img src>`, only
  via inline/`<object>`/navigation. The favicon route stays PNG/JPEG/WebP/
  GIF/AVIF/ICO only; no page needs an SVG favicon here.
- **No second renderer.** The endpoint returns text; the card is filled with
  `textContent`. Rule 16 holds — `content_markdown.py` stays the only renderer.

Previews, banners and favicons are cached in-process (6 h; failures 15 min, so
a dead host is not refetched on every hover).

**Un lien interne montre la bannière de la page visée.** Le document est déjà
récupéré pour en tirer le titre et la première phrase : `ownImages()` y lit
aussi `og:image` et `link[rel~="icon"]`. Chaque page éditoriale déclare la
sienne (`og_image` dans `_EDITORIAL_PAGES`, fichiers `images/preview/*.jpg`),
donc les variantes suivent sans table de correspondance côté client. Seul le
**chemin** de l'`og:image` est gardé : il est absolu sur le domaine public,
et `img-src 'self'` le rejetterait ailleurs (stack locale, préproduction).

### Calendrier (`calendrier.html`)

Moved here from the Game-Dashboard "Calendrier" tab (which no longer exists —
`/calendrier` on `play.` is gone). Same rendering logic, restyled onto this
site's theme tokens, plus an administration card that only an administrator
sees: pause/resume the RP, announce a resume date, edit playdays-per-month,
force-advance a playday.

Day notes stay device-local (`localStorage['pr_calendar_notes']`) — they were
never server-side.

### Service Worker (`sw.js`)

- **Version:** `v1.8.0` (cache names: `static-v1.8.0`, `dynamic-v1.8.0`, `images-v1.8.0`)
- **Install:** Caches static assets + images, calls `skipWaiting()`
- **Activate:** Cleans old caches, calls `clients.claim()`
- **Fetch strategies:**
  - `/api/` + `/callback` → bypassed entirely (never cached)
  - `/components/` + `/sw.js` → network-first
  - `destination=image` → cache-first
  - `destination=script|style` → cache-first
  - `destination=document` → network-first
  - fallback → cache-first
- **Offline fallback:** Returns `/index.html` for document requests
- **Push notifications:** Supported (logo icon)
- **Background sync:** `analytics-sync` tag (stub implementation)

### Theme System

All CSS variables defined in `styles/theme.css`:

| Variable | Dark (default) | Light |
|---|---|---|
| `--primary-gold` | `#D5B654` | (same) |
| `--bg-primary` | `#0f0f0f` | `#f7f8f9` |
| `--bg-secondary` | `#1a1a1a` | `#ffffff` |
| `--bg-tertiary` | `#2d2d2d` | `#e9ecef` |
| `--text-primary` | `#f8f9fa` | `#1a202c` |
| `--text-secondary` | `#e0e0e0` | `#4a5568` |
| `--text-muted` | `#a0a0a0` | `#718096` |

Page width lives in two variables, not in per-page rules:

| Variable | Where | Meaning |
|---|---|---|
| `--v-shell` (`vitrine.css`) | `.v-shell`, `.v-doc` | Outer gabarit of the « Atlas » pages — 1440px |
| `--v-measure` (`vitrine.css`) | `.pr-content > p`, `.pr-content-list` | Reading measure of rendered markdown — 100ch |
| `--container-max-width` (`theme.css`) | `.container` | Same gabarit for the pages that predate « Atlas » (`rp-geopolitique`, `404`). It used to be `100%`, which glued them to the screen edges |

Widen a page by moving one of these, never by adding a `max-width` to a page's
own rule — that is how the règlement ended up reading on a third of the screen
while `rp-geopolitique` ran edge to edge.

- Theme activated via `[data-theme="light"]` selector override
- Default theme is dark (`<html data-theme="dark">`)
- Font: `PressGothic` (custom, `fonts/pressgothic.otf`) for titles, `system-ui` stack for body

### Breakpoints

| Name | Value |
|---|---|
| xs | 400px |
| sm / mobile | 480px |
| md / tablet | 768px |
| lg / desktop | 1040px |
| xl / wide | 1200px |

### Analytics & Tracking

- **GTM:** `GTM-PKRZXV9B` (dataLayer)
- **GA4:** `G-5B3PEQ65HX`
- **Consent:** Axeptio (`window.axeptio.getUserConsent()`) – tracking blocked without consent
- **Tracked events:** clicks, CTA performance, scroll depth (25/50/75/90/100%), section view time, navigation clicks, mobile menu toggle, theme toggle, Discord invite clicks, page visibility, time on page, rage clicks (3+ clicks/sec), JS errors
- **Event method:** `ResurgenceWebsite.trackEvent(eventName, properties)` → pushes to dataLayer with `custom_event` schema

### SEO

- **Meta:** Full Open Graph + Twitter Card + JSON-LD (Organization, WebSite, Game schemas)
- **Sitemap:** 9 URLs (index, univers, regles, forum-rp, guide, rp-geopolitique, mecaniques, ressources, calendrier)
- **robots.txt:** Allows all, disallows `/test-*`. Sitemap URL points to `https://projet-resurgence.fr/sitemap.xml` (NOT the old GitHub Pages domain)
- **Resource hints:** `preload` for font, main.css, logo, main.js; `prefetch` for regles.html, guide.html
- **Rules page (`/regles`):** still fully present on first paint — but **server-rendered from PR_API**, not pasted into the file. Same guarantee, different source: a crawler and a reader with JavaScript off both get every chapter. Deep-linkable via the category slug (`/regles#roleplay`) and the section slug (`/regles#roleplay-credibilite`)
- **Live stats (`styles/stats-loader.js`):** fetches `https://api.projet-resurgence.fr/statistics/public-overview` and fills any `[data-stat]` element (used on `index.html`'s stats grid and `mecaniques.html`'s tech section). Falls back silently to the static number already in the HTML on fetch failure — never leave `[data-stat]` elements without a static fallback value
- **Google site verification:** `LMfrQYr-Zjgp6F8FUXlE1wKl0ItR2UIGTg6-TUhgy30`
- **Canonical:** `https://projet-resurgence.fr/`
- **Hreflang:** `fr` + `x-default`

### ⚠️ Cloudflare caches `/components/` and `/styles/` JS despite origin no-cache headers

**Incident (2026-06-30):** The intersite-navbar was redesigned and redeployed (new origin
content, verified correct via direct curl/docker exec). Visitors kept seeing the **old**
navbar for hours, even after clearing cookies/site data and hard-refreshing. Root cause:
Cloudflare's edge was caching `/components/components.js?v=1.6.0` (`cf-cache-status: HIT`,
`last-modified` from **47 days earlier**) — it completely ignored the origin's
`no-cache, no-store, must-revalidate` header documented below. That stale `components.js`
still contained `await import('./intersite-navbar.js?v=1.0.0')` (the original pre-redesign
import), so browsers never even requested the new file — clearing local
cookies/SW/cache does nothing for an edge-cached response the browser hasn't seen yet.

**Why this is sneaky:** testing a versioned static asset URL directly (e.g.
`intersite-navbar.js?v=1.5.0`) will correctly show `cf-cache-status: MISS` and fresh
content — that only proves the file exists correctly on the server, **not** that any page
actually requests that URL. The actual page flow can still be stuck loading an old cached
wrapper script that references an old version string, entirely bypassing the new file.
Verify with a real browser hitting the real page (Playwright is fine), not a direct curl
to the asset you just changed.

**The fix:** bump the `?v=` query string on `<script src="./components/components.js?v=X">`
in **every** HTML page (`grep -rln "components.js?v=" *.html`) whenever `components.js`'s
*content* changes — including indirectly, e.g. when it imports a different version of
`intersite-navbar.js`. A new query string is a new Cloudflare cache key → guaranteed
origin fetch. Bumping only the *imported* file's own `?v=` is not enough if the *importer*
(`components.js`) is itself stale-cached.

**This is systemic, not a one-off:** the same applies to every file under `/components/`
and `/styles/` (`header-component.js`, `footer-component.js`, `main.js`, `index.js`,
`seo-optimizer.js`, `performance-optimizer.js`, `stats-loader.js`, `universe-carousel.js`).
Most of these have **no** `?v=` query at all, meaning Cloudflare can cache them
indefinitely by bare path with no way to force-bust short of a Cloudflare dashboard cache
purge. `/sw.js` is the one exception that reliably bypasses Cloudflare (`cf-cache-status:
BYPASS`), which is why the `SW_VERSION` self-purge mechanism (below) exists at all — it's
the only mechanism in this site that's guaranteed to actually reach already-loaded clients.
**Real fix (not yet done):** a Cloudflare Cache Rule for `/components/*` and `/styles/*`
that honors origin `Cache-Control` (or forces bypass, like `/sw.js` already has) — outside
of what's controllable from this repo.

### Docker / Nginx

**Dockerfile:** `python:3.12-slim`, copies `resurgence-web/` to `/app/`, installs
`requirements.txt`, runs `gunicorn -w 2 -b 0.0.0.0:80 app:app`. Port **80** is
deliberate — the root nginx vhost proxies to `resurgence-web:80`.

**Cache rules (now in `app.py`'s `after_request`, previously nginx):**
- `/sw.js` → `no-cache, no-store, must-revalidate` (CRITICAL: never cache)
- `/components/` → `no-cache, must-revalidate`
- `.(js|css|png|jpg|gif|ico|svg|woff|woff2|ttf|eot|webp|avif)` → `1y, public, immutable`
- `.html` → `no-cache, no-store, must-revalidate`

Plus `no-store` on any 4xx (so a missing `.js` is not cached for a year) and on
`/api/*` + `/callback`.

**Security headers:** the outer nginx vhost owns HSTS/CSP/X-Frame-Options;
`app.py` adds `X-Content-Type-Options` and `Referrer-Policy` as a floor.

## PWA Manifest

- **Name:** "Projet Résurgence - RP Géopolitique Francophone Post-Apocalyptique"
- **Short name:** "Resurgence"
- **Theme color:** `#D5B654`
- **Background:** `#1a1a1a`
- **Icons:** 192x192, 512x512 (maskable), 144x144, 96x96
- **Screenshot:** 1280x720 banner
- **Categories:** games, social, entertainment

## Critical Rules for AI

1. **No build step** – All front-end files are served as-is. Do not add bundlers, transpilers, or package managers. `app.py` serves them; it is not a framework for the pages
2. **SW version** is `v1.8.0` in both `sw.js` (CACHE_NAME/STATIC_CACHE/DYNAMIC_CACHE/IMAGE_CACHE) and the inline `SW_VERSION` script — **present in all 8 pages** (`grep -rln SW_VERSION *.html`), not just `index.html`. Update all of them together when changing SW
3. **Web components use Shadow DOM** – Styles inside components are scoped. Use CSS custom properties (`var(--*)`) for theming across shadow boundaries
4. **Theme localStorage key** is `resurgence-theme` (values: `dark` | `light`)
5. **Header component** uses `current-page` attribute for active nav highlighting. Page values: `home`, `universe`, `rules`, `forum-rp`, `guide`, `rp-geopolitique`, `mecaniques`, `resources`, `calendar`, `join`
6. **Font file** is `pressgothic.otf` – preload with `as="font" type="font/otf" crossorigin`
7. **Dockerfile removes** `.git`, `.vscode`, `test-results`, `test-scripts`, `CNAME`, `LICENSE`, `README.md`, `verify-seo.sh`, `analytics-report.txt` during build. The Python sources stay in the image (they run it) but `app.py` refuses to serve them — add any new source file to `_PRIVATE_FILES`
8. **All analytics requires Axeptio consent** – `hasAnalyticsConsent()` checks `window.axeptio.getUserConsent()` before any tracking
9. **sw.js is never cached** – changing SW requires no nginx config change, but update version in inline script to force client cache purge
10. **Cloudflare ignores origin no-cache headers for `/components/` and `/styles/`** — see dedicated section above. Any content change to a file under those paths needs its referencing `?v=` query string bumped in every HTML page that loads it, or Cloudflare can keep serving the old version indefinitely regardless of origin state. When in doubt, verify with a real browser against the live page (not a direct curl to the changed asset)
11. **Discord invite URL:** `https://discord.projet-resurgence.fr/`
12. **Contact email:** `contact@projet-resurgence.fr`
13. **Never trust `isAdmin()` client-side** – it decides what to *render*. Every game-editing route is gated server-side by `@require_admin`, and PR_API re-checks the service-token scope on top
14. **`RESURGENCE_WEB_PR_API_URL` must stay `http://pr-api:5000`** – the external URL goes through Cloudflare, which challenges server-to-server requests
15. **The Service Worker must never cache `/api/*` or `/callback`** – the bypass is the first branch of the `fetch` handler in `sw.js`
16. **`content_markdown.py` is the only renderer.** The editor previews through `/api/content/preview`; never add a JavaScript markdown renderer to "avoid the round trip" — the two would drift, and the browser's copy is the unaudited one
17. **Uploaded images belong to the `content_uploads` volume, never the image.** resurgence-web is auto-deployed: anything written to the image layer is wiped on every release, silently
18. **Never widen the video allow-list without widening `frame-src`, and never widen `frame-src` without a reason.** An editor being able to frame an arbitrary origin into this page is a hole, not a feature
20. **The bot command guide is generated, never typed.** Touch a cog, rerun `scripts/generate_bot_command_guide.py`; a staff command must never appear in it
19. **The forum RP has no template of its own.** It extends `_doc_layout.html` unchanged; that is what makes "same presentation as the règlement" survive future edits
