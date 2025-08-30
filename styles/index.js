// Index page specific JavaScript functionality
class IndexPage {
	constructor() {
		this.init();
	}

	init() {
		this.setupIntersectionObserver();
		this.setupServiceWorker();
		this.onPageLoad();
	}

	setupIntersectionObserver() {
		const observerOptions = {
			threshold: 0.1,
			rootMargin: '0px 0px -50px 0px'
		};

		const observer = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					entry.target.classList.add('animate-fade-in-up');
				}
			});
		}, observerOptions);

		// Observe feature cards and stat cards
		document.querySelectorAll('.feature-card, .stat-card').forEach(card => {
			observer.observe(card);
		});
	}

	setupServiceWorker() {
		if ('serviceWorker' in navigator) {
			window.addEventListener('load', () => {
				navigator.serviceWorker.register('/sw.js')
					.then(registration => {
						console.log('SW registered: ', registration);
					})
					.catch(registrationError => {
						console.log('SW registration failed: ', registrationError);
					});
			});
		}
	}

	onPageLoad() {
		window.addEventListener('load', () => {
			document.body.classList.remove('loading');
		});
	}
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => new IndexPage());
} else {
	new IndexPage();
}
