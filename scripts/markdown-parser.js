/**
 * Simple Markdown Parser for Rules Display
 * Converts markdown files to HTML for the Projet Résurgence rules system
 */
class MarkdownParser {
    constructor() {
        this.ruleCategories = {
            'hrp': {
                name: 'HRP (Hors Roleplay)',
                icon: '💬',
                description: 'Règles pour les discussions hors roleplay et la modération'
            },
            'rp': {
                name: 'Roleplay',
                icon: '🎭',
                description: 'Directives pour le roleplay, création de nations et interactions RP'
            },
            'economique': {
                name: 'Économique',
                icon: '💰',
                description: 'Mécaniques économiques, PIB, inflation et commerce'
            },
            'technologique': {
                name: 'Technologique',
                icon: '⚙️',
                description: 'Système de recherche, brevets et développement technologique'
            },
            'militaire': {
                name: 'Militaire & Conflits',
                icon: '⚔️',
                description: 'Règles concernant les guerres, batailles et opérations militaires'
            },
            'territorial': {
                name: 'Territorial',
                icon: '🗺️',
                description: 'Gestion des territoires, frontières et expansions géographiques'
            }
        };
    }

    /**
     * Load and parse a markdown file
     * @param {string} category - The rule category (hrp, rp, etc.)
     * @returns {Promise<string>} - The parsed HTML
     */
    async loadRule(category) {
        try {
            const response = await fetch(`./rules/${category}.md`);
            if (!response.ok) {
                throw new Error(`Failed to load ${category}.md: ${response.statusText}`);
            }
            const markdown = await response.text();
            return this.parseMarkdown(markdown);
        } catch (error) {
            console.error(`Error loading rule ${category}:`, error);
            return this.getErrorHTML(category, error.message);
        }
    }

