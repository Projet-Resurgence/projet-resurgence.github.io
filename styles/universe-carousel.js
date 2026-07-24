class UniverseStories {
	constructor() {
		this.stories = [];
		this.carousel = null;
		this.modal = null;
		this.modalBody = null;
		this.init();
	}

	async init() {
		try {
			this.modal = document.getElementById('storyModal');
			this.modalBody = document.getElementById('storyModalBody');
			const modalClose = document.getElementById('storyModalClose');
			const modalOverlay = document.getElementById('storyModalOverlay');

			if (modalClose) modalClose.addEventListener('click', () => this.closeModal());
			if (modalOverlay) modalOverlay.addEventListener('click', () => this.closeModal());
			document.addEventListener('keydown', (e) => {
				if (e.key === 'Escape' && this.modal && this.modal.classList.contains('active')) {
					this.closeModal();
				}
			});

			await this.loadStories();
			this.renderCarousel();

			console.log('UniverseStories initialized');
		} catch (error) {
			console.error('UniverseStories init error:', error);
		}
	}

	async loadStories() {
		const storyFiles = [
			'vladivostok.json', 'suede.json', 'aral.json',
			'hollande.json', 'shanghai.json', 'ouganda.json',
			'eglise.json', 'naples.json', 'colorado.json'
		];

		const results = await Promise.allSettled(
			storyFiles.map(file =>
				fetch(`./context_datas/${file}?v=1.2.0`)
					.then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
					.then(data => ({ ...data, fileName: file }))
			)
		);

		results.forEach((result) => {
			if (result.status === 'fulfilled' && result.value.story_name) {
				this.stories.push(result.value);
			}
		});
	}

	renderCarousel() {
		const track = document.getElementById('carouselTrack');
		if (!track || this.stories.length === 0) return;

		track.innerHTML = '';

		this.stories.forEach((story, i) => {
			const slide = document.createElement('div');
			slide.className = 'pr-carousel-slide';

			const firstParagraph = Array.isArray(story.text) ? story.text[0] : '';
			const excerpt = firstParagraph.trim().substring(0, 120) + '...';

			slide.innerHTML = `
				<div class="pr-carousel-card" tabindex="0" data-story="${story.fileName}" role="button" aria-label="Lire ${story.story_name}">
					<img class="pr-carousel-card-img" src="${story.image_url_from_root}" alt="${story.story_name}" loading="lazy" decoding="async">
					<div class="pr-carousel-card-overlay"></div>
					<div class="pr-carousel-card-content">
						<span class="pr-carousel-card-tag">Chronique</span>
						<h3 class="pr-carousel-card-title">${story.story_name}</h3>
						<p class="pr-carousel-card-desc">${excerpt}</p>
						<span class="pr-carousel-card-action">
							Lire l'histoire
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
						</span>
					</div>
				</div>
			`;

			track.appendChild(slide);
		});

		track.addEventListener('click', (e) => {
			const card = e.target.closest('.pr-carousel-card');
			if (card) this.openModal(card.dataset.story);
		});

		track.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				const card = e.target.closest('.pr-carousel-card');
				if (card) this.openModal(card.dataset.story);
			}
		});

		if (typeof PRDS !== 'undefined' && PRDS.PrCarousel) {
			const root = document.querySelector('.pr-carousel');
			if (root) {
				if (root._prCarousel) root._prCarousel.destroy();
				this.carousel = new PRDS.PrCarousel(root, {
					visible: 3,
					autoplay: true,
					interval: 6000,
					loop: true
				});
				console.log('PrCarousel initialized with', this.stories.length, 'slides');
			}
		} else {
			console.warn('PRDS.PrCarousel not available, carousel disabled');
		}
	}

	openModal(fileName) {
		const story = this.stories.find(s => s.fileName === fileName);
		if (!story || !this.modal || !this.modalBody) return;

		const paragraphs = Array.isArray(story.text)
			? story.text.map(p => p.trim()).filter(Boolean)
			: story.text.split('\n').filter(p => p.trim());

		this.modalBody.innerHTML = `
			<div class="story-modal-header">
				<h2 class="story-modal-title">${story.story_name}</h2>
				<p class="story-modal-hero">Chroniques de ${story.hero_name}</p>
			</div>
			<div class="story-modal-text">
				${paragraphs.map(p => `<p>${p}</p>`).join('')}
			</div>
		`;

		this.modal.classList.add('active');
		document.body.style.overflow = 'hidden';

		if (this.carousel) this.carousel._pauseAutoplay();

		if (window.gtag) {
			window.gtag('event', 'story_interaction', {
				event_category: 'Story Interaction',
				event_label: 'modal_open',
				story_name: story.story_name,
				hero_name: story.hero_name
			});
		}
	}

	closeModal() {
		if (!this.modal) return;
		this.modal.classList.remove('active');
		document.body.style.overflow = '';
		if (this.carousel && this.carousel.isPlaying) this.carousel._startAutoplay();
	}
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => new UniverseStories());
} else {
	new UniverseStories();
}
