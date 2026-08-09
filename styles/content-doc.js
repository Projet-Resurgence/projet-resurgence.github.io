/**
 * Documentation pages — navigation only (règlement, forum RP).
 *
 * The text itself is server-rendered, so everything here is progressive
 * enhancement: with JavaScript off the page is still complete and every
 * chapter is still reachable by its anchor.
 */

const catnav = document.getElementById('doc-catnav');
const toc = document.getElementById('doc-toc');
const search = document.getElementById('doc-search');
const chapters = [...document.querySelectorAll('.v-chapter')];

/** Rebuild "Sur cette page" for the chapter currently in view. */
function renderToc(chapter) {
  if (!toc) return;
  toc.innerHTML = '';
  if (!chapter) return;
  chapter.querySelectorAll('.v-section').forEach((section) => {
    const link = document.createElement('a');
    link.href = `#${section.id}`;
    link.textContent = section.querySelector('.v-section__title')?.textContent.trim() || section.id;
    link.dataset.section = section.id;
    toc.appendChild(link);
  });
}

function setActiveChapter(chapter) {
  if (!chapter || chapter === setActiveChapter.current) return;
  setActiveChapter.current = chapter;
  catnav?.querySelectorAll('a').forEach((a) => {
    a.classList.toggle('is-active', a.dataset.category === chapter.dataset.categorySlug);
  });
  renderToc(chapter);
}

function setActiveSection(id) {
  toc?.querySelectorAll('a').forEach((a) => {
    a.classList.toggle('is-active', a.dataset.section === id);
  });
}

if (chapters.length) {
  setActiveChapter(chapters[0]);

  // Two observers rather than one: the chapter list and the on-page summary
  // track different granularities and would fight over a shared threshold.
  const chapterObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setActiveChapter(visible.target);
    },
    { rootMargin: '-88px 0px -60% 0px', threshold: 0 },
  );
  chapters.forEach((c) => chapterObserver.observe(c));

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setActiveSection(visible.target.id);
    },
    { rootMargin: '-92px 0px -70% 0px', threshold: 0 },
  );
  document.querySelectorAll('.v-section').forEach((s) => sectionObserver.observe(s));
}

// ── Search ────────────────────────────────────────────────────────────────

function normalize(value) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

let emptyState = null;

function runSearch(query) {
  const needle = normalize(query).trim();
  let matches = 0;

  chapters.forEach((chapter) => {
    let chapterMatches = 0;
    chapter.querySelectorAll('.v-section').forEach((section) => {
      const hit = !needle || normalize(section.textContent).includes(needle);
      section.hidden = !hit;
      if (hit) chapterMatches += 1;
    });
    const chapterHit = chapterMatches > 0
      || !needle
      || normalize(chapter.querySelector('.v-chapter__title')?.textContent).includes(needle);
    chapter.hidden = !chapterHit;
    if (chapterHit) matches += 1;

    catnav?.querySelector(`a[data-category="${chapter.dataset.categorySlug}"]`)
      ?.toggleAttribute('hidden', !chapterHit);
  });

  if (!emptyState) {
    emptyState = document.createElement('p');
    emptyState.className = 'v-empty';
    emptyState.hidden = true;
    chapters[chapters.length - 1]?.after(emptyState);
  }
  emptyState.textContent = `Aucun résultat pour « ${query} ».`;
  emptyState.hidden = Boolean(matches) || !needle;
}

let searchTimer;
search?.addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  const { value } = e.target;
  searchTimer = setTimeout(() => runSearch(value), 120);
});

// `/` focuses the search box, the shortcut every documentation site has.
document.addEventListener('keydown', (e) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')
    || document.activeElement?.isContentEditable;
  if (e.key === '/' && !typing) {
    e.preventDefault();
    search?.focus();
  }
  if (e.key === 'Escape' && document.activeElement === search) {
    search.value = '';
    runSearch('');
    search.blur();
  }
});

// Spoilers reveal on click as well as hover, so they work on touch.
document.addEventListener('click', (e) => {
  const spoiler = e.target.closest('.pr-spoiler');
  if (spoiler) spoiler.classList.toggle('is-revealed');
});

export { runSearch };
