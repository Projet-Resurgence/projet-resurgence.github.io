// Additional JavaScript functionality for Projet Résurgence website

class ResurgenceWebsite {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeTheme();
        this.setupAnimations();
        this.setupDiscordIntegration();
        this.setupAdvancedAnalytics();
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', this.toggleTheme.bind(this));
        }

        // Mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', this.toggleMobileMenu.bind(this));
        }

        // Smooth scrolling for all anchor links
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', this.smoothScroll.bind(this));
        });

        // Header scroll effect
        window.addEventListener('scroll', this.handleScroll.bind(this));

        // Close mobile menu when clicking outside
        document.addEventListener('click', this.handleOutsideClick.bind(this));

        // Close mobile menu when clicking nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', this.closeMobileMenu.bind(this));
        });

        // Handle window resize
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('resurgence-theme') || 'light';
        this.setTheme(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('resurgence-theme', theme);

        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
            themeToggle.setAttribute('aria-label',
                theme === 'light' ? 'Passer au mode sombre' : 'Passer au mode clair'
            );
        }
    }

    smoothScroll(e) {
        e.preventDefault();
        const targetId = e.currentTarget.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
            const targetPosition = targetElement.offsetTop - headerHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    handleScroll() {
        const header = document.querySelector('.header');
        if (!header) return;

        const scrolled = window.scrollY > 100;
        header.classList.toggle('scrolled', scrolled);
    }

    setupAnimations() {
        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in-up');

                    // Special handling for stats animation
                    if (entry.target.classList.contains('stats')) {
                        this.animateStats();
                    }
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.feature-card, .stat-card, .stats').forEach(element => {
            observer.observe(element);
        });
    }

    animateStats() {
        const statNumbers = document.querySelectorAll('.stat-number');

        statNumbers.forEach(stat => {
            const text = stat.textContent;

            if (text.includes('100+')) {
                this.animateNumber(stat, 0, 100, '+', 2000);
            } else if (text === '2045') {
                this.animateNumber(stat, 2020, 2045, '', 3000);
            }
            // 24/7 and ∞ remain static
        });
    }

    animateNumber(element, start, end, suffix, duration = 2000) {
        const startTime = performance.now();

        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(start + (end - start) * easeOutQuart);

            element.textContent = current + suffix;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };

        requestAnimationFrame(update);
    }

    setupDiscordIntegration() {
        // Discord invite handling
        const discordLinks = document.querySelectorAll('a[href*="discord.gg"]');

        discordLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Track Discord invite clicks
                this.trackEvent('discord_invite_click', {
                    source: e.target.closest('section')?.id || 'unknown'
                });
            });
        });
    }

    handleMobileMenu(e) {
        // Legacy method - kept for compatibility
        this.toggleMobileMenu();
    }

    toggleMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const navMenu = document.getElementById('navMenu');

        if (mobileMenuToggle && navMenu) {
            const isOpen = navMenu.classList.contains('active');

            if (isOpen) {
                this.closeMobileMenu();
            } else {
                this.openMobileMenu();
            }
        }
    }

    openMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const navMenu = document.getElementById('navMenu');

        if (mobileMenuToggle && navMenu) {
            navMenu.classList.add('active');
            mobileMenuToggle.classList.add('active');
            mobileMenuToggle.setAttribute('aria-expanded', 'true');
            mobileMenuToggle.setAttribute('aria-label', 'Fermer le menu de navigation');

            // Prevent body scroll when menu is open
            document.body.style.overflow = 'hidden';
        }
    }

    closeMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const navMenu = document.getElementById('navMenu');

        if (mobileMenuToggle && navMenu) {
            navMenu.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
            mobileMenuToggle.setAttribute('aria-label', 'Ouvrir le menu de navigation');

            // Restore body scroll
            document.body.style.overflow = '';
        }
    }

    handleOutsideClick(e) {
        const navMenu = document.getElementById('navMenu');
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');

        if (navMenu && navMenu.classList.contains('active')) {
            // Check if click is outside the menu and toggle button
            if (!navMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                this.closeMobileMenu();
            }
        }
    }

    handleResize() {
        // Close mobile menu on window resize (when switching to desktop)
        if (window.innerWidth > 768) {
            this.closeMobileMenu();
        }
    }

    trackEvent(eventName, properties = {}) {
        // Vérifier le consentement avant le tracking
        if (!this.hasAnalyticsConsent()) {
            console.log('📊 Analytics consent not granted, skipping tracking');
            return;
        }

        // Préparer les données pour GTM
        const eventData = {
            event: 'custom_event',
            eventName: eventName,
            eventCategory: properties.category || 'User Interaction',
            eventLabel: properties.label || '',
            eventValue: properties.value || 0,
            customParameters: {
                section: properties.section || '',
                element_type: properties.element_type || '',
                page_section: properties.page_section || '',
                interaction_type: properties.interaction_type || '',
                timestamp: new Date().toISOString(),
                page_url: window.location.href,
                page_title: document.title,
                user_agent: navigator.userAgent,
                screen_resolution: `${screen.width}x${screen.height}`,
                viewport_size: `${window.innerWidth}x${window.innerHeight}`,
                ...properties.custom
            }
        };

        // Push vers dataLayer pour GTM
        if (typeof dataLayer !== 'undefined') {
            dataLayer.push(eventData);
            console.log('📊 Event tracked via GTM:', eventName, eventData);
        }

        // Backup direct GA4 si GTM n'est pas disponible
        if (typeof gtag !== 'undefined' && typeof dataLayer === 'undefined') {
            gtag('event', eventName, {
                event_category: eventData.eventCategory,
                event_label: eventData.eventLabel,
                value: eventData.eventValue,
                custom_parameters: eventData.customParameters
            });
            console.log('📊 Event tracked via direct GA4:', eventName);
        }
    }

    // Nouvelle méthode pour vérifier le consentement
    hasAnalyticsConsent() {
        // Vérifier Axeptio
        if (window.axeptio && window.axeptio.getUserConsent) {
            const consent = window.axeptio.getUserConsent();
            return consent && consent.google_analytics;
        }

        // Fallback - vérifier localStorage
        const fallbackConsent = localStorage.getItem('fallback-consent');
        if (fallbackConsent) {
            const consent = JSON.parse(fallbackConsent);
            return consent.analytics;
        }

        return false; // Par défaut, pas de consentement
    }

    setupAdvancedAnalytics() {
        // Track all clicks with detailed context
        this.setupClickTracking();

        // Track scroll behavior
        this.setupScrollTracking();

        // Track navigation patterns
        this.setupNavigationTracking();

        // Track engagement metrics
        this.setupEngagementTracking();

        // Track feature usage
        this.setupFeatureTracking();
    }

    setupClickTracking() {
        // Track all clickable elements
        document.addEventListener('click', (e) => {
            const element = e.target.closest('a, button, [role="button"], .clickable');
            if (!element) return;

            const elementType = element.tagName.toLowerCase();
            const elementClass = element.className;
            const elementId = element.id;
            const elementText = element.textContent?.trim().substring(0, 50) || '';
            const href = element.href || '';

            // Determine click context
            let clickContext = 'unknown';
            let section = 'unknown';

            if (element.closest('.hero')) section = 'hero';
            else if (element.closest('.header')) section = 'header';
            else if (element.closest('.features')) section = 'features';
            else if (element.closest('.footer')) section = 'footer';
            else if (element.closest('.nav')) section = 'navigation';

            if (href.includes('discord.gg')) clickContext = 'discord_invite';
            else if (href.includes('#')) clickContext = 'internal_anchor';
            else if (href.includes('.html')) clickContext = 'internal_page';
            else if (elementClass.includes('btn')) clickContext = 'button';
            else if (elementClass.includes('nav-link')) clickContext = 'navigation';
            else if (elementClass.includes('theme-toggle')) clickContext = 'theme_toggle';

            this.trackEvent('click', {
                category: 'User Clicks',
                label: `${section}_${clickContext}`,
                custom: {
                    element_type: elementType,
                    element_class: elementClass,
                    element_id: elementId,
                    element_text: elementText,
                    href: href,
                    section: section,
                    click_context: clickContext,
                    page_section: section,
                    interaction_type: 'click'
                }
            });
        });

        // Track CTA button performance specifically
        document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const btnText = btn.textContent?.trim();
                const btnType = btn.classList.contains('btn-primary') ? 'primary' : 'secondary';

                this.trackEvent('cta_click', {
                    category: 'CTA Performance',
                    label: btnText,
                    custom: {
                        button_type: btnType,
                        button_text: btnText,
                        button_position: this.getElementPosition(btn)
                    }
                });
            });
        });
    }

    setupScrollTracking() {
        let scrollDepths = [25, 50, 75, 90, 100];
        let triggeredDepths = new Set();

        const trackScrollDepth = ResurgenceWebsite.throttle(() => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );

            scrollDepths.forEach(depth => {
                if (scrollPercent >= depth && !triggeredDepths.has(depth)) {
                    triggeredDepths.add(depth);
                    this.trackEvent('scroll_depth', {
                        category: 'User Engagement',
                        label: `${depth}%`,
                        value: depth,
                        custom: {
                            scroll_percentage: depth,
                            page_height: document.documentElement.scrollHeight,
                            viewport_height: window.innerHeight
                        }
                    });
                }
            });
        }, 500);

        window.addEventListener('scroll', trackScrollDepth);

        // Track time spent in sections
        this.trackSectionViews();
    }

    trackSectionViews() {
        const sections = document.querySelectorAll('section[id], .hero, .features, .stats');
        const sectionTimes = new Map();

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const sectionId = entry.target.id || entry.target.className.split(' ')[0];

                if (entry.isIntersecting) {
                    sectionTimes.set(sectionId, Date.now());
                } else if (sectionTimes.has(sectionId)) {
                    const timeSpent = Date.now() - sectionTimes.get(sectionId);
                    sectionTimes.delete(sectionId);

                    this.trackEvent('section_view_time', {
                        category: 'User Engagement',
                        label: sectionId,
                        value: Math.round(timeSpent / 1000),
                        custom: {
                            section_id: sectionId,
                            time_spent_ms: timeSpent,
                            time_spent_seconds: Math.round(timeSpent / 1000)
                        }
                    });
                }
            });
        }, { threshold: 0.5 });

        sections.forEach(section => observer.observe(section));
    }

    setupNavigationTracking() {
        // Track navigation menu usage
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const linkText = link.textContent?.trim();
                const href = link.getAttribute('href');

                this.trackEvent('navigation_click', {
                    category: 'Navigation',
                    label: linkText,
                    custom: {
                        nav_item: linkText,
                        nav_href: href,
                        nav_type: href.startsWith('#') ? 'anchor' : 'page'
                    }
                });
            });
        });

        // Track mobile menu usage
        const mobileToggle = document.getElementById('mobileMenuToggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                const isOpen = document.getElementById('navMenu')?.classList.contains('active');

                this.trackEvent('mobile_menu_toggle', {
                    category: 'Navigation',
                    label: isOpen ? 'close' : 'open',
                    custom: {
                        action: isOpen ? 'close' : 'open',
                        device_type: 'mobile'
                    }
                });
            });
        }
    }

    setupEngagementTracking() {
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.trackEvent('page_visibility', {
                category: 'User Engagement',
                label: document.hidden ? 'hidden' : 'visible',
                custom: {
                    visibility_state: document.hidden ? 'hidden' : 'visible',
                    timestamp: new Date().toISOString()
                }
            });
        });

        // Track time on page
        let startTime = Date.now();
        window.addEventListener('beforeunload', () => {
            const timeOnPage = Date.now() - startTime;
            this.trackEvent('time_on_page', {
                category: 'User Engagement',
                label: 'page_exit',
                value: Math.round(timeOnPage / 1000),
                custom: {
                    time_spent_ms: timeOnPage,
                    time_spent_seconds: Math.round(timeOnPage / 1000)
                }
            });
        });

        // Track rage clicks (multiple rapid clicks)
        let clickCount = 0;
        let clickTimer;

        document.addEventListener('click', () => {
            clickCount++;
            clearTimeout(clickTimer);

            clickTimer = setTimeout(() => {
                if (clickCount >= 3) {
                    this.trackEvent('rage_clicks', {
                        category: 'User Frustration',
                        label: 'rapid_clicks',
                        value: clickCount,
                        custom: {
                            click_count: clickCount,
                            potential_frustration: true
                        }
                    });
                }
                clickCount = 0;
            }, 1000);
        });
    }

    setupFeatureTracking() {
        // Track theme toggle usage
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');

                this.trackEvent('theme_toggle', {
                    category: 'Feature Usage',
                    label: currentTheme === 'light' ? 'to_dark' : 'to_light',
                    custom: {
                        from_theme: currentTheme,
                        to_theme: currentTheme === 'light' ? 'dark' : 'light'
                    }
                });
            });
        }

        // Track Discord link clicks with more detail
        document.querySelectorAll('a[href*="discord.gg"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const section = this.getElementSection(link);
                const linkText = link.textContent?.trim();

                this.trackEvent('discord_invite_click', {
                    category: 'Conversion',
                    label: section,
                    custom: {
                        link_text: linkText,
                        link_section: section,
                        conversion_funnel: 'discord_join',
                        cta_type: 'discord_invite'
                    }
                });
            });
        });

        // Track error states
        window.addEventListener('error', (e) => {
            this.trackEvent('javascript_error', {
                category: 'Technical Issues',
                label: e.error?.name || 'Unknown Error',
                custom: {
                    error_message: e.message,
                    error_filename: e.filename,
                    error_line: e.lineno,
                    error_column: e.colno
                }
            });
        });
    }

    getElementSection(element) {
        if (element.closest('.hero')) return 'hero';
        if (element.closest('.header')) return 'header';
        if (element.closest('.features')) return 'features';
        if (element.closest('.stats')) return 'stats';
        if (element.closest('.footer')) return 'footer';
        if (element.closest('.cta')) return 'cta';
        return 'unknown';
    }

    getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            top: Math.round(rect.top + window.scrollY),
            left: Math.round(rect.left + window.scrollX),
            viewport_top: Math.round(rect.top),
            viewport_left: Math.round(rect.left)
        };
    }

    // Utility methods
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Initialize website when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ResurgenceWebsite();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResurgenceWebsite;
}
