// Performance Optimization for Projet Résurgence Website
class PerformanceOptimizer {
    constructor() {
        this.init();
    }

    init() {
        this.optimizeImages();
        this.optimizeFonts();
        this.reduceMainThreadWork();
        this.optimizeCSS();
        this.implementLazyLoading();
        this.addCriticalResourceHints();
        this.optimizeThirdPartyScripts();
    }

    optimizeImages() {
        // Optimize all images with better loading strategies
        const images = document.querySelectorAll('img');

        images.forEach((img, index) => {
            // Set loading attributes
            if (!img.hasAttribute('loading')) {
                this.setImageDimensions(img);
            }

            // Optimize loading strategy
            if (index < 3) {
                // Critical images - load immediately
                img.setAttribute('loading', 'eager');
                img.setAttribute('fetchpriority', 'high');
            } else {
                // Non-critical images - lazy load
                img.setAttribute('loading', 'lazy');
                img.setAttribute('fetchpriority', 'low');
            }

            // Add error handling
            img.addEventListener('error', this.handleImageError.bind(this));

            // Add decode hint for better performance
            if (!img.hasAttribute('decoding')) {
                img.setAttribute('decoding', 'async');
            }
        });

        // Optimize picture elements specifically
        const pictures = document.querySelectorAll('picture');
        pictures.forEach((picture, index) => {
            const img = picture.querySelector('img');
            if (img && index < 3) {
                // Priority loading for critical picture elements
                img.setAttribute('fetchpriority', 'high');
            }
        });
    }

    setImageDimensions(img) {
        // Set dimensions based on common image sizes
        const src = img.getAttribute('src');

        if (src.includes('logo')) {
            img.setAttribute('width', '50');
            img.setAttribute('height', '50');
        } else if (src.includes('banner')) {
            img.setAttribute('width', '1200');
            img.setAttribute('height', '630');
        } else {
            // Default dimensions to prevent layout shift
            img.setAttribute('width', '300');
            img.setAttribute('height', '200');
        }
    }

    handleImageError(event) {
        const img = event.target;
        console.warn(`Failed to load image: ${img.src}`);

        // Replace with placeholder or hide
        img.style.display = 'none';

        // Optionally replace with a placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder';
        placeholder.style.cssText = `
            width: ${img.width || 50}px;
            height: ${img.height || 50}px;
            background-color: var(--bg-tertiary);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-muted);
            font-size: 12px;
            border-radius: var(--radius-md);
        `;
        placeholder.textContent = 'Image non disponible';

        img.parentNode.insertBefore(placeholder, img);
    }

    optimizeFonts() {
        // Optimize font loading and prevent FOIT (Flash of Invisible Text)
        if ('fonts' in document) {
            // Use font-display: swap for better performance
            const style = document.createElement('style');
            style.textContent = `
                @font-face {
                    font-family: 'System UI';
                    src: local('system-ui'), local('-apple-system'), local('BlinkMacSystemFont');
                    font-display: swap;
                }
                * {
                    font-family: 'System UI', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
            `;

            // Insert at the beginning of head for higher priority
            document.head.insertBefore(style, document.head.firstChild);
        }
    }

