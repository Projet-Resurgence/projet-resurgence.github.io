/**
 * PrSiteHeader — Shared site header for Projet Résurgence apps.
 * Zero dependencies. Vanilla JS Web Component with Shadow DOM.
 *
 * Fully self-contained sizing/colors (own fixed dark/light palette, not
 * inherited from the host page's CSS vars) so the header renders pixel-
 * identical — same height, same font sizes — on every app that mounts it.
 *
 * Layout is a single row:
 *   [navbar arrow] [logo] [title/subtitle] [country ident] [nav slot]
 *   [actions slot] [cog dropdown]
 *
 * Usage:
 *   <pr-site-header title="Game Dashboard" theme-key="gd-theme">
 *     <nav slot="nav">...page tabs...</nav>
 *     <div slot="actions">...login button / page actions...</div>
 *     <button slot="menu" onclick="...">Extra cog item</button>
 *   </pr-site-header>
 *   <script type="module" src="/static/site-header.js"></script>
 *
 * Slotted content stays in the light DOM, so the host page's own CSS and
 * scripts keep working on it unchanged.
 *
 * Cog dropdown (always rendered, far right): optional `slot="menu"` items
 * first, then the built-in "Jour / Nuit" theme item, then "Déconnexion"
 * (hidden until setLoggedIn(true) / setUser()). Logout dispatches a
 * bubbling composed `pr-logout` event — each app implements its own
 * logout flow in a document-level listener.
 *
 * Country identity: call `setUser({country_name, country_id, flag_url})`
 * (merges with previous calls, so the flag can arrive later) to show the
 * flag + name + (id) block next to the brand, with a ‹› collapse toggle
 * persisted in localStorage.
 *
 * Requires a sibling `<intersite-navbar hide-toggle current-site="...">` on
 * the page — this component's arrow button calls its public toggle() API.
 *
 * The "· 2308" RP year in the subtitle is fetched from `year-endpoint`
 * (default /api/game/date) and cached in sessionStorage, so every app shows
 * the same live year without per-app glue code.
 */

const YEAR_CACHE_KEY = 'pr-site-header-rp-year';
const IDENT_COLLAPSE_KEY = 'pr-header-ident-collapsed';

// Inline SVG path fragments (feather-style, stroke currentColor) — the shadow
// tree is out of reach of each app's icons.js hydration.
const ICON_PATHS = {
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
  'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  'chevrons-lr': '<polyline points="9 7 4 12 9 17"/><polyline points="15 7 20 12 15 17"/>',
};

function iconSvg(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name]}</svg>`;
}

const CSS = `
:host {
  all: initial;
  display: block;

  /* The header must stick to the top of the *page*, so the sticky element
     has to be this host (the element actually in the page's flow) — not a
     div inside the shadow tree, whose containing block is this host and
     which therefore scrolls away with it. */
  position: sticky;
  top: 0;
  z-index: 100;

  font-family: 'Inter', system-ui, -apple-system, sans-serif;

  /* Fixed palette — dark by default, overridden by [data-theme="light"]
     below. Deliberately NOT inherited from the host page so every app
     renders this header identically regardless of its own token names. */
  --_gold: #D5B654;
  --_gold-subtle: rgba(213, 182, 84, 0.12);
  --_bg-header: rgba(14, 14, 14, 0.92);
  --_bg-raised: #1e1e1e;
  --_bg-hover: #2d2d2d;
  --_border-gold: rgba(213, 182, 84, 0.4);
  --_border-mid: rgba(255, 255, 255, 0.12);
  --_text-secondary: #c0c0c0;
  --_text-muted: #808080;
  --_danger: #ef4444;
}

:host([data-theme="light"]) {
  --_bg-header: rgba(255, 255, 255, 0.92);
  --_bg-raised: #ffffff;
  --_bg-hover: #eef1f4;
  --_border-mid: rgba(0, 0, 0, 0.14);
  --_text-secondary: #4a5568;
  --_text-muted: #718096;
}

svg { width: 1em; height: 1em; }

.site-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-height: 64px;
  padding: 0 1.5rem;
  background: var(--_bg-header);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--_border-gold);
  box-sizing: border-box;
}

.brand-group {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
  flex-shrink: 0;
}

/* ── Embedded intersite-navbar arrow — sits left of the logo, replacing
   the floating tab so no layout gap is reserved anywhere on the page. ── */
.nav-toggle {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 2px solid var(--_gold);
  background: var(--_bg-raised);
  color: var(--_gold);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.15s, transform 0.15s;
  outline: none;
}

.nav-toggle:hover { background: var(--_bg-hover); transform: scale(1.06); }
.nav-toggle:focus-visible { box-shadow: 0 0 0 2px var(--_gold); }

