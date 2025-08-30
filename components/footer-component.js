// Footer Web Component for Projet Résurgence
// Reusable footer component with theme support and responsive design

class ResurgenceFooter extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.currentYear = new Date().getFullYear();
	}

	connectedCallback() {
		this.render();
		this.setupEventListeners();
	}

	disconnectedCallback() {
		this.cleanup();
	}

	setupEventListeners() {
		// Listen for theme changes
		document.addEventListener('theme-changed', (e) => {
			this.updateTheme(e.detail.theme);
		});

		// Handle link clicks for analytics
		this.shadowRoot.addEventListener('click', (e) => {
			if (e.target.tagName === 'A' && e.target.href) {
				this.trackFooterClick(e.target);
			}
		});
	}

	cleanup() {
		// Remove event listeners if needed
		document.removeEventListener('theme-changed', this.updateTheme);
	}

	trackFooterClick(link) {
		// Track footer link clicks for analytics
		if (window.gtag) {
			window.gtag('event', 'footer_link_click', {
				'event_category': 'Footer Navigation',
				'event_label': link.textContent.trim(),
				'value': 1
			});
		}
	}

	updateTheme(theme) {
		// Update the host element's data-theme attribute
		this.setAttribute('data-theme', theme);
	}

	getStyles() {
		return `
            <style>
                :host {
                    display: block;
                    font-family: var(--font-family-base);
                    color: var(--text-primary);
                }

                .footer {
                    background-color: var(--bg-secondary);
                    border-top: var(--border-thin) solid var(--bg-tertiary);
                    padding: var(--spacing-2xl) 0;
                    text-align: center;
                }

                .container {
                    max-width: var(--container-max-width);
                    margin: 0 auto;
                    padding: 0 var(--spacing-lg);
                }

                .footer-content {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(var(--content-min-width), 1fr));
                    gap: var(--spacing-xl);
                    margin-bottom: var(--spacing-xl);
                }

                .footer-section h3 {
                    color: var(--primary-gold);
                    margin-bottom: var(--spacing-md);
                    margin-top: 0;
                    font-size: var(--font-size-xl);
                    font-weight: var(--font-weight-semibold);
                }

                .footer-section h3.project-title {
                    font-family: var(--font-family-title);
                    font-size: var(--font-size-3xl);
                    text-transform: uppercase;
                    letter-spacing: var(--letter-spacing-wide);
                }

                .footer-section p {
                    color: var(--text-secondary);
                    line-height: 1.6;
                    margin: 0;
                }

                .footer-section ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .footer-section ul li {
                    margin-bottom: var(--spacing-sm);
                }

                .footer-section ul li a {
                    color: var(--text-secondary);
                    text-decoration: none;
                    transition: color var(--transition-normal);
                }

                .footer-section ul li a:hover {
                    color: var(--primary-gold);
                }

                .footer-bottom {
                    border-top: var(--border-thin) solid var(--bg-tertiary);
                    padding-top: var(--spacing-lg);
                    color: var(--text-muted);
                    text-align: center;
                }

                .footer-bottom p {
                    margin: 0.5rem 0;
                    font-size: 0.9rem;
                }

                /* Responsive Design */
                @media (max-width: var(--breakpoint-tablet)) {
                    .footer {
                        padding: var(--spacing-lg) 0;
                    }

                    .footer-content {
                        grid-template-columns: 1fr;
                        gap: var(--spacing-lg);
                        text-align: center;
                    }

                    .footer-section h3.project-title {
                        font-size: 1.5rem;
                    }

                    .container {
                        padding: 0 var(--spacing-md);
                    }
                }

                @media (max-width: var(--breakpoint-mobile)) {
                    .footer-section h3.project-title {
                        font-size: 1.25rem;
                    }

                    .footer-bottom p {
                        font-size: 0.8rem;
                    }
                }
            </style>
        `;
	}

	getTemplate() {
		return `
            <footer class="footer">
                <div class="container">
                    <div class="footer-content">
                        <div class="footer-section">
                            <h3 class="project-title">PROJET RÉSURGENCE</h3>
                            <p>Serveur RP géopolitique francophone post-apocalyptique sur Discord. Incarnez une nation émergente et participez à la reconstruction du monde.</p>
                        </div>

                        <div class="footer-section">
                            <h3>Liens Rapides</h3>
                            <ul>
                                <li><a href="https://discord.gg/NuwQqWGbHc" target="_blank" rel="noopener noreferrer">Discord</a></li>
                                <li><a href="regles.html">Règles</a></li>
                                <li><a href="guide.html">Guide du Débutant</a></li>
                                <li><a href="#univers">Univers</a></li>
                            </ul>
                        </div>

                        <div class="footer-section">
                            <h3>Support</h3>
                            <ul>
                                <li><a href="guide.html">Comment Commencer</a></li>
                                <li><a href="https://discord.gg/NuwQqWGbHc" target="_blank" rel="noopener noreferrer">Aide Discord</a></li>
                                <li><a href="mailto:contact@projet-resurgence.fr">Contact</a></li>
                                <li><a href="regles.html">Documentation</a></li>
                            </ul>
                        </div>

                        <div class="footer-section">
                            <h3>Communauté</h3>
                            <ul>
                                <li><a href="https://discord.gg/NuwQqWGbHc" target="_blank" rel="noopener noreferrer">Rejoindre Discord</a></li>
                                <li><a href="#univers">Découvrir l'Univers</a></li>
                                <li><a href="guide.html">Premiers Pas</a></li>
                                <li><a href="regles.html">Règlement</a></li>
                            </ul>
                        </div>
                    </div>

                    <div class="footer-bottom">
                        <p>&copy; ${this.currentYear} Projet Résurgence. Construit avec ❤️ pour la communauté RP géopolitique francophone.</p>
                        <p>Serveur Discord de roleplay géopolitique post-apocalyptique</p>
                    </div>
                </div>
            </footer>
        `;
	}

	render() {
		this.shadowRoot.innerHTML = `
            ${this.getStyles()}
            ${this.getTemplate()}
        `;

		// Set initial theme based on document theme
		const documentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
		this.updateTheme(documentTheme);
	}
}

export default ResurgenceFooter;
