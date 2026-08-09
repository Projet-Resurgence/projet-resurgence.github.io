/**
 * Administrator editing layer for the editorial pages.
 *
 * Only ever *renders* on `isAdmin()` — the real gate is `@require_admin` on
 * every `/api/admin/content/*` route and the `admin.content.manage` scope
 * PR_API re-checks behind it. Hiding the buttons is a convenience, never a
 * security boundary (resurgence-web/CLAUDE.md, rule 13).
 *
 * Shape of the layer, which is deliberate:
 *
 *   · « Mode édition » turns the page itself into the editor — every title,
 *     description and body becomes editable where it is read. There is no
 *     second step, no dialog between wanting to fix a word and fixing it;
 *   · nothing is written as you type. Edits and reorderings accumulate in a
 *     local draft (localStorage, so a closed tab loses nothing) and are
 *     published in one go, or thrown away in one go;
 *   · « Publier » first shows the diff of every change, GitHub-style, because
 *     a body field can hold a whole chapter and publishing blind is how a
 *     paragraph disappears without anyone noticing;
 *   · reordering is drag-and-drop in the navigation column, where the whole
 *     list is visible at once — and it is staged like everything else.
 *
 * Adding and deleting stay immediate: they create or destroy an id, which a
 * draft of field values has no way to represent. Creation asks for a title
 * only; the rest is typed into the page afterwards.
 *
 * The rendered page carries HTML, not the markdown source, so entering edit
 * mode reads the source back from `/api/content/<space>` rather than trying to
 * un-render what is on screen.
 */

import { ready, isAdmin, apiFetch } from '../components/auth.js?v=1.0.0';
import * as store from './content-draft.js?v=1.0.0';

const CONTENT = window.PR_CONTENT || {};
const bar = document.getElementById('doc-admin-bar');
const EDIT_KEY = 'pr_admin_edit_mode';

let draft = store.emptyDraft(CONTENT.space);
let published = [];                 // categories, as PR_API has them
let publishedCategory = new Map();
let publishedSection = new Map();
let leaving = false;                // a reload we asked for, not a closed tab

const api = {
  createCategory: (body) => apiFetch(`/api/admin/content/${CONTENT.space}/categories`, {
    method: 'POST', body: JSON.stringify(body),
  }),
  updateCategory: (id, body) => apiFetch(`/api/admin/content/categories/${id}`, {
    method: 'PUT', body: JSON.stringify(body),
  }),
  deleteCategory: (id) => apiFetch(`/api/admin/content/categories/${id}`, { method: 'DELETE' }),
  reorderCategories: (order) => apiFetch(`/api/admin/content/${CONTENT.space}/categories/reorder`, {
    method: 'POST', body: JSON.stringify({ order }),
  }),
  createSection: (categoryId, body) => apiFetch(`/api/admin/content/categories/${categoryId}/sections`, {
    method: 'POST', body: JSON.stringify(body),
  }),
  updateSection: (id, body) => apiFetch(`/api/admin/content/sections/${id}`, {
    method: 'PUT', body: JSON.stringify(body),
  }),
  deleteSection: (id) => apiFetch(`/api/admin/content/sections/${id}`, { method: 'DELETE' }),
  reorderSections: (categoryId, order) => apiFetch(`/api/admin/content/categories/${categoryId}/sections/reorder`, {
    method: 'POST', body: JSON.stringify({ order }),
  }),
};

