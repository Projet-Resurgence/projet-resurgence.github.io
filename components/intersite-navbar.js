const v = "projet-resurgence.fr", k = /* @__PURE__ */ new Set([
  "www",
  "api",
  "auth",
  "admin",
  "docs",
  "kanban",
  "chat",
  "dev",
  "footsim",
  "play",
  "tech",
  "map",
  "calc",
  "catalog"
]), l = [
  {
    id: "home",
    label: "Site Principal",
    sub: null,
    icon: "home",
    description: "Site vitrine"
  },
  {
    id: "play",
    label: "Tableau de Bord",
    sub: "play",
    icon: "play",
    description: "Dashboard joueur"
  },
  {
    id: "tech",
    label: "Panel Tech",
    sub: "tech",
    icon: "tech",
    description: "Arbre technologique"
  },
  {
    id: "map",
    label: "Carte Interactive",
    sub: "map",
    icon: "map",
    description: "Carte du monde 2303"
  },
  {
    id: "calc",
    label: "Calculateur",
    sub: "calc",
    icon: "calc",
    description: "Économie & énergie"
  },
  {
    id: "catalog",
    label: "Catalogue Militaire",
    sub: "catalog",
    icon: "catalog",
    description: "Équipements militaires"
  },
  {
    // Community invite — always the public Discord, never rewritten to the
    // local or staging domain.
    id: "discord",
    label: "Discord",
    url: "https://discord.projet-resurgence.fr",
    icon: "discord",
    description: "Communauté & RP",
    external: !0
  }
];
function _(n) {
  if (!n) return null;
  const e = n.split(".");
  return e.length > 1 && k.has(e[0]) ? e.slice(1).join(".") : n;
}
function h(n) {
  let e = "https:", t = "";
  try {
    e = window.location.protocol, t = window.location.port ? `:${window.location.port}` : "";
  } catch {
  }
  const a = (n && typeof n.getAttribute == "function" ? n.getAttribute("base-domain") : null) || (typeof window < "u" ? window.PR_BASE_DOMAIN : null);
  if (a) return { baseDomain: a, protocol: e, port: t };
  let o = null;
  try {
    o = _(window.location.hostname);
  } catch {
  }
  return o ? { baseDomain: o, protocol: e, port: t } : { baseDomain: v, protocol: "https:", port: "" };
}
function p(n, e) {
  if (n.url) return n.url;
  const { baseDomain: t, protocol: i, port: a } = e, o = n.sub ? `${n.sub}.${t}` : t;
  return `${i}//${o}${a}`;
}
const g = {
  "chevron-left": '<polyline points="15 18 9 12 15 6"/>',
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  play: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  tech: '<path d="M10 2v6L4.5 18a2 2 0 0 0 1.77 3h11.46a2 2 0 0 0 1.77-3L14 8V2"/><line x1="8" y1="2" x2="16" y2="2"/><line x1="7.5" y1="14" x2="16.5" y2="14"/>',
  map: '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',
  calc: '<rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8.01" y2="10"/><line x1="12" y1="10" x2="12.01" y2="10"/><line x1="16" y1="10" x2="16.01" y2="10"/><line x1="8" y1="14" x2="8.01" y2="14"/><line x1="12" y1="14" x2="12.01" y2="14"/><line x1="16" y1="14" x2="16.01" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/>',
  catalog: '<circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/>',
  discord: '<path fill="currentColor" stroke="none" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>'
};
function b(n) {
  return `<svg class="pr-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${g[n] || g.home}</svg>`;
}
const c = "pr-intersite-navbar-open", E = `
:host {
  all: initial;
  display: block;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 9999;
  pointer-events: none;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --gold:         #D5B654;
  --gold-dark:    #B89A3D;
  --gold-glow:    rgba(213, 182, 84, 0.15);
  --bg:           #1a1a1a;
  --bg-hover:     #242424;
  --bg-active:    #0f0f0f;
  --border:       #2d2d2d;
  --text:         #f8f9fa;
  --text-muted:   #888;
  --panel-width:  248px;
  --tab-width:    56px;
  --ease:         cubic-bezier(0.4, 0, 0.2, 1);
}

/* Light theme (parchment — follows html[data-theme], synced in JS) */
:host([data-theme="light"]) {
  --gold:         #8a6d18;
  --gold-dark:    #6d5512;
  --gold-glow:    rgba(138, 109, 24, 0.18);
  --bg:           #f8f4e9;
  --bg-hover:     #ebe3d0;
  --bg-active:    #f1ebdc;
  --border:       rgba(80, 62, 20, 0.18);
  --text:         #221c0f;
  --text-muted:   #6f6550;
}

/* ── Wrapper ──
   height:100% is needed so .panel can be a full-height column, but the
   wrapper box itself must NOT capture clicks — only the parts that actually
   render something (.panel, .toggle-tab) should. Without this, the wrapper's
   full-height-but-mostly-empty box (now that the collapsed tab is a small
   circle, not a full-height rail) silently eats every click/tap down the
   whole left edge of the host page, even where nothing is visibly drawn. */
.wrapper {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  height: 100%;
  pointer-events: none;
}

/* ── Panel ── */
.panel {
  width: 0;
  overflow: hidden;
  background: var(--bg);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  transition: width 0.28s var(--ease), box-shadow 0.28s var(--ease);
  will-change: width;
  pointer-events: auto;
}

.wrapper.open .panel {
  width: var(--panel-width);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.5);
}

/* ── Panel Header ── */
.panel-header {
  padding: 18px 14px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.header-emblem {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-emblem img {
  width: 26px;
  height: 26px;
  object-fit: contain;
  display: block;
}

.pr-icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;
  flex-shrink: 0;
}

.header-text { flex: 1; min-width: 0; }

/* ── Close button — mirrors the floating tab's arrow, but always reachable
   from inside the open panel (the floating tab is absent entirely when the
   host page embeds its own trigger via hide-toggle). ── */
.panel-close {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
  outline: none;
}

.panel-close:hover {
  color: var(--gold);
  border-color: var(--gold);
  background: var(--bg-hover);
}

.panel-close:focus-visible { box-shadow: 0 0 0 2px var(--gold); }

.panel-close .pr-icon { width: 15px; height: 15px; }

.header-title {
  display: block;
  font-size: 10px;
  font-weight: 700;
  color: var(--gold);
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.header-sub {
  display: block;
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 1px;
}

/* ── Site List ── */
.site-list {
  list-style: none;
  margin: 0;
  padding: 8px 0;
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}

.site-item {
  margin: 2px 8px;
}

.site-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 7px;
  text-decoration: none;
  color: var(--text-muted);
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
  position: relative;
  border: 1px solid transparent;
}

.site-link:hover {
  background: var(--bg-hover);
  color: var(--text);
  text-decoration: none;
}

.site-item.active .site-link {
  background: var(--bg-active);
  color: var(--gold);
  border-color: var(--gold-glow);
}

.site-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.site-content {
  flex: 1;
  min-width: 0;
}

.site-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
}

.site-desc {
  display: block;
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 1px;
  opacity: 0;
  transition: opacity 0.2s;
}

.wrapper.open .site-desc {
  opacity: 1;
}

.site-item.active .site-desc {
  color: var(--gold-dark);
}

.active-dot {
  width: 5px;
  height: 5px;
  background: var(--gold);
  border-radius: 50%;
  flex-shrink: 0;
  display: none;
}

.site-item.active .active-dot {
  display: block;
}

/* ── Panel Footer ── */
.panel-footer {
  padding: 10px 14px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
  white-space: nowrap;
}

.footer-hint {
  font-size: 10px;
  color: var(--text-muted);
}

.footer-hint kbd {
  display: inline-block;
  padding: 1px 4px;
  background: var(--border);
  border-radius: 3px;
  font-family: inherit;
  font-size: 10px;
}

/* ── Toggle Tab — a single compact arrow button, not a full-height strip ── */
.toggle-tab {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  margin: 10px;
  background: var(--bg);
  border: 2px solid var(--gold);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
  transition: background 0.15s, transform 0.15s;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  pointer-events: auto;
}

.toggle-tab:hover {
  background: var(--bg-hover);
  transform: scale(1.06);
}

.toggle-tab:focus-visible {
  box-shadow: 0 0 0 2px var(--gold);
}

.tab-arrow {
  font-size: 15px;
  color: var(--gold);
  transition: transform 0.28s var(--ease);
  line-height: 1;
  user-select: none;
}

.wrapper.open .tab-arrow {
  transform: rotate(180deg);
}

/* ── Responsive ── */
@media (max-width: 480px) {
  :host {
    --panel-width: 210px;
    --tab-width: 50px;
  }

  .toggle-tab {
    width: 32px;
    height: 32px;
    margin: 8px;
  }
}
`, m = "intersite-navbar-offset-style", d = "--intersite-navbar-offset";
function A() {
  if (document.getElementById(m)) return;
  const n = document.createElement("style");
  n.id = m, n.textContent = `
html body {
  margin-left: var(${d}, 56px);
  transition: margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

/* On phone the folded tab is a small floating circle, not a full-height
   rail — it overlaps content like any other floating UI instead of
   reserving permanent layout space. (Components that explicitly read
   ${d} themselves for their own fixed-position offset, e.g. a
   site header, are unaffected — only this generic body push is disabled.) */
@media (max-width: 768px) {
  html body {
    margin-left: 0;
  }
}
`, document.head.appendChild(n);
}
function f(n) {
  const e = getComputedStyle(n).getPropertyValue("--tab-width").trim() || "56px";
  document.documentElement.style.setProperty(d, e);
}
class y extends HTMLElement {
  constructor() {
    super(), this.attachShadow({ mode: "open" }), this._isOpen = localStorage.getItem(c) === "true", this._rendered = !1;
  }
  static get observedAttributes() {
    return ["current-site"];
  }
  attributeChangedCallback(e, t, i) {
    t !== i && this._rendered && this._updateActive();
  }
  connectedCallback() {
    if (window.self !== window.top) {
      this.style.display = "none";
      return;
    }
    this._render(), this._rendered = !0, this._bindEvents(), this._bindHostOffset(), this._bindTheme();
  }
  disconnectedCallback() {
    this._cleanup(), this._themeObserver && this._themeObserver.disconnect(), this._onThemeEvent && document.removeEventListener("pr-theme-change", this._onThemeEvent);
  }
  // ── Follow the host page's theme (html[data-theme]) ──
  // pr-site-header stamps data-theme on <html> and dispatches
  // 'pr-theme-change'; watch both so the navbar flips with the page.
  _bindTheme() {
    const e = () => {
      const t = document.documentElement.getAttribute("data-theme") || "dark";
      this.setAttribute("data-theme", t);
    };
    e(), this._themeObserver = new MutationObserver(e), this._themeObserver.observe(document.documentElement, {
      attributes: !0,
      attributeFilter: ["data-theme"]
    }), this._onThemeEvent = e, document.addEventListener("pr-theme-change", this._onThemeEvent);
  }
  // ── Reserve space on the host page so the tab/panel never overlaps it ──
  // Skipped entirely when hide-toggle is set: there is no floating tab to
  // dodge because the host page renders its own trigger (e.g. inside its
  // header) that calls toggle() directly — reserving body margin here would
  // just create the empty "gap" this mode exists to avoid.
  _bindHostOffset() {
    if (this.hasAttribute("hide-toggle")) {
      document.documentElement.style.setProperty(d, "0px");
      return;
    }
    A(), f(this), this._mq = window.matchMedia("(max-width: 480px)"), this._onMqChange = () => f(this), this._mq.addEventListener("change", this._onMqChange);
  }
  // ── Detect which site is active ──
  _detectCurrentSite() {
    const e = this.getAttribute("current-site");
    if (e) return e;
    try {
      const t = window.location.hostname, i = h(this);
      for (const a of l)
        if (new URL(p(a, i)).hostname === t) return a.id;
    } catch {
    }
    return null;
  }
  // ── Render into Shadow DOM ──
  _render() {
    const e = this._detectCurrentSite(), t = this._isOpen, i = this.hasAttribute("hide-toggle"), a = this.getAttribute("logo-src") || "/favicon/favicon-96x96.png", o = h(this), r = l.map((s) => {
      const u = e === s.id, w = s.external ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `
        <li class="site-item${u ? " active" : ""}">
          <a href="${p(s, o)}" class="site-link"${w}${u ? ' aria-current="page"' : ""}>
            <span class="site-icon" aria-hidden="true">${b(s.icon)}</span>
            <span class="site-content">
              <span class="site-label">${s.label}</span>
              <span class="site-desc">${s.description}</span>
            </span>
            <span class="active-dot" aria-hidden="true"></span>
          </a>
        </li>`;
    }).join("");
    this.shadowRoot.innerHTML = `
      <style>${E}</style>
      <div class="wrapper${t ? " open" : ""}" id="wrapper">
        <div class="panel" id="panel" role="navigation" aria-label="Navigation inter-sites" aria-hidden="${!t}">
          <div class="panel-header">
            <span class="header-emblem"><img src="${a}" alt="Projet Résurgence"></span>
            <span class="header-text">
              <span class="header-title">Projet Résurgence</span>
              <span class="header-sub">Navigation</span>
            </span>
            <button class="panel-close" id="closeBtn" type="button" aria-label="Fermer la navigation inter-sites">
              ${b("chevron-left")}
            </button>
          </div>
          <ul class="site-list">${r}</ul>
          <div class="panel-footer">
            <span class="footer-hint"><kbd>Alt</kbd>+<kbd>N</kbd> pour basculer</span>
          </div>
        </div>
        ${i ? "" : `
        <button class="toggle-tab" id="toggleBtn"
          aria-label="${t ? "Fermer" : "Ouvrir"} la navigation inter-sites"
          aria-expanded="${t}"
          aria-controls="panel">
          <span class="tab-arrow" aria-hidden="true">›</span>
        </button>`}
      </div>`;
  }
  // ── Update active item without full re-render ──
  _updateActive() {
    const e = this._detectCurrentSite();
    this.shadowRoot.querySelectorAll(".site-item").forEach((t, i) => {
      var r;
      const a = ((r = l[i]) == null ? void 0 : r.id) === e;
      t.classList.toggle("active", a);
      const o = t.querySelector(".site-link");
      a ? o == null || o.setAttribute("aria-current", "page") : o == null || o.removeAttribute("aria-current");
    });
  }
  // ── Event binding ──
  _bindEvents() {
    var t;
    const e = this.shadowRoot.getElementById("toggleBtn");
    e == null || e.addEventListener("click", () => this.toggle()), (t = this.shadowRoot.getElementById("closeBtn")) == null || t.addEventListener("click", () => this.close()), this._onDocClick = (i) => {
      this._isOpen && !this.contains(i.target) && this.close();
    }, document.addEventListener("click", this._onDocClick), this._onKeyDown = (i) => {
      i.altKey && (i.key === "n" || i.key === "N") && (i.preventDefault(), this.toggle()), i.key === "Escape" && this._isOpen && this.close();
    }, document.addEventListener("keydown", this._onKeyDown);
  }
  _cleanup() {
    var e;
    document.removeEventListener("click", this._onDocClick), document.removeEventListener("keydown", this._onKeyDown), (e = this._mq) == null || e.removeEventListener("change", this._onMqChange);
  }
  // ── Public API ──
  toggle() {
    this._isOpen ? this.close() : this.open();
  }
  open() {
    this._isOpen = !0, localStorage.setItem(c, "true");
    const e = this.shadowRoot.getElementById("wrapper"), t = this.shadowRoot.getElementById("panel"), i = this.shadowRoot.getElementById("toggleBtn");
    e == null || e.classList.add("open"), t == null || t.setAttribute("aria-hidden", "false"), i == null || i.setAttribute("aria-expanded", "true"), i == null || i.setAttribute("aria-label", "Fermer la navigation inter-sites"), this.dispatchEvent(new CustomEvent("navbar-open", { bubbles: !0, composed: !0 }));
  }
  close() {
    this._isOpen = !1, localStorage.setItem(c, "false");
    const e = this.shadowRoot.getElementById("wrapper"), t = this.shadowRoot.getElementById("panel"), i = this.shadowRoot.getElementById("toggleBtn");
    e == null || e.classList.remove("open"), t == null || t.setAttribute("aria-hidden", "true"), i == null || i.setAttribute("aria-expanded", "false"), i == null || i.setAttribute("aria-label", "Ouvrir la navigation inter-sites"), this.dispatchEvent(new CustomEvent("navbar-close", { bubbles: !0, composed: !0 }));
  }
  get isOpen() {
    return this._isOpen;
  }
}
customElements.get("intersite-navbar") || customElements.define("intersite-navbar", y);
function x() {
  document.querySelectorAll("[data-intersite-navbar]:not([data-in-initialized])").forEach((n) => {
    const e = document.createElement("intersite-navbar"), t = n.getAttribute("data-current-site");
    t && e.setAttribute("current-site", t), document.body.appendChild(e), n.setAttribute("data-in-initialized", "");
  });
}
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", x) : x();
typeof window < "u" && (window.IntersiteNavbar = {
  IntersiteNavbar: y,
  SITES: l,
  DEFAULT_BASE_DOMAIN: v,
  resolveOrigin: h,
  siteUrl: p,
  /**
   * Programmatically mount the navbar.
   * @param {{ currentSite?: string, baseDomain?: string }} options
   * @returns {IntersiteNavbar}
   */
  create(n = {}) {
    const e = document.createElement("intersite-navbar");
    return n.currentSite && e.setAttribute("current-site", n.currentSite), n.baseDomain && e.setAttribute("base-domain", n.baseDomain), document.body.appendChild(e), e;
  }
});
export {
  v as DEFAULT_BASE_DOMAIN,
  l as SITES,
  y as default,
  h as resolveOrigin,
  p as siteUrl
};
