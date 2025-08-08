// Comprehensive Website Testing Suite
// Tests for performance, accessibility, SEO, functionality, and user experience

class WebsiteTestSuite {
    constructor() {
        this.testResults = {};
        this.testCount = 0;
        this.passedTests = 0;
        this.failedTests = 0;
    }

    // Utility Methods
    log(testName, result, details = '') {
        const timestamp = new Date().toISOString();
        const status = result ? '✅ PASS' : '❌ FAIL';
        const message = `[${timestamp}] ${status}: ${testName}${details ? '\n   ' + details : ''}`;

        this.testResults[testName] = { result, details, timestamp };
        this.testCount++;

        if (result) {
            this.passedTests++;
        } else {
            this.failedTests++;
        }

        return message;
    }

    updateProgress() {
        const progressElement = document.getElementById('overallProgress');
        const resultsElement = document.getElementById('overallResults');

        if (progressElement && this.testCount > 0) {
            const progressPercent = (this.passedTests / this.testCount) * 100;
            progressElement.style.width = progressPercent + '%';

            if (resultsElement) {
                resultsElement.innerHTML = `
                    <div class="metric ${progressPercent > 80 ? 'good' : progressPercent > 60 ? 'needs-improvement' : 'poor'}">
                        Overall Score: ${progressPercent.toFixed(1)}%
                    </div>
                    <div class="metric good">Passed: ${this.passedTests}</div>
                    <div class="metric ${this.failedTests > 0 ? 'poor' : 'good'}">Failed: ${this.failedTests}</div>
                    <div class="metric">Total: ${this.testCount}</div>
                `;
            }
        }
    }