function toast(message, kind = 'info') {
  const el = document.createElement('div');
  el.className = `v-toast is-${kind}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

const FLASH_KEY = 'pr_admin_flash';

/**
 * A toast that survives the reload we trigger ourselves. Publishing ends in
 * `window.location.reload()`, so a plain toast() there is destroyed before
 * anyone reads it — the page came back with no sign anything happened.
 */
function flash(message, kind = 'info') {
  try { sessionStorage.setItem(FLASH_KEY, JSON.stringify({ message, kind })); }
  catch (e) { toast(message, kind); }
}

function showFlash() {
  let raw = null;
  try {
    raw = sessionStorage.getItem(FLASH_KEY);
    sessionStorage.removeItem(FLASH_KEY);
  } catch (e) { return; }
  if (!raw) return;
  try {
    const { message, kind } = JSON.parse(raw);
    if (message) toast(message, kind || 'info');
  } catch (e) { /* corrupt entry, nothing to show */ }
}

/** Every write funnels through here so failures are reported the same way. */
async function submit(promise, successMessage) {
  try {
    const result = await promise;
    if (!result || result.success === false) {
      toast(result?.error || result?.message || 'Enregistrement refusé.', 'error');
      return null;
    }
    if (successMessage) toast(successMessage, 'ok');
    return result;
  } catch (e) {
    toast(`Réseau indisponible : ${e.message}`, 'error');
    return null;
  }
}

async function loadPublished() {
  const result = await apiFetch(`/api/content/${CONTENT.space}`);
  published = (result && result.data && result.data.categories) || [];
  publishedCategory = new Map(published.map((c) => [String(c.id), c]));
  publishedSection = new Map();
  published.forEach((category) => {
    (category.sections || []).forEach((section) => publishedSection.set(String(section.id), section));
  });
}

function publishedValue(kind, id, field) {
  const source = kind === 'category' ? publishedCategory.get(String(id)) : publishedSection.get(String(id));
  return (source && source[field]) || '';
}

function draftValue(kind, id, field) {
  const bucket = kind === 'category' ? draft.categories : draft.sections;
  const entry = bucket[String(id)];
  return entry && field in entry ? entry[field] : null;
}

// ── Draft plumbing ────────────────────────────────────────────────────────

let saveTimer = null;

function touch(kind, id, field, value, element) {
  store.setField(draft, kind, id, field, value, publishedValue(kind, id, field));
  if (element) element.classList.toggle('is-changed', draftValue(kind, id, field) !== null);
  scheduleSave();
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persist, 400);
}

function persist() {
  if (!store.save(draft)) toast('Brouillon non sauvegardé : stockage local indisponible.', 'error');
  renderDirtyState();
}

function renderDirtyState() {
  const count = store.countChanges(draft);
  document.body.classList.toggle('v-admin-dirty', count > 0);
  const label = document.getElementById('doc-admin-count');
  if (label) {
    label.textContent = count
      ? `${count} modification${count > 1 ? 's' : ''} non publiée${count > 1 ? 's' : ''}`
      : 'Aucune modification en attente';
  }
}

// A draft survives a closed tab, but an administrator who closes one by
// accident should still be told the page is not what visitors see.
window.addEventListener('beforeunload', (e) => {
  if (leaving || !store.isDirty(draft) || !editMode()) return;
  e.preventDefault();
  e.returnValue = '';
});

/** Reloads this layer asks for are never the "you have unsaved work" case. */
function reload() {
  leaving = true;
  window.location.reload();
}

// ── Edit mode ─────────────────────────────────────────────────────────────

function editMode() {
  try { return localStorage.getItem(EDIT_KEY) === '1'; } catch (e) { return false; }
}

/**
 * Switching modes no longer reloads.
 *
 * It used to, for one reason: leaving edit mode has to put the *published* HTML
 * back on screen and only the server renders that. So we keep the server's
 * render — a clone of every editable region is taken before the first editor is
 * mounted, and switching off restores it. Entering never needed a round trip at
 * all; the published source is already in memory from `loadPublished()`.
 *
 * The cost of the old behaviour was a full page load, a scroll to the top and a
 * flash of unstyled content on every flick of the switch, for a state change
 * that touches nothing outside `.v-doc__main`.
 */
let pristine = null;                // [{ host, clone }] — the server's render

/** The regions edit mode rewrites. /univers writes into its hero too. */
function editableRegions() {
  return [
    ...document.querySelectorAll('.v-doc__main, .v-univers__main'),
    ...document.querySelectorAll('.v-chronicle__copy[data-category-id]'),
  ];
}

function snapshotRegions() {
  if (pristine) return;
  pristine = editableRegions().map((host) => ({ host, clone: host.cloneNode(true) }));
}

function restoreRegions() {
  if (!pristine) { reload(); return; }
  pristine.forEach(({ host, clone }) => {
    // Cloned again on every restore so the snapshot survives a second switch.
    host.replaceChildren(...clone.cloneNode(true).childNodes);
  });
  // Rows and controls edit mode added outside those regions (the completed
  // chronicle rail) have no published counterpart to restore to.
  document.querySelectorAll('[data-edit-only]').forEach((node) => node.remove());
  const heading = document.getElementById('doc-catnav-title');
  if (heading && railHeading !== null) heading.firstChild.nodeValue = railHeading;
}

function enterEditMode() {
  snapshotRegions();
  mountInlineEditors();
  const catnav = document.getElementById('doc-catnav');
  if (catnav && catnav.classList.contains('v-chroniclist')) completeChronicleRail(catnav);
  if (catnav) decorateNav(catnav);
}

/**
 * Keep the reader where they were across the swap.
 *
 * A textarea holding a chapter's markdown is not the height of that chapter
 * rendered, so every section above the viewport changes height at once and a
 * preserved `scrollY` lands on a different part of the document — switching the
 * mode moved you several chapters away. Anchoring to an element instead of to a
 * pixel offset is immune to that: whatever happens above it, the section you
 * were reading stays under the same point of the screen.
 */
function anchorScroll() {
  const marks = [...document.querySelectorAll('.v-section[data-section-id], .v-chapter[data-category-id]')];
  if (!marks.length) return () => {};
  // The one nearest the reading line, from either side.
  const mark = marks.reduce((best, el) => {
    const d = Math.abs(el.getBoundingClientRect().top - 120);
    return best && best.d <= d ? best : { el, d };
  }, null);
  const key = mark.el.dataset.sectionId
    ? `.v-section[data-section-id="${mark.el.dataset.sectionId}"]`
    : `.v-chapter[data-category-id="${mark.el.dataset.categoryId}"]`;
  const wasAt = mark.el.getBoundingClientRect().top;

  return () => {
    const again = document.querySelector(key);
    if (!again) return;
    window.scrollTo({ top: Math.max(0, window.scrollY + again.getBoundingClientRect().top - wasAt) });
  };
}

function setEditMode(on) {
  persist();
  try { localStorage.setItem(EDIT_KEY, on ? '1' : '0'); } catch (e) { /* private mode */ }
  const restoreScroll = anchorScroll();
  document.body.classList.toggle('v-admin-edit', on);
  if (on) enterEditMode();
  else restoreRegions();
  // Two frames: the textareas size themselves in the first one (`grow()`), so
  // measuring before that would anchor to a height that is about to change.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    restoreScroll();
    // The navigation tracks live nodes; the ones it highlighted are gone.
    window.dispatchEvent(new Event('resize'));
  }));
}

// ── Inline fields ─────────────────────────────────────────────────────────

function plainPaste(e) {
  // A paste from Word or from the page itself would otherwise carry markup
  // into a field whose value is read as text.
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text/plain');
  document.execCommand('insertText', false, text);
}

/** Single-line, plain-text field edited in place (titles, labels, icon). */
function textField(el, kind, id, field, { placeholder = '' } = {}) {
  const staged = draftValue(kind, id, field);
  if (staged !== null) el.textContent = staged;

  el.classList.add('v-edit-text');
  el.classList.toggle('is-changed', staged !== null);
  el.dataset.placeholder = placeholder;
  el.contentEditable = 'plaintext-only';
  if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true'; // Firefox
  el.spellcheck = true;

  el.addEventListener('paste', plainPaste);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
  });
  el.addEventListener('input', () => touch(kind, id, field, el.innerText.trim(), el));
  el.addEventListener('click', (e) => e.preventDefault()); // titles are anchors
}

/**
 * Markdown field: the rendered HTML is swapped for its source, in the full
 * rp-text-block editor — Discord formatting, image upload into the volume,
 * video and link cards, exactly as the old dialog had.
 */
function markdownField(el, kind, id, field, { placeholder = '' } = {}) {
  const staged = draftValue(kind, id, field);
  const source = staged !== null ? staged : publishedValue(kind, id, field);

  const wrap = document.createElement('div');
  wrap.className = 'v-edit-md';
  wrap.classList.toggle('is-changed', staged !== null);

  const area = document.createElement('textarea');
  area.id = `admin-md-${kind}-${id}-${field}`;
  area.value = source;
  area.placeholder = placeholder;
  area.rows = Math.max(3, source.split('\n').length + 1);
  wrap.appendChild(area);

  el.replaceWith(wrap);

  const grow = () => { area.style.height = 'auto'; area.style.height = `${area.scrollHeight + 4}px`; };
  area.addEventListener('input', () => {
    touch(kind, id, field, area.value, wrap);
    grow();
  });
  requestAnimationFrame(grow);

  if (window.RPTextBlock) {
    new window.RPTextBlock.UniversalEditor({
      id: area,
      autoSave: false,
      showToolbar: true,
      toolbarButtons: ['bold', 'italic', 'underline', 'heading', 'list', 'code', 'quote', 'image', 'video', 'embed'],
      media: {
        uploadUrl: '/api/admin/content/media',
        libraryUrl: '/api/content/media',
        mediaBaseUrl: '/uploads/',
        headers: authHeaders(),
        onError: (message) => toast(message, 'error'),
      },
    });
  }
  return wrap;
}

function authHeaders() {
  try {
    const token = localStorage.getItem('pr_web_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (e) {
    return {};
  }
}

/**
 * An optional field the page does not render when it is empty (a description,
 * an « En bref », an encadré) still has to be *reachable*, or it could only
 * ever be filled once and never added.
 */
function placeholderNode(host, className, tag = 'p') {
  const node = document.createElement(tag);
  node.className = className;
  host.appendChild(node);
  return node;
}

function mountInlineEditors() {
  // /univers writes its featured chronicle's title and lede into the hero,
  // outside any `.v-chapter` — they are still that category's columns.
  document.querySelectorAll('.v-chronicle__copy[data-category-id]').forEach((hero) => {
    hero.querySelectorAll('[data-field]').forEach((el) => bindCategoryField(el, hero.dataset.categoryId));
  });

  document.querySelectorAll('.v-chapter[data-category-id]').forEach((chapter) => {
    const id = chapter.dataset.categoryId;

    // Tout `[data-field]` du chapitre qui n'appartient pas à une de ses
    // sections. Un sélecteur de profondeur (`:scope > * > [data-field]`)
    // attrapait aussi le corps des sections et les écrivait dans les colonnes
    // du chapitre — le texte d'une section partait alors dans `category.body`,
    // qui n'existe pas.
    chapter.querySelectorAll('[data-field]').forEach((el) => {
      if (!el.closest('.v-section')) bindCategoryField(el, id);
    });

    if (!chapter.querySelector(':scope > .v-chapter__desc')) {
      const node = document.createElement('p');
      node.className = 'v-chapter__desc';
      node.dataset.field = 'description';
      (chapter.querySelector(':scope > .v-chapter__title') || chapter.firstElementChild)?.after(node);
      bindCategoryField(node, id);
    }

    if (!chapter.querySelector(':scope > .v-callout')) {
      const callout = document.createElement('div');
      callout.className = 'v-callout is-empty-slot';
      callout.innerHTML = '<span class="v-callout__label">En bref</span>';
      const body = placeholderNode(callout, 'v-callout__body pr-content', 'div');
      body.dataset.field = 'summary';
      (chapter.querySelector(':scope > .v-chapter__desc') || chapter.firstElementChild)?.after(callout);
      bindCategoryField(body, id);
    }

    chapter.querySelectorAll('.v-section[data-section-id]').forEach((article) => {
      const sectionId = article.dataset.sectionId;
      article.querySelectorAll('[data-field]').forEach((el) => bindSectionField(el, sectionId));

      if (!article.querySelector('.v-callout')) {
        const callout = document.createElement('div');
        callout.className = 'v-callout is-empty-slot';
        callout.style.marginTop = '6px';
        const label = document.createElement('span');
        label.className = 'v-callout__label';
        label.dataset.field = 'callout_label';
        callout.appendChild(label);
        const body = placeholderNode(callout, 'v-callout__body pr-content', 'div');
        body.dataset.field = 'callout_body';
        article.appendChild(callout);
        bindSectionField(label, sectionId);
        bindSectionField(body, sectionId);
      }

      article.prepend(rowTools([
        button('Supprimer la section', 'Supprimer cette section', () => removeSection(sectionId), 'is-danger'),
      ], 'is-section'));
    });

    chapter.querySelector(':scope > .v-chapter__meta')?.after(rowTools([
      button('+ Section', 'Ajouter une section à ce chapitre', () => newSection(chapter), 'is-primary'),
      button('Supprimer le chapitre', 'Supprimer ce chapitre et ses sections', () => removeCategory(id), 'is-danger'),
    ]));
  });
}

const MARKDOWN_FIELDS = new Set(['summary', 'body', 'callout_body']);

function bindCategoryField(el, id) {
  bind(el, 'category', id);
}

function bindSectionField(el, id) {
  bind(el, 'section', id);
}

function bind(el, kind, id) {
  const field = el.dataset.field;
  if (!field || el.dataset.bound) return;
  el.dataset.bound = '1';
  const hint = PLACEHOLDERS[field] || '';
  if (MARKDOWN_FIELDS.has(field)) markdownField(el, kind, id, field, { placeholder: hint });
  else textField(el, kind, id, field, { placeholder: hint });
}

const PLACEHOLDERS = {
  title: 'Titre',
  description: 'Une phrase sous le titre du chapitre',
  icon: '📜',
  summary: '« En bref » — laissez vide pour ne pas afficher le bandeau',
  body: 'Mise en forme Discord. Glissez une image pour la téléverser.',
  callout_label: 'Libellé de l\'encadré',
  callout_body: 'Encadré — laissez vide pour ne pas l\'afficher',
};

function rowTools(buttons, extra = '') {
  const tools = document.createElement('div');
  tools.className = `v-admin-tools ${extra}`.trim();
  buttons.forEach((b) => tools.appendChild(b));
  return tools;
}

// ── Immediate actions: create, delete ─────────────────────────────────────

function titlePrompt(title, submitLabel, onSubmit) {
  const node = document.createElement('div');
  node.className = 'v-admin-backdrop';
  node.innerHTML = `
    <form class="v-admin-modal is-small" novalidate>
      <div class="v-admin-modal__head">
        <span>${title}</span>
        <button type="button" class="v-admin-close" aria-label="Fermer">&times;</button>
      </div>
      <div class="v-admin-modal__body">
        <label class="v-admin-field"><span>Titre</span><input type="text" required></label>
        <small style="color:var(--v-ink-faint)">Le reste s'écrit directement dans la page.</small>
      </div>
      <div class="v-admin-modal__foot">
        <span class="v-admin-spacer"></span>
        <button type="button" class="v-admin-cancel">Annuler</button>
        <button type="submit" class="v-admin-submit">${submitLabel}</button>
      </div>
    </form>`;
  const close = () => node.remove();
  node.querySelector('.v-admin-close').addEventListener('click', close);
  node.querySelector('.v-admin-cancel').addEventListener('click', close);
  node.addEventListener('click', (e) => { if (e.target === node) close(); });
  node.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = node.querySelector('input').value.trim();
    if (!value) return;
    const button = node.querySelector('.v-admin-submit');
    button.disabled = true;
    if (await onSubmit(value)) reload();
    else button.disabled = false;
  });
  document.body.appendChild(node);
  node.querySelector('input').focus();
}

function newCategory() {
  titlePrompt('Nouveau chapitre', 'Créer', (title) =>
    submit(api.createCategory({ title }), 'Chapitre créé.'));
}

function newSection(chapter) {
  titlePrompt('Nouvelle section', 'Créer', (title) =>
    submit(api.createSection(chapter.dataset.categoryId, { title, body: '' }), 'Section créée.'));
}

async function removeCategory(id) {
  const title = publishedCategory.get(String(id))?.title || 'ce chapitre';
  if (!window.confirm(`Supprimer « ${title} » et toutes ses sections ? Cette action est définitive.`)) return;
  if (await submit(api.deleteCategory(id), 'Chapitre supprimé.')) dropAndReload('category', id);
}

async function removeSection(id) {
  const title = publishedSection.get(String(id))?.title || 'cette section';
  if (!window.confirm(`Supprimer « ${title} » ? Cette action est définitive.`)) return;
  if (await submit(api.deleteSection(id), 'Section supprimée.')) dropAndReload('section', id);
}

/** A deleted id must leave the draft too, or publishing would 404 on it. */
function dropAndReload(kind, id) {
  if (kind === 'category') {
    delete draft.categories[String(id)];
    delete draft.sectionOrder[String(id)];
    draft.categoryOrder = null;
  } else {
    delete draft.sections[String(id)];
    Object.keys(draft.sectionOrder).forEach((categoryId) => {
      draft.sectionOrder[categoryId] = draft.sectionOrder[categoryId].filter((x) => String(x) !== String(id));
    });
  }
  persist();
  reload();
}

// ── Reordering ────────────────────────────────────────────────────────────

function stageCategoryOrder(nav) {
  const shown = [...nav.querySelectorAll('[data-category-id]')].map((a) => Number(a.dataset.categoryId));
  const all = published.map((c) => c.id);
  const hidden = all.filter((id) => !shown.includes(id));
  store.setOrder(draft, [...hidden, ...shown], all);
  persist();
}

function stageSectionOrder(nav) {
  const categoryId = nav.dataset.categoryId;
  if (!categoryId) return;
  const order = [...nav.querySelectorAll('[data-section-id]')].map((a) => Number(a.dataset.sectionId));
  if (!order.length) return;
  const before = (publishedCategory.get(String(categoryId))?.sections || []).map((s) => s.id);
  store.setSectionOrder(draft, categoryId, order, before);
  persist();
}

/**
 * Drag-and-drop over the links of a navigation column.
 *
 * Reordering happens where the reader navigates, not down in the article: the
 * whole list is visible at once there, so moving item 9 above item 2 is one
 * gesture instead of seven clicks on an arrow. Like every other edit it is
 * staged, not written.
 *
 * Only the grip starts a drag — the link itself must stay clickable, and a
 * browser's default link-drag would otherwise fire on every attempt to follow
 * an anchor.
 */
function makeSortable(nav, onDrop) {
  let dragged = null;

  nav.addEventListener('dragstart', (e) => {
    dragged = e.target.closest('a');
    if (!dragged) return;
    dragged.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
    // Firefox ignores a drag whose payload was never set.
    e.dataTransfer.setData('text/plain', dragged.dataset.categoryId || dragged.dataset.sectionId || '');
  });

  nav.addEventListener('dragover', (e) => {
    if (!dragged) return;
    e.preventDefault();
    const over = e.target.closest('a');
    if (!over || over === dragged) return;
    const box = over.getBoundingClientRect();
    const after = e.clientY > box.top + box.height / 2;
    over.parentNode.insertBefore(dragged, after ? over.nextSibling : over);
  });

  nav.addEventListener('drop', (e) => e.preventDefault());

  nav.addEventListener('dragend', () => {
    if (!dragged) return;
    dragged.classList.remove('is-dragging');
    dragged = null;
    onDrop(nav);
  });
}

/** Grip on the left of the name; it is what makes the row draggable. */
function decorateNav(nav) {
  nav.querySelectorAll('a:not([data-grip])').forEach((link) => {
    link.dataset.grip = '1';
    link.draggable = false;
    const grip = document.createElement('span');
    grip.className = 'v-grip';
    grip.textContent = '⠿';
    grip.title = 'Glisser pour réordonner';
    grip.setAttribute('aria-hidden', 'true');
    // draggable is armed on the grip and disarmed after the gesture, so a
    // plain click anywhere on the row still follows the anchor.
    grip.addEventListener('mousedown', () => { link.draggable = true; });
    link.addEventListener('dragend', () => { link.draggable = false; });
    grip.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); });
    link.prepend(grip);
  });
}

/**
 * /univers keeps its first chronicle in the hero and lists only the others, so
 * the rail cannot express « this one is no longer first ». In edit mode every
 * chronicle gets a row, in page order, and the heading says so.
 */
function completeChronicleRail(nav) {
  const listed = new Set([...nav.querySelectorAll('[data-category-id]')].map((a) => a.dataset.categoryId));
  const chapters = [...document.querySelectorAll('.v-chapter[data-category-id]')];
  chapters.forEach((chapter, index) => {
    const id = chapter.dataset.categoryId;
    if (listed.has(id)) return;
    const link = document.createElement('a');
    link.href = `#${chapter.dataset.categorySlug}`;
    link.dataset.category = chapter.dataset.categorySlug;
    link.dataset.categoryId = id;
    link.dataset.editOnly = '1';   // removed again when edit mode is switched off
    link.innerHTML = `<span class="v-chroniclist__tag">${index + 1}</span>`
      + `<span class="v-chroniclist__title"></span>`;
    link.querySelector('.v-chroniclist__title').textContent =
      chapter.querySelector('.v-chapter__title')?.textContent?.trim()
      || document.querySelector('.v-chronicle__copy .v-h1')?.textContent?.trim()
      || 'Chronique';
    nav.insertBefore(link, nav.children[index] || null);
  });
  const heading = document.getElementById('doc-catnav-title');
  if (heading) {
    if (railHeading === null) railHeading = heading.firstChild.nodeValue;
    heading.firstChild.nodeValue = 'Chroniques';
  }
}

