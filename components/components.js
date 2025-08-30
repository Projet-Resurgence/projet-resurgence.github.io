// Main Components Loader for Projet Résurgence
// Loads and initializes all web components

// Component initialization and utilities
class ComponentManager {
	constructor() {
		this.components = new Map();
		this.isInitialized = false;
	}

	async init() {
		if (this.isInitialized) return;

		try {
			// Load header component
			const { default: ResurgenceHeader } = await import('./header-component.js');

			// Load footer component
			const { default: ResurgenceFooter } = await import('./footer-component.js');

			// Register components
			this.registerComponent('resurgence-header', ResurgenceHeader);
			this.registerComponent('resurgence-footer', ResurgenceFooter);

			// Initialize component utilities
			this.setupGlobalEventListeners();

			this.isInitialized = true;
			console.log('Projet Résurgence Components initialized');
		} catch (error) {
			console.error('Failed to initialize components:', error);
		}
	}

	registerComponent(name, component) {
		this.components.set(name, component);

		// Ensure the component is defined
		if (!customElements.get(name)) {
			customElements.define(name, component);
		}
	}

	setupGlobalEventListeners() {
		// Listen for theme changes across components
		document.addEventListener('theme-changed', (e) => {
			this.handleGlobalThemeChange(e.detail.theme);
		});

		// Handle page navigation events
		document.addEventListener('DOMContentLoaded', () => {
			this.updatePageContext();
		});

		// Handle browser back/forward navigation
		window.addEventListener('popstate', () => {
			this.updatePageContext();
		});
	}

	handleGlobalThemeChange(theme) {
		// Apply theme to body for components that need it
		document.body.setAttribute('data-theme', theme);

		// Update any global styles that depend on theme
		this.updateGlobalThemeStyles(theme);

		// Dispatch event for other scripts
		window.dispatchEvent(new CustomEvent('global-theme-change', {
			detail: { theme }
		}));
	}

	updateGlobalThemeStyles(theme) {
		// Update data-theme attribute - CSS handles the rest via centralized theme system
		const root = document.documentElement;
		root.setAttribute('data-theme', theme);
	}

	updatePageContext() {
		// Determine current page
		const pathname = window.location.pathname;
		let currentPage = 'home';

		if (pathname.includes('regles.html')) {
			currentPage = 'rules';
		} else if (pathname.includes('guide.html')) {
			currentPage = 'guide';
		} else if (pathname.includes('univers.html')) {
			currentPage = 'universe';
		} else if (pathname.includes('index.html') || pathname === '/') {
			// Check for hash to determine specific section
			const hash = window.location.hash;
			if (hash === '#serveur') {
				currentPage = 'server';
			} else if (hash === '#rejoindre') {
				currentPage = 'join';
			} else {
				currentPage = 'home';
			}
		}

		// Update all header components
		const headers = document.querySelectorAll('resurgence-header');
		headers.forEach(header => {
			header.setActivePage(currentPage);
		});
	}

	// Utility methods for other scripts
	getComponent(name) {
		return this.components.get(name);
	}

	getAllComponents() {
		return this.components;
	}

	// Theme utilities
	getCurrentTheme() {
		return document.documentElement.getAttribute('data-theme') ||
			localStorage.getItem('resurgence-theme') ||
			'dark';
	}

	setTheme(theme) {
		const headers = document.querySelectorAll('resurgence-header');
		if (headers.length > 0) {
			// Use header component's setTheme method which handles everything
			headers[0].setTheme(theme);
		} else {
			// Fallback if no header component is present
			document.documentElement.setAttribute('data-theme', theme);
			document.body.setAttribute('data-theme', theme);
			localStorage.setItem('resurgence-theme', theme);
			this.updateGlobalThemeStyles(theme);
		}
	}
}

// Create global instance
const componentManager = new ComponentManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => componentManager.init());
} else {
	componentManager.init();
}

// Export for global access
window.ResurgenceComponents = componentManager;

export default componentManager;
