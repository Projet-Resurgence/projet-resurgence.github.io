/**
 * Local draft store for the editorial pages.
 *
 * Editing is *staged*, never written as you type: an administrator rewrites a
 * chapter, moves three sections, changes their mind about one paragraph, and
 * only then publishes. Nothing reaches PR_API until « Publier » — so a
 * half-finished rewrite is never what visitors read.
 *
 * The draft lives in localStorage under one key per space, which is what makes
 * it survive a closed tab, a crash or a reboot. It is deliberately *not* stored
 * server-side: a draft is one administrator's work in progress on one machine,
 * and syncing it would mean a second source of truth for the published text.
 *
 * Pure module — no DOM, no network. That is what makes it testable.
 */

const VERSION = 1;

export const CATEGORY_FIELDS = ['title', 'description', 'icon', 'summary'];
export const SECTION_FIELDS = ['title', 'body', 'callout_label', 'callout_body'];

const LABELS = {
  title: 'Titre',
  description: 'Description',
  icon: 'Icône',
  summary: '« En bref »',
  body: 'Contenu',
  callout_label: 'Libellé de l\'encadré',
  callout_body: 'Encadré',
};

export const key = (space) => `pr_content_draft:${space}`;

export function emptyDraft(space) {
  return {
    version: VERSION,
    space,
    updatedAt: null,
    categories: {},      // id -> {field: value}
    sections: {},        // id -> {field: value}
    categoryOrder: null, // [id] once the rail has been reordered
    sectionOrder: {},    // categoryId -> [id]
  };
}

export function load(space, storage = localStorage) {
  try {
    const raw = storage.getItem(key(space));
    if (!raw) return emptyDraft(space);
    const parsed = JSON.parse(raw);
    // A draft written by an older shape is discarded rather than half-read:
    // publishing a misread draft would corrupt the live text.
    if (!parsed || parsed.version !== VERSION || parsed.space !== space) return emptyDraft(space);
    return { ...emptyDraft(space), ...parsed };
  } catch (e) {
    return emptyDraft(space);
  }
}

export function save(draft, storage = localStorage) {
  try {
    storage.setItem(key(draft.space), JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }));
    return true;
  } catch (e) {
    return false; // private mode, or quota — the caller warns
  }
}

export function clear(space, storage = localStorage) {
  try { storage.removeItem(key(space)); } catch (e) { /* private mode */ }
}

/** Record a field edit, dropping it again when it goes back to the published value. */
export function setField(draft, kind, id, field, value, published) {
  const bucket = kind === 'category' ? draft.categories : draft.sections;
  const entry = bucket[id] || {};
  if (same(value, published)) delete entry[field];
  else entry[field] = value;
  if (Object.keys(entry).length) bucket[id] = entry;
  else delete bucket[id];
  return draft;
}

function same(a, b) {
  return normalise(a) === normalise(b);
}

/** Trailing whitespace and CRLF are noise the editor introduces, not an edit. */
function normalise(value) {
  return String(value ?? '').replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trim();
}

export function setOrder(draft, ids, published) {
  draft.categoryOrder = sameOrder(ids, published) ? null : ids;
  return draft;
}

export function setSectionOrder(draft, categoryId, ids, published) {
  if (sameOrder(ids, published)) delete draft.sectionOrder[categoryId];
  else draft.sectionOrder[categoryId] = ids;
  return draft;
}

function sameOrder(a, b) {
  return Array.isArray(b) && a.length === b.length && a.every((id, i) => Number(id) === Number(b[i]));
}

export function countChanges(draft) {
  return Object.values(draft.categories).reduce((n, f) => n + Object.keys(f).length, 0)
    + Object.values(draft.sections).reduce((n, f) => n + Object.keys(f).length, 0)
    + (draft.categoryOrder ? 1 : 0)
    + Object.keys(draft.sectionOrder).length;
}

export function isDirty(draft) {
  return countChanges(draft) > 0;
}

// ── Diff ────────────────────────────────────────────────────────────────────

/**
 * Line diff, GitHub-flavoured: an administrator confirms what *changed*, not
 * what the field now contains. A field can hold a whole chapter, so publishing
 * blind is how a paragraph gets deleted without anyone noticing.
 *
 * Longest-common-subsequence over lines. Fields are a few KB at most, so the
 * quadratic table is cheaper than pulling in a diff library.
 */