let railHeading = null;             // « Autres chroniques », before edit mode

// ── Review and publish ────────────────────────────────────────────────────

function diffNode(lines) {
  const pre = document.createElement('div');
  pre.className = 'v-diff';
  lines.forEach((line) => {
    const row = document.createElement('div');
    if (line.type === '…') {
      row.className = 'v-diff__gap';
      row.textContent = `⋯ ${line.count} ligne${line.count > 1 ? 's' : ''} inchangée${line.count > 1 ? 's' : ''}`;
    } else {
      row.className = `v-diff__line is-${{ '+': 'add', '-': 'del', ' ': 'same' }[line.type]}`;
      row.textContent = `${line.type} ${line.text}`;
    }
    pre.appendChild(row);
  });
  return pre;
}

async function review() {
  await loadPublished();

  // PR_API refuses an empty title, and it is right to: the navigation would
  // show a blank row nobody can click back onto. Caught here rather than
  // halfway through publishing.
  const blank = [...Object.values(draft.categories), ...Object.values(draft.sections)]
    .some((fields) => 'title' in fields && !fields.title.trim());
  if (blank) { toast('Un titre est vide. Complétez-le avant de publier.', 'error'); return; }

  const entries = store.summarize(draft, published);
  if (!entries.length) { toast('Aucune modification à publier.'); return; }

  const node = document.createElement('div');
  node.className = 'v-admin-backdrop';
  node.innerHTML = `
    <div class="v-admin-modal is-wide">
      <div class="v-admin-modal__head">
        <span>Publier ${entries.length} modification${entries.length > 1 ? 's' : ''}</span>
        <button type="button" class="v-admin-close" aria-label="Fermer">&times;</button>
      </div>
      <div class="v-admin-modal__body v-review"></div>
      <div class="v-admin-modal__foot">
        <span class="v-admin-spacer"></span>
        <button type="button" class="v-admin-cancel">Continuer à écrire</button>
        <button type="button" class="v-admin-submit">Publier</button>
      </div>
    </div>`;

  const body = node.querySelector('.v-review');
  entries.forEach((entry) => {
    const block = document.createElement('section');
    block.className = 'v-review__entry';
    const head = document.createElement('h4');
    head.textContent = entry.label;
    block.appendChild(head);

    (entry.fields || []).forEach((field) => {
      const label = document.createElement('span');
      label.className = 'v-review__field';
      label.textContent = field.label;
      block.append(label, diffNode(field.lines));
    });

    (entry.moves || []).forEach((move) => {
      const row = document.createElement('div');
      row.className = 'v-review__move';
      row.textContent = `${move.name} : rang ${move.from + 1} → ${move.to + 1}`;
      block.appendChild(row);
    });

    body.appendChild(block);
  });

  const close = () => node.remove();
  node.querySelector('.v-admin-close').addEventListener('click', close);
  node.querySelector('.v-admin-cancel').addEventListener('click', close);
  node.addEventListener('click', (e) => { if (e.target === node) close(); });
  node.querySelector('.v-admin-submit').addEventListener('click', async (e) => {
    e.target.disabled = true;
    e.target.textContent = 'Publication…';
    await publish(e.target, close);
  });

  document.body.appendChild(node);
}

