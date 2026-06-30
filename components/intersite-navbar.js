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
], l = "pr-intersite-navbar-open", g = `
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
`, c = "intersite-navbar-offset-style", d = "--intersite-navbar-offset";
function b() {
  if (document.getElementById(c)) return;
  const a = document.createElement("style");
  a.id = c, a.textContent = `
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
`, document.head.appendChild(a);
}
function p(a) {
  const e = getComputedStyle(a).getPropertyValue("--tab-width").trim() || "56px";
  document.documentElement.style.setProperty(d, e);
}
class u extends HTMLElement {
  constructor() {
    super(), this.attachShadow({ mode: "open" }), this._isOpen = localStorage.getItem(l) === "true", this._rendered = !1;
  }
  static get observedAttributes() {
    return ["current-site"];
  }
  attributeChangedCallback(e, t, i) {
    t !== i && this._rendered && this._updateActive();
  }
  connectedCallback() {
    this._render(), this._rendered = !0, this._bindEvents(), this._bindHostOffset();
  }
  disconnectedCallback() {
    this._cleanup();
  }
  // ── Reserve space on the host page so the tab/panel never overlaps it ──
  _bindHostOffset() {
    b(), p(this), this._mq = window.matchMedia("(max-width: 480px)"), this._onMqChange = () => p(this), this._mq.addEventListener("change", this._onMqChange);
  }
  // ── Detect which site is active ──
  _detectCurrentSite() {
    const e = this.getAttribute("current-site");
    if (e) return e;
    try {
      const t = window.location.hostname;
      for (const i of s)
        if (new URL(i.url).hostname === t) return i.id;
    } catch {
    }
    return null;
  }
  // ── Render into Shadow DOM ──
  _render() {
    const e = this._detectCurrentSite(), t = this._isOpen, i = s.map((n) => {
      const r = e === n.id, o = n.external ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `
        <li class="site-item${r ? " active" : ""}">
          <a href="${n.url}" class="site-link"${o}${r ? ' aria-current="page"' : ""}>
            <span class="site-icon" aria-hidden="true">${n.icon}</span>
            <span class="site-content">
              <span class="site-label">${n.label}</span>
              <span class="site-desc">${n.description}</span>
            </span>
            <span class="active-dot" aria-hidden="true"></span>
          </a>
        </li>`;
    }).join("");
    this.shadowRoot.innerHTML = `
      <style>${g}</style>
      <div class="wrapper${t ? " open" : ""}" id="wrapper">
        <div class="panel" id="panel" role="navigation" aria-label="Navigation inter-sites" aria-hidden="${!t}">
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
          aria-label="${t ? "Fermer" : "Ouvrir"} la navigation inter-sites"
          aria-expanded="${t}"
          aria-controls="panel">
          <span class="tab-arrow" aria-hidden="true">›</span>
        </button>
      </div>`;
  }
  // ── Update active item without full re-render ──
  _updateActive() {
    const e = this._detectCurrentSite();
    this.shadowRoot.querySelectorAll(".site-item").forEach((t, i) => {
      var o;
      const n = ((o = s[i]) == null ? void 0 : o.id) === e;
      t.classList.toggle("active", n);
      const r = t.querySelector(".site-link");
      n ? r == null || r.setAttribute("aria-current", "page") : r == null || r.removeAttribute("aria-current");
    });
  }
  // ── Event binding ──
  _bindEvents() {
    const e = this.shadowRoot.getElementById("toggleBtn");
    e == null || e.addEventListener("click", () => this.toggle()), this._onDocClick = (t) => {
      this._isOpen && !this.contains(t.target) && this.close();
    }, document.addEventListener("click", this._onDocClick), this._onKeyDown = (t) => {
      t.altKey && (t.key === "n" || t.key === "N") && (t.preventDefault(), this.toggle()), t.key === "Escape" && this._isOpen && this.close();
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
    this._isOpen = !0, localStorage.setItem(l, "true");
    const e = this.shadowRoot.getElementById("wrapper"), t = this.shadowRoot.getElementById("panel"), i = this.shadowRoot.getElementById("toggleBtn");
    e == null || e.classList.add("open"), t == null || t.setAttribute("aria-hidden", "false"), i == null || i.setAttribute("aria-expanded", "true"), i == null || i.setAttribute("aria-label", "Fermer la navigation inter-sites"), this.dispatchEvent(new CustomEvent("navbar-open", { bubbles: !0, composed: !0 }));
  }
  close() {
    this._isOpen = !1, localStorage.setItem(l, "false");
    const e = this.shadowRoot.getElementById("wrapper"), t = this.shadowRoot.getElementById("panel"), i = this.shadowRoot.getElementById("toggleBtn");
    e == null || e.classList.remove("open"), t == null || t.setAttribute("aria-hidden", "true"), i == null || i.setAttribute("aria-expanded", "false"), i == null || i.setAttribute("aria-label", "Ouvrir la navigation inter-sites"), this.dispatchEvent(new CustomEvent("navbar-close", { bubbles: !0, composed: !0 }));
  }
  get isOpen() {
    return this._isOpen;
  }
}
customElements.get("intersite-navbar") || customElements.define("intersite-navbar", u);
function h() {
  document.querySelectorAll("[data-intersite-navbar]:not([data-in-initialized])").forEach((a) => {
    const e = document.createElement("intersite-navbar"), t = a.getAttribute("data-current-site");
    t && e.setAttribute("current-site", t), document.body.appendChild(e), a.setAttribute("data-in-initialized", "");
  });
}
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", h) : h();
typeof window < "u" && (window.IntersiteNavbar = {
  IntersiteNavbar: u,
  SITES: s,
  /**
   * Programmatically mount the navbar.
   * @param {{ currentSite?: string }} options
   * @returns {IntersiteNavbar}
   */
  create(a = {}) {
    const e = document.createElement("intersite-navbar");
    return a.currentSite && e.setAttribute("current-site", a.currentSite), document.body.appendChild(e), e;
  }
});
export {
  s as SITES,
  u as default
};
