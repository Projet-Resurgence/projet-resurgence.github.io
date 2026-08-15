// Fetches live game stats from PR_API and fills in any [data-stat] element.
// Progressive enhancement: on network/API failure the static fallback number
// already written in the HTML (used as the count-up animation's target by
// styles/main.js ResurgenceWebsite.animateStats) is left untouched.
(function () {
    // Origin comes from /env.js (window.PR_ENV), so a local stack hits its own
    // API instead of production. The literal is the production fallback for the
    // case where /env.js failed to load.
    var API_BASE = (window.PR_ENV && window.PR_ENV.apiUrl) || 'https://api.projet-resurgence.fr';
    var STATS_ENDPOINT = API_BASE + '/statistics/public-overview';

    var STAT_KEYS = {
        countries: 'countries',
        players: 'players',
        technologies: 'technologies',
        structures: 'structures',
        factories: 'factories',
        unit_types: 'unit_types',
        regions: 'regions',
        bot_commands: 'bot_commands'
    };

    function applyStats(data) {
        var elements = document.querySelectorAll('[data-stat]');
        elements.forEach(function (el) {
            var key = STAT_KEYS[el.dataset.stat];
            var value = key ? data[key] : undefined;
            if (typeof value !== 'number') return;
            el.dataset.statValue = value;
            el.textContent = value + '+';
        });
    }

    function loadStats() {
        if (document.querySelectorAll('[data-stat]').length === 0) return;

        fetch(STATS_ENDPOINT, { mode: 'cors' })
            .then(function (res) {
                return res.ok ? res.json() : Promise.reject(res.status);
            })
            .then(function (json) {
                if (json && json.success && json.data) {
                    applyStats(json.data);
                }
            })
            .catch(function () {
                // Offline or API hiccup — static fallback values stay as-is.
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadStats);
    } else {
        loadStats();
    }
})();