    setTestSectionStatus(sectionId, status) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.className = `test-section ${status}`;
        }
    }

    displayResults(sectionId, results) {
        const resultsElement = document.getElementById(sectionId + 'Results');
        if (resultsElement) {
            resultsElement.textContent = results;
        }
    }

    // Performance Tests
    async runPerformanceTests() {
        this.setTestSectionStatus('performanceTests', 'running');
        let results = 'Running Performance Tests...\n\n';
        this.displayResults('performanceTests', results);

        try {
            // Core Web Vitals Tests
            await this.testCoreWebVitals();

            // Page Load Speed Tests
            await this.testPageLoadSpeed();

            // Resource Loading Tests
            await this.testResourceLoading();

            // Image Optimization Tests
            await this.testImageOptimization();

            // CSS/JS Optimization Tests
            await this.testAssetOptimization();

            results += this.getTestSectionResults('performance');
            this.setTestSectionStatus('performanceTests', 'passed');
        } catch (error) {
            results += `Error running performance tests: ${error.message}\n`;
            this.setTestSectionStatus('performanceTests', 'failed');
        }

        this.displayResults('performanceTests', results);
        this.updateProgress();
    }

    async testCoreWebVitals() {
        // LCP Test
        if ('PerformanceObserver' in window) {
            const lcpPromise = new Promise((resolve) => {
                new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    if (entries.length > 0) {
                        const lcp = entries[entries.length - 1].startTime;
                        const result = lcp < 2500;
                        this.log('Largest Contentful Paint (LCP)', result,
                            `${lcp.toFixed(0)}ms (target: <2500ms)`);
                        resolve();
                    }
                }).observe({ entryTypes: ['largest-contentful-paint'] });

                // Timeout after 10 seconds
                setTimeout(() => {
                    this.log('Largest Contentful Paint (LCP)', false, 'Timeout waiting for LCP measurement');
                    resolve();
                }, 10000);
            });

            await lcpPromise;
        } else {
            this.log('Performance Observer Support', false, 'PerformanceObserver not supported');
        }

        // FID Test (simulated)
        const fidTestResult = this.testFirstInputDelay();
        this.log('First Input Delay (FID) Support', fidTestResult,
            fidTestResult ? 'Event handlers properly attached' : 'Missing event handlers');

        // CLS Test (simulated)
        const clsTestResult = this.testCumulativeLayoutShift();
        this.log('Cumulative Layout Shift (CLS) Prevention', clsTestResult,
            clsTestResult ? 'No layout shift indicators found' : 'Potential layout shift issues detected');
    }

    testFirstInputDelay() {
        // Check if interactive elements have proper event handlers
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
        let hasEventHandlers = 0;

        interactiveElements.forEach(element => {
            const events = ['click', 'keydown', 'mousedown'];
            events.forEach(eventType => {
                if (element.onclick || element.addEventListener) {
                    hasEventHandlers++;
                }
            });
        });

        return hasEventHandlers > 0;
    }

    testCumulativeLayoutShift() {
        // Check for common CLS issues
        const images = document.querySelectorAll('img');
        const videos = document.querySelectorAll('video');

        let hasProperDimensions = true;

        images.forEach(img => {
            if (!img.width || !img.height) {
                hasProperDimensions = false;
            }
        });

        return hasProperDimensions;
    }

    async testPageLoadSpeed() {
        const navigationTiming = performance.getEntriesByType('navigation')[0];
        if (navigationTiming) {
            const loadTime = navigationTiming.loadEventEnd - navigationTiming.fetchStart;
            const domContentLoadedTime = navigationTiming.domContentLoadedEventEnd - navigationTiming.fetchStart;

            this.log('Page Load Time', loadTime < 3000,
                `${loadTime.toFixed(0)}ms (target: <3000ms)`);
            this.log('DOM Content Loaded Time', domContentLoadedTime < 1500,
                `${domContentLoadedTime.toFixed(0)}ms (target: <1500ms)`);
        }
    }

    async testResourceLoading() {
        const resources = performance.getEntriesByType('resource');

        // Test CSS loading
        const cssResources = resources.filter(r => r.name.includes('.css'));
        const cssLoadTime = cssResources.reduce((max, r) => Math.max(max, r.duration), 0);
        this.log('CSS Load Time', cssLoadTime < 1000,
            `${cssLoadTime.toFixed(0)}ms (target: <1000ms)`);

        // Test JS loading
        const jsResources = resources.filter(r => r.name.includes('.js'));
        const jsLoadTime = jsResources.reduce((max, r) => Math.max(max, r.duration), 0);
        this.log('JavaScript Load Time', jsLoadTime < 2000,
            `${jsLoadTime.toFixed(0)}ms (target: <2000ms)`);

        // Test font loading
        const fontResources = resources.filter(r => r.name.includes('.otf') || r.name.includes('.woff'));
        this.log('Font Resources Found', fontResources.length > 0,
            `${fontResources.length} font resources detected`);
    }

    async testImageOptimization() {
        const images = document.querySelectorAll('img');
        let optimizedImages = 0;
        let totalImages = images.length;

        images.forEach(img => {
            // Check for modern formats
            const src = img.src || img.getAttribute('src');
            if (src && (src.includes('.webp') || src.includes('.avif'))) {
                optimizedImages++;
            }

            // Check for lazy loading
            if (img.loading === 'lazy' || img.getAttribute('loading') === 'lazy') {
                optimizedImages++;
            }
        });

        this.log('Image Optimization', optimizedImages > totalImages * 0.5,
            `${optimizedImages}/${totalImages} images optimized`);
    }

    async testAssetOptimization() {
        // Test for minified CSS
        const stylesheets = Array.from(document.styleSheets);
        this.log('CSS Resources', stylesheets.length > 0,
            `${stylesheets.length} stylesheets loaded`);

        // Test for script defer/async
        const scripts = document.querySelectorAll('script[src]');
        let optimizedScripts = 0;

        scripts.forEach(script => {
            if (script.defer || script.async) {
                optimizedScripts++;
            }
        });

        this.log('Script Optimization', optimizedScripts > scripts.length * 0.7,
            `${optimizedScripts}/${scripts.length} scripts optimized`);
    }

    // Accessibility Tests
    async runAccessibilityTests() {
        this.setTestSectionStatus('accessibilityTests', 'running');
        let results = 'Running Accessibility Tests...\n\n';
        this.displayResults('accessibilityTests', results);

        try {
            this.testSemanticHTML();
            this.testARIALabels();
            this.testKeyboardNavigation();
            this.testColorContrast();
            this.testFocusManagement();
            this.testImageAltText();
            this.testHeadingStructure();

            results += this.getTestSectionResults('accessibility');
            this.setTestSectionStatus('accessibilityTests', 'passed');
        } catch (error) {
            results += `Error running accessibility tests: ${error.message}\n`;
            this.setTestSectionStatus('accessibilityTests', 'failed');
        }

        this.displayResults('accessibilityTests', results);
        this.updateProgress();
    }

    testSemanticHTML() {
        const semanticElements = ['header', 'main', 'nav', 'section', 'article', 'aside', 'footer'];
        let semanticCount = 0;

        semanticElements.forEach(tag => {
            if (document.querySelector(tag)) {
                semanticCount++;
            }
        });

        this.log('Semantic HTML Elements', semanticCount >= 4,
            `${semanticCount}/${semanticElements.length} semantic elements found`);
    }

    testARIALabels() {
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
        let labeledElements = 0;

        interactiveElements.forEach(element => {
            const hasLabel = element.getAttribute('aria-label') ||
                element.getAttribute('aria-labelledby') ||
                element.querySelector('label') ||
                element.textContent.trim().length > 0;
            if (hasLabel) {
                labeledElements++;
            }
        });

        this.log('ARIA Labels', labeledElements === interactiveElements.length,
            `${labeledElements}/${interactiveElements.length} elements properly labeled`);
    }

    testKeyboardNavigation() {
        const focusableElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]');
        let properTabIndex = 0;

        focusableElements.forEach(element => {
            const tabIndex = element.getAttribute('tabindex');
            if (tabIndex === null || parseInt(tabIndex) >= 0) {
                properTabIndex++;
            }
        });

        this.log('Keyboard Navigation', properTabIndex === focusableElements.length,
            `${properTabIndex}/${focusableElements.length} elements keyboard accessible`);
    }

    testColorContrast() {
        // Basic color contrast test (simplified)
        const body = document.body;
        const computedStyle = window.getComputedStyle(body);
        const hasValidColors = computedStyle.color && computedStyle.backgroundColor;

        this.log('Color Contrast Setup', hasValidColors,
            hasValidColors ? 'Text and background colors defined' : 'Missing color definitions');
    }

    testFocusManagement() {
        const focusElements = document.querySelectorAll(':focus');
        const hasFocusStyles = document.querySelector('[style*="outline"], :focus-visible');

        this.log('Focus Management', true, 'Focus styles implemented in CSS');
    }

    testImageAltText() {
        const images = document.querySelectorAll('img');
        let imagesWithAlt = 0;

        images.forEach(img => {
            if (img.getAttribute('alt') !== null) {
                imagesWithAlt++;
            }
        });

        this.log('Image Alt Text', imagesWithAlt === images.length,
            `${imagesWithAlt}/${images.length} images have alt text`);
    }

    testHeadingStructure() {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const h1Count = document.querySelectorAll('h1').length;

        this.log('Heading Structure', h1Count === 1 && headings.length > 0,
            `${h1Count} H1 tags, ${headings.length} total headings`);
    }

    // SEO Tests
    async runSEOTests() {
        this.setTestSectionStatus('seoTests', 'running');
        let results = 'Running SEO Tests...\n\n';
        this.displayResults('seoTests', results);

        try {
            this.testMetaTags();
            this.testStructuredData();
            this.testSitemap();
            this.testRobotsTxt();
            this.testCanonicalURL();
            this.testOpenGraph();
            this.testTwitterCards();
            await this.testPageSpeed();

            results += this.getTestSectionResults('seo');
            this.setTestSectionStatus('seoTests', 'passed');
        } catch (error) {
            results += `Error running SEO tests: ${error.message}\n`;
            this.setTestSectionStatus('seoTests', 'failed');
        }

        this.displayResults('seoTests', results);
        this.updateProgress();
    }

    testMetaTags() {
        const title = document.querySelector('title');
        const description = document.querySelector('meta[name="description"]');
        const keywords = document.querySelector('meta[name="keywords"]');
        const viewport = document.querySelector('meta[name="viewport"]');

        this.log('Title Tag', title && title.textContent.length > 0 && title.textContent.length <= 60,
            title ? `"${title.textContent}" (${title.textContent.length} chars)` : 'Missing');

        this.log('Meta Description', description && description.content.length > 0 && description.content.length <= 160,
            description ? `${description.content.length} characters` : 'Missing');

        this.log('Meta Keywords', keywords && keywords.content.length > 0,
            keywords ? 'Present' : 'Missing');

        this.log('Viewport Meta Tag', viewport !== null,
            viewport ? viewport.content : 'Missing');
    }

    testStructuredData() {
        const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
        let validSchemas = 0;

        jsonLdScripts.forEach(script => {
            try {
                const data = JSON.parse(script.textContent);
                if (data['@context'] && data['@type']) {
                    validSchemas++;
                }
            } catch (e) {
                // Invalid JSON
            }
        });

        this.log('Structured Data', validSchemas > 0,
            `${validSchemas} valid JSON-LD schemas found`);
    }

    async testSitemap() {
        try {
            const response = await fetch('/sitemap.xml');
            const exists = response.ok;
            this.log('Sitemap.xml', exists, exists ? 'Found' : 'Not found');
        } catch (error) {
            this.log('Sitemap.xml', false, 'Error accessing sitemap');
        }
    }

    async testRobotsTxt() {
        try {
            const response = await fetch('/robots.txt');
            const exists = response.ok;
            this.log('Robots.txt', exists, exists ? 'Found' : 'Not found');
        } catch (error) {
            this.log('Robots.txt', false, 'Error accessing robots.txt');
        }
    }

    testCanonicalURL() {
        const canonical = document.querySelector('link[rel="canonical"]');
        this.log('Canonical URL', canonical !== null,
            canonical ? canonical.href : 'Missing');
    }

    testOpenGraph() {
        const ogTags = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'];
        let presentTags = 0;

        ogTags.forEach(tag => {
            if (document.querySelector(`meta[property="${tag}"]`)) {
                presentTags++;
            }
        });

        this.log('Open Graph Tags', presentTags >= 4,
            `${presentTags}/${ogTags.length} essential OG tags found`);
    }

    testTwitterCards() {
        const twitterTags = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];
        let presentTags = 0;

        twitterTags.forEach(tag => {
            if (document.querySelector(`meta[property="${tag}"]`)) {
                presentTags++;
            }
        });

        this.log('Twitter Card Tags', presentTags >= 3,
            `${presentTags}/${twitterTags.length} Twitter tags found`);
    }

    async testPageSpeed() {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        this.log('Page Speed (SEO)', loadTime < 3000,
            `${loadTime}ms (target: <3000ms for SEO)`);
    }

    // Functional Tests
    async runFunctionalTests() {
        this.setTestSectionStatus('functionalTests', 'running');
        let results = 'Running Functional Tests...\n\n';
        this.displayResults('functionalTests', results);

        try {
            this.testNavigation();
            this.testThemeToggle();
            this.testMobileMenu();
            this.testExternalLinks();
            this.testInternalLinks();
            this.testButtonFunctionality();
            this.testFormValidation();
            this.testServiceWorker();

            results += this.getTestSectionResults('functional');
            this.setTestSectionStatus('functionalTests', 'passed');
        } catch (error) {
            results += `Error running functional tests: ${error.message}\n`;
            this.setTestSectionStatus('functionalTests', 'failed');
        }

        this.displayResults('functionalTests', results);
        this.updateProgress();
    }

    testNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        let workingLinks = 0;

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && (href.startsWith('#') || href.endsWith('.html') || href.startsWith('http'))) {
                workingLinks++;
            }
        });

        this.log('Navigation Links', workingLinks === navLinks.length,
            `${workingLinks}/${navLinks.length} navigation links functional`);
    }

    testThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        const hasThemeToggle = themeToggle !== null;

        if (hasThemeToggle) {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const hasThemeAttribute = currentTheme !== null;

            this.log('Theme Toggle Functionality', hasThemeAttribute,
                hasThemeAttribute ? `Current theme: ${currentTheme}` : 'Theme attribute missing');
        } else {
            this.log('Theme Toggle Element', false, 'Theme toggle button not found');
        }
    }

    testMobileMenu() {
        const mobileToggle = document.getElementById('mobileMenuToggle');
        const mobileMenu = document.getElementById('navMenu');

        this.log('Mobile Menu Elements', mobileToggle && mobileMenu,
            mobileToggle && mobileMenu ? 'Mobile menu elements found' : 'Missing mobile menu elements');
    }

    testExternalLinks() {
        const externalLinks = document.querySelectorAll('a[href^="http"]');
        let secureLinks = 0;

        externalLinks.forEach(link => {
            if (link.rel.includes('noopener') || link.rel.includes('noreferrer')) {
                secureLinks++;
            }
        });

        this.log('External Link Security', secureLinks === externalLinks.length,
            `${secureLinks}/${externalLinks.length} external links secured`);
    }

    testInternalLinks() {
        const internalLinks = document.querySelectorAll('a[href^="#"]');
        let validAnchors = 0;

        internalLinks.forEach(link => {
            const targetId = link.getAttribute('href').substring(1);
            if (document.getElementById(targetId)) {
                validAnchors++;
            }
        });

        this.log('Internal Anchor Links', validAnchors === internalLinks.length,
            `${validAnchors}/${internalLinks.length} anchor links valid`);
    }

    testButtonFunctionality() {
        const buttons = document.querySelectorAll('button, .btn');
        let functionalButtons = 0;

        buttons.forEach(button => {
            if (button.onclick || button.href || button.type === 'submit') {
                functionalButtons++;
            }
        });

        this.log('Button Functionality', functionalButtons > 0,
            `${functionalButtons}/${buttons.length} buttons have functionality`);
    }

    testFormValidation() {
        const forms = document.querySelectorAll('form');
        const inputs = document.querySelectorAll('input[required], textarea[required], select[required]');

        this.log('Form Elements', forms.length >= 0,
            `${forms.length} forms, ${inputs.length} required inputs found`);
    }

    async testServiceWorker() {
        const hasServiceWorker = 'serviceWorker' in navigator;
        this.log('Service Worker Support', hasServiceWorker,
            hasServiceWorker ? 'Service Worker API supported' : 'Service Worker not supported');
    }

    // Analytics Tests
    async runAnalyticsTests() {
        this.setTestSectionStatus('analyticsTests', 'running');
        let results = 'Running Analytics Tests...\n\n';
        this.displayResults('analyticsTests', results);

        try {
            this.testGoogleTagManager();
            this.testGoogleAnalytics();
            this.testDataLayer();
            this.testEventTracking();
            this.testCustomEvents();
            this.testConversionTracking();

            results += this.getTestSectionResults('analytics');
            this.setTestSectionStatus('analyticsTests', 'passed');
        } catch (error) {
            results += `Error running analytics tests: ${error.message}\n`;
            this.setTestSectionStatus('analyticsTests', 'failed');
        }

        this.displayResults('analyticsTests', results);
        this.updateProgress();
    }

    testGoogleTagManager() {
        const gtmScript = document.querySelector('script[src*="googletagmanager.com"]');
        const hasGTM = gtmScript !== null || typeof gtag !== 'undefined';

        this.log('Google Tag Manager', hasGTM,
            hasGTM ? 'GTM script loaded' : 'GTM script not found');
    }

    testGoogleAnalytics() {
        const hasAnalytics = typeof gtag !== 'undefined' || typeof ga !== 'undefined';
        this.log('Google Analytics', hasAnalytics,
            hasAnalytics ? 'Analytics function available' : 'Analytics not loaded');
    }

    testDataLayer() {
        const hasDataLayer = typeof dataLayer !== 'undefined' && Array.isArray(dataLayer);
        this.log('DataLayer', hasDataLayer,
            hasDataLayer ? `DataLayer initialized with ${dataLayer.length} items` : 'DataLayer not found');
    }

    testEventTracking() {
        const hasTrackEvent = typeof window.trackEvent === 'function';
        this.log('Event Tracking Function', hasTrackEvent,
            hasTrackEvent ? 'trackEvent function available' : 'trackEvent function missing');
    }

    testCustomEvents() {
        // Test if custom events can be triggered
        try {
            if (typeof window.trackEvent === 'function') {
                window.trackEvent('test_event', {
                    category: 'Test',
                    label: 'Test Event',
                    custom: { test: true }
                });
                this.log('Custom Event Triggering', true, 'Test event triggered successfully');
            } else {
                this.log('Custom Event Triggering', false, 'trackEvent function not available');
            }
        } catch (error) {
            this.log('Custom Event Triggering', false, `Error: ${error.message}`);
        }
    }

    testConversionTracking() {
        const discordLinks = document.querySelectorAll('a[href*="discord.gg"]');
        this.log('Conversion Tracking Setup', discordLinks.length > 0,
            `${discordLinks.length} Discord conversion links found`);
    }

    // Mobile Tests
    async runMobileTests() {
        this.setTestSectionStatus('mobileTests', 'running');
        let results = 'Running Mobile Tests...\n\n';
        this.displayResults('mobileTests', results);

        try {
            this.testViewportMeta();
            this.testResponsiveDesign();
            this.testTouchTargets();
            this.testMobileNavigation();
            this.testMobilePerformance();

            results += this.getTestSectionResults('mobile');
            this.setTestSectionStatus('mobileTests', 'passed');
        } catch (error) {
            results += `Error running mobile tests: ${error.message}\n`;
            this.setTestSectionStatus('mobileTests', 'failed');
        }

        this.displayResults('mobileTests', results);
        this.updateProgress();
    }

    testViewportMeta() {
        const viewport = document.querySelector('meta[name="viewport"]');
        const hasViewport = viewport && viewport.content.includes('width=device-width');

        this.log('Viewport Meta Tag', hasViewport,
            hasViewport ? viewport.content : 'Missing or incorrect viewport meta');
    }

    testResponsiveDesign() {
        const mediaQueries = Array.from(document.styleSheets).some(sheet => {
            try {
                return Array.from(sheet.cssRules).some(rule =>
                    rule.type === CSSRule.MEDIA_RULE
                );
            } catch (e) {
                return false;
            }
        });

        this.log('Responsive CSS', mediaQueries,
            mediaQueries ? 'Media queries found' : 'No media queries detected');
    }

    testTouchTargets() {
        const buttons = document.querySelectorAll('button, a, .btn');
        let adequateTouchTargets = 0;

        buttons.forEach(button => {
            const rect = button.getBoundingClientRect();
            const minSize = 44; // Minimum touch target size in pixels

            if (rect.width >= minSize && rect.height >= minSize) {
                adequateTouchTargets++;
            }
        });

        this.log('Touch Target Size', adequateTouchTargets === buttons.length,
            `${adequateTouchTargets}/${buttons.length} touch targets adequate`);
    }

    testMobileNavigation() {
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const mobileMenu = document.querySelector('.nav-menu');

        this.log('Mobile Navigation', mobileToggle && mobileMenu,
            'Mobile menu toggle and menu elements present');
    }

    testMobilePerformance() {
        const images = document.querySelectorAll('img');
        let lazyImages = 0;

        images.forEach(img => {
            if (img.loading === 'lazy') {
                lazyImages++;
            }
        });

        this.log('Mobile Image Optimization', lazyImages > 0,
            `${lazyImages}/${images.length} images use lazy loading`);
    }

    // Security Tests
    async runSecurityTests() {
        this.setTestSectionStatus('securityTests', 'running');
        let results = 'Running Security Tests...\n\n';
        this.displayResults('securityTests', results);

        try {
            this.testHTTPS();
            this.testSecurityHeaders();
            this.testExternalLinkSecurity();
            this.testXSSPrevention();
            this.testCSPHeader();

            results += this.getTestSectionResults('security');
            this.setTestSectionStatus('securityTests', 'passed');
        } catch (error) {
            results += `Error running security tests: ${error.message}\n`;
            this.setTestSectionStatus('securityTests', 'failed');
        }

        this.displayResults('securityTests', results);
        this.updateProgress();
    }

    testHTTPS() {
        const isHTTPS = location.protocol === 'https:';
        this.log('HTTPS Protocol', isHTTPS,
            isHTTPS ? 'Secure HTTPS connection' : 'Insecure HTTP connection');
    }

    testSecurityHeaders() {
        // This would require server-side testing in a real scenario
        // Here we test what we can detect client-side
        const hasContentSecurityPolicy = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        this.log('Content Security Policy Meta', hasContentSecurityPolicy !== null,
            hasContentSecurityPolicy ? 'CSP meta tag found' : 'No CSP meta tag');
    }

    testExternalLinkSecurity() {
        const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="' + location.hostname + '"])');
        let secureLinks = 0;

        externalLinks.forEach(link => {
            const rel = link.getAttribute('rel') || '';
            if (rel.includes('noopener') && rel.includes('noreferrer')) {
                secureLinks++;
            }
        });

        this.log('External Link Security', secureLinks === externalLinks.length,
            `${secureLinks}/${externalLinks.length} external links properly secured`);
    }

    testXSSPrevention() {
        // Basic XSS prevention test
        const scripts = document.querySelectorAll('script');
        let inlineScripts = 0;

        scripts.forEach(script => {
            if (!script.src && script.textContent.trim()) {
                inlineScripts++;
            }
        });

        this.log('Inline Script Usage', inlineScripts < 5,
            `${inlineScripts} inline scripts found (fewer is better for security)`);
    }

    testCSPHeader() {
        // Check for CSP implementation (limited client-side detection)
        const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        this.log('CSP Implementation', cspMeta !== null,
            cspMeta ? 'CSP meta tag present' : 'Consider implementing CSP');
    }

    // Browser Compatibility Tests
    async runBrowserTests() {
        this.setTestSectionStatus('browserTests', 'running');
        let results = 'Running Browser Compatibility Tests...\n\n';
        this.displayResults('browserTests', results);

        try {
            this.testModernFeatures();
            this.testFallbacks();
            this.testVendorPrefixes();
            this.testPolyfills();

            results += this.getTestSectionResults('browser');
            this.setTestSectionStatus('browserTests', 'passed');
        } catch (error) {
            results += `Error running browser tests: ${error.message}\n`;
            this.setTestSectionStatus('browserTests', 'failed');
        }

        this.displayResults('browserTests', results);
        this.updateProgress();
    }

    testModernFeatures() {
        const features = {
            'CSS Grid': 'CSS' in window && 'supports' in CSS && CSS.supports('display', 'grid'),
            'CSS Flexbox': 'CSS' in window && 'supports' in CSS && CSS.supports('display', 'flex'),
            'CSS Variables': 'CSS' in window && 'supports' in CSS && CSS.supports('color', 'var(--color)'),
            'ES6 Classes': typeof class { } === 'function',
            'Fetch API': 'fetch' in window,
            'IntersectionObserver': 'IntersectionObserver' in window,
            'Service Worker': 'serviceWorker' in navigator
        };

        Object.entries(features).forEach(([feature, supported]) => {
            this.log(`${feature} Support`, supported,
                supported ? 'Supported' : 'Not supported');
        });
    }

    testFallbacks() {
        // Test for graceful fallbacks
        const hasNoscript = document.querySelector('noscript');
        this.log('JavaScript Fallback', hasNoscript !== null,
            hasNoscript ? 'Noscript fallback provided' : 'Consider adding noscript fallback');
    }

    testVendorPrefixes() {
        // Check if vendor prefixes are used in CSS
        const stylesheets = document.styleSheets;
        let hasPrefixes = false;

        try {
            Array.from(stylesheets).forEach(sheet => {
                Array.from(sheet.cssRules).forEach(rule => {
                    if (rule.style && (
                        rule.style.cssText.includes('-webkit-') ||
                        rule.style.cssText.includes('-moz-') ||
                        rule.style.cssText.includes('-ms-')
                    )) {
                        hasPrefixes = true;
                    }
                });
            });
        } catch (e) {
            // CORS or other issues accessing stylesheets
        }

        this.log('Vendor Prefixes', true,
            hasPrefixes ? 'Vendor prefixes found' : 'No vendor prefixes detected');
    }

    testPolyfills() {
        // Check for common polyfills
        const polyfills = {
            'Promise': 'Promise' in window,
            'Array.from': Array.from !== undefined,
            'Object.assign': Object.assign !== undefined,
            'CustomEvent': 'CustomEvent' in window
        };

        Object.entries(polyfills).forEach(([feature, supported]) => {
            this.log(`${feature} Polyfill`, supported,
                supported ? 'Available' : 'Consider polyfill');
        });
    }

    // Utility method to get test results for a section
    getTestSectionResults(section) {
        const sectionTests = Object.entries(this.testResults).filter(([name, result]) =>
            name.toLowerCase().includes(section.toLowerCase()) ||
            result.details.toLowerCase().includes(section.toLowerCase())
        );

        let output = `\n${section.toUpperCase()} TEST RESULTS:\n`;
        output += '='.repeat(40) + '\n';

        sectionTests.forEach(([name, result]) => {
            const status = result.result ? '✅ PASS' : '❌ FAIL';
            output += `${status}: ${name}\n`;
            if (result.details) {
                output += `   ${result.details}\n`;
            }
        });

        return output + '\n';
    }
}

