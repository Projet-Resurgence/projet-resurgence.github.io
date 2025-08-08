// SEO Optimization for Projet Résurgence Website
class SEOOptimizer {
    constructor() {
        this.init();
    }

    init() {
        this.addPageLoadAnalytics();
        this.optimizeImages();
        this.addStructuredDataForCurrentPage();
        this.addBreadcrumbs();
        this.optimizeInternalLinking();
        this.addSocialShareMetadata();
    }

    addPageLoadAnalytics() {
        // Track page load time for Core Web Vitals
        window.addEventListener('load', () => {
            if ('performance' in window) {
                const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
                console.log('Page Load Time:', loadTime, 'ms');

                // Send to analytics if available
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'timing_complete', {
                        name: 'load',
                        value: loadTime
                    });
                }
            }
        });
    }

    optimizeImages() {
        // Add lazy loading and optimize images
        const images = document.querySelectorAll('img');

        images.forEach(img => {
            // Add lazy loading if not already present
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }

            // Ensure all images have alt text
            if (!img.hasAttribute('alt') || img.getAttribute('alt') === '') {
                const src = img.getAttribute('src');
                if (src.includes('logo')) {
                    img.setAttribute('alt', 'Logo Projet Résurgence - Serveur RP Géopolitique');
                } else if (src.includes('banner')) {
                    img.setAttribute('alt', 'Bannière Projet Résurgence - Monde post-apocalyptique');
                } else {
                    img.setAttribute('alt', 'Image Projet Résurgence');
                }
            }
        });
    }

    addStructuredDataForCurrentPage() {
        const currentPage = window.location.pathname;

        // Add page-specific structured data
        if (currentPage.includes('regles')) {
            this.addRulesPageStructuredData();
        } else if (currentPage.includes('guide')) {
            this.addGuidePageStructuredData();
        } else if (currentPage === '/' || currentPage.includes('index')) {
            this.addHomePageFAQStructuredData();
        }
    }

    addRulesPageStructuredData() {
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Règles et Règlement - Projet Résurgence",
            "description": "Règles officielles du serveur Discord Projet Résurgence pour le roleplay géopolitique",
            "url": "https://projet-resurgence.github.io/regles.html",
            "isPartOf": {
                "@type": "WebSite",
                "name": "Projet Résurgence",
                "url": "https://projet-resurgence.github.io"
            },
            "about": {
                "@type": "Game",
                "name": "Projet Résurgence - RP Géopolitique"
            }
        };

        this.insertStructuredData(structuredData);
    }

    addGuidePageStructuredData() {
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": "Guide du Débutant - Projet Résurgence",
            "description": "Guide complet pour débuter sur le serveur de roleplay géopolitique Projet Résurgence",
            "url": "https://projet-resurgence.github.io/guide.html",
            "image": "https://projet-resurgence.github.io/images/banner.jpg",
            "totalTime": "PT30M",
            "estimatedCost": {
                "@type": "MonetaryAmount",
                "currency": "EUR",
                "value": "0"
            },
            "supply": [
                {
                    "@type": "HowToSupply",
                    "name": "Compte Discord"
                }
            ],
            "tool": [
                {
                    "@type": "HowToTool",
                    "name": "Application Discord"
                }
            ],
            "step": [
                {
                    "@type": "HowToStep",
                    "name": "Rejoindre le serveur Discord",
                    "text": "Cliquez sur le lien d'invitation Discord pour rejoindre la communauté"
                },
                {
                    "@type": "HowToStep",
                    "name": "Lire les règles",
                    "text": "Prenez connaissance du règlement du serveur"
                },
                {
                    "@type": "HowToStep",
                    "name": "Créer votre nation",
                    "text": "Concevez votre nation avec son histoire et sa culture"
                }
            ]
        };

        this.insertStructuredData(structuredData);
    }

    addHomePageFAQStructuredData() {
        const faqStructuredData = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": "Comment rejoindre le serveur Projet Résurgence ?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Cliquez sur le lien Discord, acceptez les règles, présentez-vous et créez votre nation selon nos guidelines."
                    }
                },
                {
                    "@type": "Question",
                    "name": "Faut-il avoir de l'expérience en roleplay géopolitique ?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Non ! Nous accueillons les débutants. Notre guide et la communauté vous aideront à commencer votre aventure dans le RP géopolitique."
                    }
                },
                {
                    "@type": "Question",
                    "name": "Le serveur Discord est-il actif ?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Oui, avec plus de 100 membres actifs et des événements réguliers. L'activité est constante 24h/24."
                    }
                },
                {
                    "@type": "Question",
                    "name": "Puis-je créer n'importe quel type de nation ?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Dans le cadre de notre univers post-apocalyptique, oui ! Démocratie, dictature, théocratie... tout est possible selon votre créativité."
                    }
                },
                {
                    "@type": "Question",
                    "name": "Le serveur Projet Résurgence coûte-t-il quelque chose ?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Non, Projet Résurgence est entièrement gratuit. Nous fonctionnons grâce à la passion de notre communauté francophone."
                    }
                }
            ]
        };

        this.insertStructuredData(faqStructuredData);
    }

    insertStructuredData(data) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(data);
        document.head.appendChild(script);
    }

    addBreadcrumbs() {
        const currentPage = window.location.pathname;
        const breadcrumbData = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Accueil",
                    "item": "https://projet-resurgence.github.io/"
                }
            ]
        };

        if (currentPage.includes('regles')) {
            breadcrumbData.itemListElement.push({
                "@type": "ListItem",
                "position": 2,
                "name": "Règles",
                "item": "https://projet-resurgence.github.io/regles.html"
            });
        } else if (currentPage.includes('guide')) {
            breadcrumbData.itemListElement.push({
                "@type": "ListItem",
                "position": 2,
                "name": "Guide",
                "item": "https://projet-resurgence.github.io/guide.html"
            });
        }

        this.insertStructuredData(breadcrumbData);
    }

    optimizeInternalLinking() {
        // Add rel attributes to external links
        const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="projet-resurgence.github.io"])');

        externalLinks.forEach(link => {
            if (!link.hasAttribute('rel')) {
                link.setAttribute('rel', 'noopener noreferrer');
            }

            // Add target="_blank" for Discord links if not present
            if (link.href.includes('discord.gg') && !link.hasAttribute('target')) {
                link.setAttribute('target', '_blank');
            }
        });

        // Optimize internal links
        const internalLinks = document.querySelectorAll('a[href^="#"], a[href^="/"], a[href^="./"]');

        internalLinks.forEach(link => {
            // Add descriptive titles where missing
            if (!link.hasAttribute('title') && !link.hasAttribute('aria-label')) {
                const text = link.textContent.trim();
                if (text) {
                    link.setAttribute('title', text);
                }
            }
        });
    }

    addSocialShareMetadata() {
        // Dynamic social share optimization
        const currentURL = window.location.href;
        const pageTitle = document.title;
        const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

        // Update canonical if not set
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            canonical.href = currentURL;
            document.head.appendChild(canonical);
        }

        // Ensure Open Graph URL is current
        let ogUrl = document.querySelector('meta[property="og:url"]');
        if (ogUrl) {
            ogUrl.setAttribute('content', currentURL);
        }

        // Add Twitter meta if missing
        if (!document.querySelector('meta[property="twitter:url"]')) {
            const twitterUrl = document.createElement('meta');
            twitterUrl.setAttribute('property', 'twitter:url');
            twitterUrl.setAttribute('content', currentURL);
            document.head.appendChild(twitterUrl);
        }
    }

    // Method to track user engagement for SEO
    trackUserEngagement() {
        let startTime = Date.now();
        let maxScroll = 0;

        // Track scroll depth
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            maxScroll = Math.max(maxScroll, scrollPercent);
        });

        // Track time on page when user leaves
        window.addEventListener('beforeunload', () => {
            const timeOnPage = Date.now() - startTime;

            if (typeof gtag !== 'undefined') {
                gtag('event', 'page_engagement', {
                    time_on_page: timeOnPage,
                    max_scroll_percentage: maxScroll
                });
            }
        });
    }

    // Method to improve Core Web Vitals
    optimizeCoreWebVitals() {
        // Preload critical resources
        this.preloadCriticalResources();

        // Optimize font loading
        this.optimizeFontLoading();

        // Add performance observer for metrics
        this.observePerformanceMetrics();
    }

    preloadCriticalResources() {
        // Preload CSS
        const cssLink = document.createElement('link');
        cssLink.rel = 'preload';
        cssLink.href = './styles/main.css';
        cssLink.as = 'style';
        document.head.appendChild(cssLink);

        // Preload hero image
        const heroImageLink = document.createElement('link');
        heroImageLink.rel = 'preload';
        heroImageLink.href = './images/banner.jpg';
        heroImageLink.as = 'image';
        document.head.appendChild(heroImageLink);
    }

    optimizeFontLoading() {
        // Add font-display: swap to improve FCP
        const style = document.createElement('style');
        style.textContent = `
            @font-face {
                font-family: 'System Fonts';
                src: local('Segoe UI'), local('Roboto'), local('Helvetica Neue'), local('Arial');
                font-display: swap;
            }
        `;
        document.head.appendChild(style);
    }

    observePerformanceMetrics() {
        if ('PerformanceObserver' in window) {
            // Observe Largest Contentful Paint
            const lcpObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                console.log('LCP:', lastEntry.startTime);
            });

            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

            // Observe First Input Delay
            const fidObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach((entry) => {
                    console.log('FID:', entry.processingStart - entry.startTime);
                });
            });

            fidObserver.observe({ entryTypes: ['first-input'] });
        }
    }
}

// Initialize SEO optimization when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const seoOptimizer = new SEOOptimizer();
    seoOptimizer.trackUserEngagement();
    seoOptimizer.optimizeCoreWebVitals();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SEOOptimizer;
}