/**
 * Publishing walks the plan and stops at the first refusal, keeping whatever
 * is left in the draft: an administrator who loses the connection halfway
 * finds the rest of their work still there rather than a page in two states
 * and nothing to retry with.
 */
async function publish(button, close) {
  const count = store.countChanges(draft);
  for (const call of store.plan(draft)) {
    let result = null;
    // Anything thrown here — a missing client method, a JSON body that will not
    // serialise — used to reject silently and leave « Publication… » spinning
    // for ever. A failed call is a failed call: report it and hand the button
    // back so the administrator can retry.
    try {
      if (call.kind === 'category') result = await submit(api.updateCategory(call.id, call.body), null);
      else if (call.kind === 'section') result = await submit(api.updateSection(call.id, call.body), null);
      else if (call.kind === 'categoryOrder') result = await submit(api.reorderCategories(call.order), null);
      else if (call.kind === 'sectionOrder') result = await submit(api.reorderSections(call.categoryId, call.order), null);
    } catch (e) {
      toast(`Publication interrompue : ${e.message}`, 'error');
      result = null;
    }

    if (!result) {
      button.disabled = false;
      button.textContent = 'Réessayer';
      persist();
      return;
    }

    if (call.kind === 'category') delete draft.categories[String(call.id)];
    else if (call.kind === 'section') delete draft.sections[String(call.id)];
    else if (call.kind === 'categoryOrder') draft.categoryOrder = null;
    else if (call.kind === 'sectionOrder') delete draft.sectionOrder[String(call.categoryId)];
    persist();
  }

  store.clear(CONTENT.space);
  draft = store.emptyDraft(CONTENT.space);
  close();
  flash(`${count} modification${count > 1 ? 's' : ''} publiée${count > 1 ? 's' : ''}.`, 'ok');
  reload();
}

