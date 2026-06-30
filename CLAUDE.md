# resurgence-web – CLAUDE.md

Official website for Projet Résurgence Discord RP server. Static HTML/CSS/JS site at `projet-resurgence.fr`.

## Quick Facts

- **Type:** Static site (no build step, no framework)
- **Deployed via:** nginx Docker container (`Dockerfile` at root)
- **URL:** `https://projet-resurgence.fr`
- **Language:** French
- **Default theme:** Dark

## Directory Structure

```
resurgence-web/
├── index.html                  # Home page (hero, features, live stats, universe, FAQ, CTA)
├── regles.html                 # Game rules (static, anchor-linkable per category)
├── mecaniques.html             # Game systems/mechanics showcase (differentiation page)
├── guide.html                  # Player guide
├── ressources.html             # Resources/tools page
├── rp-geopolitique.html        # Geopolitical RP page
├── univers.html                # Universe/lore page
├── 404.html                    # Custom branded 404 page (served via nginx error_page)
├── sw.js                       # Service Worker (v1.3.0)
├── manifest.json               # PWA manifest
├── sitemap.xml                 # XML sitemap (7 URLs)
├── robots.txt                  # Robots directives
├── CNAME                       # GitHub Pages domain mapping
├── Dockerfile                  # nginx:alpine deployment
├── components/
│   ├── components.js           # ComponentManager loader (dynamic imports)
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
│   ├── stats-loader.js         # Fetches live counts from PR_API into [data-stat] elements
│   ├── seo-optimizer.js        # SEO utilities
│   ├── performance-optimizer.js # Performance utilities
│   └── universe-carousel.js    # Universe page carousel
├── scripts/
│   └── build-rules.mjs         # One-off authoring tool: rules/*.md -> static HTML pasted into regles.html
├── images/                     # Logos, banners (png/webp/avif)
├── fonts/
│   └── pressgothic.otf         # Custom title font
├── favicon/                    # favicons, apple-touch-icon, web-app-manifest icons
├── rules/                      # Rule markdown source files
└── context_datas/              # Context data files
```

## Architecture

### Loading Order (index.html)

1. **SW version check** (inline script) – compares `localStorage['sw-version']` to `v1.5.0`, clears caches + unregisters SW if mismatch
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
- Observed attribute: `current-page` (values: `home`, `server`, `universe`, `rules`, `guide`, `rp-geopolitique`, `resources`, `join`)
- Public API: `setActivePage(page)`, `setTheme(theme)`, `getCurrentTheme()`
- Mobile menu at breakpoint `1040px`, hamburger → X animation
- Theme persistence: `localStorage['resurgence-theme']`
- Dispatches `theme-changed` event (bubbles + composed) and `global-theme-change` on window

**`<resurgence-footer>`** – Shadow DOM, 4-column grid (project, quick links, support, community)
- Listens for `theme-changed` event
- Tracks footer link clicks via gtag

**ComponentManager** (`components.js`) – Global singleton `window.ResurgenceComponents`
- Registers custom elements, handles theme propagation
- `updatePageContext()` derives current page from `window.location.pathname`
- Theme utilities: `getCurrentTheme()`, `setTheme(theme)`

### Service Worker (`sw.js`)

- **Version:** `v1.5.0` (cache names: `static-v1.5.0`, `dynamic-v1.5.0`, `images-v1.5.0`)
- **Install:** Caches static assets + images, calls `skipWaiting()`
- **Activate:** Cleans old caches, calls `clients.claim()`
- **Fetch strategies:**
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
- **Sitemap:** 7 URLs (index, univers, regles, guide, rp-geopolitique, mecaniques, ressources)
- **robots.txt:** Allows all, disallows `/test-*`. Sitemap URL points to `https://projet-resurgence.fr/sitemap.xml` (NOT the old GitHub Pages domain)
- **Resource hints:** `preload` for font, main.css, logo, main.js; `prefetch` for regles.html, guide.html
- **Rules page (`regles.html`):** All 6 categories (hrp, rp, economique, technologique, militaire, territorial) are static HTML in the page itself — not fetched/rendered client-side. Deep-linkable via `#hrp #rp #economique #technologique #militaire #territorial`. Regenerate content with `node scripts/build-rules.mjs` after editing a `rules/*.md` file, then paste the printed HTML back into `regles.html`
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

**Dockerfile:** `nginx:alpine`, copies `resurgence-web/` to `/usr/share/nginx/html/`, removes dev files

**Nginx cache rules (baked into image):**
- `/sw.js` → `no-cache, no-store, must-revalidate` (CRITICAL: never cache)
- `/components/` → `no-cache, must-revalidate`
- `.(js|css|png|jpg|gif|ico|svg|woff|woff2|ttf|eot|webp|avif)` → `1y, public, immutable`
- `.html` → `no-cache, no-store, must-revalidate`

**Security headers:** X-Frame-Options SAMEORIGIN, X-Content-Type-Options nosniff, X-XSS-Protection, Referrer-Policy strict-origin-when-cross-origin

**Gzip:** Enabled for text/css/json/js/xml/svg, min 256 bytes

## PWA Manifest

- **Name:** "Projet Résurgence - RP Géopolitique Francophone Post-Apocalyptique"
- **Short name:** "Resurgence"
- **Theme color:** `#D5B654`
- **Background:** `#1a1a1a`
- **Icons:** 192x192, 512x512 (maskable), 144x144, 96x96
- **Screenshot:** 1280x720 banner
- **Categories:** games, social, entertainment

## Critical Rules for AI

1. **No build step** – All files are served as-is. Do not add bundlers, transpilers, or package managers
2. **SW version** is `v1.5.0` in both `sw.js` (CACHE_NAME/STATIC_CACHE/DYNAMIC_CACHE/IMAGE_CACHE) and the inline `SW_VERSION` script — **present in all 7 pages** (`grep -rln SW_VERSION *.html`), not just `index.html`. Update all of them together when changing SW
3. **Web components use Shadow DOM** – Styles inside components are scoped. Use CSS custom properties (`var(--*)`) for theming across shadow boundaries
4. **Theme localStorage key** is `resurgence-theme` (values: `dark` | `light`)
5. **Header component** uses `current-page` attribute for active nav highlighting. Page values: `home`, `server`, `universe`, `rules`, `guide`, `rp-geopolitique`, `mecaniques`, `resources`, `join`
6. **Font file** is `pressgothic.otf` – preload with `as="font" type="font/otf" crossorigin`
7. **Dockerfile removes** `.git`, `.vscode`, `test-results`, `test-scripts`, `CNAME`, `LICENSE`, `README.md`, `verify-seo.sh`, `analytics-report.txt` during build
8. **All analytics requires Axeptio consent** – `hasAnalyticsConsent()` checks `window.axeptio.getUserConsent()` before any tracking
9. **Nginx never caches sw.js** – changing SW requires no nginx config change, but update version in inline script to force client cache purge
10. **Cloudflare ignores origin no-cache headers for `/components/` and `/styles/`** — see dedicated section above. Any content change to a file under those paths needs its referencing `?v=` query string bumped in every HTML page that loads it, or Cloudflare can keep serving the old version indefinitely regardless of origin state. When in doubt, verify with a real browser against the live page (not a direct curl to the changed asset)
11. **Discord invite URL:** `https://discord.projet-resurgence.fr/`
12. **Contact email:** `contact@projet-resurgence.fr`
