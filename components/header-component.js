// Header Web Component for Projet Résurgence
// Thin wrapper around the shared <pr-site-header> (components/site-header.js),
// the same header used by play./tech./calc./catalog. This component only owns
// what is specific to the vitrine site: the page nav links, the mobile menu,
// smooth-scroll for in-page anchors, and the legacy theme events other
// scripts on this site listen to.

// Versioned import: Cloudflare caches /components/* by path regardless of the
// origin's no-cache header, so any content change here needs a new ?v= key.
import './site-header.js?v=1.3.0';

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
                /* The sticky element has to be this host — it is the one in the
                   page's flow. <pr-site-header> inside is sticky against this
                   box, which is exactly its own size, so it never moves on its
                   own. */
                :host {
                    display: block;
                    position: sticky;
                    top: 0;
                    z-index: var(--z-fixed, 1000);
                }

                .nav-menu {
                    display: flex;
                    align-items: center;
                }

                .nav-list {
                    display: flex;
                    align-items: center;
                    list-style: none;
                    gap: 2px;
                    margin: 0;
                    padding: 0;
                }

                /* Textual underline tabs — same treatment as the Game Dashboard */
                .nav-link {
                    display: inline-flex;
                    align-items: center;
                    color: #808080;
                    font-family: 'Inter', system-ui, sans-serif;
                    font-size: 0.9rem;
                    font-weight: 500;
                    padding: 0.75rem 0.6rem;
                    border-bottom: 2px solid transparent;
                    transition: color 0.15s, border-color 0.15s;
                    text-decoration: none;
                    white-space: nowrap;
                }

                :host([data-theme="light"]) .nav-link { color: #718096; }

                .nav-link:hover { color: #f0f0f0; text-decoration: none; }
                :host([data-theme="light"]) .nav-link:hover { color: #1a202c; }

                .nav-link.active {
                    color: #D5B654;
                    border-bottom-color: #D5B654;
                }

                /* Mobile menu button */
                .mobile-menu-toggle {
                    display: none;
                    flex-direction: column;
                    justify-content: center;
                    gap: 4px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 8px;
                }

                .hamburger-line {
                    width: 22px;
                    height: 2px;
                    background-color: #D5B654;
                    border-radius: 2px;
                    transition: all 0.2s;
                    transform-origin: center;
                }

                .mobile-menu-toggle.active .hamburger-line:nth-child(1) { transform: rotate(45deg) translate(4px, 4px); }
                .mobile-menu-toggle.active .hamburger-line:nth-child(2) { opacity: 0; }
                .mobile-menu-toggle.active .hamburger-line:nth-child(3) { transform: rotate(-45deg) translate(5px, -6px); }

                .nav-backdrop { display: none; }

                @media (max-width: 1280px) {
                    .mobile-menu-toggle { display: flex; }

                    .nav-backdrop {
                        display: block;
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.45);
                        opacity: 0;
                        visibility: hidden;
                        transition: opacity 0.2s, visibility 0.2s;
                        z-index: 1;
                    }

                    .nav-backdrop.active { opacity: 1; visibility: visible; }

                    .nav-menu {
                        position: absolute;
                        top: 100%;
                        left: 0;
                        right: 0;
                        max-height: calc(100vh - 100%);
                        overflow-y: auto;
                        background-color: #161616;
                        flex-direction: column;
                        align-items: stretch;
                        padding: 1rem;
                        transform: translateY(-8px);
                        opacity: 0;
                        visibility: hidden;
                        transition: transform 0.2s, opacity 0.2s, visibility 0.2s;
                        border-top: 1px solid #2d2d2d;
                        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
                        z-index: 2;
                    }

                    :host([data-theme="light"]) .nav-menu { background-color: #ffffff; }

                    .nav-menu.active { transform: translateY(0); opacity: 1; visibility: visible; }

                    .nav-list { flex-direction: column; align-items: stretch; gap: 2px; width: 100%; }

                    .nav-link {
                        padding: 0.75rem 1rem;
                        border-bottom: none;
                        border-left: 2px solid transparent;
                        border-radius: 6px;
                        width: 100%;
                    }

                    .nav-link.active { border-bottom-color: transparent; border-left-color: #D5B654; }
                }
            </style>

            <pr-site-header title="Projet Résurgence" home-href="index.html"
                            subtitle="Site Officiel"
                            logo-src="./favicon/favicon-96x96.png"
                            theme-key="resurgence-theme"
                            year-endpoint="https://api.projet-resurgence.fr/game/date">
                <div slot="nav">
                    <button class="mobile-menu-toggle" id="mobileMenuToggle"
                            aria-label="Ouvrir le menu de navigation" aria-expanded="false">
                        <span class="hamburger-line"></span>
                        <span class="hamburger-line"></span>
                        <span class="hamburger-line"></span>
                    </button>
                    <div class="nav-backdrop" id="navBackdrop"></div>
                    <nav class="nav-menu" id="navMenu" role="navigation" aria-label="Navigation principale">
                        <ul class="nav-list">${links}</ul>
                    </nav>
                </div>
            </pr-site-header>
        `;
    }

    setupEventListeners() {
        const mobileMenuToggle = this.shadowRoot.getElementById('mobileMenuToggle');
        const navBackdrop = this.shadowRoot.getElementById('navBackdrop');
        const navLinks = this.shadowRoot.querySelectorAll('.nav-link');

        navBackdrop?.addEventListener('click', () => this.closeMobileMenu());
        mobileMenuToggle?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMobileMenu();
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => this.closeMobileMenu());

            const href = link.getAttribute('href');
            if (href && href.includes('#')) {
                link.addEventListener('click', (e) => this.handleSmoothScroll(e, href));
            }
        });

        document.addEventListener('click', (e) => {
            if (!this.contains(e.target)) this.closeMobileMenu();
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 1280) this.closeMobileMenu();
        });

        this.updateActiveNavigation();
    }

    // ── Theme ──
    // <pr-site-header> owns the toggle and writes data-theme + localStorage.
    // Re-broadcast under this site's legacy event names, which main.js,
    // footer-component.js and the analytics code already listen for.
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

    toggleMobileMenu() {
        const navMenu = this.shadowRoot.getElementById('navMenu');
        if (navMenu?.classList.contains('active')) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    openMobileMenu() {
        const mobileMenuToggle = this.shadowRoot.getElementById('mobileMenuToggle');
        const navMenu = this.shadowRoot.getElementById('navMenu');
        const navBackdrop = this.shadowRoot.getElementById('navBackdrop');
        if (!mobileMenuToggle || !navMenu) return;

        mobileMenuToggle.classList.add('active');
        navMenu.classList.add('active');
        navBackdrop?.classList.add('active');
        mobileMenuToggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    closeMobileMenu() {
        const mobileMenuToggle = this.shadowRoot.getElementById('mobileMenuToggle');
        const navMenu = this.shadowRoot.getElementById('navMenu');
        const navBackdrop = this.shadowRoot.getElementById('navBackdrop');
        if (!mobileMenuToggle || !navMenu) return;

        mobileMenuToggle.classList.remove('active');
        navMenu.classList.remove('active');
        navBackdrop?.classList.remove('active');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
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

    // ── Public API (unchanged for callers) ──
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

// Register the custom element
if (!customElements.get('resurgence-header')) {
    customElements.define('resurgence-header', ResurgenceHeader);
}

// Export for module usage
export default ResurgenceHeader;