function discard() {
  const count = store.countChanges(draft);
  if (!count) return;
  if (!window.confirm(`Annuler ${count} modification${count > 1 ? 's' : ''} non publiée${count > 1 ? 's' : ''} ? Le texte revient à la version en ligne.`)) return;
  store.clear(CONTENT.space);
  draft = store.emptyDraft(CONTENT.space);
  reload();
}

// ── Rendering the controls ────────────────────────────────────────────────

function button(label, title, onClick, className = '') {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = `v-admin-btn ${className}`.trim();
  el.textContent = label;
  el.title = title;
  el.addEventListener('click', onClick);
  return el;
}

/** The small ghost « + » that sits at the right of a column heading. */
function addButton(title, onClick) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'v-aside__add';
  el.textContent = '+';
  el.title = title;
  el.setAttribute('aria-label', title);
  el.addEventListener('click', onClick);
  return el;
}

/** The chapter the reader is currently in — what « Sur cette page » lists. */
function activeChapter() {
  const slug = document.querySelector('#doc-catnav a.is-active')?.dataset.category;
  return document.querySelector(slug ? `.v-chapter[data-category-slug="${slug}"]` : '.v-chapter');
}

/**
 * The bar lives at the top of the navigation column, not above the text.
 *
 * Two reasons: the aside is already sticky, so the switch stays reachable
 * however far down the chapter one is reading; and « Publier »/« Annuler »
 * only mean anything in edit mode — shown while reading, they invite a click
 * that can only ever say « aucune modification ».
 */
