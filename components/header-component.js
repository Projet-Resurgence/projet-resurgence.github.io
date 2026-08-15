// Header Web Component for Projet Résurgence
// Thin wrapper around the shared <pr-site-header> (components/site-header.js),
// the same header used by play./tech./calc./catalog. This component only owns
// what is specific to the vitrine site: the page nav links, smooth-scroll for
// in-page anchors, and the legacy theme events other scripts on this site
// listen to.
//
// <pr-site-header> now fully owns the nav tab system (burger collapse,
// underline tabs). Since <pr-site-header> lives inside this component's
// shadow DOM, the injected <head> CSS won't reach slotted nav links — we
// import NAV_CSS from site-header.js and include it in our own shadow styles.

import { NAV_CSS } from './site-header.js?v=2.6.0';
import { attachHeaderAuth } from './auth.js?v=1.0.0';

// Served by /env.js so the same static HTML works on every environment; the
// literal is only the production fallback if that script failed to load.
// Root CLAUDE.md rule 10: never bake an environment URL into code.
const PR_API_ORIGIN =
    (typeof window !== 'undefined' && window.PR_ENV && window.PR_ENV.apiUrl) ||
    'https://api.projet-resurgence.fr';

// Univers, Règlement and Forum RP are the three administrator-editable pages —
// same data shape, same layout — so they share one "Documentation" menu rather
// than three sibling tabs that look unrelated.
const DOC_LINKS = [
    { href: '/univers', page: 'universe', label: 'Univers', hint: 'Le contexte RP de 2303' },
    { href: '/regles', page: 'rules', label: 'Règlement', hint: 'Les règles, par chapitre' },
    { href: '/forum-rp', page: 'forum-rp', label: 'Forum RP', hint: "Les fiches d'information du forum" },
];

const NAV_LINKS = [
    { href: 'index.html', page: 'home', label: 'Accueil', aria: "Retour à l'accueil" },
    { dropdown: 'documentation', label: 'Documentation', aria: 'Univers, règlement et forum RP', items: DOC_LINKS },
    { href: 'guide.html', page: 'guide', label: 'Guide', aria: 'Lire le guide du débutant' },
    { href: 'rp-geopolitique.html', page: 'rp-geopolitique', label: 'RP Géopolitique', aria: 'Les types de RP géopolitique' },
    { href: 'mecaniques.html', page: 'mecaniques', label: 'Mécaniques', aria: 'Les mécaniques et systèmes du jeu' },
    { href: 'ressources.html', page: 'resources', label: 'Ressources', aria: 'Liens utiles et outils' },
    { href: 'calendrier.html', page: 'calendar', label: 'Calendrier', aria: 'Le calendrier de jeu' },
    // The Discord invite is the destination, not an anchor on the home page —
    // "Rejoindre" only ever meant "join the server".
    { href: 'https://discord.projet-resurgence.fr', page: 'join', label: 'Rejoindre', aria: 'Rejoindre le Discord', external: true },
];

const DROPDOWN_CSS = `
    .nav-dropdown { position: relative; }

    .nav-dropdown-toggle {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: none;
        border: none;
        font: inherit;
        cursor: pointer;
    }
    .nav-dropdown-toggle::after {
        content: '';
        width: 5px;
        height: 5px;
        border-right: 1.5px solid currentColor;
        border-bottom: 1.5px solid currentColor;
        transform: translateY(-1px) rotate(45deg);
        transition: transform .16s ease;
    }
    .nav-dropdown[data-open="true"] .nav-dropdown-toggle::after {
        transform: translateY(1px) rotate(-135deg);
    }

    /* Fixed, not absolute, and placed by JS.
       The nav row (pr-site-header .tabs) is overflow-x: auto so it can scroll
       horizontally — that makes it a clipping box on BOTH axes, and an
       absolutely positioned menu inside it is cut off at the header's bottom
       edge, which reads as "the dropdown slid under the page". Taking the menu
       out of flow with position: fixed is the only way out of that box. */
    .nav-dropdown-menu {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 1200;
        min-width: 246px;
        margin: 0;
        padding: 6px;
        list-style: none;
        background: var(--bg-secondary, #1a1a1a);
        border: 1px solid var(--primary-gold, #D5B654);
        border-radius: 8px;
        box-shadow: 0 12px 32px rgba(0, 0, 0, .45);
        max-height: calc(100vh - 76px);
        overflow-y: auto;
    }
    .nav-dropdown:not([data-open="true"]) .nav-dropdown-menu { display: none; }

    .nav-dropdown-menu a {
        display: block;
        padding: 9px 12px;
        border-radius: 5px;
        text-decoration: none;
        color: var(--text-primary, #f8f9fa);
    }
    .nav-dropdown-menu a:hover,
    .nav-dropdown-menu a:focus-visible {
        background: rgba(213, 182, 84, .12);
        color: var(--primary-gold, #D5B654);
        outline: none;
    }
    .nav-dropdown-menu a.active { color: var(--primary-gold, #D5B654); }
    .nav-dropdown-menu .dd-label { display: block; font-size: .9rem; font-weight: 600; }
    .nav-dropdown-menu .dd-hint {
        display: block;
        margin-top: 2px;
        font-size: .74rem;
        color: var(--text-muted, #a0a0a0);
    }

    /* Narrow screens: the nav row scrolls horizontally rather than collapsing
       into a burger, so the menu still floats — it just gets narrower. */
    @media (max-width: 1040px) {
        .nav-dropdown-menu { min-width: 200px; }
    }
`;

