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

const NAV_LINKS = [
    { href: 'index.html', page: 'home', label: 'Accueil', aria: "Retour à l'accueil" },
    { href: 'index.html#serveur', page: 'server', label: 'Le Serveur', aria: 'Découvrir le serveur' },
    { href: 'univers.html', page: 'universe', label: 'Univers', aria: "Explorer l'univers" },
    { href: 'regles.html', page: 'rules', label: 'Règles', aria: 'Consulter les règles' },
    { href: 'guide.html', page: 'guide', label: 'Guide', aria: 'Lire le guide du débutant' },
    { href: 'rp-geopolitique.html', page: 'rp-geopolitique', label: 'RP Géopolitique', aria: 'Les types de RP géopolitique' },
    { href: 'mecaniques.html', page: 'mecaniques', label: 'Mécaniques', aria: 'Les mécaniques et systèmes du jeu' },
    { href: 'ressources.html', page: 'resources', label: 'Ressources', aria: 'Liens utiles et outils' },
    { href: 'index.html#rejoindre', page: 'join', label: 'Rejoindre', aria: 'Nous rejoindre' },
];

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
            this.isInitialized = true;
        }
    }

    disconnectedCallback() {
        document.removeEventListener('pr-theme-change', this._onThemeChange);
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
        const links = NAV_LINKS.map(l => `
            <li><a href="${l.href}" class="nav-link" data-page="${l.page}" aria-label="${l.aria}">${l.label}</a></li>
        `).join('');

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

            </style>

            <pr-site-header title="Projet Résurgence" home-href="index.html"
                            subtitle="Site Officiel"
                            logo-src="./favicon/favicon-96x96.png"
                            theme-key="resurgence-theme"
                            year-endpoint="https://api.projet-resurgence.fr/game/date">
                <div slot="nav" class="tabs">
                    <ul class="nav-list">${links}</ul>
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

        this.updateActiveNavigation();
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