function buildBar(editing) {
  if (!bar) return;
  bar.hidden = false;
  bar.className = 'v-admin-bar';

  const label = document.createElement('span');
  label.className = 'v-admin-bar__label';
  label.textContent = CONTENT.title || 'Contenu';

  const toggle = document.createElement('label');
  toggle.className = 'v-admin-toggle';
  toggle.innerHTML = '<input type="checkbox"><span>Mode édition</span>';
  const input = toggle.querySelector('input');
  input.checked = editing;
  input.addEventListener('change', () => setEditMode(input.checked));

  const count = document.createElement('span');
  count.className = 'v-admin-bar__count';
  count.id = 'doc-admin-count';

  const actions = document.createElement('div');
  actions.className = 'v-admin-bar__actions';
  actions.append(
    button('Annuler', 'Jeter les modifications non publiées', discard, 'is-discard'),
    button('Publier…', 'Relire les modifications puis publier', review, 'is-primary'),
  );

  bar.append(label, toggle, count, actions);

  // Out of `.v-doc__main` and into the navigation column — which also takes it
  // out of the region edit mode restores, so switching off cannot destroy it.
  const aside = document.querySelector('.v-doc__aside, .v-univers__side');
  if (aside) aside.prepend(bar);
}

function mountControls() {
  document.body.classList.add('v-admin-on');
  const editing = editMode();
  document.body.classList.toggle('v-admin-edit', editing);
  draft = store.load(CONTENT.space);

  buildBar(editing);
  renderDirtyState();

  const catnav = document.getElementById('doc-catnav');
  const catnavTitle = document.getElementById('doc-catnav-title');
  const toc = document.getElementById('doc-toc');
  const tocTitle = document.getElementById('doc-toc-title');

  if (catnavTitle) catnavTitle.append(addButton('Ajouter un chapitre', newCategory));
  if (tocTitle) {
    tocTitle.append(addButton('Ajouter une section à ce chapitre', () => {
      const chapter = activeChapter();
      if (chapter) newSection(chapter);
    }));
  }

  loadPublished().then(() => {
    // Taken before any editor is mounted, and after buildBar() has moved the
    // bar out: this clone is what « Mode édition » off restores, in place of
    // the full page reload it used to do.
    snapshotRegions();
    if (editing) enterEditMode();

    if (catnav) {
      decorateNav(catnav);
      makeSortable(catnav, stageCategoryOrder);
    }

    if (toc) {
      // "Sur cette page" is rebuilt by content-doc.js every time the reader
      // enters another chapter, which wipes the grips with it.
      const refresh = () => {
        const chapter = activeChapter();
        toc.dataset.categoryId = chapter?.dataset.categoryId || '';
        toc.querySelectorAll('a').forEach((link) => {
          const id = link.dataset.section;
          const article = id && document.getElementById(id);
          if (article) link.dataset.sectionId = article.dataset.sectionId;
        });
        decorateNav(toc);
      };
      new MutationObserver(refresh).observe(toc, { childList: true });
      refresh();
      makeSortable(toc, stageSectionOrder);
    }
  });
}

ready().then(() => {
  if (!isAdmin()) return;
  mountControls();
  showFlash();
});