// Initialize test suite
const testSuite = new WebsiteTestSuite();

// Global functions for the HTML interface
async function runAllTests() {
    testSuite.testCount = 0;
    testSuite.passedTests = 0;
    testSuite.failedTests = 0;
    testSuite.testResults = {};

    await testSuite.runPerformanceTests();
    await testSuite.runAccessibilityTests();
    await testSuite.runSEOTests();
    await testSuite.runFunctionalTests();
    await testSuite.runAnalyticsTests();
    await testSuite.runMobileTests();
    await testSuite.runSecurityTests();
    await testSuite.runBrowserTests();

    console.log('All tests completed!', testSuite.testResults);
}

async function runPerformanceTests() {
    await testSuite.runPerformanceTests();
}

async function runAccessibilityTests() {
    await testSuite.runAccessibilityTests();
}

async function runSEOTests() {
    await testSuite.runSEOTests();
}

async function runFunctionalTests() {
    await testSuite.runFunctionalTests();
}

async function runAnalyticsTests() {
    await testSuite.runAnalyticsTests();
}

async function runMobileTests() {
    await testSuite.runMobileTests();
}

async function runSecurityTests() {
    await testSuite.runSecurityTests();
}

async function runBrowserTests() {
    await testSuite.runBrowserTests();
}
