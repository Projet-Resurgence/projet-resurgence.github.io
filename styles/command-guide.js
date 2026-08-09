/* Recherche, filtres et copie pour le guide des commandes des bots.
 *
 * Le guide est rendu par le serveur (`bot_commands.py`, marqueur `!commands[]`)
 * et il est complet sans ce fichier : chaque commande est un `<details>` natif,
 * repliable, lisible et indexable JavaScript coupé. Ce script n'ajoute que du
 * confort — barre de recherche, puces de filtre, « tout déplier », copie d'un
 * exemple — et ne doit jamais devenir la condition d'affichage de quoi que ce
 * soit.
 *
 * Pas de raccourci `/` ici : `content-doc.js` l'utilise déjà pour la recherche
 * de la page. Deux champs qui se disputent la même touche, c'est un champ qui
 * vole le focus de l'autre.
 */

const guide = document.querySelector('[data-command-guide]');
if (guide) {
  const commands = Array.from(guide.querySelectorAll('.pr-command'));
  const bots = Array.from(guide.querySelectorAll('.pr-commands__bot'));
  const tools = guide.querySelector('[data-command-tools]');

  // Accents retirés côté serveur dans `data-search` : on applique la même
  // normalisation à la saisie, sinon « économie » et « economie » ne trouvent
  // pas les mêmes commandes.
  const fold = (text) =>
    text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const state = { query: '', bot: 'all' };

  // ── Barre d'outils ────────────────────────────────────────────────────────
  tools.innerHTML = '';

  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'pr-commands__search';
  search.placeholder = 'Chercher une commande…';
  search.setAttribute('aria-label', 'Chercher une commande');
  search.autocomplete = 'off';
  tools.appendChild(search);

  const filters = document.createElement('div');
  filters.className = 'pr-commands__filters';
  tools.appendChild(filters);

  const chips = [];
  const addChip = (key, label) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'pr-commands__chip';
    chip.dataset.bot = key;
    chip.textContent = label;
    chip.setAttribute('aria-pressed', String(key === 'all'));
    chip.addEventListener('click', () => {
      state.bot = key;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.bot === key)));
      apply();
    });
    filters.appendChild(chip);
    chips.push(chip);
  };

  addChip('all', 'Tous');
  bots.forEach((section) => {
    const name = section.querySelector('.pr-commands__botname');
    addChip(section.dataset.bot, name ? name.firstChild.textContent.trim() : section.dataset.bot);
  });

  const actions = document.createElement('div');
  actions.className = 'pr-commands__actions';
  const toggleAll = document.createElement('button');
  toggleAll.type = 'button';
  toggleAll.className = 'pr-commands__toggle';
  toggleAll.textContent = 'Tout déplier';
  actions.appendChild(toggleAll);

  const count = document.createElement('span');
  count.className = 'pr-commands__result';
  actions.appendChild(count);
  tools.appendChild(actions);

  toggleAll.addEventListener('click', () => {
    const open = toggleAll.dataset.open !== 'yes';
    commands.forEach((command) => {
      if (!command.hidden) command.open = open;
    });
    toggleAll.dataset.open = open ? 'yes' : 'no';
    toggleAll.textContent = open ? 'Tout replier' : 'Tout déplier';
  });

  // ── Filtrage ──────────────────────────────────────────────────────────────
  function apply() {
    const query = fold(state.query.trim());
    let shown = 0;

    commands.forEach((command) => {
      const matchesBot = state.bot === 'all' || command.dataset.bot === state.bot;
      const matchesQuery = !query || (command.dataset.search || '').includes(query);
      const visible = matchesBot && matchesQuery;
      command.hidden = !visible;
      if (visible) shown += 1;
      // Une recherche qui trouve une commande doit la montrer, pas obliger à
      // cliquer dessus pour vérifier que c'est la bonne.
      if (visible && query) command.open = true;
      if (!query) command.open = toggleAll.dataset.open === 'yes';
    });

    // Une catégorie ou un bot sans résultat visible n'a plus de raison d'occuper
    // un titre à l'écran.
    guide.querySelectorAll('.pr-commands__cat').forEach((category) => {
      category.hidden = !category.querySelector('.pr-command:not([hidden])');
    });
    bots.forEach((section) => {
      section.hidden = !section.querySelector('.pr-command:not([hidden])');
    });

    const total = commands.length;
    count.textContent =
      shown === total
        ? `${total} commande${total > 1 ? 's' : ''}`
        : `${shown} sur ${total}`;
    guide.classList.toggle('is-empty', shown === 0);
  }

  let debounce;
  search.addEventListener('input', () => {
    state.query = search.value;
    clearTimeout(debounce);
    debounce = setTimeout(apply, 80);
  });
  search.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && search.value) {
      event.stopPropagation();
      search.value = '';
      state.query = '';
      apply();
    }
  });

  // ── Copie d'un exemple ────────────────────────────────────────────────────
  guide.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-copy]');
    if (!target) return;
    try {
      await navigator.clipboard.writeText(target.dataset.copy);
      const previous = target.getAttribute('data-copied');
      target.setAttribute('data-copied', 'yes');
      clearTimeout(target._copyTimer);
      target._copyTimer = setTimeout(() => {
        if (previous === null) target.removeAttribute('data-copied');
      }, 1200);
    } catch {
      /* Presse-papiers refusé (http, permission) : le texte reste sélectionnable. */
    }
  });

  // Un lien profond `#/bal` — ou une recherche de page qui amène ici — doit
  // ouvrir la commande visée plutôt que la laisser repliée.
  const openFromHash = () => {
    const wanted = decodeURIComponent(location.hash.replace(/^#\/?/, '')).trim();
    if (!wanted) return;
    const found = commands.find(
      (command) =>
        command.querySelector('.pr-command__name')?.textContent.replace(/^\//, '') === wanted,
    );
    if (found) {
      found.open = true;
      found.scrollIntoView({ block: 'center' });
    }
  };
  window.addEventListener('hashchange', openFromHash);
  openFromHash();

  apply();
}