    reduceMainThreadWork() {
        // Use requestIdleCallback for non-critical work
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.performNonCriticalTasks();
            });
        } else {
            // Fallback for browsers without requestIdleCallback
            setTimeout(() => {
                this.performNonCriticalTasks();
            }, 100);
        }
    }

    performNonCriticalTasks() {
        // Analytics initialization
        this.initializeAnalytics();

        // Service worker registration
        this.registerServiceWorker();

        // Prefetch resources for future navigation
        this.prefetchResources();
    }

    optimizeCSS() {
        // Remove unused CSS classes and optimize critical CSS
        this.inlineCriticalCSS();

        // Defer non-critical CSS
        this.deferNonCriticalCSS();
    }

    inlineCriticalCSS() {
        // Inline critical CSS for above-the-fold content
        const criticalCSS = `
            .header { background-color: var(--bg-secondary); position: fixed; top: 0; width: 100%; z-index: 1000; }
            .hero { background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%); padding: 4rem 0; }
            .container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
            .btn { padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; display: inline-block; transition: all 0.15s; }
        `;

        const style = document.createElement('style');
        style.textContent = criticalCSS;
        document.head.appendChild(style);
    }

    deferNonCriticalCSS() {
        // Defer loading of non-critical CSS
        const links = document.querySelectorAll('link[rel="stylesheet"]');

        links.forEach(link => {
            if (!link.href.includes('main.css')) {
                link.setAttribute('media', 'print');
                link.addEventListener('load', () => {
                    link.setAttribute('media', 'all');
                });
            }
        });
    }

    implementLazyLoading() {
        // Lazy load images and iframes
        if ('IntersectionObserver' in window) {
            const lazyImageObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            lazyImageObserver.unobserve(img);
                        }
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });

            // Apply to images with data-src attribute
            document.querySelectorAll('img[data-src]').forEach(img => {
                lazyImageObserver.observe(img);
            });
        }
    }

    addCriticalResourceHints() {
        // Add resource hints for critical resources
        const hints = [
            { rel: 'preconnect', href: 'https://discord.gg' },
            { rel: 'dns-prefetch', href: '//cdn.discordapp.com' }
        ];

        hints.forEach(hint => {
            const link = document.createElement('link');
            link.rel = hint.rel;
            link.href = hint.href;
            if (hint.crossorigin) {
                link.crossOrigin = hint.crossorigin;
            }
            document.head.appendChild(link);
        });
    }

    optimizeThirdPartyScripts() {
        // Optimize third-party script loading
        this.deferNonCriticalScripts();
        this.optimizeGoogleAnalytics();
    }

    deferNonCriticalScripts() {
        // Defer loading of non-critical scripts
        const scripts = document.querySelectorAll('script[src]');

        scripts.forEach(script => {
            if (!script.src.includes('main.js') && !script.src.includes('seo-optimizer.js')) {
                script.defer = true;
            }
        });
    }

    optimizeGoogleAnalytics() {
        // Load Google Analytics asynchronously if present
        if (typeof gtag !== 'undefined') {
            // Defer GA initialization
            setTimeout(() => {
                gtag('config', 'GA_MEASUREMENT_ID', {
                    send_page_view: false
                });
            }, 3000);
        }
    }

    prefetchResources() {
        // Prefetch resources for likely next navigation
        const prefetchUrls = [
            './regles.html',
            './guide.html',
            'https://discord.gg/NuwQqWGbHc'
        ];

        prefetchUrls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            document.head.appendChild(link);
        });
    }

    initializeAnalytics() {
        // Initialize analytics with performance tracking
        if (typeof gtag !== 'undefined') {
            // Track Core Web Vitals
            this.trackCoreWebVitals();
        }
    }

    trackCoreWebVitals() {
        // Track Core Web Vitals metrics
        if ('PerformanceObserver' in window) {
            // Largest Contentful Paint
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];

                if (typeof gtag !== 'undefined') {
                    gtag('event', 'LCP', {
                        event_category: 'Web Vitals',
                        value: Math.round(lastEntry.startTime),
                        non_interaction: true
                    });
                }
            }).observe({ entryTypes: ['largest-contentful-paint'] });

            // First Input Delay
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach((entry) => {
                    const fid = entry.processingStart - entry.startTime;

                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'FID', {
                            event_category: 'Web Vitals',
                            value: Math.round(fid),
                            non_interaction: true
                        });
                    }
                });
            }).observe({ entryTypes: ['first-input'] });

            // Cumulative Layout Shift
            let clsValue = 0;
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach((entry) => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });

                if (typeof gtag !== 'undefined') {
                    gtag('event', 'CLS', {
                        event_category: 'Web Vitals',
                        value: Math.round(clsValue * 1000),
                        non_interaction: true
                    });
                }
            }).observe({ entryTypes: ['layout-shift'] });
        }
    }

    registerServiceWorker() {
        // Register service worker for caching
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then(registration => {
                        console.log('SW registered: ', registration);
                    })
                    .catch(registrationError => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }
    }

    // Method to monitor performance and report issues
    monitorPerformance() {
        // Monitor page load time
        window.addEventListener('load', () => {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;

            if (loadTime > 3000) {
                console.warn(`Slow page load detected: ${loadTime}ms`);
            }
        });

        // Monitor memory usage
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
                    console.warn('High memory usage detected');
                }
            }, 30000);
        }
    }
}

// Initialize performance optimization
document.addEventListener('DOMContentLoaded', () => {
    const optimizer = new PerformanceOptimizer();
    optimizer.monitorPerformance();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
}