// NAV_CSS from site-header.js uses `pr-site-header .nav-link` selectors.
// These work directly in this shadow DOM because <pr-site-header> and its
// slotted nav children are both elements in this shadow tree.

class ResurgenceHeader extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.currentPage = this.getAttribute('current-page') || '';
        this.isInitialized = false;
    }

    connectedCallback() {
        if (!this.isInitialized) {
            this.render();
            this.setupEventListeners();
            this.bridgeTheme();
            attachHeaderAuth(this);
            this.isInitialized = true;
        }
    }

    disconnectedCallback() {
        document.removeEventListener('pr-theme-change', this._onThemeChange);
        if (this._onOutsideClick) document.removeEventListener('click', this._onOutsideClick);
        if (this._onEscape) document.removeEventListener('keydown', this._onEscape);
        if (this._replaceOpenDropdowns) {
            window.removeEventListener('resize', this._replaceOpenDropdowns);
            window.removeEventListener('scroll', this._replaceOpenDropdowns);
        }
    }

    static get observedAttributes() {
        return ['current-page'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'current-page' && oldValue !== newValue) {
            this.currentPage = newValue;
            if (this.isInitialized) {
                this.updateActiveNavigation();
            }
        }
    }

    render() {
        const links = NAV_LINKS.map(l => {
            if (!l.dropdown) {
                const ext = l.external ? ' target="_blank" rel="noopener noreferrer"' : '';
                return `<li><a href="${l.href}" class="nav-link" data-page="${l.page}" aria-label="${l.aria}"${ext}>${l.label}</a></li>`;
            }
            const items = l.items.map(i => `
                <li><a href="${i.href}" class="nav-link" data-page="${i.page}">
                    <span class="dd-label">${i.label}</span>
                    <span class="dd-hint">${i.hint}</span>
                </a></li>
            `).join('');
            return `
                <li class="nav-dropdown" data-dropdown="${l.dropdown}" data-open="false">
                    <button type="button" class="nav-link nav-dropdown-toggle"
                            aria-expanded="false" aria-haspopup="true"
                            aria-label="${l.aria}">${l.label}</button>
                    <ul class="nav-dropdown-menu">${items}</ul>
                </li>
            `;
        }).join('');

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    position: sticky;
                    top: 0;
                    z-index: var(--z-fixed, 1000);
                }

                .nav-list {
                    display: flex;
                    align-items: center;
                    list-style: none;
                    gap: 2px;
                    margin: 0;
                    padding: 0;
                }

                ${NAV_CSS}

                ${DROPDOWN_CSS}

                .login-btn {
                    background: var(--primary-gold, #D5B654);
                    color: #14100a;
                    border: none;
                    border-radius: 6px;
                    padding: 7px 15px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    white-space: nowrap;
                }
                .login-btn:hover { filter: brightness(1.08); }
                .login-btn[hidden] { display: none; }

            </style>

            <pr-site-header title="Projet Résurgence" home-href="index.html"
                            subtitle="Site Officiel"
                            logo-src="./favicon/favicon-96x96.png"
                            theme-key="resurgence-theme"
                            year-endpoint="${PR_API_ORIGIN}/game/date">
                <div slot="nav" class="tabs">
                    <ul class="nav-list">${links}</ul>
                </div>
                <div slot="actions">
                    <button id="login-btn" class="login-btn" type="button" hidden>Connexion</button>
                </div>
            </pr-site-header>
        `;
    }

    setupEventListeners() {
        const navLinks = this.shadowRoot.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.includes('#')) {
                link.addEventListener('click', (e) => this.handleSmoothScroll(e, href));
            }
        });

        this.setupDropdowns();
        this.updateActiveNavigation();
    }

    setupDropdowns() {
        const dropdowns = [...this.shadowRoot.querySelectorAll('.nav-dropdown')];
        if (!dropdowns.length) return;

        // The menu is `position: fixed` (see DROPDOWN_CSS), so its coordinates
        // have to be written here from the toggle's viewport rectangle.
        const place = (dropdown) => {
            const toggle = dropdown.querySelector('.nav-dropdown-toggle');
            const menu = dropdown.querySelector('.nav-dropdown-menu');
            if (!toggle || !menu) return;
            const r = toggle.getBoundingClientRect();
            const width = menu.offsetWidth;
            const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8));
            menu.style.top = `${Math.round(r.bottom + 6)}px`;
            menu.style.left = `${Math.round(left)}px`;
        };

        const setOpen = (dropdown, open) => {
            dropdown.setAttribute('data-open', String(open));
            dropdown.querySelector('.nav-dropdown-toggle')
                ?.setAttribute('aria-expanded', String(open));
            if (open) place(dropdown);
        };
        this._closeDropdowns = () => dropdowns.forEach(d => setOpen(d, false));

        dropdowns.forEach(dropdown => {
            dropdown.querySelector('.nav-dropdown-toggle').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const open = dropdown.getAttribute('data-open') !== 'true';
                this._closeDropdowns();
                setOpen(dropdown, open);
            });
        });

        // A fixed menu does not follow its toggle — re-place it whenever the
        // header can have moved under it.
        this._replaceOpenDropdowns = () => {
            dropdowns.forEach(d => { if (d.getAttribute('data-open') === 'true') place(d); });
        };
        window.addEventListener('resize', this._replaceOpenDropdowns);
        window.addEventListener('scroll', this._replaceOpenDropdowns, { passive: true });
        this.shadowRoot.querySelector('.tabs')
            ?.addEventListener('scroll', this._replaceOpenDropdowns, { passive: true });

        // The menu lives in this shadow root, so a click on the page never
        // reaches it — close on both, and on Escape.
        this._onOutsideClick = (e) => {
            if (!e.composedPath().includes(this)) this._closeDropdowns();
        };
        this._onEscape = (e) => {
            if (e.key === 'Escape') this._closeDropdowns();
        };
        document.addEventListener('click', this._onOutsideClick);
        document.addEventListener('keydown', this._onEscape);
        this.shadowRoot.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-dropdown')) this._closeDropdowns();
        });
    }

    bridgeTheme() {
        this._onThemeChange = (e) => {
            const theme = e.detail.theme;
            document.body.setAttribute('data-theme', theme);
            this.setAttribute('data-theme', theme);

            this.dispatchEvent(new CustomEvent('theme-changed', {
                detail: { theme }, bubbles: true, composed: true,
            }));
            document.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme } }));
            window.dispatchEvent(new CustomEvent('global-theme-change', { detail: { theme } }));
        };
        document.addEventListener('pr-theme-change', this._onThemeChange);
    }

    updateActiveNavigation() {
        this.shadowRoot.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('data-page') === this.currentPage);
        });
        // A dropdown whose current page is inside it must read as active too,
        // otherwise /regles looks like it belongs to no menu at all.
        this.shadowRoot.querySelectorAll('.nav-dropdown').forEach(dropdown => {
            const active = Boolean(dropdown.querySelector('.nav-dropdown-menu .nav-link.active'));
            dropdown.querySelector('.nav-dropdown-toggle')?.classList.toggle('active', active);
        });
    }

    handleSmoothScroll(e, href) {
        const [path, hash] = href.split('#');
        const currentPath = window.location.pathname;

        if ((path === '' || currentPath.includes(path)) && hash) {
            const targetElement = document.getElementById(hash);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }

    setActivePage(page) {
        this.currentPage = page;
        this.setAttribute('current-page', page);
        this.updateActiveNavigation();
    }

    setTheme(theme) {
        if (theme !== this.getCurrentTheme()) {
            this.shadowRoot.querySelector('pr-site-header')?.toggleTheme();
        }
    }

    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') ||
            localStorage.getItem('resurgence-theme') ||
            'dark';
    }
}

if (!customElements.get('resurgence-header')) {
    customElements.define('resurgence-header', ResurgenceHeader);
}

export default ResurgenceHeader;
