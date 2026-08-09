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

/**
 * The DOM is read live rather than captured once: edit mode replaces every
 * chapter node when it is switched off, and a cached NodeList would leave the
 * navigation tracking elements that are no longer on the page.
 */
const allChapters = () => [...document.querySelectorAll('.v-chapter')];
const visibleChapters = () => allChapters().filter((c) => !c.hidden);

/** Where "the chapter you are reading" is measured, in px from the top. */
const READING_LINE = 120;

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

function setActiveChapter(chapter, { force = false } = {}) {
  if (!chapter) return;
  if (chapter === setActiveChapter.current && !force) return;
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

/**
 * The last element whose top has crossed the reading line — "what I am reading",
 * not "what happens to be on screen".
 *
 * An intersection band cannot answer that question at the end of the document.
 * The page stops scrolling once the last chapter's bottom reaches the viewport
 * floor, so clicking the second-to-last chapter leaves *both* it and the last
 * one inside the band, and the band picked the wrong one: selecting a short or
 * empty chapter jumped the highlight to the following one. Comparing tops has
 * no such blind spot — but it still cannot scroll further than the document
 * allows, which is why a click also locks the answer (`hold`) and why the last
 * chapter carries a scroll runway in vitrine.css.
 */
function elementAtReadingLine(elements) {
  let current = elements[0] || null;
  for (const el of elements) {
    if (el.getBoundingClientRect().top - READING_LINE <= 0) current = el;
    else break;
  }
  return current;
}

// A click on the navigation states the answer; the scroll it triggers must not
// be allowed to contradict it while it is still under way.
let heldUntil = 0;
const holdSpy = (ms = 900) => { heldUntil = Date.now() + ms; };

function syncNav() {
  if (Date.now() < heldUntil) return;
  const chapters = visibleChapters();
  if (!chapters.length) return;
  const chapter = elementAtReadingLine(chapters);
  setActiveChapter(chapter);
  const sections = [...(chapter?.querySelectorAll('.v-section') || [])].filter((s) => !s.hidden);
  if (sections.length) setActiveSection(elementAtReadingLine(sections)?.id);
}

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { ticking = false; syncNav(); });
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll, { passive: true });
if ('onscrollend' in window) window.addEventListener('scrollend', () => { heldUntil = 0; syncNav(); });

/** Smooth jump that honours the sticky header, without the native hash jump. */
function goTo(el) {
  const top = el.getBoundingClientRect().top + window.scrollY - READING_LINE + 24;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

function navigate(e, nav, resolve) {
  const link = e.target.closest('a[href^="#"]');
  if (!link || !nav.contains(link)) return;
  const target = document.getElementById(decodeURIComponent(link.getAttribute('href').slice(1)));
  if (!target) return;
  e.preventDefault();
  holdSpy();
  resolve(target, link);
  history.replaceState(null, '', link.getAttribute('href'));
  goTo(target);
}

catnav?.addEventListener('click', (e) => navigate(e, catnav, (target) => {
  setActiveChapter(target, { force: true });
  const first = target.querySelector('.v-section');
  if (first) setActiveSection(first.id);
}));

toc?.addEventListener('click', (e) => navigate(e, toc, (target) => setActiveSection(target.id)));

// Deep links (/regles#roleplay-credibilite) land before the spy has run.
if (visibleChapters().length) {
  const deep = window.location.hash && document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
  syncNav();
  if (deep) { holdSpy(1200); requestAnimationFrame(() => goTo(deep)); }
}

export { syncNav };

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
  const chapters = allChapters();

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
  syncNav();
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
