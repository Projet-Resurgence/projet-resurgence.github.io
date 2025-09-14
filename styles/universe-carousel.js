// Universe Carousel JavaScript for Projet Résurgence

class UniverseCarousel {
	constructor() {
		this.stories = [];
		this.currentSlide = 0;
		this.isAutoPlaying = true;
		this.autoPlayInterval = null;
		this.autoPlayDelay = 5000; // 5 seconds

		this.elements = {
			track: null,
			prevBtn: null,
			nextBtn: null,
			indicators: null,
			modal: null,
			modalBody: null,
			modalClose: null,
			modalOverlay: null
		};

		this.templates = {
			storyCard: null,
			storyModal: null
		};

		this.init();
	}

	async init() {
		try {
			// Wait for Handlebars to be loaded
			if (typeof Handlebars === 'undefined') {
				await this.waitForHandlebars();
			}

			this.initializeElements();
			this.compileTemplates();
			await this.loadStories();
			this.setupEventListeners();
			this.startAutoPlay();

			console.log('Universe Carousel initialized successfully');
		} catch (error) {
			console.error('Error initializing Universe Carousel:', error);
		}
	}

	waitForHandlebars() {
		return new Promise((resolve) => {
			const checkHandlebars = () => {
				if (typeof Handlebars !== 'undefined') {
					resolve();
				} else {
					setTimeout(checkHandlebars, 100);
				}
			};
			checkHandlebars();
		});
	}

	initializeElements() {
		this.elements = {
			track: document.getElementById('carouselTrack'),
			prevBtn: document.getElementById('prevBtn'),
			nextBtn: document.getElementById('nextBtn'),
			indicators: document.getElementById('carouselIndicators'),
			modal: document.getElementById('storyModal'),
			modalBody: document.getElementById('storyModalBody'),
			modalClose: document.getElementById('storyModalClose'),
			modalOverlay: document.getElementById('storyModalOverlay')
		};

		// Verify all elements exist
		for (const [key, element] of Object.entries(this.elements)) {
			if (!element) {
				console.warn(`Element ${key} not found`);
			}
		}
	}

	compileTemplates() {
		const storyCardTemplate = document.getElementById('story-card-template');
		const storyModalTemplate = document.getElementById('story-modal-template');

		if (storyCardTemplate) {
			this.templates.storyCard = Handlebars.compile(storyCardTemplate.innerHTML);
		}

		if (storyModalTemplate) {
			this.templates.storyModal = Handlebars.compile(storyModalTemplate.innerHTML);
		}
	}

	async loadStories() {
		try {
			// List of story files to load
			const storyFiles = ['vladivostok.json','suede.json','aral.json',  'hollande.json', 'shanghai.json', 'ouganda.json', 'eglise.json', 'naples.json', 'colorado.json'];
			const loadPromises = storyFiles.map(file => this.loadStory(file));

			const results = await Promise.allSettled(loadPromises);

			results.forEach((result, index) => {
				if (result.status === 'fulfilled') {
					this.stories.push({
						...result.value,
						fileName: storyFiles[index],
						index: this.stories.length
					});
				} else {
					console.warn(`Failed to load story ${storyFiles[index]}:`, result.reason);
				}
			});

			if (this.stories.length > 0) {
				this.renderCarousel();
				this.updateControls();
			} else {
				this.showErrorMessage();
			}

		} catch (error) {
			console.error('Error loading stories:', error);
			this.showErrorMessage();
		}
	}

	async loadStory(fileName) {
		try {
			const response = await fetch(`./context_datas/${fileName}`);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const story = await response.json();

			// Validate story structure
			if (!story.story_name || !story.hero_name || !story.text || !story.image_url_from_root) {
				throw new Error(`Invalid story structure in ${fileName}`);
			}

			return story;
		} catch (error) {
			console.error(`Error loading story ${fileName}:`, error);
			throw error;
		}
	}

	renderCarousel() {
		if (!this.elements.track || !this.templates.storyCard) return;

		// Clear existing content
		this.elements.track.innerHTML = '';

		// Render story cards
		this.stories.forEach((story, index) => {
			const cardHTML = this.templates.storyCard({
				...story,
				index: index
			});
			this.elements.track.insertAdjacentHTML('beforeend', cardHTML);
		});

		// Render indicators
		this.renderIndicators();

		// Update carousel position
		this.updateCarouselPosition();
	}

	renderIndicators() {
		if (!this.elements.indicators) return;

		this.elements.indicators.innerHTML = '';

		this.stories.forEach((_, index) => {
			const indicator = document.createElement('button');
			indicator.className = `carousel-indicator ${index === this.currentSlide ? 'active' : ''}`;
			indicator.setAttribute('aria-label', `Aller à l'histoire ${index + 1}`);
			indicator.addEventListener('click', () => this.goToSlide(index));
			this.elements.indicators.appendChild(indicator);
		});
	}

