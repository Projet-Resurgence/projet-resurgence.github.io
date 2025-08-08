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
            // Use CSS variable instead of reading offsetHeight to avoid forced reflow
            const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 80;
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
        // Analytics tracking (implement with your preferred analytics service)
        console.log('Event tracked:', eventName, properties);

        // Example: Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, properties);
        }
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