.nav-toggle .arrow {
  font-size: 15px;
  line-height: 1;
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.nav-toggle[aria-expanded="true"] .arrow { transform: rotate(180deg); }

a.brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  min-width: 0;
}

.brand-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  background: var(--_gold-subtle);
  border: 1px solid var(--_border-gold);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.brand-icon img {
  width: 26px;
  height: 26px;
  object-fit: contain;
  display: block;
}

.brand-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.2;
}

.brand-title {
  font-family: 'Rajdhani', system-ui, sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--_gold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.brand-subtitle {
  font-size: 0.65rem;
  color: var(--_text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}

/* ── Country identity (flag + name + id), shown after setUser() ── */
.country-ident {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
  flex-shrink: 0;
  padding-left: 0.6rem;
  border-left: 1px solid var(--_border-mid);
}

.country-ident[hidden] { display: none; }

.ci-flag {
  width: 24px;
  height: 16px;
  object-fit: cover;
  border-radius: 3px;
  flex-shrink: 0;
}

.ci-name {
  font-family: 'Rajdhani', system-ui, sans-serif;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--_gold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 240px;
}

.ci-id {
  font-size: 0.72rem;
  color: var(--_text-muted);
  white-space: nowrap;
}

.country-ident.collapsed .ci-name { max-width: 64px; }
.country-ident.collapsed .ci-id { display: none; }

.ci-toggle {
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--_text-muted);
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  font-size: 0.85rem;
}

.ci-toggle:hover { color: var(--_gold); }

/* ── Page nav (tabs) — inline, between brand and actions.
   NO overflow here: the slotted nav may contain absolutely-positioned
   dropdowns (Game Dashboard tab groups) and any scroll container between
   them and the header edge would clip the open dropdown. Apps whose nav
   has no dropdowns opt into overflow-x in their own CSS. ── */
.header-nav {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
}

::slotted([slot="nav"]) {
  display: flex;
  align-items: center;
  min-width: 0;
  max-width: 100%;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: flex-end;
  flex-shrink: 0;
  margin-left: auto;
}

::slotted([slot="actions"]) {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* ── Cog dropdown ── */
.cog-wrap { position: relative; flex-shrink: 0; }

.cog-btn {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid var(--_border-mid);
  background: transparent;
  color: var(--_text-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.05rem;
  padding: 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.cog-btn:hover {
  border-color: var(--_gold);
  color: var(--_gold);
  background: var(--_bg-hover);
  transform: rotate(30deg);
}

.cog-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 60;
  min-width: 200px;
  padding: 6px;
  background: var(--_bg-raised);
  border: 1px solid var(--_border-mid);
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);
  display: none;
  flex-direction: column;
  gap: 2px;
}

.cog-menu.open { display: flex; }

.menu-item, ::slotted([slot="menu"]) {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  background: none;
  border: none;
  border-radius: 6px;
  color: var(--_text-secondary);
  font-family: inherit;
  font-size: 0.85rem;
  text-align: left;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}

.menu-item:hover, ::slotted([slot="menu"]:hover) {
  background: var(--_bg-hover);
  color: var(--_gold);
}

.menu-item.logout { color: var(--_danger); }
.menu-item.logout:hover { background: rgba(239, 68, 68, 0.1); color: var(--_danger); }
.menu-item[hidden] { display: none; }

.menu-sep {
  height: 1px;
  margin: 4px 6px;
  background: var(--_border-mid);
}

.menu-sep[hidden] { display: none; }

@media (max-width: 900px) {
  .site-header { flex-wrap: wrap; row-gap: 0.5rem; padding: 0.6rem 1rem; }
  .header-nav { order: 3; flex-basis: 100%; }
}

@media (max-width: 480px) {
  .brand-subtitle { display: none; }
  .ci-id { display: none; }
}
`;

class PrSiteHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._user = {};
  }

  static get observedAttributes() {
    return ['logo-src', 'title', 'subtitle', 'home-href'];
  }

  // Patch the existing nodes in place — never re-run _render() here. A
  // re-render replaces the shadow root's innerHTML, which silently destroys
  // the click listeners bound in connectedCallback and leaves dead-looking
  // buttons behind.
  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this._rendered) return;
    const $ = (sel) => this.shadowRoot.querySelector(sel);
    if (name === 'logo-src') $('.brand-icon img').src = newVal;
    if (name === 'title') $('.brand-title').textContent = newVal;
    if (name === 'subtitle') this._paintSubtitle();
    if (name === 'home-href') $('a.brand').href = newVal;
  }

  connectedCallback() {
    this._render();
    this._rendered = true;
    this._bindNavToggle();
    this._bindTheme();
    this._bindCog();
    this._bindIdent();
    this._loadRpYear();
  }

  disconnectedCallback() {
    document.removeEventListener('navbar-open', this._onNavbarOpen);
    document.removeEventListener('navbar-close', this._onNavbarClose);
    document.removeEventListener('click', this._onDocClick);
    document.removeEventListener('keydown', this._onKeyDown);
  }

  _subtitleText() {
    const base = this.getAttribute('subtitle') || 'Projet Résurgence';
    return this._rpYear ? `${base} · ${this._rpYear}` : base;
  }

  _render() {
    const logoSrc = this.getAttribute('logo-src') || '/favicon/favicon-96x96.png';
    const title = this.getAttribute('title') || 'Projet Résurgence';
    const homeHref = this.getAttribute('home-href') || '/';

    this.shadowRoot.innerHTML = `
      <style>${CSS}</style>
      <header class="site-header">
        <div class="brand-group">
          <button class="nav-toggle" id="navToggle" type="button"
            aria-label="Ouvrir la navigation inter-sites" aria-expanded="false">
            <span class="arrow" aria-hidden="true">›</span>
          </button>
          <a class="brand" href="${homeHref}">
            <div class="brand-icon"><img src="${logoSrc}" alt="Projet Résurgence"></div>
            <div class="brand-text">
              <span class="brand-title">${title}</span>
              <span class="brand-subtitle" id="brandSubtitle">${this._subtitleText()}</span>
            </div>
          </a>
        </div>
        <div class="country-ident" id="countryIdent" hidden>
          <img class="ci-flag" id="ciFlag" alt="" hidden>
          <span class="ci-name" id="ciName"></span>
          <span class="ci-id" id="ciId"></span>
          <button class="ci-toggle" id="ciToggle" type="button"
            title="Réduire / agrandir le nom du pays" aria-label="Réduire / agrandir le nom du pays">
            ${iconSvg('chevrons-lr')}
          </button>
        </div>
        <div class="header-nav"><slot name="nav"></slot></div>
        <div class="header-actions">
          <slot name="actions"></slot>
          <div class="cog-wrap">
            <button class="cog-btn" id="cogBtn" type="button" title="Paramètres"
              aria-label="Paramètres" aria-haspopup="true" aria-expanded="false">
              ${iconSvg('settings')}
            </button>
            <div class="cog-menu" id="cogMenu" role="menu">
              <slot name="menu"></slot>
              <div class="menu-sep" id="menuSep" hidden></div>
              <button class="menu-item" id="themeItem" type="button" role="menuitem">
                <span id="themeItemIcon">${iconSvg('moon')}</span> Jour / Nuit
              </button>
              <button class="menu-item logout" id="logoutItem" type="button" role="menuitem" hidden>
                ${iconSvg('log-out')} Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>`;
  }

  // ── RP year — shared across apps, so the subtitle reads "… · 2308" ──
  async _loadRpYear() {
    const endpoint = this.getAttribute('year-endpoint') || '/api/game/date';

    const cached = sessionStorage.getItem(YEAR_CACHE_KEY);
    if (cached) {
      this._rpYear = cached;
      this._paintSubtitle();
      return;
    }

    try {
      const r = await fetch(endpoint);
      const d = await r.json();
      const year = d?.data?.year;
      if (!year) return;
      this._rpYear = String(year);
      sessionStorage.setItem(YEAR_CACHE_KEY, this._rpYear);
      this._paintSubtitle();
    } catch (_) { /* subtitle just stays year-less */ }
  }

  _paintSubtitle() {
    const el = this.shadowRoot.getElementById('brandSubtitle');
    if (el) el.textContent = this._subtitleText();
  }

  // ── Embedded intersite-navbar arrow ──
  _bindNavToggle() {
    const btn = this.shadowRoot.getElementById('navToggle');
    const syncState = (open) => {
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Fermer la navigation inter-sites' : 'Ouvrir la navigation inter-sites');
    };

    // Reflect the navbar's persisted state on first paint, before the
    // <intersite-navbar> element itself may have upgraded.
    try {
      syncState(localStorage.getItem('pr-intersite-navbar-open') === 'true');
    } catch (_) { /* ignore */ }

    // stopPropagation is required: <intersite-navbar>'s own outside-click
    // handler listens on `document`. Since this button lives in a sibling
    // component's Shadow DOM, the click event retargets to <pr-site-header>
    // at the document level — which the navbar does NOT contain — so
    // without this it would open then immediately auto-close on the same
    // click.
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelector('intersite-navbar')?.toggle();
    });

    this._onNavbarOpen = () => syncState(true);
    this._onNavbarClose = () => syncState(false);
    document.addEventListener('navbar-open', this._onNavbarOpen);
    document.addEventListener('navbar-close', this._onNavbarClose);
  }

  // ── Theme (applied via the cog's "Jour / Nuit" item) ──
  _bindTheme() {
    const THEME_KEY = this.getAttribute('theme-key') || 'pr-theme';
    const themeIcon = this.shadowRoot.getElementById('themeItemIcon');

    this._applyTheme = (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      this.setAttribute('data-theme', theme);
      themeIcon.innerHTML = iconSvg(theme === 'dark' ? 'sun' : 'moon');
      document.dispatchEvent(new CustomEvent('pr-theme-change', { detail: { theme } }));
    };

    let theme = localStorage.getItem(THEME_KEY);
    if (!theme) {
      theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
    }
    this._applyTheme(theme);

    this.shadowRoot.getElementById('themeItem').addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, next);
      this._applyTheme(next);
    });

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
        if (!localStorage.getItem(THEME_KEY)) this._applyTheme(e.matches ? 'light' : 'dark');
      });
    }
  }

  // ── Cog dropdown open/close ──
  _bindCog() {
    const btn = this.shadowRoot.getElementById('cogBtn');
    const menu = this.shadowRoot.getElementById('cogMenu');
    const menuSlot = this.shadowRoot.querySelector('slot[name="menu"]');
    const sep = this.shadowRoot.getElementById('menuSep');

    // Separator only when the host app slots extra items above theme/logout.
    const syncSep = () => { sep.hidden = menuSlot.assignedNodes().length === 0; };
    menuSlot.addEventListener('slotchange', syncSep);
    syncSep();

    const setOpen = (open) => {
      menu.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    };

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(!menu.classList.contains('open'));
    });

    this.shadowRoot.getElementById('logoutItem').addEventListener('click', () => {
      setOpen(false);
      this.dispatchEvent(new CustomEvent('pr-logout', { bubbles: true, composed: true }));
    });

    // Close on outside click / Escape. composedPath (not target) because
    // clicks inside the shadow tree retarget to the host at document level.
    this._onDocClick = (e) => {
      if (!e.composedPath().includes(this.shadowRoot.querySelector('.cog-wrap'))) setOpen(false);
    };
    this._onKeyDown = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('click', this._onDocClick);
    document.addEventListener('keydown', this._onKeyDown);
  }

  // ── Country identity collapse toggle ──
  _bindIdent() {
    const ident = this.shadowRoot.getElementById('countryIdent');
    try {
      if (localStorage.getItem(IDENT_COLLAPSE_KEY) === 'true') ident.classList.add('collapsed');
    } catch (_) { /* ignore */ }
    this.shadowRoot.getElementById('ciToggle').addEventListener('click', () => {
      const collapsed = ident.classList.toggle('collapsed');
      try { localStorage.setItem(IDENT_COLLAPSE_KEY, String(collapsed)); } catch (_) { /* ignore */ }
    });
  }

  // ── Public API ──

  /**
   * Show/update the country identity block. Merges with previous calls, so
   * e.g. the flag URL can be provided later than the name. Also reveals the
   * cog's logout item. Fields: country_name, country_id, flag_url.
   */
  setUser(user = {}) {
    this._user = { ...this._user, ...user };
    const u = this._user;
    const ident = this.shadowRoot.getElementById('countryIdent');
    const flag = this.shadowRoot.getElementById('ciFlag');
    this.shadowRoot.getElementById('ciName').textContent = u.country_name || '';
    this.shadowRoot.getElementById('ciName').title = u.country_name || '';
    this.shadowRoot.getElementById('ciId').textContent =
      (u.country_id !== undefined && u.country_id !== null && u.country_id !== '') ? `(${u.country_id})` : '';
    if (u.flag_url) {
      flag.src = u.flag_url;
      flag.hidden = false;
    } else {
      flag.hidden = true;
    }
    ident.hidden = !u.country_name;
    this.setLoggedIn(true);
  }

  /** Toggle the cog's logout item; false also hides the country block. */
  setLoggedIn(loggedIn) {
    this.shadowRoot.getElementById('logoutItem').hidden = !loggedIn;
    if (!loggedIn) {
      this._user = {};
      this.shadowRoot.getElementById('countryIdent').hidden = true;
    }
  }

  /** Same as clicking the cog's "Jour / Nuit" item. */
  toggleTheme() {
    this.shadowRoot.getElementById('themeItem')?.click();
  }
}

if (!customElements.get('pr-site-header')) {
  customElements.define('pr-site-header', PrSiteHeader);
}

export default PrSiteHeader;