	setupEventListeners() {
		// Navigation buttons
		if (this.elements.prevBtn) {
			this.elements.prevBtn.addEventListener('click', () => this.previousSlide());
		}

		if (this.elements.nextBtn) {
			this.elements.nextBtn.addEventListener('click', () => this.nextSlide());
		}

		// Story card clicks
		if (this.elements.track) {
			this.elements.track.addEventListener('click', (e) => {
				const storyCard = e.target.closest('.story-card');
				if (storyCard) {
					const storyFileName = storyCard.dataset.story;
					this.openStoryModal(storyFileName);
				}
			});
		}

		// Modal controls
		if (this.elements.modalClose) {
			this.elements.modalClose.addEventListener('click', () => this.closeStoryModal());
		}

		if (this.elements.modalOverlay) {
			this.elements.modalOverlay.addEventListener('click', () => this.closeStoryModal());
		}

		// Keyboard navigation
		document.addEventListener('keydown', (e) => this.handleKeyboard(e));

		// Pause auto-play on hover
		if (this.elements.track) {
			this.elements.track.addEventListener('mouseenter', () => this.pauseAutoPlay());
			this.elements.track.addEventListener('mouseleave', () => this.resumeAutoPlay());
		}

		// Touch/swipe support for mobile
		this.setupTouchEvents();
	}

	setupTouchEvents() {
		if (!this.elements.track) return;

		let startX = 0;
		let endX = 0;

		this.elements.track.addEventListener('touchstart', (e) => {
			startX = e.touches[0].clientX;
		}, { passive: true });

		this.elements.track.addEventListener('touchend', (e) => {
			endX = e.changedTouches[0].clientX;
			this.handleSwipe(startX, endX);
		}, { passive: true });
	}

	handleSwipe(startX, endX) {
		const threshold = 50; // Minimum distance for swipe
		const difference = startX - endX;

		if (Math.abs(difference) < threshold) return;

		if (difference > 0) {
			// Swipe left - next slide
			this.nextSlide();
		} else {
			// Swipe right - previous slide
			this.previousSlide();
		}
	}

	handleKeyboard(e) {
		if (this.elements.modal && this.elements.modal.classList.contains('active')) {
			if (e.key === 'Escape') {
				this.closeStoryModal();
			}
			return;
		}

		switch (e.key) {
			case 'ArrowLeft':
				e.preventDefault();
				this.previousSlide();
				break;
			case 'ArrowRight':
				e.preventDefault();
				this.nextSlide();
				break;
		}
	}

	nextSlide() {
		this.pauseAutoPlay();
		this.currentSlide = (this.currentSlide + 1) % this.stories.length;
		this.updateCarousel();
		this.resumeAutoPlay();
		this.trackCarouselEvent('next');
	}

	previousSlide() {
		this.pauseAutoPlay();
		this.currentSlide = this.currentSlide === 0 ? this.stories.length - 1 : this.currentSlide - 1;
		this.updateCarousel();
		this.resumeAutoPlay();
		this.trackCarouselEvent('previous');
	}

	goToSlide(index) {
		if (index < 0 || index >= this.stories.length) return;

		this.pauseAutoPlay();
		this.currentSlide = index;
		this.updateCarousel();
		this.resumeAutoPlay();
		this.trackCarouselEvent('indicator', { slide_index: index });
	}

	updateCarousel() {
		this.updateCarouselPosition();
		this.updateControls();
		this.updateIndicators();
	}

	updateCarouselPosition() {
		if (!this.elements.track) return;

		const translateX = -this.currentSlide * 100;
		this.elements.track.style.transform = `translateX(${translateX}%)`;
	}

	updateControls() {
		if (!this.elements.prevBtn || !this.elements.nextBtn) return;

		// For infinite loop, never disable buttons
		this.elements.prevBtn.disabled = false;
		this.elements.nextBtn.disabled = false;
	}

	updateIndicators() {
		if (!this.elements.indicators) return;

		const indicators = this.elements.indicators.querySelectorAll('.carousel-indicator');
		indicators.forEach((indicator, index) => {
			indicator.classList.toggle('active', index === this.currentSlide);
		});
	}

