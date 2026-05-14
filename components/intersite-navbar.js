const s = [
  {
    id: "home",
    label: "Site Principal",
    url: "https://projet-resurgence.fr",
    icon: "🏠",
    description: "Site vitrine"
  },
  {
    id: "play",
    label: "Tableau de Bord",
    url: "https://play.projet-resurgence.fr",
    icon: "🎮",
    description: "Dashboard joueur"
  },
  {
    id: "tech",
    label: "Panel Tech",
    url: "https://tech.projet-resurgence.fr",
    icon: "🔬",
    description: "Arbre technologique"
  },
  {
    id: "map",
    label: "Carte Interactive",
    url: "https://map.projet-resurgence.fr",
    icon: "🗺️",
    description: "Carte du monde 2303"
  },
  {
    id: "calc",
    label: "Calculateur",
    url: "https://calc.projet-resurgence.fr",
    icon: "🧮",
    description: "Économie & énergie"
  },
  {
    id: "catalog",
    label: "Catalogue Militaire",
    url: "https://catalog.projet-resurgence.fr",
    icon: "⚔️",
    description: "Équipements militaires"
  },
  {
    id: "discord",
    label: "Discord",
    url: "https://discord.projet-resurgence.fr",
    icon: "💬",
    description: "Communauté & RP",
    external: !0
  }
], l = "pr-intersite-navbar-open", p = `
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
  --tab-width:    34px;
  --ease:         cubic-bezier(0.4, 0, 0.2, 1);
}

/* ── Wrapper ── */
.wrapper {
  display: flex;
  flex-direction: row;
  height: 100%;
  pointer-events: auto;
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
  font-size: 20px;
  line-height: 1;
  flex-shrink: 0;
}

.header-text {}

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
  font-size: 17px;
  width: 22px;
  text-align: center;
  flex-shrink: 0;
  line-height: 1;
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

/* ── Toggle Tab ── */
.toggle-tab {
  width: var(--tab-width);
  flex-shrink: 0;
  background: var(--bg);
  border: none;
  border-right: 2px solid var(--gold);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0;
  transition: background 0.15s;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.toggle-tab:hover {
  background: var(--bg-hover);
}

.toggle-tab:focus-visible {
  box-shadow: inset 0 0 0 2px var(--gold);
}

.tab-arrow {
  font-size: 13px;
  color: var(--gold);
  transition: transform 0.28s var(--ease);
  line-height: 1;
  user-select: none;
}

.wrapper.open .tab-arrow {
  transform: rotate(180deg);
}

.tab-label {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
  font-size: 9px;
  font-weight: 700;
  color: var(--gold);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.75;
  user-select: none;
}

/* ── Responsive ── */
@media (max-width: 480px) {
  :host {
    --panel-width: 210px;
  }
}
`;
class c extends HTMLElement {
  constructor() {
    super(), this.attachShadow({ mode: "open" }), this._isOpen = localStorage.getItem(l) === "true", this._rendered = !1;
  }
  static get observedAttributes() {
    return ["current-site"];
  }
  attributeChangedCallback(t, e, i) {
    e !== i && this._rendered && this._updateActive();
  }
  connectedCallback() {
    this._render(), this._rendered = !0, this._bindEvents();
  }
  disconnectedCallback() {
    this._cleanup();
  }
  // ── Detect which site is active ──
  _detectCurrentSite() {
    const t = this.getAttribute("current-site");
    if (t) return t;
    try {
      const e = window.location.hostname;
      for (const i of s)
        if (new URL(i.url).hostname === e) return i.id;
    } catch {
    }
    return null;
  }
  // ── Render into Shadow DOM ──
  _render() {
    const t = this._detectCurrentSite(), e = this._isOpen, i = s.map((r) => {
      const a = t === r.id, o = r.external ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `
        <li class="site-item${a ? " active" : ""}">
          <a href="${r.url}" class="site-link"${o}${a ? ' aria-current="page"' : ""}>
            <span class="site-icon" aria-hidden="true">${r.icon}</span>
            <span class="site-content">
              <span class="site-label">${r.label}</span>
              <span class="site-desc">${r.description}</span>
            </span>
            <span class="active-dot" aria-hidden="true"></span>
          </a>
        </li>`;
    }).join("");
    this.shadowRoot.innerHTML = `
      <style>${p}</style>
      <div class="wrapper${e ? " open" : ""}" id="wrapper">
        <div class="panel" id="panel" role="navigation" aria-label="Navigation inter-sites" aria-hidden="${!e}">
          <div class="panel-header">
            <span class="header-emblem" aria-hidden="true">⚜</span>
            <span class="header-text">
              <span class="header-title">Projet Résurgence</span>
              <span class="header-sub">Navigation</span>
            </span>
          </div>
          <ul class="site-list">${i}</ul>
          <div class="panel-footer">
            <span class="footer-hint"><kbd>Alt</kbd>+<kbd>N</kbd> pour basculer</span>
          </div>
        </div>
        <button class="toggle-tab" id="toggleBtn"
          aria-label="${e ? "Fermer" : "Ouvrir"} la navigation inter-sites"
          aria-expanded="${e}"
          aria-controls="panel">
          <span class="tab-arrow" aria-hidden="true">›</span>
          <span class="tab-label" aria-hidden="true">Sites</span>
        </button>
      </div>`;
  }
  // ── Update active item without full re-render ──
  _updateActive() {
    const t = this._detectCurrentSite();
    this.shadowRoot.querySelectorAll(".site-item").forEach((e, i) => {
      var o;
      const r = ((o = s[i]) == null ? void 0 : o.id) === t;
      e.classList.toggle("active", r);
      const a = e.querySelector(".site-link");
      r ? a == null || a.setAttribute("aria-current", "page") : a == null || a.removeAttribute("aria-current");
    });
  }
  // ── Event binding ──
  _bindEvents() {
    const t = this.shadowRoot.getElementById("toggleBtn");
    t == null || t.addEventListener("click", () => this.toggle()), this._onDocClick = (e) => {
      this._isOpen && !this.contains(e.target) && this.close();
    }, document.addEventListener("click", this._onDocClick), this._onKeyDown = (e) => {
      e.altKey && (e.key === "n" || e.key === "N") && (e.preventDefault(), this.toggle()), e.key === "Escape" && this._isOpen && this.close();
    }, document.addEventListener("keydown", this._onKeyDown);
  }
  _cleanup() {
    document.removeEventListener("click", this._onDocClick), document.removeEventListener("keydown", this._onKeyDown);
  }
  // ── Public API ──
  toggle() {
    this._isOpen ? this.close() : this.open();
  }
  open() {
    this._isOpen = !0, localStorage.setItem(l, "true");
    const t = this.shadowRoot.getElementById("wrapper"), e = this.shadowRoot.getElementById("panel"), i = this.shadowRoot.getElementById("toggleBtn");
    t == null || t.classList.add("open"), e == null || e.setAttribute("aria-hidden", "false"), i == null || i.setAttribute("aria-expanded", "true"), i == null || i.setAttribute("aria-label", "Fermer la navigation inter-sites"), this.dispatchEvent(new CustomEvent("navbar-open", { bubbles: !0, composed: !0 }));
  }
  close() {
    this._isOpen = !1, localStorage.setItem(l, "false");
    const t = this.shadowRoot.getElementById("wrapper"), e = this.shadowRoot.getElementById("panel"), i = this.shadowRoot.getElementById("toggleBtn");
    t == null || t.classList.remove("open"), e == null || e.setAttribute("aria-hidden", "true"), i == null || i.setAttribute("aria-expanded", "false"), i == null || i.setAttribute("aria-label", "Ouvrir la navigation inter-sites"), this.dispatchEvent(new CustomEvent("navbar-close", { bubbles: !0, composed: !0 }));
  }
  get isOpen() {
    return this._isOpen;
  }
}
customElements.get("intersite-navbar") || customElements.define("intersite-navbar", c);
function d() {
  document.querySelectorAll("[data-intersite-navbar]:not([data-in-initialized])").forEach((n) => {
    const t = document.createElement("intersite-navbar"), e = n.getAttribute("data-current-site");
    e && t.setAttribute("current-site", e), document.body.appendChild(t), n.setAttribute("data-in-initialized", "");
  });
}
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", d) : d();
typeof window < "u" && (window.IntersiteNavbar = {
  IntersiteNavbar: c,
  SITES: s,
  /**
   * Programmatically mount the navbar.
   * @param {{ currentSite?: string }} options
   * @returns {IntersiteNavbar}
   */
  create(n = {}) {
    const t = document.createElement("intersite-navbar");
    return n.currentSite && t.setAttribute("current-site", n.currentSite), document.body.appendChild(t), t;
  }
});
export {
  s as SITES,
  c as default
};
