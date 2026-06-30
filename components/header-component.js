// Header Web Component for Projet Résurgence
// Provides a reusable, self-contained header with navigation and theme toggle

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
            this.initializeTheme();
            this.isInitialized = true;
        }
    }

    disconnectedCallback() {
        this.cleanup();
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
        this.shadowRoot.innerHTML = `
            <style>
                /* Header Component - Uses centralized theme variables */
                :host {
                    /* Component inherits all theme variables from parent document */
                    display: block;
                }
				
                /* Light theme styles are handled by parent document CSS custom properties */

                /* Header Styles */
                .header {
                    background-color: var(--bg-secondary);
                    border-bottom: var(--border-width) solid var(--bg-tertiary);
                    height: var(--header-height);
                    position: fixed;
                    top: 0;
                    left: var(--intersite-navbar-offset, 34px);
                    right: 0;
                    z-index: var(--z-fixed);
                    transition: background-color var(--transition-normal), backdrop-filter var(--transition-normal);
                    backdrop-filter: var(--blur-sm);
                    font-family: var(--font-family-base);
                }

                /* Scrolled state - Enhanced blur and shadow */
                :host(.scrolled) .header {
                    background-color: var(--bg-backdrop-dark);
                    backdrop-filter: var(--blur-md);
                    box-shadow: var(--shadow-xl);
                }

                /* Scrolled state - Light theme */
                :host([data-theme="light"].scrolled) .header {
                    background-color: var(--bg-backdrop-light);
                    backdrop-filter: var(--blur-md);
                    box-shadow: var(--shadow-lg);
                }
                    
                .container {
                    max-width: var(--container-max-width);
                    margin: 0 auto;
                    padding: 0 var(--spacing-lg);
                    height: 100%;
                }

                .header-content {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    height: 100%;
                }

                .logo {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-md);
                    text-decoration: none;
                    color: inherit;
                }

                .logo picture {
                    display: flex;
                    align-items: center;
                }

                .logo img {
                    height: var(--logo-height);
                    width: auto;
                    vertical-align: middle;
                }

                .logo-text {
                    font-family: var(--font-family-title);
                    font-size: var(--font-size-2xl);
                    font-weight: var(--font-weight-bold);
                    color: var(--primary-gold);
                    text-transform: uppercase;
                }

                .nav {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-lg);
                    position: relative;
                }

                /* Mobile menu button */
                .mobile-menu-toggle {
                    display: none;
                    flex-direction: column;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: var(--spacing-sm);
                    gap: var(--spacing-xs);
                    z-index: calc(var(--z-fixed) + 1);
                }

                .hamburger-line {
                    width: var(--mobile-toggle-width);
                    height: var(--mobile-toggle-height);
                    background-color: var(--primary-gold);
                    border-radius: var(--radius-sm);
                    transition: all var(--transition-fast);
                    transform-origin: center;
                }

                /* Hamburger animation when open - X formation */
                .mobile-menu-toggle.active .hamburger-line:nth-child(1) {
                    transform: rotate(45deg) translate(var(--spacing-xs), var(--spacing-xs));
                }

                .mobile-menu-toggle.active .hamburger-line:nth-child(2) {
                    opacity: 0;
                }

                .mobile-menu-toggle.active .hamburger-line:nth-child(3) {
                    transform: rotate(-45deg) translate(calc(var(--spacing-xs) + var(--spacing-micro)), calc(var(--spacing-xs) * -1.5));
                }

                .nav-menu {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-lg);
                }

                .nav-list {
                    display: flex;
                    list-style: none;
                    gap: var(--spacing-xs);
                    margin: 0;
                    padding: 0;
                }

                .nav-link {
                    display: inline-flex;
                    align-items: center;
                    min-height: 44px;
                    color: var(--text-secondary);
                    font-size: var(--font-size-sm);
                    font-weight: var(--font-weight-medium);
                    padding: var(--spacing-sm) var(--spacing-sm);
                    border-radius: var(--radius-md);
                    transition: color var(--transition-fast), background-color var(--transition-fast), font-weight var(--transition-fast);
                    text-decoration: none;
                    white-space: nowrap;
                }

                .nav-link:hover {
                    color: var(--primary-gold);
                    background-color: var(--bg-primary);
                    text-decoration: none;
                    font-weight: var(--font-weight-bold);
                }

                .nav-link.active {
                    color: var(--primary-gold);
                    background-color: var(--bg-primary);
                    font-weight: var(--font-weight-bold);
                }

                /* Theme Toggle */
                .theme-toggle {
                    background: none;
                    border: var(--border-width-thick) solid var(--primary-gold);
                    color: var(--primary-gold);
                    padding: var(--spacing-sm) var(--spacing-md);
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    font-size: var(--font-size-sm);
                    font-weight: var(--font-weight-medium);
                    transition: all var(--transition-fast);
                }

                .theme-toggle:hover {
                    background-color: var(--primary-gold);
                    color: var(--bg-primary);
                }

                /* Mobile Responsive Design */
                .nav-backdrop {
                    display: none;
                }

                @media (max-width: 1280px) {
                    .mobile-menu-toggle {
                        display: flex;
                    }

                    .nav-backdrop {
                        display: block;
                        position: fixed;
                        top: var(--header-height);
                        left: 0;
                        right: 0;
                        height: 100vh;
                        background: rgba(0, 0, 0, 0.45);
                        opacity: 0;
                        visibility: hidden;
                        transition: opacity var(--transition-normal), visibility var(--transition-normal);
                        z-index: var(--z-fixed);
                    }

                    .nav-backdrop.active {
                        opacity: 1;
                        visibility: visible;
                    }

                    .nav-menu {
                        position: fixed;
                        top: var(--header-height);
                        left: 0;
                        right: 0;
                        width: auto;
                        min-width: 0;
                        max-width: none;
                        max-height: calc(100vh - var(--header-height));
                        overflow-y: auto;
                        background-color: var(--bg-secondary);
                        flex-direction: column;
                        align-items: stretch;
                        padding: var(--spacing-lg);
                        gap: var(--spacing-xs);
                        transform: translateY(-8px);
                        opacity: 0;
                        visibility: hidden;
                        transition: transform var(--transition-normal), opacity var(--transition-normal), visibility var(--transition-normal);
                        border: none;
                        border-top: var(--border-thin) solid var(--bg-tertiary);
                        border-radius: 0;
                        backdrop-filter: var(--blur-md);
                        z-index: calc(var(--z-fixed) + 1);
                        box-shadow: var(--shadow-xl);
                    }

                    .nav-menu.active {
                        transform: translateY(0);
                        opacity: 1;
                        visibility: visible;
                    }

                    .nav-list {
                        flex-direction: column;
                        gap: var(--spacing-xs);
                        width: 100%;
                    }

                    .nav-link {
                        padding: var(--spacing-md);
                        text-align: left;
                        border-radius: var(--radius-md);
                        width: 100%;
                        display: block;
                    }

                    .theme-toggle {
                        align-self: stretch;
                        text-align: center;
                        margin-top: var(--spacing-sm);
                    }
                }

                @media (max-width: 768px) {
                    .container {
                        padding: 0 var(--spacing-md);
                    }

                    .logo-text {
                        font-size: var(--font-size-xl);
                    }

                    .logo img {
                        height: var(--mobile-toggle-small-height);
                    }
                }

                @media (max-width: 480px) {
                    .logo-text {
                        display: none;
                    }

                    .nav-menu {
                        padding: var(--spacing-md);
                    }
                }
            </style>

            <header class="header">
                <div class="nav-backdrop" id="navBackdrop"></div>
                <div class="container">
                    <div class="header-content">
                        <a href="index.html" class="logo" aria-label="Retour à l'accueil">
                            <picture>
                                <source srcset="./images/final_logo_centered_little.webp" type="image/webp">
                                <img src="./images/final_logo_centered_little.png" 
                                     alt="Logo Projet Résurgence" 
                                     width="50" 
                                     height="50" 
                                     loading="eager" 
                                     decoding="async" 
                                     fetchpriority="high">
                            </picture>
                            <span class="logo-text">PROJET RÉSURGENCE</span>
                        </a>
                        
                        <nav class="nav" role="navigation" aria-label="Navigation principale">
                            <!-- Mobile menu button -->
                            <button class="mobile-menu-toggle" 
                                    id="mobileMenuToggle" 
                                    aria-label="Ouvrir le menu de navigation" 
                                    aria-expanded="false">
                                <span class="hamburger-line"></span>
                                <span class="hamburger-line"></span>
                                <span class="hamburger-line"></span>
                            </button>

                            <!-- Navigation menu -->
                            <div class="nav-menu" id="navMenu">
                                <ul class="nav-list">
                                    <li><a href="index.html" class="nav-link" data-page="home" aria-label="Retour à l'accueil">Accueil</a></li>
                                    <li><a href="index.html#serveur" class="nav-link" data-page="server" aria-label="Découvrir le serveur">Le Serveur</a></li>
                                    <li><a href="univers.html" class="nav-link" data-page="universe" aria-label="Explorer l'univers">Univers</a></li>
                                    <li><a href="regles.html" class="nav-link" data-page="rules" aria-label="Consulter les règles">Règles</a></li>
                                    <li><a href="guide.html" class="nav-link" data-page="guide" aria-label="Lire le guide du débutant">Guide</a></li>
                                    <li><a href="rp-geopolitique.html" class="nav-link" data-page="rp-geopolitique" aria-label="Les types de RP géopolitique">RP Géopolitique</a></li>
                                    <li><a href="mecaniques.html" class="nav-link" data-page="mecaniques" aria-label="Les mécaniques et systèmes du jeu">Mécaniques</a></li>
                                    <li><a href="ressources.html" class="nav-link" data-page="resources" aria-label="Liens utiles et outils">Ressources</a></li>
                                    <li><a href="index.html#rejoindre" class="nav-link" data-page="join" aria-label="Nous rejoindre">Rejoindre</a></li>
                                </ul>
                                <button class="theme-toggle" id="themeToggle" aria-label="Changer de thème">
                                    ☀️
                                </button>
                            </div>
                        </nav>
                    </div>
                </div>
            </header>
        `;
    }

    setupEventListeners() {
        const mobileMenuToggle = this.shadowRoot.getElementById('mobileMenuToggle');
        const navMenu = this.shadowRoot.getElementById('navMenu');
        const navBackdrop = this.shadowRoot.getElementById('navBackdrop');
        const themeToggle = this.shadowRoot.getElementById('themeToggle');
        const navLinks = this.shadowRoot.querySelectorAll('.nav-link');

        // Close mobile menu when tapping the backdrop
        if (navBackdrop) {
            navBackdrop.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        }

        // Mobile menu toggle
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        // Theme toggle
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Close mobile menu when clicking nav links
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 1280) {
                this.closeMobileMenu();
            }
        });

        // Smooth scroll for anchor links
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.includes('#')) {
                link.addEventListener('click', (e) => {
                    this.handleSmoothScroll(e, href);
                });
            }
        });

        // Update active navigation on load
        this.updateActiveNavigation();
    }

    toggleMobileMenu() {
        const mobileMenuToggle = this.shadowRoot.getElementById('mobileMenuToggle');
        const navMenu = this.shadowRoot.getElementById('navMenu');

        if (mobileMenuToggle && navMenu) {
            const isActive = navMenu.classList.contains('active');

            if (isActive) {
                this.closeMobileMenu();
            } else {
                this.openMobileMenu();
            }
        }
    }

    openMobileMenu() {
        const mobileMenuToggle = this.shadowRoot.getElementById('mobileMenuToggle');
        const navMenu = this.shadowRoot.getElementById('navMenu');
        const navBackdrop = this.shadowRoot.getElementById('navBackdrop');

        if (mobileMenuToggle && navMenu) {
            mobileMenuToggle.classList.add('active');
            navMenu.classList.add('active');
            if (navBackdrop) navBackdrop.classList.add('active');
            mobileMenuToggle.setAttribute('aria-expanded', 'true');

            // Prevent body scroll when menu is open
            document.body.style.overflow = 'hidden';
        }
    }

    closeMobileMenu() {
        const mobileMenuToggle = this.shadowRoot.getElementById('mobileMenuToggle');
        const navMenu = this.shadowRoot.getElementById('navMenu');
        const navBackdrop = this.shadowRoot.getElementById('navBackdrop');

        if (mobileMenuToggle && navMenu) {
            mobileMenuToggle.classList.remove('active');
            navMenu.classList.remove('active');
            if (navBackdrop) navBackdrop.classList.remove('active');
            mobileMenuToggle.setAttribute('aria-expanded', 'false');

            // Restore body scroll
            document.body.style.overflow = '';
        }
    }

    toggleTheme() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        this.setTheme(newTheme);
    }

    setTheme(theme) {
        // Validate theme
        if (theme !== 'dark' && theme !== 'light') {
            console.warn('Invalid theme:', theme, 'defaulting to dark');
            theme = 'dark';
        }

        // Update document theme (for global styles)
        document.documentElement.setAttribute('data-theme', theme);

        // Update body theme (for backward compatibility)
        document.body.setAttribute('data-theme', theme);

        // Update component theme (for component internal styles)
        this.setAttribute('data-theme', theme);

        // Save theme preference
        localStorage.setItem('resurgence-theme', theme);

        // Update theme toggle button
        this.updateThemeToggleButton(theme);

        // Dispatch theme change event for other components and scripts
        this.dispatchThemeChangeEvent(theme);

        // Update any theme-dependent styles
        this.updateThemeStyles(theme);
    }

    updateThemeToggleButton(theme) {
        const themeToggle = this.shadowRoot.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
            themeToggle.setAttribute('aria-label',
                theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'
            );
            themeToggle.setAttribute('title',
                theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'
            );
        }
    }

    dispatchThemeChangeEvent(theme) {
        // Dispatch from component
        this.dispatchEvent(new CustomEvent('theme-changed', {
            detail: { theme },
            bubbles: true,
            composed: true
        }));

        // Dispatch globally for other scripts
        document.dispatchEvent(new CustomEvent('theme-changed', {
            detail: { theme }
        }));

        // Dispatch on window for backward compatibility
        window.dispatchEvent(new CustomEvent('global-theme-change', {
            detail: { theme }
        }));
    }

    updateThemeStyles(theme) {
        // Force style recalculation by temporarily changing and restoring a property
        const header = this.shadowRoot.querySelector('.header');
        if (header) {
            // Trigger reflow to ensure theme changes apply immediately
            header.style.opacity = '0.999';
            requestAnimationFrame(() => {
                header.style.opacity = '';
            });
        }
    }

    initializeTheme() {
        // Check for saved theme preference, system preference, or default to dark
        let savedTheme = localStorage.getItem('resurgence-theme');

        // If no saved theme, check system preference
        if (!savedTheme) {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                savedTheme = 'light';
            } else {
                savedTheme = 'dark'; // Default to dark theme
            }
        }

        // Validate and set theme
        savedTheme = (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'dark';
        this.setTheme(savedTheme);

        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
            mediaQuery.addEventListener('change', (e) => {
                // Only auto-switch if no manual preference is saved
                if (!localStorage.getItem('resurgence-theme')) {
                    this.setTheme(e.matches ? 'light' : 'dark');
                }
            });
        }
    }

    getCurrentTheme() {
        // Check component attribute first, then document, then localStorage, then default
        return this.getAttribute('data-theme') ||
            document.documentElement.getAttribute('data-theme') ||
            localStorage.getItem('resurgence-theme') ||
            'dark';
    }

    updateActiveNavigation() {
        const navLinks = this.shadowRoot.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            link.classList.remove('active');

            const page = link.getAttribute('data-page');
            if (page === this.currentPage) {
                link.classList.add('active');
            }
        });
    }

    handleSmoothScroll(e, href) {
        const [path, hash] = href.split('#');
        const currentPath = window.location.pathname;

        // If it's the same page and has a hash, handle smooth scrolling
        if ((path === '' || currentPath.includes(path)) && hash) {
            const targetElement = document.getElementById(hash);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    }

    cleanup() {
        // Remove event listeners and clean up resources
        const mobileMenuToggle = this.shadowRoot.getElementById('mobileMenuToggle');
        const themeToggle = this.shadowRoot.getElementById('themeToggle');

        if (mobileMenuToggle) {
            mobileMenuToggle.removeEventListener('click', this.toggleMobileMenu);
        }

        if (themeToggle) {
            themeToggle.removeEventListener('click', this.toggleTheme);
        }
    }

    // Public API methods
    setActivePage(page) {
        this.currentPage = page;
        this.setAttribute('current-page', page);
        this.updateActiveNavigation();
    }
}

// Register the custom element
customElements.define('resurgence-header', ResurgenceHeader);

// Export for module usage
export default ResurgenceHeader;