export function diffLines(before, after) {
  const a = String(before ?? '').replace(/\r\n/g, '\n').split('\n');
  const b = String(after ?? '').replace(/\r\n/g, '\n').split('\n');

  const lcs = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const out = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { out.push({ type: ' ', text: a[i] }); i += 1; j += 1; }
    else if (lcs[i + 1][j] >= lcs[i][j + 1]) { out.push({ type: '-', text: a[i] }); i += 1; }
    else { out.push({ type: '+', text: b[j] }); j += 1; }
  }
  while (i < a.length) { out.push({ type: '-', text: a[i] }); i += 1; }
  while (j < b.length) { out.push({ type: '+', text: b[j] }); j += 1; }
  return out;
}

/**
 * Collapse untouched runs, keeping `context` lines around each change — the
 * point of the review is the change, not a re-read of the whole chapter.
 * A gap is marked `{type:'…', count}`.
 */
export function collapse(lines, context = 2) {
  const keep = new Array(lines.length).fill(false);
  lines.forEach((line, index) => {
    if (line.type === ' ') return;
    for (let k = Math.max(0, index - context); k <= Math.min(lines.length - 1, index + context); k += 1) {
      keep[k] = true;
    }
  });

  const out = [];
  let skipped = 0;
  keep.forEach((wanted, index) => {
    if (wanted) {
      if (skipped) { out.push({ type: '…', count: skipped }); skipped = 0; }
      out.push(lines[index]);
    } else {
      skipped += 1;
    }
  });
  if (skipped) out.push({ type: '…', count: skipped });
  return out;
}

// ── Review summary ──────────────────────────────────────────────────────────

const byId = (list) => new Map((list || []).map((item) => [String(item.id), item]));

/**
 * Turn a draft plus the published tree into what the confirmation dialog shows:
 * one entry per touched category/section, each with its changed fields diffed,
 * plus the reordering expressed as « was at rank n, now rank m ».
 */
export function summarize(draft, categories) {
  const cats = byId(categories);
  const sections = new Map();
  (categories || []).forEach((category) => {
    (category.sections || []).forEach((section) => sections.set(String(section.id), { section, category }));
  });

  const entries = [];

  Object.entries(draft.categories).forEach(([id, fields]) => {
    const published = cats.get(String(id)) || {};
    entries.push({
      kind: 'category',
      id: Number(id),
      label: `Chapitre — ${published.title || `#${id}`}`,
      fields: fieldDiffs(fields, published),
    });
  });

  Object.entries(draft.sections).forEach(([id, fields]) => {
    const found = sections.get(String(id));
    const published = found ? found.section : {};
    entries.push({
      kind: 'section',
      id: Number(id),
      label: `Section — ${published.title || `#${id}`}${found ? ` (${found.category.title})` : ''}`,
      fields: fieldDiffs(fields, published),
    });
  });

  if (draft.categoryOrder) {
    entries.push({
      kind: 'order',
      label: 'Ordre des chapitres',
      moves: moves(draft.categoryOrder, (categories || []).map((c) => c.id), (id) => cats.get(String(id))?.title || `#${id}`),
    });
  }

  Object.entries(draft.sectionOrder).forEach(([categoryId, order]) => {
    const category = cats.get(String(categoryId));
    const before = (category?.sections || []).map((s) => s.id);
    entries.push({
      kind: 'order',
      label: `Ordre des sections — ${category?.title || `#${categoryId}`}`,
      moves: moves(order, before, (id) => sections.get(String(id))?.section.title || `#${id}`),
    });
  });

  return entries;
}

function fieldDiffs(fields, published) {
  return Object.entries(fields).map(([field, value]) => ({
    field,
    label: LABELS[field] || field,
    lines: collapse(diffLines(published[field] || '', value)),
  }));
}

function moves(after, before, name) {
  return after
    .map((id, index) => ({ id, name: name(id), from: before.indexOf(id), to: index }))
    .filter((move) => move.from !== move.to && move.from !== -1);
}

/**
 * The write plan: every API call publishing this draft, in an order that never
 * leaves the page half-published — fields first, then the ordering, so a failed
 * reorder does not lose the text that went with it.
 */
export function plan(draft) {
  const calls = [];
  Object.entries(draft.categories).forEach(([id, fields]) => {
    calls.push({ kind: 'category', id: Number(id), body: fields });
  });
  Object.entries(draft.sections).forEach(([id, fields]) => {
    calls.push({ kind: 'section', id: Number(id), body: fields });
  });
  if (draft.categoryOrder) calls.push({ kind: 'categoryOrder', order: draft.categoryOrder });
  Object.entries(draft.sectionOrder).forEach(([categoryId, order]) => {
    calls.push({ kind: 'sectionOrder', categoryId: Number(categoryId), order });
  });
  return calls;
}