	openStoryModal(storyFileName) {
		const story = this.stories.find(s => s.fileName === storyFileName);
		if (!story || !this.elements.modal || !this.templates.storyModal) return;

		// Prepare story data for template
		let textParagraphs;

		if (Array.isArray(story.text)) {
			// Handle text as array
			textParagraphs = story.text.map((paragraph, index) => {
				if (index === 0) {
					// First paragraph - no special formatting
					return paragraph.trim();
				} else {
					// Other paragraphs - add 4 spaces at the beginning if not already present
					const trimmed = paragraph.trim();
					return trimmed.startsWith('    ') ? trimmed : '    ' + trimmed;
				}
			}).filter(p => p.trim());
		} else {
			// Handle text as string (fallback)
			textParagraphs = story.text.split('\n').filter(p => p.trim());
		}

		const storyData = {
			...story,
			textParagraphs: textParagraphs
		};

		// Render modal content
		this.elements.modalBody.innerHTML = this.templates.storyModal(storyData);

		// Show modal
		this.elements.modal.classList.add('active');
		document.body.style.overflow = 'hidden';

		// Pause carousel auto-play
		this.pauseAutoPlay();

		// Track modal open
		this.trackStoryEvent('modal_open', story);
	}

	closeStoryModal() {
		if (!this.elements.modal) return;

		this.elements.modal.classList.remove('active');
		document.body.style.overflow = '';

		// Resume carousel auto-play
		this.resumeAutoPlay();

		// Track modal close
		this.trackStoryEvent('modal_close');
	}

	startAutoPlay() {
		if (!this.isAutoPlaying || this.stories.length <= 1) return;

		this.autoPlayInterval = setInterval(() => {
			this.nextSlide();
		}, this.autoPlayDelay);
	}

	pauseAutoPlay() {
		if (this.autoPlayInterval) {
			clearInterval(this.autoPlayInterval);
			this.autoPlayInterval = null;
		}
	}

	resumeAutoPlay() {
		if (this.isAutoPlaying && !this.autoPlayInterval) {
			this.startAutoPlay();
		}
	}

	showErrorMessage() {
		if (!this.elements.track) return;

		this.elements.track.innerHTML = `
            <li class="carousel-slide">
                <div class="error-message">
                    <h3>Erreur de chargement</h3>
                    <p>Impossible de charger les chroniques. Veuillez réessayer plus tard.</p>
                </div>
            </li>
        `;

		// Hide controls
		if (this.elements.prevBtn) this.elements.prevBtn.style.display = 'none';
		if (this.elements.nextBtn) this.elements.nextBtn.style.display = 'none';
		if (this.elements.indicators) this.elements.indicators.style.display = 'none';
	}

	// Analytics tracking methods
	trackCarouselEvent(action, additionalData = {}) {
		if (typeof window !== 'undefined' && window.gtag) {
			window.gtag('event', 'carousel_interaction', {
				event_category: 'Universe Carousel',
				event_label: action,
				current_slide: this.currentSlide,
				total_slides: this.stories.length,
				...additionalData
			});
		}

		// Track with existing ResurgenceWebsite analytics if available
		if (typeof window !== 'undefined' && window.resurgenceWebsite && window.resurgenceWebsite.trackEvent) {
			window.resurgenceWebsite.trackEvent('carousel_interaction', {
				category: 'Universe Carousel',
				label: action,
				section: 'universe_page',
				interaction_type: 'carousel_navigation',
				custom: {
					current_slide: this.currentSlide,
					total_slides: this.stories.length,
					...additionalData
				}
			});
		}
	}

	trackStoryEvent(action, story = null) {
		const eventData = {
			event_category: 'Story Interaction',
			event_label: action
		};

		if (story) {
			eventData.story_name = story.story_name;
			eventData.hero_name = story.hero_name;
			eventData.story_file = story.fileName;
		}

		if (typeof window !== 'undefined' && window.gtag) {
			window.gtag('event', 'story_interaction', eventData);
		}

		// Track with existing ResurgenceWebsite analytics if available
		if (typeof window !== 'undefined' && window.resurgenceWebsite && window.resurgenceWebsite.trackEvent) {
			window.resurgenceWebsite.trackEvent('story_interaction', {
				category: 'Story Interaction',
				label: action,
				section: 'universe_page',
				interaction_type: 'story_modal',
				custom: eventData
			});
		}
	}

	// Public API methods
	getStories() {
		return this.stories;
	}

	getCurrentSlide() {
		return this.currentSlide;
	}

	setAutoPlay(enabled) {
		this.isAutoPlaying = enabled;
		if (enabled) {
			this.startAutoPlay();
		} else {
			this.pauseAutoPlay();
		}
	}

	destroy() {
		this.pauseAutoPlay();
		// Remove event listeners if needed
		// Clean up elements
	}
}

// Initialize carousel when function is called from HTML
function initializeStoriesCarousel() {
	if (typeof window !== 'undefined') {
		window.universeCarousel = new UniverseCarousel();
	}
}

// Auto-initialize if DOM is already loaded
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initializeStoriesCarousel);
} else {
	initializeStoriesCarousel();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
	module.exports = UniverseCarousel;
}