    /**
     * Parse markdown to HTML
     * @param {string} markdown - The markdown content
     * @returns {string} - The parsed HTML
     */
    parseMarkdown(markdown) {
        let html = markdown
            // Headers
            .replace(/^### (.+)$/gm, '<h3 class="rule-subsection">$1</h3>')
            .replace(/^## (.+)$/gm, '<h2 class="rule-section">$1</h2>')
            .replace(/^# (.+)$/gm, '<h1 class="rule-title">$1</h1>')
            
            // Bold text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            
            // Italic text
            .replace(/\*([^*]+?)\*/g, '<em>$1</em>')
            
            // Lists
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            
            // Code blocks (inline)
            .replace(/`(.+?)`/g, '<code>$1</code>')
            
            // Links
            .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
            
            // Line breaks
            .replace(/\n\n/g, '</p><p>')
            
            // Warning/Alert boxes
            .replace(/\*\*⚠️(.+?)\*\*/g, '<div class="rule-warning"><strong>⚠️$1</strong></div>')
            
            // Example boxes
            .replace(/\*\*Exemple\s?:\*\*(.+?)$/gm, '<div class="rule-example"><strong>Exemple :</strong>$1</div>');

        // Wrap lists in ul tags
        const listPattern = /((?:<li>.*<\/li>\s*)+)/g;
        html = html.replace(listPattern, '<ul class="rule-list">$1</ul>');
        
        // Wrap content in paragraphs
        html = '<p>' + html + '</p>';
        
        // Clean up multiple paragraph tags
        html = html
            .replace(/<p><\/p>/g, '')
            .replace(/<p>(<h[1-6])/g, '$1')
            .replace(/(<\/h[1-6]>)<\/p>/g, '$1')
            .replace(/<p>(<ul|<div)/g, '$1')
            .replace(/(<\/ul>|<\/div>)<\/p>/g, '$1');

        return html;
    }

    /**
     * Get error HTML when a rule fails to load
     * @param {string} category - The rule category
     * @param {string} error - The error message
     * @returns {string} - The error HTML
     */
    getErrorHTML(category, error) {
        const categoryInfo = this.ruleCategories[category] || { name: category, icon: '❓' };
        return `
            <div class="rule-error">
                <h2 class="rule-section">Erreur de Chargement</h2>
                <p>Impossible de charger les règles <strong>${categoryInfo.name}</strong>.</p>
                <p class="error-details">Erreur: ${error}</p>
                <p>Veuillez réessayer plus tard ou contactez l'administration.</p>
            </div>
        `;
    }

    /**
     * Load all rule categories
     * @returns {Promise<Object>} - Object containing all parsed rules
     */
    async loadAllRules() {
        const rules = {};
        const loadPromises = Object.keys(this.ruleCategories).map(async (category) => {
            rules[category] = await this.loadRule(category);
        });

        await Promise.all(loadPromises);
        return rules;
    }

    /**
     * Generate navigation HTML for rule categories
     * @returns {string} - The navigation HTML
     */
    generateNavigation() {
        return Object.entries(this.ruleCategories).map(([key, info]) => `
            <div class="feature-card">
                <span class="feature-icon">${info.icon}</span>
                <h3 class="feature-title">${info.name}</h3>
                <p class="feature-description">${info.description}</p>
                <button class="btn btn-secondary" onclick="showRuleCategory('${key}')">Consulter</button>
            </div>
        `).join('');
    }

    /**
     * Generate table of contents for a rule category
     * @param {string} html - The HTML content
     * @returns {string} - The table of contents HTML
     */
    generateTableOfContents(html) {
        const headingPattern = /<h[2-3][^>]*>(.+?)<\/h[2-3]>/g;
        const headings = html.match(headingPattern) || [];
        if (headings.length === 0) return '';

        const toc = headings.map((heading, index) => {
            const levelMatch = heading.match(/<h([2-3])/);
            const level = levelMatch ? levelMatch[1] : '2';
            const text = heading.replace(/<[^>]+>/g, '');
            const id = `section-${index}`;
            return `<li class="toc-level-${level}"><a href="#${id}">${text}</a></li>`;
        }).join('');

        return `
            <div class="table-of-contents">
                <h3>Sommaire</h3>
                <ul class="toc-list">${toc}</ul>
            </div>
        `;
    }
}

// Global instance
window.markdownParser = new MarkdownParser();

/**
 * Show a specific rule category
 * @param {string} category - The rule category to show
 */
async function showRuleCategory(category) {
    const contentDiv = document.getElementById('rules-dynamic-content');
    const categoryInfo = window.markdownParser.ruleCategories[category];
    
    if (!contentDiv) {
        console.error('Rules content div not found');
        return;
    }

    // Show loading state
    contentDiv.innerHTML = `
        <div class="rule-loading">
            <h2 class="rule-section">Chargement des Règles ${categoryInfo.name}...</h2>
            <div class="loading-spinner"></div>
        </div>
    `;

    // Load and display the rule
    const ruleHTML = await window.markdownParser.loadRule(category);
    const toc = window.markdownParser.generateTableOfContents(ruleHTML);
    
    contentDiv.innerHTML = `
        <div class="rule-category" data-category="${category}">
            <div class="rule-header">
                <button class="btn btn-secondary back-to-categories" onclick="showAllCategories()">
                    ← Retour aux Catégories
                </button>
                <div class="rule-category-info">
                    <span class="category-icon">${categoryInfo.icon}</span>
                    <div class="category-details">
                        <h1 class="category-title">${categoryInfo.name}</h1>
                        <p class="category-description">${categoryInfo.description}</p>
                    </div>
                </div>
            </div>
            
            <div class="rule-content-wrapper">
                ${toc}
                <div class="rule-content">${ruleHTML}</div>
            </div>
        </div>
    `;

    // Add IDs to headings for table of contents
    const headings = contentDiv.querySelectorAll('h2, h3');
    headings.forEach((heading, index) => {
        heading.id = `section-${index}`;
    });

    // Scroll to top
    contentDiv.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Show all rule categories (main view)
 */
function showAllCategories() {
    const contentDiv = document.getElementById('rules-dynamic-content');
    if (!contentDiv) return;

    contentDiv.innerHTML = `
        <div class="rules-categories">
            <h2 class="section-title">Catégories de Règles</h2>
            <div class="features-grid">
                ${window.markdownParser.generateNavigation()}
            </div>
        </div>
    `;
}

/**
 * Initialize the rules system
 */
async function initializeRules() {
    // Show categories by default
    showAllCategories();
    
    // Preload all rules for better performance
    try {
        await window.markdownParser.loadAllRules();
        console.log('All rules preloaded successfully');
    } catch (error) {
        console.error('Error preloading rules:', error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeRules);